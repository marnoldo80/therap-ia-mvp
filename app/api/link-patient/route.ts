import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const { email, user_id } = await req.json();
    if (!email || !user_id) {
      return NextResponse.json({ ok: false, error: 'missing params' }, { status: 400 });
    }

    // usa fetch al REST di Supabase con service role
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/patients`;
    const resp = await fetch(`${url}?email=ilike.${encodeURIComponent(email)}&user_id=is.null`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE as string,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ user_id })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json({ ok: false, error: `supabase: ${txt}` }, { status: 500 });
    }

    const rows = await resp.json();
    if (!rows || rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'patient_not_found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, patient: rows[0] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'unknown' }, { status: 500 });
  }
}
