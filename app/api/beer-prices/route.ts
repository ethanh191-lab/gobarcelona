import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bar_id, price, type, size_ml } = body;

    if (!bar_id || !price) {
      return NextResponse.json({ error: 'bar_id and price are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('beer_prices')
      .insert({
        bar_id: parseInt(bar_id),
        price: parseFloat(price),
        type: type || 'tap',
        size_ml: parseInt(size_ml) || 500,
      })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('Beer price report error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
