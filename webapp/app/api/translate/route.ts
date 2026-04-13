import { NextRequest, NextResponse } from 'next/server';

// Uses Google Translate unofficial free endpoint - no API key required
// Batches texts together to minimize requests
export async function POST(req: NextRequest) {
  const { texts, targetLang = 'en' } = await req.json() as { texts: string[]; targetLang: string };

  if (!texts || texts.length === 0) {
    return NextResponse.json({ translations: [] });
  }

  // Use a unique separator unlikely to appear in news text
  const SEPARATOR = ' ||| ';
  const batched = texts.join(SEPARATOR);

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'User-Agent': 'Mozilla/5.0' 
      },
      body: new URLSearchParams({ q: batched }).toString()
    });

    if (!res.ok) throw new Error(`Translate API: ${res.status}`);

    const data = await res.json();

    // Google Translate returns nested arrays: [[["translated", "original", ...]]]
    // Concatenate all translated segments
    const translatedFull: string = (data[0] as [string, string][])
      .map((segment) => segment[0])
      .join('');

    const translations = translatedFull.split(SEPARATOR).map(t => t.trim());

    return NextResponse.json({ translations });
  } catch (err: unknown) {
    // On failure return original texts unchanged
    console.error('Translation error:', err);
    return NextResponse.json({ translations: texts });
  }
}
