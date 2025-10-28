'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function Inner() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    // sp può essere null in fase di type-check → usa optional chaining
    const err = sp?.get('error_description');
    if (err) {
      // reindirizza a una pagina d’errore o resta qui con messaggio
      router.replace(`/onboarding/errore?msg=${encodeURIComponent(err)}`);
      return;
    }
    // in questa pagina vogliamo solo inoltrare il paziente dentro l’app
    router.replace('/app/paziente');
  }, [sp, router]);

  return <div className="p-6 text-sm">Reindirizzamento in corso…</div>;
}

export default function Page() {
  // Next 15: useSearchParams deve stare dentro Suspense
  return (
    <Suspense fallback={<div className="p-6 text-sm">Caricamento…</div>}>
      <Inner />
    </Suspense>
  );
}
