import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

type Alert = {
  id: string;
  type: 'exercise' | 'diary' | 'thoughts' | 'questionnaire' | 'appointment';
  severity: 'low' | 'medium' | 'high';
  patientId: string;
  patientName: string;
  message: string;
  daysAgo: number;
  createdAt: string;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const therapistId = searchParams.get('therapistId');

    if (!therapistId) {
      return NextResponse.json({ error: 'Therapist ID mancante' }, { status: 400 });
    }

    const alerts: Alert[] = [];
    const now = new Date();

    // Recupera tutti i pazienti del terapeuta
    const { data: patients } = await supabase
      .from('patients')
      .select('id, display_name')
      .eq('therapist_user_id', therapistId);

    if (!patients || patients.length === 0) {
      return NextResponse.json({ alerts: [] });
    }

    // Per ogni paziente, controlla gli alert
    for (const patient of patients) {
      
      // 1. ESERCIZI NON COMPLETATI
      const { data: exercises } = await supabase
        .from('exercises_completion')
        .select('completed, created_at')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      if (exercises && exercises.length > 0) {
        const hasIncompleteExercises = exercises.some(ex => !ex.completed);
        if (hasIncompleteExercises) {
          const oldestIncomplete = exercises
            .filter(ex => !ex.completed)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
          
          const daysAgo = Math.floor((now.getTime() - new Date(oldestIncomplete.created_at).getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysAgo >= 7) {
            alerts.push({
              id: `exercise-${patient.id}`,
              type: 'exercise',
              severity: daysAgo >= 14 ? 'high' : 'medium',
              patientId: patient.id,
              patientName: patient.display_name || 'Senza nome',
              message: `Esercizi non completati da ${daysAgo} giorni`,
              daysAgo,
              createdAt: oldestIncomplete.created_at
            });
          }
        }
      }

      // 2. DIARIO NON COMPILATO
      const { data: diaryNotes } = await supabase
        .from('patient_notes')
        .select('note_date')
        .eq('patient_id', patient.id)
        .order('note_date', { ascending: false })
        .limit(1);

      if (diaryNotes && diaryNotes.length > 0) {
        const lastDiaryDate = new Date(diaryNotes[0].note_date);
        const daysAgo = Math.floor((now.getTime() - lastDiaryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysAgo >= 5) {
          alerts.push({
            id: `diary-${patient.id}`,
            type: 'diary',
            severity: daysAgo >= 10 ? 'high' : 'medium',
            patientId: patient.id,
            patientName: patient.display_name || 'Senza nome',
            message: `Diario non compilato da ${daysAgo} giorni`,
            daysAgo,
            createdAt: diaryNotes[0].note_date
          });
        }
      }

      // 3. PENSIERI PER SEDUTA VECCHI
      const { data: thoughts } = await supabase
        .from('patient_session_thoughts')
        .select('created_at')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (thoughts && thoughts.length > 0) {
        const thoughtDate = new Date(thoughts[0].created_at);
        const daysAgo = Math.floor((now.getTime() - thoughtDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysAgo >= 7) {
          alerts.push({
            id: `thoughts-${patient.id}`,
            type: 'thoughts',
            severity: 'low',
            patientId: patient.id,
            patientName: patient.display_name || 'Senza nome',
            message: `Pensieri per seduta non svuotati da ${daysAgo} giorni`,
            daysAgo,
            createdAt: thoughts[0].created_at
          });
        }
      }

      // 4. PEGGIORAMENTO QUESTIONARI (GAD-7)
      const { data: gad7Results } = await supabase
        .from('gad7_results')
        .select('total, created_at')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false })
        .limit(2);

      if (gad7Results && gad7Results.length >= 2) {
        const latest = gad7Results[0];
        const previous = gad7Results[1];
        const increase = ((latest.total - previous.total) / previous.total) * 100;
        
        if (increase >= 40) {
          alerts.push({
            id: `questionnaire-${patient.id}`,
            type: 'questionnaire',
            severity: 'high',
            patientId: patient.id,
            patientName: patient.display_name || 'Senza nome',
            message: `Ansia aumentata del ${Math.round(increase)}% (GAD-7: ${previous.total} → ${latest.total})`,
            daysAgo: Math.floor((now.getTime() - new Date(latest.created_at).getTime()) / (1000 * 60 * 60 * 24)),
            createdAt: latest.created_at
          });
        }
      }

      // 5. MESSAGGI APPUNTAMENTI NON LETTI
      const { data: unreadMessages } = await supabase
        .from('appointment_messages')
        .select('id, created_at, message')
        .eq('patient_id', patient.id)
        .eq('read_by_therapist', false)
        .order('created_at', { ascending: false });

      if (unreadMessages && unreadMessages.length > 0) {
        const oldestUnread = unreadMessages[unreadMessages.length - 1];
        const daysAgo = Math.floor((now.getTime() - new Date(oldestUnread.created_at).getTime()) / (1000 * 60 * 60 * 24));
        
        alerts.push({
          id: `messages-${patient.id}`,
          type: 'appointment',
          severity: daysAgo >= 2 ? 'high' : 'medium',
          patientId: patient.id,
          patientName: patient.display_name || 'Senza nome',
          message: `${unreadMessages.length} messaggi non letti sugli appuntamenti`,
          daysAgo,
          createdAt: oldestUnread.created_at
        });
      }
    }

    // Ordina per severità e data
    alerts.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.daysAgo - a.daysAgo;
    });

    return NextResponse.json({ alerts });

  } catch (error: any) {
    console.error('Errore calcolo alert:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
