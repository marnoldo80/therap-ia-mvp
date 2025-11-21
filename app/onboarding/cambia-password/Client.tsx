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
  const typeParam = (searchParams.get('type') || 'recovery').toLowerCase();
  
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      console.log('🔐 Inizio impostazione password...');

      let currentUser = null;

      // 1. Se abbiamo un token, verifichiamo e otteniamo la sessione
      if (token_hash) {
        console.log('🔑 Verifico token_hash...', token_hash);
        
        const { data: sessionData, error: vErr } = await supabase.auth.verifyOtp({ 
          token_hash, 
          type: 'recovery'
        });
        
        if (vErr) {
          console.error('❌ Errore verifica token:', vErr);
          throw new Error(`Errore verifica token: ${vErr.message}`);
        }

        console.log('✅ Token verificato:', sessionData);
        
        // La sessione dovrebbe essere attiva dopo verifyOtp
        if (sessionData.session && sessionData.user) {
          currentUser = sessionData.user;
          console.log('✅ Utente dalla verifica token:', currentUser.id, currentUser.email);
        }
      }

      // 2. Se non abbiamo ancora l'utente, prova a recuperarlo
      if (!currentUser) {
        console.log('🔍 Recupero utente dalla sessione attiva...');
        
        // Forza refresh della sessione
        const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
        if (refreshErr) {
          console.error('❌ Errore refresh sessione:', refreshErr);
        } else {
          console.log('✅ Sessione refreshed:', refreshData);
        }

        const { data: userData, error: userErr } = await supabase.auth.getUser();
        
        if (userErr || !userData?.user) {
          console.error('❌ Utente non trovato dopo refresh:', userErr);
          throw new Error('Sessione scaduta. Clicca nuovamente il link nell\'email.');
        }

        currentUser = userData.user;
        console.log('✅ Utente recuperato:', currentUser.id, currentUser.email);
      }

      if (!currentUser) {
        throw new Error('Impossibile autenticare l\'utente. Riprova con il link dell\'email.');
      }

      const email = currentUser.email?.toLowerCase().trim();
      const user_id = currentUser.id;

      console.log('📧 Email utente:', email);
      console.log('🆔 User ID:', user_id);

      // 3. Aggiorna la password
      console.log('🔐 Aggiorno password...');
      const { data: updateData, error: upErr } = await supabase.auth.updateUser({ password });
      
      if (upErr) {
        console.error('❌ Errore aggiornamento password:', upErr);
        throw new Error(`Errore aggiornamento password: ${upErr.message}`);
      }
      
      console.log('✅ Password aggiornata:', updateData);

      // 4. Collega il paziente all'utente (chiamata API)
      console.log('🔗 Collego paziente all\'utente...');
      
      try {
        const linkRes = await fetch('/api/link-patient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, user_id }),
        });

        const linkData = await linkRes.json().catch(() => ({}));
        console.log('📦 Risposta link-patient:', linkData);

        if (!linkRes.ok) {
          console.error('❌ Errore HTTP link-patient:', linkRes.status, linkRes.statusText);
          throw new Error(`Errore collegamento profilo: ${linkData.error || 'Errore sconosciuto'}`);
        }

        if (!linkData.ok) {
          console.error('❌ Errore logica link-patient:', linkData);
          throw new Error(linkData.error || 'Errore nel collegamento del profilo');
        }

        console.log('✅ Paziente collegato con successo!');
      } catch (linkError) {
        console.error('❌ Errore generale link-patient:', linkError);
        // Se il collegamento fallisce, continua comunque (potrebbe essere già collegato)
        console.log('⚠️ Continuo nonostante errore collegamento...');
      }

      // 5. Attendi stabilizzazione e verifica finale
      console.log('⏳ Attendo stabilizzazione sessione...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 6. Verifica finale che tutto sia ok
      const { data: finalUser } = await supabase.auth.getUser();
      if (!finalUser?.user) {
        throw new Error('Sessione persa durante il processo. Riprova.');
      }

      console.log('✅ Verifica finale OK, redirect a /app/paziente');
      
      // 7. Redirect finale
      window.location.href = '/app/paziente';
      
    } catch (e: any) {
      console.error('❌ Errore completo:', e);
      setErr(e?.message || 'Errore imprevisto durante la configurazione');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #0b1022 0%, #1e293b 50%, #334155 100%)'
    }}>
      <div className="max-w-md w-full rounded-2xl p-8 shadow-2xl" style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{
            background: 'linear-gradient(135deg, #7aa2ff 0%, #9333ea 100%)',
            boxShadow: '0 10px 25px rgba(122, 162, 255, 0.3)'
          }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'white' }}>
            Imposta la tua Password
          </h1>
          <p style={{ color: '#a8b2d6' }}>
            Crea una password sicura per accedere alla tua area paziente
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
              Nuova Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="Minimo 8 caratteri"
              className="w-full px-4 py-3 rounded-lg outline-none transition-all duration-300"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '2px solid rgba(255,255,255,0.1)',
                color: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs mt-1" style={{ color: '#a8b2d6' }}>
              La password deve contenere almeno 8 caratteri
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || password.length < 8}
            className="w-full py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: (loading || password.length < 8) ? '#6b7280' : 'linear-gradient(135deg, #7aa2ff 0%, #9333ea 100%)',
              color: 'white',
              boxShadow: (loading || password.length < 8) ? 'none' : '0 10px 25px rgba(122, 162, 255, 0.3)'
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Configurazione in corso...
              </div>
            ) : (
              '🔐 Conferma e Accedi'
            )}
          </button>

          {err && (
            <div className="p-4 rounded-lg text-sm" style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444'
            }}>
              <div className="flex items-start gap-2">
                <span>⚠️</span>
                <div>
                  <strong>Errore:</strong> {err}
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Debug info */}
        <div className="mt-6 p-3 rounded-lg text-xs" style={{
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#64748b'
        }}>
          <p>🔧 Debug: Apri la Console (F12) per dettagli tecnici</p>
          {token_hash && <p>🔑 Token presente: {token_hash.substring(0, 8)}...</p>}
        </div>
      </div>
    </div>
  );
}
