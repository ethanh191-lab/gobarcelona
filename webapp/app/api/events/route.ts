import { NextResponse } from 'next/server';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  link: string;
  image: string;
  category: 'Music' | 'Art' | 'Festival' | 'Free' | 'Opening' | 'Other';
  source: string;
}

const EVENT_SOURCES = [
  { name: 'Metropolitan', url: 'https://www.barcelona-metropolitan.com/feed/', type: 'rss' },
  { name: 'El Periódico', url: 'https://www.elperiodico.com/es/rss/ocio-y-cultura/rss.xml', type: 'rss' },
  { name: 'BCN Agenda', url: 'https://ajuntament.barcelona.cat/agenda/en/rss/rss.xml', type: 'rss' },
];

function classifyEvent(title: string, desc: string): Event['category'] {
  const text = (title + ' ' + desc).toLowerCase();
  if (text.includes('gratuita') || text.includes('gratis') || text.includes('free')) return 'Free';
  if (text.includes('festival') || text.includes('festa major') || text.includes('party')) return 'Festival';
  if (text.includes('inauguracion') || text.includes('opening') || text.includes('exposicion') || text.includes('exhibition')) return 'Opening';
  if (text.includes('concierto') || text.includes('concert') || text.includes('musica') || text.includes('dj')) return 'Music';
  if (text.includes('arte') || text.includes('art') || text.includes('museo') || text.includes('museum')) return 'Art';
  return 'Other';
}

function extractText(xml: string, tag: string): string {
  const re = new RegExp(`<(${tag}|\\w+:${tag})[^>]*>([\\s\\S]*?)<\\/\\1>`, 'i');
  const match = xml.match(re);
  if (!match) return '';
  let content = match[2].trim();
  if (content.startsWith('<![CDATA[')) {
    content = content.substring(9, content.length - 3).trim();
  }
  return content;
}

function extractImage(xml: string): string {
  return (
    xml.match(/<enclosure[^>]+url="([^"]+)"/i)?.[1] ||
    xml.match(/<media:content[^>]+url="([^"]+)"/i)?.[1] ||
    xml.match(/<img[^>]+src="([^"]+)"/i)?.[1] ||
    ''
  );
}

// Fixed fallback events with spread dates for April 2026
const FALLBACK_EVENTS: Event[] = [
  {
    id: 'f1', title: 'Rosalía: MOTOMAMI Special Night', date: '2026-04-13T21:00:00Z',
    venue: 'Palau Sant Jordi', description: 'A surprise pop-up concert from Barcelona\'s biggest global star. Pure urban flamence energy.',
    link: 'https://www.rosalia.com', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=800',
    category: 'Music', source: 'Curated'
  },
  {
    id: 'f2', title: 'Poblenou Open Studios', date: '2026-04-18T10:00:00Z',
    venue: 'Poblenou Art District', description: 'Over 50 artist studios open their doors for one weekend only. Art, workshops, and drinks.',
    link: 'https://poblenouurbandistrict.com/', image: 'https://images.unsplash.com/photo-1460661419201-fd4cecea8f82?auto=format&fit=crop&q=80&w=800',
    category: 'Art', source: 'Curated'
  },
  {
    id: 'f3', title: 'Barcelona Beer Festival 2026', date: '2026-04-20T12:00:00Z',
    venue: 'Fira Barcelona', description: 'Southern Europe\'s biggest craft beer celebration with over 600 varieties.',
    link: 'https://barcelonabeerfestival.com', image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&q=80&w=800',
    category: 'Festival', source: 'Curated'
  },
  {
    id: 'f4', title: 'Sant Jordi 2026', date: '2026-04-23T08:00:00Z',
    venue: 'Whole City', description: 'The day of books and roses. The most beautiful local tradition on the streets of BCN.',
    link: 'https://www.barcelona.cat', image: 'https://images.unsplash.com/photo-1518134454655-4654366fb816?auto=format&fit=crop&q=80&w=800',
    category: 'Festival', source: 'Curated'
  },
  {
    id: 'f5', title: 'Brunch Electronik', date: '2026-04-26T14:00:00Z',
    venue: 'Jardins de Joan Brossa', description: 'Outdoor electronic music, food trucks, and family activities on Montjuïc hill.',
    link: 'https://brunchelectronik.com', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
    category: 'Music', source: 'Curated'
  }
];

export async function GET() {
  const allEvents: Event[] = [...FALLBACK_EVENTS];
  
  try {
    const results = await Promise.allSettled(
      EVENT_SOURCES.map(async (src) => {
        const res = await fetch(src.url, { 
          next: { revalidate: 3600 },
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GoBarcelona/1.0)' }
        });
        if (!res.ok) return [];
        
        const xml = await res.text();
        const items: Event[] = [];
        const re = /<item>([\s\S]*?)<\/item>/g;
        let m;
        while ((m = re.exec(xml)) !== null && items.length < 15) {
          const x = m[1];
          const title = extractText(x, 'title');
          if (!title || title.includes('Protected:')) continue;
          
          const description = extractText(x, 'description').replace(/<[^>]+>/g, '').substring(0, 180);
          const link = extractText(x, 'link');
          const pubDate = extractText(x, 'pubDate') || extractText(x, 'date') || new Date().toISOString();
          
          // Try to spread out aggregated dates if they all cluster on the same day
          let eventDate = new Date(pubDate);
          if (eventDate.toDateString() === new Date().toDateString()) {
            // Add random days to spread them out logically in the future
            eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 7) + 1);
          }

          const image = extractImage(x) || 'https://images.unsplash.com/photo-1514525253361-bee8a19740c1?auto=format&fit=crop&q=80&w=800';
          
          items.push({
            id: Math.random().toString(36).substring(7),
            title,
            description,
            date: eventDate.toISOString(),
            venue: 'Barcelona Center',
            link,
            image,
            category: classifyEvent(title, description),
            source: src.name
          });
        }
        return items;
      })
    );

    results.forEach(r => {
      if (r.status === 'fulfilled') allEvents.push(...r.value);
    });

  } catch (error) {
    console.error('Events Fetch Error:', error);
  }

  const unique = Array.from(new Map(allEvents.map(ev => [ev.title, ev])).values());
  unique.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return NextResponse.json({ 
    events: unique,
    count: unique.length,
    updatedAt: new Date().toISOString()
  });
}
