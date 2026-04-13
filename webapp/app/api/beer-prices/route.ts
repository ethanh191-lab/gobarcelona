import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const barId = req.nextUrl.searchParams.get('bar_id');
  if (!barId) return NextResponse.json({ error: 'bar_id required' }, { status: 400 });

  try {
    const { data, error } = await supabase
      .from('beer_prices')
      .select('*')
      .eq('bar_id', barId)
      .order('submitted_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    // Calculate confidence
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const recentPrices = (data || []).filter(p => p.submitted_at > thirtyDaysAgo);
    
    // Confidence is high if there are verified reports OR many recent reports
    const hasVerified = data?.some(p => p.verified);
    const confidence = (hasVerified || recentPrices.length >= 3) ? 'high' : recentPrices.length >= 1 ? 'medium' : 'low';

    // Latest verified or most recent
    const latest = data?.find(p => p.verified) || data?.[0] || null;

    return NextResponse.json({
      prices: data || [],
      latest,
      confidence,
      recentCount: recentPrices.length,
    });
  } catch (err: any) {
    // Table might not exist yet — return empty response gracefully
    console.error('beer_prices fetch error:', err?.message);
    return NextResponse.json({
      prices: [],
      latest: null,
      confidence: 'low',
      recentCount: 0,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bar_id, price, size_ml, type, note } = body;

    if (!bar_id || !price) {
      return NextResponse.json({ error: 'bar_id and price required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('beer_prices')
      .insert({
        bar_id,
        price: parseFloat(price),
        size_ml: parseInt(size_ml) || 500,
        type: type || 'tap',
        note: note || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, price: data });
  } catch (err: any) {
    console.error('beer_prices insert error:', err?.message);
    return NextResponse.json({ error: 'Failed to save price' }, { status: 500 });
  }
}
