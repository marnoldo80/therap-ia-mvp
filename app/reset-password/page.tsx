'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');

  useEffect(() => {
    if (token) {
      setStep('reset');
    }
  }, [token]);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore invio email');
      }

      setMessage(data.message);
      setEmail('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', token, newPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore reset password');
      }

      setMessage('✅ Password aggiornata! Ora puoi fare login.');
      
      // Redirect al login dopo 3 secondi
      setTimeout(() => {
        router.push('/login/paziente');
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
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
        
        {step === 'request' ? (
          <>
            {/* Richiesta Reset */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{
                background: 'linear-gradient(135deg, #7aa2ff 0%, #9333ea 100%)',
                boxShadow: '0 10px 25px rgba(122, 162, 255, 0.3)'
              }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'white' }}>
                Reset Password
              </h1>
              <p style={{ color: '#a8b2d6' }}>
                Inserisci la tua email per ricevere le istruzioni
              </p>
            </div>

            <form onSubmit={handleRequest} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                  Email Paziente
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-semibold transition-all duration-300"
                style={{
                  background: loading ? '#6b7280' : 'linear-gradient(135deg, #7aa2ff 0%, #9333ea 100%)',
                  color: 'white',
                  boxShadow: loading ? 'none' : '0 10px 25px rgba(122, 162, 255, 0.3)'
                }}
              >
                {loading ? 'Invio in corso...' : '📧 Invia Email Reset'}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Cambio Password */}
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
                Nuova Password
              </h1>
              <p style={{ color: '#a8b2d6' }}>
                Scegli una password sicura per il tuo account
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                  Nuova Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-lg outline-none transition-all duration-300"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '2px solid rgba(255,255,255,0.1)',
                    color: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  placeholder="Minimo 8 caratteri"
                />
                <p className="text-xs mt-1" style={{ color: '#a8b2d6' }}>
                  Minimo 8 caratteri, usa lettere, numeri e simboli
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || newPassword.length < 8}
                className="w-full py-3 rounded-lg font-semibold transition-all duration-300"
                style={{
                  background: (loading || newPassword.length < 8) ? '#6b7280' : 'linear-gradient(135deg, #7aa2ff 0%, #9333ea 100%)',
                  color: 'white',
                  boxShadow: (loading || newPassword.length < 8) ? 'none' : '0 10px 25px rgba(122, 162, 255, 0.3)'
                }}
              >
                {loading ? 'Aggiornamento...' : '🔐 Conferma Password'}
              </button>
            </form>
          </>
        )}

        {/* Messages */}
        {message && (
          <div className="mt-6 p-4 rounded-lg text-sm" style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#22c55e'
          }}>
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 rounded-lg text-sm" style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Back to login */}
        <div className="mt-8 text-center">
          <a 
            href="/login/paziente"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            style={{ 
              color: '#a8b2d6',
              textDecoration: 'none',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            ← Torna al Login
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0b1022 0%, #1e293b 50%, #334155 100%)' }}>
        <div className="flex items-center gap-3" style={{ color: 'white' }}>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          Caricamento...
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
