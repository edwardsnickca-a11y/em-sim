import { useMemo, useState } from 'react'

const GROUPS = [
  {
    name: 'Core',
    items: [
      ['portal', 'Mission Portal'],
      ['setup', 'Scenario Setup'],
      ['turn-0', 'Live Exercise — Turn 0'],
      ['mid-exercise', 'Live Exercise — Mid-Exercise'],
      ['consequence', 'Consequence Update'],
      ['endex-confirm', 'ENDEX Confirmation'],
    ],
  },
  {
    name: 'Team Exercise',
    items: [
      ['host-lobby', 'Host Lobby'],
      ['player-waiting', 'Player Waiting Room'],
      ['team-2', 'Active Room — 2 Players'],
      ['team-8', 'Active Room — 8 Players'],
      ['waiting-submissions', 'Waiting for Submissions'],
      ['shared-turn', 'Shared Turn Processing'],
      ['team-chat', 'Team Chat / Private Messages'],
      ['generating-aar', 'Generating Team AAR'],
    ],
  },
  {
    name: 'Reports',
    items: [
      ['solo-aar', 'Solo AAR'],
      ['team-aar-short', 'Team AAR — Short'],
      ['team-aar-long', 'Team AAR — Long / Multipage'],
      ['facilitator-aar', 'Facilitator AAR'],
      ['transcript', 'Transcript'],
    ],
  },
  {
    name: 'Errors',
    items: [
      ['invalid-room', 'Invalid Room Code'],
      ['duplicate-role', 'Duplicate Role'],
      ['room-full', 'Room Full'],
      ['ai-failure', 'AI Failure'],
      ['redis-failure', 'Redis Failure'],
      ['aar-retry', 'AAR Retry'],
    ],
  },
]

const SMOKE_TESTS = [
  'Create room',
  'Join second browser',
  'Prevent duplicate role',
  'STARTEX synchronizes',
  'Both players receive same turn',
  'Team chat and private messages work',
  'ENDEX modal appears for everyone',
  'AAR completes',
  'AAR PDF downloads fully',
  'Transcript downloads',
]

function getEnvironment() {
  if (typeof window === 'undefined') return { allowed: false, label: 'UNKNOWN' }
  const hostname = window.location.hostname.toLowerCase()
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'
  const isProductionDomain = hostname === 'nexuseoc.com' || hostname === 'www.nexuseoc.com'
  const isVercelPreview = hostname.endsWith('.vercel.app') && !isProductionDomain
  return {
    allowed: Boolean(import.meta.env.DEV || isLocal || isVercelPreview),
    label: isLocal || import.meta.env.DEV ? 'LOCAL' : isVercelPreview ? 'VERCEL PREVIEW' : 'PRODUCTION',
  }
}

function buttonStyle(active = false) {
  return {
    width: '100%',
    border: `1px solid ${active ? 'rgba(45,226,184,.72)' : 'rgba(87,146,198,.23)'}`,
    background: active ? 'rgba(45,226,184,.10)' : 'rgba(5,18,31,.74)',
    color: active ? '#E9FFF9' : '#C9D6E4',
    borderRadius: 7,
    padding: '9px 10px',
    textAlign: 'left',
    fontSize: 12,
    cursor: 'pointer',
  }
}

export default function TestConsole() {
  const environment = useMemo(getEnvironment, [])
  const [selected, setSelected] = useState('portal')
  const [perspective, setPerspective] = useState('host')
  const [fixtureSize, setFixtureSize] = useState('long')
  const [checks, setChecks] = useState({})

  if (!environment.allowed) {
    return (
      <main style={{ minHeight:'100vh', background:'#020B13', color:'#F4F8FE', display:'grid', placeItems:'center', fontFamily:'Inter, system-ui, sans-serif' }}>
        <section style={{ width:'min(520px, 90vw)', border:'1px solid rgba(226,75,74,.45)', background:'rgba(7,20,33,.94)', borderRadius:12, padding:28 }}>
          <div style={{ color:'#E24B4A', fontSize:12, fontWeight:800, letterSpacing:'.14em', marginBottom:10 }}>NOT AVAILABLE IN PRODUCTION</div>
          <h1 style={{ margin:'0 0 10px', fontSize:24 }}>NEXUS EOC Test Console</h1>
          <p style={{ margin:0, color:'#AFC0D2', lineHeight:1.6 }}>This internal QA route is restricted to localhost and Vercel Preview deployments.</p>
        </section>
      </main>
    )
  }

  const selectedLabel = GROUPS.flatMap(group => group.items).find(([id]) => id === selected)?.[1] || selected

  return (
    <main style={{ minHeight:'100vh', background:'#020B13', color:'#F4F8FE', fontFamily:'Inter, system-ui, sans-serif' }}>
      <header style={{ height:64, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', borderBottom:'1px solid rgba(87,146,198,.25)', background:'rgba(4,17,29,.96)' }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, letterSpacing:'.02em' }}>NEXUS EOC Test Console</div>
          <div style={{ fontSize:11, color:'#7F93A8', marginTop:3 }}>Internal QA utility using production components and fixture data</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ border:'1px solid rgba(45,226,184,.50)', color:'#2DE2B8', background:'rgba(45,226,184,.08)', padding:'6px 9px', borderRadius:999, fontSize:11, fontWeight:800 }}>{environment.label}</span>
          <span style={{ color:'#E24B4A', fontSize:11, fontWeight:800 }}>NOT AVAILABLE IN PRODUCTION</span>
          <button type="button" onClick={() => { setSelected('portal'); setPerspective('host'); setFixtureSize('long'); setChecks({}) }} style={{ border:'1px solid rgba(87,146,198,.35)', background:'#091827', color:'#DCE7F2', borderRadius:7, padding:'8px 11px', cursor:'pointer' }}>Reset Test State</button>
        </div>
      </header>

      <div style={{ display:'grid', gridTemplateColumns:'248px minmax(0,1fr) 280px', minHeight:'calc(100vh - 64px)' }}>
        <aside style={{ borderRight:'1px solid rgba(87,146,198,.22)', padding:14, overflowY:'auto', background:'rgba(3,14,24,.92)' }}>
          {GROUPS.map(group => (
            <section key={group.name} style={{ marginBottom:18 }}>
              <div style={{ color:'#6F8195', fontSize:10, fontWeight:900, letterSpacing:'.14em', textTransform:'uppercase', margin:'0 0 7px 4px' }}>{group.name}</div>
              <div style={{ display:'grid', gap:6 }}>
                {group.items.map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setSelected(id)} style={buttonStyle(selected === id)}>{label}</button>
                ))}
              </div>
            </section>
          ))}
        </aside>

        <section style={{ padding:18, minWidth:0 }}>
          <div style={{ height:'100%', minHeight:620, border:'1px solid rgba(87,146,198,.28)', borderRadius:10, background:'rgba(4,17,29,.74)', overflow:'hidden' }}>
            <div style={{ height:43, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', borderBottom:'1px solid rgba(87,146,198,.22)', background:'rgba(7,24,39,.92)' }}>
              <strong style={{ fontSize:13 }}>{selectedLabel}</strong>
              <span style={{ fontSize:11, color:'#7F93A8' }}>Fixture state shell — production component wiring comes next</span>
            </div>
            <div style={{ minHeight:575, display:'grid', placeItems:'center', padding:24 }}>
              <div style={{ width:'min(650px, 90%)', border:'1px dashed rgba(69,163,255,.42)', borderRadius:10, padding:30, textAlign:'center', background:'rgba(2,11,19,.52)' }}>
                <div style={{ color:'#45A3FF', fontSize:12, fontWeight:900, letterSpacing:'.12em', marginBottom:9 }}>TEST STATE READY</div>
                <h2 style={{ margin:'0 0 10px', fontSize:24 }}>{selectedLabel}</h2>
                <p style={{ margin:'0 auto', maxWidth:520, color:'#AFC0D2', lineHeight:1.6, fontSize:13 }}>
                  This first build establishes the protected console, state catalog, fixture controls, and smoke-test workflow. The next step will connect selected states to the actual NEXUS EOC production components.
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside style={{ borderLeft:'1px solid rgba(87,146,198,.22)', padding:14, overflowY:'auto', background:'rgba(3,14,24,.92)' }}>
          <section style={{ marginBottom:18 }}>
            <div style={{ color:'#6F8195', fontSize:10, fontWeight:900, letterSpacing:'.14em', textTransform:'uppercase', marginBottom:8 }}>Test Controls</div>
            <label style={{ display:'grid', gap:5, color:'#AFC0D2', fontSize:11, marginBottom:10 }}>
              Perspective
              <select value={perspective} onChange={event => setPerspective(event.target.value)} style={{ background:'#071522', color:'#E6EEF7', border:'1px solid rgba(87,146,198,.30)', borderRadius:7, padding:8 }}>
                <option value="host">Host / Facilitator</option>
                <option value="player-1">Player — EOC Director</option>
                <option value="player-2">Player — Operations Chief</option>
              </select>
            </label>
            <label style={{ display:'grid', gap:5, color:'#AFC0D2', fontSize:11, marginBottom:10 }}>
              Fixture size
              <select value={fixtureSize} onChange={event => setFixtureSize(event.target.value)} style={{ background:'#071522', color:'#E6EEF7', border:'1px solid rgba(87,146,198,.30)', borderRadius:7, padding:8 }}>
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long / Multipage</option>
              </select>
            </label>
            <button type="button" disabled style={{ ...buttonStyle(false), opacity:.55, cursor:'not-allowed', marginTop:5 }}>Load Selected Fixture</button>
          </section>

          <section>
            <div style={{ color:'#6F8195', fontSize:10, fontWeight:900, letterSpacing:'.14em', textTransform:'uppercase', marginBottom:8 }}>Smoke Test</div>
            <div style={{ display:'grid', gap:7 }}>
              {SMOKE_TESTS.map((item, index) => (
                <label key={item} style={{ display:'grid', gridTemplateColumns:'18px 1fr', gap:7, alignItems:'start', color:'#C8D5E2', fontSize:11, lineHeight:1.35 }}>
                  <input type="checkbox" checked={Boolean(checks[index])} onChange={() => setChecks(previous => ({ ...previous, [index]: !previous[index] }))} />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}
