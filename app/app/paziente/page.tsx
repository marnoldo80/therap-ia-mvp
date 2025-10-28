'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
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
    let mounted = true;

    (async () => {
      try {
        console.log('🔐 Verifico autenticazione...');
        
        // Aspetta un momento per dare tempo ai cookie di caricarsi
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('📋 Sessione:', session);
        console.log('❌ Errore sessione:', sessionError);

        if (!session?.user) {
          console.error('⛔ Nessuna sessione attiva');
          
          // Prova a recuperare l'utente direttamente
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          console.log('👤 Tentativo getUser:', user);
          console.log('❌ Errore getUser:', userError);
          
          if (!user) {
            setErr('Sessione non valida. Per favore riapri il link dall\'email.');
            setLoading(false);
            return;
          }
          
          // Se arriviamo qui, abbiamo l'utente ma non la sessione
          console.log('✅ Utente trovato:', user.id, user.email);
          
          const { data: p, error: pe } = await supabase
            .from('patients')
            .select('id, display_name, email, phone, goals, issues')
            .eq('user_id', user.id)
            .maybeSingle();

          if (pe || !p) {
            console.error('❌ Paziente non trovato:', pe);
            setErr('Profilo paziente non trovato. Contatta il terapeuta.');
            setLoading(false);
            return;
          }

          if (mounted) {
            setPatient(p as Patient);
            setLoading(false);
          }
          return;
        }

        console.log('✅ Sessione valida:', session.user.id, session.user.email);

        const { data: p, error: pe } = await supabase
          .from('patients')
          .select('id, display_name, email, phone, goals, issues')
          .eq('user_id', session.user.id)
          .maybeSingle();

        console.log('📋 Risultato paziente:', { p, pe });

        if (pe) {
          console.error('❌ Errore query paziente:', pe);
          setErr(pe.message);
          setLoading(false);
          return;
        }

        if (!p?.id) {
          console.error('❌ Paziente non trovato per user_id:', session.user.id);
          setErr('Profilo paziente non trovato. Contatta il terapeuta.');
          setLoading(false);
          return;
        }

        console.log('✅ Paziente caricato:', p);
        
        if (mounted) {
          setPatient(p as Patient);
          setLoading(false);
        }
      } catch (e: any) {
        console.error('❌ Errore generale:', e);
        if (mounted) {
          setErr(e?.message || 'Errore sconosciuto');
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
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
    </div>
  );
}
