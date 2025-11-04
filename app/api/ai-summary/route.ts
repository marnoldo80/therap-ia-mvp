import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Nessuna trascrizione fornita' }, { status: 400 });
    }

    // Chiama Groq API con Llama
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.2-90b-text-preview',
        messages: [
          {
            role: 'system',
            content: `Sei un assistente clinico per psicologi. Analizza la trascrizione della seduta e genera un riassunto strutturato in italiano con queste sezioni:

## TEMI PRINCIPALI
- Lista dei temi emersi

## EMOZIONI PREVALENTI
- Emozioni espresse dal paziente

## PROGRESSI
- Miglioramenti o cambiamenti notati

## TECNICHE UTILIZZATE
- Interventi terapeutici applicati

## HOMEWORK/COMPITI
- Esercizi o obiettivi assegnati

## NOTE CLINICHE
- Osservazioni importanti per il follow-up

Sii conciso ma completo. Usa linguaggio clinico professionale.`
          },
          {
            role: 'user',
            content: `Trascrizione seduta:\n\n${transcript}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore Groq completo:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return NextResponse.json({ 
        error: 'Errore generazione riassunto', 
        details: errorText,
        status: response.status 
      }, { status: 500 });
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({ summary });

  } catch (error: any) {
    console.error('Errore riassunto IA:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
