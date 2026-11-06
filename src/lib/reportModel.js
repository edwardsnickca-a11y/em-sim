export function buildTranscriptReportModel({ scenarioName, jurisdictionName, jurisdictionType, difficulty, role, participant, worldState, transcript=[], finalLifelines={}, finalLifelineText='', finalSimTime, finalSituation, aar=null, extraEntries=[] }) {
  const meta = {
    SCENARIO:scenarioName || 'Scenario',
    JURISDICTION:jurisdictionName || 'Unspecified',
    'JURISDICTION TYPE':jurisdictionType || '',
    ROLE:role || 'EOC Director',
    DIFFICULTY:difficulty || 'Unspecified',
    PARTICIPANT:participant || 'Not provided',
    LOCATION:worldState?.location || jurisdictionName || 'Unspecified',
    'FINAL TIME':finalSimTime || 'N/A',
    'FINAL STATUS':finalSituation || 'N/A',
    TURNS:String(transcript.filter(t => t.type === 'turn').length),
    GENERATED:new Date().toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }),
  }
  const entries = []
  for (const entry of transcript) {
    if (entry.type === 'opening') {
      entries.push({ kind:'opening', title:'Opening Baseline', subs:[
        { label:'Timing / Status', body:[entry.time ? `SIM TIME: ${entry.time}` : '', entry.location ? `LOCATION: ${entry.location}` : ''].filter(Boolean).join('\n') },
        { label:'Narrative', body:entry.narrative || '(none)' },
        ...(entry.dispatches?.length ? [{ label:'Initial Dispatches', body:entry.dispatches.map((d,i)=>`${i+1}. ${typeof d === 'string' ? d : d.text}`).join('\n') }] : []),
        ...(entry.pins?.length ? [{ label:'Initial Map Pins', body:entry.pins.map((p,i)=>`${i+1}. ${p.label || 'Unnamed'} (${p.type || 'UNKNOWN'}) - ${p.note || ''}`).join('\n') }] : []),
      ]})
    } else if (entry.type === 'turn') {
      entries.push({ kind:'turn', title:`Turn ${entry.turn}`, eventId:entry.eventId || null, subs:[
        { label:'Timing / Status', body:`SIM TIME: ${entry.simTime || 'N/A'}\nSTATUS: ${entry.situation || 'N/A'}` },
        { label:'Director Input', body:entry.playerInput || '(none)' },
        { label:'NEXUS Response', body:entry.aiResponse || '(none)' },
        ...(entry.prompt ? [{ label:'Next Prompt', body:entry.prompt }] : []),
        ...(entry.dispatches?.length ? [{ label:'New Dispatches', body:entry.dispatches.map((d,i)=>`${i+1}. ${typeof d === 'string' ? d : d.text}`).join('\n') }] : []),
        ...(entry.headlines?.length ? [{ label:'Media Headlines', body:entry.headlines.map((h,i)=>`${i+1}. ${h.source || 'Media'}: ${h.text || h}`).join('\n') }] : []),
        ...(entry.pins?.length ? [{ label:'New Map Pins', body:entry.pins.map((p,i)=>`${i+1}. ${p.label || 'Unnamed'} (${p.type || 'UNKNOWN'}) - ${p.note || ''}`).join('\n') }] : []),
        { label:'Community Lifelines', body:entry.lifelineText || '' },
      ]})
    } else if (entry.type === 'exercise_end') {
      entries.push({ kind:'control', title:'Exercise End', eventId:entry.eventId || null, subs:[
        { label:'Timing / Status', body:`SIM TIME: ${entry.simTime || finalSimTime || 'N/A'}\nSTATUS: ENDEX` },
        { label:'System Event', body:'ENDEX recorded as a lifecycle control event. No operational turn was added.' },
      ]})
    }
  }
  for (const entry of Array.isArray(extraEntries) ? extraEntries : []) entries.push(entry)
  entries.push({ kind:'lifelines', title:'Final Community Lifelines', subs:[{ label:'Final Community Lifelines', body:finalLifelineText || '' }] })
  if (aar) entries.push({ kind:'aar', title:'After-Action Review Summary', subs:[] })
  return { type:'transcript', meta, entries, finalLifelines, aar }
}

export function buildAarReportModel({ scenarioName, jurisdictionName, jurisdictionType, role, difficulty, participant, sessionStart, sessionEnd, turns, aar, evidence=[], extraSections=[] }) {
  const ordered = [
    ['Situation Summary', aar?.situationSummary || ''],
    ['Decision Log Review', aar?.decisionLog || ''],
    ['Resource & Coordination Effectiveness', aar?.resourceCoordination || ''],
    ['Communications & Information Management', aar?.communications || ''],
    ['Strengths', aar?.strengths || ''],
    ['Critical Gaps', aar?.criticalGaps || ''],
    ['Doctrine / Reference Notes', aar?.doctrineReferences || ''],
    ...(aar?.planAlignment ? [['Plan Alignment', aar.planAlignment]] : []),
    ['Recommendations', aar?.recommendations || ''],
  ]
  for (const section of Array.isArray(extraSections) ? extraSections : []) {
    if (Array.isArray(section) && section.length >= 2) ordered.push([String(section[0]), String(section[1] || '')])
    else if (section && typeof section === 'object') ordered.push([String(section.title || 'Additional Section'), String(section.body || '')])
  }
  if (evidence.length) {
    ordered.push(['Evidence Basis', evidence.map((item,i) => `${i+1}. ${item.claim || item.status || 'Finding'} | actor: ${item.actor || 'unspecified'} | status: ${item.status || 'unspecified'} | events: ${[...(item.directiveEventIds||[]), ...(item.executionEventIds||[]), ...(item.followUpEventIds||[])].join(', ') || 'none'}`).join('\n')])
  }
  return {
    type:'transcript',
    reportTitle:'After-Action Review',
    meta:{
      SCENARIO:scenarioName || 'Scenario', JURISDICTION:jurisdictionName || 'Unspecified', 'JURISDICTION TYPE':jurisdictionType || '', ROLE:role || 'EOC Director', DIFFICULTY:difficulty || 'Unspecified', PARTICIPANT:participant || 'Not provided', LOCATION:jurisdictionName || 'Unspecified', 'FINAL TIME':sessionEnd || 'N/A', 'SESSION START':sessionStart || 'N/A', TURNS:String(turns || 0), GENERATED:new Date().toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
    },
    entries:ordered.filter(([,body]) => String(body || '').trim()).map(([title,body]) => ({ kind:'aar', title, subs:[{ label:title, body:String(body) }] })),
  }
}

