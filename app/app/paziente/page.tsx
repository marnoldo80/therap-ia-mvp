'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import ChatWidget from '@/components/ChatWidget';

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
  fiscal_code: string | null;
  birth_date: string | null;
  birth_place: string | null;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'diary' | 'progress'>('overview');
  
  const [editingPersonalData, setEditingPersonalData] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedAddress, setEditedAddress] = useState('');
  const [editedFiscalCode, setEditedFiscalCode] = useState('');
  const [editedBirthDate, setEditedBirthDate] = useState('');
  const [editedBirthPlace, setEditedBirthPlace] = useState('');
  const [appointmentMessages, setAppointmentMessages] = useState<{[key: string]: string}>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErr('Sessione non valida');
        setLoading(false);
        return;
      }

      const { data: p, error: pe } = await supabase
        .from('patients')
        .select('id, display_name, email, phone, address, fiscal_code, birth_date, birth_place, goals, issues')
        .eq('user_id', user.id)
        .single();

      if (pe || !p) {
        setErr('Profilo paziente non trovato');
        setLoading(false);
        return;
      }

      setPatient(p as Patient);
      setEditedName(p.display_name || '');
      setEditedPhone(p.phone || '');
      setEditedAddress(p.address || '');
      setEditedFiscalCode(p.fiscal_code || '');
      setEditedBirthDate(p.birth_date || '');
      setEditedBirthPlace(p.birth_place || '');

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

     const { data: exData, error: exError } = await supabase
  .from('exercises_completion')
  .select('*')
  .eq('patient_id', p.id)
  .order('exercise_index', { ascending: true });

console.log('PATIENT ID:', p.id);
console.log('EXERCISES DATA:', exData);
console.log('EXERCISES ERROR:', exError);
console.log('EXERCISES LENGTH:', exData?.length);

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
        fiscal_code: editedFiscalCode,
        birth_date: editedBirthDate || null,
        birth_place: editedBirthPlace
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
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-gray-600">Caricamento della tua area...</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="rounded bg-red-50 border border-red-200 p-4 text-red-700">
          <p className="font-semibold mb-2">Errore</p>
          <p className="text-sm">{err}</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-6xl mx-auto p-6">
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
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Benvenuto, {patient.display_name || 'Paziente'}! 👋</h1>
        <div className="flex gap-6 text-sm opacity-90">
          {lastNote && (
            <div>📝 Ultima nota: {new Date(lastNote.note_date).toLocaleDateString('it-IT')}</div>
          )}
          {nextAppointment && (
            <div>📅 Prossima seduta: {new Date(nextAppointment.starts_at).toLocaleDateString('it-IT')} alle {new Date(nextAppointment.starts_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b">
        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-gray-600'}`}>
          📊 Panoramica
        </button>
        <button onClick={() => setActiveTab('diary')} className={`px-4 py-2 font-medium ${activeTab === 'diary' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-gray-600'}`}>
          📔 Diario
        </button>
        <button onClick={() => setActiveTab('progress')} className={`px-4 py-2 font-medium ${activeTab === 'progress' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-gray-600'}`}>
          📈 Progressi
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span>👤</span> Dati personali
              </h2>
              {!editingPersonalData && (
                <button onClick={() => setEditingPersonalData(true)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  ✏️ Modifica
                </button>
              )}
            </div>
            
            {editingPersonalData ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nome completo</label>
                  <input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email</label>
                  <input type="email" value={patient.email || ''} disabled className="w-full border rounded px-3 py-2 text-sm bg-gray-100" />
                  <p className="text-xs text-gray-500 mt-1">L'email non può essere modificata</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Telefono</label>
                  <input type="tel" value={editedPhone} onChange={e => setEditedPhone(e.target.value)} className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Indirizzo</label>
                  <input type="text" value={editedAddress} onChange={e => setEditedAddress(e.target.value)} className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Codice Fiscale</label>
                  <input type="text" value={editedFiscalCode} onChange={e => setEditedFiscalCode(e.target.value)} className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Data di nascita</label>
                  <input type="date" value={editedBirthDate} onChange={e => setEditedBirthDate(e.target.value)} className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Luogo di nascita</label>
                  <input type="text" value={editedBirthPlace} onChange={e => setEditedBirthPlace(e.target.value)} className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="Roma" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={savePersonalData} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 text-sm font-medium">💾 Salva</button>
                  <button onClick={() => {
                    setEditingPersonalData(false);
                    setEditedName(patient.display_name || '');
                    setEditedPhone(patient.phone || '');
                    setEditedAddress(patient.address || '');
                    setEditedFiscalCode(patient.fiscal_code || '');
                    setEditedBirthDate(patient.birth_date || '');
                    setEditedBirthPlace(patient.birth_place || '');
                  }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm font-medium">Annulla</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nome:</span>
                  <span className="font-medium">{patient.display_name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium">{patient.email || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Telefono:</span>
                  <span className="font-medium">{patient.phone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Indirizzo:</span>
                  <span className="font-medium">{patient.address || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Codice Fiscale:</span>
                  <span className="font-medium">{patient.fiscal_code || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Data di nascita:</span>
                  <span className="font-medium">{patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('it-IT') : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Luogo di nascita:</span>
                  <span className="font-medium">{patient.birth_place || '—'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>📅</span> Prossimi appuntamenti
            </h2>
            {appointments.length === 0 ? (
              <p className="text-gray-500 text-sm">Nessun appuntamento programmato</p>
            ) : (
              <div className="space-y-4">
                {appointments.map(apt => (
                  <div key={apt.id} className="border-l-4 border-emerald-500 pl-4 py-2">
                    <div className="font-medium">{apt.title}</div>
                    <div className="text-sm text-gray-600 mb-2">{new Date(apt.starts_at).toLocaleString('it-IT')}</div>
                    <div className="mt-2">
                      <textarea
                        placeholder="Scrivi un messaggio al terapeuta (es: disdetta, cambio orario...)"
                        value={appointmentMessages[apt.id] || ''}
                        onChange={e => setAppointmentMessages({ ...appointmentMessages, [apt.id]: e.target.value })}
                        className="w-full text-sm border rounded p-2 min-h-[60px] focus:ring-2 focus:ring-emerald-500"
                      />
                      <button onClick={() => sendAppointmentMessage(apt.id)} className="mt-1 text-xs bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700">
                        📨 Invia al terapeuta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>🎯</span> I tuoi obiettivi (condivisi con il terapeuta)
            </h2>
            {generalObjectives.length === 0 && specificObjectives.length === 0 ? (
              <p className="text-gray-500 text-sm">Nessun obiettivo definito ancora. Il terapeuta li aggiungerà nel piano terapeutico.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {generalObjectives.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Obiettivi Generali:</h3>
                    <ul className="space-y-2">
                      {generalObjectives.map(obj => (
                        <li key={obj.id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
                          <input type="checkbox" checked={obj.completed} onChange={() => toggleObjective(obj.id, obj.completed)} className="mt-1 w-5 h-5 text-emerald-600 rounded" />
                          <span className={`text-sm ${obj.completed ? 'line-through text-gray-400' : ''}`}>{obj.objective_text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {specificObjectives.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Obiettivi Specifici:</h3>
                    <ul className="space-y-2">
                      {specificObjectives.map(obj => (
                        <li key={obj.id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
                          <input type="checkbox" checked={obj.completed} onChange={() => toggleObjective(obj.id, obj.completed)} className="mt-1 w-5 h-5 text-emerald-600 rounded" />
                          <span className={`text-sm ${obj.completed ? 'line-through text-gray-400' : ''}`}>{obj.objective_text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>💭</span> I tuoi pensieri per la prossima seduta
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Scrivi qui domande, obiettivi o situazioni che vuoi discutere nella prossima seduta. Il terapeuta potrà leggerli in anticipo.
            </p>
            <textarea
              className="w-full border rounded-lg p-3 min-h-[120px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Es: Vorrei parlare di come gestire l'ansia prima delle presentazioni di lavoro..."
              value={nextSessionThoughts}
              onChange={e => setNextSessionThoughts(e.target.value)}
            />
            <button onClick={saveNextSessionThoughts} className="mt-3 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium">
              💾 Salva pensieri
            </button>
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>💪</span> Esercizi assegnati dal terapeuta
            </h2>
            {exercisesCompletion.length === 0 ? (
              <p className="text-gray-500 text-sm">Nessun esercizio assegnato ancora.</p>
            ) : (
              <div className="space-y-3">
                {exercisesCompletion.map(ex => (
                  <label key={ex.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={ex.completed} onChange={() => toggleExercise(ex.id, ex.completed)} className="mt-1 w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" />
                    <span className={`flex-1 ${ex.completed ? 'line-through text-gray-400' : ''}`}>{ex.exercise_text}</span>
                    {ex.completed && ex.completed_at && (
                      <span className="text-xs text-gray-500">✓ {new Date(ex.completed_at).toLocaleDateString('it-IT')}</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === 'diary' && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>✍️</span> Scrivi una nuova nota
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Usa il diario per annotare pensieri, emozioni, situazioni quotidiane. Il terapeuta potrà leggerle.
            </p>
            <textarea
              className="w-full border rounded-lg p-3 min-h-[150px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Oggi mi sono sentito/a..."
              value={diaryEntry}
              onChange={e => setDiaryEntry(e.target.value)}
            />
            <button onClick={saveDiaryEntry} disabled={!diaryEntry.trim()} className="mt-3 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50">
              💾 Salva nota
            </button>
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>📚</span> Le tue note
            </h2>
            {patientNotes.length === 0 ? (
              <p className="text-gray-500 text-sm">Nessuna nota nel diario ancora.</p>
            ) : (
              <div className="space-y-4">
                {patientNotes.map(note => (
                  <div key={note.id} className="border-l-4 border-emerald-500 pl-4 py-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-600">
                        {new Date(note.note_date).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      {editingNoteId !== note.id && (
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingNoteId(note.id); setEditingNoteContent(note.content); }} className="text-xs text-blue-600 hover:text-blue-700">
                            ✏️ Modifica
                          </button>
                          <button onClick={() => deleteDiaryNote(note.id)} className="text-xs text-red-600 hover:text-red-700">
                            🗑️ Cancella
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {editingNoteId === note.id ? (
                      <div>
                        <textarea value={editingNoteContent} onChange={e => setEditingNoteContent(e.target.value)} className="w-full border rounded p-2 min-h-[100px] text-sm focus:ring-2 focus:ring-emerald-500" />
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => updateDiaryNote(note.id)} className="text-xs bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700">💾 Salva</button>
                          <button onClick={() => { setEditingNoteId(null); setEditingNoteContent(''); }} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300">Annulla</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>📈</span> I tuoi progressi
          </h2>
          <p className="text-gray-500 text-sm">
            Questa sezione mostrerà una timeline dei tuoi progressi, obiettivi completati e statistiche. 
            <br />
            <em>(In sviluppo - verrà implementata nelle prossime versioni)</em>
          </p>
        </div>
      )}
      {patient && (
        <ChatWidget 
          patientId={patient.id} 
          patientName={patient.display_name || 'Paziente'}
        />
      )}
    </div>
  );
}
