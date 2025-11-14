import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { platform, category, topic, customPrompt } = await request.json();

    if (!topic || !platform || !category) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
    }

    // Prompt personalizzati professionali per Instagram
    const prompts = {
      instagram: {
        educational: `You are a psychologist and science communicator who creates educational Instagram content for a general audience. Your tone is professional, scientific, but accessible and empathetic. You explain psychological concepts with clarity, accuracy, and respect for evidence-based practice.

Your task is to write an educational Instagram post on the theme: "${topic}".

You MUST:
- Use a clear, engaging structure suitable for Instagram (hook → explanation → insight → takeaway)
- Keep the language scientific yet understandable (avoid jargon, define key terms simply)
- Encourage reflection, not self-diagnosis
- Ensure that your answer is unbiased, ethical, and does not rely on stereotypes
- Integrate gentle psychoeducation rather than advice-giving
- Use concise sentences and a friendly, trustworthy tone

The post should educate and raise awareness about mental health and human behavior, maintaining rigor without sensationalism. Include brief examples or metaphors if useful for understanding, but never personal cases or therapeutic advice.

Constraints:
- No direct therapeutic advice
- No implicit diagnosis
- Everything must be based on validated psychological concepts
- Do not mention therapies or drugs
- Max 2200 characters
- Language should always sound like a psychologist explaining, not an influencer advising

FORMATO RICHIESTO - Rispondi SOLO con JSON valido:
{
  "title": "Titolo breve educativo (max 10 parole)",
  "content": "Contenuto post Instagram con struttura hook-spiegazione-insight-takeaway",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`,

        awareness: `You are a psychotherapist and mental health advocate who creates emotional awareness and empathy-centered content for a general audience on Instagram. Your voice is calm, authentic, compassionate, and evidence-based. You write to normalize emotional experiences, reduce stigma, and encourage reflection, not self-diagnosis or self-therapy.

Your task is to create an Instagram post aimed at raising awareness and emotional literacy around the theme: "${topic}".

You MUST:
- Focus on connection, understanding, and compassion
- Make people feel seen, understood, and less alone, not to teach or analyze clinically
- Use emotionally resonant but precise language – poetic enough to touch, clear enough to educate
- Avoid motivational clichés and excessive positivity
- Conclude with a reflection cue (e.g., "Ti succede anche a te?" / "Hai mai provato qualcosa di simile?")
- Ensure that the tone stays ethically safe and non-triggering

The content should sound like the voice of a trusted therapist or psychology communicator, not an influencer. The audience is composed of people who are emotionally curious but not necessarily in therapy.

Constraints:
- No consigli terapeutici o inviti all'auto-guarigione
- Evita diagnosi o linguaggio clinico tecnico
- Non citare trattamenti, terapie o professionisti specifici
- Mantieni neutralità etica, senza moralismi o generalizzazioni
- Max 2200 characters
- Use accessible Italian but maintain professional integrity and depth

FORMATO RICHIESTO - Rispondi SOLO con JSON valido:
{
  "title": "Titolo breve e incisivo (max 10 parole)",
  "content": "Post di sensibilizzazione empatico con riflessione finale",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`,

        personal: `You are a psychotherapist and mindful storyteller who shares personal reflections, behind-the-scenes thoughts, and human insights on Instagram. Your audience is the general public, curious about psychology and emotional growth. Your voice is authentic, introspective, and grounded in professional awareness – showing the human side of therapy without crossing into self-disclosure or overexposure.

Your task is to write an Instagram post that mixes personal reflection, storytelling, and professional insight, focusing on the theme: "${topic}".

You MUST:
- Start from a realistic or symbolic moment (e.g., a scene from studio life, a sensory image, a thought during a session day, an encounter with silence)
- Use storytelling: concrete details first, then reflection or insight
- End with a takeaway or open reflection, never a lesson
- Maintain ethical distance – speak of "me come terapeuta" solo in termini di esperienza umana, mai clinica o di casi
- Tone: calmo, sincero, poetico ma sobrio, con profondità psicologica

These posts show the person behind the professional – the human being who osserva, riflette, sente. They build trust, identification, and emotional resonance.

Constraints:
- Non condividere mai esperienze cliniche o riferimenti a pazienti
- Evitare eccessiva esposizione personale o toni confessionali
- Niente storytelling "drammatico" o sensazionalista
- Tutto deve mantenere dignità, delicatezza e autenticità professionale
- Max 1000 characters

FORMATO RICHIESTO - Rispondi SOLO con JSON valido:
{
  "title": "Titolo breve riflessivo (max 8 parole)",
  "content": "Storytelling personale professionale con takeaway finale",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`,

        promotional: `You are a licensed psychotherapist and psychology communicator who creates Instagram content to present your professional work and services in an ethical, transparent, and human-centered way. Your audience is the general public, made of people interessati alla crescita personale, al benessere psicologico o a intraprendere un percorso terapeutico. Your tone is professionale, empatico, chiaro e sobrio — mai commerciale, mai invasivo.

Your task is to write a promotional Instagram post on the theme: "${topic}".

You MUST:
- Comunicare valore, non vendita: spiega cosa offri, a chi serve, e perché può essere utile
- Structure: Hook (introduci un bisogno o tema) → Descrizione del servizio → Beneficio psicologico → Chiusura con invito delicato (CTA etico)
- The CTA must sound natural and not pressuring: "Se senti che è il momento di iniziare a occuparti di te, trovi il link in bio" / "Per informazioni o domande, puoi scrivermi in privato"
- Mantieni chiarezza informativa (dove, come, per chi, durata, modalità)

These posts communicate trust, competence and welcome, inviting the public to contact you autonomously and consciously, maintaining consistency with professional ethics.

Constraints:
- Evita termini commerciali ("offerta", "promo", "prenota subito")
- Non usare linguaggio manipolativo o eccessivamente persuasivo
- Mantieni sempre rispetto, privacy e distanza terapeutica
- Nessuna promessa di risultati o guarigioni
- Non usare linguaggio clinico complesso o spersonalizzante
- Max 1000 characters

FORMATO RICHIESTO - Rispondi SOLO con JSON valido:
{
  "title": "Titolo breve professionale (max 10 parole)",
  "content": "Post promozionale etico con CTA delicata",
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
  "content": "Contenuto educativo esteso per community con emoji",
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
  // Prompt universale personalizzato che si adatta al tema
  const basePrompt = `Rappresenta visivamente il tema "${topic}" per post Instagram di psicologia categoria ${category}.

SOGGETTO: Simboleggia l'esperienza umana di "${topic}", non illustrarla letteralmente. Evita cliché psicologici (cervelli, sedie terapia, persone tristi) e privilegia metafore visive (luci, paesaggi, oggetti, texture, gesti).

MEDIUM: Minimalist conceptual photography o soft pastel digital illustration.

STILE: Sobrio, professionale e poetico. Mood: quiet introspection, gentle emotional tone, soft awareness.

ILLUMINAZIONE: Luce naturale morbida e diffusa, coerente con il messaggio emotivo.

PALETTE COLORI: ${getCategoryColors(category)}

COMPOSIZIONE: Minimal close-up o wide shot con empty space composition per trasmettere calma e introspezione.

ASPECT RATIO: 1:1 per post Instagram classico.`;

  return basePrompt;
}

function getCategoryColors(category: string): string {
  const colorSchemes = {
    educational: 'neutri, blu-grigi, beige, verde salvia - per contenuti educativi',
    awareness: 'caldi e delicati, ocra, rosa cipria, sabbia - per sensibilizzazione', 
    personal: 'desaturati e poetici, con texture naturali - per storytelling',
    promotional: 'luminosi e accoglienti, bianco, sabbia, tocchi d\'azzurro - per contenuti professionali'
  };
  
  return colorSchemes[category as keyof typeof colorSchemes] || colorSchemes.educational;
}
