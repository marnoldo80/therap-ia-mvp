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
        alert('Il paziente non ha email configurata');
        return;
      }

      const res = await fetch('/api/send-gad7-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: selectedPatient, email: patient.email })
      });

      if (!res.ok) throw new Error('Errore invio email');

      alert('✅ Email inviata con successo al paziente!');
      setSelectedPatient(''); // Reset selezione
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

  const selectedPatientData = patients.find(p => p.id === selectedPatient);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/app/therapist/questionari"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          ← Questionari
        </Link>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" style={{ color: 'white' }}>
          <span>📊</span> GAD-7
        </h1>
        <p style={{ color: '#a8b2d6' }}>Questionario per la valutazione dell'ansia generalizzata</p>
      </div>

      {/* Info Card */}
      <div className="rounded-lg p-4" style={{
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)'
      }}>
        <h3 className="font-medium mb-2" style={{ color: 'white' }}>ℹ️ Informazioni GAD-7</h3>
        <p className="text-sm" style={{ color: '#a8b2d6' }}>
          Il GAD-7 (Generalized Anxiety Disorder 7-item) è uno strumento di screening per l'ansia generalizzata. 
          Punteggio: 0-4 (minimo), 5-9 (lieve), 10-14 (moderato), 15-21 (grave).
        </p>
      </div>

      {/* Main Form */}
      <div className="rounded-lg p-6" style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 className="font-bold text-lg mb-4" style={{ color: 'white' }}>Seleziona Paziente</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
              Paziente *
            </label>
            <select
              className="w-full rounded px-3 py-3 outline-none transition-colors duration-300"
              style={{
                backgroundColor: '#0b0f1c',
                border: '2px solid #26304b',
                color: 'white'
              }}
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
            >
              <option value="">-- Scegli il paziente per il questionario --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name || 'Senza nome'} {p.email ? `(${p.email})` : '(no email)'}
                </option>
              ))}
            </select>
          </div>

          {/* Patient Info */}
          {selectedPatientData && (
            <div className="rounded-lg p-4" style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <h4 className="font-medium mb-2" style={{ color: 'white' }}>📋 Paziente Selezionato</h4>
              <div className="text-sm space-y-1" style={{ color: '#a8b2d6' }}>
                <p><strong>Nome:</strong> {selectedPatientData.display_name || 'Non specificato'}</p>
                <p><strong>Email:</strong> {selectedPatientData.email || '❌ Email mancante'}</p>
                <p><strong>Status:</strong> {selectedPatientData.email ? '✅ Pronto per invio' : '⚠️ Email richiesta per invio'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4 pt-6">
          <button
            onClick={handleCompilaInSeduta}
            disabled={!selectedPatient}
            className="flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium transition-colors duration-200"
            style={{
              backgroundColor: !selectedPatient ? '#4b5563' : '#7aa2ff',
              color: !selectedPatient ? '#9ca3af' : '#0b1022',
              opacity: !selectedPatient ? 0.6 : 1
            }}
          >
            <span>📝</span>
            <div className="text-left">
              <div>Compila in Seduta</div>
              <div className="text-xs opacity-75">Compilazione diretta con il paziente</div>
            </div>
          </button>

          <button
            onClick={handleInviaMail}
            disabled={!selectedPatient || loading || !selectedPatientData?.email}
            className="flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium transition-colors duration-200"
            style={{
              backgroundColor: (!selectedPatient || !selectedPatientData?.email) ? '#4b5563' : loading ? '#059669' : '#22c55e',
              color: 'white',
              opacity: (!selectedPatient || !selectedPatientData?.email) ? 0.6 : 1
            }}
          >
            <span>{loading ? '⏳' : '📧'}</span>
            <div className="text-left">
              <div>{loading ? 'Invio in corso...' : 'Invia via Email'}</div>
              <div className="text-xs opacity-75">
                {!selectedPatientData?.email ? 'Email paziente richiesta' : 'Link sicuro al paziente'}
              </div>
            </div>
          </button>
        </div>

        {/* Warning se nessuna email */}
        {selectedPatient && !selectedPatientData?.email && (
          <div className="mt-4 p-3 rounded-lg" style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <p className="text-sm flex items-center gap-2" style={{ color: '#ef4444' }}>
              <span>⚠️</span>
              Il paziente selezionato non ha un'email configurata. Aggiungi l'email nella scheda paziente per abilitare l'invio.
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg p-4" style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 className="font-medium mb-3" style={{ color: 'white' }}>🔗 Link Utili</h3>
        <div className="flex gap-3">
          <Link
            href="/app/therapist/questionari"
            className="px-4 py-2 rounded font-medium transition-colors duration-200"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              color: 'white',
              textDecoration: 'none'
            }}
          >
            🔄 Altri Questionari
          </Link>
          <Link
            href="/app/therapist"
            className="px-4 py-2 rounded font-medium transition-colors duration-200"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              color: 'white',
              textDecoration: 'none'
            }}
          >
            🏠 Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
