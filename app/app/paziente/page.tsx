'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import ChatWidget from '@/components/ChatWidget';
import PasswordChangeModal from '@/components/PasswordChangeModal';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Patient = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  province: string | null;
  fiscal_code: string | null;
  birth_date: string | null;
  birth_place: string | null;
  medico_mmg: string | null;
  goals: string | null;
  issues: string | null;
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

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [objectivesCompletion, setObjectivesCompletion] = useState<ObjectiveCompletion[]>([]);
  const [exercisesCompletion, setExercisesCompletion] = useState<ExerciseCompletion[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  const [nextSessionThoughts, setNextSessionThoughts] = useState('');
  const [diaryEntry, setDiaryEntry] = useState('');
  const [activeTab, setActiveTab] = useState<'profilo' | 'diario' | 'obiettivi'>('profilo');
  
  const [editingPersonalData, setEditingPersonalData] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedAddress, setEditedAddress] = useState('');
  const [editedCity, setEditedCity] = useState('');
  const [editedPostalCode, setEditedPostalCode] = useState('');
  const [editedProvince, setEditedProvince] = useState('');
  const [editedFiscalCode, setEditedFiscalCode] = useState('');
  const [editedBirthDate, setEditedBirthDate] = useState('');
  const [editedBirthPlace, setEditedBirthPlace] = useState('');
  const [editedMedico, setEditedMedico] = useState('');
  
  const [appointmentMessages, setAppointmentMessages] = useState<{[key: string]: string}>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 DEBUG - User autenticato:', user?.id, user?.email);
      if (!user) {
        console.log('❌ DEBUG - Nessun utente trovato!');
        setErr('Sessione non valida');
        setLoading(false);
        return;
      }

      const { data: p, error: pe } = await supabase
        .from('patients')
        .select(`
          id, display_name, email, phone, address, city, postal_code, province, 
          fiscal_code, birth_date, birth_place, medico_mmg, goals, issues
        `)
        .eq('patient_user_id', user.id)
        .single();
      console.log('🔍 DEBUG - Query patients:', { data: p, error: pe, searched_user_id: user.id });

      if (pe || !p) {
        setErr('Profilo paziente non trovato');
        setLoading(false);
        return;
      }

      setPatient(p as Patient);
      setEditedName(p.display_name || '');
      setEditedPhone(p.phone || '');
      setEditedAddress(p.address || '');
      setEditedCity(p.city || '');
      setEditedPostalCode(p.postal_code || '');
      setEditedProvince(p.province || '');
      setEditedFiscalCode(p.fiscal_code || '');
      setEditedBirthDate(p.birth_date || '');
      setEditedBirthPlace(p.birth_place || '');
      setEditedMedico(p.medico_mmg || '');

      const { data: appts } = await supabase
        .from('appointments')
        .select('id, title, starts_at')
        .eq('patient_id', p.id)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(5);
      setAppointments(appts || []);

      const { data: notes } = await supabase
        .from('patient_notes')
        .select('id, note_date, content')
        .eq('patient_id', p.id)
        .order('note_date', { ascending: false })
        .limit(10);
      setPatientNotes(notes || []);

      const { data: thoughts } = await supabase
        .from('patient_session_thoughts')
        .select('content')
        .eq('patient_id', p.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (thoughts) {
        setNextSessionThoughts(thoughts.content || '');
      }

      const { data: objData } = await supabase
        .from('objectives_completion')
        .select('*')
        .eq('patient_id', p.id)
        .order('objective_index', { ascending: true });
      setObjectivesCompletion(objData || []);

      const { data: exData } = await supabase
        .from('exercises_completion')
        .select('*')
        .eq('patient_id', p.id)
        .order('exercise_index', { ascending: true });
      setExercisesCompletion(exData || []);

      setLoading(false);
    } catch (e: any) {
      setErr(e?.message || 'Errore sconosciuto');
      setLoading(false);
    }
  }

  async function savePersonalData() {
    if (!patient?.id) return;
    try {
      const { error } = await supabase.from('patients').update({
        display_name: editedName,
        phone: editedPhone,
        address: editedAddress,
        city: editedCity,
        postal_code: editedPostalCode,
        province: editedProvince.toUpperCase(),
        fiscal_code: editedFiscalCode.toUpperCase(),
        birth_date: editedBirthDate || null,
        birth_place: editedBirthPlace,
        medico_mmg: editedMedico
      }).eq('id', patient.id);
      if (error) throw error;
      alert('✅ Dati salvati!');
      setEditingPersonalData(false);
      loadData();
    } catch (e: any) {
      alert('Errore: ' + e.message);
    }
  }

  async function saveNextSessionThoughts() {
    if (!patient?.id) return;
    try {
      const { error } = await supabase.from('patient_session_thoughts').upsert({
        patient_id: patient.id,
        content: nextSessionThoughts,
        created_at: new Date().toISOString()
      });
      if (error) throw error;
      alert('✅ Salvato! Il tuo terapeuta potrà leggerlo.');
    } catch (e: any) {
      alert('Errore: ' + e.message);
    }
  }

  async function saveDiaryEntry() {
    if (!patient?.id || !diaryEntry.trim()) return;
    try {
      const { error } = await supabase.from('patient_notes').insert({
        patient_id: patient.id,
        note_date: new Date().toISOString().split('T')[0],
        content: diaryEntry
      });
      if (error) throw error;
      alert('✅ Nota salvata nel diario!');
      setDiaryEntry('');
      loadData();
    } catch (e: any) {
      alert('Errore: ' + e.message);
    }
  }

  async function updateDiaryNote(noteId: string) {
    try {
      const { error } = await supabase.from('patient_notes').update({ content: editingNoteContent }).eq('id', noteId);
      if (error) throw error;
      alert('✅ Nota aggiornata!');
      setEditingNoteId(null);
      setEditingNoteContent('');
      loadData();
    } catch (e: any) {
      alert('Errore: ' + e.message);
    }
  }

  async function deleteDiaryNote(noteId: string) {
    if (!confirm('Sei sicuro di voler cancellare questa nota?')) return;
    try {
      const { error } = await supabase.from('patient_notes').delete().eq('id', noteId);
      if (error) throw error;
      alert('✅ Nota cancellata!');
      loadData();
    } catch (e: any) {
      alert('Errore: ' + e.message);
    }
  }

  async function sendAppointmentMessage(appointmentId: string) {
    if (!patient?.id) {
      alert('Errore: profilo paziente non trovato');
      return;
    }
    
    const message = appointmentMessages[appointmentId];
    if (!message?.trim()) {
      alert('Scrivi un messaggio prima di inviare');
      return;
    }
    
    try {
      const { error } = await supabase.from('appointment_messages').insert({
        appointment_id: appointmentId,
        patient_id: patient.id,
        message: message
      });
      
      if (error) {
        console.error('Errore inserimento messaggio:', error);
        throw error;
      }
      
      alert('✅ Messaggio inviato al terapeuta!');
      setAppointmentMessages({ ...appointmentMessages, [appointmentId]: '' });
    } catch (e: any) {
      alert('Errore: ' + e.message);
      console.error('Errore completo:', e);
    }
  }

  async function toggleObjective(objId: string, currentCompleted: boolean) {
    try {
      const { error } = await supabase.from('objectives_completion').update({
        completed: !currentCompleted,
        completed_at: !currentCompleted ? new Date().toISOString() : null
      }).eq('id', objId);
      if (error) throw error;
      loadData();
    } catch (e: any) {
      alert('Errore: ' + e.message);
    }
  }

  async function toggleExercise(exId: string, currentCompleted: boolean) {
    try {
      const { error } = await supabase.from('exercises_completion').update({
        completed: !currentCompleted,
        completed_at: !currentCompleted ? new Date().toISOString() : null
      }).eq('id', exId);
      if (error) throw error;
      loadData();
    } catch (e: any) {
      alert('Errore: ' + e.message);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6" style={{ color: 'white' }}>
        <p>Caricamento della tua area...</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="rounded p-4" style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#dc2626'
        }}>
          <p className="font-semibold mb-2">Errore</p>
          <p className="text-sm">{err}</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-6xl mx-auto p-6" style={{ color: 'white' }}>
        <p>Profilo paziente non disponibile.</p>
      </div>
    );
  }

  const nextAppointment = appointments[0];
  const lastNote = patientNotes[0];
  const generalObjectives = objectivesCompletion.filter(o => o.objective_type === 'generale');
  const specificObjectives = objectivesCompletion.filter(o => o.objective_type === 'specifico');

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header con styling cIAo-doc */}
      <div className="rounded-xl p-8 text-white shadow-lg" style={{
        background: 'linear-gradient(135deg, #0b1022 0%, #1e293b 50%, #334155 100%)'
      }}>
        <h1 className="text-3xl font-bold mb-2">💙 cIAo-doc</h1>
        <p className="text-xl mb-4">Benvenuto, {patient.display_name || 'Paziente'}! 👋</p>
        <div className="flex gap-6 text-sm opacity-90">
          {lastNote && (
            <div>📝 Ultima nota: {new Date(lastNote.note_date).toLocaleDateString('it-IT')}</div>
          )}
          {nextAppointment && (
            <div>📅 Prossima seduta: {new Date(nextAppointment.starts_at).toLocaleDateString('it-IT')} alle {new Date(nextAppointment.starts_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
          )}
        </div>
      </div>

      {/* Tabs Navigation con styling cIAo-doc */}
      <div className="flex gap-2 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('profilo')} 
          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            activeTab === 'profilo' ? 'bg-purple-600 text-white' : 'bg-purple-600/70 text-white/80 hover:bg-purple-600'
          }`}
        >
          👤 Profilo
        </button>
        <button 
          onClick={() => setActiveTab('diario')} 
          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            activeTab === 'diario' ? 'bg-purple-600 text-white' : 'bg-purple-600/70 text-white/80 hover:bg-purple-600'
          }`}
        >
          📔 Diario
        </button>
        <button 
          onClick={() => setActiveTab('obiettivi')} 
          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            activeTab === 'obiettivi' ? 'bg-purple-600 text-white' : 'bg-purple-600/70 text-white/80 hover:bg-purple-600'
          }`}
        >
          🎯 Obiettivi ed Esercizi
        </button>
      </div>

      {/* Tab Content - Profilo */}
      {activeTab === 'profilo' && (
        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Dati personali */}
          <div className="rounded-lg p-6 shadow-sm" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'white' }}>
                <span>👤</span> Dati personali
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="text-sm font-medium px-3 py-1 rounded transition-colors duration-200"
                  style={{ backgroundColor: '#f59e0b', color: 'white' }}
                >
                  🔐 Cambia Password
                </button>
                {!editingPersonalData && (
                  <button 
                    onClick={() => setEditingPersonalData(true)} 
                    className="text-sm font-medium px-3 py-1 rounded transition-colors duration-200"
                    style={{ backgroundColor: '#7aa2ff', color: '#0b1022' }}
                  >
                    ✏️ Modifica
                  </button>
                )}
              </div>
            </div>
            
            {editingPersonalData ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'white' }}>Nome completo</label>
                    <input 
                      type="text" 
                      value={editedName} 
                      onChange={e => setEditedName(e.target.value)} 
                      className="w-full rounded px-3 py-2 text-sm outline-none transition-colors duration-300" 
                      style={{
                        backgroundColor: '#0b0f1c',
                        border: '2px solid #26304b',
                        color: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                      onBlur={(e) => e.target.style.borderColor = '#26304b'}
                      placeholder="Mario Rossi" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'white' }}>Data di nascita</label>
                    <input 
                      type="date" 
                      value={editedBirthDate} 
                      onChange={e => setEditedBirthDate(e.target.value)} 
                      className="w-full rounded px-3 py-2 text-sm outline-none transition-colors duration-300" 
                      style={{
                        backgroundColor: '#0b0f1c',
                        border: '2px solid #26304b',
                        color: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                      onBlur={(e) => e.target.style.borderColor = '#26304b'}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm mb-1" style={{ color: 'white' }}>Luogo di nascita</label>
                  <input 
                    type="text" 
                    value={editedBirthPlace} 
                    onChange={e => setEditedBirthPlace(e.target.value)} 
                    className="w-full rounded px-3 py-2 text-sm outline-none transition-colors duration-300" 
                    style={{
                      backgroundColor: '#0b0f1c',
                      border: '2px solid #26304b',
                      color: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                    onBlur={(e) => e.target.style.borderColor = '#26304b'}
                    placeholder="Roma" 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'white' }}>Email</label>
                    <input 
                      type="email" 
                      value={patient.email || ''} 
                      disabled 
                      className="w-full rounded px-3 py-2 text-sm opacity-50" 
                      style={{
                        backgroundColor: '#1a1a2e',
                        border: '2px solid #26304b',
                        color: '#9ca3af'
                      }}
                    />
                    <p className="text-xs mt-1" style={{ color: '#a8b2d6' }}>L'email non può essere modificata</p>
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'white' }}>Telefono</label>
                    <input 
                      type="tel" 
                      value={editedPhone} 
                      onChange={e => setEditedPhone(e.target.value)} 
                      className="w-full rounded px-3 py-2 text-sm outline-none transition-colors duration-300" 
                      style={{
                        backgroundColor: '#0b0f1c',
                        border: '2px solid #26304b',
                        color: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                      onBlur={(e) => e.target.style.borderColor = '#26304b'}
                      placeholder="+39 123 456 7890" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm mb-1" style={{ color: 'white' }}>Codice Fiscale</label>
                  <input 
                    type="text" 
                    value={editedFiscalCode} 
                    onChange={e => setEditedFiscalCode(e.target.value.toUpperCase())} 
                    className="w-full rounded px-3 py-2 text-sm outline-none transition-colors duration-300" 
                    style={{
                      backgroundColor: '#0b0f1c',
                      border: '2px solid #26304b',
                      color: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                    onBlur={(e) => e.target.style.borderColor = '#26304b'}
                    placeholder="RSSMRA80A01H501Z" 
                    maxLength={16} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-1" style={{ color: 'white' }}>Medico di medicina generale</label>
                  <input 
                    type="text" 
                    value={editedMedico} 
                    onChange={e => setEditedMedico(e.target.value)} 
                    className="w-full rounded px-3 py-2 text-sm outline-none transition-colors duration-300" 
                    style={{
                      backgroundColor: '#0b0f1c',
                      border: '2px solid #26304b',
                      color: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                    onBlur={(e) => e.target.style.borderColor = '#26304b'}
                    placeholder="Dr. Mario Rossi" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-1" style={{ color: 'white' }}>Indirizzo</label>
                  <input 
                    type="text" 
                    value={editedAddress} 
                    onChange={e => setEditedAddress(e.target.value)} 
                    className="w-full rounded px-3 py-2 text-sm outline-none transition-colors duration-300" 
                    style={{
                      backgroundColor: '#0b0f1c',
                      border: '2px solid #26304b',
                      color: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                    onBlur={(e) => e.target.style.borderColor = '#26304b'}
                    placeholder="Via Roma 123" 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'white' }}>Città</label>
                    <input 
                      type="text" 
                      value={editedCity} 
                      onChange={e => setEditedCity(e.target.value)} 
                      className="w-full rounded px-3 py-2 text-sm outline-none transition-colors duration-300" 
                      style={{
                        backgroundColor: '#0b0f1c',
                        border: '2px solid #26304b',
                        color: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                      onBlur={(e) => e.target.style.borderColor = '#26304b'}
                      placeholder="Roma" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'white' }}>CAP</label>
                    <input 
                      type="text" 
                      value={editedPostalCode} 
                      onChange={e => setEditedPostalCode(e.target.value)} 
                      className="w-full rounded px-3 py-2 text-sm outline-none transition-colors duration-300" 
                      style={{
                        backgroundColor: '#0b0f1c',
                        border: '2px solid #26304b',
                        color: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                      onBlur={(e) => e.target.style.borderColor = '#26304b'}
                      placeholder="00100" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'white' }}>Provincia</label>
                    <input 
                      type="text" 
                      value={editedProvince} 
                      onChange={e => setEditedProvince(e.target.value.toUpperCase())} 
                      className="w-full rounded px-3 py-2 text-sm outline-none transition-colors duration-300" 
                      style={{
                        backgroundColor: '#0b0f1c',
                        border: '2px solid #26304b',
                        color: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                      onBlur={(e) => e.target.style.borderColor = '#26304b'}
                      placeholder="RM" 
                      maxLength={2} 
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={savePersonalData} 
                    className="px-4 py-2 rounded font-medium transition-colors duration-200"
                    style={{ backgroundColor: '#22c55e', color: 'white' }}
                  >
                    💾 Salva
                  </button>
                  <button 
                    onClick={() => {
                      setEditingPersonalData(false);
                      setEditedName(patient.display_name || '');
                      setEditedPhone(patient.phone || '');
                      setEditedAddress(patient.address || '');
                      setEditedCity(patient.city || '');
                      setEditedPostalCode(patient.postal_code || '');
                      setEditedProvince(patient.province || '');
                      setEditedFiscalCode(patient.fiscal_code || '');
                      setEditedBirthDate(patient.birth_date || '');
                      setEditedBirthPlace(patient.birth_place || '');
                      setEditedMedico(patient.medico_mmg || '');
                    }} 
                    className="px-4 py-2 rounded font-medium transition-colors duration-200"
                    style={{ backgroundColor: '#6b7280', color: 'white' }}
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm" style={{ color: 'white' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span style={{ color: '#a8b2d6' }}>Nome:</span>
                    <span className="font-medium">{patient.display_name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#a8b2d6' }}>Data nascita:</span>
                    <span className="font-medium">{patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('it-IT') : '—'}</span>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: '#a8b2d6' }}>Luogo di nascita:</span>
                  <span className="font-medium">{patient.birth_place || '—'}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span style={{ color: '#a8b2d6' }}>Email:</span>
                    <span className="font-medium">{patient.email || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#a8b2d6' }}>Telefono:</span>
                    <span className="font-medium">{patient.phone || '—'}</span>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: '#a8b2d6' }}>Codice Fiscale:</span>
                  <span className="font-medium">{patient.fiscal_code || '—'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: '#a8b2d6' }}>Medico MMG:</span>
                  <span className="font-medium">{patient.medico_mmg || '—'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: '#a8b2d6' }}>Indirizzo:</span>
                  <span className="font-medium">{patient.address || '—'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: '#a8b2d6' }}>Città, CAP, Provincia:</span>
                  <span className="font-medium">
                    {[patient.city, patient.postal_code, patient.province].filter(Boolean).join(', ') || '—'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Prossimi appuntamenti */}
          <div className="rounded-lg p-6 shadow-sm" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'white' }}>
              <span>📅</span> Prossimi appuntamenti
            </h2>
            {appointments.length === 0 ? (
              <p className="text-sm" style={{ color: '#a8b2d6' }}>Nessun appuntamento programmato</p>
            ) : (
              <div className="space-y-4">
                {appointments.map(apt => (
                  <div key={apt.id} className="border-l-4 pl-4 py-2" style={{ borderColor: '#7aa2ff' }}>
                    <div className="font-medium" style={{ color: 'white' }}>{apt.title}</div>
                    <div className="text-sm mb-2" style={{ color: '#a8b2d6' }}>
                      {new Date(apt.starts_at).toLocaleString('it-IT')}
                    </div>
                    <div className="mt-2">
                      <textarea
                        placeholder="Scrivi un messaggio al terapeuta (es: disdetta, cambio orario...)"
                        value={appointmentMessages[apt.id] || ''}
                        onChange={e => setAppointmentMessages({ ...appointmentMessages, [apt.id]: e.target.value })}
                        className="w-full text-sm rounded p-2 min-h-[60px] outline-none transition-colors duration-300"
                        style={{
                          backgroundColor: '#0b0f1c',
                          border: '2px solid #26304b',
                          color: 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                        onBlur={(e) => e.target.style.borderColor = '#26304b'}
                      />
                      <button 
                        onClick={() => sendAppointmentMessage(apt.id)} 
                        className="mt-1 text-xs px-3 py-1 rounded transition-colors duration-200"
                        style={{ backgroundColor: '#7aa2ff', color: '#0b1022' }}
                      >
                        📨 Invia al terapeuta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* I tuoi pensieri per la prossima seduta */}
          <div className="rounded-lg p-6 shadow-sm lg:col-span-2" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'white' }}>
              <span>💭</span> I tuoi pensieri per la prossima seduta
            </h2>
            <p className="text-sm mb-3" style={{ color: '#a8b2d6' }}>
              Scrivi qui domande, obiettivi o situazioni che vuoi discutere nella prossima seduta. Il terapeuta potrà leggerli in anticipo.
            </p>
            <textarea
              className="w-full rounded-lg p-3 min-h-[120px] outline-none transition-colors duration-300"
              style={{
                backgroundColor: '#0b0f1c',
                border: '2px solid #26304b',
                color: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
              onBlur={(e) => e.target.style.borderColor = '#26304b'}
              placeholder="Es: Vorrei parlare di come gestire l'ansia prima delle presentazioni di lavoro..."
              value={nextSessionThoughts}
              onChange={e => setNextSessionThoughts(e.target.value)}
            />
            <button 
              onClick={saveNextSessionThoughts} 
              className="mt-3 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              style={{ backgroundColor: '#7aa2ff', color: '#0b1022' }}
            >
              💾 Salva pensieri
            </button>
          </div>
        </div>
      )}

      {/* Tab Content - Diario */}
      {activeTab === 'diario' && (
        <div className="space-y-6">
          <div className="rounded-lg p-6 shadow-sm" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'white' }}>
              <span>✍️</span> Scrivi una nuova nota
            </h2>
            <p className="text-sm mb-3" style={{ color: '#a8b2d6' }}>
              Usa il diario per annotare pensieri, emozioni, situazioni quotidiane. Il terapeuta potrà leggerle.
            </p>
            <textarea
              className="w-full rounded-lg p-3 min-h-[150px] outline-none transition-colors duration-300"
              style={{
                backgroundColor: '#0b0f1c',
                border: '2px solid #26304b',
                color: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
              onBlur={(e) => e.target.style.borderColor = '#26304b'}
              placeholder="Oggi mi sono sentito/a..."
              value={diaryEntry}
              onChange={e => setDiaryEntry(e.target.value)}
            />
            <button 
              onClick={saveDiaryEntry} 
              disabled={!diaryEntry.trim()} 
              className="mt-3 px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
              style={{ backgroundColor: '#7aa2ff', color: '#0b1022' }}
            >
              💾 Salva nota
            </button>
          </div>

          <div className="rounded-lg p-6 shadow-sm" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'white' }}>
              <span>📚</span> Le tue note
            </h2>
            {patientNotes.length === 0 ? (
              <p className="text-sm" style={{ color: '#a8b2d6' }}>Nessuna nota nel diario ancora.</p>
            ) : (
              <div className="space-y-4">
                {patientNotes.map(note => (
                  <div key={note.id} className="border-l-4 pl-4 py-3 rounded" style={{
                    borderColor: '#7aa2ff',
                    backgroundColor: 'rgba(255,255,255,0.02)'
                  }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium" style={{ color: '#a8b2d6' }}>
                        {new Date(note.note_date).toLocaleDateString('it-IT', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      {editingNoteId !== note.id && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => { 
                              setEditingNoteId(note.id); 
                              setEditingNoteContent(note.content); 
                            }} 
                            className="text-xs transition-colors duration-200"
                            style={{ color: '#7aa2ff' }}
                          >
                            ✏️ Modifica
                          </button>
                          <button 
                            onClick={() => deleteDiaryNote(note.id)} 
                            className="text-xs transition-colors duration-200"
                            style={{ color: '#ef4444' }}
                          >
                            🗑️ Cancella
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {editingNoteId === note.id ? (
                      <div>
                        <textarea 
                          value={editingNoteContent} 
                          onChange={e => setEditingNoteContent(e.target.value)} 
                          className="w-full rounded p-2 min-h-[100px] text-sm outline-none transition-colors duration-300"
                          style={{
                            backgroundColor: '#0b0f1c',
                            border: '2px solid #26304b',
                            color: 'white'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
                          onBlur={(e) => e.target.style.borderColor = '#26304b'}
                        />
                        <div className="flex gap-2 mt-2">
                          <button 
                            onClick={() => updateDiaryNote(note.id)} 
                            className="text-xs px-3 py-1 rounded transition-colors duration-200"
                            style={{ backgroundColor: '#22c55e', color: 'white' }}
                          >
                            💾 Salva
                          </button>
                          <button 
                            onClick={() => { 
                              setEditingNoteId(null); 
                              setEditingNoteContent(''); 
                            }} 
                            className="text-xs px-3 py-1 rounded transition-colors duration-200"
                            style={{ backgroundColor: '#6b7280', color: 'white' }}
                          >
                            Annulla
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap" style={{ color: 'white' }}>{note.content}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content - Obiettivi ed Esercizi */}
      {activeTab === 'obiettivi' && (
        <div className="space-y-6">
          {/* Obiettivi */}
          <div className="rounded-lg p-6 shadow-sm" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'white' }}>
              <span>🎯</span> I tuoi obiettivi terapeutici
            </h2>
            {generalObjectives.length === 0 && specificObjectives.length === 0 ? (
              <p className="text-sm" style={{ color: '#a8b2d6' }}>
                Nessun obiettivo definito ancora. Il terapeuta li aggiungerà nel piano terapeutico.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {generalObjectives.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3" style={{ color: '#a8b2d6' }}>Obiettivi Generali:</h3>
                    <ul className="space-y-2">
                      {generalObjectives.map(obj => (
                        <li key={obj.id} className="flex items-start gap-3 p-2 rounded transition-colors duration-200" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                          <input 
                            type="checkbox" 
                            checked={obj.completed} 
                            onChange={() => toggleObjective(obj.id, obj.completed)} 
                            className="mt-1 w-5 h-5 text-blue-600 rounded" 
                          />
                          <span 
                            className={`text-sm ${obj.completed ? 'line-through' : ''}`}
                            style={{ color: obj.completed ? '#9ca3af' : 'white' }}
                          >
                            {obj.objective_text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {specificObjectives.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3" style={{ color: '#a8b2d6' }}>Obiettivi Specifici:</h3>
                    <ul className="space-y-2">
                      {specificObjectives.map(obj => (
                        <li key={obj.id} className="flex items-start gap-3 p-2 rounded transition-colors duration-200" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                          <input 
                            type="checkbox" 
                            checked={obj.completed} 
                            onChange={() => toggleObjective(obj.id, obj.completed)} 
                            className="mt-1 w-5 h-5 text-blue-600 rounded" 
                          />
                          <span 
                            className={`text-sm ${obj.completed ? 'line-through' : ''}`}
                            style={{ color: obj.completed ? '#9ca3af' : 'white' }}
                          >
                            {obj.objective_text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Esercizi */}
          <div className="rounded-lg p-6 shadow-sm" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'white' }}>
              <span>💪</span> Esercizi assegnati dal terapeuta
            </h2>
            {exercisesCompletion.length === 0 ? (
              <p className="text-sm" style={{ color: '#a8b2d6' }}>Nessun esercizio assegnato ancora.</p>
            ) : (
              <div className="space-y-3">
                {exercisesCompletion.map(ex => (
                  <label 
                    key={ex.id} 
                    className="flex items-start gap-3 p-3 border rounded-lg transition-colors duration-200 cursor-pointer"
                    style={{
                      borderColor: 'rgba(255,255,255,0.1)',
                      backgroundColor: 'rgba(255,255,255,0.02)'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={ex.completed} 
                      onChange={() => toggleExercise(ex.id, ex.completed)} 
                      className="mt-1 w-5 h-5 text-emerald-600 rounded" 
                    />
                    <span 
                      className={`flex-1 ${ex.completed ? 'line-through' : ''}`}
                      style={{ color: ex.completed ? '#9ca3af' : 'white' }}
                    >
                      {ex.exercise_text}
                    </span>
                    {ex.completed && ex.completed_at && (
                      <span className="text-xs" style={{ color: '#a8b2d6' }}>
                        ✓ {new Date(ex.completed_at).toLocaleDateString('it-IT')}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {patient && (
        <ChatWidget 
          patientId={patient.id} 
          patientName={patient.display_name || 'Paziente'}
        />
      )}
      
      <PasswordChangeModal 
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          alert('✅ Password aggiornata con successo!');
        }}
      />
    </div>
  );
}
