'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Client() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const q = sp.toString();
    router.replace(`/onboarding/cambia-password${q ? `?${q}` : ''}`);
  }, [router, sp]);

  return <div className="p-6">Reindirizzamento…</div>;
}
