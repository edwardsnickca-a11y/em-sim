import net from 'node:net'
import tls from 'node:tls'

const ROOM_TTL_SECONDS = 60 * 60 * 8
const ROOM_PREFIX = 'nexus:eoc:team-room:'

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) }
      catch (err) { reject(err) }
    })
    req.on('error', reject)
  })
}

function parseRedisUrl() {
  const raw = process.env.REDIS_URL
  if (!raw) throw new Error('REDIS_URL is not configured')
  const url = new URL(raw)
  return {
    secure: url.protocol === 'rediss:',
    host: url.hostname,
    port: Number(url.port || (url.protocol === 'rediss:' ? 6380 : 6379)),
    username: decodeURIComponent(url.username || 'default'),
    password: decodeURIComponent(url.password || ''),
  }
}

function encodeCommand(parts) {
  return `*${parts.length}\r\n${parts.map(part => {
    const s = String(part)
    return `$${Buffer.byteLength(s)}\r\n${s}\r\n`
  }).join('')}`
}

function decodeOne(buffer) {
  const text = buffer.toString('utf8')
  const lineEnd = text.indexOf('\r\n')
  if (lineEnd < 0) return undefined
  const prefix = text[0]
  const line = text.slice(1, lineEnd)
  if (prefix === '+') return line
  if (prefix === '-') throw new Error(line)
  if (prefix === ':') return Number(line)
  if (prefix === '$') {
    const len = Number(line)
    if (len === -1) return null
    const start = lineEnd + 2
    const end = start + len
    return text.slice(start, end)
  }
  throw new Error('Unexpected Redis response')
}

function redisCommand(...parts) {
  const cfg = parseRedisUrl()
  return new Promise((resolve, reject) => {
    const socket = cfg.secure
      ? tls.connect({ host: cfg.host, port: cfg.port, servername: cfg.host })
      : net.connect({ host: cfg.host, port: cfg.port })

    const chunks = []
    let settled = false
    const fail = (err) => {
      if (settled) return
      settled = true
      try { socket.destroy() } catch {}
      reject(err)
    }

    socket.setTimeout(6500, () => fail(new Error('Redis request timed out')))
    socket.on('error', fail)
    socket.on('connect', () => {
      const commands = []
      if (cfg.password) commands.push(['AUTH', cfg.username || 'default', cfg.password])
      commands.push(parts)
      socket.write(commands.map(encodeCommand).join(''))
    })
    socket.on('data', chunk => chunks.push(chunk))
    socket.on('end', () => {
      if (settled) return
      settled = true
      try {
        const combined = Buffer.concat(chunks)
        const text = combined.toString('utf8')
        if (cfg.password) {
          const firstEnd = text.indexOf('\r\n') + 2
          const rest = Buffer.from(text.slice(firstEnd), 'utf8')
          resolve(decodeOne(rest))
        } else {
          resolve(decodeOne(combined))
        }
      } catch (err) { reject(err) }
    })
  })
}

async function getRoom(code) {
  const cleanCode = normalizeCode(code)
  if (!cleanCode) return null
  const raw = await redisCommand('GET', ROOM_PREFIX + cleanCode)
  return raw ? JSON.parse(raw) : null
}

async function saveRoom(room) {
  const now = new Date().toISOString()
  const next = { ...room, updatedAt: now }
  await redisCommand('SET', ROOM_PREFIX + next.roomCode, JSON.stringify(next), 'EX', ROOM_TTL_SECONDS)
  return next
}

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase()
}

function makeRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)]
  out += '-'
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

function makePlayerId() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function sanitizeName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 80)
}

function roleTaken(room, role, exceptPlayerId = null) {
  return room.players.some(p => p.role === role && p.id !== exceptPlayerId)
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const room = await getRoom(req.query?.code)
      if (!room) return json(res, 404, { ok:false, error:'Room not found' })
      return json(res, 200, { ok:true, room })
    }

    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' })

    const body = await readBody(req)
    const action = body.action

    if (action === 'create') {
      const roomCode = makeRoomCode()
      const hostMode = body.hostMode === 'facilitator_only' ? 'facilitator_only' : 'host_player'
      const hostName = sanitizeName(body.hostName) || 'Host'
      const hostRole = String(body.hostRole || 'EOC Director')
      const now = new Date().toISOString()
      const players = hostMode === 'host_player'
        ? [{ id:'host', name:hostName, role:hostRole, isHost:true, status:'ready', joinedAt:now }]
        : []

      const room = {
        roomCode,
        status:'lobby',
        exercise:{
          scenario: body.scenario || 'hurricane',
          jurisdiction: body.jurisdiction || 'Mid-Size City',
          difficulty: body.difficulty || 'Standard',
          trainingFocus: body.trainingFocus || '',
          hostMode,
        },
        host:{ name:hostName, mode:hostMode, playerId:hostMode === 'host_player' ? 'host' : null },
        players,
        sharedNotes:[],
        submissions:[],
        createdAt:now,
        updatedAt:now,
      }
      const saved = await saveRoom(room)
      return json(res, 200, { ok:true, room:saved, playerId:hostMode === 'host_player' ? 'host' : null })
    }

    const code = normalizeCode(body.code)
    const room = await getRoom(code)
    if (!room) return json(res, 404, { ok:false, error:'Room not found' })
    if (room.status !== 'lobby' && action !== 'get') return json(res, 409, { ok:false, error:'Room is no longer open' })

    if (action === 'join') {
      const name = sanitizeName(body.name)
      const role = String(body.role || '').trim()
      if (!name) return json(res, 400, { ok:false, error:'Player name is required' })
      if (!role) return json(res, 400, { ok:false, error:'Role is required' })
      if (room.players.length >= 8) return json(res, 409, { ok:false, error:'Room already has 8 active roles' })
      if (roleTaken(room, role)) return json(res, 409, { ok:false, error:'That role is already taken' })

      const player = { id:makePlayerId(), name, role, isHost:false, status:'ready', joinedAt:new Date().toISOString() }
      const saved = await saveRoom({ ...room, players:[...room.players, player] })
      return json(res, 200, { ok:true, room:saved, playerId:player.id })
    }

    if (action === 'updateRole') {
      const playerId = String(body.playerId || '')
      const role = String(body.role || '').trim()
      if (!playerId || !role) return json(res, 400, { ok:false, error:'Player and role are required' })
      if (roleTaken(room, role, playerId)) return json(res, 409, { ok:false, error:'That role is already taken' })
      const saved = await saveRoom({ ...room, players:room.players.map(p => p.id === playerId ? { ...p, role, status:'ready' } : p) })
      return json(res, 200, { ok:true, room:saved })
    }

    if (action === 'removePlayer') {
      const playerId = String(body.playerId || '')
      if (!playerId || playerId === 'host') return json(res, 400, { ok:false, error:'Cannot remove the host-player here' })
      const saved = await saveRoom({ ...room, players:room.players.filter(p => p.id !== playerId) })
      return json(res, 200, { ok:true, room:saved })
    }

    return json(res, 400, { ok:false, error:'Unknown action' })
  } catch (err) {
    console.error('team-room error', err)
    return json(res, 500, { ok:false, error:err.message || 'Team room error' })
  }
}
