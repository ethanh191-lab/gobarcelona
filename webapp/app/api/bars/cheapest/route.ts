import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('bars')
      .select('name, beer_price_05l, neighborhood, status')
      .eq('status', 'open')
      .order('beer_price_05l', { ascending: true })
      .limit(3);

    if (error) throw error;

    return NextResponse.json({ bars: data });
  } catch (error) {
    console.error('Error fetching cheapest bars:', error);
    // Return empty list on error to avoid breaking the UI
    return NextResponse.json({ bars: [] });
  }
}
