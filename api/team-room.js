// NEXUS EOC Team Rooms API
// Uses REDIS_URL from Vercel Redis / Redis Cloud (see server/redis.js).
//
// Authorization model
// -------------------
// Every participant receives a secret `playerToken` when they create or join a
// room. The token is returned once to that participant and is never included in
// any room view. Every state-changing action must carry `playerId` plus the
// matching `playerToken`; host-only actions additionally require that player to
// be the host. Reads without a valid token see only the public lobby view
// (roster, status, exercise setup, turn counters), never private messages,
// individual AARs, or the facilitator AAR.

const crypto = require('node:crypto');
const { redisCommands } = require('../server/redis.js');

const ROOM_TTL_SECONDS = 60 * 60 * 12; // 12 hours
const MAX_PLAYERS = 8;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
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

function makePlayerToken() {
  return crypto.randomBytes(24).toString('hex');
}

function roomKey(code) {
  return `nexus:eoc:team-room:${normalizeRoomCode(code)}`;
}

function authError(message) {
  const err = new Error(message);
  err.statusCode = 403;
  return err;
}

function tokensMatch(expected, supplied) {
  if (!expected || !supplied) return false;
  const a = Buffer.from(String(expected));
  const b = Buffer.from(String(supplied));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Resolves the acting player from playerId + playerToken. Returns null when the
// credentials do not identify an active participant.
function authenticate(room, playerId, playerToken) {
  const id = String(playerId || '').trim();
  if (!id) return null;
  const player = (room.players || []).find((item) => item.id === id && item.status !== 'removed');
  if (!player || !tokensMatch(player.token, playerToken)) return null;
  return player;
}

function requirePlayer(room, body) {
  const player = authenticate(room, body.playerId, body.playerToken);
  if (!player) throw authError('Player credentials are missing or invalid');
  return player;
}

function requireHost(room, body, message = 'Only the host can perform this action') {
  const player = requirePlayer(room, body);
  if (!player.isHost) throw authError(message);
  return player;
}

function publicPlayer(player) {
  const { token, ...rest } = player;
  return rest;
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

// `viewer` must be a player object returned by authenticate(); anonymous callers
// pass null and receive the public lobby view only.
function publicRoom(room, viewer = null) {
  const viewerId = viewer?.id || '';
  const viewerIsHost = Boolean(viewer?.isHost);
  const messages = viewer
    ? (room.messages || []).filter((message) => {
        if (message.channel === 'room') return true;
        return message.senderId === viewerId || message.recipientId === viewerId;
      })
    : [];
  const viewerIndividualAar = viewerId ? (room.individualAars || {})[viewerId] || null : null;
  return {
    roomCode: room.roomCode,
    status: room.status,
    exercise: room.exercise,
    players: (room.players || []).map(publicPlayer),
    sharedNotes: room.sharedNotes || [],
    sharedScenario: viewer ? (room.sharedScenario || null) : null,
    turn: Number(room.turn || 0),
    turnStatus: room.turnStatus || 'collecting',
    submissions: (room.submissions || []).map(({ response, ...submission }) => submission),
    sharedTurnState: viewer ? (room.sharedTurnState || null) : null,
    messages,
    chatSettings: room.chatSettings || { includePrivateMessagesInTranscript: false },
    teamAar: viewer ? (room.teamAar || null) : null,
    individualAar: viewerIndividualAar,
    allIndividualAars: viewerIsHost ? (room.individualAars || {}) : {},
    facilitatorAar: viewerIsHost ? (room.facilitatorAar || null) : null,
    communicationsLog: viewerIsHost ? (room.communicationsLog || []) : [],
    endedAt: room.endedAt || null,
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
      specificJurisdiction: String(body.specificJurisdiction || body.exercise?.specificJurisdiction || '').trim(),
      localPlan: body.localPlan || body.exercise?.localPlan || null,
      customScenario: body.customScenario || body.exercise?.customScenario || null,
      hostMode,
    },
    players: [],
    sharedNotes: [],
    messages: [],
    chatSettings: { includePrivateMessagesInTranscript: false },
    submissions: [],
    submissionHistory: [],
    teamAar: null,
    individualAars: {},
    facilitatorAar: null,
    communicationsLog: [],
    turn: 0,
    turnStatus: 'collecting',
    sharedTurnState: null,
    createdAt: now,
    updatedAt: now,
  };

  const host = {
    id: makePlayerId(),
    token: makePlayerToken(),
    name: hostName,
    role: hostPlays ? hostRole : '',
    isHost: true,
    status: hostPlays ? 'ready' : 'facilitator',
    joinedAt: now,
  };
  room.players.push(host);

  await redisSaveRoom(room);
  return { ok: true, playerId: host.id, playerToken: host.token, player: publicPlayer(host), room: publicRoom(room, host) };
}

async function handleGet(code, playerId = '', playerToken = '') {
  const room = await redisGetRoom(code);
  if (!room) return { ok: false, error: 'Room not found', statusCode: 404 };
  const viewer = authenticate(room, playerId, playerToken);
  if (playerId && !viewer) return { ok: false, error: 'Player credentials are missing or invalid', statusCode: 403 };
  return { ok: true, room: publicRoom(room, viewer) };
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
  if (activePlayers.length >= MAX_PLAYERS) throw new Error(`This team room already has ${MAX_PLAYERS} active roles`);
  validateRoleAvailable(room, role);

  const now = new Date().toISOString();
  const player = {
    id: makePlayerId(),
    token: makePlayerToken(),
    name,
    role,
    isHost: false,
    status: 'ready',
    joinedAt: now,
  };

  room.players.push(player);
  await redisSaveRoom(room);
  return { ok: true, playerId: player.id, playerToken: player.token, player: publicPlayer(player), room: publicRoom(room, player) };
}

async function handleUpdateRole(body) {
  const roomCode = normalizeRoomCode(body.roomCode || body.code);
  const role = String(body.role || '').trim();
  if (!roomCode) throw new Error('Room code is required');
  if (!role) throw new Error('Role is required');

  const room = await redisGetRoom(roomCode);
  if (!room) return { ok: false, error: 'Room not found', statusCode: 404 };

  const actor = requirePlayer(room, body);
  const targetId = String(body.targetPlayerId || actor.id).trim();
  if (targetId !== actor.id && !actor.isHost) throw authError('Only the host can change another player\'s role');
  const player = room.players.find((item) => item.id === targetId && item.status !== 'removed');
  if (!player) throw new Error('Player not found');
  validateRoleAvailable(room, role, targetId);

  player.role = role;
  player.status = 'ready';
  await redisSaveRoom(room);
  return { ok: true, room: publicRoom(room, actor) };
}

async function handleRemovePlayer(body) {
  const roomCode = normalizeRoomCode(body.roomCode || body.code);
  if (!roomCode) throw new Error('Room code is required');
  const targetId = String(body.targetPlayerId || '').trim();
  if (!targetId) throw new Error('Target player ID is required');

  const room = await redisGetRoom(roomCode);
  if (!room) return { ok: false, error: 'Room not found', statusCode: 404 };

  const host = requireHost(room, body, 'Only the host can remove players');
  room.players = room.players.filter((player) => player.id !== targetId || player.isHost);
  await redisSaveRoom(room);
  return { ok: true, room: publicRoom(room, host) };
}

async function handleStart(body) {
  const roomCode = normalizeRoomCode(body.roomCode || body.code);
  const sharedScenario = body.sharedScenario;
  const room = await redisGetRoom(roomCode);
  if (!room) return { ok: false, error: 'Room not found', statusCode: 404 };
  const host = requireHost(room, body, 'Only the host can start the Team Exercise');

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
  room.submissionHistory = [];
  room.teamAar = null;
  room.individualAars = {};
  room.facilitatorAar = null;
  room.communicationsLog = [];
  room.sharedTurnState = null;
  room.startedAt = new Date().toISOString();
  await redisSaveRoom(room);
  return { ok: true, room: publicRoom(room, host) };
}


async function handleSubmitResponse(body) {
  const roomCode = normalizeRoomCode(body.roomCode || body.code);
  const response = String(body.response || '').trim();
  const expectedTurn = Number(body.turn);
  if (!roomCode) throw new Error('Room code is required');
  if (!response) throw new Error('Response is required');

  const room = await redisGetRoom(roomCode);
  if (!room) return { ok:false, error:'Room not found', statusCode:404 };
  const player = requirePlayer(room, body);
  if (!player.role) throw new Error('Active player not found');
  const playerId = player.id;
  if (room.status !== 'active') throw new Error('Team exercise is not active');
  if (Number(room.turn || 0) !== expectedTurn) throw new Error('This turn has already advanced');
  if ((room.turnStatus || 'collecting') !== 'collecting') throw new Error('The team turn is already being processed');

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
  return { ok:true, room:publicRoom(room, player) };
}

async function handleBeginAdvance(body) {
  const roomCode = normalizeRoomCode(body.roomCode || body.code);
  const expectedTurn = Number(body.turn);
  const room = await redisGetRoom(roomCode);
  if (!room) return { ok:false, error:'Room not found', statusCode:404 };
  const host = requireHost(room, body, 'Only the host can advance the team turn');
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
  return { ok:true, submissions, room:publicRoom(room, host) };
}

async function handleCompleteTurn(body) {
  const roomCode = normalizeRoomCode(body.roomCode || body.code);
  const expectedTurn = Number(body.turn);
  const sharedTurnState = body.sharedTurnState;
  const room = await redisGetRoom(roomCode);
  if (!room) return { ok:false, error:'Room not found', statusCode:404 };
  const host = requireHost(room, body, 'Only the host can complete the team turn');
  if (Number(room.turn || 0) !== expectedTurn) throw new Error('This turn has already advanced');
  if (!sharedTurnState || Number(sharedTurnState.turn) !== expectedTurn + 1) throw new Error('Valid shared turn state is required');

  const completedSubmissions = (room.submissions || []).filter((item) => item.turn === expectedTurn);
  room.submissionHistory = [...(room.submissionHistory || []), ...completedSubmissions].slice(-500);
  room.sharedTurnState = sharedTurnState;
  room.turn = expectedTurn + 1;
  room.turnStatus = 'collecting';
  room.submissions = [];
  room.processingStartedAt = null;
  if (sharedTurnState.situation === 'ENDEX') room.status = 'ended';
  await redisSaveRoom(room);
  return { ok:true, room:publicRoom(room, host) };
}

async function handleCancelAdvance(body) {
  const roomCode = normalizeRoomCode(body.roomCode || body.code);
  const room = await redisGetRoom(roomCode);
  if (!room) return { ok:false, error:'Room not found', statusCode:404 };
  const host = requireHost(room, body, 'Only the host can reset the team turn');
  room.turnStatus = 'collecting';
  room.processingStartedAt = null;
  if (room.status === 'ending') {
    room.status = 'active';
    room.endexStartedAt = null;
  }
  await redisSaveRoom(room);
  return { ok:true, room:publicRoom(room, host) };
}


async function handleBeginEndex(body) {
  const roomCode = normalizeRoomCode(body.roomCode || body.code);
  const room = await redisGetRoom(roomCode);
  if (!room) return { ok:false, error:'Room not found', statusCode:404 };
  const host = requireHost(room, body, 'Only the host can end the Team Exercise');
  if (room.status !== 'active') throw new Error('Team exercise is not active');
  if ((room.turnStatus || 'collecting') === 'processing') throw new Error('Wait for the current team turn to finish');

  const includePrivate = Boolean(room.chatSettings?.includePrivateMessagesInTranscript);
  const communications = (room.messages || []).filter((message) => message.channel === 'room' || includePrivate);
  room.status = 'ending';
  room.turnStatus = 'processing';
  room.processingStartedAt = new Date().toISOString();
  room.endexStartedAt = room.processingStartedAt;
  await redisSaveRoom(room);
  return {
    ok:true,
    room:publicRoom(room, host),
    aarContext: {
      players: room.players.filter((player) => player.status !== 'removed').map(publicPlayer),
      submissionHistory: room.submissionHistory || [],
      currentSubmissions: room.submissions || [],
      communications,
      chatSettings: room.chatSettings || { includePrivateMessagesInTranscript:false },
      sharedScenario: room.sharedScenario || null,
      sharedTurnState: room.sharedTurnState || null,
      turn: Number(room.turn || 0),
    },
  };
}

async function handleCompleteEndex(body) {
  const roomCode = normalizeRoomCode(body.roomCode || body.code);
  const room = await redisGetRoom(roomCode);
  if (!room) return { ok:false, error:'Room not found', statusCode:404 };
  const host = requireHost(room, body, 'Only the host can complete Team ENDEX');
  if (!body.teamAar || typeof body.teamAar !== 'object') throw new Error('Team AAR is required');

  const individualAars = body.individualAars && typeof body.individualAars === 'object' ? body.individualAars : {};
  // ENDEX is a lifecycle/control event, not an operational player turn.
  // Preserve the last completed operational turn and simulated time exactly.
  const finalTurn = Number(room.turn || 0);
  const finalTime = String(body.simTime || room.sharedTurnState?.simTime || 'ENDEX');
  const finalTranscript = Array.isArray(body.exerciseTranscript) ? body.exerciseTranscript : (room.sharedTurnState?.exerciseTranscript || []);

  room.teamAar = body.teamAar;
  room.individualAars = individualAars;
  room.facilitatorAar = body.facilitatorAar || null;
  room.communicationsLog = Array.isArray(body.communicationsLog) ? body.communicationsLog : [];
  room.status = 'ended';
  room.turnStatus = 'complete';
  room.turn = finalTurn;
  room.endedAt = new Date().toISOString();
  room.processingStartedAt = null;
  room.endexStartedAt = null;
  room.sharedTurnState = {
    ...(room.sharedTurnState || {}),
    turn: finalTurn,
    simTime: finalTime,
    situation: 'ENDEX',
    aar: body.teamAar,
    exerciseTranscript: finalTranscript,
  };
  await redisSaveRoom(room);
  return { ok:true, room:publicRoom(room, host) };
}

async function handleSendMessage(body) {
  const roomCode = normalizeRoomCode(body.roomCode || body.code);
  const text = String(body.message || body.text || '').trim();
  const channel = body.channel === 'direct' ? 'direct' : 'room';
  const recipientId = channel === 'direct' ? String(body.recipientId || '').trim() : '';
  if (!roomCode) throw new Error('Room code is required');
  if (!text) throw new Error('Message is required');
  if (text.length > 1000) throw new Error('Message must be 1000 characters or fewer');

  const room = await redisGetRoom(roomCode);
  if (!room) return { ok:false, error:'Room not found', statusCode:404 };
  const sender = requirePlayer(room, body);
  const senderId = sender.id;
  if (room.status !== 'active') throw new Error('Team chat is available during an active exercise');
  let recipient = null;
  if (channel === 'direct') {
    recipient = room.players.find((player) => player.id === recipientId && player.status !== 'removed');
    if (!recipient || recipient.id === senderId) throw new Error('Select another active player');
  }

  const message = {
    id: crypto.randomBytes(10).toString('hex'),
    channel,
    senderId,
    senderName: sender.name,
    senderRole: sender.role || 'Facilitator',
    recipientId: recipient?.id || '',
    recipientName: recipient?.name || '',
    recipientRole: recipient?.role || '',
    text,
    createdAt: new Date().toISOString(),
  };
  room.messages = [...(room.messages || []), message].slice(-500);
  await redisSaveRoom(room);
  return { ok:true, message, room:publicRoom(room, sender) };
}

async function handleUpdateChatSettings(body) {
  const roomCode = normalizeRoomCode(body.roomCode || body.code);
  const room = await redisGetRoom(roomCode);
  if (!room) return { ok:false, error:'Room not found', statusCode:404 };
  const host = requireHost(room, body, 'Only the host can change transcript chat settings');
  room.chatSettings = {
    ...(room.chatSettings || {}),
    includePrivateMessagesInTranscript: Boolean(body.includePrivateMessagesInTranscript),
  };
  await redisSaveRoom(room);
  return { ok:true, room:publicRoom(room, host) };
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
      const result = await handleGet(code, req.query?.playerId || '', req.query?.playerToken || '');
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
        result = await handleGet(body.roomCode || body.code, body.playerId || '', body.playerToken || '');
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
      case 'beginEndex':
        result = await handleBeginEndex(body);
        break;
      case 'completeEndex':
        result = await handleCompleteEndex(body);
        break;
      case 'sendMessage':
        result = await handleSendMessage(body);
        break;
      case 'updateChatSettings':
        result = await handleUpdateChatSettings(body);
        break;
      default:
        throw new Error('Unknown team room action');
    }

    sendJson(res, result.statusCode || 200, result);
  } catch (err) {
    const infrastructure = /redis|timed out/i.test(String(err.message || ''));
    const statusCode = err.statusCode || (infrastructure ? 503 : 400);
    if (statusCode >= 500) console.error('team-room error', err);
    sendJson(res, statusCode, {
      ok: false,
      error: err.message || 'Team room request failed',
    });
  }
};
