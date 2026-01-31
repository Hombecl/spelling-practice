import { NextRequest, NextResponse } from 'next/server';

// OpenRouter API endpoint (OpenAI-compatible)
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Gemini 2.5 Flash Lite - cheapest vision model (~$0.10/1M input tokens)
const MODEL = 'google/gemini-2.5-flash-lite';

// Color name mapping for prompts
const COLOR_NAMES: Record<string, string> = {
  yellow: 'YELLOW',
  pink: 'PINK/MAGENTA',
  green: 'GREEN',
  blue: 'BLUE',
  orange: 'ORANGE',
  any: 'any color',
};

// Build prompt based on scan mode
function buildPrompt(mode: string, highlightColor?: string): string {
  if (mode === 'highlighted') {
    const colorText = highlightColor && highlightColor !== 'any'
      ? COLOR_NAMES[highlightColor] || highlightColor.toUpperCase()
      : 'any color';

    return `You are an OCR assistant for a children's spelling practice app. The user has marked specific words with a ${colorText} HIGHLIGHTER PEN.

YOUR TASK: Extract ONLY the words that are highlighted with ${colorText} highlighter.

CRITICAL INSTRUCTIONS:
1. ONLY extract words that have ${colorText} highlighter marking on them
2. Ignore ALL words that are NOT highlighted
3. List each highlighted word on its own line, wrapped with ** like **word**
4. If a word is partially highlighted, include it
5. Ignore Chinese characters, numbers, and punctuation
6. Keep original spelling (don't correct typos)

WHAT TO LOOK FOR:
- Words with bright ${colorText} background/overlay
- Text that appears to have highlighter pen marking
- Semi-transparent colored marks over text

Example output format (only highlighted words):
**apple**
**beautiful**
**family**

If you cannot find any ${colorText} highlighted words, respond with:
NO_HIGHLIGHTED_WORDS_FOUND

Now extract ONLY the ${colorText} highlighted words from this image:`;
  }

  // Smart mode - AI picks suitable spelling words
  return `You are an OCR assistant for a children's spelling practice app. Extract English vocabulary words that are suitable for PRIMARY SCHOOL students to practice spelling.

YOUR TASK: Identify and extract words that are good for spelling practice.

CRITICAL INSTRUCTIONS:
1. Extract meaningful vocabulary words (nouns, verbs, adjectives, adverbs)
2. SKIP these types of words:
   - Common function words: the, a, an, is, are, was, were, be, been, to, of, in, for, on, with, at, by, from
   - Pronouns: I, you, he, she, it, we, they, my, your, his, her, our, their
   - Simple conjunctions: and, or, but, if, so, as
   - Very short words (2 letters or less)
3. INCLUDE these types of words:
   - Nouns: girl, boy, family, school, teacher, beautiful, garden
   - Verbs: running, swimming, playing, eating, walking
   - Adjectives: happy, beautiful, wonderful, important, different
   - Adverbs: quickly, slowly, carefully, happily
4. Mark words that seem to be KEY VOCABULARY (larger font, bold, or in vocabulary lists) with ** like **word**
5. Ignore Chinese characters, numbers, and punctuation
6. Keep original spelling (don't correct typos)
7. Aim for 10-30 words maximum - focus on quality vocabulary

Example output format:
**beautiful**
family
**important**
running
school
teacher

Now extract suitable spelling practice words from this image:`;
}

export async function POST(request: NextRequest) {
  try {
    const { image, mode = 'smart', highlightColor } = await request.json();

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

    // Build appropriate prompt based on mode
    const prompt = buildPrompt(mode, highlightColor);

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
                text: prompt,
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

    // Check for no highlighted words found
    if (mode === 'highlighted' && rawText.includes('NO_HIGHLIGHTED_WORDS_FOUND')) {
      return NextResponse.json({
        success: true,
        words: [],
        highlightedWords: [],
        rawText,
        source: 'gemini-ocr',
      });
    }

    // Parse the response to extract words
    const { words, highlightedWords } = parseOCRResponse(rawText, mode);

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
function parseOCRResponse(text: string, mode: string): { words: string[]; highlightedWords: string[] } {
  const words: string[] = [];
  const highlightedWords: string[] = [];
  const seen = new Set<string>();

  // Common stop words to skip (only in smart mode, highlighted mode trusts user's selections)
  const skipWords = mode === 'smart' ? new Set([
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
  ]) : new Set<string>();

  // Split by lines and process each
  const lines = text.split(/[\n\r]+/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip markdown artifacts or explanatory text
    if (trimmed.startsWith('#') || trimmed.startsWith('-') || trimmed.includes(':')) continue;

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

    // Skip stop words (in smart mode only)
    if (skipWords.has(word)) continue;

    // Skip if already seen
    if (seen.has(word)) continue;

    // Must have at least one vowel
    if (!/[aeiou]/.test(word)) continue;

    seen.add(word);
    words.push(word);

    // In highlighted mode, ALL words are highlighted
    // In smart mode, only ** marked words are highlighted
    if (mode === 'highlighted' || isHighlighted) {
      highlightedWords.push(word);
    }
  }

  return { words, highlightedWords };
}
