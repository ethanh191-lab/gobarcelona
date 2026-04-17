-- GoBarcelona Beer Map Schema Update
-- Run this in your Supabase SQL Editor

ALTER TABLE places 
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS opening_hours jsonb,
ADD COLUMN IF NOT EXISTS terrace boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS dog_friendly boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS student_friendly_prices boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS friendly_for_big_groups boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sports_broadcasting boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS open_till_late boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS social_club boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rooftop boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS beer_price_05l numeric,
ADD COLUMN IF NOT EXISTS tags text[]; -- Array for flexible attributes

-- Update views/indexing for performance
CREATE INDEX IF NOT EXISTS idx_places_neighborhood ON places(neighborhood);
CREATE INDEX IF NOT EXISTS idx_places_beer_price ON places(beer_price_05l);
