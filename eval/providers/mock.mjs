export async function runMock({user}) {
  const plan = user.includes('LOCAL PLAN CONTEXT')
  const dispatch = user.includes('Wake County')
    ? 'Wake County Emergency Management Duty Officer reports approximately 1,200 residents need transportation assistance; only two accessible transit vehicles are confirmed as of 0830, with remaining fleet status unverified.'
    : 'County operations reports conditions remain constrained while partner agencies verify current resource status.'
  return {
    provider:'mock',model:'mock-nexus-1',latencyMs:5,inputTokens:0,outputTokens:0,
    rawText:JSON.stringify({time:'0900',consequence:plan?'The supplied plan language addresses the cited responsibility, but it does not establish requirements beyond that text. Operational judgment still applies where the plan is silent. [[PLAN_SOURCE_1]]':'Okay, here is what we are getting back. Conditions are still developing and the resource picture remains incomplete. The current action improves situational awareness, but unresolved coordination pressure remains.',situation:'DEVELOPING',planGrounded:plan,sources:[],dispatches:[dispatch],prompt:'Resource availability and coordination remain unresolved at the EOC level.',headlines:[],pins:[],lifelines:{safety:{status:'YELLOW',reason:'Conditions developing.'},food:{status:'GREEN',reason:'No major impact reported.'},health:{status:'YELLOW',reason:'Capacity pressure under review.'},energy:{status:'GREEN',reason:'No major impact reported.'},comms:{status:'GREEN',reason:'Primary systems available.'},transport:{status:'YELLOW',reason:'Resource constraints reported.'},hazmat:{status:'GREEN',reason:'No major impact reported.'},water:{status:'GREEN',reason:'No major impact reported.'}}})
  }
}
