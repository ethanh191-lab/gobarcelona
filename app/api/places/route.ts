import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Fetch all bars from Supabase (override default 1000 row limit)
    const { data, error } = await supabase
      .from('bars')
      .select('*')
      .limit(2000);

    if (error) throw error;

    const places = (data || []).map(p => ({
      id: p.id,
      name: p.name,
      address: p.address,
      lat: parseFloat(p.lat),
      lng: parseFloat(p.lng),
      beerPrice: p.price_per_500ml ? `€${parseFloat(p.price_per_500ml).toFixed(2)}` : '?',
      rating: p.google_rating || null,
      reviewCount: p.google_rating_count || 0,
      outdoorSeating: p.has_terrace || false,
      isOpen: p.status === 'open',
      hasSports: p.sports_tv || false,
      groupFriendly: p.group_friendly || false,
      dogFriendly: p.dog_friendly || false,
      liveMusic: p.live_music || false,
      dateSpot: p.date_spot || false,
      rooftop: p.rooftop || false,
      openLate: p.open_late || false,
      neighbourhood: p.neighbourhood || 'Barcelona',
      // Opening hours
      openingHoursStr: p.opening_mon ? [
        `Mon: ${p.opening_mon}`, `Tue: ${p.opening_tue}`, `Wed: ${p.opening_wed}`,
        `Thu: ${p.opening_thu}`, `Fri: ${p.opening_fri}`, `Sat: ${p.opening_sat}`,
        `Sun: ${p.opening_sun}`
      ].join(' | ') : undefined,
      openingMon: p.opening_mon,
      openingTue: p.opening_tue,
      openingWed: p.opening_wed,
      openingThu: p.opening_thu,
      openingFri: p.opening_fri,
      openingSat: p.opening_sat,
      openingSun: p.opening_sun,
      // Features
      happyHourStart: p.happy_hour_start,
      happyHourEnd: p.happy_hour_end,
      happyHourPrice: p.happy_hour_price,
      beersOnTap: p.beers_on_tap,
      studentDiscount: p.student_discount || false,
      studentFriendly: p.student_friendly || false,
      studentPrice: p.student_price,
      openedAt: p.opened_at,
      status: p.status || 'open',
      closureNote: p.closure_note,
      reopeningDate: p.reopening_date,
      irishPub: p.irish_pub || false,
      craftBeer: p.craft_beer || false,
      beerHall: p.beer_hall || false,
      photoUrl: p.photo_url,
      website: p.website,
      phone: p.phone,
      priceConfidence: p.price_confidence || 'unverified',
      openingToday: p.opening_today,
      isOpenNow: p.is_open_now,
      lastUpdated: p.last_updated,
      popularTimes: p.popular_times || null,
      currentPopularity: p.current_popularity || null,
    }));

    return NextResponse.json({ 
      places: places,
      count: places.length
    });
  } catch (e) {
    console.error('API Error:', e);
    return NextResponse.json({ places: [], count: 0, error: String(e) });
  }
}
