import type { NextApiRequest, NextApiResponse } from 'next';
export default function handler(_req:NextApiRequest, res:NextApiResponse) {
  const sr = process.env.SUPABASE_SERVICE_ROLE || '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  res.status(200).json({
    ok:true,
    hasServiceRole: !!sr,
    serviceRoleLen: sr.length,
    hasAnon: !!anon,
    anonLen: anon.length,
    supabaseUrlPrefix: url.slice(0, 40)
  });
}
