// Extracted configuration data for NEXUS EOC.

export const PANEL_INFO = {
  lifelines: {
    title: 'Community Lifelines',
    body: 'The 8 FEMA Community Lifelines represent the most fundamental services a community needs to function. Each lifeline is color-coded: GREEN means fully operational, YELLOW means degraded, RED means compromised or non-functional. Status updates every turn based on your decisions and incident conditions. Hover any lifeline tile to see the AI\'s one-sentence reasoning for its current status.'
  },
  media: {
    title: 'Media Feed',
    body: 'AI-generated fictional news headlines that reflect the current state of the incident each turn. LIVE badges mark headlines from the current turn. Older headlines fade to gray as the scenario progresses. These reflect what the public and media are seeing — factor them into your public information and JIC decisions.'
  },
  refs: {
    title: 'Reference Links',
    body: 'Curated real-world doctrine, guidance documents, and after-action reports relevant to the active scenario type. Links open in a new tab. Use these during or after play to cross-reference your decisions against actual federal guidance and historical incident reviews.'
  },
  esf: {
    title: 'ESF Reference',
    body: 'All 15 Emergency Support Functions from the National Response Framework. Click any ESF card to mark it active — use this to track which ESFs you have activated during your response. Click again to deactivate. Active ESFs are highlighted. This is your tracking layer only — the AI does not see your selections.'
  },
  dispatch: {
    title: 'Field Dispatch',
    body: 'Incoming field reports from the incident. NEW cards highlighted in green are from the current turn — they reflect consequences of your last action and new developments. Older cards fade to gray but remain visible as a running log. The red badge shows total dispatch count. Some dispatches will generate map pins when they have a physical location.'
  },
  terminal: {
    title: 'Scenario Terminal',
    body: 'The main command interface. Type your decisions as the senior EM on scene — be specific about resources, priorities, communications, and who owns what. The AI evaluates your action and advances the incident clock. Type ENDEX at any time to end the scenario and receive a full After-Action Review. The situation status indicator in the header reflects overall incident trajectory.'
  },
  notepad: {
    title: "Commander's Notepad",
    body: 'A free-text scratch pad for tracking priorities, resource gaps, pending decisions, or anything else you need to remember. Content persists across turns and browser sessions — it will be here when you come back. Nothing you write here affects the simulation.'
  },
  map: {
    title: 'Incident Map',
    body: 'A live operational map of the incident area. Colored pins mark fixed infrastructure: green for EOC, blue for hospitals, orange for staging areas, purple for shelters, red for affected sites. White-bordered pins with turn numbers (T1, T2, etc.) are dynamic event pins dropped by the AI when dispatch events have a physical location. Click any pin for details. The map accumulates event pins across all turns.'
  },
}

