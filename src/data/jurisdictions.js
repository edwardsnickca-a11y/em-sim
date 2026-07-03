// NEXUS EOC jurisdiction profiles.
// These define the player seat and operating environment. Location selection happens separately in locationBank.js.

export const JURISDICTION_CONTEXT = {
  'Large Urban City': {
    desc: 'A major municipal government operating from a city EOC. The incident is inside city limits or primarily affects city operations, city departments, mayor/executive leadership, public messaging, community lifelines, and continuity of city services.',
    constraints: 'High population density, intense media and political scrutiny, complex public information environment, major transportation and utility dependencies, large access and functional needs population, and strong pressure to coordinate without taking over field command.',
    examples: '',
  },
  'Large Urban County': {
    desc: 'A large county or regional emergency management organization coordinating across multiple cities, unincorporated areas, public health, hospitals, mass care, transportation corridors, mutual aid, and regional lifeline impacts.',
    constraints: 'Cross-jurisdiction coordination, competing city priorities, county public health and mass care responsibilities, regional transportation impacts, political complexity, shelter overflow, hospital coalition pressure, and state/federal coordination needs.',
    examples: '',
  },
  'Mid-Size City': {
    desc: 'A city of roughly 100,000 to 400,000 with a professional public safety base, dedicated or part-time EOC capability, regional healthcare access, and established mutual aid relationships with surrounding jurisdictions.',
    constraints: 'Moderate resource base, limited specialized teams compared with major metros, city-county coordination needs, public messaging pressure, possible urban-rural interface, and reliance on regional mutual aid for sustained operations.',
    examples: '',
  },
  'Small City': {
    desc: 'A smaller municipal government with limited full-time emergency management capacity, close mayor/council involvement, strong community ties, and heavy dependence on county, regional, or state support for larger incidents.',
    constraints: 'Limited staff depth, fewer redundant systems, small public works and public safety capacity, limited sheltering resources, reliance on neighboring jurisdictions, and high visibility of every decision inside the community.',
    examples: '',
  },
  'Suburban County': {
    desc: 'A suburban county EOC coordinating multiple municipalities, commuter corridors, schools, hospitals, utilities, and residential communities around a larger metro area.',
    constraints: 'Heavy commuter traffic, fragmented municipal authority, high public expectations, school and healthcare coordination demands, utility dependencies, regional mutual aid complexity, and elected leadership pressure.',
    examples: '',
  },
  'Rural County': {
    desc: 'A sparsely populated county with long response distances, limited local resources, volunteer fire departments, a small county seat, agricultural or remote terrain, and heavy reliance on mutual aid and state assistance.',
    constraints: 'Minimal hospital capacity, limited HazMat capability, limited technical rescue resources, long travel times, communications gaps, small staff depth, narrow roads, and possible isolation during severe weather or infrastructure disruption.',
    examples: '',
  },
  'Tribal Nation': {
    desc: 'A federally recognized tribal nation or tribal jurisdiction with sovereign authority, tribal emergency management responsibilities, federal coordination requirements, and distinct legal, political, cultural, and geographic considerations.',
    constraints: 'Sovereign jurisdiction, BIA/IHS/federal coordination, limited local tax base, possible geographic isolation, trust land boundaries, mutual aid complexity, communications gaps, and culturally appropriate public messaging needs.',
    examples: '',
  },
  'Port City': {
    desc: 'A city or county with meaningful maritime, river, airport, freight, port, ferry, or logistics activity where emergency management decisions can affect supply chains, transportation, commerce, and regional infrastructure.',
    constraints: 'Port authority or terminal coordination, Coast Guard or river authority interface, hazmat and freight concerns, traffic chokepoints, bridge or tunnel dependencies, environmental impacts, and economic disruption pressure.',
    examples: '',
  },
  'College Town': {
    desc: 'A community where a large university or college population significantly affects emergency management, public messaging, sheltering, transportation, healthcare demand, mass gatherings, and continuity planning.',
    constraints: 'Student population surge, campus police and university administration coordination, event and dormitory concerns, parent/family information pressure, limited housing/shelter flexibility, and town-gown political dynamics.',
    examples: '',
  },
  'Industrial Corridor': {
    desc: 'A jurisdiction shaped by manufacturing, refineries, chemical facilities, rail, warehousing, energy infrastructure, or freight movement where hazardous materials and infrastructure consequences are central concerns.',
    constraints: 'Private sector facility coordination, hazmat monitoring uncertainty, environmental health concerns, rail/highway access issues, worker accountability, community warning, and high consequence infrastructure dependencies.',
    examples: '',
  },
  'Tourist Community': {
    desc: 'A community with major seasonal or event-driven visitor populations, hospitality infrastructure, limited permanent resources, and public messaging challenges involving non-residents.',
    constraints: 'Seasonal population swings, hotel and short-term rental coordination, visitor evacuation challenges, limited local shelter capacity, language/accessibility needs, business pressure, and transportation bottlenecks.',
    examples: '',
  },
  'Military-Adjacent Community': {
    desc: 'A civilian jurisdiction near a major military installation, defense facility, National Guard presence, or defense industrial site where coordination with military partners may shape emergency management decisions.',
    constraints: 'Civil-military coordination boundaries, installation access rules, large transient population, security considerations, possible defense mission impacts, family support concerns, and public information sensitivity.',
    examples: '',
  },
  'Island / Coastal': {
    desc: 'An island, barrier island, coastal county, coastal city, or ferry/bridge-dependent jurisdiction with maritime exposure, evacuation constraints, storm surge or tsunami risk, and limited access routes.',
    constraints: 'Bridge, ferry, causeway, or limited-route dependence, evacuation timing, seasonal population, coastal flooding, saltwater intrusion, marina/port impacts, Coast Guard coordination, and delayed mutual aid access.',
    examples: '',
  },
}

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
