'use client';
import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Client() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token_hash = searchParams.get('token_hash') || searchParams.get('token') || '';
  const typeParam = (searchParams.get('type') || 'magiclink').toLowerCase();
  
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      console.log('🔐 Inizio impostazione password...');

      // 1. Verifica il token se presente
      if (token_hash) {
        console.log('🔑 Verifico token_hash...');
        const supported = ['invite', 'signup', 'magiclink', 'recovery'];
        const type = (supported.includes(typeParam) ? typeParam : 'magiclink') as
          | 'invite' | 'signup' | 'magiclink' | 'recovery';
        
        const { error: vErr } = await supabase.auth.verifyOtp({ token_hash, type });
        if (vErr) {
          console.error('❌ Errore verifica token:', vErr);
          throw vErr;
        }
        console.log('✅ Token verificato');
      }

      // 2. Verifica che l'utente sia autenticato
      const { data: me, error: meErr } = await supabase.auth.getUser();
      if (meErr || !me?.user) {
        console.error('❌ Utente non autenticato dopo verifyOtp');
        throw new Error('Sessione non attiva. Torna al link dell\'email e riprova.');
      }
      console.log('✅ Utente autenticato:', me.user.id, me.user.email);

      // 3. Aggiorna la password
      console.log('🔐 Aggiorno password...');
      const { error: upErr } = await supabase.auth.updateUser({ password });
      if (upErr) {
        console.error('❌ Errore aggiornamento password:', upErr);
        throw upErr;
      }
      console.log('✅ Password aggiornata');

      // 4. IMPORTANTE: Aspetta che la sessione si stabilizzi
      console.log('⏳ Attendo stabilizzazione sessione...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 5. Verifica nuovamente la sessione prima del redirect
      const { data: sessionCheck } = await supabase.auth.getSession();
      console.log('📋 Sessione finale:', sessionCheck);

      if (!sessionCheck?.session) {
        throw new Error('Sessione non valida dopo aggiornamento password');
      }

      console.log('✅ Tutto OK, redirect a /onboarding/fatto');
      router.replace('/onboarding/fatto');
      
    } catch (e: any) {
      console.error('❌ Errore:', e);
      setErr(e?.message || 'Errore imprevisto');
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Crea la tua password</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-2 text-gray-700">
            Nuova password (minimo 8 caratteri)
          </label>
          <input
            type="password"
            required
            minLength={8}
            placeholder="Inserisci la tua password"
            className="w-full rounded border p-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading || password.length < 8}
          className="w-full rounded bg-black text-white p-3 disabled:opacity-50 hover:bg-gray-800"
        >
          {loading ? 'Salvataggio in corso...' : 'Imposta password'}
        </button>
        {err && (
          <div className="rounded bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
            {err}
          </div>
        )}
      </form>
      <p className="text-xs text-gray-500 mt-4">
        Apri la Console (F12) per vedere i dettagli tecnici.
      </p>
    </div>
  );
}
