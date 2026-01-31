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
};

// Build prompt based on scan mode
function buildPrompt(mode: string, highlightColors?: string[]): string {
  if (mode === 'highlighted') {
    // Build color text based on selected colors
    let colorText: string;
    if (!highlightColors || highlightColors.length === 0 || highlightColors.length === 5) {
      colorText = 'any color';
    } else if (highlightColors.length === 1) {
      colorText = COLOR_NAMES[highlightColors[0]] || highlightColors[0].toUpperCase();
    } else {
      const colorNames = highlightColors.map(c => COLOR_NAMES[c] || c.toUpperCase());
      colorText = colorNames.slice(0, -1).join(', ') + ' or ' + colorNames[colorNames.length - 1];
    }

    return `You are an OCR assistant for a children's spelling practice app. The user has marked specific words with ${colorText} HIGHLIGHTER PEN.

YOUR TASK: Extract ONLY the REAL ENGLISH WORDS that are highlighted with ${colorText} highlighter.

CRITICAL INSTRUCTIONS:
1. ONLY extract words that have ${colorText} highlighter marking on them
2. ONLY include words that are REAL English words (exist in a dictionary)
3. DO NOT include OCR artifacts, random letter combinations, or word fragments
4. Ignore ALL words that are NOT highlighted
5. List each highlighted word on its own line, wrapped with ** like **word**
6. If a word is partially highlighted but is a real English word, include it
7. Ignore Chinese characters, numbers, and punctuation

WHAT TO LOOK FOR:
- Words with bright ${colorText} background/overlay (semi-transparent highlighter color)
- Text that appears to have highlighter pen marking over it
- The highlighter color should be clearly visible on or around the text

IMPORTANT: Every word you output must be a REAL English word. Skip any OCR garbage.

Example output format (only highlighted REAL words):
**apple**
**beautiful**
**family**

If you cannot find any ${colorText} highlighted words, respond with:
NO_HIGHLIGHTED_WORDS_FOUND

Now extract ONLY the ${colorText} highlighted words from this image:`;
  }

  // Smart mode - AI picks suitable spelling words
  return `You are an OCR assistant for a children's spelling practice app. Extract REAL English vocabulary words that are suitable for PRIMARY SCHOOL students to practice spelling.

YOUR TASK: Identify and extract REAL ENGLISH WORDS that are good for spelling practice.

CRITICAL INSTRUCTIONS:
1. ONLY extract words that exist in an English dictionary
2. DO NOT include:
   - Random letter combinations or OCR artifacts (like "ey", "oria", "tbe", "wben")
   - Partial words or word fragments
   - Misspellings that aren't real words
   - Common function words: the, a, an, is, are, was, were, be, been, to, of, in, for, on, with, at, by, from
   - Pronouns: I, you, he, she, it, we, they, my, your, his, her, our, their
   - Very short words (2 letters or less)
3. INCLUDE these types of REAL words:
   - Nouns: girl, boy, family, school, teacher, garden, animal
   - Verbs: running, swimming, playing, eating, walking
   - Adjectives: happy, beautiful, wonderful, important, different
   - Adverbs: quickly, slowly, carefully, happily
4. Mark KEY VOCABULARY words with ** like **word**
5. Ignore Chinese characters, numbers, and punctuation
6. If a word looks like OCR garbage (random letters), DO NOT include it
7. Aim for 10-30 quality words maximum

IMPORTANT: Every word you output must be a REAL English word that a child could look up in a dictionary.

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
    const { image, mode = 'smart', highlightColors } = await request.json();

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
    const prompt = buildPrompt(mode, highlightColors);

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

// Check if a word looks like a valid English word
function isValidEnglishWord(word: string): boolean {
  // Must be at least 3 characters (skip 2-letter words like "ey")
  if (word.length < 3) return false;

  // Must only contain letters
  if (!/^[a-zA-Z]+$/.test(word)) return false;

  // Must have at least one vowel
  if (!/[aeiou]/i.test(word)) return false;

  // Skip words that are just vowels or consonants repeated
  if (/^(.)\1+$/.test(word)) return false;

  // Skip words with too many consecutive consonants (likely OCR errors)
  if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(word)) return false;

  // Skip words with too many consecutive vowels (likely OCR errors)
  if (/[aeiou]{4,}/i.test(word)) return false;

  // Common OCR garbage patterns to skip
  const garbagePatterns = [
    /^[aeiou]{2,3}$/i,  // Just 2-3 vowels like "ey", "oa", "ia"
    /^[bcdfghjklmnpqrstvwxyz]{2,3}$/i,  // Just consonants
    /^.{1,2}$/,  // 1-2 character "words"
  ];

  for (const pattern of garbagePatterns) {
    if (pattern.test(word)) return false;
  }

  return true;
}

// Parse the OCR response to extract words and highlighted words
function parseOCRResponse(text: string, mode: string): { words: string[]; highlightedWords: string[] } {
  const words: string[] = [];
  const highlightedWords: string[] = [];
  const seen = new Set<string>();

  // Common stop words to skip (skip in both modes for cleaner results)
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

  // Log raw response for debugging
  console.log('[OCR] Raw Gemini response:', text.substring(0, 500));

  // Split by lines and process each
  const lines = text.split(/[\n\r]+/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip markdown artifacts, explanatory text, or sentences
    if (trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('-') && trimmed.length > 20) continue; // Skip long bullet points (explanations)
    if (trimmed.includes(':')) continue;
    if (trimmed.split(' ').length > 3) continue; // Skip sentences (more than 3 words)

    // Check if it's a highlighted word (marked with **)
    const isHighlighted = trimmed.startsWith('**') && trimmed.endsWith('**');

    // Extract the word - handle both **word** and plain word formats
    let word = trimmed.replace(/^\*\*|\*\*$/g, '').trim();

    // If the line has multiple words, try to extract just the word (not explanations)
    if (word.includes(' ')) {
      // Take the first word only
      word = word.split(' ')[0];
    }

    // Remove any list markers like "1.", "•", "-"
    word = word.replace(/^[\d\.\-\•\*]+\s*/, '');

    // Clean the word - remove punctuation, numbers, etc.
    word = word.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');

    // Convert to lowercase
    word = word.toLowerCase();

    // Skip if not a valid English word
    if (!isValidEnglishWord(word)) continue;

    // Skip stop words
    if (skipWords.has(word)) continue;

    // Skip if already seen
    if (seen.has(word)) continue;

    seen.add(word);
    words.push(word);

    // In highlighted mode, ALL valid words are highlighted
    // In smart mode, only ** marked words are highlighted
    if (mode === 'highlighted' || isHighlighted) {
      highlightedWords.push(word);
    }
  }

  console.log('[OCR] Parsed words:', words.length, 'Highlighted:', highlightedWords.length);

  return { words, highlightedWords };
}
