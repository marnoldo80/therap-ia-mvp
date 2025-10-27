'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function CambiaPassword() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage('Errore nel cambio password');
    } else {
      setMessage('Password aggiornata con successo');
      router.push('/onboarding/consenso');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Cambia Password</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Nuova password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Aggiorna</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
