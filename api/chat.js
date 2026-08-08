const net = require('node:net');
const tls = require('node:tls');
const crypto = require('node:crypto');

const ANTHROPIC_TIMEOUT_MS = 105000;
const RATE_WINDOW_SECONDS = 10 * 60;
const RATE_LIMIT_REQUESTS = 120;
const REDIS_TIMEOUT_MS = 5000;
const MAX_REQUEST_CHARS = 250000;

// Serverless instances can be recycled at any time, so this is only a fallback
// for local development or a temporary Redis outage. Production rate limiting
// uses the same REDIS_URL already configured for Team Rooms.
const localRateBuckets = new Map();

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  Object.entries(extraHeaders).forEach(([key, value]) => res.setHeader(key, String(value)));
  res.end(JSON.stringify(payload));
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || String(req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown');
}

function rateKey(req) {
  const digest = crypto.createHash('sha256').update(clientIp(req)).digest('hex').slice(0, 24);
  const windowId = Math.floor(Date.now() / (RATE_WINDOW_SECONDS * 1000));
  return `nexus:eoc:chat-rate:${digest}:${windowId}`;
}

function encodeRedisCommand(args) {
  const parts = [`*${args.length}\r\n`];
  for (const arg of args) {
    const value = Buffer.from(String(arg));
    parts.push(`$${value.length}\r\n`, value, '\r\n');
  }
  return Buffer.concat(parts.map(part => Buffer.isBuffer(part) ? part : Buffer.from(part)));
}

function parseRedisValue(buffer) {
  const type = String.fromCharCode(buffer[0]);
  const end = buffer.indexOf('\r\n');
  if (end === -1) return undefined;
  const line = buffer.slice(1, end).toString('utf8');
  if (type === ':' || type === '+') return type === ':' ? Number(line) : line;
  if (type === '-') throw new Error(line || 'Redis error');
  if (type === '$') {
    const len = Number(line);
    if (len < 0) return null;
    const start = end + 2;
    if (buffer.length < start + len + 2) return undefined;
    return buffer.slice(start, start + len).toString('utf8');
  }
  return undefined;
}

async function redisCommand(args) {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) throw new Error('REDIS_URL is not configured');

  const parsedUrl = new URL(redisUrl);
  const isTls = parsedUrl.protocol === 'rediss:';
  const port = Number(parsedUrl.port || (isTls ? 6380 : 6379));
  const host = parsedUrl.hostname;
  const username = decodeURIComponent(parsedUrl.username || '');
  const password = decodeURIComponent(parsedUrl.password || '');
  const db = parsedUrl.pathname && parsedUrl.pathname !== '/' ? parsedUrl.pathname.slice(1) : '';
  const commands = [];
  if (password) commands.push(username ? ['AUTH', username, password] : ['AUTH', password]);
  if (db) commands.push(['SELECT', db]);
  commands.push(args);

  return new Promise((resolve, reject) => {
    const socket = isTls
      ? tls.connect({ host, port, servername: host, timeout: REDIS_TIMEOUT_MS })
      : net.connect({ host, port, timeout: REDIS_TIMEOUT_MS });
    let buffer = Buffer.alloc(0);
    let commandIndex = 0;
    let settled = false;

    const fail = err => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(err);
    };

    const finish = value => {
      if (settled) return;
      settled = true;
      socket.end();
      resolve(value);
    };

    const writeNext = () => socket.write(encodeRedisCommand(commands[commandIndex]));

    socket.on(isTls ? 'secureConnect' : 'connect', writeNext);
    socket.on('timeout', () => fail(new Error('Redis request timed out')));
    socket.on('error', fail);
    socket.on('data', chunk => {
      try {
        buffer = Buffer.concat([buffer, chunk]);
        const value = parseRedisValue(buffer);
        if (value === undefined) return;
        commandIndex += 1;
        buffer = Buffer.alloc(0);
        if (commandIndex >= commands.length) return finish(value);
        writeNext();
      } catch (err) {
        fail(err);
      }
    });
  });
}

function localRateLimit(key) {
  const now = Date.now();
  const expiresAt = now + RATE_WINDOW_SECONDS * 1000;
  const current = localRateBuckets.get(key);
  if (!current || current.expiresAt <= now) {
    localRateBuckets.set(key, { count: 1, expiresAt });
    return { allowed: true, count: 1 };
  }
  current.count += 1;
  return { allowed: current.count <= RATE_LIMIT_REQUESTS, count: current.count };
}

async function checkRateLimit(req) {
  const key = rateKey(req);
  try {
    const count = await redisCommand(['INCR', key]);
    if (count === 1) await redisCommand(['EXPIRE', key, RATE_WINDOW_SECONDS]);
    return { allowed: count <= RATE_LIMIT_REQUESTS, count, source: 'redis' };
  } catch (err) {
    console.warn('chat rate limiter falling back to local memory:', err.message);
    return { ...localRateLimit(key), source: 'local' };
  }
}

function validateRequestBody(body) {
  if (!body || typeof body !== 'object') return 'Invalid request body';
  if (typeof body.system !== 'string' || !Array.isArray(body.messages)) return 'system and messages are required';
  const requestChars = body.system.length + body.messages.reduce((sum, message) => {
    return sum + String(message?.role || '').length + String(message?.content || '').length;
  }, 0);
  if (requestChars > MAX_REQUEST_CHARS) return 'AI request is too large';
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('chat error: ANTHROPIC_API_KEY is not configured');
    return sendJson(res, 500, { error: 'AI service is not configured for this deployment.' });
  }

  const validationError = validateRequestBody(req.body);
  if (validationError) return sendJson(res, 400, { error: validationError });

  const rate = await checkRateLimit(req);
  if (!rate.allowed) {
    return sendJson(
      res,
      429,
      { error: 'Too many AI requests from this network. Please wait a few minutes and try again.' },
      { 'Retry-After': RATE_WINDOW_SECONDS }
    );
  }

  const { system, messages } = req.body;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system,
        messages,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Anthropic request failed', { status: response.status, type: data?.error?.type });
      if (response.status === 429) return sendJson(res, 503, { error: 'The AI service is temporarily rate limited. Please try again shortly.' });
      if (response.status >= 500) return sendJson(res, 502, { error: 'The AI service is temporarily unavailable. Please try again.' });
      return sendJson(res, 502, { error: 'The AI service rejected the request. Please try again.' });
    }

    if (!data?.content?.[0]?.text) {
      console.error('Anthropic returned an empty response');
      return sendJson(res, 502, { error: 'The AI service returned an empty response. Please try again.' });
    }

    return sendJson(res, 200, data);
  } catch (err) {
    if (err?.name === 'AbortError') {
      console.error('Anthropic request timed out');
      return sendJson(res, 504, { error: 'The AI request timed out. Please try again.' });
    }
    console.error('chat error', err);
    return sendJson(res, 500, { error: 'The AI request failed. Please try again.' });
  } finally {
    clearTimeout(timeoutId);
  }
};
