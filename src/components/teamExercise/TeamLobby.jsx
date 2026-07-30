import { useMemo, useState } from 'react'
import NexusLogo from '../brand/NexusLogo'
import { SCENARIOS, DIFFICULTIES } from '../../data/scenarios'
import { JURISDICTIONS, JURISDICTION_CONTEXT } from '../../data/jurisdictions'
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
  bg:'#020B13', bg2:'#071421', panel:'rgba(4, 17, 29, 0.82)',
  border:'rgba(87, 146, 198, 0.30)', borderSoft:'rgba(87, 146, 198, 0.22)', borderStrong:'rgba(65, 141, 255, 0.62)',
  teal:'#45A3FF', teal2:'#2DE2B8', blue:'#2E83FF', amber:'#F59B22', text:'#F4F8FE', muted:'#B9C8D8', dim:'#6F8195',
}

const difficultyText = {
  Introductory:'Slower pace, clearer pressure, and more forgiving evaluation.',
  Standard:'Normal realistic exercise pressure with practical coordination challenges.',
  Advanced:'Harder conditions, tighter timelines, and less complete information.',
  Expert:'High-pressure environment with severe consequences for weak or delayed decisions.',
  Adaptive:'The AI adjusts difficulty based on team performance.',
}

const SCENARIO_VISUALS = {
  hurricane:{ title:'Hurricane Landfall', img:hurricaneImage, tag:'Natural Hazard', desc:'Coastal hurricane impacts with evacuation, sheltering, infrastructure, and resource-prioritization pressures.' },
  mci:{ title:'Mass Casualty Incident', img:mciImage, tag:'MCI', desc:'High-casualty incident requiring coordination across EMS, hospitals, law enforcement, and public information.' },
  hazmat:{ title:'Hazardous Materials Release', img:hazmatImage, tag:'HazMat', desc:'HazMat incident with protective actions, public warning, environmental monitoring, and multiagency coordination.' },
  cyber:{ title:'Cyber-Infrastructure Cascade', img:cyberImage, tag:'Infrastructure', desc:'Cyber disruption affecting water, power, communications, public services, and continuity of operations.' },
  earthquake:{ title:'Major Earthquake', img:earthquakeImage, tag:'Natural Hazard', desc:'Seismic event with damage assessment gaps, degraded communications, medical surge, and staging challenges.' },
  flood:{ title:'Flash Flood / Dam Failure', img:floodImage, tag:'Natural Hazard', desc:'Rapid flooding with warning, evacuations, sheltering, access constraints, and infrastructure risk.' },
  wildfire:{ title:'Urban Wildfire', img:wildfireImage, tag:'Natural Hazard', desc:'Wind-driven fire with evacuation routes, shelter options, air resource coordination, and exposure risk.' },
  winter:{ title:'Winter Storm Cascade', img:winterImage, tag:'Natural Hazard', desc:'Extreme winter impacts with power outages, road clearance, warming shelters, fuel, and vulnerable populations.' },
  rdd:{ title:'Radiological Dispersal Device', img:rddImage, tag:'Security / CBRN', desc:'RDD event requiring consequence management, public messaging, federal coordination, and contamination controls.' },
  train:{ title:'Train Derailment — MCI / HazMat', img:trainImage, tag:'MCI / HazMat', desc:'Rail incident combining casualties, hazardous materials, evacuation decisions, and railroad coordination.' },
}

function roomCode() {
  return `NEXUS-${Math.floor(1000 + Math.random() * 9000)}`
}

function FieldLabel({ children }) {
  return <div style={{ fontSize:10, color:DS.muted, textTransform:'uppercase', letterSpacing:'0.13em', marginBottom:7 }}>{children}</div>
}

function SelectField({ value, onChange, children }) {
  return <select value={value} onChange={onChange} style={{ width:'100%', height:42, background:DS.bg2, color:DS.text, border:`1px solid ${DS.borderSoft}`, borderRadius:5, padding:'0 12px', fontFamily:'Inter, system-ui, sans-serif', fontSize:13, outline:'none' }}>{children}</select>
}

function RoleSelect({ value, onChange, disabledRoles=[] }) {
  return (
    <SelectField value={value} onChange={onChange}>
      {Object.entries(ROLE_GROUPS).map(([group, roles]) => (
        <optgroup key={group} label={group}>
          {roles.map(r => <option key={r} value={r} disabled={disabledRoles.includes(r) && r !== value}>{r}</option>)}
        </optgroup>
      ))}
    </SelectField>
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

function ScenarioCard({ scenarioKey, scenario, visual, selected, onSelect }) {
  return (
    <button onClick={() => onSelect(scenarioKey)} style={{ textAlign:'left', borderRadius:4, overflow:'hidden', border:`1px solid ${selected ? DS.borderStrong : DS.border}`, background:selected ? 'linear-gradient(180deg, rgba(46,131,255,0.18), rgba(3,14,24,0.92))' : 'rgba(3,14,24,0.84)', color:DS.text, cursor:'pointer', padding:0, minWidth:0, boxShadow:selected ? '0 0 0 1px rgba(69,163,255,0.22), 0 18px 36px rgba(0,0,0,0.22)' : '0 16px 34px rgba(0,0,0,0.16)', display:'flex', flexDirection:'column' }}>
      <div style={{ position:'relative', aspectRatio:'16 / 8', background:'#061522', overflow:'hidden' }}>
        {visual?.img && <img src={visual.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(2,9,16,0.02), rgba(2,9,16,0.48))' }} />
        {selected && <div style={{ position:'absolute', top:10, right:10, color:'#fff', background:'rgba(46,131,255,0.96)', borderRadius:999, padding:'4px 9px', fontSize:10, fontWeight:950, letterSpacing:'0.10em', textTransform:'uppercase' }}>Selected</div>}
      </div>
      <div style={{ padding:'11px 12px 13px', flex:1 }}>
        <div style={{ color:DS.text, fontSize:15, fontWeight:900, marginBottom:7, lineHeight:1.14 }}>{visual?.title || scenario.name}</div>
        <div style={{ color:DS.muted, fontSize:12, lineHeight:1.42 }}>{visual?.desc || scenario.desc}</div>
        <div style={{ marginTop:10, display:'inline-flex', alignItems:'center', height:22, padding:'0 8px', borderRadius:999, border:`1px solid ${DS.borderSoft}`, color:DS.teal2, fontSize:10, fontWeight:850, letterSpacing:'0.08em', textTransform:'uppercase', background:'rgba(45,226,184,0.08)' }}>{visual?.tag || 'Exercise'}</div>
      </div>
    </button>
  )
}

export default function TeamLobby({ state, update, onMissionPortal }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [newPlayerName, setNewPlayerName] = useState('')
  const teamRoom = state.teamRoom || {}
  const players = teamRoom.players || []
  const hostMode = teamRoom.hostMode || 'host_player'
  const scenarioEntries = useMemo(() => Object.entries(SCENARIOS).filter(([key]) => Boolean(SCENARIO_VISUALS[key])), [])
  const scenarioTypes = ['All', 'Natural Hazard', 'Infrastructure', 'Security / CBRN', 'HazMat', 'MCI', 'MCI / HazMat']
  const filtered = scenarioEntries.filter(([key, sc]) => {
    const visual = SCENARIO_VISUALS[key]
    const q = query.trim().toLowerCase()
    const matchesQuery = !q || `${visual?.title || sc.name} ${visual?.desc || sc.desc}`.toLowerCase().includes(q)
    const matchesFilter = filter === 'All' || visual?.tag === filter
    return matchesQuery && matchesFilter
  })
  const selectedScenario = state.scenario ? SCENARIOS[state.scenario] : null
  const selectedVisual = state.scenario ? SCENARIO_VISUALS[state.scenario] : null
  const selectedRole = state.role || 'EOC Director'
  const jurisdiction = JURISDICTION_CONTEXT[state.jurisdiction]
  const assignedRoles = [hostMode === 'host_player' ? selectedRole : null, ...players.map(p => p.role)].filter(Boolean)
  const canCreateRoom = Boolean(state.scenario)
  const canAddPlayer = newPlayerName.trim() && players.length < 7

  function setTeamRoom(patch) {
    update({ teamRoom: { ...teamRoom, ...patch } })
  }

  function addPlayer() {
    if (!canAddPlayer) return
    const allRoles = Object.values(ROLE_GROUPS).flat()
    const openRole = allRoles.find(r => !assignedRoles.includes(r)) || allRoles[0]
    setTeamRoom({
      players: [...players, { id:`p-${Date.now()}`, name:newPlayerName.trim(), role:openRole, ready:false }],
    })
    setNewPlayerName('')
  }

  function updatePlayer(id, patch) {
    setTeamRoom({ players: players.map(p => p.id === id ? { ...p, ...patch } : p) })
  }

  function removePlayer(id) {
    setTeamRoom({ players: players.filter(p => p.id !== id) })
  }

  function createOrRefreshRoom() {
    if (!canCreateRoom) return
    setTeamRoom({ roomCode:teamRoom.roomCode || roomCode(), status:'lobby', hostMode, players })
  }

  return (
    <div style={{ minHeight:'100vh', background:`radial-gradient(circle at 72% 8%, rgba(46,131,255,0.14), transparent 30%), linear-gradient(135deg, ${DS.bg}, #02070D 62%)`, color:DS.text, fontFamily:'Inter, system-ui, sans-serif' }}>
      <div style={{ minHeight:'100vh', backgroundImage:'linear-gradient(rgba(69,163,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(69,163,255,0.045) 1px, transparent 1px)', backgroundSize:'48px 48px' }}>
        <header style={{ height:76, borderBottom:`1px solid ${DS.border}`, background:'linear-gradient(180deg, rgba(2,10,18,0.98), rgba(3,13,22,0.96))', display:'flex', alignItems:'center', justifyContent:'center', boxSizing:'border-box' }}>
          <div style={{ width:'min(100%, 1680px)', padding:'0 clamp(18px, 2vw, 34px)', display:'flex', alignItems:'center', justifyContent:'space-between', boxSizing:'border-box' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, minWidth:0 }}>
              <NexusLogo variant="primary" tone="dark" size={48} imageStyle={{ maxWidth:'min(300px, 34vw)' }} />
              <div style={{ width:1, height:38, background:DS.border, flex:'0 0 auto' }} />
              <div style={{ fontSize:10, color:DS.dim, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:850, whiteSpace:'nowrap' }}>Team Exercise Lobby</div>
            </div>
            <nav style={{ display:'flex', alignItems:'center', gap:10 }}>
              <button onClick={onMissionPortal} style={{ background:'rgba(3,13,23,0.72)', color:DS.text, border:`1px solid ${DS.borderStrong}`, borderRadius:4, height:40, padding:'0 16px', cursor:'pointer', fontWeight:800, letterSpacing:'0.04em' }}>Mission Portal</button>
              <button onClick={() => update({ screen:'setup' })} style={{ background:'rgba(3,13,23,0.72)', color:DS.text, border:`1px solid ${DS.borderStrong}`, borderRadius:4, height:40, padding:'0 16px', cursor:'pointer', fontWeight:800, letterSpacing:'0.04em' }}>Single Player</button>
            </nav>
          </div>
        </header>

        <main style={{ width:'min(100%, 1680px)', margin:'0 auto', padding:'clamp(14px, 1.4vw, 24px)', boxSizing:'border-box' }}>
          <div style={{ display:'grid', gridTemplateColumns:'minmax(720px, 1fr) 420px', gap:20, alignItems:'start' }}>
            <section style={{ background:'rgba(4, 17, 29, 0.76)', border:`1px solid ${DS.border}`, borderRadius:4, boxShadow:'0 22px 70px rgba(0,0,0,0.28)', overflow:'hidden' }}>
              <div style={{ padding:'22px 24px 18px', borderBottom:`1px solid ${DS.border}` }}>
                <div style={{ color:DS.teal, fontSize:11, textTransform:'uppercase', letterSpacing:'0.18em', fontWeight:900, marginBottom:8 }}>Configure Team Room</div>
                <h1 style={{ margin:'0 0 8px', fontSize:36, lineHeight:1.05, letterSpacing:'0.02em', fontWeight:950 }}>Team Exercise Lobby</h1>
                <p style={{ margin:0, color:DS.muted, maxWidth:820, lineHeight:1.6, fontSize:14 }}>Set up the same EOC scenario for multiple players. This screen only prepares the room; the live exercise will reuse the normal single-player EOC play page.</p>
              </div>

              <div style={{ padding:22 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 190px', gap:12, marginBottom:16 }}>
                  <div><FieldLabel>Select Scenario</FieldLabel><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search scenarios..." style={{ width:'100%', height:42, background:DS.bg2, color:DS.text, border:`1px solid ${DS.borderSoft}`, borderRadius:5, padding:'0 12px', boxSizing:'border-box', fontSize:13, outline:'none' }} /></div>
                  <div><FieldLabel>Filter</FieldLabel><SelectField value={filter} onChange={e => setFilter(e.target.value)}>{scenarioTypes.map(t => <option key={t} value={t}>{t}</option>)}</SelectField></div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:12, marginBottom:24 }}>
                  {filtered.map(([key, sc]) => <ScenarioCard key={key} scenarioKey={key} scenario={sc} visual={SCENARIO_VISUALS[key]} selected={state.scenario === key} onSelect={(scenarioKey) => update({ scenario:scenarioKey })} />)}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
                  <div><FieldLabel>Host / Facilitator Name</FieldLabel><input type="text" value={state.playerName || ''} onChange={e => update({ playerName:e.target.value })} placeholder="N. Edwards" maxLength={40} style={{ width:'100%', height:42, background:DS.bg2, color:DS.text, border:`1px solid ${DS.borderSoft}`, borderRadius:5, padding:'0 12px', boxSizing:'border-box', fontSize:13, outline:'none' }} /></div>
                  <div><FieldLabel>Host Mode</FieldLabel><SelectField value={hostMode} onChange={e => setTeamRoom({ hostMode:e.target.value })}><option value="host_player">Host will play a role</option><option value="facilitator_only">Host will facilitate only</option></SelectField></div>
                </div>

                {hostMode === 'host_player' && (
                  <div style={{ marginBottom:18 }}><FieldLabel>Host Exercise Position / Function</FieldLabel><RoleSelect value={selectedRole} onChange={e => update({ role:e.target.value })} disabledRoles={players.map(p => p.role)} /></div>
                )}

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
                  <div><FieldLabel>Select Jurisdiction Type</FieldLabel><SelectField value={state.jurisdiction} onChange={e => update({ jurisdiction:e.target.value })}>{JURISDICTIONS.map(j => <option key={j} value={j}>{j}</option>)}</SelectField></div>
                  <div><FieldLabel>Select Difficulty</FieldLabel><SelectField value={state.difficulty} onChange={e => update({ difficulty:e.target.value })}>{DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}</SelectField></div>
                </div>

                <div style={{ border:`1px solid ${DS.borderSoft}`, background:'rgba(8,19,31,0.48)', borderRadius:5, padding:14, marginBottom:18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginBottom:12 }}>
                    <div><FieldLabel>Players / Role Assignments</FieldLabel><div style={{ color:DS.muted, fontSize:12 }}>Add 1–7 additional players. Roles come from the same approved EOC role list as single player.</div></div>
                    <div style={{ color:DS.teal2, fontSize:12, fontWeight:900 }}>{(hostMode === 'host_player' ? 1 : 0) + players.length} / 8 active roles</div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 150px', gap:10, marginBottom:12 }}>
                    <input value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Player name" style={{ width:'100%', height:42, background:DS.bg2, color:DS.text, border:`1px solid ${DS.borderSoft}`, borderRadius:5, padding:'0 12px', boxSizing:'border-box', fontSize:13, outline:'none' }} />
                    <button onClick={addPlayer} disabled={!canAddPlayer} style={{ height:42, borderRadius:5, border:`1px solid ${canAddPlayer ? DS.borderStrong : DS.borderSoft}`, background:canAddPlayer ? 'rgba(46,131,255,0.18)' : 'rgba(87,146,198,0.10)', color:canAddPlayer ? DS.text : DS.dim, cursor:canAddPlayer ? 'pointer' : 'not-allowed', fontWeight:900 }}>Add Player</button>
                  </div>
                  <div style={{ display:'grid', gap:10 }}>
                    {hostMode === 'host_player' && <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1.6fr auto', gap:10, alignItems:'center', padding:10, border:`1px solid ${DS.borderSoft}`, background:'rgba(4,17,29,0.72)', borderRadius:5 }}><div><div style={{ color:DS.text, fontWeight:900, fontSize:13 }}>{state.playerName || 'Host'}</div><div style={{ color:DS.dim, fontSize:11 }}>Host-player</div></div><div style={{ color:DS.teal, fontSize:13, fontWeight:800 }}>{selectedRole}</div><span style={{ color:DS.teal2, fontSize:11, fontWeight:900 }}>HOST</span></div>}
                    {players.map((p, idx) => (
                      <div key={p.id} style={{ display:'grid', gridTemplateColumns:'1.2fr 1.6fr 70px', gap:10, alignItems:'center', padding:10, border:`1px solid ${DS.borderSoft}`, background:'rgba(4,17,29,0.72)', borderRadius:5 }}>
                        <input value={p.name} onChange={e => updatePlayer(p.id, { name:e.target.value })} style={{ width:'100%', height:38, background:DS.bg2, color:DS.text, border:`1px solid ${DS.borderSoft}`, borderRadius:5, padding:'0 10px', boxSizing:'border-box', fontSize:13, outline:'none' }} />
                        <RoleSelect value={p.role} onChange={e => updatePlayer(p.id, { role:e.target.value })} disabledRoles={assignedRoles.filter(r => r !== p.role)} />
                        <button onClick={() => removePlayer(p.id)} style={{ height:38, borderRadius:5, border:`1px solid ${DS.borderSoft}`, background:'rgba(226,75,74,0.10)', color:'#FFB4B4', cursor:'pointer', fontWeight:900 }}>Remove</button>
                      </div>
                    ))}
                    {!players.length && <div style={{ color:DS.dim, fontSize:12, padding:'10px 0' }}>No additional players added yet.</div>}
                  </div>
                </div>

                <button onClick={createOrRefreshRoom} disabled={!canCreateRoom} style={{ width:'100%', height:52, border:'none', borderRadius:5, background:canCreateRoom ? 'linear-gradient(180deg, #2E83FF, #1455B8)' : 'rgba(87,146,198,0.16)', color:canCreateRoom ? '#fff' : DS.dim, cursor:canCreateRoom ? 'pointer' : 'not-allowed', fontWeight:950, letterSpacing:'0.12em', textTransform:'uppercase', boxShadow:canCreateRoom ? '0 18px 44px rgba(46,131,255,0.22)' : 'none' }}>{teamRoom.roomCode ? 'Update Team Lobby' : 'Create Team Lobby'}</button>
              </div>
            </section>

            <aside style={{ background:'rgba(4, 17, 29, 0.86)', border:`1px solid ${DS.border}`, borderRadius:4, boxShadow:'0 22px 70px rgba(0,0,0,0.28)', overflow:'hidden', position:'sticky', top:24 }}>
              <div style={{ borderBottom:`1px solid ${DS.border}`, background:'linear-gradient(180deg, rgba(46,131,255,0.12), rgba(4,17,29,0))' }}>
                <div style={{ height:selectedVisual ? 190 : 0, background:'#061522', overflow:'hidden', transition:'height 160ms ease' }}>{selectedVisual && <img src={selectedVisual.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />}</div>
                <div style={{ padding:'20px 22px 18px' }}>
                  <div style={{ color:DS.teal, fontSize:11, textTransform:'uppercase', letterSpacing:'0.18em', fontWeight:900, marginBottom:8 }}>Team Room Preview</div>
                  <h2 style={{ margin:0, fontSize:24, lineHeight:1.16 }}>{selectedVisual ? selectedVisual.title : selectedScenario ? selectedScenario.name : 'Awaiting Selection'}</h2>
                  <p style={{ color:DS.muted, lineHeight:1.6, fontSize:13, margin:'10px 0 0' }}>{selectedVisual ? selectedVisual.desc : selectedScenario ? selectedScenario.desc : 'Choose a scenario from the mission library to configure the team exercise.'}</p>
                </div>
              </div>
              <div style={{ padding:'6px 22px 22px' }}>
                <InfoRow label="Room Code" value={teamRoom.roomCode || 'Not created yet'} accent={Boolean(teamRoom.roomCode)} />
                <InfoRow label="Host Mode" value={hostMode === 'host_player' ? 'Host will play a role' : 'Facilitator only'} />
                <InfoRow label="Active Roles" value={`${(hostMode === 'host_player' ? 1 : 0) + players.length} configured`} accent />
                <InfoRow label="Jurisdiction Context" value={state.jurisdiction} />
                <div style={{ padding:'12px 0', borderBottom:`1px solid ${DS.borderSoft}` }}><div style={{ fontSize:10, color:DS.dim, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:4 }}>Jurisdiction Constraints</div><div style={{ fontSize:12, color:DS.muted, lineHeight:1.55 }}>{jurisdiction?.constraints}</div></div>
                <InfoRow label="Difficulty Profile" value={`${state.difficulty} — ${difficultyText[state.difficulty] || ''}`} />
                <div style={{ padding:'14px 0 0' }}><div style={{ fontSize:10, color:DS.dim, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>Next Build Step</div><div style={{ border:`1px solid ${DS.borderSoft}`, borderRadius:4, background:'rgba(8,19,31,0.58)', padding:14, color:DS.muted, fontSize:12, lineHeight:1.7 }}>After this lobby is approved, Team STARTEX will launch the normal EOC single-player live page and add only small team status/notes controls.</div></div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}
