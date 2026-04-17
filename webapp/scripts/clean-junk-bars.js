require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const EXCLUDE_KEYWORDS = [
  'hotel', 'hostal', 'hostel', 'restaurant', 'restaurante', 'pizzeria', 'pizza',
  'sushi', 'burger', 'kebab', 'mcdonalds', 'mcdonald', 'burger king',
  'kfc', 'subway', 'starbucks', 'cafe bakery', 'pastry', 'hair', 'salon',
  'gym', 'fitness', 'cinema', 'cine', 'theatre', 'teatro', 'museum',
  'shop', 'tienda', 'supermarket', 'pharmacy', 'farmacia', 'supermercat',
  'spa', 'barber', 'laundry', 'tattoo', 'bakery', 'panaderia', 'forn'
]

async function clean() {
  console.log('Cleaning junk from the database...')
  let totalDeleted = 0
  
  for (const kw of EXCLUDE_KEYWORDS) {
    const { count } = await supabase
      .from('bars')
      .select('*', { count: 'exact', head: true })
      .ilike('name', `%${kw}%`)
      
    if (count > 0) {
      const { error } = await supabase
        .from('bars')
        .delete()
        .ilike('name', `%${kw}%`)
        
      if (error) {
        console.error(`Failed to delete ${kw}:`, error.message)
      } else {
        console.log(`Deleted ${count} bars matching '${kw}'`)
        totalDeleted += count
      }
    }
  }
  
  console.log(`\nCleanup complete. Total deleted: ${totalDeleted}`)
  
  const { count: remaining } = await supabase
    .from('bars')
    .select('*', { count: 'exact', head: true })
  console.log(`Remaining bars in database: ${remaining}`)
}

clean()
