import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { report_id, vote_type } = await req.json();

    if (!report_id || !['up', 'down'].includes(vote_type)) {
      return NextResponse.json({ error: 'report_id and valid vote_type required' }, { status: 400 });
    }

    const column = vote_type === 'up' ? 'upvotes' : 'downvotes';

    const { data, error } = await supabase.rpc('increment_vote', { 
      row_id: report_id, 
      col_name: column 
    });

    if (error) {
      // Fallback if RPC doesn't exist yet
      const { data: updateData, error: updateError } = await supabase
        .from('beer_prices')
        .select(column)
        .eq('id', report_id)
        .single();
        
      if (updateError) throw updateError;
      
      const { error: finalError } = await supabase
        .from('beer_prices')
        .update({ [column]: ((updateData as any)[column] || 0) + 1 })
        .eq('id', report_id);
        
      if (finalError) throw finalError;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('vote error:', err?.message);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}
