import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const language = searchParams.get('language') || 'EN';
  const category = searchParams.get('category');
  const trending = searchParams.get('trending') === 'true';

  try {
    let query = supabase
      .from('news_articles')
      .select('id, title, summary, source_url, source_name, image_url, category, language, published_at, slug, is_breaking, is_trending')
      .order('published_at', { ascending: false })
      .limit(limit);

    // Language filter: EN maps to 'en', ES maps to 'es'
    const langCode = language.toLowerCase();
    query = query.eq('language', langCode);

    if (category) {
      query = query.eq('category', category);
    }

    if (trending) {
      query = query.eq('is_trending', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('News API error:', error);
      return NextResponse.json({ articles: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ articles: data || [] }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    });
  } catch (err) {
    console.error('News API unexpected error:', err);
    return NextResponse.json({ articles: [], error: 'Internal server error' }, { status: 500 });
  }
}
