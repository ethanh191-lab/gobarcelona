import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('bars')
      .select('name, price_per_500ml, neighbourhood, status')
      .eq('status', 'open')
      .not('price_per_500ml', 'is', null)
      .order('price_per_500ml', { ascending: true })
      .limit(3);

    if (error) throw error;

    return NextResponse.json({ bars: data || [] });
  } catch (e) {
    console.error('Cheapest bars API error:', e);
    return NextResponse.json({ bars: [] });
  }
}
