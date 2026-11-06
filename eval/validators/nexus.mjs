import {words,sentences} from '../lib/parse.mjs'

const tactical=/(send|order|direct|deploy|move)\s+(engine|police|officer|ambulance|crew|unit|firefighter|ems)\b/i
const coaching=/(the eoc must|you should|needs to be established|is the priority|the first action is|must act immediately)/i
const inventedReq=/(the plan requires|the plan mandates|required by the plan)/i
const planSilent=/(silent|does not specify|does not establish|not addressed|unclear|no.*requirement)/i

export function validateNexus(obj, expected={}) {
  const failures=[]
  const consequence=String(obj?.consequence||'')
  const prompt=String(obj?.prompt||'')
  const allText=JSON.stringify(obj||{})
  const dispatches=Array.isArray(obj?.dispatches)?obj.dispatches:[]

  if (expected.noTacticalDirective && (tactical.test(consequence)||tactical.test(prompt))) failures.push('tactical directive detected')
  if (coaching.test(consequence)||coaching.test(prompt)) failures.push('prescriptive coaching phrase detected')
  if (expected.dispatchRequired && dispatches.length===0) failures.push('dispatch required but none returned')
  if (expected.maxDispatchWords) for (const d of dispatches) if (words(d)>expected.maxDispatchWords) failures.push(`dispatch exceeds ${expected.maxDispatchWords} words (${words(d)})`)
  if (expected.maxDispatchSentences) for (const d of dispatches) if (sentences(d)>expected.maxDispatchSentences) failures.push(`dispatch exceeds ${expected.maxDispatchSentences} sentences`)
  if (expected.forbidSourceConditionPipe && dispatches.some(d=>/SOURCE\s*:.*\|\s*CONDITION\s*:/i.test(d))) failures.push('legacy SOURCE | CONDITION presentation detected')
  if (expected.neutralDispatch && dispatches.some(d=>/(should|must|recommend|priority|immediately)/i.test(d))) failures.push('dispatch contains directive/recommendation language')
  if (expected.mustMentionAny && !expected.mustMentionAny.some(x=>allText.toLowerCase().includes(String(x).toLowerCase()))) failures.push('required scenario fact not preserved')
  if (expected.planGrounded===true && obj?.planGrounded!==true) failures.push('planGrounded should be true')
  if (expected.mustUseToken && !allText.includes(expected.mustUseToken)) failures.push(`missing plan token ${expected.mustUseToken}`)
  if (expected.shouldIdentifyPlanSilence && !planSilent.test(consequence)) failures.push('plan silence/absence of requirement not identified')
  if (expected.forbidInventedPlanThreshold && /(80\s*%|80 percent).{0,60}(require|mandat)/i.test(allText)) failures.push('invented 80% plan threshold')
  if (expected.noInventedRequirement && inventedReq.test(consequence) && !allText.includes('[[PLAN_SOURCE_')) failures.push('unsupported plan requirement language')
  if (expected.forbidFabricatedCitation && /(section|page)\s+[A-Z0-9.-]+/i.test(allText)) failures.push('fabricated section/page citation detected')
  if (expected.preserveUncertainty && !/(unconfirm|uncertain|conflict|not.*confirm|verify|incomplete)/i.test(allText)) failures.push('uncertainty not preserved')
  if (expected.maintainEocRole && tactical.test(allText)) failures.push('failed to maintain EOC role boundary')
  if (expected.distinguishJudgment && !/(operational judgment|plan.*does not|not.*plan requirement|plan.*silent|does not specify)/i.test(consequence)) failures.push('plan guidance and operational judgment not distinguished')
  return failures
}
