import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Inizializza OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Inizializza Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json({ error: 'ID paziente richiesto' }, { status: 400 });
    }

    // Recupera informazioni paziente
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('display_name')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Paziente non trovato' }, { status: 404 });
    }

    // Recupera tutte le sedute del paziente
    const { data: sessions, error: sessionsError } = await supabase
      .from('session_notes')
      .select('session_date, notes, ai_summary')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: true });

    if (sessionsError) {
      return NextResponse.json({ error: 'Errore nel recupero delle sedute' }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ error: 'Nessuna seduta trovata per questo paziente' }, { status: 400 });
    }

    // Prepara il contenuto delle sedute per l'analisi
    const sessionContent = sessions
      .map(session => {
        const date = new Date(session.session_date).toLocaleDateString('it-IT');
        const content = session.ai_summary || session.notes || '';
        return `SEDUTA ${date}:\n${content}`;
      })
      .join('\n\n---\n\n');

    // Prompt per generare obiettivi ed esercizi
    const prompt = `
Sei uno psicologo clinico esperto. Analizza le seguenti sedute terapeutiche del paziente ${patient.display_name} e genera obiettivi terapeutici ed esercizi specifici basati sui contenuti emersi.

SEDUTE ANALIZZATE:
${sessionContent}

ISTRUZIONI:
1. Analizza i pattern, le problematiche ricorrenti e i progressi del paziente
2. Identifica le aree di intervento prioritarie
3. Formula obiettivi SMART (Specifici, Misurabili, Raggiungibili, Rilevanti, Temporizzati)
4. Proponi esercizi pratici collegati agli obiettivi

FORMATO RICHIESTA (rispondi SOLO in formato JSON valido):
{
  "obiettivi_generali": [
    "Obiettivo generale 1 basato sulle sedute",
    "Obiettivo generale 2 basato sulle sedute"
  ],
  "obiettivi_specifici": [
    "Obiettivo specifico 1 con dettagli pratici",
    "Obiettivo specifico 2 con dettagli pratici",
    "Obiettivo specifico 3 con dettagli pratici"
  ],
  "esercizi": [
    "Esercizio pratico 1 collegato agli obiettivi",
    "Esercizio pratico 2 collegato agli obiettivi",
    "Esercizio pratico 3 collegato agli obiettivi"
  ]
}

REGOLE IMPORTANTI:
- Usa terminologia clinica appropriata
- Gli obiettivi devono essere realistici e raggiungibili
- Gli esercizi devono essere pratici e specifici
- Considera la gravità e la tipologia del disturbo emerso dalle sedute
- Massimo 3 obiettivi generali, 5 specifici, 5 esercizi
- Rispondi SOLO con JSON valido, nessun testo aggiuntivo
`;

    // Chiamata all'API OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Sei un assistente specializzato nella generazione di piani terapeutici basati su sedute cliniche. Rispondi sempre e solo in formato JSON valido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      return NextResponse.json({ error: 'Nessuna risposta dall\'IA' }, { status: 500 });
    }

    // Parse della risposta JSON
    let objectives;
    try {
      // Pulisce la risposta da eventuali markdown
      const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      objectives = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Errore parsing JSON:', parseError);
      console.error('Risposta AI:', aiResponse);
      return NextResponse.json({ error: 'Errore nel parsing della risposta IA' }, { status: 500 });
    }

    // Validazione della struttura
    if (!objectives.obiettivi_generali || !objectives.obiettivi_specifici || !objectives.esercizi) {
      return NextResponse.json({ error: 'Struttura risposta IA non valida' }, { status: 500 });
    }

    // Ritorna gli obiettivi ed esercizi generati
    return NextResponse.json({
      obiettivi_generali: objectives.obiettivi_generali || [],
      obiettivi_specifici: objectives.obiettivi_specifici || [],
      esercizi: objectives.esercizi || [],
      sessions_analyzed: sessions.length,
      patient_name: patient.display_name
    });

  } catch (error: any) {
    console.error('Errore API generate-objectives:', error);
    return NextResponse.json(
      { error: 'Errore interno del server: ' + error.message },
      { status: 500 }
    );
  }
}
