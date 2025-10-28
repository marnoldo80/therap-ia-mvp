import type { NextApiRequest, NextApiResponse } from 'next';

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

export default async function handler(req:NextApiRequest, res:NextApiResponse) {
  try {
    const email = String(req.query.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ ok:false, error:'missing email' });

    const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const or = `or=(email.ilike.${encodeURIComponent(email)},mail.ilike.${encodeURIComponent(email)})`;

    const r1 = await fetch(`${base}/rest/v1/patients?${or}`, { headers: hGET() });
    const b1 = await r1.text();

    res.status(200).json({ ok:true, email, read:{ status:r1.status, body: tryParse(b1) } });
  } catch (e:any) {
    res.status(500).json({ ok:false, error: e?.message ?? 'unknown' });
  }
}
function tryParse(t:string){ try{ return JSON.parse(t); } catch{ return t.slice(0,2000); } }
