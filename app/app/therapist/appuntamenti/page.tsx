'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Row = {
  id: string;
  title: string;
  notes: string | null;
  status: 'scheduled'|'done'|'canceled';
  starts_at: string;
  ends_at: string;
  patient_id: string | null;
  patients?: { display_name: string | null } | null;
};

export default function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  async function load() {
    setLoading(true); setErr(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Non autenticato'); setLoading(false); return; }

    const { data, error } = await supabase
      .from('appointments')
      .select('id,title,notes,status,starts_at,ends_at,patient_id,patients(display_name)')
      .eq('therapist_user_id', user.id)
      .order('starts_at', { ascending: true })
      .limit(100);

    if (error) setErr(error.message);
    setRows((data||[]) as any);
    setLoading(false);
  }

  useEffect(()=>{ load(); },[]);

  async function updateStatus(id: string, status: Row['status']) {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Appuntamenti</h1>
        <Link href="/app/therapist/appuntamenti/nuovo" className="px-3 py-2 rounded border">Nuovo appuntamento</Link>
      </div>

      {err && <div className="p-3 border border-red-300 bg-red-50 rounded">{err}</div>}
      {loading ? <div>Caricamento…</div> : (
        <ul className="space-y-3">
          {rows.map(r=>(
            <li key={r.id} className="p-3 border rounded flex items-center justify-between">
              <div>
                <div className="font-medium">{r.title} {r.patients?.display_name ? `· ${r.patients.display_name}` : ''}</div>
                <div className="text-sm text-gray-600">
                  {new Date(r.starts_at).toLocaleString()} — {new Date(r.ends_at).toLocaleTimeString()}
                  {' · '}<span className={r.status==='scheduled'?'text-blue-600':r.status==='done'?'text-green-600':'text-gray-500'}>{r.status}</span>
                </div>
                {r.notes && <div className="text-sm mt-1">{r.notes}</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={()=>updateStatus(r.id,'done')} className="px-2 py-1 border rounded">Segna fatto</button>
                <button onClick={()=>updateStatus(r.id,'canceled')} className="px-2 py-1 border rounded">Annulla</button>
              </div>
            </li>
          ))}
          {rows.length===0 && <li className="text-sm text-gray-600">Nessun appuntamento.</li>}
        </ul>
      )}
    </div>
  );
}
