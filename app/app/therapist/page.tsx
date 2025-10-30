'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';

export default function Page() {
  const supabase = getSupabaseBrowserClient();
  const [err, setErr] = useState<string|null>(null);
  const [therapist, setTherapist] = useState<{ display_name: string|null; address: string|null; vat_number: string|null; }|null>(null);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [nextAppts, setNextAppts] = useState<any[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [weekAppts, setWeekAppts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setErr(null); setLoading(true);
      
      // Attendi 500ms per la sessione
      await new Promise(r => setTimeout(r, 500));
      
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
        setTherapist(data || null);
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

      // Tutti i pazienti
      {
        const { data, error } = await supabase
          .from('patients')
          .select('id,display_name,email,created_at')
          .eq('therapist_user_id', user.id)
          .order('display_name', { ascending: true });
        if (error) setErr(error.message);
        setAllPatients(data || []);
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
        setNextAppts(data || []);
      }

      setLoading(false);
    })();
  }, []);

  function getPatientName(rel: any): string {
    if (!rel) return '';
    if (Array.isArray(rel)) return rel[0]?.display_name || '';
    return rel.display_name || '';
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold">Area Terapeuta</h1>
          <p className="text-gray-600 mt-1">
            Benvenuto, {therapist?.display_name || 'Dottore'}
          </p>
        </div>
        <Link 
          href="/app/therapist/onboarding" 
          className="text-sm text-blue-600 hover:underline"
        >
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
          href="/app/therapist/questionari"
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-6 text-center font-semibold shadow-lg transition"
        >
          <div className="text-4xl mb-2">📋</div>
          <div>Questionari</div>
        </Link>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="text-gray-500 text-sm font-medium">Pazienti totali</div>
          <div className="text-3xl font-bold mt-2">{totalPatients}</div>
        </div>
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="text-gray-500 text-sm font-medium">Appuntamenti questa settimana</div>
          <div className="text-3xl font-bold mt-2">{weekAppts}</div>
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
                    a.status === 'scheduled' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
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

        {/* Lista pazienti */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">I tuoi pazienti</h2>
            <div className="flex gap-3">
              <Link href="/app/therapist/pazienti" className="text-sm text-blue-600 hover:underline">
                Vedi tutti
              </Link>
              <Link href="/app/therapist/pazienti/nuovo" className="text-sm text-blue-600 hover:underline">
                + Nuovo
              </Link>
            </div>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {allPatients.map(p => (
              <Link 
                key={p.id} 
                href={`/app/therapist/pazienti/${p.id}`}
                className="block border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="font-medium text-lg">{p.display_name || 'Senza nome'}</div>
                <div className="text-sm text-gray-600 mt-1">{p.email || 'Nessuna email'}</div>
              </Link>
            ))}
            {allPatients.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nessun paziente ancora
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
