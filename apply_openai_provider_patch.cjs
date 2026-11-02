const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const target = path.resolve(process.cwd(), 'api', 'chat.js');
if (!fs.existsSync(target)) {
  console.error(`STOP: Could not find ${target}`);
  console.error('Run this from C:\\Dev\\em-sim_OpenAi.');
  process.exit(1);
}

const original = fs.readFileSync(target, 'utf8');
let src = original;

const required = [
  'ANTHROPIC_TIMEOUT_MS',
  'process.env.ANTHROPIC_API_KEY',
  'https://api.anthropic.com/v1/messages',
  "model: 'claude-sonnet-4-6'",
  'const { system, messages } = req.body;'
];
const missing = required.filter(x => !src.includes(x));
if (missing.length) {
  console.error('STOP: This does not look like the Claude-based OpenAI test clone we inspected.');
  console.error('No changes were written. Missing markers:');
  missing.forEach(x => console.error(` - ${x}`));
  process.exit(1);
}

// 1) Rename timeout constant everywhere in this file.
src = src.replace(/ANTHROPIC_TIMEOUT_MS/g, 'OPENAI_TIMEOUT_MS');

// 2) Swap the API-key guard but preserve the existing return/error block around it.
src = src.replace(/process\.env\.ANTHROPIC_API_KEY/g, 'process.env.OPENAI_API_KEY');
src = src.replace(/ANTHROPIC_API_KEY is not configured/g, 'OPENAI_API_KEY is not configured');

// 3) Replace only the provider request section, from the destructure through the handler's final block.
const startMarker = '  const { system, messages } = req.body;';
const start = src.indexOf(startMarker);
if (start < 0) {
  console.error('STOP: Could not locate the provider block start. No changes were written.');
  process.exit(1);
}

// Find the final `};` after the provider block. This handler is at the end of chat.js in the inspected build.
const tail = src.slice(start);
const anthropicEndpointPos = tail.indexOf('https://api.anthropic.com/v1/messages');
if (anthropicEndpointPos < 0) {
  console.error('STOP: Claude endpoint was not found in the expected provider block. No changes were written.');
  process.exit(1);
}

const replacement = `  const { system, messages } = req.body;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.6',
        max_output_tokens: 4000,
        input: [
          { role: 'developer', content: system },
          ...messages,
        ],
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('OpenAI request failed', { status: response.status, type: data?.error?.type });
      if (response.status === 429) {
        return sendJson(res, 503, { error: 'The AI service is temporarily rate limited. Please try again shortly.' });
      }
      if (response.status >= 500) {
        return sendJson(res, 502, { error: 'The AI service is temporarily unavailable. Please try again.' });
      }
      return sendJson(res, 502, { error: 'The AI service rejected the request. Please try again.' });
    }

    const outputText = (data?.output || [])
      .flatMap(item => item?.content || [])
      .filter(item => item?.type === 'output_text' && typeof item?.text === 'string')
      .map(item => item.text)
      .join('')
      .trim();

    if (!outputText) {
      console.error('OpenAI returned an empty response');
      return sendJson(res, 502, { error: 'The AI service returned an empty response. Please try again.' });
    }

    // Keep the existing NEXUS frontend contract unchanged.
    return sendJson(res, 200, {
      content: [{ type: 'text', text: outputText }],
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      console.error('OpenAI request timed out');
      return sendJson(res, 504, { error: 'The AI request timed out. Please try again.' });
    }
    console.error('chat error', err);
    return sendJson(res, 500, { error: 'The AI request failed. Please try again.' });
  } finally {
    clearTimeout(timeoutId);
  }
};`;

// The inspected file's provider handler is the last exported handler block.
// Replace from startMarker through EOF, preserving any trailing whitespace only.
src = src.slice(0, start) + replacement + '\n';

const expected = [
  'OPENAI_TIMEOUT_MS',
  'process.env.OPENAI_API_KEY',
  'https://api.openai.com/v1/responses',
  "process.env.OPENAI_MODEL || 'gpt-5.6'",
  "role: 'developer'",
  "item?.type === 'output_text'",
  "content: [{ type: 'text', text: outputText }]"
];
const failed = expected.filter(x => !src.includes(x));
if (failed.length) {
  console.error('STOP: Patch content validation failed. No changes were written.');
  failed.forEach(x => console.error(` - Missing after patch: ${x}`));
  process.exit(1);
}

if (src.includes('https://api.anthropic.com/v1/messages') || src.includes("model: 'claude-sonnet-4-6'")) {
  console.error('STOP: Claude provider references remain after conversion. No changes were written.');
  process.exit(1);
}

// Validate JavaScript syntax before touching the real file.
const temp = path.join(os.tmpdir(), `nexus-chat-openai-${process.pid}.js`);
fs.writeFileSync(temp, src, 'utf8');
const check = spawnSync(process.execPath, ['--check', temp], { encoding: 'utf8' });
try { fs.unlinkSync(temp); } catch {}
if (check.status !== 0) {
  console.error('STOP: Node syntax validation failed. No changes were written.');
  console.error(check.stderr || check.stdout);
  process.exit(1);
}

const backup = `${target}.claude-backup`;
if (!fs.existsSync(backup)) fs.writeFileSync(backup, original, 'utf8');
fs.writeFileSync(target, src, 'utf8');

console.log('SUCCESS: OpenAI provider patch applied to api/chat.js');
console.log('Default model: gpt-5.6');
console.log('Required Vercel variable: OPENAI_API_KEY');
console.log('Optional Vercel variable: OPENAI_MODEL');
console.log(`Claude backup: ${backup}`);
console.log('Original NEXUS frontend files were not changed.');
