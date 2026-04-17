import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '41.3851');
  const lng = parseFloat(searchParams.get('lng') || '2.1734');
  const radius = parseFloat(searchParams.get('radius') || '5000'); // meters

  try {
    // Fetch all bars from Supabase
    // In a real app, we'd use PostGIS for radius search, but for now we'll fetch all and filter or just fetch all since it's a specific city map.
    const { data, error } = await supabase
      .from('bars')
      .select('*');

    if (error) throw error;

    const places = (data || []).map(p => ({
      id: p.id,
      name: p.name,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      beerPrice: `€${parseFloat(p.beer_price_05l || 0).toFixed(2)}`,
      rating: p.rating,
      reviewCount: p.review_count || 0,
      outdoorSeating: p.terrace,
      isOpen: p.status === 'open',
      hasSports: p.sports_broadcasting,
      neighborhood: p.neighborhood,
      // New columns for features
      happyHourStart: p.happy_hour_start,
      happyHourEnd: p.happy_hour_end,
      happyHourPrice: p.happy_hour_price,
      beersOnTap: p.beers_on_tap,
      studentDiscount: p.student_discount,
      studentPrice: p.student_price,
      openedAt: p.opened_at,
      status: p.status,
      closureNote: p.closure_note,
      reopeningDate: p.reopening_date,
    }));

    return NextResponse.json({ 
      places: places,
      count: places.length
    });
  } catch (e) {
    console.error('API Error:', e);
    return NextResponse.json({ places: [], count: 0 });
  }
}
