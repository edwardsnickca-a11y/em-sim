import { useMemo, useState } from 'react'
import { SCENARIOS, DIFFICULTIES } from '../../data/scenarios'
import { JURISDICTIONS, JURISDICTION_CONTEXT } from '../../data/jurisdictions'
import { ROLES, ROLE_GROUPS } from '../../data/roles'

const DS = {
  bg:'#08131F',
  bg2:'#0C1B2A',
  panel:'#112436',
  panel2:'#162B3F',
  panel3:'#0E2030',
  border:'#294A63',
  borderSoft:'rgba(80, 140, 170, 0.28)',
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

const difficultyText = {
  Basic:'Introductory pace with generous evaluation and fewer cascading problems.',
  Moderate:'Balanced operational pressure with realistic resource and coordination friction.',
  Advanced:'Professional rigor. Multiple complications, tighter timelines, and real resource constraints.',
  Brutal:'Ruthless evaluation. Vague, late, or incomplete decisions cascade quickly.',
  Adaptive:'The AI adjusts to demonstrated competence and keeps pressure realistic.',
}

function FieldLabel({ children }) {
  return <div style={{ fontSize:10, color:DS.muted, textTransform:'uppercase', letterSpacing:'0.13em', marginBottom:7 }}>{children}</div>
}

function SelectField({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange} style={{ width:'100%', height:42, background:DS.bg2, color:DS.text, border:`1px solid ${DS.borderSoft}`, borderRadius:6, padding:'0 12px', fontFamily:'Inter, system-ui, sans-serif', fontSize:13, outline:'none' }}>
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

export default function StartExercise({ state, update, startScenario, initLoading=false, onMissionPortal }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')

  const scenarioEntries = useMemo(() => Object.entries(SCENARIOS), [])
  const scenarioTypes = ['All', 'Natural Hazards', 'Infrastructure', 'Security', 'Hazmat / MCI']

  const classifiedScenarios = useMemo(() => {
    return scenarioEntries.map(([key, sc]) => {
      const name = `${sc.name} ${sc.desc}`.toLowerCase()
      let type = 'Natural Hazards'
      if (name.includes('cyber') || name.includes('power') || name.includes('infrastructure')) type = 'Infrastructure'
      if (name.includes('terror') || name.includes('rdd') || name.includes('active shooter')) type = 'Security'
      if (name.includes('hazmat') || name.includes('train') || name.includes('casualty') || name.includes('mci')) type = 'Hazmat / MCI'
      return [key, sc, type]
    })
  }, [scenarioEntries])

  const filtered = classifiedScenarios.filter(([key, sc, type]) => {
    const q = query.trim().toLowerCase()
    const matchesQuery = !q || sc.name.toLowerCase().includes(q) || sc.desc.toLowerCase().includes(q) || key.toLowerCase().includes(q)
    const matchesFilter = filter === 'All' || type === filter
    return matchesQuery && matchesFilter
  })

  const selectedScenario = state.scenario ? SCENARIOS[state.scenario] : null
  const jurisdiction = JURISDICTION_CONTEXT[state.jurisdiction]
  const selectedRole = state.role || 'EOC Director'
  const canLaunch = Boolean(state.scenario) && !initLoading

  return (
    <div style={{ minHeight:'100vh', background:`radial-gradient(circle at 72% 8%, rgba(45,182,196,0.14), transparent 30%), linear-gradient(135deg, ${DS.bg}, ${DS.bg2} 55%, #06101A)`, color:DS.text, fontFamily:'Inter, system-ui, sans-serif' }}>
      <div style={{ minHeight:'100vh', backgroundImage:'linear-gradient(rgba(45,182,196,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(45,182,196,0.045) 1px, transparent 1px)', backgroundSize:'48px 48px' }}>
        <header style={{ height:70, borderBottom:`1px solid ${DS.borderSoft}`, background:'rgba(8,19,31,0.86)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', boxSizing:'border-box' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:34, height:34, border:`1px solid ${DS.teal}`, borderRadius:8, display:'grid', placeItems:'center', color:DS.teal, fontWeight:800, letterSpacing:'0.04em', boxShadow:'0 0 24px rgba(45,182,196,0.12)' }}>N</div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, letterSpacing:'0.14em' }}>NEXUS EOC</div>
              <div style={{ fontSize:10, color:DS.dim, letterSpacing:'0.12em', textTransform:'uppercase' }}>Start Exercise</div>
            </div>
          </div>
          <nav style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={onMissionPortal} style={{ background:'transparent', color:DS.muted, border:`1px solid ${DS.borderSoft}`, borderRadius:7, height:36, padding:'0 14px', cursor:'pointer', fontWeight:700, letterSpacing:'0.04em' }}>Mission Portal</button>
            <button style={{ background:'transparent', color:DS.muted, border:`1px solid ${DS.borderSoft}`, borderRadius:7, height:36, padding:'0 14px', cursor:'pointer', fontWeight:700, letterSpacing:'0.04em' }}>Help</button>
          </nav>
        </header>

        <main style={{ maxWidth:1440, margin:'0 auto', padding:'28px', boxSizing:'border-box' }}>
          <div style={{ display:'grid', gridTemplateColumns:'minmax(680px, 1fr) 420px', gap:24, alignItems:'start' }}>
            <section style={{ background:'rgba(17,36,54,0.84)', border:`1px solid ${DS.borderSoft}`, borderRadius:18, boxShadow:'0 22px 70px rgba(0,0,0,0.28)', overflow:'hidden' }}>
              <div style={{ padding:'24px 26px 20px', borderBottom:`1px solid ${DS.borderSoft}` }}>
                <div style={{ color:DS.teal, fontSize:11, textTransform:'uppercase', letterSpacing:'0.18em', fontWeight:800, marginBottom:8 }}>Configure Mission</div>
                <h1 style={{ margin:'0 0 8px', fontSize:34, lineHeight:1.05, letterSpacing:'-0.03em' }}>Start Exercise</h1>
                <p style={{ margin:0, color:DS.muted, maxWidth:720, lineHeight:1.65, fontSize:14 }}>Select the incident, operating role, jurisdiction, and difficulty profile before launching the live exercise dashboard.</p>
              </div>

              <div style={{ padding:26 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 190px', gap:12, marginBottom:18 }}>
                  <div>
                    <FieldLabel>Select Scenario</FieldLabel>
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search scenarios..." style={{ width:'100%', height:42, background:DS.bg2, color:DS.text, border:`1px solid ${DS.borderSoft}`, borderRadius:6, padding:'0 12px', boxSizing:'border-box', fontSize:13, outline:'none' }} />
                  </div>
                  <div>
                    <FieldLabel>Filter</FieldLabel>
                    <SelectField value={filter} onChange={e => setFilter(e.target.value)}>
                      {scenarioTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </SelectField>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:12, marginBottom:26 }}>
                  {filtered.map(([key, sc, type]) => {
                    const selected = state.scenario === key
                    return (
                      <button key={key} onClick={() => update({ scenario:key })} style={{ position:'relative', textAlign:'left', minHeight:134, padding:16, borderRadius:12, border:`1px solid ${selected ? DS.teal : DS.borderSoft}`, background:selected ? 'linear-gradient(180deg, rgba(45,182,196,0.18), rgba(17,36,54,0.96))' : 'rgba(12,27,42,0.82)', color:DS.text, cursor:'pointer', boxShadow:selected ? '0 0 0 1px rgba(45,182,196,0.18), 0 16px 40px rgba(0,0,0,0.2)' : 'none' }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:10 }}>
                          <div style={{ fontSize:24 }}>{sc.icon}</div>
                          {selected && <div style={{ fontSize:10, color:DS.bg, background:DS.teal, borderRadius:999, padding:'4px 7px', fontWeight:900, letterSpacing:'0.08em' }}>SELECTED</div>}
                        </div>
                        <div style={{ fontSize:14, fontWeight:800, marginBottom:7, letterSpacing:'0.01em' }}>{sc.name}</div>
                        <div style={{ fontSize:12, color:DS.muted, lineHeight:1.55 }}>{sc.desc}</div>
                        <div style={{ marginTop:12, fontSize:10, color:DS.dim, textTransform:'uppercase', letterSpacing:'0.11em' }}>{type}</div>
                      </button>
                    )
                  })}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
                  <div>
                    <FieldLabel>Enter Participant Name — Optional</FieldLabel>
                    <input type="text" value={state.playerName || ''} onChange={e => update({ playerName:e.target.value })} placeholder="N. Edwards" maxLength={40} style={{ width:'100%', height:42, background:DS.bg2, color:DS.text, border:`1px solid ${DS.borderSoft}`, borderRadius:6, padding:'0 12px', boxSizing:'border-box', fontSize:13, outline:'none' }} />
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

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:24 }}>
                  <div>
                    <FieldLabel>Select Jurisdiction</FieldLabel>
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

                <button onClick={() => canLaunch && startScenario(state.scenario)} disabled={!canLaunch} style={{ width:'100%', height:52, border:'none', borderRadius:10, background:canLaunch ? `linear-gradient(135deg, ${DS.teal}, #63D4DF)` : 'rgba(80,140,170,0.18)', color:canLaunch ? '#06101A' : DS.dim, cursor:canLaunch ? 'pointer' : 'not-allowed', fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', boxShadow:canLaunch ? '0 18px 44px rgba(45,182,196,0.18)' : 'none' }}>
                  {initLoading ? 'Generating Scenario World...' : canLaunch ? 'Start Exercise' : 'Select a scenario to begin'}
                </button>
              </div>
            </section>

            <aside style={{ background:'rgba(17,36,54,0.9)', border:`1px solid ${DS.borderSoft}`, borderRadius:18, boxShadow:'0 22px 70px rgba(0,0,0,0.28)', overflow:'hidden', position:'sticky', top:24 }}>
              <div style={{ padding:'22px 22px 18px', borderBottom:`1px solid ${DS.borderSoft}`, background:'linear-gradient(180deg, rgba(45,182,196,0.11), rgba(17,36,54,0))' }}>
                <div style={{ color:DS.teal, fontSize:11, textTransform:'uppercase', letterSpacing:'0.18em', fontWeight:800, marginBottom:8 }}>Confirm Your Scenario</div>
                <h2 style={{ margin:0, fontSize:24, letterSpacing:'-0.02em' }}>{selectedScenario ? selectedScenario.name : 'Awaiting Selection'}</h2>
                <p style={{ color:DS.muted, lineHeight:1.65, fontSize:13, margin:'10px 0 0' }}>{selectedScenario ? selectedScenario.desc : 'Choose a scenario from the mission library to configure the exercise.'}</p>
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
                  <div style={{ fontSize:12, color:DS.muted, lineHeight:1.55, marginTop:7 }}>{jurisdiction?.desc}</div>
                  <div style={{ fontSize:12, color:DS.dim, lineHeight:1.55, marginTop:7 }}><span style={{ color:DS.amber }}>Constraints:</span> {jurisdiction?.constraints}</div>
                </div>
                <InfoRow label="Difficulty Profile" value={`${state.difficulty} — ${difficultyText[state.difficulty] || ''}`} />
                <div style={{ padding:'14px 0 0' }}>
                  <div style={{ fontSize:10, color:DS.dim, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>Response Guidance</div>
                  <div style={{ border:`1px solid ${DS.borderSoft}`, borderRadius:12, background:'rgba(8,19,31,0.58)', padding:14, color:DS.muted, fontSize:12, lineHeight:1.7 }}>
                    Give clear operational direction. Identify who is responsible, what information you need, what resources are required, and what priority decisions must be made next.
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}
