import { useEffect, useMemo, useState } from 'react'
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
  bg:'#020B13', bg2:'#071421', panel:'rgba(4, 17, 29, 0.82)', panel2:'rgba(6, 23, 38, 0.92)',
  border:'rgba(87, 146, 198, 0.30)', borderSoft:'rgba(87, 146, 198, 0.22)', borderStrong:'rgba(65, 141, 255, 0.62)',
  teal:'#45A3FF', teal2:'#2DE2B8', blue:'#2E83FF', amber:'#F59B22', red:'#E24B4A',
  text:'#F4F8FE', muted:'#B9C8D8', dim:'#6F8195',
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

function FieldLabel({ children }) {
  return <div style={{ fontSize:10, color:DS.muted, textTransform:'uppercase', letterSpacing:'0.13em', fontWeight:900, marginBottom:7 }}>{children}</div>
}

function SelectField({ value, onChange, children, disabled=false }) {
  return <select disabled={disabled} value={value} onChange={onChange} style={{ width:'100%', height:42, background:DS.bg2, color:disabled ? DS.dim : DS.text, border:`1px solid ${DS.borderSoft}`, borderRadius:5, padding:'0 12px', fontFamily:'Inter, system-ui, sans-serif', fontSize:13, outline:'none' }}>{children}</select>
}

function TextInput(props) {
  return <input {...props} style={{ width:'100%', height:42, background:DS.bg2, color:DS.text, border:`1px solid ${DS.borderSoft}`, borderRadius:5, padding:'0 12px', boxSizing:'border-box', fontFamily:'Inter, system-ui, sans-serif', fontSize:13, outline:'none', ...(props.style || {}) }} />
}

function PrimaryButton({ children, disabled, onClick, tone='blue' }) {
  const green = tone === 'green'; const red = tone === 'red'
  return <button onClick={onClick} disabled={disabled} style={{ height:44, borderRadius:5, border:`1px solid ${disabled ? 'rgba(87,146,198,0.16)' : red ? 'rgba(226,75,74,0.72)' : green ? DS.teal2 : DS.borderStrong}`, background:disabled ? 'rgba(7,20,33,0.52)' : red ? 'linear-gradient(180deg, #9B231F, #6D1714)' : green ? 'linear-gradient(180deg, #168B55, #0D633D)' : 'linear-gradient(180deg, #1455B8, #0E3F91)', color:disabled ? 'rgba(185,200,216,0.36)' : '#fff', fontWeight:950, cursor:disabled ? 'not-allowed' : 'pointer', padding:'0 18px', fontSize:14, letterSpacing:'0.02em' }}>{children}</button>
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
      {roles.map(role => <option key={role} value={role} disabled={takenRoles.includes(role) && role !== currentRole}>{role}</option>)}
    </optgroup>
  ))
}

async function apiTeamRoom(payload, method='POST') {
  const res = await fetch('/api/team-room', {
    method,
    headers: method === 'POST' ? { 'Content-Type':'application/json' } : undefined,
    body: method === 'POST' ? JSON.stringify(payload) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.ok === false) throw new Error(data.error || 'Team room request failed')
  return data
}

async function fetchRoom(code) {
  const clean = String(code || '').trim().toUpperCase()
  if (!clean) return null
  const res = await fetch(`/api/team-room?code=${encodeURIComponent(clean)}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.ok === false) throw new Error(data.error || 'Room not found')
  return data.room
}

function getInitialRoomCode() {
  try { return new URLSearchParams(window.location.search).get('teamRoom') || '' }
  catch { return '' }
}

export default function TeamExerciseLobby({ entryMode='host', state, update, onMissionPortal, onStartExercise }) {
  const scenarioEntries = useMemo(() => Object.entries(SCENARIOS).filter(([key]) => Boolean(SCENARIO_VISUALS[key])), [])
  const initialLinkCode = getInitialRoomCode()
  const [mode, setMode] = useState(entryMode)
  const [screen, setScreen] = useState(entryMode === 'join' || initialLinkCode ? 'join' : 'setup')
  const [selectedScenario, setSelectedScenario] = useState(state?.scenario || 'hurricane')
  const [jurisdiction, setJurisdiction] = useState(state?.jurisdiction || 'Mid-Size City')
  const [difficulty, setDifficulty] = useState(state?.difficulty || 'Standard')
  const [hostMode, setHostMode] = useState('host_player')
  const [hostRole, setHostRole] = useState(state?.role || 'EOC Director')
  const [hostName, setHostName] = useState(state?.playerName || 'Host')
  const [room, setRoom] = useState(state?.teamRoom || null)
  const [joinCode, setJoinCode] = useState(initialLinkCode.toUpperCase())
  const [joinName, setJoinName] = useState('')
  const [joinRole, setJoinRole] = useState('EOC Director')
  const [playerId, setPlayerId] = useState(null)
  const [joinPreview, setJoinPreview] = useState(null)
  const [copyMsg, setCopyMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [launching, setLaunching] = useState(false)

  const code = room?.roomCode || ''
  const selectedVisual = SCENARIO_VISUALS[selectedScenario] || SCENARIO_VISUALS[room?.exercise?.scenario]
  const roomLink = code ? `${window.location.origin}?teamRoom=${encodeURIComponent(code)}` : ''
  const roster = room?.players || []
  const activeRoles = roster.filter(p => p.role).length
  const takenRoles = roster.map(p => p.role).filter(Boolean)
  const joinTakenRoles = (joinPreview?.players || []).map(p => p.role).filter(Boolean)
  const currentPlayer = roster.find(p => p.id === playerId)
  const hostPlayer = roster.find(p => p.isHost)
  const launchPlayer = currentPlayer || (mode === 'host' ? hostPlayer : null)

  useEffect(() => {
    if (screen !== 'lobby' || !code) return undefined
    let cancelled = false
    const load = async () => {
      try {
        const next = await fetchRoom(code)
        if (!cancelled) {
          setRoom(next)
          update?.({ teamRoom:next })
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }
    load()
    const id = setInterval(load, 2500)
    return () => { cancelled = true; clearInterval(id) }
  }, [screen, code, update])

  useEffect(() => {
    if (screen !== 'waiting' || !joinCode.trim()) return undefined
    let cancelled = false
    const load = async () => {
      try {
        const next = await fetchRoom(joinCode)
        if (!cancelled) setRoom(next)
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }
    load()
    const id = setInterval(load, 2500)
    return () => { cancelled = true; clearInterval(id) }
  }, [screen, joinCode])

  useEffect(() => {
    if (room?.status !== 'active' || launching || !launchPlayer || !onStartExercise) return
    setLaunching(true)
    update?.({ teamRoom:room })
    onStartExercise(room, launchPlayer)
  }, [room, launching, launchPlayer, onStartExercise, update])

  useEffect(() => {
    if (screen !== 'join') return undefined
    const clean = joinCode.trim().toUpperCase()
    if (clean.length < 4) { setJoinPreview(null); return undefined }
    let cancelled = false
    const id = setTimeout(async () => {
      try {
        const next = await fetchRoom(clean)
        if (!cancelled) {
          setJoinPreview(next)
          setError('')
          const taken = next.players.map(p => p.role).filter(Boolean)
          if (taken.includes(joinRole)) {
            const firstAvailable = Object.keys(ROLES).find(role => !taken.includes(role)) || ''
            setJoinRole(firstAvailable)
          }
        }
      } catch {
        if (!cancelled) setJoinPreview(null)
      }
    }, 450)
    return () => { cancelled = true; clearTimeout(id) }
  }, [screen, joinCode, joinRole])

  function copyText(text) {
    if (!text) return
    navigator.clipboard?.writeText(text).then(() => setCopyMsg('Copied')).catch(() => setCopyMsg('Copy unavailable'))
    setTimeout(() => setCopyMsg(''), 1600)
  }

  async function createRoom() {
    setBusy(true); setError('')
    try {
      const data = await apiTeamRoom({ action:'create', scenario:selectedScenario, jurisdiction, difficulty, hostMode, hostName, hostRole })
      setRoom(data.room)
      setPlayerId(data.playerId || null)
      update?.({
        scenario:selectedScenario,
        jurisdiction,
        difficulty,
        role:hostMode === 'host_player' ? hostRole : state?.role,
        playerName:hostMode === 'host_player' ? hostName : state?.playerName,
        teamRoom:data.room,
      })
      setScreen('lobby')
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  async function playerJoin() {
    setBusy(true); setError('')
    try {
      const data = await apiTeamRoom({ action:'join', code:joinCode, name:joinName, role:joinRole })
      setRoom(data.room)
      setPlayerId(data.playerId)
      setScreen('waiting')
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  async function updatePlayerRole(id, role) {
    if (!code) return
    setBusy(true); setError('')
    try {
      const data = await apiTeamRoom({ action:'updateRole', code, playerId:id, role })
      setRoom(data.room)
      update?.({ teamRoom:data.room })
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  async function startExercise() {
    if (!code || busy || room?.status !== 'lobby') return
    setBusy(true); setError('')
    try {
      const data = await apiTeamRoom({ action:'start', code })
      setRoom(data.room)
      update?.({ teamRoom:data.room })
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  async function removePlayer(id) {
    if (!code || id === 'host') return
    setBusy(true); setError('')
    try {
      const data = await apiTeamRoom({ action:'removePlayer', code, playerId:id })
      setRoom(data.room)
      update?.({ teamRoom:data.room })
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
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

  const ErrorBlock = error ? <div style={{ border:`1px solid rgba(226,75,74,0.45)`, background:'rgba(226,75,74,0.10)', color:'#FFD6D6', borderRadius:5, padding:'10px 12px', fontSize:13 }}>{error}</div> : null

  if (screen === 'join') {
    const roomName = joinPreview ? SCENARIO_VISUALS[joinPreview.exercise?.scenario]?.title || SCENARIOS[joinPreview.exercise?.scenario]?.name : null
    return shell(
      <div style={{ display:'grid', gridTemplateColumns:'minmax(360px, 0.72fr) minmax(460px, 1.28fr)', gap:18, alignItems:'stretch' }}>
        <section style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:DS.panel, padding:22 }}>
          <div style={{ color:DS.teal, fontSize:12, fontWeight:950, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:8 }}>Team Exercise</div>
          <h1 style={{ margin:'0 0 10px', fontSize:34, lineHeight:1.05, fontWeight:950 }}>Join Team Room</h1>
          <p style={{ margin:'0 0 24px', color:DS.muted, fontSize:15, lineHeight:1.55 }}>Enter the room code from your host, add your name, and select your EOC role.</p>
          <div style={{ display:'grid', gap:14 }}>
            <label><FieldLabel>Room Code</FieldLabel><TextInput value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="K7A9-3B2L" /></label>
            <label><FieldLabel>Your Name</FieldLabel><TextInput value={joinName} onChange={e => setJoinName(e.target.value)} placeholder="Alex Johnson" /></label>
            <label><FieldLabel>Select Your Role</FieldLabel><SelectField value={joinRole} onChange={e => setJoinRole(e.target.value)}><RoleOptions takenRoles={joinTakenRoles} currentRole={joinRole} /></SelectField></label>
            {ErrorBlock}
            <PrimaryButton disabled={busy || !joinCode.trim() || !joinName.trim() || !joinRole} onClick={playerJoin}>{busy ? 'Joining...' : 'Join Room'}</PrimaryButton>
          </div>
        </section>
        <section style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:DS.panel2, padding:22 }}>
          <div style={{ color:DS.teal2, fontSize:12, fontWeight:950, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:10 }}>{joinPreview ? 'Room Found' : 'What Happens Next'}</div>
          {joinPreview ? (
            <div style={{ display:'grid', gap:12 }}>
              <div style={{ color:DS.text, fontSize:24, fontWeight:950 }}>{roomName}</div>
              <div style={{ color:DS.muted, fontSize:14, lineHeight:1.7 }}>Jurisdiction: <span style={{ color:DS.text }}>{joinPreview.exercise?.jurisdiction}</span><br />Difficulty: <span style={{ color:DS.text }}>{joinPreview.exercise?.difficulty}</span><br />Host: <span style={{ color:DS.text }}>{joinPreview.host?.name}</span><br />Lobby: <span style={{ color:DS.teal2 }}>{joinPreview.status}</span></div>
              <div style={{ borderTop:`1px solid ${DS.borderSoft}`, paddingTop:12, color:DS.muted, fontSize:13 }}>{joinPreview.players?.length || 0} / 8 active roles. Taken roles are disabled in the role selector.</div>
            </div>
          ) : ['You appear in the host lobby as ready.', 'The host can override or remove roles if needed.', 'When STARTEX begins, everyone enters the normal NEXUS EOC live exercise page.', 'The team sees the same scenario while actions are tracked by role.'].map((line, i) => (
            <div key={line} style={{ display:'grid', gridTemplateColumns:'34px 1fr', gap:12, alignItems:'start', padding:'14px 0', borderBottom:i < 3 ? `1px solid ${DS.borderSoft}` : 'none' }}><div style={{ width:26, height:26, borderRadius:'50%', display:'grid', placeItems:'center', background:'rgba(69,163,255,0.18)', color:DS.teal, fontWeight:950 }}>{i+1}</div><div style={{ color:DS.text, fontSize:14, lineHeight:1.55 }}>{line}</div></div>
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
        <p style={{ margin:'0 0 18px', color:DS.muted, fontSize:15, lineHeight:1.55 }}>You joined room <strong style={{ color:DS.text }}>{joinCode}</strong> as <strong style={{ color:DS.text }}>{joinName}</strong>.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:12 }}>
          <div style={{ border:`1px solid ${DS.borderSoft}`, borderRadius:5, padding:14, background:'rgba(2,11,19,0.42)' }}><FieldLabel>Your Role</FieldLabel><div style={{ color:DS.text, fontWeight:950 }}>{currentPlayer?.role || joinRole}</div></div>
          <div style={{ border:`1px solid ${DS.borderSoft}`, borderRadius:5, padding:14, background:'rgba(2,11,19,0.42)' }}><FieldLabel>Lobby Status</FieldLabel><div style={{ color:DS.teal2, fontWeight:950 }}>{room?.status === 'lobby' ? 'Lobby Open' : room?.status || 'Checking...'}</div></div>
          <div style={{ border:`1px solid ${DS.borderSoft}`, borderRadius:5, padding:14, background:'rgba(2,11,19,0.42)' }}><FieldLabel>Active Roles</FieldLabel><div style={{ color:DS.text, fontWeight:950 }}>{room?.players?.length || 0} / 8</div></div>
        </div>
        <div style={{ marginTop:18, color:DS.muted, fontSize:14 }}>Wait for the host to start the exercise.</div>
        <div style={{ marginTop:14 }}>{ErrorBlock}</div>
      </section>
    )
  }

  if (screen === 'lobby') {
    const exercise = room?.exercise || { scenario:selectedScenario, jurisdiction, difficulty, hostMode }
    const lobbyVisual = SCENARIO_VISUALS[exercise.scenario]
    return shell(
      <>
        <section style={{ display:'grid', gridTemplateColumns:'1.02fr 1.05fr 0.68fr', gap:12 }}>
          <div style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:DS.panel, padding:18 }}>
            <FieldLabel>Exercise Setup</FieldLabel>
            <div style={{ color:DS.text, fontSize:17, fontWeight:950, marginBottom:10 }}>{lobbyVisual?.title || SCENARIOS[exercise.scenario]?.name}</div>
            <div style={{ color:DS.muted, fontSize:13, lineHeight:1.7 }}>Jurisdiction: <span style={{ color:DS.text }}>{exercise.jurisdiction}</span><br />Difficulty: <span style={{ color:DS.text }}>{exercise.difficulty}</span><br />Host Mode: <span style={{ color:DS.text }}>{exercise.hostMode === 'host_player' ? 'Host plays a role' : 'Facilitator only'}</span></div>
          </div>
          <div style={{ border:`1px solid ${DS.borderStrong}`, borderRadius:4, background:'rgba(6,23,38,0.92)', padding:18 }}>
            <FieldLabel>Room Information</FieldLabel>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}><div style={{ color:DS.teal2, fontSize:34, fontWeight:950, letterSpacing:'0.05em' }}>{code}</div><PrimaryButton onClick={() => copyText(code)}>Copy Code</PrimaryButton></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 132px', gap:10, marginTop:14 }}><TextInput value={roomLink} readOnly /><PrimaryButton onClick={() => copyText(roomLink)}>Copy Link</PrimaryButton></div>
            <div style={{ color:copyMsg ? DS.teal2 : DS.dim, fontSize:12, marginTop:10 }}>{copyMsg || 'Share this code or link with players.'}</div>
          </div>
          <div style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:DS.panel, padding:18 }}>
            <FieldLabel>Lobby Status</FieldLabel>
            <div style={{ color:DS.text, fontSize:22, fontWeight:950 }}>{activeRoles} / 8 roles</div>
            <div style={{ color:DS.teal2, fontSize:13, marginTop:10 }}>● Lobby Open</div>
            <div style={{ color:DS.dim, fontSize:12, marginTop:10 }}>Auto-refreshing every few seconds.</div>
          </div>
        </section>

        <section style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:DS.panel, overflow:'hidden' }}>
          <div style={{ padding:'16px 18px', borderBottom:`1px solid ${DS.borderSoft}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
            <div><div style={{ color:DS.text, fontSize:20, fontWeight:950 }}>Players & Role Assignments</div><div style={{ color:DS.muted, fontSize:13, marginTop:4 }}>Players join by code, select one available EOC role, and appear here as ready. Host can override if needed.</div></div>
            <div style={{ color:activeRoles >= 2 ? DS.teal2 : DS.amber, fontWeight:950 }}>{activeRoles} / 8 active roles</div>
          </div>
          <div style={{ padding:18 }}>
            <div style={{ display:'grid', gap:10 }}>
              {roster.map(player => (
                <div key={player.id} style={{ display:'grid', gridTemplateColumns:'minmax(180px, 1fr) minmax(280px, 1fr) 90px 90px', gap:12, alignItems:'center', border:`1px solid ${DS.borderSoft}`, borderRadius:5, background:'rgba(2,11,19,0.46)', padding:12 }}>
                  <div><strong>{player.name}{player.id === playerId ? ' (You)' : ''}</strong><div style={{ color:DS.dim, fontSize:12 }}>{player.isHost ? 'Host-player' : 'Player'}</div></div>
                  <SelectField value={player.role} disabled={busy} onChange={e => updatePlayerRole(player.id, e.target.value)}><RoleOptions takenRoles={takenRoles} currentRole={player.role} /></SelectField>
                  <div style={{ color:DS.teal2, fontSize:12, fontWeight:950, textAlign:'right' }}>READY</div>
                  {player.isHost ? <div style={{ color:DS.teal2, fontSize:12, fontWeight:950, textAlign:'right' }}>HOST</div> : <button onClick={() => removePlayer(player.id)} disabled={busy} style={{ color:DS.red, border:`1px solid rgba(226,75,74,0.45)`, background:'rgba(226,75,74,0.08)', height:34, borderRadius:4, cursor:busy ? 'not-allowed' : 'pointer', fontWeight:850 }}>Remove</button>}
                </div>
              ))}
              {!roster.length && <div style={{ color:DS.muted, padding:'12px 0' }}>Waiting for players to join. Share the room code or link above.</div>}
            </div>
            <div style={{ marginTop:12 }}>{ErrorBlock}</div>
          </div>
        </section>

        <section style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:12 }}>
          <div style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:DS.panel, padding:18 }}><FieldLabel>Team Shared Notes</FieldLabel><div style={{ color:DS.muted, fontSize:14 }}>Shared notes activate during live team play. They stay visible to the team and support coordination, but they do not replace player action submissions.</div></div>
          <div style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:DS.panel2, padding:18, display:'grid', gap:12 }}><div><FieldLabel>STARTEX</FieldLabel><div style={{ color:DS.muted, fontSize:13, lineHeight:1.5 }}>{activeRoles >= 2 ? 'Start the exercise for everyone in this room.' : 'At least two active player roles are required to start.'}</div></div><PrimaryButton disabled={busy || launching || room?.status !== 'lobby' || activeRoles < 2} onClick={startExercise}>{launching ? 'Launching...' : busy ? 'Starting...' : 'STARTEX'}</PrimaryButton></div>
        </section>
      </>
    )
  }

  return shell(
    <>
      <section style={{ border:`1px solid ${DS.border}`, borderRadius:4, background:DS.panel, padding:22 }}>
        <div style={{ color:DS.teal, fontSize:12, fontWeight:950, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:8 }}>Host Team Exercise</div>
        <h1 style={{ margin:'0 0 10px', fontSize:36, lineHeight:1.05, fontWeight:950 }}>Create Team Room</h1>
        <p style={{ margin:0, color:DS.muted, fontSize:15, lineHeight:1.55 }}>Set up the event first. After the room is created, share the room code and players select their own roles as they join.</p>
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
            {ErrorBlock}
            <div style={{ borderTop:`1px solid ${DS.borderSoft}`, paddingTop:14 }}><PrimaryButton disabled={busy || !selectedScenario || !jurisdiction || !difficulty || (hostMode === 'host_player' && !hostRole)} onClick={createRoom}>{busy ? 'Creating...' : 'Create Team Room'}</PrimaryButton></div>
            <div style={{ color:DS.dim, fontSize:12, lineHeight:1.5 }}>Custom scenario and advanced room options will be added after the core team flow is stable.</div>
          </div>
        </aside>
      </section>
    </>
  )
}
