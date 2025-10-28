import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // niente prerender

export async function GET() {
  return NextResponse.json({ ok: true, ping: 'pong' });
}
