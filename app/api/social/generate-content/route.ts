import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { platform, category, topic, customPrompt } = await request.json();

    if (!topic || !platform || !category) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
    }

    // Prompt specializzati per piattaforma e categoria
    const prompts = {
      instagram: {
        educational: `Crea un post Instagram educativo per psicoterapeuti su "${topic}". 

LINEE GUIDA:
- Max 2200 caratteri
- Tone professionale ma accessibile 
- Usa emoji per leggibilità
- Aggiungi domanda per engagement
- Basato su evidenze scientifiche
- Struttura: Hook + contenuto educativo + call-to-action

FORMATO RISPOSTA (solo JSON valido, niente altro testo):
{
  "title": "Titolo accattivante con emoji",
  "content": "Contenuto completo del post con paragrafi ed emoji",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`,

        awareness: `Scrivi un post Instagram di sensibilizzazione su "${topic}" per psicologo.

LINEE GUIDA:
- Linguaggio empatico e non giudicante
- Obiettivo: ridurre stigma, aumentare consapevolezza
- Tone supportivo e incoraggiante
- Max 2200 caratteri
- Include emoji appropriati
- Incoraggia a cercare aiuto se necessario

FORMATO RISPOSTA (solo JSON valido, niente altro testo):
{
  "title": "Titolo empatico con emoji",
  "content": "Post di sensibilizzazione",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`,

        personal: `Crea un post Instagram personale per psicoterapeuta su "${topic}".

LINEE GUIDA:
- Mostra lato umano mantenendo professionalità
- Storytelling coinvolgente e autentico
- Max 2200 caratteri
- Tone caldo, genuino ma rispettoso
- Connetti esperienza personale a insight professionali

FORMATO RISPOSTA (solo JSON valido, niente altro testo):
{
  "title": "Titolo personale con emoji",
  "content": "Storytelling professionale",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`,

        promotional: `Scrivi un post Instagram promozionale per psicoterapeuta su "${topic}".

LINEE GUIDA:
- Tone professionale, non commerciale aggressivo
- Focus su valore per il paziente
- Max 2200 caratteri
- Include credibilità
- Call-to-action delicato

FORMATO RISPOSTA (solo JSON valido, niente altro testo):
{
  "title": "Titolo professionale con emoji",
  "content": "Presentazione servizio",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`
      },

      facebook: {
        educational: `Crea un post Facebook educativo per psicoterapeuti su "${topic}".

LINEE GUIDA:
- Max 4000 caratteri (Facebook permette più testo)
- Tone professionale ma conversazionale
- Struttura: Introduzione + contenuto dettagliato + discussione
- Incoraggia commenti e condivisioni
- Può includere paragrafi più lunghi

FORMATO RISPOSTA (solo JSON valido, niente altro testo):
{
  "title": "Titolo per Facebook",
  "content": "Contenuto esteso per community",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4"]
}`,

        awareness: `Scrivi un post Facebook di sensibilizzazione su "${topic}".

LINEE GUIDA:
- Community building, discussione aperta
- Linguaggio inclusivo e supportivo
- Max 4000 caratteri
- Incoraggia condivisione esperienze appropriate
- Crea senso di comunità

FORMATO RISPOSTA (solo JSON valido, niente altro testo):
{
  "title": "Titolo community",
  "content": "Post di sensibilizzazione community-oriented",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4"]
}`
      },

      linkedin: {
        educational: `Crea un post LinkedIn professionale su "${topic}" per psicoterapeuta.

LINEE GUIDA:
- Max 3000 caratteri
- Tone autorevole e professionale
- Include insight settoriali
- Networking con colleghi
- Aggiungi valore professionale

FORMATO RISPOSTA (solo JSON valido, niente altro testo):
{
  "title": "Titolo professionale LinkedIn",
  "content": "Insight professionale dettagliato",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4"]
}`,

        professional: `Scrivi un articolo LinkedIn professionale su "${topic}".

LINEE GUIDA:
- Thought leadership nel settore
- Evidenze scientifiche e best practices
- Max 3000 caratteri
- Tone esperto ma accessibile
- Call-to-action per networking

FORMATO RISPOSTA (solo JSON valido, niente altro testo):
{
  "title": "Titolo thought leadership",
  "content": "Articolo professionale autorevole", 
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4"]
}`
      }
    };

    // Seleziona il prompt appropriato
    let selectedPrompt = customPrompt;
    if (!selectedPrompt) {
      const platformPrompts = prompts[platform as keyof typeof prompts];
      if (platformPrompts) {
        selectedPrompt = platformPrompts[category as keyof typeof platformPrompts] || 
                        platformPrompts['educational' as keyof typeof platformPrompts];
      }
    }

    if (!selectedPrompt) {
      return NextResponse.json({ error: 'Prompt non trovato per questa configurazione' }, { status: 400 });
    }

    // Chiamata all'API di Anthropic
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: selectedPrompt
          }
        ]
      })
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Anthropic API Error:', anthropicResponse.status, errorText);
      throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
    }

    const anthropicData = await anthropicResponse.json();
    const responseText = anthropicData.content[0].text;

    // Prova a parsare come JSON
    let content;
    try {
      // Pulisce eventuali backticks o markdown
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^{]*/, '')  // Rimuove testo prima del JSON
        .replace(/[^}]*$/, '}') // Assicura che finisca con }
        .trim();
      
      content = JSON.parse(cleanedResponse);
    } catch (e) {
      console.error('JSON Parse Error:', e, 'Response:', responseText);
      // Se non è JSON valido, crea struttura manuale
      content = {
        title: `Post ${platform} su ${topic}`,
        content: responseText,
        hashtags: generateFallbackHashtags(topic, category, platform)
      };
    }

    // Valida e pulisci il contenuto
    if (!content.title) content.title = `Post ${platform} su ${topic}`;
    if (!content.content) content.content = responseText;
    if (!content.hashtags || !Array.isArray(content.hashtags)) {
      content.hashtags = generateFallbackHashtags(topic, category, platform);
    }

    // Aggiungi prompt immagine se appropriato
    if (platform === 'instagram' || platform === 'facebook') {
      content.imagePrompt = generateImagePrompt(topic, category);
    }

    return NextResponse.json({ 
      success: true, 
      content: content,
      platform,
      category,
      topic
    });

  } catch (error: any) {
    console.error('Errore generazione contenuto:', error);
    return NextResponse.json({ 
      error: 'Errore nella generazione del contenuto: ' + error.message 
    }, { status: 500 });
  }
}

function generateFallbackHashtags(topic: string, category: string, platform: string): string[] {
  const baseHashtags = ['psicologia', 'benessere', 'salutementale'];
  
  const categoryHashtags = {
    educational: ['psicoeducazione', 'informazione', 'consapevolezza'],
    awareness: ['sensibilizzazione', 'supporto', 'comprensione'],
    personal: ['riflessioni', 'esperienza', 'crescita'],
    promotional: ['consulenza', 'terapia', 'servizi']
  };

  const platformHashtags = {
    instagram: ['mentalhealthawareness', 'psychology'],
    facebook: ['community', 'supporto'],
    linkedin: ['psicologiaclinica', 'professionisti']
  };

  return [
    ...baseHashtags,
    ...(categoryHashtags[category as keyof typeof categoryHashtags] || []),
    ...(platformHashtags[platform as keyof typeof platformHashtags] || [])
  ].slice(0, 6);
}

function generateImagePrompt(topic: string, category: string): string {
  const prompts = {
    educational: `Infografica minimalista su ${topic}, colori calmi (blu/verde), stile professionale sanitario, icone semplici, layout pulito`,
    awareness: `Illustrazione empatica su ${topic}, palette pastello, atmosfera rassicurante, stile moderno inclusivo`,
    personal: `Immagine evocativa per riflessione su ${topic}, mood contemplativo, colori caldi, stile artistico ma professionale`,
    promotional: `Design professionale per servizi di ${topic}, colori corporate (blu/grigio), stile business healthcare`
  };

  return prompts[category as keyof typeof prompts] || prompts.educational;
}
