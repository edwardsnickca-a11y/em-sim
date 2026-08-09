import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

export const LOCAL_PLAN_MAX_BYTES = 30 * 1024 * 1024
export const LOCAL_PLAN_MAX_PAGES = 500
const TARGET_CHUNK_CHARS = 1200
const OVERLAP_CHARS = 180
const BATCH_SIZE = 24

function cleanText(value='') {
  return String(value || '')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function likelyHeading(line='') {
  const text = cleanText(line)
  if (!text || text.length > 120) return false
  if (/^(annex|appendix|attachment|chapter|section|part|esf\s*[-–—]?\s*\d+|emergency support function)\b/i.test(text)) return true
  if (/^\d+(?:\.\d+){0,4}\s+[A-Z]/.test(text)) return true
  const letters = text.replace(/[^A-Za-z]/g, '')
  if (letters.length >= 5) {
    const upper = letters.replace(/[^A-Z]/g, '').length
    if (upper / letters.length >= 0.82) return true
  }
  return false
}

function splitPageIntoChunks(pageText, pageNumber, inheritedSection='') {
  const rawLines = String(pageText || '').split(/\n+/).map(cleanText).filter(Boolean)
  if (!rawLines.length) return { chunks:[], lastSection:inheritedSection }

  let currentSection = inheritedSection
  const paragraphs = []
  let paragraph = ''

  for (const line of rawLines) {
    if (likelyHeading(line)) {
      if (paragraph) paragraphs.push({ text:paragraph, section:currentSection })
      paragraph = ''
      currentSection = line
      continue
    }
    paragraph = paragraph ? `${paragraph} ${line}` : line
    if (paragraph.length >= 700) {
      paragraphs.push({ text:paragraph, section:currentSection })
      paragraph = ''
    }
  }
  if (paragraph) paragraphs.push({ text:paragraph, section:currentSection })

  const chunks = []
  let buffer = ''
  let bufferSection = currentSection

  const flush = () => {
    const text = cleanText(buffer)
    if (!text) return
    chunks.push({ page:pageNumber, section:bufferSection || '', text })
    buffer = text.slice(Math.max(0, text.length - OVERLAP_CHARS))
  }

  for (const item of paragraphs) {
    const text = cleanText(item.text)
    if (!text) continue
    if (!buffer) bufferSection = item.section || currentSection || ''

    if (buffer && buffer.length + text.length + 1 > TARGET_CHUNK_CHARS) {
      flush()
      bufferSection = item.section || bufferSection
    }

    if (text.length > TARGET_CHUNK_CHARS * 1.35) {
      let start = 0
      while (start < text.length) {
        const part = text.slice(start, start + TARGET_CHUNK_CHARS)
        if (buffer) {
          buffer = `${buffer} ${part}`
          flush()
        } else {
          chunks.push({ page:pageNumber, section:item.section || currentSection || '', text:cleanText(part) })
        }
        start += TARGET_CHUNK_CHARS - OVERLAP_CHARS
      }
      buffer = ''
      continue
    }

    buffer = buffer ? `${buffer} ${text}` : text
  }

  if (cleanText(buffer).length > 40) {
    chunks.push({ page:pageNumber, section:bufferSection || currentSection || '', text:cleanText(buffer) })
  }

  return { chunks, lastSection:currentSection }
}

async function postPlan(payload) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30000)
  try {
    const response = await fetch('/api/local-plan', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify(payload),
      signal:controller.signal,
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data?.error || `Plan processing failed (${response.status}).`)
    return data
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error('Plan processing timed out. Try again.')
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export async function processLocalPlanPdf(file, { jurisdiction='', displayName='', onProgress }={}) {
  if (!file) throw new Error('Choose a PDF plan.')
  if (file.size > LOCAL_PLAN_MAX_BYTES) throw new Error('PDF is larger than the 30 MB plan limit.')
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') throw new Error('Upload a PDF plan for this exercise.')

  const bytes = new Uint8Array(await file.arrayBuffer())
  const signature = String.fromCharCode(...bytes.slice(0, 5))
  if (signature !== '%PDF-') throw new Error('This file does not appear to be a valid PDF.')

  onProgress?.({ phase:'processing', message:'Reading document...' })
  const pdf = await pdfjsLib.getDocument({ data:bytes }).promise
  if (pdf.numPages > LOCAL_PLAN_MAX_PAGES) throw new Error(`This plan has ${pdf.numPages} pages. The current limit is ${LOCAL_PLAN_MAX_PAGES}.`)

  const created = await postPlan({
    action:'create',
    fileName:file.name,
    displayName:displayName || file.name.replace(/\.pdf$/i, ''),
    jurisdiction,
    sizeBytes:file.size,
    mimeType:file.type || 'application/pdf',
  })

  const planId = created.planId
  const accessToken = created.accessToken
  let chunks = []
  let totalChars = 0
  let totalChunkCount = 0
  let lastSection = ''

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      onProgress?.({
        phase:'processing',
        message:`Analyzing page ${pageNumber} of ${pdf.numPages}...`,
        page:pageNumber,
        pageCount:pdf.numPages,
      })
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      const pageText = cleanText(content.items.map(item => `${item?.str || ''}${item?.hasEOL ? '\n' : ' '}`).join(''))
      totalChars += pageText.length
      const result = splitPageIntoChunks(pageText, pageNumber, lastSection)
      lastSection = result.lastSection
      chunks.push(...result.chunks)

      if (chunks.length >= BATCH_SIZE || pageNumber === pdf.numPages) {
        while (chunks.length) {
          const batch = chunks.splice(0, BATCH_SIZE)
          const appended = await postPlan({ action:'append', planId, accessToken, chunks:batch })
          totalChunkCount = appended.chunkCount || (totalChunkCount + batch.length)
        }
      }
    }

    if (totalChars < 250 || totalChunkCount === 0) {
      throw new Error('No searchable text was found in this PDF. Scanned-image plans are not supported yet.')
    }

    const finalized = await postPlan({
      action:'finalize',
      planId,
      accessToken,
      pageCount:pdf.numPages,
      extractedChars:totalChars,
    })

    return {
      planId,
      accessToken,
      pageCount:pdf.numPages,
      chunkCount:finalized.chunkCount || 0,
      extractedChars:totalChars,
      processedAt:finalized.processedAt || new Date().toISOString(),
    }
  } catch (err) {
    try { await postPlan({ action:'delete', planId, accessToken }) } catch (_) {}
    throw err
  } finally {
    try { await pdf.destroy() } catch (_) {}
  }
}

export async function deleteLocalPlan(plan) {
  if (!plan?.planId || !plan?.accessToken) return
  try {
    await postPlan({ action:'delete', planId:plan.planId, accessToken:plan.accessToken })
  } catch (_) {
    // Best-effort cleanup. Expiration handles abandoned plans.
  }
}

const PLAN_RETRIEVAL_TRIGGER = /\b(plan|eop|sop|annex|procedure|policy|authority|authorize|authorization|responsib|who owns|who can|who approves|approval|activate|activation|evacuat|contraflow|shelter|animal|pet|livestock|resource request|mutual aid|state assistance|declaration|alternate eoc|continuity|debris|public warning|protective action|notification|procurement|transport|medical support|mass care|public health)\b/i
const DIRECT_PLAN_QUESTION = /\b(plan|eop|sop|annex|procedure|policy)\b/i

export function shouldRetrieveLocalPlan(action='', plan=null) {
  if (!plan?.planId || !plan?.accessToken || plan?.status !== 'ready' || !plan?.activeForExercise) return false
  const text = String(action || '').trim()
  if (!text || text.toUpperCase() === 'ENDEX') return false
  return PLAN_RETRIEVAL_TRIGGER.test(text)
}

function compactLifelineContext(lifelines={}) {
  return Object.entries(lifelines || {})
    .filter(([,value]) => value?.status && value.status !== 'GREEN')
    .slice(0, 4)
    .map(([key,value]) => `${key}: ${value.status}${value.reason ? ` — ${value.reason}` : ''}`)
    .join('; ')
}

export async function retrieveLocalPlanContext(plan, {
  action='',
  jurisdiction='',
  scenario='',
  role='',
  situation='',
  lifelines={},
  limit=5,
}={}) {
  if (!shouldRetrieveLocalPlan(action, plan)) return { queried:false, matched:false, planName:plan?.displayName || '', matches:[] }

  const queryParts = [
    action,
    jurisdiction ? `Jurisdiction: ${jurisdiction}` : '',
    scenario ? `Scenario: ${scenario}` : '',
    role ? `Role: ${role}` : '',
    situation ? `Current situation: ${situation}` : '',
    compactLifelineContext(lifelines) ? `Impacted lifelines: ${compactLifelineContext(lifelines)}` : '',
  ].filter(Boolean)

  const directQuestion = DIRECT_PLAN_QUESTION.test(String(action || ''))
  const data = await postPlan({
    action:'search',
    planId:plan.planId,
    accessToken:plan.accessToken,
    query:queryParts.join('\n').slice(0, 4000),
    limit:Math.max(3, Math.min(6, Number(limit) || 5)),
    force:directQuestion,
  })

  return {
    queried:true,
    matched:Boolean(data?.matched),
    planName:data?.planName || plan.displayName || plan.fileName || 'Local Plan',
    jurisdiction:data?.jurisdiction || jurisdiction || '',
    matches:Array.isArray(data?.matches) ? data.matches.slice(0, 6) : [],
  }
}
