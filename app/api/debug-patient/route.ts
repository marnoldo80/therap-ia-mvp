import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get('email') || '').toLowerCase().trim();
  if (!email) return NextResponse.json({ ok: false, error: 'missing email' }, { status: 400 });
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const h = {
    'apikey': process.env.SUPABASE_SERVICE_ROLE as string,
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
  };
  const r1 = await fetch(`${base}/rest/v1/patients?email=ilike.${encodeURIComponent(email)}`, { headers: h });
  const r2 = await fetch(`${base}/rest/v1/patients?mail=ilike.${encodeURIComponent(email)}`, { headers: h });
  return NextResponse.json({
    ok: true,
    email,
    by_email: await r1.json(),
    by_mail: await r2.json(),
  });
}
