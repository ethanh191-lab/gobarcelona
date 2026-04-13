import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  let email = '';
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const AUDIENCE_NAME = 'GoBarcelona';

  try {
    console.log('[MAILING-LIST-DEBUG] Request received');
    
    if (!apiKey) {
      console.error('[MAILING-LIST-DEBUG] ERROR: RESEND_API_KEY is missing');
      return NextResponse.json({ 
        error: 'server_error', 
        details: 'API Key missing on server' 
      }, { status: 500 });
    }

    const resend = new Resend(apiKey.trim());
    const body = await req.json().catch(() => null);
    
    if (!body || !body.email) {
      console.error('[MAILING-LIST-DEBUG] ERROR: Missing body or email');
      return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
    }

    email = body.email;
    console.log('[MAILING-LIST-DEBUG] Processing signup for:', email);

    // 1. Basic validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error('[MAILING-LIST-DEBUG] ERROR: Invalid email format:', email);
      return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
    }

    let targetId = audienceId;

    // 2. Lookup Audience if ID not provided
    if (!targetId) {
      console.log('[MAILING-LIST-DEBUG] No RESEND_AUDIENCE_ID provided. Listing audiences...');
      const { data: list, error: listError } = await resend.audiences.list();
      
      if (listError) {
        console.error('[MAILING-LIST-DEBUG] ERROR listing audiences:', listError);
        throw listError;
      }

      const existing = (list?.data || []).find(a => a.name === AUDIENCE_NAME);
      
      if (existing) {
        targetId = existing.id;
        console.log('[MAILING-LIST-DEBUG] Found existing audience:', targetId);
      } else {
        console.log('[MAILING-LIST-DEBUG] Audience not found. Creating:', AUDIENCE_NAME);
        const { data: created, error: createError } = await resend.audiences.create({ name: AUDIENCE_NAME });
        if (createError) {
          console.error('[MAILING-LIST-DEBUG] ERROR creating audience:', createError);
          throw createError;
        }
        targetId = created?.id;
        console.log('[MAILING-LIST-DEBUG] Created new audience:', targetId);
      }
    }

    if (!targetId) {
      throw new Error('Failed to identify or create audience ID');
    }

    // 3. Add Contact
    console.log('[MAILING-LIST-DEBUG] Adding contact to audience:', targetId);
    const { data: contact, error: contactError } = await resend.contacts.create({
      email,
      audienceId: targetId,
      unsubscribed: false,
    });

    if (contactError) {
      console.error('[MAILING-LIST-DEBUG] ERROR adding contact:', contactError);
      if (contactError.message?.toLowerCase().includes('already exists')) {
        return NextResponse.json({ error: 'already_exists' }, { status: 400 });
      }
      throw contactError;
    }

    console.log('[MAILING-LIST-DEBUG] SUCCESS: Contact added with ID:', contact?.id);
    return NextResponse.json({ success: true, id: contact?.id });

  } catch (error: any) {
    console.error('[MAILING-LIST-DEBUG] CRITICAL FAILURE:', error);
    return NextResponse.json({ 
      error: 'server_error', 
      details: error?.message || String(error)
    }, { status: 500 });
  }
}
