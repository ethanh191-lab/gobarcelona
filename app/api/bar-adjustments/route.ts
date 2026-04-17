import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bar_id, field_to_adjust, current_value, suggested_value, note } = body;

    if (!bar_id || !field_to_adjust) {
      return NextResponse.json({ error: 'bar_id and field_to_adjust are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('bar_adjustment_requests')
      .insert({
        bar_id: parseInt(bar_id),
        field_to_adjust,
        current_value: current_value || null,
        suggested_value: suggested_value || null,
        note: note || null,
      })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('Bar adjustment request error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
