'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function Inner() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const code = sp.get('code');
    const error_description = sp.get('error_description');

    (async () => {
      if (error_description) {
        router.replace(
          '/onboarding/cambia-password?error=' +
            encodeURIComponent(error_description)
        );
        return;
      }

      if (!code) {
        // Nessun code → torna alla home (o mostra errore user-friendly)
        router.replace('/');
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        router.replace(
          '/onboarding/cambia-password?error=' +
            encodeURIComponent(error.message)
        );
        return;
      }

      // Sessione OK → vai a crea password
      router.replace('/onboarding/cambia-password');
    })();
  }, [sp, router]);

  return (
    <div style={{padding: 24}}>
      <h1>Conferma email in corso…</h1>
      <p>Attendi un momento, stiamo attivando la tua sessione.</p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
