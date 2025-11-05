import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'Nessun file audio' }, { status: 400 });
    }

    // Converti File in Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Chiama Deepgram API con diarization
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=it&diarize=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': audioFile.type,
      },
      body: buffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore Deepgram:', errorText);
      return NextResponse.json({ error: 'Errore trascrizione' }, { status: 500 });
    }

    const data = await response.json();
    const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

    return NextResponse.json({ transcript });

  } catch (error: any) {
    console.error('Errore trascrizione:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
