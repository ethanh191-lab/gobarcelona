import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return new Response('Email missing', { status: 400 });
  }

  try {
    const { error } = await supabase
      .from('mailing_list')
      .update({ active: false })
      .eq('email', email);

    if (error) throw error;

    // Return a simple HTML confirmation page
    return new NextResponse(`
      <div style="font-family: sans-serif; text-align: center; padding: 100px;">
        <h1 style="color: #1A1A2E;">You have been unsubscribed</h1>
        <p style="color: #666;">We are sorry to see you go. You will no longer receive our Sunday Briefing.</p>
        <a href="/" style="color: #E63946; text-decoration: none; font-weight: bold;">Back to GoBarcelona</a>
      </div>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('Unsubscribe Error:', error);
    return new Response('Error unsubscribing', { status: 500 });
  }
}
