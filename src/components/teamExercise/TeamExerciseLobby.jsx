import { useMemo, useState } from 'react'
import NexusLogo from '../brand/NexusLogo'
import { SCENARIOS, DIFFICULTIES } from '../../data/scenarios'
import { JURISDICTIONS } from '../../data/jurisdictions'
import { ROLES, ROLE_GROUPS } from '../../data/roles'

import hurricaneImage from '../../assets/missionPortal/hurricane-landfall.jpg'
import mciImage from '../../assets/missionPortal/mass-casualty-incident.jpg'
import hazmatImage from '../../assets/missionPortal/hazardous-materials-release.jpg'
import cyberImage from '../../assets/missionPortal/cyber-infrastructure-cascade.jpg'
import earthquakeImage from '../../assets/missionPortal/major-earthquake.jpg'
import floodImage from '../../assets/missionPortal/flash-flood-dam-failure.jpg'
import wildfireImage from '../../assets/missionPortal/urban-wildfire.jpg'
import winterImage from '../../assets/missionPortal/winter-storm-cascade.jpg'
import rddImage from '../../assets/missionPortal/radiological-dispersal-device.jpg'
import trainImage from '../../assets/missionPortal/train-derailment-mci-hazmat.jpg'

const DS = {
  bg:'#020B13',
  bg2:'#071421',
  panel:'rgba(4, 17, 29, 0.82)',
  panel2:'rgba(6, 23, 38, 0.92)',
  border:'rgba(87, 146, 198, 0.30)',
  borderSoft:'rgba(87, 146, 198, 0.22)',
  borderStrong:'rgba(65, 141, 255, 0.62)',
  teal:'#45A3FF',
  teal2:'#2DE2B8',
  blue:'#2E83FF',
  amber:'#F59B22',
  red:'#E24B4A',
  text:'#F4F8FE',
  muted:'#B9C8D8',
  dim:'#6F8195',
}

const SCENARIO_VISUALS = {
  hurricane: { title:'Hurricane Landfall', img:hurricaneImage, tag:'Natural Hazard', desc:'Coastal hurricane impacts with evacuation, sheltering, infrastructure, and resource-prioritization pressures.' },
  mci: { title:'Mass Casualty Incident', img:mciImage, tag:'MCI', desc:'High-casualty incident requiring rapid coordination across EMS, hospitals, law enforcement, and public information.' },
  hazmat: { title:'Hazardous Materials Release', img:hazmatImage, tag:'HazMat', desc:'HazMat incident with protective actions, public warning, environmental monitoring, and multiagency coordination.' },
  cyber: { title:'Cyber-Infrastructure Cascade', img:cyberImage, tag:'Infrastructure', desc:'Cyber disruption affecting water, power, communications, public services, and continuity of operations.' },
  earthquake: { title:'Major Earthquake', img:earthquakeImage, tag:'Natural Hazard', desc:'Seismic event with damage assessment gaps, degraded communications, medical surge, and resource staging challenges.' },
  flood: { title:'Flash Flood / Dam Failure', img:floodImage, tag:'Natural Hazard', desc:'Rapid flooding with downstream warning, evacuations, sheltering, access constraints, and infrastructure risk.' },
  wildfire: { title:'Urban Wildfire', img:wildfireImage, tag:'Natural Hazard', desc:'Wind-driven fire with evacuation routes, shelter options, air resource coordination, and structure exposure risk.' },
  winter: { title:'Winter Storm Cascade', img:winterImage, tag:'Natural Hazard', desc:'Extreme winter impacts with power outages, road clearance, warming shelters, fuel, and vulnerable populations.' },
  rdd: { title:'Radiological Dispersal Device', img:rddImage, tag:'Security / CBRN', desc:'RDD event requiring consequence management, public messaging, federal coordination, and contamination controls.' },
  train: { title:'Train Derailment — MCI / HazMat', img:trainImage, tag:'MCI / HazMat', desc:'Rail incident combining casualties, hazardous materials, evacuation decisions, and railroad coordination.' },
}

function roomCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 4; i++) out += letters[Math.floor(Math.random() * letters.length)]
  out += '-'
  for (let i = 0; i < 4; i++) out += letters[Math.floor(Math.random() * letters.length)]
  return out
}

function FieldLabel({ children }) {
  return <div style={{ fontSize:10, color:DS.muted, textTransform:'uppercase', letterSpacing:'0.13em', fontWeight:900, marginBottom:7 }}>{children}</div>
}

function SelectField({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange} style={{ width:'100%', height:42, background:DS.bg2, color:DS.text, border:`1px solid ${DS.borderSoft}`, borderRadius:5, padding:'0 12px', fontFamily:'Inter, system-ui, sans-serif', fontSize:13, outline:'none' }}>
      {children}
    </select>
  )
}

function TextInput(props) {
  return <input {...props} style={{ width:'100%', height:42, background:DS.bg2, color:DS.text, border:`1px solid ${DS.borderSoft}`, borderRadius:5, padding:'0 12px', boxSizing:'border-box', fontFamily:'Inter, system-ui, sans-serif', fontSize:13, outline:'none', ...(props.style || {}) }} />
}

function PrimaryButton({ children, disabled, onClick, tone='blue' }) {
  const green = tone === 'green'
  const red = tone === 'red'
  return (
    <button onClick={onClick} disabled={disabled} style={{ height:44, borderRadius:5, border:`1px solid ${disabled ? 'rgba(87,146,198,0.16)' : red ? 'rgba(226,75,74,0.72)' : green ? DS.teal2 : DS.borderStrong}`, background:disabled ? 'rgba(7,20,33,0.52)' : red ? 'linear-gradient(180deg, #9B231F, #6D1714)' : green ? 'linear-gradient(180deg, #168B55, #0D633D)' : 'linear-gradient(180deg, #1455B8, #0E3F91)', color:disabled ? 'rgba(185,200,216,0.36)' : '#fff', fontWeight:950, cursor:disabled ? 'not-allowed' : 'pointer', padding:'0 18px', fontSize:14, letterSpacing:'0.02em' }}>
      {children}
    </button>
  )
}

function ScenarioCard({ scenarioKey, scenario, selected, onSelect }) {
  const visual = SCENARIO_VISUALS[scenarioKey]
  if (!visual) return null
  return (
    <button onClick={() => onSelect(scenarioKey)} style={{ textAlign:'left', borderRadius:4, overflow:'hidden', border:`1px solid ${selected ? DS.borderStrong : DS.border}`, background:selected ? 'linear-gradient(180deg, rgba(46,131,255,0.18), rgba(3,14,24,0.92))' : 'rgba(3,14,24,0.84)', color:DS.text, cursor:'pointer', padding:0, minWidth:0, boxShadow:selected ? '0 0 0 1px rgba(69,163,255,0.25), 0 0 28px rgba(46,131,255,0.22)' : '0 16px 34px rgba(0,0,0,0.16)' }}>
      <div style={{ position:'relative', aspectRatio:'16 / 8', background:'#061522', overflow:'hidden' }}>
        <img src={visual.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transform:selected ? 'scale(1.025)' : 'scale(1)', transition:'transform 160ms ease' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(2,9,16,0.04), rgba(2,9,16,0.50))' }} />
        {selected && <div style={{ position:'absolute', top:9, right:9, fontSize:10, color:'#04101B', background:DS.teal, borderRadius:999, padding:'4px 8px', fontWeight:950, letterSpacing:'0.08em' }}>SELECTED</div>}
      </div>
      <div style={{ padding:'11px 12px 13px' }}>
        <div style={{ color:DS.text, fontSize:15, fontWeight:900, marginBottom:7, lineHeight:1.14 }}>{visual.title || scenario.name}</div>
        <div style={{ color:DS.muted, fontSize:12, lineHeight:1.42 }}>{visual.desc || scenario.desc}</div>
        <div style={{ marginTop:10, display:'inline-flex', alignItems:'center', height:22, padding:'0 8px', borderRadius:999, border:`1px solid ${DS.borderSoft}`, color:DS.teal, fontSize:10, fontWeight:850, letterSpacing:'0.08em', textTransform:'uppercase', background:'rgba(69,163,255,0.08)' }}>{visual.tag}</div>
      </div>
    </button>
  )
}

function RoleOptions({ takenRoles = [], currentRole }) {
  return Object.entries(ROLE_GROUPS).map(([group, roles]) => (
    <optgroup key={group} label={group}>
      {roles.map(role => (
        <option key={role} value={role} disabled={takenRoles.includes(role) && role !== currentRole}>{role}</option>
      ))}
    </optgroup>
  ))
}

export default function TeamExerciseLobby({ entryMode='host', state, update, onMissionPortal }) {
  const scenarioEntries = useMemo(() => Object.entries(SCENARIOS).filter(([key]) => Boolean(SCENARIO_VISUALS[key])), [])
  const [mode, setMode] = useState(entryMode)
  const [screen, setScreen] = useState(entryMode === 'join' ? 'join' : 'setup')
  const [selectedScenario, setSelectedScenario] = useState(state?.scenario || 'hurricane')
  const [jurisdiction, setJurisdiction] = useState(state?.jurisdiction || 'Mid-Size City')
  const [difficulty, setDifficulty] = useState(state?.difficulty || 'Standard')
  const [hostMode, setHostMode] = useState('host_player')
  const [hostRole, setHostRole] = useState(state?.role || 'EOC Director')
  const [hostName, setHostName] = useState(state?.playerName || 'Host')
  const [code, setCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinName, setJoinName] = useState('')
  const [players, setPlayers] = useState([])
  const [copyMsg, setCopyMsg] = useState('')

  const selectedVisual = SCENARIO_VISUALS[selectedScenario]
  const activeRoles = (hostMode === 'host_player' ? 1 : 0) + players.filter(p => p.role).length
  const roomLink = code ? `${window.location.origin}?teamRoom=${encodeURIComponent(code)}` : ''

  const takenRoles = [hostMode === 'host_player' ? hostRole : null, ...players.map(p => p.role)].filter(Boolean)

  function copyText(text) {
    if (!text) return
    navigator.clipboard?.writeText(text).then(() => setCopyMsg('Copied')).catch(() => setCopyMsg('Copy unavailable'))
    setTimeout(() => setCopyMsg(''), 1600)
  }

  function createRoom() {
    const nextCode = roomCode()
    setCode(nextCode)
    setPlayers([])
    update?.({
      scenario:selectedScenario,
      jurisdiction,
      difficulty,
      role:hostMode === 'host_player' ? hostRole : state?.role,
      playerName:hostMode === 'host_player' ? hostName : state?.playerName,
      teamRoom:{
        roomCode:nextCode,
        status:'lobby',
        scenario:selectedScenario,
        jurisdiction,
        difficulty,
        hostMode,
        hostName,
        hostRole:hostMode === 'host_player' ? hostRole : null,
        players:[],
      },
    })
    setScreen('lobby')
  }

  function addLocalPlayer() {
    const name = joinName.trim()
    if (!name || players.length >= 7) return
    const firstAvailable = Object.keys(ROLES).find(role => !takenRoles.includes(role)) || ''
    setPlayers(prev => [...prev, { id:`p-${Date.now()}`, name, role:firstAvailable, status:'Ready' }])
    setJoinName('')
  }

  function updatePlayerRole(id, role) {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, role } : p))
  }

  function removePlayer(id) {
    setPlayers(prev => prev.filter(p => p.id !== id))
  }

  function playerJoin() {
    if (!joinCode.trim() || !joinName.trim()) return
    setScreen('waiting')
  }

  const shell = (children) => (
    <div style={{ width:'100vw', minHeight:'100vh', background:`radial-gradient(circle at 22% 18%, rgba(46,131,255,0.12), transparent 34%), linear-gradient(135deg, ${DS.bg}, #02070D 62%)`, color:DS.text, fontFamily:'Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif', overflow:'hidden' }}>
      <header style={{ height:76, display:'flex', alignItems:'center', justifyContent:'center', borderBottom:`1px solid ${DS.border}`, background:'linear-gradient(180deg, rgba(2,10,18,0.98), rgba(3,13,22,0.96))', boxSizing:'border-box', flexShrink:0 }}>
        <div style={{ width:'min(100%, 1680px)', padding:'0 clamp(18px, 2vw, 34px)', display:'flex', alignItems:'center', justifyContent:'space-between', boxSizing:'border-box' }}>
          <NexusLogo variant="primary" tone="dark" size={56} imageStyle={{ maxWidth:'min(360px, 34vw)' }} />
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <button onClick={onMissionPortal} style={{ height:42, padding:'0 16px', borderRadius:4, border:`1px solid ${DS.border}`, background:'rgba(3,13,23,0.72)', color:DS.text, fontWeight:850, cursor:'pointer' }}>Mission Portal</button>
            <button onClick={() => { setMode('host'); setScreen('setup') }} style={{ height:42, padding:'0 16px', borderRadius:4, border:`1px solid ${mode === 'host' ? DS.borderStrong : DS.border}`, background:mode === 'host' ? 'rgba(69,163,255,0.14)' : 'rgba(3,13,23,0.72)', color:DS.text, fontWeight:850, cursor:'pointer' }}>Host</button>
            <button onClick={() => { setMode('join'); setScreen('join') }} style={{ height:42, padding:'0 16px', borderRadius:4, border:`1px solid ${mode === 'join' ? DS.borderStrong : DS.border}`, background:mode === 'join' ? 'rgba(69,163,255,0.14)' : 'rgba(3,13,23,0.72)', color:DS.text, fontWeight:850, cursor:'pointer' }}>Join</button>
          </div>
        </div>
      </header>
      <main style={{ height:'calc(100vh - 76px)', overflowY:'auto', overflowX:'hidden', padding:'clamp(12px, 1.2vw, 20px)', boxSizing:'border-box' }}>
        <div style={{ width:'min(100%, 1680px)', margin:'0 auto', display:'flex', flexDirection:'column', gap:12 }}>{children}</div>
      </main>
    </div>
  )

  if (screen === 'join') {
    return shell(
      <div style={{ display:'grid', gridTemplateColumns:'minmax(360px, 0.72fr) minmax(460px, 1.28fr)', gap:18, alignItems:'stretch' }}>
        <section style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:DS.panel, padding:22 }}>
          <div style={{ color:DS.teal, fontSize:12, fontWeight:950, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:8 }}>Team Exercise</div>
          <h1 style={{ margin:'0 0 10px', fontSize:34, lineHeight:1.05, fontWeight:950 }}>Join Team Room</h1>
          <p style={{ margin:'0 0 24px', color:DS.muted, fontSize:15, lineHeight:1.55 }}>Enter the room code from your host. No account is needed for this version.</p>
          <label style={{ display:'block', marginBottom:14 }}><FieldLabel>Room Code</FieldLabel><TextInput value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="K7A9-3B2L" /></label>
          <label style={{ display:'block', marginBottom:18 }}><FieldLabel>Your Name</FieldLabel><TextInput value={joinName} onChange={e => setJoinName(e.target.value)} placeholder="Alex Johnson" /></label>
          <PrimaryButton disabled={!joinCode.trim() || !joinName.trim()} onClick={playerJoin}>Join Room</PrimaryButton>
        </section>
        <section style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:DS.panel2, padding:22 }}>
          <div style={{ color:DS.teal2, fontSize:12, fontWeight:950, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:10 }}>What Happens Next</div>
          {['You appear in the host lobby.', 'The host assigns you an EOC role.', 'When STARTEX begins, you enter the normal NEXUS EOC live exercise page.', 'The team sees the same scenario while actions are tracked by role.'].map((line, i) => (
            <div key={line} style={{ display:'grid', gridTemplateColumns:'34px 1fr', gap:12, alignItems:'start', padding:'14px 0', borderBottom:i < 3 ? `1px solid ${DS.borderSoft}` : 'none' }}>
              <div style={{ width:26, height:26, borderRadius:'50%', display:'grid', placeItems:'center', background:'rgba(69,163,255,0.18)', color:DS.teal, fontWeight:950 }}>{i+1}</div>
              <div style={{ color:DS.text, fontSize:14, lineHeight:1.55 }}>{line}</div>
            </div>
          ))}
        </section>
      </div>
    )
  }

  if (screen === 'waiting') {
    return shell(
      <section style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:DS.panel, padding:24 }}>
        <div style={{ color:DS.teal, fontSize:12, fontWeight:950, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:8 }}>Team Lobby</div>
        <h1 style={{ margin:'0 0 10px', fontSize:34, lineHeight:1.05, fontWeight:950 }}>Waiting for Host</h1>
        <p style={{ margin:0, color:DS.muted, fontSize:15, lineHeight:1.55 }}>You joined room <strong style={{ color:DS.text }}>{joinCode}</strong> as <strong style={{ color:DS.text }}>{joinName}</strong>. Wait for the host to assign your role and start the exercise.</p>
      </section>
    )
  }

  if (screen === 'lobby') {
    const hostRow = hostMode === 'host_player' ? [{ id:'host', name:hostName || 'Host', role:hostRole, status:'Ready', host:true }] : []
    const roster = [...hostRow, ...players]
    return shell(
      <>
        <section style={{ display:'grid', gridTemplateColumns:'1.02fr 1.05fr 0.68fr', gap:12 }}>
          <div style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:DS.panel, padding:18 }}>
            <FieldLabel>Exercise Setup</FieldLabel>
            <div style={{ color:DS.text, fontSize:17, fontWeight:950, marginBottom:10 }}>{selectedVisual?.title || SCENARIOS[selectedScenario]?.name}</div>
            <div style={{ color:DS.muted, fontSize:13, lineHeight:1.7 }}>Jurisdiction: <span style={{ color:DS.text }}>{jurisdiction}</span><br />Difficulty: <span style={{ color:DS.text }}>{difficulty}</span><br />Host Mode: <span style={{ color:DS.text }}>{hostMode === 'host_player' ? 'Host plays a role' : 'Facilitator only'}</span></div>
          </div>
          <div style={{ border:`1px solid ${DS.borderStrong}`, borderRadius:4, background:'rgba(6,23,38,0.92)', padding:18 }}>
            <FieldLabel>Room Information</FieldLabel>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div style={{ color:DS.teal2, fontSize:34, fontWeight:950, letterSpacing:'0.05em' }}>{code}</div>
              <PrimaryButton onClick={() => copyText(code)}>Copy Code</PrimaryButton>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 132px', gap:10, marginTop:14 }}>
              <TextInput value={roomLink} readOnly />
              <PrimaryButton onClick={() => copyText(roomLink)}>Copy Link</PrimaryButton>
            </div>
            <div style={{ color:copyMsg ? DS.teal2 : DS.dim, fontSize:12, marginTop:10 }}>{copyMsg || 'Share this code or link with players.'}</div>
          </div>
          <div style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:DS.panel, padding:18 }}>
            <FieldLabel>Lobby Status</FieldLabel>
            <div style={{ color:DS.text, fontSize:22, fontWeight:950 }}>{roster.length} / 8 roles</div>
            <div style={{ color:DS.teal2, fontSize:13, marginTop:10 }}>● Lobby Open</div>
          </div>
        </section>

        <section style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:DS.panel, overflow:'hidden' }}>
          <div style={{ padding:'16px 18px', borderBottom:`1px solid ${DS.borderSoft}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
            <div><div style={{ color:DS.text, fontSize:20, fontWeight:950 }}>Players & Role Assignments</div><div style={{ color:DS.muted, fontSize:13, marginTop:4 }}>Players join by code. Host assigns one approved EOC role per active player.</div></div>
            <div style={{ color:activeRoles >= 2 ? DS.teal2 : DS.amber, fontWeight:950 }}>{activeRoles} / 8 active roles</div>
          </div>
          <div style={{ padding:18 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 220px', gap:10, marginBottom:16 }}>
              <TextInput value={joinName} onChange={e => setJoinName(e.target.value)} placeholder="Player name" />
              <PrimaryButton disabled={!joinName.trim() || players.length >= 7} onClick={addLocalPlayer}>Add Player</PrimaryButton>
            </div>
            <div style={{ display:'grid', gap:10 }}>
              {hostMode === 'host_player' && (
                <div style={{ display:'grid', gridTemplateColumns:'minmax(180px, 1fr) minmax(280px, 1fr) 90px', gap:12, alignItems:'center', border:`1px solid ${DS.borderSoft}`, borderRadius:5, background:'rgba(2,11,19,0.46)', padding:12 }}>
                  <div><strong>{hostName || 'Host'}</strong><div style={{ color:DS.dim, fontSize:12 }}>Host-player</div></div>
                  <SelectField value={hostRole} onChange={e => setHostRole(e.target.value)}><RoleOptions takenRoles={takenRoles} currentRole={hostRole} /></SelectField>
                  <div style={{ color:DS.teal2, fontSize:12, fontWeight:950, textAlign:'right' }}>HOST</div>
                </div>
              )}
              {players.map(player => (
                <div key={player.id} style={{ display:'grid', gridTemplateColumns:'minmax(180px, 1fr) minmax(280px, 1fr) 90px', gap:12, alignItems:'center', border:`1px solid ${DS.borderSoft}`, borderRadius:5, background:'rgba(2,11,19,0.46)', padding:12 }}>
                  <div><strong>{player.name}</strong><div style={{ color:DS.dim, fontSize:12 }}>{player.status}</div></div>
                  <SelectField value={player.role} onChange={e => updatePlayerRole(player.id, e.target.value)}><RoleOptions takenRoles={takenRoles} currentRole={player.role} /></SelectField>
                  <button onClick={() => removePlayer(player.id)} style={{ color:DS.red, border:`1px solid rgba(226,75,74,0.45)`, background:'rgba(226,75,74,0.08)', height:34, borderRadius:4, cursor:'pointer', fontWeight:850 }}>Remove</button>
                </div>
              ))}
              {!players.length && <div style={{ color:DS.muted, padding:'12px 0' }}>Waiting for additional players to join.</div>}
            </div>
          </div>
        </section>

        <section style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:12 }}>
          <div style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:DS.panel, padding:18 }}>
            <FieldLabel>Team Shared Notes</FieldLabel>
            <div style={{ color:DS.muted, fontSize:14 }}>Shared notes activate during live team play. They stay visible to the team and support coordination, but they do not replace player action submissions.</div>
          </div>
          <div style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:DS.panel2, padding:18, display:'grid', gap:12 }}>
            <div><FieldLabel>STARTEX</FieldLabel><div style={{ color:DS.muted, fontSize:13, lineHeight:1.5 }}>Next build wires this button to the normal single-player EOC live page.</div></div>
            <PrimaryButton disabled={true} onClick={() => {}}>STARTEX — Next Build</PrimaryButton>
          </div>
        </section>
      </>
    )
  }

  return shell(
    <>
      <section style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:DS.panel, padding:22 }}>
        <div style={{ color:DS.teal, fontSize:12, fontWeight:950, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:8 }}>Host Team Exercise</div>
        <h1 style={{ margin:'0 0 10px', fontSize:36, lineHeight:1.05, fontWeight:950 }}>Create Team Room</h1>
        <p style={{ margin:0, color:DS.muted, fontSize:15, lineHeight:1.55 }}>Set up the event first. After the room is created, share the room code and assign roles as players join.</p>
      </section>

      <section style={{ display:'grid', gridTemplateColumns:'minmax(0, 1.58fr) minmax(340px, 0.82fr)', gap:12, alignItems:'start' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:12 }}>
          {scenarioEntries.map(([key, scenario]) => <ScenarioCard key={key} scenarioKey={key} scenario={scenario} selected={selectedScenario === key} onSelect={setSelectedScenario} />)}
        </div>
        <aside style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:DS.panel2, padding:18, position:'sticky', top:12 }}>
          <FieldLabel>Team Exercise Setup</FieldLabel>
          <div style={{ color:DS.text, fontSize:22, fontWeight:950, marginBottom:16 }}>{selectedVisual?.title || SCENARIOS[selectedScenario]?.name}</div>
          <div style={{ display:'grid', gap:14 }}>
            <label><FieldLabel>Jurisdiction Type</FieldLabel><SelectField value={jurisdiction} onChange={e => setJurisdiction(e.target.value)}>{JURISDICTIONS.map(j => <option key={j} value={j}>{j}</option>)}</SelectField></label>
            <label><FieldLabel>Difficulty</FieldLabel><SelectField value={difficulty} onChange={e => setDifficulty(e.target.value)}>{DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}</SelectField></label>
            <label><FieldLabel>Host Mode</FieldLabel><SelectField value={hostMode} onChange={e => setHostMode(e.target.value)}><option value="host_player">Host will play a role</option><option value="facilitator_only">Host will facilitate only</option></SelectField></label>
            <label><FieldLabel>Host Name</FieldLabel><TextInput value={hostName} onChange={e => setHostName(e.target.value)} placeholder="Host" /></label>
            {hostMode === 'host_player' && <label><FieldLabel>Host Role</FieldLabel><SelectField value={hostRole} onChange={e => setHostRole(e.target.value)}><RoleOptions takenRoles={[]} currentRole={hostRole} /></SelectField></label>}
            <div style={{ borderTop:`1px solid ${DS.borderSoft}`, paddingTop:14 }}><PrimaryButton disabled={!selectedScenario || !jurisdiction || !difficulty || (hostMode === 'host_player' && !hostRole)} onClick={createRoom}>Create Team Room</PrimaryButton></div>
            <div style={{ color:DS.dim, fontSize:12, lineHeight:1.5 }}>Custom scenario and advanced room options will be added after the core team flow is stable.</div>
          </div>
        </aside>
      </section>
    </>
  )
}
