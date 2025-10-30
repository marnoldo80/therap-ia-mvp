'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

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
  goals: string | null;
  issues: string | null;
};

type TherapyPlan = {
  obiettivi_generali: string[];
  obiettivi_specifici: string[];
  esercizi: string[];
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

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [therapyPlan, setTherapyPlan] = useState<TherapyPlan | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  const [nextSessionThoughts, setNextSessionThoughts] = useState('');
  const [diaryEntry, setDiaryEntry] = useState('');
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'diary' | 'progress'>('overview');

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

      // Carica dati paziente
      const { data: p, error: pe } = await supabase
        .from('patients')
        .select('id, display_name, email, phone, address, fiscal_code, goals, issues')
        .eq('user_id', user.id)
        .single();

      if (pe || !p) {
        setErr('Profilo paziente non trovato');
        setLoading(false);
        return;
      }

      setPatient(p as Patient);

      // Carica piano terapeutico
      const { data: plan } = await supabase
        .from('therapy_plan')
        .select('obiettivi_generali, obiettivi_specifici, esercizi')
        .eq('patient_id', p.id)
        .maybeSingle();

      if (plan) {
        setTherapyPlan(plan as TherapyPlan);
      }

      // Carica prossimi appuntamenti
      const { data: appts } = await supabase
        .from('appointments')
        .select('id, title, starts_at')
        .eq('patient_id', p.id)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(5);

      setAppointments(appts || []);

      // Carica note paziente (diario)
      const { data: notes } = await supabase
        .from('patient_notes')
        .select('id, note_date, content')
        .eq('patient_id', p.id)
        .order('note_date', { ascending: false })
        .limit(10);

      setPatientNotes(notes || []);

      // Carica pensieri per prossima seduta
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

      setLoading(false);
    } catch (e: any) {
      setErr(e?.message || 'Errore sconosciuto');
      setLoading(false);
    }
  }

  async function saveNextSessionThoughts() {
    if (!patient?.id) return;
    
    try {
      const { error } = await supabase
        .from('patient_session_thoughts')
        .upsert({
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
      const { error } = await supabase
        .from('patient_notes')
        .insert({
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

  function toggleExercise(index: number) {
    const newSet = new Set(completedExercises);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setCompletedExercises(newSet);
    // TODO: Salvare nel DB
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
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

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-gray-600'}`}
        >
          📊 Panoramica
        </button>
        <button 
          onClick={() => setActiveTab('diary')} 
          className={`px-4 py-2 font-medium ${activeTab === 'diary' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-gray-600'}`}
        >
          📔 Diario
        </button>
        <button 
          onClick={() => setActiveTab('progress')} 
          className={`px-4 py-2 font-medium ${activeTab === 'progress' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-gray-600'}`}
        >
          📈 Progressi
        </button>
      </div>

      {/* TAB: Panoramica */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Dati personali */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>👤</span> Dati personali
            </h2>
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
            </div>
          </div>

          {/* Prossimi appuntamenti */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>📅</span> Prossimi appuntamenti
            </h2>
            {appointments.length === 0 ? (
              <p className="text-gray-500 text-sm">Nessun appuntamento programmato</p>
            ) : (
              <div className="space-y-3">
                {appointments.map(apt => (
                  <div key={apt.id} className="border-l-4 border-emerald-500 pl-4 py-2">
                    <div className="font-medium">{apt.title}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(apt.starts_at).toLocaleString('it-IT')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Obiettivi condivisi */}
          <div className="bg-white border rounded-lg p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>🎯</span> I tuoi obiettivi (condivisi con il terapeuta)
            </h2>
            {!therapyPlan || (therapyPlan.obiettivi_generali.length === 0 && therapyPlan.obiettivi_specifici.length === 0) ? (
              <p className="text-gray-500 text-sm">Nessun obiettivo definito ancora. Il terapeuta li aggiungerà nel piano terapeutico.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {therapyPlan.obiettivi_generali.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Obiettivi Generali:</h3>
                    <ul className="space-y-2">
                      {therapyPlan.obiettivi_generali.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-500 mt-1">✓</span>
                          <span className="text-sm">{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {therapyPlan.obiettivi_specifici.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Obiettivi Specifici:</h3>
                    <ul className="space-y-2">
                      {therapyPlan.obiettivi_specifici.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-500 mt-1">✓</span>
                          <span className="text-sm">{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* I tuoi pensieri per la prossima seduta */}
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
            <button 
              onClick={saveNextSessionThoughts}
              className="mt-3 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium"
            >
              💾 Salva pensieri
            </button>
          </div>

          {/* Esercizi assegnati */}
          <div className="bg-white border rounded-lg p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>💪</span> Esercizi assegnati dal terapeuta
            </h2>
            {!therapyPlan || therapyPlan.esercizi.length === 0 ? (
              <p className="text-gray-500 text-sm">Nessun esercizio assegnato ancora.</p>
            ) : (
              <div className="space-y-3">
                {therapyPlan.esercizi.map((ex, i) => (
                  <label key={i} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={completedExercises.has(i)}
                      onChange={() => toggleExercise(i)}
                      className="mt-1 w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className={`flex-1 ${completedExercises.has(i) ? 'line-through text-gray-400' : ''}`}>
                      {ex}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB: Diario */}
      {activeTab === 'diary' && (
        <div className="space-y-6">
          
          {/* Nuova nota */}
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
            <button 
              onClick={saveDiaryEntry}
              disabled={!diaryEntry.trim()}
              className="mt-3 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50"
            >
              💾 Salva nota
            </button>
          </div>

          {/* Storico note */}
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

      {/* TAB: Progressi */}
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

    </div>
  );
}
