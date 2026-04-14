import { NextResponse } from 'next/server';
import { TOPIC_ORDER, CATEGORY_IMAGES, type Topic, type Article } from '../../../lib/news-config';

export type { Article };

// ─── Keyword Classifier ───
const TOPIC_KEYWORDS: Record<Topic, string[]> = {
  'Barcelona':  ['barcelona','bcn','ajuntament','eixample','gracia','born','barceloneta','poblenou','sagrada familia','rambla','metro','tram','renfe','rodalies'],
  'Events':     ['event','concert','festival','fiesta','party','opening','launch','inauguraci','show','expo','exhibition','exposicion','gig'],
  'Free':       ['free','gratis','gratuit','open door','jornada de puertas','entrada libre','no cost','volunteer','voluntari'],
  'Markets':    ['market','mercat','mercado','flea','encants','sant antoni','pop-up','food truck','street food','artisan','fira'],
  'Weather':    ['weather','tiempo','meteo','lluvia','rain','sol','sun','temperatura','temperature','forecast','previsi','calor','heat','storm','tormenta','wind','viento'],
  'Festivals':  ['primavera sound','sonar','festa major','la mercè','sant joan','revetlla','carnival','carnaval','verbena','casteller','correfoc','beach party'],
  'Sports':     ['barça','fc barcelona','barca','espanyol','real madrid','champions','liga','gol','goal','futbol','football','tennis','moto gp','basket','lewandowski','yamal','pedri','lamine'],
  'Culture':    ['music','musica','art','film','cinema','theatre','teatro','museum','museo','exposicion','exhibition','gallery','galeria','book','libro','literatura','opera'],
  'Nightlife':  ['nightlife','club','discoteca','rooftop','bar','cocktail','dj','techno','razzmatazz','pacha','opium','moog','sala','after','late night','noche'],
  'Catalunya':  ['cataluny','catalan','generalitat','junts','esquerra','cup','puigdemont','independen','girona','tarragona','psc','parlament','mossos'],
  'Spain':      ['españa','spain','madrid','gobierno','sanchez','congreso','senado','partido popular','psoe','vox','sumar','moncloa','economy','economia','euro','inflacion'],
};

function classifyTopic(title: string, description: string): Topic {
  const text = (title + ' ' + description).toLowerCase();
  const hasKeyword = (kw: string) => text.includes(kw.trim().toLowerCase());

  let bestTopic: Topic = 'Barcelona'; // default to Barcelona for local relevance
  let bestScore = 0;

  for (const t of TOPIC_ORDER) {
    const keywords = TOPIC_KEYWORDS[t];
    if (!keywords) continue;
    const score = keywords.reduce((acc, kw) => acc + (hasKeyword(kw) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; bestTopic = t; }
  }
  return bestTopic;
}

// ─── XML Helpers ───
function extractText(xml: string, tag: string): string {
  const c = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'));
  if (c) return c[1].trim();
  const p = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i'));
  if (p) return p[1].trim();
  return '';
}

function extractImage(xml: string): string {
  return (
    xml.match(/<enclosure[^>]+url="([^"]+)"[^>]+type="image[^"]*/i)?.[1] ||
    xml.match(/<enclosure[^>]+type="image[^"]*"[^>]+url="([^"]+)"/i)?.[1] ||
    xml.match(/<media:content[^>]+url="([^"]+)"/i)?.[1] ||
    xml.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1] ||
    xml.match(/<img[^>]+src="([^"]+)"/i)?.[1] || ''
  );
}

function isDuplicate(title: string, existing: Article[]): boolean {
  const norm = title.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(x => x.length > 3);
  if (norm.length === 0) return false;
  for (const a of existing) {
    const normA = a.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(x => x.length > 3);
    const intersect = norm.filter(w => normA.includes(w));
    if (intersect.length / Math.min(norm.length, normA.length) > 0.6) return true;
  }
  return false;
}

const BREAKING_KW = ['breaking', 'urgente', 'última hora', 'alerta', 'just in', 'flash'];
const SPAM_KW = ['portada de', 'sponsor', 'publicidad', 'horóscopo', 'sorteo', 'oferta', 'podcast', 'patrocinado'];
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

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
    if (SPAM_KW.some(k => title.toLowerCase().includes(k))) continue;

    const pubDateStr = extractText(x, 'pubDate') || '';
    if (pubDateStr) {
      const d = new Date(pubDateStr);
      if (!isNaN(d.getTime()) && Date.now() - d.getTime() > MAX_AGE_MS) continue;
    }

    const link = extractText(x, 'link') || x.match(/<link\s+href="([^"]+)"/)?.[1] || sourceUrl;
    const desc = extractText(x, 'description').replace(/<[^>]+>/g, '').substring(0, 220);
    const breaking = BREAKING_KW.some(k => title.toLowerCase().includes(k));

    if (isDuplicate(title, items)) continue;

    const topic = forcedTopic || classifyTopic(title, desc);
    let image = extractImage(x);
    if (!image || image.length < 5) image = CATEGORY_IMAGES[topic] || '';

    items.push({ title, link, description: desc, pubDate: pubDateStr, source, topic, sourceUrl, image, favicon, breaking, lang });
  }
  return items;
}

// ─── RSS Sources ───
const RSS_SOURCES = [
  // BARCELONA
  { name: 'Betevé', url: 'https://beteve.cat/rss', sourceUrl: 'https://beteve.cat', topic: 'Barcelona' as Topic, lang: 'ES' as const },
  { name: 'La Vanguardia BCN', url: 'https://www.lavanguardia.com/rss/local/barcelona.xml', sourceUrl: 'https://www.lavanguardia.com', topic: 'Barcelona' as Topic, lang: 'ES' as const },
  { name: 'El Periódico BCN', url: 'https://www.elperiodico.com/es/rss/barcelona/rss.xml', sourceUrl: 'https://www.elperiodico.com', topic: 'Barcelona' as Topic, lang: 'ES' as const },
  { name: 'The Local Spain', url: 'https://www.thelocal.es/feed/', sourceUrl: 'https://www.thelocal.es', topic: 'Barcelona' as Topic, lang: 'EN' as const },
  // CATALUNYA
  { name: 'Nació Digital', url: 'https://www.naciodigital.cat/rss', sourceUrl: 'https://www.naciodigital.cat', topic: 'Catalunya' as Topic, lang: 'ES' as const },
  { name: 'Ara', url: 'https://www.ara.cat/rss/', sourceUrl: 'https://www.ara.cat', topic: 'Catalunya' as Topic, lang: 'ES' as const },
  { name: '20 Minutos Catalunya', url: 'https://www.20minutos.es/rss/cataluna/', sourceUrl: 'https://www.20minutos.es', topic: 'Catalunya' as Topic, lang: 'ES' as const },
  // SPAIN
  { name: '20 Minutos Nacional', url: 'https://www.20minutos.es/rss/nacional/', sourceUrl: 'https://www.20minutos.es', topic: 'Spain' as Topic, lang: 'ES' as const },
  // SPORTS
  { name: 'Marca', url: 'https://e00-marca.uecdn.es/rss/portada.xml', sourceUrl: 'https://www.marca.com', topic: 'Sports' as Topic, lang: 'ES' as const },
  { name: '20 Minutos Deportes', url: 'https://www.20minutos.es/rss/deportes/', sourceUrl: 'https://www.20minutos.es', topic: 'Sports' as Topic, lang: 'ES' as const },
  // CULTURE & EVENTS
  { name: 'La Vanguardia Cultura', url: 'https://www.lavanguardia.com/rss/cultura.xml', sourceUrl: 'https://www.lavanguardia.com', topic: 'Culture' as Topic, lang: 'ES' as const },
  { name: 'El Periódico Ocio', url: 'https://www.elperiodico.com/es/rss/ocio-y-cultura/rss.xml', sourceUrl: 'https://www.elperiodico.com', topic: 'Events' as Topic, lang: 'ES' as const },
  // WORLD NEWS (EN)
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', sourceUrl: 'https://www.bbc.com/news', topic: 'Spain' as Topic, lang: 'EN' as const },
];

// ─── Fallback Articles ───
const FALLBACK_ARTICLES: Article[] = [
  {
    title: 'Gothic Quarter to host massive local artisan market this weekend',
    description: 'Over 100 local makers will gather in the heart of Barcelona to showcase sustainable fashion, jewelry, and street food. Free entry all weekend.',
    link: 'https://gobarcelona.es/news/local-market',
    pubDate: new Date().toISOString(),
    source: 'GoBarcelona',
    topic: 'Markets',
    sourceUrl: 'https://gobarcelona.es',
    image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80',
    favicon: '/favicon.svg',
    breaking: true,
    lang: 'EN',
  },
  {
    title: 'Free outdoor cinema returns to Montjuïc every Thursday this summer',
    description: 'Sala Montjuïc kicks off its annual open-air film series with live music and picnic areas. Bring a blanket and enjoy classic and indie films under the stars.',
    link: 'https://gobarcelona.es/news/montjuic-cinema',
    pubDate: new Date(Date.now() - 1800000).toISOString(),
    source: 'GoBarcelona',
    topic: 'Free',
    sourceUrl: 'https://gobarcelona.es',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    favicon: '/favicon.svg',
    breaking: false,
    lang: 'EN',
  },
  {
    title: 'Sants neighborhood prepares for annual Festa Major celebrations',
    description: 'Expect decorated streets, live music, and castellers as Sants kicks off its biggest event of the year.',
    link: 'https://gobarcelona.es/news/sants-festa',
    pubDate: new Date(Date.now() - 3600000).toISOString(),
    source: 'GoBarcelona',
    topic: 'Festivals',
    sourceUrl: 'https://gobarcelona.es',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
    favicon: '/favicon.svg',
    breaking: false,
    lang: 'EN',
  },
  {
    title: 'FC Barcelona confirms new stadium progress ahead of 2026 return',
    description: 'Work accelerates at Spotify Camp Nou as the club aims for a full capacity return by the start of next season.',
    link: 'https://gobarcelona.es/news/barca-stadium',
    pubDate: new Date(Date.now() - 14400000).toISOString(),
    source: 'Barça Daily',
    topic: 'Sports',
    sourceUrl: 'https://gobarcelona.es',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80',
    favicon: '/favicon.svg',
    breaking: false,
    lang: 'EN',
  },
  {
    title: 'Weekend weather forecast: 28°C and sunshine across Barcelona',
    description: 'Perfect beach weather expected from Friday to Sunday. Light wind, no rain, UV index high — SPF 50 recommended.',
    link: 'https://gobarcelona.es/news/weekend-weather',
    pubDate: new Date(Date.now() - 7200000).toISOString(),
    source: 'BCN Weather',
    topic: 'Weather',
    sourceUrl: 'https://gobarcelona.es',
    image: 'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?w=800&q=80',
    favicon: '/favicon.svg',
    breaking: false,
    lang: 'EN',
  },
  {
    title: 'New rooftop bar opens in El Born with €3 happy hour beers until midnight',
    description: 'La Terraza del Born promises city views, live DJs on weekends, and the cheapest rooftop drinks in the neighborhood.',
    link: 'https://gobarcelona.es/news/rooftop-born',
    pubDate: new Date(Date.now() - 28800000).toISOString(),
    source: 'GoBarcelona',
    topic: 'Nightlife',
    sourceUrl: 'https://gobarcelona.es',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
    favicon: '/favicon.svg',
    breaking: false,
    lang: 'EN',
  },
];

// ─── API Handler ───
export async function GET() {
  const articles: Article[] = [...FALLBACK_ARTICLES];
  const errors: string[] = [];

  const results = await Promise.allSettled(
    RSS_SOURCES.map(async (src) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      try {
        const res = await fetch(src.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GoBarcelona/3.0; +http://gobarcelona.es)' },
          next: { revalidate: 600 },
          signal: controller.signal,
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

  // Global deduplication
  const deduplicated: Article[] = [];
  for (const a of articles) {
    if (!isDuplicate(a.title, deduplicated)) {
      deduplicated.push(a);
    }
  }

  // Sort: breaking first, then by date
  deduplicated.sort((a, b) => {
    if (a.breaking && !b.breaking) return -1;
    if (!a.breaking && b.breaking) return 1;
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
  });

  return NextResponse.json({ articles: deduplicated, errors, fetchedAt: new Date().toISOString() });
}
