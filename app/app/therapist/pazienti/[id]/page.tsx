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
};

type ExerciseCompletion = {
  id: string;
  exercise_index: number;
  exercise_text: string;
  completed: boolean;
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

  // Form states
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

      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      setPatient(patientData);

      const { data: planData } = await supabase
        .from('therapy_plan')
        .select('*')
        .eq('patient_id', id)
        .maybeSingle();
      
      if (planData) {
        setTherapyPlan(planData);
        setAnamnesi(planData.anamnesi || '');
        setValutazionePsico(planData.valutazione_psicodiagnostica || '');
        setFormulazioneCaso(planData.formulazione_caso || '');
        setObiettiviGenerali(planData.obiettivi_generali || []);
        setObiettiviSpecifici(planData.obiettivi_specifici || []);
        setEsercizi(planData.esercizi || []);
      }

      const { data: notesData } = await supabase
        .from('session_notes')
        .select('*')
        .eq('patient_id', id)
        .order('session_date', { ascending: false })
        .limit(5);
      setSessionNotes(notesData || []);

      const { data: gad7Data } = await supabase
        .from('gad7_results')
        .select('id, total, severity, created_at')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });
      setGad7Results(gad7Data || []);

      const { data: apptsData } = await supabase
        .from('appointments')
        .select('id, title, starts_at')
        .eq('patient_id', id)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(3);
      setAppointments(apptsData || []);

      // Carica pensieri del paziente
      const { data: thoughtsData } = await supabase
        .from('patient_session_thoughts')
        .select('content')
        .eq('patient_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setPatientThoughts(thoughtsData?.content || '');

      // Carica note diario paziente
      const { data: diaryData } = await supabase
        .from('patient_notes')
        .select('*')
        .eq('patient_id', id)
        .order('note_date', { ascending: false })
        .limit(10);
      setPatientNotes(diaryData || []);

      // Carica messaggi appuntamenti
      const { data: messagesData } = await supabase
        .from('appointment_messages')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });
      setAppointmentMessages(messagesData || []);

      // Carica stato obiettivi
      const { data: objData } = await supabase
        .from('objectives_completion')
        .select('*')
        .eq('patient_id', id);
      setObjectivesCompletion(objData || []);

      // Carica stato esercizi
      const { data: exData } = await supabase
        .from('exercises_completion')
        .select('*')
        .eq('patient_id', id);
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

      // Sincronizza obiettivi nelle tabelle completion
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
    // Elimina vecchi obiettivi
    await supabase.from('objectives_completion').delete().eq('patient_id', id);

    // Crea nuovi record per obiettivi generali
    const generalObjs = obiettiviGenerali.map((text, index) => ({
      patient_id: id,
      objective_type: 'generale',
      objective_index: index,
      objective_text: text,
      completed: false
    }));

    // Crea nuovi record per obiettivi specifici
    const specificObjs = obiettiviSpecifici.map((text, index) => ({
      patient_id: id,
      objective_type: 'specifico',
      objective_index: index,
      objective_text: text,
      completed: false
    }));

    if (generalObjs.length > 0 || specificObjs.length > 0) {
      await supabase.from('objectives_completion').insert([...generalObjs, ...specificObjs]);
    }
  }

  async function syncExercisesCompletion() {
    // Elimina vecchi esercizi
    await supabase.from('exercises_completion').delete().eq('patient_id', id);

    // Crea nuovi record per esercizi
    const exs = esercizi.map((text, index) => ({
      patient_id: id,
      exercise_index: index,
      exercise_text: text,
      completed: false
    }));

    if (exs.length > 0) {
      await supabase.from('exercises_completion').insert(exs);
    }
  }

  async function toggleObjectiveCompletion(objId: string, currentCompleted: boolean) {
    try {
      const { error } = await supabase
        .from('objectives_completion')
        .update({ 
          completed: !currentCompleted,
          completed_at: !currentCompleted ? new Date().toISOString() : null
        })
        .eq('id', objId);

      if (error) throw error;
      loadData();
    } catch (e: any) {
      alert('Errore: ' + e.message);
    }
  }

  async function toggleExerciseCompletion(exId: string, currentCompleted: boolean) {
    try {
      const { error } = await supabase
        .from('exercises_completion')
        .update({ 
          completed: !currentCompleted,
          completed_at: !currentCompleted ? new Date().toISOString() : null
        })
        .eq('id', exId);

      if (error) throw error;
      loadData();
    } catch (e: any) {
      alert('Errore: ' + e.message);
    }
  }

  async function clearPatientThoughts() {
    if (!confirm('Vuoi svuotare i pensieri del paziente? (Seduta completata)')) return;
    
    try {
      const { error } = await supabase
        .from('patient_session_thoughts')
        .delete()
        .eq('patient_id', id);

      if (error) throw error;

      alert('✅ Pensieri svuotati!');
      loadData();
    } catch (e: any) {
      alert('Errore: ' + e.message);
    }
  }

  async function markMessageAsRead(messageId: string) {
    try {
      const { error } = await supabase
        .from('appointment_messages')
        .update({ read_by_therapist: true })
        .eq('id', messageId);

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

  function getObjectiveCompletion(type: string, index: number) {
    return objectivesCompletion.find(
      o => o.objective_type === type && o.objective_index === index
    );
  }

  function getExerciseCompletion(index: number) {
    return exercisesCompletion.find(e => e.exercise_index === index);
  }

  if (loading) return <div className="max-w-6xl mx-auto p-6">Caricamento...</div>;
  if (!patient) return <div className="max-w-6xl mx-auto p-6">Paziente non trovato</div>;

  const unreadMessages = appointmentMessages.filter(m => !m.read_by_therapist).length;
  const hasNotifications = patientThoughts || unreadMessages > 0;

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
          <button onClick={invitePatient} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900">
