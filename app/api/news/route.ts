import { NextResponse } from 'next/server';
import { TOPIC_ORDER, TOPIC_META, type Topic, type Article } from '../../../lib/news-config';

export type { Article };

const TOPIC_KEYWORDS: Record<Topic, string[]> = {
  'Barcelona':        ['barcelona','bcn','ajuntament','eixample','gracia','born','barceloneta','poblenou','sagrada familia','rambla'],
  'Catalunya':        ['cataluny','catalan','generalitat','junts','esquerra','cup','puigdemont','independen','girona','tarragona','psc','parlament','mossos'],
  'Spain':            ['españa','spain','madrid','gobierno','sanchez','congreso','senado','partido popular','psoe','vox','sumar','moncloa'],
  'Politics':         ['política','politics','eleccion','election','vote','vot','partido','parliament','democra','minister','president','govern'],
  'Sports':           ['barça','fc barcelona','barca','real madrid','champions','liga','gol','goal','futbol','football','tennis','moto gp','basket','lewandowski','yamal'],
  'Culture & Events': ['concert','festival','music','musica','sonar','primavera','nightlife','restaurant','exposicion','exhibition','art','film','cinema','theatre','event','fiesta','cultura'],
  'Economy':          ['economia','economy','euro','inflacion','inflation','mercat','market','empresa','startup','turismo','tourism','hotel','housing','alquiler','rent','bolsa'],
  'Technology':       ['tecnologia','technology',' ai ','inteligencia artificial','startup','app','digital','cyber','robot','innovation','tech','software'],
  'World':            ['ukraine','russia','trump','usa','america','china','europe','nato','climate','gaza','israel','war','guerra','mundial','global','biden'],
};

function classifyTopic(title: string, description: string): Topic {
  const text = (title + ' ' + description).toLowerCase();
  const hasKeyword = (kw: string) => new RegExp(`\\b${kw.trim()}\\b`, 'i').test(text);

  const worldScore = TOPIC_KEYWORDS['World'].reduce((acc, kw) => acc + (hasKeyword(kw) ? 1 : 0), 0);
  if (worldScore > 0) return 'World';

  const spainScore = TOPIC_KEYWORDS['Spain'].reduce((acc, kw) => acc + (hasKeyword(kw) ? 1 : 0), 0);
  const catScore = TOPIC_KEYWORDS['Catalunya'].reduce((acc, kw) => acc + (hasKeyword(kw) ? 1 : 0), 0);
  
  if (spainScore > 0 && catScore === 0) return 'Spain';

  let bestTopic: Topic = 'World'; 
  let bestScore = 0;
  for (const t of TOPIC_ORDER) {
    if (t === 'World') continue; 
    const score = TOPIC_KEYWORDS[t].reduce((acc, kw) => acc + (hasKeyword(kw) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; bestTopic = t; }
  }
  return bestTopic;
}

const FALLBACK_IMAGES: Record<Topic, string> = {
  'Barcelona': 'https://images.unsplash.com/photo-1583422409516-15ec0cb65f24?w=600&q=80',
  'Catalunya': 'https://images.unsplash.com/photo-1629851177651-7667d023b497?w=600&q=80',
  'Spain': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80',
  'Politics': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80',
  'Sports': 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=600&q=80',
  'Culture & Events': 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80',
  'Economy': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
  'Technology': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
  'World': 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=600&q=80',
};

function extractText(xml: string, tag: string): string {
  const c = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'));
  if (c) return c[1].trim();
  const p = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i'));
  if (p) return p[1].trim();
  return '';
}

function extractImage(xml: string): string {
  return (
    xml.match(/<enclosure[^>]+url="([^"]+)"[^>]+type="image[^"]*"/i)?.[1] ||
    xml.match(/<enclosure[^>]+type="image[^"]*"[^>]+url="([^"]+)"/i)?.[1] ||
    xml.match(/<media:content[^>]+url="([^"]+)"/i)?.[1] ||
    xml.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1] ||
    xml.match(/<img[^>]+src="([^"]+)"/i)?.[1] || ''
  );
}

function isDuplicate(title: string, existing: Article[]): boolean {
  const norm = title.toLowerCase().replace(/[^a-z0-9 ]/g,'').split(' ').filter(x=>x.length>3);
  if (norm.length === 0) return false;
  for (const a of existing) {
    const normA = a.title.toLowerCase().replace(/[^a-z0-9 ]/g,'').split(' ').filter(x=>x.length>3);
    const intersect = norm.filter(w => normA.includes(w));
    if (intersect.length / Math.min(norm.length, normA.length) > 0.6) return true;
  }
  return false;
}

const BREAKING_KW = ['breaking','urgente','última hora','alerta','just in','flash','muerto','terremoto','incendio','atentado','bomba','tiroteo','crisis'];
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000; // 3 Days

function parseRSSItems(xml: string, source: string, sourceUrl: string, lang: 'EN' | 'ES', forcedTopic?: Topic): Article[] {
  const items: Article[] = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  const domain = new URL(sourceUrl).hostname;
  const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  
  let m;
  while ((m = re.exec(xml)) !== null) {
    const x = m[1];
    const title = extractText(x, 'title');
    if (!title) continue;
    
    // Relevance check (Spam/Weird items)
    const SPAM_KW = ['portada de', 'sponsor', 'publicidad', 'horóscopo', 'sorteo', 'oferta', 'podcast', 'patrocinado'];
    if (SPAM_KW.some(k => title.toLowerCase().includes(k))) continue;
    
    const pubDateStr = extractText(x, 'pubDate') || '';
    if (pubDateStr) {
      const d = new Date(pubDateStr);
      if (!isNaN(d.getTime()) && Date.now() - d.getTime() > MAX_AGE_MS) continue; // Drop old news
    }

    const link = extractText(x, 'link') || x.match(/<link\s+href="([^"]+)"/)?.[1] || sourceUrl;
    const desc = extractText(x, 'description').replace(/<[^>]+>/g, '').substring(0, 220);
    const breaking = BREAKING_KW.some(k => title.toLowerCase().includes(k));
    
    if (isDuplicate(title, items)) continue; // Deep deduplication within feed

    const topic = forcedTopic || classifyTopic(title, desc);
    let image = extractImage(x);
    if (!image || image.length < 5) image = FALLBACK_IMAGES[topic];
    
    items.push({ title, link, description: desc, pubDate: pubDateStr, source, topic, sourceUrl, image, favicon, breaking, lang });
  }
  return items;
}

const RSS_SOURCES = [
  // BARCELONA
  { name: 'Betevé', url: 'https://beteve.cat/rss', sourceUrl: 'https://beteve.cat', topic: 'Barcelona' as Topic, lang: 'ES' as const },
  { name: 'La Vanguardia BCN', url: 'https://www.lavanguardia.com/rss/local/barcelona.xml', sourceUrl: 'https://www.lavanguardia.com', topic: 'Barcelona' as Topic, lang: 'ES' as const },
  { name: 'El Periódico BCN', url: 'https://www.elperiodico.com/es/rss/barcelona/rss.xml', sourceUrl: 'https://www.elperiodico.com', topic: 'Barcelona' as Topic, lang: 'ES' as const },
  // CATALUNYA
  { name: 'Nació Digital', url: 'https://www.naciodigital.cat/rss', sourceUrl: 'https://www.naciodigital.cat', topic: 'Catalunya' as Topic, lang: 'ES' as const },
  { name: 'Ara', url: 'https://www.ara.cat/rss/', sourceUrl: 'https://www.ara.cat', topic: 'Catalunya' as Topic, lang: 'ES' as const },
  { name: '20 Minutos Catalunya', url: 'https://www.20minutos.es/rss/cataluna/', sourceUrl: 'https://www.20minutos.es', topic: 'Catalunya' as Topic, lang: 'ES' as const },
  // SPAIN
  { name: '20 Minutos Nacional', url: 'https://www.20minutos.es/rss/nacional/', sourceUrl: 'https://www.20minutos.es', topic: 'Spain' as Topic, lang: 'ES' as const },
  { name: 'El Mundo España', url: 'https://e00-elmundo.uecdn.es/elmundo/rss/espana.xml', sourceUrl: 'https://www.elmundo.es', topic: 'Spain' as Topic, lang: 'ES' as const },
  // POLITICS
  { name: 'La Vanguardia Política', url: 'https://www.lavanguardia.com/rss/politica.xml', sourceUrl: 'https://www.lavanguardia.com', topic: 'Politics' as Topic, lang: 'ES' as const },
  { name: '20 Minutos Política', url: 'https://www.20minutos.es/rss/nacional/', sourceUrl: 'https://www.20minutos.es', topic: 'Politics' as Topic, lang: 'ES' as const },
  // SPORTS
  { name: 'Marca', url: 'https://e00-marca.uecdn.es/rss/portada.xml', sourceUrl: 'https://www.marca.com', topic: 'Sports' as Topic, lang: 'ES' as const },
  { name: '20 Minutos Deportes', url: 'https://www.20minutos.es/rss/deportes/', sourceUrl: 'https://www.20minutos.es', topic: 'Sports' as Topic, lang: 'ES' as const },
  { name: 'AS', url: 'https://as.com/rss/tags/ultimas_noticias.xml', sourceUrl: 'https://as.com', topic: 'Sports' as Topic, lang: 'ES' as const },
  // CULTURE & EVENTS
  { name: 'La Vanguardia Cultura', url: 'https://www.lavanguardia.com/rss/cultura.xml', sourceUrl: 'https://www.lavanguardia.com', topic: 'Culture & Events' as Topic, lang: 'ES' as const },
  { name: 'El Periódico Ocio', url: 'https://www.elperiodico.com/es/rss/ocio-y-cultura/rss.xml', sourceUrl: 'https://www.elperiodico.com', topic: 'Culture & Events' as Topic, lang: 'ES' as const },
  // ECONOMY
  { name: 'Expansión', url: 'https://e00-expansion.uecdn.es/rss/portada.xml', sourceUrl: 'https://www.expansion.com', topic: 'Economy' as Topic, lang: 'ES' as const },
  { name: 'La Vanguardia Economía', url: 'https://www.lavanguardia.com/rss/economia.xml', sourceUrl: 'https://www.lavanguardia.com', topic: 'Economy' as Topic, lang: 'ES' as const },
  { name: 'Cinco Días', url: 'https://cincodias.elpais.com/arc/outboundfeeds/rss/?outputType=xml', sourceUrl: 'https://cincodias.elpais.com', topic: 'Economy' as Topic, lang: 'ES' as const },
  // TECHNOLOGY
  { name: '20 Minutos Tecnología', url: 'https://www.20minutos.es/rss/tecnologia/', sourceUrl: 'https://www.20minutos.es', topic: 'Technology' as Topic, lang: 'ES' as const },
  { name: 'La Vanguardia Tecnología', url: 'https://www.lavanguardia.com/rss/tecnologia.xml', sourceUrl: 'https://www.lavanguardia.com', topic: 'Technology' as Topic, lang: 'ES' as const },
  { name: 'El Periódico Tecnología', url: 'https://www.elperiodico.com/es/rss/tecnologia/rss.xml', sourceUrl: 'https://www.elperiodico.com', topic: 'Technology' as Topic, lang: 'ES' as const },
  { name: 'Hipertextual', url: 'https://hipertextual.com/feed', sourceUrl: 'https://hipertextual.com', topic: 'Technology' as Topic, lang: 'ES' as const },
  { name: 'Microsiervos', url: 'https://www.microsiervos.com/index.xml', sourceUrl: 'https://www.microsiervos.com', topic: 'Technology' as Topic, lang: 'ES' as const },
  // WORLD
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', sourceUrl: 'https://www.bbc.com/news', topic: 'World' as Topic, lang: 'EN' as const },
  { name: 'NYT World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', sourceUrl: 'https://www.nytimes.com', topic: 'World' as Topic, lang: 'EN' as const },
  { name: 'CNN', url: 'http://rss.cnn.com/rss/edition_world.rss', sourceUrl: 'https://edition.cnn.com', topic: 'World' as Topic, lang: 'EN' as const },
  { name: 'The Local Spain', url: 'https://www.thelocal.es/feed/', sourceUrl: 'https://www.thelocal.es', topic: 'Barcelona' as Topic, lang: 'EN' as const }
];

const FALLBACK_ARTICLES: Article[] = [
  {
    title: 'Gothic Quarter to host massive local artisan market this weekend',
    description: 'Over 100 local makers will gather in the heart of Barcelona to showcase sustainable fashion, jewelry, and street food.',
    link: 'https://gobarcelona.es/news/local-market',
    pubDate: new Date().toISOString(),
    source: 'GoBarcelona',
    topic: 'Barcelona',
    sourceUrl: 'https://gobarcelona.es',
    image: 'https://images.unsplash.com/photo-1583422409516-15ec0cb65f24?w=800&q=80',
    favicon: 'https://gobarcelona.es/favicon.ico',
    breaking: true,
    lang: 'EN'
  },
  {
    title: 'Sants neighborhood prepares for annual Festa Major celebrations',
    description: 'Expect decorated streets, live music, and castellers as Sants kicks off its biggest event of the year.',
    link: 'https://gobarcelona.es/news/sants-festa',
    pubDate: new Date(Date.now() - 3600000).toISOString(),
    source: 'GoBarcelona',
    topic: 'Culture & Events',
    sourceUrl: 'https://gobarcelona.es',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
    favicon: 'https://gobarcelona.es/favicon.ico',
    breaking: false,
    lang: 'EN'
  },
  {
    title: 'FC Barcelona confirms new stadium progress ahead of 2026 return',
    description: 'Work accelerates at Spotify Camp Nou as the club aims for a full capacity return by the start of next season.',
    link: 'https://gobarcelona.es/news/barca-stadium',
    pubDate: new Date(Date.now() - 14400000).toISOString(),
    source: 'Barça Daily',
    topic: 'Sports',
    sourceUrl: 'https://gobarcelona.es',
    image: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80',
    favicon: 'https://gobarcelona.es/favicon.ico',
    breaking: false,
    lang: 'EN'
  },
  {
    title: 'New international business hub to open in @22 district',
    description: 'A dedicated space for tech startups and international entrepreneurs will open in Poble Nou this October.',
    link: 'https://gobarcelona.es/news/tech-hub',
    pubDate: new Date(Date.now() - 86400000).toISOString(),
    source: 'BCN Economy',
    topic: 'Economy',
    sourceUrl: 'https://gobarcelona.es',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    favicon: 'https://gobarcelona.es/favicon.ico',
    breaking: false,
    lang: 'EN'
  }
];

export async function GET() {
  const articles: Article[] = [...FALLBACK_ARTICLES];
  const errors: string[] = [];

  const results = await Promise.allSettled(
    RSS_SOURCES.map(async (src) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      try {
        const res = await fetch(src.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CNN-Grade-Aggregator/2.0; +http://gobarcelona.com)' },
          next: { revalidate: 600 }, // Deep cache updates every 10 mins
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return parseRSSItems(await res.text(), src.name, src.sourceUrl, src.lang, src.topic);
      } catch (err: any) {
        clearTimeout(timeoutId);
        throw err;
      }
    })
  );

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') articles.push(...r.value);
    else errors.push(`${RSS_SOURCES[i].name}: ${(r.reason as Error)?.message}`);
  });

  // Global Deduplication Engine
  const deduplicated: Article[] = [];
  for (const a of articles) {
    if (!isDuplicate(a.title, deduplicated)) {
      deduplicated.push(a);
    }
  }

  // Sort by breaking status and then globally by date
  deduplicated.sort((a, b) => {
    if (a.breaking && !b.breaking) return -1;
    if (!a.breaking && b.breaking) return 1;
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
  });

  return NextResponse.json({ articles: deduplicated, errors, fetchedAt: new Date().toISOString() });
}
