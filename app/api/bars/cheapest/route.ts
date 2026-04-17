import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '5');

    const { data, error } = await supabase
      .from('bars')
      .select('name, price_per_500ml, neighbourhood, status, is_open_now')
      .not('price_per_500ml', 'is', null)
      .order('price_per_500ml', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ bars: data || [] });
  } catch (e) {
    console.error('Cheapest bars API error:', e);
    return NextResponse.json({ bars: [] });
  }
}
