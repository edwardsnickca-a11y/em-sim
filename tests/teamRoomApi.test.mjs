// Team Room authorization tests. Runs against a throwaway local redis-server
// when one is installed; otherwise the suite is skipped.
import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import net from 'node:net'
import { makeReq, makeRes } from './helpers/http.mjs'

const require = createRequire(import.meta.url)
const hasRedis = spawnSync('sh', ['-c', 'command -v redis-server']).status === 0

async function freePort() {
  return new Promise(resolve => {
    const srv = net.createServer()
    srv.listen(0, '127.0.0.1', () => { const { port } = srv.address(); srv.close(() => resolve(port)) })
  })
}

async function waitForPort(port, tries = 50) {
  for (let i = 0; i < tries; i += 1) {
    const ok = await new Promise(resolve => {
      const sock = net.connect(port, '127.0.0.1')
      sock.once('connect', () => { sock.destroy(); resolve(true) })
      sock.once('error', () => resolve(false))
    })
    if (ok) return
    await new Promise(r => setTimeout(r, 50))
  }
  throw new Error('redis did not start')
}

let redisProc
let handler

test.before(async () => {
  if (!hasRedis) return
  const port = await freePort()
  redisProc = spawn('redis-server', ['--port', String(port), '--save', '', '--appendonly', 'no', '--loglevel', 'warning'], { stdio: 'ignore' })
  await waitForPort(port)
  process.env.REDIS_URL = `redis://127.0.0.1:${port}`
  handler = require('../api/team-room.js')
})

test.after(() => { if (redisProc) redisProc.kill() })

async function call(body) {
  const res = makeRes()
  await handler(makeReq({ body }), res)
  return { status: res.statusCode, ...res.json }
}

async function get(query) {
  const res = makeRes()
  await handler(makeReq({ method: 'GET', query }), res)
  return { status: res.statusCode, ...res.json }
}

const skip = hasRedis ? false : 'redis-server not installed'

test('create and join issue secret tokens that never appear in room views', { skip }, async () => {
  const created = await call({ action: 'create', scenario: 'wildfire', jurisdiction: 'Rural County', difficulty: 'Standard', hostName: 'Host', hostRole: 'EOC Director', hostPlayerId: 'attacker-chosen-id' })
  assert.equal(created.ok, true)
  assert.ok(created.playerToken && created.playerToken.length >= 32)
  assert.notEqual(created.playerId, 'attacker-chosen-id', 'client may not choose its own player id')
  assert.ok(!JSON.stringify(created.room).includes(created.playerToken))

  const joined = await call({ action: 'join', code: created.room.roomCode, name: 'Planner', role: 'Planning Section Chief', playerId: 'attacker-chosen-id' })
  assert.equal(joined.ok, true)
  assert.notEqual(joined.playerId, 'attacker-chosen-id')
  assert.ok(joined.playerToken && joined.playerToken !== created.playerToken)
  const roomJson = JSON.stringify(joined.room)
  assert.ok(!roomJson.includes(created.playerToken) && !roomJson.includes(joined.playerToken))
  assert.ok(joined.room.players.every(p => p.token === undefined))
})

test('anonymous reads get the roster but no private state; bad credentials are rejected', { skip }, async () => {
  const host = await call({ action: 'create', scenario: 'flood', jurisdiction: 'Rural County', difficulty: 'Standard', hostName: 'Host', hostRole: 'EOC Director' })
  const code = host.room.roomCode
  const anon = await get({ code })
  assert.equal(anon.ok, true)
  assert.equal(anon.room.players.length, 1)
  assert.equal(anon.room.sharedScenario, null)
  assert.equal(anon.room.sharedTurnState, null)
  assert.deepEqual(anon.room.messages, [])
  assert.equal(anon.room.facilitatorAar, null)

  const forged = await get({ code, playerId: host.playerId, playerToken: 'deadbeef' })
  assert.equal(forged.status, 403)
  const stolenId = await get({ code, playerId: host.playerId })
  assert.equal(stolenId.status, 403, 'knowing a player id alone grants nothing')
})

test('host-only actions require the host token; player actions require that player token', { skip }, async () => {
  const host = await call({ action: 'create', scenario: 'hurricane', jurisdiction: 'Port City', difficulty: 'Standard', hostName: 'Host', hostRole: 'EOC Director' })
  const code = host.room.roomCode
  const p2 = await call({ action: 'join', code, name: 'PIO', role: 'Public Information Officer' })

  // start: host id without token, player token, then host token
  let r = await call({ action: 'start', code, playerId: host.playerId, sharedScenario: { world: {}, selectedLocation: {} } })
  assert.equal(r.status, 403)
  r = await call({ action: 'start', code, playerId: p2.playerId, playerToken: p2.playerToken, sharedScenario: { world: {}, selectedLocation: {} } })
  assert.equal(r.status, 403)
  r = await call({ action: 'start', code, playerId: host.playerId, playerToken: host.playerToken, sharedScenario: { world: { location: 'x' }, selectedLocation: { label: 'x' } } })
  assert.equal(r.ok, true)
  assert.equal(r.room.status, 'active')

  // submitResponse as p2 with host's id but p2's token fails; with own creds works
  r = await call({ action: 'submitResponse', code, playerId: host.playerId, playerToken: p2.playerToken, turn: 0, response: 'Spoof' })
  assert.equal(r.status, 403)
  r = await call({ action: 'submitResponse', code, playerId: p2.playerId, playerToken: p2.playerToken, turn: 0, response: 'Open the JIC.' })
  assert.equal(r.ok, true)
  assert.equal(r.room.submissions.length, 1)
  assert.equal(r.room.submissions[0].response, undefined, 'other players never see response text')

  // beginAdvance by non-host is refused, by host waits for everyone
  r = await call({ action: 'beginAdvance', code, playerId: p2.playerId, playerToken: p2.playerToken, turn: 0 })
  assert.equal(r.status, 403)
  r = await call({ action: 'beginAdvance', code, playerId: host.playerId, playerToken: host.playerToken, turn: 0 })
  assert.equal(r.ok, false)
  assert.match(r.error, /Waiting for Host/)

  // direct messages are only visible to sender and recipient
  r = await call({ action: 'sendMessage', code, playerId: host.playerId, playerToken: host.playerToken, channel: 'direct', recipientId: p2.playerId, message: 'private note' })
  assert.equal(r.ok, true)
  const p3 = await call({ action: 'join', code, name: 'Late', role: 'Safety Officer' })
  assert.equal(p3.ok, false, 'room is active, no new joins')
  const asP2 = await get({ code, playerId: p2.playerId, playerToken: p2.playerToken })
  assert.equal(asP2.room.messages.length, 1)
  const anon = await get({ code })
  assert.equal(anon.room.messages.length, 0)
})

test('role changes and removals are scoped to self or host', { skip }, async () => {
  const host = await call({ action: 'create', scenario: 'cyber', jurisdiction: 'Mid-Size City', difficulty: 'Standard', hostName: 'Host', hostRole: 'EOC Director' })
  const code = host.room.roomCode
  const a = await call({ action: 'join', code, name: 'A', role: 'Planning Section Chief' })
  const b = await call({ action: 'join', code, name: 'B', role: 'Logistics Section Chief' })

  let r = await call({ action: 'updateRole', code, playerId: a.playerId, playerToken: a.playerToken, targetPlayerId: b.playerId, role: 'Safety Officer' })
  assert.equal(r.status, 403)
  r = await call({ action: 'updateRole', code, playerId: a.playerId, playerToken: a.playerToken, role: 'Safety Officer' })
  assert.equal(r.ok, true)
  assert.equal(r.room.players.find(p => p.id === a.playerId).role, 'Safety Officer')
  r = await call({ action: 'updateRole', code, playerId: host.playerId, playerToken: host.playerToken, targetPlayerId: b.playerId, role: 'Liaison Officer' })
  assert.equal(r.ok, true)

  r = await call({ action: 'removePlayer', code, playerId: a.playerId, playerToken: a.playerToken, targetPlayerId: b.playerId })
  assert.equal(r.status, 403)
  r = await call({ action: 'removePlayer', code, playerId: host.playerId, playerToken: host.playerToken, targetPlayerId: b.playerId })
  assert.equal(r.ok, true)
  assert.equal(r.room.players.some(p => p.id === b.playerId), false)
  r = await call({ action: 'removePlayer', code, playerId: host.playerId, playerToken: host.playerToken, targetPlayerId: host.playerId })
  assert.equal(r.room.players.some(p => p.isHost), true, 'host cannot be removed')
})

test('facilitator AAR and all individual AARs are host-only after ENDEX', { skip }, async () => {
  const host = await call({ action: 'create', scenario: 'mci', jurisdiction: 'Mid-Size City', difficulty: 'Standard', hostName: 'Host', hostMode: 'Facilitator only' })
  const code = host.room.roomCode
  const a = await call({ action: 'join', code, name: 'A', role: 'EOC Director' })
  const b = await call({ action: 'join', code, name: 'B', role: 'Public Information Officer' })
  let r = await call({ action: 'start', code, playerId: host.playerId, playerToken: host.playerToken, sharedScenario: { world: { location: 'x' }, selectedLocation: { label: 'x' } } })
  assert.equal(r.ok, true)
  r = await call({ action: 'beginEndex', code, playerId: host.playerId, playerToken: host.playerToken })
  assert.equal(r.ok, true)
  assert.ok(r.aarContext.players.every(p => p.token === undefined))
  r = await call({ action: 'completeEndex', code, playerId: host.playerId, playerToken: host.playerToken, teamAar: { situationSummary: 'team' }, individualAars: { [a.playerId]: { strengths: 'A only' }, [b.playerId]: { strengths: 'B only' } }, facilitatorAar: { notes: 'facilitator only' } })
  assert.equal(r.ok, true)
  assert.equal(r.room.facilitatorAar.notes, 'facilitator only')

  const asA = await get({ code, playerId: a.playerId, playerToken: a.playerToken })
  assert.equal(asA.room.individualAar.strengths, 'A only')
  assert.deepEqual(asA.room.allIndividualAars, {})
  assert.equal(asA.room.facilitatorAar, null)
  assert.equal(asA.room.teamAar.situationSummary, 'team')
  const anon = await get({ code })
  assert.equal(anon.room.teamAar, null)
  assert.equal(anon.room.individualAar, null)
})

test('private role updates: each player sees only their own, host sees all, anonymous sees none', { skip }, async () => {
  const host = await call({ action: 'create', scenario: 'hazmat', jurisdiction: 'Mid-Size City', difficulty: 'Standard', hostName: 'Host', hostRole: 'EOC Director' })
  const code = host.room.roomCode
  const ops = await call({ action: 'join', code, name: 'Tim', role: 'Operations Section Chief' })
  const pio = await call({ action: 'join', code, name: 'Pat', role: 'Public Information Officer' })
  await call({ action: 'start', code, playerId: host.playerId, playerToken: host.playerToken, sharedScenario: { world: { location: 'x' }, selectedLocation: { label: 'x' } } })
  for (const p of [host, ops, pio]) {
    const r = await call({ action: 'submitResponse', code, playerId: p.playerId, playerToken: p.playerToken, turn: 0, response: 'Direction' })
    assert.equal(r.ok, true)
  }
  let r = await call({ action: 'beginAdvance', code, playerId: host.playerId, playerToken: host.playerToken, turn: 0 })
  assert.equal(r.ok, true)
  r = await call({
    action: 'completeTurn', code, playerId: host.playerId, playerToken: host.playerToken, turn: 0,
    sharedTurnState: { turn: 1, situation: 'DEVELOPING', terminal: [{ type: 'consequence', text: 'Shared assessment', turn: 1 }] },
    roleUpdates: [
      { playerId: host.playerId, text: 'Director update' },
      { playerId: ops.playerId, text: 'Ops update' },
      { playerId: pio.playerId, text: 'PIO update' },
      { playerId: 'not-a-player', text: 'Injected' },
      { playerId: ops.playerId, text: 'Duplicate for ops' },
    ],
  })
  assert.equal(r.ok, true)

  const asHost = await get({ code, playerId: host.playerId, playerToken: host.playerToken })
  assert.deepEqual(asHost.room.roleUpdates['1'].map(u => u.text), ['Director update', 'Ops update', 'PIO update'])
  assert.equal(asHost.room.roleUpdates['1'][1].role, 'Operations Section Chief')

  const asOps = await get({ code, playerId: ops.playerId, playerToken: ops.playerToken })
  assert.deepEqual(asOps.room.roleUpdates['1'].map(u => u.text), ['Ops update'])
  assert.equal(asOps.room.sharedTurnState.terminal[0].text, 'Shared assessment')
  assert.ok(!JSON.stringify(asOps.room).includes('PIO update'))
  assert.ok(!JSON.stringify(asOps.room).includes('Director update'))

  const asPio = await get({ code, playerId: pio.playerId, playerToken: pio.playerToken })
  assert.deepEqual(asPio.room.roleUpdates['1'].map(u => u.text), ['PIO update'])

  const anon = await get({ code })
  assert.deepEqual(anon.room.roleUpdates, {})

  r = await call({ action: 'beginEndex', code, playerId: host.playerId, playerToken: host.playerToken })
  assert.equal(r.aarContext.roleUpdates['1'].length, 3)
})

test('markStarting is host only, visible to players, and cleared on start', { skip }, async () => {
  const host = await call({ action: 'create', scenario: 'flood', jurisdiction: 'Mid-Size City', difficulty: 'Standard', hostName: 'Host', hostRole: 'EOC Director' })
  const code = host.room.roomCode
  const p = await call({ action: 'join', code, name: 'Tim', role: 'ESF-9 — Search & Rescue' })
  let r = await call({ action: 'markStarting', code, playerId: p.playerId, playerToken: p.playerToken, starting: true })
  assert.equal(r.status, 403)
  r = await call({ action: 'markStarting', code, playerId: host.playerId, playerToken: host.playerToken, starting: true })
  assert.equal(r.ok, true)
  const asPlayer = await get({ code, playerId: p.playerId, playerToken: p.playerToken })
  assert.ok(asPlayer.room.startingAt)
  r = await call({ action: 'start', code, playerId: host.playerId, playerToken: host.playerToken, sharedScenario: { world: { location: 'x' }, selectedLocation: { label: 'x' } } })
  assert.equal(r.room.startingAt, null)
})
