import { NextRequest, NextResponse } from 'next/server';

// Pexels API endpoint
const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

// Cache for image URLs to avoid repeated API calls
const imageCache = new Map<string, string>();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const word = searchParams.get('word');

  if (!word) {
    return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
  }

  const normalizedWord = word.toLowerCase().trim();

  // Check cache first
  if (imageCache.has(normalizedWord)) {
    return NextResponse.json({ url: imageCache.get(normalizedWord), cached: true });
  }

  // Get API key from environment
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    // Fallback to Unsplash if no Pexels API key
    const fallbackUrl = `https://images.unsplash.com/photo-placeholder?w=300&h=300&fit=crop&q=${encodeURIComponent(normalizedWord)}`;
    return NextResponse.json({ url: fallbackUrl, source: 'fallback' });
  }

  try {
    // Search Pexels for the word
    const response = await fetch(
      `${PEXELS_API_URL}?query=${encodeURIComponent(normalizedWord)}&per_page=1&orientation=square`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.photos && data.photos.length > 0) {
      // Get the medium size image (good balance of quality and load time)
      const imageUrl = data.photos[0].src.medium;

      // Cache the result
      imageCache.set(normalizedWord, imageUrl);

      return NextResponse.json({
        url: imageUrl,
        source: 'pexels',
        photographer: data.photos[0].photographer,
      });
    }

    // No results found
    return NextResponse.json({ url: null, source: 'none' });
  } catch (error) {
    console.error('Pexels API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image', url: null },
      { status: 500 }
    );
  }
}
