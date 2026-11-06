const fs=require('fs');const path=require('path');
const root=process.cwd();const src=path.join(__dirname,'eval');const dest=path.join(root,'eval');
if(!fs.existsSync(path.join(root,'package.json'))){console.error('STOP: run this from the NEXUS repo root containing package.json');process.exit(1)}
function copyDir(s,d){fs.mkdirSync(d,{recursive:true});for(const e of fs.readdirSync(s,{withFileTypes:true})){const a=path.join(s,e.name),b=path.join(d,e.name);if(e.isDirectory())copyDir(a,b);else{if(fs.existsSync(b)){console.error(`STOP: ${path.relative(root,b)} already exists. No files changed.`);process.exit(1)}fs.copyFileSync(a,b)}}}
if(fs.existsSync(dest)){console.error('STOP: eval/ already exists. No files changed. Review/rename the existing folder first.');process.exit(1)}
const pkgPath=path.join(root,'package.json');const original=fs.readFileSync(pkgPath,'utf8');let pkg;try{pkg=JSON.parse(original)}catch(e){console.error('STOP: package.json is not valid JSON. No files changed.');process.exit(1)}
copyDir(src,dest)
pkg.scripts=pkg.scripts||{}
const scripts={
  'eval:nexus':'node eval/run-eval.mjs',
  'eval:nexus:dry':'node eval/run-eval.mjs --dry-run',
  'eval:nexus:mock':'node eval/run-eval.mjs --providers=mock --runs=1'
}
for(const [k,v] of Object.entries(scripts)){if(pkg.scripts[k]&&pkg.scripts[k]!==v){fs.rmSync(dest,{recursive:true,force:true});console.error(`STOP: package.json already has script ${k}. Rolled back eval/ copy; package.json unchanged.`);process.exit(1)}pkg.scripts[k]=v}
fs.writeFileSync(pkgPath,JSON.stringify(pkg,null,2)+'\n')
console.log('Installed NEXUS Model Evaluation Harness.')
console.log('Added eval/ and npm scripts only. Live application files were not modified.')
console.log('Next: npm run eval:nexus:mock')
