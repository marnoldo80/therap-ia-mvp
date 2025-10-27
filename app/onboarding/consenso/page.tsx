// app/onboarding/consenso/page.tsx
'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams, useRouter } from 'next/navigation';

function Inner() {
  const supabase = createClientComponentClient();
  const sp = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'idle'|'verifying'|'ok'|'error'>('idle');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function ensureSession() {
      setStatus('verifying');
      setMsg(null);

      // 1) Se esiste già una sessione, siamo ok.
      const { data: sessionData } = await supabase.auth.getSession();
      if (!cancelled && sessionData.session) {
        setStatus('ok');
        return;
      }

      // 2) Prova a verificare se è stato passato token_hash in query (dalla mail)
      const token_hash = sp.get('token_hash');
      const type = (sp.get('type') || 'magiclink') as any;

      if (token_hash) {
        const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });
        if (!cancelled && error) {
          setStatus('error');
          setMsg(error.message);
          return;
        }
        if (!cancelled) {
          setStatus('ok');
          return;
        }
      } else {
        // nessun token → utente arrivato “a mano” o link vecchio
        setStatus('ok'); // consentiamo comunque di proseguire, ma non potrà salvare la password senza sessione
      }
    }
    ensureSession();
    return () => { cancelled = true; };
  }, [supabase, sp]);

  const verifying = status === 'verifying';

  return (
    <main style={{maxWidth: 560, margin: '40px auto', padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'}}>
      <h1 style={{fontSize: 24, marginBottom: 12}}>Consenso informato</h1>

      {verifying && <p style={{marginBottom: 16}}>Verifica link…</p>}
      {status === 'error' && <p style={{color:'crimson', marginBottom: 16}}>Errore verifica: {msg}</p>}

      <p style={{lineHeight: 1.5, marginBottom: 16}}>
        Conferma di aver letto e accettato il consenso informato al trattamento dei dati.
      </p>

      <ul style={{lineHeight: 1.6, marginBottom: 16}}>
        <li>Lo <strong>username è la tua email</strong> (quella su cui hai ricevuto l’invito).</li>
        <li>Nel passo successivo imposterai la <strong>password</strong>.</li>
      </ul>

      <div style={{marginTop: 24, display: 'flex', gap: 12}}>
        <Link
          href={`/onboarding/cambia-password?${sp.toString()}`}
          style={{pointerEvents: verifying ? 'none' : 'auto', opacity: verifying ? 0.6 : 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', textDecoration: 'none'}}
        >
          Crea password
        </Link>
        <button
          onClick={() => router.replace(`/onboarding/consenso?${sp.toString()}`)}
          style={{padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', background:'#f5f5f5'}}
        >
          Riprova verifica
        </button>
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
