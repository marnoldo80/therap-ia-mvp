import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function makeAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email')?.trim().toLowerCase();

  const res: any = {
    ok: true,
    email,
    env: {
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE,
      supabaseUrlSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
    read: {},
  };

  if (!email) {
    return NextResponse.json({ ok: false, error: 'missing email param' }, { status: 400 });
  }

  try {
    if (!process.env.SUPABASE_SERVICE_ROLE || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      res.read = { status: 'no-admin', body: 'Missing SUPABASE_SERVICE_ROLE or URL' };
      return NextResponse.json(res, { status: 200 });
    }

    const admin = makeAdmin();

    // Tenta varie tabelle note; se una manca, cattura l’errore e continua.
    const checks: Array<{table: string, rows: any[] | string}> = [];

    // patients
    try {
      const { data, error } = await admin
        .from('patients')
        .select('id,email,therapist_id,created_at')
        .ilike('email', email)
        .limit(10);
      checks.push({ table: 'patients', rows: error ? `ERROR: ${error.message}` : (data ?? []) });
    } catch (e: any) {
      checks.push({ table: 'patients', rows: `EXCEPTION: ${e?.message || String(e)}` });
    }

    // therapists
    try {
      const { data, error } = await admin
        .from('therapists')
        .select('id,email,created_at')
        .ilike('email', email)
        .limit(10);
      checks.push({ table: 'therapists', rows: error ? `ERROR: ${error.message}` : (data ?? []) });
    } catch (e: any) {
      checks.push({ table: 'therapists', rows: `EXCEPTION: ${e?.message || String(e)}` });
    }

    // profiles (se esiste)
    try {
      const { data, error } = await admin
        .from('profiles')
        .select('id,email,role,created_at')
        .ilike('email', email)
        .limit(10);
      checks.push({ table: 'profiles', rows: error ? `ERROR: ${error.message}` : (data ?? []) });
    } catch (e: any) {
      checks.push({ table: 'profiles', rows: `EXCEPTION: ${e?.message || String(e)}` });
    }

    res.read = { status: 'ok', body: checks };
    return NextResponse.json(res, { status: 200 });
  } catch (e: any) {
    res.read = { status: 'exception', body: e?.message || String(e) };
    return NextResponse.json(res, { status: 500 });
  }
}
