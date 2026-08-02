import { useMemo, useState } from 'react'
import NexusLogo from '../brand/NexusLogo'
import ResourcesModal from '../resources/ResourcesModal'
import { SCENARIOS, DIFFICULTIES } from '../../data/scenarios'
import { JURISDICTIONS, JURISDICTION_CONTEXT } from '../../data/jurisdictions'
import { ROLES, ROLE_GROUPS } from '../../data/roles'

import hurricaneImage from '../../assets/missionPortal/hurricane-landfall.jpg'
import mciImage from '../../assets/missionPortal/mass-casualty-incident.jpg'
import hazmatImage from '../../assets/missionPortal/hazardous-materials-release.jpg'
import cyberImage from '../../assets/missionPortal/cyber-infrastructure-cascade.jpg'
import earthquakeImage from '../../assets/missionPortal/major-earthquake.jpg'
import floodImage from '../../assets/missionPortal/flash-flood-dam-failure.jpg'
import wildfireImage from '../../assets/missionPortal/urban-wildfire.jpg'
import winterImage from '../../assets/missionPortal/winter-storm-cascade.jpg'
import rddImage from '../../assets/missionPortal/radiological-dispersal-device.jpg'
import trainImage from '../../assets/missionPortal/train-derailment-mci-hazmat.jpg'
import customScenarioImage from '../../assets/missionPortal/build-custom-scenario.jpg'

const DS = {
  bg:'#020B13',
  bg2:'#071421',
  panel:'rgba(4, 17, 29, 0.82)',
  panel2:'rgba(6, 23, 38, 0.92)',
  border:'rgba(87, 146, 198, 0.30)',
  borderSoft:'rgba(87, 146, 198, 0.22)',
  borderStrong:'rgba(65, 141, 255, 0.62)',
  teal:'#45A3FF',
  teal2:'#2DE2B8',
  blue:'#2E83FF',
  amber:'#F59B22',
  text:'#F4F8FE',
  muted:'#B9C8D8',
  dim:'#6F8195',
}

const difficultyText = {
  Introductory:'Slower pace, more forgiving evaluation, and clearer exercise pressure for first-time users.',
  Standard:'Normal realistic exercise pressure with practical coordination and resource-management challenges.',
  Advanced:'Harder scenario conditions with more complications, tighter timelines, and less complete information.',
  Expert:'High-pressure exercise environment with severe consequences for weak or delayed decisions.',
  Adaptive:'The AI adjusts difficulty based on the participant’s performance.',
}

const SCENARIO_VISUALS = {
  hurricane: {
    title:'Hurricane Landfall',
    img:hurricaneImage,
    tag:'Natural Hazard',
    desc:'Coastal hurricane impacts with evacuation, sheltering, infrastructure, and resource-prioritization pressures.',
  },
  mci: {
    title:'Mass Casualty Incident',
    img:mciImage,
    tag:'MCI',
    desc:'High-casualty incident requiring rapid coordination across EMS, hospitals, law enforcement, and public information.',
  },
  hazmat: {
    title:'Hazardous Materials Release',
    img:hazmatImage,
    tag:'HazMat',
    desc:'HazMat incident with protective actions, public warning, environmental monitoring, and multiagency coordination.',
  },
  cyber: {
    title:'Cyber-Infrastructure Cascade',
    img:cyberImage,
    tag:'Infrastructure',
    desc:'Cyber disruption affecting water, power, communications, public services, and continuity of operations.',
  },
  earthquake: {
    title:'Major Earthquake',
    img:earthquakeImage,
    tag:'Natural Hazard',
    desc:'Seismic event with damage assessment gaps, degraded communications, medical surge, and resource staging challenges.',
  },
  flood: {
    title:'Flash Flood / Dam Failure',
    img:floodImage,
    tag:'Natural Hazard',
    desc:'Rapid flooding with downstream warning, evacuations, sheltering, access constraints, and infrastructure risk.',
  },
  wildfire: {
    title:'Urban Wildfire',
    img:wildfireImage,
    tag:'Natural Hazard',
    desc:'Wind-driven fire with evacuation routes, shelter options, air resource coordination, and structure exposure risk.',
  },
  winter: {
    title:'Winter Storm Cascade',
    img:winterImage,
    tag:'Natural Hazard',
    desc:'Extreme winter impacts with power outages, road clearance, warming shelters, fuel, and vulnerable populations.',
  },
  rdd: {
    title:'Radiological Dispersal Device',
    img:rddImage,
    tag:'Security / CBRN',
    desc:'RDD event requiring consequence management, public messaging, federal coordination, and contamination controls.',
  },
  train: {
    title:'Train Derailment — MCI / HazMat',
    img:trainImage,
    tag:'MCI / HazMat',
    desc:'Rail incident combining casualties, hazardous materials, evacuation decisions, and railroad coordination.',
  },
}

function FieldLabel({ children }) {
  return <div style={{ fontSize:10, color:DS.muted, textTransform:'uppercase', letterSpacing:'0.13em', marginBottom:7 }}>{children}</div>
}

function SelectField({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange} style={{ width:'100%', height:42, background:DS.bg2, color:DS.text, border:`1px solid ${DS.borderSoft}`, borderRadius:5, padding:'0 12px', fontFamily:'Inter, system-ui, sans-serif', fontSize:13, outline:'none' }}>
      {children}
    </select>
  )
}

function InfoRow({ label, value, accent }) {
  return (
    <div style={{ padding:'12px 0', borderBottom:`1px solid ${DS.borderSoft}` }}>
      <div style={{ fontSize:10, color:DS.dim, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:13, color:accent ? DS.teal : DS.text, lineHeight:1.45 }}>{value}</div>
    </div>
  )
}

function ScenarioCard({ scenarioKey, scenario, visual, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(scenarioKey)}
      style={{
        textAlign:'left',
        borderRadius:4,
        overflow:'hidden',
        border:`1px solid ${selected ? DS.borderStrong : DS.border}`,
        background:selected ? 'linear-gradient(180deg, rgba(46,131,255,0.18), rgba(3,14,24,0.92))' : 'rgba(3,14,24,0.84)',
        color:DS.text,
        cursor:'pointer',
        padding:0,
        minWidth:0,
        boxShadow:selected ? '0 0 0 1px rgba(69,163,255,0.25), 0 0 28px rgba(46,131,255,0.22)' : '0 16px 34px rgba(0,0,0,0.16)',
        display:'flex',
        flexDirection:'column',
      }}
    >
      <div style={{ position:'relative', aspectRatio:'16 / 8', background:'#061522', overflow:'hidden' }}>
        <img src={visual.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transform:selected ? 'scale(1.025)' : 'scale(1)', transition:'transform 160ms ease' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(2,9,16,0.04), rgba(2,9,16,0.50))' }} />
        {selected && (
          <div style={{ position:'absolute', top:9, right:9, fontSize:10, color:'#04101B', background:DS.teal, borderRadius:999, padding:'4px 8px', fontWeight:950, letterSpacing:'0.08em' }}>
            SELECTED
          </div>
        )}
      </div>
      <div style={{ padding:'11px 12px 13px', flex:1 }}>
        <div style={{ color:DS.text, fontSize:15, fontWeight:900, marginBottom:7, lineHeight:1.14 }}>{visual.title || scenario.name}</div>
        <div style={{ color:DS.muted, fontSize:12, lineHeight:1.42 }}>{visual.desc || scenario.desc}</div>
        <div style={{ marginTop:10, display:'inline-flex', alignItems:'center', height:22, padding:'0 8px', borderRadius:999, border:`1px solid ${DS.borderSoft}`, color:DS.teal, fontSize:10, fontWeight:850, letterSpacing:'0.08em', textTransform:'uppercase', background:'rgba(69,163,255,0.08)' }}>
          {visual.tag}
        </div>
      </div>
    </button>
  )
}


const TRAINING_FOCUS_OPTIONS = [
  'Community Lifelines',
  'Resource Coordination',
  'Interagency Coordination',
  'Public Information',
  'Leadership Support',
  'Continuity / COOP',
  'Recovery Transition',
]

const AMBIGUOUS_LOCATIONS = ['springfield', 'washington', 'greenville', 'portland', 'orange county', 'jefferson county']

const CUSTOM_FORM_DEFAULT = {
  location:'',
  eventHazard:'',
  situationDescription:'',
  role:'EOC Director',
  difficulty:'Adaptive',
  trainingFocus:TRAINING_FOCUS_OPTIONS,
}

function isLocationAmbiguous(value='') {
  return AMBIGUOUS_LOCATIONS.includes(value.trim().toLowerCase())
}

function isLocationSpecificEnough(value='') {
  const clean = value.trim()
  if (!clean) return false
  if (/\b(dc|d\.c\.)\b/i.test(clean)) return true
  if (/\b(nation|tribe|tribal|territory|county|parish|borough|university|college|campus|port|airport|installation|base|station|district|authority)\b/i.test(clean)) return true
  if (/\b(puerto rico|guam|american samoa|u\.s\. virgin islands|northern mariana islands)\b/i.test(clean)) return true
  return clean.includes(',') && clean.length >= 6
}

function buildCustomPreviewPrompt(form) {
  return `You are NEXUS EOC generating an Exercise Preview for the Build Custom Scenario feature.

The user has provided a real-world location or jurisdiction, event or hazard, situation description, selected exercise position/function, difficulty, and training focus areas.

Your job is to convert the user's plain-language briefing into a concise EOC-focused exercise preview.

Do not start the exercise yet.
Do not generate injects yet.
Do not generate the AAR yet.
Do not reveal hidden complications, scoring logic, or future consequences.

PRIMARY VOICE
Use the NEXUS Deputy Emergency Manager voice: professional, operational, plain language, conversational, consequence-based, realistic, and EOC-focused.

LOCATION RULES
Use the validated location exactly as provided. Do not invent, replace, or independently change the location.
Do not make unsupported claims about exact local capabilities, elected officials, facility names, agency names, emergency plans, security plans, infrastructure, or local procedures unless provided by verified platform data.
If exact local agency names are not verified, use generic but realistic labels such as City Emergency Management, County Emergency Management, City Public Works, County Public Health, State Emergency Management Duty Officer, Regional Healthcare Coalition, Local Law Enforcement, Local Fire Department, Emergency Communications Center, Mayor's Office, County Executive's Office, Tribal Emergency Management Office, Utility Provider, School District, Transit Agency, or Joint Information Center.

EOC FOCUS RULES
This is an EOC exercise. The user is not the Incident Commander.
Do not turn the scenario into tactical incident command.
Do not ask the user to command field units, assign individual crews, direct police movements, direct EMS treatment, select tactical suppression actions, track suspects, plan security routes, control tactical perimeters, choose tactical law enforcement formations, or direct tactical rescue operations.

LAW ENFORCEMENT / SECURITY GUARDRAIL
For special events, civil unrest, threats, suspicious activity, complex attacks, VIP presence, or security-sensitive scenarios, keep the exercise focused on consequence management and emergency coordination. Avoid tactical police deployment, suspect tracking, security route planning, protective detail planning, checkpoint placement, sniper/counter-sniper details, tactical unit locations, surveillance plans, apprehension plans, crowd-control tactics, or operational security details.

TRAINING FOCUS CONVERSION
Convert selected Training Focus areas into exercise pressure.
Community Lifelines: emphasize safety and security, health and medical, communications, transportation, energy, food/water/shelter, hazardous materials, and cascading impacts to critical services.
Resource Coordination: emphasize scarce resources, mutual aid timing, competing requests, logistics constraints, staging and prioritization at the EOC level, vendor or contract limitations, and resource tracking gaps.
Interagency Coordination: emphasize conflicting agency priorities, federal/state/local coordination, private sector coordination, nonprofit and community partner coordination, unified messaging, information-sharing gaps, and authority seams.
Public Information: emphasize rumors, conflicting reports, media pressure, social media amplification, accessibility and language access, public warning decisions, public confidence, Joint Information Center coordination, and leadership talking points.
Leadership Support: emphasize executive briefings, policy-level decisions, elected official concerns, senior leader information needs, political pressure, risk framing, options and consequences, and decision memos or talking points.
Continuity / COOP: emphasize essential functions, alternate worksites, staffing continuity, communications continuity, degraded systems, succession and delegation, continuity of government concerns, and departmental continuity plans.
Recovery Transition: emphasize damage assessment, documentation, debris or cleanup implications, assistance programs, reimbursement considerations, long-term sheltering, community impacts, after-action issues, and transition from response to recovery.

DIFFICULTY CONVERSION
Difficulty should shape tempo, ambiguity, friction, information gaps, resource constraints, media pressure, leadership pressure, and consequence severity without changing the user's selected role or location.

USER SETUP DATA
Location / Jurisdiction: ${form.location}
Event or Hazard: ${form.eventHazard}
Situation Description: ${form.situationDescription}
Exercise Position / Function: ${form.role}
Difficulty: ${form.difficulty}
Training Focus: ${form.trainingFocus.join('; ')}

PREVIEW OUTPUT FORMAT
Use this exact structure in plain text:

Exercise Preview
Location / Jurisdiction:
[Validated real location]
Event or Hazard:
[User-provided event or hazard, cleaned up if needed]
Exercise Position / Function:
[Selected role/function]
Difficulty:
[Selected difficulty]
Training Focus:
[List selected focus areas]
Scenario Summary:
[Short plain-language summary of the custom exercise NEXUS will run.]
This Exercise Will Emphasize:
[Plain-language explanation of the pressures the exercise will apply based on the selected Training Focus.]
This Exercise Will Avoid:
[Clear statement that the exercise will avoid tactical incident command, tactical law enforcement control, suspect tracking, security route planning, tactical unit placement, and field-level command decisions as applicable.]
Ready to Launch:
[One sentence indicating that the scenario is ready for the user to start if the preview looks right.]`
}

function CustomField({ label, helper, children }) {
  return (
    <label style={{ display:'block' }}>
      <div style={{ color:DS.muted, fontSize:10, fontWeight:900, letterSpacing:'0.13em', textTransform:'uppercase', marginBottom:7 }}>{label}</div>
      {children}
      {helper && <div style={{ color:DS.dim, fontSize:11.5, lineHeight:1.45, marginTop:6 }}>{helper}</div>}
    </label>
  )
}

function customInputStyle(multiline=false) {
  return {
    width:'100%',
    minHeight:multiline ? 104 : 42,
    background:DS.bg2,
    color:DS.text,
    border:`1px solid ${DS.borderSoft}`,
    borderRadius:5,
    padding:multiline ? '11px 12px' : '0 12px',
    boxSizing:'border-box',
    fontFamily:'Inter, system-ui, sans-serif',
    fontSize:13,
    lineHeight:1.5,
    outline:'none',
    resize:multiline ? 'vertical' : 'none',
  }
}

export function CustomScenarioCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign:'left',
        borderRadius:4,
        overflow:'hidden',
        border:`1px solid ${DS.border}`,
        background:'rgba(3,14,24,0.84)',
        color:DS.text,
        cursor:'pointer',
        padding:0,
        minWidth:0,
        boxShadow:'0 16px 34px rgba(0,0,0,0.16)',
        display:'flex',
        flexDirection:'column',
      }}
    >
      <div style={{ position:'relative', aspectRatio:'16 / 8', background:'#061522', overflow:'hidden' }}>
        <img src={customScenarioImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(2,9,16,0.03), rgba(2,9,16,0.44))' }} />
      </div>
      <div style={{ padding:'11px 12px 13px', flex:1 }}>
        <div style={{ color:DS.text, fontSize:15, fontWeight:900, marginBottom:7, lineHeight:1.14 }}>Build Custom Scenario</div>
        <div style={{ color:DS.muted, fontSize:12, lineHeight:1.42 }}>Create a guided EOC exercise using your own real-world location, event, and training focus.</div>
        <div style={{ marginTop:10, display:'inline-flex', alignItems:'center', height:22, padding:'0 8px', borderRadius:999, border:`1px solid ${DS.borderSoft}`, color:DS.teal2, fontSize:10, fontWeight:850, letterSpacing:'0.08em', textTransform:'uppercase', background:'rgba(45,226,184,0.08)' }}>
          Custom Exercise
        </div>
      </div>
    </button>
  )
}

export function CustomScenarioSetupModal({ onClose, onStartCustomScenario }) {
  const [form, setForm] = useState(CUSTOM_FORM_DEFAULT)
  const [preview, setPreview] = useState('')
  const [step, setStep] = useState('setup')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [error, setError] = useState('')

  const updateForm = patch => setForm(prev => ({ ...prev, ...patch }))
  const toggleFocus = value => setForm(prev => {
    const has = prev.trainingFocus.includes(value)
    const next = has ? prev.trainingFocus.filter(x => x !== value) : [...prev.trainingFocus, value]
    return { ...prev, trainingFocus: next.length ? next : prev.trainingFocus }
  })

  async function generatePreview() {
    setError('')
    if (!isLocationSpecificEnough(form.location)) {
      setError('I can build this, but I need a real, specific jurisdiction first. Please enter a city and state, county and state, tribal jurisdiction, U.S. territory, or other real jurisdiction.')
      return
    }
    if (isLocationAmbiguous(form.location)) {
      setError(`I need one quick clarification before building the exercise preview: which ${form.location.trim()} do you mean? Add the state, territory, or full jurisdiction name.`)
      return
    }
    if (!form.eventHazard.trim() || !form.situationDescription.trim()) {
      setError('Add the event or hazard and a short situation description before generating the preview.')
      return
    }
    setLoadingPreview(true)
    try {
      const res = await fetch('/api/chat', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          system:'You are NEXUS EOC. Generate only the requested Exercise Preview text. Do not start the exercise.',
          messages:[{ role:'user', content:buildCustomPreviewPrompt(form) }],
        }),
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      setPreview(text.trim() || 'Exercise Preview could not be generated. Revise the setup and try again.')
      setStep('preview')
    } catch(e) {
      setError(`Preview generation failed: ${e.message}`)
    }
    setLoadingPreview(false)
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Custom Scenario Setup" style={{ position:'fixed', inset:0, zIndex:9500, display:'flex', alignItems:'center', justifyContent:'center', padding:'clamp(14px, 2.4vw, 30px)', background:'rgba(1, 7, 13, 0.78)', backdropFilter:'blur(7px)', WebkitBackdropFilter:'blur(7px)', boxSizing:'border-box' }}>
      <div style={{ width:'min(1040px, 96vw)', maxHeight:'92vh', overflow:'hidden', border:`1px solid ${DS.borderStrong}`, borderRadius:10, background:'linear-gradient(135deg, rgba(4,17,29,0.98), rgba(2,9,16,0.98) 60%, rgba(3,13,23,0.98))', boxShadow:'0 28px 90px rgba(0,0,0,0.62), 0 0 42px rgba(46,131,255,0.13)', color:DS.text }}>
        <div style={{ minHeight:76, padding:'18px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:18, borderBottom:`1px solid ${DS.border}`, background:'linear-gradient(90deg, rgba(46,131,255,0.18), rgba(45,226,184,0.06), transparent)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, minWidth:0 }}>
            <NexusLogo variant="primary" tone="dark" size={48} imageStyle={{ maxWidth:260 }} />
            <div style={{ width:1, height:38, background:DS.border, flex:'0 0 auto' }} />
            <div>
              <div style={{ color:DS.teal2, fontSize:12, fontWeight:900, letterSpacing:'0.13em', textTransform:'uppercase' }}>Build Custom Scenario</div>
              <div style={{ color:DS.muted, fontSize:13, marginTop:5 }}>Setup → Preview → Start</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close custom scenario setup" style={{ width:38, height:38, borderRadius:8, border:`1px solid ${DS.border}`, background:'rgba(2,11,19,0.58)', color:DS.text, cursor:'pointer', fontSize:22, lineHeight:1, display:'grid', placeItems:'center' }}>×</button>
        </div>

        <div style={{ padding:'24px 26px', overflowY:'auto', maxHeight:'calc(92vh - 154px)', boxSizing:'border-box' }}>
          {step === 'setup' ? (
            <div style={{ display:'grid', gridTemplateColumns:'1.04fr 0.96fr', gap:22, alignItems:'start' }}>
              <div style={{ display:'grid', gap:16 }}>
                <div>
                  <h2 style={{ margin:'0 0 8px', color:DS.text, fontSize:30, lineHeight:1.1, fontWeight:950 }}>Custom Scenario Setup</h2>
                  <p style={{ margin:0, color:DS.muted, fontSize:14, lineHeight:1.6 }}>Brief NEXUS on the location, event, role, and training focus. NEXUS will turn your inputs into an EOC-focused exercise.</p>
                </div>
                <CustomField label="Location / Jurisdiction" helper="Use a real location. NEXUS EOC does not create fictional jurisdictions.">
                  <input value={form.location} onChange={e => updateForm({ location:e.target.value })} placeholder="Philadelphia, PA" style={customInputStyle()} />
                </CustomField>
                <CustomField label="Event or Hazard" helper="Describe the planned event, hazard, or incident you want to train against.">
                  <input value={form.eventHazard} onChange={e => updateForm({ eventHazard:e.target.value })} placeholder="America's 250th celebration" style={customInputStyle()} />
                </CustomField>
                <CustomField label="Situation Description" helper="Write this in plain language. NEXUS will convert it into a structured EOC exercise.">
                  <textarea value={form.situationDescription} onChange={e => updateForm({ situationDescription:e.target.value })} placeholder="Large national celebration with major crowds, federal and local coordination, VIP presence, transportation disruption, high media attention, and extreme heat risk." style={customInputStyle(true)} />
                </CustomField>
              </div>

              <div style={{ display:'grid', gap:16, border:`1px solid ${DS.border}`, borderRadius:6, background:'rgba(2,11,19,0.40)', padding:18 }}>
                <CustomField label="Select Exercise Position / Function" helper="Role = who the user is playing.">
                  <select value={form.role} onChange={e => updateForm({ role:e.target.value })} style={customInputStyle()}>
                    {Object.entries(ROLE_GROUPS).map(([group, roles]) => (
                      <optgroup key={group} label={group}>
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </CustomField>
                <CustomField label="Select Difficulty" helper="Difficulty controls tempo, ambiguity, friction, and consequence severity.">
                  <select value={form.difficulty} onChange={e => updateForm({ difficulty:e.target.value })} style={customInputStyle()}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </CustomField>
                <div>
                  <div style={{ color:DS.muted, fontSize:10, fontWeight:900, letterSpacing:'0.13em', textTransform:'uppercase', marginBottom:7 }}>Training Focus</div>
                  <div style={{ color:DS.dim, fontSize:11.5, lineHeight:1.45, marginBottom:10 }}>Selected areas drive more injects, friction, decision points, and AAR feedback.</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {TRAINING_FOCUS_OPTIONS.map(opt => {
                      const checked = form.trainingFocus.includes(opt)
                      return (
                        <button key={opt} type="button" onClick={() => toggleFocus(opt)} style={{ textAlign:'left', minHeight:38, borderRadius:5, border:`1px solid ${checked ? DS.borderStrong : DS.border}`, background:checked ? 'rgba(69,163,255,0.16)' : 'rgba(7,20,33,0.72)', color:checked ? DS.text : DS.muted, cursor:'pointer', padding:'8px 10px', fontSize:12, fontWeight:checked ? 850 : 650 }}>
                          <span style={{ color:checked ? DS.teal2 : DS.dim, marginRight:7 }}>{checked ? '✓' : '○'}</span>{opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {error && <div style={{ border:`1px solid rgba(245,155,34,0.55)`, borderRadius:5, background:'rgba(245,155,34,0.10)', color:'#FFD7A1', padding:12, fontSize:13, lineHeight:1.5 }}>{error}</div>}
              </div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'minmax(0, 1fr) 300px', gap:22, alignItems:'start' }}>
              <div>
                <h2 style={{ margin:'0 0 12px', color:DS.text, fontSize:30, lineHeight:1.1, fontWeight:950 }}>Exercise Preview</h2>
                <div style={{ whiteSpace:'pre-wrap', border:`1px solid ${DS.border}`, borderRadius:6, background:'rgba(2,11,19,0.44)', padding:18, color:DS.text, fontSize:14, lineHeight:1.65 }}>{preview}</div>
              </div>
              <aside style={{ border:`1px solid ${DS.border}`, borderRadius:6, background:'rgba(2,11,19,0.48)', padding:16 }}>
                <div style={{ color:DS.teal2, fontSize:11, fontWeight:900, letterSpacing:'0.13em', textTransform:'uppercase', marginBottom:12 }}>Selected Setup</div>
                {[
                  ['Location', form.location],
                  ['Event / Hazard', form.eventHazard],
                  ['Role', form.role],
                  ['Difficulty', form.difficulty],
                  ['Training Focus', form.trainingFocus.join('; ')],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding:'10px 0', borderBottom:`1px solid ${DS.border}` }}>
                    <div style={{ color:DS.dim, fontSize:10, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:4 }}>{label}</div>
                    <div style={{ color:DS.text, fontSize:12.5, lineHeight:1.45 }}>{value}</div>
                  </div>
                ))}
              </aside>
            </div>
          )}
        </div>

        <div style={{ padding:'16px 22px', borderTop:`1px solid ${DS.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, background:'rgba(2,11,19,0.56)' }}>
          <button onClick={step === 'preview' ? () => setStep('setup') : onClose} style={{ height:42, minWidth:128, borderRadius:5, border:`1px solid ${DS.border}`, background:'rgba(3,13,23,0.72)', color:DS.text, fontWeight:850, cursor:'pointer' }}>{step === 'preview' ? 'Revise Setup' : 'Cancel'}</button>
          {step === 'setup' ? (
            <button onClick={generatePreview} disabled={loadingPreview} style={{ height:42, minWidth:210, borderRadius:5, border:`1px solid ${DS.borderStrong}`, background:loadingPreview ? 'rgba(87,146,198,0.16)' : 'linear-gradient(180deg, #1455B8, #0E3F91)', color:'#fff', fontWeight:900, cursor:loadingPreview ? 'not-allowed' : 'pointer', boxShadow:'0 0 22px rgba(46,131,255,0.16)' }}>{loadingPreview ? 'Generating Preview...' : 'Generate Exercise Preview'}</button>
          ) : (
            <button onClick={() => onStartCustomScenario?.({ ...form, preview })} style={{ height:42, minWidth:170, borderRadius:5, border:`1px solid ${DS.teal2}`, background:'linear-gradient(180deg, #168B55, #0D633D)', color:'#fff', fontWeight:900, cursor:'pointer', boxShadow:'0 0 22px rgba(45,226,110,0.14)' }}>Start Exercise</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function StartExercise({ state, update, startScenario, initLoading=false, onMissionPortal, onStartCustomScenario }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [showResources, setShowResources] = useState(false)
  const [showCustomScenario, setShowCustomScenario] = useState(false)
  const [useSpecificJurisdiction, setUseSpecificJurisdiction] = useState(false)
  const [specificJurisdiction, setSpecificJurisdiction] = useState('')
  const [localizedLaunchError, setLocalizedLaunchError] = useState('')

  const scenarioEntries = useMemo(() => Object.entries(SCENARIOS).filter(([key]) => Boolean(SCENARIO_VISUALS[key])), [])
  const scenarioTypes = ['All', 'Natural Hazard', 'Infrastructure', 'Security / CBRN', 'HazMat', 'MCI', 'MCI / HazMat']

  const classifiedScenarios = useMemo(() => {
    return scenarioEntries.map(([key, sc]) => [key, sc, SCENARIO_VISUALS[key]?.tag || 'Exercise'])
  }, [scenarioEntries])

  const filtered = classifiedScenarios.filter(([key, sc, type]) => {
    const visual = SCENARIO_VISUALS[key]
    const q = query.trim().toLowerCase()
    const title = visual?.title || sc.name
    const desc = visual?.desc || sc.desc
    const matchesQuery = !q || title.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || key.toLowerCase().includes(q)
    const matchesFilter = filter === 'All' || type === filter
    return matchesQuery && matchesFilter
  })

  const selectedScenario = state.scenario ? SCENARIOS[state.scenario] : null
  const selectedVisual = state.scenario ? SCENARIO_VISUALS[state.scenario] : null
  const jurisdiction = JURISDICTION_CONTEXT[state.jurisdiction]
  const selectedRole = state.role || 'EOC Director'
  const cleanedSpecificJurisdiction = specificJurisdiction.trim()
  const isLocalizedScenario = useSpecificJurisdiction && Boolean(cleanedSpecificJurisdiction)
  const localizedJurisdictionError = useSpecificJurisdiction
    ? !cleanedSpecificJurisdiction
      ? 'Enter a real, specific jurisdiction or turn off Use Specific Jurisdiction.'
      : isLocationAmbiguous(cleanedSpecificJurisdiction)
        ? `I need one quick clarification before localizing the scenario: which ${cleanedSpecificJurisdiction} do you mean? Add the state, territory, or full jurisdiction name.`
        : !isLocationSpecificEnough(cleanedSpecificJurisdiction)
          ? 'Please enter a real, specific jurisdiction, such as a city and state, county and state, tribal jurisdiction, campus, port, airport, U.S. territory, or other real jurisdiction.'
          : ''
    : ''
  const canLaunch = Boolean(state.scenario) && !initLoading

  function handleStartExercise() {
    setLocalizedLaunchError('')
    if (!canLaunch) return
    if (localizedJurisdictionError) {
      setLocalizedLaunchError(localizedJurisdictionError)
      return
    }
    startScenario(state.scenario, isLocalizedScenario ? { specificJurisdiction: cleanedSpecificJurisdiction } : {})
  }

  return (
    <div style={{ minHeight:'100vh', background:`radial-gradient(circle at 72% 8%, rgba(46,131,255,0.14), transparent 30%), linear-gradient(135deg, ${DS.bg}, #02070D 62%)`, color:DS.text, fontFamily:'Inter, system-ui, sans-serif' }}>
      <div style={{ minHeight:'100vh', backgroundImage:'linear-gradient(rgba(69,163,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(69,163,255,0.045) 1px, transparent 1px)', backgroundSize:'48px 48px' }}>
        <header style={{ height:76, borderBottom:`1px solid ${DS.border}`, background:'linear-gradient(180deg, rgba(2,10,18,0.98), rgba(3,13,22,0.96))', display:'flex', alignItems:'center', justifyContent:'center', boxSizing:'border-box' }}>
          <div style={{ width:'min(100%, 1680px)', padding:'0 clamp(18px, 2vw, 34px)', display:'flex', alignItems:'center', justifyContent:'space-between', boxSizing:'border-box' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, minWidth:0 }}>
              <NexusLogo variant="primary" tone="dark" size={48} imageStyle={{ maxWidth:'min(300px, 34vw)' }} />
              <div style={{ width:1, height:38, background:DS.border, flex:'0 0 auto' }} />
              <div style={{ fontSize:10, color:DS.dim, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:850, whiteSpace:'nowrap' }}>Start Exercise</div>
            </div>
            <nav style={{ display:'flex', alignItems:'center', gap:10 }}>
              <button onClick={onMissionPortal} style={{ background:'rgba(3,13,23,0.72)', color:DS.text, border:`1px solid ${DS.borderStrong}`, borderRadius:4, height:40, padding:'0 16px', cursor:'pointer', fontWeight:800, letterSpacing:'0.04em' }}>Mission Portal</button>
              <a href="/NEXUS_EOC_User_Guide.pdf" target="_blank" rel="noreferrer" style={{ background:'rgba(3,13,23,0.72)', color:DS.text, border:`1px solid ${DS.borderStrong}`, borderRadius:4, height:40, padding:'0 16px', cursor:'pointer', fontWeight:800, letterSpacing:'0.04em', display:'inline-flex', alignItems:'center', textDecoration:'none', boxSizing:'border-box' }}>User Guide</a>
              <a href="/NEXUS_EOC_Reference_List.pdf" target="_blank" rel="noreferrer" style={{ background:'rgba(3,13,23,0.72)', color:DS.text, border:`1px solid ${DS.borderStrong}`, borderRadius:4, height:40, padding:'0 16px', cursor:'pointer', fontWeight:800, letterSpacing:'0.04em', display:'inline-flex', alignItems:'center', textDecoration:'none', boxSizing:'border-box' }}>Reference List</a>
              <button onClick={() => setShowResources(true)} style={{ background:'rgba(3,13,23,0.72)', color:DS.text, border:`1px solid ${DS.borderStrong}`, borderRadius:4, height:40, padding:'0 16px', cursor:'pointer', fontWeight:800, letterSpacing:'0.04em' }}>Resources</button>
            </nav>
          </div>
        </header>

        <main style={{ width:'min(100%, 1680px)', margin:'0 auto', padding:'clamp(14px, 1.4vw, 24px)', boxSizing:'border-box' }}>
          <div style={{ display:'grid', gridTemplateColumns:'minmax(720px, 1fr) 420px', gap:20, alignItems:'start' }}>
            <section style={{ background:'rgba(4, 17, 29, 0.76)', border:`1px solid ${DS.border}`, borderRadius:4, boxShadow:'0 22px 70px rgba(0,0,0,0.28)', overflow:'hidden' }}>
              <div style={{ padding:'22px 24px 18px', borderBottom:`1px solid ${DS.border}` }}>
                <div style={{ color:DS.teal, fontSize:11, textTransform:'uppercase', letterSpacing:'0.18em', fontWeight:900, marginBottom:8 }}>Configure Mission</div>
                <h1 style={{ margin:'0 0 8px', fontSize:36, lineHeight:1.05, letterSpacing:'0.02em', fontWeight:950 }}>Start Exercise</h1>
                <p style={{ margin:0, color:DS.muted, maxWidth:760, lineHeight:1.6, fontSize:14 }}>Select the incident, operating role, jurisdiction, and difficulty profile before launching the live exercise dashboard.</p>
              </div>

              <div style={{ padding:22 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 190px', gap:12, marginBottom:16 }}>
                  <div>
                    <FieldLabel>Select Scenario</FieldLabel>
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search scenarios..." style={{ width:'100%', height:42, background:DS.bg2, color:DS.text, border:`1px solid ${DS.borderSoft}`, borderRadius:5, padding:'0 12px', boxSizing:'border-box', fontSize:13, outline:'none' }} />
                  </div>
                  <div>
                    <FieldLabel>Filter</FieldLabel>
                    <SelectField value={filter} onChange={e => setFilter(e.target.value)}>
                      {scenarioTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </SelectField>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:12, marginBottom:24 }}>
                  {filtered.map(([key, sc]) => {
                    const selected = state.scenario === key
                    const visual = SCENARIO_VISUALS[key]
                    return (
                      <ScenarioCard
                        key={key}
                        scenarioKey={key}
                        scenario={sc}
                        visual={visual}
                        selected={selected}
                        onSelect={(scenarioKey) => update({ scenario:scenarioKey })}
                      />
                    )
                  })}
                  {(filter === 'All' || 'Custom Exercise'.toLowerCase().includes(filter.toLowerCase())) && !query.trim() && (
                    <CustomScenarioCard onClick={() => setShowCustomScenario(true)} />
                  )}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
                  <div>
                    <FieldLabel>Enter Participant Name — Optional</FieldLabel>
                    <input type="text" value={state.playerName || ''} onChange={e => update({ playerName:e.target.value })} placeholder="N. Edwards" maxLength={40} style={{ width:'100%', height:42, background:DS.bg2, color:DS.text, border:`1px solid ${DS.borderSoft}`, borderRadius:5, padding:'0 12px', boxSizing:'border-box', fontSize:13, outline:'none' }} />
                  </div>
                  <div>
                    <FieldLabel>Select Exercise Position / Function</FieldLabel>
                    <SelectField value={selectedRole} onChange={e => update({ role:e.target.value })}>
                      {Object.entries(ROLE_GROUPS).map(([group, roles]) => (
                        <optgroup key={group} label={group}>
                          {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </optgroup>
                      ))}
                    </SelectField>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
                  <div>
                    <FieldLabel>Select Jurisdiction Type</FieldLabel>
                    <SelectField value={state.jurisdiction} onChange={e => update({ jurisdiction:e.target.value })}>
                      {JURISDICTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                    </SelectField>
                  </div>
                  <div>
                    <FieldLabel>Select Difficulty</FieldLabel>
                    <SelectField value={state.difficulty} onChange={e => update({ difficulty:e.target.value })}>
                      {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                    </SelectField>
                  </div>
                </div>

                <div style={{ border:`1px solid ${useSpecificJurisdiction ? DS.borderStrong : DS.borderSoft}`, background:useSpecificJurisdiction ? 'rgba(46,131,255,0.10)' : 'rgba(8,19,31,0.48)', borderRadius:5, padding:14, marginBottom:22 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                    <input
                      type="checkbox"
                      checked={useSpecificJurisdiction}
                      onChange={e => {
                        setUseSpecificJurisdiction(e.target.checked)
                        setLocalizedLaunchError('')
                      }}
                      style={{ width:16, height:16, accentColor:DS.teal }}
                    />
                    <span style={{ color:DS.text, fontSize:13, fontWeight:850 }}>Use a specific real jurisdiction?</span>
                  </label>
                  <div style={{ color:DS.muted, fontSize:12, lineHeight:1.55, marginTop:7 }}>
                    NEXUS will adapt the selected scenario to this real location while preserving the original exercise structure.
                  </div>
                  {useSpecificJurisdiction && (
                    <div style={{ marginTop:12 }}>
                      <FieldLabel>Specific Jurisdiction</FieldLabel>
                      <input
                        type="text"
                        value={specificJurisdiction}
                        onChange={e => {
                          setSpecificJurisdiction(e.target.value)
                          setLocalizedLaunchError('')
                        }}
                        placeholder="Seattle, WA / New Castle County, DE / Port of Long Beach"
                        style={{ width:'100%', height:42, background:DS.bg2, color:DS.text, border:`1px solid ${localizedLaunchError ? 'rgba(226,75,74,0.72)' : DS.borderSoft}`, borderRadius:5, padding:'0 12px', boxSizing:'border-box', fontSize:13, outline:'none' }}
                      />
                      <div style={{ color:DS.dim, fontSize:11.5, lineHeight:1.45, marginTop:6 }}>
                        Use a real city, county, campus, port, airport, tribal jurisdiction, U.S. territory, or other real operational setting.
                      </div>
                      {localizedLaunchError && <div style={{ color:'#FFB4B4', fontSize:12, lineHeight:1.5, marginTop:8 }}>{localizedLaunchError}</div>}
                    </div>
                  )}
                </div>

                <button onClick={handleStartExercise} disabled={!canLaunch} style={{ width:'100%', height:52, border:'none', borderRadius:5, background:canLaunch ? `linear-gradient(180deg, #2E83FF, #1455B8)` : 'rgba(87,146,198,0.16)', color:canLaunch ? '#fff' : DS.dim, cursor:canLaunch ? 'pointer' : 'not-allowed', fontWeight:950, letterSpacing:'0.12em', textTransform:'uppercase', boxShadow:canLaunch ? '0 18px 44px rgba(46,131,255,0.22)' : 'none' }}>
                  {initLoading ? 'Generating Scenario World...' : canLaunch ? 'Start Exercise' : 'Select a scenario to begin'}
                </button>
              </div>
            </section>

            <aside style={{ background:'rgba(4, 17, 29, 0.86)', border:`1px solid ${DS.border}`, borderRadius:4, boxShadow:'0 22px 70px rgba(0,0,0,0.28)', overflow:'hidden', position:'sticky', top:24 }}>
              <div style={{ borderBottom:`1px solid ${DS.border}`, background:'linear-gradient(180deg, rgba(46,131,255,0.12), rgba(4,17,29,0))' }}>
                <div style={{ height: selectedVisual ? 190 : 0, background:'#061522', overflow:'hidden', transition:'height 160ms ease' }}>
                  {selectedVisual && <img src={selectedVisual.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />}
                </div>
                <div style={{ padding:'20px 22px 18px' }}>
                  <div style={{ color:DS.teal, fontSize:11, textTransform:'uppercase', letterSpacing:'0.18em', fontWeight:900, marginBottom:8 }}>Confirm Your Scenario</div>
                  <h2 style={{ margin:0, fontSize:24, lineHeight:1.16, letterSpacing:'-0.01em' }}>{selectedVisual ? selectedVisual.title : selectedScenario ? selectedScenario.name : 'Awaiting Selection'}</h2>
                  <p style={{ color:DS.muted, lineHeight:1.6, fontSize:13, margin:'10px 0 0' }}>{selectedVisual ? selectedVisual.desc : selectedScenario ? selectedScenario.desc : 'Choose a scenario from the mission library to configure the exercise.'}</p>
                  {selectedVisual && (
                    <div style={{ marginTop:12, display:'inline-flex', alignItems:'center', height:24, padding:'0 9px', borderRadius:999, border:`1px solid ${DS.borderSoft}`, color:DS.teal, fontSize:10, fontWeight:850, letterSpacing:'0.08em', textTransform:'uppercase', background:'rgba(69,163,255,0.08)' }}>
                      {selectedVisual.tag}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding:'6px 22px 22px' }}>
                <InfoRow label="Participant" value={state.playerName || 'Not provided'} />
                <InfoRow label="Position / Function" value={selectedRole} accent />
                <div style={{ padding:'12px 0', borderBottom:`1px solid ${DS.borderSoft}` }}>
                  <div style={{ fontSize:10, color:DS.dim, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:4 }}>Functional Focus</div>
                  <div style={{ fontSize:13, color:DS.text, lineHeight:1.55 }}>{ROLES[selectedRole] || 'Role-based EOC decision-making and coordination.'}</div>
                </div>
                <div style={{ padding:'12px 0', borderBottom:`1px solid ${DS.borderSoft}` }}>
                  <div style={{ fontSize:10, color:DS.dim, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:4 }}>Jurisdiction Context</div>
                  <div style={{ fontSize:13, color:DS.text, lineHeight:1.55 }}>{state.jurisdiction}</div>
                  {isLocalizedScenario && <div style={{ fontSize:13, color:DS.teal2, lineHeight:1.55, marginTop:5 }}>Specific Jurisdiction: {cleanedSpecificJurisdiction}</div>}
                  <div style={{ fontSize:12, color:DS.muted, lineHeight:1.55, marginTop:7 }}>{jurisdiction?.desc}</div>
                  <div style={{ fontSize:12, color:DS.dim, lineHeight:1.55, marginTop:7 }}><span style={{ color:DS.amber }}>Constraints:</span> {jurisdiction?.constraints}</div>
                </div>
                <InfoRow label="Difficulty Profile" value={`${state.difficulty} — ${difficultyText[state.difficulty] || ''}`} />
                <div style={{ padding:'14px 0 0' }}>
                  <div style={{ fontSize:10, color:DS.dim, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>Response Guidance</div>
                  <div style={{ border:`1px solid ${DS.borderSoft}`, borderRadius:4, background:'rgba(8,19,31,0.58)', padding:14, color:DS.muted, fontSize:12, lineHeight:1.7 }}>
                    Give clear operational direction. Identify who is responsible, what information you need, what resources are required, and what priority decisions must be made next.
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
        {showResources && <ResourcesModal onClose={() => setShowResources(false)} />}
        {showCustomScenario && (
          <CustomScenarioSetupModal
            onClose={() => setShowCustomScenario(false)}
            onStartCustomScenario={(payload) => {
              setShowCustomScenario(false)
              onStartCustomScenario?.(payload)
            }}
          />
        )}
      </div>
    </div>
  )
}
