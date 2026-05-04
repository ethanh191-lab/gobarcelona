import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Place } from '@/types';

export const dynamic = 'force-dynamic';

// ─── Coordinate validation — eliminates stacking bug ─────────────────────────
const BARCELONA_BOUNDS = { minLat: 41.32, maxLat: 41.47, minLng: 2.05, maxLng: 2.23 };

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    lat !== 0 && lng !== 0 &&
    !isNaN(lat) && !isNaN(lng) &&
    lat >= BARCELONA_BOUNDS.minLat && lat <= BARCELONA_BOUNDS.maxLat &&
    lng >= BARCELONA_BOUNDS.minLng && lng <= BARCELONA_BOUNDS.maxLng
  );
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const { data, error } = await supabase
      .from('bars')
      .select('*')
      .limit(2000);

    if (error) throw error;

    const places: Place[] = (data || [])
      .map((p): Place => {
        const lat = parseFloat(p.lat);
        const lng = parseFloat(p.lng);
        const rawPrice = p.price_per_500ml ? parseFloat(p.price_per_500ml) : null;
        return {
          id: p.id,
          name: p.name,
          address: p.address || '',
          lat,
          lng,
          neighborhood: p.neighbourhood || p.neighborhood || 'Barcelona', // accept both spellings from DB
          priceLevel: rawPrice ? (rawPrice < 3.5 ? 1 : rawPrice < 5 ? 2 : 3) : null,
          beerPrice: rawPrice,
          beerPriceStr: rawPrice ? `€${rawPrice.toFixed(2)}` : '?',
          vibe: [],
          features: [],
          rating: p.google_rating || null,
          reviewCount: p.google_rating_count || 0,
          isOpen: p.status === 'open',
          isOpenNow: p.is_open_now ?? null,
          outdoorSeating: p.has_terrace || false,
          hasSports: p.sports_tv || false,
          groupFriendly: p.group_friendly || false,
          dogFriendly: p.dog_friendly || false,
          liveMusic: p.live_music || false,
          dateSpot: p.date_spot || false,
          rooftop: p.rooftop || false,
          openLate: p.open_late || false,
          irishPub: p.irish_pub || false,
          craftBeer: p.craft_beer || false,
          beerHall: p.beer_hall || false,
          studentDiscount: p.student_discount || false,
          studentFriendly: p.student_friendly || false,
          studentPrice: p.student_price || null,
          tapCount: p.tap_count || null,
          imageUrl: p.photo_url || null,
          photoUrl: p.photo_url || undefined,
          googlePlaceId: p.google_place_id || null,
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
          happyHourStart: p.happy_hour_start,
          happyHourEnd: p.happy_hour_end,
          happyHourPrice: p.happy_hour_price,
          beersOnTap: p.beers_on_tap,
          openedAt: p.opened_at,
          status: p.status || 'open',
          closureNote: p.closure_note,
          reopeningDate: p.reopening_date,
          priceConfidence: p.price_confidence || 'unverified',
          lastUpdated: p.last_updated,
          popularTimes: p.popular_times || null,
          currentPopularity: p.current_popularity || null,
          website: p.website,
          phone: p.phone,
          openingToday: p.opening_today,
        };
      })
      .filter(p => isValidCoordinate(p.lat, p.lng)); // ← eliminates stacking bug

    return NextResponse.json({ places, count: places.length });
  } catch (e) {
    console.error('API Error /api/places:', e);
    return NextResponse.json({ places: [], count: 0, error: String(e) });
  }
}
