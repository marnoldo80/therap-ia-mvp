import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { textContent, originalPrompt } = await request.json();

    if (!textContent || !originalPrompt) {
      return NextResponse.json({ error: 'Text content e prompt richiesti' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Groq API key non configurata' }, { status: 500 });
    }

    // Prompt per generare concept visuali
    const systemPrompt = `Sei un art director esperto specializzato in Instagram per psicologi e psicoterapeuti. 

TASK: Genera 4 concept visuali diversi per un post Instagram basandoti sul testo selezionato dall'utente.

REGOLE:
- Ogni concept deve avere uno stile visual diverso
- Include palette colori hex specifici (3-4 colori max)
- Suggerisci elementi grafici concreti
- Evita cliché psicologici (cervelli, divani, persone tristi)
- Focus su metafore visive moderne e professionali

STILI:
1. MINIMALE: Pulito, spazio bianco, geometrico
2. NATURALE: Organico, texture, colori terra
3. MODERNO: Gradiente, forme fluide, contemporaneo  
4. ELEGANTE: Sofisticato, contrasti, tipografia

Rispondi SOLO con JSON valido:
{
  "concepts": [
    {
      "id": "1",
      "name": "Nome concept breve",
      "description": "Descrizione stile visivo",
      "style": "minimale",
      "colors": ["#hex1", "#hex2", "#hex3"],
      "elements": ["elemento1", "elemento2", "elemento3"]
    },
    {
      "id": "2",
      "name": "Nome concept",
      "description": "Descrizione",
      "style": "naturale", 
      "colors": ["#hex1", "#hex2", "#hex3"],
      "elements": ["elemento1", "elemento2", "elemento3"]
    },
    {
      "id": "3", 
      "name": "Nome concept",
      "description": "Descrizione",
      "style": "moderno",
      "colors": ["#hex1", "#hex2", "#hex3"], 
      "elements": ["elemento1", "elemento2", "elemento3"]
    },
    {
      "id": "4",
      "name": "Nome concept", 
      "description": "Descrizione",
      "style": "elegante",
      "colors": ["#hex1", "#hex2", "#hex3"],
      "elements": ["elemento1", "elemento2", "elemento3"]
    }
  ]
}`;

    const userPrompt = `Genera 4 concept visuali per questo post Instagram:

TESTO SELEZIONATO: "${textContent.content}"
STILE TESTO: ${textContent.style}
PROMPT ORIGINALE: "${originalPrompt}"

Crea concept che complementino il messaggio del testo, evitando stereotipi psicologici.`;

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
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore Groq API:', errorText);
      return NextResponse.json({ 
        error: 'Errore generazione visual concepts', 
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
        if (parsedContent.concepts && Array.isArray(parsedContent.concepts)) {
          parsedContent.concepts = parsedContent.concepts.map((concept: any, index: number) => ({
            id: concept.id || (index + 1).toString(),
            name: concept.name?.substring(0, 40) || `Concept ${index + 1}`,
            description: concept.description?.substring(0, 100) || 'Stile visivo moderno',
            style: concept.style || ['minimale', 'naturale', 'moderno', 'elegante'][index],
            colors: Array.isArray(concept.colors) 
              ? concept.colors.slice(0, 4).filter((color: string) => /^#[0-9A-F]{6}$/i.test(color))
              : getDefaultColors(index),
            elements: Array.isArray(concept.elements)
              ? concept.elements.slice(0, 5).map((el: any) => el.toString().substring(0, 30))
              : getDefaultElements(index)
          }));
        } else {
          throw new Error('Formato concepts non valido');
        }
      } else {
        throw new Error('JSON non trovato nella risposta');
      }

    } catch (parseError) {
      console.error('Errore parsing JSON:', parseError);
      console.error('Response:', responseText);
      
      // Fallback: genera concepts di base
      parsedContent = {
        concepts: generateFallbackConcepts(textContent, originalPrompt)
      };
    }

    // Validazione finale
    if (!parsedContent.concepts || parsedContent.concepts.length === 0) {
      parsedContent = {
        concepts: generateFallbackConcepts(textContent, originalPrompt)
      };
    }

    return NextResponse.json({
      success: true,
      concepts: parsedContent.concepts,
      textContent: textContent,
      originalPrompt: originalPrompt
    });

  } catch (error: any) {
    console.error('Errore generazione visual concepts:', error);
    return NextResponse.json({ 
      error: 'Errore nella generazione dei concept visuali: ' + error.message 
    }, { status: 500 });
  }
}

// Fallback colors per ogni stile
function getDefaultColors(index: number) {
  const colorSets = [
    ['#f8fafc', '#e2e8f0', '#64748b'], // minimale
    ['#fef3c7', '#d97706', '#92400e'], // naturale  
    ['#3b82f6', '#8b5cf6', '#ec4899'], // moderno
    ['#1f2937', '#374151', '#d1d5db']  // elegante
  ];
  return colorSets[index] || colorSets[0];
}

// Fallback elementi per ogni stile
function getDefaultElements(index: number) {
  const elementSets = [
    ['forme geometriche', 'spazio bianco', 'linee sottili'],
    ['texture organiche', 'forme curve', 'gradienti naturali'], 
    ['gradienti fluidi', 'forme astratte', 'colori vibranti'],
    ['tipografia bold', 'contrasti netti', 'composizione bilanciata']
  ];
  return elementSets[index] || elementSets[0];
}

// Fallback concepts completi
function generateFallbackConcepts(textContent: any, originalPrompt: string) {
  return [
    {
      id: '1',
      name: 'Minimalista Pulito',
      description: 'Design pulito con spazio bianco e forme geometriche',
      style: 'minimale',
      colors: ['#f8fafc', '#e2e8f0', '#64748b'],
      elements: ['forme geometriche', 'spazio bianco', 'linee sottili']
    },
    {
      id: '2', 
      name: 'Natura Organica',
      description: 'Ispirazione naturale con texture e colori terra',
      style: 'naturale',
      colors: ['#fef3c7', '#d97706', '#92400e'],
      elements: ['texture organiche', 'forme curve', 'gradienti naturali']
    },
    {
      id: '3',
      name: 'Moderno Fluido',
      description: 'Stile contemporaneo con gradienti e forme fluide',
      style: 'moderno', 
      colors: ['#3b82f6', '#8b5cf6', '#ec4899'],
      elements: ['gradienti fluidi', 'forme astratte', 'colori vibranti']
    },
    {
      id: '4',
      name: 'Elegante Sofisticato',
      description: 'Design raffinato con contrasti e tipografia bold',
      style: 'elegante',
      colors: ['#1f2937', '#374151', '#d1d5db'], 
      elements: ['tipografia bold', 'contrasti netti', 'composizione bilanciata']
    }
  ];
}
