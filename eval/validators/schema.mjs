const lifelineKeys=['safety','food','health','energy','comms','transport','hazmat','water']
const allowedStatus=new Set(['GREEN','YELLOW','RED'])
const allowedSituation=new Set(['STABLE','DEVELOPING','CRITICAL','DETERIORATING'])

export function validateSchema(obj) {
  const failures=[]
  if (!obj || typeof obj!=='object') return ['response is not an object']
  for (const k of ['time','consequence','situation','dispatches','prompt','headlines','pins','lifelines']) if (!(k in obj)) failures.push(`missing field: ${k}`)
  if (obj.situation && !allowedSituation.has(obj.situation)) failures.push('invalid situation enum')
  if (!Array.isArray(obj.dispatches)) failures.push('dispatches must be an array')
  if (!Array.isArray(obj.headlines)) failures.push('headlines must be an array')
  if (!Array.isArray(obj.pins)) failures.push('pins must be an array')
  for (const k of lifelineKeys) {
    if (!obj.lifelines?.[k]) failures.push(`missing lifeline: ${k}`)
    else if (!allowedStatus.has(obj.lifelines[k].status)) failures.push(`invalid lifeline status: ${k}`)
  }
  return failures
}
