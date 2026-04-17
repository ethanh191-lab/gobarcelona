import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Save to Supabase
    const { error: dbError } = await supabase
      .from('contact_submissions')
      .insert({ name, email, subject, message });

    if (dbError) {
      console.error('DB error:', dbError.message);
    }

    // Send email via Resend
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'GoBarcelona <noreply@gobarcelona.es>',
            to: 'info@gobarcelona.es',
            subject: `Contact Form: ${subject}`,
            text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
          }),
        });
      }
    } catch (emailErr) {
      console.error('Email send error:', emailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Contact API error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
