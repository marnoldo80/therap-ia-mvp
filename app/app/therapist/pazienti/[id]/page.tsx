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
  address: string | null;
  fiscal_code: string | null;
  issues: string | null;
  goals: string | null;
};

type TherapyPlan = {
  id: string;
  anamnesi: string | null;
  valutazione_psicodiagnostica: string | null;
  formulazione_caso: string | null;
  obiettivi_generali: string[];
  obiettivi_specifici: string[];
  esercizi: string[];
};

type SessionNote = {
  id: string;
  session_date: string;
  notes: string | null;
  ai_summary: string | null;
  themes: string[];
};

type GAD7Result = {
  id: string;
  total: number;
  severity: string;
  created_at: string;
};

type Appointment = {
  id: string;
  title: string;
  starts_at: string;
  status: string;
};

export default function PatientPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [therapyPlan, setTherapyPlan] = useState<TherapyPlan | null>(null);
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);
  const [gad7Results, setGad7Results] = useState<GAD7Result[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'piano' | 'sedute' | 'questionari' | 'docs'>('piano');

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carica paziente
      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      setPatient(patientData);

      // Carica piano terapeutico
      const { data: planData } = await supabase
        .from('therapy_plan')
        .select('*')
        .eq('patient_id', id)
        .maybeSingle();
      setTherapyPlan(planData);

      // Carica note sedute
      const { data: notesData } = await supabase
        .from('session_notes')
        .select('*')
        .eq('patient_id', id)
        .order('session_date', { ascending: false })
        .limit(5);
      setSessionNotes(notesData || []);

      // Carica risultati GAD-7
      const { data: gad7Data } = await supabase
        .from('gad7_results')
        .select('id, total, severity, created_at')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });
      setGad7Results(gad7Data || []);

      // Carica appuntamenti
      const { data: apptsData } = await supabase
        .from('appointments')
        .select('id, title, starts_at, status')
        .eq('patient_id', id)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(3);
      setAppointments(apptsData || []);

    } catch (e) {
      console.error('Errore caricamento dati:', e);
    } finally {
      setLoading(false);
    }
  }

  async function invitePatient() {
    if (!patient?.email) {
      alert('Il paziente non ha email');
      return;
    }

    try {
      const res = await fetch('/api/invite-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: patient.email, patientId: id })
      });

      if (!res.ok) throw new Error('Errore invio');
      alert('✅ Email inviata!');
    } catch (e: any) {
      alert('Errore: ' + e.message);
    }
  }

  if (loading) return <div className="max-w-6xl mx-auto p-6">Caricamento...</div>;
  if (!patient) return <div className="max-w-6xl mx-auto p-6">Paziente non trovato</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-4">
        <Link href="/app/therapist/pazienti" className="text-blue-600 hover:underline">
          ← Lista pazienti
        </Link>
      </div>

      {/* Info paziente */}
      <div className="bg-white border rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4">{patient.display_name || 'Senza nome'}</h1>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>📧 {patient.email || 'Nessuna email'}</div>
          <div>📱 {patient.phone || 'Nessun telefono'}</div>
          <div>📍 {patient.address || 'Nessun indirizzo'}</div>
          <div>🆔 {patient.fiscal_code || 'Nessun codice fiscale'}</div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={invitePatient} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900">
            🔐 Invita paziente
          </button>
          <Link href="/app/therapist/appuntamenti/nuovo" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            📅 Nuovo appuntamento
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button onClick={() => setActiveTab('piano')} className={`px-4 py-2 ${activeTab === 'piano' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600'}`}>
          Piano Terapeutico
        </button>
        <button onClick={() => setActiveTab('sedute')} className={`px-4 py-2 ${activeTab === 'sedute' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600'}`}>
          Sedute & IA
        </button>
        <button onClick={() => setActiveTab('questionari')} className={`px-4 py-2 ${activeTab === 'questionari' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600'}`}>
          Questionari
        </button>
      </div>

      {/* Tab Piano Terapeutico */}
      {activeTab === 'piano' && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-bold text-lg mb-3">🎯 Piano Terapeutico</h3>
            <p className="text-sm text-gray-600 mb-4">Sezione in sviluppo - funzionalità complete in arrivo</p>
            <div className="space-y-4">
              <div>
                <strong>Problemi:</strong>
                <p className="text-gray-700 whitespace-pre-wrap">{patient.issues || 'Nessuna informazione'}</p>
              </div>
              <div>
                <strong>Obiettivi:</strong>
                <p className="text-gray-700 whitespace-pre-wrap">{patient.goals || 'Nessuna informazione'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Sedute */}
      {activeTab === 'sedute' && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-bold text-lg mb-3">📝 Sedute e Riassunti IA</h3>
            {sessionNotes.length === 0 ? (
              <p className="text-gray-500">Nessuna seduta registrata</p>
            ) : (
              <div className="space-y-3">
                {sessionNotes.map(note => (
                  <div key={note.id} className="border rounded p-4">
                    <div className="font-medium">📅 {new Date(note.session_date).toLocaleDateString('it-IT')}</div>
                    {note.ai_summary && <div className="text-sm text-gray-600 mt-1">🤖 Riassunto IA disponibile</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-bold text-lg mb-3">📅 Prossimi Appuntamenti</h3>
            {appointments.length === 0 ? (
              <p className="text-gray-500">Nessun appuntamento programmato</p>
            ) : (
              <div className="space-y-2">
                {appointments.map(apt => (
                  <div key={apt.id} className="border rounded p-3">
                    {new Date(apt.starts_at).toLocaleString('it-IT')} - {apt.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Questionari */}
      {activeTab === 'questionari' && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-bold text-lg mb-3">📊 Questionari Realizzati</h3>
          {gad7Results.length === 0 ? (
            <p className="text-gray-500">Nessun questionario compilato</p>
          ) : (
            <div className="space-y-3">
              {gad7Results.map(result => (
                <div key={result.id} className="border rounded p-4 flex items-center justify-between">
                  <div>
                    <span className="font-medium">GAD-7</span> | Score: {result.total} | 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      result.severity === 'minima' ? 'bg-green-100 text-green-700' :
                      result.severity === 'lieve' ? 'bg-blue-100 text-blue-700' :
                      result.severity === 'moderata' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {result.severity}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(result.created_at).toLocaleDateString('it-IT')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
