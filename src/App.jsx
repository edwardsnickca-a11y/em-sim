import { useState, useRef, useEffect, useCallback } from 'react'

const SCENARIOS = {
  hurricane:  { name: 'Hurricane Landfall',          icon: '🌀', desc: 'Cat 4/5 landfall on a coastal county. 72-hour warning window closing fast.' },
  mci:        { name: 'Mass Casualty Incident',       icon: '🚨', desc: 'Explosion at a crowded public event. 200+ casualties. Cause unknown.' },
  hazmat:     { name: 'Hazardous Materials Release',  icon: '☣️', desc: 'Railcar derailment with chlorine release. Urban corridor. Shelter-in-place decision imminent.' },
  cyber:      { name: 'Cyber-Infrastructure Cascade', icon: '💻', desc: 'Ransomware hits water and power utilities simultaneously. Public services degrading.' },
  earthquake: { name: 'Major Earthquake',             icon: '🏚️', desc: 'M7.1 strike-slip event. Urban core. Comms degraded. Damage picture unknown.' },
  flood:      { name: 'Flash Flood / Dam Failure',    icon: '🌊', desc: 'Upstream dam showing structural compromise. Downstream communities in inundation zone.' },
}

const JURISDICTIONS = ['Rural County','Mid-Size City','Large Urban Metro','Coastal Community','Tribal Nation','Interstate Corridor']
const DIFFICULTIES  = ['Basic','Moderate','Advanced','Brutal','Adaptive']

const DISPATCH_SEEDS = {
  hurricane:  ['NWS upgraded storm to Cat 5. Landfall window tightening to 14 hours.','Hospital requesting guidance on patient evacuation prioritization.','State EOC requesting resource status update within 30 minutes.','Fuel supplies at staging area running low. Vendors not answering.','Mayor\'s office asking for press conference guidance.'],
  mci:        ['Trauma Center 1 reports capacity reached. Diverting incoming.','Scene security not established. Second explosion reported — unconfirmed.','FBI on scene. Requesting coordination with your EOC.','Media satellite trucks arriving at perimeter. JIC not activated.','Mutual aid request from neighboring county.'],
  hazmat:     ['Wind shift reported. Plume modeling needs update.','School district calling — three schools inside initial hazmat zone.','Rail company liaison refusing to ID contents without legal clearance.','LEPC coordinator asking about community shelter locations.','Two firefighters reporting exposure symptoms.'],
  cyber:      ['Water treatment SCADA offline. Manual operations possible but limited.','Hospital backup generators running. 72-hour fuel supply.','Public reporting water pressure loss on social media. Growing fast.','Utility CEO requesting EOC liaison — coming in person.','State fusion center reports similar attacks in two neighboring states.'],
  earthquake: ['Comms tower 4 is down. Switching to alternate freq.','Search and rescue teams requesting grid assignment.','Structural engineers not on scene. Tagging not started.','County road 7 bridge confirmed collapsed. Major evacuation route blocked.','Mutual aid request submitted to state. No ETA yet.'],
  flood:      ['Dam engineer recommending immediate downstream notification.','Two downstream communities ignoring evacuation order.','Emergency spillway activation requested — awaiting your authorization.','FEMA Region pre-positioned team requesting coordination call.','Local news helicopter flying over dam. Public anxiety rising.'],
}

function buildSystemPrompt(scenario, jurisdiction, difficulty) {
  const sc = SCENARIOS[scenario]
  const diffMap = {
    Basic:    'Evaluate actions generously. Surface one complication per turn. Keep consequences manageable.',
    Moderate: 'Evaluate with moderate rigor. Surface two complications per turn. Some decisions will have non-obvious second-order effects.',
    Advanced: 'Evaluate with professional rigor. Surface 2-3 complications per turn. Resource constraints are real. Political and media pressure escalates.',
    Brutal:   'Evaluate ruthlessly. Every delayed or vague decision has cascading consequences. Resources are insufficient. Situation actively degrades each turn.',
    Adaptive: 'Calibrate difficulty to the player\'s demonstrated competence. Increase complexity if they perform well. If they struggle, surface clearer decision points. Never make it easy.',
  }
  return `You are the AI engine for an emergency management training simulator. The player is a senior emergency manager.

SCENARIO: ${sc.name}
JURISDICTION: ${jurisdiction}
DIFFICULTY: ${difficulty} — ${diffMap[difficulty]}
SETUP: ${sc.desc} Your EOC is activating.

RULES:
- Evaluate player actions with professional rigor. Never be encouraging. Be realistic.
- Describe consequences in 3-5 sentences.
- Surface complications, stakeholder pressures, secondary problems each turn.
- Advance incident clock realistically. State simulated time each turn.
- Generate 1-2 new field dispatch items after each consequence.
- Embed NIMS/ICS/ESF/FEMA doctrine in realism — don't lecture.
- On ENDEX: deliver a thorough AAR. Explicitly evaluate: (1) COOP activation timing and trigger criteria, (2) command element continuity as a first-order decision, (3) alternate facility readiness assumptions, (4) IT and communications validation at alternate sites, (5) overall strengths, (6) critical gaps, (7) doctrine references, (8) specific recommendations for improvement.
- Never break character.

RESPOND ONLY IN THIS JSON FORMAT:
{
  "time": "simulated time e.g. H+2:30 or Day 1, 1423L",
  "consequence": "3-5 sentence consequence narrative",
  "situation": "STABLE | DEVELOPING | CRITICAL | DETERIORATING",
  "dispatches": ["dispatch item 1", "dispatch item 2"],
  "prompt": "one sentence prompt for next player action"
}

On ENDEX:
{
  "time": "ENDEX",
  "consequence": "full AAR text covering all 8 points above",
  "situation": "ENDEX",
  "dispatches": [],
  "prompt": "Scenario complete."
}`
}

const SAVE_KEY = 'em_sim_v3'

const defaultState = {
  screen: 'setup', scenario: null, jurisdiction: 'Mid-Size City', difficulty: 'Adaptive',
  history: [], dispatches: [], terminal: [], notepad: '', simTime: 'H+0:00',
  situation: 'DEVELOPING', turn: 0,
}

const sitColors = { STABLE:'#1D9E75', DEVELOPING:'#EF9F27', CRITICAL:'#D85A30', DETERIORATING:'#E24B4A', ENDEX:'#888' }

export default function App() {
  const [state, setState]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const [input, setInput]       = useState('')
  // Column widths as percentages: [dispatch, terminal, notepad]
  const [cols, setCols]         = useState([18, 62, 20])
  const dragging                = useRef(null)
  const containerRef            = useRef(null)
  const termRef                 = useRef(null)
  const inputRef                = useRef(null)

  const save = useCallback((next) => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)) } catch {}
  }, [])

  const update = useCallback((patch) => {
    setState(prev => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
      save(next)
      return next
    })
  }, [save])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY)
      setState(saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState)
    } catch { setState(defaultState) }
  }, [])

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight
  }, [state?.terminal])

  useEffect(() => {
    if (state?.screen === 'game') setTimeout(() => inputRef.current?.focus(), 100)
  }, [state?.screen])

  // Draggable divider logic
  function onDividerMouseDown(dividerIndex, e) {
    e.preventDefault()
    dragging.current = { dividerIndex, startX: e.clientX, startCols: [...cols] }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  function onMouseMove(e) {
    if (!dragging.current || !containerRef.current) return
    const { dividerIndex, startX, startCols } = dragging.current
    const containerW = containerRef.current.offsetWidth
    const deltaPct   = ((e.clientX - startX) / containerW) * 100
    const newCols    = [...startCols]
    const minPct     = 10
    if (dividerIndex === 0) {
      // Between dispatch and terminal
      newCols[0] = Math.max(minPct, Math.min(startCols[0] + deltaPct, 100 - startCols[2] - minPct * 2))
      newCols[1] = 100 - newCols[0] - newCols[2]
    } else {
      // Between terminal and notepad
      newCols[2] = Math.max(minPct, Math.min(startCols[2] - deltaPct, 100 - startCols[0] - minPct * 2))
      newCols[1] = 100 - newCols[0] - newCols[2]
    }
    setCols(newCols)
  }

  function onMouseUp() {
    dragging.current = null
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  function startScenario(key) {
    const sc    = SCENARIOS[key]
    const seeds = DISPATCH_SEEDS[key]
    update({
      screen: 'game', scenario: key,
      dispatches: seeds.map((text, i) => ({ id: i, text, turn: 0 })),
      terminal: [
        { type: 'header',   text: `▶ ${sc.name.toUpperCase()} — ${state.jurisdiction} — ${state.difficulty}` },
        { type: 'system',   text: 'Type your decisions as the EM on scene. Be specific. Type ENDEX to close the scenario and receive an AAR.' },
        { type: 'divider' },
        { type: 'narrator', text: sc.desc + ' Your EOC is activating. What is your first action?' },
      ],
      history: [], turn: 0, simTime: 'H+0:00', situation: 'DEVELOPING', notepad: '',
    })
  }

  async function sendAction() {
    if (!input.trim() || loading || !state) return
    const action = input.trim()
    setInput('')
    setLoading(true)

    const newTerm = [...state.terminal, { type: 'player', text: `> ${action}` }]
    update({ terminal: newTerm })

    const msgs = [...state.history, { role: 'user', content: action }]

    try {
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: buildSystemPrompt(state.scenario, state.jurisdiction, state.difficulty), messages: msgs }),
      })
      const data = await res.json()
      const raw  = data.content?.[0]?.text || ''

      let parsed
      try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) }
      catch { parsed = { time: state.simTime, consequence: raw, situation: 'DEVELOPING', dispatches: [], prompt: 'What is your next action?' } }

      const newHistory    = [...msgs, { role: 'assistant', content: JSON.stringify(parsed) }]
      const nextTurn      = state.turn + 1
      const addedTerm     = [
        ...newTerm,
        { type: 'time',        text: parsed.time },
        { type: 'consequence', text: parsed.consequence },
        parsed.situation !== 'ENDEX' ? { type: 'prompt', text: parsed.prompt } : null,
        { type: 'divider' },
      ].filter(Boolean)

      const newDispatches = parsed.dispatches?.length
        ? [...parsed.dispatches.map((text, i) => ({ id: Date.now() + i, text, turn: nextTurn })), ...state.dispatches.slice(0, 6)]
        : state.dispatches

      update({ terminal: addedTerm, history: newHistory, dispatches: newDispatches,
               simTime: parsed.time || state.simTime, situation: parsed.situation || 'DEVELOPING',
               turn: nextTurn })
    } catch (e) {
      update({ terminal: [...newTerm, { type: 'system', text: `[ERROR: ${e.message}]` }] })
    }
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAction() }
  }

  function reset() {
    try { localStorage.removeItem(SAVE_KEY) } catch {}
    setState(defaultState)
    setInput('')
  }

  if (!state) return <div style={{ color: '#888', padding: '2rem', fontFamily: 'monospace' }}>Loading...</div>

  if (state.screen === 'setup') return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: 500, color: '#1D9E75', marginBottom: '0.5rem', letterSpacing: '0.08em' }}>EM CRISIS SIMULATOR</h1>
      <p style={{ fontSize: 12, color: '#555', marginBottom: '2rem', fontFamily: 'monospace' }}>Emergency Management Training System — Select scenario to begin</p>

      <p style={{ fontSize: 11, color: '#666', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Scenario</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: '1.5rem' }}>
        {Object.entries(SCENARIOS).map(([key, sc]) => (
          <button key={key} onClick={() => update({ scenario: key })}
            style={{ textAlign: 'left', padding: '10px 12px', border: `0.5px solid ${state.scenario === key ? '#1D9E75' : '#222'}`, background: state.scenario === key ? '#0a1f18' : 'transparent' }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{sc.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#ddd', marginBottom: 4 }}>{sc.name}</div>
            <div style={{ fontSize: 10, color: '#555', lineHeight: 1.5 }}>{sc.desc}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.5rem' }}>
        <div>
          <p style={{ fontSize: 11, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Jurisdiction</p>
          <select value={state.jurisdiction} onChange={e => update({ jurisdiction: e.target.value })} style={{ width: '100%' }}>
            {JURISDICTIONS.map(j => <option key={j}>{j}</option>)}
          </select>
        </div>
        <div>
          <p style={{ fontSize: 11, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Difficulty</p>
          <select value={state.difficulty} onChange={e => update({ difficulty: e.target.value })} style={{ width: '100%' }}>
            {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <button onClick={() => state.scenario && startScenario(state.scenario)}
        style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 500, border: `0.5px solid ${state.scenario ? '#1D9E75' : '#333'}`, color: state.scenario ? '#1D9E75' : '#555', cursor: state.scenario ? 'pointer' : 'not-allowed' }}>
        {state.scenario ? `LAUNCH — ${SCENARIOS[state.scenario].name} ↗` : 'Select a scenario to begin'}
      </button>
    </div>
  )

  const dividerStyle = {
    width: 16, cursor: 'col-resize', background: '#1a1a1a', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderLeft: '0.5px solid #333', borderRight: '0.5px solid #333',
  }
  const dividerInner = {
    width: 4, height: 32, background: '#444', borderRadius: 2, pointerEvents: 'none',
  }
  
  

  return (
    <div ref={containerRef}
      style={{ display: 'flex', flexDirection: 'row', gap: 0, padding: '0.75rem', height: '97vh', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, userSelect: dragging.current ? 'none' : 'auto' }}>

      {/* DISPATCH */}
      <div style={{ width: `${cols[0]}%`, display: 'flex', flexDirection: 'column', border: '0.5px solid #222', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '6px 10px', borderBottom: '0.5px solid #222', background: '#111', fontSize: 10, fontWeight: 500, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Field Dispatch</span>
          <span style={{ background: '#E24B4A', color: '#fff', borderRadius: 3, padding: '1px 5px', fontSize: 9 }}>{state.dispatches.length}</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {state.dispatches.map((d) => {
            const isNew = d.turn === state.turn
            return (
              <div key={d.id} style={{ padding: '6px 8px', borderRadius: 6, border: `0.5px solid ${isNew ? '#2a3a2a' : '#222'}`, background: isNew ? '#1a2a1a' : 'transparent', fontSize: 11, color: isNew ? '#ddd' : '#555', lineHeight: 1.5 }}>
                {isNew && <div style={{ fontSize: 9, color: '#1D9E75', fontWeight: 500, marginBottom: 2 }}>NEW — {d.turn === 0 ? 'H+0:00' : state.simTime}</div>}
                {d.text}
              </div>
            )
          })}
        </div>
      </div>

      {/* DIVIDER 1 */}
      <div style={dividerStyle} onMouseDown={e => onDividerMouseDown(0, e)}>
        <div style={dividerInner} />
      </div>

      {/* TERMINAL */}
      <div style={{ width: `${cols[1]}%`, display: 'flex', flexDirection: 'column', border: '0.5px solid #222', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '6px 10px', borderBottom: '0.5px solid #222', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 500, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{SCENARIOS[state.scenario]?.name} — {state.jurisdiction}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#444' }}>{state.simTime}</span>
            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, fontWeight: 500, background: (sitColors[state.situation]||'#888')+'22', color: sitColors[state.situation]||'#888' }}>{state.situation}</span>
            <button onClick={reset} style={{ fontSize: 10, padding: '2px 8px', color: '#555' }}>New</button>
          </div>
        </div>

        <div ref={termRef} style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', lineHeight: 1.8 }}>
          {state.terminal.map((line, i) => {
            if (!line) return null
            if (line.type === 'divider') return <hr key={i} style={{ border: 'none', borderTop: '0.5px solid #1a1a1a', margin: '8px 0' }} />
            const s = {
              header:      { color: '#aaa', fontWeight: 500, marginBottom: 4 },
              system:      { color: '#333', fontSize: 10, marginBottom: 6 },
              narrator:    { color: '#ccc', marginBottom: 6 },
              player:      { color: '#1D9E75', marginBottom: 4, fontWeight: 500 },
              consequence: { color: '#777', marginBottom: 6, borderLeft: '2px solid #2a2a2a', paddingLeft: 10 },
              time:        { color: '#EF9F27', fontSize: 10, marginBottom: 2, fontWeight: 500 },
              prompt:      { color: '#EF9F27', fontStyle: 'italic', marginBottom: 4 },
            }
            return <div key={i} style={s[line.type]||{}}>{line.text}</div>
          })}
          {loading && <div style={{ color: '#333', fontStyle: 'italic' }}>Evaluating action...</div>}
        </div>

        <div style={{ borderTop: '0.5px solid #222', padding: '8px 10px', display: 'flex', gap: 6 }}>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Your action..." rows={2}
            style={{ flex: 1, resize: 'none', lineHeight: 1.6 }} />
          <button onClick={sendAction} disabled={loading || !input.trim()}
            style={{ padding: '6px 14px', fontWeight: 500, alignSelf: 'stretch', color: '#1D9E75', borderColor: '#1D9E75' }}>
            Execute
          </button>
        </div>
      </div>

      {/* DIVIDER 2 */}
      <div style={dividerStyle} onMouseDown={e => onDividerMouseDown(1, e)}>
        <div style={dividerInner} />
      </div>

      {/* NOTEPAD */}
      <div style={{ width: `${cols[2]}%`, display: 'flex', flexDirection: 'column', border: '0.5px solid #222', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '6px 10px', borderBottom: '0.5px solid #222', background: '#111', fontSize: 10, fontWeight: 500, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Commander's Notepad
        </div>
        <textarea value={state.notepad} onChange={e => update({ notepad: e.target.value })}
          placeholder={'Priorities, resource gaps, decisions pending...\n\nPersists across turns and sessions.'}
          style={{ flex: 1, resize: 'none', border: 'none', padding: '8px 10px', background: 'transparent', color: '#888', lineHeight: 1.7, outline: 'none' }} />
        <div style={{ padding: '4px 10px', borderTop: '0.5px solid #1a1a1a', fontSize: 10, color: '#333' }}>
          Turn {state.turn} — {state.difficulty}
        </div>
      </div>
    </div>
  )
}