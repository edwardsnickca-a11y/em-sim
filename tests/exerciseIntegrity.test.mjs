import test from 'node:test'
import assert from 'node:assert/strict'
import { createExerciseConfigSnapshot, launchOptionsFromSnapshot, createIntegrityState, appendIntegrityEvent, operationalTurnCount, validateChronology, applyStatePatch, freezeFinalState, validateEvaluationEvidence } from '../src/lib/exerciseIntegrity.js'

test('same setup snapshot preserves canonical jurisdiction', () => {
  const s = createExerciseConfigSnapshot({scenario:'mci',jurisdictionType:'Mid-Size City',jurisdictionName:'Richmond, Virginia',jurisdictionMode:'specific',difficulty:'Advanced',role:'EOC Director',participant:'Test'})
  assert.equal(launchOptionsFromSnapshot(s).specificJurisdiction, 'Richmond, Virginia')
  assert.equal(launchOptionsFromSnapshot(s).jurisdiction, 'Mid-Size City')
})

test('ENDEX control event never increments operational turns', () => {
  let integrity = createIntegrityState('x')
  ;({integrity}=appendIntegrityEvent(integrity,{type:'player_turn'}))
  ;({integrity}=appendIntegrityEvent(integrity,{type:'player_turn'}))
  ;({integrity}=appendIntegrityEvent(integrity,{type:'exercise_end'}))
  assert.equal(operationalTurnCount(integrity.events),2)
})

test('clock rejects regression', () => {
  assert.equal(validateChronology('H+1:30','H+1:20')[0]?.code,'CLOCK_REGRESSION')
})

test('population conservation rejects impossible exclusive partition', () => {
  const integrity = createIntegrityState('x')
  const result = applyStatePatch(integrity,{populations:[{id:'roster',total:163,completePartition:true,categories:[{id:'a',count:100,exclusive:true},{id:'b',count:110,exclusive:true}]}]},{causeEventId:'EVT-0001'})
  assert.ok(result.violations.some(v=>v.code==='POPULATION_CONSERVATION'))
  assert.equal(Object.keys(result.integrity.entities.populations).length,0)
})

test('facility capacity requires a causal event', () => {
  let integrity=createIntegrityState('x')
  integrity.entities.facilities.h={id:'h',capacity:{monitored:4}}
  const result=applyStatePatch(integrity,{facilities:[{id:'h',capacity:{monitored:8}}]})
  assert.ok(result.violations.some(v=>v.code==='CAPACITY_CHANGE_WITHOUT_CAUSE'))
})

test('final state freezes operational turn count', () => {
  let integrity=createIntegrityState('x')
  ;({integrity}=appendIntegrityEvent(integrity,{type:'player_turn'}))
  ;({integrity}=appendIntegrityEvent(integrity,{type:'exercise_end'}))
  const frozen=freezeFinalState(integrity,{simTime:'H+1:00',lifelines:{},exerciseConfig:{jurisdictionName:'Wilmington, Delaware'}})
  assert.equal(frozen.frozenFinalState.operationalTurns,1)
})

test('AAR evidence must resolve event IDs', () => {
  const violations=validateEvaluationEvidence([{status:'directed_completed',directiveEventIds:['EVT-9999']}],['EVT-0001'])
  assert.ok(violations.some(v=>v.code==='AAR_EVIDENCE_UNKNOWN_EVENT'))
})
