import { createClient } from '@supabase/supabase-js'

console.log('--- SUPABASE CLIENT INIT ---');
console.log('URL Present:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Key Present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('URL Start:', process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 15) + '...');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

// Example query functions that will be hooked up later:
// 
// export async function getEvents() {
//   const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true })
//   return { data, error }
// }
//
// export async function getBars() {
//   const { data, error } = await supabase.from('bars').select('*').order('beer_price', { ascending: true })
//   return { data, error }
// }
