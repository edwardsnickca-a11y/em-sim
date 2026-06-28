import { useMemo, useState } from 'react'
import { SCENARIOS } from '../../data/scenarios'

const DS = {
  bg:'#04101A',
  bg2:'#071B29',
  panel:'#081B2A',
  panel2:'#0C2233',
  panel3:'#102B40',
  border:'rgba(45, 182, 196, 0.22)',
  borderStrong:'rgba(45, 182, 196, 0.42)',
  teal:'#19D3C5',
  teal2:'#2DB6C4',
  blue:'#3D8BFF',
  amber:'#F2A93B',
  red:'#D9534F',
  green:'#70C341',
  text:'#F2F6FA',
  muted:'#A9B8C7',
  dim:'#6D7F91',
  deep:'#020811',
}

const NAV_ITEMS = [
  ['MISSION PORTAL','home'],
  ['SCENARIO LIBRARY','layers'],
  ['START EXERCISE','play'],
  ['AFTER-ACTION REPORTS','clipboard'],
  ['TRAINING LIBRARY','book'],
  ['RESOURCES','folder'],
  ['ABOUT THE FOUNDER','user'],
  ['HELP & SUPPORT','help'],
]

const FEATURED = [
  {
    title:'HURRICANE LANDFALL',
    place:'Large Urban Metro',
    duration:'90–120 min',
    tag:'FEATURED',
    key:'hurricane',
    art:'hurricane',
  },
  {
    title:'WILDFIRE EVACUATION',
    place:'Rural County',
    duration:'60–90 min',
    key:'wildfire',
    art:'wildfire',
  },
  {
    title:'MAJOR FLOODING',
    place:'River Basin Region',
    duration:'60–90 min',
    key:'flood',
    art:'flood',
  },
  {
    title:'HAZMAT INCIDENT',
    place:'Industrial Corridor',
    duration:'60–90 min',
    key:'hazmat',
    art:'hazmat',
  },
]

function Icon({ name, size=24, color='currentColor' }) {
  const common = { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:color, strokeWidth:1.7, strokeLinecap:'round', strokeLinejoin:'round' }
  const icons = {
    home:<><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M10 20v-5h4v5"/></>,
    layers:<><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/></>,
    play:<><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/></>,
    clipboard:<><path d="M9 4h6l1 2h3v15H5V6h3l1-2Z"/><path d="M9 11h6M9 15h6"/></>,
    book:<><path d="M4 5.5A3 3 0 0 1 7 3h13v16H7a3 3 0 0 0-3 3V5.5Z"/><path d="M4 5.5A3 3 0 0 1 7 3h1v16H7a3 3 0 0 0-3 3V5.5Z"/></>,
    folder:<><path d="M3 6h7l2 2h9v11H3V6Z"/></>,
    user:<><circle cx="12" cy="8" r="3.2"/><path d="M5 20a7 7 0 0 1 14 0"/></>,
    help:<><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.5 2.5 0 0 1 4.5 1.5c0 2-2.3 2.1-2.3 4"/><path d="M12 18h.01"/></>,
    brain:<><path d="M8 6a3 3 0 0 1 6-1 3 3 0 0 1 5 2.2 3.5 3.5 0 0 1-.8 6.8 3 3 0 0 1-4.2 3.7 3.4 3.4 0 0 1-6 0A3 3 0 0 1 3.8 14 3.5 3.5 0 0 1 3 7.2 3 3 0 0 1 8 6Z"/><path d="M12 4v16M8 9h4M12 13h4"/></>,
    code:<><path d="m8 9-4 3 4 3"/><path d="m16 9 4 3-4 3"/><path d="m14 5-4 14"/></>,
    shield:<><path d="M12 3 20 6v6c0 5-3.3 8-8 9-4.7-1-8-4-8-9V6l8-3Z"/><path d="M9.5 12.3 11.4 14l3.4-4"/></>,
    doc:<><path d="M6 3h9l3 3v15H6V3Z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/></>,
    map:<><path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/></>,
    sliders:<><path d="M4 7h16M4 12h16M4 17h16"/><circle cx="8" cy="7" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="11" cy="17" r="2"/></>,
    branch:<><path d="M12 20V10"/><path d="M12 10 7 5"/><path d="M12 10l5-5"/><path d="M7 5v5M17 5v5"/></>,
    checklist:<><path d="M8 6h11M8 12h11M8 18h11"/><path d="m4 6 .8.8L6.5 5M4 12l.8.8 1.7-1.8M4 18l.8.8 1.7-1.8"/></>,
    bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/><circle cx="18.5" cy="5.5" r="2.5" fill={DS.teal} stroke={DS.teal}/>,
  }
  return <svg {...common}>{icons[name] || icons.help}</svg>
}

function NexusLogo() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:16 }}>
      <div style={{ width:58, height:58, borderRadius:'50%', position:'relative', border:`2px solid ${DS.teal}`, boxShadow:'0 0 26px rgba(25,211,197,0.22)' }}>
        <div style={{ position:'absolute', inset:8, borderRadius:'50%', borderTop:`8px solid ${DS.teal}`, borderRight:`8px solid transparent`, borderBottom:`8px solid ${DS.teal}`, borderLeft:`8px solid transparent`, transform:'rotate(-28deg)' }} />
      </div>
      <div>
        <div style={{ fontSize:35, lineHeight:0.85, letterSpacing:'0.12em', fontWeight:900, color:DS.text }}>
          NE<span style={{ color:DS.teal }}>X</span>US
        </div>
        <div style={{ fontSize:16, letterSpacing:'0.38em', color:DS.teal, marginTop:7, fontWeight:700 }}>EOC</div>
      </div>
    </div>
  )
}

function SectionTitle({ children, right }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
      <div style={{ color:DS.text, fontSize:18, fontWeight:800, letterSpacing:'0.12em' }}>{children}</div>
      {right && <div style={{ color:DS.teal, fontSize:12, fontWeight:800, letterSpacing:'0.08em' }}>{right}</div>}
    </div>
  )
}

function Sidebar({ onStart }) {
  return (
    <aside style={{
      width:264,
      minHeight:'100vh',
      background:'linear-gradient(180deg, rgba(3,14,24,0.98), rgba(5,18,29,0.98))',
      borderRight:`1px solid ${DS.border}`,
      display:'flex',
      flexDirection:'column',
      padding:'30px 12px 28px',
      boxSizing:'border-box',
      flexShrink:0,
    }}>
      <div style={{ padding:'0 14px 28px' }}>
        <NexusLogo />
        <div style={{ marginTop:24, fontSize:14, lineHeight:1.55, letterSpacing:'0.09em', color:DS.muted, textTransform:'uppercase' }}>
          AI-Powered Emergency<br />Operations Training
        </div>
      </div>

      <nav style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {NAV_ITEMS.map(([label, icon], idx) => {
          const active = idx === 0
          const clickable = label === 'START EXERCISE' || label === 'MISSION PORTAL' || label === 'SCENARIO LIBRARY'
          return (
            <button
              key={label}
              onClick={label === 'START EXERCISE' || label === 'SCENARIO LIBRARY' ? onStart : undefined}
              style={{
                width:'100%',
                height:48,
                display:'flex',
                alignItems:'center',
                gap:18,
                padding:'0 17px',
                borderRadius:4,
                border:active ? `1px solid ${DS.borderStrong}` : '1px solid transparent',
                background:active ? 'linear-gradient(90deg, rgba(25,211,197,0.20), rgba(25,211,197,0.06))' : 'transparent',
                color:active ? DS.teal : DS.text,
                fontSize:14,
                letterSpacing:'0.06em',
                cursor:clickable ? 'pointer' : 'default',
                textAlign:'left',
                fontWeight:active ? 800 : 500,
              }}
            >
              <Icon name={icon} size={25} color={active ? DS.teal : '#D5DCE5'} />
              {label}
            </button>
          )
        })}
      </nav>

      <div style={{ marginTop:'auto', padding:'0 10px' }}>
        <div style={{ border:`1px solid ${DS.border}`, borderRadius:8, padding:20, background:'linear-gradient(180deg, rgba(8,26,40,0.72), rgba(3,12,20,0.86))' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:18 }}>
            <Icon name="brain" size={46} color={DS.teal} />
            <div style={{ color:DS.text, fontSize:14, fontWeight:800, letterSpacing:'0.07em' }}>NEXUS ENGINE</div>
          </div>
          <div style={{ color:DS.muted, fontSize:11, letterSpacing:'0.09em', lineHeight:1.8, textTransform:'uppercase' }}>
            AI Model: Adaptive 3.2<br />
            Status: <span style={{ color:DS.green }}>Operational</span>
          </div>
          <button style={{ marginTop:18, width:'100%', height:42, border:`1px solid ${DS.border}`, borderRadius:5, background:'rgba(8,26,40,0.62)', color:DS.teal, fontSize:12, letterSpacing:'0.08em', fontWeight:800 }}>
            SYSTEM STATUS
          </button>
        </div>
      </div>
    </aside>
  )
}

function Hero({ onStart }) {
  return (
    <section style={{
      minHeight:280,
      position:'relative',
      overflow:'hidden',
      borderBottom:`1px solid ${DS.border}`,
      background:'#06131F',
    }}>
      <div style={{
        position:'absolute',
        inset:0,
        background:
          'linear-gradient(90deg, rgba(3,12,20,0.98) 0%, rgba(3,12,20,0.90) 22%, rgba(3,12,20,0.50) 48%, rgba(3,12,20,0.88) 100%), radial-gradient(circle at 62% 26%, rgba(25,211,197,0.22), transparent 18%), radial-gradient(circle at 72% 50%, rgba(61,139,255,0.18), transparent 18%), linear-gradient(135deg, #071825, #06131f 40%, #0d2d42)',
      }} />
      <div style={{
        position:'absolute',
        inset:0,
        opacity:0.34,
        backgroundImage:
          'linear-gradient(rgba(25,211,197,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(25,211,197,0.10) 1px, transparent 1px)',
        backgroundSize:'44px 44px',
      }} />
      <div style={{
        position:'absolute',
        right:0,
        top:0,
        width:'56%',
        height:'100%',
        opacity:0.55,
        background:
          'radial-gradient(circle at 28% 42%, rgba(255,255,255,0.16) 0 1px, transparent 2px), radial-gradient(circle at 46% 28%, rgba(25,211,197,0.18) 0 1px, transparent 2px), radial-gradient(circle at 64% 54%, rgba(61,139,255,0.20) 0 1px, transparent 2px), linear-gradient(120deg, transparent, rgba(25,211,197,0.13), transparent)',
        backgroundSize:'90px 90px, 120px 120px, 140px 140px, cover',
      }} />
      <div style={{ position:'relative', zIndex:2, padding:'42px 26px 30px', maxWidth:680 }}>
        <h1 style={{ margin:0, color:DS.text, fontSize:42, lineHeight:1.08, letterSpacing:'0.08em', fontWeight:900 }}>
          MISSION PORTAL
        </h1>
        <div style={{ color:DS.teal, fontSize:20, marginTop:8, letterSpacing:'0.02em' }}>Train. Decide. Lead.</div>
        <p style={{ color:'#D5DDE6', fontSize:16, lineHeight:1.6, margin:'16px 0 26px', maxWidth:560 }}>
          NEXUS EOC delivers realistic, adaptive emergency operations training for EOCs, emergency managers, and response teams.
        </p>
        <div style={{ display:'flex', gap:12 }}>
          <button onClick={onStart} style={{
            height:44,
            padding:'0 24px',
            borderRadius:5,
            border:'none',
            background:`linear-gradient(180deg, ${DS.teal}, #12AFA5)`,
            color:'#06131B',
            fontSize:13,
            letterSpacing:'0.08em',
            fontWeight:900,
            cursor:'pointer',
            display:'flex',
            alignItems:'center',
            gap:14,
          }}>
            <span style={{ fontSize:16 }}>▶</span> START NEW EXERCISE
          </button>
          <button onClick={onStart} style={{
            height:44,
            padding:'0 22px',
            borderRadius:5,
            border:`1px solid ${DS.borderStrong}`,
            background:'rgba(8,27,42,0.72)',
            color:DS.text,
            fontSize:13,
            letterSpacing:'0.06em',
            fontWeight:700,
            cursor:'pointer',
            display:'flex',
            alignItems:'center',
            gap:12,
          }}>
            <Icon name="book" size={22} color={DS.teal} /> BROWSE SCENARIO LIBRARY
          </button>
        </div>
      </div>
    </section>
  )
}

function CapabilityStrip() {
  const items = [
    ['layers','AVAILABLE SCENARIOS','12','Emergency Management Exercises'],
    ['brain','ADAPTIVE AI ENGINE','', 'Dynamic injects and scenario adaptation based on your decisions.'],
    ['clipboard','AFTER-ACTION REPORTS','', 'Detailed transcripts, decision logs, and readiness insights generated automatically.'],
    ['shield','OPERATIONAL READINESS SCORING','', 'Receive an objective assessment of strengths, gaps, and areas for improvement.'],
  ]
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1.2fr 1.2fr 1.2fr', gap:8, padding:'14px 16px', borderBottom:`1px solid ${DS.border}`, background:'rgba(3,12,20,0.44)' }}>
      {items.map(([icon,label,value,body], i) => (
        <div key={label} style={{ display:'grid', gridTemplateColumns:'54px 1fr', gap:12, alignItems:'center', padding:'14px 16px', border:`1px solid ${DS.border}`, borderRadius:6, background:'rgba(4,16,26,0.58)' }}>
          <Icon name={icon} size={42} color={DS.teal} />
          <div>
            <div style={{ color:DS.muted, fontSize:12, letterSpacing:'0.08em', fontWeight:800 }}>{label}</div>
            {value ? <div style={{ color:DS.text, fontSize:27, lineHeight:1.05, marginTop:5 }}>{value}</div> : null}
            <div style={{ color:'#AAB7C5', fontSize:12, lineHeight:1.45, marginTop:value ? 5 : 7 }}>{body}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ScenarioArt({ art }) {
  const styles = {
    hurricane:'radial-gradient(circle at 45% 42%, rgba(255,255,255,0.40), transparent 7%), conic-gradient(from 30deg at 45% 42%, #d9e6ee, #758da0, #0d2738, #d9e6ee, #29485d, #d9e6ee), linear-gradient(135deg, #0a1b28, #193448)',
    wildfire:'radial-gradient(circle at 40% 70%, rgba(255,202,79,0.70), transparent 12%), radial-gradient(circle at 65% 50%, rgba(217,83,79,0.72), transparent 18%), linear-gradient(160deg, #080b10, #4a1b13 52%, #df6a22)',
    flood:'linear-gradient(160deg, rgba(230,236,241,0.55), transparent 32%), radial-gradient(circle at 52% 80%, rgba(61,139,255,0.30), transparent 20%), linear-gradient(135deg, #101922, #385064 48%, #152536)',
    hazmat:'radial-gradient(circle at 35% 50%, rgba(210,210,210,0.55), transparent 18%), radial-gradient(circle at 65% 52%, rgba(210,210,210,0.42), transparent 22%), linear-gradient(135deg, #0a0f17, #283142 42%, #66717c)',
  }
  return (
    <div style={{ height:148, borderBottom:`1px solid ${DS.border}`, background:styles[art] || styles.flood, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize:'22px 22px', opacity:0.42 }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, transparent 20%, rgba(3,12,20,0.82) 100%)' }} />
    </div>
  )
}

function FeaturedScenarios({ onStart }) {
  return (
    <section style={{ padding:'20px 20px 14px', borderBottom:`1px solid ${DS.border}` }}>
      <SectionTitle right={<span onClick={onStart} style={{ cursor:'pointer' }}>VIEW ALL SCENARIOS&nbsp; →</span>}>FEATURED SCENARIOS</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0, 1fr))', gap:10 }}>
        {FEATURED.map(card => (
          <button key={card.title} onClick={onStart} style={{
            padding:0,
            overflow:'hidden',
            textAlign:'left',
            border:`1px solid ${DS.border}`,
            borderRadius:6,
            background:'rgba(6,18,29,0.82)',
            cursor:'pointer',
            color:DS.text,
            minHeight:236,
          }}>
            <div style={{ position:'relative' }}>
              <ScenarioArt art={card.art} />
              {card.tag ? <div style={{ position:'absolute', left:10, top:10, background:'rgba(25,211,197,0.80)', color:'#062029', fontSize:11, fontWeight:900, letterSpacing:'0.07em', padding:'5px 9px', borderRadius:3 }}>{card.tag}</div> : null}
            </div>
            <div style={{ padding:'12px 13px 12px' }}>
              <div style={{ color:DS.text, fontSize:15, letterSpacing:'0.11em', fontWeight:900 }}>{card.title}</div>
              <div style={{ color:DS.muted, fontSize:13, marginTop:6 }}>{card.place}</div>
              <div style={{ display:'flex', alignItems:'center', gap:18, color:'#B8C2CC', fontSize:12, marginTop:15 }}>
                <span>⊕ Adaptive</span>
                <span>◷ {card.duration}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function Workflow() {
  const steps = [
    ['map','SELECT A SCENARIO','Choose from emergency management exercises for a wide range of threats and hazards.'],
    ['sliders','CONFIGURE THE MISSION','Set the jurisdiction type, difficulty level, and operating environment to match your needs.'],
    ['doc','RESPOND TO INJECTS','Work through evolving situation updates, resource constraints, and emerging challenges.'],
    ['branch','MAKE CRITICAL DECISIONS','Choose actions under pressure as the AI engine adapts the scenario based on your responses.'],
    ['checklist','GENERATE THE AAR','Receive a transcript, decision log, strengths, gaps, and an operational readiness summary.'],
  ]
  return (
    <section style={{ padding:'18px 20px 20px' }}>
      <SectionTitle>HOW NEXUS EOC WORKS</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:16, alignItems:'start' }}>
        {steps.map(([icon,title,body], i) => (
          <div key={title} style={{ textAlign:'center', position:'relative' }}>
            {i < steps.length-1 ? <div style={{ position:'absolute', left:'78%', top:43, width:'44%', height:1, background:'rgba(230,236,241,0.55)' }} /> : null}
            <div style={{ margin:'0 auto 14px', width:86, height:86, borderRadius:'50%', border:`1px solid ${DS.borderStrong}`, display:'flex', alignItems:'center', justifyContent:'center', color:DS.teal, background:'rgba(5,18,29,0.70)', position:'relative' }}>
              <Icon name={icon} size={44} color={DS.teal} />
              <div style={{ position:'absolute', right:0, top:-6, width:27, height:27, borderRadius:'50%', background:DS.teal, color:'#062029', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14 }}>{i+1}</div>
            </div>
            <div style={{ color:DS.text, fontSize:13, letterSpacing:'0.07em', fontWeight:800 }}>{title}</div>
            <div style={{ color:'#AEB9C4', fontSize:12, lineHeight:1.55, marginTop:7 }}>{body}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function SnapshotCard() {
  const rows = [
    ['code','CURRENT BUILD','v0.3.0','Latest Version'],
    ['layers','SCENARIO PACK','Standard Pack','12 Scenarios'],
    ['brain','AI MODEL','Adaptive 3.2','Active'],
    ['brain','PROMPT VERSION','Adaptive 3.2','Active'],
    ['shield','SYSTEM STATUS','Operational','All Systems Go'],
  ]
  return (
    <div style={{ padding:'18px 18px 14px', borderBottom:`1px solid ${DS.border}` }}>
      <div style={{ color:DS.teal, fontSize:15, letterSpacing:'0.14em', fontWeight:800, marginBottom:14 }}>PLATFORM SNAPSHOT</div>
      <div style={{ border:`1px solid ${DS.border}`, borderRadius:8, overflow:'hidden', background:'rgba(3,12,20,0.48)' }}>
        {rows.map(([icon, label, value, detail], idx) => (
          <div key={label} style={{ display:'grid', gridTemplateColumns:'42px 1fr auto', gap:12, alignItems:'center', padding:'13px 12px', borderBottom:idx < rows.length-1 ? `1px solid rgba(169,184,199,0.12)` : 'none' }}>
            <Icon name={icon} size={28} color={DS.teal} />
            <div>
              <div style={{ color:DS.dim, fontSize:11, letterSpacing:'0.07em', fontWeight:700 }}>{label}</div>
              <div style={{ color:value === 'Operational' ? DS.green : DS.text, fontSize:15, marginTop:4 }}>{value}</div>
            </div>
            <div style={{ color:detail === 'Active' ? DS.green : DS.muted, fontSize:11 }}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OutputsCard() {
  const rows = [
    ['doc','Decision Log','Detailed actions taken'],
    ['clipboard','Transcript','Full exercise transcript'],
    ['clipboard','After-Action Report','Strengths, gaps, insights'],
    ['shield','Operational Readiness Score','Performance assessment'],
  ]
  return (
    <div style={{ padding:'18px', borderBottom:`1px solid ${DS.border}` }}>
      <div style={{ color:DS.teal, fontSize:15, letterSpacing:'0.14em', fontWeight:800, marginBottom:14 }}>EXERCISE OUTPUTS</div>
      <div style={{ border:`1px solid ${DS.border}`, borderRadius:8, background:'rgba(3,12,20,0.48)', overflow:'hidden' }}>
        {rows.map(([icon,title,sub], idx) => (
          <div key={title} style={{ display:'grid', gridTemplateColumns:'34px 1fr 18px', alignItems:'center', gap:12, padding:'12px', borderBottom:idx < rows.length-1 ? `1px solid rgba(169,184,199,0.12)` : 'none' }}>
            <Icon name={icon} size={26} color='#E9EEF5' />
            <div>
              <div style={{ color:DS.text, fontSize:13, fontWeight:800 }}>{title}</div>
              <div style={{ color:DS.muted, fontSize:12, marginTop:3 }}>{sub}</div>
            </div>
            <div style={{ color:DS.text, fontSize:22 }}>›</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GetStartedCard({ onStart }) {
  const rows = [
    ['play','START NEW EXERCISE','Launch a new scenario'],
    ['book','BROWSE SCENARIO LIBRARY','Explore all available scenarios'],
    ['doc','VIEW SAMPLE AAR','See an example report'],
  ]
  return (
    <div style={{ padding:'18px' }}>
      <div style={{ color:DS.teal, fontSize:15, letterSpacing:'0.14em', fontWeight:800, marginBottom:14 }}>GET STARTED</div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {rows.map(([icon,title,sub]) => (
          <button key={title} onClick={onStart} style={{ display:'grid', gridTemplateColumns:'38px 1fr', gap:10, alignItems:'center', width:'100%', textAlign:'left', padding:'11px 12px', border:`1px solid ${DS.border}`, borderRadius:6, background:'rgba(8,26,40,0.55)', cursor:'pointer' }}>
            <Icon name={icon} size={30} color={DS.teal} />
            <div>
              <div style={{ color:DS.text, fontSize:13, fontWeight:800 }}>{title}</div>
              <div style={{ color:DS.muted, fontSize:12, marginTop:3 }}>{sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function RightRail({ onStart }) {
  return (
    <aside style={{
      width:292,
      borderLeft:`1px solid ${DS.border}`,
      background:'linear-gradient(180deg, rgba(5,18,29,0.96), rgba(4,12,20,0.98))',
      flexShrink:0,
      display:'flex',
      flexDirection:'column',
    }}>
      <div style={{ height:64, borderBottom:`1px solid ${DS.border}`, display:'grid', gridTemplateColumns:'52px 74px 1fr', alignItems:'center' }}>
        <div style={{ display:'flex', justifyContent:'center', color:DS.text, position:'relative' }}>
          <Icon name="bell" size={29} color={DS.text} />
          <span style={{ position:'absolute', top:9, right:13, width:18, height:18, borderRadius:'50%', background:DS.teal, color:'#062029', fontSize:11, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>2</span>
        </div>
        <div style={{ borderLeft:`1px solid ${DS.border}`, paddingLeft:16 }}>
          <div style={{ color:DS.text, fontSize:18 }}>09:12</div>
          <div style={{ color:DS.muted, fontSize:10, letterSpacing:'0.10em', marginTop:3 }}>LOCAL TIME</div>
        </div>
        <div style={{ borderLeft:`1px solid ${DS.border}`, display:'flex', alignItems:'center', gap:12, height:'100%', paddingLeft:16 }}>
          <div style={{ width:38, height:38, borderRadius:'50%', border:`1px solid ${DS.teal}`, background:'radial-gradient(circle, rgba(242,169,59,0.8), rgba(10,29,42,0.9))' }} />
          <div>
            <div style={{ color:DS.text, fontSize:13, letterSpacing:'0.10em' }}>N. EDWARDS</div>
            <div style={{ color:DS.muted, fontSize:11, marginTop:4 }}>EOC DIRECTOR</div>
          </div>
        </div>
      </div>
      <SnapshotCard />
      <OutputsCard />
      <GetStartedCard onStart={onStart} />
    </aside>
  )
}

function GuidedTourModal({ onClose, onStart }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9000, background:'rgba(2,8,14,0.80)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:720, maxWidth:'94vw', background:'linear-gradient(180deg, #0D2435, #06131F)', border:`1px solid ${DS.borderStrong}`, borderRadius:10, boxShadow:'0 30px 100px rgba(0,0,0,0.72)', overflow:'hidden' }}>
        <div style={{ padding:'24px 28px', borderBottom:`1px solid ${DS.border}` }}>
          <div style={{ color:DS.teal, fontSize:12, letterSpacing:'0.16em', fontWeight:900 }}>MISSION PORTAL GUIDED TOUR</div>
          <div style={{ color:DS.text, fontSize:28, fontWeight:900, marginTop:8 }}>Step 1 of 4</div>
        </div>
        <div style={{ padding:28, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
          {[
            ['Choose a scenario','Select from realistic emergency management exercise types.'],
            ['Configure the fields','Set role, jurisdiction, difficulty, and participant name.'],
            ['Provide detailed responses','Use command-style decisions as the exercise evolves.'],
          ].map(([h,b]) => (
            <div key={h} style={{ padding:18, minHeight:132, border:`1px solid ${DS.border}`, borderRadius:8, background:'rgba(4,16,26,0.72)' }}>
              <div style={{ color:DS.text, fontWeight:900, fontSize:15, marginBottom:10 }}>{h}</div>
              <div style={{ color:DS.muted, lineHeight:1.55, fontSize:13 }}>{b}</div>
            </div>
          ))}
        </div>
        <div style={{ padding:'18px 28px', borderTop:`1px solid ${DS.border}`, display:'flex', justifyContent:'space-between' }}>
          <button onClick={onClose} style={{ background:'transparent', color:DS.muted, border:`1px solid ${DS.border}`, borderRadius:5, padding:'11px 18px', cursor:'pointer', fontWeight:800 }}>Skip Tour</button>
          <button onClick={onStart} style={{ background:DS.teal, color:'#06131B', border:'none', borderRadius:5, padding:'11px 22px', cursor:'pointer', fontWeight:900 }}>Next</button>
        </div>
      </div>
    </div>
  )
}

export default function MissionPortal({ onStartExercise, showGuidedTour, onCloseGuidedTour }) {
  const [tourOpen, setTourOpen] = useState(Boolean(showGuidedTour))
  const start = () => {
    onCloseGuidedTour?.()
    onStartExercise?.()
  }
  const closeTour = () => {
    setTourOpen(false)
    onCloseGuidedTour?.()
  }

  return (
    <div style={{
      minHeight:'100vh',
      background:`linear-gradient(135deg, ${DS.deep}, ${DS.bg} 50%, #06131F)`,
      color:DS.text,
      fontFamily:'Inter, Segoe UI, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      display:'flex',
      overflow:'hidden',
    }}>
      <Sidebar onStart={start} />

      <main style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', maxHeight:'100vh', overflow:'hidden' }}>
        <div style={{ flex:1, overflowY:'auto' }}>
          <Hero onStart={start} />
          <CapabilityStrip />
          <FeaturedScenarios onStart={start} />
          <Workflow />
          <footer style={{ height:30, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 22px', color:DS.dim, fontSize:11, borderTop:`1px solid ${DS.border}` }}>
            <span>© 2026 NEXUS EOC. All rights reserved.</span>
            <span style={{ letterSpacing:'0.10em' }}>PRIVACY POLICY&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;TERMS OF USE&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;SUPPORT</span>
          </footer>
        </div>
      </main>

      <RightRail onStart={start} />
      {tourOpen && <GuidedTourModal onClose={closeTour} onStart={start} />}
    </div>
  )
}
