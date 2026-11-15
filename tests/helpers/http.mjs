// Minimal req/res doubles for exercising Vercel-style Node API handlers in tests.
import { EventEmitter } from 'node:events'

export function makeReq({ method = 'POST', body = undefined, query = {}, headers = {} } = {}) {
  const req = new EventEmitter()
  req.method = method
  req.headers = { 'x-forwarded-for': '203.0.113.7', ...headers }
  req.query = query
  req.socket = { remoteAddress: '203.0.113.7' }
  if (body !== undefined) req.body = body
  return req
}

export function makeRes() {
  const chunks = []
  const headers = {}
  let resolveEnd
  const ended = new Promise(resolve => { resolveEnd = resolve })
  const res = {
    statusCode: 200,
    headersSent: false,
    setHeader(key, value) { headers[key.toLowerCase()] = String(value) },
    getHeader(key) { return headers[key.toLowerCase()] },
    flushHeaders() { res.headersSent = true },
    write(chunk) { res.headersSent = true; chunks.push(Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk)); return true },
    end(chunk) { if (chunk) res.write(chunk); res.headersSent = true; resolveEnd(); },
    ended,
    headers,
    get text() { return chunks.join('') },
    get json() { return JSON.parse(chunks.join('')) },
    get sseEvents() {
      return chunks.join('').split('\n\n').filter(Boolean).map(block => {
        const event = (block.match(/^event: (.*)$/m) || [])[1]
        const data = (block.match(/^data: (.*)$/m) || [])[1]
        return { event, data: data ? JSON.parse(data) : null }
      })
    },
  }
  return res
}

// Builds a fake Anthropic SSE body for a given final text.
export function anthropicSseBody(text, { model = 'claude-test', usage = {} } = {}) {
  const pieces = []
  const push = (type, payload) => pieces.push(`event: ${type}\ndata: ${JSON.stringify({ type, ...payload })}\n\n`)
  push('message_start', { message: { model, usage: { input_tokens: 120, cache_read_input_tokens: 9000, cache_creation_input_tokens: 0, output_tokens: 1, ...usage } } })
  push('content_block_start', { index: 0, content_block: { type: 'text', text: '' } })
  const step = Math.max(1, Math.ceil(text.length / 7))
  for (let i = 0; i < text.length; i += step) push('content_block_delta', { index: 0, delta: { type: 'text_delta', text: text.slice(i, i + step) } })
  push('content_block_stop', { index: 0 })
  push('message_delta', { delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 57 } })
  push('message_stop', {})
  return pieces.join('')
}

export function streamResponse(bodyText, { status = 200 } = {}) {
  const encoder = new TextEncoder()
  const parts = []
  for (let i = 0; i < bodyText.length; i += 53) parts.push(bodyText.slice(i, i + 53))
  const stream = new ReadableStream({
    start(controller) {
      for (const part of parts) controller.enqueue(encoder.encode(part))
      controller.close()
    },
  })
  return new Response(stream, { status, headers: { 'content-type': 'text/event-stream' } })
}
