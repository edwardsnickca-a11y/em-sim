// Extracted configuration data for NEXUS EOC.

import DATA from '../../shared/exerciseData.json'

// Values live in shared/exerciseData.json so the server prompt builder uses the same text.
export const ROLES = DATA.roles

export const ROLE_GROUPS = {
  'EOC Leadership': ['EOC Director','Operations Section Chief','Planning Section Chief','Logistics Section Chief','Finance & Admin Section Chief','Public Information Officer','Safety Officer','Liaison Officer'],
  'ESF Liaison Officers': ['ESF-1 — Transportation','ESF-2 — Communications','ESF-3 — Public Works & Engineering','ESF-4 — Firefighting','ESF-5 — Information & Planning','ESF-6 — Mass Care','ESF-7 — Logistics','ESF-8 — Public Health & Medical','ESF-9 — Search & Rescue','ESF-10 — Oil & Hazardous Materials','ESF-11 — Agriculture & Natural Resources','ESF-12 — Energy','ESF-13 — Public Safety & Security','ESF-14 — Cross-Sector Business & Infrastructure','ESF-15 — External Affairs'],
}

