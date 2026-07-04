import { useState } from 'react'
import NexusLogo from '../brand/NexusLogo'
import ResourcesModal from '../resources/ResourcesModal'
import { DIFFICULTIES } from '../../data/scenarios'
import { ROLE_GROUPS } from '../../data/roles'
import heroImage from '../../assets/missionPortal/hero-command-center.jpg'
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

const DS = {
  bg:'#020B13',
  border:'rgba(87, 146, 198, 0.30)',
  borderStrong:'rgba(65, 141, 255, 0.62)',
  blue:'#2E83FF',
  blue2:'#45A3FF',
  green:'#2DE26E',
  orange:'#F59B22',
  purple:'#B15CFF',
  text:'#F4F8FE',
  muted:'#B9C8D8',
}

const scenarioCards = [
  { title:'Hurricane Landfall', desc:'Coastal hurricane impacts with evacuation, sheltering, infrastructure, and resource-prioritization pressures.', img:hurricaneImage },
  { title:'Mass Casualty Incident', desc:'High-casualty incident requiring rapid coordination across EMS, hospitals, law enforcement, and public information.', img:mciImage },
  { title:'Hazardous Materials Release', desc:'HazMat incident with protective actions, public warning, environmental monitoring, and multiagency coordination.', img:hazmatImage },
  { title:'Cyber-Infrastructure Cascade', desc:'Cyber disruption affecting water, power, communications, public services, and continuity of operations.', img:cyberImage },
  { title:'Major Earthquake', desc:'Seismic event with damage assessment gaps, degraded communications, medical surge, and resource staging challenges.', img:earthquakeImage },
  { title:'Flash Flood / Dam Failure', desc:'Rapid flooding with downstream warning, evacuations, sheltering, access constraints, and infrastructure risk.', img:floodImage },
  { title:'Urban Wildfire', desc:'Wind-driven fire with evacuation routes, shelter options, air resource coordination, and structure exposure risk.', img:wildfireImage },
  { title:'Winter Storm Cascade', desc:'Extreme winter impacts with power outages, road clearance, warming shelters, fuel, and vulnerable populations.', img:winterImage },
  { title:'Radiological Dispersal Device', desc:'RDD event requiring consequence management, public messaging, federal coordination, and contamination controls.', img:rddImage },
  { title:'Train Derailment — MCI / HazMat', desc:'Rail incident combining casualties, hazardous materials, evacuation decisions, and railroad coordination.', img:trainImage },
]

function Icon({ type, size=28, color=DS.blue2 }) {
  const p = { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:color, strokeWidth:1.7, strokeLinecap:'round', strokeLinejoin:'round' }
  const icons = {
    shield:<><path d="M12 3 20 6v5.7c0 4.8-3.3 7.7-8 9.3-4.7-1.6-8-4.5-8-9.3V6l8-3Z"/><path d="M9 12l2 2 4-5"/></>,
    arrow:<><path d="M5 12h13"/><path d="m13 6 6 6-6 6"/></>,
    play:<><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/></>,
    file:<><path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/></>,
    brain:<><path d="M8.2 6.2A3 3 0 0 1 13.8 5a3.2 3.2 0 0 1 5 3.8 3.4 3.4 0 0 1-.7 6.2 3 3 0 0 1-4.3 3.6 3.5 3.5 0 0 1-5.6 0A3 3 0 0 1 4 15a3.4 3.4 0 0 1-.8-6.2 3.1 3.1 0 0 1 5-2.6Z"/><path d="M12 5v14M8 10h4M12 14h4"/></>,
    org:<><circle cx="12" cy="6" r="2.5"/><circle cx="6" cy="17" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="M12 8.5v3.5M12 12H6v2.5M12 12h6v2.5"/></>,
    map:<><path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/><path d="M12 8.5c1.5 0 2.5 1.1 2.5 2.4 0 2.1-2.5 4.5-2.5 4.5s-2.5-2.4-2.5-4.5c0-1.3 1-2.4 2.5-2.4Z"/></>,
    target:<><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></>,
    person:<><circle cx="12" cy="8" r="3"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></>,
    signal:<><path d="M5 12a7 7 0 0 1 14 0"/><path d="M8 15a4 4 0 0 1 8 0"/><path d="M12 18h.01"/><path d="M12 22V18"/></>,
    chat:<><path d="M4 5h16v11H8l-4 4V5Z"/></>,
  }
  return <svg {...p}>{icons[type] || icons.file}</svg>
}

function Header({ onStartExercise, onGuidedTour, onResources }) {
  return (
    <header style={{ height:76, display:'flex', alignItems:'center', justifyContent:'center', borderBottom:`1px solid ${DS.border}`, background:'linear-gradient(180deg, rgba(2,10,18,0.98), rgba(3,13,22,0.96))', boxSizing:'border-box', flexShrink:0 }}>
      <div style={{ width:'min(100%, 1680px)', padding:'0 clamp(18px, 2vw, 34px)', display:'flex', alignItems:'center', justifyContent:'space-between', boxSizing:'border-box' }}>
        <div style={{ display:'flex', alignItems:'center', minWidth:0 }}>
          <NexusLogo
            variant="primary"
            tone="dark"
            size={56}
            imageStyle={{ maxWidth:'min(360px, 34vw)' }}
          />
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={onGuidedTour} style={{ height:42, padding:'0 16px', display:'flex', alignItems:'center', gap:9, borderRadius:4, border:`1px solid ${DS.borderStrong}`, background:'rgba(3,13,23,0.72)', color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer' }}>
            <Icon type="play" size={19} color={DS.blue2} /> Guided Tour
          </button>
          <a href="/NEXUS_EOC_Platform_Overview.pdf" target="_blank" rel="noreferrer" style={{ height:42, padding:'0 16px', display:'flex', alignItems:'center', gap:9, borderRadius:4, border:`1px solid ${DS.borderStrong}`, background:'rgba(3,13,23,0.72)', color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', textDecoration:'none' }}>
            <Icon type="file" size={19} color={DS.green} /> Overview
          </a>
          <a href="/NEXUS_EOC_User_Guide.pdf" target="_blank" rel="noreferrer" style={{ height:42, padding:'0 16px', display:'flex', alignItems:'center', gap:9, borderRadius:4, border:`1px solid ${DS.borderStrong}`, background:'rgba(3,13,23,0.72)', color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', textDecoration:'none' }}>
            <Icon type="file" size={19} color={DS.blue2} /> User Guide
          </a>
          <button onClick={onStartExercise} style={{ height:42, padding:'0 20px', display:'flex', alignItems:'center', gap:10, borderRadius:4, border:`1px solid ${DS.borderStrong}`, background:'linear-gradient(180deg, #1455B8, #0E3F91)', color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', boxShadow:'0 0 22px rgba(46,131,255,0.16)' }}>
            Start Exercise <Icon type="arrow" size={19} color="#fff" />
          </button>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section style={{ position:'relative', minHeight:'clamp(285px, 34vh, 390px)', border:`1px solid ${DS.border}`, overflow:'hidden', background:'#030E18', borderRadius:4 }}>
      <img src={heroImage} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.86 }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(2,9,16,0.98) 0%, rgba(2,9,16,0.84) 30%, rgba(2,9,16,0.22) 68%, rgba(2,9,16,0.34) 100%)' }} />
      <div style={{ position:'relative', zIndex:2, width:'min(720px, 58%)', padding:'clamp(42px, 5.2vh, 64px) 0 30px clamp(24px, 2.3vw, 42px)', boxSizing:'border-box' }}>
        <h1 style={{ margin:0, color:DS.text, fontSize:'clamp(50px, 4vw, 74px)', lineHeight:1.08, fontWeight:950, letterSpacing:'0.055em' }}>MISSION PORTAL</h1>
        <div style={{ color:DS.blue2, fontSize:'clamp(28px, 2.15vw, 40px)', fontWeight:900, marginTop:9 }}>Train. Decide. Lead.</div>
        <p style={{ color:DS.text, fontSize:'clamp(15px, .95vw, 18px)', lineHeight:1.52, margin:'18px 0 0', maxWidth:560 }}>
          AI-powered emergency operations training for EOCs, emergency managers, and response partners.
        </p>
      </div>
    </section>
  )
}

function CapabilityBand() {
  const cards = [
    ['brain','ADAPTIVE SCENARIO ENGINE','AI-driven injects respond to your decisions for realistic, challenging exercises.', DS.blue2],
    ['org','NRF / ESF-GROUNDED','Exercise positions and capabilities aligned to the National Response Framework.', DS.green],
    ['map','DYNAMIC MAP & LIFELINES','Real-time map updates and lifeline status reflect the evolving operational environment.', DS.orange],
    ['file','AAR & TRANSCRIPT OUTPUTS','Download professional after-action reviews and transcripts in PDF format.', DS.purple],
  ]
  return (
    <section style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0, 1fr))', gap:0, border:`1px solid ${DS.border}`, borderRadius:4, background:'rgba(2,11,19,0.65)', overflow:'hidden' }}>
      {cards.map(([icon,title,body,color], idx) => (
        <div key={title} style={{ display:'grid', gridTemplateColumns:'64px 1fr', gap:12, alignItems:'center', padding:'clamp(12px, 1vw, 16px)', borderRight:idx < cards.length - 1 ? `1px solid ${DS.border}` : 'none', minHeight:92 }}>
          <div style={{ width:60, height:60, borderRadius:'50%', border:`1.5px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(2,11,19,0.35)' }}>
            <Icon type={icon} size={35} color={color} />
          </div>
          <div>
            <div style={{ color, fontSize:12, fontWeight:950, letterSpacing:'0.10em', marginBottom:6 }}>{title}</div>
            <div style={{ color:DS.muted, fontSize:13, lineHeight:1.42 }}>{body}</div>
          </div>
        </div>
      ))}
    </section>
  )
}

function ScenarioCard({ card }) {
  return (
    <div style={{ border:`1px solid ${DS.border}`, borderRadius:4, overflow:'hidden', background:'rgba(3,14,24,0.84)', minWidth:0, display:'flex', flexDirection:'column' }}>
      <div style={{ aspectRatio:'16 / 8', overflow:'hidden', background:'#061522' }}>
        <img src={card.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
      </div>
      <div style={{ padding:'11px 12px 13px', flex:1 }}>
        <div style={{ color:DS.text, fontSize:'clamp(14px, .82vw, 17px)', fontWeight:900, marginBottom:8, lineHeight:1.12 }}>{card.title}</div>
        <div style={{ color:DS.text, fontSize:'clamp(11.5px, .68vw, 13.5px)', lineHeight:1.36 }}>{card.desc}</div>
      </div>
    </div>
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
  const clean = value.trim().toLowerCase()
  return AMBIGUOUS_LOCATIONS.includes(clean)
}

function isLocationSpecificEnough(value='') {
  const clean = value.trim()
  if (!clean) return false
  if (/\b(dc|d\.c\.)\b/i.test(clean)) return true
  if (/\b(nation|tribe|tribal|territory|county|parish|borough)\b/i.test(clean)) return true
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

function Field({ label, helper, children }) {
  return (
    <label style={{ display:'block' }}>
      <div style={{ color:DS.muted, fontSize:10, fontWeight:900, letterSpacing:'0.13em', textTransform:'uppercase', marginBottom:7 }}>{label}</div>
      {children}
      {helper && <div style={{ color:DS.dim, fontSize:11.5, lineHeight:1.45, marginTop:6 }}>{helper}</div>}
    </label>
  )
}

function inputStyle(multiline=false) {
  return {
    width:'100%',
    minHeight:multiline ? 104 : 42,
    background:'#071421',
    color:DS.text,
    border:`1px solid ${DS.border}`,
    borderRadius:5,
    padding:multiline ? '11px 12px' : '0 12px',
    boxSizing:'border-box',
    fontFamily:'Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    fontSize:13,
    lineHeight:1.5,
    outline:'none',
    resize:multiline ? 'vertical' : 'none',
  }
}

function CustomScenarioCard({ onClick }) {
  return (
    <button onClick={onClick} style={{ border:`1px solid ${DS.borderStrong}`, borderRadius:4, overflow:'hidden', background:'linear-gradient(180deg, rgba(46,131,255,0.16), rgba(3,14,24,0.88))', minWidth:0, display:'flex', flexDirection:'column', color:DS.text, cursor:'pointer', padding:0, textAlign:'left', boxShadow:'0 0 34px rgba(69,163,255,0.10)' }}>
      <div style={{ aspectRatio:'16 / 8', position:'relative', overflow:'hidden', background:'radial-gradient(circle at 42% 44%, rgba(45,226,184,0.22), transparent 18%), radial-gradient(circle at 62% 36%, rgba(69,163,255,0.28), transparent 22%), linear-gradient(135deg, #061522, #020B13)' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(69,163,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(69,163,255,0.10) 1px, transparent 1px)', backgroundSize:'26px 26px', opacity:0.82 }} />
        <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%, -50%)', width:72, height:72, borderRadius:'50%', border:`1.8px solid ${DS.blue2}`, display:'grid', placeItems:'center', background:'rgba(2,11,19,0.62)', boxShadow:'0 0 30px rgba(69,163,255,0.28)' }}>
          <div style={{ position:'absolute', width:28, height:28, borderRadius:'50%', background:DS.blue2, color:'#04101B', display:'grid', placeItems:'center', fontSize:26, fontWeight:950, right:-5, top:-5 }}>+</div>
          <Icon type="map" size={42} color={DS.green} />
        </div>
        <div style={{ position:'absolute', top:9, left:9, fontSize:10, color:'#04101B', background:DS.green, borderRadius:999, padding:'4px 8px', fontWeight:950, letterSpacing:'0.08em' }}>CUSTOM EXERCISE</div>
      </div>
      <div style={{ padding:'11px 12px 13px', flex:1 }}>
        <div style={{ color:DS.text, fontSize:'clamp(14px, .82vw, 17px)', fontWeight:900, marginBottom:8, lineHeight:1.12 }}>Build Custom Scenario</div>
        <div style={{ color:DS.text, fontSize:'clamp(11.5px, .68vw, 13.5px)', lineHeight:1.36 }}>Create a guided EOC exercise using your own real-world location, event, and training focus.</div>
      </div>
    </button>
  )
}

function CustomScenarioSetupModal({ onClose, onStartCustomScenario }) {
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
              <div style={{ color:DS.green, fontSize:12, fontWeight:900, letterSpacing:'0.13em', textTransform:'uppercase' }}>Build Custom Scenario</div>
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
                <Field label="Location / Jurisdiction" helper="Use a real location. NEXUS EOC does not create fictional jurisdictions.">
                  <input value={form.location} onChange={e => updateForm({ location:e.target.value })} placeholder="Philadelphia, PA" style={inputStyle()} />
                </Field>
                <Field label="Event or Hazard" helper="Describe the planned event, hazard, or incident you want to train against.">
                  <input value={form.eventHazard} onChange={e => updateForm({ eventHazard:e.target.value })} placeholder="America's 250th celebration" style={inputStyle()} />
                </Field>
                <Field label="Situation Description" helper="Write this in plain language. NEXUS will convert it into a structured EOC exercise.">
                  <textarea value={form.situationDescription} onChange={e => updateForm({ situationDescription:e.target.value })} placeholder="Large national celebration with major crowds, federal and local coordination, VIP presence, transportation disruption, high media attention, and extreme heat risk." style={inputStyle(true)} />
                </Field>
              </div>

              <div style={{ display:'grid', gap:16, border:`1px solid ${DS.border}`, borderRadius:6, background:'rgba(2,11,19,0.40)', padding:18 }}>
                <Field label="Select Exercise Position / Function" helper="Role = who the user is playing.">
                  <select value={form.role} onChange={e => updateForm({ role:e.target.value })} style={inputStyle()}>
                    {Object.entries(ROLE_GROUPS).map(([group, roles]) => (
                      <optgroup key={group} label={group}>
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </Field>
                <Field label="Select Difficulty" helper="Difficulty controls tempo, ambiguity, friction, and consequence severity.">
                  <select value={form.difficulty} onChange={e => updateForm({ difficulty:e.target.value })} style={inputStyle()}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>
                <div>
                  <div style={{ color:DS.muted, fontSize:10, fontWeight:900, letterSpacing:'0.13em', textTransform:'uppercase', marginBottom:7 }}>Training Focus</div>
                  <div style={{ color:DS.dim, fontSize:11.5, lineHeight:1.45, marginBottom:10 }}>Selected areas drive more injects, friction, decision points, and AAR feedback.</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {TRAINING_FOCUS_OPTIONS.map(opt => {
                      const checked = form.trainingFocus.includes(opt)
                      return (
                        <button key={opt} type="button" onClick={() => toggleFocus(opt)} style={{ textAlign:'left', minHeight:38, borderRadius:5, border:`1px solid ${checked ? DS.borderStrong : DS.border}`, background:checked ? 'rgba(69,163,255,0.16)' : 'rgba(7,20,33,0.72)', color:checked ? DS.text : DS.muted, cursor:'pointer', padding:'8px 10px', fontSize:12, fontWeight:checked ? 850 : 650 }}>
                          <span style={{ color:checked ? DS.green : DS.dim, marginRight:7 }}>{checked ? '✓' : '○'}</span>{opt}
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
                <div style={{ color:DS.green, fontSize:11, fontWeight:900, letterSpacing:'0.13em', textTransform:'uppercase', marginBottom:12 }}>Selected Setup</div>
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
            <button onClick={() => onStartCustomScenario?.({ ...form, preview })} style={{ height:42, minWidth:170, borderRadius:5, border:`1px solid ${DS.green}`, background:'linear-gradient(180deg, #168B55, #0D633D)', color:'#fff', fontWeight:900, cursor:'pointer', boxShadow:'0 0 22px rgba(45,226,110,0.14)' }}>Start Exercise</button>
          )}
        </div>
      </div>
    </div>
  )
}

function FeaturedScenarios({ onBuildCustomScenario }) {
  return (
    <section style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:'rgba(3,13,23,0.50)', padding:'12px 14px 14px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ color:DS.text, fontSize:18, fontWeight:900, letterSpacing:'0.04em', borderLeft:`2px solid ${DS.blue2}`, paddingLeft:8 }}>FEATURED SCENARIOS</div>
      </div>
      <div className="nexus-scenario-grid" style={{ display:'grid', gap:'clamp(10px, .85vw, 14px)' }}>
        {scenarioCards.map(card => <ScenarioCard key={card.title} card={card} />)}
        <CustomScenarioCard onClick={onBuildCustomScenario} />
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    ['target','1. Select a Scenario','Choose an emergency operations exercise that matches your training objectives.'],
    ['person','2. Configure the Exercise','Select your exercise position/function, jurisdiction, and difficulty level.'],
    ['signal','3. Respond to Injects','Review situation updates, map changes, media feeds, and operational flash cards.'],
    ['chat','4. Make Decisions','Submit detailed EOC-style responses as the scenario evolves.'],
    ['file','5. Review Outputs','Download the transcript and After-Action Review PDF.'],
  ]
  return (
    <section style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:'rgba(3,13,23,0.48)', padding:'12px 18px 12px' }}>
      <div style={{ color:DS.text, fontSize:18, fontWeight:900, letterSpacing:'0.04em', borderLeft:`2px solid ${DS.blue2}`, paddingLeft:8, marginBottom:14 }}>HOW NEXUS EOC WORKS</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(230px, 1fr))', gap:'clamp(12px, 1.2vw, 22px)', alignItems:'start' }}>
        {steps.map(([icon,title,body], idx) => (
          <div key={title} style={{ display:'grid', gridTemplateColumns:'62px 1fr', gap:11, position:'relative' }}>
            <div style={{ position:'relative', width:56, height:56, borderRadius:'50%', border:`1px solid ${DS.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon type={icon} size={30} color="#DDE8F5" />
              <div style={{ position:'absolute', top:-7, left:-7, width:22, height:22, borderRadius:'50%', border:`1px solid ${DS.blue2}`, color:DS.blue2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, background:'#03101C' }}>{idx+1}</div>
            </div>
            <div>
              <div style={{ color:'#CBE4FF', fontWeight:900, fontSize:13, marginBottom:6 }}>{title}</div>
              <div style={{ color:DS.text, fontSize:12.5, lineHeight:1.38 }}>{body}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign:'center', color:DS.blue2, fontSize:14, marginTop:13 }}>
        ★ &nbsp; More detailed responses produce stronger injects, feedback, and after-action insights.
      </div>
    </section>
  )
}


const tourSteps = [
  {
    title:'Welcome to NEXUS EOC',
    icon:'shield',
    accent:DS.blue2,
    text:[
      'NEXUS EOC is a simulated emergency operations training platform built around realistic, scenario-based decision exercises.',
      'This short tour will show you how to configure an exercise, respond to injects, and review your outputs.',
    ],
  },
  {
    title:'Mission Portal',
    icon:'target',
    accent:DS.blue2,
    text:[
      'The Mission Portal is your starting point. From here, you can start a new exercise, launch this guided tour, review featured scenarios, and see the basic exercise flow.',
    ],
  },
  {
    title:'Start Exercise',
    icon:'person',
    accent:DS.green,
    text:[
      'Use the Start Exercise screen to select a scenario, choose your exercise position or function, set the jurisdiction, select difficulty, and launch the live simulation.',
    ],
  },
  {
    title:'Live Exercise Interface',
    icon:'map',
    accent:DS.orange,
    text:[
      'The Live Exercise screen is where the simulation happens. Review the current inject, monitor flash cards and media updates, use the map and reference desk, and submit operational responses as the scenario evolves.',
    ],
  },
  {
    title:'Panel Info Icons',
    icon:'file',
    accent:DS.purple,
    text:[
      'Most panels include a small information icon next to the title. Click the ⓘ icon to learn what that panel does, how to interact with it, and what information it provides during the exercise.',
    ],
    visual:'ⓘ',
  },
  {
    title:'End Exercise / Generate AAR',
    icon:'chat',
    accent:DS.orange,
    text:[
      'When you are ready to stop, select End Exercise. You can generate an After-Action Review or exit without creating a report.',
    ],
  },
  {
    title:'Download Reports',
    icon:'file',
    accent:DS.green,
    text:[
      'After an AAR is generated, you can download two PDF outputs: the After-Action Review and the full Exercise Transcript.',
    ],
  },
]

function GuidedTourModal({ onClose }) {
  const [stepIndex, setStepIndex] = useState(0)
  const step = tourSteps[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === tourSteps.length - 1

  const close = () => {
    setStepIndex(0)
    onClose?.()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Guided Tour"
      style={{
        position:'fixed',
        inset:0,
        zIndex:9000,
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        padding:'clamp(16px, 3vw, 34px)',
        background:'rgba(1, 7, 13, 0.76)',
        backdropFilter:'blur(7px)',
        WebkitBackdropFilter:'blur(7px)',
        boxSizing:'border-box'
      }}
    >
      <div
        style={{
          width:'min(760px, 96vw)',
          border:`1px solid ${DS.borderStrong}`,
          borderRadius:10,
          overflow:'hidden',
          background:'linear-gradient(135deg, rgba(4,17,29,0.98), rgba(2,9,16,0.98) 58%, rgba(3,13,23,0.98))',
          boxShadow:'0 28px 90px rgba(0,0,0,0.62), 0 0 42px rgba(46,131,255,0.13)',
          color:DS.text
        }}
      >
        <div style={{
          minHeight:76,
          padding:'18px 22px',
          display:'flex',
          alignItems:'center',
          justifyContent:'space-between',
          gap:18,
          borderBottom:`1px solid ${DS.border}`,
          background:'linear-gradient(90deg, rgba(46,131,255,0.18), rgba(45,226,184,0.06), transparent)'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, minWidth:0 }}>
            <NexusLogo variant="primary" tone="dark" size={48} imageStyle={{ maxWidth:260 }} />
            <div style={{ width:1, height:38, background:DS.border, flex:'0 0 auto' }} />
            <div style={{ color:DS.blue2, fontSize:13, fontWeight:850, letterSpacing:'0.10em', textTransform:'uppercase', whiteSpace:'nowrap' }}>Guided Tour</div>
          </div>

          <button
            onClick={close}
            aria-label="Close guided tour"
            style={{
              width:38,
              height:38,
              borderRadius:8,
              border:`1px solid ${DS.border}`,
              background:'rgba(2,11,19,0.58)',
              color:DS.text,
              cursor:'pointer',
              fontSize:22,
              lineHeight:1,
              display:'grid',
              placeItems:'center'
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          padding:'26px 28px 24px',
          display:'grid',
          gridTemplateColumns:'120px 1fr',
          gap:24,
          alignItems:'start'
        }}>
          <div style={{
            width:112,
            height:112,
            borderRadius:22,
            border:`1.5px solid ${step.accent}`,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            background:`linear-gradient(135deg, ${step.accent}18, rgba(2,11,19,0.70))`,
            boxShadow:`0 18px 46px ${step.accent}12`,
            color:step.accent,
            fontSize:52,
            fontWeight:900
          }}>
            {step.visual || <Icon type={step.icon} size={58} color={step.accent} />}
          </div>

          <div>
            <div style={{ color:DS.muted, fontSize:12, fontWeight:900, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:10 }}>
              Step {stepIndex + 1} of {tourSteps.length}
            </div>
            <h2 style={{ margin:0, color:DS.text, fontSize:'clamp(28px, 3vw, 38px)', lineHeight:1.06, fontWeight:950, letterSpacing:'0.025em' }}>
              {step.title}
            </h2>
            <div style={{ marginTop:18, display:'grid', gap:13 }}>
              {step.text.map((line, idx) => (
                <p key={idx} style={{ margin:0, color:DS.text, opacity:0.90, fontSize:16, lineHeight:1.58 }}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding:'0 28px 18px' }}>
          <div style={{ height:7, borderRadius:99, background:'rgba(87,146,198,0.18)', overflow:'hidden', border:`1px solid ${DS.border}` }}>
            <div style={{
              width:`${((stepIndex + 1) / tourSteps.length) * 100}%`,
              height:'100%',
              background:`linear-gradient(90deg, ${DS.blue2}, ${DS.green})`,
              transition:'width 160ms ease'
            }} />
          </div>
          <div style={{ display:'flex', justifyContent:'center', gap:7, marginTop:13 }}>
            {tourSteps.map((_, idx) => (
              <span
                key={idx}
                style={{
                  width:idx === stepIndex ? 22 : 8,
                  height:8,
                  borderRadius:99,
                  background:idx === stepIndex ? DS.blue2 : 'rgba(185,200,216,0.28)',
                  transition:'all 160ms ease'
                }}
              />
            ))}
          </div>
        </div>

        <div style={{
          padding:'16px 22px',
          borderTop:`1px solid ${DS.border}`,
          display:'flex',
          justifyContent:'space-between',
          alignItems:'center',
          gap:12,
          background:'rgba(2,11,19,0.56)'
        }}>
          <button
            onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
            disabled={isFirst}
            style={{
              height:42,
              minWidth:108,
              borderRadius:5,
              border:`1px solid ${isFirst ? 'rgba(87,146,198,0.18)' : DS.border}`,
              background:isFirst ? 'rgba(5,15,25,0.30)' : 'rgba(3,13,23,0.72)',
              color:isFirst ? 'rgba(185,200,216,0.35)' : DS.text,
              fontWeight:850,
              cursor:isFirst ? 'not-allowed' : 'pointer'
            }}
          >
            Back
          </button>

          <button
            onClick={() => isLast ? close() : setStepIndex(Math.min(tourSteps.length - 1, stepIndex + 1))}
            style={{
              height:42,
              minWidth:124,
              borderRadius:5,
              border:`1px solid ${isLast ? DS.green : DS.borderStrong}`,
              background:isLast ? 'linear-gradient(180deg, #168B55, #0D633D)' : 'linear-gradient(180deg, #1455B8, #0E3F91)',
              color:'#fff',
              fontWeight:900,
              cursor:'pointer',
              boxShadow:`0 0 22px ${isLast ? 'rgba(45,226,110,0.14)' : 'rgba(46,131,255,0.16)'}`
            }}
          >
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}



function AboutNexusModal({ onClose }) {
  const valueCards = [
    {
      icon:'target',
      title:'Practical Training',
      text:'Realistic scenarios and hands-on decision exercises.',
    },
    {
      icon:'person',
      title:'Better Decisions',
      text:'Sharpen skills, test plans, and improve outcomes under pressure.',
    },
    {
      icon:'shield',
      title:'Stronger Response',
      text:'Build confidence and readiness before your community needs it most.',
    },
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="About NEXUS EOC"
      style={{
        position:'fixed',
        inset:0,
        zIndex:9998,
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        padding:24,
        background:'rgba(1, 7, 13, 0.76)',
        backdropFilter:'blur(7px)',
        WebkitBackdropFilter:'blur(7px)',
        boxSizing:'border-box'
      }}
    >
      <div style={{
        width:'min(1040px, 92vw)',
        maxHeight:'88vh',
        overflowY:'auto',
        border:'1px solid rgba(87,146,198,0.42)',
        borderRadius:10,
        background:'linear-gradient(135deg, rgba(4,17,29,0.98), rgba(2,9,16,0.98) 58%, rgba(3,13,23,0.98))',
        boxShadow:'0 28px 90px rgba(0,0,0,0.62), 0 0 42px rgba(46,131,255,0.13)',
        color:'#F4F8FE'
      }}>
        <div style={{
          minHeight:76,
          padding:'18px 22px',
          display:'flex',
          alignItems:'center',
          justifyContent:'space-between',
          gap:18,
          borderBottom:'1px solid rgba(87,146,198,0.24)',
          background:'linear-gradient(90deg, rgba(46,131,255,0.18), rgba(45,226,184,0.06), transparent)'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, minWidth:0 }}>
            <NexusLogo variant="primary" tone="dark" size={50} imageStyle={{ maxWidth:280 }} />
            <div style={{ width:1, height:40, background:'rgba(87,146,198,0.24)', flex:'0 0 auto' }} />
            <div style={{ color:'#2DE2B8', fontSize:13, fontWeight:850, letterSpacing:'0.12em', textTransform:'uppercase', whiteSpace:'nowrap' }}>About NEXUS EOC</div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close About NEXUS EOC"
            style={{
              width:40,
              height:40,
              borderRadius:8,
              border:'1px solid rgba(87,146,198,0.24)',
              background:'rgba(2,11,19,0.58)',
              color:'#F4F8FE',
              cursor:'pointer',
              fontSize:26,
              lineHeight:1,
              display:'grid',
              placeItems:'center'
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          display:'grid',
          gridTemplateColumns:'minmax(260px, 0.88fr) minmax(320px, 1.12fr)',
          gap:32,
          padding:'28px 34px 24px',
          alignItems:'stretch'
        }}>
          <div style={{
            border:'1px solid rgba(45,226,184,0.22)',
            borderRadius:8,
            overflow:'hidden',
            background:'linear-gradient(180deg, rgba(5,24,39,0.76), rgba(2,10,18,0.96))',
            minHeight:330,
            display:'flex',
            flexDirection:'column',
            justifyContent:'center',
            padding:'34px 34px',
            boxSizing:'border-box'
          }}>
            <div style={{
              color:'#2DE2B8',
              fontSize:13,
              fontWeight:900,
              letterSpacing:'0.14em',
              textTransform:'uppercase',
              marginBottom:18
            }}>
              Mission
            </div>

            <div style={{
              borderLeft:'3px solid #2DE2B8',
              paddingLeft:20,
              color:'#F4F8FE'
            }}>
              <div style={{ color:'#2DE2B8', fontSize:24, lineHeight:1.45, fontWeight:850 }}>
                Train before the incident.
              </div>
              <div style={{ color:'#2DE2B8', fontSize:24, lineHeight:1.45, fontWeight:850 }}>
                Decide with confidence.
              </div>
              <div style={{ color:'#2DE2B8', fontSize:24, lineHeight:1.45, fontWeight:850 }}>
                Lead when it matters.
              </div>
            </div>

            <div style={{
              height:1,
              background:'linear-gradient(90deg, rgba(45,226,184,0.52), rgba(45,226,184,0))',
              margin:'30px 0 22px'
            }} />

            <p style={{
              margin:0,
              color:'#B9C8D8',
              fontSize:15,
              lineHeight:1.58
            }}>
              NEXUS EOC focuses on practical emergency operations decision-making, not passive slide-based training.
            </p>
          </div>

          <div style={{ display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <h2 style={{
              margin:'0 0 14px',
              color:'#F4F8FE',
              fontSize:'clamp(26px, 2.4vw, 32px)',
              lineHeight:1.1,
              fontWeight:950,
              letterSpacing:'0.01em'
            }}>
              Built by a practitioner. For practitioners.
            </h2>
            <div style={{
              width:64,
              height:2,
              background:'linear-gradient(90deg, #2DE2B8, rgba(45,226,184,0))',
              margin:'0 0 22px'
            }} />

            <div style={{ display:'grid', gap:18, color:'#F4F8FE', fontSize:16, lineHeight:1.58 }}>
              <p style={{ margin:0 }}>
                <span style={{ color:'#2DE2B8', fontWeight:900 }}>Nick Edwards</span> created NEXUS EOC to improve emergency operations training through realistic, scenario-based decision exercises.
              </p>
              <p style={{ margin:0 }}>
                The platform draws on experience in emergency management, continuity, military operations, emergency communications, remote sensing, and training design.
              </p>
              <p style={{ margin:0 }}>
                NEXUS EOC is built for emergency managers, EOCs, public safety partners, and response organizations that need practical decision-making reps before the real incident happens.
              </p>
            </div>
          </div>
        </div>

        <div style={{
          margin:'0 34px',
          borderTop:'1px solid rgba(87,146,198,0.24)',
          padding:'22px 0',
          display:'grid',
          gridTemplateColumns:'repeat(3, 1fr)',
          gap:16
        }}>
          {valueCards.map((card, idx) => (
            <div key={card.title} style={{
              display:'grid',
              gridTemplateColumns:'46px 1fr',
              gap:12,
              padding:idx === 1 ? '0 16px' : '0',
              borderLeft:idx === 0 ? 'none' : '1px solid rgba(87,146,198,0.22)'
            }}>
              <div style={{
                width:42,
                height:42,
                borderRadius:14,
                border:'1px solid rgba(45,226,184,0.58)',
                display:'grid',
                placeItems:'center',
                color:'#2DE2B8',
                background:'rgba(45,226,184,0.08)',
                boxShadow:'0 0 18px rgba(45,226,184,0.10)'
              }}>
                <Icon type={card.icon} size={28} color="#2DE2B8" />
              </div>
              <div>
                <div style={{ color:'#2DE2B8', fontSize:14, fontWeight:900, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:5 }}>{card.title}</div>
                <div style={{ color:'#B9C8D8', fontSize:14, lineHeight:1.45 }}>{card.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          padding:'0 34px 26px',
          display:'flex',
          justifyContent:'center'
        }}>
          <button
            onClick={onClose}
            style={{
              height:46,
              minWidth:210,
              borderRadius:5,
              border:'1px solid rgba(45,226,184,0.58)',
              background:'linear-gradient(180deg, rgba(3,13,23,0.82), rgba(2,11,19,0.92))',
              color:'#F4F8FE',
              fontSize:16,
              fontWeight:850,
              cursor:'pointer',
              boxShadow:'0 0 24px rgba(45,226,184,0.10)'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}


export default function MissionPortal({ onStartExercise, onStartCustomScenario }) {
  const [showAboutNexus, setShowAboutNexus] = useState(false)
  const [showGuidedTour, setShowGuidedTour] = useState(false)
  const [showResources, setShowResources] = useState(false)
  const [showCustomScenario, setShowCustomScenario] = useState(false)
  return (
    <div style={{ width:'100vw', minHeight:'100vh', background:`radial-gradient(circle at 22% 18%, rgba(46,131,255,0.12), transparent 34%), linear-gradient(135deg, ${DS.bg}, #02070D 62%)`, color:DS.text, fontFamily:'Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif', overflow:'hidden' }}>
      <style>{`
        .nexus-scenario-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
        @media (max-width: 1280px) { .nexus-scenario-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        @media (max-width: 980px) { .nexus-scenario-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      `}</style>
      <Header onStartExercise={onStartExercise || (() => {})} onGuidedTour={() => setShowGuidedTour(true)} onResources={() => setShowResources(true)} />
      <main style={{ height:'calc(100vh - 76px)', overflowY:'auto', overflowX:'hidden', padding:'clamp(12px, 1.2vw, 20px)', boxSizing:'border-box' }}>
        <div style={{ width:'min(100%, 1680px)', margin:'0 auto', display:'flex', flexDirection:'column', gap:12 }}>
          <Hero />
          <CapabilityBand />
          <FeaturedScenarios onBuildCustomScenario={() => setShowCustomScenario(true)} />
          <HowItWorks />
          <footer style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:26, color:DS.muted, fontSize:14, padding:'18px 20px 24px' }}>
        <span>© 2026 NEXUS EOC. All rights reserved.</span>
        <button
          onClick={() => setShowResources(true)}
          style={{
            background:'transparent',
            border:'none',
            color:DS.blue2,
            fontSize:14,
            fontWeight:800,
            cursor:'pointer',
            textDecoration:'none',
            padding:0,
          }}
        >
          Resources
        </button>
        <button
          onClick={() => setShowAboutNexus(true)}
          style={{
            border:'none',
            background:'transparent',
            color:DS.green || '#2DE2B8',
            font:'inherit',
            fontWeight:800,
            cursor:'pointer',
            padding:0
          }}
        >
          About NEXUS EOC
        </button>
      </footer>
        </div>
      </main>
          {showGuidedTour && <GuidedTourModal onClose={() => setShowGuidedTour(false)} />}
      {showAboutNexus && <AboutNexusModal onClose={() => setShowAboutNexus(false)} />}
      {showResources && <ResourcesModal onClose={() => setShowResources(false)} />}
      {showCustomScenario && <CustomScenarioSetupModal onClose={() => setShowCustomScenario(false)} onStartCustomScenario={(payload) => { setShowCustomScenario(false); onStartCustomScenario?.(payload) }} />}
    </div>
  )
}
