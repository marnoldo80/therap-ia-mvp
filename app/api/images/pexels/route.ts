import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const perPage = searchParams.get('per_page') || '4';

    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_PEXELS_API_KEY) {
      return NextResponse.json({ error: 'Pexels API key not configured' }, { status: 500 });
    }

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=square`,
      {
        headers: {
          'Authorization': process.env.NEXT_PUBLIC_PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      photos: data.photos || [],
      total_results: data.total_results || 0
    });

  } catch (error: any) {
    console.error('Pexels API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Pexels: ' + error.message },
      { status: 500 }
    );
  }
}
