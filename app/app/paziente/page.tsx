'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Patient = {
  id: string;
  display_name: string|null;
  email: string|null;
  phone: string|null;
  goals: string|null;
};

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);
  const [patient, setPatient] = useState<Patient|null>(null);

  useEffect(() => {
    (async () => {
      setErr(null); setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setErr('Non autenticato'); setLoading(false); return; }

      const email = user.email;
      if (!email) { setErr('Email utente non disponibile'); setLoading(false); return; }

      // 1) Trova il record paziente via email
      const { data: p, error: pe } = await supabase
        .from('patients')
        .select('id,display_name,email,phone,goals')
        .eq('email', email)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (pe) { setErr(pe.message); setLoading(false); return; }
      if (!p?.id) { setErr('Paziente non trovato. Contatta il terapeuta.'); setLoading(false); return; }

      setPatient(p as Patient);

      // 2) Se nessun consenso → vai alla pagina di consenso
      const { data: c, error: ce } = await supabase
        .from('consents')
        .select('id')
        .eq('patient_id', p.id)
        .limit(1);

      if (ce) { setErr(ce.message); setLoading(false); return; }
      if (!c || c.length === 0) {
        router.replace('/app/paziente/consenso');
        return;
      }

      setLoading(false);
    })();
  }, [router]);

  if (loading) return <div className="max-w-3xl mx-auto p-6">Caricamento…</div>;
  if (err) return <div className="max-w-3xl mx-auto p-6">{err}</div>;
  if (!patient) return <div className="max-w-3xl mx-auto p-6">Paziente non trovato.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Area paziente</h1>

      <div className="border rounded p-4">
        <div className="font-semibold mb-2">Dati personali</div>
        <div className="text-sm space-y-1">
          <div><span className="text-gray-500">Nome: </span>{patient.display_name || '—'}</div>
          <div><span className="text-gray-500">Email: </span>{patient.email || '—'}</div>
          <div><span className="text-gray-500">Telefono: </span>{patient.phone || '—'}</div>
        </div>
      </div>

      <div className="border rounded p-4">
        <div className="font-semibold mb-2">Obiettivi</div>
        <div className="text-sm whitespace-pre-wrap">{patient.goals || 'Nessun obiettivo impostato.'}</div>
      </div>

      <div className="text-sm">
        <Link href="/logout" className="underline">Esci</Link>
      </div>
    </div>
  );
}
