require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

if (!GOOGLE_KEY) {
  console.error('ERROR: No Google Maps API key found. Set NEXT_PUBLIC_GOOGLE_MAPS_KEY in .env.local')
  process.exit(1)
}

// Barcelona grid — 16 zones for full city coverage
const ZONES = [
  { name: 'City Center',      lat: 41.3851, lng: 2.1734 },
  { name: 'Gothic Quarter',   lat: 41.3815, lng: 2.1765 },
  { name: 'El Born',          lat: 41.3850, lng: 2.1830 },
  { name: 'El Raval',         lat: 41.3808, lng: 2.1670 },
  { name: 'Eixample Left',    lat: 41.3895, lng: 2.1545 },
  { name: 'Eixample Right',   lat: 41.3910, lng: 2.1740 },
  { name: 'Gràcia',           lat: 41.4040, lng: 2.1565 },
  { name: 'Barceloneta',      lat: 41.3762, lng: 2.1895 },
  { name: 'Poble Sec',        lat: 41.3745, lng: 2.1615 },
  { name: 'Poblenou',         lat: 41.4005, lng: 2.1945 },
  { name: 'Sant Antoni',      lat: 41.3778, lng: 2.1600 },
  { name: 'Sagrada Familia',  lat: 41.4035, lng: 2.1745 },
  { name: 'Sarrià',           lat: 41.4010, lng: 2.1300 },
  { name: 'Les Corts',        lat: 41.3838, lng: 2.1225 },
  { name: 'Sant Andreu',      lat: 41.4280, lng: 2.1890 },
  { name: 'Nou Barris',       lat: 41.4390, lng: 2.1760 },
]

// STRICT exclusion keywords — never import these
const EXCLUDE_KEYWORDS = [
  'hotel', 'hostal', 'hostel', 'restaurant', 'restaurante', 'pizzeria',
  'sushi', 'burger', 'kebab', 'mcdonalds', 'mcdonald', 'burger king',
  'kfc', 'subway', 'starbucks', 'cafe bakery', 'pastry', 'hair', 'salon',
  'gym', 'fitness', 'cinema', 'cine', 'theatre', 'teatro', 'museum',
  'shop', 'tienda', 'supermarket', 'pharmacy', 'farmacia',
  'spa', 'barber', 'laundry', 'tattoo'
]

// INCLUDE types only
const INCLUDE_TYPES = ['bar', 'night_club']

function isExcluded(name, types) {
  const nameLower = name.toLowerCase()
  if (EXCLUDE_KEYWORDS.some(kw => nameLower.includes(kw))) return true
  if (types?.includes('restaurant') && !types?.includes('bar')) return true
  if (types?.includes('lodging')) return true
  if (types?.includes('store')) return true
  return false
}

function detectNeighbourhood(address) {
  const a = (address || '').toLowerCase()
  if (a.includes('gràcia') || a.includes('gracia')) return 'Gràcia'
  if (a.includes('eixample')) return 'Eixample'
  if (a.includes('el raval') || a.includes('raval')) return 'El Raval'
  if (a.includes('el born') || a.includes('born') || a.includes('sant pere')) return 'El Born'
  if (a.includes('barceloneta')) return 'Barceloneta'
  if (a.includes('poble sec')) return 'Poble Sec'
  if (a.includes('poblenou')) return 'Poblenou'
  if (a.includes('sant antoni')) return 'Sant Antoni'
  if (a.includes('sarrià') || a.includes('sarria')) return 'Sarrià'
  if (a.includes('les corts')) return 'Les Corts'
  if (a.includes('horta')) return 'Horta'
  if (a.includes('sant andreu')) return 'Sant Andreu'
  if (a.includes('nou barris')) return 'Nou Barris'
  if (a.includes('gòtic') || a.includes('gothic') || a.includes('gotic')) return 'Gothic Quarter'
  if (a.includes('montjuïc') || a.includes('montjuic')) return 'Montjuïc'
  return 'Barcelona'
}

function parseHours(weekdayText) {
  if (!weekdayText) return {}
  const days = ['mon','tue','wed','thu','fri','sat','sun']
  const result = {}
  weekdayText.forEach((text, i) => {
    const key = `opening_${days[i]}`
    if (text.toLowerCase().includes('closed')) {
      result[key] = 'Closed'
    } else {
      const clean = text.replace(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*/i, '')
      result[key] = clean || '?'
    }
  })
  return result
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchNearby(lat, lng, type, pageToken) {
  let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1500&type=${type}&key=${GOOGLE_KEY}`
  if (pageToken) url += `&pagetoken=${pageToken}`
  const res = await fetch(url)
  return res.json()
}

async function fetchDetails(placeId) {
  const fields = 'name,formatted_address,geometry,rating,user_ratings_total,opening_hours,website,formatted_phone_number,photos,types,price_level'
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  return data.result
}

async function main() {
  console.log('GoBarcelona — Bar Import from Google Maps')
  console.log('==========================================')

  const seenIds = new Set()
  const queue = []

  // Phase 1: collect all place IDs
  for (const zone of ZONES) {
    for (const type of INCLUDE_TYPES) {
      let pageToken = null
      let page = 0
      do {
        if (pageToken) await sleep(2500)
        const data = await fetchNearby(zone.lat, zone.lng, type, pageToken)
        if (data.status === 'OVER_QUERY_LIMIT') {
          console.log('Rate limit — waiting 60s...')
          await sleep(60000)
          continue
        }
        for (const p of (data.results || [])) {
          if (!seenIds.has(p.place_id)) {
            seenIds.add(p.place_id)
            queue.push(p)
          }
        }
        console.log(`Zone: ${zone.name} | Type: ${type} | Page ${++page} | Unique so far: ${seenIds.size}`)
        pageToken = data.next_page_token || null
      } while (pageToken && page < 3)
    }
  }

  console.log(`\nTotal unique places to process: ${queue.length}`)
  console.log('Fetching details and importing...\n')

  let imported = 0
  let skipped = 0
  let excluded = 0

  for (let i = 0; i < queue.length; i++) {
    const place = queue[i]
    await sleep(120)

    try {
      const d = await fetchDetails(place.place_id)
      if (!d) { skipped++; continue }

      // Strict exclusion check
      if (isExcluded(d.name, d.types)) {
        console.log(`  EXCLUDED: ${d.name}`)
        excluded++
        continue
      }

      // Barcelona boundary check
      const lat = d.geometry?.location?.lat
      const lng = d.geometry?.location?.lng
      if (!lat || !lng || lat < 41.32 || lat > 41.47 || lng < 2.06 || lng > 2.23) {
        console.log(`  OUTSIDE BARCELONA: ${d.name}`)
        skipped++
        continue
      }

      const photoRef = d.photos?.[0]?.photo_reference
      const photoUrl = photoRef
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_KEY}`
        : null

      const isIrish = /irish|o'brien|o'reilly|o'malley|pub$/i.test(d.name)
      const isCraft = /craft|artesanal|cerveceria|brewery|brewing|taproom/i.test(d.name)
      const isLate = ['opening_fri','opening_sat'].some(k => {
        const v = parseHours(d.opening_hours?.weekday_text)[k] || ''
        return v.includes('3:00') || v.includes('4:00') || v.includes('5:00') || v.includes('6:00')
      })

      const bar = {
        name: d.name,
        address: d.formatted_address,
        neighbourhood: detectNeighbourhood(d.formatted_address),
        lat, lng,
        website: d.website || null,
        phone: d.formatted_phone_number || null,
        google_place_id: place.place_id,
        google_rating: d.rating || null,
        google_rating_count: d.user_ratings_total || null,
        price_per_500ml: null,
        price_confidence: 'unverified',
        ...parseHours(d.opening_hours?.weekday_text),
        has_terrace: false,
        dog_friendly: false,
        sports_tv: isIrish,
        group_friendly: false,
        open_late: isLate,
        social_club: false,
        rooftop: false,
        student_friendly: false,
        student_discount: false,
        live_music: false,
        date_spot: false,
        irish_pub: isIrish,
        craft_beer: isCraft,
        beer_hall: d.types?.includes('night_club') || false,
        status: 'open',
        photo_url: photoUrl,
        data_source: 'google_maps_api',
        last_updated: new Date().toISOString().split('T')[0],
        notes: 'Imported from Google Maps. Price and features need manual verification.'
      }

      const { error } = await supabase
        .from('bars')
        .upsert(bar, { onConflict: 'google_place_id', ignoreDuplicates: false })

      if (error) {
        console.error(`  DB ERROR: ${d.name} — ${error.message}`)
        skipped++
      } else {
        imported++
        if (imported % 25 === 0) {
          console.log(`  ✓ ${imported} bars imported so far...`)
        }
      }
    } catch (err) {
      console.error(`  ERROR: ${place.place_id} — ${err.message}`)
      skipped++
    }
  }

  console.log('\n==========================================')
  console.log(`✅ Import complete`)
  console.log(`   Imported:  ${imported}`)
  console.log(`   Excluded (not a bar): ${excluded}`)
  console.log(`   Skipped (error/outside): ${skipped}`)
}

main().catch(console.error)
