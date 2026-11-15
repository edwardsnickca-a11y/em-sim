// NEXUS EOC jurisdiction profiles.
// These define the player seat and operating environment. Location selection happens separately in locationBank.js.

import DATA from '../../shared/exerciseData.json'

// Values live in shared/exerciseData.json so the server prompt builder uses the same text.
export const JURISDICTION_CONTEXT = DATA.jurisdictionContext

export const JURISDICTIONS = [
  'Large Urban City',
  'Large Urban County',
  'Mid-Size City',
  'Small City',
  'Suburban County',
  'Rural County',
  'Tribal Nation',
  'Port City',
  'College Town',
  'Industrial Corridor',
  'Tourist Community',
  'Military-Adjacent Community',
  'Island / Coastal',
]
