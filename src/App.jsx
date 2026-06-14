import { useState, useRef, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function makeIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#111" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
  </svg>`
  return L.divIcon({ html: svg, className: '', iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -36] })
}

const PIN_COLORS = { EOC:'#1D9E75', HOSPITAL:'#4A90D9', DAM:'#E24B4A', STAGING:'#EF9F27', SHELTER:'#9B59B6', AFFECTED:'#E24B4A', DEFAULT:'#888' }

const SCENARIO_PINS = {
  hurricane:  [
    { id:'eoc',      label:'Primary EOC',          type:'EOC',      lat:30.32,  lng:-89.09,  note:'EOC at full activation' },
    { id:'hosp1',    label:'Regional Medical Ctr',  type:'HOSPITAL', lat:30.34,  lng:-89.12,  note:'Receiving casualties' },
    { id:'staging',  label:'Staging Area Alpha',    type:'STAGING',  lat:30.28,  lng:-89.05,  note:'Pre-positioned resources' },
    { id:'shelter1', label:'Shelter Site 1',         type:'SHELTER',  lat:30.36,  lng:-89.15,  note:'Capacity: 500' },
    { id:'shelter2', label:'Shelter Site 2',         type:'SHELTER',  lat:30.30,  lng:-89.20,  note:'Capacity: 300' },
  ],
  mci: [
    { id:'eoc',      label:'Primary EOC',           type:'EOC',      lat:33.749, lng:-84.388, note:'EOC activating' },
    { id:'incident', label:'Incident Site',          type:'AFFECTED', lat:33.753, lng:-84.392, note:'Scene not yet secured' },
    { id:'hosp1',    label:'Trauma Center 1',        type:'HOSPITAL', lat:33.745, lng:-84.380, note:'At capacity' },
    { id:'hosp2',    label:'Trauma Center 2',        type:'HOSPITAL', lat:33.760, lng:-84.395, note:'Receiving overflow' },
    { id:'staging',  label:'Staging Area',           type:'STAGING',  lat:33.742, lng:-84.400, note:'Awaiting assignment' },
  ],
  hazmat: [
    { id:'eoc',      label:'Primary EOC',            type:'EOC',      lat:39.952, lng:-75.165, note:'EOC activating' },
    { id:'incident', label:'Derailment Site',         type:'AFFECTED', lat:39.960, lng:-75.170, note:'Active chlorine release' },
    { id:'hosp1',    label:'Regional Hospital',       type:'HOSPITAL', lat:39.945, lng:-75.155, note:'Decon setup underway' },
    { id:'staging',  label:'HazMat Staging',          type:'STAGING',  lat:39.955, lng:-75.180, note:'Upwind of release' },
    { id:'shelter1', label:'Shelter-in-Place Zone',   type:'SHELTER',  lat:39.965, lng:-75.160, note:'3-mile radius' },
  ],
  cyber: [
    { id:'eoc',      label:'Primary EOC',             type:'EOC',      lat:40.712, lng:-74.006, note:'EOC activating' },
    { id:'water',    label:'Water Treatment Plant',    type:'AFFECTED', lat:40.720, lng:-74.015, note:'SCADA offline' },
    { id:'power',    label:'Power Substation Alpha',   type:'AFFECTED', lat:40.705, lng:-74.000, note:'Ransomware confirmed' },
    { id:'hosp1',    label:'Regional Hospital',        type:'HOSPITAL', lat:40.716, lng:-73.995, note:'On backup generator' },
    { id:'staging',  label:'IT Response Staging',      type:'STAGING',  lat:40.708, lng:-74.010, note:'Vendor teams assembling' },
  ],
  earthquake: [
    { id:'eoc',       label:'Primary EOC',             type:'EOC',      lat:34.052, lng:-118.243, note:'EOC activating' },
    { id:'collapse1', label:'Collapse Site Alpha',      type:'AFFECTED', lat:34.058, lng:-118.250, note:'SAR requested' },
    { id:'collapse2', label:'Collapse Site Bravo',      type:'AFFECTED', lat:34.048, lng:-118.235, note:'Unknown casualties' },
    { id:'hosp1',     label:'Trauma Center',            type:'HOSPITAL', lat:34.045, lng:-118.255, note:'Surge protocols active' },
    { id:'staging',   label:'SAR Staging',              type:'STAGING',  lat:34.060, lng:-118.240, note:'Teams assembling' },
  ],
  flood: [
    { id:'eoc',   label:'Primary EOC',               type:'EOC',      lat:38.580, lng:-121.494, note:'EOC activating' },
    { id:'dam',   label:'Dam Site',                   type:'DAM',      lat:38.600, lng:-121.510, note:'Structural compromise confirmed' },
    { id:'comm1', label:'Downstream Community A',     type:'AFFECTED', lat:38.565, lng:-121.480, note:'In inundation zone' },
    { id:'comm2', label:'Downstream Community B',     type:'AFFECTED', lat:38.550, lng:-121.465, note:'Ignoring evac order' },
    { id:'hosp1', label:'Regional Hospital',          type:'HOSPITAL', lat:38.575, lng:-121.500, note:'Preparing for casualties' },
    { id:'staging',label:'Rescue Staging',            type:'STAGING',  lat:38.590, lng:-121.470, note:'Boat teams pre-positioned' },
  ],
}

const SCENARIO_CENTERS = {
  hurricane:  [30.32,  -89.09],
  mci:        [33.749, -84.388],
  hazmat:     [39.952, -75.165],
  cyber:      [40.712, -74.006],
  earthquake: [34.052, -118.243],
  flood:      [38.580, -121.494],
}

const SCENARIO_REFS = {
  hurricane: [
    { label: 'FEMA Hurricane Response Guidance',       url: 'https://www.fema.gov/emergency-managers/risk-management/hurricanes' },
    { label: 'NHC Hurricane Preparedness',             url: 'https://www.nhc.noaa.gov/prepare/' },
    { label: 'ESF-13 Public Safety & Security Annex',  url: 'https://www.fema.gov/sites/default/files/2020-07/fema_ESF_13_Public-Safety-Security.pdf' },
    { label: 'FEMA Mass Evacuation Incident Annex',    url: 'https://www.fema.gov/sites/default/files/2020-07/fema_Mass-Evacuation-Incident-Annex_0.pdf' },
    { label: 'Hurricane Harvey After-Action Report',   url: 'https://www.fema.gov/sites/default/files/2020-08/fema_hurricane-harvey_after-action-report_2018.pdf' },
  ],
  mci: [
    { label: 'FEMA MCI Management Guidelines',         url: 'https://www.fema.gov/emergency-managers/national-preparedness/frameworks/response' },
    { label: 'START Triage Reference',                 url: 'https://chemm.hhs.gov/startadult.htm' },
    { label: 'ESF-8 Public Health & Medical Annex',    url: 'https://www.fema.gov/sites/default/files/2020-07/fema_ESF_8_Public-Health-Medical.pdf' },
    { label: 'NIMS ICS Field Operations Guide',        url: 'https://www.fema.gov/sites/default/files/2020-07/fema_nims_ics-field-operations-guide.pdf' },
    { label: 'Boston Marathon Bombing AAR',            url: 'https://www.mass.gov/doc/after-action-report-for-the-response-to-the-2013-boston-marathon-bombings/download' },
  ],
  hazmat: [
    { label: 'EPA Emergency Response Guide',           url: 'https://www.epa.gov/emergency-response' },
    { label: 'DOT Emergency Response Guidebook 2024',  url: 'https://www.phmsa.dot.gov/hazmat/erg/emergency-response-guidebook-erg' },
    { label: 'LEPC Guidance Document',                 url: 'https://www.epa.gov/epcra/local-emergency-planning-committees' },
    { label: 'ESF-10 Oil & Hazardous Materials Annex', url: 'https://www.fema.gov/sites/default/files/2020-07/fema_ESF_10_Oil-Hazardous-Materials.pdf' },
    { label: 'East Palestine Derailment AAR',          url: 'https://www.ntsb.gov/investigations/Pages/DCA23MR005.aspx' },
  ],
  cyber: [
    { label: 'CISA Critical Infrastructure Guidance',  url: 'https://www.cisa.gov/topics/critical-infrastructure-security-and-resilience' },
    { label: 'FEMA Cyber Incident Annex',              url: 'https://www.fema.gov/sites/default/files/2020-07/fema_Cyber-Incident-Annex_0.pdf' },
    { label: 'WaterISAC Cyber Resources',              url: 'https://www.waterisac.org/' },
    { label: 'NERC CIP Standards Overview',            url: 'https://www.nerc.com/pa/Stand/Pages/CIPStandards.aspx' },
    { label: 'Colonial Pipeline Incident Review',      url: 'https://www.cisa.gov/news-events/news/attack-colonial-pipeline-what-weve-learned-what-weve-done' },
  ],
  earthquake: [
    { label: 'FEMA Earthquake Hazards Program',        url: 'https://www.fema.gov/emergency-managers/risk-management/earthquakes' },
    { label: 'USGS Earthquake Response Resources',     url: 'https://www.usgs.gov/programs/earthquake-hazards' },
    { label: 'FEMA Urban Search & Rescue',             url: 'https://www.fema.gov/emergency-managers/practitioners/urban-search-rescue' },
    { label: 'ATC Rapid Evaluation Safety Assessment', url: 'https://www.atcouncil.org/resources/atc-20' },
    { label: 'Northridge Earthquake AAR',              url: 'https://www.fema.gov/sites/default/files/2020-08/fema_northridge-earthquake_1994.pdf' },
  ],
  flood: [
    { label: 'FEMA Flood Response Guidance',           url: 'https://www.fema.gov/emergency-managers/risk-management/flood' },
    { label: 'NWS Flood Safety Resources',             url: 'https://www.weather.gov/safety/flood' },
    { label: 'USACE Dam Safety Program',               url: 'https://www.usace.army.mil/Missions/Civil-Works/Dam-Safety/' },
    { label: 'Oroville Dam Spillway Incident Review',  url: 'https://www.water.ca.gov/LegacyFiles/pubs/flood/oroville_spillway_independent_forensic_team_report/oroville_spillway_incident_independent_forensic_team_final_report_jan_2018.pdf' },
    { label: 'ESF-3 Public Works & Engineering Annex', url: 'https://www.fema.gov/sites/default/files/2020-07/fema_ESF_3_Public-Works-Engineering.pdf' },
  ],
}

const SCENARIOS = {
  hurricane:  { name:'Hurricane Landfall',          icon:'🌀', desc:'Cat 4/5 landfall on a coastal county. 72-hour warning window closing fast.' },
  mci:        { name:'Mass Casualty Incident',       icon:'🚨', desc:'Explosion at a crowded public event. 200+ casualties. Cause unknown.' },
  hazmat:     { name:'Hazardous Materials Release',  icon:'☣️', desc:'Railcar derailment with chlorine release. Urban corridor. Shelter-in-place decision imminent.' },
  cyber:      { name:'Cyber-Infrastructure Cascade', icon:'💻', desc:'Ransomware hits water and power utilities simultaneously. Public services degrading.' },
  earthquake: { name:'Major Earthquake',             icon:'🏚️', desc:'M7.1 strike-slip event. Urban core. Comms degraded. Damage picture unknown.' },
  flood:      { name:'Flash Flood / Dam Failure',    icon:'🌊', desc:'Upstream dam showing structural compromise. Downstream communities in inundation zone.' },
}

const JURISDICTIONS = ['Rural County','Mid-Size City','Large Urban Metro','Coastal Community','Tribal Nation','Interstate Corridor']
const DIFFICULTIES  = ['Basic','Moderate','Advanced','Brutal','Adaptive']

const LIFELINES = [
  { key:'safety',    label:'Safety & Security', icon:'🛡️' },
  { key:'food',      label:'Food Water Shelter', icon:'🍽️' },
  { key:'health',    label:'Health & Medical',   icon:'🏥' },
  { key:'energy',    label:'Energy',             icon:'⚡' },
  { key:'comms',     label:'Communications',     icon:'📡' },
  { key:'transport', label:'Transportation',     icon:'🚗' },
  { key:'hazmat',    label:'Hazardous Material', icon:'☣️' },
]

const DEFAULT_LIFELINES = {
  safety:    { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  food:      { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  health:    { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  energy:    { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  comms:     { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  transport: { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  hazmat:    { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
}

const LL_COLORS = {
  GREEN:  { bg:'#0a2a1a', border:'#1D9E75', text:'#1D9E75' },
  YELLOW: { bg:'#2a2000', border:'#EF9F27', text:'#EF9F27' },
  RED:    { bg:'#2a0a0a', border:'#E24B4A', text:'#E24B4A' },
}

const DISPATCH_SEEDS = {
  hurricane:  ['NWS upgraded storm to Cat 5. Landfall window tightening to 14 hours.','Hospital requesting guidance on patient evacuation prioritization.','State EOC requesting resource status update within 30 minutes.','Fuel supplies at staging area running low. Vendors not answering.','Mayor\'s office asking for press conference guidance.'],
  mci:        ['Trauma Center 1 reports capacity reached. Diverting incoming.','Scene security not established. Second explosion reported — unconfirmed.','FBI on scene. Requesting coordination with your EOC.','Media satellite trucks arriving at perimeter. JIC not activated.','Mutual aid request from neighboring county.'],
  hazmat:     ['Wind shift reported. Plume modeling needs update.','School district calling — three schools inside initial hazmat zone.','Rail company liaison refusing to ID contents without legal clearance.','LEPC coordinator asking about community shelter locations.','Two firefighters reporting exposure symptoms.'],
  cyber:      ['Water treatment SCADA offline. Manual operations possible but limited.','Hospital backup generators running. 72-hour fuel supply.','Public reporting water pressure loss on social media. Growing fast.','Utility CEO requesting EOC liaison — coming in person.','State fusion center reports similar attacks in two neighboring states.'],
  earthquake: ['Comms tower 4 is down. Switching to alternate freq.','Search and rescue teams requesting grid assignment.','Structural engineers not on scene. Tagging not started.','County road 7 bridge confirmed collapsed. Major evacuation route blocked.','Mutual aid request submitted to state. No ETA yet.'],
  flood:      ['Dam engineer recommending immediate downstream notification.','Two downstream communities ignoring evacuation order.','Emergency spillway activation requested — awaiting your authorization.','FEMA Region pre-positioned team requesting coordination call.','Local news helicopter flying over dam. Public anxiety rising.'],
}

function buildSystemPrompt(scenario, jurisdiction, difficulty) {
  const sc = SCENARIOS[scenario]
  const diffMap = {
    Basic:    'Evaluate actions generously. Surface one complication per turn.',
    Moderate: 'Evaluate with moderate rigor. Surface two complications per turn.',
    Advanced: 'Evaluate with professional rigor. Surface 2-3 complications per turn. Resource constraints are real.',
    Brutal:   'Evaluate ruthlessly. Every delayed or vague decision has cascading consequences.',
    Adaptive: 'Calibrate difficulty to the player\'s demonstrated competence. Never make it easy.',
  }
  return `You are the AI engine for an emergency management training simulator. The player is a senior emergency manager.

SCENARIO: ${sc.name}
JURISDICTION: ${jurisdiction}
DIFFICULTY: ${difficulty} — ${diffMap[difficulty]}
SETUP: ${sc.desc} Your EOC is activating.

RULES:
- Evaluate player actions with professional rigor. Never be encouraging. Be realistic.
- Describe consequences in 3-5 sentences.
- Surface complications, stakeholder pressures, secondary problems each turn.
- Advance incident clock realistically. State simulated time each turn.
- Generate 1-2 new field dispatch items after each consequence.
- Embed NIMS/ICS/ESF/FEMA doctrine in realism — don't lecture.
- Generate 3-4 realistic fictional news headlines that reflect the current incident state. Headlines should feel like real local/national news coverage. Include the simulated time.
- On ENDEX: deliver a thorough AAR covering: (1) COOP activation timing, (2) command element continuity, (3) alternate facility readiness, (4) IT/comms validation at alternate sites, (5) strengths, (6) gaps, (7) doctrine references, (8) recommendations.
- Never break character.

RESPOND ONLY IN THIS EXACT JSON FORMAT — no preamble, no markdown:
{
  "time": "simulated time",
  "consequence": "3-5 sentence consequence narrative",
  "situation": "STABLE | DEVELOPING | CRITICAL | DETERIORATING",
  "dispatches": ["dispatch item 1", "dispatch item 2"],
  "prompt": "one sentence prompt for next player action",
  "headlines": [
    { "source": "Local News Source", "text": "Headline text here", "time": "simulated time" },
    { "source": "National outlet", "text": "Headline text here", "time": "simulated time" }
  ],
  "lifelines": {
    "safety":    { "status": "GREEN | YELLOW | RED", "reason": "one sentence" },
    "food":      { "status": "GREEN | YELLOW | RED", "reason": "one sentence" },
    "health":    { "status": "GREEN | YELLOW | RED", "reason": "one sentence" },
    "energy":    { "status": "GREEN | YELLOW | RED", "reason": "one sentence" },
    "comms":     { "status": "GREEN | YELLOW | RED", "reason": "one sentence" },
    "transport": { "status": "GREEN | YELLOW | RED", "reason": "one sentence" },
    "hazmat":    { "status": "GREEN | YELLOW | RED", "reason": "one sentence" }
  }
}

On ENDEX use same format with full AAR in consequence field and empty headlines array.`
}

const SAVE_KEY = 'em_sim_v7'

const defaultState = {
  screen:'setup', scenario:null, jurisdiction:'Mid-Size City', difficulty:'Adaptive',
  history:[], dispatches:[], terminal:[], notepad:'', simTime:'H+0:00',
  situation:'DEVELOPING', turn:0, lifelines:DEFAULT_LIFELINES, headlines:[],
}

const sitColors = { STABLE:'#1D9E75', DEVELOPING:'#EF9F27', CRITICAL:'#D85A30', DETERIORATING:'#E24B4A', ENDEX:'#888' }

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
      <span style={{ fontSize:13 }}>{ll.icon}</span>
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

export default function App() {
  const [state, setState]           = useState(null)
  const [loading, setLoading]       = useState(false)
  const [input, setInput]           = useState('')
  const [cols, setCols]             = useState([14, 18, 48, 20])
  const [rightSplit, setRightSplit] = useState(45)
  const [newsSplit, setNewsSplit]   = useState(60)
  const dragging                    = useRef(null)
  const rightDragging               = useRef(null)
  const newsDragging                = useRef(null)
  const containerRef                = useRef(null)
  const rightColRef                 = useRef(null)
  const newsColRef                  = useRef(null)
  const termRef                     = useRef(null)
  const inputRef                    = useRef(null)

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
    if (state?.screen === 'game') setTimeout(() => inputRef.current?.focus(), 100)
  }, [state?.screen])

  // Horizontal col dividers
  function onDividerMouseDown(idx, e) {
    e.preventDefault()
    dragging.current = { idx, startX: e.clientX, startCols: [...cols] }
    window.addEventListener('mousemove', onColMove)
    window.addEventListener('mouseup', onColUp)
  }
  function onColMove(e) {
  if (!dragging.current || !containerRef.current) return
  const { idx, startX, startCols } = dragging.current
  const W = containerRef.current.offsetWidth
  const d = ((e.clientX - startX) / W) * 100
  const min = 8
  const total = startCols.reduce((a, b) => a + b, 0)
  const n = [...startCols]

  if (idx === 0) {
    const maxGrow = total - startCols[1] - startCols[2] - startCols[3] - min * 3
    n[0] = Math.max(min, Math.min(startCols[0] + d, maxGrow))
    n[1] = startCols[1]
    n[3] = startCols[3]
    n[2] = total - n[0] - n[1] - n[3]
  } else if (idx === 1) {
    const maxGrow = total - startCols[0] - startCols[2] - startCols[3] - min * 3
    n[1] = Math.max(min, Math.min(startCols[1] + d, maxGrow))
    n[0] = startCols[0]
    n[3] = startCols[3]
    n[2] = total - n[0] - n[1] - n[3]
  } else if (idx === 2) {
    const maxGrow = total - startCols[0] - startCols[1] - startCols[2] - min * 3
    n[3] = Math.max(min, Math.min(startCols[3] - d, maxGrow))
    n[0] = startCols[0]
    n[1] = startCols[1]
    n[2] = total - n[0] - n[1] - n[3]
  }

  if (n[2] >= min) setCols(n)
}
  function onColUp() {
    dragging.current = null
    window.removeEventListener('mousemove', onColMove)
    window.removeEventListener('mouseup', onColUp)
  }

  // Right col vertical divider (notepad/map)
  function onRightDividerMouseDown(e) {
    e.preventDefault()
    rightDragging.current = { startY: e.clientY, startSplit: rightSplit }
    window.addEventListener('mousemove', onRightMove)
    window.addEventListener('mouseup', onRightUp)
  }
  function onRightMove(e) {
    if (!rightDragging.current || !rightColRef.current) return
    const H = rightColRef.current.offsetHeight
    const d = ((e.clientY - rightDragging.current.startY) / H) * 100
    setRightSplit(Math.max(20, Math.min(80, rightDragging.current.startSplit + d)))
  }
  function onRightUp() {
    rightDragging.current = null
    window.removeEventListener('mousemove', onRightMove)
    window.removeEventListener('mouseup', onRightUp)
  }

  // News col vertical divider (headlines/refs)
  function onNewsDividerMouseDown(e) {
    e.preventDefault()
    newsDragging.current = { startY: e.clientY, startSplit: newsSplit }
    window.addEventListener('mousemove', onNewsMove)
    window.addEventListener('mouseup', onNewsUp)
  }
  function onNewsMove(e) {
    if (!newsDragging.current || !newsColRef.current) return
    const H = newsColRef.current.offsetHeight
    const d = ((e.clientY - newsDragging.current.startY) / H) * 100
    setNewsSplit(Math.max(20, Math.min(80, newsDragging.current.startSplit + d)))
  }
  function onNewsUp() {
    newsDragging.current = null
    window.removeEventListener('mousemove', onNewsMove)
    window.removeEventListener('mouseup', onNewsUp)
  }

  function startScenario(key) {
    const sc    = SCENARIOS[key]
    const seeds = DISPATCH_SEEDS[key]
    update({
      screen:'game', scenario:key,
      dispatches: seeds.map((text, i) => ({ id:i, text, turn:0 })),
      terminal: [
        { type:'header',   text:`▶ ${sc.name.toUpperCase()} — ${state.jurisdiction} — ${state.difficulty}` },
        { type:'system',   text:'Type your decisions as the EM on scene. Be specific. Type ENDEX for AAR.' },
        { type:'divider' },
        { type:'narrator', text: sc.desc + ' Your EOC is activating. What is your first action?' },
      ],
      history:[], turn:0, simTime:'H+0:00', situation:'DEVELOPING',
      notepad:'', lifelines:DEFAULT_LIFELINES, headlines:[],
    })
  }

  async function sendAction() {
    if (!input.trim() || loading || !state) return
    const action = input.trim()
    setInput('')
    setLoading(true)
    const newTerm = [...state.terminal, { type:'player', text:`> ${action}` }]
    update({ terminal: newTerm })
    const msgs = [...state.history, { role:'user', content:action }]
    try {
      const res  = await fetch('/api/chat', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ system: buildSystemPrompt(state.scenario, state.jurisdiction, state.difficulty), messages: msgs }),
      })
      const data = await res.json()
      const raw  = data.content?.[0]?.text || ''
      let parsed
      try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) }
      catch { parsed = { time:state.simTime, consequence:raw, situation:'DEVELOPING', dispatches:[], prompt:'What is your next action?', lifelines:state.lifelines, headlines:[] } }

      const nextTurn   = state.turn + 1
      const newHistory = [...msgs, { role:'assistant', content:JSON.stringify(parsed) }]
      const addedTerm  = [
        ...newTerm,
        { type:'time',        text:parsed.time },
        { type:'consequence', text:parsed.consequence },
        parsed.situation !== 'ENDEX' ? { type:'prompt', text:parsed.prompt } : null,
        { type:'divider' },
      ].filter(Boolean)
      const newDispatches = parsed.dispatches?.length
        ? [...parsed.dispatches.map((text, i) => ({ id:Date.now()+i, text, turn:nextTurn })), ...state.dispatches.slice(0,6)]
        : state.dispatches
      const newHeadlines = parsed.headlines?.length
        ? [...parsed.headlines.map((h, i) => ({ ...h, id:Date.now()+i, turn:nextTurn })), ...state.headlines.slice(0,12)]
        : state.headlines

      update({
        terminal:addedTerm, history:newHistory, dispatches:newDispatches,
        simTime:parsed.time||state.simTime, situation:parsed.situation||'DEVELOPING',
        turn:nextTurn, lifelines:parsed.lifelines||state.lifelines, headlines:newHeadlines,
      })
    } catch(e) {
      update({ terminal:[...newTerm, { type:'system', text:`[ERROR: ${e.message}]` }] })
    }
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAction() }
  }

  function reset() {
    try { localStorage.removeItem(SAVE_KEY) } catch {}
    setState(defaultState)
    setInput('')
  }

  if (!state) return <div style={{ color:'#888', padding:'2rem', fontFamily:'monospace' }}>Loading...</div>

  if (state.screen === 'setup') return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'2rem 1rem' }}>
      <h1 style={{ fontFamily:'JetBrains Mono', fontSize:16, fontWeight:500, color:'#1D9E75', marginBottom:'0.5rem', letterSpacing:'0.08em' }}>EM CRISIS SIMULATOR</h1>
      <p style={{ fontSize:12, color:'#555', marginBottom:'2rem', fontFamily:'monospace' }}>Emergency Management Training System — Select scenario to begin</p>
      <p style={{ fontSize:11, color:'#666', marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'0.08em' }}>Scenario</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginBottom:'1.5rem' }}>
        {Object.entries(SCENARIOS).map(([key, sc]) => (
          <button key={key} onClick={() => update({ scenario:key })}
            style={{ textAlign:'left', padding:'10px 12px', border:`0.5px solid ${state.scenario===key?'#1D9E75':'#222'}`, background:state.scenario===key?'#0a1f18':'transparent' }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{sc.icon}</div>
            <div style={{ fontSize:12, fontWeight:500, color:'#ddd', marginBottom:4 }}>{sc.name}</div>
            <div style={{ fontSize:10, color:'#555', lineHeight:1.5 }}>{sc.desc}</div>
          </button>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:'1.5rem' }}>
        <div>
          <p style={{ fontSize:11, color:'#666', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Jurisdiction</p>
          <select value={state.jurisdiction} onChange={e => update({ jurisdiction:e.target.value })} style={{ width:'100%' }}>
            {JURISDICTIONS.map(j => <option key={j}>{j}</option>)}
          </select>
        </div>
        <div>
          <p style={{ fontSize:11, color:'#666', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Difficulty</p>
          <select value={state.difficulty} onChange={e => update({ difficulty:e.target.value })} style={{ width:'100%' }}>
            {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <button onClick={() => state.scenario && startScenario(state.scenario)}
        style={{ width:'100%', padding:'10px', fontSize:13, fontWeight:500, border:`0.5px solid ${state.scenario?'#1D9E75':'#333'}`, color:state.scenario?'#1D9E75':'#555', cursor:state.scenario?'pointer':'not-allowed' }}>
        {state.scenario ? `LAUNCH — ${SCENARIOS[state.scenario].name} ↗` : 'Select a scenario to begin'}
      </button>
    </div>
  )

  const divSty = { width:12, cursor:'col-resize', background:'#1a1a1a', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', borderLeft:'0.5px solid #2a2a2a', borderRight:'0.5px solid #2a2a2a' }
  const divInner = { width:3, height:28, background:'#444', borderRadius:2, pointerEvents:'none' }
  const pins   = state.scenario ? SCENARIO_PINS[state.scenario]||[] : []
  const center = state.scenario ? SCENARIO_CENTERS[state.scenario] : [39.5,-98.35]
  const refs   = state.scenario ? SCENARIO_REFS[state.scenario]||[] : []

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'97vh', padding:'0.75rem', gap:8, fontFamily:'JetBrains Mono, monospace', fontSize:12 }}>

      {/* LIFELINE BAR */}
      <div style={{ display:'flex', gap:6, padding:'6px 10px', border:'0.5px solid #222', borderRadius:8, background:'#0d0d0d', alignItems:'center', flexShrink:0 }}>
        <span style={{ fontSize:9, color:'#444', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:500, marginRight:4, whiteSpace:'nowrap' }}>Community Lifelines</span>
        {LIFELINES.map(ll => <LifelineTile key={ll.key} ll={ll} data={state.lifelines?.[ll.key]} />)}
      </div>

      {/* FOUR PANEL ROW */}
      <div ref={containerRef} style={{ display:'flex', flex:1, gap:0, minHeight:0 }}>

        {/* NEWS COLUMN */}
        <div ref={newsColRef} style={{ width:`${cols[0]}%`, display:'flex', flexDirection:'column', flexShrink:0, minHeight:0, gap:0 }}>

          {/* HEADLINES */}
          <div style={{ height:`${newsSplit}%`, display:'flex', flexDirection:'column', border:'0.5px solid #222', borderRadius:8, overflow:'hidden', flexShrink:0 }}>
            <div style={{ padding:'6px 10px', borderBottom:'0.5px solid #222', background:'#111', fontSize:10, fontWeight:500, color:'#666', textTransform:'uppercase', letterSpacing:'0.08em' }}>
              Media Feed
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'6px 8px', display:'flex', flexDirection:'column', gap:6 }}>
              {state.headlines.length === 0 && (
                <div style={{ color:'#333', fontSize:10, padding:'8px', fontStyle:'italic' }}>Headlines will appear after your first action.</div>
              )}
              {state.headlines.map((h, i) => (
                <div key={h.id} style={{ padding:'6px 8px', borderRadius:6, border:`0.5px solid ${h.turn===state.turn?'#2a2a3a':'#1a1a1a'}`, background:h.turn===state.turn?'#16161f':'transparent', lineHeight:1.5 }}>
                  {h.turn===state.turn && <div style={{ fontSize:9, color:'#4A90D9', fontWeight:500, marginBottom:2 }}>LIVE</div>}
                  <div style={{ fontSize:10, color:h.turn===state.turn?'#ccc':'#444', marginBottom:2 }}>{h.text}</div>
                  <div style={{ fontSize:9, color:'#333' }}>{h.source} — {h.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* NEWS/REF DIVIDER */}
          <div onMouseDown={onNewsDividerMouseDown}
            style={{ height:12, cursor:'row-resize', background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center', borderTop:'0.5px solid #2a2a2a', borderBottom:'0.5px solid #2a2a2a', flexShrink:0 }}>
            <div style={{ width:28, height:3, background:'#444', borderRadius:2 }} />
          </div>

          {/* REFERENCES */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', border:'0.5px solid #222', borderRadius:8, overflow:'hidden', minHeight:0 }}>
            <div style={{ padding:'6px 10px', borderBottom:'0.5px solid #222', background:'#111', fontSize:10, fontWeight:500, color:'#666', textTransform:'uppercase', letterSpacing:'0.08em' }}>
              Reference Links
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'6px 8px', display:'flex', flexDirection:'column', gap:4 }}>
              {refs.map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                  style={{ display:'block', padding:'6px 8px', borderRadius:6, border:'0.5px solid #1a1a1a', background:'transparent', fontSize:10, color:'#4A90D9', lineHeight:1.5, textDecoration:'none', wordBreak:'break-word' }}
                  onMouseEnter={e => e.currentTarget.style.background='#0a0a1a'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  {r.label} ↗
                </a>
              ))}
              {refs.length === 0 && <div style={{ color:'#333', fontSize:10, padding:'8px', fontStyle:'italic' }}>Launch a scenario to see references.</div>}
            </div>
          </div>
        </div>

        {/* DIVIDER 0 */}
        <div style={divSty} onMouseDown={e => onDividerMouseDown(0, e)}><div style={divInner}/></div>

        {/* DISPATCH */}
        <div style={{ width:`${cols[1]}%`, display:'flex', flexDirection:'column', border:'0.5px solid #222', borderRadius:8, overflow:'hidden', flexShrink:0 }}>
          <div style={{ padding:'6px 10px', borderBottom:'0.5px solid #222', background:'#111', fontSize:10, fontWeight:500, color:'#666', textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', justifyContent:'space-between' }}>
            <span>Field Dispatch</span>
            <span style={{ background:'#E24B4A', color:'#fff', borderRadius:3, padding:'1px 5px', fontSize:9 }}>{state.dispatches.length}</span>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'6px 8px', display:'flex', flexDirection:'column', gap:6 }}>
            {state.dispatches.map(d => {
              const isNew = d.turn === state.turn
              return (
                <div key={d.id} style={{ padding:'6px 8px', borderRadius:6, border:`0.5px solid ${isNew?'#2a3a2a':'#222'}`, background:isNew?'#1a2a1a':'transparent', fontSize:11, color:isNew?'#ddd':'#555', lineHeight:1.5 }}>
                  {isNew && <div style={{ fontSize:9, color:'#1D9E75', fontWeight:500, marginBottom:2 }}>NEW — {state.simTime}</div>}
                  {d.text}
                </div>
              )
            })}
          </div>
        </div>

        {/* DIVIDER 1 */}
        <div style={divSty} onMouseDown={e => onDividerMouseDown(1, e)}><div style={divInner}/></div>

        {/* TERMINAL */}
        <div style={{ width:`${cols[2]}%`, display:'flex', flexDirection:'column', border:'0.5px solid #222', borderRadius:8, overflow:'hidden', flexShrink:0 }}>
          <div style={{ padding:'6px 10px', borderBottom:'0.5px solid #222', background:'#111', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:10, fontWeight:500, color:'#666', textTransform:'uppercase', letterSpacing:'0.08em' }}>{SCENARIOS[state.scenario]?.name} — {state.jurisdiction}</span>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ fontSize:10, color:'#444' }}>{state.simTime}</span>
              <span style={{ fontSize:9, padding:'2px 6px', borderRadius:3, fontWeight:500, background:(sitColors[state.situation]||'#888')+'22', color:sitColors[state.situation]||'#888' }}>{state.situation}</span>
              <button onClick={reset} style={{ fontSize:10, padding:'2px 8px', color:'#555' }}>New</button>
            </div>
          </div>
          <div ref={termRef} style={{ flex:1, overflowY:'auto', padding:'10px 14px', lineHeight:1.8 }}>
            {state.terminal.map((line, i) => {
              if (!line) return null
              if (line.type==='divider') return <hr key={i} style={{ border:'none', borderTop:'0.5px solid #1a1a1a', margin:'8px 0' }}/>
              const s = {
                header:      { color:'#aaa', fontWeight:500, marginBottom:4 },
                system:      { color:'#333', fontSize:10, marginBottom:6 },
                narrator:    { color:'#ccc', marginBottom:6 },
                player:      { color:'#1D9E75', marginBottom:4, fontWeight:500 },
                consequence: { color:'#777', marginBottom:6, borderLeft:'2px solid #2a2a2a', paddingLeft:10 },
                time:        { color:'#EF9F27', fontSize:10, marginBottom:2, fontWeight:500 },
                prompt:      { color:'#EF9F27', fontStyle:'italic', marginBottom:4 },
              }
              return <div key={i} style={s[line.type]||{}}>{line.text}</div>
            })}
            {loading && <div style={{ color:'#333', fontStyle:'italic' }}>Evaluating action...</div>}
          </div>
          <div style={{ borderTop:'0.5px solid #222', padding:'8px 10px', display:'flex', gap:6 }}>
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Your action..." rows={2}
              style={{ flex:1, resize:'none', lineHeight:1.6 }}/>
            <button onClick={sendAction} disabled={loading||!input.trim()}
              style={{ padding:'6px 14px', fontWeight:500, alignSelf:'stretch', color:'#1D9E75', borderColor:'#1D9E75' }}>
              Execute
            </button>
          </div>
        </div>

        {/* DIVIDER 2 */}
        <div style={divSty} onMouseDown={e => onDividerMouseDown(2, e)}><div style={divInner}/></div>

        {/* RIGHT COLUMN: NOTEPAD + MAP */}
        <div ref={rightColRef} style={{ width:`${cols[3]}%`, display:'flex', flexDirection:'column', flexShrink:0, minHeight:0 }}>
          <div style={{ height:`${rightSplit}%`, display:'flex', flexDirection:'column', border:'0.5px solid #222', borderRadius:8, overflow:'hidden', flexShrink:0 }}>
            <div style={{ padding:'6px 10px', borderBottom:'0.5px solid #222', background:'#111', fontSize:10, fontWeight:500, color:'#666', textTransform:'uppercase', letterSpacing:'0.08em' }}>
              Commander's Notepad
            </div>
            <textarea value={state.notepad} onChange={e => update({ notepad:e.target.value })}
              placeholder={'Priorities, resource gaps...\n\nPersists across sessions.'}
              style={{ flex:1, resize:'none', border:'none', padding:'8px 10px', background:'transparent', color:'#888', lineHeight:1.7, outline:'none' }}/>
            <div style={{ padding:'4px 10px', borderTop:'0.5px solid #1a1a1a', fontSize:10, color:'#333' }}>
              Turn {state.turn} — {state.difficulty}
            </div>
          </div>
          <div onMouseDown={onRightDividerMouseDown}
            style={{ height:12, cursor:'row-resize', background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center', borderTop:'0.5px solid #2a2a2a', borderBottom:'0.5px solid #2a2a2a', flexShrink:0 }}>
            <div style={{ width:28, height:3, background:'#444', borderRadius:2 }}/>
          </div>
          <div style={{ flex:1, border:'0.5px solid #222', borderRadius:8, overflow:'hidden', minHeight:0 }}>
            <div style={{ padding:'6px 10px', borderBottom:'0.5px solid #222', background:'#111', fontSize:10, fontWeight:500, color:'#666', textTransform:'uppercase', letterSpacing:'0.08em' }}>
              Incident Map
            </div>
            <div style={{ height:'calc(100% - 28px)' }}>
              <MapContainer center={center} zoom={13} style={{ height:'100%', width:'100%' }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO'/>
                <MapUpdater center={center}/>
                {pins.map(pin => (
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
              </MapContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}