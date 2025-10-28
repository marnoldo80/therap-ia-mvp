'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Client() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle'|'working'|'done'|'error'>('idle');
  const [msg, setMsg] = useState<string>('Sto preparando la tua area…');

  useEffect(() => {
    (async () => {
      try {
        setStatus('working');

        // 1) prendo l'utente loggato (dopo cambio password è loggato)
        const { data: u, error: eUser } = await supabase.auth.getUser();
        if (eUser) throw eUser;
        const user = u.user;
        if (!user?.email) {
          setMsg('Utente non autenticato. Riapri il link dalla mail.');
          setStatus('error');
          return;
        }

        // 2) aggiorno il record paziente: scrivo user_id dove email combacia e user_id è NULL
        const { error: eUpdate } = await supabase
          .from('patients')
          .update({ user_id: user.id })
          .eq('email', user.email)
          .is('user_id', null);

        if (eUpdate) throw eUpdate;

        // 3) (opzionale) controllo che ora esista il paziente collegato
        const { data: rows, error: eCheck } = await supabase
          .from('patients')
          .select('id,user_id,email')
          .eq('user_id', user.id)
          .limit(1);

        if (eCheck) throw eCheck;
        if (!rows || rows.length === 0) {
          setMsg('Paziente non trovato. Contatta il terapeuta.');
          setStatus('error');
          return;
        }

        setStatus('done');
        // 4) vai all’area paziente
        router.replace('/app/paziente');
      } catch (err) {
        console.error(err);
        setMsg('Errore nel collegamento del profilo. Riprova dal link email.');
        setStatus('error');
      }
    })();
  }, [router]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-3">Tutto pronto…</h1>
      <p>{msg}</p>
      {status === 'working' && <p>Attendi qualche secondo…</p>}
    </div>
  );
}
