// NEXUS EOC Local Plan ingestion API
// Stores extracted, page-aware plan chunks in the existing Redis service.
// The original PDF is processed in the browser and is not stored by this endpoint.

const net = require('node:net')
const tls = require('node:tls')
const crypto = require('node:crypto')

const PLAN_TTL_SECONDS = 60 * 60 * 24 // v0.1: one exercise / 24-hour processing window
const REDIS_TIMEOUT_MS = 8000
const MAX_BODY_BYTES = 900_000
const MAX_CHUNKS_PER_BATCH = 30
const MAX_CHUNK_CHARS = 1800
const MAX_TOTAL_CHUNKS = 6000

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body)
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'))
        req.destroy()
      }
    })
    req.on('end', () => {
      if (!body) return resolve({})
      try { resolve(JSON.parse(body)) }
      catch (_) { reject(new Error('Invalid JSON body')) }
    })
    req.on('error', reject)
  })
}

function normalizePlanId(value) {
  const id = String(value || '').trim()
  return /^[a-f0-9]{24,64}$/i.test(id) ? id : ''
}

function planMetaKey(planId) { return `nexus:eoc:local-plan:${planId}:meta` }
function planChunksKey(planId) { return `nexus:eoc:local-plan:${planId}:chunks` }

function encodeRedisCommand(args) {
  const parts = [`*${args.length}\r\n`]
  for (const arg of args) {
    const value = Buffer.from(String(arg))
    parts.push(`$${value.length}\r\n`, value, '\r\n')
  }
  return Buffer.concat(parts.map(part => Buffer.isBuffer(part) ? part : Buffer.from(part)))
}

class RespParser {
  constructor() { this.buffer = Buffer.alloc(0) }
  push(chunk) { this.buffer = Buffer.concat([this.buffer, chunk]) }
  readLine(offset) {
    const end = this.buffer.indexOf('\r\n', offset)
    if (end === -1) return null
    return { line:this.buffer.slice(offset, end).toString('utf8'), next:end + 2 }
  }
  parseAt(offset=0) {
    if (this.buffer.length <= offset) return null
    const type = String.fromCharCode(this.buffer[offset])
    if (type === '+' || type === '-' || type === ':') {
      const line = this.readLine(offset + 1)
      if (!line) return null
      if (type === '-') throw new Error(line.line || 'Redis error')
      return { value:type === ':' ? Number(line.line) : line.line, next:line.next }
    }
    if (type === '$') {
      const line = this.readLine(offset + 1)
      if (!line) return null
      const length = Number(line.line)
      if (length === -1) return { value:null, next:line.next }
      const start = line.next
      const end = start + length
      if (this.buffer.length < end + 2) return null
      return { value:this.buffer.slice(start, end).toString('utf8'), next:end + 2 }
    }
    if (type === '*') {
      const line = this.readLine(offset + 1)
      if (!line) return null
      const count = Number(line.line)
      if (count === -1) return { value:null, next:line.next }
      const values = []
      let cursor = line.next
      for (let i = 0; i < count; i += 1) {
        const parsed = this.parseAt(cursor)
        if (!parsed) return null
        values.push(parsed.value)
        cursor = parsed.next
      }
      return { value:values, next:cursor }
    }
    return null
  }
  shiftParsed() {
    const parsed = this.parseAt(0)
    if (!parsed) return null
    this.buffer = this.buffer.slice(parsed.next)
    return parsed.value
  }
}

async function redisCommands(commandList) {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) throw new Error('REDIS_URL is not configured for this deployment')

  const parsedUrl = new URL(redisUrl)
  const isTls = parsedUrl.protocol === 'rediss:'
  const port = Number(parsedUrl.port || (isTls ? 6380 : 6379))
  const host = parsedUrl.hostname
  const username = decodeURIComponent(parsedUrl.username || '')
  const password = decodeURIComponent(parsedUrl.password || '')
  const db = parsedUrl.pathname && parsedUrl.pathname !== '/' ? parsedUrl.pathname.slice(1) : ''

  return new Promise((resolve, reject) => {
    const socket = isTls
      ? tls.connect({ host, port, servername:host, timeout:REDIS_TIMEOUT_MS })
      : net.connect({ host, port, timeout:REDIS_TIMEOUT_MS })
    const parser = new RespParser()
    const queue = []
    let settled = false

    function fail(err) {
      if (settled) return
      settled = true
      socket.destroy()
      reject(err)
    }
    function finish(value) {
      if (settled) return
      settled = true
      socket.end()
      resolve(value)
    }
    function runNext(previousValue) {
      if (queue.length === 0) return finish(previousValue)
      socket.write(encodeRedisCommand(queue.shift()))
    }

    socket.on('connect', () => {
      if (password) queue.push(username ? ['AUTH', username, password] : ['AUTH', password])
      if (db) queue.push(['SELECT', db])
      queue.push(...commandList)
      runNext()
    })
    socket.on('secureConnect', () => {})
    socket.on('data', chunk => {
      try {
        parser.push(chunk)
        while (true) {
          const parsed = parser.parseAt(0)
          if (!parsed) break
          parser.buffer = parser.buffer.slice(parsed.next)
          const value = parsed.value
          if (queue.length === 0) return finish(value)
          runNext(value)
        }
      } catch (err) { fail(err) }
    })
    socket.on('timeout', () => fail(new Error('Redis request timed out')))
    socket.on('error', fail)
  })
}

async function redisCommand(args) {
  return redisCommands([args])
}

async function getMeta(planId) {
  const raw = await redisCommand(['GET', planMetaKey(planId)])
  if (!raw) return null
  try { return JSON.parse(raw) } catch (_) { return null }
}

function authorized(meta, token) {
  if (!meta?.accessToken || !token) return false
  const a = Buffer.from(String(meta.accessToken))
  const b = Buffer.from(String(token))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

async function saveMeta(planId, meta) {
  await redisCommand(['SET', planMetaKey(planId), JSON.stringify(meta), 'EX', PLAN_TTL_SECONDS])
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error:'Method not allowed' })

  let body
  try { body = await readBody(req) }
  catch (err) { return sendJson(res, 400, { error:err.message || 'Invalid request' }) }

  try {
    const action = String(body.action || '').trim()

    if (action === 'create') {
      const fileName = String(body.fileName || '').trim().slice(0, 220)
      if (!fileName || !/\.pdf$/i.test(fileName)) return sendJson(res, 400, { error:'A PDF filename is required.' })
      const planId = crypto.randomBytes(16).toString('hex')
      const accessToken = crypto.randomBytes(24).toString('hex')
      const now = new Date().toISOString()
      const meta = {
        planId,
        accessToken,
        fileName,
        displayName:String(body.displayName || fileName.replace(/\.pdf$/i, '')).trim().slice(0, 220),
        jurisdiction:String(body.jurisdiction || '').trim().slice(0, 220),
        sizeBytes:Number(body.sizeBytes || 0),
        mimeType:'application/pdf',
        status:'processing',
        chunkCount:0,
        pageCount:null,
        extractedChars:0,
        createdAt:now,
        processedAt:null,
      }
      await saveMeta(planId, meta)
      await redisCommand(['DEL', planChunksKey(planId)])
      await redisCommand(['EXPIRE', planChunksKey(planId), PLAN_TTL_SECONDS])
      return sendJson(res, 200, { planId, accessToken, status:'processing' })
    }

    const planId = normalizePlanId(body.planId)
    if (!planId) return sendJson(res, 400, { error:'Invalid plan id.' })
    const meta = await getMeta(planId)
    if (!meta) return sendJson(res, 404, { error:'Plan processing record not found or expired.' })
    if (!authorized(meta, body.accessToken)) return sendJson(res, 403, { error:'Plan access denied.' })

    if (action === 'append') {
      if (meta.status !== 'processing') return sendJson(res, 409, { error:'Plan is not accepting additional content.' })
      const chunks = Array.isArray(body.chunks) ? body.chunks.slice(0, MAX_CHUNKS_PER_BATCH) : []
      if (!chunks.length) return sendJson(res, 400, { error:'No plan chunks supplied.' })
      if (meta.chunkCount + chunks.length > MAX_TOTAL_CHUNKS) return sendJson(res, 413, { error:'Plan produced too many searchable sections.' })

      const normalized = chunks.map((chunk, index) => ({
        id:`${meta.chunkCount + index + 1}`,
        page:Number.isFinite(Number(chunk.page)) ? Number(chunk.page) : null,
        section:String(chunk.section || '').trim().slice(0, 180),
        text:String(chunk.text || '').trim().slice(0, MAX_CHUNK_CHARS),
      })).filter(chunk => chunk.text.length >= 30)
      if (!normalized.length) return sendJson(res, 400, { error:'Plan chunk batch contained no usable text.' })

      await redisCommand(['RPUSH', planChunksKey(planId), ...normalized.map(chunk => JSON.stringify(chunk))])
      await redisCommand(['EXPIRE', planChunksKey(planId), PLAN_TTL_SECONDS])
      meta.chunkCount += normalized.length
      await saveMeta(planId, meta)
      return sendJson(res, 200, { status:'processing', chunkCount:meta.chunkCount })
    }

    if (action === 'finalize') {
      const actualCount = Number(await redisCommand(['LLEN', planChunksKey(planId)])) || 0
      if (!actualCount) return sendJson(res, 422, { error:'No searchable text was extracted from this plan.' })
      meta.status = 'ready'
      meta.chunkCount = actualCount
      meta.pageCount = Math.max(1, Number(body.pageCount || 1))
      meta.extractedChars = Math.max(0, Number(body.extractedChars || 0))
      meta.processedAt = new Date().toISOString()
      await saveMeta(planId, meta)
      await redisCommand(['EXPIRE', planChunksKey(planId), PLAN_TTL_SECONDS])
      return sendJson(res, 200, {
        status:'ready',
        planId,
        chunkCount:meta.chunkCount,
        pageCount:meta.pageCount,
        extractedChars:meta.extractedChars,
        processedAt:meta.processedAt,
      })
    }

    if (action === 'status') {
      return sendJson(res, 200, {
        status:meta.status,
        planId,
        fileName:meta.fileName,
        displayName:meta.displayName,
        jurisdiction:meta.jurisdiction,
        pageCount:meta.pageCount,
        chunkCount:meta.chunkCount,
        extractedChars:meta.extractedChars,
        processedAt:meta.processedAt,
      })
    }

    if (action === 'delete') {
      await redisCommand(['DEL', planMetaKey(planId)])
      await redisCommand(['DEL', planChunksKey(planId)])
      return sendJson(res, 200, { deleted:true })
    }

    return sendJson(res, 400, { error:'Unknown local-plan action.' })
  } catch (err) {
    console.error('local-plan error', err)
    return sendJson(res, 503, { error:'Local plan processing is temporarily unavailable. Try again.' })
  }
}
