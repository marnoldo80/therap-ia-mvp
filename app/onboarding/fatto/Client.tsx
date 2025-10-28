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
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user?.email) {
          setMsg('Sessione non attiva. Riapri il link dalla mail.');
          return;
        }
        const email = data.user.email.toLowerCase();
        const user_id = data.user.id;

        const res = await fetch('/api/link-patient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, user_id })
        });

        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          if (j?.error === 'patient_not_found') {
            setMsg('Paziente non trovato. Contatta il terapeuta.');
            return;
          }
          setMsg('Errore nel collegamento del profilo. Riprova dal link email.');
          return;
        }

        router.replace('/app/paziente');
      } catch (e) {
        setMsg('Errore inatteso. Riprova dal link email.');
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
