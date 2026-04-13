// Shared news types and config — safe to import in both client and server

export type Topic =
  | 'Barcelona'
  | 'Catalunya'
  | 'Spain'
  | 'Politics'
  | 'Sports'
  | 'Culture & Events'
  | 'Economy'
  | 'Technology'
  | 'World';

export const TOPIC_ORDER: Topic[] = [
  'Barcelona',
  'Catalunya',
  'Spain',
  'Politics',
  'Sports',
  'Culture & Events',
  'Economy',
  'Technology',
  'World',
];

export const TOPIC_META: Record<Topic, { color: string; bg: string }> = {
  'Barcelona':        { color: '#E63946', bg: 'rgba(230,57,70,0.08)' },
  'Catalunya':        { color: '#c97d2a', bg: 'rgba(244,162,97,0.08)' },
  'Spain':            { color: '#2E4057', bg: 'rgba(46,64,87,0.08)' },
  'Politics':         { color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  'Sports':           { color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
  'Culture & Events': { color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)' },
  'Economy':          { color: '#b45309', bg: 'rgba(180,83,9,0.08)' },
  'Technology':       { color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
  'World':            { color: '#475569', bg: 'rgba(71,85,105,0.08)' },
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
