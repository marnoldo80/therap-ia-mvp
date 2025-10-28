'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Patient = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  issues: string | null;
  goals: string | null;
  therapist_user_id: string;
  created_at?: string;
};

export default function PatientPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    async function fetchPatient() {
      try {
        console.log('Cercando paziente con ID:', id);
        
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', id)
          .single();

        console.log('Risultato query:', { data, error });

        if (error) {
          console.error('Errore Supabase:', error);
          setError(error.message);
          return;
        }
        
        if (!data) {
          setError('Paziente non trovato nel database');
          return;
        }

        setPatient(data);
      } catch (err: any) {
        console.error('Errore generale:', err);
        setError(err?.message || 'Errore sconosciuto');
      } finally {
        setLoading(false);
      }
    }

    fetchPatient();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p>Caricamento paziente...</p>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Link href="/app/therapist/pazienti" className="rounded border px-3 py-2 hover:bg-gray-50 inline-block mb-4">
          ← Lista pazienti
        </Link>
        <div className="rounded bg-red-50 text-red-700 px-4 py-3">
          <p className="font-semibold">Paziente non trovato</p>
          <p className="text-sm mt-1">ID: {id}</p>
          {error && <p className="text-sm mt-1">Errore: {error}</p>}
          <p className="text-sm mt-2">Apri la console del browser (F12) per vedere i dettagli.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-4 flex gap-2">
        <Link href="/app/therapist/pazienti" className="rounded border px-3 py-2 hover:bg-gray-50">
          ← Lista pazienti
        </Link>
        <button 
          onClick={() => alert('Funzione in sviluppo')} 
          className="rounded bg-blue-600 text-white px-3 py-2 hover:bg-blue-700"
        >
          ↻ Esegui GAD-7 in seduta
        </button>
        <button 
          onClick={() => alert('Funzione in sviluppo')} 
          className="rounded bg-emerald-600 text-white px-3 py-2 hover:bg-emerald-700"
        >
          📧 Invia GAD-7 al paziente
        </button>
        <button 
          onClick={() => alert('Funzione in sviluppo')} 
          className="rounded bg-gray-800 text-white px-3 py-2 hover:bg-gray-900"
        >
          🔐 Invita paziente (crea credenziali)
        </button>
      </div>

      <h1 className="text-2xl font-semibold mb-4">Scheda paziente</h1>

      <div className="rounded border p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-600">Nome</p>
          <p className="text-lg font-medium">{patient.display_name || 'Non specificato'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{patient.email || 'Non specificata'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Telefono</p>
            <p className="font-medium">{patient.phone || 'Non specificato'}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-600">Problemi</p>
          <p className="whitespace-pre-wrap">{patient.issues || 'Nessuna informazione'}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Obiettivi</p>
          <p className="whitespace-pre-wrap">{patient.goals || 'Nessuna informazione'}</p>
        </div>

        {patient.created_at && (
          <div>
            <p className="text-sm text-gray-600">Data creazione</p>
            <p className="text-sm">{new Date(patient.created_at).toLocaleDateString('it-IT')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
