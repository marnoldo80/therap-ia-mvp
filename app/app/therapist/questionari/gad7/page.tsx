'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Patient = { id: string; display_name: string | null; email: string | null };

export default function GAD7Page() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('patients')
        .select('id, display_name, email')
        .eq('therapist_user_id', user.id)
        .order('display_name');

      setPatients(data || []);
    } catch (e) {
      console.error('Errore caricamento pazienti:', e);
    }
  }

  async function handleInviaMail() {
    if (!selectedPatient) {
      alert('Seleziona un paziente');
      return;
    }

    setLoading(true);
    try {
      const patient = patients.find(p => p.id === selectedPatient);
      if (!patient?.email) {
        alert('Il paziente non ha email');
        return;
      }

      const res = await fetch('/api/send-gad7-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: selectedPatient, email: patient.email })
      });

      if (!res.ok) throw new Error('Errore invio email');

      alert('Email inviata con successo!');
      router.push('/app/therapist/questionari');
    } catch (e: any) {
      alert('Errore: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCompilaInSeduta() {
    if (!selectedPatient) {
      alert('Seleziona un paziente');
      return;
    }
    router.push(`/app/therapist/questionari/gad7/compila?patientId=${selectedPatient}`);
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="mb-4">
        <Link href="/app/therapist/questionari" className="text-blue-600 hover:underline">
          ← Questionari
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-2">GAD-7</h1>
        <p className="text-gray-600">Questionario per ansia generalizzata</p>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Seleziona paziente</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
          >
            <option value="">-- Scegli paziente --</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name || 'Senza nome'}
              </option>
            ))}
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-4 pt-4">
          <button
            onClick={handleCompilaInSeduta}
            disabled={!selectedPatient}
            className="bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            🔵 Compila in seduta
          </button>
          <button
            onClick={handleInviaMail}
            disabled={!selectedPatient || loading}
            className="bg-emerald-600 text-white px-6 py-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
          >
            {loading ? '⏳ Invio...' : '📧 Invia al paziente'}
          </button>
        </div>
      </div>
    </div>
  );
}
