const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function checkCount() {
  const { count, error } = await supabase
    .from('bars')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error:', error.message)
  } else {
    console.log(`Total bars in database: ${count}`)
  }
}

checkCount()
