export type Topic =
  | 'Events'
  | 'Free Things'
  | 'Festivals'
  | 'Markets'
  | 'Weather'
  | 'Sports'
  | 'Culture'
  | 'Nightlife'
  | 'Barcelona'
  | 'Expat'
  | 'Breaking';

export const TOPIC_ORDER: Topic[] = [
  'Events',
  'Free Things',
  'Festivals',
  'Markets',
  'Weather',
  'Sports',
  'Culture',
  'Nightlife',
  'Barcelona',
  'Expat',
  'Breaking'
];

export const TOPIC_META: Record<Topic, { color: string; bg: string }> = {
  'Events':      { color: '#F4A261', bg: 'rgba(244,162,97,0.10)' },
  'Free Things': { color: '#1D9E75', bg: 'rgba(29,158,117,0.10)' },
  'Festivals':   { color: '#7F77DD', bg: 'rgba(127,119,221,0.10)' },
  'Markets':     { color: '#EF9F27', bg: 'rgba(239,159,39,0.10)' },
  'Weather':     { color: '#378ADD', bg: 'rgba(55,138,221,0.10)' },
  'Sports':      { color: '#2E4057', bg: 'rgba(46,64,87,0.15)' },
  'Culture':     { color: '#D4537E', bg: 'rgba(212,83,126,0.10)' },
  'Nightlife':   { color: '#fff',    bg: '#1A1A2E' }, // special border white
  'Barcelona':   { color: '#E63946', bg: 'rgba(230,57,70,0.10)' },
  'Expat':       { color: '#0ea5e9', bg: 'rgba(14,165,233,0.10)' },
  'Breaking':    { color: '#E63946', bg: 'rgba(230,57,70,0.10)' },
};

export const CATEGORY_IMAGES: Record<Topic, string> = {
  'Events':     'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
  'Festivals':  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
  'Barcelona':  'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80',
  'Weather':    'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?w=800&q=80',
  'Sports':     'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80',
  'Markets':    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80',
  'Culture':    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
  'Free Things':'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'Nightlife':  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
  'Expat':      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
  'Breaking':   'https://images.unsplash.com/photo-1583422409516-15ec0cb65f24?w=800&q=80',
};

// Maps to the Supabase Database Row
export type Article = {
  id: string;
  title: string;
  summary: string;
  body: string;
  source_url: string;
  source_name: string;
  image_url: string;
  category: Topic;
  language: string;
  original_language: string;
  published_at: string;
  created_at: string;
  slug: string;
  is_breaking: boolean;
  is_trending: boolean;
  views: number;
};

// Maps to Supabase DB Row for Trending
export type TrendingTopic = {
  id: string;
  topic: string;
  search_volume: number;
  related_query: string;
  detected_at: string;
  geo: string;
  used_in_news: boolean;
};
