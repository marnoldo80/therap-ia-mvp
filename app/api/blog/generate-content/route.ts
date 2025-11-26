import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { outline, category, style } = await request.json();

    if (!outline || !outline.title) {
      return NextResponse.json({ error: 'Outline richiesto' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Groq API key non configurata' }, { status: 500 });
    }

    const systemPrompt = `Sei un copywriter esperto specializzato in contenuti per psicologi e psicoterapeuti ITALIANI.

TASK: Trasforma una struttura articolo in un contenuto completo, professionale e coinvolgente.

REGOLE FERREE:
- Scrivi SEMPRE in italiano perfetto e naturale
- Linguaggio professionale ma accessibile
- Contenuti scientificamente accurati
- Evita consigli medici diretti o autodiagnosi
- Include esempi pratici quando appropriato
- Mantieni un tono empatico e professionale

STILI:
- formal: Accademico, tecnico, per professionisti
- divulgativo: Chiaro, accessibile, per pubblico generale  
- personale: Con tocchi di esperienza, storytelling
- scientifico: Focus su evidenze, ricerche, dati

FORMATO OUTPUT:
Scrivi l'articolo completo in formato Markdown con:
- Titolo principale (# )
- Sezioni con sottotitoli (## )
- Paragrafi ben strutturati
- Conclusioni pratiche

NON includere meta-informazioni o commenti. Solo il contenuto dell'articolo.`;

    const userPrompt = `Scrivi l'articolo completo basato su questa struttura:

TITOLO: ${outline.title}

STRUTTURA:
${outline.sections.map((section: any, index: number) => 
  `${index + 1}. ${section.heading}\n${section.points.map((point: string) => `   - ${point}`).join('\n')}`
).join('\n\n')}

STILE: ${style}
CATEGORIA: ${category}
TARGET PAROLE: ${outline.targetWordCount}
KEYWORDS DA INTEGRARE: ${outline.keywords.join(', ')}

Sviluppa ogni sezione in modo approfondito, mantenendo il tono ${style} e assicurandoti che l'articolo sia utile per il target audience. Includi esempi pratici dove appropriato e conclusioni actionable.`;

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
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';

    // Pulizia contenuto
    content = content.trim()
      .replace(/```markdown\s*/g, '')
      .replace(/```\s*/g, '');

    // Genera dati SEO
    const seoData = generateSEOData(outline.title, content, outline.keywords);

    // Fallback se contenuto troppo corto
    if (content.length < 500) {
      content = generateFallbackContent(outline, style, category);
    }

    return NextResponse.json({
      success: true,
      content: content,
      seoData: seoData,
      stats: {
        wordCount: content.split(' ').length,
        charCount: content.length,
        readingTime: Math.ceil(content.split(' ').length / 200)
      }
    });

  } catch (error: any) {
    console.error('Content generation error:', error);
    return NextResponse.json({ 
      error: 'Errore generazione contenuto: ' + error.message 
    }, { status: 500 });
  }
}

function generateSEOData(title: string, content: string, keywords: string[]) {
  // Genera slug
  const slug = title.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 60);

  // Estrai primo paragrafo per meta description
  const firstParagraph = content.split('\n\n')[1] || content.substring(0, 300);
  const metaDescription = firstParagraph
    .replace(/[#*]/g, '')
    .trim()
    .substring(0, 155) + '...';

  // SEO title ottimizzato
  const seoTitle = title.length > 60 
    ? title.substring(0, 57) + '...'
    : title + ' | Psicologo';

  return {
    seoTitle,
    metaDescription,
    keywords: keywords.slice(0, 5),
    slug
  };
}

function generateFallbackContent(outline: any, style: string, category: string) {
  const introductions = {
    'educational': 'Nel campo della psicologia, è fondamentale comprendere',
    'case-studies': 'La pratica clinica ci insegna che ogni caso è unico',
    'professional': 'Durante la mia esperienza professionale, ho imparato',
    'news-trends': 'Le recenti ricerche nel campo della psicologia evidenziano'
  };

  const introduction = introductions[category as keyof typeof introductions] || introductions.educational;

  let content = `# ${outline.title}\n\n${introduction} l'importanza di questo argomento.\n\n`;

  outline.sections.forEach((section: any) => {
    content += `## ${section.heading}\n\n`;
    section.points.forEach((point: string) => {
      content += `${point}. Questo aspetto richiede particolare attenzione nel contesto terapeutico.\n\n`;
    });
  });

  content += `## Conclusioni\n\nQuesto articolo ha esplorato i principali aspetti di ${outline.title.toLowerCase()}. `;
  content += `Per un supporto professionale personalizzato, è sempre consigliabile consultare uno psicologo qualificato.\n\n`;
  content += `La comprensione di questi elementi può contribuire significativamente al benessere psicologico e alla qualità della vita.`;

  return content;
}
