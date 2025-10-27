'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function Inner() {
  const router = useRouter();
  const sp = useSearchParams();

  // Qui potresti mostrare il testo del consenso, ma per ora
  // reindirizziamo alla pagina di creazione password mantenendo i parametri
  useEffect(() => {
    const q = sp.toString();
    router.replace(`/onboarding/cambia-password${q ? `?${q}` : ''}`);
  }, [router, sp]);

  return <div className="p-6">Reindirizzamento…</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Caricamento…</div>}>
      <Inner />
    </Suspense>
  );
}
