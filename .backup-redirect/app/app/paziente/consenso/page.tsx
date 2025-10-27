'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    (async () => {
      setErr(null); setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setErr('Non autenticato'); setLoading(false); return; }

      // Trova il paziente collegato via EMAIL (MVP)
      const email = user.email;
      if (!email) { setErr('Email utente non disponibile'); setLoading(false); return; }

      const { data: p, error: pe } = await supabase
        .from('patients')
        .select('id')
        .eq('email', email)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (pe) { setErr(pe.message); setLoading(false); return; }
      if (!p?.id) { setErr('Paziente non trovato. Contatta il terapeuta.'); setLoading(false); return; }

      setPatientId(p.id);

      // Se ha già un consenso → vai alla pagina paziente
      const { data: c, error: ce } = await supabase
        .from('consents')
        .select('id')
        .eq('patient_id', p.id)
        .limit(1);

      if (ce) { setErr(ce.message); setLoading(false); return; }
      if (c && c.length > 0) { router.replace('/app/paziente'); return; }

      setLoading(false);
    })();
  }, [router]);

  async function accept() {
    if (!patientId) return;
    try {
      setErr(null); setAccepting(true);

      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

      const { error } = await supabase
        .from('consents')
        .insert({
          patient_id: patientId,
          accepted: true,
          version: 'v1',
          language: 'it',
          user_agent: userAgent,
          ip: null
        });

      if (error) throw error;
      router.replace('/app/paziente');
    } catch (e: any) {
      setErr(e?.message || 'Errore durante il salvataggio del consenso.');
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4 text-center">Consenso Privacy (GDPR)</h1>

      {loading && <div className="text-center">Caricamento…</div>}
      {err && <div className="p-3 mb-3 border border-red-300 bg-red-50 rounded text-sm">{err}</div>}

      {!loading && !err && (
        <div className="space-y-4">
          <div className="border rounded p-4 text-sm leading-relaxed">
            <p className="mb-2"><strong>Versione:</strong> v1 · <strong>Lingua:</strong> IT</p>
            <p className="mb-2">
              Utilizziamo i tuoi dati esclusivamente per l’erogazione del servizio di psicoterapia digitale,
              per finalità cliniche e organizzative. I dati sono conservati su infrastrutture UE/SEE.
            </p>
            <p className="mb-2">
              Puoi revocare il consenso in qualsiasi momento contattando il tuo terapeuta. Per maggiori dettagli,
              consulta l’informativa completa disponibile su richiesta.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={accept}
              disabled={!patientId || accepting}
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            >
              {accepting ? 'Salvataggio…' : 'Accetto'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
