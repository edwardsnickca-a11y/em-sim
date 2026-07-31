// NEXUS EOC Team Rooms API
// Uses REDIS_URL from Vercel Redis / Redis Cloud.
// No npm dependency required. Supports redis:// and rediss:// URLs.

const net = require('node:net');
const tls = require('node:tls');
const crypto = require('node:crypto');

const ROOM_TTL_SECONDS = 60 * 60 * 12; // 12 hours
const REDIS_TIMEOUT_MS = 8000;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function normalizeRoomCode(value) {
  return String(value || '').trim().toUpperCase();
}

function makeRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i += 1) {
    code += alphabet[crypto.randomInt(0, alphabet.length)];
    if (i === 3) code += '-';
  }
  return code;
}

function makePlayerId() {
  return crypto.randomBytes(8).toString('hex');
}

function roomKey(code) {
  return `nexus:eoc:team-room:${normalizeRoomCode(code)}`;
}

function encodeRedisCommand(args) {
  const parts = [`*${args.length}\r\n`];
  for (const arg of args) {
    const value = Buffer.from(String(arg));
    parts.push(`$${value.length}\r\n`);
    parts.push(value);
    parts.push('\r\n');
  }
  return Buffer.concat(parts.map((part) => Buffer.isBuffer(part) ? part : Buffer.from(part)));
}

class RespParser {
  constructor() {
    this.buffer = Buffer.alloc(0);
  }

  push(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
  }

  readLine(offset) {
    const end = this.buffer.indexOf('\r\n', offset);
    if (end === -1) return null;
    return {
      line: this.buffer.slice(offset, end).toString('utf8'),
      next: end + 2,
    };
  }

  parseAt(offset = 0) {
    if (this.buffer.length <= offset) return null;
    const type = String.fromCharCode(this.buffer[offset]);

    if (type === '+') {
      const line = this.readLine(offset + 1);
      if (!line) return null;
      return { value: line.line, next: line.next };
    }

    if (type === '-') {
      const line = this.readLine(offset + 1);
      if (!line) return null;
      throw new Error(line.line || 'Redis error');
    }

    if (type === ':') {
      const line = this.readLine(offset + 1);
      if (!line) return null;
      return { value: Number(line.line), next: line.next };
    }

    if (type === '$') {
      const line = this.readLine(offset + 1);
      if (!line) return null;
      const length = Number(line.line);
      if (length === -1) return { value: null, next: line.next };
      const start = line.next;
      const end = start + length;
      if (this.buffer.length < end + 2) return null;
      return {
        value: this.buffer.slice(start, end).toString('utf8'),
        next: end + 2,
      };
    }

    if (type === '*') {
      const line = this.readLine(offset + 1);
      if (!line) return null;
      const count = Number(line.line);
      if (count === -1) return { value: null, next: line.next };
      const values = [];
      let next = line.next;
      for (let i = 0; i < count; i += 1) {
        const parsed = this.parseAt(next);
        if (!parsed) return null;
        values.push(parsed.value);
        next = parsed.next;
      }
      return { value: values, next };
    }

    throw new Error(`Unsupported Redis response type: ${type}`);
  }

  shiftParsed() {
    const parsed = this.parseAt(0);
    if (!parsed) return null;
    this.buffer = this.buffer.slice(parsed.next);
    return parsed.value;
  }
}

async function redisCommands(commandList) {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL is not configured for this deployment');
  }

  const parsedUrl = new URL(redisUrl);
  const isTls = parsedUrl.protocol === 'rediss:';
  const port = Number(parsedUrl.port || (isTls ? 6380 : 6379));
  const host = parsedUrl.hostname;
  const username = decodeURIComponent(parsedUrl.username || '');
  const password = decodeURIComponent(parsedUrl.password || '');
  const db = parsedUrl.pathname && parsedUrl.pathname !== '/' ? parsedUrl.pathname.slice(1) : '';

  return new Promise((resolve, reject) => {
    const socket = isTls
      ? tls.connect({ host, port, servername: host, timeout: REDIS_TIMEOUT_MS })
      : net.connect({ host, port, timeout: REDIS_TIMEOUT_MS });

    const parser = new RespParser();
    const queue = [];
    let settled = false;

    function fail(err) {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(err);
    }

    function finish(value) {
      if (settled) return;
      settled = true;
      socket.end();
      resolve(value);
    }

    function writeCommand(args) {
      socket.write(encodeRedisCommand(args));
    }

    function runNext(previousValue) {
      if (queue.length === 0) return finish(previousValue);
      const next = queue.shift();
      writeCommand(next);
    }

    socket.on('connect', () => {
      if (password) {
        queue.push(username ? ['AUTH', username, password] : ['AUTH', password]);
      }
      if (db) queue.push(['SELECT', db]);
      queue.push(...commandList);
      runNext();
    });

    socket.on('secureConnect', () => {
      // tls.connect emits secureConnect after connect. Commands are queued on connect above.
    });

    socket.on('data', (chunk) => {
      try {
        parser.push(chunk);
        let value;
        while ((value = parser.shiftParsed()) !== null) {
          if (queue.length === 0) {
            finish(value);
            return;
          }
          runNext(value);
        }
      } catch (err) {
        fail(err);
      }
    });

    socket.on('timeout', () => fail(new Error('Redis request timed out')));
    socket.on('error', fail);
  });
}

async function redisGetRoom(code) {
  const raw = await redisCommands([['GET', roomKey(code)]]);
  if (!raw) return null;
  return JSON.parse(raw);
}

async function redisSaveRoom(room) {
  room.updatedAt = new Date().toISOString();
  await redisCommands([
    ['SET', roomKey(room.roomCode), JSON.stringify(room), 'EX', ROOM_TTL_SECONDS],
  ]);
  return room;
}

function publicRoom(room) {
  return {
    roomCode: room.roomCode,
    status: room.status,
    exercise: room.exercise,
    players: room.players,
    sharedNotes: room.sharedNotes || [],
    sharedScenario: room.sharedScenario || null,
    turn: Number(room.turn || 0),
    turnStatus: room.turnStatus || 'collecting',
    submissions: (room.submissions || []).map(({ response, ...submission }) => submission),
    sharedTurnState: room.sharedTurnState || null,
    startedAt: room.startedAt || null,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
}

function validateRoleAvailable(room, role, currentPlayerId = null) {
  if (!role) return;
  const duplicate = room.players.find((player) => player.role === role && player.id !== currentPlayerId);
  if (duplicate) {
    throw new Error('That role is already taken');
  }
}

async function handleCreate(body) {
  const roomCode = normalizeRoomCode(body.roomCode || makeRoomCode());
  const now = new Date().toISOString();
  const hostMode = body.hostMode || body.exercise?.hostMode || 'Host will play a role';
  const hostPlays = !String(hostMode).toLowerCase().includes('facilitator');
  const hostName = String(body.hostName || 'Host').trim() || 'Host';
  const hostRole = hostPlays ? String(body.hostRole || body.role || 'EOC Director').trim() : '';

  const room = {
    roomCode,
    status: 'lobby',
    exercise: {
      scenario: body.scenario || body.exercise?.scenario || '',
      jurisdiction: body.jurisdiction || body.exercise?.jurisdiction || '',
      difficulty: body.difficulty || body.exercise?.difficulty || '',
      trainingFocus: body.trainingFocus || body.exercise?.trainingFocus || '',
      hostMode,
    },
    players: [],
    sharedNotes: [],
    submissions: [],
    turn: 0,
    turnStatus: 'collecting',
    sharedTurnState: null,
    createdAt: now,
    updatedAt: now,
  };

  if (hostPlays) {
    room.players.push({
      id: body.hostPlayerId || makePlayerId(),
      name: hostName,
      role: hostRole,
      isHost: true,
      status: 'ready',
      joinedAt: now,
    });
  } else {
    room.players.push({
      id: body.hostPlayerId || makePlayerId(),
      name: hostName,
      role: '',
      isHost: true,
      status: 'facilitator',
      joinedAt: now,
    });
  }

  await redisSaveRoom(room);
  return { ok: true, playerId: room.players[0]?.id || null, room: publicRoom(room) };
}

async function handleGet(code) {
  const room = await redisGetRoom(code);
  if (!room) return { ok: false, error: 'Room not found', statusCode: 404 };
  return { ok: true, room: publicRoom(room) };
}

async function handleJoin(body) {
  const roomCode = normalizeRoomCode(body.roomCode || body.code);
  const name = String(body.name || body.playerName || '').trim();
  const role = String(body.role || '').trim();

  if (!roomCode) throw new Error('Room code is required');
  if (!name) throw new Error('Player name is required');
  if (!role) throw new Error('Role selection is required');

  const room = await redisGetRoom(roomCode);
  if (!room) return { ok: false, error: 'Room not found', statusCode: 404 };
  if (room.status !== 'lobby') throw new Error('This room is not accepting new players');

  const activePlayers = room.players.filter((player) => player.status !== 'removed');
  if (activePlayers.length >= 8) throw new Error('This team room already has 8 active roles');
  validateRoleAvailable(room, role);

  const now = new Date().toISOString();
  const player = {
    id: body.playerId || makePlayerId(),
    name,
    role,
    isHost: false,
    status: 'ready',
    joinedAt: now,
  };

  room.players.push(player);
  await redisSaveRoom(room);
  return { ok: true, playerId: player.id, player, room: publicRoom(room) };
}

async function handleUpdateRole(body) {
  const roomCode = normalizeRoomCode(body.roomCode || body.code);
  const playerId = String(body.playerId || '').trim();
  const role = String(body.role || '').trim();

  if (!roomCode) throw new Error('Room code is required');
  if (!playerId) throw new Error('Player ID is required');
  if (!role) throw new Error('Role is required');

  const room = await redisGetRoom(roomCode);
  if (!room) return { ok: false, error: 'Room not found', statusCode: 404 };

  const player = room.players.find((item) => item.id === playerId);
  if (!player) throw new Error('Player not found');
  validateRoleAvailable(room, role, playerId);

  player.role = role;
  player.status = 'ready';
  await redisSaveRoom(room);
  return { ok: true, room: publicRoom(room) };
}

async function handleRemovePlayer(body) {
  const roomCode = normalizeRoomCode(body.roomCode || body.code);
  const playerId = String(body.playerId || '').trim();

  if (!roomCode) throw new Error('Room code is required');
  if (!playerId) throw new Error('Player ID is required');

  const room = await redisGetRoom(roomCode);
  if (!room) return { ok: false, error: 'Room not found', statusCode: 404 };

  room.players = room.players.filter((player) => player.id !== playerId || player.isHost);
  await redisSaveRoom(room);
  return { ok: true, room: publicRoom(room) };
}

async function handleStart(body) {
  const roomCode = normalizeRoomCode(body.roomCode || body.code);
  const sharedScenario = body.sharedScenario;
  const room = await redisGetRoom(roomCode);
  if (!room) return { ok: false, error: 'Room not found', statusCode: 404 };

  const activePlayers = room.players.filter((player) => player.status !== 'removed' && player.role);
  if (activePlayers.length < 2) throw new Error('At least 2 active player roles are required to start');
  if (!sharedScenario || !sharedScenario.world || !sharedScenario.selectedLocation) {
    throw new Error('Shared scenario package is required to start the room');
  }

  room.sharedScenario = sharedScenario;
  room.status = 'active';
  room.turn = 0;
  room.turnStatus = 'collecting';
  room.submissions = [];
  room.sharedTurnState = null;
  room.startedAt = new Date().toISOString();
  await redisSaveRoom(room);
  return { ok: true, room: publicRoom(room) };
}


async function handleSubmitResponse(body) {
  const roomCode = normalizeRoomCode(body.roomCode || body.code);
  const playerId = String(body.playerId || '').trim();
  const response = String(body.response || '').trim();
  const expectedTurn = Number(body.turn);
  if (!roomCode) throw new Error('Room code is required');
  if (!playerId) throw new Error('Player ID is required');
  if (!response) throw new Error('Response is required');

  const room = await redisGetRoom(roomCode);
  if (!room) return { ok:false, error:'Room not found', statusCode:404 };
  if (room.status !== 'active') throw new Error('Team exercise is not active');
  if (Number(room.turn || 0) !== expectedTurn) throw new Error('This turn has already advanced');
  if ((room.turnStatus || 'collecting') !== 'collecting') throw new Error('The team turn is already being processed');

  const player = room.players.find((item) => item.id === playerId && item.status !== 'removed');
  if (!player || !player.role) throw new Error('Active player not found');

  room.submissions = (room.submissions || []).filter((item) => !(item.turn === expectedTurn && item.playerId === playerId));
  room.submissions.push({
    turn: expectedTurn,
    playerId,
    playerName: player.name,
    playerRole: player.role,
    response,
    submittedAt: new Date().toISOString(),
  });
  await redisSaveRoom(room);
  return { ok:true, room:publicRoom(room) };
}

async function handleBeginAdvance(body) {
  const roomCode = normalizeRoomCode(body.roomCode || body.code);
  const hostPlayerId = String(body.playerId || body.hostPlayerId || '').trim();
  const expectedTurn = Number(body.turn);
  const room = await redisGetRoom(roomCode);
  if (!room) return { ok:false, error:'Room not found', statusCode:404 };
  const host = room.players.find((item) => item.id === hostPlayerId && item.isHost);
  if (!host) throw new Error('Only the host can advance the team turn');
  if (room.status !== 'active') throw new Error('Team exercise is not active');
  if (Number(room.turn || 0) !== expectedTurn) throw new Error('This turn has already advanced');
  if ((room.turnStatus || 'collecting') !== 'collecting') throw new Error('The team turn is already being processed');

  const activePlayers = room.players.filter((player) => player.status !== 'removed' && player.role);
  const submissions = (room.submissions || []).filter((item) => item.turn === expectedTurn);
  const submittedIds = new Set(submissions.map((item) => item.playerId));
  const missing = activePlayers.filter((player) => !submittedIds.has(player.id));
  if (missing.length) throw new Error(`Waiting for ${missing.map((player) => player.name || player.role).join(', ')}`);

  room.turnStatus = 'processing';
  room.processingStartedAt = new Date().toISOString();
  await redisSaveRoom(room);
  return { ok:true, submissions, room:publicRoom(room) };
}

async function handleCompleteTurn(body) {
  const roomCode = normalizeRoomCode(body.roomCode || body.code);
  const hostPlayerId = String(body.playerId || body.hostPlayerId || '').trim();
  const expectedTurn = Number(body.turn);
  const sharedTurnState = body.sharedTurnState;
  const room = await redisGetRoom(roomCode);
  if (!room) return { ok:false, error:'Room not found', statusCode:404 };
  const host = room.players.find((item) => item.id === hostPlayerId && item.isHost);
  if (!host) throw new Error('Only the host can complete the team turn');
  if (Number(room.turn || 0) !== expectedTurn) throw new Error('This turn has already advanced');
  if (!sharedTurnState || Number(sharedTurnState.turn) !== expectedTurn + 1) throw new Error('Valid shared turn state is required');

  room.sharedTurnState = sharedTurnState;
  room.turn = expectedTurn + 1;
  room.turnStatus = 'collecting';
  room.submissions = [];
  room.processingStartedAt = null;
  if (sharedTurnState.situation === 'ENDEX') room.status = 'ended';
  await redisSaveRoom(room);
  return { ok:true, room:publicRoom(room) };
}

async function handleCancelAdvance(body) {
  const roomCode = normalizeRoomCode(body.roomCode || body.code);
  const hostPlayerId = String(body.playerId || body.hostPlayerId || '').trim();
  const room = await redisGetRoom(roomCode);
  if (!room) return { ok:false, error:'Room not found', statusCode:404 };
  const host = room.players.find((item) => item.id === hostPlayerId && item.isHost);
  if (!host) throw new Error('Only the host can reset the team turn');
  room.turnStatus = 'collecting';
  room.processingStartedAt = null;
  await redisSaveRoom(room);
  return { ok:true, room:publicRoom(room) };
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method === 'GET') {
      const code = req.query?.code || req.query?.roomCode;
      const result = await handleGet(code);
      sendJson(res, result.statusCode || 200, result);
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { ok: false, error: 'Method not allowed' });
      return;
    }

    const body = await readBody(req);
    const action = String(body.action || '').trim();

    let result;
    switch (action) {
      case 'create':
      case 'createRoom':
        result = await handleCreate(body);
        break;
      case 'join':
      case 'joinRoom':
        result = await handleJoin(body);
        break;
      case 'get':
      case 'getRoom':
        result = await handleGet(body.roomCode || body.code);
        break;
      case 'updateRole':
        result = await handleUpdateRole(body);
        break;
      case 'removePlayer':
        result = await handleRemovePlayer(body);
        break;
      case 'start':
      case 'startRoom':
        result = await handleStart(body);
        break;
      case 'submitResponse':
        result = await handleSubmitResponse(body);
        break;
      case 'beginAdvance':
        result = await handleBeginAdvance(body);
        break;
      case 'completeTurn':
        result = await handleCompleteTurn(body);
        break;
      case 'cancelAdvance':
        result = await handleCancelAdvance(body);
        break;
      default:
        throw new Error('Unknown team room action');
    }

    sendJson(res, result.statusCode || 200, result);
  } catch (err) {
    console.error('team-room error', err);
    sendJson(res, 500, {
      ok: false,
      error: err.message || 'Team room request failed',
    });
  }
};
