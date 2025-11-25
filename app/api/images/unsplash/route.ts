import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const perPage = searchParams.get('per_page') || '4';

    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY) {
      return NextResponse.json({ error: 'Unsplash API key not configured' }, { status: 500 });
    }

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=square`,
      {
        headers: {
          'Authorization': `Client-ID ${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      results: data.results || [],
      total: data.total || 0
    });

  } catch (error: any) {
    console.error('Unsplash API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Unsplash: ' + error.message },
      { status: 500 }
    );
  }
}
