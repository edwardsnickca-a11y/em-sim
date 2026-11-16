// Browser client for the NEXUS EOC AI endpoint (/api/chat).
//
// The client never builds or sends prompts. It describes the exercise and the
// server assembles the Anthropic request. Responses stream back as server-sent
// events by default so the UI can show progress and long AARs are not cut off
// by request timeouts; callers still receive the same `{ content, usage }`
// shape the old proxy returned.

import { removeEmDashes } from './dashes.js'

export const AI_REQUEST_TIMEOUT_MS = 110000
const STREAM_IDLE_TIMEOUT_MS = 60000

function makeError(message, { status, name } = {}) {
  const error = new Error(message)
  if (status) error.status = status
  if (name) error.name = name
  return error
}

function toResult(text, usage, model) {
  if (!text) throw makeError('The AI service returned an empty response. Please try again.')
  // Every AI response passes through here, so no em dash reaches the screen,
  // the transcript, the AAR, or the PDFs.
  return { content: [{ type: 'text', text: removeEmDashes(text) }], usage: usage || null, model: model || null }
}

async function readSse(res, { onDelta, signal, resetIdle }) {
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let text = ''
  let usage = null
  let model = null
  let finished = false

  const handle = (event, raw) => {
    let data = {}
    try { data = raw ? JSON.parse(raw) : {} } catch { data = {} }
    if (event === 'delta') {
      if (typeof data.text === 'string') {
        text += data.text
        if (onDelta) onDelta(removeEmDashes(text), data.text)
      }
    } else if (event === 'done') {
      usage = data.usage || null
      model = data.model || null
      finished = true
    } else if (event === 'error') {
      throw makeError(data.error || 'The AI request failed. Please try again.')
    }
  }

  while (true) {
    if (signal?.aborted) throw makeError('The AI request timed out. Please try again.', { name: 'TimeoutError' })
    const { value, done } = await reader.read()
    if (done) break
    resetIdle()
    buffer += decoder.decode(value, { stream: true })
    let boundary
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      let event = 'message'
      const dataLines = []
      for (const line of chunk.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
      }
      handle(event, dataLines.join('\n'))
    }
  }
  if (!finished && !text) throw makeError('The AI connection closed before a response arrived. Please try again.')
  return toResult(text, usage, model)
}

/**
 * Request an AI completion.
 *
 * @param {object} options
 * @param {'turn'|'world-init'|'custom-world-init'|'custom-preview'|'plan-alignment'} options.kind
 * @param {object} options.exercise   kind-specific descriptor validated by the server
 * @param {Array}  [options.messages] conversation history, `turn` only
 * @param {boolean}[options.stream]   default true
 * @param {function}[options.onDelta] (fullText, latestChunk) called as text streams in
 * @param {number} [options.timeoutMs] overall limit for non-streaming; first-byte limit for streaming
 */
export async function requestAiChat({ kind, exercise, messages, stream = true, onDelta, timeoutMs = AI_REQUEST_TIMEOUT_MS }) {
  const controller = new AbortController()
  let timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  const resetIdle = () => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => controller.abort(), STREAM_IDLE_TIMEOUT_MS)
  }
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ kind, exercise, messages, stream }),
    })
    const contentType = res.headers.get('content-type') || ''
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw makeError(data?.error || `AI request failed (${res.status})`, { status: res.status })
    }
    if (stream && contentType.includes('text/event-stream')) {
      resetIdle()
      return await readSse(res, { onDelta, signal: controller.signal, resetIdle })
    }
    const data = await res.json().catch(() => ({}))
    const text = data?.content?.[0]?.text || ''
    if (onDelta && text) onDelta(removeEmDashes(text), text)
    return toResult(text, data?.usage, data?.model)
  } catch (err) {
    if (err?.name === 'AbortError') throw makeError('The AI request timed out. Please try again.', { name: 'TimeoutError' })
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Pulls the current value of one string field out of a partially streamed JSON
 * object so the UI can show the Deputy's narrative while the rest of the turn
 * is still arriving. Returns '' until the field's opening quote has arrived.
 */
export function extractPartialStringField(partialJson = '', field = 'consequence') {
  const key = `"${field}"`
  const keyIndex = partialJson.indexOf(key)
  if (keyIndex === -1) return ''
  const colon = partialJson.indexOf(':', keyIndex + key.length)
  if (colon === -1) return ''
  const open = partialJson.indexOf('"', colon + 1)
  if (open === -1) return ''
  let out = ''
  for (let i = open + 1; i < partialJson.length; i += 1) {
    const ch = partialJson[i]
    if (ch === '\\') {
      const next = partialJson[i + 1]
      if (next === undefined) break
      if (next === 'n') out += '\n'
      else if (next === 't') out += '\t'
      else if (next === 'u') { const hex = partialJson.slice(i + 2, i + 6); if (hex.length === 4) out += String.fromCharCode(parseInt(hex, 16)); i += 4 }
      else out += next
      i += 1
      continue
    }
    if (ch === '"') break
    out += ch
  }
  return out
}
