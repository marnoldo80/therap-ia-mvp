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

    // Prompt ottimizzato per generare 4 varianti diverse
    const systemPrompt = `Sei un copywriter esperto specializzato in Instagram per psicologi e psicoterapeuti ITALIANI. 

TASK: Genera 4 varianti diverse di post Instagram basate sulla descrizione dell'utente.

REGOLE:
- Scrivi SOLO in italiano perfetto e naturale
- Ogni variante deve avere uno stile diverso: Motivazionale, Educativo, Personale, Professionale  
- Contenuto max 150 caratteri per Instagram Stories/Reel
- Usa linguaggio empatico, professionale ma accessibile
- Evita consigli medici diretti o autodiagnosi
- Include 4-5 hashtag pertinenti per ogni variante

STILI:
1. MOTIVAZIONALE: Inspirazionale, energico, incoraggiante
2. EDUCATIVO: Informativo, scientificamente accurato, psico-educativo  
3. PERSONALE: Autentico, vulnerabile, storytelling umano
4. PROFESSIONALE: Autorevole, competente, affidabile

Rispondi SOLO con JSON valido in questo formato:
{
  "variants": [
    {
      "id": "1",
      "style": "motivational",
      "title": "Titolo breve che cattura l'attenzione",
      "content": "Testo del post max 150 caratteri",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
    },
    {
      "id": "2", 
      "style": "educational",
      "title": "Titolo educativo",
      "content": "Testo educativo max 150 caratteri",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
    },
    {
      "id": "3",
      "style": "personal", 
      "title": "Titolo personale",
      "content": "Testo personale max 150 caratteri",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
    },
    {
      "id": "4",
      "style": "professional",
      "title": "Titolo professionale", 
      "content": "Testo professionale max 150 caratteri",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
    }
  ]
}`;

    const userPrompt = `Genera 4 varianti diverse per questo post Instagram:

"${prompt}"

Ricorda: max 150 caratteri per variante, stili diversi (motivazionale, educativo, personale, professionale), sempre in italiano.`;

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
      const errorText = await response.text();
      console.error('Errore Groq API:', errorText);
      return NextResponse.json({ 
        error: 'Errore generazione testi', 
        details: errorText
      }, { status: 500 });
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    let parsedContent;
    try {
      // Pulizia response
      let cleanedResponse = responseText.trim();
      cleanedResponse = cleanedResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^[^{]*/, '')
        .replace(/[^}]*$/, '}');

      // Parse JSON
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
        
        // Validazione e pulizia
        if (parsedContent.variants && Array.isArray(parsedContent.variants)) {
          parsedContent.variants = parsedContent.variants.map((variant: any, index: number) => ({
            id: variant.id || (index + 1).toString(),
            style: variant.style || ['motivational', 'educational', 'personal', 'professional'][index],
            title: variant.title?.substring(0, 60) || `Variante ${index + 1}`,
            content: variant.content?.substring(0, 150) || 'Contenuto non disponibile',
            hashtags: Array.isArray(variant.hashtags) 
              ? variant.hashtags.slice(0, 5).map((tag: any) => tag.toString().replace(/[^a-zA-Z0-9àèéìíîòóùúç]/g, ''))
              : generateFallbackHashtags(prompt)
          }));
        } else {
          throw new Error('Formato varianti non valido');
        }
      } else {
        throw new Error('JSON non trovato nella risposta');
      }

    } catch (parseError) {
      console.error('Errore parsing JSON:', parseError);
      console.error('Response:', responseText);
      
      // Fallback: genera varianti di base
      parsedContent = {
        variants: generateFallbackVariants(prompt)
      };
    }

    // Validazione finale
    if (!parsedContent.variants || parsedContent.variants.length === 0) {
      parsedContent = {
        variants: generateFallbackVariants(prompt)
      };
    }

    return NextResponse.json({
      success: true,
      variants: parsedContent.variants,
      originalPrompt: prompt
    });

  } catch (error: any) {
    console.error('Errore generazione varianti testo:', error);
    return NextResponse.json({ 
      error: 'Errore nella generazione delle varianti di testo: ' + error.message 
    }, { status: 500 });
  }
}

// Fallback per hashtag
function generateFallbackHashtags(prompt: string) {
  const baseHashtags = ['psicologia', 'benessere', 'salutementale', 'crescitapersonale'];
  const keywordHashtags = [];
  
  // Estrai parole chiave dal prompt
  const keywords = prompt.toLowerCase().match(/\b(ansia|stress|depressione|terapia|motivazione|autostima|relazioni|lavoro|famiglia)\b/g);
  if (keywords) {
    keywordHashtags.push(...keywords.slice(0, 2));
  }
  
  return [...baseHashtags, ...keywordHashtags].slice(0, 5);
}

// Fallback per varianti complete
function generateFallbackVariants(prompt: string) {
  const baseText = prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt;
  
  return [
    {
      id: '1',
      style: 'motivational',
      title: '💪 Trova la forza dentro di te',
      content: `${baseText.substring(0, 120)}. Ogni passo conta!`,
      hashtags: ['motivazione', 'forza', 'psicologia', 'benessere', 'crescita']
    },
    {
      id: '2', 
      style: 'educational',
      title: '🧠 Cosa dice la scienza',
      content: `${baseText.substring(0, 120)}. La ricerca mostra...`,
      hashtags: ['educazione', 'scienza', 'psicologia', 'informazione', 'salutementale']
    },
    {
      id: '3',
      style: 'personal',
      title: '💭 La mia riflessione',
      content: `${baseText.substring(0, 120)}. Esperienza personale.`,
      hashtags: ['riflessioni', 'esperienza', 'psicologia', 'autentico', 'personale']
    },
    {
      id: '4',
      style: 'professional',
      title: '🎯 Approccio professionale',
      content: `${baseText.substring(0, 120)}. Consulenza disponibile.`,
      hashtags: ['professionale', 'consulenza', 'psicologia', 'terapia', 'esperto']
    }
  ];
}
