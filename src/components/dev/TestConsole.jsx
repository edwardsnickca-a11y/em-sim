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

const PARAGRAPHS = {
  situation: `At 0742 local time, a radiological dispersal device detonated near Perry Square during the morning commute. Initial field reports indicated blast injuries, widespread self-referral to area hospitals, uncertain contamination boundaries, conflicting public messaging, and rapidly increasing requests for protective-action guidance. The EOC activated with incomplete information and had to establish a common operating picture while local, county, state, and federal partners entered the response at different speeds.`,
  decision: `The team established an EOC coordination structure, directed section leads to report priority information requirements, and began consolidating field reports. The EOC Director emphasized authoritative protective-action information and a unified public message. The Operations Section Chief focused on life-safety impacts, access restrictions, resource assignments, and unmet needs. These decisions were appropriate for the opening phase, although several responses remained at the level of organizational intent rather than assigning named owners, deadlines, and decision triggers.`,
  coordination: `Cross-role coordination was strongest where the EOC Director and Operations Section Chief used complementary responsibilities rather than duplicating tactical control. The team correctly routed resource gaps through the EOC and recognized the need to integrate public health, fire, law enforcement, EMS, hospitals, radiation-control personnel, and federal consequence-management assets. Improvement is needed in documenting who owns each coordination task, when follow-up is due, and what information would trigger escalation or a change in protective action.`,
  communications: `The team recognized the risk created by conflicting protective-action information and the need for one coordinated public-information posture. Internal coordination messages were concise and role-appropriate. The record does not yet show a completed message approval process, rumor-control plan, accessible-language strategy, or a defined schedule for public updates. Future turns should connect verified technical information to specific public messages and identify the official authorized to release them.`,
  doctrine: `Performance should be reviewed against NIMS/ICS coordination principles, Community Lifelines, local EOC procedures, radiological emergency response doctrine, public-information coordination practices, and applicable emergency operations plans. The EOC should support incident command and policy coordination without assuming tactical command of field operations.`,
  strengths: `The team quickly recognized the need for a common operating picture, unified public messaging, authoritative radiological guidance, structured resource coordination, and clear separation between EOC support and field command. Role submissions were mutually reinforcing and did not conflict. The team also preserved a disciplined focus on life safety and interagency coordination despite significant uncertainty.`,
  gaps: `The response did not consistently convert priorities into specific assignments with owners, deadlines, and confirmation requirements. Protective-action decision criteria were not fully articulated. Hospital self-referral, access control, contamination monitoring, responder safety, family assistance, and public rumor control required more explicit coordination. The team also needed a clearer process for documenting unresolved information requirements and elevating policy decisions.`,
  recommendations: `Use a recurring decision cycle that assigns each priority to a named role, sets a reporting deadline, identifies the information needed, and records the decision or escalation trigger. Establish a joint protective-action and public-information process with public health and radiological authorities. Track hospital impacts, monitoring coverage, access-control needs, resource requests, and public messaging in one shared operating picture. During the next exercise, require each role to state both the action and the coordination dependency.`
}

function repeatText(text, count) {
  return Array.from({ length: count }, (_, index) => `${text}\n\nTurn ${index + 1} evidence note: The exercise record contains enough detail to test continuation-page headings, paragraph wrapping, metadata, and full-report pagination.`).join('\n\n')
}

function getFixture(size = 'long', perspective = 'host') {
  const multiplier = size === 'short' ? 1 : size === 'medium' ? 2 : 5
  const players = [
    { id:'host-fixture', name:'Nick', role:'EOC Director', isHost:true },
    { id:'ops-fixture', name:'DD', role:'Operations Section Chief', isHost:false },
  ]
  const selectedPlayer = perspective === 'player-2' ? players[1] : players[0]
  const sharedAar = {
    situationSummary: repeatText(PARAGRAPHS.situation, multiplier),
    decisionLog: repeatText(PARAGRAPHS.decision, multiplier),
    resourceCoordination: repeatText(PARAGRAPHS.coordination, multiplier),
    communications: repeatText(PARAGRAPHS.communications, multiplier),
    doctrineReferences: repeatText(PARAGRAPHS.doctrine, Math.max(1, multiplier - 1)),
    strengths: repeatText(PARAGRAPHS.strengths, multiplier),
    criticalGaps: repeatText(PARAGRAPHS.gaps, multiplier),
    recommendations: repeatText(PARAGRAPHS.recommendations, multiplier),
  }
  const makeIndividual = (name, role) => ({
    situationSummary: `${name} served as ${role}. ${repeatText(PARAGRAPHS.situation, Math.max(1, multiplier - 1))}`,
    decisionLog: repeatText(PARAGRAPHS.decision, multiplier),
    resourceCoordination: repeatText(PARAGRAPHS.coordination, multiplier),
    communications: repeatText(PARAGRAPHS.communications, Math.max(1, multiplier - 1)),
    doctrineReferences: PARAGRAPHS.doctrine,
    strengths: repeatText(PARAGRAPHS.strengths, multiplier),
    criticalGaps: repeatText(PARAGRAPHS.gaps, multiplier),
    recommendations: repeatText(PARAGRAPHS.recommendations, multiplier),
  })
  const allIndividualAars = {
    'host-fixture': makeIndividual('Nick', 'EOC Director'),
    'ops-fixture': makeIndividual('DD', 'Operations Section Chief'),
  }
  const facilitatorAar = {
    situationSummary: repeatText(PARAGRAPHS.situation, multiplier),
    decisionLog: repeatText(`Across both roles, the facilitator should examine whether decisions were complementary, timely, assigned, and linked to measurable follow-up. ${PARAGRAPHS.decision}`, multiplier),
    resourceCoordination: repeatText(`Team integration remained generally aligned, but dependencies and task ownership should be made more explicit. ${PARAGRAPHS.coordination}`, multiplier),
    communications: repeatText(`The communications record shows useful coordination but should be reviewed for timing, clarity, and closure. ${PARAGRAPHS.communications}`, multiplier),
    recommendations: repeatText(`Use the next hotwash to convert these findings into role-specific corrective actions and a short improvement plan. ${PARAGRAPHS.recommendations}`, multiplier),
  }
  return {
    aar: sharedAar,
    teamMode: true,
    teamAar: sharedAar,
    individualAar: allIndividualAars[selectedPlayer.id],
    allIndividualAars,
    facilitatorAar,
    communicationsLog: [
      { createdAt:'07:49', senderName:'Nick', senderRole:'EOC Director', channel:'team', text:'Confirm section priorities and unresolved information requirements before the next coordination cycle.' },
      { createdAt:'07:51', senderName:'DD', senderRole:'Operations Section Chief', channel:'direct', recipientName:'Nick', recipientRole:'EOC Director', text:'Operations is consolidating field impacts and will elevate protective-action conflicts for decision.' },
    ],
    isHost: perspective === 'host',
    players,
    scenario:'rdd',
    jurisdiction:'Mid-Size City',
    difficulty:'Adaptive',
    role:selectedPlayer.role,
    playerName:selectedPlayer.name,
    turns:6,
    simTime:'H+2:45',
    worldState:{ location:'Erie, Pennsylvania' },
    transcript:[
      { time:'H+0:00', speaker:'NEXUS', text:'Opening situation established.' },
      { time:'H+0:20', speaker:'Nick — EOC Director', text:'Activated the coordination structure and directed section leads to report priorities and gaps.' },
      { time:'H+0:20', speaker:'DD — Operations Section Chief', text:'Confirmed field impacts, resource assignments, and unmet operational needs.' },
    ],
    lifelines:{},
    situation:PARAGRAPHS.situation,
  }
}

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

export default function TestConsole({ AARComponent }) {
  const environment = useMemo(getEnvironment, [])
  const [selected, setSelected] = useState('team-aar-long')
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
  const aarFixture = useMemo(() => getFixture(fixtureSize, perspective), [fixtureSize, perspective])
  const isAarFixture = selected === 'team-aar-long'

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
          <button type="button" onClick={() => { setSelected('team-aar-long'); setPerspective('host'); setFixtureSize('long'); setChecks({}) }} style={{ border:'1px solid rgba(87,146,198,.35)', background:'#091827', color:'#DCE7F2', borderRadius:7, padding:'8px 11px', cursor:'pointer' }}>Reset Test State</button>
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
          <div style={{ height:'100%', minHeight:620, border:'1px solid rgba(87,146,198,.28)', borderRadius:10, background:'rgba(4,17,29,.74)', overflow:'auto' }}>
            <div style={{ position:'sticky', top:0, zIndex:30, height:43, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', borderBottom:'1px solid rgba(87,146,198,.22)', background:'rgba(7,24,39,.98)' }}>
              <strong style={{ fontSize:13 }}>{selectedLabel}</strong>
              <span style={{ fontSize:11, color:isAarFixture ? '#2DE2B8' : '#7F93A8' }}>{isAarFixture ? 'LIVE PRODUCTION COMPONENT + FIXTURE DATA' : 'Fixture wiring pending'}</span>
            </div>
            {isAarFixture && AARComponent ? (
              <AARComponent
                {...aarFixture}
                embedded
                onReset={() => {}}
                onRestart={() => {}}
                onMissionPortal={() => {}}
              />
            ) : (
              <div style={{ minHeight:575, display:'grid', placeItems:'center', padding:24 }}>
                <div style={{ width:'min(650px, 90%)', border:'1px dashed rgba(69,163,255,.42)', borderRadius:10, padding:30, textAlign:'center', background:'rgba(2,11,19,.52)' }}>
                  <div style={{ color:'#45A3FF', fontSize:12, fontWeight:900, letterSpacing:'.12em', marginBottom:9 }}>TEST STATE READY</div>
                  <h2 style={{ margin:'0 0 10px', fontSize:24 }}>{selectedLabel}</h2>
                  <p style={{ margin:'0 auto', maxWidth:520, color:'#AFC0D2', lineHeight:1.6, fontSize:13 }}>This state remains in the fixture queue. Team AAR — Long / Multipage is the first state wired to the actual production component and exporter.</p>
                </div>
              </div>
            )}
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
            <div style={{ border:'1px solid rgba(45,226,184,.25)', background:'rgba(45,226,184,.06)', color:'#BFEFE2', borderRadius:7, padding:10, fontSize:11, lineHeight:1.5 }}>
              Select <strong>Reports → Team AAR — Long / Multipage</strong>, then use the real <strong>Download AAR PDF</strong> button inside the preview.
            </div>
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
