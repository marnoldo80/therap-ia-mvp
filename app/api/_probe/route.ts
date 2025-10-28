import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function hJSON() {
  const key = process.env.SUPABASE_SERVICE_ROLE as string;
  return {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Prefer': 'return=representation',
  };
}
function hGET() {
  const key = process.env.SUPABASE_SERVICE_ROLE as string;
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
  };
}

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const email = (u.searchParams.get('email') || '').toLowerCase().trim();
    if (!email) return NextResponse.json({ ok:false, error:'missing email param' }, { status:400 });

    const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const or = `or=(email.ilike.${encodeURIComponent(email)},mail.ilike.${encodeURIComponent(email)})`;

    const r1 = await fetch(`${base}/rest/v1/patients?${or}`, { headers: hGET() });
    const body1 = await r1.text();

    const r2 = await fetch(`${base}/rest/v1/patients?${or}&user_id=is.null`, {
      method: 'PATCH',
      headers: hJSON(),
      body: JSON.stringify({ user_id: 'TEST_ONLY_DO_NOT_USE' })
    });
    const body2 = await r2.text();

    return NextResponse.json({
      ok: true,
      email,
      read: { status: r1.status, body: tryParse(body1) },
      patch_dryrun: { status: r2.status, body: safeText(body2) }
    });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message ?? 'unknown' }, { status:500 });
  }
}
function tryParse(t:string){ try{ return JSON.parse(t); } catch{ return t.slice(0,4000); } }
function safeText(t:string){ return (t || '').slice(0,4000); }
