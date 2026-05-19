import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const keys = Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('API') || k.includes('OPENAI') || k.includes('ANTHROPIC') || k.includes('GEMINI'));
  return NextResponse.json({ envKeys: keys });
}
