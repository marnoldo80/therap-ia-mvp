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
  const [msg, setMsg] = useState('Sto preparando la tua area…');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user?.email) {
        setMsg('Sessione non attiva. Riapri il link dalla mail.');
        return;
      }
      const email = (data.user.email || '').toLowerCase().trim();
      const user_id = data.user.id;

      const res = await fetch('/api/link-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, user_id }),
      });

      const j = await res.json().catch(() => ({}));
      if (res.ok && j?.ok) {
        router.replace('/app/paziente');
      } else {
        if (j?.error === 'patient_not_found_after_patch') {
          console.warn('Diagnostica paziente:', j);
          setMsg('Paziente non trovato. Contatta il terapeuta (email non combacia o già collegato).');
        } else if (j?.step === 'patch') {
          console.error('Errore Supabase PATCH:', j?.resp);
          setMsg('Errore nel collegamento del profilo. Riapri il link dalla mail o avvisa il terapeuta.');
        } else {
          setMsg('Non riesco a collegare il profilo. Riprova dal link email.');
        }
      }
    })();
  }, [router]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-3">Tutto pronto…</h1>
      <p>{msg}</p>
    </div>
  );
}
