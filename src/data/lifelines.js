// Extracted configuration data for NEXUS EOC.

export const LIFELINES = [
  { key:'safety',    label:'Safety & Security',       icon:'/icons/safety.png' },
  { key:'food',      label:'Food, Hydration, Shelter', icon:'/icons/food.png' },
  { key:'health',    label:'Health & Medical',         icon:'/icons/health.png' },
  { key:'energy',    label:'Energy',                   icon:'/icons/energy.png' },
  { key:'comms',     label:'Communications',           icon:'/icons/comms.png' },
  { key:'transport', label:'Transportation',           icon:'/icons/transport.png' },
  { key:'hazmat',    label:'Hazardous Material',       icon:'/icons/hazmat.png' },
  { key:'water',     label:'Water Systems',            icon:'/icons/water.png' },
]

export const DEFAULT_LIFELINES = {
  safety:    { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  food:      { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  health:    { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  energy:    { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  comms:     { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  transport: { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  hazmat:    { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
  water:     { status:'YELLOW', reason:'Situation developing. Assessment pending.' },
}

export const LL_COLORS = {
  GREEN:  { bg:'#0a2a1a', border:'#1D9E75', text:'#1D9E75' },
  YELLOW: { bg:'#2a2000', border:'#EF9F27', text:'#EF9F27' },
  RED:    { bg:'#2a0a0a', border:'#E24B4A', text:'#E24B4A' },
}

