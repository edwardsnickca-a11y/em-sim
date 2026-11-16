// NEXUS EOC AI endpoint.
//
// The browser sends a small, validated exercise descriptor plus message history.
// This function builds the prompts (server/prompts.js), calls Anthropic with
// prompt caching enabled, and either returns one JSON reply or streams text
// deltas back as server-sent events. The Anthropic key, the controller prompt,
// and the model choice never leave the server.
//
// Request body:
//   {
//     kind: 'turn' | 'world-init' | 'custom-world-init' | 'custom-preview' | 'plan-alignment',
//     exercise: { ...kind-specific fields, see validateExercise },
//     messages: [{ role: 'user' | 'assistant', content: string }]   (turn only)
//     stream: boolean
//   }
//
// Non-streaming response:  { content: [{ type: 'text', text }], usage, model, stop_reason }
// Streaming response (text/event-stream):
//   event: delta   data: { "text": "..." }
//   event: done    data: { "usage": {...}, "model": "...", "stop_reason": "..." }
//   event: error   data: { "error": "..." }

const crypto = require('node:crypto')
const prompts = require('../server/prompts.js')
const { redisCommand } = require('../server/redis.js')

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'
const ANTHROPIC_TIMEOUT_MS = 105000
const STREAM_IDLE_TIMEOUT_MS = 45000
const STREAM_FIRST_BYTE_TIMEOUT_MS = 60000

const RATE_WINDOW_SECONDS = 10 * 60
const RATE_LIMIT_REQUESTS = 120
const MAX_REQUEST_CHARS = 250000
const MAX_MESSAGES = 400
const MAX_TOKENS_DEFAULT = 4000
const MAX_TOKENS_ENDEX = 8000
const MAX_TOKENS_TEAM_TURN = 6000

const KINDS = new Set(['turn', 'world-init', 'custom-world-init', 'custom-preview', 'plan-alignment'])

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  Object.entries(extraHeaders).forEach(([key, value]) => res.setHeader(key, String(value)))
  res.end(JSON.stringify(payload))
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  return forwarded || String(req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown')
}

function str(value, max) {
  if (value === null || value === undefined) return ''
  return String(value).slice(0, max)
}

function num(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function strList(value, maxItems, maxChars) {
  if (!Array.isArray(value)) return []
  return value.slice(0, maxItems).map(item => str(item, maxChars)).filter(Boolean)
}

// ─── Rate limiting ───────────────────────────────────────────────────────────

const localRateBuckets = new Map()

function rateKey(req) {
  const digest = crypto.createHash('sha256').update(clientIp(req)).digest('hex').slice(0, 24)
  const windowId = Math.floor(Date.now() / (RATE_WINDOW_SECONDS * 1000))
  return `nexus:eoc:chat-rate:${digest}:${windowId}`
}

function localRateLimit(key) {
  const now = Date.now()
  const current = localRateBuckets.get(key)
  if (!current || current.expiresAt <= now) {
    localRateBuckets.set(key, { count: 1, expiresAt: now + RATE_WINDOW_SECONDS * 1000 })
    return { allowed: true, count: 1 }
  }
  current.count += 1
  return { allowed: current.count <= RATE_LIMIT_REQUESTS, count: current.count }
}

async function checkRateLimit(req) {
  const key = rateKey(req)
  if (!process.env.REDIS_URL) return { ...localRateLimit(key), source: 'local' }
  try {
    const count = await redisCommand(['INCR', key], { timeoutMs: 5000 })
    if (count === 1) await redisCommand(['EXPIRE', key, RATE_WINDOW_SECONDS], { timeoutMs: 5000 })
    return { allowed: count <= RATE_LIMIT_REQUESTS, count, source: 'redis' }
  } catch (err) {
    console.warn('chat rate limiter falling back to local memory:', err.message)
    return { ...localRateLimit(key), source: 'local' }
  }
}

// ─── Validation ──────────────────────────────────────────────────────────────

function validateMessages(messages) {
  if (!Array.isArray(messages) || !messages.length) throw badRequest('messages are required')
  if (messages.length > MAX_MESSAGES) throw badRequest('Too many messages')
  let chars = 0
  const clean = messages.map(message => {
    const role = message?.role === 'assistant' ? 'assistant' : message?.role === 'user' ? 'user' : null
    if (!role) throw badRequest('Each message needs a role of user or assistant')
    const content = typeof message.content === 'string' ? message.content : ''
    if (!content.trim()) throw badRequest('Each message needs text content')
    chars += content.length
    return { role, content }
  })
  if (chars > MAX_REQUEST_CHARS) throw badRequest('AI request is too large')
  if (clean[0].role !== 'user') throw badRequest('Conversation must start with a user message')
  if (clean[clean.length - 1].role !== 'user') throw badRequest('Conversation must end with a user message')
  return clean
}

function cleanWorldState(world) {
  if (!world || typeof world !== 'object') return null
  const center = Array.isArray(world.center) && world.center.length === 2 ? [num(world.center[0]), num(world.center[1])] : null
  return {
    location: str(world.location, 300),
    center: center && center.every(v => v !== null) ? center : [0, 0],
    clock: world.clock && typeof world.clock === 'object'
      ? { incidentOnset: str(world.clock.incidentOnset, 60), currentTime: str(world.clock.currentTime, 60), timezone: str(world.clock.timezone, 80) }
      : null,
    localizedJurisdiction: str(world.localizedJurisdiction, 220) || null,
  }
}

function cleanCustomScenario(custom) {
  if (!custom || typeof custom !== 'object') return null
  const location = str(custom.location, 220).trim()
  if (!location) throw badRequest('Custom scenario requires a location')
  return {
    location,
    eventHazard: str(custom.eventHazard, 400),
    situationDescription: str(custom.situationDescription, 4000),
    role: str(custom.role, 80),
    difficulty: str(custom.difficulty, 40),
    trainingFocus: strList(custom.trainingFocus, 12, 80),
    preview: str(custom.preview, 8000),
  }
}

function cleanLocalPlanContext(ctx) {
  if (!ctx || typeof ctx !== 'object' || !ctx.queried) return null
  const matches = Array.isArray(ctx.matches) ? ctx.matches.slice(0, 6).map(item => ({
    id: str(item?.id, 24),
    section: str(item?.section, 180),
    page: num(item?.page),
    text: str(item?.text, 1800),
  })).filter(item => item.text) : []
  return { queried: true, planName: str(ctx.planName, 220), matches }
}

function cleanSelectedLocation(loc) {
  if (!loc || typeof loc !== 'object') throw badRequest('selectedLocation is required')
  const label = str(loc.label, 220).trim()
  if (!label) throw badRequest('selectedLocation.label is required')
  const center = Array.isArray(loc.center) && loc.center.length === 2 ? [num(loc.center[0]), num(loc.center[1])] : null
  return {
    label,
    name: str(loc.name, 220) || label,
    state: str(loc.state, 120),
    region: str(loc.region, 120),
    center: center && center.every(v => v !== null) ? center : null,
    radiusMiles: num(loc.radiusMiles),
    notes: str(loc.notes, 1200),
    isUserProvided: Boolean(loc.isUserProvided),
  }
}

function badRequest(message) {
  const err = new Error(message)
  err.statusCode = 400
  return err
}

// Turns the raw request into a fully formed Anthropic request body.
function buildRequest(body) {
  const kind = str(body.kind, 40)
  if (!KINDS.has(kind)) throw badRequest('Unknown request kind')
  const ex = body.exercise && typeof body.exercise === 'object' ? body.exercise : {}

  if (kind === 'turn') {
    const messages = validateMessages(body.messages)
    const customScenario = cleanCustomScenario(ex.customScenario)
    const scenario = str(ex.scenario, 80)
    if (!scenario) throw badRequest('scenario is required')
    if (!prompts.SCENARIOS[scenario] && !customScenario) throw badRequest('Unknown scenario')
    const { staticText, dynamicText } = prompts.buildSystemPromptBlocks(
      scenario,
      str(ex.jurisdiction, 220) || 'Mid-Size City',
      str(ex.difficulty, 40) || 'Adaptive',
      cleanWorldState(ex.worldState),
      str(ex.playerName, 80),
      str(ex.role, 80) || 'EOC Director',
      customScenario,
      cleanLocalPlanContext(ex.localPlanContext),
    )
    return {
      maxTokens: ex.endex ? MAX_TOKENS_ENDEX : (str(ex.role, 80) === 'EOC Team' ? MAX_TOKENS_TEAM_TURN : MAX_TOKENS_DEFAULT),
      system: [
        // Static controller text: identical on every request, cached for an hour.
        { type: 'text', text: staticText, cache_control: { type: 'ephemeral', ttl: '1h' } },
        { type: 'text', text: dynamicText },
      ],
      // A 5-minute breakpoint on the latest user message lets the next turn in
      // the same exercise reuse the history prefix. Longer TTL must come first.
      messages: messages.map((message, index) => index === messages.length - 1
        ? { role: message.role, content: [{ type: 'text', text: message.content, cache_control: { type: 'ephemeral' } }] }
        : message),
    }
  }

  if (kind === 'world-init') {
    const scenario = str(ex.scenario, 80)
    if (!prompts.SCENARIOS[scenario]) throw badRequest('Unknown scenario')
    const localization = ex.localization && typeof ex.localization === 'object'
      ? { specificJurisdiction: str(ex.localization.specificJurisdiction, 220) }
      : null
    const user = prompts.buildWorldInitPrompt(scenario, str(ex.jurisdiction, 220), cleanSelectedLocation(ex.selectedLocation), localization)
    return { maxTokens: MAX_TOKENS_DEFAULT, system: prompts.WORLD_INIT_SYSTEM, messages: [{ role: 'user', content: user }] }
  }

  if (kind === 'custom-world-init') {
    const customScenario = cleanCustomScenario(ex.customScenario)
    if (!customScenario) throw badRequest('customScenario is required')
    const user = prompts.buildCustomWorldInitPrompt(customScenario)
    return { maxTokens: MAX_TOKENS_DEFAULT, system: prompts.CUSTOM_WORLD_INIT_SYSTEM, messages: [{ role: 'user', content: user }] }
  }

  if (kind === 'custom-preview') {
    const form = ex.form && typeof ex.form === 'object' ? ex.form : {}
    const clean = {
      location: str(form.location, 220),
      eventHazard: str(form.eventHazard, 400),
      situationDescription: str(form.situationDescription, 4000),
      role: str(form.role, 80),
      difficulty: str(form.difficulty, 40),
      trainingFocus: strList(form.trainingFocus, 12, 80),
    }
    if (!clean.location || !clean.eventHazard || !clean.situationDescription) throw badRequest('location, eventHazard, and situationDescription are required')
    return { maxTokens: 2000, system: prompts.CUSTOM_PREVIEW_SYSTEM, messages: [{ role: 'user', content: prompts.buildCustomPreviewPrompt(clean) }] }
  }

  // plan-alignment
  const evidenceBlock = str(ex.evidenceBlock, 120000)
  if (!evidenceBlock.trim()) throw badRequest('evidenceBlock is required')
  const aar = ex.aarContext && typeof ex.aarContext === 'object' ? ex.aarContext : {}
  const user = prompts.buildPlanAlignmentUser(evidenceBlock, {
    decisionLog: str(aar.decisionLog, 20000),
    criticalGaps: str(aar.criticalGaps, 20000),
    recommendations: str(aar.recommendations, 20000),
  })
  return { maxTokens: 3000, system: prompts.buildPlanAlignmentSystem(), messages: [{ role: 'user', content: user }] }
}

// ─── Anthropic calls ─────────────────────────────────────────────────────────

function anthropicHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': ANTHROPIC_VERSION,
  }
}

function upstreamErrorResponse(res, status, type) {
  console.error('Anthropic request failed', { status, type })
  if (status === 429) return sendJson(res, 503, { error: 'The AI service is temporarily rate limited. Please try again shortly.' })
  if (status >= 500) return sendJson(res, 502, { error: 'The AI service is temporarily unavailable. Please try again.' })
  return sendJson(res, 502, { error: 'The AI service rejected the request. Please try again.' })
}

function compactUsage(usage) {
  if (!usage || typeof usage !== 'object') return null
  return {
    input_tokens: usage.input_tokens ?? 0,
    output_tokens: usage.output_tokens ?? 0,
    cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
    cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
  }
}

async function respondJson(res, request, signal) {
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    signal,
    headers: anthropicHeaders(),
    body: JSON.stringify({ model: MODEL, max_tokens: request.maxTokens, system: request.system, messages: request.messages }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) return upstreamErrorResponse(res, response.status, data?.error?.type)

  const text = (data?.content || []).filter(block => block?.type === 'text').map(block => block.text).join('')
  if (!text) {
    console.error('Anthropic returned an empty response')
    return sendJson(res, 502, { error: 'The AI service returned an empty response. Please try again.' })
  }
  const usage = compactUsage(data.usage)
  if (usage) console.log('chat usage', { kind: request.kind, model: data.model, ...usage })
  return sendJson(res, 200, { content: [{ type: 'text', text }], usage, model: data.model, stop_reason: data.stop_reason })
}

function sseWrite(res, event, payload) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`)
}

async function respondStream(res, request, controller, onConnected) {
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    signal: controller.signal,
    headers: anthropicHeaders(),
    body: JSON.stringify({ model: MODEL, max_tokens: request.maxTokens, system: request.system, messages: request.messages, stream: true }),
  })
  onConnected()
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    return upstreamErrorResponse(res, response.status, data?.error?.type)
  }

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  if (typeof res.flushHeaders === 'function') res.flushHeaders()

  const decoder = new TextDecoder()
  const reader = response.body.getReader()
  let buffer = ''
  let model = ''
  let stopReason = null
  let usage = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }
  let emitted = 0
  let idleTimer = null

  const resetIdle = () => {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => controller.abort(), STREAM_IDLE_TIMEOUT_MS)
  }

  const handleEvent = (eventName, rawData) => {
    if (!rawData) return
    let data
    try { data = JSON.parse(rawData) } catch { return }
    const type = data.type || eventName
    if (type === 'message_start') {
      model = data.message?.model || model
      usage = { ...usage, ...compactUsage(data.message?.usage) }
    } else if (type === 'content_block_delta') {
      const text = data.delta?.type === 'text_delta' ? data.delta.text : ''
      if (text) { emitted += text.length; sseWrite(res, 'delta', { text }) }
    } else if (type === 'message_delta') {
      stopReason = data.delta?.stop_reason || stopReason
      if (data.usage?.output_tokens !== undefined) usage.output_tokens = data.usage.output_tokens
    } else if (type === 'error') {
      throw new Error(data.error?.message || 'Upstream stream error')
    }
  }

  try {
    resetIdle()
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      resetIdle()
      buffer += decoder.decode(value, { stream: true })
      let boundary
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const chunk = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        let eventName = ''
        const dataLines = []
        for (const line of chunk.split('\n')) {
          if (line.startsWith('event:')) eventName = line.slice(6).trim()
          else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
        }
        handleEvent(eventName, dataLines.join('\n'))
      }
    }
    if (!emitted) {
      console.error('Anthropic stream produced no text')
      sseWrite(res, 'error', { error: 'The AI service returned an empty response. Please try again.' })
    } else {
      console.log('chat usage', { kind: request.kind, model, stream: true, ...usage })
      sseWrite(res, 'done', { usage, model, stop_reason: stopReason })
    }
  } catch (err) {
    const timedOut = err?.name === 'AbortError'
    console.error(timedOut ? 'Anthropic stream timed out' : 'Anthropic stream failed', timedOut ? '' : err)
    sseWrite(res, 'error', { error: timedOut ? 'The AI request timed out. Please try again.' : 'The AI request failed. Please try again.' })
  } finally {
    if (idleTimer) clearTimeout(idleTimer)
    res.end()
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('chat error: ANTHROPIC_API_KEY is not configured')
    return sendJson(res, 500, { error: 'AI service is not configured for this deployment.' })
  }

  const body = req.body && typeof req.body === 'object' ? req.body : null
  if (!body) return sendJson(res, 400, { error: 'Invalid request body' })

  // Legacy clients that still send a raw system prompt are refused: the server
  // is the only place prompts are built now.
  if (typeof body.system === 'string' && !body.kind) {
    return sendJson(res, 400, { error: 'This client version is out of date. Please reload the page.' })
  }

  let request
  try {
    request = buildRequest(body)
    request.kind = body.kind
  } catch (err) {
    if (err.statusCode === 400) return sendJson(res, 400, { error: err.message })
    console.error('chat request build failed', err)
    return sendJson(res, 500, { error: 'The AI request could not be prepared.' })
  }

  const rate = await checkRateLimit(req)
  if (!rate.allowed) {
    return sendJson(res, 429, { error: 'Too many AI requests from this network. Please wait a few minutes and try again.' }, { 'Retry-After': RATE_WINDOW_SECONDS })
  }

  const controller = new AbortController()
  // Streaming manages its own first-byte and idle timeouts; a long AAR can
  // legitimately stream for more than the single-shot limit.
  const timeoutId = setTimeout(() => controller.abort(), body.stream ? STREAM_FIRST_BYTE_TIMEOUT_MS : ANTHROPIC_TIMEOUT_MS)
  try {
    if (body.stream) return await respondStream(res, request, controller, () => clearTimeout(timeoutId))
    return await respondJson(res, request, controller.signal)
  } catch (err) {
    if (res.headersSent) { res.end(); return }
    if (err?.name === 'AbortError') {
      console.error('Anthropic request timed out')
      return sendJson(res, 504, { error: 'The AI request timed out. Please try again.' })
    }
    console.error('chat error', err)
    return sendJson(res, 500, { error: 'The AI request failed. Please try again.' })
  } finally {
    clearTimeout(timeoutId)
  }
}

module.exports.buildRequest = buildRequest
module.exports.MODEL = MODEL
