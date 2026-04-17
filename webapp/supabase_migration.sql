-- Happy hour
ALTER TABLE bars ADD COLUMN IF NOT EXISTS happy_hour_start time;
ALTER TABLE bars ADD COLUMN IF NOT EXISTS happy_hour_end time;
ALTER TABLE bars ADD COLUMN IF NOT EXISTS happy_hour_price decimal(4,2);

-- Beers on tap
ALTER TABLE bars ADD COLUMN IF NOT EXISTS beers_on_tap text[];

-- Student discount
ALTER TABLE bars ADD COLUMN IF NOT EXISTS student_discount boolean default false;
ALTER TABLE bars ADD COLUMN IF NOT EXISTS student_price decimal(4,2);

-- New opening
ALTER TABLE bars ADD COLUMN IF NOT EXISTS opened_at date;

-- Status and closure
ALTER TABLE bars ADD COLUMN IF NOT EXISTS status text default 'open';
ALTER TABLE bars ADD COLUMN IF NOT EXISTS closure_note text;
ALTER TABLE bars ADD COLUMN IF NOT EXISTS reopening_date date;
