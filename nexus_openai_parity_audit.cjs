#!/usr/bin/env node
const fs=require('fs'), path=require('path');
const root=process.cwd();
const ignore=new Set(['node_modules','.git','dist','build','.vercel','coverage','eval']);
const exts=new Set(['.js','.jsx','.mjs','.cjs','.ts','.tsx','.json']);
function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(ignore.has(e.name))continue;const f=path.join(d,e.name);if(e.isDirectory())walk(f,out);else if(exts.has(path.extname(e.name).toLowerCase()))out.push(f)}return out}
function envNames(f){if(!fs.existsSync(f))return[];return fs.readFileSync(f,'utf8').split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('#')&&x.includes('=')).map(x=>x.split('=')[0].trim())}
const refs=new Map(), pats=[/process\.env\.([A-Z0-9_]+)/g,/import\.meta\.env\.([A-Z0-9_]+)/g,/process\.env\[['"]([A-Z0-9_]+)['"]\]/g];
for(const f of walk(root)){let t;try{t=fs.readFileSync(f,'utf8')}catch{continue}for(const re of pats){re.lastIndex=0;let m;while((m=re.exec(t))){if(!refs.has(m[1]))refs.set(m[1],new Set());refs.get(m[1]).add(path.relative(root,f).replace(/\\/g,'/'))}}}
const local=new Set([...envNames(path.join(root,'.env')),...envNames(path.join(root,'.env.local')),...envNames(path.join(root,'.env.example'))]);
let rows=[...refs.keys()].sort().map(k=>({key:k,files:[...refs.get(k)].sort()}));
for(const k of ['OPENAI_API_KEY','OPENAI_MODEL'])if(!rows.some(r=>r.key===k))rows.push({key:k,files:[]});
rows.sort((a,b)=>a.key.localeCompare(b.key));
function action(k){if(k==='ANTHROPIC_API_KEY')return['DO NOT COPY','Claude-only credential'];if(k==='OPENAI_API_KEY')return['OPENAI REQUIRED','Use the dedicated OpenAI API key'];if(k==='OPENAI_MODEL')return['OPENAI OPTIONAL','Set to gpt-5.6'];return['PARITY','Copy same value and Vercel scope from existing EOC']}
const md=['# NEXUS EOC OpenAI Deployment Parity Report','','No secret values are written to this report.','','| Key | Action | Referenced by |','|---|---|---|'];
for(const r of rows){const [a,n]=action(r.key);md.push(`| \`${r.key}\` | **${a}** — ${n} | ${r.files.length?r.files.map(f=>`\`${f}\``).join(', '):'Provider configuration'} |`)}
md.push('','## Local env-name check','');
if(local.size)[...local].sort().forEach(k=>md.push(`- \`${k}\``)); else md.push('No local env key names found.');
md.push('','## Deployment rule','','Copy every **PARITY** key from the existing EOC Vercel project using the same value and environment scope. Do not copy `ANTHROPIC_API_KEY`. Add `OPENAI_API_KEY`. Set `OPENAI_MODEL=gpt-5.6` for an explicit model pin.');
fs.writeFileSync(path.join(root,'OPENAI_PARITY_REPORT.md'),md.join('\n')+'\n');
const parity=rows.map(r=>r.key).filter(k=>action(k)[0]==='PARITY');
fs.writeFileSync(path.join(root,'OPENAI_PARITY_KEYS.txt'),parity.join('\n')+(parity.length?'\n':''));
const v=['NEXUS EOC OPENAI TEST — VERCEL ENVIRONMENT CHECKLIST','','COPY SAME VALUE/SCOPE FROM EXISTING EOC:',...parity.map(k=>'- '+k),'','DO NOT COPY:','- ANTHROPIC_API_KEY','','ADD TO OPENAI TEST PROJECT:','- OPENAI_API_KEY = [your dedicated OpenAI API key]','- OPENAI_MODEL = gpt-5.6','','No secret values are stored in this file.'];
fs.writeFileSync(path.join(root,'OPENAI_PARITY_VERCEL.txt'),v.join('\n')+'\n');
console.log(`NEXUS OpenAI parity audit complete. Referenced keys: ${rows.length}. Parity keys: ${parity.length}.`);
console.log('Created OPENAI_PARITY_REPORT.md, OPENAI_PARITY_KEYS.txt, OPENAI_PARITY_VERCEL.txt');
console.log('No application code or environment values were changed.');
