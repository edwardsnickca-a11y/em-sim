// Extracted configuration data for NEXUS EOC.

export const SCENARIOS = {
  hurricane:  { name:'Hurricane Landfall',             icon:'🌀', desc:'A major hurricane is closing on the coast. The 72-hour warning window is tightening. Jurisdiction and geography will shape every evacuation and resource decision.' },
  mci:        { name:'Mass Casualty Incident',          icon:'🚨', desc:'Explosion at a crowded public event. 200+ casualties. Cause unknown. Your resources and hospital capacity depend heavily on where this happened.' },
  hazmat:     { name:'Hazardous Materials Release',     icon:'☣️', desc:'Railcar derailment with chlorine release. Shelter-in-place decision imminent. The operating environment changes everything about your response options.' },
  cyber:      { name:'Cyber-Infrastructure Cascade',    icon:'💻', desc:'Ransomware hits water and power utilities simultaneously. Public services degrading. Coordination complexity scales with your jurisdiction type.' },
  earthquake: { name:'Major Earthquake',                icon:'🏚️', desc:'M7.1 strike-slip event. Comms degraded. Damage picture unknown. Your jurisdiction determines what resources you have and how long they take to arrive.' },
  flood:      { name:'Flash Flood / Dam Failure',       icon:'🌊', desc:'Upstream dam showing structural compromise. Downstream communities in the inundation zone. Rural or coastal settings create very different rescue problems.' },
  wildfire:   { name:'Urban Wildfire',                  icon:'🔥', desc:'Wind-driven wildfire with structure-to-structure spread. Mass evacuation underway. Jurisdiction type determines air resource access, road networks, and shelter options.' },
  winter:     { name:'Winter Storm Cascade',            icon:'❄️', desc:'Historic winter storm. Power grid failing. Vulnerable populations at risk. A tribal nation or rural county has almost nothing in common with a metro EOC response.' },
  rdd:        { name:'Radiological Dispersal Device',   icon:'☢️', desc:'Dirty bomb detonated in a public area. Contamination zone unknown. Federal coordination required — but the lead agencies and resources look very different depending on where this happened.' },
  train:      { name:'Train Derailment — MCI / HazMat', icon:'🚂', desc:'Freight train derailment. Multiple casualties. Hazmat release confirmed. Rail corridors cross rural counties, tribal lands, and urban cores — your jurisdiction defines your authority and your gaps.' },
}

export const DIFFICULTIES  = ['Introductory','Standard','Advanced','Expert','Adaptive']


