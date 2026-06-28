import { useState, useRef, useEffect, useCallback } from 'react'
import posthog from 'posthog-js'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
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

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function makeIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 28 14 28s14-17.5 14-28C28 6.3 21.7 0 14 0z" fill="${color}" stroke="#111" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
  </svg>`
  return L.divIcon({ html: svg, className: '', iconSize: [28, 40], iconAnchor: [14, 40], popupAnchor: [0, -40] })
}

function makeDynamicIcon(turnNum) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 28 14 28s14-17.5 14-28C28 6.3 21.7 0 14 0z" fill="#1a1a1a" stroke="#ffffff" stroke-width="2"/>
    <circle cx="14" cy="14" r="6" fill="white" opacity="0.15"/>
    <text x="14" y="18" text-anchor="middle" font-size="9" font-family="monospace" font-weight="bold" fill="#ffffff">T${turnNum}</text>
  </svg>`
  return L.divIcon({ html: svg, className: '', iconSize: [28, 40], iconAnchor: [14, 40], popupAnchor: [0, -40] })
}













const DEFAULT_SETTINGS = { fontSize:11, accentColor:'#1D9E75', alertColor:'#EF9F27' }
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

Generate 4-7 initial map pins representing key infrastructure for this specific location. Pin types: EOC, HOSPITAL, STAGING, SHELTER, AFFECTED, FIRE, HAZMAT, DAM, BLOCKED. Coordinates must be geographically accurate and within ~15 miles of your chosen center point.

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
All coordinates must be geographically plausible within ~10 miles of this center point.`
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

const SAVE_KEY = 'em_sim_v14'

const defaultState = {
  screen:'portal', scenario:null, jurisdiction:'Mid-Size City', difficulty:'Adaptive', playerName:'', role:'EOC Director',
  history:[], dispatches:[], terminal:[], notepad:'', simTime:'H+0:00',
  situation:'DEVELOPING', turn:0, lifelines:DEFAULT_LIFELINES, headlines:[],
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
  return text
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type:'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── AAR DISPLAY COMPONENT ────────────────────────────────────────────────────
function AARDisplay({ aar, scenario, jurisdiction, difficulty, role, playerName, turns, simTime, worldState, transcript, lifelines, situation, onReset, fs, ac, al }) {
  const [activeSection, setActiveSection] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)

  function downloadAAR() {
    const scenarioName = SCENARIOS[scenario]?.name || scenario
    const date = new Date().toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
    const time = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })

    let text = `NEXUS EOC — AFTER-ACTION REVIEW\n`
    text += `${'='.repeat(60)}\n\n`
    text += `SCENARIO:     ${scenarioName}\n`
    text += `JURISDICTION: ${jurisdiction}\n`
    text += `ROLE:         ${role}\n`
    text += `DIFFICULTY:   ${difficulty}\n`
    if (playerName) text += `COMMANDER:    ${playerName}\n`
    text += `TURNS:        ${turns}\n`
    text += `SIM TIME:     ${simTime}\n`
    text += `GENERATED:    ${date} ${time}\n\n`
    text += `${'='.repeat(60)}\n\n`

    AAR_SECTIONS.forEach(s => {
      if (aar[s.key]) {
        text += `${s.label.toUpperCase()}\n`
        text += `${'-'.repeat(s.label.length)}\n`
        text += `${aar[s.key]}\n\n`
      }
    })

    text += `${'='.repeat(60)}\n`
    text += `NEXUS EOC — nexuseoc.com\n`

    downloadTextFile(`NEXUS_EOC_AAR_${scenarioName.replace(/\s+/g,'_')}_${date.replace(/\s+/g,'_')}.txt`, text)
  }

  function downloadTranscript() {
    const scenarioName = SCENARIOS[scenario]?.name || scenario
    const date = new Date().toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
    const text = formatExerciseTranscript({
      scenario, jurisdiction, difficulty, role, playerName,
      worldState, transcript, finalLifelines: lifelines,
      finalSimTime: simTime, finalSituation: situation, aar,
    })
    downloadTextFile(`NEXUS_EOC_Transcript_${scenarioName.replace(/\s+/g,'_')}_${date.replace(/\s+/g,'_')}.txt`, text)
  }

  const scenarioName = SCENARIOS[scenario]?.name || scenario

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:'JetBrains Mono, monospace' }}>

      {/* AAR HEADER */}
      <div style={{ padding:'12px 16px', borderBottom:'0.5px solid #2a2a2a', background:'#0a0a0a', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
          <div>
            <div style={{ fontSize:9, color:ac, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:4 }}>
              After-Action Review — ENDEX
            </div>
            <div style={{ fontSize:fs+2, fontWeight:700, color:'#ddd', letterSpacing:'0.04em' }}>
              {scenarioName}
            </div>
            <div style={{ fontSize:fs-1, color:'#555', marginTop:2 }}>
              {jurisdiction} · {role} · {difficulty} · {turns} turn{turns !== 1 ? 's' : ''} · {simTime}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button onClick={downloadAAR}
              style={{ padding:'5px 12px', fontSize:fs-1, color:ac, border:`0.5px solid ${ac}`, background:'transparent', cursor:'pointer', fontFamily:'JetBrains Mono, monospace', borderRadius:3, letterSpacing:'0.06em' }}>
              ↓ Download AAR
            </button>
            <button onClick={downloadTranscript}
              style={{ padding:'5px 12px', fontSize:fs-1, color:ac, border:`0.5px solid ${ac}`, background:'transparent', cursor:'pointer', fontFamily:'JetBrains Mono, monospace', borderRadius:3, letterSpacing:'0.06em' }}>
              📄 Transcript
            </button>
            <button onClick={() => setShowFeedback(s => !s)}
              style={{ padding:'5px 12px', fontSize:fs-1, color:showFeedback ? al : '#555', border:`0.5px solid ${showFeedback ? al : '#333'}`, background:showFeedback ? al+'11' : 'transparent', cursor:'pointer', fontFamily:'JetBrains Mono, monospace', borderRadius:3 }}>
              ★ Feedback
            </button>
            <button onClick={onReset}
              style={{ padding:'5px 12px', fontSize:fs-1, color:'#555', border:'0.5px solid #333', background:'transparent', cursor:'pointer', fontFamily:'JetBrains Mono, monospace', borderRadius:3 }}>
              ↩ New Scenario
            </button>
          </div>
        </div>

        {/* Section nav tabs */}
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:8 }}>
          <button
            onClick={() => setActiveSection(null)}
            style={{ padding:'3px 8px', fontSize:9, cursor:'pointer', fontFamily:'JetBrains Mono, monospace', borderRadius:2, letterSpacing:'0.06em', border:`0.5px solid ${activeSection === null ? ac : '#2a2a2a'}`, background:activeSection === null ? ac+'18' : 'transparent', color:activeSection === null ? ac : '#444' }}>
            ALL
          </button>
          {AAR_SECTIONS.map(s => (
            <button key={s.key}
              onClick={() => setActiveSection(activeSection === s.key ? null : s.key)}
              style={{ padding:'3px 8px', fontSize:9, cursor:'pointer', fontFamily:'JetBrains Mono, monospace', borderRadius:2, letterSpacing:'0.04em', border:`0.5px solid ${activeSection === s.key ? ac : '#2a2a2a'}`, background:activeSection === s.key ? ac+'18' : 'transparent', color:activeSection === s.key ? ac : '#444' }}>
              {s.icon} {s.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* AAR BODY */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>
        {showFeedback && (
          <div style={{ marginBottom:16 }}>
            <EndexFeedback
              scenario={scenario} role={role} jurisdiction={jurisdiction}
              difficulty={difficulty} turns={turns} fs={fs} ac={ac} al={al}
            />
          </div>
        )}
        {AAR_SECTIONS.filter(s => !activeSection || s.key === activeSection).map((s, idx) => {
          const content = aar[s.key]
          if (!content) return null

          // Special rendering for criticalGaps and strengths — split on periods for scannable list
          const isListSection = s.key === 'strengths' || s.key === 'criticalGaps' || s.key === 'recommendations'
          const isBorderRed   = s.key === 'criticalGaps'
          const isBorderGreen = s.key === 'strengths'
          const borderColor   = isBorderRed ? '#E24B4A' : isBorderGreen ? '#1D9E75' : '#2a2a2a'

          return (
            <div key={s.key} style={{ marginBottom:activeSection ? 0 : 20, padding:'14px 16px', border:`0.5px solid ${borderColor}`, borderLeft:`3px solid ${borderColor}`, borderRadius:4, background:'#080808' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <span style={{ fontSize:14 }}>{s.icon}</span>
                <span style={{ fontSize:9, fontWeight:700, color: isBorderRed ? '#E24B4A' : isBorderGreen ? '#1D9E75' : '#555', textTransform:'uppercase', letterSpacing:'0.12em' }}>
                  {s.label}
                </span>
                {idx === 0 && !activeSection && (
                  <span style={{ marginLeft:'auto', fontSize:9, color:'#2a2a2a', letterSpacing:'0.06em' }}>
                    {`${AAR_SECTIONS.length} sections`}
                  </span>
                )}
              </div>
              <div style={{ fontSize:fs, color:'#888', lineHeight:1.9 }}>
                {content}
              </div>
            </div>
          )
        })}
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
    onUpdate(Math.max(10, Math.min(90, pct)))
  }
  function onUp() {
    drag.current = null
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  return onMouseDown
}

function InfoCallout({ panelKey, anchorRef, onClose }) {
  const info = PANEL_INFO[panelKey]
  const [pos, setPos] = useState({ top:0, left:0 })
  useEffect(() => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, left: Math.min(rect.left, window.innerWidth - 360) })
    }
    const handler = (e) => {
      if (!e.target.closest('[data-info-callout]') && !e.target.closest('[data-info-btn]')) onClose()
    }
    setTimeout(() => window.addEventListener('click', handler), 50)
    return () => window.removeEventListener('click', handler)
  }, [])
  if (!info) return null
  return (
    <div data-info-callout="true" style={{ position:'fixed', top:pos.top, left:pos.left, width:340, background:'#141414', border:'0.5px solid #444', borderRadius:8, padding:'12px 14px', zIndex:3000, boxShadow:'0 8px 24px rgba(0,0,0,0.9)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <span style={{ fontSize:11, fontWeight:500, color:'#ccc', letterSpacing:'0.04em' }}>{info.title}</span>
        <button onClick={onClose} style={{ fontSize:12, color:'#555', border:'none', background:'none', cursor:'pointer', padding:'0 2px' }}>✕</button>
      </div>
      <p style={{ fontSize:10, color:'#777', lineHeight:1.7, margin:0, whiteSpace:'normal', wordBreak:'break-word' }}>{info.body}</p>
    </div>
  )
}

function InfoBtn({ panelKey, activeInfo, setActiveInfo }) {
  const btnRef = useRef(null)
  const isActive = activeInfo === panelKey
  return (
    <>
      <button ref={btnRef} data-info-btn="true"
        onClick={e => { e.stopPropagation(); setActiveInfo(isActive ? null : panelKey) }}
        style={{ marginLeft:6, width:14, height:14, borderRadius:'50%', border:'0.5px solid #444', background:isActive?'#333':'transparent', color:'#555', cursor:'pointer', fontSize:9, display:'inline-flex', alignItems:'center', justifyContent:'center', padding:0, flexShrink:0 }}>
        ⓘ
      </button>
      {isActive && <InfoCallout panelKey={panelKey} anchorRef={btnRef} onClose={() => setActiveInfo(null)} />}
    </>
  )
}

function LifelineTile({ ll, data }) {
  const [hovered, setHovered] = useState(false)
  const [tipPos, setTipPos]   = useState({ left:0, top:0 })
  const tileRef               = useRef(null)
  const status = data?.status || 'YELLOW'
  const reason = data?.reason || 'Assessment pending.'
  const c = LL_COLORS[status]
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

function MapUpdater({ center }) {
  const map = useMap()
  useEffect(() => { map.setView(center, 13) }, [center])
  return null
}

function SettingsPanel({ settings, onChange, onClose }) {
  return (
    <div style={{ position:'fixed', top:60, right:16, width:260, background:'#141414', border:'0.5px solid #333', borderRadius:10, padding:'14px 16px', zIndex:2000, boxShadow:'0 8px 24px rgba(0,0,0,0.8)' }}>
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
  const [boundaries, setBoundaries]   = useState([14, 32, 80])
  const [leftBounds, setLeftBounds]   = useState([40, 70])
  const [rightSplit, setRightSplit]   = useState(45)
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
      const n = [...prev], min = 8
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
          if (divIdx === 0) n[0] = Math.max(10, Math.min(pct, prev[1] - 10))
          else              n[1] = Math.max(prev[0] + 10, Math.min(pct, 90))
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
      notepad:'', lifelines:DEFAULT_LIFELINES, headlines:[], dynamicPins:[],
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
          { type:'system',   text:'Type your decisions as the EM on scene. Be specific. Type ENDEX for AAR.' },
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
          lifelines: DEFAULT_LIFELINES,
        }],
      })
    } catch(e) {
      update({
        terminal: [
          { type:'header',   text:`▶ ${sc.name.toUpperCase()} — ${jurisdiction} — ${state.difficulty}` },
          { type:'system',   text:'Type your decisions as the EM on scene. Be specific. Type ENDEX for AAR.' },
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
          lifelines: DEFAULT_LIFELINES,
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
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendAction() }
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
    downloadTextFile(`NEXUS_EOC_Transcript_${scenarioName.replace(/\s+/g,'_')}_${date.replace(/\s+/g,'_')}.txt`, text)
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

  // ─── SETUP SCREEN ──────────────────────────────────────────────────────────
  if (state.screen === 'setup') {
    const sac = '#1D9E75'
    return (
      <div style={{ minHeight:'100vh', fontFamily:'JetBrains Mono, monospace', display:'flex', flexDirection:'column', position:'relative' }}>
        {showOnboarding && (
          <OnboardingModal onClose={closeOnboarding} ac={settings.accentColor} />
        )}
        <div style={{ position:'fixed', inset:0, zIndex:0, backgroundImage:'url(/bg-map.png)', backgroundSize:'cover', backgroundPosition:'center', backgroundRepeat:'no-repeat' }}/>
        <div style={{ position:'fixed', inset:0, zIndex:1, background:'rgba(4,8,6,0.82)' }}/>
        <div style={{ position:'fixed', inset:0, zIndex:1, backgroundImage:'linear-gradient(rgba(29,158,117,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(29,158,117,0.04) 1px, transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', minHeight:'100vh' }}>
          <div style={{ borderBottom:'0.5px solid rgba(29,158,117,0.15)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 24px', borderBottom:'0.5px solid rgba(29,158,117,0.1)', background:'rgba(4,8,6,0.6)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:9, color:'#6aaa80', letterSpacing:'0.12em' }}>
                NEXUS EOC — SIMULATED EMERGENCY OPERATIONS PLATFORM
              </div>
              <div style={{ display:'flex', gap:24 }}>
                {[['SYSTEM STATUS','● OPERATIONAL'],['NETWORK','SECURE'],['DATA FEED','LIVE'],['AI ENGINE','ONLINE']].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:1 }}>
                    <span style={{ fontSize:8, color:'#5a9a70', letterSpacing:'0.1em' }}>{k}</span>
                    <span style={{ fontSize:9, color:sac, letterSpacing:'0.08em' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ maxWidth:1200, margin:'0 auto', width:'100%', boxSizing:'border-box', padding:'28px 32px 24px', display:'grid', gridTemplateColumns:'1fr auto', gap:40, alignItems:'start' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <div style={{ width:24, height:'0.5px', background:sac }}/>
                  <span style={{ fontSize:9, color:sac, letterSpacing:'0.2em', textTransform:'uppercase' }}>Simulated Emergency Operations Platform</span>
                </div>
                <h1 style={{ fontSize:32, fontWeight:700, lineHeight:1.05, margin:'0 0 6px', color:'#e8f5f0', letterSpacing:'0.04em' }}>NEXUS EOC</h1>
                <p style={{ fontSize:13, color:'#5aaa80', letterSpacing:'0.04em', margin:'0 0 8px', fontWeight:400 }}>Simulated Emergency Operations Platform</p>
                <p style={{ fontSize:11, color:'#6aba88', lineHeight:1.8, margin:'0 0 20px', maxWidth:500 }}>Scenario-based incident command simulations for emergency managers, EOCs, and response teams.</p>
                <div style={{ display:'flex', gap:32 }}>
                  {[['TRAIN','Realistic scenarios built for your role'],['DECIDE','Sharpen judgment under pressure'],['COMMAND','Practice ICS doctrine'],['REVIEW','AI after-action every scenario']].map(([label,desc]) => (
                    <div key={label} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      <span style={{ fontSize:9, color:sac, letterSpacing:'0.12em', fontWeight:700 }}>{label}</span>
                      <span style={{ fontSize:9, color:'#5a8a70', lineHeight:1.5 }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ minWidth:180, border:'0.5px solid rgba(29,158,117,0.2)', borderRadius:3, background:'rgba(4,8,6,0.75)', padding:'10px 14px' }}>
                {[['SCENARIOS','10 LOADED'],['JURISDICTIONS','6 TYPES'],['DIFFICULTY','5 LEVELS'],['AAR','STRUCTURED'],['VERSION','2.1']].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'0.5px solid rgba(29,158,117,0.08)' }}>
                    <span style={{ fontSize:8, color:'#5a9a70', letterSpacing:'0.1em' }}>{k}</span>
                    <span style={{ fontSize:8, color:sac, letterSpacing:'0.08em' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'20px 32px' }}>
            <div style={{ maxWidth:1200, margin:'0 auto', width:'100%', boxSizing:'border-box' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <span style={{ fontSize:9, color:'#6aaa80', textTransform:'uppercase', letterSpacing:'0.12em' }}>Select Scenario</span>
                <div style={{ flex:1, height:'0.5px', background:'rgba(29,158,117,0.15)' }}/>
                {state.scenario && <span style={{ fontSize:9, color:sac, letterSpacing:'0.06em' }}>✓ {SCENARIOS[state.scenario].name}</span>}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:6, marginBottom:20 }}>
                {Object.entries(SCENARIOS).map(([key, sc]) => {
                  const selected = state.scenario === key
                  return (
                    <button key={key} onClick={() => update({ scenario:key })}
                      style={{ textAlign:'left', padding:'14px 12px', border:`0.5px solid ${selected?sac:'rgba(29,158,117,0.18)'}`, borderLeft:`${selected?'3px':'0.5px'} solid ${selected?sac:'rgba(29,158,117,0.18)'}`, background:selected?'rgba(29,158,117,0.12)':'rgba(4,8,6,0.65)', cursor:'pointer', borderRadius:3, outline:'none', position:'relative' }}
                      onMouseEnter={e => { if(!selected){ e.currentTarget.style.borderColor='rgba(29,158,117,0.4)'; e.currentTarget.style.background='rgba(29,158,117,0.07)' }}}
                      onMouseLeave={e => { if(!selected){ e.currentTarget.style.borderColor='rgba(29,158,117,0.18)'; e.currentTarget.style.background='rgba(4,8,6,0.65)' }}}>
                      {selected && <div style={{ position:'absolute', top:6, right:6, width:5, height:5, borderRadius:'50%', background:sac }}/>}
                      <div style={{ fontSize:24, marginBottom:8, lineHeight:1 }}>{sc.icon}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:selected?sac:'#6aaa80', marginBottom:5, letterSpacing:'0.06em', lineHeight:1.3 }}>{sc.name.toUpperCase()}</div>
                      <div style={{ fontSize:11, color:'#ccc', lineHeight:1.7 }}>{sc.desc}</div>
                    </button>
                  )
                })}
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <span style={{ fontSize:9, color:'#4a8a68', textTransform:'uppercase', letterSpacing:'0.12em' }}>Role</span>
                <div style={{ flex:1, height:'0.5px', background:'rgba(29,158,117,0.15)' }}/>
              </div>
              <div style={{ marginBottom:16 }}>
                <select value={state.role||'EOC Director'} onChange={e => update({ role:e.target.value })}
                  style={{ width:'100%', padding:'9px 10px', background:'rgba(4,8,6,0.85)', border:'0.5px solid rgba(29,158,117,0.3)', color:'#8adaaa', fontSize:11, fontFamily:'JetBrains Mono, monospace', borderRadius:3, outline:'none' }}>
                  {Object.entries(ROLE_GROUPS).map(([group, roles]) => (
                    <optgroup key={group} label={group} style={{ background:'#0a140c', color:'#4a8a68' }}>
                      {roles.map(r => <option key={r} value={r} style={{ background:'#0a140c' }}>{r}</option>)}
                    </optgroup>
                  ))}
                </select>
                {state.role && <div style={{ marginTop:6, fontSize:9, color:'#bbb', lineHeight:1.7, paddingLeft:2 }}>{ROLES[state.role]}</div>}
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <span style={{ fontSize:9, color:'#6aaa80', textTransform:'uppercase', letterSpacing:'0.12em' }}>Commander</span>
                <div style={{ flex:1, height:'0.5px', background:'rgba(29,158,117,0.15)' }}/>
              </div>
              <div style={{ marginBottom:16 }}>
                <input type="text" placeholder="Enter your name (optional)" value={state.playerName||''} onChange={e => update({ playerName: e.target.value })} maxLength={40}
                  style={{ width:'100%', padding:'9px 10px', background:'rgba(4,8,6,0.85)', border:'0.5px solid rgba(29,158,117,0.3)', color:'#8adaaa', fontSize:11, fontFamily:'JetBrains Mono, monospace', borderRadius:3, outline:'none', boxSizing:'border-box' }}/>
                <div style={{ marginTop:6, fontSize:8, color:'#3a6a48', lineHeight:1.6 }}>Your name is used locally to personalize your session only. We collect anonymous play statistics — no personal data is stored.</div>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <span style={{ fontSize:9, color:'#6aaa80', textTransform:'uppercase', letterSpacing:'0.12em' }}>Configuration</span>
                <div style={{ flex:1, height:'0.5px', background:'rgba(29,158,117,0.15)' }}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                <div>
                  <p style={{ fontSize:9, color:'#6aaa80', margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'0.12em' }}>Jurisdiction Type</p>
                  <select value={state.jurisdiction} onChange={e => update({ jurisdiction:e.target.value })}
                    style={{ width:'100%', padding:'9px 10px', background:'rgba(4,8,6,0.85)', border:'0.5px solid rgba(29,158,117,0.3)', color:'#8adaaa', fontSize:11, fontFamily:'JetBrains Mono, monospace', borderRadius:3, outline:'none' }}>
                    {JURISDICTIONS.map(j => <option key={j} style={{ background:'#0a140c' }}>{j}</option>)}
                  </select>
                  {state.jurisdiction && (
                    <div style={{ marginTop:7, fontSize:9, color:'#bbb', lineHeight:1.7, paddingLeft:2 }}>
                      {JURISDICTION_CONTEXT[state.jurisdiction].desc}
                      <div style={{ marginTop:5, color:'#888' }}><span style={{ color:sac }}>Constraints: </span>{JURISDICTION_CONTEXT[state.jurisdiction].constraints}</div>
                    </div>
                  )}
                </div>
                <div>
                  <p style={{ fontSize:9, color:'#6aaa80', margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'0.12em' }}>Difficulty</p>
                  <select value={state.difficulty} onChange={e => update({ difficulty:e.target.value })}
                    style={{ width:'100%', padding:'9px 10px', background:'rgba(4,8,6,0.85)', border:'0.5px solid rgba(29,158,117,0.3)', color:'#8adaaa', fontSize:11, fontFamily:'JetBrains Mono, monospace', borderRadius:3, outline:'none' }}>
                    {DIFFICULTIES.map(d => <option key={d} style={{ background:'#0a140c' }}>{d}</option>)}
                  </select>
                  {state.difficulty && (
                    <div style={{ marginTop:7, fontSize:9, color:'#bbb', lineHeight:1.7, paddingLeft:2 }}>
                      {state.difficulty === 'Basic' && 'Generous evaluation. One complication per turn. Good for learning the system.'}
                      {state.difficulty === 'Moderate' && 'Moderate rigor. Two complications per turn. Realistic resource pressure.'}
                      {state.difficulty === 'Advanced' && 'Professional rigor. 2-3 complications per turn. Resource constraints are real.'}
                      {state.difficulty === 'Brutal' && 'Ruthless evaluation. Every vague or delayed decision cascades.'}
                      {state.difficulty === 'Adaptive' && 'Difficulty scales to your performance. Never lets you get comfortable.'}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <span style={{ fontSize:9, color:'#6aaa80', textTransform:'uppercase', letterSpacing:'0.12em' }}>Documentation</span>
                <div style={{ flex:1, height:'0.5px', background:'rgba(29,158,117,0.15)' }}/>
              </div>
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                {[
                  { href:'/NEXUS_EOC_Overview.pdf', icon:'📄', label:'PLATFORM OVERVIEW', sub:'One-page summary — opens in new tab', arrow:'↗' },
                  { href:'/NEXUS_EOC_User_Guide.pdf', icon:'📋', label:'USER GUIDE', sub:'Full interface reference — opens in new tab', arrow:'↗' },
                  { href:'/NEXUS_EOC_Resource_Guide.xlsx', icon:'📊', label:'RESOURCE GUIDE', sub:'All reference links by scenario — Excel', arrow:'↓' },
                ].map(d => (
                  <a key={d.label} href={d.href} target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', border:'0.5px solid rgba(29,158,117,0.25)', borderRadius:3, background:'rgba(4,8,6,0.65)', textDecoration:'none', flex:1 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(29,158,117,0.5)'; e.currentTarget.style.background='rgba(29,158,117,0.07)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(29,158,117,0.25)'; e.currentTarget.style.background='rgba(4,8,6,0.65)' }}>
                    <span style={{ fontSize:18 }}>{d.icon}</span>
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, color:'#6aaa80', letterSpacing:'0.06em' }}>{d.label}</div>
                      <div style={{ fontSize:8, color:'#5a9a70', marginTop:2 }}>{d.sub}</div>
                    </div>
                    <span style={{ marginLeft:'auto', fontSize:9, color:'#3a6a48' }}>{d.arrow}</span>
                  </a>
                ))}
              </div>

              <button onClick={() => state.scenario && !initLoading && startScenario(state.scenario)} disabled={!state.scenario || initLoading}
                style={{ width:'100%', padding:'14px', fontSize:12, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', border:`0.5px solid ${state.scenario?sac:'rgba(29,158,117,0.2)'}`, color:state.scenario?'#040806':'#3a6a48', background:state.scenario?sac:'rgba(4,8,6,0.6)', cursor:(state.scenario&&!initLoading)?'pointer':'not-allowed', fontFamily:'JetBrains Mono, monospace', borderRadius:3, opacity:initLoading?0.6:1 }}>
                {initLoading ? '⟳  Generating scenario world...' : state.scenario ? `Launch — ${SCENARIOS[state.scenario].name} / ${state.jurisdiction} ↗` : 'Select a scenario to begin'}
              </button>
            </div>
          </div>

          <div style={{ borderTop:'0.5px solid rgba(29,158,117,0.15)', background:'rgba(4,8,6,0.92)', padding:'8px 32px', flexShrink:0 }}>
            <div style={{ maxWidth:1200, margin:'0 auto', width:'100%', display:'flex', gap:0 }}>
              {[['EOC NETWORK','CONNECTED'],['MODE','TRAINING'],['SCENARIO', state.scenario ? SCENARIOS[state.scenario].name.toUpperCase() : '—'],['JURISDICTION', state.jurisdiction ? state.jurisdiction.toUpperCase() : '—'],['ROLE', state.role ? state.role.toUpperCase() : 'EOC DIRECTOR'],['DIFFICULTY', state.difficulty ? state.difficulty.toUpperCase() : '—'],['STATUS', state.scenario ? 'READY TO LAUNCH' : 'AWAITING SELECTION']].map(([k,v], i, arr) => (
                <div key={k} style={{ display:'flex', flexDirection:'column', gap:2, paddingRight:24, marginRight:24, borderRight: i < arr.length-1 ? '0.5px solid rgba(29,158,117,0.1)' : 'none' }}>
                  <span style={{ fontSize:8, color:'#3a6a48', letterSpacing:'0.12em' }}>{k}</span>
                  <span style={{ fontSize:10, color: k==='STATUS' && state.scenario ? sac : '#5a9a70', letterSpacing:'0.06em' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ position:'relative', zIndex:2, textAlign:'center', padding:'10px 32px', borderTop:'0.5px solid rgba(29,158,117,0.1)', background:'rgba(4,8,6,0.7)' }}>
          <span style={{ fontSize:8, color:'#2a4a3a', letterSpacing:'0.1em' }}>
            © {new Date().getFullYear()} NICHOLAS EDWARDS — NEXUS EOC — ALL RIGHTS RESERVED — UNAUTHORIZED REPRODUCTION OR COMMERCIAL USE PROHIBITED
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <a href="/about.html" style={{ color:'#3a6a48', textDecoration:'none', letterSpacing:'0.1em' }} onMouseEnter={e => e.target.style.color='#1D9E75'} onMouseLeave={e => e.target.style.color='#3a6a48'}>ABOUT</a>
          </span>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      </div>
    )
  }

  // ─── GAME SCREEN ───────────────────────────────────────────────────────────
  const divSty    = { width:10, cursor:'col-resize', background:'#161616', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', borderLeft:'0.5px solid #2a2a2a', borderRight:'0.5px solid #2a2a2a' }
  const divInner  = { width:3, height:28, background:'#3a3a3a', borderRadius:2, pointerEvents:'none' }
  const hDivSty   = { height:10, cursor:'row-resize', background:'#161616', display:'flex', alignItems:'center', justifyContent:'center', borderTop:'0.5px solid #2a2a2a', borderBottom:'0.5px solid #2a2a2a', flexShrink:0 }
  const hDivInner = { width:28, height:3, background:'#3a3a3a', borderRadius:2 }
  const panelHdr  = (label, infoKey) => (
    <div style={{ padding:'6px 10px', borderBottom:'0.5px solid #222', background:'#111', fontSize:10, fontWeight:500, color:'#666', textTransform:'uppercase', letterSpacing:'0.08em', flexShrink:0, display:'flex', alignItems:'center' }}>
      {label}
      {infoKey && <InfoBtn panelKey={infoKey} activeInfo={activeInfo} setActiveInfo={setActiveInfo} />}
    </div>
  )

  const dynamicPins = state.dynamicPins || []
  const center      = state.worldState?.center || [39.5, -98.35]
  const mapZoom     = state.worldState ? 13 : 4
  const refs        = state.scenario ? SCENARIO_REFS[state.scenario]||[] : []
  const initPins    = dynamicPins.filter(p => p.id?.startsWith('init-'))
  const turnPins    = dynamicPins.filter(p => !p.id?.startsWith('init-'))
  const isEndex     = state.situation === 'ENDEX'

  const termStyles = {
    header:      { color:'#aaa', fontWeight:500, marginBottom:4, fontSize:fs },
    system:      { color:'#333', fontSize:Math.max(9,fs-2), marginBottom:6 },
    narrator:    { color:'#ccc', marginBottom:6, fontSize:fs },
    player:      { color:ac, marginBottom:4, fontWeight:500, fontSize:fs },
    consequence: { color:'#777', marginBottom:6, borderLeft:'2px solid #2a2a2a', paddingLeft:10, fontSize:fs },
    time:        { color:al, fontSize:Math.max(9,fs-1), marginBottom:2, fontWeight:500 },
    prompt:      { color:al, fontStyle:'italic', marginBottom:4, fontSize:fs },
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'97vh', padding:'0.75rem', gap:8, fontFamily:'JetBrains Mono, monospace', fontSize:fs, width:'100%', boxSizing:'border-box' }}>

      {showSettings && <SettingsPanel settings={settings} onChange={updateSettings} onClose={() => setShowSettings(false)} />}

      {/* LIFELINE BAR */}
      <div style={{ display:'flex', gap:6, padding:'6px 10px', border:'0.5px solid #222', borderRadius:8, background:'#0d0d0d', alignItems:'center', flexShrink:0 }}>
        <span style={{ fontSize:9, color:'#444', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:500, marginRight:4, whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:4 }}>
          Community Lifelines
          <InfoBtn panelKey="lifelines" activeInfo={activeInfo} setActiveInfo={setActiveInfo} />
        </span>
        {LIFELINES.map(ll => <LifelineTile key={ll.key} ll={ll} data={state.lifelines?.[ll.key]} />)}
        <button onClick={() => setShowSettings(s => !s)} title="Display Settings"
          style={{ marginLeft:8, flexShrink:0, width:26, height:26, borderRadius:5, border:'0.5px solid #333', background:showSettings?'#222':'transparent', color:'#666', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>
          ⚙️
        </button>
      </div>

      {/* FOUR PANEL ROW */}
      <div ref={containerRef} style={{ display:'flex', flex:1, minHeight:0 }}>

        {/* LEFT COLUMN */}
        <div ref={leftColRef} style={{ width:`${colW[0]}%`, display:'flex', flexDirection:'column', flexShrink:0, minHeight:0 }}>
          <div style={{ height:`${leftBounds[0]}%`, display:'flex', flexDirection:'column', border:'0.5px solid #222', borderRadius:8, overflow:'hidden', flexShrink:0 }}>
            {panelHdr('Media Feed', 'media')}
            <div style={{ flex:1, overflowY:'auto', padding:'6px 8px', display:'flex', flexDirection:'column', gap:6 }}>
              {state.headlines.length === 0 && <div style={{ color:'#333', fontSize:10, padding:'8px', fontStyle:'italic' }}>Headlines appear after your first action.</div>}
              {state.headlines.map(h => (
                <div key={h.id} style={{ padding:'6px 8px', borderRadius:6, border:`0.5px solid ${h.turn===state.turn?'#2a2a3a':'#1a1a1a'}`, background:h.turn===state.turn?'#16161f':'transparent', lineHeight:1.5 }}>
                  {h.turn===state.turn && <div style={{ fontSize:9, color:'#4A90D9', fontWeight:500, marginBottom:2 }}>LIVE</div>}
                  <div style={{ fontSize:fs-1, color:h.turn===state.turn?'#ccc':'#444', marginBottom:2 }}>{h.text}</div>
                  <div style={{ fontSize:9, color:'#333' }}>{h.source} — {h.time}</div>
                </div>
              ))}
            </div>
          </div>
          <div onMouseDown={makeLeftVertDrag(0)} style={hDivSty}><div style={hDivInner}/></div>
          <div style={{ height:`${leftBounds[1]-leftBounds[0]}%`, display:'flex', flexDirection:'column', border:'0.5px solid #222', borderRadius:8, overflow:'hidden', flexShrink:0 }}>
            {panelHdr('Reference Links', 'refs')}
            <div style={{ flex:1, overflowY:'auto', padding:'6px 8px', display:'flex', flexDirection:'column', gap:4 }}>
              {refs.length === 0 && <div style={{ color:'#333', fontSize:10, padding:'8px', fontStyle:'italic' }}>Launch a scenario to see references.</div>}
              {refs.map((r,i) => (
                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                  style={{ display:'block', padding:'6px 8px', borderRadius:6, border:'0.5px solid #1a1a1a', fontSize:fs-1, color:'#4A90D9', lineHeight:1.5, textDecoration:'none', wordBreak:'break-word' }}
                  onMouseEnter={e => e.currentTarget.style.background='#0a0a1a'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  {r.label} ↗
                </a>
              ))}
            </div>
          </div>
          <div onMouseDown={makeLeftVertDrag(1)} style={hDivSty}><div style={hDivInner}/></div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', border:'0.5px solid #222', borderRadius:8, overflow:'hidden', minHeight:0 }}>
            {panelHdr('ESF Reference', 'esf')}
            <div style={{ flex:1, overflowY:'auto', padding:'6px 8px', display:'flex', flexDirection:'column', gap:3 }}>
              {activeESFs && Object.values(activeESFs).some(v => v) && (
                <div style={{ padding:'4px 8px', marginBottom:2, fontSize:9, color:ac, borderBottom:'0.5px solid #1a1a1a' }}>
                  {Object.values(activeESFs).filter(Boolean).length} ESF{Object.values(activeESFs).filter(Boolean).length !== 1 ? 's' : ''} active — click to toggle
                </div>
              )}
              {ESFS.map(esf => {
                const isActive = !!activeESFs[esf.num]
                return (
                  <div key={esf.num} onClick={() => setActiveESFs(prev => ({ ...prev, [esf.num]: !prev[esf.num] }))}
                    style={{ padding:'5px 8px', borderRadius:5, border:`0.5px solid ${isActive?ac:'#1a1a1a'}`, lineHeight:1.4, cursor:'pointer', background:isActive?ac+'11':'transparent', borderLeft:isActive?`3px solid ${ac}`:'0.5px solid #1a1a1a', transition:'all 0.1s' }}>
                    <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:2 }}>
                      <span style={{ fontSize:9, color:isActive?ac:al, fontWeight:500, whiteSpace:'nowrap' }}>ESF-{esf.num}</span>
                      <span style={{ fontSize:fs-1, color:isActive?'#ddd':'#aaa', fontWeight:500, flex:1 }}>{esf.name}</span>
                      <span style={{ fontSize:8, color:isActive?ac:'#333', fontWeight:500 }}>{isActive?'● ACTIVE':'○'}</span>
                    </div>
                    <div style={{ fontSize:9, color:isActive?'#666':'#444' }}>Lead: {esf.lead}</div>
                    <div style={{ fontSize:9, color:isActive?'#555':'#333', marginTop:1 }}>{esf.desc}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div style={divSty} onMouseDown={e => onColDown(0,e)}><div style={divInner}/></div>

        {/* DISPATCH */}
        <div style={{ width:`${colW[1]}%`, display:'flex', flexDirection:'column', border:'0.5px solid #222', borderRadius:8, overflow:'hidden', flexShrink:0 }}>
          <div style={{ padding:'6px 10px', borderBottom:'0.5px solid #222', background:'#111', fontSize:10, fontWeight:500, color:'#666', textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ display:'flex', alignItems:'center' }}>
              Field Dispatch
              <InfoBtn panelKey="dispatch" activeInfo={activeInfo} setActiveInfo={setActiveInfo} />
            </span>
            <span style={{ background:'#E24B4A', color:'#fff', borderRadius:3, padding:'1px 5px', fontSize:9 }}>{state.dispatches.length}</span>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'6px 8px', display:'flex', flexDirection:'column', gap:6 }}>
            {initLoading && (
              <div style={{ padding:'8px', fontSize:10, color:'#444', fontStyle:'italic', textAlign:'center' }}>
                Generating scenario world...<br/>
                <span style={{ fontSize:9, color:'#333' }}>Building location, resources, and initial conditions</span>
              </div>
            )}
            {state.dispatches.map(d => {
              const isNew = d.turn === state.turn
              return (
                <div key={d.id} style={{ padding:'6px 8px', borderRadius:6, border:`0.5px solid ${isNew?'#2a3a2a':'#222'}`, background:isNew?'#1a2a1a':'transparent', fontSize:fs-1, color:isNew?'#ddd':'#555', lineHeight:1.5 }}>
                  {isNew && <div style={{ fontSize:9, color:ac, fontWeight:500, marginBottom:2 }}>NEW — {state.simTime}</div>}
                  {d.text}
                </div>
              )
            })}
          </div>
        </div>

        <div style={divSty} onMouseDown={e => onColDown(1,e)}><div style={divInner}/></div>

        {/* TERMINAL / AAR PANEL */}
        <div style={{ width:`${colW[2]}%`, display:'flex', flexDirection:'column', border:`0.5px solid ${isEndex && state.aar ? ac+'44' : '#222'}`, borderRadius:8, overflow:'hidden', flexShrink:0, transition:'border-color 0.3s' }}>

          {/* Panel header */}
          <div style={{ padding:'6px 10px', borderBottom:'0.5px solid #222', background:'#111', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
            <span style={{ fontSize:10, fontWeight:500, color: isEndex && state.aar ? ac : '#666', textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', alignItems:'center' }}>
              {isEndex && state.aar ? 'After-Action Review' : SCENARIOS[state.scenario]?.name}
              {!isEndex && state.worldState && <span style={{ color:ac, marginLeft:6 }}>— {state.worldState.location}</span>}
              {!isEndex && <InfoBtn panelKey="terminal" activeInfo={activeInfo} setActiveInfo={setActiveInfo} />}
            </span>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {!isEndex && <span style={{ fontSize:10, color:'#444' }}>{state.simTime}</span>}
              {!isEndex && (
                <span style={{ fontSize:9, padding:'2px 6px', borderRadius:3, fontWeight:500, background:(sitColors[state.situation]||'#888')+'22', color:sitColors[state.situation]||'#888' }}>
                  {state.situation}
                </span>
              )}
              {isEndex && state.aar && (
                <span style={{ fontSize:9, padding:'2px 6px', borderRadius:3, fontWeight:500, background:ac+'22', color:ac }}>
                  ENDEX — {state.turn} TURNS
                </span>
              )}
              {!isEndex && (state.exerciseTranscript || []).length > 0 && (
                <button onClick={downloadCurrentTranscript}
                  style={{ fontSize:10, padding:'2px 8px', color:'#555', background:'transparent', border:'0.5px solid #333', cursor:'pointer', fontFamily:'JetBrains Mono, monospace' }}>
                  Transcript
                </button>
              )}
              {!isEndex && (
                <div style={{ position:'relative' }}>
                  <button onClick={() => setShowEndDialog(s => !s)}
                    style={{ fontSize:10, padding:'2px 8px', color:'#555', background:'transparent', border:'0.5px solid #333', cursor:'pointer', fontFamily:'JetBrains Mono, monospace' }}>New</button>
                  {showEndDialog && (
                    <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, background:'#1a1a1a', border:'0.5px solid #333', borderRadius:6, padding:'10px 12px', zIndex:500, whiteSpace:'nowrap', boxShadow:'0 4px 12px rgba(0,0,0,0.8)' }}>
                      <div style={{ fontSize:10, color:'#666', marginBottom:8 }}>End scenario?</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        <button onClick={() => { setShowEndDialog(false); setInput('ENDEX'); setTimeout(() => sendAction(), 50) }}
                          style={{ fontSize:10, padding:'4px 10px', color:al, borderColor:al, textAlign:'left', background:'transparent', cursor:'pointer', fontFamily:'JetBrains Mono, monospace', border:`0.5px solid ${al}` }}>
                          End with AAR ↗
                        </button>
                        <button onClick={() => { setShowEndDialog(false); reset() }}
                          style={{ fontSize:10, padding:'4px 10px', color:'#555', textAlign:'left', background:'transparent', cursor:'pointer', fontFamily:'JetBrains Mono, monospace', border:'0.5px solid #333' }}>
                          End without AAR
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AAR display replaces terminal on ENDEX */}
          {isEndex && state.aar ? (
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
            /* Normal terminal */
            <>
              <div ref={termRef} style={{ flex:1, overflowY:'auto', padding:'10px 14px', lineHeight:1.8 }}>
                {state.terminal.map((line,i) => {
                  if (!line) return null
                  if (line.type==='divider') return <hr key={i} style={{ border:'none', borderTop:'0.5px solid #1a1a1a', margin:'8px 0' }}/>
                  return <div key={i} style={termStyles[line.type]||{ fontSize:fs }}>{line.text}</div>
                })}
                {/* Fallback ENDEX if aar not yet populated */}
                {isEndex && !state.aar && (
                  <div style={{ marginTop:16, paddingTop:12, borderTop:'0.5px solid #1a1a1a' }}>
                    <div style={{ fontSize:fs-1, color:'#555', marginBottom:8 }}>Generating AAR...</div>
                    <button onClick={reset}
                      style={{ padding:'8px 20px', fontSize:fs, fontWeight:500, color:ac, border:`0.5px solid ${ac}`, background:'transparent', cursor:'pointer', fontFamily:'JetBrains Mono, monospace', borderRadius:3 }}>
                      ↩ Return to Mission Select
                    </button>
                  </div>
                )}
                {(loading || initLoading) && (
                  <div style={{ color:'#333', fontStyle:'italic', fontSize:fs }}>
                    {initLoading ? 'Building scenario world...' : 'Evaluating action...'}
                  </div>
                )}
              </div>
              <div style={{ borderTop:'0.5px solid #222', height:8, cursor:'row-resize', background:'#161616', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
                onMouseDown={e => {
                  e.preventDefault()
                  const startY = e.clientY
                  const startHeight = inputAreaHeight
                  function onMove(ev) { setInputAreaHeight(Math.max(60, Math.min(400, startHeight + (startY - ev.clientY)))) }
                  function onUp() { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
                  window.addEventListener('mousemove', onMove)
                  window.addEventListener('mouseup', onUp)
                }}>
                <div style={{ width:28, height:3, background:'#3a3a3a', borderRadius:2 }}/>
              </div>
              <div style={{ padding:'8px 10px', display:'flex', gap:6, height:inputAreaHeight, flexShrink:0 }}>
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                  placeholder={initLoading ? 'Generating scenario...' : 'Your action...'}
                  disabled={initLoading}
                  style={{ flex:1, resize:'none', lineHeight:1.6, fontSize:fs, background:'#0d0d0d', border:'0.5px solid #222', color:'#ccc', padding:'6px 8px', fontFamily:'JetBrains Mono, monospace', height:'100%', boxSizing:'border-box' }}/>
                <button onClick={sendAction} disabled={loading||!input.trim()||initLoading}
                  style={{ padding:'6px 14px', fontWeight:500, alignSelf:'stretch', color:ac, borderColor:ac, background:'transparent', cursor:'pointer', fontFamily:'JetBrains Mono, monospace', border:`0.5px solid ${ac}`, opacity:(loading||!input.trim()||initLoading)?0.4:1 }}>
                  Execute
                </button>
              </div>
            </>
          )}
        </div>

        <div style={divSty} onMouseDown={e => onColDown(2,e)}><div style={divInner}/></div>

        {/* RIGHT COLUMN */}
        <div ref={rightColRef} style={{ width:`${colW[3]}%`, display:'flex', flexDirection:'column', flexShrink:0, minHeight:0 }}>
          <div style={{ height:`${rightSplit}%`, display:'flex', flexDirection:'column', border:'0.5px solid #222', borderRadius:8, overflow:'hidden', flexShrink:0 }}>
            <div style={{ padding:'6px 10px', borderBottom:'0.5px solid #222', background:'#111', fontSize:10, fontWeight:500, color:'#666', textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', alignItems:'center' }}>
              {state.playerName ? `${state.playerName}'s Notepad` : "Director's Notepad"}
              <InfoBtn panelKey="notepad" activeInfo={activeInfo} setActiveInfo={setActiveInfo} />
            </div>
            <textarea value={state.notepad} onChange={e => update({ notepad:e.target.value })}
              placeholder={'Priorities, resource gaps...\n\nPersists across sessions.'}
              style={{ flex:1, resize:'none', border:'none', padding:'8px 10px', background:'transparent', color:'#888', lineHeight:1.7, outline:'none', fontSize:fs }}/>
            <div style={{ padding:'4px 10px', borderTop:'0.5px solid #1a1a1a', fontSize:10, color:'#333' }}>Turn {state.turn} — {state.difficulty}</div>
          </div>
          <div onMouseDown={onRightDown} style={hDivSty}><div style={hDivInner}/></div>
          <div style={{ flex:1, border:'0.5px solid #222', borderRadius:8, overflow:'hidden', minHeight:0 }}>
            <div style={{ padding:'6px 10px', borderBottom:'0.5px solid #222', background:'#111', fontSize:10, fontWeight:500, color:'#666', textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', alignItems:'center' }}>
              Incident Map
              {state.worldState && <span style={{ color:'#333', marginLeft:6, fontSize:9 }}>— {state.worldState.location}</span>}
              <span style={{ marginLeft:'auto', fontSize:9, color:'#333' }}>{turnPins.length} event{turnPins.length!==1?'s':''}</span>
              <InfoBtn panelKey="map" activeInfo={activeInfo} setActiveInfo={setActiveInfo} />
            </div>
            <div style={{ height:'calc(100% - 28px)' }}>
              <MapContainer center={center} zoom={mapZoom} style={{ height:'100%', width:'100%' }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO'/>
                <MapUpdater center={center}/>
                {initPins.map(pin => (
                  <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={makeIcon(PIN_COLORS[pin.type]||PIN_COLORS.DEFAULT)}>
                    <Popup>
                      <div style={{ fontFamily:'monospace', fontSize:11 }}>
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
                      <div style={{ fontFamily:'monospace', fontSize:11 }}>
                        <strong>{pin.label}</strong><br/>
                        <span style={{ color:'#666' }}>Turn {pin.turn} — {pin.type}</span><br/>
                        {pin.note}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
