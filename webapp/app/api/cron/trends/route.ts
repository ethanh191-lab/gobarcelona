import googleTrends from 'google-trends-api';
import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { type Topic } from '../../../../lib/news-config';

export const maxDuration = 60; // Allow enough time for cron

function classifyTopicFromKeywords(title: string): Topic {
  const t = title.toLowerCase();
  if (['festival', 'festivals', 'primavera sound', 'sonar', 'festa major'].some(kw => t.includes(kw))) return 'Festivals';
  if (['gratis', 'free'].some(kw => t.includes(kw))) return 'Free Things';
  if (['playa', 'beach', 'weather', 'tiempo', 'calor'].some(kw => t.includes(kw))) return 'Weather';
  if (['barça', 'espanyol', 'fc barcelona', 'football', 'futbol'].some(kw => t.includes(kw))) return 'Sports';
  if (['concert', 'music', 'art', 'exhibition', 'theatre'].some(kw => t.includes(kw))) return 'Culture';
  if (['huelga', 'strike', 'metro', 'rodalies', 'renfe', 'ajuntament'].some(kw => t.includes(kw))) return 'Barcelona';
  
  return 'Barcelona';
}

export async function GET(request: Request) {
  // Simple auth check for cron if we want to secure it, but for now we let Vercel handle it via headers or we leave open
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch trending searches for Spain
    let trendingData;
    try {
      const trending = await googleTrends.dailyTrends({ geo: 'ES' });
      // google-trends-api sometimes returns a string that needs cleaning before parsing
      trendingData = JSON.parse(trending);
    } catch (apiErr: any) {
      console.error('Google Trends API or Parse Error:', apiErr);
      return NextResponse.json({ error: 'Failed to fetch or parse trends', details: apiErr.message }, { status: 502 });
    }

    if (!trendingData?.default?.trendingSearchesDays?.[0]?.trendingSearches) {
      return NextResponse.json({ success: true, count: 0, message: 'No trends found today' });
    }

    const topics = trendingData.default.trendingSearchesDays[0].trendingSearches;

    // 2. Filter relevant topics
    const relevantKeywords = ['barcelona', 'festival', 'concert', 'event', 'fiesta', 'gratis', 'free', 'playa', 'beach', 'metro', 'huelga', 'strike', 'barça', 'español'];
    
    const relevant = topics.filter((t: any) => {
      const title = t.title.query.toLowerCase();
      return relevantKeywords.some(kw => title.includes(kw));
    });

    const results = [];
    for (const t of relevant) {
      const topicQuery = t.title.query;
      const searchVolume = parseInt(t.formattedTraffic.replace(/[^0-9]/g, '')) || 0;
      const relatedQuery = t.relatedQueries?.[0]?.query || null;

      // 3. Store in Supabase trending_topics
      const { data: insertedTopic, error } = await supabase
        .from('trending_topics')
        .insert({
          topic: topicQuery,
          search_volume: searchVolume,
          related_query: relatedQuery,
          geo: 'ES'
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error inserting trending topic:', error);
        continue;
      }
      
      // 4. For relevant topics without matching article: create developing story card
      // Check if we already have an article about this topic in the last 24 hours
      const { data: existingNews } = await supabase
        .from('news_articles')
        .select('id')
        .ilike('title', `%${topicQuery}%`)
        .order('published_at', { ascending: false })
        .limit(1);
        
      if (!existingNews || existingNews.length === 0) {
        // Create developing story stub
        const stubTopic = classifyTopicFromKeywords(topicQuery);
        const stubSlug = `developing-${topicQuery.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;
        
        await supabase
          .from('news_articles')
          .insert({
            title: `Developing: ${topicQuery}`,
            summary: "We're following this developing story — check back for updates.",
            body: "We're closely monitoring this trending topic in Barcelona. Our editorial team is currently researching the details and will update this article shortly with full insights on how this affects international residents.",
            source_url: `https://gobarcelona.es/news/${stubSlug}`, // internal unique stub
            source_name: 'GoBarcelona Trends',
            category: stubTopic,
            language: 'en',
            original_language: 'es',
            published_at: new Date().toISOString(),
            slug: stubSlug,
            is_breaking: true,
            is_trending: true
          });
          
        results.push({ topic: topicQuery, created_stub: true });
      } else {
        results.push({ topic: topicQuery, created_stub: false });
      }
    }

    return NextResponse.json({ success: true, count: relevant.length, processed: results });
  } catch (error: any) {
    console.error('Trends Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
