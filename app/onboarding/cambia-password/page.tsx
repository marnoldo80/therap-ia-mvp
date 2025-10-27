'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page() {
  const router = useRouter();
  const sp = useSearchParams();
  const [pwd, setPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(sp.get('error'));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      setErrMsg('Sessione non attiva. Torna al link dell’email e riprova.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);

    if (error) {
      setErrMsg(error.message);
      return;
    }

    router.replace('/app/paziente');
  };

  return (
    <div style={{maxWidth: 420, margin: '40px auto', padding: 24}}>
      <h1>Crea la tua password</h1>
      {errMsg ? (
        <div style={{background:'#fee', border:'1px solid #f99', padding:12, marginTop:12}}>
          {errMsg}
        </div>
      ) : null}
      <form onSubmit={submit} style={{marginTop:16}}>
        <label style={{display:'block', marginBottom:8}}>
          Nuova password
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            required
            minLength={8}
            style={{display:'block', width:'100%', padding:10, marginTop:6}}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{marginTop:12, padding:'10px 16px'}}
        >
          {loading ? 'Salvataggio…' : 'Imposta password'}
        </button>
      </form>
    </div>
  );
}
