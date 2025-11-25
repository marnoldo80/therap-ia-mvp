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

    const systemPrompt = `Sei un copywriter esperto specializzato in LinkedIn per psicologi ITALIANI professionisti.

TASK: Genera 4 varianti diverse di post LinkedIn per thought leadership e networking professionale.

REGOLE:
- Scrivi SEMPRE in italiano perfetto e professionale
- Contenuti da 200-500 caratteri (LinkedIn professionale)
- Stili: Thought Leadership, Educativo, Network, Insights
- Linguaggio professionale ma accessibile
- Include insights settoriali e best practices
- Focus su competenze e autorevolezza

STILI:
1. THOUGHT_LEADERSHIP: Visione settoriale, trends, innovazione
2. EDUCATIONAL: Contenuti formativi per colleghi
3. NETWORK: Networking e collaborazione professionale  
4. INSIGHTS: Condivisioni di esperienza e riflessioni professionali

Rispondi SOLO con JSON in ITALIANO:
{
  "variants": [
    {
      "id": "1",
      "style": "thought_leadership",
      "title": "Titolo thought leadership",
      "content": "Contenuto LinkedIn 200-500 caratteri",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4"]
    },
    {
      "id": "2",
      "style": "educational",
      "title": "Titolo educativo", 
      "content": "Contenuto educativo 200-500 caratteri",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4"]
    },
    {
      "id": "3",
      "style": "network",
      "title": "Titolo networking",
      "content": "Contenuto networking 200-500 caratteri", 
      "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4"]
    },
    {
      "id": "4",
      "style": "insights",
      "title": "Titolo insights",
      "content": "Contenuto insights 200-500 caratteri",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4"]
    }
  ]
}`;

    const userPrompt = `Crea 4 post LinkedIn PROFESSIONALI basati su questa idea: "${prompt}"

NON ripetere mai le parole dell'utente. Crea contenuti autorevoli per professionisti della salute mentale.

ESEMPI BUONI:
- Thought Leadership: "La digitalizzazione sta trasformando l'accesso ai servizi psicologici. Le piattaforme online stanno democratizzando il benessere mentale."
- Educativo: "Nell'assessment psicologico, l'integrazione di test standardizzati e osservazione clinica offre una valutazione più completa del paziente."
- Network: "Cerco colleghi interessati a collaborare su progetti di prevenzione del burnout in ambito sanitario. Contattatemi se condividete questa visione."
- Insights: "Dopo 10 anni di pratica clinica, ho imparato che ascoltare il non detto è spesso più importante delle parole pronunciate."`;

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
        temperature: 0.7,
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
            style: variant.style || ['thought_leadership', 'educational', 'network', 'insights'][index],
            title: variant.title?.substring(0, 100) || `Post LinkedIn ${index + 1}`,
            content: variant.content?.substring(0, 500) || 'Contenuto non disponibile',
            hashtags: Array.isArray(variant.hashtags) 
              ? variant.hashtags.slice(0, 4).map((tag: any) => tag.toString().replace(/[^a-zA-Z0-9àèéìíîòóùúç]/g, ''))
              : ['psicologiaclinica', 'professionisti', 'salutementale', 'networking']
          }));
        } else {
          throw new Error('Invalid format');
        }
      } else {
        throw new Error('No JSON found');
      }

    } catch (parseError) {
      // Fallback per LinkedIn
      parsedContent = {
        variants: [
          {
            id: '1', style: 'thought_leadership', title: 'Evoluzione digitale',
            content: `La trasformazione digitale sta ridefinendo l'approccio terapeutico. L'integrazione di tecnologia e competenze umane è il futuro della psicologia.`,
            hashtags: ['innovazione', 'psicologiadigitale', 'futuro', 'leadership']
          },
          {
            id: '2', style: 'educational', title: 'Best practice cliniche',
            content: `L'evidenze scientifiche confermano l'efficacia dell'approccio integrato nella pratica clinica. Condivido le metodologie più aggiornate.`,
            hashtags: ['evidencebased', 'clinica', 'formazione', 'psicologia']
          },
          {
            id: '3', style: 'network', title: 'Collaborazioni professionali',
            content: `Sono sempre interessato a confrontarmi con colleghi su nuove metodologie e approcci innovativi. Connettiamoci per crescere insieme.`,
            hashtags: ['networking', 'collaborazione', 'crescita', 'professionisti']
          },
          {
            id: '4', style: 'insights', title: 'Riflessioni dalla pratica',
            content: `La pratica quotidiana mi insegna che ogni paziente porta una storia unica. L'ascolto attivo rimane la competenza fondamentale.`,
            hashtags: ['esperienza', 'ascolto', 'competenze', 'praticaclinica']
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
      error: 'Errore generazione LinkedIn: ' + error.message 
    }, { status: 500 });
  }
}
