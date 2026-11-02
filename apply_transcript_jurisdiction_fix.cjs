const fs = require('fs');
const path = require('path');

const root = process.cwd();
const candidates = [
  path.join(root, 'src', 'App.jsx'),
  path.join(root, 'src', 'src', 'App.jsx'),
  path.join(root, 'App.jsx'),
];

const target = candidates.find(p => fs.existsSync(p));
if (!target) {
  console.error('ERROR: Could not find App.jsx. Run this script from the NEXUS EOC project root.');
  process.exit(1);
}

let text = fs.readFileSync(target, 'utf8');

const functionMarker = "function formatExerciseTranscript({ scenario, jurisdiction, difficulty, role, playerName, worldState, transcript = [], finalLifelines, finalSimTime, finalSituation, aar }) {";
const markerIndex = text.indexOf(functionMarker);
if (markerIndex === -1) {
  console.error('ERROR: formatExerciseTranscript() was not found. No files changed.');
  process.exit(1);
}

const functionEnd = text.indexOf('\n}\n\n\nfunction cleanPdfText', markerIndex);
if (functionEnd === -1) {
  console.error('ERROR: Could not safely locate the end of formatExerciseTranscript(). No files changed.');
  process.exit(1);
}

let block = text.slice(markerIndex, functionEnd + 2);

if (block.includes('const transcriptJurisdiction =')) {
  console.log('INFO: Transcript jurisdiction fix is already present. No changes needed.');
  process.exit(0);
}

const anchor = "  const generatedTime = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })\n";
if (!block.includes(anchor)) {
  console.error('ERROR: Expected generatedTime anchor was not found. No files changed.');
  process.exit(1);
}

block = block.replace(
  anchor,
  anchor + "  const transcriptJurisdiction = worldState?.localizedJurisdiction || worldState?.location || jurisdiction || 'Unspecified'\n"
);

const oldLine = "  text += `JURISDICTION:    ${jurisdiction || 'Unspecified'}\\n`";
const newLine = "  text += `JURISDICTION:    ${transcriptJurisdiction}\\n`";

if (!block.includes(oldLine)) {
  console.error('ERROR: Expected transcript jurisdiction output line was not found. No files changed.');
  process.exit(1);
}
block = block.replace(oldLine, newLine);

const updated = text.slice(0, markerIndex) + block + text.slice(functionEnd + 2);
const backup = target + '.before-transcript-jurisdiction-fix';
if (!fs.existsSync(backup)) fs.copyFileSync(target, backup);
fs.writeFileSync(target, updated, 'utf8');

console.log('SUCCESS: Transcript jurisdiction metadata fix applied.');
console.log(`Updated: ${target}`);
console.log('Transcript jurisdiction now prefers:');
console.log('  1) worldState.localizedJurisdiction');
console.log('  2) worldState.location');
console.log('  3) generic jurisdiction state as fallback');
console.log(`Backup: ${backup}`);
console.log('No scenario, AI, AAR, map, or gameplay logic was changed.');
