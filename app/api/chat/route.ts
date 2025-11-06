import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function POST(request: NextRequest) {
  try {
    const { patientId, message, conversationHistory } = await request.json();

    if (!patientId || !message) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    // Recupera contesto paziente
    const { data: patient } = await supabase
      .from('patients')
      .select('display_name, issues, goals')
      .eq('id', patientId)
      .single();

    const { data: plan } = await supabase
      .from('therapy_plan')
      .select('*')
      .eq('patient_id', patientId)
      .maybeSingle();

    const { data: objectives } = await supabase
      .from('objectives_completion')
      .select('*')
      .eq('patient_id', patientId);

    const { data: exercises } = await supabase
      .from('exercises_completion')
      .select('*')
      .eq('patient_id', patientId);

    const { data: nextAppt } = await supabase
      .from('appointments')
      .select('starts_at, title')
      .eq('patient_id', patientId)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    // Costruisci system prompt con contesto
    let systemPrompt = `Sei l'assistente terapeutico personale di ${patient?.display_name || 'il paziente'}. 

Il tuo ruolo è:
- Supportare il paziente tra le sedute
- Ricordare esercizi e obiettivi
- Fornire incoraggiamento e motivazione
- Rispondere a domande su tecniche assegnate
- NON fare diagnosi o sostituire il terapeuta
- Consigliare di parlare col terapeuta per questioni urgenti

CONTESTO PAZIENTE:
`;

    if (patient?.issues) {
      systemPrompt += `\nProblematiche: ${patient.issues}`;
    }

    if (patient?.goals) {
      systemPrompt += `\nObiettivi: ${patient.goals}`;
    }

    if (plan) {
      if (plan.obiettivi_generali?.length > 0) {
        systemPrompt += `\n\nObiettivi generali terapia:\n${plan.obiettivi_generali.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')}`;
      }

      if (plan.obiettivi_specifici?.length > 0) {
        systemPrompt += `\n\nObiettivi specifici:\n${plan.obiettivi_specifici.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')}`;
      }
    }

    if (exercises && exercises.length > 0) {
      const incomplete = exercises.filter(e => !e.completed);
      if (incomplete.length > 0) {
        systemPrompt += `\n\nEsercizi da completare:\n${incomplete.map((e, i) => `${i + 1}. ${e.exercise_text}`).join('\n')}`;
      }
    }

    if (objectives && objectives.length > 0) {
      const incomplete = objectives.filter(o => !o.completed);
      if (incomplete.length > 0) {
        systemPrompt += `\n\nObiettivi attivi:\n${incomplete.map((o, i) => `${i + 1}. ${o.objective_text} (${o.objective_type})`).join('\n')}`;
      }
    }

    if (nextAppt) {
      systemPrompt += `\n\nProssima seduta: ${new Date(nextAppt.starts_at).toLocaleString('it-IT')}`;
    }

    systemPrompt += `\n\nSii empatico, breve (max 150 parole), incoraggiante. Usa un tono caldo e professionale. Se il paziente è in crisi o esprime pensieri autolesivi, invitalo IMMEDIATAMENTE a contattare il terapeuta o servizi di emergenza.`;

    // Prepara messaggi per IA
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    // Chiama Groq
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore Groq:', errorText);
      return NextResponse.json({ error: 'Errore chatbot' }, { status: 500 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Mi dispiace, non ho capito. Puoi riformulare?';

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error('Errore chat:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
