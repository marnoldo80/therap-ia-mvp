'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

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

  function getObjectiveCompletion(type: string, index: number) {
    return objectivesCompletion.find(o => o.objective_type === type && o.objective_index === index);
  }

  function getExerciseCompletion(index: number) {
    return exercisesCompletion.find(e => e.exercise_index === index);
  }

  if (loading) return <div className="max-w-6xl mx-auto p-6">Caricamento...</div>;
  if (!patient) return <div className="max-w-6xl mx-auto p-6">Paziente non trovato</div>;

  const unreadMessages = appointmentMessages.filter(m => !m.read_by_therapist).length;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="mb-4">
        <Link href="/app/therapist/pazienti" className="text-blue-600 hover:underline">← Lista pazienti</Link>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4">{patient.display_name || 'Senza nome'}</h1>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>📧 {patient.email || 'Nessuna email'}</div>
          <div>📱 {patient.phone || 'Nessun telefono'}</div>
          <div>📍 {patient.address || 'Nessun indirizzo'}</div>
          <div>🆔 {patient.fiscal_code || 'Nessun codice fiscale'}</div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={invitePatient} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900">🔐 Invita paziente</button>
          <Link href="/app/therapist/appuntamenti/nuovo" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">📅 Nuovo appuntamento</Link>
        </div>
      </div>

      <div className="flex gap-2 border-b overflow-x-auto">
        <button onClick={() => setActiveTab('piano')} className={`px-4 py-2 whitespace-nowrap ${activeTab === 'piano' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600'}`}>Piano Terapeutico</button>
        <button onClick={() => setActiveTab('area-paziente')} className={`px-4 py-2 whitespace-nowrap ${activeTab === 'area-paziente' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600'}`}>
          👤 Area Paziente
          {(patientThoughts || unreadMessages > 0) && (
            <span className="ml-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadMessages}</span>
          )}
        </button>
        <button onClick={() => setActiveTab('sedute')} className={`px-4 py-2 whitespace-nowrap ${activeTab === 'sedute' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600'}`}>Sedute & IA</button>
        <button onClick={() => setActiveTab('questionari')} className={`px-4 py-2 whitespace-nowrap ${activeTab === 'questionari' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600'}`}>Questionari</button>
      </div>

      {activeTab === 'area-paziente' && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span>💭</span> Pensieri del paziente per la prossima seduta
              </h3>
              {patientThoughts && (
                <button onClick={clearPatientThoughts} className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                  ✅ Seduta completata (svuota)
                </button>
              )}
            </div>
            {!patientThoughts ? (
              <p className="text-gray-500 text-sm">Il paziente non ha ancora scritto pensieri per la prossima seduta.</p>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="whitespace-pre-wrap text-gray-800">{patientThoughts}</p>
              </div>
            )}
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span>📨</span> Messaggi del paziente sugli appuntamenti
              {unreadMessages > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{unreadMessages} nuovi</span>
              )}
            </h3>
            {appointmentMessages.length === 0 ? (
              <p className="text-gray-500 text-sm">Nessun messaggio ricevuto.</p>
            ) : (
              <div className="space-y-3">
                {appointmentMessages.map(msg => (
                  <div key={msg.id} className={`border-l-4 pl-4 py-3 rounded ${msg.read_by_therapist ? 'border-gray-300 bg-gray-50' : 'border-orange-500 bg-orange-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-gray-600">{new Date(msg.created_at).toLocaleString('it-IT')}</div>
                      {!msg.read_by_therapist && (
                        <button onClick={() => markMessageAsRead(msg.id)} className="text-xs text-blue-600 hover:text-blue-700">
                          ✓ Segna come letto
                        </button>
                      )}
                    </div>
                    <p className="text-gray-800">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span>📔</span> Diario del paziente
            </h3>
            {patientNotes.length === 0 ? (
              <p className="text-gray-500 text-sm">Il paziente non ha ancora scritto note nel diario.</p>
            ) : (
              <div className="space-y-4">
                {patientNotes.map(note => (
                  <div key={note.id} className="border-l-4 border-emerald-500 pl-4 py-3 bg-gray-50 rounded">
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      {new Date(note.note_date).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'piano' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            {editMode ? (
              <>
                <button onClick={savePlan} className="bg-green-600 text-white px-4 py-2 rounded mr-2 hover:bg-green-700">💾 Salva</button>
                <button onClick={() => setEditMode(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Annulla</button>
              </>
            ) : (
              <button onClick={() => setEditMode(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">✏️ Modifica</button>
            )}
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-bold text-lg mb-3">🎯 VALUTAZIONE (Anamnesi e psicodiagnosi)</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2">Anamnesi:</label>
                {editMode ? (
                  <textarea className="w-full border rounded p-3 min-h-[100px]" value={anamnesi} onChange={e => setAnamnesi(e.target.value)} />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">{anamnesi || 'Nessuna informazione'}</p>
                )}
              </div>
              <div>
                <label className="block font-medium mb-2">Valutazione psicodiagnostica:</label>
                {editMode ? (
                  <textarea className="w-full border rounded p-3 min-h-[100px]" value={valutazionePsico} onChange={e => setValutazionePsico(e.target.value)} />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">{valutazionePsico || 'Nessuna informazione'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-bold text-lg mb-3">📝 FORMULAZIONE DEL CASO</h3>
            {editMode ? (
              <textarea className="w-full border rounded p-3 min-h-[120px]" value={formulazioneCaso} onChange={e => setFormulazioneCaso(e.target.value)} />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">{formulazioneCaso || 'Nessuna informazione'}</p>
            )}
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-bold text-lg mb-3">🎯 CONTRATTO TERAPEUTICO E OBIETTIVI</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2">Obiettivi generali:</label>
                {editMode ? (
                  <textarea className="w-full border rounded p-3 min-h-[100px]" value={obiettiviGenerali.join('\n')} onChange={e => setObiettiviGenerali(e.target.value.split('\n').filter(o => o.trim()))} placeholder="Inserisci un obiettivo per riga" />
                ) : (
                  obiettiviGenerali.length === 0 ? (
                    <p className="text-gray-500">Nessun obiettivo generale</p>
                  ) : (
                    <ul className="space-y-2">
                      {obiettiviGenerali.map((o, i) => {
                        const completion = getObjectiveCompletion('generale', i);
                        return (
                          <li key={i} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
                            <input type="checkbox" checked={completion?.completed || false} onChange={() => completion && toggleObjectiveCompletion(completion.id, completion.completed)} className="mt-1 w-5 h-5 text-blue-600 rounded" />
                            <span className={completion?.completed ? 'line-through text-gray-400' : ''}>{o}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )
                )}
              </div>
              <div>
                <label className="block font-medium mb-2">Obiettivi specifici:</label>
                {editMode ? (
                  <textarea className="w-full border rounded p-3 min-h-[100px]" value={obiettiviSpecifici.join('\n')} onChange={e => setObiettiviSpecifici(e.target.value.split('\n').filter(o => o.trim()))} placeholder="Inserisci un obiettivo per riga" />
                ) : (
                  obiettiviSpecifici.length === 0 ? (
                    <p className="text-gray-500">Nessun obiettivo specifico</p>
                  ) : (
                    <ul className="space-y-2">
                      {obiettiviSpecifici.map((o, i) => {
                        const completion = getObjectiveCompletion('specifico', i);
                        return (
                          <li key={i} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
                            <input type="checkbox" checked={completion?.completed || false} onChange={() => completion && toggleObjectiveCompletion(completion.id, completion.completed)} className="mt-1 w-5 h-5 text-blue-600 rounded" />
                            <span className={completion?.completed ? 'line-through text-gray-400' : ''}>{o}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-bold text-lg mb-3">💪 ESERCIZI</h3>
            {editMode ? (
              <textarea className="w-full border rounded p-3 min-h-[120px]" value={esercizi.join('\n')} onChange={e => setEsercizi(e.target.value.split('\n').filter(e => e.trim()))} placeholder="Inserisci un esercizio per riga" />
            ) : (
              esercizi.length === 0 ? (
                <p className="text-gray-500">Nessun esercizio</p>
              ) : (
                <ul className="space-y-2">
                  {esercizi.map((ex, i) => {
                    const completion = getExerciseCompletion(i);
                    return (
                      <li key={i} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
                        <input type="checkbox" checked={completion?.completed || false} onChange={() => completion && toggleExerciseCompletion(completion.id, completion.completed)} className="mt-1 w-5 h-5 text-emerald-600 rounded" />
                        <span className={completion?.completed ? 'line-through text-gray-400' : ''}>{ex}</span>
                        {completion?.completed && completion.completed_at && (
                          <span className="text-xs text-gray-500 ml-auto">✓ {new Date(completion.completed_at).toLocaleDateString('it-IT')}</span>
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
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">📝 Sedute e Riassunti IA</h3>
              <Link href={`/app/therapist/sedute/nuovo?patientId=${id}`} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">+ Nuova Nota</Link>
            </div>
            {sessionNotes.length === 0 ? (
              <p className="text-gray-500">Nessuna seduta registrata</p>
            ) : (
              <div className="space-y-3">
                {sessionNotes.map(note => (
                  <Link key={note.id} href={`/app/therapist/sedute/${note.id}`} className="block border rounded p-4 hover:bg-gray-50 transition">
                    <div className="font-medium">📅 {new Date(note.session_date).toLocaleDateString('it-IT')}</div>
                    {note.ai_summary && <div className="text-sm text-gray-600 mt-1">🤖 Riassunto IA disponibile</div>}
                    {note.notes && (
                      <div className="text-sm text-gray-600 mt-2 line-clamp-2">{note.notes.substring(0, 100)}...</div>
                    )}
                  </Link>
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
                  <div key={apt.id} className="border rounded p-3">{new Date(apt.starts_at).toLocaleString('it-IT')} - {apt.title}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${result.severity === 'minima' ? 'bg-green-100 text-green-700' : result.severity === 'lieve' ? 'bg-blue-100 text-blue-700' : result.severity === 'moderata' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {result.severity}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{new Date(result.created_at).toLocaleDateString('it-IT')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
