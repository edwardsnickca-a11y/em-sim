import { SCENARIOS } from '../../data/scenarios'
import heroImage from '../../assets/missionPortal/hero-command-center.jpg'
import hurricaneImage from '../../assets/missionPortal/scenarios/hurricane.svg'
import mciImage from '../../assets/missionPortal/scenarios/mci.svg'
import hazmatImage from '../../assets/missionPortal/scenarios/hazmat.svg'
import cyberImage from '../../assets/missionPortal/scenarios/cyber.svg'
import earthquakeImage from '../../assets/missionPortal/scenarios/earthquake.svg'
import floodImage from '../../assets/missionPortal/scenarios/flood.svg'
import wildfireImage from '../../assets/missionPortal/scenarios/wildfire.svg'
import winterImage from '../../assets/missionPortal/scenarios/winter.svg'
import rddImage from '../../assets/missionPortal/scenarios/rdd.svg'
import trainImage from '../../assets/missionPortal/scenarios/train.svg'

const DS = {
  bg:'#020B13',
  panel:'rgba(4, 17, 29, 0.78)',
  border:'rgba(87, 146, 198, 0.30)',
  borderStrong:'rgba(65, 141, 255, 0.62)',
  blue:'#2E83FF',
  blue2:'#45A3FF',
  cyan:'#19D3E6',
  green:'#2DE26E',
  orange:'#F59B22',
  purple:'#B15CFF',
  red:'#EA3F44',
  text:'#F4F8FE',
  muted:'#B9C8D8',
  dim:'#7C91A6',
}

const scenarioImages = {
  hurricane:hurricaneImage,
  mci:mciImage,
  hazmat:hazmatImage,
  cyber:cyberImage,
  earthquake:earthquakeImage,
  flood:floodImage,
  wildfire:wildfireImage,
  winter:winterImage,
  rdd:rddImage,
  train:trainImage,
}

const scenarioOrder = ['hurricane','mci','hazmat','cyber','earthquake','flood','wildfire','winter','rdd','train']

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

function Header({ onStartExercise, onGuidedTour }) {
  return (
    <header style={{
      height:76,
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      borderBottom:`1px solid ${DS.border}`,
      background:'linear-gradient(180deg, rgba(2,10,18,0.98), rgba(3,13,22,0.96))',
      boxSizing:'border-box',
      flexShrink:0,
    }}>
      <div style={{ width:'min(100%, 1680px)', padding:'0 clamp(18px, 2vw, 34px)', display:'flex', alignItems:'center', justifyContent:'space-between', boxSizing:'border-box' }}>
        <div style={{ display:'flex', alignItems:'center', gap:18 }}>
          <Icon type="shield" size={46} color={DS.blue2} />
          <div style={{ fontSize:'clamp(26px, 1.7vw, 34px)', fontWeight:900, color:DS.text, letterSpacing:'0.08em', whiteSpace:'nowrap' }}>NEXUS EOC</div>
          <div style={{ width:1, height:38, background:DS.border, margin:'0 2px' }} />
          <div style={{ color:DS.text, fontSize:'clamp(12px, .74vw, 15px)', lineHeight:1.25 }}>
            Simulated Emergency<br />Operations Platform
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onGuidedTour} title="TODO: wire to existing guided tour modal" style={{
            height:42,
            padding:'0 17px',
            display:'flex',
            alignItems:'center',
            gap:10,
            borderRadius:4,
            border:`1px solid ${DS.borderStrong}`,
            background:'rgba(3,13,23,0.70)',
            color:'#fff',
            fontWeight:800,
            fontSize:15,
            cursor:'default',
          }}>
            <Icon type="play" size={20} color={DS.blue2} /> Guided Tour
          </button>
          <button onClick={onStartExercise} style={{
            height:42,
            padding:'0 20px',
            display:'flex',
            alignItems:'center',
            gap:10,
            borderRadius:4,
            border:`1px solid ${DS.borderStrong}`,
            background:'linear-gradient(180deg, #1455B8, #0E3F91)',
            color:'#fff',
            fontWeight:800,
            fontSize:15,
            cursor:'pointer',
            boxShadow:'0 0 22px rgba(46,131,255,0.16)',
          }}>
            Start Exercise <Icon type="arrow" size={19} color="#fff" />
          </button>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section style={{
      position:'relative',
      minHeight:'clamp(240px, 29vh, 330px)',
      border:`1px solid ${DS.border}`,
      overflow:'hidden',
      background:'#030E18',
      borderRadius:4,
    }}>
      <img src={heroImage} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.86 }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(2,9,16,0.98) 0%, rgba(2,9,16,0.84) 30%, rgba(2,9,16,0.22) 68%, rgba(2,9,16,0.34) 100%)' }} />
      <div style={{ position:'relative', zIndex:2, width:'min(720px, 58%)', padding:'clamp(28px, 3.8vh, 46px) 0 30px clamp(24px, 2.3vw, 42px)', boxSizing:'border-box' }}>
        <h1 style={{ margin:0, color:DS.text, fontSize:'clamp(50px, 4vw, 74px)', lineHeight:0.98, fontWeight:950, letterSpacing:'0.055em' }}>
          MISSION PORTAL
        </h1>
        <div style={{ color:DS.blue2, fontSize:'clamp(28px, 2.15vw, 40px)', fontWeight:900, marginTop:9 }}>
          Train. Decide. Lead.
        </div>
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
    <section style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:0, border:`1px solid ${DS.border}`, borderRadius:4, background:'rgba(2,11,19,0.65)', overflow:'hidden' }}>
      {cards.map(([icon,title,body,color], idx) => (
        <div key={title} style={{ display:'grid', gridTemplateColumns:'70px 1fr', gap:14, alignItems:'center', padding:'clamp(13px, 1.1vw, 18px)', borderRight:idx < cards.length - 1 ? `1px solid ${DS.border}` : 'none', minHeight:96 }}>
          <div style={{ width:66, height:66, borderRadius:'50%', border:`1.5px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(2,11,19,0.35)' }}>
            <Icon type={icon} size={38} color={color} />
          </div>
          <div>
            <div style={{ color, fontSize:12, fontWeight:950, letterSpacing:'0.10em', marginBottom:7 }}>{title}</div>
            <div style={{ color:DS.muted, fontSize:13, lineHeight:1.45 }}>{body}</div>
          </div>
        </div>
      ))}
    </section>
  )
}

function ScenarioCard({ scenarioKey }) {
  const scenario = SCENARIOS?.[scenarioKey] || {}
  return (
    <div style={{ border:`1px solid ${DS.border}`, borderRadius:4, overflow:'hidden', background:'rgba(3,14,24,0.84)', minWidth:0 }}>
      <div style={{ aspectRatio:'16 / 6.8', position:'relative', overflow:'hidden', background:'#061522' }}>
        <img src={scenarioImages[scenarioKey]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.12))' }} />
      </div>
      <div style={{ padding:'12px 12px 13px' }}>
        <div style={{ color:DS.text, fontSize:'clamp(14px, .85vw, 17px)', fontWeight:900, marginBottom:6 }}>{scenario.name || scenarioKey}</div>
        <div style={{ color:DS.text, fontSize:'clamp(12px, .72vw, 14px)', lineHeight:1.38, minHeight:54 }}>{scenario.desc || ''}</div>
      </div>
    </div>
  )
}

function FeaturedScenarios() {
  return (
    <section style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:'rgba(3,13,23,0.50)', padding:'12px 14px 14px' }}>
      <div style={{ color:DS.text, fontSize:18, fontWeight:900, letterSpacing:'0.04em', borderLeft:`2px solid ${DS.blue2}`, paddingLeft:8, marginBottom:12 }}>
        FEATURED SCENARIOS
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'clamp(10px, 1vw, 16px)' }}>
        {scenarioOrder.map(key => <ScenarioCard key={key} scenarioKey={key} />)}
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
      <div style={{ color:DS.text, fontSize:18, fontWeight:900, letterSpacing:'0.04em', borderLeft:`2px solid ${DS.blue2}`, paddingLeft:8, marginBottom:16 }}>
        HOW NEXUS EOC WORKS
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(230px, 1fr))', gap:'clamp(14px, 1.5vw, 28px)', alignItems:'start' }}>
        {steps.map(([icon,title,body], idx) => (
          <div key={title} style={{ display:'grid', gridTemplateColumns:'70px 1fr', gap:12, position:'relative' }}>
            <div style={{ position:'relative', width:62, height:62, borderRadius:'50%', border:`1px solid ${DS.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon type={icon} size={34} color="#DDE8F5" />
              <div style={{ position:'absolute', top:-7, left:-7, width:23, height:23, borderRadius:'50%', border:`1px solid ${DS.blue2}`, color:DS.blue2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, background:'#03101C' }}>{idx+1}</div>
            </div>
            <div>
              <div style={{ color:'#CBE4FF', fontWeight:900, fontSize:14, marginBottom:7 }}>{title}</div>
              <div style={{ color:DS.text, fontSize:13, lineHeight:1.42 }}>{body}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign:'center', color:DS.blue2, fontSize:14, marginTop:14 }}>
        ★ &nbsp; More detailed responses produce stronger injects, feedback, and after-action insights.
      </div>
    </section>
  )
}

export default function MissionPortalMockup({ onStartExercise, onGuidedTour }) {
  const start = onStartExercise || (() => {})
  const tour = onGuidedTour || (() => {})
  return (
    <div style={{
      width:'100vw',
      minHeight:'100vh',
      background:`radial-gradient(circle at 22% 18%, rgba(46,131,255,0.12), transparent 34%), linear-gradient(135deg, ${DS.bg}, #02070D 62%)`,
      color:DS.text,
      fontFamily:'Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
      overflow:'hidden',
    }}>
      <Header onStartExercise={start} onGuidedTour={tour} />
      <main style={{ height:'calc(100vh - 76px)', overflowY:'auto', overflowX:'hidden', padding:'18px clamp(16px, 2vw, 34px) 12px' }}>
        <div style={{ width:'min(100%, 1680px)', margin:'0 auto', display:'grid', gap:12 }}>
          <Hero />
          <CapabilityBand />
          <FeaturedScenarios />
          <HowItWorks />
          <footer style={{ height:34, display:'flex', alignItems:'center', justifyContent:'center', gap:'clamp(60px, 12vw, 220px)', color:DS.muted, fontSize:13 }}>
            <span>© 2026 NEXUS EOC. All rights reserved.</span>
            <span style={{ color:DS.blue2 }}>About NEXUS EOC</span>
          </footer>
        </div>
      </main>
    </div>
  )
}
