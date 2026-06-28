import { useMemo, useState } from 'react'
import { SCENARIOS } from '../../data/scenarios'

const DS = {
  bg:'#08131F',
  bg2:'#0C1B2A',
  panel:'#112436',
  panel2:'#162B3F',
  border:'#294A63',
  borderSoft:'rgba(78, 139, 166, 0.28)',
  teal:'#2DB6C4',
  tealSoft:'rgba(45, 182, 196, 0.14)',
  blue:'#3D8BFF',
  amber:'#F2A93B',
  red:'#D9534F',
  green:'#4CAF50',
  text:'#E8EEF2',
  muted:'#8EA3B5',
  dim:'#5E7386',
}

const NAV_ITEMS = ['Mission Portal','Start Exercise','Live Exercise','After Action Review','Resources']

function Kicker({ children }) {
  return <div style={{ fontSize:10, color:DS.teal, letterSpacing:'0.18em', textTransform:'uppercase', fontWeight:700 }}>{children}</div>
}

function SectionHeader({ label, right }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
      <Kicker>{label}</Kicker>
      {right && <div style={{ fontSize:10, color:DS.dim, letterSpacing:'0.08em' }}>{right}</div>}
    </div>
  )
}

function Panel({ children, style }) {
  return <div style={{ background:'linear-gradient(180deg, rgba(22,43,63,0.92), rgba(13,29,44,0.96))', border:`1px solid ${DS.borderSoft}`, borderRadius:16, boxShadow:'0 24px 80px rgba(0,0,0,0.35)', ...style }}>{children}</div>
}

function Sidebar({ onStart }) {
  return (
    <aside style={{ width:232, minHeight:'100vh', borderRight:`1px solid ${DS.borderSoft}`, background:'linear-gradient(180deg, #07111C 0%, #0A1825 100%)', padding:20, boxSizing:'border-box', display:'flex', flexDirection:'column', gap:24 }}>
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <div style={{ width:32, height:32, borderRadius:8, border:`1px solid ${DS.teal}`, display:'flex', alignItems:'center', justifyContent:'center', color:DS.teal, fontWeight:800, letterSpacing:'-0.03em' }}>NX</div>
          <div>
            <div style={{ color:DS.text, fontWeight:800, letterSpacing:'0.08em', fontSize:15 }}>NEXUS EOC</div>
            <div style={{ color:DS.dim, fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase' }}>Training Platform</div>
          </div>
        </div>
      </div>

      <nav style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {NAV_ITEMS.map((item, idx) => {
          const active = idx === 0
          return (
            <button key={item} onClick={item === 'Start Exercise' ? onStart : undefined}
              style={{ display:'flex', alignItems:'center', gap:10, width:'100%', border:`1px solid ${active ? DS.teal : 'transparent'}`, background:active ? DS.tealSoft : 'transparent', color:active ? DS.text : DS.muted, padding:'10px 12px', borderRadius:10, fontSize:12, fontWeight:700, letterSpacing:'0.03em', cursor:item === 'Start Exercise' ? 'pointer' : 'default', textAlign:'left' }}>
              <span style={{ width:18, color:active ? DS.teal : DS.dim }}>{['◈','▶','▣','▤','◎'][idx]}</span>{item}
            </button>
          )
        })}
      </nav>

      <div style={{ marginTop:'auto', borderTop:`1px solid ${DS.borderSoft}`, paddingTop:16 }}>
        <div style={{ fontSize:9, color:DS.dim, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:8 }}>System Status</div>
        <div style={{ display:'flex', alignItems:'center', gap:8, color:DS.green, fontSize:12, fontWeight:700 }}><span>●</span> Operational</div>
      </div>
    </aside>
  )
}

function Hero({ onStart, onTour }) {
  return (
    <Panel style={{ minHeight:300, padding:34, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 75% 20%, rgba(45,182,196,0.24), transparent 32%), linear-gradient(90deg, rgba(8,19,31,0.98), rgba(8,19,31,0.70)), url(/bg-map.png)', backgroundSize:'cover', backgroundPosition:'center', opacity:0.95 }} />
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(45,182,196,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(45,182,196,0.05) 1px, transparent 1px)', backgroundSize:'42px 42px' }} />
      <div style={{ position:'relative', zIndex:1, maxWidth:650 }}>
        <Kicker>AI-Powered Emergency Operations Training</Kicker>
        <h1 style={{ margin:'16px 0 14px', fontSize:48, lineHeight:1.02, color:DS.text, letterSpacing:'-0.04em' }}>Train decision-makers before the incident begins.</h1>
        <p style={{ margin:0, color:DS.muted, fontSize:15, lineHeight:1.8, maxWidth:560 }}>NEXUS EOC places emergency managers inside realistic, role-based incident simulations with dispatches, maps, Community Lifelines, operational consequences, and after-action review.</p>
        <div style={{ display:'flex', gap:12, marginTop:26 }}>
          <button onClick={onStart} style={{ background:DS.teal, color:'#06131B', border:'none', borderRadius:10, padding:'13px 18px', fontSize:12, fontWeight:900, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', boxShadow:'0 0 24px rgba(45,182,196,0.22)' }}>Start Exercise</button>
          <button onClick={onTour} style={{ background:'rgba(22,43,63,0.72)', color:DS.text, border:`1px solid ${DS.border}`, borderRadius:10, padding:'13px 18px', fontSize:12, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}>Guided Tour</button>
        </div>
      </div>
    </Panel>
  )
}

function FeaturedScenarios({ onStart }) {
  const cards = useMemo(() => Object.entries(SCENARIOS).slice(0, 6), [])
  return (
    <Panel style={{ padding:22 }}>
      <SectionHeader label="Featured Scenarios" right={`${Object.keys(SCENARIOS).length} loaded`} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:12 }}>
        {cards.map(([key, sc]) => (
          <button key={key} onClick={onStart} style={{ textAlign:'left', minHeight:142, border:`1px solid ${DS.borderSoft}`, borderRadius:14, padding:14, background:'rgba(8,19,31,0.64)', cursor:'pointer' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div style={{ fontSize:24 }}>{sc.icon}</div>
              <div style={{ fontSize:9, color:DS.teal, letterSpacing:'0.1em', textTransform:'uppercase' }}>Scenario</div>
            </div>
            <div style={{ color:DS.text, fontSize:13, fontWeight:800, letterSpacing:'0.04em', textTransform:'uppercase', marginBottom:8 }}>{sc.name}</div>
            <div style={{ color:DS.muted, fontSize:11, lineHeight:1.55 }}>{sc.desc}</div>
          </button>
        ))}
      </div>
    </Panel>
  )
}

function PlatformSnapshot() {
  const rows = [
    ['Scenario Pack','Operational'],
    ['AI Engine','Online'],
    ['Transcript Export','Available'],
    ['After-Action Review','Ready'],
    ['Version','1.0 UI Build'],
  ]
  return (
    <Panel style={{ padding:20 }}>
      <SectionHeader label="Platform Snapshot" />
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {rows.map(([k,v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${DS.borderSoft}` }}>
            <span style={{ color:DS.dim, fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em' }}>{k}</span>
            <span style={{ color:k==='AI Engine'?DS.green:DS.text, fontSize:12, fontWeight:800 }}>{v}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function ExerciseOutputs() {
  const rows = [
    ['Decision Log','Captured during play'],
    ['Transcript','Exportable record'],
    ['AAR','Generated at ENDEX'],
  ]
  return (
    <Panel style={{ padding:20 }}>
      <SectionHeader label="Exercise Outputs" />
      {rows.map(([k,v]) => (
        <div key={k} style={{ display:'flex', gap:12, alignItems:'center', padding:'12px 0', borderBottom:`1px solid ${DS.borderSoft}` }}>
          <div style={{ width:34, height:34, borderRadius:10, background:DS.tealSoft, border:`1px solid ${DS.borderSoft}`, display:'flex', alignItems:'center', justifyContent:'center', color:DS.teal }}>▤</div>
          <div><div style={{ color:DS.text, fontSize:12, fontWeight:800 }}>{k}</div><div style={{ color:DS.dim, fontSize:11, marginTop:3 }}>{v}</div></div>
        </div>
      ))}
    </Panel>
  )
}

function Workflow() {
  const steps = ['Select Mission','Assume Role','Execute Decisions','Manage Consequences','Review AAR']
  return (
    <Panel style={{ padding:22 }}>
      <SectionHeader label="Training Workflow" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10 }}>
        {steps.map((s,i) => (
          <div key={s} style={{ border:`1px solid ${DS.borderSoft}`, borderRadius:12, background:'rgba(8,19,31,0.52)', padding:14, minHeight:88 }}>
            <div style={{ color:DS.teal, fontSize:10, fontWeight:900, marginBottom:10 }}>0{i+1}</div>
            <div style={{ color:DS.text, fontSize:12, fontWeight:800, lineHeight:1.4 }}>{s}</div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function GuidedTourModal({ onClose, onStart }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:8000, background:'rgba(3,10,18,0.82)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'min(760px, 94vw)', background:'linear-gradient(180deg, #13283A, #08131F)', border:`1px solid ${DS.teal}`, borderRadius:18, boxShadow:'0 30px 90px rgba(0,0,0,0.55)', overflow:'hidden' }}>
        <div style={{ padding:'24px 28px', borderBottom:`1px solid ${DS.borderSoft}` }}>
          <Kicker>Guided Tour</Kicker>
          <div style={{ color:DS.text, fontSize:28, fontWeight:900, marginTop:8 }}>Welcome to the Mission Portal</div>
          <p style={{ color:DS.muted, lineHeight:1.8, margin:'10px 0 0' }}>NEXUS EOC is organized around the training workflow: select a mission, assume a role, manage consequences, and review performance after ENDEX.</p>
        </div>
        <div style={{ padding:28, display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {[
            ['Mission Portal','Your entry point for starting exercises and reviewing platform outputs.'],
            ['Start Exercise','Configure scenario, jurisdiction, difficulty, and role.'],
            ['Live Exercise','Run the incident using dispatches, map, lifelines, and free-text decisions.'],
            ['AAR Page','Review consequences, strengths, gaps, doctrine, and recommendations.'],
          ].map(([h,b]) => <div key={h} style={{ padding:16, border:`1px solid ${DS.borderSoft}`, borderRadius:12, background:'rgba(8,19,31,0.55)' }}><div style={{ color:DS.text, fontWeight:900, marginBottom:6 }}>{h}</div><div style={{ color:DS.muted, fontSize:12, lineHeight:1.7 }}>{b}</div></div>)}
        </div>
        <div style={{ padding:'18px 28px', borderTop:`1px solid ${DS.borderSoft}`, display:'flex', justifyContent:'flex-end', gap:10 }}>
          <button onClick={onClose} style={{ background:'transparent', color:DS.muted, border:`1px solid ${DS.border}`, borderRadius:10, padding:'11px 16px', cursor:'pointer', fontWeight:800 }}>Close</button>
          <button onClick={onStart} style={{ background:DS.teal, color:'#06131B', border:'none', borderRadius:10, padding:'11px 16px', cursor:'pointer', fontWeight:900 }}>Start Exercise</button>
        </div>
      </div>
    </div>
  )
}

export default function MissionPortal({ state, onStartExercise, showGuidedTour, onCloseGuidedTour }) {
  const [tourOpen, setTourOpen] = useState(Boolean(showGuidedTour))
  const openTour = () => setTourOpen(true)
  const closeTour = () => { setTourOpen(false); onCloseGuidedTour?.() }
  const start = () => { onCloseGuidedTour?.(); onStartExercise?.() }

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(135deg, ${DS.bg} 0%, ${DS.bg2} 58%, #07101A 100%)`, color:DS.text, fontFamily:'Inter, Segoe UI, system-ui, sans-serif', display:'flex' }}>
      <Sidebar onStart={start} />
      <main style={{ flex:1, padding:26, overflowY:'auto' }}>
        <Hero onStart={start} onTour={openTour} />
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0, 1fr) 320px', gap:18, marginTop:18 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <FeaturedScenarios onStart={start} />
            <Workflow />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <PlatformSnapshot />
            <ExerciseOutputs />
          </div>
        </div>
        <footer style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:22, color:DS.dim, fontSize:11, letterSpacing:'0.06em' }}>
          <span>NEXUS EOC — Simulated Emergency Operations Platform</span>
          <span>nexuseoc.com · nexuseoc.ai</span>
        </footer>
      </main>
      {tourOpen && <GuidedTourModal onClose={closeTour} onStart={start} />}
    </div>
  )
}
