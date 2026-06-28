import heroImage from '../../assets/missionPortal/hero-command-center.jpg'
import rightRailImage from '../../assets/missionPortal/right-rail-command.jpg'
import hurricaneImage from '../../assets/missionPortal/hurricane.jpg'
import floodImage from '../../assets/missionPortal/flood.jpg'
import industrialFireImage from '../../assets/missionPortal/industrial-fire.jpg'
import tornadoImage from '../../assets/missionPortal/tornado.jpg'
import cyberImage from '../../assets/missionPortal/cyber.jpg'

const DS = {
  bg:'#020B13',
  bg2:'#061522',
  panel:'rgba(4, 17, 29, 0.82)',
  panel2:'rgba(7, 25, 41, 0.78)',
  border:'rgba(87, 146, 198, 0.28)',
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
  {
    title:'Hurricane Landfall',
    desc:'Major hurricane makes landfall with catastrophic impacts.',
    tags:['Natural Hazard','Wind'],
    color:DS.red,
    img:hurricaneImage,
  },
  {
    title:'Riverine Flooding',
    desc:'Severe river flooding threatens communities and infrastructure.',
    tags:['Natural Hazard','Flooding'],
    color:DS.blue,
    img:floodImage,
  },
  {
    title:'Industrial Fire',
    desc:'Chemical plant fire with potential HAZMAT release.',
    tags:['Technological','HAZMAT'],
    color:DS.orange,
    img:industrialFireImage,
  },
  {
    title:'Tornado Outbreak',
    desc:'Multiple tornadoes cause widespread damage.',
    tags:['Natural Hazard','Severe Weather'],
    color:DS.purple,
    img:tornadoImage,
  },
  {
    title:'Cyber Attack',
    desc:'Coordinated cyber attack disrupts critical systems.',
    tags:['Technological','Cyber'],
    color:DS.cyan,
    img:cyberImage,
  },
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
      height:74,
      display:'flex',
      alignItems:'center',
      justifyContent:'space-between',
      padding:'0 32px',
      borderBottom:`1px solid ${DS.border}`,
      background:'linear-gradient(180deg, rgba(2,10,18,0.98), rgba(3,13,22,0.96))',
      boxSizing:'border-box',
      flexShrink:0,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:18 }}>
        <Icon type="shield" size={46} color={DS.blue2} />
        <div style={{ fontSize:34, fontWeight:900, color:DS.text, letterSpacing:'0.08em' }}>NEXUS EOC</div>
        <div style={{ width:1, height:38, background:DS.border, margin:'0 2px' }} />
        <div style={{ color:DS.text, fontSize:15, lineHeight:1.25 }}>
          Simulated Emergency<br />Operations Platform
        </div>
      </div>
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
    </header>
  )
}

function Hero({ onStartExercise }) {
  return (
    <section style={{
      position:'relative',
      minHeight:313,
      borderBottom:`1px solid ${DS.border}`,
      overflow:'hidden',
      background:'#030E18',
    }}>
      <img src={heroImage} alt="" style={{
        position:'absolute',
        inset:0,
        width:'100%',
        height:'100%',
        objectFit:'cover',
        opacity:0.78,
      }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(2,9,16,0.98) 0%, rgba(2,9,16,0.88) 27%, rgba(2,9,16,0.28) 62%, rgba(2,9,16,0.42) 100%)' }} />
      <div style={{ position:'relative', zIndex:2, width:'58%', maxWidth:720, padding:'34px 8px 24px 8px', boxSizing:'border-box' }}>
        <h1 style={{ margin:0, color:DS.text, fontSize:'clamp(54px, 4.1vw, 72px)', lineHeight:0.98, fontWeight:950, letterSpacing:'0.055em' }}>
          MISSION PORTAL
        </h1>
        <div style={{ color:DS.blue2, fontSize:'clamp(30px, 2.3vw, 40px)', fontWeight:900, marginTop:9 }}>
          Train. Decide. Lead.
        </div>
        <p style={{ color:DS.text, fontSize:'clamp(16px, 1.05vw, 19px)', lineHeight:1.52, margin:'18px 0 27px', maxWidth:560 }}>
          AI-powered emergency operations training for EOCs, emergency managers, and response partners.
        </p>
        <div style={{ display:'flex', gap:26 }}>
          <button onClick={onStartExercise} style={{
            minWidth:222,
            height:55,
            padding:'0 26px',
            borderRadius:6,
            border:`1px solid ${DS.borderStrong}`,
            background:'linear-gradient(180deg, #1F6AE9, #1352C2)',
            color:'#fff',
            fontWeight:900,
            fontSize:17,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            gap:18,
            cursor:'pointer',
            boxShadow:'0 10px 30px rgba(31,106,233,0.22)',
          }}>
            Start Exercise <Icon type="arrow" size={26} color="#fff" />
          </button>
          <button title="TODO: wire to existing guided tour modal" style={{
            minWidth:209,
            height:55,
            padding:'0 24px',
            borderRadius:6,
            border:`1px solid ${DS.borderStrong}`,
            background:'rgba(3,13,23,0.72)',
            color:'#fff',
            fontWeight:900,
            fontSize:17,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            gap:18,
            cursor:'default',
          }}>
            <Icon type="play" size={28} color={DS.blue2} /> Guided Tour
          </button>
        </div>
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
      borderBottom:`1px solid ${DS.border}`,
      background:'rgba(2,11,19,0.55)',
    }}>
      {cards.map(([icon,title,body,color], idx) => (
        <div key={title} style={{
          display:'grid',
          gridTemplateColumns:'74px 1fr',
          gap:14,
          alignItems:'center',
          padding:'16px 20px',
          borderRight:idx < cards.length - 1 ? `1px solid ${DS.border}` : 'none',
          minHeight:104,
        }}>
          <div style={{ width:72, height:72, borderRadius:'50%', border:`1.5px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(2,11,19,0.35)' }}>
            <Icon type={icon} size={42} color={color} />
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

function ScenarioCard({ card, onStartExercise }) {
  return (
    <div style={{
      border:`1px solid ${DS.border}`,
      borderRadius:4,
      overflow:'hidden',
      background:'rgba(3,14,24,0.84)',
      minWidth:0,
    }}>
      <div style={{ height:104, position:'relative', overflow:'hidden', background:'#061522' }}>
        <img src={card.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.16))' }} />
        <div style={{ position:'absolute', top:10, left:10, width:34, height:34, borderRadius:4, border:`1px solid ${card.color}`, background:'rgba(3,13,22,0.85)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:16, height:16, borderRadius:3, background:card.color, opacity:0.85 }} />
        </div>
      </div>
      <div style={{ padding:'12px 12px 11px' }}>
        <div style={{ color:DS.text, fontSize:15, fontWeight:900, marginBottom:6 }}>{card.title}</div>
        <div style={{ color:DS.text, fontSize:13, lineHeight:1.35, minHeight:36 }}>{card.desc}</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:10 }}>
          {card.tags.map(t => (
            <span key={t} style={{ color:card.color, background:`${card.color}22`, border:`1px solid ${card.color}44`, fontSize:11, padding:'3px 7px', borderRadius:3 }}>
              {t}
            </span>
          ))}
        </div>
        <button onClick={onStartExercise} style={{
          width:'100%',
          height:30,
          marginTop:10,
          border:`1px solid ${DS.blue2}`,
          borderRadius:3,
          background:'rgba(4,18,31,0.86)',
          color:DS.blue2,
          fontSize:13,
          fontWeight:800,
          cursor:'pointer',
        }}>
          Start Scenario
        </button>
      </div>
    </div>
  )
}

function FeaturedScenarios({ onStartExercise }) {
  return (
    <section style={{
      border:`1px solid ${DS.border}`,
      borderRadius:4,
      background:'rgba(3,13,23,0.50)',
      padding:'12px 14px 14px',
      marginTop:12,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ color:DS.text, fontSize:18, fontWeight:900, letterSpacing:'0.04em', borderLeft:`2px solid ${DS.blue2}`, paddingLeft:8 }}>
          FEATURED SCENARIOS
        </div>
        <div style={{ color:DS.blue2, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
          View All Scenarios <Icon type="arrow" size={19} color={DS.blue2} />
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, minmax(0, 1fr))', gap:12 }}>
        {scenarioCards.map(card => (
          <ScenarioCard key={card.title} card={card} onStartExercise={onStartExercise} />
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:11, marginTop:8, color:DS.dim }}>
        <span>‹</span><span style={{ width:15, height:5, background:DS.blue2, borderRadius:5 }} /><span style={{ width:7, height:7, background:DS.dim, borderRadius:'50%', opacity:0.7 }} /><span style={{ width:7, height:7, background:DS.dim, borderRadius:'50%', opacity:0.7 }} /><span style={{ width:7, height:7, background:DS.dim, borderRadius:'50%', opacity:0.7 }} /><span>›</span>
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
      marginTop:12,
    }}>
      <div style={{ color:DS.text, fontSize:18, fontWeight:900, letterSpacing:'0.04em', borderLeft:`2px solid ${DS.blue2}`, paddingLeft:8, marginBottom:16 }}>
        HOW NEXUS EOC WORKS
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, minmax(0, 1fr))', gap:18, alignItems:'start' }}>
        {steps.map(([icon,title,body], idx) => (
          <div key={title} style={{ display:'grid', gridTemplateColumns:'82px 1fr', gap:14, position:'relative' }}>
            {idx < steps.length - 1 && <div style={{ position:'absolute', left:'calc(100% - 4px)', top:36, color:DS.dim, fontSize:34 }}>›</div>}
            <div style={{ position:'relative', width:66, height:66, borderRadius:'50%', border:`1px solid ${DS.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon type={icon} size={36} color="#DDE8F5" />
              <div style={{ position:'absolute', top:-7, left:-7, width:24, height:24, borderRadius:'50%', border:`1px solid ${DS.blue2}`, color:DS.blue2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, background:'#03101C' }}>{idx+1}</div>
            </div>
            <div>
              <div style={{ color:'#CBE4FF', fontWeight:900, fontSize:14, marginBottom:7 }}>{title}</div>
              <div style={{ color:DS.text, fontSize:13, lineHeight:1.42 }}>{body}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign:'center', color:DS.blue2, fontSize:14, marginTop:14 }}>
        ★ &nbsp; More detailed responses produce stronger injects, feedback, transcripts, and after-action insights.
      </div>
    </section>
  )
}

function RightRail() {
  return (
    <aside style={{
      width:360,
      minWidth:320,
      borderLeft:`1px solid ${DS.border}`,
      background:'linear-gradient(180deg, rgba(3,13,22,0.92), rgba(3,13,22,0.58))',
      padding:'24px 20px 12px',
      boxSizing:'border-box',
    }}>
      <div style={{ border:`1px solid ${DS.border}`, background:'rgba(4,16,28,0.40)', padding:'20px 22px', minHeight:'calc(100vh - 122px)' }}>
        <div style={{ color:DS.text, fontSize:19, fontWeight:900, letterSpacing:'0.04em', marginBottom:12 }}>
          EXERCISE OUTPUTS
        </div>
        <div style={{ width:34, height:2, background:DS.blue2, marginBottom:22 }} />

        <div style={{ display:'grid', gridTemplateColumns:'58px 1fr', gap:18, marginBottom:34 }}>
          <div style={{ width:54, height:54, borderRadius:7, border:`1px solid ${DS.blue2}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon type="file" size={34} color={DS.blue2} />
          </div>
          <div>
            <div style={{ color:DS.text, fontSize:17, fontWeight:900, marginBottom:8 }}>After-Action Review PDF</div>
            <div style={{ color:DS.text, fontSize:14, lineHeight:1.55 }}>Strengths, gaps, recommendations, and doctrine/reference notes.</div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'58px 1fr', gap:18, marginBottom:34 }}>
          <div style={{ width:54, height:54, borderRadius:7, border:`1px solid ${DS.green}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon type="file" size={34} color={DS.green} />
          </div>
          <div>
            <div style={{ color:DS.text, fontSize:17, fontWeight:900, marginBottom:8 }}>Exercise Transcript PDF</div>
            <div style={{ color:DS.text, fontSize:14, lineHeight:1.55 }}>Full record of injects, user responses, map updates, media, lifeline states, and scenario progression.</div>
          </div>
        </div>

        <div style={{ height:1, background:'rgba(255,255,255,0.20)', margin:'26px 0 28px' }} />

        <img src={rightRailImage} alt="" style={{ width:'100%', height:172, objectFit:'cover', opacity:0.82, display:'block', marginBottom:34 }} />

        <div style={{ color:DS.blue2, fontSize:21, fontWeight:900, marginBottom:8 }}>Professional training.</div>
        <div style={{ color:DS.text, fontSize:16, lineHeight:1.45 }}>Stronger decisions. Safer communities.</div>
      </div>
    </aside>
  )
}

export default function MissionPortalMockup({ onStartExercise }) {
  const start = onStartExercise || (() => {})
  return (
    <div style={{
      width:'100vw',
      minHeight:'100vh',
      background:`radial-gradient(circle at 28% 18%, rgba(46,131,255,0.12), transparent 34%), linear-gradient(135deg, ${DS.bg}, #02070D 62%)`,
      color:DS.text,
      fontFamily:'Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
      overflow:'hidden',
    }}>
      <Header onStartExercise={start} />
      <div style={{
        height:'calc(100vh - 74px)',
        display:'grid',
        gridTemplateColumns:'minmax(0, 1fr) 360px',
        maxWidth:'none',
      }}>
        <main style={{ padding:'0 28px 12px 28px', overflowY:'auto', minWidth:0 }}>
          <Hero onStartExercise={start} />
          <CapabilityBand />
          <FeaturedScenarios onStartExercise={start} />
          <HowItWorks />
          <footer style={{
            height:34,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            gap:210,
            color:DS.muted,
            fontSize:13,
          }}>
            <span>© 2025 NEXUS EOC. All rights reserved.</span>
            <span style={{ color:DS.blue2 }}>About NEXUS EOC</span>
          </footer>
        </main>
        <RightRail />
      </div>
    </div>
  )
}
