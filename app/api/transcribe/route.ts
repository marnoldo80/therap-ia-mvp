import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'File audio mancante' }, { status: 400 });
    }

    // Prepara il file per Deepgram
    const audioBuffer = await audioFile.arrayBuffer();

    // Chiama Deepgram con diarization abilitata
    const deepgramResponse = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm',
      },
      body: audioBuffer,
      // Parametri di query per diarization
      // Aggiungiamo diarize=true per identificare speaker diversi
    });

    // Versione con parametri nella URL
    const deepgramUrl = new URL('https://api.deepgram.com/v1/listen');
    deepgramUrl.searchParams.append('model', 'nova-2');
    deepgramUrl.searchParams.append('language', 'it');
    deepgramUrl.searchParams.append('smart_format', 'true');
    deepgramUrl.searchParams.append('diarize', 'true'); // Abilita diarization
    deepgramUrl.searchParams.append('punctuate', 'true');
    deepgramUrl.searchParams.append('utterances', 'true');

    const response = await fetch(deepgramUrl.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm',
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore Deepgram:', errorText);
      return NextResponse.json({ error: 'Errore trascrizione' }, { status: 500 });
    }

    const deepgramData = await response.json();
    
    // Estrai trascrizione con speaker identification
    let formattedTranscript = '';
    
    if (deepgramData.results?.utterances) {
      // Usa utterances per diarization
      formattedTranscript = deepgramData.results.utterances
        .map((utterance: any) => {
          const speakerLabel = utterance.speaker === 0 ? 'TERAPEUTA' : 'PAZIENTE';
          return `${speakerLabel}: ${utterance.transcript}`;
        })
        .join('\n\n');
    } else if (deepgramData.results?.channels?.[0]?.alternatives?.[0]) {
      // Fallback senza diarization
      formattedTranscript = deepgramData.results.channels[0].alternatives[0].transcript;
    } else {
      return NextResponse.json({ error: 'Nessuna trascrizione trovata' }, { status: 500 });
    }

    return NextResponse.json({ 
      transcript: formattedTranscript,
      raw_data: deepgramData // Per debugging se necessario
    });

  } catch (error: any) {
    console.error('Errore trascrizione:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
