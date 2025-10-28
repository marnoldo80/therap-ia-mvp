'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Patient = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  goals: string | null;
  issues: string | null;
};

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    (async () => {
      setErr(null);
      setLoading(true);

      console.log('🔐 Verifico autenticazione...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ Utente non autenticato');
        setErr('Non autenticato. Effettua il login.');
        setLoading(false);
        return;
      }

      console.log('✅ Utente autenticato:', user.id, user.email);

      // 1) Cerca il paziente usando user_id (più affidabile)
      console.log('🔍 Cerco paziente con user_id:', user.id);
      
      const { data: p, error: pe } = await supabase
        .from('patients')
        .select('id, display_name, email, phone, goals, issues')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('📋 Risultato ricerca paziente:', { p, pe });

      if (pe) {
        console.error('❌ Errore query paziente:', pe);
        setErr(pe.message);
        setLoading(false);
        return;
      }

      if (!p?.id) {
        console.error('❌ Paziente non trovato per user_id:', user.id);
        setErr('Profilo paziente non trovato. Contatta il terapeuta.');
        setLoading(false);
        return;
      }

      console.log('✅ Paziente trovato:', p);
      setPatient(p as Patient);

      // 2) Verifica se ha già dato il consenso
      console.log('🔍 Verifico consenso per patient_id:', p.id);
      
      const { data: c, error: ce } = await supabase
        .from('consents')
        .select('id')
        .eq('patient_id', p.id)
        .limit(1);

      console.log('📋 Risultato consenso:', { c, ce });

      if (ce) {
        console.error('❌ Errore query consenso:', ce);
        setErr(ce.message);
        setLoading(false);
        return;
      }

      if (!c || c.length === 0) {
        console.log('⚠️ Consenso mancante, redirect a /app/paziente/consenso');
        router.replace('/app/paziente/consenso');
        return;
      }

      console.log('✅ Tutto OK, mostro dashboard');
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p>Caricamento della tua area...</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="rounded bg-red-50 border border-red-200 p-4 text-red-700">
          <p className="font-semibold mb-2">Errore</p>
          <p className="text-sm">{err}</p>
          <p className="text-xs mt-3 text-gray-600">
            Apri la Console (F12) per vedere i dettagli tecnici.
          </p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p>Profilo paziente non disponibile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Benvenuto nella tua Area Paziente</h1>

      <div className="border rounded p-4 bg-white shadow-sm">
        <div className="font-semibold mb-3 text-lg">Dati personali</div>
        <div className="text-sm space-y-2">
          <div>
            <span className="text-gray-500">Nome: </span>
            <span className="font-medium">{patient.display_name || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Email: </span>
            <span className="font-medium">{patient.email || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Telefono: </span>
            <span className="font-medium">{patient.phone || '—'}</span>
          </div>
        </div>
      </div>

      {patient.issues && (
        <div className="border rounded p-4 bg-white shadow-sm">
          <div className="font-semibold mb-2">Problemi</div>
          <div className="text-sm whitespace-pre-wrap">{patient.issues}</div>
        </div>
      )}

      {patient.goals && (
        <div className="border rounded p-4 bg-white shadow-sm">
          <div className="font-semibold mb-2">Obiettivi</div>
          <div className="text-sm whitespace-pre-wrap">{patient.goals}</div>
        </div>
      )}

      <div className="pt-4 border-t">
        <Link href="/login" className="text-sm text-blue-600 hover:underline">
          Esci
        </Link>
      </div>
    </div>
  );
}
