import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const perPage = searchParams.get('per_page') || '12';

    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    if (!process.env.PEXELS_API_KEY) {
      return NextResponse.json({ error: 'Pexels API key not configured' }, { status: 500 });
    }

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          'Authorization': process.env.PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      photos: data.photos || [],
      total_results: data.total_results || 0
    });

  } catch (error: any) {
    console.error('Errore Pexels API:', error);
    return NextResponse.json({ 
      error: 'Errore nella ricerca immagini Pexels',
      details: error.message 
    }, { status: 500 });
  }
}
