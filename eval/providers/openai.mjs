const BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'

function extractText(data) {
  if (typeof data?.output_text === 'string') return data.output_text
  const parts = []
  for (const item of data?.output || []) {
    for (const c of item?.content || []) {
      if (typeof c?.text === 'string') parts.push(c.text)
    }
  }
  return parts.join('\n')
}

export async function runOpenAI({system, user, timeoutMs}) {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_EVAL_MODEL
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
  if (!model) throw new Error('OPENAI_EVAL_MODEL is not set. Pin the exact model ID you want to evaluate.')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const started = Date.now()
  try {
    const res = await fetch(`${BASE_URL}/responses`, {
      method:'POST',
      headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        model,
        input:[
          {role:'system',content:[{type:'input_text',text:system}]},
          {role:'user',content:[{type:'input_text',text:user}]}
        ]
      }),
      signal:controller.signal
    })
    const data = await res.json()
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${JSON.stringify(data).slice(0,800)}`)
    return {
      provider:'openai', model, latencyMs:Date.now()-started,
      inputTokens:data?.usage?.input_tokens ?? null,
      outputTokens:data?.usage?.output_tokens ?? null,
      rawText:extractText(data), raw:data
    }
  } finally { clearTimeout(timer) }
}
