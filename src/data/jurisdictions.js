// Extracted configuration data for NEXUS EOC.

export const JURISDICTION_CONTEXT = {
  'Rural County': {
    desc: 'A sparsely populated rural county with limited local resources, long response distances, volunteer fire departments, a small county seat, and heavy reliance on mutual aid and state assistance. Population under 30,000.',
    constraints: 'Minimal hospital capacity (likely one small critical access hospital or none), limited HazMat capability, no urban search and rescue, narrow roads, agricultural land use, possibly no interstate access.',
    examples: 'Appalachian county in WV or KY, Central Valley CA agricultural county, rural Montana or Wyoming county, Mississippi Delta county.',
  },
  'Mid-Size City': {
    desc: 'A mid-size city of 100,000-400,000 with a professional fire department, dedicated EOC, one or two regional hospitals, and established mutual aid agreements with surrounding counties.',
    constraints: 'Moderate resource base, some specialized capabilities (HazMat, SAR), urban-rural interface issues at city limits, may lack USAR or DMORT assets locally.',
    examples: 'Wilmington DE, Shreveport LA, Fayetteville NC, Huntsville AL, Green Bay WI, Duluth MN, Pueblo CO, Macon GA, Rockford IL, Beaumont TX, Erie PA, Peoria IL, Springfield MO, Davenport IA, Lansing MI.',
  },
  'Large Urban Metro': {
    desc: 'A major metropolitan area with full-spectrum emergency services, Level I trauma centers, dedicated OES/OCEM, USAR teams, and complex multi-jurisdictional coordination requirements.',
    constraints: 'High population density, media scrutiny, political complexity, mutual aid complicated by jurisdictional boundaries, significant access and functional needs population.',
    examples: 'Houston TX, Phoenix AZ, Philadelphia PA, Atlanta GA, Miami FL, Chicago IL, Seattle WA.',
  },
  'Coastal Community': {
    desc: 'A coastal city or county with significant maritime exposure, seasonal population fluctuations, tourism infrastructure, coastal infrastructure vulnerability, and Coast Guard coordination requirements.',
    constraints: 'Evacuation route constraints (barrier islands, bridges), marina and port assets, seasonal surge in population, saltwater intrusion risks, ferry-dependent communities.',
    examples: 'Outer Banks NC, Galveston TX, Myrtle Beach SC, Key West FL, Hampton Roads VA, Atlantic City NJ.',
  },
  'Tribal Nation': {
    desc: 'A federally recognized tribal nation with sovereign jurisdiction, Bureau of Indian Affairs coordination requirements, tribal emergency management program, and unique legal and political dynamics distinct from state/county EM.',
    constraints: 'Sovereign jurisdiction complicates mutual aid (638 contracts, EMAC applicability uncertain), BIA as federal liaison, Indian Health Service as primary health provider, limited local tax base and resources, geographic isolation common, trust land boundaries matter.',
    examples: 'Navajo Nation AZ/NM/UT, Crow Nation MT, Standing Rock Sioux ND/SD, Choctaw Nation OK, Lummi Nation WA, Eastern Band Cherokee NC, Fort Apache AZ.',
  },
  'Interstate Corridor': {
    desc: 'A linear multi-jurisdictional zone along a major interstate, rail line, or river corridor where the incident spans multiple counties or states, requiring immediate interstate mutual aid and potentially EMAC activation.',
    constraints: 'No single unified jurisdiction — incident commander must coordinate across county and possibly state lines from the start, complex unified command, NTSB or EPA may assert federal lead, motorist stranding is a major secondary problem.',
    examples: 'I-80 corridor through NV/UT, I-10 through LA/MS, Ohio River corridor KY/OH/WV, BNSF transcontinental rail NM/AZ, Mississippi River barge corridor IL/MO.',
  },
}

export const JURISDICTIONS = ['Rural County','Mid-Size City','Large Urban Metro','Coastal Community','Tribal Nation','Interstate Corridor']

