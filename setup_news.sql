-- GoBarcelona AI News Setup
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS news_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  body text,
  source_url text unique not null,
  source_name text,
  image_url text,
  category text,
  language text,
  original_language text,
  published_at timestamptz not null,
  created_at timestamptz default now(),
  slug text,
  is_breaking boolean default false,
  is_trending boolean default false,
  views integer default 0
);

-- Enable RLS and public read access
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow public read news_articles" ON news_articles FOR SELECT USING (true);
-- We use the service key or server-side supabase client (bypassing RLS) for cron inserts.

-- Also, trending topics if we ever want to populate them separately
CREATE TABLE IF NOT EXISTS trending_topics (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  search_volume integer,
  related_query text,
  detected_at timestamptz default now(),
  geo text,
  used_in_news boolean default false
);
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow public read trending_topics" ON trending_topics FOR SELECT USING (true);
