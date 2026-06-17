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

const PIN_COLORS = {
  EOC:'#1D9E75', HOSPITAL:'#4A90D9', DAM:'#E24B4A', STAGING:'#EF9F27',
  SHELTER:'#9B59B6', AFFECTED:'#E24B4A', FIRE:'#FF6B35', HAZMAT:'#9B59B6',
  DEFAULT:'#888', BLOCKED:'#E24B4A'
}

// ─── JURISDICTION CONTEXT ────────────────────────────────────────────────────
// Used in the world-init prompt to give the AI rich context for location generation
const JURISDICTION_CONTEXT = {
  'Rural County': {
    desc: 'A sparsely populated rural county with limited local resources, long response distances, volunteer fire departments, a small county seat, and heavy reliance on mutual aid and state assistance. Population under 30,000.',
    constraints: 'Minimal hospital capacity (likely one small critical access hospital or none), limited HazMat capability, no urban search and rescue, narrow roads, agricultural land use, possibly no interstate access.',
    examples: 'Appalachian county in WV or KY, Central Valley CA agricultural county, rural Montana or Wyoming county, Mississippi Delta county.',
  },
  'Mid-Size City': {
    desc: 'A mid-size city of 100,000-400,000 with a professional fire department, dedicated EOC, one or two regional hospitals, and established mutual aid agreements with surrounding counties.',
    constraints: 'Moderate resource base, some specialized capabilities (HazMat, SAR), urban-rural interface issues at city limits, may lack USAR or DMORT assets locally.',
    examples: 'Wilmington DE, Shreveport LA, Spokane WA, Fayetteville NC, Huntsville AL, Boise ID, Green Bay WI.',
  },
  'Large Urban Metro': {
    desc: 'A major metropolitan area with full-spectrum emergency services, Level I trauma centers, dedicated OES/OCEM, USAR teams, and complex multi-jurisdictional coordination requirements.',
    constraints: 'High population density, media scrutiny, political complexity, mutual aid complicated by jurisdictional boundaries, significant access and functional needs population.',
    examples: 'Houston TX, Phoenix AZ, Philadelphia PA, Atlanta GA, Miami FL, Chicago IL, Seattle WA.',
  },
  'Coastal Community': {
    desc: 'A coastal city or county with significant maritime exposure, seasonal population fluctuations, tourism infrastructure, coastal infrastructure vulnerability, and Coast Guard coordination requirements.',
    constraints: 'Evacuation route constraints (barrier islands, bridges), marina and port assets, seasonal surge in population, saltwater intrusion risks, ferry-dependent communities.',
    examples: 'Outer Banks NC, Galveston TX, Myrtle Beach SC, Key West FL, Hampton Roads VA, Atlantic City NJ.',
  },
  'Tribal Nation': {
    desc: 'A federally recognized tribal nation with sovereign jurisdiction, Bureau of Indian Affairs coordination requirements, tribal emergency management program, and unique legal and political dynamics distinct from state/county EM.',
    constraints: 'Sovereign jurisdiction complicates mutual aid (638 contracts, EMAC applicability uncertain), BIA as federal liaison, Indian Health Service as primary health provider, limited local tax base and resources, geographic isolation common, trust land boundaries matter.',
    examples: 'Navajo Nation AZ/NM/UT, Crow Nation MT, Standing Rock Sioux ND/SD, Choctaw Nation OK, Lummi Nation WA, Eastern Band Cherokee NC, Fort Apache AZ.',
  },
  'Interstate Corridor': {
    desc: 'A linear multi-jurisdictional zone along a major interstate, rail line, or river corridor where the incident spans multiple counties or states, requiring immediate interstate mutual aid and potentially EMAC activation.',
    constraints: 'No single unified jurisdiction — incident commander must coordinate across county and possibly state lines from the start, complex unified command, NTSB or EPA may assert federal lead, motorist stranding is a major secondary problem.',
    examples: 'I-80 corridor through NV/UT, I-10 through LA/MS, Ohio River corridor KY/OH/WV, BNSF transcontinental rail NM/AZ, Mississippi River barge corridor IL/MO.',
  },
}

// ─── SCENARIO REFS (stay scenario-locked — doctrine is doctrine) ──────────────
const SCENARIO_REFS = {
  hurricane: [
    { label:'FEMA Federal Evacuation Support Annex 2025', url:'https://www.fema.gov/sites/default/files/documents/fema_rd_federal-evacuation-support-annex_042025.pdf' },
    { label:'NHC Hurricane Preparedness',                 url:'https://www.nhc.noaa.gov/prepare/' },
    { label:'ESF-13 Public Safety Annex',                 url:'https://www.fema.gov/sites/default/files/2020-07/fema_ESF_13_Public-Safety-Security.pdf' },
    { label:'2017 Hurricane Season AAR',                  url:'https://www.fema.gov/sites/default/files/2020-08/fema_hurricane-season-after-action-report_2017.pdf' },
    { label:'FEMA Hurricane Response',                    url:'https://www.fema.gov/emergency-managers/risk-management/hurricanes' },
  ],
  mci: [
    { label:'FEMA National Response Framework',           url:'https://www.fema.gov/emergency-managers/national-preparedness/frameworks/response' },
    { label:'CHEMM START Triage Reference',               url:'https://chemm.hhs.gov/startadult.htm' },
    { label:'ESF-8 Public Health & Medical Annex',        url:'https://www.fema.gov/sites/default/files/2020-07/fema_ESF_8_Public-Health-Medical.pdf' },
    { label:'ICS Field Operations Guide',                 url:'https://www.usfa.fema.gov/downloads/pdf/publications/field_operations_guide.pdf' },
    { label:'Boston Marathon Bombing AAR 2014',           url:'https://www.policinginstitute.org/wp-content/uploads/2015/05/after-action-report-for-the-response-to-the-2013-boston-marathon-bombings_0.pdf' },
  ],
  hazmat: [
    { label:'EPA Emergency Response',                     url:'https://www.epa.gov/emergency-response' },
    { label:'DOT Emergency Response Guidebook',           url:'https://www.phmsa.dot.gov/hazmat/erg/emergency-response-guidebook-erg' },
    { label:'LEPC Guidance — EPA',                        url:'https://www.epa.gov/epcra/local-emergency-planning-committees' },
    { label:'ESF-10 Oil & Hazardous Materials',           url:'https://www.fema.gov/sites/default/files/2020-07/fema_ESF_10_Oil-Hazardous-Materials.pdf' },
    { label:'NTSB East Palestine Final Report 2024',      url:'https://www.ntsb.gov/investigations/Pages/RRD23MR005.aspx' },
  ],
  cyber: [
    { label:'CISA Critical Infrastructure',               url:'https://www.cisa.gov/topics/critical-infrastructure-security-and-resilience' },
    { label:'FEMA Planning Considerations for Cyber Incidents', url:'https://www.fema.gov/sites/default/files/documents/fema_planning-considerations-cyber-incidents_2023.pdf' },
    { label:'WaterISAC Resources',                        url:'https://www.waterisac.org/' },
    { label:'NERC CIP Standards',                        url:'https://www.nerc.com/pa/Stand/Pages/CIPStandards.aspx' },
    { label:'CISA Colonial Pipeline: What We Learned',   url:'https://www.cisa.gov/news-events/news/attack-colonial-pipeline-what-weve-learned-what-weve-done-over-past-two-years' },
  ],
  earthquake: [
    { label:'FEMA Earthquake Risk Program',               url:'https://www.fema.gov/emergency-managers/risk-management/earthquake' },
    { label:'USGS Earthquake Hazards Program',            url:'https://www.usgs.gov/programs/earthquake-hazards' },
    { label:'FEMA Urban Search & Rescue',                 url:'https://www.fema.gov/emergency-managers/practitioners/urban-search-rescue' },
    { label:'ATC-20 Postearthquake Safety Evaluation',   url:'https://www.atcouncil.org/atc-20' },
    { label:'Northridge Earthquake FEMA Disaster Page',  url:'https://www.fema.gov/disaster/1008' },
  ],
  flood: [
    { label:'FEMA Flood Risk — Know Your Risk',           url:'https://www.fema.gov/flood-maps/know-your-risk' },
    { label:'NWS Flood Safety',                           url:'https://www.weather.gov/safety/flood' },
    { label:'USACE Dam Safety Program',                   url:'https://www.usace.army.mil/Missions/Civil-Works/Dam-Safety/' },
    { label:'Oroville Dam Incident AAR — CalOES 2017',   url:'https://www.caloes.ca.gov/wp-content/uploads/Preparedness/Documents/2017-Oroville-Dam-Incident-AAR-Approved.pdf' },
    { label:'ESF-3 Public Works & Engineering',           url:'https://www.fema.gov/sites/default/files/2020-07/fema_ESF_3_Public-Works-Engineering.pdf' },
  ],
  wildfire: [
    { label:'FEMA Wildfire Mitigation & Response',       url:'https://www.fema.gov/emergency-managers/risk-management/wildfire' },
    { label:'CAL FIRE Fire Protection Programs',         url:'https://www.fire.ca.gov/what-we-do/fire-protection' },
    { label:'NIFC Fire Information',                     url:'https://www.nifc.gov/fire-information' },
    { label:'Palisades/Eaton Fire After-Action',         url:'https://www.lacounty.gov/emergency/' },
    { label:'ESF-4 Firefighting Annex',                  url:'https://www.fema.gov/sites/default/files/2020-07/fema_ESF_4_Firefighting.pdf' },
  ],
  winter: [
    { label:'FEMA Winter Storm Response',                 url:'https://www.fema.gov/emergency-managers/risk-management/winter-storms' },
    { label:'NWS Winter Storm Safety',                    url:'https://www.weather.gov/safety/winter' },
    { label:'ESF-12 Energy Annex',                        url:'https://www.fema.gov/sites/default/files/2020-07/fema_ESF_12_Energy.pdf' },
    { label:'FEMA Power Outage Incident Annex',           url:'https://www.fema.gov/sites/default/files/documents/fema_incident-annex_power-outage.pdf' },
    { label:'Texas Winter Storm Uri AAR 2021',            url:'https://www.energy.gov/sites/default/files/2021/07/f82/DOE%20Winter%20Storm%20Uri%20Report%20-%20August%202021.pdf' },
  ],
  rdd: [
    { label:'FEMA Radiological/Nuclear Response',         url:'https://www.fema.gov/emergency-managers/risk-management/radiological' },
    { label:'DHS RDD/IND Response Guidance',              url:'https://www.dhs.gov/publication/radiological-attack-dirty-bombs' },
    { label:'REAC/TS Medical Response to Radiation',      url:'https://orise.orau.gov/reacts/' },
    { label:'FEMA P-1017 IND Response Plan Review',       url:'https://www.fema.gov/sites/default/files/2020-07/fema_p-1017_ind-response-plan.pdf' },
    { label:'Nuclear/Radiological Incident Annex',        url:'https://www.fema.gov/sites/default/files/2020-07/fema_Nuclear-Radiological-Incident-Annex_0.pdf' },
  ],
  train: [
    { label:'DOT Emergency Response Guidebook',           url:'https://www.phmsa.dot.gov/hazmat/erg/emergency-response-guidebook-erg' },
    { label:'NTSB East Palestine Final Report 2024',      url:'https://www.ntsb.gov/investigations/Pages/RRD23MR005.aspx' },
    { label:'CHEMM START Triage Reference',               url:'https://chemm.hhs.gov/startadult.htm' },
    { label:'ESF-10 Oil & Hazardous Materials',           url:'https://www.fema.gov/sites/default/files/2020-07/fema_ESF_10_Oil-Hazardous-Materials.pdf' },
    { label:'LEPC Guidance — EPA',                        url:'https://www.epa.gov/epcra/local-emergency-planning-committees' },
  ],
}

const ESFS = [
  { num:1,  name:'Transportation',                  lead:'DOT',      desc:'Aviation, maritime, surface transport coordination.' },
  { num:2,  name:'Communications',                  lead:'DHS/CISA', desc:'Restore and sustain communications infrastructure.' },
  { num:3,  name:'Public Works & Engineering',      lead:'USACE',    desc:'Infrastructure protection, emergency repair, debris clearance.' },
  { num:4,  name:'Firefighting',                    lead:'USDA/FS',  desc:'Wildland and structural firefighting support.' },
  { num:5,  name:'Information & Planning',          lead:'FEMA',     desc:'Collect, analyze, and disseminate incident information.' },
  { num:6,  name:'Mass Care',                       lead:'FEMA',     desc:'Sheltering, feeding, emergency assistance, reunification.' },
  { num:7,  name:'Logistics',                       lead:'FEMA/GSA', desc:'Resource and supply chain management.' },
  { num:8,  name:'Public Health & Medical',         lead:'HHS',      desc:'Medical surge, public health, behavioral health.' },
  { num:9,  name:'Search & Rescue',                 lead:'FEMA',     desc:'Life-saving assistance, urban and swift-water SAR.' },
  { num:10, name:'Oil & Hazardous Materials',       lead:'EPA/USCG', desc:'Environmental response, hazmat containment and cleanup.' },
  { num:11, name:'Agriculture & Natural Resources', lead:'USDA',     desc:'Food safety, agriculture, natural and cultural resources.' },
  { num:12, name:'Energy',                          lead:'DOE',      desc:'Restore energy systems: electric power, natural gas, petroleum.' },
  { num:13, name:'Public Safety & Security',        lead:'DOJ',      desc:'Law enforcement, facility security, security planning.' },
  { num:14, name:'Cross-Sector Business & Infrastructure', lead:'DHS', desc:'Private sector coordination and infrastructure restoration.' },
  { num:15, name:'External Affairs',                lead:'FEMA',     desc:'Public information, intergovernmental, community affairs.' },
]

const PANEL_INFO = {
  lifelines: {
    title: 'Community Lifelines',
    body: 'The 8 FEMA Community Lifelines represent the most fundamental services a community needs to function. Each lifeline is color-coded: GREEN means fully operational, YELLOW means degraded, RED means compromised or non-functional. Status updates every turn based on your decisions and incident conditions. Hover any lifeline tile to see the AI\'s one-sentence reasoning for its current status.'
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
    body: 'All 15 Emergency Support Functions from the National Response Framework. Click any ESF card to mark it active — use this to track which ESFs you have activated during your response. Click again to deactivate. Active ESFs are highlighted. This is your tracking layer only — the AI does not see your selections.'
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
  hurricane:  { name:'Hurricane Landfall',             icon:'🌀', desc:'A major hurricane is closing on the coast. The 72-hour warning window is tightening. Jurisdiction and geography will shape every evacuation and resource decision.' },
  mci:        { name:'Mass Casualty Incident',          icon:'🚨', desc:'Explosion at a crowded public event. 200+ casualties. Cause unknown. Your resources and hospital capacity depend heavily on where this happened.' },
  hazmat:     { name:'Hazardous Materials Release',     icon:'☣️', desc:'Railcar derailment with chlorine release. Shelter-in-place decision imminent. The operating environment changes everything about your response options.' },
  cyber:      { name:'Cyber-Infrastructure Cascade',    icon:'💻', desc:'Ransomware hits water and power utilities simultaneously. Public services degrading. Coordination complexity scales with your jurisdiction type.' },
  earthquake: { name:'Major Earthquake',                icon:'🏚️', desc:'M7.1 strike-slip event. Comms degraded. Damage picture unknown. Your jurisdiction determines what resources you have and how long they take to arrive.' },
  flood:      { name:'Flash Flood / Dam Failure',       icon:'🌊', desc:'Upstream dam showing structural compromise. Downstream communities in the inundation zone. Rural or coastal settings create very different rescue problems.' },
  wildfire:   { name:'Urban Wildfire',                  icon:'🔥', desc:'Wind-driven wildfire with structure-to-structure spread. Mass evacuation underway. Jurisdiction type determines air resource access, road networks, and shelter options.' },
  winter:     { name:'Winter Storm Cascade',            icon:'❄️', desc:'Historic winter storm. Power grid failing. Vulnerable populations at risk. A tribal nation or rural county has almost nothing in common with a metro EOC response.' },
  rdd:        { name:'Radiological Dispersal Device',   icon:'☢️', desc:'Dirty bomb detonated in a public area. Contamination zone unknown. Federal coordination required — but the lead agencies and resources look very different depending on where this happened.' },
  train:      { name:'Train Derailment — MCI / HazMat', icon:'🚂', desc:'Freight train derailment. Multiple casualties. Hazmat release confirmed. Rail corridors cross rural counties, tribal lands, and urban cores — your jurisdiction defines your authority and your gaps.' },
}

const JURISDICTIONS = ['Rural County','Mid-Size City','Large Urban Metro','Coastal Community','Tribal Nation','Interstate Corridor']
const DIFFICULTIES  = ['Basic','Moderate','Advanced','Brutal','Adaptive']

const LIFELINES = [
  { key:'safety',    label:'Safety & Security',       icon:'/icons/safety.png' },
  { key:'food',      label:'Food, Hydration, Shelter', icon:'/icons/food.png' },
  { key:'health',    label:'Health & Medical',         icon:'/icons/health.png' },
  { key:'energy',    label:'Energy',                   icon:'/icons/energy.png' },
  { key:'comms',     label:'Communications',           icon:'/icons/comms.png' },
  { key:'transport', label:'Transportation',           icon:'/icons/transport.png' },
  { key:'hazmat',    label:'Hazardous Material',       icon:'/icons/hazmat.png' },
  { key:'water',     label:'Water Systems',            icon:'/icons/water.png' },
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

const DEFAULT_SETTINGS = { fontSize:11, accentColor:'#1D9E75', alertColor:'#EF9F27' }
const SETTINGS_KEY = 'em_sim_settings'

// ─── WORLD INIT PROMPT ───────────────────────────────────────────────────────
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
Generate a specific, realistic, geographically accurate opening world state for this exact combination of scenario and jurisdiction. Do not use generic placeholder locations. Pick a real, named place that fits both the scenario requirements and the jurisdiction type. The place must be real and the coordinates must be accurate.

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

// ─── MAIN SYSTEM PROMPT ──────────────────────────────────────────────────────
function buildSystemPrompt(scenario, jurisdiction, difficulty, worldState) {
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
    wildfire: 'This is a wind-driven wildfire with structure-to-structure spread. Key pressure points: air resource allocation, evacuation route management, shelter capacity, public warning systems, and mutual aid coordination. Smoke and fire behavior modeling are critical.',
    winter:   'This is a cascading infrastructure failure driven by extreme cold. Key pressure points: power restoration prioritization, warming shelter activation and capacity, vulnerable population welfare checks, road clearance, fuel supply for hospitals and generators.',
    rdd:      'This is a radiological dispersal device event. Key pressure points: hot zone establishment, federal agency coordination (FBI as LFA for terrorism, FEMA for consequence management, NRC, EPA FRMAC), decontamination of self-referred patients, public messaging to prevent panic. Reference the Nuclear/Radiological Incident Annex and FEMA P-1017.',
    train:    'This is a combined MCI and hazmat event. Key pressure points: unified command establishment bridging MCI and hazmat doctrine, railroad company cooperation, simultaneous triage and hazmat containment, LEPC activation, EPA coordination. The railroad company will resist releasing the manifest.',
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
- When a dispatch event has a specific physical location, include it as a map pin. Generate 0-2 pins per turn. Coordinates must be accurate for ${worldState?.location || jurisdiction}.
- On ENDEX: thorough AAR covering: (1) command element continuity, (2) continuity decisions made or that should have been made, (3) resource and coordination effectiveness, (4) communications and information management, (5) strengths, (6) critical gaps, (7) relevant doctrine references, (8) specific recommendations calibrated to this jurisdiction type.
- Never break character.

RESPOND ONLY IN THIS EXACT JSON FORMAT — no preamble, no markdown:
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

On ENDEX use same format with full AAR in consequence field, empty headlines and pins arrays.`
}

const SAVE_KEY = 'em_sim_v13'

const defaultState = {
  screen:'setup', scenario:null, jurisdiction:'Mid-Size City', difficulty:'Adaptive',
  history:[], dispatches:[], terminal:[], notepad:'', simTime:'H+0:00',
  situation:'DEVELOPING', turn:0, lifelines:DEFAULT_LIFELINES, headlines:[],
  dynamicPins:[], worldState:null,
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

export default function App() {
  const [state, setState]           = useState(null)
  const [loading, setLoading]       = useState(false)
  const [initLoading, setInitLoading] = useState(false)
  const [input, setInput]           = useState('')
  const [inputAreaHeight, setInputAreaHeight] = useState(80)
  const [boundaries, setBoundaries] = useState([14, 32, 80])
  const [leftBounds, setLeftBounds] = useState([40, 70])
  const [rightSplit, setRightSplit] = useState(45)
  const [showSettings, setShowSettings] = useState(false)
  const [activeInfo, setActiveInfo] = useState(null)
  const [activeESFs, setActiveESFs] = useState({})
  const [showEndDialog, setShowEndDialog] = useState(false)
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

  // ─── WORLD INIT CALL ───────────────────────────────────────────────────────
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

  // ─── START SCENARIO ────────────────────────────────────────────────────────
  async function startScenario(scenarioKey) {
    const sc = SCENARIOS[scenarioKey]
    const jurisdiction = state.jurisdiction
    setActiveESFs({})
    setInitLoading(true)

    // Show the game screen immediately with a loading state
    update({
      screen:'game', scenario:scenarioKey,
      dispatches:[], terminal:[
        { type:'header',  text:`▶ ${sc.name.toUpperCase()} — ${jurisdiction} — ${state.difficulty}` },
        { type:'system',  text:'Generating scenario world...' },
      ],
      history:[], turn:0, simTime:'H+0:00', situation:'DEVELOPING',
      notepad:'', lifelines:DEFAULT_LIFELINES, headlines:[], dynamicPins:[],
      worldState:null,
    })

    try {
      const world = await initWorld(scenarioKey, jurisdiction)

      // Build initial dispatches and pins from world response
      const initDispatches = (world.dispatches || []).map((text, i) => ({ id:i, text, turn:0 }))
      const initPins = (world.pins || []).map((p, i) => ({ ...p, id: `init-${i}` }))

      update({
        worldState: world,
        dispatches: initDispatches,
        terminal: [
          { type:'header',   text:`▶ ${sc.name.toUpperCase()} — ${world.location} — ${state.difficulty}` },
          { type:'system',   text:'Type your decisions as the EM on scene. Be specific. Type ENDEX for AAR.' },
          { type:'divider' },
          { type:'narrator', text:world.openingNarrative + ' What is your first action?' },
        ],
        dynamicPins: initPins,
      })
    } catch(e) {
      // Fallback: use generic opening if world init fails
      update({
        terminal: [
          { type:'header',   text:`▶ ${sc.name.toUpperCase()} — ${jurisdiction} — ${state.difficulty}` },
          { type:'system',   text:'Type your decisions as the EM on scene. Be specific. Type ENDEX for AAR.' },
          { type:'divider' },
          { type:'narrator', text:sc.desc + ' Your EOC is activating. What is your first action?' },
        ],
        dispatches: [{ id:0, text:`${sc.name} confirmed. EOC activation underway. Resources status unknown.`, turn:0 }],
      })
    }

    setInitLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // ─── SEND ACTION ───────────────────────────────────────────────────────────
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
        body: JSON.stringify({
          system: buildSystemPrompt(state.scenario, state.jurisdiction, state.difficulty, state.worldState),
          messages: msgs,
        }),
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

      update({ terminal:addedTerm, history:newHistory, dispatches:newDispatches,
               simTime:parsed.time||state.simTime, situation:parsed.situation||'DEVELOPING',
               turn:nextTurn, lifelines:parsed.lifelines||state.lifelines,
               headlines:newHeadlines, dynamicPins:newDynamicPins })
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

  if (!state) return <div style={{ color:'#888', padding:'2rem', fontFamily:'monospace' }}>Loading...</div>

  // ─── SETUP SCREEN ──────────────────────────────────────────────────────────
 if (state.screen === 'setup') return (
    <div style={{ minHeight:'100vh', background:'#080c0a', fontFamily:'JetBrains Mono, monospace', display:'flex', flexDirection:'column' }}>

      {/* HERO */}
      <div style={{ position:'relative', overflow:'hidden', borderBottom:'0.5px solid #0f1f14' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(29,158,117,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(29,158,117,0.04) 1px, transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }}/>
        {[{top:10,left:10,borderWidth:'1px 0 0 1px'},{top:10,right:10,borderWidth:'1px 1px 0 0'},{bottom:10,left:10,borderWidth:'0 0 1px 1px'},{bottom:10,right:10,borderWidth:'0 1px 1px 0'}].map((s,i) => (
          <div key={i} style={{ position:'absolute', width:16, height:16, borderStyle:'solid', borderColor:ac, opacity:0.4, ...s }}/>
        ))}
        {/* Top status bar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 24px', borderBottom:'0.5px solid #0f1f14', background:'rgba(8,12,10,0.9)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:9, color:'#4a8a68', letterSpacing:'0.12em' }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:ac, animation:'pulse 2s infinite' }}/>
            EMERGENCY OPERATIONS COMMAND SYSTEM
          </div>
          <div style={{ display:'flex', gap:24 }}>
            {[['SYSTEM STATUS','● OPERATIONAL'],['NETWORK','SECURE'],['DATA FEED','LIVE'],['AI ENGINE','ONLINE']].map(([k,v]) => (
              <div key={k} style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:1 }}>
                <span style={{ fontSize:8, color:'#4a7a5a', letterSpacing:'0.1em' }}>{k}</span>
                <span style={{ fontSize:9, color:ac, letterSpacing:'0.08em' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Hero content */}
        <div style={{ maxWidth:1100, margin:'0 auto', width:'100%', boxSizing:'border-box' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:40, padding:'28px 32px 24px', position:'relative', zIndex:1 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <div style={{ width:24, height:'0.5px', background:ac }}/>
                <span style={{ fontSize:9, color:ac, letterSpacing:'0.2em', textTransform:'uppercase' }}>Advanced Training Platform</span>
              </div>
              <h1 style={{ fontSize:28, fontWeight:700, lineHeight:1.1, margin:'0 0 4px', color:'#e8f5f0', letterSpacing:'0.04em' }}>
                EM CRISIS <span style={{ color:ac }}>SIMULATOR</span>
              </h1>
              <p style={{ fontSize:11, color:'#5aaa80', letterSpacing:'0.06em', margin:'0 0 10px' }}>Advanced Emergency Operations Training Platform</p>
              <p style={{ fontSize:10, color:'#4a8a68', lineHeight:1.8, margin:'0 0 16px', maxWidth:480, letterSpacing:'0.02em' }}>
                Scenario-based incident command simulations for emergency managers, EOCs, and response teams.
              </p>
              <div style={{ display:'flex', gap:24 }}>
                {[['TRAIN','Realistic scenarios built for your role'],['DECIDE','Sharpen judgment under pressure'],['COMMAND','Practice ICS doctrine in realistic conditions'],['REVIEW','AI after-action every scenario']].map(([label,desc]) => (
                  <div key={label} style={{ display:'flex', flexDirection:'column', gap:3 }}>
                    <span style={{ fontSize:8, color:ac, letterSpacing:'0.12em', fontWeight:700 }}>{label}</span>
                    <span style={{ fontSize:8, color:'#4a7a5a', lineHeight:1.5 }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:0, minWidth:170 }}>
              {[['SCENARIOS','10 LOADED'],['JURISDICTIONS','6 TYPES'],['DIFFICULTY','5 LEVELS'],['AAR','AI-POWERED'],['VERSION','2.0']].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'0.5px solid #0f1f14' }}>
                  <span style={{ fontSize:8, color:'#4a7a5a', letterSpacing:'0.1em' }}>{k}</span>
                  <span style={{ fontSize:8, color:ac, letterSpacing:'0.08em' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 32px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', width:'100%', boxSizing:'border-box' }}>

          {/* SCENARIO SELECTION */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <span style={{ fontSize:9, color:'#4a8a68', textTransform:'uppercase', letterSpacing:'0.12em' }}>Select Scenario</span>
            <div style={{ flex:1, height:'0.5px', background:'#0f1f14' }}/>
            {state.scenario && <span style={{ fontSize:9, color:ac, letterSpacing:'0.06em' }}>✓ {SCENARIOS[state.scenario].name}</span>}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:6, marginBottom:20 }}>
            {Object.entries(SCENARIOS).map(([key, sc]) => {
              const selected = state.scenario === key
              return (
                <button key={key} onClick={() => update({ scenario:key })}
                  style={{ textAlign:'left', padding:'12px 12px', border:`0.5px solid ${selected?ac:'#1a2e20'}`, borderLeft:`${selected?'3px':'0.5px'} solid ${selected?ac:'#1a2e20'}`, background:selected?ac+'12':'#0c120e', cursor:'pointer', borderRadius:3, outline:'none', position:'relative', transition:'border-color 0.1s' }}
                  onMouseEnter={e => { if(!selected){ e.currentTarget.style.borderColor='#2a4a32'; e.currentTarget.style.background='#0f1a12' }}}
                  onMouseLeave={e => { if(!selected){ e.currentTarget.style.borderColor='#1a2e20'; e.currentTarget.style.background='#0c120e' }}}>
                  {selected && <div style={{ position:'absolute', top:5, right:5, width:4, height:4, borderRadius:'50%', background:ac }}/>}
                  <div style={{ fontSize:22, marginBottom:7, lineHeight:1 }}>{sc.icon}</div>
                  <div style={{ fontSize:9, fontWeight:700, color:selected?ac:'#5a9a70', marginBottom:4, letterSpacing:'0.06em', lineHeight:1.3 }}>{sc.name.toUpperCase()}</div>
                  <div style={{ fontSize:8, color:selected?'#4a8a60':'#3a6a48', lineHeight:1.6 }}>{sc.desc}</div>
                </button>
              )
            })}
          </div>

          {/* CONFIGURATION */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <span style={{ fontSize:9, color:'#4a8a68', textTransform:'uppercase', letterSpacing:'0.12em' }}>Configuration</span>
            <div style={{ flex:1, height:'0.5px', background:'#0f1f14' }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            <div>
              <p style={{ fontSize:8, color:'#4a8a68', margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'0.12em' }}>Jurisdiction Type</p>
              <select value={state.jurisdiction} onChange={e => update({ jurisdiction:e.target.value })}
                style={{ width:'100%', padding:'8px 10px', background:'#0c120e', border:'0.5px solid #1a3028', color:'#6aaa80', fontSize:10, fontFamily:'JetBrains Mono, monospace', borderRadius:3, outline:'none' }}>
                {JURISDICTIONS.map(j => <option key={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize:8, color:'#4a8a68', margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'0.12em' }}>Difficulty</p>
              <select value={state.difficulty} onChange={e => update({ difficulty:e.target.value })}
                style={{ width:'100%', padding:'8px 10px', background:'#0c120e', border:'0.5px solid #1a3028', color:'#6aaa80', fontSize:10, fontFamily:'JetBrains Mono, monospace', borderRadius:3, outline:'none' }}>
                {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
              </select>
              {state.difficulty && (
                <div style={{ marginTop:6, fontSize:8, color:'#4a8a68', lineHeight:1.6, paddingLeft:2 }}>
                  {state.difficulty === 'Basic' && 'Generous evaluation. One complication per turn. Good for learning the system.'}
                  {state.difficulty === 'Moderate' && 'Moderate rigor. Two complications per turn. Realistic resource pressure.'}
                  {state.difficulty === 'Advanced' && 'Professional rigor. 2-3 complications per turn. Resource constraints are real.'}
                  {state.difficulty === 'Brutal' && 'Ruthless evaluation. Every vague or delayed decision cascades.'}
                  {state.difficulty === 'Adaptive' && 'Difficulty scales to your performance. Never lets you get comfortable.'}
                </div>
              )}
            </div>
          </div>

          {/* JURISDICTION CALLOUT */}
          {state.jurisdiction && (
            <div style={{ marginBottom:16, padding:'12px 16px', border:'0.5px solid #1a3028', borderLeft:`3px solid ${ac}`, borderRadius:3, background:'#0a140c' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style={{ fontSize:8, color:ac, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em' }}>{state.jurisdiction}</span>
                <div style={{ flex:1, height:'0.5px', background:'#1a3028' }}/>
              </div>
              <div style={{ fontSize:9, color:'#5aaa80', lineHeight:1.8, marginBottom:6 }}>{JURISDICTION_CONTEXT[state.jurisdiction].desc}</div>
              <div style={{ fontSize:8, color:'#5aaa80', lineHeight:1.7, paddingTop:6, borderTop:'0.5px solid #1a3028' }}>
                <span style={{ color:ac, fontWeight:600 }}>Key constraints: </span>
                <span>{JURISDICTION_CONTEXT[state.jurisdiction].constraints}</span>
              </div>
            </div>
          )}

          {/* LAUNCH */}
          <button
            onClick={() => state.scenario && !initLoading && startScenario(state.scenario)}
            disabled={!state.scenario || initLoading}
            style={{ width:'100%', padding:'13px', fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', border:`0.5px solid ${state.scenario?ac:'#1a3028'}`, color:state.scenario?'#080c0a':'#3a6a48', background:state.scenario?ac:'transparent', cursor:(state.scenario&&!initLoading)?'pointer':'not-allowed', fontFamily:'JetBrains Mono, monospace', borderRadius:3, opacity:initLoading?0.6:1 }}>
            {initLoading ? '⟳  Generating scenario world...' : state.scenario ? `Launch — ${SCENARIOS[state.scenario].name} / ${state.jurisdiction} ↗` : 'Select a scenario to begin'}
          </button>

        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      <div style={{ borderTop:'0.5px solid #0f1f14', background:'rgba(8,12,10,0.95)', padding:'8px 32px', display:'flex', gap:0, flexShrink:0 }}>
        <div style={{ maxWidth:1100, margin:'0 auto', width:'100%', display:'flex', gap:0 }}>
          {[
            ['EOC NETWORK', 'CONNECTED'],
            ['MODE', 'TRAINING'],
            ['SCENARIO', state.scenario ? SCENARIOS[state.scenario].name.toUpperCase() : '—'],
            ['JURISDICTION', state.jurisdiction ? state.jurisdiction.toUpperCase() : '—'],
            ['DIFFICULTY', state.difficulty ? state.difficulty.toUpperCase() : '—'],
            ['STATUS', state.scenario ? 'READY TO LAUNCH' : 'AWAITING SELECTION'],
          ].map(([k,v], i, arr) => (
            <div key={k} style={{ display:'flex', flexDirection:'column', gap:2, paddingRight:20, marginRight:20, borderRight: i < arr.length-1 ? '0.5px solid #0f1f14' : 'none' }}>
              <span style={{ fontSize:7, color:'#3a6a48', letterSpacing:'0.12em' }}>{k}</span>
              <span style={{ fontSize:9, color: k==='STATUS' && state.scenario ? ac : '#5a9a70', letterSpacing:'0.06em' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  )
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

  // Map center: use worldState if available, else US center as fallback
  const dynamicPins = state.dynamicPins || []
  const center      = state.worldState?.center || [39.5, -98.35]
  const mapZoom     = state.worldState ? 13 : 4
  const refs        = state.scenario ? SCENARIO_REFS[state.scenario]||[] : []

  // Separate init pins (from world build) vs turn pins (from gameplay)
  const initPins    = dynamicPins.filter(p => p.id?.startsWith('init-'))
  const turnPins    = dynamicPins.filter(p => !p.id?.startsWith('init-'))

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
                  <div key={esf.num}
                    onClick={() => setActiveESFs(prev => ({ ...prev, [esf.num]: !prev[esf.num] }))}
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

        {/* TERMINAL */}
        <div style={{ width:`${colW[2]}%`, display:'flex', flexDirection:'column', border:'0.5px solid #222', borderRadius:8, overflow:'hidden', flexShrink:0 }}>
          <div style={{ padding:'6px 10px', borderBottom:'0.5px solid #222', background:'#111', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:10, fontWeight:500, color:'#666', textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', alignItems:'center' }}>
              {SCENARIOS[state.scenario]?.name}
              {state.worldState && <span style={{ color:ac, marginLeft:6 }}>— {state.worldState.location}</span>}
              <InfoBtn panelKey="terminal" activeInfo={activeInfo} setActiveInfo={setActiveInfo} />
            </span>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ fontSize:10, color:'#444' }}>{state.simTime}</span>
              <span style={{ fontSize:9, padding:'2px 6px', borderRadius:3, fontWeight:500, background:(sitColors[state.situation]||'#888')+'22', color:sitColors[state.situation]||'#888' }}>{state.situation}</span>
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
            </div>
          </div>
          <div ref={termRef} style={{ flex:1, overflowY:'auto', padding:'10px 14px', lineHeight:1.8 }}>
            {state.terminal.map((line,i) => {
              if (!line) return null
              if (line.type==='divider') return <hr key={i} style={{ border:'none', borderTop:'0.5px solid #1a1a1a', margin:'8px 0' }}/>
              return <div key={i} style={termStyles[line.type]||{ fontSize:fs }}>{line.text}</div>
            })}
            {(loading || initLoading) && <div style={{ color:'#333', fontStyle:'italic', fontSize:fs }}>
              {initLoading ? 'Building scenario world...' : 'Evaluating action...'}
            </div>}
          </div>
          <div style={{ borderTop:'0.5px solid #222', height:8, cursor:'row-resize', background:'#161616', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
            onMouseDown={e => {
              e.preventDefault()
              const termEl = termRef.current
              const startY = e.clientY
              const startHeight = inputAreaHeight
              function onMove(ev) {
                const delta = startY - ev.clientY
                setInputAreaHeight(Math.max(60, Math.min(400, startHeight + delta)))
              }
              function onUp() {
                window.removeEventListener('mousemove', onMove)
                window.removeEventListener('mouseup', onUp)
              }
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
        </div>  
        <div style={divSty} onMouseDown={e => onColDown(2,e)}><div style={divInner}/></div>

        {/* RIGHT COLUMN */}
        <div ref={rightColRef} style={{ width:`${colW[3]}%`, display:'flex', flexDirection:'column', flexShrink:0, minHeight:0 }}>
          <div style={{ height:`${rightSplit}%`, display:'flex', flexDirection:'column', border:'0.5px solid #222', borderRadius:8, overflow:'hidden', flexShrink:0 }}>
            <div style={{ padding:'6px 10px', borderBottom:'0.5px solid #222', background:'#111', fontSize:10, fontWeight:500, color:'#666', textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', alignItems:'center' }}>
              Commander's Notepad
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
                {/* Init pins from world build — rendered as static infrastructure */}
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
                {/* Turn pins from gameplay */}
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