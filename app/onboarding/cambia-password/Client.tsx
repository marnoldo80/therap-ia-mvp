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

      const email = me.user.email?.toLowerCase().trim();
      const user_id = me.user.id;

      // 3. Aggiorna la password
      console.log('🔐 Aggiorno password...');
      const { error: upErr } = await supabase.auth.updateUser({ password });
      if (upErr) {
        console.error('❌ Errore aggiornamento password:', upErr);
        throw upErr;
      }
      console.log('✅ Password aggiornata');

      // 4. Collega il paziente all'utente (chiamata API)
      console.log('🔗 Collego paziente all\'utente...');
      const linkRes = await fetch('/api/link-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, user_id }),
      });

      const linkData = await linkRes.json().catch(() => ({}));
      console.log('📦 Risposta link-patient:', linkData);

      if (!linkRes.ok || !linkData.ok) {
        throw new Error(linkData.error || 'Errore nel collegamento del profilo');
      }

      console.log('✅ Paziente collegato con successo!');

      // 5. Attendi stabilizzazione
      console.log('⏳ Attendo 2 secondi...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 6. Fai login esplicito con email/password
      console.log('🔑 Faccio login esplicito...');
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email!,
        password: password,
      });
      
      if (loginError) {
        console.error('❌ Errore login:', loginError);
        throw new Error('Password impostata ma login fallito: ' + loginError.message);
      }
      
      console.log('✅ Login completato, redirect...');
      router.push('/app/paziente');
      
    } catch (e: any) {
      console.error('❌ Errore:', e);
      setErr(e?.message || 'Errore imprevisto');
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Crea la tua password</h1>
      <p className="text-sm text-gray-600 mb-4">
        Imposta una password sicura per accedere alla tua area paziente.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-2 text-gray-700 font-medium">
            Nuova password
          </label>
          <input
            type="password"
            required
            minLength={8}
            placeholder="Minimo 8 caratteri"
            className="w-full rounded border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading || password.length < 8}
          className="w-full rounded bg-black text-white p-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition"
        >
          {loading ? '⏳ Configurazione in corso...' : 'Conferma e accedi'}
        </button>
        {err && (
          <div className="rounded bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
            <strong>Errore:</strong> {err}
          </div>
        )}
      </form>
      <p className="text-xs text-gray-400 mt-6 text-center">
        Apri la Console (F12) per dettagli tecnici
      </p>
    </div>
  );
}
