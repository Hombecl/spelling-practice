import { NextRequest, NextResponse } from 'next/server';

// OpenRouter API endpoint (OpenAI-compatible)
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Gemini 2.5 Flash Lite - cheapest vision model (~$0.10/1M input tokens)
const MODEL = 'google/gemini-2.5-flash-lite';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY not configured', useLocalOCR: true },
        { status: 500 }
      );
    }

    // Call OpenRouter with Gemini Flash Lite for OCR
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://spelling-practice.vercel.app',
        'X-Title': 'Spelling Practice OCR',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: image, // base64 data URL
                },
              },
              {
                type: 'text',
                text: `You are an OCR assistant for a children's spelling practice app. Extract ALL English words from this image.

IMPORTANT INSTRUCTIONS:
1. List EVERY English word you can see, one per line
2. If you see words that are HIGHLIGHTED (with yellow, pink, green, or any color highlighter), mark them with ** on both sides like **word**
3. Include words from sentences, lists, vocabulary sections, etc.
4. Ignore Chinese characters, numbers, and punctuation
5. Keep the original spelling (don't correct typos)

Example output format:
apple
**banana**
cat
**dog**
elephant

Now extract all words from the image:`,
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to process image', detail: errorText, useLocalOCR: true },
        { status: 500 }
      );
    }

    const result = await response.json();
    const rawText = result.choices?.[0]?.message?.content || '';

    // Parse the response to extract words
    const { words, highlightedWords } = parseOCRResponse(rawText);

    return NextResponse.json({
      success: true,
      words,
      highlightedWords,
      rawText,
      source: 'gemini-ocr',
    });
  } catch (error) {
    console.error('OCR API error:', error);
    return NextResponse.json(
      { error: 'OCR processing failed', useLocalOCR: true },
      { status: 500 }
    );
  }
}

// Parse the OCR response to extract words and highlighted words
function parseOCRResponse(text: string): { words: string[]; highlightedWords: string[] } {
  const words: string[] = [];
  const highlightedWords: string[] = [];
  const seen = new Set<string>();

  // Common stop words to skip
  const skipWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can',
    'of', 'to', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
    'or', 'and', 'but', 'not', 'no', 'yes', 'if', 'so', 'as',
    'it', 'its', 'this', 'that', 'these', 'those', 'my', 'your',
    'his', 'her', 'our', 'their', 'i', 'you', 'he', 'she', 'we', 'they',
    'am', 'been', 'being', 'there', 'here', 'what', 'when', 'where',
    'who', 'which', 'why', 'how', 'all', 'each', 'every', 'both',
    'few', 'more', 'most', 'other', 'some', 'such', 'than', 'too',
    'very', 'just', 'also', 'now', 'only', 'then', 'about', 'into',
  ]);

  // Split by lines and process each
  const lines = text.split(/[\n\r]+/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if it's a highlighted word (marked with **)
    const isHighlighted = trimmed.startsWith('**') && trimmed.endsWith('**');

    // Extract the word
    let word = trimmed.replace(/^\*\*|\*\*$/g, '').trim();

    // Clean the word - remove punctuation, numbers, etc.
    word = word.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');

    // Skip if empty or too short
    if (word.length < 2) continue;

    // Skip if contains numbers or non-ASCII
    if (/\d/.test(word) || /[^\x00-\x7F]/.test(word)) continue;

    // Convert to lowercase
    word = word.toLowerCase();

    // Skip stop words
    if (skipWords.has(word)) continue;

    // Skip if already seen
    if (seen.has(word)) continue;

    // Must have at least one vowel
    if (!/[aeiou]/.test(word)) continue;

    seen.add(word);
    words.push(word);

    if (isHighlighted) {
      highlightedWords.push(word);
    }
  }

  return { words, highlightedWords };
}
