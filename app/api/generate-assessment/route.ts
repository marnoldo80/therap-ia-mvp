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

IMPORTANTE: Devi rispondere ESCLUSIVAMENTE con un oggetto JSON valido, senza testo aggiuntivo prima o dopo.

Formato JSON richiesto:
{
  "anamnesi": "testo qui",
  "valutazione_psicodiagnostica": "testo qui",
  "formulazione_caso": "testo qui"
}

CONTENUTO:
- anamnesi: Sintesi anamnestica del paziente (storia personale, familiare, eventi significativi emersi - 200-300 parole)
- valutazione_psicodiagnostica: Valutazione diagnostica con ipotesi diagnostiche DSM-5/ICD-11, sintomatologia, funzionamento globale (200-300 parole)
- formulazione_caso: Formulazione del caso con fattori predisponenti/precipitanti/perpetuanti, pattern relazionali, meccanismi di mantenimento (200-300 parole)

REGOLE:
- Usa linguaggio clinico professionale
- Basati SOLO sui dati delle sedute
- NON inventare informazioni
- Rispondi SOLO con JSON, nient'altro`
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
    let aiResponse = data.choices?.[0]?.message?.content || '';

    // Pulisci markdown se presente
    aiResponse = aiResponse.trim();
    if (aiResponse.startsWith('```json')) {
      aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    if (aiResponse.startsWith('```')) {
      aiResponse = aiResponse.replace(/```\n?/g, '');
    }

    // Parse JSON
    try {
      const assessment = JSON.parse(aiResponse.trim());
      return NextResponse.json({ assessment });
    } catch (parseError) {
      console.error('Errore parsing JSON:', aiResponse);
      // Ritorna la risposta grezza per debug
      return NextResponse.json({ 
        error: 'Formato risposta IA non valido',
        rawResponse: aiResponse.substring(0, 500)
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Errore generazione valutazione:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
