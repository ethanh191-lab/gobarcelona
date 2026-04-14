// Shared news types and config — safe to import in both client and server

export type Topic =
  | 'Barcelona'
  | 'Events'
  | 'Free'
  | 'Markets'
  | 'Weather'
  | 'Festivals'
  | 'Sports'
  | 'Culture'
  | 'Nightlife'
  | 'Catalunya'
  | 'Spain';

export const TOPIC_ORDER: Topic[] = [
  'Barcelona',
  'Events',
  'Free',
  'Markets',
  'Weather',
  'Festivals',
  'Sports',
  'Culture',
  'Nightlife',
  'Catalunya',
  'Spain',
];

export const TOPIC_META: Record<Topic, { color: string; bg: string }> = {
  'Barcelona':  { color: '#E63946', bg: 'rgba(230,57,70,0.10)' },
  'Events':     { color: '#F4A261', bg: 'rgba(244,162,97,0.10)' },
  'Free':       { color: '#1D9E75', bg: 'rgba(29,158,117,0.10)' },
  'Markets':    { color: '#EF9F27', bg: 'rgba(239,159,39,0.10)' },
  'Weather':    { color: '#378ADD', bg: 'rgba(55,138,221,0.10)' },
  'Festivals':  { color: '#7F77DD', bg: 'rgba(127,119,221,0.10)' },
  'Sports':     { color: '#2E4057', bg: 'rgba(46,64,87,0.15)' },
  'Culture':    { color: '#D4537E', bg: 'rgba(212,83,126,0.10)' },
  'Nightlife':  { color: '#9333ea', bg: 'rgba(147,51,234,0.10)' },
  'Catalunya':  { color: '#c97d2a', bg: 'rgba(201,125,42,0.10)' },
  'Spain':      { color: '#475569', bg: 'rgba(71,85,105,0.10)' },
};

// Category fallback images (Unsplash)
export const CATEGORY_IMAGES: Record<Topic, string> = {
  'Events':     'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
  'Festivals':  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
  'Barcelona':  'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80',
  'Weather':    'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?w=800&q=80',
  'Sports':     'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80',
  'Markets':    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80',
  'Culture':    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
  'Free':       'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'Nightlife':  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
  'Catalunya':  'https://images.unsplash.com/photo-1629851177651-7667d023b497?w=800&q=80',
  'Spain':      'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80',
};

export type Article = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  topic: Topic;
  sourceUrl: string;
  image: string;
  favicon: string;
  breaking: boolean;
  lang: 'EN' | 'ES';
};
