-- 1. Create the bars table if it doesn't exist
CREATE TABLE IF NOT EXISTS bars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    neighborhood TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    beer_price_05l DECIMAL(4,2),
    rating DECIMAL(2,1),
    review_count INTEGER DEFAULT 0,
    terrace BOOLEAN DEFAULT false,
    sports_broadcasting BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'open', -- 'open', 'temporarily_closed', 'permanently_closed'
    
    -- Strategic Pivot Fields
    happy_hour_start TIME,
    happy_hour_end TIME,
    happy_hour_price DECIMAL(4,2),
    beers_on_tap TEXT[],
    student_discount BOOLEAN DEFAULT false,
    student_price DECIMAL(4,2),
    opened_at DATE DEFAULT CURRENT_DATE,
    closure_note TEXT,
    reopening_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert sample data for testing
INSERT INTO bars (name, address, neighborhood, lat, lng, beer_price_05l, rating, terrace, sports_broadcasting, happy_hour_start, happy_hour_end, happy_hour_price, beers_on_tap, student_discount, student_price)
VALUES 
('The Cheap Pint', 'Carrer de la Llibreteria, 21', 'Gothic Quarter', 41.3839, 2.1770, 2.50, 4.5, true, true, '17:00', '19:00', 1.50, ARRAY['Estrella Damm', 'Moritz'], true, 2.00),
('Born Beer Hub', 'Carrer del Rec, 12', 'El Born', 41.3849, 2.1849, 3.20, 4.2, false, false, '18:00', '20:00', 2.50, ARRAY['Voll-Damm', 'Heineken'], false, NULL),
('Eixample Social', 'Carrer de Mallorca, 200', 'Eixample', 41.3911, 2.1637, 4.50, 4.8, true, false, NULL, NULL, NULL, ARRAY['Estrella Galicia', 'Mahou'], true, 3.50),
('Gràcia Hidden Gem', 'Carrer de Torrent de l''Olla, 50', 'Gràcia', 41.4033, 2.1557, 2.80, 4.6, false, true, '16:00', '18:00', 2.00, ARRAY['San Miguel', 'Estrella Damm'], false, NULL);

-- 3. Enable RLS (Optional but recommended for Supabase)
ALTER TABLE bars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON bars FOR SELECT USING (true);
