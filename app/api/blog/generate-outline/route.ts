import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { topic, category, targetAudience, style } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic richiesto' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Groq API key non configurata' }, { status: 500 });
    }

    const systemPrompt = `Sei un editor esperto specializzato in contenuti per psicologi e psicoterapeuti ITALIANI.

TASK: Genera una struttura dettagliata per un articolo professionale di psicologia.

CATEGORIE:
- educational: Psico-educazione, divulgazione scientifica
- case-studies: Esempi clinici, metodologie, risultati
- professional: Riflessioni, etica, crescita professionale  
- news-trends: Ricerche recenti, innovazioni, aggiornamenti

STILI:
- formal: Linguaggio accademico, professionale, tecnico
- divulgativo: Accessibile, chiaro, per il grande pubblico
- personale: Con tocchi di esperienza personale, storytelling
- scientifico: Focus su ricerche, dati, evidenze

Rispondi SOLO con JSON valido:
{
  "outline": {
    "title": "Titolo articolo coinvolgente e SEO-friendly",
    "sections": [
      {
        "heading": "Titolo sezione",
        "points": [
          "Punto specifico da trattare",
          "Altro punto importante",
          "Dettaglio pratico"
        ]
      },
      {
        "heading": "Seconda sezione",
        "points": [
          "Contenuto della sezione",
          "Esempi pratici",
          "Conclusioni"
        ]
      }
    ],
    "targetWordCount": 1500,
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
  }
}`;

    const userPrompt = `Crea una struttura articolo per:

ARGOMENTO: "${topic}"
CATEGORIA: ${category}
TARGET AUDIENCE: ${targetAudience || 'Pubblico generale interessato alla psicologia'}
STILE: ${style}

L'articolo deve essere:
- Professionale e accurato dal punto di vista psicologico
- Utile e pratico per il target audience
- Ottimizzato SEO con keywords pertinenti
- Strutturato per una lettura fluida
- Appropriato per un blog di psicologo/terapeuta

Includi 4-6 sezioni principali con 3-5 punti specifici per sezione.
Target: 1200-2000 parole per un articolo completo e approfondito.`;

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
        
        // Validazione struttura
        if (parsedContent.outline) {
          const outline = parsedContent.outline;
          outline.title = outline.title?.substring(0, 100) || 'Articolo di Psicologia';
          outline.targetWordCount = outline.targetWordCount || 1500;
          outline.keywords = Array.isArray(outline.keywords) 
            ? outline.keywords.slice(0, 6)
            : generateKeywords(topic, category);
          
          if (Array.isArray(outline.sections)) {
            outline.sections = outline.sections.slice(0, 6).map((section: any) => ({
              heading: section.heading?.substring(0, 80) || 'Sezione',
              points: Array.isArray(section.points) 
                ? section.points.slice(0, 5).map((point: string) => point.substring(0, 150))
                : ['Contenuto della sezione']
            }));
          } else {
            outline.sections = generateFallbackSections(category);
          }
        } else {
          throw new Error('Invalid outline structure');
        }
      } else {
        throw new Error('No JSON found');
      }

    } catch (parseError) {
      console.error('Parse error:', parseError);
      
      // Fallback: genera outline di base
      parsedContent = {
        outline: generateFallbackOutline(topic, category, style)
      };
    }

    return NextResponse.json({
      success: true,
      outline: parsedContent.outline,
      inputData: { topic, category, targetAudience, style }
    });

  } catch (error: any) {
    console.error('Outline generation error:', error);
    return NextResponse.json({ 
      error: 'Errore generazione outline: ' + error.message 
    }, { status: 500 });
  }
}

function generateKeywords(topic: string, category: string) {
  const baseKeywords = ['psicologia', 'benessere', 'salute mentale'];
  const categoryKeywords = {
    'educational': ['educazione', 'informazione', 'consapevolezza'],
    'case-studies': ['caso clinico', 'terapia', 'trattamento'],
    'professional': ['professionale', 'formazione', 'etica'],
    'news-trends': ['ricerca', 'innovazione', 'studio']
  };
  
  const topicWords = topic.toLowerCase()
    .split(' ')
    .filter(word => word.length > 3)
    .slice(0, 2);
  
  return [
    ...baseKeywords,
    ...(categoryKeywords[category as keyof typeof categoryKeywords] || []),
    ...topicWords
  ].slice(0, 6);
}

function generateFallbackSections(category: string) {
  const sectionTemplates = {
    'educational': [
      { heading: 'Introduzione al problema', points: ['Definizione', 'Diffusione', 'Impatto sulla vita'] },
      { heading: 'Le cause principali', points: ['Fattori biologici', 'Fattori psicologici', 'Fattori sociali'] },
      { heading: 'Come riconoscere i segnali', points: ['Sintomi fisici', 'Sintomi emotivi', 'Sintomi comportamentali'] },
      { heading: 'Strategie di gestione', points: ['Tecniche pratiche', 'Quando chiedere aiuto', 'Risorse utili'] }
    ],
    'case-studies': [
      { heading: 'Presentazione del caso', points: ['Contesto clinico', 'Problematica presentata', 'Obiettivi'] },
      { heading: 'Valutazione iniziale', points: ['Assessment', 'Diagnosi', 'Piano terapeutico'] },
      { heading: 'Intervento terapeutico', points: ['Metodologie', 'Tecniche utilizzate', 'Processo'] },
      { heading: 'Risultati e conclusioni', points: ['Outcome', 'Apprendimenti', 'Implicazioni'] }
    ],
    'professional': [
      { heading: 'La mia esperienza', points: ['Background', 'Sfide incontrate', 'Crescita professionale'] },
      { heading: 'Riflessioni teoriche', points: ['Approcci utilizzati', 'Evoluzione pratica', 'Insights'] },
      { heading: 'Lezioni apprese', points: ['Cosa ha funzionato', 'Errori da evitare', 'Miglioramenti'] },
      { heading: 'Consigli pratici', points: ['Per colleghi', 'Per la formazione', 'Per il futuro'] }
    ],
    'news-trends': [
      { heading: 'Panoramica della ricerca', points: ['Contesto attuale', 'Metodologia', 'Partecipanti'] },
      { heading: 'Risultati principali', points: ['Findings chiave', 'Dati significativi', 'Correlazioni'] },
      { heading: 'Implicazioni pratiche', points: ['Per la clinica', 'Per i pazienti', 'Per la professione'] },
      { heading: 'Prospettive future', points: ['Ricerche necessarie', 'Sviluppi attesi', 'Applicazioni'] }
    ]
  };

  return sectionTemplates[category as keyof typeof sectionTemplates] || sectionTemplates.educational;
}

function generateFallbackOutline(topic: string, category: string, style: string) {
  return {
    title: `${topic}: Guida Completa per ${style === 'professional' ? 'Professionisti' : 'Tutti'}`,
    sections: generateFallbackSections(category),
    targetWordCount: style === 'scientifico' ? 2000 : 1500,
    keywords: generateKeywords(topic, category)
  };
}
