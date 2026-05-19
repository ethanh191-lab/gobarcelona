require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase.from('news_articles').select('id').limit(1);
  if (error) {
    console.error('Error fetching news_articles:', error.message);
  } else {
    console.log('news_articles table exists. Row count:', data.length);
  }
}

check();
