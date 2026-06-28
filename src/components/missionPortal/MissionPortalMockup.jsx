import heroImage from '../../assets/missionPortal/hero-command-center.jpg'
import hurricaneImage from '../../assets/missionPortal/scenarios/hurricane-landfall.jpg'
import mciImage from '../../assets/missionPortal/scenarios/mass-casualty-incident.jpg'
import hazmatImage from '../../assets/missionPortal/scenarios/hazardous-materials-release.jpg'
import cyberImage from '../../assets/missionPortal/scenarios/cyber-infrastructure-cascade.jpg'
import earthquakeImage from '../../assets/missionPortal/scenarios/major-earthquake.jpg'
import floodImage from '../../assets/missionPortal/scenarios/flash-flood-dam-failure.jpg'
import wildfireImage from '../../assets/missionPortal/scenarios/urban-wildfire.jpg'
import winterImage from '../../assets/missionPortal/scenarios/winter-storm-cascade.jpg'
import rddImage from '../../assets/missionPortal/scenarios/radiological-dispersal-device.jpg'
import trainImage from '../../assets/missionPortal/scenarios/train-derailment-mci-hazmat.jpg'

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

function Header({ onStartExercise }) {
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
        <div style={{ display:'flex', gap:12 }}>
          <button title="TODO: wire to existing guided tour modal" style={{
            height:42,
            padding:'0 18px',
            display:'flex',
            alignItems:'center',
            gap:9,
            borderRadius:4,
            border:`1px solid ${DS.borderStrong}`,
            background:'rgba(3,13,23,0.72)',
            color:'#fff',
            fontWeight:800,
            fontSize:15,
            cursor:'default',
          }}>
            <Icon type="play" size={19} color={DS.blue2} /> Guided Tour
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
      minHeight:'clamp(285px, 34vh, 390px)',
      border:`1px solid ${DS.border}`,
      overflow:'hidden',
      background:'#030E18',
      borderRadius:4,
    }}>
      <img src={heroImage} alt="" style={{
        position:'absolute',
        inset:0,
        width:'100%',
        height:'100%',
        objectFit:'cover',
        opacity:0.86,
      }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(2,9,16,0.98) 0%, rgba(2,9,16,0.84) 30%, rgba(2,9,16,0.22) 68%, rgba(2,9,16,0.34) 100%)' }} />
      <div style={{ position:'relative', zIndex:2, width:'min(720px, 58%)', padding:'clamp(42px, 5.2vh, 64px) 0 30px clamp(24px, 2.3vw, 42px)', boxSizing:'border-box' }}>
        <h1 style={{ margin:0, color:DS.text, fontSize:'clamp(50px, 4vw, 74px)', lineHeight:1.08, fontWeight:950, letterSpacing:'0.055em' }}>
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
    <section style={{
      display:'grid',
      gridTemplateColumns:'repeat(4, minmax(0, 1fr))',
      gap:0,
      border:`1px solid ${DS.border}`,
      borderRadius:4,
      background:'rgba(2,11,19,0.65)',
      overflow:'hidden',
    }}>
      {cards.map(([icon,title,body,color], idx) => (
        <div key={title} style={{
          display:'grid',
          gridTemplateColumns:'64px 1fr',
          gap:12,
          alignItems:'center',
          padding:'clamp(12px, 1vw, 16px)',
          borderRight:idx < cards.length - 1 ? `1px solid ${DS.border}` : 'none',
          minHeight:92,
        }}>
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
    <div style={{
      border:`1px solid ${DS.border}`,
      borderRadius:4,
      overflow:'hidden',
      background:'rgba(3,14,24,0.84)',
      minWidth:0,
      display:'flex',
      flexDirection:'column',
    }}>
      <div style={{ aspectRatio:'16 / 7.2', overflow:'hidden', background:'#061522' }}>
        <img src={card.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
      </div>
      <div style={{ padding:'11px 12px 13px', flex:1 }}>
        <div style={{ color:DS.text, fontSize:'clamp(14px, .82vw, 17px)', fontWeight:900, marginBottom:8, lineHeight:1.12 }}>{card.title}</div>
        <div style={{ color:DS.text, fontSize:'clamp(11.5px, .68vw, 13.5px)', lineHeight:1.36 }}>{card.desc}</div>
      </div>
    </div>
  )
}

function FeaturedScenarios() {
  return (
    <section style={{
      border:`1px solid ${DS.border}`,
      borderRadius:4,
      background:'rgba(3,13,23,0.50)',
      padding:'12px 14px 14px',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ color:DS.text, fontSize:18, fontWeight:900, letterSpacing:'0.04em', borderLeft:`2px solid ${DS.blue2}`, paddingLeft:8 }}>
          FEATURED SCENARIOS
        </div>
      </div>
      <div className="nexus-scenario-grid" style={{
        display:'grid',
        gap:'clamp(10px, .85vw, 14px)',
      }}>
        {scenarioCards.map(card => (
          <ScenarioCard key={card.title} card={card} />
        ))}
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
    <section style={{
      border:`1px solid ${DS.border}`,
      borderRadius:4,
      background:'rgba(3,13,23,0.48)',
      padding:'12px 18px 12px',
    }}>
      <div style={{ color:DS.text, fontSize:18, fontWeight:900, letterSpacing:'0.04em', borderLeft:`2px solid ${DS.blue2}`, paddingLeft:8, marginBottom:14 }}>
        HOW NEXUS EOC WORKS
      </div>
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit, minmax(230px, 1fr))',
        gap:'clamp(12px, 1.2vw, 22px)',
        alignItems:'start',
      }}>
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

export default function MissionPortalMockup({ onStartExercise }) {
  return (
    <div style={{
      width:'100vw',
      minHeight:'100vh',
      background:`radial-gradient(circle at 22% 18%, rgba(46,131,255,0.12), transparent 34%), linear-gradient(135deg, ${DS.bg}, #02070D 62%)`,
      color:DS.text,
      fontFamily:'Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
      overflow:'hidden',
    }}>
      <style>{`
        .nexus-scenario-grid {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }
        @media (max-width: 1280px) {
          .nexus-scenario-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
        @media (max-width: 980px) {
          .nexus-scenario-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
      <Header onStartExercise={onStartExercise || (() => {})} />
      <main style={{
        height:'calc(100vh - 76px)',
        overflowY:'auto',
        overflowX:'hidden',
        padding:'clamp(12px, 1.2vw, 20px)',
        boxSizing:'border-box',
      }}>
        <div style={{
          width:'min(100%, 1680px)',
          margin:'0 auto',
          display:'flex',
          flexDirection:'column',
          gap:12,
        }}>
          <Hero />
          <CapabilityBand />
          <FeaturedScenarios />
          <HowItWorks />
          <footer style={{
            height:34,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            gap:'clamp(60px, 12vw, 220px)',
            color:DS.muted,
            fontSize:13,
          }}>
            <span>© 2026 NEXUS EOC. All rights reserved.</span>
            <span style={{ color:DS.blue2 }}>About NEXUS EOC</span>
          </footer>
        </div>
      </main>
    </div>
  )
}
