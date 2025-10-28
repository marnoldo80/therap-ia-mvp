import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function GET() {
  const k = process.env.SUPABASE_SERVICE_ROLE || '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return NextResponse.json({
    ok: true,
    hasServiceRole: !!k,
    serviceRoleLen: k.length,
    hasAnon: !!anon,
    anonLen: anon.length,
    supabaseUrlStartsWith: url.slice(0, 35),
    env: 'vercel'
  });
}
