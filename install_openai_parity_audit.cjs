#!/usr/bin/env node
const fs=require('fs'), path=require('path');
const root=process.cwd(), src=path.join(__dirname,'nexus_openai_parity_audit.cjs'), dst=path.join(root,'nexus_openai_parity_audit.cjs');
if(!fs.existsSync(path.join(root,'package.json'))||!fs.existsSync(path.join(root,'api'))){console.error('STOP: Run this from the root of C:\\Dev\\em-sim_OpenAi');process.exit(1)}
fs.copyFileSync(src,dst);
console.log('SUCCESS: Installed nexus_openai_parity_audit.cjs');
console.log('Next: node .\\nexus_openai_parity_audit.cjs');
