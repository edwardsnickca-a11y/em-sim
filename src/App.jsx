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
    { id:'eoc',    label:'Primary EOC',               type:'EOC',      lat:38.580, lng:-121.494, note:'EOC activating' },
    { id:'dam',    label:'Dam Site',                   type:'DAM',      lat:38.600, lng:-121.510, note:'Structural compromise confirmed' },
    { id:'comm1',  label:'Downstream Community A',     type:'AFFECTED', lat:38.565, lng:-121.480, note:'In inundation zone' },
    { id:'comm2',  label:'Downstream Community B',     type:'AFFECTED', lat:38.550, lng:-121.465, note:'Ignoring evac order' },
    { id:'hosp1',  label:'Regional Hospital',          type:'HOSPITAL', lat:38.575, lng:-121.500, note:'Preparing for casualties' },
    { id:'staging',label:'Rescue Staging',             type:'STAGING',  lat:38.590, lng:-121.470, note:'Boat teams pre-positioned' },
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
    { label:'FEMA Hurricane Response',               url:'https://www.fema.gov/emergency-managers/risk-management/hurricanes' },
    { label:'NHC Hurricane Preparedness',            url:'https://www.nhc.noaa.gov/prepare/' },
    { label:'ESF-13 Public Safety Annex',            url:'https://www.fema.gov/sites/default/files/2020-07/fema_ESF_13_Public-Safety-Security.pdf' },
    { label:'FEMA Mass Evacuation Annex',            url:'https://www.fema.gov/sites/default/files/2020-07/fema_Mass-Evacuation-Incident-Annex_0.pdf' },
    { label:'Hurricane Harvey AAR 2018',             url:'https://www.fema.gov/sites/default/files/2020-08/fema_hurricane-harvey_after-action-report_2018.pdf' },
  ],
  mci: [
    { label:'FEMA National Response Framework',      url:'https://www.fema.gov/emergency-managers/national-preparedness/frameworks/response' },
    { label:'CHEMM START Triage Reference',          url:'https://chemm.hhs.gov/startadult.htm' },
    { label:'ESF-8 Public Health & Medical Annex',   url:'https://www.fema.gov/sites/default/files/2020-07/fema_ESF_8_Public-Health-Medical.pdf' },
    { label:'NIMS ICS Field Operations Guide',       url:'https://www.fema.gov/sites/default/files/2020-07/fema_nims_ics-field-operations-guide.pdf' },
    { label:'Boston Marathon Bombing AAR',           url:'https://www.mass.gov/doc/after-action-report-for-the-response-to-the-2013-boston-marathon-bombings/download' },
  ],
  hazmat: [
    { label:'EPA Emergency Response',                url:'https://www.epa.gov/emergency-response' },
    { label:'DOT Emergency Response Guidebook',      url:'https://www.phmsa.dot.gov/hazmat/erg/emergency-response-guidebook-erg' },
    { label:'LEPC Guidance — EPA',                   url:'https://www.epa.gov/epcra/local-emergency-planning-committees' },
    { label:'ESF-10 Oil & Hazardous Materials',      url:'https://www.fema.gov/sites/default/files/2020-07/fema_ESF_10_Oil-Hazardous-Materials.pdf' },
    { label:'NTSB East Palestine Investigation',     url:'https://www.ntsb.gov/investigations/Pages/DCA23MR005.aspx' },
  ],
  cyber: [
    { label:'CISA Critical Infrastructure',         url:'https://www.cisa.gov/topics/critical-infrastructure-security-and-resilience' },
    { label:'FEMA Cyber Incident Annex',             url:'https://www.fema.gov/sites/default/files/2020-07/fema_Cyber-Incident-Annex_0.pdf' },
    { label:'WaterISAC Resources',                   url:'https://www.waterisac.org/' },
    { label:'NERC CIP Standards',                    url:'https://www.nerc.com/pa/Stand/Pages/CIPStandards.aspx' },
    { label:'CISA Colonial Pipeline Review',         url:'https://www.cisa.gov/news-events/news/attack-colonial-pipeline-what-weve-learned-what-weve-done' },
  ],
  earthquake: [
    { label:'FEMA Earthquake Hazards',               url:'https://www.fema.gov/emergency-managers/risk-management/earthquakes' },
    { label:'USGS Earthquake Hazards Program',       url:'https://www.usgs.gov/programs/earthquake-hazards' },
    { label:'FEMA Urban Search & Rescue',            url:'https://www.fema.gov/emergency-managers/practitioners/urban-search-rescue' },
    { label:'ATC-20 Rapid Safety Assessment',        url:'https://www.atcouncil.org/resources/atc-20' },
    { label:'FEMA Northridge Earthquake Report',     url:'https://www.fema.gov/sites/default/files/2020-08/fema_northridge-earthquake_1994.pdf' },
  ],
  flood: [
    { label:'FEMA Flood Response Guidance',          url:'https://www.fema.gov/emergency-managers/risk-management/flood' },
    { label:'NWS Flood Safety',                      url:'https://www.weather.gov/safety/flood' },
    { label:'USACE Dam Safety Program',              url:'https://www.usace.army.mil/Missions/Civil-Works/Dam-Safety/' },
    { label:'Oroville Dam Incident Review',          url:'https://www.water.ca.gov/LegacyFiles/pubs/flood/oroville_spillway_independent_forensic_team_report/oroville_spillway_incident_independent_forensic_team_final_report_jan_2018.pdf' },
    { label:'ESF-3 Public Works & Engineering',      url:'https://www.fema.gov/sites/default/files/2020-07/fema_ESF_3_Public-Works-Engineering.pdf' },
  ],
}

const ESFS = [
  { num:1,  name:'Transportation',                   lead:'DOT',     desc:'Aviation, maritime, surface transport coordination.' },
  { num:2,  name:'Communications',                   lead:'DHS/CISA',desc:'Restore and sustain communications infrastructure.' },
  { num:3,  name:'Public Works & Engineering',       lead:'USACE',   desc:'Infrastructure protection, emergency repair, debris clearance.' },
  { num:4,  name:'Firefighting',                     lead:'USDA/FS', desc:'Wildland and structural firefighting support.' },
  { num:5,  name:'Information & Planning',           lead:'FEMA',    desc:'Collect, analyze, and disseminate incident information.' },
  { num:6,  name:'Mass Care',                        lead:'FEMA',    desc:'Sheltering, feeding, emergency assistance, reunification.' },
  { num:7,  name:'Logistics',                        lead:'FEMA/GSA',desc:'Resource and supply chain management.' },
  { num:8,  name:'Public Health & Medical',          lead:'HHS',     desc:'Medical surge, public health, behavioral health.' },
  { num:9,  name:'Search & Rescue',                  lead:'FEMA',    desc:'Life-saving assistance, urban and swift-water SAR.' },
  { num:10, name:'Oil & Hazardous Materials',        lead:'EPA/USCG',desc:'Environmental response, hazmat containment and cleanup.' },
  { num:11, name:'Agriculture & Natural Resources',  lead:'USDA',    desc:'Food safety, agriculture, natural and cultural resources.' },
  { num:12, name:'Energy',                           lead:'DOE',     desc:'Restore energy systems: electric power, natural gas, petroleum.' },
  { num:13, name:'Public Safety & Security',         lead:'DOJ',     desc:'Law enforcement, facility security, security planning.' },
  { num:14, name:'Cross-Sector Business & Infrastructure', lead:'DHS',desc:'Private sector coordination and infrastructure restoration.' },
  { num:15, name:'External Affairs',                 lead:'FEMA',    desc:'Public information, intergovernmental, community affairs.' },
]

const PANEL_INFO = {
  lifelines: {
    title: 'Community Lifelines',
    body: 'The 8 FEMA Community Lifelines represent the most fundamental services a community needs to function. Each lifeline is color-coded: GREEN means fully operational, YELLOW means degraded, RED means compromised or non-functional. Status updates every turn based on your decisions and incident conditions. Click any lifeline tile to see the AI\'s one-sentence reasoning for its current status.'
  },
  media: {
    title: 'Media Feed',
    body: 'AI-generated fictional news headlines that reflect the current state of the incident each turn. LIVE badges mark headlines from the current turn. Older headlines fade to gray as the scenario progresses. These reflect what the public and media are seeing — factor them into your public information and JIC decisions.'
  },
  refs: {
    title: 'Reference Links',
    body: 'Curated real-world doctrine, guidance documents, and after-action reports relevant to the active scenario type. Links open in a new tab. Use these during or after play to cross-reference your decisions against actual federal guidance and historical incident reviews.'
  },
  esf: {
    title: 'ESF Reference',
    body: 'All 15 Emergency Support Functions from the National Response Framework. Each entry shows the ESF number, name, lead federal agency, and a one-line description. Use this as a memory jogger during play — which ESFs are relevant to your current incident, and who owns them? You\'re still responsible for knowing the doctrine.'
  },
  dispatch: {
    title: 'Field Dispatch',
    body: 'Incoming field reports from the incident. NEW cards highlighted in green are from the current turn — they reflect consequences of your last action and new developments. Older cards fade to gray but remain visible as a running log. The red badge shows total dispatch count. Some dispatches will generate map pins when they have a physical location.'
  },
  terminal: {
    title: 'Scenario Terminal',
    body: 'The main command interface. Type your decisions as the senior EM on scene — be specific about resources, priorities, communications, and who owns what. The AI evaluates your action and advances the incident clock. Type ENDEX at any time to end the scenario and receive a full After-Action Review. The situation status indicator in the header reflects overall incident trajectory.'
  },
  notepad: {
    title: "Commander's Notepad",
    body: 'A free-text scratch pad for tracking priorities, resource gaps, pending decisions, or anything else you need to remember. Content persists across turns and browser sessions — it will be here when you come back. Nothing you write here affects the simulation.'
  },
  map: {
    title: 'Incident Map',
    body: 'A live operational map of the incident area. Colored pins mark fixed infrastructure: green for EOC, blue for hospitals, orange for staging areas, purple for shelters, red for affected sites. White-bordered pins with turn numbers (T1, T2, etc.) are dynamic event pins dropped by the AI when dispatch events have a physical location. Click any pin for details. The map accumulates event pins across all turns.'
  },
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
  { key:'safety',    label:'Safety & Security',        icon:'/icons/safety.png' },
  { key:'food',      label:'Food, Hydration, Shelter',  icon:'/icons/food.png' },
  { key:'health',    label:'Health & Medical',          icon:'/icons/health.png' },
  { key:'energy',    label:'Energy',                    icon:'/icons/energy.png' },
  { key:'comms',     label:'Communications',            icon:'/icons/comms.png' },
  { key:'transport', label:'Transportation',            icon:'/icons/transport.png' },
  { key:'hazmat',    label:'Hazardous Material',        icon:'/icons/hazmat.png' },
  { key:'water',     label:'Water Systems',             icon:'/icons/water.png' },
]

const DEFAULT_LIFELINES = {
  safety:    { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  food:      { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  health:    { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  energy:    { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  comms:     { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  transport: { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  hazmat:    { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  water:     { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
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

const DEFAULT_SETTINGS = { fontSize:11, accentColor:'#1D9E75', alertColor:'#EF9F27' }
const SETTINGS_KEY = 'em_sim_settings'

function buildSystemPrompt(scenario, jurisdiction, difficulty) {
  const sc = SCENARIOS[scenario]
  const center = SCENARIO_CENTERS[scenario]
  const diffMap = {
    Basic:    'Evaluate actions generously. Surface one complication per turn.',
    Moderate: 'Evaluate with moderate rigor. Surface two complications per turn.',
    Advanced: 'Evaluate with professional rigor. Surface 2-3 complications per turn. Resource constraints are real.',
    Brutal:   'Evaluate ruthlessly. Every delayed or vague decision has cascading consequences.',
    Adaptive: 'Calibrate difficulty to demonstrated competence. Never make it easy.',
  }
  return `You are the AI engine for an emergency management training simulator. The player is a senior emergency manager.

SCENARIO: ${sc.name}
JURISDICTION: ${jurisdiction}
DIFFICULTY: ${difficulty} — ${diffMap[difficulty]}
SETUP: ${sc.desc} Your EOC is activating.
MAP CENTER: lat ${center[0]}, lng ${center[1]} — all coordinates must be geographically plausible within ~10 miles of this point.

RULES:
- Evaluate player actions with professional rigor. Never be encouraging. Be realistic.
- Describe consequences in 3-5 sentences.
- Surface complications, stakeholder pressures, secondary problems each turn.
- Advance incident clock realistically. State simulated time each turn.
- Generate 1-2 new field dispatch items after each consequence.
- Embed NIMS/ICS/ESF/FEMA doctrine in realism — don't lecture.
- Generate 3-4 realistic fictional news headlines reflecting current incident state.
- When a dispatch event has a specific physical location, include it as a map pin. Generate 0-2 pins per turn.
- On ENDEX: thorough AAR covering: (1) command element continuity and whether it was maintained, (2) continuity decisions made or that should have been made, (3) resource and coordination effectiveness, (4) communications and information management, (5) strengths, (6) critical gaps, (7) relevant doctrine references, (8) specific recommendations.
- Never break character.

RESPOND ONLY IN THIS EXACT JSON FORMAT — no preamble, no markdown:
{
  "time": "simulated time",
  "consequence": "3-5 sentence consequence narrative",
  "situation": "STABLE | DEVELOPING | CRITICAL | DETERIORATING",
  "dispatches": ["dispatch item 1", "dispatch item 2"],
  "prompt": "one sentence prompt for next player action",
  "headlines": [
    { "source": "News outlet name", "text": "Headline text", "time": "simulated time" }
  ],
  "pins": [
    { "label": "Location name", "type": "AFFECTED | STAGING | SHELTER | HOSPITAL | EOC | BLOCKED | OTHER", "lat": 0.000, "lng": 0.000, "note": "one sentence status note" }
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

On ENDEX use same format with full AAR in consequence field, empty headlines and pins arrays.`
}

const SAVE_KEY = 'em_sim_v11'

const defaultState = {
  screen:'setup', scenario:null, jurisdiction:'Mid-Size City', difficulty:'Adaptive',
  history:[], dispatches:[], terminal:[], notepad:'', simTime:'H+0:00',
  situation:'DEVELOPING', turn:0, lifelines:DEFAULT_LIFELINES, headlines:[], dynamicPins:[],
}

const sitColors = { STABLE:'#1D9E75', DEVELOPING:'#EF9F27', CRITICAL:'#D85A30', DETERIORATING:'#E24B4A', ENDEX:'#888' }

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

// Info callout component
function InfoCallout({ panelKey, anchorRef, onClose }) {
  const info = PANEL_INFO[panelKey]
  const [pos, setPos] = useState({ top:0, left:0 })
  useEffect(() => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, left: Math.min(rect.left, window.innerWidth - 320) })
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

// Info button — small ⓘ next to panel header label
function InfoBtn({ panelKey, activeInfo, setActiveInfo }) {
  const btnRef = useRef(null)
  const isActive = activeInfo === panelKey
  return (
    <>
      <button
        ref={btnRef}
        data-info-btn="true"
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

export default function App() {
  const [state, setState]           = useState(null)
  const [loading, setLoading]       = useState(false)
  const [input, setInput]           = useState('')
  const [boundaries, setBoundaries] = useState([14, 32, 80])
  const [leftBounds, setLeftBounds] = useState([40, 70])
  const [rightSplit, setRightSplit] = useState(45)
  const [showSettings, setShowSettings] = useState(false)
  const [activeInfo, setActiveInfo] = useState(null)
  const [settings, setSettings]     = useState(() => {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}') } }
    catch { return DEFAULT_SETTINGS }
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

  function startScenario(key) {
    const sc = SCENARIOS[key], seeds = DISPATCH_SEEDS[key]
    update({
      screen:'game', scenario:key,
      dispatches: seeds.map((text, i) => ({ id:i, text, turn:0 })),
      terminal: [
        { type:'header',   text:`▶ ${sc.name.toUpperCase()} — ${state.jurisdiction} — ${state.difficulty}` },
        { type:'system',   text:'Type your decisions as the EM on scene. Be specific. Type ENDEX for AAR.' },
        { type:'divider' },
        { type:'narrator', text:sc.desc + ' Your EOC is activating. What is your first action?' },
      ],
      history:[], turn:0, simTime:'H+0:00', situation:'DEVELOPING',
      notepad:'', lifelines:DEFAULT_LIFELINES, headlines:[], dynamicPins:[],
    })
  }

  async function sendAction() {
    if (!input.trim() || loading || !state) return
    const action = input.trim()
    setInput(''); setLoading(true)
    const newTerm = [...state.terminal, { type:'player', text:`> ${action}` }]
    update({ terminal:newTerm })
    const msgs = [...state.history, { role:'user', content:action }]
    try {
      const res  = await fetch('/api/chat', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ system:buildSystemPrompt(state.scenario, state.jurisdiction, state.difficulty), messages:msgs }),
      })
      const data = await res.json()
      const raw  = data.content?.[0]?.text || ''
      let parsed
      try { parsed = JSON.parse(raw.replace(/```json|```/g,'').trim()) }
      catch { parsed = { time:state.simTime, consequence:raw, situation:'DEVELOPING', dispatches:[], prompt:'What is your next action?', lifelines:state.lifelines, headlines:[], pins:[] } }

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
        ? [...parsed.dispatches.map((text,i) => ({ id:Date.now()+i, text, turn:nextTurn })), ...state.dispatches.slice(0,6)]
        : state.dispatches
      const newHeadlines = parsed.headlines?.length
        ? [...parsed.headlines.map((h,i) => ({ ...h, id:Date.now()+i, turn:nextTurn })), ...state.headlines.slice(0,12)]
        : state.headlines
      const newDynamicPins = parsed.pins?.length
        ? [...(state.dynamicPins||[]), ...parsed.pins.map((p,i) => ({ ...p, id:`dyn-${Date.now()}-${i}`, turn:nextTurn }))]
        : (state.dynamicPins||[])

      update({
        terminal:addedTerm, history:newHistory, dispatches:newDispatches,
        simTime:parsed.time||state.simTime, situation:parsed.situation||'DEVELOPING',
        turn:nextTurn, lifelines:parsed.lifelines||state.lifelines,
        headlines:newHeadlines, dynamicPins:newDynamicPins,
      })
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
    setState(defaultState); setInput('')
  }

  if (!state) return <div style={{ color:'#888', padding:'2rem', fontFamily:'monospace' }}>Loading...</div>

  if (state.screen === 'setup') return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'2rem 1rem', fontFamily:'JetBrains Mono, monospace' }}>
      <h1 style={{ fontSize:16, fontWeight:500, color:ac, marginBottom:'0.5rem', letterSpacing:'0.08em' }}>EM CRISIS SIMULATOR</h1>
      <p style={{ fontSize:12, color:'#555', marginBottom:'2rem' }}>Emergency Management Training System — Select scenario to begin</p>
      <p style={{ fontSize:11, color:'#666', marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'0.08em' }}>Scenario</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginBottom:'1.5rem' }}>
        {Object.entries(SCENARIOS).map(([key, sc]) => (
          <button key={key} onClick={() => update({ scenario:key })}
            style={{ textAlign:'left', padding:'10px 12px', border:`0.5px solid ${state.scenario===key?ac:'#222'}`, background:state.scenario===key?'#0a1f18':'transparent' }}>
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
        style={{ width:'100%', padding:'10px', fontSize:13, fontWeight:500, border:`0.5px solid ${state.scenario?ac:'#333'}`, color:state.scenario?ac:'#555', cursor:state.scenario?'pointer':'not-allowed' }}>
        {state.scenario ? `LAUNCH — ${SCENARIOS[state.scenario].name} ↗` : 'Select a scenario to begin'}
      </button>
    </div>
  )

  const divSty    = { width:10, cursor:'col-resize', background:'#161616', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', borderLeft:'0.5px solid #2a2a2a', borderRight:'0.5px solid #2a2a2a' }
  const divInner  = { width:3, height:28, background:'#3a3a3a', borderRadius:2, pointerEvents:'none' }
  const hDivSty   = { height:10, cursor:'row-resize', background:'#161616', display:'flex', alignItems:'center', justifyContent:'center', borderTop:'0.5px solid #2a2a2a', borderBottom:'0.5px solid #2a2a2a', flexShrink:0 }
  const hDivInner = { width:28, height:3, background:'#3a3a3a', borderRadius:2 }

  const panelHdr = (label, infoKey) => (
    <div style={{ padding:'6px 10px', borderBottom:'0.5px solid #222', background:'#111', fontSize:10, fontWeight:500, color:'#666', textTransform:'uppercase', letterSpacing:'0.08em', flexShrink:0, display:'flex', alignItems:'center' }}>
      {label}
      {infoKey && <InfoBtn panelKey={infoKey} activeInfo={activeInfo} setActiveInfo={setActiveInfo} />}
    </div>
  )

  const staticPins  = state.scenario ? SCENARIO_PINS[state.scenario]||[] : []
  const dynamicPins = state.dynamicPins || []
  const center      = state.scenario ? SCENARIO_CENTERS[state.scenario] : [39.5,-98.35]
  const refs        = state.scenario ? SCENARIO_REFS[state.scenario]||[] : []

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
              {ESFS.map(esf => (
                <div key={esf.num} style={{ padding:'5px 8px', borderRadius:5, border:'0.5px solid #1a1a1a', lineHeight:1.4 }}>
                  <div style={{ display:'flex', gap:6, alignItems:'baseline', marginBottom:2 }}>
                    <span style={{ fontSize:9, color:al, fontWeight:500, whiteSpace:'nowrap' }}>ESF-{esf.num}</span>
                    <span style={{ fontSize:fs-1, color:'#aaa', fontWeight:500 }}>{esf.name}</span>
                  </div>
                  <div style={{ fontSize:9, color:'#444' }}>Lead: {esf.lead}</div>
                  <div style={{ fontSize:9, color:'#333', marginTop:1 }}>{esf.desc}</div>
                </div>
              ))}
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

        {/* TERMINAL */}
        <div style={{ width:`${colW[2]}%`, display:'flex', flexDirection:'column', border:'0.5px solid #222', borderRadius:8, overflow:'hidden', flexShrink:0 }}>
          <div style={{ padding:'6px 10px', borderBottom:'0.5px solid #222', background:'#111', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:10, fontWeight:500, color:'#666', textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', alignItems:'center' }}>
              {SCENARIOS[state.scenario]?.name} — {state.jurisdiction}
              <InfoBtn panelKey="terminal" activeInfo={activeInfo} setActiveInfo={setActiveInfo} />
            </span>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ fontSize:10, color:'#444' }}>{state.simTime}</span>
              <span style={{ fontSize:9, padding:'2px 6px', borderRadius:3, fontWeight:500, background:(sitColors[state.situation]||'#888')+'22', color:sitColors[state.situation]||'#888' }}>{state.situation}</span>
              <button onClick={reset} style={{ fontSize:10, padding:'2px 8px', color:'#555' }}>New</button>
            </div>
          </div>
          <div ref={termRef} style={{ flex:1, overflowY:'auto', padding:'10px 14px', lineHeight:1.8 }}>
            {state.terminal.map((line,i) => {
              if (!line) return null
              if (line.type==='divider') return <hr key={i} style={{ border:'none', borderTop:'0.5px solid #1a1a1a', margin:'8px 0' }}/>
              return <div key={i} style={termStyles[line.type]||{ fontSize:fs }}>{line.text}</div>
            })}
            {loading && <div style={{ color:'#333', fontStyle:'italic', fontSize:fs }}>Evaluating action...</div>}
          </div>
          <div style={{ borderTop:'0.5px solid #222', padding:'8px 10px', display:'flex', gap:6 }}>
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Your action..." rows={2} style={{ flex:1, resize:'none', lineHeight:1.6, fontSize:fs }}/>
            <button onClick={sendAction} disabled={loading||!input.trim()}
              style={{ padding:'6px 14px', fontWeight:500, alignSelf:'stretch', color:ac, borderColor:ac }}>
              Execute
            </button>
          </div>
        </div>

        <div style={divSty} onMouseDown={e => onColDown(2,e)}><div style={divInner}/></div>

        {/* RIGHT COLUMN */}
        <div ref={rightColRef} style={{ width:`${colW[3]}%`, display:'flex', flexDirection:'column', flexShrink:0, minHeight:0 }}>
          <div style={{ height:`${rightSplit}%`, display:'flex', flexDirection:'column', border:'0.5px solid #222', borderRadius:8, overflow:'hidden', flexShrink:0 }}>
            {panelHdr("Commander's Notepad", 'notepad')}
            <textarea value={state.notepad} onChange={e => update({ notepad:e.target.value })}
              placeholder={'Priorities, resource gaps...\n\nPersists across sessions.'}
              style={{ flex:1, resize:'none', border:'none', padding:'8px 10px', background:'transparent', color:'#888', lineHeight:1.7, outline:'none', fontSize:fs }}/>
            <div style={{ padding:'4px 10px', borderTop:'0.5px solid #1a1a1a', fontSize:10, color:'#333' }}>Turn {state.turn} — {state.difficulty}</div>
          </div>
          <div onMouseDown={onRightDown} style={hDivSty}><div style={hDivInner}/></div>
          <div style={{ flex:1, border:'0.5px solid #222', borderRadius:8, overflow:'hidden', minHeight:0 }}>
            <div style={{ padding:'6px 10px', borderBottom:'0.5px solid #222', background:'#111', fontSize:10, fontWeight:500, color:'#666', textTransform:'uppercase', letterSpacing:'0.08em', flexShrink:0, display:'flex', alignItems:'center' }}>
              Incident Map — {dynamicPins.length} event{dynamicPins.length!==1?'s':''}
              <InfoBtn panelKey="map" activeInfo={activeInfo} setActiveInfo={setActiveInfo} />
            </div>
            <div style={{ height:'calc(100% - 28px)' }}>
              <MapContainer center={center} zoom={13} style={{ height:'100%', width:'100%' }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO'/>
                <MapUpdater center={center}/>
                {staticPins.map(pin => (
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
                {dynamicPins.map(pin => (
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