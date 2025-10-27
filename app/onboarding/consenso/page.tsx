'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ConsensoPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConsent, setNeedsConsent] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        router.replace('/');
        return;
      }
      const { data: patient, error } = await supabase
        .from('patients')
        .select('id, consent_required, consent_accepted_at')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) setError(error.message);
      const n = patient ? (patient.consent_required || !patient.consent_accepted_at) : true;
      if (mounted) {
        setNeedsConsent(!!n);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [router, supabase]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Non autenticato');

      const { data: patient, error: pErr } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (pErr) throw pErr;

      const { error: updErr } = await supabase
        .from('patients')
        .update({ consent_required: false, consent_accepted_at: new Date().toISOString() })
        .eq('id', patient.id);

      if (updErr) throw updErr;

      router.replace('/app/paziente');
    } catch (e: any) {
      setError(e.message ?? 'Errore nel salvataggio del consenso');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) return <div className="p-6">Verifica stato consenso…</div>;
  if (!needsConsent) {
    router.replace('/app/paziente');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Consenso informato</h1>
      <p className="text-sm">
        Questo consenso autorizza il trattamento dei dati e l’uso dell’applicazione per il percorso terapeutico.
        Puoi revocarlo in qualunque momento dalle impostazioni.
      </p>

      <div className="border rounded-2xl p-4 max-h-72 overflow-auto text-sm">
        <p><strong>Informativa:</strong> Inserisci qui il testo legale del consenso.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleAccept}
        disabled={accepting}
        className="rounded-2xl px-4 py-3 shadow-sm border font-medium hover:opacity-90"
      >
        {accepting ? 'Registrazione consenso…' : 'Accetto e continuo'}
      </button>
    </div>
  );
}
