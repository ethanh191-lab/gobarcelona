import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { type Topic } from '../../../lib/news-config';

export const revalidate = 60; // Cache for 60 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category'); // maps to actual Supabase category 'Events', 'Barcelona', etc
  const lang = searchParams.get('language') || 'EN'; // EN or ES
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    let query = supabase.from('news_articles').select('*');

    // Language Filter
    if (lang === 'EN') {
      // Must equal EN language
      query = query.eq('language', 'en');
    } else if (lang === 'ES') {
      // Must equal original language ES or strictly language ES
      query = query.or('original_language.eq.es,language.eq.es');
    }

    // Category Filter
    if (category && category !== 'All') {
      // But notice: if a breaking news article belongs to a different category, we still want to show breaking first globally or only within category?
      // Usually category filter applies to the feed. Breaking always overrides within the feed.
      if (category === 'Breaking') {
         query = query.eq('is_breaking', true);
      } else {
         query = query.eq('category', category);
      }
    }

    // Execute query (sorting by is_breaking desc, is_trending desc, published_at desc)
    // Supabase can sort by multiple columns easily
    const { data, error } = await query
      .order('is_breaking', { ascending: false })
      .order('is_trending', { ascending: false })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // We also need to "boost" trending articles or enforce source rotation.
    // Implementing client-side deduplication for source max 2 per result set.
    const finalArticles = [];
    const sourceCounts: Record<string, number> = {};

    for (const a of (data || [])) {
      const srcName = a.source_name || 'unknown';
      if (!sourceCounts[srcName]) sourceCounts[srcName] = 0;
      
      // Allow exception for Breaking or Trending to bypass the source rotation limit
      if (a.is_breaking || a.is_trending || sourceCounts[srcName] < 2) {
        finalArticles.push(a);
        if (!a.is_breaking && !a.is_trending) {
          sourceCounts[srcName]++;
        }
      }
    }

    return NextResponse.json({ articles: finalArticles });
  } catch (err: any) {
    console.error('API /news err:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
