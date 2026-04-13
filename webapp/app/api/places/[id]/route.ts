import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  const fields = [
    'name', 'formatted_address', 'formatted_phone_number',
    'opening_hours', 'rating', 'reviews', 'price_level',
    'website', 'photos', 'user_ratings_total', 'types',
    'geometry',
  ].join(',');

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${id}&fields=${fields}&key=${GOOGLE_API_KEY}`,
    { next: { revalidate: 900 } }
  );

  const data = await res.json();
  if (data.status !== 'OK') {
    return NextResponse.json({ error: data.status }, { status: 404 });
  }

  const p = data.result;

  // Build photo URLs
  const photos = (p.photos || []).slice(0, 6).map((ph: { photo_reference: string }) =>
    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ph.photo_reference}&key=${GOOGLE_API_KEY}`
  );

  return NextResponse.json({
    id,
    name: p.name,
    address: p.formatted_address,
    phone: p.formatted_phone_number || null,
    website: p.website || null,
    rating: p.rating,
    reviewCount: p.user_ratings_total,
    priceLevel: p.price_level,
    photos,
    types: p.types,
    hours: p.opening_hours?.weekday_text || [],
    isOpen: p.opening_hours?.open_now ?? null,
    reviews: (p.reviews || []).slice(0, 5).map((r: {
      author_name: string; rating: number; text: string; relative_time_description: string; profile_photo_url: string;
    }) => ({
      author:   r.author_name,
      rating:   r.rating,
      text:     r.text,
      time:     r.relative_time_description,
      avatar:   r.profile_photo_url,
    })),
  });
}
