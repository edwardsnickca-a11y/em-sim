import { useState, useRef, useEffect, useCallback } from 'react'
import posthog from 'posthog-js'
import { MapContainer, TileLayer, Marker, Popup, useMap, ScaleControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { PIN_COLORS } from './data/mapConfig'
import { JURISDICTION_CONTEXT, JURISDICTIONS } from './data/jurisdictions'
import { SCENARIO_REFS } from './data/references'
import { ESFS } from './data/esfs'
import { PANEL_INFO } from './data/panelInfo'
import { ROLES, ROLE_GROUPS } from './data/roles'
import { SCENARIOS, DIFFICULTIES } from './data/scenarios'
import { LIFELINES, DEFAULT_LIFELINES, LL_COLORS } from './data/lifelines'
import { AAR_SECTIONS } from './data/aar'
import MissionPortal from './components/missionPortal/MissionPortal'
import StartExercise from './components/startExercise/StartExercise'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function makeIcon(color, type='OTHER') {
  const t = String(type || 'OTHER').toUpperCase()
  const iconMap = {
    EOC:      { glyph:'◆', fill:'#1D9E75', stroke:'#BDEBDD' },
    HOSPITAL: { glyph:'H', fill:'#3B82F6', stroke:'#D6E8FF' },
    STAGING:  { glyph:'▲', fill:'#F59B22', stroke:'#FFE7B8' },
    SHELTER:  { glyph:'⌂', fill:'#9B59B6', stroke:'#F0D8FF' },
    AFFECTED: { glyph:'!', fill:'#E24B4A', stroke:'#FFD6D6' },
    FIRE:     { glyph:'♨', fill:'#EF6A32', stroke:'#FFE0D1' },
    HAZMAT:   { glyph:'☣', fill:'#8E44AD', stroke:'#F1D9FF' },
    DAM:      { glyph:'≋', fill:'#38BDF8', stroke:'#D9F4FF' },
    BLOCKED:  { glyph:'×', fill:'#E24B4A', stroke:'#FFD6D6' },
    OTHER:    { glyph:'•', fill:color || '#45A3FF', stroke:'#EAF4FF' },
  }
  const cfg = iconMap[t] || iconMap.OTHER
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
    <defs>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="3" stdDeviation="2.3" flood-color="#000000" flood-opacity="0.75"/>
      </filter>
    </defs>
    <circle cx="17" cy="17" r="12.2" fill="${cfg.fill}" stroke="${cfg.stroke}" stroke-width="2.2" filter="url(#shadow)"/>
    <circle cx="17" cy="17" r="15.4" fill="none" stroke="${cfg.fill}" stroke-width="1.3" opacity="0.45"/>
    <text x="17" y="${t === 'HOSPITAL' ? 22 : 21}" text-anchor="middle" font-size="${t === 'HOSPITAL' ? 14 : 15}" font-family="Arial, Helvetica, sans-serif" font-weight="900" fill="#ffffff">${cfg.glyph}</text>
  </svg>`
  return L.divIcon({ html: svg, className: 'nexus-map-icon', iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -18] })
}

function makeDynamicIcon(turnNum) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38">
    <defs>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="3" stdDeviation="2.6" flood-color="#000000" flood-opacity="0.78"/>
      </filter>
    </defs>
    <circle cx="19" cy="19" r="13.2" fill="#101923" stroke="#ffffff" stroke-width="2.1" filter="url(#shadow)"/>
    <circle cx="19" cy="19" r="17" fill="none" stroke="#45A3FF" stroke-width="1.4" opacity="0.75"/>
    <text x="19" y="23" text-anchor="middle" font-size="10.5" font-family="Arial, Helvetica, sans-serif" font-weight="900" fill="#ffffff">T${turnNum}</text>
  </svg>`
  return L.divIcon({ html: svg, className: 'nexus-map-icon nexus-turn-icon', iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -20] })
}













const DEFAULT_SETTINGS = { fontSize:12, accentColor:'#45A3FF', alertColor:'#F59B22' }
const SETTINGS_KEY = 'em_sim_settings'
const ONBOARDING_KEY = 'nexus_onboarding_seen'

// ─── WORLD INIT PROMPT ────────────────────────────────────────────────────────
function buildWorldInitPrompt(scenario, jurisdiction) {
  const sc  = SCENARIOS[scenario]
  const jc  = JURISDICTION_CONTEXT[jurisdiction]

  const scenarioNotes = {
    hurricane:  'Place the scenario on a plausible coastline or near-coast area for this jurisdiction type. Hurricane landfall requires coastal geography.',
    mci:        'The explosion should be at a plausible crowded venue (stadium, fairground, transit hub, festival) appropriate for the jurisdiction size and type.',
    hazmat:     'Rail line or highway corridor must be geographically plausible for this jurisdiction. Tribal land rail corridors exist — BNSF and UP cross Navajo Nation and other tribal lands.',
    cyber:      'Locate critical infrastructure (water treatment, power substations) plausibly for this jurisdiction size. Rural counties may have co-ops and small municipal water systems.',
    earthquake: 'Place in a seismically active region plausible for this jurisdiction type. Not all jurisdictions are near fault lines — if the match is implausible, pick the closest realistic seismic risk area.',
    flood:      'Dam failure or flash flood must have realistic watershed geography for this jurisdiction. Rural counties often have small earthen dams. Tribal nations in the Southwest have arroyo flash flood risk.',
    wildfire:   'Place in a fire-prone region appropriate for jurisdiction type. Tribal nations in the West have significant wildfire exposure. Rural counties in the Southeast have prescribed burn risk.',
    winter:     'Severe winter storm must be climatically plausible for this jurisdiction. Do not place a blizzard in South Florida — relocate to a plausible cold-climate jurisdiction matching the type.',
    rdd:        'An RDD can occur anywhere but federal response assets are concentrated near major cities. A rural or tribal jurisdiction RDD creates unique federal coordination gaps — lean into that.',
    train:      'Rail lines cross rural, urban, tribal, and corridor jurisdictions. BNSF, UP, CSX, and NS all have routes through tribal lands, rural counties, and interstate corridors. Be specific.',
  }

  return `You are generating the opening world state for an emergency management training simulator.

SCENARIO TYPE: ${sc.name}
SCENARIO SUMMARY: ${sc.desc}
JURISDICTION TYPE: ${jurisdiction}
JURISDICTION DESCRIPTION: ${jc.desc}
JURISDICTION CONSTRAINTS: ${jc.constraints}
EXAMPLE LOCATIONS: ${jc.examples}
SCENARIO PLACEMENT NOTES: ${scenarioNotes[scenario] || ''}

YOUR TASK:
Generate a specific, realistic, geographically accurate opening world state for this exact combination of scenario and jurisdiction. Pick a DIFFERENT city every time — do not default to the same locations repeatedly. Prioritize geographic diversity across the US.

Generate 4-7 initial map pins representing key infrastructure for this specific location. Pin types: EOC, HOSPITAL, STAGING, SHELTER, AFFECTED, FIRE, HAZMAT, DAM, BLOCKED. Coordinates must be geographically accurate and within ~5 miles of your chosen center point. For named highways, interchanges, airports, hospitals, schools, shelters, and public facilities, place the pin on or very near the named feature.

Generate 4-6 opening dispatch items that reflect the specific local conditions, named local agencies, and realistic resource constraints for this jurisdiction. A tribal nation dispatch sounds different from a large urban metro dispatch — use the right terminology, the right agency names, the right resource gaps.

Generate an opening narrative (2-3 sentences) that establishes the specific location, the incident conditions, and the most immediate challenge facing the player given this jurisdiction's capabilities and constraints.

RESPOND ONLY IN THIS EXACT JSON FORMAT — no preamble, no markdown fences:
{
  "location": "Specific named location — e.g. Shiprock, NM (Navajo Nation) or Galveston County, TX (Coastal) or Boise, ID",
  "center": [latitude, longitude],
  "pins": [
    { "id": "eoc", "label": "Name of EOC", "type": "EOC", "lat": 0.000, "lng": 0.000, "note": "One sentence status note specific to this jurisdiction" }
  ],
  "dispatches": [
    "Dispatch item specific to this location and jurisdiction"
  ],
  "openingNarrative": "2-3 sentence opening that names the location, describes the incident, and flags the key constraint for this jurisdiction type."
}`
}

// ─── MAIN SYSTEM PROMPT ───────────────────────────────────────────────────────
function buildSystemPrompt(scenario, jurisdiction, difficulty, worldState, playerName, role) {
  const sc = SCENARIOS[scenario]
  const jc = JURISDICTION_CONTEXT[jurisdiction]
  const diffMap = {
    Basic:    'Evaluate actions generously. Surface one complication per turn.',
    Moderate: 'Evaluate with moderate rigor. Surface two complications per turn.',
    Advanced: 'Evaluate with professional rigor. Surface 2-3 complications per turn. Resource constraints are real.',
    Brutal:   'Evaluate ruthlessly. Every delayed or vague decision has cascading consequences.',
    Adaptive: 'Calibrate difficulty to demonstrated competence. Never make it easy.',
  }

  const scenarioSpecific = {
    wildfire: 'This is a wind-driven wildfire with structure-to-structure spread. Key pressure points: air resource allocation, evacuation route management, shelter capacity, public warning systems, and mutual aid coordination.',
    winter:   'This is a cascading infrastructure failure driven by extreme cold. Key pressure points: power restoration prioritization, warming shelter activation and capacity, vulnerable population welfare checks, road clearance, fuel supply for hospitals and generators.',
    rdd:      'This is a radiological dispersal device event. Key pressure points: hot zone establishment, federal agency coordination (FBI as LFA for terrorism, FEMA for consequence management, NRC, EPA FRMAC), decontamination of self-referred patients, public messaging to prevent panic.',
    train:    'This is a combined MCI and hazmat event. Key pressure points: unified command establishment bridging MCI and hazmat doctrine, railroad company cooperation, simultaneous triage and hazmat containment, LEPC activation, EPA coordination.',
  }

  const locationBlock = worldState
    ? `LOCATION: ${worldState.location}
MAP CENTER: lat ${worldState.center[0]}, lng ${worldState.center[1]}
All coordinates must be geographically plausible within ~5 miles of this center point. For named highways, interchanges, airports, hospitals, schools, shelters, and public facilities, place the pin on or very near the named feature.`
    : `JURISDICTION: ${jurisdiction}`

  return `You are the AI engine for an emergency management training simulator. The player is a senior emergency manager.

SCENARIO: ${sc.name}
${locationBlock}
JURISDICTION TYPE: ${jurisdiction} — ${jc.desc}
KEY CONSTRAINTS FOR THIS JURISDICTION: ${jc.constraints}
DIFFICULTY: ${difficulty} — ${diffMap[difficulty]}
${scenarioSpecific[scenario] ? `SCENARIO NOTES: ${scenarioSpecific[scenario]}` : ''}

RULES:
- Evaluate player actions with professional rigor. Never be encouraging. Be realistic.
- All named agencies, roads, facilities, and resources must be plausible for ${worldState?.location || jurisdiction}.
- Describe consequences in 3-5 sentences.
- Surface complications, stakeholder pressures, secondary problems each turn.
- Advance incident clock realistically. State simulated time each turn.
- Generate 1-2 new field dispatch items after each consequence using local agency names and local geography.
- Embed NIMS/ICS/ESF/FEMA doctrine in realism — don't lecture.
- Generate 3-4 realistic fictional news headlines reflecting current incident state and local media outlets.
- When a dispatch event has a specific physical location, include it as a map pin. Generate 0-2 pins per turn.
${playerName ? `PLAYER NAME: ${playerName} — on ENDEX, address them by name in the AAR opening.` : ''}
ROLE: ${role || 'EOC Director'} — ${ROLES[role] || ROLES['EOC Director']}
Evaluate all decisions from the perspective of this role.

ON ENDEX: Return a structured AAR in the "aar" field with exactly these 8 sections. Be specific, direct, and calibrated to the role and jurisdiction. Do not pad. Do not soften. Each section should be 2-5 sentences of substantive assessment.

- Never break character.

STANDARD TURN RESPONSE FORMAT — no preamble, no markdown:
{
  "time": "simulated time",
  "consequence": "3-5 sentence consequence narrative",
  "situation": "STABLE | DEVELOPING | CRITICAL | DETERIORATING",
  "dispatches": ["dispatch item 1", "dispatch item 2"],
  "prompt": "one sentence prompt for next player action",
  "headlines": [
    { "source": "Local news outlet name", "text": "Headline text", "time": "simulated time" }
  ],
  "pins": [
    { "label": "Location name", "type": "AFFECTED | STAGING | SHELTER | HOSPITAL | EOC | BLOCKED | FIRE | HAZMAT | OTHER", "lat": 0.000, "lng": 0.000, "note": "one sentence status note" }
  ],
  "lifelines": {
    "safety":    { "status": "GREEN | YELLOW | RED", "reason": "one sentence" },
    "food":      { "status": "GREEN | YELLOW | RED", "reason": "one sentence" },
    "health":    { "status": "GREEN | YELLOW | RED", "reason": "one sentence" },
    "energy":    { "status": "GREEN | YELLOW | RED", "reason": "one sentence" },
    "comms":     { "status": "GREEN | YELLOW | RED", "reason": "one sentence" },
    "transport": { "status": "GREEN | YELLOW | RED", "reason": "one sentence" },
    "hazmat":    { "status": "GREEN | YELLOW | RED", "reason": "one sentence" },
    "water":     { "status": "GREEN | YELLOW | RED", "reason": "one sentence" }
  }
}

ENDEX RESPONSE FORMAT — use this exact format when player types ENDEX:
{
  "time": "final simulated time",
  "consequence": "One sentence: ENDEX — scenario complete.",
  "situation": "ENDEX",
  "dispatches": [],
  "prompt": "",
  "headlines": [],
  "pins": [],
  "lifelines": {
    "safety":    { "status": "GREEN | YELLOW | RED", "reason": "final status" },
    "food":      { "status": "GREEN | YELLOW | RED", "reason": "final status" },
    "health":    { "status": "GREEN | YELLOW | RED", "reason": "final status" },
    "energy":    { "status": "GREEN | YELLOW | RED", "reason": "final status" },
    "comms":     { "status": "GREEN | YELLOW | RED", "reason": "final status" },
    "transport": { "status": "GREEN | YELLOW | RED", "reason": "final status" },
    "hazmat":    { "status": "GREEN | YELLOW | RED", "reason": "final status" },
    "water":     { "status": "GREEN | YELLOW | RED", "reason": "final status" }
  },
  "aar": {
    "situationSummary": "What happened, how it evolved, where it ended. Specific to this location and scenario.",
    "decisionLog": "Assessment of the key decisions made — timing, quality, what was right, what was wrong.",
    "resourceCoordination": "What was requested, what arrived, what gaps remained, how coordination performed.",
    "communications": "Accuracy, timeliness, interoperability — what worked and what failed.",
    "strengths": "Specific things the player did well, grounded in their actual actions this session.",
    "criticalGaps": "Specific failures, delays, or missed actions — no softening.",
    "doctrineReferences": "Relevant NIMS/ICS/NRF/ESF references tied directly to what happened in this scenario.",
    "recommendations": "Specific, actionable improvements calibrated to this role and jurisdiction. Not generic."
  }
}`
}

const INITIAL_LIFELINES_UNKNOWN = Object.fromEntries(
  LIFELINES.map(ll => [ll.key, { status:'UNKNOWN', reason:'Initial assessment pending. Lifeline status will update after the first exercise turn.' }])
)

const SAVE_KEY = 'em_sim_v14'

const defaultState = {
  screen:'portal', scenario:null, jurisdiction:'Mid-Size City', difficulty:'Adaptive', playerName:'', role:'EOC Director',
  history:[], dispatches:[], terminal:[], notepad:'', simTime:'H+0:00',
  situation:'DEVELOPING', turn:0, lifelines:INITIAL_LIFELINES_UNKNOWN, headlines:[],
  dynamicPins:[], worldState:null, aar:null, exerciseTranscript:[],
}


const sitColors = { STABLE:'#1D9E75', DEVELOPING:'#EF9F27', CRITICAL:'#D85A30', DETERIORATING:'#E24B4A', ENDEX:'#888' }

function lifelineSummary(lifelines = {}) {
  return LIFELINES.map(ll => {
    const data = lifelines[ll.key] || {}
    return `${ll.label.padEnd(28, '.')} ${data.status || 'UNKNOWN'}${data.reason ? ` — ${data.reason}` : ''}`
  }).join('\n')
}

function formatExerciseTranscript({ scenario, jurisdiction, difficulty, role, playerName, worldState, transcript = [], finalLifelines, finalSimTime, finalSituation, aar }) {
  const scenarioName = SCENARIOS[scenario]?.name || scenario || 'Unspecified Scenario'
  const generatedDate = new Date().toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
  const generatedTime = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })

  let text = `NEXUS EOC — EXERCISE TRANSCRIPT\n`
  text += `${'='.repeat(72)}\n\n`
  text += `SCENARIO:        ${scenarioName}\n`
  text += `JURISDICTION:    ${jurisdiction || 'Unspecified'}\n`
  text += `ROLE:            ${role || 'EOC Director'}\n`
  text += `DIFFICULTY:      ${difficulty || 'Unspecified'}\n`
  if (playerName) text += `COMMANDER:       ${playerName}\n`
  if (worldState?.location) text += `LOCATION:        ${worldState.location}\n`
  if (worldState?.center) text += `MAP CENTER:      ${worldState.center[0]}, ${worldState.center[1]}\n`
  text += `FINAL TIME:      ${finalSimTime || 'N/A'}\n`
  text += `FINAL STATUS:    ${finalSituation || 'N/A'}\n`
  text += `TURNS:           ${transcript.filter(t => t.type === 'turn').length}\n`
  text += `GENERATED:       ${generatedDate} ${generatedTime}\n\n`
  text += `${'='.repeat(72)}\n\n`

  if (!transcript.length) {
    text += `No transcript records were captured for this session.\n\n`
  }

  transcript.forEach(entry => {
    if (entry.type === 'opening') {
      text += `OPENING BASELINE\n`
      text += `${'-'.repeat(72)}\n`
      if (entry.time) text += `SIM TIME: ${entry.time}\n`
      if (entry.location) text += `LOCATION: ${entry.location}\n`
      text += `\nNARRATIVE\n${entry.narrative || '(none)'}\n\n`
      if (entry.dispatches?.length) {
        text += `INITIAL DISPATCHES\n`
        entry.dispatches.forEach((d, i) => text += `${i+1}. ${typeof d === 'string' ? d : d.text}\n`)
        text += `\n`
      }
      if (entry.pins?.length) {
        text += `INITIAL MAP PINS\n`
        entry.pins.forEach((pin, i) => text += `${i+1}. ${pin.label || 'Unnamed'} (${pin.type || 'UNKNOWN'}) — ${pin.note || ''}\n`)
        text += `\n`
      }
      text += `${'='.repeat(72)}\n\n`
      return
    }

    if (entry.type === 'turn') {
      text += `TURN ${entry.turn}\n`
      text += `${'-'.repeat(72)}\n`
      text += `SIM TIME:  ${entry.simTime || 'N/A'}\n`
      text += `STATUS:    ${entry.situation || 'N/A'}\n\n`
      text += `DIRECTOR INPUT\n${entry.playerInput || '(none)'}\n\n`
      text += `NEXUS RESPONSE\n${entry.aiResponse || '(none)'}\n\n`
      if (entry.prompt) text += `NEXT PROMPT\n${entry.prompt}\n\n`
      if (entry.dispatches?.length) {
        text += `NEW DISPATCHES\n`
        entry.dispatches.forEach((d, i) => text += `${i+1}. ${typeof d === 'string' ? d : d.text}\n`)
        text += `\n`
      }
      if (entry.headlines?.length) {
        text += `MEDIA HEADLINES\n`
        entry.headlines.forEach((h, i) => text += `${i+1}. ${h.source || 'Media'}: ${h.text || h}\n`)
        text += `\n`
      }
      if (entry.pins?.length) {
        text += `NEW MAP PINS\n`
        entry.pins.forEach((pin, i) => text += `${i+1}. ${pin.label || 'Unnamed'} (${pin.type || 'UNKNOWN'}) — ${pin.note || ''}\n`)
        text += `\n`
      }
      text += `COMMUNITY LIFELINES\n${lifelineSummary(entry.lifelines)}\n\n`
      text += `${'='.repeat(72)}\n\n`
    }
  })

  text += `FINAL COMMUNITY LIFELINES\n`
  text += `${'-'.repeat(72)}\n`
  text += `${lifelineSummary(finalLifelines)}\n\n`

  if (aar) {
    text += `AFTER-ACTION REVIEW SUMMARY\n`
    text += `${'-'.repeat(72)}\n`
    AAR_SECTIONS.forEach(s => {
      if (aar[s.key]) {
        text += `\n${s.label.toUpperCase()}\n${aar[s.key]}\n`
      }
    })
    text += `\n`
  }

  text += `${'='.repeat(72)}\n`
  text += `NEXUS EOC — nexuseoc.com\n`
  return cleanPdfText(text)
}


function cleanPdfText(text = '') {
  return String(text)
    .replace(/\u00e2\u20ac\u201d/g, ' - ')
    .replace(/\u00e2\u20ac\u201c/g, ' - ')
    .replace(/\u00e2\u20ac\u02dc/g, "'")
    .replace(/\u00e2\u20ac\u2122/g, "'")
    .replace(/\u00e2\u20ac\u0153/g, '"')
    .replace(/\u00e2\u20ac\u009d/g, '"')
    .replace(/\u00e2\u20ac\u00a2/g, '-')
    .replace(/\u00e2/g, '')
    .replace(/[–—]/g, ' - ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[•·]/g, '-')
    .replace(/[✓✔]/g, 'OK')
    .replace(/[→↗]/g, '->')
    .replace(/[←]/g, '<-')
    .replace(/[↻]/g, 'Restart')
    .replace(/[⇩↓]/g, 'Download')
    .replace(/[★]/g, '*')
    .replace(/\s+\n/g, '\n')
}

function downloadTextFile(filename, text) {
  const blob = new Blob([cleanPdfText(text)], { type:'text/plain;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function escapePdfText(value = '') {
  return String(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function wrapPdfLine(line, maxChars = 92) {
  const words = String(line || '').split(/\s+/)
  const lines = []
  let current = ''
  words.forEach(word => {
    if (!word) return
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current)
      current = word
    } else {
      current = (current + ' ' + word).trim()
    }
  })
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}


const AAR_SCENARIO_IMAGE_URLS = {
  'hurricane landfall': new URL('./assets/missionPortal/hurricane-landfall.jpg', import.meta.url).href,
  'mass casualty incident': new URL('./assets/missionPortal/mass-casualty-incident.jpg', import.meta.url).href,
  'hazardous materials release': new URL('./assets/missionPortal/hazardous-materials-release.jpg', import.meta.url).href,
  'cyber-infrastructure cascade': new URL('./assets/missionPortal/cyber-infrastructure-cascade.jpg', import.meta.url).href,
  'major earthquake': new URL('./assets/missionPortal/major-earthquake.jpg', import.meta.url).href,
  'flash flood / dam failure': new URL('./assets/missionPortal/flash-flood-dam-failure.jpg', import.meta.url).href,
  'urban wildfire': new URL('./assets/missionPortal/urban-wildfire.jpg', import.meta.url).href,
  'winter storm cascade': new URL('./assets/missionPortal/winter-storm-cascade.jpg', import.meta.url).href,
  'radiological dispersal device': new URL('./assets/missionPortal/radiological-dispersal-device.jpg', import.meta.url).href,
  'train derailment - mci / hazmat': new URL('./assets/missionPortal/train-derailment-mci-hazmat.jpg', import.meta.url).href,
}

function pdfSafe(value = '') {
  return cleanPdfText(value)
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/\s+\n/g, '\n')
}

function parseAarForPdf(rawText = '') {
  const safe = pdfSafe(rawText)
  const headings = [
    'SITUATION SUMMARY',
    'DECISION LOG REVIEW',
    'RESOURCE & COORDINATION EFFECTIVENESS',
    'COMMUNICATIONS & INFORMATION MANAGEMENT',
    'DOCTRINE / REFERENCE NOTES',
    'STRENGTHS',
    'CRITICAL GAPS',
    'RECOMMENDATIONS',
  ]
  const headingSet = new Set(headings)
  const meta = {}
  const sections = {}
  let current = '_meta'
  sections[current] = []

  safe.split('\n')
    .filter(line => !/^[=\-]{8,}$/.test(line.trim()))
    .forEach(line => {
      const trimmed = line.trim()
      const upper = trimmed.toUpperCase()
      if (headingSet.has(upper)) {
        current = upper
        sections[current] = []
        return
      }
      if (current === '_meta') {
        const m = trimmed.match(/^([A-Z][A-Z0-9 /_-]{1,34}):\s*(.*)$/)
        if (m) meta[m[1].trim()] = m[2].trim()
      }
      sections[current].push(line)
    })

  Object.keys(sections).forEach(key => {
    sections[key] = sections[key]
      .join('\n')
      .replace(/\n?NEXUS EOC\s*-\s*nexuseoc\.com\s*$/i, '')
      .trim()
  })

  return { meta, sections }
}

function normalizePdfScenarioName(name = '') {
  return String(name || '')
    .toLowerCase()
    .replace(/[—–]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function getAarScenarioImageUrl(scenarioName = '') {
  const normalized = normalizePdfScenarioName(scenarioName)
  if (AAR_SCENARIO_IMAGE_URLS[normalized]) return AAR_SCENARIO_IMAGE_URLS[normalized]
  if (normalized.includes('wildfire')) return AAR_SCENARIO_IMAGE_URLS['urban wildfire']
  if (normalized.includes('hurricane')) return AAR_SCENARIO_IMAGE_URLS['hurricane landfall']
  if (normalized.includes('mass casualty')) return AAR_SCENARIO_IMAGE_URLS['mass casualty incident']
  if (normalized.includes('hazard')) return AAR_SCENARIO_IMAGE_URLS['hazardous materials release']
  if (normalized.includes('cyber')) return AAR_SCENARIO_IMAGE_URLS['cyber-infrastructure cascade']
  if (normalized.includes('earthquake')) return AAR_SCENARIO_IMAGE_URLS['major earthquake']
  if (normalized.includes('flood') || normalized.includes('dam')) return AAR_SCENARIO_IMAGE_URLS['flash flood / dam failure']
  if (normalized.includes('winter')) return AAR_SCENARIO_IMAGE_URLS['winter storm cascade']
  if (normalized.includes('radiological')) return AAR_SCENARIO_IMAGE_URLS['radiological dispersal device']
  if (normalized.includes('train')) return AAR_SCENARIO_IMAGE_URLS['train derailment - mci / hazmat']
  return null
}

function findScenarioForPdf(scenarioName = '') {
  const needle = normalizePdfScenarioName(scenarioName)
  return Object.entries(SCENARIOS || {}).find(([, value]) => normalizePdfScenarioName(value?.name || value?.title || '') === needle)?.[1]
    || Object.values(SCENARIOS || {}).find(value => normalizePdfScenarioName(value?.name || value?.title || '').includes(needle) || needle.includes(normalizePdfScenarioName(value?.name || value?.title || '')))
    || null
}

function firstTextField(obj, keys = []) {
  if (!obj || typeof obj !== 'object') return ''
  for (const key of keys) {
    if (typeof obj[key] === 'string' && obj[key].trim()) return obj[key].trim()
  }
  return ''
}

function roleDescriptionForPdf(roleName = '') {
  const role = Object.values(ROLES || {}).find(r => normalizePdfScenarioName(r?.name || r?.label || r?.title || '') === normalizePdfScenarioName(roleName))
  return firstTextField(role, ['description', 'summary', 'focus', 'function'])
    || 'Senior emergency management coordinator responsible for cross-ESF coordination, resource prioritization, policy support, and strategic decision-making.'
}

function difficultyDescriptionForPdf(difficultyName = '') {
  const d = Object.values(DIFFICULTIES || {}).find(item => normalizePdfScenarioName(item?.name || item?.label || item?.title || '') === normalizePdfScenarioName(difficultyName))
  const desc = firstTextField(d, ['description', 'summary', 'profile'])
  return desc || `${difficultyName || 'Selected'} exercise pressure with realistic incident consequences and decision trade-offs.`
}

function jurisdictionDescriptionForPdf(jurisdictionName = '') {
  const context = JURISDICTION_CONTEXT?.[jurisdictionName]
    || Object.entries(JURISDICTION_CONTEXT || {}).find(([key]) => normalizePdfScenarioName(key) === normalizePdfScenarioName(jurisdictionName))?.[1]
  return firstTextField(context, ['description', 'summary', 'context'])
    || (typeof context === 'string' ? context : '')
    || `${jurisdictionName || 'Selected jurisdiction'} operating environment with local capabilities, constraints, mutual aid considerations, and jurisdiction-specific incident impacts.`
}

function scenarioDescriptionForPdf(scenarioName = '') {
  const scenario = findScenarioForPdf(scenarioName)
  return firstTextField(scenario, ['description', 'summary', 'shortDescription', 'subtitle'])
    || `${scenarioName || 'Selected scenario'} emergency operations exercise with realistic incident pressure, resource trade-offs, and cross-functional coordination requirements.`
}

function escapePdf(value = '') {
  return String(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function encodePdfAscii(value = '') {
  return new TextEncoder().encode(value)
}

function concatPdfChunks(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  chunks.forEach(chunk => {
    out.set(chunk, offset)
    offset += chunk.length
  })
  return out
}

function parseJpegSize(bytes) {
  let offset = 2
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xFF) break
    const marker = bytes[offset + 1]
    const length = (bytes[offset + 2] << 8) + bytes[offset + 3]
    if (marker >= 0xC0 && marker <= 0xC3) {
      return {
        height: (bytes[offset + 5] << 8) + bytes[offset + 6],
        width: (bytes[offset + 7] << 8) + bytes[offset + 8],
      }
    }
    offset += 2 + length
  }
  return { width: 960, height: 540 }
}

async function loadJpegForPdf(url) {
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const bytes = new Uint8Array(await res.arrayBuffer())
    const size = parseJpegSize(bytes)
    return { bytes, ...size }
  } catch {
    return null
  }
}

async function renderAarPdfV8(filename, rawText) {
  const { meta, sections } = parseAarForPdf(rawText)
  const scenarioName = meta.SCENARIO || 'Scenario'
  const generated = meta.GENERATED || new Date().toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
  const participant = meta.COMMANDER || meta.PARTICIPANT || meta.NAME || 'Not provided'
  const scenarioImage = await loadJpegForPdf(getAarScenarioImageUrl(scenarioName))

  const W = 792
  const H = 612
  const contentX = 24
  const contentW = W - 48
  const top = H - 22
  const colors = {
    navy:[2/255, 11/255, 19/255],
    navy2:[6/255, 20/255, 33/255],
    header:'#061522',
    panel:'#081827',
    panel2:'#0B1D2E',
    panel3:'#0A1825',
    border:'#24445F',
    border2:'#315B78',
    teal:'#2DE2B8',
    cyan:'#45A3FF',
    blue:'#2E83FF',
    green:'#22C55E',
    red:'#EF4444',
    amber:'#F59B22',
    purple:'#A855F7',
    text:'#F4F8FE',
    muted:'#B9C8D8',
    dim:'#6F8195',
  }

  const hexToRgb = hex => {
    const clean = hex.replace('#', '')
    return [
      parseInt(clean.slice(0,2), 16) / 255,
      parseInt(clean.slice(2,4), 16) / 255,
      parseInt(clean.slice(4,6), 16) / 255,
    ]
  }
  const rg = hex => hexToRgb(hex).map(v => v.toFixed(3)).join(' ')
  const opsPages = []
  let ops = []
  const add = op => ops.push(op)
  const fill = hex => add(`${rg(hex)} rg`)
  const stroke = hex => add(`${rg(hex)} RG`)
  const textAt = (value, x, y, size = 8, font = 'F1', color = colors.text) => {
    fill(color)
    add(`BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdf(pdfSafe(value))}) Tj ET`)
  }
  const rect = (x, y, w, h, color, mode = 'f') => {
    fill(color)
    add(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${mode}`)
  }
  const rectStroke = (x, y, w, h, color, lw = 0.6) => {
    stroke(color)
    add(`${lw} w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`)
  }
  const line = (x1, y1, x2, y2, color, lw = 0.8) => {
    stroke(color)
    add(`${lw} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`)
  }
  const circle = (cx, cy, r, color, filled = false) => {
    const k = 0.5522847498
    filled ? fill(color) : stroke(color)
    add(`${(cx+r).toFixed(2)} ${cy.toFixed(2)} m ${(cx+r).toFixed(2)} ${(cy+k*r).toFixed(2)} ${(cx+k*r).toFixed(2)} ${(cy+r).toFixed(2)} ${cx.toFixed(2)} ${(cy+r).toFixed(2)} c ${(cx-k*r).toFixed(2)} ${(cy+r).toFixed(2)} ${(cx-r).toFixed(2)} ${(cy+k*r).toFixed(2)} ${(cx-r).toFixed(2)} ${cy.toFixed(2)} c ${(cx-r).toFixed(2)} ${(cy-k*r).toFixed(2)} ${(cx-k*r).toFixed(2)} ${(cy-r).toFixed(2)} ${cx.toFixed(2)} ${(cy-r).toFixed(2)} c ${(cx+k*r).toFixed(2)} ${(cy-r).toFixed(2)} ${(cx+r).toFixed(2)} ${(cy-k*r).toFixed(2)} ${(cx+r).toFixed(2)} ${cy.toFixed(2)} c ${filled ? 'f' : 'S'}`)
  }
  const roundedRect = (x, y, w, h, color, filled = true, lw = 0.8) => {
    filled ? fill(color) : stroke(color)
    add(`${lw} w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${filled ? 'f' : 'S'}`)
  }

  const wrap = (value, size, maxW, fontFactor = 0.50) => {
    const words = pdfSafe(value).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
    const maxChars = Math.max(12, Math.floor(maxW / (size * fontFactor)))
    const lines = []
    let cur = ''
    words.forEach(word => {
      const next = `${cur} ${word}`.trim()
      if (next.length > maxChars) {
        if (cur) lines.push(cur)
        cur = word
      } else cur = next
    })
    if (cur) lines.push(cur)
    return lines
  }
  const paraHeight = (value, maxW, size, leading) => {
    let lines = 0
    String(value || '').split(/\n\s*\n/).forEach(part => {
      if (part.trim()) lines += wrap(part, size, maxW).length + 1
    })
    return Math.max(0, lines - 1) * leading
  }
  const drawPara = (value, x, y, maxW, size = 8, leading = 9.8, color = colors.text, font = 'F1', maxLines = null) => {
    let lines = []
    String(value || '').split(/\n\s*\n/).forEach(part => {
      if (part.trim()) {
        lines.push(...wrap(part, size, maxW))
        lines.push('')
      }
    })
    if (lines.length && lines[lines.length - 1] === '') lines.pop()
    if (maxLines && lines.length > maxLines) {
      lines = lines.slice(0, maxLines)
      lines[lines.length - 1] = `${lines[lines.length - 1].replace(/\.*$/, '')}...`
    }
    lines.forEach(lineText => {
      if (!lineText) y -= leading * 0.5
      else {
        textAt(lineText, x, y, size, font, color)
        y -= leading
      }
    })
    return y
  }

  function drawBackground() {
    const steps = 90
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1)
      const r = colors.navy[0] * (1 - t) + colors.navy2[0] * t
      const g = colors.navy[1] * (1 - t) + colors.navy2[1] * t
      const b = colors.navy[2] * (1 - t) + colors.navy2[2] * t
      add(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`)
      add(`0 ${(H * (i / steps)).toFixed(2)} ${W} ${(H / steps + 1).toFixed(2)} re f`)
    }
  }

  function drawHeader() {
    const h = 34
    rect(contentX, top - h, contentW, h, colors.header)
    rectStroke(contentX, top - h, contentW, h, colors.border, 0.7)
    rect(contentX, top - h - 3, contentW, 3, colors.teal)
    textAt('NEXUS', contentX + 14, top - 27, 23, 'F2', colors.text)
    textAt('EOC', contentX + 104, top - 27, 23, 'F2', colors.teal)
    textAt('After-Action Review', contentX + contentW / 2 - 72, top - 25, 16, 'F2', colors.text)
    textAt(`Generated ${generated}`, contentX + contentW - 110, top - 24, 6.8, 'F2', colors.dim)
  }

  function drawFooter(pageNo) {
    line(24, 24, W - 24, 24, colors.border, 0.5)
    textAt('NEXUS EOC', 24, 11, 7, 'F2', colors.dim)
    textAt('After-Action Review', 88, 11, 7, 'F1', colors.dim)
    textAt(`Page ${pageNo}`, W - 55, 11, 7, 'F1', colors.dim)
  }

  function drawIcon(icon, x, y, size, accent) {
    rectStroke(x, y, size, size, accent, 0.8)
    const cx = x + size / 2
    const cy = y + size / 2
    stroke(accent)
    fill(accent)
    add(`0.95 w`)
    if (icon === 'pin') {
      circle(cx, cy + 2, 3.6, accent)
      line(cx, cy - 1.6, cx, y + 5.5, accent, 0.95)
      circle(cx, cy + 2, 1.0, accent, true)
    } else if (icon === 'clipboard') {
      rectStroke(x + 7, y + 6, size - 14, size - 12, accent, 0.95)
      rectStroke(cx - 5, y + size - 9, 10, 5, accent, 0.95)
      line(x + 10, cy + 2, x + size - 10, cy + 2, accent, 0.95)
      line(x + 10, cy - 3, x + size - 10, cy - 3, accent, 0.95)
    } else if (icon === 'chain') {
      rectStroke(x + 6, cy - 3, 10, 10, accent, 0.95)
      rectStroke(x + size - 16, cy - 7, 10, 10, accent, 0.95)
      line(cx - 4, cy + 2, cx + 4, cy - 2, accent, 0.95)
    } else if (icon === 'comms') {
      const mastTop = y + size - 7
      const mastBase = y + 6
      line(cx, mastBase, cx, mastTop, accent, 0.95)
      line(cx, mastTop, x + 7, mastBase, accent, 0.95)
      line(cx, mastTop, x + size - 7, mastBase, accent, 0.95)
      line(cx - 4, mastBase + 5, cx + 4, mastBase + 5, accent, 0.95)
      line(x + 6, y + size - 5, x + 10, y + size - 9, accent, 0.95)
      line(x + size - 6, y + size - 5, x + size - 10, y + size - 9, accent, 0.95)
      line(x + 8, y + size - 2, x + 13, y + size - 7, accent, 0.95)
      line(x + size - 8, y + size - 2, x + size - 13, y + size - 7, accent, 0.95)
      circle(cx, mastTop, 1.1, accent, true)
    } else if (icon === 'book') {
      rectStroke(x + 7, y + 7, size / 2 - 7, size - 14, accent, 0.95)
      rectStroke(cx, y + 7, size / 2 - 7, size - 14, accent, 0.95)
      line(cx, y + 7, cx, y + size - 7, accent, 0.95)
    } else if (icon === 'check') {
      line(x + 8, cy, cx - 1, y + 8, accent, 0.95)
      line(cx - 1, y + 8, x + size - 7, y + size - 8, accent, 0.95)
    } else if (icon === 'warn') {
      line(cx, y + size - 6, x + 7, y + 7, accent, 0.95)
      line(x + 7, y + 7, x + size - 7, y + 7, accent, 0.95)
      line(x + size - 7, y + 7, cx, y + size - 6, accent, 0.95)
      line(cx, y + 14, cx, y + 21, accent, 0.95)
      circle(cx, y + 10, 1, accent, true)
    } else if (icon === 'bulb') {
      circle(cx, cy + 3, 6.5, accent)
      line(cx - 4, cy - 4, cx + 4, cy - 4, accent, 0.95)
      line(cx - 3, cy - 8, cx + 3, cy - 8, accent, 0.95)
      line(cx, y + size - 6, cx, y + size - 3, accent, 0.95)
    }
  }

  const drawCard = (x, yTop, w, title, body, accent, icon, size = 8, leading = 9.55, fillColor = colors.panel) => {
    const bodyW = w - 18 - 34
    const bodyH = paraHeight(body, bodyW, size, leading)
    const h = Math.max(58, 38 + bodyH)
    const yBottom = yTop - h
    roundedRect(x, yBottom, w, h, fillColor)
    rectStroke(x, yBottom, w, h, accent, 0.9)
    rect(x, yBottom, 3, h, accent)
    drawIcon(icon, x + 10, yTop - 31, 20, accent)
    textAt(title.toUpperCase(), x + 40, yTop - 23, 11.5, 'F2', accent)
    drawPara(body, x + 40, yTop - 42, bodyW, size, leading, colors.text)
    return yBottom
  }

  function setupBox(x, yTop, w, label, value, h = 35) {
    rect(x, yTop - h, w, h, colors.panel3)
    rectStroke(x, yTop - h, w, h, colors.border2, 0.5)
    textAt(label.toUpperCase(), x + 8, yTop - 11, 6.8, 'F2', colors.teal)
    drawPara(value, x + 8, yTop - 23, w - 16, 6.9, 7.8, colors.text, 'F1', 3)
  }

  function metaStrip(x, yTop, w, h, pairs) {
    rect(x, yTop - h, w, h, colors.panel2)
    rectStroke(x, yTop - h, w, h, colors.border, 0.5)
    const cellW = w / pairs.length
    pairs.forEach(([label, value], i) => {
      const cx = x + i * cellW
      if (i) line(cx, yTop - h + 5, cx, yTop - 5, colors.border, 0.45)
      textAt(label.toUpperCase(), cx + 5, yTop - 12, 5.7, 'F2', colors.dim)
      drawPara(value, cx + 5, yTop - 25, cellW - 10, 6.85, 7.8, colors.text, 'F2', 2)
    })
  }

  function drawScenarioImage(x, yTop, imgW) {
    const imgH = imgW / (16 / 9)
    rect(x, yTop - imgH - 18, imgW, imgH + 18, colors.panel2)
    if (scenarioImage) {
      add('q')
      add(`${imgW.toFixed(2)} 0 0 ${imgH.toFixed(2)} ${x.toFixed(2)} ${(yTop - imgH).toFixed(2)} cm /Im1 Do`)
      add('Q')
    }
    rectStroke(x, yTop - imgH - 18, imgW, imgH + 18, colors.border, 0.5)
    textAt(scenarioName, x + 8, yTop - imgH - 12, 8.5, 'F2', colors.amber)
  }

  const startPage = pageNo => {
    ops = []
    drawBackground()
    drawHeader()
  }
  const finishPage = pageNo => {
    drawFooter(pageNo)
    opsPages.push(ops)
  }

  const scenarioDesc = scenarioDescriptionForPdf(scenarioName)
  const jurisdictionDesc = jurisdictionDescriptionForPdf(meta.JURISDICTION)
  const roleDesc = roleDescriptionForPdf(meta.ROLE)
  const difficultyDesc = difficultyDescriptionForPdf(meta.DIFFICULTY)

  const colGap = 14
  const colW = (contentW - colGap) / 2
  const leftX = contentX
  const rightX = contentX + colW + colGap

  startPage(1)
  let y = top - 44
  const heroH = 148
  const imgW = 188
  drawScenarioImage(contentX, y, imgW)
  const rightSetupX = contentX + imgW + 12
  const rightSetupW = contentW - imgW - 12
  const setupGap = 6
  const setupBoxH = (heroH - 3 * setupGap) / 4
  ;[
    ['Scenario', scenarioDesc],
    ['Jurisdiction', jurisdictionDesc],
    ['Role / Position', roleDesc],
    ['Difficulty', difficultyDesc],
  ].forEach(([label, value], idx) => setupBox(rightSetupX, y - idx * (setupBoxH + setupGap), rightSetupW, label, value, setupBoxH))
  y -= heroH + 8

  metaStrip(contentX, y, contentW, 34, [
    ['Participant', participant],
    ['Scenario', scenarioName],
    ['Jurisdiction', meta.JURISDICTION || 'Unspecified'],
    ['Role', meta.ROLE || 'EOC Director'],
    ['Difficulty', meta.DIFFICULTY || 'Unspecified'],
    ['Location', meta.LOCATION || 'Unspecified'],
    ['Session', `${meta['SESSION START'] || 'N/A'} to ${meta['SESSION END'] || 'N/A'}`],
    ['Duration', meta.DURATION || 'N/A'],
  ])
  y -= 44

  let leftY = y
  let rightY = y
  leftY = drawCard(leftX, leftY, colW, 'Situation Summary', sections['SITUATION SUMMARY'], colors.cyan, 'pin', 8.0, 9.55, colors.panel) - 8
  leftY = drawCard(leftX, leftY, colW, 'Decision Log Review', sections['DECISION LOG REVIEW'], colors.blue, 'clipboard', 8.0, 9.55, colors.panel)
  rightY = drawCard(rightX, rightY, colW, 'Strengths', sections.STRENGTHS, colors.green, 'check', 7.95, 9.5, colors.panel2) - 8
  rightY = drawCard(rightX, rightY, colW, 'Critical Gaps', sections['CRITICAL GAPS'], colors.red, 'warn', 7.95, 9.5, colors.panel2)
  finishPage(1)

  startPage(2)
  y = top - 52
  leftY = y
  rightY = y
  leftY = drawCard(leftX, leftY, colW, 'Resource & Coordination Effectiveness', sections['RESOURCE & COORDINATION EFFECTIVENESS'], colors.teal, 'chain', 8.0, 9.55, colors.panel) - 8
  leftY = drawCard(leftX, leftY, colW, 'Communications & Information Management', sections['COMMUNICATIONS & INFORMATION MANAGEMENT'], colors.cyan, 'comms', 8.0, 9.55, colors.panel) - 8
  leftY = drawCard(leftX, leftY, colW, 'Doctrine / Reference Notes', sections['DOCTRINE / REFERENCE NOTES'], colors.purple, 'book', 7.8, 9.3, colors.panel)
  rightY = drawCard(rightX, rightY, colW, 'Recommendations', sections.RECOMMENDATIONS, colors.amber, 'bulb', 8.0, 9.55, colors.panel2)
  finishPage(2)

  const objects = []
  const addObj = value => { objects.push(value); return objects.length }
  const font1 = addObj(encodePdfAscii('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'))
  const font2 = addObj(encodePdfAscii('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'))
  let imageObj = null
  if (scenarioImage) {
    const header = encodePdfAscii(`<< /Type /XObject /Subtype /Image /Width ${scenarioImage.width} /Height ${scenarioImage.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${scenarioImage.bytes.length} >>\nstream\n`)
    const footer = encodePdfAscii('\nendstream')
    imageObj = addObj(concatPdfChunks([header, scenarioImage.bytes, footer]))
  }

  const pageObjs = []
  opsPages.forEach(pageOps => {
    const stream = pageOps.join('\n')
    const contentObj = addObj(encodePdfAscii(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`))
    const xobjects = imageObj ? `/XObject << /Im1 ${imageObj} 0 R >>` : ''
    const pageObj = addObj(encodePdfAscii(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R >> ${xobjects} >> /Contents ${contentObj} 0 R >>`))
    pageObjs.push(pageObj)
  })

  const pagesObj = addObj(encodePdfAscii(`<< /Type /Pages /Kids [${pageObjs.map(n => `${n} 0 R`).join(' ')}] /Count ${pageObjs.length} >>`))
  pageObjs.forEach(n => {
    const oldText = new TextDecoder().decode(objects[n - 1])
    objects[n - 1] = encodePdfAscii(oldText.replace('/Parent 0 0 R', `/Parent ${pagesObj} 0 R`))
  })
  const catalogObj = addObj(encodePdfAscii(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`))

  const chunks = []
  let offset = 0
  const push = chunk => {
    chunks.push(chunk)
    offset += chunk.length
  }
  push(encodePdfAscii('%PDF-1.4\n'))
  const offsets = [0]
  objects.forEach((obj, idx) => {
    offsets.push(offset)
    push(encodePdfAscii(`${idx + 1} 0 obj\n`))
    push(obj)
    push(encodePdfAscii('\nendobj\n'))
  })
  const xref = offset
  push(encodePdfAscii(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`))
  for (let i = 1; i < offsets.length; i++) push(encodePdfAscii(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`))
  push(encodePdfAscii(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>\nstartxref\n${xref}\n%%EOF`))

  const pdfBytes = concatPdfChunks(chunks)
  const blob = new Blob([pdfBytes], { type:'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.pdf') ? filename : filename.replace(/\.txt$/i, '.pdf')
  a.click()
  URL.revokeObjectURL(url)
}


function downloadPlainPdfTextFile(filename, text) {
  text = cleanPdfText(text)
  const pageW = 612
  const pageH = 792
  const margin = 42
  const fontSize = 9
  const lineH = 13
  const maxLines = Math.floor((pageH - margin * 2) / lineH)
  const rawLines = String(text || '').split('\n')
  const lines = rawLines.flatMap(line => wrapPdfLine(line, 92))
  const pages = []
  for (let i = 0; i < lines.length; i += maxLines) pages.push(lines.slice(i, i + maxLines))
  if (!pages.length) pages.push(['NEXUS EOC Transcript'])

  const objects = []
  const add = value => { objects.push(value); return objects.length }
  const fontObj = add('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>')
  const pageObjs = []

  pages.forEach((pageLines, pageIdx) => {
    const content = ['BT', `/F1 ${fontSize} Tf`, `${margin} ${pageH - margin} Td`]
    pageLines.forEach((line, idx) => {
      if (idx > 0) content.push(`0 -${lineH} Td`)
      content.push(`(${escapePdfText(line)}) Tj`)
    })
    content.push('ET')
    const stream = content.join('\n')
    const contentObj = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
    const pageObj = add(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${contentObj} 0 R >>`)
    pageObjs.push(pageObj)
  })

  const pagesObj = add(`<< /Type /Pages /Kids [${pageObjs.map(n => `${n} 0 R`).join(' ')}] /Count ${pageObjs.length} >>`)
  pageObjs.forEach(n => { objects[n - 1] = objects[n - 1].replace('/Parent 0 0 R', `/Parent ${pagesObj} 0 R`) })
  const catalogObj = add(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`)

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((obj, idx) => {
    offsets.push(pdf.length)
    pdf += `${idx + 1} 0 obj\n${obj}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i < offsets.length; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>\nstartxref\n${xref}\n%%EOF`

  const blob = new Blob([pdf], { type:'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.pdf') ? filename : filename.replace(/\.txt$/i, '.pdf')
  a.click()
  URL.revokeObjectURL(url)
}


async function downloadPdfTextFile(filename, text) {
  const cleaned = cleanPdfText(text)
  if (/transcript/i.test(filename) || /EXERCISE TRANSCRIPT/i.test(cleaned)) {
    downloadPlainPdfTextFile(filename, cleaned)
    return
  }
  try {
    await renderAarPdfV8(filename, cleaned)
  } catch (err) {
    console.error('AAR PDF render failed; using plain fallback.', err)
    downloadPlainPdfTextFile(filename, cleaned)
  }
}


// ─── AAR DISPLAY COMPONENT ────────────────────────────────────────────────────
function AARDisplay({ aar, scenario, jurisdiction, difficulty, role, playerName, turns, simTime, worldState, transcript, lifelines, situation, onReset, onRestart, onMissionPortal, fs, ac, al }) {
  const scenarioName = SCENARIOS[scenario]?.name || scenario || 'Scenario'
  const generatedDate = new Date().toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
  const startTime = transcript?.[0]?.time || 'H+0:00'
  const endTime = simTime || 'ENDEX'
  const duration = `${turns || 0} turn${turns === 1 ? '' : 's'}`
  const clean = value => value || 'Not captured in this exercise record.'

  function downloadAAR() {
    let report = `NEXUS EOC — AFTER-ACTION REVIEW\n`
    report += `${'='.repeat(72)}\n\n`
    report += `SCENARIO:        ${scenarioName}\n`
    report += `JURISDICTION:    ${jurisdiction || 'Unspecified'}\n`
    report += `ROLE:            ${role || 'EOC Director'}\n`
    report += `DIFFICULTY:      ${difficulty || 'Unspecified'}\n`
    if (playerName) report += `COMMANDER:       ${playerName}\n`
    if (worldState?.location) report += `LOCATION:        ${worldState.location}\n`
    report += `SESSION START:   ${startTime}\n`
    report += `SESSION END:     ${endTime}\n`
    report += `DURATION:        ${duration}\n`
    report += `GENERATED:       ${generatedDate}\n\n`
    report += `${'='.repeat(72)}\n\n`

    const order = [
      ['SITUATION SUMMARY', aar?.situationSummary],
      ['DECISION LOG REVIEW', aar?.decisionLog],
      ['RESOURCE & COORDINATION EFFECTIVENESS', aar?.resourceCoordination],
      ['COMMUNICATIONS & INFORMATION MANAGEMENT', aar?.communications],
      ['DOCTRINE / REFERENCE NOTES', aar?.doctrineReferences],
      ['STRENGTHS', aar?.strengths],
      ['CRITICAL GAPS', aar?.criticalGaps],
      ['RECOMMENDATIONS', aar?.recommendations],
    ]

    order.forEach(([label, content]) => {
      report += `${label}\n`
      report += `${'-'.repeat(label.length)}\n`
      report += `${clean(content)}\n\n`
    })

    report += `${'='.repeat(72)}\n`
    report += `NEXUS EOC — nexuseoc.com\n`

    if (typeof downloadPdfTextFile === 'function') {
      downloadPdfTextFile(`NEXUS_EOC_AAR_${scenarioName.replace(/\s+/g,'_')}_${generatedDate.replace(/\s+/g,'_')}.pdf`, report)
    } else {
      downloadTextFile(`NEXUS_EOC_AAR_${scenarioName.replace(/\s+/g,'_')}_${generatedDate.replace(/\s+/g,'_')}.txt`, report)
    }
  }

  function downloadTranscript() {
    const report = formatExerciseTranscript({
      scenario, jurisdiction, difficulty, role, playerName,
      worldState, transcript, finalLifelines: lifelines,
      finalSimTime: simTime, finalSituation: situation, aar,
    })
    if (typeof downloadPdfTextFile === 'function') {
      downloadPdfTextFile(`NEXUS_EOC_Transcript_${scenarioName.replace(/\s+/g,'_')}_${generatedDate.replace(/\s+/g,'_')}.pdf`, report)
    } else {
      downloadTextFile(`NEXUS_EOC_Transcript_${scenarioName.replace(/\s+/g,'_')}_${generatedDate.replace(/\s+/g,'_')}.txt`, report)
    }
  }

  const UI = {
    bg:'#020B13',
    border:'rgba(87, 146, 198, 0.30)',
    text:'#F4F8FE',
    muted:'#B9C8D8',
    dim:'#6F8195',
    cyan:'#45A3FF',
    teal:'#2DE2B8',
    green:'#22C55E',
    red:'#EF4444',
    amber:'#F59B22',
    purple:'#A855F7',
  }

  const metaBox = (label, value, sub) => (
    <div style={{ borderLeft:`1px solid ${UI.border}`, padding:'0 20px', minHeight:56, display:'flex', flexDirection:'column', justifyContent:'center' }}>
      <div style={{ color:UI.dim, fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:5 }}>{label}</div>
      <div style={{ color:UI.text, fontSize:15, fontWeight:850, lineHeight:1.2 }}>{value}</div>
      {sub && <div style={{ color:UI.muted, fontSize:12, marginTop:4 }}>{sub}</div>}
    </div>
  )

  const actionButton = (label, sub, color, onClick, icon) => (
    <button onClick={onClick} style={{
      minWidth:164,
      minHeight:58,
      display:'grid',
      gridTemplateColumns:'24px 1fr',
      gap:10,
      alignItems:'center',
      textAlign:'left',
      padding:'10px 13px',
      background:`linear-gradient(180deg, ${color}18, rgba(4,17,29,0.76))`,
      border:`1px solid ${color}80`,
      borderRadius:6,
      color:UI.text,
      cursor:'pointer',
      boxShadow:`0 14px 34px ${color}12`,
      fontFamily:'Inter, Segoe UI, sans-serif'
    }}>
      <span style={{ color, fontSize:21, lineHeight:1 }}>{icon}</span>
      <span>
        <span style={{ display:'block', color, fontWeight:900, fontSize:13 }}>{label}</span>
        <span style={{ display:'block', color:UI.muted, fontSize:11, marginTop:3 }}>{sub}</span>
      </span>
    </button>
  )

  const sectionCard = ({ title, icon, accent, content }) => (
    <section style={{
      border:`1px solid ${accent}55`,
      borderLeft:`3px solid ${accent}`,
      borderRadius:7,
      background:`linear-gradient(135deg, ${accent}12, rgba(4,17,29,0.84) 42%, rgba(2,11,19,0.96))`,
      padding:'18px 20px',
      boxShadow:'0 18px 42px rgba(0,0,0,0.22)',
    }}>
      <div style={{ display:'grid', gridTemplateColumns:'42px 1fr', gap:14, alignItems:'start' }}>
        <div style={{ width:36, height:36, borderRadius:10, border:`1px solid ${accent}80`, color:accent, display:'grid', placeItems:'center', fontSize:22, background:`${accent}10` }}>
          {icon}
        </div>
        <div>
          <h2 style={{ margin:'1px 0 9px', color:accent, fontSize:18, lineHeight:1.15, fontWeight:950, letterSpacing:'0.04em', textTransform:'uppercase' }}>{title}</h2>
          <div style={{ color:UI.text, opacity:0.92, fontSize:14, lineHeight:1.62, whiteSpace:'pre-wrap' }}>
            {clean(content)}
          </div>
        </div>
      </div>
    </section>
  )

  return (
    <div style={{
      minHeight:'100vh',
      width:'100vw',
      color:UI.text,
      fontFamily:'Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
      background:`radial-gradient(circle at 72% 8%, rgba(46,131,255,0.14), transparent 30%), linear-gradient(135deg, ${UI.bg}, #02070D 62%)`,
      overflowX:'hidden'
    }}>
      <div style={{ minHeight:'100vh', backgroundImage:'linear-gradient(rgba(69,163,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(69,163,255,0.045) 1px, transparent 1px)', backgroundSize:'48px 48px' }}>
        <header style={{ borderBottom:`1px solid ${UI.border}`, background:'linear-gradient(180deg, rgba(2,10,18,0.98), rgba(3,13,22,0.96))' }}>
          <div style={{ width:'min(100%, 1720px)', margin:'0 auto', padding:'18px 24px', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:22, alignItems:'center', boxSizing:'border-box' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, paddingRight:18, borderRight:`1px solid ${UI.border}` }}>
              <div style={{ width:54, height:54, border:`2px solid ${UI.text}`, borderRadius:14, display:'grid', placeItems:'center', color:UI.text, fontWeight:950, fontSize:22, boxShadow:'0 0 28px rgba(69,163,255,0.14)' }}>N</div>
              <div>
                <div style={{ color:UI.text, fontSize:29, fontWeight:950, letterSpacing:'0.06em', lineHeight:1 }}>NEXUS <span style={{ color:UI.teal }}>EOC</span></div>
                <div style={{ color:UI.muted, fontSize:11, marginTop:7 }}>Simulated Emergency Operations Platform</div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(140px, 1fr))', gap:0 }}>
              {metaBox('Scenario', scenarioName, worldState?.location)}
              {metaBox('Position / Function', role || 'EOC Director')}
              {metaBox('Jurisdiction', jurisdiction || 'Unspecified')}
              {metaBox('Difficulty', difficulty || 'Unspecified')}
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', flexWrap:'wrap' }}>
              {actionButton('Download AAR PDF', 'Review Report', UI.green, downloadAAR, '⇩')}
              {actionButton('Download Transcript PDF', 'Full Exercise Record', UI.cyan, downloadTranscript, '⇩')}
              {actionButton('Restart Scenario', 'Same Setup', UI.purple, onRestart || onReset, '↻')}
              {actionButton('Mission Portal', 'Return to Dashboard', UI.cyan, onMissionPortal || onReset, '▦')}
            </div>
          </div>
        </header>

        <main style={{ width:'min(100%, 1720px)', margin:'0 auto', padding:'28px 24px 34px', boxSizing:'border-box' }}>
          <section style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:26, alignItems:'center', paddingBottom:28, borderBottom:`1px solid ${UI.border}` }}>
            <div style={{ display:'grid', gridTemplateColumns:'78px 1fr', gap:20, alignItems:'center' }}>
              <div style={{ width:70, height:70, borderRadius:18, border:`2px solid ${UI.teal}`, color:UI.teal, display:'grid', placeItems:'center', fontSize:36, background:'rgba(45,226,184,0.10)', boxShadow:'0 16px 40px rgba(45,226,184,0.10)' }}>✓</div>
              <div>
                <h1 style={{ margin:0, color:UI.text, fontSize:38, lineHeight:1.05, fontWeight:950, letterSpacing:'0.035em', textTransform:'uppercase' }}>After-Action Review</h1>
                <p style={{ margin:'10px 0 0', color:UI.text, opacity:0.86, maxWidth:780, fontSize:16, lineHeight:1.5 }}>
                  This After-Action Review is generated from your exercise transcript, decisions, injects, map updates, media feed, and scenario progression.
                </p>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, auto)', gap:0 }}>
              {metaBox('Session Start', startTime)}
              {metaBox('Session End', endTime)}
              {metaBox('Duration', duration)}
            </div>
          </section>

          <section style={{ display:'grid', gridTemplateColumns:'1fr 1.02fr', gap:18, alignItems:'start', marginTop:22 }}>
            <div style={{ display:'grid', gap:12 }}>
              {sectionCard({ title:'Situation Summary', icon:'⌖', accent:UI.cyan, content:aar?.situationSummary })}
              {sectionCard({ title:'Decision Log Review', icon:'▣', accent:UI.amber, content:aar?.decisionLog })}
              {sectionCard({ title:'Resource & Coordination Effectiveness', icon:'⛓', accent:UI.cyan, content:aar?.resourceCoordination })}
              {sectionCard({ title:'Communications & Information Management', icon:'⌁', accent:UI.cyan, content:aar?.communications })}
              {sectionCard({ title:'Doctrine / Reference Notes', icon:'▰', accent:UI.purple, content:aar?.doctrineReferences })}
            </div>

            <div style={{ display:'grid', gap:12 }}>
              {sectionCard({ title:'Strengths', icon:'✓', accent:UI.green, content:aar?.strengths })}
              {sectionCard({ title:'Critical Gaps', icon:'!', accent:UI.red, content:aar?.criticalGaps })}
              {sectionCard({ title:'Recommendations', icon:'☼', accent:UI.amber, content:aar?.recommendations })}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

function useHorizDrag(containerRef, onUpdate) {
  const drag = useRef(null)
  function onMouseDown(idx, e) {
    e.preventDefault()
    const rect = containerRef.current.getBoundingClientRect()
    drag.current = { idx, containerLeft:rect.left, containerW:rect.width }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }
  function onMove(e) {
    if (!drag.current) return
    const { idx, containerLeft, containerW } = drag.current
    const pct = ((e.clientX - containerLeft) / containerW) * 100
    onUpdate(idx, pct)
  }
  function onUp() {
    drag.current = null
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  return onMouseDown
}

function useVertDrag(containerRef, onUpdate) {
  const drag = useRef(null)
  function onMouseDown(e) {
    e.preventDefault()
    const rect = containerRef.current.getBoundingClientRect()
    drag.current = { containerTop:rect.top, containerH:rect.height }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }
  function onMove(e) {
    if (!drag.current) return
    const { containerTop, containerH } = drag.current
    const pct = ((e.clientY - containerTop) / containerH) * 100
    onUpdate(Math.max(2, Math.min(98, pct)))
  }
  function onUp() {
    drag.current = null
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  return onMouseDown
}

function InfoCallout({ panelKey, anchorEl, onClose }) {
  const info = PANEL_INFO[panelKey]
  const [pos, setPos] = useState({ top:0, left:0 })
  useEffect(() => {
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect()
      const width = 340
      const margin = 12
      let left = Math.min(Math.max(rect.left, margin), window.innerWidth - width - margin)
      let top = rect.bottom + 8
      const estimatedHeight = 220
      if (top + estimatedHeight > window.innerHeight - margin) {
        top = Math.max(margin, rect.top - estimatedHeight - 8)
      }
      setPos({ top, left })
    }
    const handler = (e) => {
      if (!e.target.closest('[data-info-callout]') && !e.target.closest('[data-info-btn]')) onClose()
    }
    setTimeout(() => window.addEventListener('click', handler), 50)
    return () => window.removeEventListener('click', handler)
  }, [anchorEl])
  if (!info) return null
  return (
    <div data-info-callout="true" style={{ position:'fixed', top:pos.top, left:pos.left, width:340, maxHeight:'min(360px, calc(100vh - 24px))', overflowY:'auto', background:'#0A1724', border:'1px solid rgba(87,146,198,0.45)', borderRadius:8, padding:'12px 14px', zIndex:5000, boxShadow:'0 18px 42px rgba(0,0,0,0.72)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <span style={{ fontSize:11, fontWeight:900, color:'#F4F8FE', letterSpacing:'0.04em', textTransform:'uppercase' }}>{info.title}</span>
        <button onClick={onClose} style={{ fontSize:12, color:'#6F8195', border:'none', background:'none', cursor:'pointer', padding:'0 2px' }}>✕</button>
      </div>
      <p style={{ fontSize:11, color:'#B9C8D8', lineHeight:1.65, margin:0, whiteSpace:'normal', wordBreak:'break-word' }}>{info.body}</p>
    </div>
  )
}

function InfoBtn({ panelKey, activeInfo, setActiveInfo }) {
  const btnRef = useRef(null)
  const isActive = activeInfo?.key === panelKey
  return (
    <button ref={btnRef} data-info-btn="true"
      onClick={e => {
        e.stopPropagation()
        setActiveInfo(isActive ? null : { key:panelKey, anchor:btnRef.current })
      }}
      style={{ marginLeft:6, width:14, height:14, borderRadius:'50%', border:'0.5px solid rgba(87,146,198,0.45)', background:isActive?'rgba(69,163,255,0.18)':'transparent', color:isActive?'#45A3FF':'#6F8195', cursor:'pointer', fontSize:9, display:'inline-flex', alignItems:'center', justifyContent:'center', padding:0, flexShrink:0 }}>
      ⓘ
    </button>
  )
}

function LifelineTile({ ll, data }) {
  const [hovered, setHovered] = useState(false)
  const [tipPos, setTipPos]   = useState({ left:0, top:0 })
  const tileRef               = useRef(null)
  const status = data?.status || 'YELLOW'
  const reason = data?.reason || 'Assessment pending.'
  const c = LL_COLORS[status] || LL_COLORS.UNKNOWN || { border:'rgba(148,163,184,0.50)', bg:'rgba(148,163,184,0.12)', text:'#B9C8D8' } || LL_COLORS.UNKNOWN || { border:'rgba(148,163,184,0.50)', bg:'rgba(148,163,184,0.12)', text:'#B9C8D8' }
  function handleMouseEnter() {
    if (tileRef.current) {
      const rect = tileRef.current.getBoundingClientRect()
      let left = rect.left + rect.width / 2
      left = Math.min(left, window.innerWidth - 170)
      left = Math.max(left, 170)
      setTipPos({ left, top: rect.bottom + 6 })
    }
    setHovered(true)
  }
  return (
    <div ref={tileRef} onMouseEnter={handleMouseEnter} onMouseLeave={() => setHovered(false)}
      style={{ position:'relative', display:'flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:4, border:`0.5px solid ${c.border}`, background:c.bg, flex:1, minWidth:0, cursor:'default' }}>
      <img src={ll.icon} alt={ll.label} style={{ width:20, height:20, objectFit:'contain', flexShrink:0 }} />
      <span style={{ fontSize:9, color:c.text, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ll.label}</span>
      {hovered && (
        <div style={{ position:'fixed', left:tipPos.left, top:tipPos.top, transform:'translateX(-50%)', background:'#1a1a1a', border:`0.5px solid ${c.border}`, borderRadius:6, padding:'8px 12px', fontSize:10, color:'#ccc', lineHeight:1.6, width:300, zIndex:1000, boxShadow:'0 4px 16px rgba(0,0,0,0.8)', pointerEvents:'none' }}>
          <span style={{ color:c.text, fontWeight:500 }}>{status}</span> — {reason}
        </div>
      )}
    </div>
  )
}


function mediaSourceProfile(item = {}) {
  const raw = `${item.source || item.type || item.text || ''}`.toLowerCase()
  if (raw.includes('radio') || raw.includes('fm') || raw.includes('am ')) {
    return { label:'WAVE', sub:'RADIO', bg:'linear-gradient(135deg,#0B4F9F,#1E88E5)', border:'#60A5FA' }
  }
  if (raw.includes('weather') || raw.includes('nws') || raw.includes('storm')) {
    return { label:'NWS', sub:'WX', bg:'linear-gradient(135deg,#174A7C,#38BDF8)', border:'#7DD3FC' }
  }
  if (raw.includes('social') || raw.includes('citizen') || raw.includes('public')) {
    return { label:'SOC', sub:'FEED', bg:'linear-gradient(135deg,#2C3454,#7C3AED)', border:'#C4B5FD' }
  }
  if (raw.includes('pio') || raw.includes('county') || raw.includes('eoc') || raw.includes('public information')) {
    return { label:'PIO', sub:'COUNTY', bg:'linear-gradient(135deg,#104E3B,#22C55E)', border:'#86EFAC' }
  }
  if (raw.includes('news') || raw.includes('channel') || raw.includes('tv') || raw.includes('daily') || raw.includes('times') || raw.includes('post') || raw.includes('tribune') || raw.includes('kwqc') || raw.includes('wqad')) {
    const m = raw.match(/(?:channel|ch\.?|news)\s*(\d{1,2})/)
    return { label:m ? m[1] : '7', sub:'NEWS', bg:'linear-gradient(135deg,#0B4F9F,#2563EB)', border:'#93C5FD' }
  }
  return { label:'LIVE', sub:'MEDIA', bg:'linear-gradient(135deg,#334155,#0F766E)', border:'#5EEAD4' }
}

function MediaIconTile({ item }) {
  const p = mediaSourceProfile(item)
  const isNumber = /^[0-9]{1,2}$/.test(p.label)
  return (
    <div style={{
      width:46,
      height:46,
      borderRadius:10,
      background:p.bg,
      border:`1px solid ${p.border}`,
      boxShadow:'0 10px 24px rgba(0,0,0,0.32), inset 0 0 18px rgba(255,255,255,0.08)',
      display:'flex',
      flexDirection:'column',
      alignItems:'center',
      justifyContent:'center',
      flexShrink:0,
      overflow:'hidden'
    }}>
      <div style={{ fontSize:isNumber ? 25 : 11, lineHeight:1, fontWeight:950, color:'#fff', letterSpacing:isNumber ? '-0.08em' : '0.03em' }}>{p.label}</div>
      <div style={{ fontSize:8, color:'rgba(255,255,255,0.86)', lineHeight:1, marginTop:3, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:850 }}>{p.sub}</div>
    </div>
  )
}

function MapUpdater({ center }) {
  const map = useMap()
  useEffect(() => { map.setView(center, 13) }, [center])
  return null
}

function SettingsPanel({ settings, onChange, onClose }) {
  return (
    <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, width:280, background:'#0A1724', border:'1px solid rgba(87,146,198,0.45)', borderRadius:10, padding:'14px 16px', zIndex:6000, boxShadow:'0 16px 42px rgba(0,0,0,0.72)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <span style={{ fontSize:11, fontWeight:500, color:'#aaa', textTransform:'uppercase', letterSpacing:'0.08em' }}>Display Settings</span>
        <button onClick={onClose} style={{ fontSize:14, color:'#555', padding:'0 4px', border:'none', background:'none', cursor:'pointer' }}>✕</button>
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontSize:10, color:'#666' }}>Font Size</span>
          <span style={{ fontSize:10, color:'#aaa' }}>{settings.fontSize}px</span>
        </div>
        <input type="range" min={9} max={16} value={settings.fontSize}
          onChange={e => onChange({ ...settings, fontSize:Number(e.target.value) })}
          style={{ width:'100%', accentColor:settings.accentColor }} />
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:2 }}>
          <span style={{ fontSize:9, color:'#444' }}>Small</span>
          <span style={{ fontSize:9, color:'#444' }}>Large</span>
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <span style={{ fontSize:10, color:'#666' }}>Accent Color</span>
          <span style={{ fontSize:9, color:'#444' }}>highlights, player text</span>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input type="color" value={settings.accentColor}
            onChange={e => onChange({ ...settings, accentColor:e.target.value })}
            style={{ width:36, height:28, border:'0.5px solid #333', borderRadius:4, background:'none', cursor:'pointer', padding:2 }} />
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {['#1D9E75','#4A90D9','#9B59B6','#E24B4A','#E8A838','#2ecc71'].map(c => (
              <div key={c} onClick={() => onChange({ ...settings, accentColor:c })}
                style={{ width:18, height:18, borderRadius:3, background:c, cursor:'pointer', border:`2px solid ${settings.accentColor===c?'#fff':'transparent'}` }} />
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <span style={{ fontSize:10, color:'#666' }}>Alert Color</span>
          <span style={{ fontSize:9, color:'#444' }}>timestamps, prompts</span>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input type="color" value={settings.alertColor}
            onChange={e => onChange({ ...settings, alertColor:e.target.value })}
            style={{ width:36, height:28, border:'0.5px solid #333', borderRadius:4, background:'none', cursor:'pointer', padding:2 }} />
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {['#EF9F27','#E24B4A','#4A90D9','#ccc','#9B59B6','#F39C12'].map(c => (
              <div key={c} onClick={() => onChange({ ...settings, alertColor:c })}
                style={{ width:18, height:18, borderRadius:3, background:c, cursor:'pointer', border:`2px solid ${settings.alertColor===c?'#fff':'transparent'}` }} />
            ))}
          </div>
        </div>
      </div>
      <button onClick={() => onChange(DEFAULT_SETTINGS)}
        style={{ width:'100%', padding:'6px', fontSize:10, color:'#555', border:'0.5px solid #333', borderRadius:6, cursor:'pointer', background:'transparent' }}>
        Reset to Defaults
      </button>
    </div>
  )
}

function EndexFeedback({ scenario, role, jurisdiction, difficulty, turns, fs, ac, al }) {
  const [rating, setRating]       = useState(0)
  const [aiReal, setAiReal]       = useState('')
  const [aarUseful, setAarUseful] = useState('')
  const [comments, setComments]   = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending]     = useState(false)

  async function submit() {
    if (!rating) return
    setSending(true)
    const body = `NEXUS EOC — Post-ENDEX Feedback\n\nScenario: ${scenario}\nJurisdiction: ${jurisdiction}\nDifficulty: ${difficulty}\nRole: ${role}\nTurns: ${turns}\n\nOverall Rating: ${rating}/5\nAI Evaluation Realistic: ${aiReal}\nAAR Useful: ${aarUseful}\n\nComments:\n${comments || '(none)'}`
    try {
      await fetch('https://formsubmit.co/ajax/edwardsnick.ca@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name:'NEXUS EOC Feedback', email:'feedback@nexuseoc.com', subject:`NEXUS EOC Feedback — ${scenario} / ${role}`, message: body, _captcha:'false' })
      })
    } catch(e) {}
    setSending(false)
    setSubmitted(true)
  }

  const btnStyle = (val, current) => ({
    padding:'4px 10px', fontSize:fs-1, fontFamily:'JetBrains Mono, monospace', cursor:'pointer', borderRadius:3, border:`0.5px solid ${current===val?ac:'#333'}`, background:current===val?ac+'22':'transparent', color:current===val?ac:'#666'
  })

  if (submitted) return (
    <div style={{ marginTop:16, padding:'12px 14px', border:'0.5px solid #222', borderRadius:6, background:'#0d0d0d' }}>
      <div style={{ fontSize:fs-1, color:ac }}>&#10003; Feedback received. Thank you.</div>
    </div>
  )

  return (
    <div style={{ marginTop:16, padding:'14px', border:'0.5px solid #222', borderRadius:6, background:'#0d0d0d' }}>
      <div style={{ fontSize:fs-1, color:'#555', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.08em' }}>Session Feedback — Optional</div>
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:fs-2, color:'#444', marginBottom:6 }}>Overall experience</div>
        <div style={{ display:'flex', gap:6 }}>
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setRating(n)}
              style={{ fontSize:18, background:'none', border:'none', cursor:'pointer', color:n<=rating?al:'#333', padding:'0 2px' }}>
              &#9733;
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:fs-2, color:'#444', marginBottom:6 }}>Was the AI evaluation realistic?</div>
        <div style={{ display:'flex', gap:6 }}>
          {['Yes','Somewhat','No'].map(v => (
            <button key={v} onClick={() => setAiReal(v)} style={btnStyle(v, aiReal)}>{v}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:fs-2, color:'#444', marginBottom:6 }}>Was the after-action review useful?</div>
        <div style={{ display:'flex', gap:6 }}>
          {['Yes','Somewhat','No'].map(v => (
            <button key={v} onClick={() => setAarUseful(v)} style={btnStyle(v, aarUseful)}>{v}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:fs-2, color:'#444', marginBottom:6 }}>What could be improved? (optional)</div>
        <textarea value={comments} onChange={e => setComments(e.target.value)}
          placeholder="Any feedback..."
          style={{ width:'100%', height:60, resize:'none', background:'#0a0a0a', border:'0.5px solid #222', color:'#888', fontSize:fs-1, fontFamily:'JetBrains Mono, monospace', padding:'6px 8px', borderRadius:3, outline:'none', boxSizing:'border-box' }}/>
      </div>
      <button onClick={submit} disabled={!rating || sending}
        style={{ padding:'6px 16px', fontSize:fs-1, fontFamily:'JetBrains Mono, monospace', color:rating?ac:'#444', border:`0.5px solid ${rating?ac:'#333'}`, background:'transparent', cursor:rating?'pointer':'not-allowed', borderRadius:3, opacity:sending?0.6:1 }}>
        {sending ? 'Sending...' : 'Submit Feedback'}
      </button>
    </div>
  )
}


function mediaSourceBadge(source = 'Media') {
  const s = String(source || 'Media')
  const lower = s.toLowerCase()
  if (lower.includes('radio')) return 'RAD'
  if (lower.includes('tv') || lower.includes('channel') || /\b[0-9]{1,2}\b/.test(lower)) return 'TV'
  if (lower.includes('news') || lower.includes('press')) return 'NEWS'
  if (lower.includes('social') || lower.includes('x ') || lower.includes('facebook')) return 'SOC'
  return s.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 3).toUpperCase() || 'MED'
}

function OnboardingModal({ onClose, ac = '#1D9E75' }) {
  return (
    <div style={{
      position:'fixed',
      inset:0,
      zIndex:5000,
      background:'rgba(0,0,0,0.78)',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      padding:20,
      fontFamily:'JetBrains Mono, monospace'
    }}>
      <div style={{
        width:'min(720px, 96vw)',
        background:'#0b0f0d',
        border:`1px solid ${ac}`,
        borderRadius:14,
        boxShadow:'0 24px 80px rgba(0,0,0,0.9)',
        overflow:'hidden'
      }}>
        <div style={{
          padding:'18px 22px',
          borderBottom:'1px solid #1f2a24',
          background:'linear-gradient(90deg, rgba(29,158,117,0.18), rgba(0,0,0,0))'
        }}>
          <div style={{ fontSize:10, color:ac, letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:6 }}>
            First-Time Operator Brief
          </div>
          <div style={{ fontSize:22, color:'#e6e6e6', fontWeight:700 }}>
            Welcome to NEXUS EOC
          </div>
          <div style={{ fontSize:12, color:'#888', marginTop:6, lineHeight:1.6 }}>
            A scenario-based emergency operations training platform for decision-making under pressure.
          </div>
        </div>

        <div style={{ padding:22, color:'#aaa', fontSize:13, lineHeight:1.75 }}>
          <div style={{ marginBottom:16 }}>
            <strong style={{ color:'#ddd' }}>1. Choose your mission.</strong><br />
            Select an incident type, jurisdiction, difficulty level, and EOC role.
          </div>

          <div style={{ marginBottom:16 }}>
            <strong style={{ color:'#ddd' }}>2. Read the situation.</strong><br />
            NEXUS generates a unique location, local agencies, field dispatches, map pins, and Community Lifeline status.
          </div>

          <div style={{ marginBottom:16 }}>
            <strong style={{ color:'#ddd' }}>3. Make decisions like you are in the EOC.</strong><br />
            Type clear actions: who you are notifying, what resources you are requesting, what priorities you are setting, and what information you need.
          </div>

          <div style={{ marginBottom:16 }}>
            <strong style={{ color:'#ddd' }}>4. End with ENDEX.</strong><br />
            Type <span style={{ color:ac, fontWeight:700 }}>ENDEX</span> at any time to complete the exercise and generate an after-action review.
          </div>

          <div style={{
            marginTop:18,
            padding:12,
            border:'1px solid #26352e',
            borderRadius:8,
            background:'#07100c',
            color:'#777',
            fontSize:12
          }}>
            Tip: vague actions create vague outcomes. Specific decisions create better training value.
          </div>
        </div>

        <div style={{
          padding:'14px 22px',
          borderTop:'1px solid #1f2a24',
          display:'flex',
          justifyContent:'space-between',
          alignItems:'center',
          gap:12
        }}>
          <div style={{ fontSize:11, color:'#555' }}>
            This briefing only appears the first time you open the app in this browser.
          </div>

          <button
            onClick={onClose}
            style={{
              padding:'9px 18px',
              background:ac,
              color:'#04100b',
              border:'none',
              borderRadius:6,
              fontWeight:700,
              cursor:'pointer',
              fontFamily:'JetBrains Mono, monospace',
              letterSpacing:'0.04em'
            }}
          >
            Begin Setup
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [state, setState]             = useState(null)
  const [loading, setLoading]         = useState(false)
  const [initLoading, setInitLoading] = useState(false)
  const [input, setInput]             = useState('')
  const [inputAreaHeight, setInputAreaHeight] = useState(80)
  const [notepadHeight, setNotepadHeight] = useState(180)
  const [boundaries, setBoundaries]   = useState([26, 64, 80])
  const [leftBounds, setLeftBounds]   = useState([52, 70])
  const [rightSplit, setRightSplit]   = useState(62)
  const [showSettings, setShowSettings] = useState(false)
  const [activeInfo, setActiveInfo]   = useState(null)
  const [activeESFs, setActiveESFs]   = useState({})
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [settings, setSettings]       = useState(() => {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}') } }
    catch { return DEFAULT_SETTINGS }
  })

  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return localStorage.getItem(ONBOARDING_KEY) !== 'true' }
    catch { return true }
  })

  const containerRef = useRef(null)
  const leftColRef   = useRef(null)
  const rightColRef  = useRef(null)
  const termRef      = useRef(null)
  const inputRef     = useRef(null)

  function updateSettings(s) {
    setSettings(s)
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)) } catch {}
  }

  function closeOnboarding() {
    try { localStorage.setItem(ONBOARDING_KEY, 'true') } catch {}
    setShowOnboarding(false)
  }

  const save = useCallback((next) => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)) } catch {}
  }, [])

  const update = useCallback((patch) => {
    setState(prev => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
      save(next)
      return next
    })
  }, [save])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY)
      setState(saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState)
    } catch { setState(defaultState) }
  }, [])

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight
  }, [state?.terminal])

  useEffect(() => {
    if (state?.screen === 'game' && state?.situation !== 'ENDEX') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [state?.screen, state?.situation])

  const onColDown = useHorizDrag(containerRef, (idx, pct) => {
    setBoundaries(prev => {
      const n = [...prev], min = 5
      if (idx === 0) n[0] = Math.max(min, Math.min(pct, n[1] - min))
      if (idx === 1) n[1] = Math.max(n[0] + min, Math.min(pct, n[2] - min))
      if (idx === 2) n[2] = Math.max(n[1] + min, Math.min(pct, 100 - min))
      return n
    })
  })

  function makeLeftVertDrag(divIdx) {
    return function(e) {
      e.preventDefault(); e.stopPropagation()
      const rect = leftColRef.current.getBoundingClientRect()
      const info = { top:rect.top, h:rect.height }
      function onMove(ev) {
        const pct = ((ev.clientY - info.top) / info.h) * 100
        setLeftBounds(prev => {
          const n = [...prev]
          if (divIdx === 0) n[0] = Math.max(2, Math.min(pct, 98))
          else              n[1] = Math.max(prev[0] + 4, Math.min(pct, 96))
          return n
        })
      }
      function onUp() {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }
  }

  const onRightDown = useVertDrag(rightColRef, setRightSplit)
  const colW = [boundaries[0], boundaries[1]-boundaries[0], boundaries[2]-boundaries[1], 100-boundaries[2]]

  const fs = settings.fontSize
  const ac = settings.accentColor
  const al = settings.alertColor

  async function initWorld(scenarioKey, jurisdiction) {
    const res = await fetch('/api/chat', {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({
        system: 'You are a world-building engine for an emergency management training simulator. Respond only in the exact JSON format requested. No preamble, no markdown fences.',
        messages: [{ role:'user', content: buildWorldInitPrompt(scenarioKey, jurisdiction) }],
      }),
    })
    const data = await res.json()
    const raw  = data.content?.[0]?.text || ''
    return JSON.parse(raw.replace(/```json|```/g,'').trim())
  }

  async function startScenario(scenarioKey) {
    const sc = SCENARIOS[scenarioKey]
    const jurisdiction = state.jurisdiction
    setActiveESFs({})
    setInitLoading(true)
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture('scenario_launched', { scenario: scenarioKey, jurisdiction: state.jurisdiction, difficulty: state.difficulty })
    }
    posthog.capture('scenario_started', { scenario: scenarioKey, jurisdiction, difficulty: state.difficulty, role: state.role, ...(state.playerName ? { player: state.playerName } : {}) })

    update({
      screen:'game', scenario:scenarioKey,
      dispatches:[], terminal:[
        { type:'header', text:`▶ ${sc.name.toUpperCase()} — ${jurisdiction} — ${state.difficulty}` },
        { type:'system', text:'Generating scenario world...' },
      ],
      history:[], turn:0, simTime:'H+0:00', situation:'DEVELOPING',
      notepad:'', lifelines:INITIAL_LIFELINES_UNKNOWN, headlines:[], dynamicPins:[],
      worldState:null, aar:null, exerciseTranscript:[],
    })

    try {
      const world = await initWorld(scenarioKey, jurisdiction)
      const initDispatches = (world.dispatches || []).map((text, i) => ({ id:i, text, turn:0 }))
      const initPins = (world.pins || []).map((p, i) => ({ ...p, id: `init-${i}` }))
      update({
        worldState: world,
        dispatches: initDispatches,
        terminal: [
          { type:'header',   text:`▶ ${sc.name.toUpperCase()} — ${world.location} — ${state.difficulty} — ${(state.role||'EOC Director').toUpperCase()}${state.playerName ? ` — ${state.playerName.toUpperCase()}` : ''}` },
          { type:'divider' },
          { type:'narrator', text:world.openingNarrative + ' What is your first action?' },
        ],
        dynamicPins: initPins,
        exerciseTranscript: [{
          type:'opening',
          time:'H+0:00',
          location: world.location,
          narrative: world.openingNarrative + ' What is your first action?',
          dispatches: initDispatches,
          pins: initPins,
          lifelines: INITIAL_LIFELINES_UNKNOWN,
        }],
      })
    } catch(e) {
      update({
        terminal: [
          { type:'header',   text:`▶ ${sc.name.toUpperCase()} — ${jurisdiction} — ${state.difficulty}` },
          { type:'divider' },
          { type:'narrator', text:sc.desc + ' Your EOC is activating. What is your first action?' },
        ],
        dispatches: [{ id:0, text:`${sc.name} confirmed. EOC activation underway. Resources status unknown.`, turn:0 }],
        exerciseTranscript: [{
          type:'opening',
          time:'H+0:00',
          location: jurisdiction,
          narrative: sc.desc + ' Your EOC is activating. What is your first action?',
          dispatches: [{ id:0, text:`${sc.name} confirmed. EOC activation underway. Resources status unknown.`, turn:0 }],
          pins: [],
          lifelines: INITIAL_LIFELINES_UNKNOWN,
        }],
      })
    }

    setInitLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  async function sendAction() {
    if (!input.trim() || loading || !state) return
    const action = input.trim()
    const isEndex = action.toUpperCase() === 'ENDEX'
    setInput(''); setLoading(true)

    posthog.capture(isEndex ? 'scenario_ended' : 'action_submitted', {
      scenario: state.scenario, jurisdiction: state.jurisdiction,
      difficulty: state.difficulty, turn: state.turn, role: state.role,
      ...(state.playerName ? { player: state.playerName } : {}),
    })

    const newTerm = [...state.terminal, { type:'player', text:`> ${action}` }]
    update({ terminal:newTerm })
    const msgs = [...state.history, { role:'user', content:action }]

    try {
      const res  = await fetch('/api/chat', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          system: buildSystemPrompt(state.scenario, state.jurisdiction, state.difficulty, state.worldState, state.playerName, state.role),
          messages: msgs,
        }),
      })
      const data = await res.json()
      const raw  = data.content?.[0]?.text || ''
      let parsed
      try { parsed = JSON.parse(raw.replace(/```json|```/g,'').trim()) }
      catch { parsed = { time:state.simTime, consequence:raw, situation:'DEVELOPING', dispatches:[], prompt:'What is your next action?', lifelines:state.lifelines, headlines:[], pins:[], aar:null } }

      const nextTurn   = state.turn + 1
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture('turn_completed', { scenario: state.scenario, jurisdiction: state.jurisdiction, difficulty: state.difficulty, turn: nextTurn })
      }

      const newHistory = [...msgs, { role:'assistant', content:JSON.stringify(parsed) }]
      const resolvedSituation = isEndex || parsed.situation === 'ENDEX' || (parsed.consequence||'').toUpperCase().includes('ENDEX') ? 'ENDEX' : (parsed.situation||'DEVELOPING')

      const addedTerm = [
        ...newTerm,
        { type:'time',        text:parsed.time },
        { type:'consequence', text:parsed.consequence },
        resolvedSituation !== 'ENDEX' ? { type:'prompt', text:parsed.prompt } : null,
        { type:'divider' },
      ].filter(Boolean)

      const newDispatches = parsed.dispatches?.length
        ? [...parsed.dispatches.map((text,i) => ({ id:Date.now()+i, text, turn:nextTurn })), ...state.dispatches.slice(0,6)]
        : state.dispatches
      const newHeadlines = parsed.headlines?.length
        ? [...parsed.headlines.map((h,i) => ({ ...h, id:Date.now()+i, turn:nextTurn })), ...state.headlines.slice(0,12)]
        : state.headlines
      const newDynamicPins = parsed.pins?.length
        ? [...(state.dynamicPins||[]), ...parsed.pins.map((p,i) => ({ ...p, id:`dyn-${Date.now()}-${i}`, turn:nextTurn }))]
        : (state.dynamicPins||[])

      const transcriptEntry = {
        type:'turn',
        turn: nextTurn,
        simTime: parsed.time || state.simTime,
        situation: resolvedSituation,
        playerInput: action,
        aiResponse: parsed.consequence || '',
        prompt: resolvedSituation !== 'ENDEX' ? (parsed.prompt || '') : '',
        dispatches: parsed.dispatches || [],
        headlines: parsed.headlines || [],
        pins: parsed.pins || [],
        lifelines: parsed.lifelines || state.lifelines,
      }

      update({
        terminal:addedTerm, history:newHistory, dispatches:newDispatches,
        simTime:parsed.time||state.simTime, situation:resolvedSituation,
        turn:nextTurn, lifelines:parsed.lifelines||state.lifelines,
        headlines:newHeadlines, dynamicPins:newDynamicPins,
        aar: parsed.aar || state.aar,
        screen: resolvedSituation === 'ENDEX' && parsed.aar ? 'aar' : state.screen,
        exerciseTranscript: [...(state.exerciseTranscript || []), transcriptEntry],
      })

      if (resolvedSituation === 'ENDEX' && typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture('scenario_completed', {
          scenario: state.scenario, jurisdiction: state.jurisdiction,
          difficulty: state.difficulty, total_turns: nextTurn, role: state.role,
          ...(state.playerName ? { player: state.playerName } : {}),
        })
      }
    } catch(e) {
      update({ terminal:[...newTerm, { type:'system', text:`[ERROR: ${e.message}]` }] })
    }
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleKey(e) {
    // Enter creates a new line. Submission is intentionally button-only.
  }

  function reset() {
    try { localStorage.removeItem(SAVE_KEY) } catch {}
    setState(defaultState); setInput(''); setActiveESFs({})
  }

  function downloadCurrentTranscript() {
    if (!state) return
    const scenarioName = SCENARIOS[state.scenario]?.name || state.scenario || 'Scenario'
    const date = new Date().toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
    const text = formatExerciseTranscript({
      scenario: state.scenario,
      jurisdiction: state.jurisdiction,
      difficulty: state.difficulty,
      role: state.role,
      playerName: state.playerName,
      worldState: state.worldState,
      transcript: state.exerciseTranscript || [],
      finalLifelines: state.lifelines,
      finalSimTime: state.simTime,
      finalSituation: state.situation,
      aar: state.aar,
    })
    downloadPdfTextFile(`NEXUS_EOC_Transcript_${scenarioName.replace(/\s+/g,'_')}_${date.replace(/\s+/g,'_')}.pdf`, text)
  }

  if (!state) return <div style={{ color:'#888', padding:'2rem', fontFamily:'monospace' }}>Loading...</div>

  if (state.screen === 'portal') {
    return (
      <MissionPortal
        state={state}
        onStartExercise={() => update({ screen:'setup' })}
        showGuidedTour={showOnboarding}
        onCloseGuidedTour={closeOnboarding}
      />
    )
  }

  // ─── START EXERCISE SCREEN ───────────────────────────────────────────
  if (state.screen === 'setup') {
    return (
      <StartExercise
        state={state}
        update={update}
        startScenario={startScenario}
        initLoading={initLoading}
        onMissionPortal={() => update({ screen:'portal' })}
      />
    )
  }



  // ─── DEDICATED AAR SCREEN ───────────────────────────────────────────
  if (state.screen === 'aar' && state.aar) {
    return (
      <AARDisplay
        aar={state.aar}
        scenario={state.scenario}
        jurisdiction={state.jurisdiction}
        difficulty={state.difficulty}
        role={state.role}
        playerName={state.playerName}
        turns={state.turn}
        simTime={state.simTime}
        worldState={state.worldState}
        transcript={state.exerciseTranscript || []}
        lifelines={state.lifelines}
        situation={state.situation}
        onReset={reset}
        onRestart={() => startScenario(state.scenario)}
        onMissionPortal={() => update({ screen:'portal' })}
        fs={fs}
        ac={ac}
        al={al}
      />
    )
  }

  // ─── GAME SCREEN ───────────────────────────────────────────────────────────
  const UI = {
    bg:'#020B13',
    panel:'rgba(4, 17, 29, 0.84)',
    panel2:'rgba(6, 23, 38, 0.92)',
    border:'rgba(87, 146, 198, 0.30)',
    borderSoft:'rgba(87, 146, 198, 0.18)',
    borderStrong:'rgba(65, 141, 255, 0.62)',
    text:'#F4F8FE',
    muted:'#B9C8D8',
    dim:'#6F8195',
    cyan:'#45A3FF',
    teal:'#2DE2B8',
    amber:'#F59B22',
    danger:'#E24B4A',
  }

  const dragBar = {
    width:10,
    cursor:'col-resize',
    background:'linear-gradient(180deg, rgba(69,163,255,0.08), rgba(69,163,255,0.02))',
    flexShrink:0,
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    borderLeft:`1px solid ${UI.borderSoft}`,
    borderRight:`1px solid ${UI.borderSoft}`,
  }
  const dragInner = { width:3, height:34, background:'rgba(185,200,216,0.28)', borderRadius:3, pointerEvents:'none' }
  const hDragBar = {
    height:9,
    cursor:'row-resize',
    background:'linear-gradient(90deg, rgba(69,163,255,0.06), rgba(69,163,255,0.02))',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    borderTop:`1px solid ${UI.borderSoft}`,
    borderBottom:`1px solid ${UI.borderSoft}`,
    flexShrink:0,
  }
  const hDragInner = { width:34, height:3, background:'rgba(185,200,216,0.28)', borderRadius:3 }

  const panelShell = {
    display:'flex',
    flexDirection:'column',
    border:`1px solid ${UI.border}`,
    borderRadius:6,
    background:'rgba(3,14,24,0.78)',
    boxShadow:'0 18px 48px rgba(0,0,0,0.22)',
    overflow:'hidden',
    minHeight:0,
  }

  const panelHdr  = (label, infoKey, right=null, note=null) => (
    <div style={{
      minHeight:34,
      padding:'7px 10px',
      borderBottom:`1px solid ${UI.borderSoft}`,
      background:'linear-gradient(180deg, rgba(69,163,255,0.10), rgba(3,14,24,0.58))',
      fontSize:11,
      fontWeight:900,
      color:UI.text,
      textTransform:'uppercase',
      letterSpacing:'0.08em',
      flexShrink:0,
      display:'flex',
      alignItems:'center',
      gap:7,
      boxSizing:'border-box',
    }}>
      <span style={{ display:'flex', alignItems:'center' }}>
        {label}
        {infoKey && <InfoBtn panelKey={infoKey} activeInfo={activeInfo} setActiveInfo={setActiveInfo} />}
      </span>
      {note && <span style={{ color:UI.dim, fontSize:9, textTransform:'none', letterSpacing:'0.02em', fontWeight:600 }}>{note}</span>}
      {right && <span style={{ marginLeft:'auto' }}>{right}</span>}
    </div>
  )

  const dynamicPins = state.dynamicPins || []
  const center      = state.worldState?.center || [39.5, -98.35]
  const mapZoom     = state.worldState ? 13 : 4
  const refs        = state.scenario ? SCENARIO_REFS[state.scenario]||[] : []
  const initPins    = dynamicPins.filter(p => p.id?.startsWith('init-'))
  const turnPins    = dynamicPins.filter(p => !p.id?.startsWith('init-'))
  const isEndex     = state.situation === 'ENDEX'
  const scenarioName = SCENARIOS[state.scenario]?.name || state.scenario || 'Active Exercise'
  const roleLabel = state.role || 'EOC Director'
  const notepadTitle = state.playerName
    ? `${state.playerName}'s Notepad`
    : `${roleLabel}'s Notepad`

  const leftWidth = boundaries[0]
  const centerWidth = boundaries[1] - boundaries[0]
  const rightWidth = 100 - boundaries[1]

  const termStyles = {
    header:      { color:UI.text, fontWeight:800, marginBottom:6, fontSize:fs+1, letterSpacing:'0.02em' },
    system:      { color:UI.dim, fontSize:Math.max(10,fs-1), marginBottom:8 },
    narrator:    { color:UI.text, marginBottom:8, fontSize:fs, lineHeight:1.75 },
    player:      { color:UI.cyan, marginBottom:8, fontWeight:800, fontSize:fs, lineHeight:1.6 },
    consequence: { color:'#D7E3F1', marginBottom:10, borderLeft:`3px solid ${UI.cyan}`, paddingLeft:12, fontSize:fs, lineHeight:1.75, background:'rgba(69,163,255,0.04)', paddingTop:6, paddingBottom:6 },
    time:        { color:UI.amber, fontSize:Math.max(10,fs-1), marginBottom:4, fontWeight:900, letterSpacing:'0.05em' },
    prompt:      { color:UI.amber, fontStyle:'italic', marginBottom:8, fontSize:fs, lineHeight:1.6 },
  }

  const statusBadge = (
    <span style={{
      fontSize:10,
      padding:'3px 8px',
      borderRadius:999,
      fontWeight:900,
      background:(sitColors[state.situation]||'#888')+'24',
      color:sitColors[state.situation]||'#888',
      border:`1px solid ${(sitColors[state.situation]||'#888')}55`,
      letterSpacing:'0.06em',
    }}>
      {state.situation}
    </span>
  )

  return (
    <div style={{
      width:'100vw',
      height:'100vh',
      overflow:'hidden',
      display:'flex',
      flexDirection:'column',
      background:`radial-gradient(circle at 76% 8%, rgba(46,131,255,0.14), transparent 30%), radial-gradient(circle at 12% 20%, rgba(45,226,184,0.08), transparent 30%), linear-gradient(135deg, ${UI.bg}, #02070D 68%)`,
      color:UI.text,
      fontFamily:'Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
      fontSize:fs,
    }}>
      <style>{`
        .nexus-map-icon { background: transparent !important; border: none !important; }

        .nexus-live-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .nexus-live-scroll::-webkit-scrollbar-thumb { background: rgba(87,146,198,.28); border-radius: 999px; }
        .nexus-live-scroll::-webkit-scrollbar-track { background: rgba(3,14,24,.45); }
        .nexus-esf-tile .nexus-esf-tip { display: none; }
        .nexus-esf-tile:hover .nexus-esf-tip { display: block; }
        .nexus-live-button:hover { filter: brightness(1.12); }
      `}</style>

      {activeInfo?.key && activeInfo?.anchor && <InfoCallout panelKey={activeInfo.key} anchorEl={activeInfo.anchor} onClose={() => setActiveInfo(null)} />}

      {showEndDialog && !isEndex && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="End Exercise"
          onClick={() => setShowEndDialog(false)}
          style={{
            position:'fixed',
            inset:0,
            zIndex:7000,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            padding:24,
            background:'rgba(1, 7, 13, 0.72)',
            backdropFilter:'blur(6px)',
            WebkitBackdropFilter:'blur(6px)',
            boxSizing:'border-box'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width:'min(520px, 94vw)',
              border:`1px solid ${UI.borderStrong}`,
              borderRadius:10,
              background:'linear-gradient(135deg, rgba(4,17,29,0.98), rgba(2,9,16,0.98))',
              boxShadow:'0 28px 90px rgba(0,0,0,0.68), 0 0 42px rgba(226,75,74,0.10)',
              overflow:'hidden',
              color:UI.text
            }}
          >
            <div style={{
              padding:'18px 20px',
              display:'flex',
              alignItems:'center',
              justifyContent:'space-between',
              gap:14,
              borderBottom:`1px solid ${UI.borderSoft}`,
              background:'linear-gradient(90deg, rgba(226,75,74,0.13), rgba(69,163,255,0.04), transparent)'
            }}>
              <div>
                <div style={{ color:'#FFD2D2', fontSize:18, fontWeight:950, letterSpacing:'0.05em', textTransform:'uppercase' }}>End Exercise</div>
                <div style={{ color:UI.muted, fontSize:12, marginTop:5 }}>Choose how to close this scenario.</div>
              </div>
              <button
                onClick={() => setShowEndDialog(false)}
                aria-label="Close end exercise dialog"
                style={{
                  width:34,
                  height:34,
                  borderRadius:7,
                  border:`1px solid ${UI.borderSoft}`,
                  background:'rgba(2,11,19,0.58)',
                  color:UI.text,
                  cursor:'pointer',
                  fontSize:20,
                  lineHeight:1,
                  display:'grid',
                  placeItems:'center'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding:20, display:'grid', gap:12 }}>
              <button
                onClick={() => { setShowEndDialog(false); setInput('ENDEX'); setTimeout(() => sendAction(), 50) }}
                style={{
                  width:'100%',
                  minHeight:48,
                  borderRadius:6,
                  border:`1px solid ${UI.amber}`,
                  background:'linear-gradient(180deg, rgba(245,155,34,0.16), rgba(2,11,19,0.78))',
                  color:UI.amber,
                  cursor:'pointer',
                  fontWeight:950,
                  fontSize:14,
                  textAlign:'left',
                  padding:'0 16px'
                }}
              >
                End with AAR
              </button>

              <button
                onClick={() => { setShowEndDialog(false); reset() }}
                style={{
                  width:'100%',
                  minHeight:48,
                  borderRadius:6,
                  border:`1px solid ${UI.borderStrong}`,
                  background:'rgba(6,23,38,0.48)',
                  color:UI.text,
                  cursor:'pointer',
                  fontWeight:900,
                  fontSize:14,
                  textAlign:'left',
                  padding:'0 16px'
                }}
              >
                End without AAR
              </button>

              <button
                onClick={() => setShowEndDialog(false)}
                style={{
                  width:'100%',
                  minHeight:42,
                  borderRadius:6,
                  border:`1px solid ${UI.borderSoft}`,
                  background:'transparent',
                  color:UI.muted,
                  cursor:'pointer',
                  fontWeight:800,
                  fontSize:13
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <header style={{
        height:72,
        flexShrink:0,
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        borderBottom:`1px solid ${UI.border}`,
        background:'linear-gradient(180deg, rgba(2,10,18,0.98), rgba(3,13,22,0.96))',
        boxSizing:'border-box',
      }}>
        <div style={{ width:'min(100%, 1760px)', padding:'0 clamp(16px, 1.6vw, 28px)', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:18, alignItems:'center', boxSizing:'border-box' }}>
          <div style={{ display:'flex', alignItems:'center', gap:13 }}>
            <div style={{ width:42, height:42, border:`1px solid ${UI.cyan}`, borderRadius:'50%', display:'grid', placeItems:'center', color:UI.cyan, fontWeight:950, boxShadow:'0 0 24px rgba(69,163,255,0.18)' }}>N</div>
            <div>
              <div style={{ fontSize:19, fontWeight:950, letterSpacing:'0.12em' }}>NEXUS EOC</div>
              <div style={{ fontSize:10, color:UI.dim, letterSpacing:'0.14em', textTransform:'uppercase' }}>Live Exercise Interface</div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1.3fr .9fr .9fr .7fr', gap:10, minWidth:0 }}>
            {[
              ['Scenario', scenarioName],
              ['Position / Function', roleLabel],
              ['Jurisdiction', state.worldState?.location || state.jurisdiction],
              ['Difficulty', state.difficulty],
            ].map(([label,value]) => (
              <div key={label} style={{ minWidth:0, border:`1px solid ${UI.borderSoft}`, borderRadius:5, background:'rgba(6,23,38,0.48)', padding:'7px 10px' }}>
                <div style={{ fontSize:9, color:UI.dim, textTransform:'uppercase', letterSpacing:'0.10em', marginBottom:3, whiteSpace:'nowrap' }}>{label}</div>
                <div style={{ fontSize:12, color:UI.text, fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <button className="nexus-live-button" onClick={() => update({ screen:'portal' })}
              style={{ height:38, padding:'0 14px', borderRadius:4, border:`1px solid ${UI.borderStrong}`, background:'rgba(3,13,23,0.72)', color:UI.text, cursor:'pointer', fontWeight:850 }}>
              Mission Portal
            </button>
            {!isEndex && (
              <div style={{ position:'relative' }}>
                <button className="nexus-live-button" onClick={() => setShowEndDialog(s => !s)}
                  style={{ height:38, padding:'0 14px', borderRadius:4, border:`1px solid rgba(226,75,74,0.70)`, background:'rgba(226,75,74,0.10)', color:'#FFD2D2', cursor:'pointer', fontWeight:900 }}>
                  End Exercise
                </button>
              </div>
            )}
            <div style={{ position:'relative' }}>
              <button className="nexus-live-button" onClick={() => setShowSettings(s => !s)} title="Display Settings"
                style={{ width:38, height:38, borderRadius:4, border:`1px solid ${UI.borderStrong}`, background:showSettings?'rgba(69,163,255,0.18)':'rgba(3,13,23,0.72)', color:UI.cyan, cursor:'pointer', fontSize:16, display:'grid', placeItems:'center' }}>
                ⚙
              </button>
              {showSettings && <SettingsPanel settings={settings} onChange={updateSettings} onClose={() => setShowSettings(false)} />}
            </div>
          </div>
        </div>
      </header>

      <main style={{ flex:1, minHeight:0, padding:'clamp(10px, 1vw, 16px)', display:'flex', flexDirection:'column', alignItems:'center', gap:9, boxSizing:'border-box' }}>

        {/* LIFELINE BAR */}
        <section style={{ ...panelShell, width:'min(100%, 1760px)', flexShrink:0, minHeight:'auto', boxSizing:'border-box' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 10px', borderBottom:`1px solid ${UI.borderSoft}` }}>
            <div style={{ fontSize:11, color:UI.text, fontWeight:950, textTransform:'uppercase', letterSpacing:'0.10em', display:'flex', alignItems:'center' }}>
              Community Lifelines
              <InfoBtn panelKey="lifelines" activeInfo={activeInfo} setActiveInfo={setActiveInfo} />
            </div>
            <div style={{ color:UI.dim, fontSize:10 }}>Hover or click for current impact reason.</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(8, minmax(0, 1fr))', gap:6, padding:'7px 10px' }}>
            {LIFELINES.map(ll => <LifelineTile key={ll.key} ll={ll} data={state.lifelines?.[ll.key]} />)}
          </div>
        </section>

        {/* ESF ACTIVATION TRACKER */}
        <section style={{ width:'min(100%, 1760px)', display:'flex', alignItems:'center', gap:7, border:`1px solid ${UI.border}`, borderRadius:6, background:'rgba(3,14,24,0.68)', padding:'7px 10px', flexShrink:0, boxSizing:'border-box' }}>
          <div style={{ fontSize:11, color:UI.text, fontWeight:950, textTransform:'uppercase', letterSpacing:'0.10em', whiteSpace:'nowrap', display:'flex', alignItems:'center' }}>
            ESF Activation Tracker
            <InfoBtn panelKey="esf" activeInfo={activeInfo} setActiveInfo={setActiveInfo} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(15, minmax(38px, 1fr))', gap:5, flex:1 }}>
            {ESFS.map(esf => {
              const active = !!activeESFs[esf.num]
              return (
                <button key={esf.num}
                  className="nexus-esf-tile"
                  onClick={() => setActiveESFs(prev => ({ ...prev, [esf.num]: !prev[esf.num] }))}
                  style={{ position:'relative', height:28, borderRadius:4, border:`1px solid ${active ? UI.cyan : UI.borderSoft}`, background:active ? 'rgba(69,163,255,0.18)' : 'rgba(6,23,38,0.48)', color:active ? UI.text : UI.dim, cursor:'pointer', fontSize:10, fontWeight:950, letterSpacing:'0.04em' }}>
                  ESF-{esf.num}
                  <div className="nexus-esf-tip" style={{ position:'absolute', left:'50%', top:34, transform:'translateX(-50%)', zIndex:3000, width:280, padding:'10px 12px', border:`1px solid ${active ? UI.cyan : UI.border}`, borderRadius:7, background:UI.panel2, boxShadow:'0 14px 36px rgba(0,0,0,0.66)', textAlign:'left', pointerEvents:'none' }}>
                    <div style={{ color:UI.text, fontSize:12, fontWeight:950, marginBottom:4 }}>ESF-{esf.num} — {esf.name}</div>
                    <div style={{ color:UI.cyan, fontSize:11, marginBottom:6 }}>Lead: {esf.lead}</div>
                    <div style={{ color:UI.muted, fontSize:11, lineHeight:1.5 }}>{esf.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* THREE-COLUMN WORKSPACE */}
        <div ref={containerRef} style={{ width:'min(100%, 1760px)', display:'flex', flex:1, minHeight:0, boxSizing:'border-box' }}>

          {/* LEFT COLUMN: FLASH CARDS / MEDIA */}
          <div ref={leftColRef} style={{ width:`${leftWidth}%`, display:'flex', flexDirection:'column', flexShrink:0, minHeight:0 }}>
            <div style={{ ...panelShell, height:`${leftBounds[0]}%`, flexShrink:0 }}>
              {panelHdr('Flash Cards', 'dispatch', <span style={{ background:UI.danger, color:'#fff', borderRadius:999, padding:'2px 7px', fontSize:10 }}>{state.dispatches.length}</span>)}
              <div className="nexus-live-scroll" style={{ flex:1, overflowY:'auto', padding:9, display:'flex', flexDirection:'column', gap:8 }}>
                {initLoading && (
                  <div style={{ padding:12, fontSize:12, color:UI.dim, fontStyle:'italic', textAlign:'center' }}>
                    Generating scenario world...<br/>
                    <span style={{ fontSize:11 }}>Building location, resources, and initial conditions.</span>
                  </div>
                )}
                {state.dispatches.length === 0 && <div style={{ color:UI.dim, fontSize:12, padding:10, fontStyle:'italic' }}>Flash cards appear as field reports are generated.</div>}
                {state.dispatches.map(d => {
                  const isNew = d.turn === state.turn
                  return (
                    <div key={d.id} style={{ padding:'9px 10px', borderRadius:6, border:`1px solid ${isNew ? 'rgba(69,163,255,0.55)' : UI.borderSoft}`, background:isNew ? 'rgba(69,163,255,0.12)' : 'rgba(6,23,38,0.38)', fontSize:fs-1, color:isNew ? UI.text : UI.muted, lineHeight:1.55, opacity:isNew ? 1 : 0.72 }}>
                      {isNew && <div style={{ fontSize:10, color:UI.cyan, fontWeight:950, marginBottom:4, letterSpacing:'0.08em' }}>NEW — {state.simTime}</div>}
                      {d.text}
                    </div>
                  )
                })}
              </div>
            </div>

            <div onMouseDown={makeLeftVertDrag(0)} style={hDragBar}><div style={hDragInner}/></div>

            <div style={{ ...panelShell, flex:1 }}>
              {panelHdr('Media Feed', 'media')}
              <div className="nexus-live-scroll" style={{ flex:1, overflowY:'auto', padding:9, display:'flex', flexDirection:'column', gap:8 }}>
                {state.headlines.length === 0 && <div style={{ color:UI.dim, fontSize:12, padding:10, fontStyle:'italic' }}>Media items appear after your first action.</div>}
                {state.headlines.map(h => {
                  const isNew = h.turn === state.turn
                  return (
                    <div key={h.id} style={{ display:'grid', gridTemplateColumns:'52px 1fr', gap:12, alignItems:'start', padding:'10px 11px', borderRadius:7, border:`1px solid ${isNew ? 'rgba(245,155,34,0.58)' : UI.borderSoft}`, background:isNew ? 'linear-gradient(90deg, rgba(245,155,34,0.12), rgba(6,23,38,0.42))' : 'rgba(6,23,38,0.34)', lineHeight:1.5, opacity:isNew ? 1 : 0.72 }}>
                      <MediaIconTile item={h} />
                      <div style={{ minWidth:0 }}>
                        {isNew && <div style={{ fontSize:10, color:UI.amber, fontWeight:950, marginBottom:4, letterSpacing:'0.08em' }}>LIVE</div>}
                        <div style={{ fontSize:fs-1, color:isNew ? UI.text : UI.muted, marginBottom:4 }}>{h.text}</div>
                        <div style={{ fontSize:10, color:UI.dim }}>{h.source} — {h.time}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div style={dragBar} onMouseDown={e => onColDown(0,e)}><div style={dragInner}/></div>

          {/* CENTER COLUMN: CURRENT SITUATION / RESPONSE / NOTEPAD */}
          <div style={{ width:`${centerWidth}%`, display:'flex', flexDirection:'column', flexShrink:0, minHeight:0 }}>
            <div style={{ ...panelShell, flex:1, border:`1px solid ${isEndex && state.aar ? ac+'66' : UI.border}` }}>
              {panelHdr(
                isEndex && state.aar ? 'After-Action Review' : 'Current Situation / Inject',
                'terminal',
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  {!isEndex && <span style={{ color:UI.amber, fontSize:11, fontWeight:950 }}>{state.simTime}</span>}
                  {!isEndex && statusBadge}
                  {isEndex && state.aar && <span style={{ color:UI.cyan, fontSize:11, fontWeight:950 }}>ENDEX — {state.turn} TURNS</span>}
                  {!isEndex && (state.exerciseTranscript || []).length > 0 && (
                    <button onClick={downloadCurrentTranscript} style={{ fontSize:10, padding:'3px 8px', color:UI.muted, background:'transparent', border:`1px solid ${UI.borderSoft}`, cursor:'pointer', borderRadius:4 }}>
                      Transcript PDF
                    </button>
                  )}
                </div>
              )}
              {false && isEndex && state.aar ? (
                <div style={{ flex:1, minHeight:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                  <AARDisplay
                    aar={state.aar}
                    scenario={state.scenario}
                    jurisdiction={state.jurisdiction}
                    difficulty={state.difficulty}
                    role={state.role}
                    playerName={state.playerName}
                    turns={state.turn}
                    simTime={state.simTime}
                    worldState={state.worldState}
                    transcript={state.exerciseTranscript || []}
                    lifelines={state.lifelines}
                    situation={state.situation}
                    onReset={reset}
                    fs={fs}
                    ac={ac}
                    al={al}
                  />
                </div>
              ) : (
                <div ref={termRef} className="nexus-live-scroll" style={{ flex:1, overflowY:'auto', padding:'14px 16px', lineHeight:1.8 }}>
                  {state.terminal.map((line,i) => {
                    if (!line) return null
                    if (line.type==='divider') return <hr key={i} style={{ border:'none', borderTop:`1px solid ${UI.borderSoft}`, margin:'10px 0' }}/>
                    return <div key={i} style={termStyles[line.type]||{ fontSize:fs }}>{line.text}</div>
                  })}
                  {isEndex && !state.aar && (
                    <div style={{ marginTop:16, paddingTop:12, borderTop:`1px solid ${UI.borderSoft}` }}>
                      <div style={{ fontSize:fs-1, color:UI.muted, marginBottom:8 }}>Generating AAR...</div>
                      <button onClick={reset}
                        style={{ padding:'8px 20px', fontSize:fs, fontWeight:850, color:UI.cyan, border:`1px solid ${UI.cyan}`, background:'transparent', cursor:'pointer', borderRadius:4 }}>
                        Return to Mission Portal
                      </button>
                    </div>
                  )}
                  {(loading || initLoading) && (
                    <div style={{ color:UI.dim, fontStyle:'italic', fontSize:fs }}>
                      {initLoading ? 'Building scenario world...' : 'Evaluating action...'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isEndex && (
              <>
                <div style={hDragBar}
                  onMouseDown={e => {
                    e.preventDefault()
                    const startY = e.clientY
                    const startHeight = inputAreaHeight
                    function onMove(ev) { setInputAreaHeight(Math.max(34, Math.min(720, startHeight + (startY - ev.clientY)))) }
                    function onUp() { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
                    window.addEventListener('mousemove', onMove)
                    window.addEventListener('mouseup', onUp)
                  }}>
                  <div style={hDragInner}/>
                </div>

                <div style={{ ...panelShell, height:inputAreaHeight, flexShrink:0 }}>
                  {panelHdr('Your Response', 'terminal')}
                  <div style={{ flex:1, display:'flex', gap:9, padding:10, minHeight:0 }}>
                    <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                      placeholder={initLoading ? 'Generating scenario...' : 'Enter your operational response. Enter creates a new line.'}
                      disabled={initLoading}
                      style={{ flex:1, resize:'none', lineHeight:1.6, fontSize:fs, background:'rgba(2,11,19,0.82)', border:`1px solid ${UI.borderSoft}`, borderRadius:5, color:UI.text, padding:'9px 10px', fontFamily:'Inter, Segoe UI, sans-serif', height:'100%', boxSizing:'border-box', outline:'none' }}/>
                    <button className="nexus-live-button" onClick={sendAction} disabled={loading||!input.trim()||initLoading}
                      style={{ width:138, fontWeight:950, alignSelf:'stretch', color:'#fff', border:'none', borderRadius:5, background:(loading||!input.trim()||initLoading) ? 'rgba(87,146,198,0.18)' : 'linear-gradient(180deg, #2E83FF, #1455B8)', cursor:(loading||!input.trim()||initLoading)?'not-allowed':'pointer', opacity:(loading||!input.trim()||initLoading)?0.55:1 }}>
                      Submit Response
                    </button>
                  </div>
                </div>

                <div style={hDragBar}
                  onMouseDown={e => {
                    e.preventDefault()
                    const startY = e.clientY
                    const startHeight = notepadHeight
                    const centerColumn = e.currentTarget.parentElement
                    const parentH = centerColumn?.getBoundingClientRect?.().height || 720
                    function onMove(ev) {
                      const next = startHeight + (startY - ev.clientY)
                      setNotepadHeight(Math.max(32, Math.min(parentH - 72, next)))
                    }
                    function onUp() {
                      window.removeEventListener('mousemove', onMove)
                      window.removeEventListener('mouseup', onUp)
                    }
                    window.addEventListener('mousemove', onMove)
                    window.addEventListener('mouseup', onUp)
                  }}>
                  <div style={hDragInner}/>
                </div>

                <div style={{ ...panelShell, height:notepadHeight, minHeight:32, flexShrink:0, overflow:'hidden' }}>
                  {panelHdr(notepadTitle, 'notepad')}
                  <textarea value={state.notepad} onChange={e => update({ notepad:e.target.value })}
                    placeholder={'Local notes only. Notes are not submitted with your response.'}
                    className="nexus-live-scroll"
                    style={{ flex:1, minHeight:0, resize:'none', border:'none', padding:'10px 12px', background:'transparent', color:UI.muted, lineHeight:1.65, outline:'none', fontSize:fs, fontFamily:'Inter, Segoe UI, sans-serif' }}/>
                </div>
              </>
            )}
          </div>

          <div style={dragBar} onMouseDown={e => onColDown(1,e)}><div style={dragInner}/></div>

          {/* RIGHT COLUMN: MAP / REFERENCE DESK */}
          <div ref={rightColRef} style={{ width:`${rightWidth}%`, display:'flex', flexDirection:'column', flexShrink:0, minHeight:0 }}>
            <div style={{ ...panelShell, height:`${rightSplit}%`, flexShrink:0 }}>
              {panelHdr(
                'Situation Map',
                'map',
                <span style={{ fontSize:10, color:UI.dim }}>{turnPins.length} event{turnPins.length!==1?'s':''}</span>,
                'Pins are clickable for details'
              )}
              <div style={{ position:'relative', flex:1, minHeight:0 }}>
                <MapContainer center={center} zoom={mapZoom} style={{ height:'100%', width:'100%' }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO'/>
                  <ScaleControl position="bottomright" imperial={true} metric={true} />
                  <MapUpdater center={center}/>
                  {initPins.map(pin => (
                    <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={makeIcon(PIN_COLORS[pin.type]||PIN_COLORS.DEFAULT, pin.type)}>
                      <Popup>
                        <div style={{ fontFamily:'Inter, sans-serif', fontSize:12 }}>
                          <strong>{pin.label}</strong><br/>
                          <span style={{ color:'#666' }}>{pin.type}</span><br/>
                          {pin.note}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {turnPins.map(pin => (
                    <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={makeDynamicIcon(pin.turn)}>
                      <Popup>
                        <div style={{ fontFamily:'Inter, sans-serif', fontSize:12 }}>
                          <strong>{pin.label}</strong><br/>
                          <span style={{ color:'#666' }}>Turn {pin.turn} — {pin.type}</span><br/>
                          {pin.note}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
                <div style={{ position:'absolute', left:10, bottom:10, zIndex:450, border:`1px solid ${UI.border}`, borderRadius:6, background:'rgba(2,9,16,0.84)', padding:'7px 9px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px 10px', fontSize:10, color:UI.muted, backdropFilter:'blur(4px)' }}>
                  {['EOC','HOSPITAL','STAGING','SHELTER','AFFECTED','FIRE','HAZMAT','BLOCKED'].map(t => (
                    <div key={t} style={{ display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:PIN_COLORS[t]||PIN_COLORS.DEFAULT, display:'inline-block' }} />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div onMouseDown={onRightDown} style={hDragBar}><div style={hDragInner}/></div>

            <div style={{ ...panelShell, flex:1 }}>
              {panelHdr('Reference Desk', 'refs')}
              <div className="nexus-live-scroll" style={{ flex:1, overflowY:'auto', padding:9, display:'flex', flexDirection:'column', gap:7 }}>
                {refs.length === 0 && <div style={{ color:UI.dim, fontSize:12, padding:10, fontStyle:'italic' }}>Scenario reference links appear here after launch.</div>}
                {refs.map((r,i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                    style={{ display:'block', padding:'8px 10px', borderRadius:6, border:`1px solid ${UI.borderSoft}`, background:'rgba(6,23,38,0.34)', fontSize:fs-1, color:UI.cyan, lineHeight:1.45, textDecoration:'none', wordBreak:'break-word' }}>
                    ↗ {r.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )

}