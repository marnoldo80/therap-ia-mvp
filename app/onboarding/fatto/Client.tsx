'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Client() {
  const router = useRouter();
  const [msg, setMsg] = useState('Sto preparando la tua area…');

  useEffect(() => {
    (async () => {
      console.log('🚀 Inizio collegamento paziente...');
      
      const { data, error } = await supabase.auth.getUser();
      
      console.log('👤 Utente autenticato:', data?.user);
      console.log('❌ Errore auth:', error);
      
      if (error || !data.user?.email) {
        console.error('⛔ Sessione non valida');
        setMsg('Sessione non attiva. Riapri il link dalla mail.');
        return;
      }

      const email = (data.user.email || '').toLowerCase().trim();
      const user_id = data.user.id;

      console.log('📧 Email:', email);
      console.log('🆔 User ID:', user_id);
      console.log('📡 Chiamata a /api/link-patient...');

      const res = await fetch('/api/link-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, user_id }),
      });

      console.log('📥 Risposta status:', res.status);
      
      const j = await res.json().catch((e) => {
        console.error('⛔ Errore parsing JSON:', e);
        return {};
      });

      console.log('📦 Risposta completa:', j);

      if (res.ok && j?.ok) {
        console.log('✅ Paziente collegato! Redirect a /app/paziente');
        router.replace('/app/paziente');
      } else {
        console.error('❌ Collegamento fallito');
        
        if (j?.error === 'patient_not_found_after_patch') {
          console.warn('🔍 Diagnostica paziente:', j);
          setMsg('Paziente non trovato. Contatta il terapeuta (email non combacia o già collegato).');
        } else if (j?.error === 'patient_not_found') {
          console.warn('🔍 Email cercata:', j?.email);
          console.warn('🔍 Tutti i pazienti con questa email:', j?.all_with_email);
          setMsg(`Nessun paziente trovato con email ${email}. Verifica che il terapeuta abbia inserito l'email corretta.`);
        } else if (j?.step === 'patch') {
          console.error('⛔ Errore Supabase PATCH:', j?.resp);
          setMsg('Errore nel collegamento del profilo. Riapri il link dalla mail o avvisa il terapeuta.');
        } else {
          console.error('⛔ Errore generico:', j);
          setMsg('Non riesco a collegare il profilo. Riprova dal link email.');
        }
      }
    })();
  }, [router]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-3">Tutto pronto…</h1>
      <p>{msg}</p>
      <p className="text-sm text-gray-500 mt-4">
        Apri la Console del browser (F12) per vedere i dettagli tecnici.
      </p>
    </div>
  );
}
