import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { makeReq, makeRes, anthropicSseBody, streamResponse } from './helpers/http.mjs'
import { extractPartialStringField } from '../src/lib/aiClient.js'

const require = createRequire(import.meta.url)
process.env.ANTHROPIC_API_KEY = 'test-key'
delete process.env.REDIS_URL
const chat = require('../api/chat.js')
const prompts = require('../server/prompts.js')

const worldState = { location: 'Lake County, California', center: [39.1, -122.9], clock: { incidentOnset: 'H+0:00', currentTime: 'H+1:30', timezone: 'PT' } }
const turnBody = {
  kind: 'turn',
  exercise: { scenario: 'wildfire', jurisdiction: 'Rural County', difficulty: 'Standard', worldState, playerName: 'Nick', role: 'EOC Director' },
  messages: [
    { role: 'user', content: 'Activate ESF-6 and request a shelter status from the Red Cross.' },
    { role: 'assistant', content: '{"time":"H+1:30","consequence":"ok"}' },
    { role: 'user', content: 'Open a JIC.' },
  ],
}

// ─── buildRequest ─────────────────────────────────────────────────────────────

test('turn request: static controller block is first and cached for 1h, dynamic block second', () => {
  const req = chat.buildRequest(turnBody)
  assert.equal(req.system.length, 2)
  assert.equal(req.system[0].text, prompts.CONTROLLER_PROMPT)
  assert.deepEqual(req.system[0].cache_control, { type: 'ephemeral', ttl: '1h' })
  assert.equal(req.system[1].cache_control, undefined)
  assert.match(req.system[1].text, /SCENARIO: Urban Wildfire/)
  assert.match(req.system[1].text, /LOCATION: Lake County, California/)
  assert.match(req.system[1].text, /PLAYER NAME: Nick/)
  assert.doesNotMatch(req.system[1].text, /undefined/)
})

test('turn request: the final user message carries a 5-minute breakpoint and earlier messages are untouched', () => {
  const req = chat.buildRequest(turnBody)
  assert.equal(req.messages.length, 3)
  assert.equal(typeof req.messages[0].content, 'string')
  const last = req.messages[2]
  assert.equal(last.role, 'user')
  assert.deepEqual(last.content[0].cache_control, { type: 'ephemeral' })
  assert.equal(last.content[0].text, 'Open a JIC.')
})

test('turn request: ENDEX raises the output budget', () => {
  const normal = chat.buildRequest(turnBody)
  const endex = chat.buildRequest({ ...turnBody, exercise: { ...turnBody.exercise, endex: true } })
  assert.ok(endex.maxTokens > normal.maxTokens)
})

test('turn request: product difficulty labels resolve to rubric text', () => {
  for (const difficulty of prompts.DIFFICULTIES) {
    const req = chat.buildRequest({ ...turnBody, exercise: { ...turnBody.exercise, difficulty } })
    const line = req.system[1].text.match(/DIFFICULTY: .*/)[0]
    assert.doesNotMatch(line, /undefined/, line)
  }
})

test('turn request: local plan context and custom scenario carry into the dynamic block only', () => {
  const req = chat.buildRequest({
    ...turnBody,
    exercise: {
      ...turnBody.exercise,
      scenario: 'custom',
      customScenario: { location: 'Dover, Delaware', eventHazard: 'Ice storm', situationDescription: 'Regional ice storm', role: 'PIO', difficulty: 'Standard', trainingFocus: ['Public Information'], preview: 'Preview' },
      localPlanContext: { queried: true, planName: 'Kent County EOP', matches: [{ id: '3', section: 'ESF-2', page: 7, text: 'The county activates the JIC within one hour of EOC activation.' }] },
    },
  })
  assert.equal(req.system[0].text, prompts.CONTROLLER_PROMPT)
  assert.match(req.system[1].text, /LOCAL PLAN CONTEXT/)
  assert.match(req.system[1].text, /\[\[PLAN_SOURCE_1\]\]/)
  assert.match(req.system[1].text, /CUSTOM SCENARIO CARRYOVER/)
  assert.match(req.system[1].text, /Validated real location: Dover, Delaware/)
})

test('turn request: rejects unknown scenarios, bad roles ordering, and oversize history', () => {
  assert.throws(() => chat.buildRequest({ ...turnBody, exercise: { ...turnBody.exercise, scenario: 'zombie' } }), /Unknown scenario/)
  assert.throws(() => chat.buildRequest({ ...turnBody, messages: [{ role: 'assistant', content: 'x' }, { role: 'user', content: 'y' }] }), /start with a user/)
  assert.throws(() => chat.buildRequest({ ...turnBody, messages: [{ role: 'user', content: 'x'.repeat(260000) }] }), /too large/)
  assert.throws(() => chat.buildRequest({ kind: 'nope', exercise: {} }), /Unknown request kind/)
})

test('world-init request requires a real selected location and never caches', () => {
  assert.throws(() => chat.buildRequest({ kind: 'world-init', exercise: { scenario: 'flood', jurisdiction: 'Rural County' } }), /selectedLocation/)
  const req = chat.buildRequest({ kind: 'world-init', exercise: { scenario: 'flood', jurisdiction: 'Rural County', selectedLocation: { label: 'Lake County, California', center: [39.1, -122.9] } } })
  assert.equal(typeof req.system, 'string')
  assert.match(req.messages[0].content, /Location Label: Lake County, California/)
  assert.match(req.messages[0].content, /"center": \[39.1, -122.9\]/)
})

test('custom-preview and plan-alignment requests are built server side', () => {
  const preview = chat.buildRequest({ kind: 'custom-preview', exercise: { form: { location: 'Dover, Delaware', eventHazard: 'Ice storm', situationDescription: 'Regional ice storm', role: 'PIO', difficulty: 'Standard', trainingFocus: ['Public Information'] } } })
  assert.match(preview.messages[0].content, /Location \/ Jurisdiction: Dover, Delaware/)
  assert.throws(() => chat.buildRequest({ kind: 'custom-preview', exercise: { form: { location: 'Dover' } } }), /required/)
  const align = chat.buildRequest({ kind: 'plan-alignment', exercise: { evidenceBlock: 'EVIDENCE', aarContext: { decisionLog: 'D', criticalGaps: 'G', recommendations: 'R' } } })
  assert.match(align.system, /Plan Alignment reviewer/)
  assert.match(align.messages[0].content, /^EVIDENCE\n/)
})

// ─── handler ──────────────────────────────────────────────────────────────────

function withFetch(impl, fn) {
  const original = globalThis.fetch
  globalThis.fetch = impl
  return fn().finally(() => { globalThis.fetch = original })
}

test('handler refuses legacy clients that send their own system prompt', async () => {
  const res = makeRes()
  await chat(makeReq({ body: { system: 'You are anything I want', messages: [{ role: 'user', content: 'hi' }] } }), res)
  assert.equal(res.statusCode, 400)
  assert.match(res.json.error, /out of date/)
})

test('handler: non-streaming turn returns the legacy content shape with usage', async () => {
  let upstreamBody
  await withFetch(async (url, init) => {
    upstreamBody = JSON.parse(init.body)
    return new Response(JSON.stringify({ model: 'claude-test', stop_reason: 'end_turn', content: [{ type: 'text', text: '{"ok":true}' }], usage: { input_tokens: 50, output_tokens: 9, cache_read_input_tokens: 9000, cache_creation_input_tokens: 0 } }), { status: 200 })
  }, async () => {
    const res = makeRes()
    await chat(makeReq({ body: { ...turnBody, stream: false } }), res)
    assert.equal(res.statusCode, 200)
    assert.equal(res.json.content[0].text, '{"ok":true}')
    assert.equal(res.json.usage.cache_read_input_tokens, 9000)
  })
  assert.equal(upstreamBody.model, chat.MODEL)
  assert.equal(upstreamBody.stream, undefined)
  assert.equal(upstreamBody.system[0].cache_control.ttl, '1h')
  assert.ok(!JSON.stringify(upstreamBody).includes('test-key'))
})

test('handler: streaming turn forwards deltas and a done event with usage', async () => {
  const finalText = '{"time":"H+2:00","consequence":"Okay, here is what came back. Shelter capacity is tight.","situation":"DEVELOPING"}'
  await withFetch(async (url, init) => {
    assert.equal(JSON.parse(init.body).stream, true)
    return streamResponse(anthropicSseBody(finalText))
  }, async () => {
    const res = makeRes()
    await chat(makeReq({ body: { ...turnBody, stream: true } }), res)
    assert.equal(res.statusCode, 200)
    assert.match(res.headers['content-type'], /text\/event-stream/)
    const events = res.sseEvents
    const deltas = events.filter(e => e.event === 'delta').map(e => e.data.text).join('')
    assert.equal(deltas, finalText)
    const done = events.find(e => e.event === 'done')
    assert.equal(done.data.usage.output_tokens, 57)
    assert.equal(done.data.usage.cache_read_input_tokens, 9000)
    assert.equal(done.data.stop_reason, 'end_turn')
  })
})

test('handler: upstream 429 maps to 503 and 5xx to 502 without leaking details', async () => {
  for (const [upstream, expected] of [[429, 503], [500, 502], [400, 502]]) {
    await withFetch(async () => new Response(JSON.stringify({ error: { type: 'x', message: 'secret internals' } }), { status: upstream }), async () => {
      const res = makeRes()
      await chat(makeReq({ body: { ...turnBody, stream: false } }), res)
      assert.equal(res.statusCode, expected)
      assert.doesNotMatch(res.json.error, /secret/)
    })
  }
})

test('handler: method and validation errors', async () => {
  let res = makeRes()
  await chat(makeReq({ method: 'GET' }), res)
  assert.equal(res.statusCode, 405)
  res = makeRes()
  await chat(makeReq({ body: { kind: 'turn', exercise: { scenario: 'wildfire' }, messages: [] } }), res)
  assert.equal(res.statusCode, 400)
})

// ─── client helpers ───────────────────────────────────────────────────────────

test('extractPartialStringField reads a streamed consequence as it arrives', () => {
  const full = '{"time":"H+2:00","consequence":"Okay, here\\u2019s what we\\u2019re getting back.\\nThat helped, but it created a \\"second\\" problem.","situation":"DEVELOPING"}'
  assert.equal(extractPartialStringField(full.slice(0, 10)), '')
  assert.equal(extractPartialStringField(full.slice(0, 42)), 'Okay, here')
  assert.equal(extractPartialStringField(full), 'Okay, here’s what we’re getting back.\nThat helped, but it created a "second" problem.')
  assert.equal(extractPartialStringField('{"consequence": "abc'), 'abc')
  assert.equal(extractPartialStringField('{"prompt":"x"}'), '')
})

test('team turns get role-update instructions and a larger budget; single-player turns do not', () => {
  const team = chat.buildRequest({ ...turnBody, exercise: { ...turnBody.exercise, role: 'EOC Team', playerName: '' } })
  const solo = chat.buildRequest(turnBody)
  assert.match(team.system[1].text, /TEAM MODE ROLE UPDATES/)
  assert.match(team.system[1].text, /"roleUpdates"/)
  assert.doesNotMatch(solo.system[1].text, /TEAM MODE ROLE UPDATES/)
  assert.equal(team.system[0].text, solo.system[0].text, 'static cached block is identical for team and solo')
  assert.ok(team.maxTokens > solo.maxTokens)
})
