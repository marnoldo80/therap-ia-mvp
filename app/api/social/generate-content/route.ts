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
        educational: `Sei un esperto di comunicazione per psicologi su Instagram. Crea un post educativo su "${topic}".

LINEE GUIDA:
- Max 2200 caratteri
- Tone professionale ma accessibile al pubblico generale
- Usa emoji per rendere più leggibile
- Struttura: Hook coinvolgente + contenuto educativo + domanda per engagement + call-to-action
- Basa il contenuto su evidenze scientifiche
- Linguaggio italiano naturale

FORMATO RICHIESTO - Rispondi SOLO con JSON valido:
{
  "title": "Titolo accattivante con emoji",
  "content": "Contenuto completo del post con emoji e paragrafi",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`,

        awareness: `Sei un esperto di comunicazione per psicologi su Instagram. Crea un post di sensibilizzazione su "${topic}".

LINEE GUIDA:
- Linguaggio empatico e non giudicante
- Obiettivo: ridurre stigma e aumentare consapevolezza
- Tone supportivo e incoraggiante
- Max 2200 caratteri
- Usa emoji appropriati
- Include delicatamente segni/sintomi se appropriato
- Incoraggia a cercare aiuto professionale

FORMATO RICHIESTO - Rispondi SOLO con JSON valido:
{
  "title": "Titolo empatico con emoji",
  "content": "Post di sensibilizzazione con emoji",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`,

        personal: `Sei un esperto di comunicazione per psicologi su Instagram. Crea un post personale su "${topic}".

LINEE GUIDA:
- Mostra il lato umano mantenendo professionalità
- Storytelling coinvolgente e autentico
- Max 2200 caratteri
- Tone caldo, genuino ma rispettoso
- Connetti esperienza personale a insight professionali
- Usa emoji per rendere più personale

FORMATO RICHIESTO - Rispondi SOLO con JSON valido:
{
  "title": "Titolo personale con emoji",
  "content": "Storytelling professionale con emoji",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`,

        promotional: `Sei un esperto di comunicazione per psicologi su Instagram. Crea un post promozionale su "${topic}".

LINEE GUIDA:
- Tone professionale, evita approccio commerciale aggressivo
- Focus sul valore per il paziente
- Max 2200 caratteri
- Include credibilità e competenze
- Call-to-action delicato e appropriato
- Usa emoji per professionalità friendly

FORMATO RICHIESTO - Rispondi SOLO con JSON valido:
{
  "title": "Titolo professionale con emoji",
  "content": "Presentazione servizio con emoji",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`
      },

      facebook: {
        educational: `Sei un esperto di comunicazione per psicologi su Facebook. Crea un post educativo su "${topic}".

LINEE GUIDA:
- Max 4000 caratteri (Facebook permette più testo)
- Tone professionale ma conversazionale
- Struttura: Introduzione + contenuto dettagliato + domande per discussione
- Incoraggia commenti e condivisioni
- Può includere paragrafi più lunghi e approfonditi
- Usa emoji con moderazione

FORMATO RICHIESTO - Rispondi SOLO con JSON valido:
{
  "title": "Titolo per community Facebook",
  "content": "Contenuto esteso per community con emoji",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4"]
}`,

        awareness: `Sei un esperto di comunicazione per psicologi su Facebook. Crea un post di sensibilizzazione su "${topic}".

LINEE GUIDA:
- Community building, discussione aperta
- Linguaggio inclusivo e supportivo
- Max 4000 caratteri
- Incoraggia condivisione di esperienze appropriate
- Crea senso di comunità e supporto reciproco
- Usa emoji per empatia

FORMATO RICHIESTO - Rispondi SOLO con JSON valido:
{
  "title": "Titolo community con emoji",
  "content": "Post di sensibilizzazione community-oriented",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4"]
}`
      },

      linkedin: {
        educational: `Sei un esperto di comunicazione per psicologi su LinkedIn. Crea un post professionale su "${topic}".

LINEE GUIDA:
- Max 3000 caratteri
- Tone autorevole e professionale
- Include insight settoriali e best practices
- Adatto per networking con colleghi
- Aggiungi valore al network professionale
- Evita emoji eccessive, mantieni professionalità

FORMATO RICHIESTO - Rispondi SOLO con JSON valido:
{
  "title": "Titolo professionale LinkedIn",
  "content": "Insight professionale dettagliato",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4"]
}`,

        professional: `Sei un esperto di comunicazione per psicologi su LinkedIn. Crea un articolo thought leadership su "${topic}".

LINEE GUIDA:
- Thought leadership nel settore psicologia
- Include evidenze scientifiche e best practices
- Max 3000 caratteri
- Tone esperto ma accessibile
- Call-to-action per networking professionale
- Focus su competenze e innovazione

FORMATO RICHIESTO - Rispondi SOLO con JSON valido:
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

    // Chiamata a Groq API con Llama (stesso sistema che già usi)
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
            content: 'Sei un esperto copywriter specializzato in comunicazione digitale per psicologi e psicoterapeuti. Crei contenuti professionali, etici e coinvolgenti per social media. Rispondi SEMPRE e SOLO con JSON valido, senza testo aggiuntivo.'
          },
          {
            role: 'user',
            content: selectedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore Groq API:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return NextResponse.json({ 
        error: 'Errore generazione contenuto social', 
        details: errorText,
        status: response.status 
      }, { status: 500 });
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    // Prova a parsare come JSON
    let content;
    try {
      // Pulisce eventuali backticks o markdown che Llama potrebbe aggiungere
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^{]*/, '')
        .replace(/[^}]*$/, '}')
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
    console.error('Errore generazione contenuto social:', error);
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
    facebook: ['community', 'supportomutuo'],
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
