const BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'

export async function runAnthropic({system, user, timeoutMs}) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const model = process.env.ANTHROPIC_EVAL_MODEL
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
  if (!model) throw new Error('ANTHROPIC_EVAL_MODEL is not set. Pin the exact model ID you want to evaluate.')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const started = Date.now()
  try {
    const res = await fetch(`${BASE_URL}/v1/messages`, {
      method:'POST',
      headers:{
        'x-api-key':apiKey,
        'anthropic-version':process.env.ANTHROPIC_API_VERSION || '2026-10-21',
        'content-type':'application/json'
      },
      body:JSON.stringify({model,max_tokens:2200,system,messages:[{role:'user',content:user}]}),
      signal:controller.signal
    })
    const data = await res.json()
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${JSON.stringify(data).slice(0,800)}`)
    const rawText=(data?.content||[]).filter(x=>x?.type==='text').map(x=>x.text).join('\n')
    return {
      provider:'anthropic', model, latencyMs:Date.now()-started,
      inputTokens:data?.usage?.input_tokens ?? null,
      outputTokens:data?.usage?.output_tokens ?? null,
      rawText, raw:data
    }
  } finally { clearTimeout(timer) }
}
