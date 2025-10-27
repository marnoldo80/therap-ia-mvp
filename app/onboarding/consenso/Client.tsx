'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Client() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState('Verifica in corso…');

  useEffect(() => {
    (async () => {
      try {
        // 1) Caso classico: redirect con #access_token & #refresh_token nel fragment
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const h = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
        const access_token = h.get('access_token');
        const refresh_token = h.get('refresh_token');

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
          router.replace('/onboarding/cambia-password');
          return;
        }

        // 2) Altro caso: verify link con ?token_hash=... (o ?token=...) & type=magiclink/invite
        const token_hash = searchParams.get('token_hash') || searchParams.get('token');
        const type = (searchParams.get('type') || 'magiclink') as
          | 'magiclink' | 'recovery' | 'invite' | 'signup' | 'email_change';

        if (token_hash) {
          const t = type === 'invite' ? 'invite' : 'email'; // Supabase usa 'email' per magiclink/recovery
          const { error } = await supabase.auth.verifyOtp({ type: t as any, token_hash });
          if (error) throw error;
          router.replace('/onboarding/cambia-password');
          return;
        }

        setMsg('Link non valido. Riapri il link dalla mail.');
      } catch (e:any) {
        console.error(e);
        setMsg('Errore durante la verifica. Riapri il link dalla mail.');
      }
    })();
  }, [router, searchParams]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-3">Verifica accesso…</h1>
      <p>{msg}</p>
    </div>
  );
}
