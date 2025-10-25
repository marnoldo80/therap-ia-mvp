'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PatientRel = { display_name: string|null } | { display_name: string|null }[] | null;
type Row = {
  id: string;
  title: string|null;
  starts_at: string;
  ends_at: string;
  status: string;
  patients?: PatientRel;
};

function getPatientName(rel: PatientRel): string {
  if (!rel) return '';
  if (Array.isArray(rel)) return rel[0]?.display_name || '';
  return rel.display_name || '';
}

export default function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setErr(null); setLoading(true);
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) { setErr('Non autenticato'); setLoading(false); return; }

      const { data, error } = await supabase
        .from('appointments')
        .select('id,title,starts_at,ends_at,status,patients!appointments_patient_fkey(display_name)')
        .eq('therapist_user_id', user.id)
        .order('starts_at', { ascending: true });

      if (error) setErr(error.message);
      setRows((data || []) as unknown as Row[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Appuntamenti</h1>
        <Link href="/app/therapist/appuntamenti/nuovo" className="underline">Nuovo appuntamento</Link>
      </div>

      {err && <div className="p-3 border border-red-300 bg-red-50 rounded">{err}</div>}
      {loading && <div>Caricamento…</div>}

      <ul className="space-y-2">
        {rows.map(a => (
          <li key={a.id} className="border rounded p-3">
            <div className="font-medium">{a.title || 'Senza titolo'}{(() => { const n = getPatientName(a.patients || null); return n ? ` · ${n}` : '' })()}</div>
            <div className="text-xs text-gray-600">
              {new Date(a.starts_at).toLocaleString()} — {new Date(a.ends_at).toLocaleTimeString()} · {a.status}
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-gray-600">Nessun appuntamento.</li>}
      </ul>
    </div>
  );
}
