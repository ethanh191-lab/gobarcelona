import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Trigger import in background
  // Note: For full import, run locally with: npm run import-bars
  return NextResponse.json({ 
    message: 'For full import run: npm run import-bars locally. Google Maps API requires sustained requests best run from local machine.',
    instruction: 'Set NEXT_PUBLIC_GOOGLE_MAPS_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local then run npm run import-bars'
  })
}
