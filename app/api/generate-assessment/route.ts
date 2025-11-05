import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID mancante' }, { status: 400 });
    }

    // Recupera dati paziente
    const { data: patient } = await supabase
      .from('patients')
      .select('display_name, issues, goals')
      .eq('id', patientId)
      .single();

    // Recupera TUTTE le sedute
    const { data: sessionNotes } = await supabase
      .from('session_notes')
      .select('notes, ai_summary, session_date, themes')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: true });

    if (!sessionNotes || sessionNotes.length === 0) {
      return NextResponse.json({ 
        error: 'Nessuna seduta disponibile. Registra almeno 1-2 sedute prima di generare la valutazione.' 
      }, { status: 400 });
    }

    // Costruisci contesto completo
    let context = `PAZIENTE: ${patient?.display_name || 'Non specificato'}\n\n`;
    
    if (patient?.issues) {
      context += `PROBLEMATICHE INIZIALI:\n${patient.issues}\n\n`;
    }
    
    if (patient?.goals) {
      context += `OBIETTIVI DICHIARATI:\n${patient.goals}\n\n`;
    }

    context += `SEDUTE REGISTRATE (${sessionNotes.length} totali):\n\n`;
    
    sessionNotes.forEach((note, i) => {
      context += `--- SEDUTA ${i + 1} (${new Date(note.session_date).toLocaleDateString('it-IT')}) ---\n`;
      
      if (note.ai_summary) {
        context += `Riassunto IA:\n${note.ai_summary}\n\n`;
      }
      
      if (note.notes) {
        context += `Note:\n${note.notes}\n\n`;
      }

      if (note.themes && Array.isArray(note.themes) && note.themes.length > 0) {
        context += `Temi: ${note.themes.join(', ')}\n\n`;
      }
    });

    // Chiama Groq per generare valutazione
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
            content: `Sei uno psicoterapeuta clinico esperto. Sulla base delle sedute registrate, genera una valutazione clinica strutturata.

Genera un JSON con questa struttura esatta:
{
  "anamnesi": "Sintesi anamnestica del paziente (storia personale, familiare, eventi significativi emersi)",
  "valutazione_psicodiagnostica": "Valutazione diagnostica evidence-based con eventuali ipotesi diagnostiche secondo DSM-5 o ICD-11, sintomatologia prevalente, funzionamento globale",
  "formulazione_caso": "Formulazione del caso clinico integrando i diversi elementi: fattori predisponenti, precipitanti, perpetuanti; pattern relazionali; meccanismi di mantenimento del problema"
}

LINEE GUIDA:
- Usa linguaggio clinico professionale
- Basa tutto sui dati concreti delle sedute
- Evidenzia pattern ricorrenti
- Sii specifico ma sintetico (200-400 parole per campo)
- NON inventare informazioni non presenti
- Se mancano dati per un campo, scrivi una sintesi di quanto emerso

Rispondi SOLO con il JSON, senza altro testo.`
          },
          {
            role: 'user',
            content: context
          }
        ],
        temperature: 0.4,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore Groq:', errorText);
      return NextResponse.json({ error: 'Errore generazione valutazione' }, { status: 500 });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';

    // Parse JSON
    try {
      const assessment = JSON.parse(aiResponse);
      return NextResponse.json({ assessment });
    } catch (parseError) {
      console.error('Errore parsing JSON:', aiResponse);
      return NextResponse.json({ error: 'Formato risposta IA non valido' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Errore generazione valutazione:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
