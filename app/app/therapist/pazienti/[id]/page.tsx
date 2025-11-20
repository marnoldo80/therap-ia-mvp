'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import AISuggestionsModal from '@/components/AISuggestionsModal';
import CalendarPicker from '@/components/CalendarPicker';
import QuickAppointmentModal from '@/components/QuickAppointmentModal';
import SessionRatesForm from '@/components/SessionRatesForm';
import { useRouter } from 'next/navigation';

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
  birth_date: string | null;
  birth_place: string | null;
  fiscal_code: string | null;
  session_duration_individual: number;
  session_duration_couple: number;
  session_duration_family: number;
  rate_individual: number;
  rate_couple: number;
  rate_family: number;
};

type TherapyPlan = {
  id: string;
  anamnesi: string | null;
  valutazione_psicodiagnostica: string | null;
  formulazione_caso: string | null;
  obiettivi_generali: any[];
  obiettivi_specifici: any[];
  esercizi: any[];
};

type SessionNote = {
  id: string;
  session_date: string;
  notes: string | null;
  ai_summary: string | null;
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
};

type PatientNote = {
  id: string;
  note_date: string;
  content: string;
};

type AppointmentMessage = {
  id: string;
  appointment_id: string;
  message: string;
  created_at: string;
  read_by_therapist: boolean;
};

type ObjectiveCompletion = {
  id: string;
  objective_index: number;
  objective_text: string;
  completed: boolean;
  objective_type: string;
  completed_at: string | null;
};

type ExerciseCompletion = {
  id: string;
  exercise_index: number;
  exercise_text: string;
  completed: boolean;
  completed_at: string | null;
};

type ConsentDocument = {
  id: string;
  therapist_signature: string;
  therapist_signature_type: string;
  patient_signature: string | null;
  patient_signature_type: string | null;
  tessera_sanitaria_consent: boolean;
  status: string;
  created_at: string;
  therapist_signed_at: string;
  patient_signed_at: string | null;
};

type Suggestions = {
  obiettivi_generali: string[];
  obiettivi_specifici: string[];
  esercizi: string[];
  note: string;
};

export default function PatientPage() {
  const params = useParams();
  const id = params?.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [therapyPlan, setTherapyPlan] = useState<TherapyPlan | null>(null);
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);
  const [gad7Results, setGad7Results] = useState<GAD7Result[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  const [patientThoughts, setPatientThoughts] = useState<string>('');
  const [appointmentMessages, setAppointmentMessages] = useState<AppointmentMessage[]>([]);
  const [objectivesCompletion, setObjectivesCompletion] = useState<ObjectiveCompletion[]>([]);
  const [exercisesCompletion, setExercisesCompletion] = useState<ExerciseCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'piano' | 'sedute' | 'questionari' | 'area-paziente'>('piano');
  const [editMode, setEditMode] = useState(false);

  const [anamnesi, setAnamnesi] = useState('');
  const [valutazionePsico, setValutazionePsico] = useState('');
  const [formulazioneCaso, setFormulazioneCaso] = useState('');
  const [obiettiviGenerali, setObiettiviGenerali] = useState<string[]>([]);
  const [obiettiviSpecifici, setObiettiviSpecifici] = useState<string[]>([]);
  const [esercizi, setEsercizi] = useState<string[]>([]);
  
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Suggestions | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [generatingAssessment, setGeneratingAssessment] = useState(false);
  
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);
  const router = useRouter();

  const [editPatientMode, setEditPatientMode] = useState(false);
  const [editPatientData, setEditPatientData] = useState<any>({});
  const [savingPatient, setSavingPatient] = useState(false);
  const [consentDocuments, setConsentDocuments] = useState<ConsentDocument[]>([]);
  
  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  useEffect(() => {
    if (patient) {
      setEditPatientData(patient);
    }
    }, [patient]);
  
  async function loadData() {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: patientData } = await supabase.from('patients').select('*').eq('id', id).single();
      setPatient(patientData);

      const { data: planData } = await supabase.from('therapy_plan').select('*').eq('patient_id', id).maybeSingle();
      
      if (planData) {
        setTherapyPlan(planData);
        setAnamnesi(planData.anamnesi || '');
        setValutazionePsico(planData.valutazione_psicodiagnostica || '');
        setFormulazioneCaso(planData.formulazione_caso || '');
        setObiettiviGenerali(planData.obiettivi_generali || []);
        setObiettiviSpecifici(planData.obiettivi_specifici || []);
        setEsercizi(planData.esercizi || []);
      }

      const { data: notesData } = await supabase.from('session_notes').select('*').eq('patient_id', id).order('session_date', { ascending: false }).limit(5);
      setSessionNotes(notesData || []);

      const { data: gad7Data } = await supabase.from('gad7_results').select('id, total, severity, created_at').eq('patient_id', id).order('created_at', { ascending: false });
      setGad7Results(gad7Data || []);

      const { data: apptsData } = await supabase.from('appointments').select('id, title, starts_at').eq('patient_id', id).gte('starts_at', new Date().toISOString()).order('starts_at', { ascending: true }).limit(3);
      setAppointments(apptsData || []);

      const { data: thoughtsData } = await supabase.from('patient_session_thoughts').select('content').eq('patient_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      setPatientThoughts(thoughtsData?.content || '');

      const { data: diaryData } = await supabase.from('patient_notes').select('*').eq('patient_id', id).order('note_date', { ascending: false }).limit(10);
      setPatientNotes(diaryData || []);

      const { data: messagesData } = await supabase.from('appointment_messages').select('*').eq('patient_id', id).order('created_at', { ascending: false });
      setAppointmentMessages(messagesData || []);

      const { data: objData } = await supabase.from('objectives_completion').select('*').eq('patient_id', id);
      setObjectivesCompletion(objData || []);

      const { data: exData } = await supabase.from('exercises_completion').select('*').eq('patient_id', id);
      setExercisesCompletion(exData || []);

      const { data: consentsData } = await supabase
        .from('consent_documents')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });
      setConsentDocuments(consentsData || []);
      
    } catch (e) {
      console.error('Errore:', e);
    } finally {
      setLoading(false);
    }
  }

  async function savePlan() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const planData = {
        patient_id: id,
        therapist_user_id: user.id,
        anamnesi,
        valutazione_psicodiagnostica: valutazionePsico,
        formulazione_caso: formulazioneCaso,
        obiettivi_generali: obiettiviGenerali,
        obiettivi_specifici: obiettiviSpecifici,
        esercizi: esercizi
      };

      if (therapyPlan?.id) {
        await supabase.from('therapy_plan').update(planData).eq('id', therapyPlan.id);
      } else {
        await supabase.from('therapy_plan').insert(planData);
      }

      await syncObjectivesCompletion();
      await syncExercisesCompletion();

      alert('✅ Piano salvato!');
      setEditMode(false);
      loadData();
    } catch (e: any) {
      alert('Errore: ' + e.message);
    }
  }

  async function syncObjectivesCompletion() {
    await supabase.from('objectives_completion').delete().eq('patient_id', id);
    const generalObjs = obiettiviGenerali.map((text, index) => ({ patient_id: id, objective_type: 'generale', objective_index: index, objective_text: text, completed: false }));
    const specificObjs = obiettiviSpecifici.map((text, index) => ({ patient_id: id, objective_type: 'specifico', objective_index: index, objective_text: text, completed: false }));
    if (generalObjs.length > 0 || specificObjs.length > 0) {
      await supabase.from('objectives_completion').insert([...generalObjs, ...specificObjs]);
    }
  }

  async function syncExercisesCompletion() {
    await supabase.from('exercises_completion').delete().eq('patient_id', id);
    const exs = esercizi.map((text, index) => ({ patient_id: id, exercise_index: index, exercise_text: text, completed: false }));
    if (exs.length > 0) {
      await supabase.from('exercises_completion').insert(exs);
    }
  }

  async function toggleObjectiveCompletion(objId: string, currentCompleted: boolean) {
    try {
      const { error } = await supabase.from('objectives_completion').update({ completed: !currentCompleted, completed_at: !currentCompleted ? new Date().toISOString() : null }).eq('id', objId);
      if (error) throw error;
      loadData();
    } catch (e: any) {
      alert('Errore: ' + e.message);
    }
  }

  async function toggleExerciseCompletion(exId: string, currentCompleted: boolean) {
    try {
      const { error } = await supabase.from('exercises_completion').update({ completed: !currentCompleted, completed_at: !currentCompleted ? new Date().toISOString() : null }).eq('id', exId);
      if (error) throw error;
      loadData();
    } catch (e: any) {
      alert('Errore: ' + e.message);
    }
  }

  async function clearPatientThoughts() {
    if (!confirm('Vuoi svuotare i pensieri del paziente? (Seduta completata)')) return;
    try {
      const { error } = await supabase.from('patient_session_thoughts').delete().eq('patient_id', id);
      if (error) throw error;
      alert('✅ Pensieri svuotati!');
      loadData();
    } catch (e: any) {
      alert('Errore: ' + e.message);
    }
  }

  async function markMessageAsRead(messageId: string) {
    try {
      const { error } = await supabase.from('appointment_messages').update({ read_by_therapist: true }).eq('id', messageId);
      if (error) throw error;
      loadData();
    } catch (e: any) {
      console.error('Errore:', e);
    }
  }

  async function deleteMessage(messageId: string) {
    if (!confirm('Eliminare questo messaggio?')) return;
    try {
      const { error } = await supabase.from('appointment_messages').delete().eq('id', messageId);
      if (error) throw error;
      loadData();
    } catch (e: any) {
      alert('Errore: ' + e.message);
    }
  }

  async function downloadConsentPDF(consentId: string) {
  try {
    const response = await fetch(`/api/download-consent-pdf/${consentId}`);
    if (!response.ok) throw new Error('Errore download');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consenso_${patient?.display_name?.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('it-IT').replace(/\//g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (e: any) {
    alert('Errore: ' + e.message);
  }
}

function viewConsent(consentId: string) {
  window.open(`/consent/view/${consentId}`, '_blank');
}
  
  async function invitePatient() {
    if (!patient?.email) {
      alert('Il paziente non ha email');
      return;
    }
    try {
      const res = await fetch('/api/invite-patient', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: patient.email, patientId: id }) });
      if (!res.ok) throw new Error('Errore invio');
      alert('✅ Email inviata!');
    } catch (e: any) {
      alert('Errore: ' + e.message);
    }
  }

  async function getSuggestions() {
    setAiLoading(true);
    setShowAIModal(true);
    setAiSuggestions(null);

    try {
      const res = await fetch('/api/suggest-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: id }),
      });

      if (!res.ok) throw new Error('Errore generazione suggerimenti');

      const data = await res.json();
      setAiSuggestions(data.suggestions);
    } catch (e: any) {
      alert('Errore: ' + e.message);
      setShowAIModal(false);
    } finally {
      setAiLoading(false);
    }
  }

  function applySuggestions(suggestions: Suggestions) {
    setObiettiviGenerali(suggestions.obiettivi_generali);
    setObiettiviSpecifici(suggestions.obiettivi_specifici);
    setEsercizi(suggestions.esercizi);
    setShowAIModal(false);
    setEditMode(true);
    alert('✅ Suggerimenti applicati! Rivedi e salva il piano.');
  }
  
  async function generateAssessment() {
    if (!confirm('Generare la valutazione clinica dalle sedute registrate? Questo sovrascriverà i campi vuoti.')) {
      return;
    }

    setGeneratingAssessment(true);
    try {
      const res = await fetch('/api/generate-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Errore generazione');
      }

      const data = await res.json();
      const { assessment } = data;

      setAnamnesi(assessment.anamnesi);
      setValutazionePsico(assessment.valutazione_psicodiagnostica);
      setFormulazioneCaso(assessment.formulazione_caso);
      setEditMode(true);

      alert('✅ Valutazione generata! Rivedi e salva.');
    } catch (e: any) {
      alert('Errore: ' + e.message);
    } finally {
      setGeneratingAssessment(false);
    }
  }

  function handleDateTimeSelected(dateTime: string) {
    setSelectedDateTime(dateTime);
    setShowCalendarPicker(false);
    setShowQuickModal(true);
  }

  async function savePatientData() {
    setSavingPatient(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update(editPatientData)
        .eq('id', id);

      if (error) throw error;
  
      alert('✅ Dati paziente salvati!');
      setEditPatientMode(false);
      loadData();
    } catch (e: any) {
      alert('Errore: ' + e.message);
    } finally {
      setSavingPatient(false);
    }
  }
  
  function getObjectiveCompletion(type: string, index: number) {
    return objectivesCompletion.find(o => o.objective_type === type && o.objective_index === index);
  }

  function getExerciseCompletion(index: number) {
    return exercisesCompletion.find(e => e.exercise_index === index);
  }

  if (loading) return (
    <div className="max-w-6xl mx-auto p-6" style={{ color: 'white' }}>
      Caricamento...
    </div>
  );
  if (!patient) return (
    <div className="max-w-6xl mx-auto p-6" style={{ color: 'white' }}>
      Paziente non trovato
    </div>
  );

  const unreadMessages = appointmentMessages.filter(m => !m.read_by_therapist).length;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Dashboard Button */}
      <div className="mb-6">
        <Link 
          href="/app/therapist"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          ← Dashboard
        </Link>
      </div>

      <div className="rounded-lg p-6" style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold" style={{ color: 'white' }}>
            {patient.display_name || 'Senza nome'}
          </h1>
          {editPatientMode ? (
            <div className="flex gap-2">
              <button 
                onClick={savePatientData}
                disabled={savingPatient}
                className="px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
                style={{
                  backgroundColor: savingPatient ? '#4b5563' : '#22c55e',
                  color: 'white',
                  opacity: savingPatient ? 0.7 : 1
                }}
              >
                {savingPatient ? 'Salvando...' : '💾 Salva'}
              </button>
              <button 
                onClick={() => setEditPatientMode(false)}
                className="px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
                style={{ backgroundColor: '#6b7280', color: 'white' }}
              >
                Annulla
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setEditPatientMode(true)}
              className="px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
              style={{ backgroundColor: '#7aa2ff', color: '#0b1022' }}
            >
              ✏️ Modifica dati
            </button>
          )}
        </div>

        {editPatientMode ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>Nome e Cognome</label>
                <input 
                  className="w-full rounded px-3 py-2 text-sm outline-none transition-colors duration-300" 
                  style={{
                    backgroundColor: '#0b0f1c',
                    border: '2px solid #26304b',
                    color: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                  onBlur={(e) => e.target.style.borderColor = '#26304b'}
                  value={editPatientData.display_name || ''} 
                  onChange={e => setEditPatientData({...editPatientData, display_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>Email</label>
                <input 
                  type="email"
                  className="w-full rounded px-3 py-2 text-sm outline-none transition-colors duration-300" 
                  style={{
                    backgroundColor: '#0b0f1c',
                    border: '2px solid #26304b',
                    color: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                  onBlur={(e) => e.target.style.borderColor = '#26304b'}
                  value={editPatientData.email || ''} 
                  onChange={e => setEditPatientData({...editPatientData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>Telefono</label>
                <input 
                  className="w-full rounded px-3 py-2 text-sm outline-none transition-colors duration-300" 
                  style={{
                    backgroundColor: '#0b0f1c',
                    border: '2px solid #26304b',
                    color: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                  onBlur={(e) => e.target.style.borderColor = '#26304b'}
                  value={editPatientData.phone || ''} 
                  onChange={e => setEditPatientData({...editPatientData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>Data di nascita</label>
                <input 
                  type="date"
                  className="w-full rounded px-3 py-2 text-sm outline-none transition-colors duration-300" 
                  style={{
                    backgroundColor: '#0b0f1c',
                    border: '2px solid #26304b',
                    color: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                  onBlur={(e) => e.target.style.borderColor = '#26304b'}
                  value={editPatientData.birth_date || ''} 
                  onChange={e => setEditPatientData({...editPatientData, birth_date: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>Luogo di nascita</label>
                <input 
                  className="w-full rounded px-3 py-2 text-sm outline-none transition-colors duration-300" 
                  style={{
                    backgroundColor: '#0b0f1c',
                    border: '2px solid #26304b',
                    color: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                  onBlur={(e) => e.target.style.borderColor = '#26304b'}
                  value={editPatientData.birth_place || ''} 
                  onChange={e => setEditPatientData({...editPatientData, birth_place: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>Codice Fiscale</label>
                <input 
                  className="w-full rounded px-3 py-2 text-sm outline-none transition-colors duration-300" 
                  style={{
                    backgroundColor: '#0b0f1c',
                    border: '2px solid #26304b',
                    color: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                  onBlur={(e) => e.target.style.borderColor = '#26304b'}
                  value={editPatientData.fiscal_code || ''} 
                  onChange={e => setEditPatientData({...editPatientData, fiscal_code: e.target.value.toUpperCase()})}
                  maxLength={16}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>Indirizzo</label>
              <input 
                className="w-full rounded px-3 py-2 text-sm outline-none transition-colors duration-300" 
                style={{
                  backgroundColor: '#0b0f1c',
                  border: '2px solid #26304b',
                  color: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                onBlur={(e) => e.target.style.borderColor = '#26304b'}
                value={editPatientData.address || ''} 
                onChange={e => setEditPatientData({...editPatientData, address: e.target.value})}
              />
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 text-sm" style={{ color: 'white' }}>
            <div>📧 {patient.email || 'Nessuna email'}</div>
            <div>📱 {patient.phone || 'Nessun telefono'}</div>
            <div>📍 {patient.address || 'Nessun indirizzo'}</div>
            <div>🆔 {patient.fiscal_code || 'Nessun codice fiscale'}</div>
            <div>📅 Nato/a: {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('it-IT') : 'Non specificato'}</div>
            <div>🌍 Luogo di nascita: {patient.birth_place || 'Non specificato'}</div>
          </div>
        )}
        
        <div className="flex gap-3 mt-4">
          <button 
            onClick={invitePatient}
            className="px-4 py-2 rounded font-medium transition-colors duration-200"
            style={{ backgroundColor: '#374151', color: 'white' }}
          >
            🔐 Invita paziente
          </button>
          <button 
            onClick={() => setShowCalendarPicker(true)}
            className="px-4 py-2 rounded font-medium transition-colors duration-200"
            style={{ backgroundColor: '#7aa2ff', color: '#0b1022' }}
          >
            📅 Nuovo appuntamento
          </button>
          <button
             onClick={() => router.push(`/app/therapist/consenso/${id}`)}
             className="px-4 py-2 rounded font-medium transition-colors duration-200"
             style={{ backgroundColor: '#9333ea', color: 'white' }}
          >
            📄 Genera Consenso
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/20 overflow-x-auto">
        <button onClick={() => setActiveTab('piano')} className={`px-4 py-2 whitespace-nowrap font-medium ${activeTab === 'piano' ? 'border-b-2 border-blue-400 text-white' : 'text-gray-300 hover:text-white'}`}>Piano Terapeutico</button>
        <button onClick={() => setActiveTab('area-paziente')} className={`px-4 py-2 whitespace-nowrap font-medium ${activeTab === 'area-paziente' ? 'border-b-2 border-blue-400 text-white' : 'text-gray-300 hover:text-white'}`}>
          👤 Area Paziente
          {(patientThoughts || unreadMessages > 0) && (
            <span className="ml-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadMessages}</span>
          )}
        </button>
        <button onClick={() => setActiveTab('sedute')} className={`px-4 py-2 whitespace-nowrap font-medium ${activeTab === 'sedute' ? 'border-b-2 border-blue-400 text-white' : 'text-gray-300 hover:text-white'}`}>Sedute & IA</button>
        <button onClick={() => setActiveTab('questionari')} className={`px-4 py-2 whitespace-nowrap font-medium ${activeTab === 'questionari' ? 'border-b-2 border-blue-400 text-white' : 'text-gray-300 hover:text-white'}`}>Questionari</button>
      </div>

      {activeTab === 'area-paziente' && (
        <div className="space-y-6">
          <div className="rounded-lg p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: 'white' }}>
                <span>💭</span> Pensieri del paziente per la prossima seduta
              </h3>
              {patientThoughts && (
                <button onClick={clearPatientThoughts} className="text-sm px-3 py-1 rounded font-medium transition-colors duration-200" style={{ backgroundColor: '#22c55e', color: 'white' }}>
                  ✅ Seduta completata (svuota)
                </button>
              )}
            </div>
            {!patientThoughts ? (
              <p className="text-sm" style={{ color: '#a8b2d6' }}>Il paziente non ha ancora scritto pensieri per la prossima seduta.</p>
            ) : (
              <div className="rounded-lg p-4" style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <p className="whitespace-pre-wrap" style={{ color: 'white' }}>{patientThoughts}</p>
              </div>
            )}
          </div>

          <div className="rounded-lg p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'white' }}>
              <span>📨</span> Messaggi del paziente sugli appuntamenti
              {unreadMessages > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{unreadMessages} nuovi</span>
              )}
            </h3>
            {appointmentMessages.length === 0 ? (
              <p className="text-sm" style={{ color: '#a8b2d6' }}>Nessun messaggio ricevuto.</p>
            ) : (
              <div className="space-y-3">
                {appointmentMessages.map(msg => (
                  <div key={msg.id} className={`border-l-4 pl-4 py-3 rounded ${msg.read_by_therapist ? 'border-gray-500' : 'border-orange-500'}`} style={{
                    backgroundColor: msg.read_by_therapist ? 'rgba(255,255,255,0.02)' : 'rgba(251, 146, 60, 0.1)'
                  }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs" style={{ color: '#a8b2d6' }}>{new Date(msg.created_at).toLocaleString('it-IT')}</div>
                      <div className="flex gap-2">
                        {!msg.read_by_therapist && (
                          <button onClick={() => markMessageAsRead(msg.id)} className="text-xs font-medium transition-colors duration-200" style={{ color: '#7aa2ff' }}>
                            ✓ Segna come letto
                          </button>
                        )}
                        <button onClick={() => deleteMessage(msg.id)} className="text-xs font-medium transition-colors duration-200" style={{ color: '#ef4444' }}>
                          🗑️ Elimina
                        </button>
                      </div>
                    </div>
                    <p style={{ color: 'white' }}>{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'white' }}>
              <span>📔</span> Diario del paziente
            </h3>
            {patientNotes.length === 0 ? (
              <p className="text-sm" style={{ color: '#a8b2d6' }}>Il paziente non ha ancora scritto note nel diario.</p>
            ) : (
              <div className="space-y-4">
                {patientNotes.map(note => (
                  <div key={note.id} className="border-l-4 border-emerald-500 pl-4 py-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <div className="text-sm font-medium mb-1" style={{ color: '#a8b2d6' }}>
                      {new Date(note.note_date).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <p className="whitespace-pre-wrap" style={{ color: 'white' }}>{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <SessionRatesForm
            patientId={id}
            initialData={{
              session_duration_individual: patient.session_duration_individual || 45,
              session_duration_couple: patient.session_duration_couple || 60,
              session_duration_family: patient.session_duration_family || 75,
              rate_individual: patient.rate_individual || 90,
              rate_couple: patient.rate_couple || 130,
              rate_family: patient.rate_family || 150
            }}
            onSave={loadData}
          />
        </div>
      )}

      <div className="rounded-lg p-6" style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'white' }}>
              <span>📄</span> Consensi Firmati ({consentDocuments.length})
            </h3>
            {consentDocuments.length === 0 ? (
              <p className="text-sm" style={{ color: '#a8b2d6' }}>Nessun consenso firmato trovato.</p>
            ) : (
              <div className="space-y-4">
                {consentDocuments.map(consent => (
                  <div key={consent.id} className="border rounded-lg p-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold" style={{ color: 'white' }}>📋 Consenso Informato</h4>
                        <p className="text-sm" style={{ color: '#a8b2d6' }}>
                          Creato il {new Date(consent.created_at).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewConsent(consent.id)}
                          className="text-sm px-3 py-1 rounded font-medium transition-colors duration-200"
                          style={{ backgroundColor: '#7aa2ff', color: '#0b1022' }}
                        >
                          👁️ Visualizza
                        </button>
                        {consent.status === 'completed' && (
                          <button
                            onClick={() => downloadConsentPDF(consent.id)}
                            className="text-sm px-3 py-1 rounded font-medium transition-colors duration-200"
                            style={{ backgroundColor: '#22c55e', color: 'white' }}
                          >
                            📥 Scarica PDF
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span style={{ color: '#a8b2d6' }}>Firma Terapeuta:</span>
                        <span className="flex items-center gap-1">
                          <span className="text-green-400">✅</span>
                          <span className="text-xs" style={{ color: '#a8b2d6' }}>
                            {new Date(consent.therapist_signed_at).toLocaleDateString('it-IT')}
                          </span>
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span style={{ color: '#a8b2d6' }}>Firma Paziente:</span>
                        {consent.patient_signature ? (
                          <span className="flex items-center gap-1">
                            <span className="text-green-400">✅</span>
                            <span className="text-xs" style={{ color: '#a8b2d6' }}>
                              {consent.patient_signed_at && new Date(consent.patient_signed_at).toLocaleDateString('it-IT')}
                            </span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <span className="text-orange-400">⏳</span>
                            <span className="text-xs text-orange-400">In attesa</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <span style={{ color: '#a8b2d6' }}>Tessera Sanitaria:</span>
                        <span className={consent.tessera_sanitaria_consent ? 'text-green-400' : 'text-red-400'}>
                          {consent.tessera_sanitaria_consent ? '✅ Autorizzata' : '❌ Non autorizzata'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          consent.status === 'completed' 
                            ? 'bg-green-600 text-white' 
                            : consent.status === 'therapist_signed'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}>
                          {consent.status === 'completed' ? '✅ Completato' : 
                           consent.status === 'therapist_signed' ? '⏳ In attesa paziente' : 
                           '📝 Bozza'}
                        </span>
                        
                        {consent.status === 'therapist_signed' && (
                          <button
                            onClick={() => {
                              const link = `${window.location.origin}/consent/patient/${consent.id}`;
                              navigator.clipboard.writeText(link);
                              alert('✅ Link copiato negli appunti! Condividilo con il paziente.');
                            }}
                            className="text-xs px-2 py-1 rounded font-medium transition-colors duration-200"
                            style={{ backgroundColor: '#9333ea', color: 'white' }}
                          >
                            📋 Copia link paziente
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      
      {activeTab === 'piano' && (
        <div className="space-y-6">
          <div className="flex justify-end gap-2">
            {!editMode && (
              <button 
                onClick={getSuggestions} 
                className="px-4 py-2 rounded font-medium transition-colors duration-200 flex items-center gap-2"
                style={{ background: 'linear-gradient(to right, #9333ea, #7aa2ff)', color: 'white' }}
              >
                ✨ Suggerisci con IA
              </button>
            )}
            {editMode ? (
              <>
                <button onClick={savePlan} className="px-4 py-2 rounded mr-2 font-medium transition-colors duration-200" style={{ backgroundColor: '#22c55e', color: 'white' }}>💾 Salva</button>
                <button onClick={() => setEditMode(false)} className="px-4 py-2 rounded font-medium transition-colors duration-200" style={{ backgroundColor: '#6b7280', color: 'white' }}>Annulla</button>
              </>
            ) : (
              <button onClick={() => setEditMode(true)} className="px-4 py-2 rounded font-medium transition-colors duration-200" style={{ backgroundColor: '#7aa2ff', color: '#0b1022' }}>✏️ Modifica</button>
            )}
          </div>

          <div className="rounded-lg p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg" style={{ color: 'white' }}>🎯 VALUTAZIONE (Anamnesi e psicodiagnosi)</h3>
              {!editMode && (!anamnesi || !valutazionePsico || !formulazioneCaso) && (
                <button
                  onClick={generateAssessment}
                  disabled={generatingAssessment}
                  className="px-4 py-2 rounded text-sm flex items-center gap-2 font-medium transition-colors duration-200"
                  style={{
                    background: generatingAssessment ? '#6b7280' : 'linear-gradient(to right, #059669, #0d9488)',
                    color: 'white',
                    opacity: generatingAssessment ? 0.7 : 1
                  }}
                >
                  {generatingAssessment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generazione...
                    </>
                  ) : (
                    <>🤖 Genera da Sedute</>
                  )}
                </button>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2" style={{ color: 'white' }}>Anamnesi:</label>
                {editMode ? (
                  <textarea 
                    className="w-full rounded p-3 min-h-[100px] outline-none transition-colors duration-300" 
                    style={{
                      backgroundColor: '#0b0f1c',
                      border: '2px solid #26304b',
                      color: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                    onBlur={(e) => e.target.style.borderColor = '#26304b'}
                    value={anamnesi} 
                    onChange={e => setAnamnesi(e.target.value)} 
                  />
                ) : (
                  <p className="whitespace-pre-wrap" style={{ color: '#d1d5db' }}>{anamnesi || 'Nessuna informazione'}</p>
                )}
              </div>
              <div>
                <label className="block font-medium mb-2" style={{ color: 'white' }}>Valutazione psicodiagnostica:</label>
                {editMode ? (
                  <textarea 
                    className="w-full rounded p-3 min-h-[100px] outline-none transition-colors duration-300" 
                    style={{
                      backgroundColor: '#0b0f1c',
                      border: '2px solid #26304b',
                      color: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                    onBlur={(e) => e.target.style.borderColor = '#26304b'}
                    value={valutazionePsico} 
                    onChange={e => setValutazionePsico(e.target.value)} 
                  />
                ) : (
                  <p className="whitespace-pre-wrap" style={{ color: '#d1d5db' }}>{valutazionePsico || 'Nessuna informazione'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 className="font-bold text-lg mb-3" style={{ color: 'white' }}>📝 FORMULAZIONE DEL CASO</h3>
            {editMode ? (
              <textarea 
                className="w-full rounded p-3 min-h-[120px] outline-none transition-colors duration-300" 
                style={{
                  backgroundColor: '#0b0f1c',
                  border: '2px solid #26304b',
                  color: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                onBlur={(e) => e.target.style.borderColor = '#26304b'}
                value={formulazioneCaso} 
                onChange={e => setFormulazioneCaso(e.target.value)} 
              />
            ) : (
              <p className="whitespace-pre-wrap" style={{ color: '#d1d5db' }}>{formulazioneCaso || 'Nessuna informazione'}</p>
            )}
          </div>

          <div className="rounded-lg p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 className="font-bold text-lg mb-3" style={{ color: 'white' }}>🎯 CONTRATTO TERAPEUTICO E OBIETTIVI</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2" style={{ color: 'white' }}>Obiettivi generali:</label>
                {editMode ? (
                  <textarea 
                    className="w-full rounded p-3 min-h-[100px] outline-none transition-colors duration-300" 
                    style={{
                      backgroundColor: '#0b0f1c',
                      border: '2px solid #26304b',
                      color: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                    onBlur={(e) => e.target.style.borderColor = '#26304b'}
                    value={obiettiviGenerali.join('\n')} 
                    onChange={e => setObiettiviGenerali(e.target.value.split('\n').filter(o => o.trim()))} 
                    placeholder="Inserisci un obiettivo per riga" 
                  />
                ) : (
                  obiettiviGenerali.length === 0 ? (
                    <p style={{ color: '#a8b2d6' }}>Nessun obiettivo generale</p>
                  ) : (
                    <ul className="space-y-2">
                      {obiettiviGenerali.map((o, i) => {
                        const completion = getObjectiveCompletion('generale', i);
                        return (
                          <li key={i} className="flex items-start gap-3 p-2 rounded transition-colors duration-200" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <input type="checkbox" checked={completion?.completed || false} onChange={() => completion && toggleObjectiveCompletion(completion.id, completion.completed)} className="mt-1 w-5 h-5 text-blue-600 rounded" />
                            <span className={completion?.completed ? 'line-through' : ''} style={{ color: completion?.completed ? '#9ca3af' : 'white' }}>{o}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )
                )}
              </div>
              <div>
                <label className="block font-medium mb-2" style={{ color: 'white' }}>Obiettivi specifici:</label>
                {editMode ? (
                  <textarea 
                    className="w-full rounded p-3 min-h-[100px] outline-none transition-colors duration-300" 
                    style={{
                      backgroundColor: '#0b0f1c',
                      border: '2px solid #26304b',
                      color: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                    onBlur={(e) => e.target.style.borderColor = '#26304b'}
                    value={obiettiviSpecifici.join('\n')} 
                    onChange={e => setObiettiviSpecifici(e.target.value.split('\n').filter(o => o.trim()))} 
                    placeholder="Inserisci un obiettivo per riga" 
                  />
                ) : (
                  obiettiviSpecifici.length === 0 ? (
                    <p style={{ color: '#a8b2d6' }}>Nessun obiettivo specifico</p>
                  ) : (
                    <ul className="space-y-2">
                      {obiettiviSpecifici.map((o, i) => {
                        const completion = getObjectiveCompletion('specifico', i);
                        return (
                          <li key={i} className="flex items-start gap-3 p-2 rounded transition-colors duration-200" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <input type="checkbox" checked={completion?.completed || false} onChange={() => completion && toggleObjectiveCompletion(completion.id, completion.completed)} className="mt-1 w-5 h-5 text-blue-600 rounded" />
                            <span className={completion?.completed ? 'line-through' : ''} style={{ color: completion?.completed ? '#9ca3af' : 'white' }}>{o}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 className="font-bold text-lg mb-3" style={{ color: 'white' }}>💪 ESERCIZI</h3>
            {editMode ? (
              <textarea 
                className="w-full rounded p-3 min-h-[120px] outline-none transition-colors duration-300" 
                style={{
                  backgroundColor: '#0b0f1c',
                  border: '2px solid #26304b',
                  color: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                onBlur={(e) => e.target.style.borderColor = '#26304b'}
                value={esercizi.join('\n')} 
                onChange={e => setEsercizi(e.target.value.split('\n').filter(e => e.trim()))} 
                placeholder="Inserisci un esercizio per riga" 
              />
            ) : (
              esercizi.length === 0 ? (
                <p style={{ color: '#a8b2d6' }}>Nessun esercizio</p>
              ) : (
                <ul className="space-y-2">
                  {esercizi.map((ex, i) => {
                    const completion = getExerciseCompletion(i);
                    return (
                      <li key={i} className="flex items-start gap-3 p-2 rounded transition-colors duration-200" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        <input type="checkbox" checked={completion?.completed || false} onChange={() => completion && toggleExerciseCompletion(completion.id, completion.completed)} className="mt-1 w-5 h-5 text-emerald-600 rounded" />
                        <span className={completion?.completed ? 'line-through' : ''} style={{ color: completion?.completed ? '#9ca3af' : 'white' }}>{ex}</span>
                        {completion?.completed && completion.completed_at && (
                          <span className="text-xs ml-auto" style={{ color: '#a8b2d6' }}>✓ {new Date(completion.completed_at).toLocaleDateString('it-IT')}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )
            )}
          </div>
        </div>
      )}

      {activeTab === 'sedute' && (
        <div className="space-y-6">
          <div className="rounded-lg p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg" style={{ color: 'white' }}>📝 Sedute e Riassunti IA</h3>
              <Link href={`/app/therapist/sedute/nuovo?patientId=${id}`} className="px-4 py-2 rounded text-sm font-medium transition-colors duration-200" style={{ backgroundColor: '#7aa2ff', color: '#0b1022', textDecoration: 'none' }}>+ Nuova Nota</Link>
            </div>
            {sessionNotes.length === 0 ? (
              <p style={{ color: '#a8b2d6' }}>Nessuna seduta registrata</p>
            ) : (
              <div className="space-y-3">
                {sessionNotes.map(note => (
                  <Link key={note.id} href={`/app/therapist/sedute/${note.id}`} className="block border rounded p-4 transition-colors duration-200" style={{ 
                    borderColor: 'rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    textDecoration: 'none',
                    color: 'white'
                  }}>
                    <div className="font-medium">📅 {new Date(note.session_date).toLocaleDateString('it-IT')}</div>
                    {note.ai_summary && <div className="text-sm mt-1" style={{ color: '#a8b2d6' }}>🤖 Riassunto IA disponibile</div>}
                    {note.notes && (
                      <div className="text-sm mt-2 line-clamp-2" style={{ color: '#a8b2d6' }}>{note.notes.substring(0, 100)}...</div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 className="font-bold text-lg mb-3" style={{ color: 'white' }}>📅 Prossimi Appuntamenti</h3>
            {appointments.length === 0 ? (
              <p style={{ color: '#a8b2d6' }}>Nessun appuntamento programmato</p>
            ) : (
              <div className="space-y-2">
                {appointments.map(apt => (
                  <div key={apt.id} className="border rounded p-3" style={{ 
                    borderColor: 'rgba(255,255,255,0.1)', 
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    color: 'white'
                  }}>
                    {new Date(apt.starts_at).toLocaleString('it-IT')} - {apt.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'questionari' && (
        <div className="rounded-lg p-6" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h3 className="font-bold text-lg mb-3" style={{ color: 'white' }}>📊 Questionari Realizzati</h3>
          {gad7Results.length === 0 ? (
            <p style={{ color: '#a8b2d6' }}>Nessun questionario compilato</p>
          ) : (
            <div className="space-y-3">
              {gad7Results.map(result => (
                <div key={result.id} className="border rounded p-4 flex items-center justify-between" style={{ 
                  borderColor: 'rgba(255,255,255,0.1)', 
                  backgroundColor: 'rgba(255,255,255,0.02)'
                }}>
                  <div style={{ color: 'white' }}>
                    <span className="font-medium">GAD-7</span> | Score: {result.total} | 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${result.severity === 'minima' ? 'bg-green-600 text-white' : result.severity === 'lieve' ? 'bg-blue-600 text-white' : result.severity === 'moderata' ? 'bg-yellow-600 text-white' : 'bg-red-600 text-white'}`}>
                      {result.severity}
                    </span>
                  </div>
                  <div className="text-sm" style={{ color: '#a8b2d6' }}>{new Date(result.created_at).toLocaleDateString('it-IT')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AISuggestionsModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        suggestions={aiSuggestions}
        onApply={applySuggestions}
        isLoading={aiLoading}
      />

      <CalendarPicker
        isOpen={showCalendarPicker}
        onClose={() => setShowCalendarPicker(false)}
        onSelectDateTime={handleDateTimeSelected}
      />

      <QuickAppointmentModal
        isOpen={showQuickModal}
        onClose={() => setShowQuickModal(false)}
        prefilledDateTime={selectedDateTime}
        onSuccess={loadData}
      />
    </div>
  );
}
