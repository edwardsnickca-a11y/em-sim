// Curated real-location bank for NEXUS EOC.
// The app selects the location before Claude runs, so the model builds around a real place instead of choosing from examples.

const RECENT_LOCATIONS_KEY = 'nexus_recent_locations_v1'
const RECENT_LIMIT = 12
const BROADLY_PLAUSIBLE_HAZARDS = new Set(['rdd', 'cyber', 'mci'])

export function normalizeJurisdictionType(value = '') {
  const v = String(value || '').trim()
  const aliases = {
    'Large Urban Metro': 'Large Urban City',
    'Coastal Community': 'Island / Coastal',
    'Interstate Corridor': 'Industrial Corridor',
    'Border Community': 'Industrial Corridor',
  }
  return aliases[v] || v || 'Mid-Size City'
}

export const LOCATION_BANK = [
  // Large Urban City
  { id:'luc-philadelphia-pa', name:'Philadelphia', state:'Pennsylvania', label:'Philadelphia, Pennsylvania', jurisdictionType:'Large Urban City', region:'Mid-Atlantic', center:[39.9526,-75.1652], radiusMiles:10, hazards:['rdd','train','hazmat','cyber','mci','winter','flood'], preferred:true, notes:'Dense city EOC environment with major transit, hospitals, utilities, historic districts, river corridors, and intense public information pressure.' },
  { id:'luc-seattle-wa', name:'Seattle', state:'Washington', label:'Seattle, Washington', jurisdictionType:'Large Urban City', region:'Pacific Northwest', center:[47.6062,-122.3321], radiusMiles:10, hazards:['earthquake','cyber','hazmat','train','mci','winter','flood','rdd'], preferred:true, notes:'Major city with port, bridges, hills, seismic exposure, technology dependencies, and complex public messaging environment.' },
  { id:'luc-losangeles-ca', name:'Los Angeles', state:'California', label:'Los Angeles, California', jurisdictionType:'Large Urban City', region:'California', center:[34.0522,-118.2437], radiusMiles:14, hazards:['earthquake','wildfire','rdd','mci','cyber','hazmat','train','flood'], preferred:true, notes:'Large municipal EOC with dense population, transportation complexity, wildfire interface, seismic risk, and major media scrutiny.' },
  { id:'luc-houston-tx', name:'Houston', state:'Texas', label:'Houston, Texas', jurisdictionType:'Large Urban City', region:'Gulf Coast', center:[29.7604,-95.3698], radiusMiles:14, hazards:['hurricane','flood','hazmat','train','cyber','mci','rdd'], preferred:true, notes:'Major city with bayou flooding, petrochemical and logistics exposure, large healthcare sector, and complex evacuation/public information demands.' },
  { id:'luc-chicago-il', name:'Chicago', state:'Illinois', label:'Chicago, Illinois', jurisdictionType:'Large Urban City', region:'Great Lakes', center:[41.8781,-87.6298], radiusMiles:12, hazards:['winter','train','hazmat','cyber','mci','rdd','flood'], preferred:true, notes:'Dense urban environment with lakefront weather, rail/freight complexity, major hospitals, transit, and high public messaging pressure.' },
  { id:'luc-baltimore-md', name:'Baltimore', state:'Maryland', label:'Baltimore, Maryland', jurisdictionType:'Large Urban City', region:'Mid-Atlantic', center:[39.2904,-76.6122], radiusMiles:9, hazards:['hazmat','train','cyber','mci','rdd','flood','winter'], preferred:false, notes:'Major port and city EOC setting with transportation corridors, hospitals, harbor infrastructure, and strong public information demands.' },
  { id:'luc-denver-co', name:'Denver', state:'Colorado', label:'Denver, Colorado', jurisdictionType:'Large Urban City', region:'Mountain West', center:[39.7392,-104.9903], radiusMiles:12, hazards:['winter','wildfire','cyber','mci','hazmat','train','rdd'], preferred:false, notes:'Large city with winter weather, regional transportation corridors, wildfire smoke exposure, and significant city-county coordination demands.' },
  { id:'luc-boston-ma', name:'Boston', state:'Massachusetts', label:'Boston, Massachusetts', jurisdictionType:'Large Urban City', region:'Northeast', center:[42.3601,-71.0589], radiusMiles:9, hazards:['winter','flood','cyber','mci','rdd','hazmat','train'], preferred:true, notes:'Dense coastal city with hospitals, transit, tunnels, universities, severe winter weather exposure, and major executive/media pressure.' },

  // Large Urban County
  { id:'lucounty-losangeles-ca', name:'Los Angeles County', state:'California', label:'Los Angeles County, California', jurisdictionType:'Large Urban County', region:'California', center:[34.3207,-118.2247], radiusMiles:35, hazards:['wildfire','earthquake','flood','cyber','mci','hazmat','rdd','train'], preferred:true, notes:'Large county EOC perspective with multiple cities, unincorporated areas, wildfire interface, hospitals, mass care, and regional lifeline impacts.' },
  { id:'lucounty-king-wa', name:'King County', state:'Washington', label:'King County, Washington', jurisdictionType:'Large Urban County', region:'Pacific Northwest', center:[47.5480,-121.9836], radiusMiles:30, hazards:['earthquake','flood','winter','cyber','hazmat','train','mci','rdd'], preferred:true, notes:'County/regional perspective with Seattle-area partners, mountains-to-urban geography, flood/seismic risk, hospitals, transit, and utilities.' },
  { id:'lucounty-harris-tx', name:'Harris County', state:'Texas', label:'Harris County, Texas', jurisdictionType:'Large Urban County', region:'Gulf Coast', center:[29.8577,-95.3936], radiusMiles:30, hazards:['hurricane','flood','hazmat','train','cyber','mci','rdd'], preferred:true, notes:'County EOC perspective with flood control, petrochemical/logistics corridors, multiple municipalities, and regional public health/mass care pressure.' },
  { id:'lucounty-cook-il', name:'Cook County', state:'Illinois', label:'Cook County, Illinois', jurisdictionType:'Large Urban County', region:'Great Lakes', center:[41.7377,-87.6976], radiusMiles:28, hazards:['winter','train','hazmat','cyber','mci','flood','rdd'], preferred:true, notes:'Large county coordination environment with many municipalities, hospitals, commuter systems, winter storm exposure, and regional lifeline concerns.' },
  { id:'lucounty-maricopa-az', name:'Maricopa County', state:'Arizona', label:'Maricopa County, Arizona', jurisdictionType:'Large Urban County', region:'Southwest', center:[33.2918,-112.4291], radiusMiles:40, hazards:['heat','flood','cyber','hazmat','train','mci','rdd','wildfire'], preferred:true, notes:'Large county EOC with extreme heat, monsoon flooding, fast-growth communities, healthcare strain, and wide-area transportation issues.' },
  { id:'lucounty-miami-dade-fl', name:'Miami-Dade County', state:'Florida', label:'Miami-Dade County, Florida', jurisdictionType:'Large Urban County', region:'Gulf Coast', center:[25.7617,-80.1918], radiusMiles:28, hazards:['hurricane','flood','cyber','mci','hazmat','rdd'], preferred:true, notes:'County/regional EOC with hurricane evacuation, surge/flood risk, airports/ports, language access, tourism, and regional mass care pressure.' },
  { id:'lucounty-san-diego-ca', name:'San Diego County', state:'California', label:'San Diego County, California', jurisdictionType:'Large Urban County', region:'California', center:[32.7157,-117.1611], radiusMiles:35, hazards:['wildfire','earthquake','flood','cyber','hazmat','mci','rdd'], preferred:false, notes:'County EOC with wildfire interface, coastal and inland communities, military-adjacent partners, border-region traffic, and evacuation coordination.' },
  { id:'lucounty-multnomah-or', name:'Multnomah County', state:'Oregon', label:'Multnomah County, Oregon', jurisdictionType:'Large Urban County', region:'Pacific Northwest', center:[45.5152,-122.6784], radiusMiles:22, hazards:['earthquake','winter','flood','cyber','hazmat','train','mci'], preferred:false, notes:'County/regional perspective with Portland-area partners, river crossings, winter weather, seismic risk, homelessness/vulnerable populations, and public health demands.' },

  // Mid-Size City
  { id:'mid-wilmington-de', name:'Wilmington', state:'Delaware', label:'Wilmington, Delaware', jurisdictionType:'Mid-Size City', region:'Mid-Atlantic', center:[39.7391,-75.5398], radiusMiles:8, hazards:['train','hazmat','flood','cyber','mci','winter','rdd'], preferred:false, notes:'Mid-size city with riverfront, rail and highway corridors, chemical/logistics concerns, and state/local coordination pressure.' },
  { id:'mid-green-bay-wi', name:'Green Bay', state:'Wisconsin', label:'Green Bay, Wisconsin', jurisdictionType:'Mid-Size City', region:'Great Lakes', center:[44.5133,-88.0133], radiusMiles:9, hazards:['winter','flood','hazmat','train','cyber','mci'], preferred:false, notes:'Mid-size city with severe winter weather, river/lake influences, industrial corridors, and regional healthcare/mutual aid considerations.' },
  { id:'mid-huntsville-al', name:'Huntsville', state:'Alabama', label:'Huntsville, Alabama', jurisdictionType:'Mid-Size City', region:'Southeast', center:[34.7304,-86.5861], radiusMiles:10, hazards:['tornado','hazmat','cyber','mci','train','flood','winter'], preferred:false, notes:'Mid-size city with severe weather, defense/aerospace sector, research facilities, and strong public information and continuity concerns.' },
  { id:'mid-erie-pa', name:'Erie', state:'Pennsylvania', label:'Erie, Pennsylvania', jurisdictionType:'Mid-Size City', region:'Great Lakes', center:[42.1292,-80.0851], radiusMiles:8, hazards:['winter','flood','hazmat','train','cyber','mci'], preferred:false, notes:'Great Lakes city with lake-effect snow, port/industrial activity, transportation corridors, and winter sheltering pressure.' },
  { id:'mid-beaumont-tx', name:'Beaumont', state:'Texas', label:'Beaumont, Texas', jurisdictionType:'Mid-Size City', region:'Gulf Coast', center:[30.0802,-94.1266], radiusMiles:10, hazards:['hurricane','flood','hazmat','train','cyber','mci'], preferred:false, notes:'Gulf Coast city with petrochemical/logistics exposure, storm surge and river flooding concerns, and regional mutual aid pressure.' },
  { id:'mid-duluth-mn', name:'Duluth', state:'Minnesota', label:'Duluth, Minnesota', jurisdictionType:'Mid-Size City', region:'Great Lakes', center:[46.7867,-92.1005], radiusMiles:9, hazards:['winter','flood','hazmat','train','cyber','mci'], preferred:false, notes:'Port city and mid-size EOC environment with severe winter weather, hills, lake effects, rail/port activity, and constrained road access.' },
  { id:'mid-macon-ga', name:'Macon-Bibb County', state:'Georgia', label:'Macon-Bibb County, Georgia', jurisdictionType:'Mid-Size City', region:'Southeast', center:[32.8407,-83.6324], radiusMiles:10, hazards:['hazmat','train','cyber','mci','flood','winter'], preferred:false, notes:'Consolidated city-county setting with interstate/rail corridors, severe weather, healthcare coordination, and regional support needs.' },
  { id:'mid-rockford-il', name:'Rockford', state:'Illinois', label:'Rockford, Illinois', jurisdictionType:'Mid-Size City', region:'Midwest', center:[42.2711,-89.0940], radiusMiles:9, hazards:['winter','hazmat','train','cyber','mci','flood'], preferred:false, notes:'Mid-size city with manufacturing/logistics exposure, winter weather, river flooding potential, and regional mutual aid concerns.' },

  // Small City
  { id:'small-astoria-or', name:'Astoria', state:'Oregon', label:'Astoria, Oregon', jurisdictionType:'Small City', region:'Pacific Northwest', center:[46.1879,-123.8313], radiusMiles:6, hazards:['earthquake','flood','winter','hazmat','mci'], preferred:false, notes:'Small coastal/river city with bridge dependence, tsunami/seismic concerns, tourism, and limited local resource depth.' },
  { id:'small-paducah-ky', name:'Paducah', state:'Kentucky', label:'Paducah, Kentucky', jurisdictionType:'Small City', region:'Southeast', center:[37.0834,-88.6000], radiusMiles:7, hazards:['flood','hazmat','train','mci','cyber','winter'], preferred:false, notes:'Small city near major river and transportation corridors with flood, freight, and industrial coordination concerns.' },
  { id:'small-grand-junction-co', name:'Grand Junction', state:'Colorado', label:'Grand Junction, Colorado', jurisdictionType:'Small City', region:'Mountain West', center:[39.0639,-108.5506], radiusMiles:8, hazards:['wildfire','flood','winter','hazmat','train','mci'], preferred:false, notes:'Western small city with wildfire, canyon/river access, winter travel, and regional medical/resource coordination demands.' },
  { id:'small-bangor-me', name:'Bangor', state:'Maine', label:'Bangor, Maine', jurisdictionType:'Small City', region:'Northeast', center:[44.8016,-68.7712], radiusMiles:7, hazards:['winter','flood','hazmat','cyber','mci'], preferred:false, notes:'Small city hub for a broad rural region with winter storm exposure, healthcare coordination, and limited surge capacity.' },
  { id:'small-yakima-wa', name:'Yakima', state:'Washington', label:'Yakima, Washington', jurisdictionType:'Small City', region:'Pacific Northwest', center:[46.6021,-120.5059], radiusMiles:8, hazards:['wildfire','flood','hazmat','cyber','mci','winter'], preferred:false, notes:'Small city with agricultural economy, wildfire smoke/exposure, language access needs, and regional resource coordination pressure.' },

  // Suburban County
  { id:'suburban-montgomery-md', name:'Montgomery County', state:'Maryland', label:'Montgomery County, Maryland', jurisdictionType:'Suburban County', region:'Mid-Atlantic', center:[39.1547,-77.2405], radiusMiles:20, hazards:['winter','cyber','hazmat','mci','flood','rdd'], preferred:false, notes:'Suburban county with commuter corridors, high public expectations, regional healthcare, schools, and complex municipal coordination.' },
  { id:'suburban-fairfax-va', name:'Fairfax County', state:'Virginia', label:'Fairfax County, Virginia', jurisdictionType:'Suburban County', region:'Mid-Atlantic', center:[38.9085,-77.2405], radiusMiles:20, hazards:['winter','cyber','hazmat','mci','flood','rdd'], preferred:false, notes:'Large suburban county with federal-adjacent complexity, schools, commuter traffic, high expectations, and strong media/public information pressure.' },
  { id:'suburban-cobb-ga', name:'Cobb County', state:'Georgia', label:'Cobb County, Georgia', jurisdictionType:'Suburban County', region:'Southeast', center:[33.8999,-84.5641], radiusMiles:20, hazards:['flood','hazmat','mci','cyber','winter','train'], preferred:false, notes:'Suburban county with commuter corridors, schools, healthcare, severe weather, and multiple municipal partners.' },
  { id:'suburban-dupage-il', name:'DuPage County', state:'Illinois', label:'DuPage County, Illinois', jurisdictionType:'Suburban County', region:'Great Lakes', center:[41.8244,-88.0901], radiusMiles:18, hazards:['winter','hazmat','train','cyber','mci','flood'], preferred:false, notes:'Suburban county with many municipalities, commuter rail/road corridors, winter weather, hospitals, and regional coordination demands.' },
  { id:'suburban-wake-nc', name:'Wake County', state:'North Carolina', label:'Wake County, North Carolina', jurisdictionType:'Suburban County', region:'Southeast', center:[35.8032,-78.5661], radiusMiles:22, hazards:['hurricane','flood','cyber','mci','hazmat','winter'], preferred:false, notes:'Fast-growing suburban/urban county with schools, hospitals, commuter corridors, hurricane remnants, and public messaging pressure.' },

  // Rural County
  { id:'rural-pendleton-wv', name:'Pendleton County', state:'West Virginia', label:'Pendleton County, West Virginia', jurisdictionType:'Rural County', region:'Appalachia', center:[38.6808,-79.3507], radiusMiles:25, hazards:['flood','winter','wildfire','hazmat','mci'], preferred:false, notes:'Rural mountain county with long travel times, volunteer response, flash flooding, winter access issues, and limited healthcare capacity.' },
  { id:'rural-garfield-mt', name:'Garfield County', state:'Montana', label:'Garfield County, Montana', jurisdictionType:'Rural County', region:'Plains', center:[47.2686,-106.9554], radiusMiles:40, hazards:['winter','wildfire','flood','hazmat','mci'], preferred:false, notes:'Sparse rural county with long distances, severe winter weather, wildfire risk, limited resources, and state mutual aid reliance.' },
  { id:'rural-coahoma-ms', name:'Coahoma County', state:'Mississippi', label:'Coahoma County, Mississippi', jurisdictionType:'Rural County', region:'Southeast', center:[34.2280,-90.6035], radiusMiles:25, hazards:['flood','hazmat','train','mci','winter'], preferred:false, notes:'Delta county with river/flooding concerns, limited local capacity, transportation corridors, and public health/mass care needs.' },
  { id:'rural-colusa-ca', name:'Colusa County', state:'California', label:'Colusa County, California', jurisdictionType:'Rural County', region:'California', center:[39.1777,-122.2376], radiusMiles:25, hazards:['flood','wildfire','hazmat','train','mci'], preferred:false, notes:'Agricultural rural county with flood/wildfire concerns, long mutual aid timelines, levee/drainage issues, and limited local surge capacity.' },
  { id:'rural-sheridan-ks', name:'Sheridan County', state:'Kansas', label:'Sheridan County, Kansas', jurisdictionType:'Rural County', region:'Plains', center:[39.3500,-100.4400], radiusMiles:35, hazards:['winter','hazmat','train','flood','mci'], preferred:false, notes:'Rural Plains county with long response distances, weather exposure, transportation incidents, and limited local resource depth.' },

  // Tribal Nation
  { id:'tribal-navajo-shiprock', name:'Shiprock / Navajo Nation', state:'New Mexico', label:'Shiprock, New Mexico (Navajo Nation)', jurisdictionType:'Tribal Nation', region:'Southwest', center:[36.7856,-108.6870], radiusMiles:25, hazards:['wildfire','flood','hazmat','winter','mci','cyber'], preferred:false, notes:'Tribal emergency management environment with sovereign jurisdiction, long distances, IHS/BIA coordination, and resource access challenges.' },
  { id:'tribal-lummi-wa', name:'Lummi Nation', state:'Washington', label:'Lummi Nation, Washington', jurisdictionType:'Tribal Nation', region:'Pacific Northwest', center:[48.7467,-122.6586], radiusMiles:12, hazards:['flood','earthquake','hazmat','winter','mci'], preferred:false, notes:'Coastal tribal jurisdiction with flooding, maritime exposure, sovereignty, culturally appropriate messaging, and county/state coordination needs.' },
  { id:'tribal-choctaw-ok', name:'Choctaw Nation', state:'Oklahoma', label:'Choctaw Nation, Oklahoma', jurisdictionType:'Tribal Nation', region:'Plains', center:[34.9334,-95.7697], radiusMiles:40, hazards:['flood','hazmat','winter','mci','cyber'], preferred:false, notes:'Large tribal jurisdiction with multiple communities, severe weather, transportation corridors, sovereign coordination, and broad public messaging needs.' },
  { id:'tribal-crow-mt', name:'Crow Nation', state:'Montana', label:'Crow Nation, Montana', jurisdictionType:'Tribal Nation', region:'Mountain West', center:[45.6030,-107.4630], radiusMiles:35, hazards:['winter','wildfire','flood','hazmat','mci'], preferred:false, notes:'Tribal jurisdiction with rural distances, winter weather, wildfire exposure, BIA/IHS coordination, and limited local surge capacity.' },

  // Port City
  { id:'port-savannah-ga', name:'Savannah', state:'Georgia', label:'Savannah, Georgia', jurisdictionType:'Port City', region:'Southeast', center:[32.0809,-81.0912], radiusMiles:12, hazards:['hurricane','flood','hazmat','train','cyber','mci','rdd'], preferred:false, notes:'Port city with river/port logistics, tourism, hurricane/flood risk, hazmat freight, and public messaging pressure.' },
  { id:'port-norfolk-va', name:'Norfolk', state:'Virginia', label:'Norfolk, Virginia', jurisdictionType:'Port City', region:'Mid-Atlantic', center:[36.8508,-76.2859], radiusMiles:12, hazards:['hurricane','flood','hazmat','cyber','mci','rdd'], preferred:false, notes:'Major port/naval/coastal city with flooding, maritime coordination, tunnels/bridges, logistics, and military-adjacent complexity.' },
  { id:'port-long-beach-ca', name:'Long Beach', state:'California', label:'Long Beach, California', jurisdictionType:'Port City', region:'California', center:[33.7701,-118.1937], radiusMiles:10, hazards:['earthquake','hazmat','train','cyber','mci','rdd','flood'], preferred:true, notes:'Major port city with container terminals, petroleum/logistics, seismic risk, transportation corridors, and complex public information demands.' },
  { id:'port-mobile-al', name:'Mobile', state:'Alabama', label:'Mobile, Alabama', jurisdictionType:'Port City', region:'Gulf Coast', center:[30.6954,-88.0399], radiusMiles:12, hazards:['hurricane','flood','hazmat','train','cyber','mci'], preferred:false, notes:'Gulf port city with industrial, maritime, hurricane, and flood exposure plus regional sheltering and evacuation pressure.' },
  { id:'port-tacoma-wa', name:'Tacoma', state:'Washington', label:'Tacoma, Washington', jurisdictionType:'Port City', region:'Pacific Northwest', center:[47.2529,-122.4443], radiusMiles:10, hazards:['earthquake','hazmat','train','cyber','flood','mci'], preferred:false, notes:'Port and industrial city with rail/port freight, seismic risk, bridge/road dependencies, and regional coordination needs.' },

  // College Town
  { id:'college-state-college-pa', name:'State College', state:'Pennsylvania', label:'State College, Pennsylvania', jurisdictionType:'College Town', region:'Mid-Atlantic', center:[40.7934,-77.8600], radiusMiles:8, hazards:['winter','mci','cyber','hazmat','flood'], preferred:false, notes:'College town with large student/event population, university coordination, parent/family information pressure, and limited local surge resources.' },
  { id:'college-ann-arbor-mi', name:'Ann Arbor', state:'Michigan', label:'Ann Arbor, Michigan', jurisdictionType:'College Town', region:'Great Lakes', center:[42.2808,-83.7430], radiusMiles:8, hazards:['winter','mci','cyber','hazmat','train','flood'], preferred:false, notes:'College town with university/hospital systems, winter weather, mass gatherings, student housing, and high public communication expectations.' },
  { id:'college-ames-ia', name:'Ames', state:'Iowa', label:'Ames, Iowa', jurisdictionType:'College Town', region:'Midwest', center:[42.0308,-93.6319], radiusMiles:8, hazards:['winter','mci','cyber','hazmat','train','flood'], preferred:false, notes:'College community with severe weather/winter risk, campus coordination, event management, and limited city surge capacity.' },
  { id:'college-eugene-or', name:'Eugene', state:'Oregon', label:'Eugene, Oregon', jurisdictionType:'College Town', region:'Pacific Northwest', center:[44.0521,-123.0868], radiusMiles:8, hazards:['earthquake','wildfire','flood','cyber','mci','hazmat'], preferred:false, notes:'College town with seismic risk, wildfire smoke, river flooding, university coordination, and public messaging demands.' },
  { id:'college-athens-ga', name:'Athens-Clarke County', state:'Georgia', label:'Athens-Clarke County, Georgia', jurisdictionType:'College Town', region:'Southeast', center:[33.9519,-83.3576], radiusMiles:8, hazards:['mci','cyber','hazmat','flood','winter'], preferred:false, notes:'University-centered consolidated city-county with event surges, student housing, severe weather, and parent/family information pressure.' },

  // Industrial Corridor
  { id:'industrial-baton-rouge-la', name:'Baton Rouge Industrial Corridor', state:'Louisiana', label:'Baton Rouge, Louisiana Industrial Corridor', jurisdictionType:'Industrial Corridor', region:'Gulf Coast', center:[30.4515,-91.1871], radiusMiles:18, hazards:['hazmat','train','hurricane','flood','cyber','mci','rdd'], preferred:false, notes:'Industrial/river corridor with petrochemical facilities, rail/barge movement, severe weather, environmental health, and public warning concerns.' },
  { id:'industrial-kanawha-wv', name:'Kanawha Valley', state:'West Virginia', label:'Kanawha Valley, West Virginia', jurisdictionType:'Industrial Corridor', region:'Appalachia', center:[38.3498,-81.6326], radiusMiles:18, hazards:['hazmat','train','flood','winter','cyber','mci'], preferred:false, notes:'River/chemical/rail corridor with hazmat, flood, industrial accountability, protective action, and public health coordination pressure.' },
  { id:'industrial-nw-indiana', name:'Northwest Indiana Industrial Corridor', state:'Indiana', label:'Northwest Indiana Industrial Corridor', jurisdictionType:'Industrial Corridor', region:'Great Lakes', center:[41.5934,-87.3464], radiusMiles:18, hazards:['hazmat','train','winter','flood','cyber','mci'], preferred:false, notes:'Steel/rail/industrial corridor with lakefront weather, hazmat freight, worker accountability, and multi-jurisdiction coordination needs.' },
  { id:'industrial-pasadena-tx', name:'Pasadena', state:'Texas', label:'Pasadena, Texas Industrial Corridor', jurisdictionType:'Industrial Corridor', region:'Gulf Coast', center:[29.6911,-95.2091], radiusMiles:12, hazards:['hazmat','hurricane','flood','train','cyber','mci','rdd'], preferred:false, notes:'Petrochemical and logistics environment with protective action decisions, public warning, hurricane/flood compounding, and regional mutual aid.' },
  { id:'industrial-inland-empire-ca', name:'Inland Empire Logistics Corridor', state:'California', label:'Inland Empire Logistics Corridor, California', jurisdictionType:'Industrial Corridor', region:'California', center:[34.0633,-117.6509], radiusMiles:20, hazards:['earthquake','hazmat','train','wildfire','cyber','mci'], preferred:false, notes:'Warehouse/logistics and transportation corridor with seismic risk, freight disruption, wildfire smoke, and regional supply-chain consequences.' },

  // Tourist Community
  { id:'tourist-myrtle-beach-sc', name:'Myrtle Beach', state:'South Carolina', label:'Myrtle Beach, South Carolina', jurisdictionType:'Tourist Community', region:'Southeast', center:[33.6891,-78.8867], radiusMiles:10, hazards:['hurricane','flood','mci','cyber','hazmat'], preferred:false, notes:'Tourist-heavy coastal community with seasonal population surge, hotel coordination, evacuation messaging, and business pressure.' },
  { id:'tourist-branson-mo', name:'Branson', state:'Missouri', label:'Branson, Missouri', jurisdictionType:'Tourist Community', region:'Midwest', center:[36.6437,-93.2185], radiusMiles:10, hazards:['mci','flood','winter','hazmat','cyber'], preferred:false, notes:'Tourism/event community with visitors, theaters, lodging coordination, severe weather, and limited local surge capacity.' },
  { id:'tourist-sedona-az', name:'Sedona', state:'Arizona', label:'Sedona, Arizona', jurisdictionType:'Tourist Community', region:'Southwest', center:[34.8697,-111.7610], radiusMiles:10, hazards:['wildfire','flood','mci','cyber','hazmat'], preferred:false, notes:'Tourist community with wildfire and flash flood risk, road constraints, visitor messaging, and evacuation/shelter challenges.' },
  { id:'tourist-lake-tahoe-ca', name:'South Lake Tahoe', state:'California', label:'South Lake Tahoe, California', jurisdictionType:'Tourist Community', region:'California', center:[38.9399,-119.9772], radiusMiles:10, hazards:['wildfire','winter','flood','mci','cyber'], preferred:false, notes:'Mountain tourism community with wildfire, winter access, evacuation bottlenecks, hotels/short-term rentals, and regional mutual aid needs.' },
  { id:'tourist-key-west-fl', name:'Key West', state:'Florida', label:'Key West, Florida', jurisdictionType:'Tourist Community', region:'Gulf Coast', center:[24.5551,-81.7800], radiusMiles:8, hazards:['hurricane','flood','mci','cyber','hazmat'], preferred:false, notes:'Island tourist community with limited evacuation routes, maritime exposure, visitor messaging, and delayed mutual aid support.' },

  // Military-Adjacent Community
  { id:'mil-fayetteville-nc', name:'Fayetteville', state:'North Carolina', label:'Fayetteville, North Carolina', jurisdictionType:'Military-Adjacent Community', region:'Southeast', center:[35.0527,-78.8784], radiusMiles:12, hazards:['hurricane','flood','mci','cyber','hazmat','winter'], preferred:false, notes:'Military-adjacent city with installation coordination, transient population, family support concerns, and severe weather impacts.' },
  { id:'mil-colorado-springs-co', name:'Colorado Springs', state:'Colorado', label:'Colorado Springs, Colorado', jurisdictionType:'Military-Adjacent Community', region:'Mountain West', center:[38.8339,-104.8214], radiusMiles:12, hazards:['wildfire','winter','cyber','mci','hazmat','flood'], preferred:false, notes:'Military-adjacent community with wildfire interface, winter weather, defense partners, public information sensitivity, and city/county coordination.' },
  { id:'mil-killeen-tx', name:'Killeen', state:'Texas', label:'Killeen, Texas', jurisdictionType:'Military-Adjacent Community', region:'Plains', center:[31.1171,-97.7278], radiusMiles:12, hazards:['mci','hazmat','cyber','flood','winter'], preferred:false, notes:'Military-adjacent city with large transient population, installation coordination boundaries, family support, and public messaging pressure.' },
  { id:'mil-norfolk-va', name:'Norfolk Military-Adjacent Area', state:'Virginia', label:'Norfolk, Virginia Military-Adjacent Area', jurisdictionType:'Military-Adjacent Community', region:'Mid-Atlantic', center:[36.8508,-76.2859], radiusMiles:12, hazards:['hurricane','flood','cyber','hazmat','mci','rdd'], preferred:false, notes:'Military-adjacent coastal/port city with naval coordination, flooding, transportation chokepoints, and sensitive public information needs.' },

  // Island / Coastal
  { id:'coastal-galveston-tx', name:'Galveston', state:'Texas', label:'Galveston, Texas', jurisdictionType:'Island / Coastal', region:'Gulf Coast', center:[29.3013,-94.7977], radiusMiles:10, hazards:['hurricane','flood','hazmat','mci','cyber'], preferred:false, notes:'Barrier island/coastal community with evacuation timing, bridge dependence, port/industrial exposure, storm surge, and tourist population concerns.' },
  { id:'coastal-outer-banks-nc', name:'Outer Banks', state:'North Carolina', label:'Outer Banks, North Carolina', jurisdictionType:'Island / Coastal', region:'Southeast', center:[35.5585,-75.4665], radiusMiles:25, hazards:['hurricane','flood','mci','cyber'], preferred:false, notes:'Barrier island region with limited evacuation routes, seasonal population, storm surge, ferry/bridge dependencies, and delayed mutual aid.' },
  { id:'coastal-atlantic-city-nj', name:'Atlantic City', state:'New Jersey', label:'Atlantic City, New Jersey', jurisdictionType:'Island / Coastal', region:'Mid-Atlantic', center:[39.3643,-74.4229], radiusMiles:8, hazards:['hurricane','flood','winter','mci','cyber','hazmat'], preferred:false, notes:'Coastal tourism city with casino/hotel population, evacuation constraints, storm surge, public messaging, and vulnerable populations.' },
  { id:'coastal-hilo-hi', name:'Hilo', state:'Hawaii', label:'Hilo, Hawaii', jurisdictionType:'Island / Coastal', region:'Hawaii', center:[19.7070,-155.0885], radiusMiles:10, hazards:['hurricane','flood','earthquake','mci','cyber','hazmat'], preferred:false, notes:'Island/coastal jurisdiction with tsunami/seismic/flood exposure, limited mutual aid, port/airport dependence, and public messaging challenges.' },
  { id:'coastal-sitka-ak', name:'Sitka', state:'Alaska', label:'Sitka, Alaska', jurisdictionType:'Island / Coastal', region:'Alaska', center:[57.0531,-135.3300], radiusMiles:12, hazards:['earthquake','winter','flood','mci','hazmat'], preferred:false, notes:'Remote coastal/island community with limited access, severe weather, port/air dependence, healthcare constraints, and delayed mutual aid.' },
]

function safeReadRecent() {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_LOCATIONS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function randomIndex(max) {
  if (max <= 1) return 0
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(1)
    crypto.getRandomValues(arr)
    return arr[0] % max
  }
  return Math.floor(Math.random() * max)
}

export function selectScenarioLocation(scenarioKey, jurisdictionType) {
  const normalized = normalizeJurisdictionType(jurisdictionType)
  const hazard = String(scenarioKey || '').toLowerCase()

  const sameJurisdiction = LOCATION_BANK.filter(loc => loc.jurisdictionType === normalized)
  let candidates = BROADLY_PLAUSIBLE_HAZARDS.has(hazard)
    ? sameJurisdiction
    : sameJurisdiction.filter(loc => loc.hazards.includes(hazard))

  // A one-location pool guarantees repetition. When the exact jurisdiction/hazard
  // match is too narrow, broaden while preserving real-world plausibility.
  if (candidates.length < 2) {
    const hazardMatches = LOCATION_BANK.filter(loc => loc.hazards.includes(hazard))
    candidates = [...candidates, ...hazardMatches.filter(loc => !candidates.some(existing => existing.id === loc.id))]
  }
  if (!candidates.length) candidates = sameJurisdiction
  if (!candidates.length) candidates = LOCATION_BANK

  const recent = safeReadRecent()
  const nonRecent = candidates.filter(loc => !recent.includes(loc.id))
  const pool = nonRecent.length ? nonRecent : candidates

  return pool[randomIndex(pool.length)]
}

export function rememberScenarioLocation(location) {
  if (!location?.id || typeof window === 'undefined') return
  try {
    const recent = safeReadRecent().filter(id => id !== location.id)
    const next = [location.id, ...recent].slice(0, RECENT_LIMIT)
    window.localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(next))
  } catch {}
}
