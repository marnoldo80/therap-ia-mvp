import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function h() {
  const key = process.env.SUPABASE_SERVICE_ROLE as string;
  return {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Prefer': 'return=representation',
  };
}

export async function POST(req: Request) {
  try {
    const { email, user_id } = await req.json();
    if (!email || !user_id) {
      return NextResponse.json({ ok: false, error: 'missing params' }, { status: 400 });
    }

    const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // PATCH usando OR su email/mail + user_id is null
    const qs =
      `or=(email.ilike.${encodeURIComponent(email)},mail.ilike.${encodeURIComponent(email)})&user_id=is.null`;

    const resp = await fetch(`${base}/rest/v1/patients?${qs}`, {
      method: 'PATCH',
      headers: h(),
      body: JSON.stringify({ user_id }),
    });

    const text = await resp.text();
    let rows: any[] = [];
    try { rows = JSON.parse(text); } catch { /* text vuoto */ }

    // Controllo: esiste ora un paziente con quel user_id?
    const check = await fetch(`${base}/rest/v1/patients?user_id=eq.${user_id}`, {
      headers: { 'apikey': process.env.SUPABASE_SERVICE_ROLE as string, 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE}` }
    });
    const got = await check.json();

    if (!resp.ok) {
      return NextResponse.json({ ok: false, step: 'patch', resp: text }, { status: 500 });
    }
    if (Array.isArray(got) && got.length > 0) {
      return NextResponse.json({ ok: true, linked: got[0], patched_count: rows?.length ?? 0 });
    }

    // Non trovato: restituisci cosa c'è per quell’email (diagnostica)
    const probe = await fetch(`${base}/rest/v1/patients?or=(email.ilike.${encodeURIComponent(email)},mail.ilike.${encodeURIComponent(email)})`, {
      headers: { 'apikey': process.env.SUPABASE_SERVICE_ROLE as string, 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE}` }
    });
    const probeRows = await probe.json();

    return NextResponse.json({ ok: false, error: 'patient_not_found_after_patch', patched_count: rows?.length ?? 0, probe: probeRows }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'unknown' }, { status: 500 });
  }
}
