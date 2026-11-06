export function parseModelJson(rawText='') {
  const trimmed=String(rawText).trim().replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/```$/,'').trim()
  try { return {ok:true,value:JSON.parse(trimmed),error:null} }
  catch (e) { return {ok:false,value:null,error:e.message} }
}
export const words = s => String(s||'').trim().split(/\s+/).filter(Boolean).length
export const sentences = s => (String(s||'').match(/[.!?]+(?=\s|$)/g)||[]).length || (String(s||'').trim()?1:0)
