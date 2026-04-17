const { createClient } = require('@supabase/supabase-js')

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Missing environment variables.')
  console.log('Ensure you have NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, NEXT_PUBLIC_SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY set in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Barcelona divided into 16 grid zones to get maximum coverage
// Each zone covers roughly 3x3km, overlapping slightly
const SEARCH_ZONES = [
  { name: 'City Center',     lat: 41.3851, lng: 2.1734 },
  { name: 'Gothic/Born',     lat: 41.3833, lng: 2.1810 },
  { name: 'El Raval',        lat: 41.3808, lng: 2.1670 },
  { name: 'Eixample Left',   lat: 41.3901, lng: 2.1560 },
  { name: 'Eixample Right',  lat: 41.3901, lng: 2.1750 },
  { name: 'Gracia',          lat: 41.4040, lng: 2.1570 },
  { name: 'Barceloneta',     lat: 41.3762, lng: 2.1894 },
  { name: 'Poble Sec',       lat: 41.3740, lng: 2.1620 },
  { name: 'Poblenou',        lat: 41.4000, lng: 2.1940 },
  { name: 'Sant Antoni',     lat: 41.3779, lng: 2.1600 },
  { name: 'Sagrada Familia', lat: 41.4036, lng: 2.1744 },
  { name: 'Sarria',          lat: 41.4009, lng: 2.1307 },
  { name: 'Les Corts',       lat: 41.3840, lng: 2.1230 },
  { name: 'Horta',           lat: 41.4200, lng: 2.1650 },
  { name: 'Sant Andreu',     lat: 41.4280, lng: 2.1890 },
  { name: 'Nou Barris',      lat: 41.4390, lng: 2.1760 },
]

const SEARCH_TYPES = ['bar', 'night_club', 'pub']
const RADIUS = 1500 // 1.5km per zone — overlapping gives full coverage

async function fetchPlaces(lat, lng, type, pageToken = null) {
  let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${RADIUS}&type=${type}&key=${GOOGLE_API_KEY}`
  if (pageToken) url += `&pagetoken=${pageToken}`
  
  const res = await fetch(url)
  const data = await res.json()
  return data
}

async function fetchPlaceDetails(placeId) {
  const fields = 'name,formatted_address,geometry,rating,user_ratings_total,opening_hours,website,formatted_phone_number,photos,price_level,types'
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  return data.result
}

function detectNeighbourhood(address) {
  const addr = address?.toLowerCase() || ''
  if (addr.includes('gràcia') || addr.includes('gracia')) return 'Gràcia'
  if (addr.includes('eixample')) return 'Eixample'
  if (addr.includes('raval')) return 'El Raval'
  if (addr.includes('born') || addr.includes('sant pere')) return 'El Born'
  if (addr.includes('barceloneta')) return 'Barceloneta'
  if (addr.includes('poble sec')) return 'Poble Sec'
  if (addr.includes('poblenou')) return 'Poblenou'
  if (addr.includes('sant antoni')) return 'Sant Antoni'
  if (addr.includes('sarrià') || addr.includes('sarria')) return 'Sarrià'
  if (addr.includes('les corts')) return 'Les Corts'
  if (addr.includes('horta')) return 'Horta'
  if (addr.includes('sant andreu')) return 'Sant Andreu'
  if (addr.includes('nou barris')) return 'Nou Barris'
  if (addr.includes('gòtic') || addr.includes('gothic')) return 'Gothic Quarter'
  return 'Barcelona'
}

function parseOpeningHours(openingHours) {
  if (!openingHours?.weekday_text) return {}
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  const result = {}
  openingHours.weekday_text.forEach((text, index) => {
    const day = days[index]
    if (text.toLowerCase().includes('closed')) {
      result[`opening_${day}`] = 'Closed'
    } else {
      const match = text.match(/\d{1,2}:\d{2}\s*[AP]M\s*–\s*\d{1,2}:\d{2}\s*[AP]M/i)
      result[`opening_${day}`] = match ? match[0] : '?'
    }
  })
  return result
}

async function importBars() {
  console.log('Starting GoBarcelona bar import from Google Maps...')
  
  const allPlaceIds = new Set()
  const allPlaces = []

  for (const zone of SEARCH_ZONES) {
    console.log(`\nSearching zone: ${zone.name}`)
    
    for (const type of SEARCH_TYPES) {
      let pageToken = null
      let page = 0
      
      do {
        if (pageToken) await new Promise(r => setTimeout(r, 2000)) // Required delay for page tokens
        
        const data = await fetchPlaces(zone.lat, zone.lng, type, pageToken)
        
        if (data.status === 'OVER_QUERY_LIMIT') {
          console.log('API limit reached, waiting 60 seconds...')
          await new Promise(r => setTimeout(r, 60000))
          continue
        }
        
        for (const place of (data.results || [])) {
          if (!allPlaceIds.has(place.place_id)) {
            allPlaceIds.add(place.place_id)
            allPlaces.push(place)
          }
        }
        
        console.log(`  Zone ${zone.name} | Type ${type} | Page ${++page} | Found ${data.results?.length || 0} | Total unique: ${allPlaceIds.size}`)
        pageToken = data.next_page_token || null
        
      } while (pageToken && page < 3) // Max 3 pages = 60 results per zone/type
    }
  }

  console.log(`\nTotal unique places found: ${allPlaces.length}`)
  console.log('Fetching details for each place...')

  let imported = 0
  let skipped = 0

  for (let i = 0; i < allPlaces.length; i++) {
    const place = allPlaces[i]
    
    try {
      await new Promise(r => setTimeout(r, 100)) // Rate limiting
      const details = await fetchPlaceDetails(place.place_id)
      
      const hours = parseOpeningHours(details.opening_hours)
      const neighbourhood = detectNeighbourhood(details.formatted_address)
      
      // Check if bar is actually in Barcelona (filter out places outside city)
      const lat = details.geometry?.location?.lat
      const lng = details.geometry?.location?.lng
      if (!lat || !lng) { skipped++; continue }
      if (lat < 41.32 || lat > 41.47 || lng < 2.06 || lng > 2.23) { 
        console.log(`  Skipping (outside Barcelona): ${details.name}`)
        skipped++
        continue 
      }

      const photoRef = details.photos?.[0]?.photo_reference
      const photoUrl = photoRef 
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`
        : null

      const barData = {
        name: details.name,
        address: details.formatted_address,
        neighbourhood,
        lat,
        lng,
        website: details.website || null,
        phone: details.formatted_phone_number || null,
        google_place_id: place.place_id,
        google_rating: details.rating || null,
        google_rating_count: details.user_ratings_total || null,
        price_per_500ml: null, // Unknown — to be crowdsourced
        price_confidence: 'unverified',
        ...hours,
        happy_hour_start: null,
        happy_hour_end: null,
        happy_hour_price: null,
        beers_on_tap: null,
        has_terrace: false, // Unknown
        dog_friendly: false,
        sports_tv: false,
        group_friendly: false,
        open_late: hours.opening_fri?.includes('00:') || hours.opening_fri?.includes('01:') || hours.opening_fri?.includes('02:') || hours.opening_fri?.includes('03:') || false,
        social_club: false,
        rooftop: false,
        student_friendly: false,
        student_discount: false,
        live_music: false,
        date_spot: false,
        irish_pub: details.name?.toLowerCase().includes('irish') || details.name?.toLowerCase().includes('pub') || false,
        craft_beer: details.name?.toLowerCase().includes('craft') || details.name?.toLowerCase().includes('cerveza artesanal') || false,
        beer_hall: details.types?.includes('night_club') || false,
        wine_bar: details.name?.toLowerCase().includes('wine') || details.name?.toLowerCase().includes('vino') || false,
        status: 'open',
        photo_url: photoUrl,
        data_source: 'google_maps_api',
        last_updated: new Date().toISOString().split('T')[0],
        notes: `Imported from Google Maps. Price and features need verification.`
      }

      const { error } = await supabase
        .from('bars')
        .upsert(barData, { onConflict: 'google_place_id' })

      if (error) {
        console.error(`  Error inserting ${details.name}:`, error.message)
        skipped++
      } else {
        imported++
        if (imported % 50 === 0) console.log(`  Progress: ${imported} bars imported...`)
      }
      
    } catch (err) {
      console.error(`  Error processing place ${place.place_id}:`, err.message)
      skipped++
    }
  }

  console.log(`\n✅ Import complete!`)
  console.log(`   Imported: ${imported} bars`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Total in Supabase: check bars table`)
}

importBars().catch(console.error)
