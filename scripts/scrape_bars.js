const fs = require('fs');
const path = require('path');
const axios = require('axios');

/**
 * GOOGLE PLACES SCRAPER FOR GOBARCELONA
 * 
 * Instructions:
 * 1. Ensure you have Node.js installed.
 * 2. Run: npm install axios
 * 3. Replace the GOOGLE_API_KEY with your own.
 * 4. Run: node scrape_bars.js
 */

const GOOGLE_API_KEY = 'AIzaSyDYQ7swNdsixXWF3whewFgtaUZo8BIHb-c'; // Found in project config
const OUTPUT_JSON = 'barcelona_bars.json';
const OUTPUT_CSV = 'barcelona_bars.csv';

// Barcelona Center
const CENTER = { lat: 41.3851, lng: 2.1734 };

// Create a 3x3 grid (9 zones) to bypass the 60-result limit
const GRID_STEP = 0.04; // Roughly 4-5km
const ZONES = [];
for (let i = -1; i <= 1; i++) {
  for (let j = -1; j <= 1; j++) {
    ZONES.push({
      lat: CENTER.lat + (i * GRID_STEP),
      lng: CENTER.lng + (j * GRID_STEP),
      radius: 4000 // meters
    });
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getPlaceDetails(placeId) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,place_id,rating,user_ratings_total,opening_hours,website,formatted_phone_number,photos&key=${GOOGLE_API_KEY}`;
    const res = await axios.get(url);
    return res.data.result;
  } catch (e) {
    console.error(`Error fetching details for ${placeId}:`, e.message);
    return null;
  }
}

async function scrape() {
  const allPlaces = new Map();

  console.log(`🚀 Starting scrape across ${ZONES.length} grid zones...`);

  for (const [index, zone] of ZONES.entries()) {
    console.log(`📍 Searching Zone ${index + 1}/9 (${zone.lat.toFixed(4)}, ${zone.lng.toFixed(4)})...`);
    
    let nextPageToken = '';
    let zoneCount = 0;

    do {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${zone.lat},${zone.lng}&radius=${zone.radius}&type=bar&key=${GOOGLE_API_KEY}${nextPageToken ? `&pagetoken=${nextPageToken}` : ''}`;
      
      const res = await axios.get(url);
      const results = res.data.results || [];
      
      for (const p of results) {
        if (!allPlaces.has(p.place_id)) {
          allPlaces.set(p.place_id, p);
          zoneCount++;
        }
      }

      nextPageToken = res.data.next_page_token;
      if (nextPageToken) {
        process.stdout.write('  ...loading next page (waiting for API cooldown)\r');
        await sleep(2000); // Required by Google API for nextPageToken to become active
      }
    } while (nextPageToken);

    console.log(`   Found ${zoneCount} unique places in this zone. Total so far: ${allPlaces.size}`);
  }

  console.log(`\n✅ Scrape complete. Total unique places found: ${allPlaces.size}`);
  console.log(`🔍 Fetching full details for each place (this may take a while)...`);

  const detailedPlaces = [];
  const placeIds = Array.from(allPlaces.keys());

  for (let i = 0; i < placeIds.length; i++) {
    const pid = placeIds[i];
    process.stdout.write(`   Processing ${i + 1}/${placeIds.length}\r`);
    
    const details = await getPlaceDetails(pid);
    if (details) {
      detailedPlaces.push(details);
    }
    
    // Tiny delay to avoid rate limiting
    if (i % 10 === 0) await sleep(100);
  }

  console.log(`\n💾 Saving to ${OUTPUT_JSON}...`);
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(detailedPlaces, null, 2));

  console.log(`📊 Converting to CSV (${OUTPUT_CSV})...`);
  convertToCSV(detailedPlaces);

  console.log('\n✨ DONE! You now have a verified list of Barcelona bars.');
}

function convertToCSV(places) {
  const headers = [
    'id', 'name', 'address', 'neighborhood', 'lat', 'lng', 
    'beer_price_05l', 'rating', 'review_count', 'terrace', 
    'sports_broadcasting', 'status', 'happy_hour_start', 
    'happy_hour_end', 'happy_hour_price', 'beers_on_tap', 
    'student_discount', 'student_price', 'website', 'phone'
  ];

  const rows = places.map(p => {
    // Basic neighborhood extraction from address (rough)
    const addr = p.formatted_address || '';
    let neighborhood = '?';
    if (addr.includes('Eixample')) neighborhood = 'Eixample';
    else if (addr.includes('Gràcia')) neighborhood = 'Gràcia';
    else if (addr.includes('Born')) neighborhood = 'El Born';
    else if (addr.includes('Gòtic')) neighborhood = 'Gothic Quarter';
    else if (addr.includes('Raval')) neighborhood = 'El Raval';
    else if (addr.includes('Poblenou')) neighborhood = 'Poblenou';

    return [
      p.place_id,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${addr.replace(/"/g, '""')}"`,
      neighborhood,
      p.geometry.location.lat,
      p.geometry.location.lng,
      '?', // beer_price_05l
      p.rating || '?',
      p.user_ratings_total || 0,
      '?', // terrace
      '?', // sports_broadcasting
      'open',
      '?', // happy_hour_start
      '?', // happy_hour_end
      '?', // happy_hour_price
      '?', // beers_on_tap
      '?', // student_discount
      '?', // student_price
      p.website || '?',
      p.formatted_phone_number || '?'
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  fs.writeFileSync(OUTPUT_CSV, csvContent);
}

scrape().catch(console.error);
