// app/onboarding/consenso/page.tsx
'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';

function Inner() {
  return (
    <main style={{maxWidth: 560, margin: '40px auto', padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'}}>
      <h1 style={{fontSize: 24, marginBottom: 12}}>Consenso informato</h1>
      <p style={{lineHeight: 1.5, marginBottom: 16}}>
        Per completare l’iscrizione conferma di aver letto e accettato il consenso informato al trattamento dei dati.
      </p>

      <ul style={{lineHeight: 1.6, marginBottom: 16}}>
        <li>Lo <strong>username è la tua email</strong> (quella che ha ricevuto l’invito).</li>
        <li>Nel passo successivo ti chiediamo di <strong>impostare una password</strong>.</li>
      </ul>

      <div style={{marginTop: 24, display: 'flex', gap: 12}}>
        <Link href="/onboarding/cambia-password"
              style={{padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', textDecoration: 'none'}}>
          Crea password
        </Link>
        <Link href="/"
              style={{padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', textDecoration: 'none'}}>
          Annulla
        </Link>
      </div>
    </main>
  );
}

export default function ConsensoPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
