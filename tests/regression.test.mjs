import test from 'node:test'
import assert from 'node:assert/strict'
import { createExerciseConfigSnapshot, launchOptionsFromSnapshot, createIntegrityState, appendIntegrityEvent, operationalTurnCount, applyStatePatch, validateChronology } from '../src/lib/exerciseIntegrity.js'
import { buildTranscriptReportModel, buildAarReportModel } from '../src/lib/reportModel.js'

for (const turns of [1,2,6]) {
  test(`ENDEX after ${turns} operational responses preserves turn count`, () => {
    let integrity=createIntegrityState('x')
    for (let i=1;i<=turns;i++) ({integrity}=appendIntegrityEvent(integrity,{type:'player_turn',turn:i}))
    ;({integrity}=appendIntegrityEvent(integrity,{type:'exercise_end'}))
    assert.equal(operationalTurnCount(integrity.events),turns)
  })
}

test('same-setup restart remains byte-stable across 20 clones', () => {
  const snapshot=createExerciseConfigSnapshot({
    scenario:'wildfire', jurisdictionType:'Large Urban County', jurisdictionName:'Sonoma County, California', jurisdictionMode:'specific', difficulty:'Advanced', role:'EOC Director', participant:'Player',
    localPlan:{status:'ready',activeForExercise:true,name:'Plan'}, selectedLocation:{label:'Sonoma County, California',center:[38.58,-122.85]},
  })
  const expected=JSON.stringify(launchOptionsFromSnapshot(snapshot))
  for (let i=0;i<20;i++) assert.equal(JSON.stringify(launchOptionsFromSnapshot(snapshot)),expected)
})

test('heading-like player input remains body content in typed transcript', () => {
  const body='TURN 99\nStatus\nRecommendations\n# heading\n- bullet\n| table | row |\n'+'A'.repeat(2000)
  const model=buildTranscriptReportModel({scenarioName:'Test',jurisdictionName:'Wilmington, Delaware',jurisdictionType:'Mid-Size City',difficulty:'Advanced',role:'EOC Director',participant:'P',worldState:{location:'Wilmington, Delaware'},transcript:[{type:'turn',turn:1,simTime:'H+0:10',situation:'CRITICAL',playerInput:body,aiResponse:'Response',lifelineText:'ok'}],finalLifelineText:'final'})
  assert.equal(model.entries.filter(e=>e.kind==='turn').length,1)
  assert.equal(model.entries.find(e=>e.kind==='turn').subs.find(s=>s.label==='Director Input').body,body)
})

test('typed transcript contains exactly one final lifelines section', () => {
  const model=buildTranscriptReportModel({scenarioName:'Test',jurisdictionName:'New Castle County, Delaware',jurisdictionType:'Suburban County',transcript:[],finalLifelineText:'x'})
  assert.equal(model.entries.filter(e=>e.kind==='lifelines').length,1)
})

test('AAR model paginates as typed sections, not prose headings', () => {
  const long='Recommendations\nTURN 8\n# not a heading\n'+('Long evidence sentence. '.repeat(300))
  const model=buildAarReportModel({scenarioName:'Test',jurisdictionName:'Richmond, Virginia',jurisdictionType:'Mid-Size City',turns:6,aar:{situationSummary:long,decisionLog:long,resourceCoordination:long,communications:long,strengths:long,criticalGaps:long,doctrineReferences:long,recommendations:long}})
  assert.equal(model.reportTitle,'After-Action Review')
  assert.ok(model.entries.length>=8)
  assert.ok(model.entries[0].subs[0].body.includes('TURN 8'))
})

test('overlapping categories are not incorrectly summed as exclusive census', () => {
  const integrity=createIntegrityState('x')
  const result=applyStatePatch(integrity,{populations:[{id:'care',total:38,completePartition:true,categories:[{id:'wheelchair',count:12,exclusive:true},{id:'assisted',count:8,exclusive:true},{id:'ambulatory',count:18,exclusive:true},{id:'oxygen',count:15,exclusive:false}]}]},{causeEventId:'EVT-1'})
  assert.equal(result.violations.length,0)
  assert.equal(result.integrity.entities.populations.care.total,38)
})

test('resource lifecycle rejects impossible arrival before assignment', () => {
  let integrity=createIntegrityState('x')
  integrity.entities.resources.ambulance={id:'ambulance',status:'requested'}
  const result=applyStatePatch(integrity,{resources:[{id:'ambulance',status:'arrived'}]},{causeEventId:'EVT-2'})
  assert.ok(result.violations.some(v=>v.code==='ILLEGAL_RESOURCE_TRANSITION'))
})

test('historical reports may have earlier occurrence times without clock regression', () => {
  assert.equal(validateChronology('14:30','14:15',{historical:true}).length,0)
  assert.ok(validateChronology('14:30','14:15').length>0)
})

test('generated jurisdiction restart preserves selected location without changing to specific mode', () => {
  const snapshot=createExerciseConfigSnapshot({
    scenario:'mci', jurisdictionType:'Mid-Size City', jurisdictionName:'Green Bay, Wisconsin', jurisdictionMode:'generated', difficulty:'Standard', role:'EOC Director', selectedLocation:{id:'mid-green-bay-wi',label:'Green Bay, Wisconsin',center:[44.5133,-88.0133]}
  })
  const opts=launchOptionsFromSnapshot(snapshot)
  assert.equal(opts.specificJurisdiction,'')
  assert.equal(opts.selectedLocationOverride.label,'Green Bay, Wisconsin')
})

test('forecast valid time cannot precede issue time', () => {
  const violations = validateChronology('10:00 AM', '10:15 AM', { issueTime:'11:00 AM', validTime:'10:30 AM' })
  assert.equal(violations.some(v => v.code === 'FORECAST_TIME_INVALID'), true)
})

test('timestamp correction requires a known superseded event', () => {
  const missing = validateChronology('10:00 AM', '9:55 AM', { correction:true })
  assert.equal(missing.some(v => v.code === 'CORRECTION_TARGET_REQUIRED'), true)
  const unknown = validateChronology('10:00 AM', '9:55 AM', { correction:true, supersedesEventId:'EVT-9999' }, ['EVT-0001'])
  assert.equal(unknown.some(v => v.code === 'CORRECTION_TARGET_UNKNOWN'), true)
  const valid = validateChronology('10:00 AM', '9:55 AM', { correction:true, supersedesEventId:'EVT-0001' }, ['EVT-0001'])
  assert.equal(valid.length, 0)
})

test('assignment lifecycle separates arrival from destination acceptance', () => {
  let integrity = createIntegrityState('assignment-test')
  let result = applyStatePatch(integrity, { assignments:[{ id:'bus-1', status:'assigned' }] }, { causeEventId:'EVT-0001' })
  assert.equal(result.violations.length, 0)
  integrity = result.integrity
  result = applyStatePatch(integrity, { assignments:[{ id:'bus-1', status:'departed' }] }, { causeEventId:'EVT-0002' })
  assert.equal(result.violations.length, 0)
  integrity = result.integrity
  result = applyStatePatch(integrity, { assignments:[{ id:'bus-1', status:'arrived' }] }, { causeEventId:'EVT-0003' })
  assert.equal(result.violations.length, 0)
  assert.equal(result.integrity.entities.assignments['bus-1'].status, 'arrived')
  integrity = result.integrity
  result = applyStatePatch(integrity, { assignments:[{ id:'bus-1', status:'completed' }] }, { causeEventId:'EVT-0004' })
  assert.equal(result.violations.some(v => v.code === 'ILLEGAL_ASSIGNMENT_TRANSITION'), true)
})

test('team transcript additions remain typed body sections', () => {
  const model = buildTranscriptReportModel({
    scenarioName:'Team Test', jurisdictionName:'New Castle County, Delaware', jurisdictionType:'Suburban County', difficulty:'Advanced', role:'EOC Team', participant:'Team',
    worldState:{ location:'New Castle County, Delaware' },
    transcript:[{ type:'opening', time:'H+0:00', location:'New Castle County, Delaware', narrative:'Opening', dispatches:[], pins:[] }],
    finalLifelineText:'Safety & Security — YELLOW', finalSimTime:'H+0:30', finalSituation:'DEVELOPING',
    extraEntries:[{ kind:'communications', title:'Team Coordination Communications Log', subs:[{ label:'Communications', body:'TURN 99\nStatus\n# not a heading' }] }],
  })
  const comms = model.entries.find(e => e.kind === 'communications')
  assert.equal(comms.subs[0].body.includes('TURN 99'), true)
  assert.equal(model.entries.filter(e => e.kind === 'lifelines').length, 1)
})

test('team AAR supplemental sections remain typed sections', () => {
  const model = buildAarReportModel({
    scenarioName:'Team Test', jurisdictionName:'Richmond, Virginia', jurisdictionType:'Mid-Size City', role:'EOC Team', difficulty:'Advanced', participant:'Team', sessionStart:'H+0:00', sessionEnd:'H+1:00', turns:6,
    aar:{ situationSummary:'Summary', decisionLog:'Log', resourceCoordination:'Resources', communications:'Comms', strengths:'Strengths', criticalGaps:'Gaps', doctrineReferences:'Doctrine', recommendations:'Recommendations' },
    extraSections:[['Facilitator AAR — Overview','TURN 3\nRecommendations\nbody text']],
  })
  const entry = model.entries.find(e => e.title === 'Facilitator AAR — Overview')
  assert.equal(entry.subs[0].body.startsWith('TURN 3'), true)
})
