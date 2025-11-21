import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI API key not configured' }, { status: 500 });
    }

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
            content: `Sei un designer esperto di gradienti. Analizza la descrizione dell'utente e genera un gradiente appropriato.
Rispondi SOLO con un JSON in questo formato:
{
  "colors": ["#colore1", "#colore2", "#colore3"],
  "direction": "to bottom" | "to right" | "to bottom right" | "radial"
}

ESEMPI:
- "rilassante pastelli" -> colori soft blu/verde/rosa
- "professionale LinkedIn" -> blu/navy/grigio 
- "energico motivazionale" -> arancione/rosso/giallo
- "natura benessere" -> verde/azzurro/bianco
- "elegante minimalista" -> grigio/bianco/nero
- "caldo accogliente" -> arancione/rosa/crema

Usa massimo 3 colori. Scegli direzione appropriata al contesto.`
          },
          {
            role: 'user',
            content: `Genera un gradiente per: ${prompt}`
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';

    try {
      // Parse JSON dalla risposta IA
      const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const gradientData = JSON.parse(cleanResponse);

      // Validazione
      if (!gradientData.colors || !Array.isArray(gradientData.colors) || gradientData.colors.length === 0) {
        throw new Error('Formato colori non valido');
      }

      if (!gradientData.direction) {
        gradientData.direction = 'to bottom';
      }

      // Validazione colori hex
      const validColors = gradientData.colors.filter((color: string) => 
        /^#[0-9A-F]{6}$/i.test(color)
      );

      if (validColors.length === 0) {
        throw new Error('Nessun colore valido generato');
      }

      return NextResponse.json({
        colors: validColors.slice(0, 3), // Max 3 colori
        direction: gradientData.direction,
        prompt: prompt
      });

    } catch (parseError) {
      console.error('Errore parsing AI response:', aiResponse);
      
      // Fallback: genera gradiente di default
      return NextResponse.json({
        colors: ['#3b82f6', '#8b5cf6'],
        direction: 'to bottom',
        prompt: prompt,
        fallback: true
      });
    }

  } catch (error: any) {
    console.error('Errore generazione gradiente:', error);
    return NextResponse.json({ 
      error: 'Errore nella generazione del gradiente',
      details: error.message 
    }, { status: 500 });
  }
}
