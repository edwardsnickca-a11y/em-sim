import { useState } from 'react'

const c = {
  bg:'#020B14', panel:'#061625', panel2:'#081C2D', line:'#1D3C58', line2:'#2F79C8', text:'#F3F7FB', muted:'#B8C6D6', dim:'#6F859D', blue:'#2F80ED', cyan:'#33A7FF', teal:'#20D6C7', green:'#38D97A', amber:'#FF9F1C', purple:'#A668FF', red:'#F04444'
}

const scenarioCards = [
  { title:'Hurricane Landfall', desc:'Major hurricane makes landfall with catastrophic impacts.', tags:['Natural Hazard','Wind'], accent:c.red, art:'hurricane' },
  { title:'Riverine Flooding', desc:'Severe river flooding threatens communities and infrastructure.', tags:['Natural Hazard','Flooding'], accent:c.blue, art:'flood' },
  { title:'Industrial Fire', desc:'Chemical plant fire with potential HAZMAT release.', tags:['Technological','HAZMAT'], accent:c.amber, art:'fire' },
  { title:'Tornado Outbreak', desc:'Multiple tornadoes cause widespread damage.', tags:['Natural Hazard','Severe Weather'], accent:c.purple, art:'tornado' },
  { title:'Cyber Attack', desc:'Coordinated cyber attack disrupts critical systems.', tags:['Technological','Cyber'], accent:c.teal, art:'cyber' },
]

const capabilities = [
  ['Adaptive Scenario Engine','AI-driven injects respond to your decisions for realistic, challenging exercises.','brain',c.blue],
  ['NRF / ESF-Grounded','Exercise positions and capabilities aligned to the National Response Framework.','network',c.green],
  ['Dynamic Map & Lifelines','Real-time map updates and lifeline status reflect the evolving operational environment.','map',c.amber],
  ['AAR & Transcript Outputs','Download professional after-action reviews and transcripts in PDF format.','doc',c.purple],
]

const steps = [
  ['Select a Scenario','Choose an emergency operations exercise that matches your training objectives.','target'],
  ['Configure the Exercise','Select your exercise position/function, jurisdiction, and difficulty level.','person'],
  ['Respond to Injects','Review situation updates, map changes, media feeds, and operational flash cards.','signal'],
  ['Make Decisions','Submit detailed EOC-style responses as the scenario evolves.','chat'],
  ['Review Outputs','Download the transcript and After-Action Review PDF.','file'],
]

function Icon({ name, size=28, color='currentColor' }) {
  const p = { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:color, strokeWidth:1.7, strokeLinecap:'round', strokeLinejoin:'round' }
  if (name === 'shield') return <svg {...p}><path d="M12 3 20 6v5c0 5.1-3.2 8.4-8 10-4.8-1.6-8-4.9-8-10V6l8-3Z"/><path d="M9 12l2 2 4-5"/></svg>
  if (name === 'arrow') return <svg {...p}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
  if (name === 'play') return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/></svg>
  if (name === 'brain') return <svg {...p}><path d="M9 4a3 3 0 0 0-4 4 3.5 3.5 0 0 0 .6 6.8A3 3 0 0 0 10 20"/><path d="M15 4a3 3 0 0 1 4 4 3.5 3.5 0 0 1-.6 6.8A3 3 0 0 1 14 20"/><path d="M12 4v16M8 10h4M12 14h4"/></svg>
  if (name === 'network') return <svg {...p}><circle cx="12" cy="5" r="2.5"/><circle cx="6" cy="17" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="M12 7.5v4M8 16l4-4 4 4"/></svg>
  if (name === 'map') return <svg {...p}><path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/><path d="M12 10c0-2 1.4-3.5 3-3.5s3 1.5 3 3.5c0 2.4-3 5.5-3 5.5S12 12.4 12 10Z"/></svg>
  if (name === 'doc') return <svg {...p}><path d="M6 3h9l3 3v15H6V3Z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h5"/></svg>
  if (name === 'target') return <svg {...p}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
  if (name === 'person') return <svg {...p}><circle cx="12" cy="8" r="3.2"/><path d="M5 21a7 7 0 0 1 14 0"/></svg>
  if (name === 'signal') return <svg {...p}><path d="M12 20v-7"/><path d="M8 16a5 5 0 0 1 0-8"/><path d="M16 16a5 5 0 0 0 0-8"/><path d="M5 19a9 9 0 0 1 0-14"/><path d="M19 19a9 9 0 0 0 0-14"/></svg>
  if (name === 'chat') return <svg {...p}><path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4Z"/></svg>
  if (name === 'file') return <svg {...p}><path d="M6 3h9l3 3v15H6V3Z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 17h6"/></svg>
  if (name === 'chev') return <svg {...p}><path d="m9 6 6 6-6 6"/></svg>
  return <svg {...p}><circle cx="12" cy="12" r="9"/></svg>
}

function NexusLogo() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ width:44, height:44, display:'grid', placeItems:'center', color:'#7EB6FF' }}><Icon name="shield" size={42} color="#7EB6FF" /></div>
      <div style={{ display:'flex', alignItems:'center', gap:18 }}>
        <div style={{ fontSize:30, fontWeight:900, letterSpacing:'0.08em', color:c.text }}>NEXUS EOC</div>
        <div style={{ height:34, width:1, background:'rgba(255,255,255,0.22)' }} />
        <div style={{ fontSize:14, lineHeight:1.25, color:c.text }}>Simulated Emergency<br />Operations Platform</div>
      </div>
    </div>
  )
}

function HeroBackdrop() {
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(2,11,20,0.96) 0%, rgba(2,11,20,0.84) 38%, rgba(2,11,20,0.30) 67%, rgba(2,11,20,0.86) 100%), radial-gradient(circle at 78% 22%, rgba(47,128,237,0.24), transparent 22%), linear-gradient(135deg, #071A2B, #0B2236 45%, #040B13)' }} />
      <div style={{ position:'absolute', inset:0, opacity:0.42, backgroundImage:'linear-gradient(rgba(51,167,255,0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(51,167,255,0.09) 1px, transparent 1px)', backgroundSize:'46px 46px' }} />
      <div style={{ position:'absolute', right:0, top:0, width:'62%', height:'100%', opacity:0.88, background:'radial-gradient(circle at 74% 34%, rgba(255,255,255,0.85) 0 2px, transparent 3px), radial-gradient(circle at 65% 50%, rgba(51,167,255,0.75) 0 1px, transparent 2px), radial-gradient(circle at 52% 58%, rgba(32,214,199,0.55) 0 1px, transparent 2px), linear-gradient(160deg, transparent 0%, rgba(19,73,112,0.34) 36%, transparent 70%)', backgroundSize:'170px 120px, 120px 92px, 88px 72px, cover' }} />
      <div style={{ position:'absolute', right:80, top:34, width:150, height:150, borderRadius:'50%', border:'18px solid rgba(210,232,255,0.16)', boxShadow:'0 0 60px rgba(51,167,255,0.20)', transform:'rotate(-28deg)' }} />
    </div>
  )
}

function Button({ children, variant='primary', onClick, icon }) {
  const primary = variant === 'primary'
  return (
    <button onClick={onClick} style={{ height:54, minWidth:220, padding:'0 22px', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:13, borderRadius:6, border:primary ? '1px solid rgba(126,182,255,0.55)' : '1px solid rgba(47,128,237,0.78)', background:primary ? 'linear-gradient(180deg, #1C69E8, #1555C8)' : 'rgba(1,9,18,0.60)', color:c.text, fontSize:16, fontWeight:800, cursor:'pointer', boxShadow:primary ? '0 10px 28px rgba(21,85,200,0.34)' : 'none' }}>
      {icon}{children}{primary ? <Icon name="chev" size={28} color="white" /> : null}
    </button>
  )
}

function Capability({ title, body, icon, accent }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'76px 1fr', gap:16, alignItems:'center', padding:'16px 18px', borderRight:'1px solid rgba(255,255,255,0.10)' }}>
      <div style={{ width:76, height:76, borderRadius:'50%', border:`1px solid ${accent}`, display:'grid', placeItems:'center', color:accent, background:'rgba(2,11,20,0.46)' }}><Icon name={icon} size={44} color={accent}/></div>
      <div>
        <div style={{ color:accent, fontSize:12, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:900, marginBottom:6 }}>{title}</div>
        <div style={{ color:c.muted, fontSize:12, lineHeight:1.52 }}>{body}</div>
      </div>
    </div>
  )
}

function ScenarioArt({ type }) {
  const styles = {
    hurricane:'radial-gradient(circle at 42% 42%, #f0f6fb 0 3%, #a2b5c7 4% 8%, #2d4a5f 10% 15%, transparent 16%), conic-gradient(from 40deg at 42% 42%, #eef8ff, #6e879b, #12293b, #eef8ff, #223f57, #eef8ff)',
    flood:'linear-gradient(165deg, rgba(223,236,246,0.58), transparent 30%), radial-gradient(circle at 30% 80%, rgba(47,128,237,0.42), transparent 30%), linear-gradient(135deg, #203b4a, #718f82 45%, #14283a)',
    fire:'radial-gradient(circle at 70% 62%, rgba(255,159,28,0.84), transparent 18%), radial-gradient(circle at 48% 66%, rgba(240,68,68,0.68), transparent 16%), linear-gradient(135deg, #121018, #4a1b12 48%, #9b470e)',
    tornado:'radial-gradient(ellipse at 42% 28%, rgba(225,231,238,0.72), transparent 16%), radial-gradient(ellipse at 54% 55%, rgba(170,120,255,0.36), transparent 22%), linear-gradient(160deg, #172334, #8992a0 44%, #1d2632)',
    cyber:'radial-gradient(circle at 64% 50%, rgba(32,214,199,0.35), transparent 24%), linear-gradient(135deg, #04111c, #093054 50%, #020b14)'
  }
  return <div style={{ height:110, borderBottom:`1px solid ${c.line}`, background:styles[type] || styles.cyber, position:'relative', overflow:'hidden' }}><div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize:'22px 22px', opacity:0.25 }} /></div>
}

function ScenarioCard({ s, onStart }) {
  return (
    <div style={{ border:`1px solid ${c.line}`, borderRadius:4, overflow:'hidden', background:'rgba(5,20,34,0.90)' }}>
      <div style={{ position:'relative' }}>
        <ScenarioArt type={s.art}/>
        <div style={{ position:'absolute', left:10, top:10, width:33, height:33, borderRadius:4, display:'grid', placeItems:'center', border:`1px solid ${s.accent}`, background:'rgba(2,11,20,0.74)', color:s.accent, fontSize:19 }}>◉</div>
      </div>
      <div style={{ padding:'12px 12px 10px' }}>
        <div style={{ color:c.text, fontWeight:900, fontSize:15, marginBottom:6 }}>{s.title}</div>
        <div style={{ color:c.text, fontSize:12.5, lineHeight:1.35, minHeight:34 }}>{s.desc}</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
          {s.tags.map(t => <span key={t} style={{ background:`${s.accent}24`, border:`1px solid ${s.accent}55`, color:s.accent, padding:'3px 7px', borderRadius:4, fontSize:11 }}>{t}</span>)}
        </div>
        <button onClick={onStart} style={{ marginTop:10, width:'100%', height:30, border:`1px solid ${c.line2}`, borderRadius:4, background:'rgba(2,11,20,0.55)', color:'#56B7FF', fontWeight:800, fontSize:13, cursor:'pointer' }}>Start Scenario</button>
      </div>
    </div>
  )
}

function OutputsRail() {
  return (
    <aside style={{ width:380, flexShrink:0, padding:'22px 22px 22px 24px', borderLeft:`1px solid ${c.line}`, background:'rgba(3,13,23,0.64)' }}>
      <div style={{ height:'100%', border:`1px solid ${c.line}`, boxShadow:'inset 0 0 60px rgba(47,128,237,0.06)', padding:22 }}>
        <h2 style={{ color:c.text, fontSize:18, letterSpacing:'0.04em', margin:'0 0 12px', textTransform:'uppercase' }}>Exercise Outputs</h2>
        <div style={{ width:34, height:2, background:c.blue, marginBottom:26 }} />
        <OutputItem color={c.blue} title="After-Action Review PDF" body="Strengths, gaps, recommendations, and doctrine/reference notes." />
        <OutputItem color={c.green} title="Exercise Transcript PDF" body="Full record of injects, user responses, map updates, media, lifeline states, and scenario progression." />
        <div style={{ height:1, background:'rgba(255,255,255,0.14)', margin:'34px 0 28px' }} />
        <div style={{ height:168, border:`1px solid ${c.line}`, background:'linear-gradient(135deg, rgba(6,25,41,0.8), rgba(3,12,21,0.94)), radial-gradient(circle at 62% 38%, rgba(51,167,255,0.30), transparent 35%)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(51,167,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(51,167,255,0.10) 1px, transparent 1px)', backgroundSize:'24px 24px', opacity:0.35 }} />
        </div>
        <div style={{ marginTop:40 }}>
          <div style={{ color:c.blue, fontSize:22, fontWeight:900, marginBottom:8 }}>Professional training.</div>
          <div style={{ color:c.text, fontSize:17 }}>Stronger decisions. Safer communities.</div>
        </div>
      </div>
    </aside>
  )
}

function OutputItem({ color, title, body }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'58px 1fr', gap:16, marginBottom:30, alignItems:'start' }}>
      <div style={{ width:54, height:58, borderRadius:6, border:`1px solid ${color}`, display:'grid', placeItems:'center', color }}><Icon name="file" size={34} color={color}/></div>
      <div>
        <div style={{ color:c.text, fontSize:16, fontWeight:900, marginTop:2 }}>{title}</div>
        <div style={{ color:c.muted, fontSize:14, lineHeight:1.5, marginTop:7 }}>{body}</div>
      </div>
    </div>
  )
}

function Workflow({ onStart }) {
  return (
    <section style={{ border:`1px solid ${c.line}`, borderRadius:4, padding:'10px 18px 14px', background:'rgba(2,11,20,0.40)' }}>
      <h2 style={{ color:c.text, fontSize:17, margin:'0 0 14px', textTransform:'uppercase', borderLeft:`2px solid ${c.blue}`, paddingLeft:8 }}>How NEXUS EOC Works</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:18, alignItems:'start' }}>
        {steps.map((step, i) => <div key={step[0]} style={{ display:'grid', gridTemplateColumns:'82px 1fr', gap:12, position:'relative' }}>
          {i < 4 && <div style={{ position:'absolute', right:-14, top:34, color:c.dim, fontSize:30 }}>›</div>}
          <div style={{ width:68, height:68, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.22)', display:'grid', placeItems:'center', position:'relative' }}>
            <div style={{ position:'absolute', left:-10, top:-2, width:22, height:22, borderRadius:'50%', border:`1px solid ${c.blue}`, color:c.blue, display:'grid', placeItems:'center', fontSize:12 }}>{i+1}</div>
            <Icon name={step[2]} size={34} color={c.text} />
          </div>
          <div>
            <div style={{ color:'#BFE2FF', fontWeight:900, fontSize:13, marginBottom:7 }}>{i+1}. {step[0]}</div>
            <div style={{ color:c.text, fontSize:12.5, lineHeight:1.45 }}>{step[1]}</div>
          </div>
        </div>)}
      </div>
      <div style={{ marginTop:14, textAlign:'center', color:c.cyan, fontSize:14 }}>★&nbsp;&nbsp;More detailed responses produce stronger injects, feedback, transcripts, and after-action insights.</div>
    </section>
  )
}

export default function MissionPortal({ onStartExercise }) {
  const [tourNote, setTourNote] = useState(false)
  const start = () => onStartExercise?.()
  const tour = () => setTourNote(true)
  return (
    <div style={{ minHeight:'100vh', background:`radial-gradient(circle at 18% 15%, rgba(47,128,237,0.14), transparent 34%), linear-gradient(180deg, ${c.bg}, #010712 80%)`, color:c.text, fontFamily:'Inter, Segoe UI, system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <header style={{ height:74, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', borderBottom:`1px solid ${c.line}`, background:'rgba(2,11,20,0.84)' }}>
        <NexusLogo />
        <button onClick={start} style={{ height:40, padding:'0 18px', display:'flex', alignItems:'center', gap:9, borderRadius:4, border:'1px solid rgba(126,182,255,0.50)', background:'linear-gradient(180deg, #1557C7, #0E3F96)', color:c.text, fontSize:16, fontWeight:800, cursor:'pointer' }}>Start Exercise <Icon name="chev" size={24} color="white" /></button>
      </header>

      <div style={{ display:'flex', maxWidth:1600, margin:'0 auto' }}>
        <main style={{ flex:1, minWidth:0, padding:'0 28px 20px' }}>
          <section style={{ position:'relative', minHeight:310, overflow:'hidden', borderBottom:`1px solid ${c.line}` }}>
            <HeroBackdrop />
            <div style={{ position:'relative', zIndex:2, padding:'36px 0 26px', maxWidth:720 }}>
              <h1 style={{ margin:0, color:c.text, fontSize:62, lineHeight:0.95, fontWeight:950, letterSpacing:'0.06em', textShadow:'0 2px 18px rgba(0,0,0,0.65)' }}>MISSION PORTAL</h1>
              <div style={{ color:c.blue, fontSize:36, lineHeight:1.1, marginTop:8, fontWeight:850 }}>Train. Decide. Lead.</div>
              <p style={{ color:c.text, fontSize:18, lineHeight:1.45, maxWidth:560, margin:'16px 0 26px' }}>AI-powered emergency operations training for EOCs, emergency managers, and response partners.</p>
              <div style={{ display:'flex', gap:24 }}>
                <Button onClick={start}>Start Exercise</Button>
                <Button variant="secondary" onClick={tour} icon={<Icon name="play" size={26} color={c.blue}/>}>Guided Tour</Button>
              </div>
              {tourNote && <div style={{ marginTop:12, color:c.dim, fontSize:12 }}>Guided Tour TODO: wire to approved modal when available.</div>}
            </div>
          </section>

          <section style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', borderBottom:`1px solid ${c.line}` }}>
            {capabilities.map(x => <Capability key={x[0]} title={x[0]} body={x[1]} icon={x[2]} accent={x[3]} />)}
          </section>

          <section style={{ border:`1px solid ${c.line}`, borderRadius:4, padding:'12px 14px 14px', marginTop:14, background:'rgba(2,11,20,0.38)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <h2 style={{ margin:0, color:c.text, fontSize:17, textTransform:'uppercase', borderLeft:`2px solid ${c.blue}`, paddingLeft:8 }}>Featured Scenarios</h2>
              <button onClick={start} style={{ background:'transparent', border:'none', color:c.cyan, cursor:'pointer', fontSize:12 }}>View All Scenarios <Icon name="chev" size={18} color={c.cyan}/></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:14 }}>
              {scenarioCards.map(s => <ScenarioCard key={s.title} s={s} onStart={start} />)}
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginTop:8, color:c.dim }}><span>‹</span><span style={{ width:16, height:5, borderRadius:10, background:c.blue }} /><span style={{ width:8, height:8, borderRadius:'50%', background:'#4B5E72' }} /><span style={{ width:8, height:8, borderRadius:'50%', background:'#4B5E72' }} /><span style={{ width:8, height:8, borderRadius:'50%', background:'#4B5E72' }} /><span>›</span></div>
          </section>

          <div style={{ marginTop:14 }}><Workflow onStart={start} /></div>
          <footer style={{ height:42, display:'flex', alignItems:'center', justifyContent:'center', color:c.blue, fontSize:13 }}><button style={{ color:c.blue, background:'transparent', border:'none', cursor:'pointer', fontSize:13 }}>About NEXUS EOC</button></footer>
        </main>
        <OutputsRail />
      </div>
    </div>
  )
}
