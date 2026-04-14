import Parser from 'rss-parser';
import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export const maxDuration = 300; // 5 minutes max duration for this heavy cron

const parser = new Parser({
  customFields: {
    item: ['media:content', 'enclosure', 'content:encoded', 'description', 'pubDate'],
  }
});

const RSS_SOURCES = [
  // Barcelona English
  { url: 'https://www.barcelonametropolitan.com/feed', lang: 'en', name: 'Barcelona Metropolitan' },
  { url: 'https://www.catalannews.com/rss.xml', lang: 'en', name: 'Catalan News' },
  { url: 'https://www.thelocal.es/feed', lang: 'en', name: 'The Local' },
  { url: 'https://www.timeout.com/barcelona/rss', lang: 'en', name: 'TimeOut BCN' },
  { url: 'https://www.expatica.com/es/feed', lang: 'en', name: 'Expatica' },
  { url: 'https://www.angloinfo.com/barcelona/rss.xml', lang: 'en', name: 'Angloinfo' },
  { url: 'https://www.barcelona-home.com/blog/feed', lang: 'en', name: 'Barcelona Home' },

  // Barcelona Spanish
  { url: 'https://www.lavanguardia.com/mvc/feed/rss/home', lang: 'es', name: 'La Vanguardia' },
  { url: 'https://www.elperiodico.com/es/rss/rss_portada.xml', lang: 'es', name: 'El Periodico' },
  { url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada', lang: 'es', name: 'El Pais' },
  { url: 'https://www.elmundo.es/rss/portada.xml', lang: 'es', name: 'El Mundo' },
  { url: 'https://www.ara.cat/rss.xml', lang: 'es', name: 'Ara' },
  { url: 'https://www.ccma.cat/rss/324.xml', lang: 'es', name: '324' },
  { url: 'https://www.naciodigital.cat/rss.xml', lang: 'es', name: 'Nacio Digital' },
  { url: 'https://barcelonasecreta.com/feed', lang: 'es', name: 'Barcelona Secreta' },
  { url: 'https://www.timeout.es/barcelona/rss', lang: 'es', name: 'TimeOut ES' },
  { url: 'https://www.elconfidencial.com/rss/', lang: 'es', name: 'El Confidencial' },

  // Events and nightlife
  { url: 'https://www.residentadvisor.net/feed/events/es/barcelona', lang: 'en', name: 'Resident Advisor' },
  { url: 'https://www.songkick.com/metro_areas/6054-es-barcelona/calendar.rss', lang: 'en', name: 'Songkick' },
  { url: 'https://doingbarcelona.com/feed', lang: 'en', name: 'Doing Barcelona' },
  { url: 'https://www.timeout.com/barcelona/things-to-do/rss', lang: 'en', name: 'TimeOut Things To Do' },
  { url: 'https://guiaocio.es/barcelona/feed', lang: 'es', name: 'Guia Ocio' },
  { url: 'https://www.bcn.cat/agenda/ajuntament/es/cerca.rss', lang: 'es', name: 'Bcn.cat Agenda' },
  { url: 'https://lameva.barcelona.cat/barcelonacultura/ca/rss.xml', lang: 'ca', name: 'Barcelona Cultura' },

  // Sports
  { url: 'https://www.fcbarcelona.com/en/rss', lang: 'en', name: 'FC Barcelona' },
  { url: 'https://www.mundodeportivo.com/rss/home', lang: 'es', name: 'Mundo Deportivo' },
  { url: 'https://www.sport.es/rss/home.rss', lang: 'es', name: 'Sport.es' },
  { url: 'https://www.as.com/rss/tags/barcelona.xml', lang: 'es', name: 'AS' },
  { url: 'https://www.marca.com/rss/futbol/primera.xml', lang: 'es', name: 'Marca' },
  { url: 'https://www.goal.com/feeds/en/news', lang: 'en', name: 'Goal' },

  // Culture and lifestyle
  { url: 'https://www.timeout.com/barcelona/art/rss', lang: 'en', name: 'TimeOut Art' },
  { url: 'https://culturabcn.cat/feed', lang: 'ca', name: 'Cultura BCN' },
  { url: 'https://www.vice.com/en/rss', lang: 'en', name: 'Vice' },
  { url: 'https://www.artribune.com/feed', lang: 'it', name: 'Artribune' },
  { url: 'https://www.metalmagazine.eu/feed', lang: 'en', name: 'Metal Magazine' },

  // Expat
  { url: 'https://www.expatfocus.com/rss/spain', lang: 'en', name: 'Expat Focus' },
  { url: 'https://spainexpat.com/feed', lang: 'en', name: 'Spain Expat' },
  { url: 'https://www.spainenglish.com/feed', lang: 'en', name: 'Spain English' },

  // News agencies
  { url: 'https://feeds.reuters.com/reuters/worldNews', lang: 'en', name: 'Reuters' },
  { url: 'https://apnews.com/rss', lang: 'en', name: 'AP News' },
];

function generateSlug(title: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const random = Math.random().toString(36).substring(2, 6);
  return `${base.substring(0, 50)}-${random}`;
}

async function rewriteWithClaude(title: string, content: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('No Anthropic API Key');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022', // Updated to latest claude 3.5 sonnet
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are a writer for GoBarcelona, a city guide for young international residents aged 18-32 in Barcelona. Rewrite this news article in GoBarcelona's voice: direct, punchy, relevant to expats and young locals living in Barcelona. Write a punchy headline under 10 words, then 2-3 short paragraphs. Focus on what this means for people living in Barcelona. End with one practical takeaway sentence. Return JSON only: {"title": "...", "summary": "one sentence", "body": "full rewritten article", "category": "one of: Events|Free Things|Festivals|Markets|Weather|Sports|Culture|Nightlife|Barcelona|Expat|Breaking", "is_breaking": false}. Original title: ${title}. Original content: ${content}`
      }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  
  // Extract JSON from output safely
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('Claude did not return valid JSON');
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const processedUrls = new Set(); // Prevent duplicates in this run
  let articlesProcessed = 0;
  let articlesAdded = 0;
  let errors = 0;

  for (const source of RSS_SOURCES) {
    if (articlesAdded >= 10) break; // Hard cap on how many new items per cron run to avoid Claude billing shock / timeouts

    try {
      const feed = await parser.parseURL(source.url);
      
      for (const item of feed.items.slice(0, 3)) { // Only look at top 3 items per feed
        if (articlesAdded >= 10) break;
        
        const sourceUrl = item.link || '';
        if (!sourceUrl || processedUrls.has(sourceUrl)) continue;
        processedUrls.add(sourceUrl);
        articlesProcessed++;

        // Deduplication check in Supabase
        const { data: existing } = await supabase
          .from('news_articles')
          .select('id')
          .eq('source_url', sourceUrl)
          .single();

        if (existing) continue; // Already processed

        // Prepare content for Claude
        const pubDateStr = item.pubDate || new Date().toISOString();
        const contentSnippet = item['content:encoded'] || item.content || item.description || '';
        
        // Extract Image
        let imageUrl = null;
        if (item.enclosure && item.enclosure.url && item.enclosure.type?.startsWith('image')) {
          imageUrl = item.enclosure.url;
        } else if (item['media:content'] && item['media:content'].$ && item['media:content'].$.url) {
          imageUrl = item['media:content'].$.url;
        } else {
          const imgMatch = contentSnippet.match(/<img[^>]+src="([^">]+)"/);
          if (imgMatch) imageUrl = imgMatch[1];
        }

        try {
          // Send to Claude
          const rewritten = await rewriteWithClaude(item.title || '', contentSnippet);
          
          if (!rewritten.title || !rewritten.body) continue;

          // Standardize Category to our config
          let safeCategory = rewritten.category;
          const validCategories = ['Events', 'Free Things', 'Festivals', 'Markets', 'Weather', 'Sports', 'Culture', 'Nightlife', 'Barcelona', 'Expat', 'Breaking'];
          if (!validCategories.includes(safeCategory)) safeCategory = 'Barcelona';

          // Insert into Supabase
          const { error: dbError } = await supabase
            .from('news_articles')
            .insert({
              title: rewritten.title,
              summary: rewritten.summary,
              body: rewritten.body,
              source_url: sourceUrl,
              source_name: source.name,
              image_url: imageUrl,
              category: safeCategory,
              language: 'en',
              original_language: source.lang,
              published_at: new Date(pubDateStr).toISOString(),
              slug: generateSlug(rewritten.title),
              is_breaking: rewritten.is_breaking || false,
              is_trending: false
            });

          if (dbError) {
            console.error('DB Insert error:', dbError);
            errors++;
          } else {
            articlesAdded++;
          }
        } catch (rewriteError) {
          console.error(`Rewrite error for ${sourceUrl}:`, rewriteError);
          errors++;
        }
      }
    } catch (feedError) {
      console.error(`Feed error for ${source.url}:`, feedError);
      errors++;
    }
  }

  return NextResponse.json({ 
    success: true, 
    articles_processed: articlesProcessed, 
    articles_added: articlesAdded,
    errors 
  });
}
