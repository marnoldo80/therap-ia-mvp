import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt richiesto' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Groq API key non configurata' }, { status: 500 });
    }

    const systemPrompt = `Sei un copywriter esperto specializzato in Facebook per psicologi ITALIANI.

TASK: Genera 4 varianti diverse di post Facebook per community building.

REGOLE:
- Scrivi SEMPRE in italiano perfetto
- Contenuti da 150-300 caratteri (Facebook community)
- Stili: Community, Educativo, Supportivo, Professionale
- Linguaggio conversazionale e inclusivo
- Incoraggia interazione e commenti
- Evita autodiagnosi o consigli medici diretti

STILI:
1. COMMUNITY: Conversazionale, invita discussione
2. EDUCATIVO: Informativo ma accessibile  
3. SUPPORTIVO: Empatico, rassicurante
4. PROFESSIONALE: Autorevole ma umano

Rispondi SOLO con JSON in ITALIANO:
{
  "variants": [
    {
      "id": "1",
      "style": "community",
      "title": "Titolo coinvolgente",
      "content": "Contenuto Facebook 150-300 caratteri",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4"]
    },
    {
      "id": "2",
      "style": "educational", 
      "title": "Titolo educativo",
      "content": "Contenuto educativo 150-300 caratteri",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4"]
    },
    {
      "id": "3",
      "style": "supportive",
      "title": "Titolo supportivo", 
      "content": "Contenuto supportivo 150-300 caratteri",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4"]
    },
    {
      "id": "4",
      "style": "professional",
      "title": "Titolo professionale",
      "content": "Contenuto professionale 150-300 caratteri", 
      "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4"]
    }
  ]
}`;

    const userPrompt = `Crea 4 post Facebook ORIGINALI basati su questa idea: "${prompt}"

NON ripetere mai le parole dell'utente. Crea contenuti completamente nuovi per community Facebook di psicologia.

ESEMPI BUONI:
- Community: "Chi di voi ha mai sentito quella vocina interiore che critica ogni mossa? Parliamone nei commenti 👇"
- Educativo: "Lo sapevi? Il nostro cervello elabora le emozioni prima dei pensieri razionali. Ecco perché reagiamo istintivamente."
- Supportivo: "Ricorda: chiedere aiuto non è debolezza, è il primo atto di coraggio verso il benessere. 💙"
- Professionale: "Nell'approccio cognitivo-comportamentale, lavoriamo insieme per riconoscere e modificare schemi di pensiero disfunzionali."`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    let parsedContent;
    try {
      let cleanedResponse = responseText.trim()
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^[^{]*/, '')
        .replace(/[^}]*$/, '}');

      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
        
        if (parsedContent.variants && Array.isArray(parsedContent.variants)) {
          parsedContent.variants = parsedContent.variants.map((variant: any, index: number) => ({
            id: variant.id || (index + 1).toString(),
            style: variant.style || ['community', 'educational', 'supportive', 'professional'][index],
            title: variant.title?.substring(0, 80) || `Post Facebook ${index + 1}`,
            content: variant.content?.substring(0, 300) || 'Contenuto non disponibile',
            hashtags: Array.isArray(variant.hashtags) 
              ? variant.hashtags.slice(0, 4).map((tag: any) => tag.toString().replace(/[^a-zA-Z0-9àèéìíîòóùúç]/g, ''))
              : ['psicologia', 'benessere', 'community', 'supporto']
          }));
        } else {
          throw new Error('Invalid format');
        }
      } else {
        throw new Error('No JSON found');
      }

    } catch (parseError) {
      // Fallback per Facebook
      parsedContent = {
        variants: [
          {
            id: '1', style: 'community', title: 'Parliamone insieme',
            content: `Che ne pensate di questo argomento? Condividete la vostra esperienza nei commenti 💬`,
            hashtags: ['community', 'discussione', 'psicologia', 'condivisione']
          },
          {
            id: '2', style: 'educational', title: 'Sapevi che...',
            content: `Ogni giorno il nostro cervello elabora migliaia di informazioni. Impariamo come funziona la nostra mente.`,
            hashtags: ['educazione', 'psicologia', 'cervello', 'consapevolezza']
          },
          {
            id: '3', style: 'supportive', title: 'Non sei solo',
            content: `In momenti difficili, ricorda: ogni passo verso il benessere è un successo. Continua così! 💙`,
            hashtags: ['supporto', 'benessere', 'forza', 'comunità']
          },
          {
            id: '4', style: 'professional', title: 'Servizio professionale',
            content: `Offro consulenze personalizzate per il tuo percorso di crescita. Contattami per maggiori informazioni.`,
            hashtags: ['consulenza', 'professionale', 'psicologia', 'servizi']
          }
        ]
      };
    }

    return NextResponse.json({
      success: true,
      variants: parsedContent.variants,
      originalPrompt: prompt
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Errore generazione Facebook: ' + error.message 
    }, { status: 500 });
  }
}
