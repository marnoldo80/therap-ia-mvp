'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function LoginPazienteContent() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) throw loginError;

      // Verifica che sia un paziente usando patient_user_id
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('patient_user_id', loginData.user.id)
        .single();

      if (!patient) {
        await supabase.auth.signOut();
        throw new Error('Account non riconosciuto come paziente');
      }

      // Attendi che la sessione sia salvata correttamente
      await new Promise(r => setTimeout(r, 2000));
      
      // Usa router.push per mantenere la sessione
      router.push('/app/paziente');
      
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'autenticazione');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #0b1022 0%, #1e293b 50%, #334155 100%)'
    }}>
      <div className="max-w-md w-full rounded-2xl p-8 shadow-2xl" style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{
            background: 'linear-gradient(135deg, #7aa2ff 0%, #9333ea 100%)',
            boxShadow: '0 10px 25px rgba(122, 162, 255, 0.3)'
          }}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'white' }}>
            Area Paziente
          </h1>
          <p style={{ color: '#a8b2d6' }}>
            Accedi alla tua area personale
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg outline-none transition-all duration-300"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '2px solid rgba(255,255,255,0.1)',
                color: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              placeholder="tua@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-lg outline-none transition-all duration-300"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '2px solid rgba(255,255,255,0.1)',
                color: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-4 rounded-lg text-sm" style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            style={{
              background: loading ? '#6b7280' : 'linear-gradient(135deg, #7aa2ff 0%, #9333ea 100%)',
              color: 'white',
              boxShadow: loading ? 'none' : '0 10px 25px rgba(122, 162, 255, 0.3)'
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Accesso in corso...
              </div>
            ) : (
              'Accedi alla tua area'
            )}
          </button>
        </form>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <a 
            href="/login" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 hover:scale-105"
            style={{ 
              color: '#a8b2d6',
              textDecoration: 'none',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            ← Torna alla scelta
          </a>
        </div>

        {/* Info Card */}
        <div className="mt-6 p-4 rounded-lg" style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <div className="flex items-start gap-3">
            <div className="text-xl">💡</div>
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'white' }}>
                Prima volta?
              </p>
              <p className="text-sm" style={{ color: '#a8b2d6' }}>
                Usa le credenziali che il tuo terapeuta ti ha inviato via email. 
                Se non le hai ricevute, contatta il tuo terapeuta.
              </p>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-4 text-center">
          <p className="text-xs" style={{ color: '#64748b' }}>
            🔒 La tua privacy è protetta da crittografia end-to-end
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPazientePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0b1022 0%, #1e293b 50%, #334155 100%)' }}>
        <div className="flex items-center gap-3" style={{ color: 'white' }}>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          Caricamento...
        </div>
      </div>
    }>
      <LoginPazienteContent />
    </Suspense>
  );
}
