'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ActivatePage() {
  const params = useParams();
  const token = String(params?.token || '');
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [status, setStatus] = useState<'checking'|'ready'|'error'>('checking');
  const [error, setError] = useState<string| null>(null);
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/onboarding/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || 'Token non valido');
        }
        if (alive) setStatus('ready');
      } catch (e: any) {
        if (alive) {
          setError(e.message ?? 'Errore inatteso');
          setStatus('error');
        }
      }
    })();
    return () => { alive = false; };
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pwd,
      });
      if (error) throw error;

      const res = await fetch('/api/onboarding/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Errore nel consumo del token');
      }
      const json = await res.json();
      if (json.mustChange) {
        router.replace('/onboarding/cambia-password');
        return;
      }
      if (json.needsConsent) {
        router.replace('/onboarding/consenso');
        return;
      }
      router.replace('/app/paziente');
    } catch (e: any) {
      setError(e.message ?? 'Credenziali non valide');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'checking') return <div className="p-6">Verifica link…</div>;
  if (status === 'error') return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-2">Link non valido</h1>
      <p className="text-sm text-red-600">{error}</p>
      <p className="text-xs mt-3">Contatta il tuo terapeuta per richiedere un nuovo invito.</p>
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Attiva il tuo accesso</h1>
      <p className="text-sm text-muted-foreground">
        Inserisci l’email e la password temporanea ricevute nella mail di invito.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={handleLogin} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            className="w-full border rounded-xl px-3 py-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Password temporanea</label>
          <input
            type="password"
            className="w-full border rounded-xl px-3 py-2"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl px-4 py-3 shadow-sm border font-medium hover:opacity-90"
        >
          {submitting ? 'Accesso in corso…' : 'Accedi'}
        </button>
      </form>

      <p className="text-xs text-muted-foreground">
        Dopo l’accesso ti chiederemo di impostare una nuova password.
      </p>
    </div>
  );
}
