import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, specialization, style, preferredColors } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Nome richiesto' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Groq API key non configurata' }, { status: 500 });
    }

    const systemPrompt = `Sei un designer esperto specializzato in loghi per professionisti della salute mentale ITALIANI.

TASK: Genera 4 concept di logo diversi per uno psicologo/terapeuta.

REGOLE:
- Ogni concept deve avere uno stile diverso
- Nomi creativi ma professionali
- Descrizioni specifiche per ogni concept
- Font families appropriate (web-safe)
- Palette colori coerente con lo stile

STILI DISPONIBILI:
- minimale: Pulito, essenziale, geometric
- moderno: Contemporaneo, gradienti, dinamico
- professionale: Classico, affidabile, autorevole
- creativo: Originale, artistico, distintivo

Rispondi SOLO con JSON valido:
{
  "concepts": [
    {
      "id": "1",
      "name": "Nome concept descrittivo",
      "description": "Breve descrizione dello stile e approccio",
      "style": "stile_richiesto",
      "svgContent": "",
      "colors": ["#colore1", "#colore2"],
      "fontFamily": "Arial, sans-serif"
    },
    {
      "id": "2", 
      "name": "Secondo concept",
      "description": "Descrizione diversa",
      "style": "stile_richiesto",
      "svgContent": "",
      "colors": ["#colore1", "#colore2"],
      "fontFamily": "Georgia, serif"
    },
    {
      "id": "3",
      "name": "Terzo concept", 
      "description": "Terza variante",
      "style": "stile_richiesto",
      "svgContent": "",
      "colors": ["#colore1", "#colore2"],
      "fontFamily": "Arial, sans-serif"
    },
    {
      "id": "4",
      "name": "Quarto concept",
      "description": "Quarta opzione",
      "style": "stile_richiesto", 
      "svgContent": "",
      "colors": ["#colore1", "#colore2"],
      "fontFamily": "Verdana, sans-serif"
    }
  ]
}`;

    const userPrompt = `Genera 4 logo concepts per:

NOME: "${name}"
SPECIALIZZAZIONE: "${specialization || 'Psicologo'}"
STILE PREFERITO: ${style}
COLORI PREFERITI: ${preferredColors.join(', ')}

Crea 4 varianti creative dello stile "${style}" per questo professionista della salute mentale.

Ogni concept deve:
- Avere nome distintivo
- Riflettere professionalità psicologica
- Usare palette colori appropriate
- Essere adatto per biglietti da visita e web

NON include SVG content - sarà generato programmaticamente.`;

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
        max_tokens: 1200,
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
        
        if (parsedContent.concepts && Array.isArray(parsedContent.concepts)) {
          parsedContent.concepts = parsedContent.concepts.map((concept: any, index: number) => ({
            id: concept.id || (index + 1).toString(),
            name: concept.name?.substring(0, 50) || `Logo Concept ${index + 1}`,
            description: concept.description?.substring(0, 100) || 'Design professionale',
            style: style, // Forza lo stile richiesto
            svgContent: '', // Sarà generato dal frontend
            colors: Array.isArray(concept.colors) 
              ? concept.colors.slice(0, 2).filter((color: string) => /^#[0-9A-F]{6}$/i.test(color))
              : getDefaultColors(style, preferredColors),
            fontFamily: concept.fontFamily || getFontForStyle(style)
          }));
        } else {
          throw new Error('Invalid format');
        }
      } else {
        throw new Error('No JSON found');
      }

    } catch (parseError) {
      console.error('Parse error:', parseError);
      
      // Fallback: genera concepts di base
      parsedContent = {
        concepts: generateFallbackConcepts(name, specialization, style, preferredColors)
      };
    }

    return NextResponse.json({
      success: true,
      concepts: parsedContent.concepts,
      inputData: { name, specialization, style, preferredColors }
    });

  } catch (error: any) {
    console.error('Logo generation error:', error);
    return NextResponse.json({ 
      error: 'Errore generazione logo concepts: ' + error.message 
    }, { status: 500 });
  }
}

function getDefaultColors(style: string, preferredColors: string[]) {
  const defaultPalettes = {
    minimale: ['#2c3e50', '#ecf0f1'],
    moderno: ['#3498db', '#9b59b6'],
    professionale: ['#34495e', '#95a5a6'], 
    creativo: ['#e74c3c', '#f39c12']
  };
  
  return defaultPalettes[style as keyof typeof defaultPalettes] || preferredColors;
}

function getFontForStyle(style: string) {
  const fonts = {
    minimale: 'Arial, sans-serif',
    moderno: 'Helvetica, sans-serif',
    professionale: 'Georgia, serif',
    creativo: 'Verdana, sans-serif'
  };
  
  return fonts[style as keyof typeof fonts] || 'Arial, sans-serif';
}

function generateFallbackConcepts(name: string, specialization: string, style: string, preferredColors: string[]) {
  const baseConcepts = [
    {
      id: '1',
      name: 'Essential',
      description: 'Design pulito e professionale con focus sulla chiarezza',
      style: style,
      svgContent: '',
      colors: getDefaultColors(style, preferredColors),
      fontFamily: getFontForStyle(style)
    },
    {
      id: '2',
      name: 'Modern Professional', 
      description: 'Approccio contemporaneo mantenendo autorevolezza',
      style: style,
      svgContent: '',
      colors: getDefaultColors(style, preferredColors),
      fontFamily: getFontForStyle(style)
    },
    {
      id: '3',
      name: 'Balanced',
      description: 'Equilibrio perfetto tra creatività e professionalità',
      style: style,
      svgContent: '',
      colors: getDefaultColors(style, preferredColors),
      fontFamily: getFontForStyle(style)
    },
    {
      id: '4',
      name: 'Distinctive',
      description: 'Design unico che si distingue mantenendo serietà',
      style: style,
      svgContent: '',
      colors: getDefaultColors(style, preferredColors),
      fontFamily: getFontForStyle(style)
    }
  ];

  return baseConcepts;
}
