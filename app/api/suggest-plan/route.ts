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

    // Recupera tutti i dati del paziente per contesto IA
    const { data: patient } = await supabase
      .from('patients')
      .select('display_name, issues, goals')
      .eq('id', patientId)
      .single();

    const { data: plan } = await supabase
      .from('therapy_plan')
      .select('anamnesi, valutazione_psicodiagnostica, formulazione_caso')
      .eq('patient_id', patientId)
      .maybeSingle();

    const { data: sessionNotes } = await supabase
      .from('session_notes')
      .select('notes, ai_summary, session_date')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: false })
      .limit(5);

    // ✅ CONTROLLO AGGIUNTO: Verifica se c'è abbastanza contesto clinico
    const hasMinimalContext = 
      (patient?.issues && patient.issues.trim().length > 0) || 
      (patient?.goals && patient.goals.trim().length > 0) || 
      (plan?.anamnesi && plan.anamnesi.trim().length > 0) || 
      (plan?.valutazione_psicodiagnostica && plan.valutazione_psicodiagnostica.trim().length > 0) || 
      (plan?.formulazione_caso && plan.formulazione_caso.trim().length > 0) ||
      (sessionNotes && sessionNotes.length > 0 && sessionNotes.some(note => 
        (note.notes && note.notes.trim().length > 0) || 
        (note.ai_summary && note.ai_summary.trim().length > 0)
      ));

    if (!hasMinimalContext) {
      return NextResponse.json({ 
        error: 'Dati clinici insufficienti per generare suggerimenti appropriati. Compila almeno uno dei seguenti campi prima di richiedere suggerimenti IA:\n\n• Problematiche iniziali del paziente\n• Obiettivi terapeutici dichiarati\n• Anamnesi\n• Valutazione psicodiagnostica\n• Note di almeno una seduta' 
      }, { status: 400 });
    }

    // Costruisci contesto per IA
    let context = `PAZIENTE: ${patient?.display_name || 'Non specificato'}\n\n`;
    
    if (patient?.issues && patient.issues.trim().length > 0) {
      context += `PROBLEMATICHE INIZIALI:\n${patient.issues}\n\n`;
    }
    
    if (patient?.goals && patient.goals.trim().length > 0) {
      context += `OBIETTIVI DICHIARATI:\n${patient.goals}\n\n`;
    }

    if (plan?.anamnesi && plan.anamnesi.trim().length > 0) {
      context += `ANAMNESI:\n${plan.anamnesi}\n\n`;
    }

    if (plan?.valutazione_psicodiagnostica && plan.valutazione_psicodiagnostica.trim().length > 0) {
      context += `VALUTAZIONE PSICODIAGNOSTICA:\n${plan.valutazione_psicodiagnostica}\n\n`;
    }

    if (plan?.formulazione_caso && plan.formulazione_caso.trim().length > 0) {
      context += `FORMULAZIONE DEL CASO:\n${plan.formulazione_caso}\n\n`;
    }

    if (sessionNotes && sessionNotes.length > 0) {
      const validNotes = sessionNotes.filter(note => 
        (note.notes && note.notes.trim().length > 0) || 
        (note.ai_summary && note.ai_summary.trim().length > 0)
      );
      
      if (validNotes.length > 0) {
        context += `SEDUTE PRECEDENTI (ultime ${validNotes.length}):\n`;
        validNotes.forEach((note, i) => {
          context += `\nSeduta ${i + 1} (${new Date(note.session_date).toLocaleDateString('it-IT')}):\n`;
          if (note.ai_summary && note.ai_summary.trim().length > 0) {
            context += note.ai_summary + '\n';
          } else if (note.notes && note.notes.trim().length > 0) {
            context += note.notes.substring(0, 500) + '...\n';
          }
        });
      }
    }

    // Chiama Groq per suggerimenti
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
            content: `Sei uno psicoterapeuta esperto. Sulla base delle informazioni cliniche fornite, suggerisci un piano terapeutico strutturato ed evidence-based.

Genera suggerimenti in formato JSON con questa struttura esatta:
{
  "obiettivi_generali": ["obiettivo 1", "obiettivo 2", "obiettivo 3"],
  "obiettivi_specifici": ["obiettivo specifico 1", "obiettivo specifico 2", "obiettivo specifico 3"],
  "esercizi": ["esercizio 1", "esercizio 2", "esercizio 3"],
  "note": "Breve spiegazione del razionale clinico (max 200 parole)"
}

LINEE GUIDA:
- Obiettivi generali: ampi, orientati al cambiamento globale (es. "Ridurre sintomi ansiosi")
- Obiettivi specifici: misurabili, concreti (es. "Gestire attacchi di panico senza evitamento")
- Esercizi: pratici, graduali, evidence-based (CBT, ACT, mindfulness)
- Basati su tecniche validate dalla ricerca
- Considera la fase terapeutica e i progressi già fatti
- Sii conciso ma clinicamente accurato

Rispondi SOLO con il JSON, senza altro testo.`
          },
          {
            role: 'user',
            content: context
          }
        ],
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore Groq:', errorText);
      return NextResponse.json({ error: 'Errore generazione suggerimenti' }, { status: 500 });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';

    // Parse JSON dalla risposta IA
    try {
      const suggestions = JSON.parse(aiResponse);
      return NextResponse.json({ suggestions });
    } catch (parseError) {
      console.error('Errore parsing JSON IA:', aiResponse);
      return NextResponse.json({ error: 'Formato risposta IA non valido' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Errore suggerimenti piano:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
