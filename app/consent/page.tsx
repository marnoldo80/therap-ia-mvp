'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ConsentContent() {
  const params = useSearchParams();
  const token = params.get('token');

  return (
    <div style={{ padding: 24 }}>
      <h1>Consenso informato</h1>
      <p>Token ricevuto: {token}</p>
      <p>
        Qui verrà mostrato il testo del consenso e il pulsante per accettare o rifiutare.
      </p>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense fallback={<p>Caricamento consenso...</p>}>
      <ConsentContent />
    </Suspense>
  );
}
