import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'
import {runOpenAI} from './providers/openai.mjs'
import {runAnthropic} from './providers/anthropic.mjs'
import {runMock} from './providers/mock.mjs'
import {parseModelJson} from './lib/parse.mjs'
import {validateSchema} from './validators/schema.mjs'
import {validateNexus} from './validators/nexus.mjs'
import {writeReports} from './lib/report.mjs'

const here=path.dirname(fileURLToPath(import.meta.url))
const arg=(name,def=null)=>{const p=process.argv.find(x=>x.startsWith(`--${name}=`));return p?p.slice(name.length+3):def}
const flag=name=>process.argv.includes(`--${name}`)
const split=v=>String(v||'').split(',').map(x=>x.trim()).filter(Boolean)
const config=JSON.parse(await fs.readFile(path.join(here,'config.json'),'utf8'))
const runs=Math.max(1,Number(arg('runs',config.runsPerCase)))
const providers=split(arg('providers',config.providers.join(',')))
const categories=split(arg('category',config.categories.join(',')))
const caseFilter=split(arg('case',''))
const promptFile=path.resolve(here,arg('prompt','prompts/nexus-eval-system-v1.txt'))
const system=await fs.readFile(promptFile,'utf8')
const providerMap={openai:runOpenAI,anthropic:runAnthropic,mock:runMock}

let cases=[]
for(const f of ['standard-turn.json','flash-card.json','local-plan.json']) cases.push(...JSON.parse(await fs.readFile(path.join(here,'cases',f),'utf8')))
cases=cases.filter(c=>categories.includes(c.category) && (!caseFilter.length||caseFilter.includes(c.id)))
if(!cases.length) throw new Error('No test cases matched the requested filters')
for(const p of providers) if(!providerMap[p]) throw new Error(`Unknown provider: ${p}`)

console.log(`NEXUS Model Evaluation Harness`)
console.log(`Cases: ${cases.length} | Runs/case: ${runs} | Providers: ${providers.join(', ')}`)
if(flag('dry-run')) { console.log('Dry run complete. No API calls made.'); process.exit(0) }

const rows=[]
for(const provider of providers){
  for(const tc of cases){
    for(let run=1;run<=runs;run++){
      const user=`TEST CASE: ${tc.id}\nCATEGORY: ${tc.category}\nTITLE: ${tc.title}\n\nSCENARIO CONTEXT:\n${tc.context}\n\nPLAYER ACTION:\n${tc.playerAction}\n\nRespond exactly as NEXUS would for a live turn.`
      process.stdout.write(`[${provider}] ${tc.id} run ${run}/${runs} ... `)
      try{
        const result=await providerMap[provider]({system,user,timeoutMs:config.timeoutMs})
        const parsed=parseModelJson(result.rawText)
        const failures=[]
        if(!parsed.ok) failures.push(`invalid JSON: ${parsed.error}`)
        else {failures.push(...validateSchema(parsed.value));failures.push(...validateNexus(parsed.value,tc.expected))}
        const row={provider:result.provider,model:result.model,caseId:tc.id,category:tc.category,run,pass:failures.length===0,jsonValid:parsed.ok,latencyMs:result.latencyMs,inputTokens:result.inputTokens,outputTokens:result.outputTokens,failures,rawText:result.rawText,parsed:parsed.value}
        rows.push(row);console.log(row.pass?'PASS':`FAIL (${failures.join('; ')})`)
      }catch(e){rows.push({provider,model:process.env[provider==='openai'?'OPENAI_EVAL_MODEL':'ANTHROPIC_EVAL_MODEL']||'unknown',caseId:tc.id,category:tc.category,run,pass:false,jsonValid:false,latencyMs:0,inputTokens:null,outputTokens:null,failures:[`provider error: ${e.message}`],rawText:'',parsed:null});console.log(`ERROR (${e.message})`)}
    }
  }
}
const stamp=new Date().toISOString().replace(/[:.]/g,'-')
const report=await writeReports(rows,path.join(here,'results'),stamp)
console.log('\nSUMMARY')
for(const s of report.summary) console.log(`${s.provider} ${s.model}: ${(s.passRate*100).toFixed(1)}% pass | ${(s.jsonRate*100).toFixed(1)}% JSON | ${s.avgLatency} ms avg`)
console.log(`\nHTML: ${report.htmlPath}\nCSV:  ${report.csvPath}\nJSON: ${report.jsonPath}`)
