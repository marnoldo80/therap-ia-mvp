// app/onboarding/cambia-password/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';

function Inner() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const sp = useSearchParams();

  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function ensureSession() {
      setErr(null); setMsg(null);
      // se non c'è sessione, prova verifyOtp con token_hash passato dalla pagina precedente
      const { data: sessionData } = await supabase.auth.getSession();
      if (!cancelled && sessionData.session) {
        setReady(true); return;
      }
      const token_hash = sp.get('token_hash');
      const type = (sp.get('type') || 'magiclink') as any;
      if (token_hash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type });
        if (!cancelled && error) {
          setErr('Verifica del link fallita: ' + error.message);
        }
      }
      if (!cancelled) setReady(true);
    }
    ensureSession();
    return () => { cancelled = true; };
  }, [supabase, sp]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setErr('Sessione non attiva. Torna al link dell’email e riprova.');
      return;
    }

    if (!pw1 || pw1.length < 8) {
      setErr('La password deve avere almeno 8 caratteri.');
      return;
    }
    if (pw1 !== pw2) {
      setErr('Le password non coincidono.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setMsg('Password impostata correttamente.');
    router.replace('/app/paziente');
  }

  return (
    <main style={{maxWidth: 560, margin: '40px auto', padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'}}>
      <h1 style={{fontSize: 24, marginBottom: 12}}>Imposta la tua password</h1>
      {!ready && <p>Preparazione…</p>}

      <form onSubmit={onSubmit} style={{display: ready ? 'grid' : 'none', gap: 12}}>
        <input
          type="password"
          placeholder="Nuova password (min 8 caratteri)"
          value={pw1}
          onChange={(e) => setPw1(e.target.value)}
          style={{padding: 10, borderRadius: 8, border: '1px solid #ddd'}}
          required
        />
        <input
          type="password"
          placeholder="Conferma password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          style={{padding: 10, borderRadius: 8, border: '1px solid #ddd'}}
          required
        />

        <button
          type="submit"
          disabled={loading}
          style={{padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#f5f5f5'}}
        >
          {loading ? 'Salvataggio…' : 'Salva e continua'}
        </button>
      </form>

      {err && <p style={{color: 'crimson', marginTop: 12}}>{err}</p>}
      {msg && <p style={{color: 'green', marginTop: 12}}>{msg}</p>}
    </main>
  );
}

export default function CambiaPasswordPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
