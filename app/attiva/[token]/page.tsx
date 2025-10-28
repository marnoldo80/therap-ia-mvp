'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AttivaAccount() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        router.push('/errore?tipo=token-mancante');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('inviti')
          .select('email, password_impostata, consenso_firmato')
          .eq('token', token)
          .single();

        if (error || !data) {
          router.push('/errore?tipo=token-non-valido');
          return;
        }

        if (!data.password_impostata) {
          router.push(`/onboarding/cambia-password?token=${token}`);
        } else if (!data.consenso_firmato) {
          router.push(`/onboarding/consenso?token=${token}`);
        } else {
          router.push('/paziente/dashboard');
        }
      } catch (err) {
        console.error('Errore validazione token:', err);
        router.push('/errore?tipo=errore-generico');
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [token, router, supabase]);

  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <h1>Attivazione in corso...</h1>
      {loading && <p>Verifica del tuo account in corso, attendere...</p>}
    </div>
  );
}
