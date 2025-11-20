import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function POST(request: NextRequest) {
  try {
    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID mancante' }, { status: 400 });
    }

    // Recupera informazioni paziente
    const { data: patient } = await supabase
      .from('patients')
      .select('display_name')
      .eq('id', patientId)
      .single();

    if (!patient) {
      return NextResponse.json({ error: 'Paziente non trovato' }, { status: 404 });
    }

    // Recupera tutte le sedute del paziente per analisi completa
    const { data: sessionNotes } = await supabase
      .from('session_notes')
      .select('notes, ai_summary, session_date')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: true });

    if (!sessionNotes || sessionNotes.length === 0) {
      return NextResponse.json({ error: 'Nessuna seduta trovata per questo paziente' }, { status: 400 });
    }

    // Recupera piano terapeutico esistente per contesto
    const { data: plan } = await supabase
      .from('therapy_plan')
      .select('anamnesi, valutazione_psicodiagnostica, formulazione_caso')
      .eq('patient_id', patientId)
      .maybeSingle();

    // Costruisci contesto dalle sedute per generazione obiettivi
    let context = `PAZIENTE: ${patient.display_name}\n\n`;
    
    if (plan?.anamnesi) {
      context += `ANAMNESI:\n${plan.anamnesi}\n\n`;
    }

    if (plan?.valutazione_psicodiagnostica) {
      context += `VALUTAZIONE PSICODIAGNOSTICA:\n${plan.valutazione_psicodiagnostica}\n\n`;
    }

    if (plan?.formulazione_caso) {
      context += `FORMULAZIONE DEL CASO:\n${plan.formulazione_caso}\n\n`;
    }

    context += `SEDUTE TERAPEUTICHE ANALIZZATE (${sessionNotes.length} sedute):\n`;
    sessionNotes.forEach((note, i) => {
      const sessionDate = new Date(note.session_date).toLocaleDateString('it-IT');
      context += `\nSeduta ${i + 1} (${sessionDate}):\n`;
      if (note.ai_summary) {
        context += note.ai_summary + '\n';
      } else if (note.notes) {
        context += note.notes + '\n';
      }
    });

    // Chiama Groq per generare obiettivi ed esercizi specifici
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Sei uno psicoterapeuta clinico esperto. Analizza le sedute terapeutiche fornite e genera obiettivi ed esercizi specifici basati sui contenuti emersi e sui progressi del paziente.

Genera suggerimenti in formato JSON con questa struttura esatta:
{
  "obiettivi_generali": ["obiettivo generale 1", "obiettivo generale 2", "obiettivo generale 3"],
  "obiettivi_specifici": ["obiettivo specifico 1", "obiettivo specifico 2", "obiettivo specifico 3", "obiettivo specifico 4"],
  "esercizi": ["esercizio pratico 1", "esercizio pratico 2", "esercizio pratico 3", "esercizio pratico 4"]
}

ISTRUZIONI SPECIFICHE:
- ANALIZZA le sedute per identificare pattern, problematiche ricorrenti, progressi e aree di miglioramento
- Obiettivi generali: ampi, strategici, orientati al cambiamento complessivo
- Obiettivi specifici: concreti, misurabili, collegati alle sessioni analizzate
- Esercizi: pratici, graduali, evidence-based (CBT, ACT, mindfulness, tecniche comportamentali)
- Considera la progressione terapeutica emersa dalle sedute
- Usa terminologia clinica appropriata
- Gli obiettivi devono essere SMART (Specifici, Misurabili, Raggiungibili, Rilevanti, Temporizzati)
- Gli esercizi devono essere collegati direttamente alle problematiche emerse

Rispondi SOLO con il JSON, senza altro testo.`
          },
          {
            role: 'user',
            content: context
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore Groq:', errorText);
      return NextResponse.json({ error: 'Errore generazione obiettivi' }, { status: 500 });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';

    // Parse JSON dalla risposta IA
    try {
      // Pulisce la risposta da eventuali markdown e spazi
      let cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Rimuove eventuali caratteri di controllo
      cleanResponse = cleanResponse.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      
      console.log('Risposta IA pulita:', cleanResponse); // Per debugging
      
      const objectives = JSON.parse(cleanResponse);
      
      // Validazione struttura
      if (!objectives.obiettivi_generali || !objectives.obiettivi_specifici || !objectives.esercizi) {
        throw new Error('Struttura JSON non valida - campi mancanti');
      }

      return NextResponse.json({
        obiettivi_generali: objectives.obiettivi_generali || [],
        obiettivi_specifici: objectives.obiettivi_specifici || [],
        esercizi: objectives.esercizi || [],
        sessions_analyzed: sessionNotes.length,
        patient_name: patient.display_name
      });
    } catch (parseError) {
      console.error('Errore parsing JSON IA:', parseError);
      console.error('Risposta originale IA:', aiResponse);
      
      // Fallback: restituisci struttura vuota invece di errore
      return NextResponse.json({
        obiettivi_generali: ['Obiettivo generale da definire manualmente'],
        obiettivi_specifici: ['Obiettivo specifico da definire manualmente'],
        esercizi: ['Esercizio da definire manualmente'],
        sessions_analyzed: sessionNotes.length,
        patient_name: patient.display_name,
        error_info: 'Risposta IA non parsabile, forniti placeholder'
      });
    }

  } catch (error: any) {
    console.error('Errore generazione obiettivi:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
