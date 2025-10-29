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
  const [totalPatients, setTotalPatients] = useState(0);
  const [weekAppts, setWeekAppts] = useState(0);
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

      // Statistiche
      {
        const { count } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('therapist_user_id', user.id);
        setTotalPatients(count || 0);

        const weekStart = new Date();
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const { count: apptCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('therapist_user_id', user.id)
          .gte('starts_at', weekStart.toISOString())
          .lte('starts_at', weekEnd.toISOString());
        setWeekAppts(apptCount || 0);
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

      // Prossimi appuntamenti
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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Benvenuto, {therapist?.display_name || 'Terapeuta'}
          </p>
        </div>
        <Link href="/app/therapist/onboarding" className="text-sm text-blue-600 hover:underline">
          Modifica profilo
        </Link>
      </div>

      {err && <div className="p-4 border border-red-300 bg-red-50 rounded-lg text-red-700">{err}</div>}

      {/* Azioni rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          href="/app/therapist/pazienti/nuovo"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-6 text-center font-semibold shadow-lg transition"
        >
          <div className="text-4xl mb-2">👤</div>
          <div>Nuovo Paziente</div>
        </Link>
        <Link 
          href="/app/therapist/appuntamenti/nuovo"
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg p-6 text-center font-semibold shadow-lg transition"
        >
          <div className="text-4xl mb-2">📅</div>
          <div>Nuovo Appuntamento</div>
        </Link>
        <Link 
          href="/app/therapist/pazienti"
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-6 text-center font-semibold shadow-lg transition"
        >
          <div className="text-4xl mb-2">📋</div>
          <div>Gestisci Questionari</div>
        </Link>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="text-gray-500 text-sm font-medium">Pazienti totali</div>
          <div className="text-3xl font-bold mt-2">{totalPatients}</div>
        </div>
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="text-gray-500 text-sm font-medium">Appuntamenti questa settimana</div>
          <div className="text-3xl font-bold mt-2">{weekAppts}</div>
        </div>
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="text-gray-500 text-sm font-medium">Questionari recenti</div>
          <div className="text-3xl font-bold mt-2">{recentResults.length}</div>
        </div>
      </div>

      {loading && <div className="text-center py-8 text-gray-500">Caricamento...</div>}

      {/* Contenuto principale */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Prossimi appuntamenti */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Prossimi appuntamenti</h2>
            <Link href="/app/therapist/appuntamenti" className="text-sm text-blue-600 hover:underline">
              Vedi tutti
            </Link>
          </div>
          <div className="space-y-3">
            {nextAppts.map(a => (
              <div key={a.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="font-medium text-lg">
                  {a.title}
                  {(() => { const n = getPatientName(a.patients || null); return n ? ` · ${n}` : ''; })()}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  📅 {new Date(a.starts_at).toLocaleString('it-IT')}
                </div>
                <div className="text-xs mt-2">
                  <span className={`inline-block px-2 py-1 rounded ${
                    a.status === 'confermato' ? 'bg-green-100 text-green-700' :
                    a.status === 'da_confermare' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
            {nextAppts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nessun appuntamento programmato
              </div>
            )}
          </div>
        </div>

        {/* Pazienti recenti */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Pazienti recenti</h2>
            <Link href="/app/therapist/pazienti" className="text-sm text-blue-600 hover:underline">
              Vedi tutti
            </Link>
          </div>
          <div className="space-y-3">
            {recentPatients.map(p => (
              <Link 
                key={p.id} 
                href={`/app/therapist/pazienti/${p.id}`}
                className="block border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="font-medium text-lg">{p.display_name || 'Senza nome'}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Aggiunto il {new Date(p.created_at).toLocaleDateString('it-IT')}
                </div>
              </Link>
            ))}
            {recentPatients.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nessun paziente ancora
              </div>
            )}
          </div>
        </div>

        {/* Ultimi risultati GAD-7 */}
        <div className="bg-white border rounded-lg p-6 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Ultimi risultati GAD-7</h2>
          <div className="space-y-3">
            {recentResults.map(r => (
              <Link
                key={r.id}
                href={`/app/therapist/pazienti/${r.patient_id}`}
                className="block border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-lg">
                      {getPatientName(r.patients || null) || 'Paziente'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {new Date(r.created_at).toLocaleString('it-IT')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{r.total}</div>
                    <div className={`text-xs mt-1 px-2 py-1 rounded inline-block ${
                      r.severity === 'minima' ? 'bg-green-100 text-green-700' :
                      r.severity === 'lieve' ? 'bg-blue-100 text-blue-700' :
                      r.severity === 'moderata' ? 'bg-yellow-100 text-yellow-700' :
                      r.severity === 'grave' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {(r.severity || 'N/A').charAt(0).toUpperCase() + (r.severity || '').slice(1)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {recentResults.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nessun risultato disponibile
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
