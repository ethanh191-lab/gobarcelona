-- GoBarcelona Beer Map — Complete Database Setup
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS bars (
  id bigserial primary key,
  name text not null,
  address text,
  neighbourhood text,
  lat decimal(9,6),
  lng decimal(9,6),
  website text,
  phone text,
  google_place_id text unique,
  google_rating decimal(2,1),
  google_rating_count integer,
  price_per_500ml decimal(4,2),
  price_confidence text default 'unverified',
  price_last_verified text,
  opening_mon text, opening_tue text, opening_wed text, opening_thu text,
  opening_fri text, opening_sat text, opening_sun text,
  happy_hour_start time, happy_hour_end time, happy_hour_price decimal(4,2),
  beers_on_tap text[],
  has_terrace boolean default false,
  terrace_season text,
  dog_friendly boolean default false,
  sports_tv boolean default false,
  group_friendly boolean default false,
  open_late boolean default false,
  social_club boolean default false,
  rooftop boolean default false,
  student_friendly boolean default false,
  student_discount boolean default false,
  student_price decimal(4,2),
  live_music boolean default false,
  date_spot boolean default false,
  irish_pub boolean default false,
  craft_beer boolean default false,
  beer_hall boolean default false,
  status text default 'open',
  closure_note text,
  reopening_date date,
  opened_at date,
  photo_url text,
  notes text,
  data_source text,
  last_updated text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS beer_prices (
  id uuid primary key default gen_random_uuid(),
  bar_id bigint references bars(id),
  price decimal(4,2) not null,
  size_ml integer default 500,
  type text default 'tap',
  submitted_at timestamptz default now(),
  upvotes integer default 0,
  downvotes integer default 0,
  verified boolean default false
);

CREATE TABLE IF NOT EXISTS bar_adjustment_requests (
  id uuid primary key default gen_random_uuid(),
  bar_id bigint references bars(id),
  field_to_adjust text,
  current_value text,
  suggested_value text,
  note text,
  submitted_at timestamptz default now(),
  status text default 'pending'
);

-- Enable Row Level Security but allow public reads
ALTER TABLE bars ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow public read" ON bars FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public insert to beer_prices" ON beer_prices FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow public read beer_prices" ON beer_prices FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public insert to adjustments" ON bar_adjustment_requests FOR INSERT WITH CHECK (true);
