// Minimal Redis client shared by the API functions.
// Uses REDIS_URL (redis:// or rediss://). No npm dependency required.

const net = require('node:net')
const tls = require('node:tls')

const REDIS_TIMEOUT_MS = 8000

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
    return { line: this.buffer.slice(offset, end).toString('utf8'), next: end + 2 }
  }
  parseAt(offset = 0) {
    if (this.buffer.length <= offset) return null
    const type = String.fromCharCode(this.buffer[offset])
    if (type === '+' || type === '-' || type === ':') {
      const line = this.readLine(offset + 1)
      if (!line) return null
      if (type === '-') throw new Error(line.line || 'Redis error')
      return { value: type === ':' ? Number(line.line) : line.line, next: line.next }
    }
    if (type === '$') {
      const line = this.readLine(offset + 1)
      if (!line) return null
      const length = Number(line.line)
      if (length === -1) return { value: null, next: line.next }
      const start = line.next
      const end = start + length
      if (this.buffer.length < end + 2) return null
      return { value: this.buffer.slice(start, end).toString('utf8'), next: end + 2 }
    }
    if (type === '*') {
      const line = this.readLine(offset + 1)
      if (!line) return null
      const count = Number(line.line)
      if (count === -1) return { value: null, next: line.next }
      const values = []
      let cursor = line.next
      for (let i = 0; i < count; i += 1) {
        const parsed = this.parseAt(cursor)
        if (!parsed) return null
        values.push(parsed.value)
        cursor = parsed.next
      }
      return { value: values, next: cursor }
    }
    return null
  }
  // Returns undefined when the buffer does not yet hold a complete reply.
  // A complete nil bulk reply is returned as null.
  shiftParsed() {
    const parsed = this.parseAt(0)
    if (!parsed) return undefined
    this.buffer = this.buffer.slice(parsed.next)
    return parsed.value
  }
}

// Runs a list of commands on one connection and resolves with the reply to the
// last one. AUTH and SELECT are derived from REDIS_URL.
async function redisCommands(commandList, { timeoutMs = REDIS_TIMEOUT_MS } = {}) {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) throw new Error('REDIS_URL is not configured for this deployment')

  const parsedUrl = new URL(redisUrl)
  const isTls = parsedUrl.protocol === 'rediss:'
  const port = Number(parsedUrl.port || (isTls ? 6380 : 6379))
  const host = parsedUrl.hostname
  const username = decodeURIComponent(parsedUrl.username || '')
  const password = decodeURIComponent(parsedUrl.password || '')
  const db = parsedUrl.pathname && parsedUrl.pathname !== '/' ? parsedUrl.pathname.slice(1) : ''

  const commands = []
  if (password) commands.push(username ? ['AUTH', username, password] : ['AUTH', password])
  if (db) commands.push(['SELECT', db])
  commands.push(...commandList)

  return new Promise((resolve, reject) => {
    const socket = isTls
      ? tls.connect({ host, port, servername: host, timeout: timeoutMs })
      : net.connect({ host, port, timeout: timeoutMs })
    const parser = new RespParser()
    let settled = false
    let index = 0
    let lastValue = null

    const fail = err => { if (settled) return; settled = true; socket.destroy(); reject(err) }
    const finish = () => { if (settled) return; settled = true; socket.end(); resolve(lastValue) }
    const writeNext = () => socket.write(encodeRedisCommand(commands[index]))

    socket.on(isTls ? 'secureConnect' : 'connect', writeNext)
    socket.on('timeout', () => fail(new Error('Redis request timed out')))
    socket.on('error', fail)
    socket.on('data', chunk => {
      try {
        parser.push(chunk)
        let value
        while ((value = parser.shiftParsed()) !== undefined) {
          lastValue = value
          index += 1
          if (index >= commands.length) return finish()
          writeNext()
        }
      } catch (err) {
        fail(err)
      }
    })
  })
}

function redisCommand(args, options) {
  return redisCommands([args], options)
}

module.exports = { redisCommand, redisCommands, RespParser, encodeRedisCommand }
