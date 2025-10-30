'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';

function LoginTerapeutaContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'login';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = getSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        console.log('Inizio registrazione...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { user_type: 'therapist' } }
        });

        console.log('SignUp data:', signUpData);
        console.log('SignUp error:', signUpError);

        if (signUpError) throw signUpError;
        if (!signUpData.user || !signUpData.session) {
          console.error('Nessun user o session dopo signup');
          throw new Error('Errore creazione account');
        }

        console.log('Inserisco in therapists...');
        const { error: insertError } = await supabase
          .from('therapists')
          .insert({ user_id: signUpData.user.id, onboarding_completed: false });

        console.log('Insert error:', insertError);
        if (insertError) throw insertError;

        console.log('Attendo 1.5s prima del redirect...');
        await new Promise(r => setTimeout(r, 1500));
        
        console.log('Faccio redirect a onboarding');
        window.location.href = '/app/therapist/onboarding';
        
      } else {
        console.log('Inizio login...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        console.log('Login data:', loginData);
        if (loginError) throw loginError;

        const { data: therapist } = await supabase
          .from('therapists')
          .select('onboarding_completed')
          .eq('user_id', loginData.user.id)
          .single();

        console.log('Therapist:', therapist);

        if (!therapist) {
          await supabase.auth.signOut();
          throw new Error('Account non riconosciuto come terapeuta');
        }

        await new Promise(r => setTimeout(r, 1000));
        const url = therapist.onboarding_completed ? '/app/therapist' : '/app/therapist/onboarding';
        console.log('Redirect a:', url);
        window.location.href = url;
      }
    } catch (err: any) {
      console.error('Errore:', err);
      setError(err.message || 'Errore durante l\'autenticazione');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {mode === 'signup' ? 'Registrazione Terapeuta' : 'Accesso Terapeuta'}
          </h1>
          <p className="text-gray-600">
            {mode === 'signup' ? 'Crea il tuo account professionale' : 'Accedi alla tua dashboard'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Attendere...' : mode === 'signup' ? 'Registrati' : 'Accedi'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href={`/login/terapeuta?mode=${mode === 'signup' ? 'login' : 'signup'}`} className="text-blue-600 text-sm font-medium">
            {mode === 'signup' ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
          </a>
          <br />
          <a href="/login" className="text-gray-500 text-sm block mt-2">← Torna alla scelta</a>
        </div>
      </div>
    </div>
  );
}

export default function LoginTerapeutaPage() {
  return (
    <Suspense fallback={<div>Caricamento...</div>}>
      <LoginTerapeutaContent />
    </Suspense>
  );
}
