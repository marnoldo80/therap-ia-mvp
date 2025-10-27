// app/onboarding/cambia-password/page.tsx
'use client';

import React, { useState, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

function Inner() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
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
    // porta il paziente alla sua area
    router.replace('/app/paziente');
  }

  return (
    <main style={{maxWidth: 560, margin: '40px auto', padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'}}>
      <h1 style={{fontSize: 24, marginBottom: 12}}>Imposta la tua password</h1>
      <p style={{lineHeight: 1.5, marginBottom: 16}}>
        User name: la tua email. Inserisci qui sotto la nuova password.
      </p>

      <form onSubmit={onSubmit} style={{display: 'grid', gap: 12}}>
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
