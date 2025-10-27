'use client';

import { Suspense, useState, FormEvent } from 'react';
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
  const searchParams = useSearchParams();

  const token_hash =
    searchParams.get('token_hash') ||
    searchParams.get('token') ||
    '';

  // Supabase passa ?type=magiclink|signup|recovery|invite
  const typeParam = (searchParams.get('type') || 'magiclink').toLowerCase();

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      // 1) Se arrivo da magic link/invite, scambio il token per la sessione
      if (token_hash) {
        const supported = ['invite', 'signup', 'magiclink', 'recovery'];
        const type = (supported.includes(typeParam) ? typeParam : 'magiclink') as
          | 'invite'
          | 'signup'
          | 'magiclink'
          | 'recovery';

        const { error: vErr } = await supabase.auth.verifyOtp({
          token_hash,
          type
        });
        if (vErr) throw vErr;
      }

      // 2) Verifico di avere una sessione attiva
      const { data: me, error: meErr } = await supabase.auth.getUser();
      if (meErr || !me?.user) {
        throw new Error('Sessione non attiva. Torna al link dell’email e riprova.');
      }

      // 3) Imposto la password
      const { error: upErr } = await supabase.auth.updateUser({ password });
      if (upErr) throw upErr;

      // 4) Avanti
      router.replace('/onboarding/fatto');
    } catch (e: any) {
      setErr(e?.message || 'Errore imprevisto');
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Crea la tua password</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="password"
          required
          minLength={8}
          placeholder="Nuova password (min 8 caratteri)"
          className="w-full rounded border p-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || password.length < 8}
          className="w-full rounded bg-black text-white p-3 disabled:opacity-50"
        >
          {loading ? 'Salvataggio…' : 'Imposta password'}
        </button>
        {err && <p className="text-red-600 text-sm">{err}</p>}
      </form>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Caricamento…</div>}>
      <Inner />
    </Suspense>
  );
}
