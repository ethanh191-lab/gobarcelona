import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { getNewsletterTemplate } from '@/lib/newsletter-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export async function GET(req: NextRequest) {
  // Check for Vercel Cron Secret (Security)
  // const authHeader = req.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {
    // 1. Fetch Active Subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('mailing_list')
      .select('email')
      .eq('active', true);

    if (subError) throw subError;
    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: 'No active subscribers' });
    }

    // 2. Fetch Content (Events & Beer)
    // Using absolute URL for fetching from itself on Vercel
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = req.headers.get('host');
    
    const [eventsRes, placesRes] = await Promise.all([
      fetch(`${protocol}://${host}/api/events`),
      fetch(`${protocol}://${host}/api/places?radius=5000`)
    ]);

    const { events } = await eventsRes.json();
    const { places } = await placesRes.json();

    const topEvents = (events || []).slice(0, 5);
    const cheapBeer = (places || []).find((p: any) => p.priceTier === 'cheap') || (places || [])[0] || {
      name: 'Bar Manolo',
      address: 'Near Mercat de Sant Antoni',
      beerPrice: '€2.50'
    };

    // 3. Select a random tip
    const tips = [
      "Always carry a physical T-Mobilitat card; the phone app can be glitchy at metro gates.",
      "Most museums are free on the first Sunday of every month.",
      "Avoid the restaurants on La Rambla; walk two streets into Raval or Gothic for 40% lower prices.",
      "Tap water in Barcelona is safe to drink, but many locals prefer bottled or filtered due to the taste.",
      "Bicing is the cheapest way to get around, but it is for residents only (requires NIE)."
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    // 4. Send Emails in batch (Resend supports batching or individual)
    // For simplicity and to handle the unsubscribe link per user, we send individually
    const results = await Promise.allSettled(subscribers.map(async (sub) => {
      const email = sub.email;
      const unsubscribeUrl = `${protocol}://${host}/api/mailing-list/unsubscribe?email=${encodeURIComponent(email)}`;
      
      const html = getNewsletterTemplate({
        events: topEvents,
        beer: cheapBeer,
        tip: randomTip,
        unsubscribeUrl
      });

      return resend.emails.send({
        from: 'GoBarcelona <newsletter@gobarcelona.es>',
        to: email,
        subject: 'Your Sunday Briefing: Top Events & Cheap Beers',
        html: html,
      });
    }));

    return NextResponse.json({ 
      message: 'Processing complete',
      processed: results.length,
      successCount: results.filter(r => r.status === 'fulfilled').length
    });

  } catch (error) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
