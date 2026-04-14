import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export const revalidate = 60; // Cache for 1 min

export async function GET() {
  const { data, error } = await supabase
    .from('trending_topics')
    .select('*')
    .order('detected_at', { ascending: false })
    .limit(5);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deduplicate by topic name just in case cron inserted multiple
  const uniqueTopics = [];
  const seen = new Set();
  for (const t of data) {
    if (!seen.has(t.topic.toLowerCase())) {
      seen.add(t.topic.toLowerCase());
      uniqueTopics.push(t);
    }
  }

  return NextResponse.json({ trends: uniqueTopics.slice(0, 5) });
}
