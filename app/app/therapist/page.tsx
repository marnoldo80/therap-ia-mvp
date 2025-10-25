'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Therapist = { display_name: string|null; address: string|null; vat_number: string|null; };
type PatientRel = { display_name: string|null } | { display_name: string|null }[] | null;

type GadRow = {
  id: string;
  total: number;
  severity: string|null;
  created_at: string;
  patient_id: string|null;
  patients?: PatientRel;
};

type PatRow = { id: string; display_name: string|null; created_at: string; };

type ApptRow = {
  id: string;
  title: string;
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
  const [err, setErr] = useState<string|null>(null);
  const [therapist, setTherapist] = useState<Therapist|null>(null);
  const [recentResults, setRecentResults] = useState<GadRow[]>([]);
  const [recentPatients, setRecentPatients] = useState<PatRow[]>([]);
  const [nextAppts, setNextAppts] = useState<ApptRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setErr(null); setLoading(true);
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) { setErr('Non autenticato'); setLoading(false); return; }

      // Profilo
      {
        const { data, error } = await supabase
          .from('therapists')
          .select('display_name,address,vat_number')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) setErr(error.message);
        setTherapist((data || null) as Therapist|null);
      }

      // Ultimi GAD-7
      {
        const { data, error } = await supabase
          .from('gad7_results')
          .select('id,total,severity,created_at,patient_id,patients(display_name)')
          .eq('therapist_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (error) setErr(error.message);
        setRecentResults((data || []) as unknown as GadRow[]);
      }

      // Pazienti recenti
      {
        const { data, error } = await supabase
          .from('patients')
          .select('id,display_name,created_at')
          .eq('therapist_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (error) setErr(error.message);
        setRecentPatients((data || []) as PatRow[]);
      }

      // Prossimi appuntamenti — embed con relazione esplicita
      {
        const { data, error } = await supabase
          .from('appointments')
          .select('id,title,starts_at,ends_at,status,patients!appointments_patient_fkey(display_name)')
          .eq('therapist_user_id', user.id)
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true })
          .limit(5);
        if (error) setErr(error.message);
        setNextAppts((data || []) as unknown as ApptRow[]);
      }

      setLoading(false);
    })();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard terapeuta</h1>
        <div className="flex gap-4 text-sm">
          <Link href="/app/therapist/pazienti" className="underline">Lista pazienti</Link>
          <Link href="/app/therapist/appuntamenti" className="underline">Appuntamenti</Link>
          <Link href="/app/therapist/appuntamenti/nuovo" className="underline">Nuovo appuntamento</Link>
        </div>
      </div>

      {err && <div className="p-3 border border-red-300 bg-red-50 rounded">{err}</div>}
      {loading && <div>Caricamento…</div>}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <div className="font-semibold mb-2">Profilo terapeuta</div>
          {therapist ? (
            <div className="space-y-1 text-sm">
              <div><span className="text-gray-500">Nome: </span>{therapist.display_name || '—'}</div>
              <div><span className="text-gray-500">Indirizzo: </span>{therapist.address || '—'}</div>
              <div><span className="text-gray-500">P. IVA: </span>{therapist.vat_number || '—'}</div>
              <div className="pt-2">
                <Link href="/app/therapist/onboarding" className="underline text-sm">Modifica profilo</Link>
              </div>
            </div>
          ) : (
            <div className="text-sm">
              Nessun profilo trovato. <Link className="underline" href="/app/therapist/onboarding">Completa onboarding</Link>
            </div>
          )}
        </div>

        <div className="border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Prossimi appuntamenti</div>
            <div className="text-sm flex gap-3">
              <Link href="/app/therapist/appuntamenti" className="underline">Apri elenco</Link>
              <Link href="/app/therapist/appuntamenti/nuovo" className="underline">Nuovo</Link>
            </div>
          </div>
          <ul className="space-y-2">
            {nextAppts.map(a => (
              <li key={a.id} className="border rounded px-3 py-2">
                <div className="font-medium">
                  {a.title}{(() => { const n = getPatientName(a.patients || null); return n ? ` · ${n}` : ''; })()}
                </div>
                <div className="text-xs text-gray-600">
                  {new Date(a.starts_at).toLocaleString()} — {new Date(a.ends_at).toLocaleTimeString()} · {a.status}
                </div>
              </li>
            ))}
            {nextAppts.length === 0 && <li className="text-sm text-gray-600">Nessun appuntamento programmato.</li>}
          </ul>
        </div>

        <div className="border rounded p-4">
          <div className="font-semibold mb-2">Pazienti recenti</div>
          <ul className="space-y-2">
            {recentPatients.map(p => (
              <li key={p.id} className="border rounded px-3 py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.display_name || 'Senza nome'}</div>
                  <div className="text-xs text-gray-600">{new Date(p.created_at).toLocaleString()}</div>
                </div>
                <Link href={`/app/therapist/pazienti/${p.id}`} className="text-sm underline">Apri</Link>
              </li>
            ))}
            {recentPatients.length === 0 && <li className="text-sm text-gray-600">Nessun paziente.</li>}
          </ul>
        </div>

        <div className="border rounded p-4">
          <div className="font-semibold mb-2">Ultimi risultati GAD-7</div>
          <ul className="space-y-2">
            {recentResults.map(r => (
              <li key={r.id} className="border rounded px-3 py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">Score — {r.total}</div>
                  <div className="text-xs text-gray-600">
                    {(r.severity || '').charAt(0).toUpperCase() + (r.severity || '').slice(1)} · {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <Link href={`/app/therapist/pazienti/${r.patient_id}`} className="text-sm underline">Apri paziente</Link>
              </li>
            ))}
            {recentResults.length === 0 && <li className="text-sm text-gray-600">Nessun risultato.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
