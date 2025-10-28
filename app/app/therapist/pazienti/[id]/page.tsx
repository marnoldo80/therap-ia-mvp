'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Patient = {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  data_nascita?: string;
};

export default function PatientPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [p, setP] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!id) return;
    
    async function fetchPatient() {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setP(data);
      } catch (err) {
        console.error('Errore caricamento paziente:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPatient();
  }, [id, supabase]);

  if (loading) return <div style={{ padding: 24 }}>Caricamento...</div>;
  if (!p) return <div style={{ padding: 24 }}>Paziente non trovato</div>;

  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => router.back()} style={{ marginBottom: 16 }}>
        ← Indietro
      </button>
      <h1>{p.nome} {p.cognome}</h1>
      <p><strong>Email:</strong> {p.email}</p>
      {p.data_nascita && <p><strong>Data di nascita:</strong> {p.data_nascita}</p>}
    </div>
  );
}
