import fs from 'node:fs/promises'
import path from 'node:path'

const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
export function summarize(rows){
  const groups=new Map()
  for(const r of rows){const k=`${r.provider}:${r.model}`;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r)}
  return [...groups.entries()].map(([key,a])=>({key,provider:a[0].provider,model:a[0].model,runs:a.length,passRate:a.filter(x=>x.pass).length/a.length,avgLatency:Math.round(a.reduce((s,x)=>s+(x.latencyMs||0),0)/a.length),jsonRate:a.filter(x=>x.jsonValid).length/a.length,avgInputTokens:Math.round(a.reduce((s,x)=>s+(x.inputTokens||0),0)/a.length),avgOutputTokens:Math.round(a.reduce((s,x)=>s+(x.outputTokens||0),0)/a.length)}))
}
export async function writeReports(rows,outDir,stamp){
  await fs.mkdir(outDir,{recursive:true})
  const summary=summarize(rows)
  const jsonPath=path.join(outDir,`nexus-eval-${stamp}.json`)
  await fs.writeFile(jsonPath,JSON.stringify({generatedAt:new Date().toISOString(),summary,rows},null,2))
  const headers=['provider','model','caseId','category','run','pass','jsonValid','latencyMs','inputTokens','outputTokens','failures']
  const csv=[headers.join(','),...rows.map(r=>headers.map(h=>`"${String(h==='failures'?r.failures.join('; '):r[h]??'').replaceAll('"','""')}"`).join(','))].join('\n')
  const csvPath=path.join(outDir,`nexus-eval-${stamp}.csv`);await fs.writeFile(csvPath,csv)
  const cards=summary.map(s=>`<tr><td>${esc(s.provider)}</td><td>${esc(s.model)}</td><td>${(s.passRate*100).toFixed(1)}%</td><td>${(s.jsonRate*100).toFixed(1)}%</td><td>${s.avgLatency} ms</td><td>${s.runs}</td></tr>`).join('')
  const details=rows.map(r=>`<tr class="${r.pass?'pass':'fail'}"><td>${esc(r.provider)}</td><td>${esc(r.caseId)}</td><td>${esc(r.category)}</td><td>${r.run}</td><td>${r.pass?'PASS':'FAIL'}</td><td>${esc(r.failures.join('; '))}</td><td>${r.latencyMs}</td></tr>`).join('')
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>NEXUS Model Evaluation</title><style>body{font-family:Arial,sans-serif;background:#07131a;color:#d8edf2;margin:32px}h1,h2{color:#58d8d0}table{border-collapse:collapse;width:100%;margin:16px 0 30px}th,td{border:1px solid #24424d;padding:8px;text-align:left}th{background:#0d2530}.pass td:nth-child(5){color:#75e6a8}.fail td:nth-child(5){color:#ff8f8f}.note{color:#8baab4}</style></head><body><h1>NEXUS Model Evaluation</h1><p class="note">Generated ${esc(new Date().toISOString())}. Deterministic contract checks only; human quality scoring can be added as a separate layer.</p><h2>Model Summary</h2><table><thead><tr><th>Provider</th><th>Model</th><th>Pass rate</th><th>JSON rate</th><th>Avg latency</th><th>Runs</th></tr></thead><tbody>${cards}</tbody></table><h2>Run Detail</h2><table><thead><tr><th>Provider</th><th>Case</th><th>Category</th><th>Run</th><th>Result</th><th>Failures</th><th>Latency</th></tr></thead><tbody>${details}</tbody></table></body></html>`
  const htmlPath=path.join(outDir,`nexus-eval-${stamp}.html`);await fs.writeFile(htmlPath,html)
  return {jsonPath,csvPath,htmlPath,summary}
}
