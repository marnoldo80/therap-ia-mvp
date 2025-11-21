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
        educational: `Sei un esperto psicologo e comunicatore scientifico che crea contenuti educativi Instagram per il pubblico generale ITALIANO. Il tuo tone è professionale, scientifico, ma accessibile ed empatico. Spieghi concetti psicologici con chiarezza, accuratezza e rispetto per la pratica basata su evidenze.

Il tuo compito è scrivere un post educativo Instagram sul tema: "${topic}".

DEVI ASSOLUTAMENTE:
- Scrivere SOLO in italiano perfetto e grammaticalmente corretto
- Usare una struttura chiara e coinvolgente (hook → spiegazione → insight → takeaway)
- Mantenere il linguaggio scientifico ma comprensibile (evita gergo, definisci termini semplici)
- Incoraggiare riflessione, non autodiagnosi
- Integrare psicoeducazione delicata piuttosto che consigli
- Usare frasi concise e tono amichevole e affidabile
- MAX 250 CARATTERI per il contenuto - mantenerlo BREVE e coinvolgente

Constraints:
- Nessun consiglio terapeutico diretto
- Nessuna diagnosi implicita
- Tutto deve basarsi su concetti psicologici validati
- Non menzionare terapie o farmaci
- MAX 250 caratteri per il contenuto
- SEMPRE in italiano corretto

FORMATO RICHIESTO - Rispondi SOLO con JSON valido in ITALIANO:
{
  "title": "Titolo breve educativo in italiano (max 10 parole)",
  "content": "Contenuto post Instagram BREVE in italiano corretto (max 250 caratteri)",
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
- MAX 250 CHARACTERS for content - keep it SHORT and impactful

The content should sound like the voice of a trusted therapist or psychology communicator, not an influencer. The audience is composed of people who are emotionally curious but not necessarily in therapy.

Constraints:
- No consigli terapeutici o inviti all'auto-guarigione
- Evita diagnosi o linguaggio clinico tecnico
- Non citare trattamenti, terapie o professionisti specifici
- Mantieni neutralità etica, senza moralismi o generalizzazioni
- MAX 250 characters for content
- Use accessible Italian but maintain professional integrity and depth

FORMATO RICHIESTO - Rispondi SOLO con JSON valido:
{
  "title": "Titolo breve e incisivo (max 10 parole)",
  "content": "Post di sensibilizzazione empatico BREVE (max 250 caratteri)",
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
- MAX 250 CHARACTERS for content - keep it SHORT and meaningful

These posts show the person behind the professional – the human being who osserva, riflette, sente. They build trust, identification, and emotional resonance.

Constraints:
- Non condividere mai esperienze cliniche o riferimenti a pazienti
- Evitare eccessiva esposizione personale o toni confessionali
- Niente storytelling "drammatico" o sensazionalista
- Tutto deve mantenere dignità, delicatezza e autenticità professionale
- MAX 250 characters for content

FORMATO RICHIESTO - Rispondi SOLO con JSON valido:
{
  "title": "Titolo breve riflessivo (max 8 parole)",
  "content": "Storytelling personale professionale BREVE (max 250 caratteri)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`,

        promotional: `You are a licensed psychotherapist and psychology communicator who creates Instagram content to present your professional work and services in an ethical, transparent, and human-centered way. Your audience is the general public, made of people interessati alla crescita personale, al benessere psicologico o a intraprendere un percorso terapeutico. Your tone is professionale, empatico, chiaro e sobrio — mai commerciale, mai invasivo.

Your task is to write a promotional Instagram post on the theme: "${topic}".

You MUST:
- Comunicare valore, non vendita: spiega cosa offri, a chi serve, e perché può essere utile
- Structure: Hook (introduci un bisogno o tema) → Descrizione del servizio → Beneficio psicologico → Chiusura con invito delicato (CTA etico)
- The CTA must sound natural and not pressuring: "Se senti che è il momento di iniziare a occuparti di te, trovi il link in bio" / "Per informazioni o domande, puoi scrivermi in privato"
- Mantieni chiarezza informativa (dove, come, per chi, durata, modalità)
- MAX 250 CHARACTERS for content - keep it SHORT and professional

These posts communicate trust, competence and welcome, inviting the public to contact you autonomously and consciously, maintaining consistency with professional ethics.

Constraints:
- Evita termini commerciali ("offerta", "promo", "prenota subito")
- Non usare linguaggio manipolativo o eccessivamente persuasivo
- Mantieni sempre rispetto, privacy e distanza terapeutica
- Nessuna promessa di risultati o guarigioni
- Non usare linguaggio clinico complesso o spersonalizzante
- MAX 250 characters for content

FORMATO RICHIESTO - Rispondi SOLO con JSON valido:
{
  "title": "Titolo breve professionale (max 10 parole)",
  "content": "Post promozionale etico BREVE (max 250 caratteri)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`
      },

      facebook: {
        educational: `Sei un esperto di comunicazione per psicologi su Facebook. Crea un post educativo su "${topic}".

LINEE GUIDA:
- Max 400 caratteri (Facebook - più breve per engagement)
- Tone professionale ma conversazionale
- Struttura: Introduzione + contenuto + domanda per discussione
- Incoraggia commenti e condivisioni
- Usa emoji con moderazione

FORMATO RICHIESTO - Rispondi SOLO con JSON valido:
{
  "title": "Titolo per community Facebook",
  "content": "Contenuto educativo per community (max 400 caratteri)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4"]
}`,

        awareness: `Sei un esperto di comunicazione per psicologi su Facebook. Crea un post di sensibilizzazione su "${topic}".

LINEE GUIDA:
- Community building, discussione aperta
- Linguaggio inclusivo e supportivo
- Max 400 caratteri
- Incoraggia condivisione di esperienze appropriate
- Crea senso di comunità e supporto reciproco
- Usa emoji per empatia

FORMATO RICHIESTO - Rispondi SOLO con JSON valido:
{
  "title": "Titolo community con emoji",
  "content": "Post di sensibilizzazione community-oriented (max 400 caratteri)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4"]
}`
      },

      linkedin: {
        educational: `Sei un esperto di comunicazione per psicologi su LinkedIn. Crea un post professionale su "${topic}".

LINEE GUIDA:
- Max 300 caratteri (LinkedIn breve e professionale)
- Tone autorevole e professionale
- Include insight settoriali e best practices
- Adatto per networking con colleghi
- Aggiungi valore al network professionale
- Evita emoji eccessive, mantieni professionalità

FORMATO RICHIESTO - Rispondi SOLO con JSON valido:
{
  "title": "Titolo professionale LinkedIn",
  "content": "Insight professionale dettagliato (max 300 caratteri)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4"]
}`,

        professional: `Sei un esperto di comunicazione per psicologi su LinkedIn. Crea un articolo thought leadership su "${topic}".

LINEE GUIDA:
- Thought leadership nel settore psicologia
- Include evidenze scientifiche e best practices
- Max 300 caratteri
- Tone esperto ma accessibile
- Call-to-action per networking professionale
- Focus su competenze e innovazione

FORMATO RICHIESTO - Rispondi SOLO con JSON valido:
{
  "title": "Titolo thought leadership",
  "content": "Articolo professionale autorevole (max 300 caratteri)",
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
            content: 'Sei un esperto copywriter ITALIANO specializzato in comunicazione digitale per psicologi e psicoterapeuti. Scrivi SEMPRE in italiano perfetto, grammaticalmente corretto. Crei contenuti professionali, etici e coinvolgenti per social media. Rispondi SEMPRE e SOLO con JSON valido in ITALIANO, senza testo aggiuntivo. IMPORTANTE: mantieni il contenuto BREVE, conciso e in ITALIANO CORRETTO per social media.'
          },
          {
            role: 'user',
            content: selectedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800, // Ridotto per contenuti più brevi
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

    // Parsing JSON robusto e pulizia contenuto
    let content;
    try {
      // Pulizia aggressiva del response
      let cleanedResponse = responseText.trim();
      
      // Rimuovi eventuali backticks, markdown e testo extra
      cleanedResponse = cleanedResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^[^{]*/, '') // Rimuovi tutto prima della prima {
        .replace(/[^}]*$/, '}'); // Forza chiusura con }
      
      // Se contiene JSON, estrailo
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = JSON.parse(jsonMatch[0]);
        
        // Pulizia aggiuntiva del contenuto
        if (content.content) {
          content.content = content.content
            .replace(/[{}"\[\]]/g, '') // Rimuovi caratteri JSON residui
            .replace(/title:|content:|hashtags:/gi, '') // Rimuovi label JSON
            .replace(/\s+/g, ' ') // Normalizza spazi
            .trim();
            
          // Limita lunghezza per platform (MOLTO BREVE)
          const maxLength = platform === 'instagram' ? 250 : platform === 'facebook' ? 400 : 300;
          if (content.content.length > maxLength) {
            content.content = content.content.substring(0, maxLength) + '...';
          }
        }
        
        // Pulizia hashtags
        if (content.hashtags && Array.isArray(content.hashtags)) {
          content.hashtags = content.hashtags
            .map((tag: any) => tag.toString().replace(/[^a-zA-Z0-9]/g, ''))
            .filter((tag: string) => tag.length > 2)
            .slice(0, 5); // Max 5 hashtag
        }
        
      } else {
        throw new Error('No valid JSON found');
      }
      
    } catch (e) {
      console.error('JSON Parse Error:', e, 'Raw Response:', responseText);
      
      // Fallback: crea contenuto pulito manualmente
      let cleanContent = responseText
        .replace(/[{}"\[\],]/g, '')
        .replace(/title:|content:|hashtags:/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
        
      // Limita lunghezza
      const maxLength = platform === 'instagram' ? 250 : platform === 'facebook' ? 400 : 300;
      if (cleanContent.length > maxLength) {
        cleanContent = cleanContent.substring(0, maxLength) + '...';
      }
      
      content = {
        title: `💭 ${topic}`,
        content: cleanContent,
        hashtags: generateFallbackHashtags(topic, category, platform)
      };
    }

    // Validazione finale
    if (!content.title) content.title = `💭 ${topic}`;
    if (!content.content) content.content = 'Contenuto non disponibile';
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
  ].slice(0, 5);
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
