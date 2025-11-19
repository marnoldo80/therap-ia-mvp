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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #10162a 0%, #0b0f1c 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        background: '#141a2c',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
        border: '2px solid #26304b'
      }}>
        {/* Header con Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img 
            src="/logo-transparent-png.png" 
            alt="cIAo-doc" 
            style={{ height: '80px', width: 'auto', marginBottom: '16px' }}
          />
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #7aa2ff, #5b9cff)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <svg style={{ width: '32px', height: '32px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#f1f5ff',
            margin: '0 0 8px'
          }}>
            {mode === 'signup' ? 'Registrazione Terapeuta' : 'Accesso Terapeuta'}
          </h1>
          <p style={{
            color: '#a8b2d6',
            margin: '0',
            fontSize: '16px'
          }}>
            {mode === 'signup' ? 'Crea il tuo account professionale' : 'Accedi alla tua dashboard'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#f1f5ff',
              marginBottom: '8px'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #26304b',
                borderRadius: '12px',
                backgroundColor: '#0b0f1c',
                color: '#f1f5ff',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
              onBlur={(e) => e.target.style.borderColor = '#26304b'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#f1f5ff',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #26304b',
                borderRadius: '12px',
                backgroundColor: '#0b0f1c',
                color: '#f1f5ff',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
              onBlur={(e) => e.target.style.borderColor = '#26304b'}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#4b5563' : '#7aa2ff',
              color: '#0b1022',
              padding: '14px 24px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 20px rgba(122, 162, 255, 0.25)',
              opacity: loading ? '0.7' : '1'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 28px rgba(122, 162, 255, 0.35)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 20px rgba(122, 162, 255, 0.25)';
              }
            }}
          >
            {loading ? 'Attendere...' : mode === 'signup' ? 'Registrati' : 'Accedi'}
          </button>
        </form>

        {/* Footer Links */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <a 
            href={`/login/terapeuta?mode=${mode === 'signup' ? 'login' : 'signup'}`}
            style={{
              color: '#7aa2ff',
              fontSize: '14px',
              fontWeight: '500',
              textDecoration: 'none'
            }}
          >
            {mode === 'signup' ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
          </a>
          <br />
          <a 
            href="/login"
            style={{
              color: '#a8b2d6',
              fontSize: '14px',
              textDecoration: 'none',
              display: 'inline-block',
              marginTop: '8px'
            }}
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
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #10162a 0%, #0b0f1c 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
