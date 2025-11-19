'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function LoginTerapeutaContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'login';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { user_type: 'therapist' } }
        });

        if (signUpError) throw signUpError;
        if (!signUpData.user || !signUpData.session) throw new Error('Errore creazione account');

        const { error: insertError } = await supabase
          .from('therapists')
          .insert({ user_id: signUpData.user.id, onboarding_completed: false });

        if (insertError) throw insertError;

        await new Promise(r => setTimeout(r, 1500));
        window.location.href = '/app/therapist/onboarding';
        
      } else {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (loginError) throw loginError;

        const { data: therapist } = await supabase
          .from('therapists')
          .select('onboarding_completed')
          .eq('user_id', loginData.user.id)
          .single();

        if (!therapist) {
          await supabase.auth.signOut();
          throw new Error('Account non riconosciuto come terapeuta');
        }

        await new Promise(r => setTimeout(r, 1000));
        window.location.href = therapist.onboarding_completed ? '/app/therapist' : '/app/therapist/onboarding';
      }
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'autenticazione');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(180deg, #10162a 0%, #0b0f1c 100%)',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    }}>
      <div className="max-w-md w-full rounded-2xl p-8" style={{
        background: '#141a2c',
        boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
        border: '2px solid #26304b'
      }}>
        <div className="text-center mb-8">
          <img 
            src="/logo-transparent-png.png" 
            alt="cIAo-doc" 
            className="mx-auto mb-4"
            style={{ height: '80px', width: 'auto' }}
          />
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{
            background: 'linear-gradient(135deg, #7aa2ff, #5b9cff)'
          }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#f1f5ff' }}>
            {mode === 'signup' ? 'Registrazione Terapeuta' : 'Accesso Terapeuta'}
          </h1>
          <p style={{ color: '#a8b2d6' }}>
            {mode === 'signup' ? 'Crea il tuo account professionale' : 'Accedi alla tua dashboard'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#f1f5ff' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg text-white outline-none transition-colors duration-300"
              style={{
                backgroundColor: '#0b0f1c',
                border: '2px solid #26304b'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
              onBlur={(e) => e.target.style.borderColor = '#26304b'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#f1f5ff' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-lg text-white outline-none transition-colors duration-300"
              style={{
                backgroundColor: '#0b0f1c',
                border: '2px solid #26304b'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
              onBlur={(e) => e.target.style.borderColor = '#26304b'}
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg text-sm" style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold transition-all duration-300"
            style={{
              background: loading ? '#4b5563' : '#7aa2ff',
              color: '#0b1022',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 20px rgba(122, 162, 255, 0.25)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Attendere...' : mode === 'signup' ? 'Registrati' : 'Accedi'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a 
            href={`/login/terapeuta?mode=${mode === 'signup' ? 'login' : 'signup'}`}
            className="text-sm font-medium"
            style={{ color: '#7aa2ff', textDecoration: 'none' }}
          >
            {mode === 'signup' ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
          </a>
          <br />
          <a 
            href="/login"
            className="text-sm block mt-2"
            style={{ color: '#a8b2d6', textDecoration: 'none' }}
          >
            ← Torna alla scelta
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginTerapeutaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(180deg, #10162a 0%, #0b0f1c 100%)',
        color: '#f1f5ff',
        fontFamily: 'system-ui'
      }}>
        Caricamento...
      </div>
    }>
      <LoginTerapeutaContent />
    </Suspense>
  );
}
