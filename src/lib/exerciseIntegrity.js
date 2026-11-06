const STATUS_TRANSITIONS = {
  resource: {
    unknown: new Set(['requested','available','unavailable','assigned']),
    requested: new Set(['assigned','unavailable','cancelled']),
    assigned: new Set(['en_route','staged','committed','unavailable','cancelled']),
    en_route: new Set(['arrived','unavailable','cancelled']),
    arrived: new Set(['staged','committed','unavailable']),
    staged: new Set(['committed','available','unavailable']),
    committed: new Set(['available','unavailable','completed']),
    available: new Set(['assigned','unavailable']),
    unavailable: new Set(['available']),
    completed: new Set([]),
    cancelled: new Set([]),
  },
  assignment: {
    unknown:new Set(['assigned','pending']), pending:new Set(['assigned','cancelled']), assigned:new Set(['departed','cancelled']),
    departed:new Set(['arrived','cancelled']), arrived:new Set(['accepted','rejected']), accepted:new Set(['completed']), rejected:new Set(['assigned','cancelled']),
    completed:new Set([]), cancelled:new Set([]),
  },
}

const CONFIDENCE = new Set(['low','moderate','high','confirmed','unknown'])
const VERIFICATION = new Set(['exercise_assumption','plan_derived','participant_provided','simulated_report','verified','unverified','corrected'])

export function deepClone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value))
}

export function canonicalJurisdictionName(state = {}) {
  return String(
    state.exerciseConfig?.jurisdictionName ||
    state.worldState?.localizedJurisdiction ||
    state.localizedJurisdiction ||
    state.worldState?.location ||
    state.exerciseConfig?.selectedLocation?.label ||
    state.jurisdiction ||
    ''
  ).trim()
}

export function createExerciseConfigSnapshot({ scenario, jurisdictionType, jurisdictionName, jurisdictionMode='generated', difficulty, role, participant='', localPlan=null, customScenario=null, selectedLocation=null }) {
  const snapshot = {
    version:1,
    scenario:scenario || null,
    jurisdictionType:jurisdictionType || null,
    jurisdictionName:String(jurisdictionName || selectedLocation?.label || jurisdictionType || '').trim(),
    jurisdictionMode:String(jurisdictionMode || 'generated'),
    difficulty:difficulty || 'Adaptive',
    role:role || 'EOC Director',
    participant:String(participant || '').trim(),
    localPlan:localPlan ? deepClone(localPlan) : null,
    customScenario:customScenario ? deepClone(customScenario) : null,
    selectedLocation:selectedLocation ? deepClone(selectedLocation) : null,
  }
  return snapshot
}

export function launchOptionsFromSnapshot(snapshot = {}) {
  return {
    jurisdiction:snapshot.jurisdictionType,
    specificJurisdiction:snapshot.jurisdictionMode === 'specific' ? snapshot.jurisdictionName : '',
    selectedLocationOverride:snapshot.jurisdictionMode === 'generated' && snapshot.selectedLocation ? deepClone(snapshot.selectedLocation) : null,
    difficulty:snapshot.difficulty,
    role:snapshot.role,
    playerName:snapshot.participant,
    localPlan:snapshot.localPlan ? deepClone(snapshot.localPlan) : null,
  }
}

export function createIntegrityState(sessionId = '') {
  return {
    version:1,
    sessionId:sessionId || `session-${Date.now()}`,
    nextEventSeq:1,
    events:[],
    entities:{ populations:{}, facilities:{}, resources:{}, assignments:{}, facts:{} },
    violations:[],
    frozenFinalState:null,
  }
}

export function nextEventId(integrity = {}) {
  const seq = Number(integrity.nextEventSeq || 1)
  return `EVT-${String(seq).padStart(4,'0')}`
}

export function appendIntegrityEvent(integrity, event) {
  const base = integrity ? deepClone(integrity) : createIntegrityState()
  const id = event.id || nextEventId(base)
  const stored = { ...deepClone(event), id }
  base.events.push(stored)
  base.nextEventSeq = Number(base.nextEventSeq || 1) + 1
  return { integrity:base, event:stored }
}

export function operationalTurnCount(events = []) {
  return events.filter(event => event?.type === 'player_turn').length
}

export function controlEventCount(events = []) {
  return events.filter(event => event?.type && event.type !== 'player_turn').length
}

export function parseSimTime(value='') {
  const text = String(value || '').trim()
  let m = text.match(/^H\+(\d+):(\d{2})$/i)
  if (m) return { kind:'elapsed', minutes:Number(m[1]) * 60 + Number(m[2]), raw:text }
  m = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (m) {
    let h = Number(m[1]) % 12
    if (m[3].toUpperCase() === 'PM') h += 12
    return { kind:'clock', minutes:h * 60 + Number(m[2]), raw:text }
  }
  m = text.match(/^(\d{1,2}):(\d{2})$/)
  if (m) return { kind:'clock', minutes:Number(m[1]) * 60 + Number(m[2]), raw:text }
  const epoch = Date.parse(text)
  if (Number.isFinite(epoch)) return { kind:'absolute', minutes:Math.floor(epoch / 60000), raw:text }
  return { kind:'opaque', minutes:null, raw:text }
}

export function validateChronology(previousTime, nextTime, { historical=false, correction=false, issueTime=null, validTime=null, supersedesEventId=null } = {}, validEventIds=[]) {
  const violations = []
  const issue = parseSimTime(issueTime)
  const valid = parseSimTime(validTime)
  if (issueTime && validTime && issue.minutes != null && valid.minutes != null && issue.kind === valid.kind && valid.minutes < issue.minutes) {
    violations.push({ code:'FORECAST_TIME_INVALID', message:`Forecast valid time ${validTime} precedes issue time ${issueTime}.` })
  }
  if (correction) {
    if (!String(supersedesEventId || '').trim()) {
      violations.push({ code:'CORRECTION_TARGET_REQUIRED', message:'A corrected timestamp must identify the superseded event.' })
    } else if (validEventIds.length && !new Set(validEventIds).has(supersedesEventId)) {
      violations.push({ code:'CORRECTION_TARGET_UNKNOWN', eventId:supersedesEventId, message:`Correction references unknown event ${supersedesEventId}.` })
    }
    return violations
  }
  if (historical) return violations
  const prev = parseSimTime(previousTime)
  const next = parseSimTime(nextTime)
  if (prev.minutes == null || next.minutes == null || prev.kind !== next.kind) return violations
  if (next.minutes < prev.minutes) violations.push({ code:'CLOCK_REGRESSION', message:`Simulation time regressed from ${previousTime} to ${nextTime}.` })
  return violations
}

function normalizePopulation(record={}) {
  return {
    id:String(record.id || '').trim(), label:String(record.label || record.id || '').trim(), total:Number(record.total),
    categories:Array.isArray(record.categories) ? record.categories.map(c => ({ id:String(c.id || c.label || ''), label:String(c.label || c.id || ''), count:Number(c.count), exclusive:Boolean(c.exclusive) })) : [],
    completePartition:Boolean(record.completePartition), source:String(record.source || '').trim(), confidence:String(record.confidence || 'unknown').toLowerCase(), verification:String(record.verification || 'simulated_report').toLowerCase(),
  }
}

function validatePopulation(record) {
  const violations = []
  if (!record.id) violations.push({ code:'POPULATION_ID_REQUIRED', message:'Population record requires an id.' })
  if (!Number.isFinite(record.total) || record.total < 0) violations.push({ code:'POPULATION_TOTAL_INVALID', entityId:record.id, message:'Population total must be a nonnegative number.' })
  const exclusive = record.categories.filter(c => c.exclusive)
  if (exclusive.some(c => !Number.isFinite(c.count) || c.count < 0)) violations.push({ code:'POPULATION_CATEGORY_INVALID', entityId:record.id, message:'Population category counts must be nonnegative numbers.' })
  const sum = exclusive.reduce((n,c) => n + c.count, 0)
  if (Number.isFinite(record.total) && sum > record.total) violations.push({ code:'POPULATION_CONSERVATION', entityId:record.id, message:`Mutually exclusive categories total ${sum}, exceeding authoritative total ${record.total}.` })
  if (record.completePartition && Number.isFinite(record.total) && sum !== record.total) violations.push({ code:'POPULATION_PARTITION_INCOMPLETE', entityId:record.id, message:`Complete partition totals ${sum}; authoritative total is ${record.total}.` })
  return violations
}

function mergeById(target, records, kind, causeEventId) {
  const violations = []
  for (const incoming of records || []) {
    const id = String(incoming?.id || '').trim()
    if (!id) { violations.push({ code:`${kind.toUpperCase()}_ID_REQUIRED`, message:`${kind} update requires an id.` }); continue }
    const previous = target[id] || {}
    if (kind === 'facility' && previous.capacity && incoming.capacity && JSON.stringify(previous.capacity) !== JSON.stringify(incoming.capacity) && !incoming.causeEventId && !causeEventId) {
      violations.push({ code:'CAPACITY_CHANGE_WITHOUT_CAUSE', entityId:id, message:`Facility ${id} capacity changed without an explicit causal event.` })
      continue
    }
    if (kind === 'resource' && previous.status && incoming.status && previous.status !== incoming.status) {
      const from = String(previous.status).toLowerCase(), to = String(incoming.status).toLowerCase()
      const legal = STATUS_TRANSITIONS.resource[from]
      if (legal && !legal.has(to)) { violations.push({ code:'ILLEGAL_RESOURCE_TRANSITION', entityId:id, message:`Resource ${id} cannot transition from ${from} to ${to}.` }); continue }
    }
    target[id] = { ...previous, ...deepClone(incoming), id, causeEventId:incoming.causeEventId || causeEventId || previous.causeEventId || null }
  }
  return violations
}

export function applyStatePatch(integrity, patch, { causeEventId=null } = {}) {
  const base = integrity ? deepClone(integrity) : createIntegrityState()
  const next = deepClone(base)
  const violations = []
  if (!patch || typeof patch !== 'object') return { integrity:next, violations }

  for (const raw of Array.isArray(patch.populations) ? patch.populations : []) {
    const record = normalizePopulation(raw)
    const errs = validatePopulation(record)
    violations.push(...errs)
    if (!errs.length) next.entities.populations[record.id] = { ...(next.entities.populations[record.id] || {}), ...record, causeEventId }
  }
  violations.push(...mergeById(next.entities.facilities, Array.isArray(patch.facilities) ? patch.facilities : [], 'facility', causeEventId))
  violations.push(...mergeById(next.entities.resources, Array.isArray(patch.resources) ? patch.resources : [], 'resource', causeEventId))
  for (const incoming of Array.isArray(patch.assignments) ? patch.assignments : []) {
    const id = String(incoming?.id || '').trim()
    if (!id) { violations.push({ code:'ASSIGNMENT_ID_REQUIRED', message:'assignment update requires an id.' }); continue }
    const previous = next.entities.assignments[id] || {}
    if (previous.status && incoming.status && previous.status !== incoming.status) {
      const from = String(previous.status).toLowerCase(), to = String(incoming.status).toLowerCase()
      const legal = STATUS_TRANSITIONS.assignment[from]
      if (legal && !legal.has(to)) { violations.push({ code:'ILLEGAL_ASSIGNMENT_TRANSITION', entityId:id, message:`Assignment ${id} cannot transition from ${from} to ${to}.` }); continue }
    }
    next.entities.assignments[id] = { ...previous, ...deepClone(incoming), id, causeEventId:incoming.causeEventId || causeEventId || previous.causeEventId || null }
  }
  for (const fact of Array.isArray(patch.facts) ? patch.facts : []) {
    const id = String(fact?.id || '').trim()
    if (!id) { violations.push({ code:'FACT_ID_REQUIRED', message:'Fact update requires an id.' }); continue }
    const confidence = String(fact.confidence || 'unknown').toLowerCase()
    const verification = String(fact.verification || 'simulated_report').toLowerCase()
    if (!String(fact.source || '').trim()) violations.push({ code:'FACT_SOURCE_REQUIRED', entityId:id, message:`Fact ${id} requires source provenance.` })
    if (!CONFIDENCE.has(confidence)) violations.push({ code:'FACT_CONFIDENCE_INVALID', entityId:id, message:`Invalid confidence ${confidence}.` })
    if (!VERIFICATION.has(verification)) violations.push({ code:'FACT_VERIFICATION_INVALID', entityId:id, message:`Invalid verification ${verification}.` })
    if (violations.some(v => v.entityId === id)) continue
    next.entities.facts[id] = { ...(next.entities.facts[id] || {}), ...deepClone(fact), id, confidence, verification, causeEventId }
  }
  if (violations.length) {
    next.violations.push(...violations.map(v => ({ ...v, atEventId:causeEventId })))
    return { integrity:base, violations }
  }
  return { integrity:next, violations }
}

export function freezeFinalState(integrity, appState={}) {
  const next = integrity ? deepClone(integrity) : createIntegrityState()
  next.frozenFinalState = {
    frozenAt:new Date().toISOString(),
    simTime:appState.simTime || null,
    operationalTurns:operationalTurnCount(next.events),
    lifelines:deepClone(appState.lifelines || {}),
    entities:deepClone(next.entities),
    jurisdictionName:canonicalJurisdictionName(appState),
  }
  return next
}

export function buildEvidenceLedger(events=[]) {
  return events.filter(e => e?.type === 'player_turn').map(e => ({
    eventId:e.id,
    turn:e.turn,
    actor:e.actor || 'player',
    directive:String(e.directive || e.playerInput || '').trim(),
    execution:String(e.execution || e.aiResponse || '').trim(),
    simTime:e.simTime || null,
    deadlineState:e.deadlineState || 'not_specified',
  }))
}

export function validateEvaluationEvidence(items=[], validEventIds=[]) {
  const list = Array.isArray(items) ? items : []
  if (!list.length) return [{ code:'AAR_EVIDENCE_REQUIRED', message:'AAR requires structured evidence attribution.' }]
  const valid = new Set(validEventIds)
  const allowedStatuses = new Set(['directed_completed','directed_not_completed','directed_not_confirmed','not_directed','simulator_contradiction','exception_no_followup','exception_followed_up','deadline_after_end'])
  const violations = []
  for (const [index,item] of list.entries()) {
    if (!allowedStatuses.has(String(item?.status || ''))) violations.push({ code:'AAR_STATUS_INVALID', index, message:'AAR evidence status is missing or invalid.' })
    const ids = [...(item?.directiveEventIds || []), ...(item?.executionEventIds || []), ...(item?.followUpEventIds || [])]
    if (!ids.length && item?.status !== 'not_directed') violations.push({ code:'AAR_EVIDENCE_MISSING', index, message:'AAR claim has no supporting event IDs.' })
    for (const id of ids) if (!valid.has(id)) violations.push({ code:'AAR_EVIDENCE_UNKNOWN_EVENT', index, eventId:id, message:`AAR evidence references unknown event ${id}.` })
  }
  return violations
}
