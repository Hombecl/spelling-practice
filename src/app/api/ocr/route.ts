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

    return `You are an OCR assistant helping extract spelling words from HONG KONG PRIMARY SCHOOL English textbooks and worksheets.

CONTEXT: This image is from a Hong Kong kindergarten or primary school (ages 3-12) English learning material. A parent or teacher has marked specific vocabulary words with ${colorText} HIGHLIGHTER PEN for the child to practice spelling.

YOUR TASK: Extract ONLY the words that are highlighted with ${colorText} highlighter.

HOW TO IDENTIFY HIGHLIGHTED WORDS:
- Look for words with bright ${colorText} background/overlay (semi-transparent highlighter color)
- The highlighter color should be clearly visible on or around the text
- Focus on words that have been deliberately marked

WHAT HIGHLIGHTED WORDS SHOULD LOOK LIKE:
- Legitimate English vocabulary: apple, banana, family, school, happy, beautiful
- Words a Hong Kong primary school student would learn
- Real dictionary words that make sense

WHAT TO SKIP (even if highlighted):
- OCR errors or random letters (pas, lol, fos, tbe, wben)
- Anything that doesn't look like a real English word
- Chinese characters, numbers, or punctuation
- If something looks like garbled text, skip it

OUTPUT FORMAT:
- List each highlighted word on its own line, wrapped with ** like **word**
- Only include words you are confident are real English vocabulary

QUALITY CHECK: Before outputting each word, ask yourself: "Is this a real English word that would appear in a Hong Kong primary school textbook?" If no, skip it.

If you cannot find any ${colorText} highlighted words, respond with:
NO_HIGHLIGHTED_WORDS_FOUND

Now extract ONLY the ${colorText} highlighted vocabulary words from this image:`;
  }

  // Smart mode - AI picks suitable spelling words
  return `You are an OCR assistant helping extract spelling words from HONG KONG PRIMARY SCHOOL English textbooks and worksheets.

CONTEXT: This image is from a Hong Kong kindergarten or primary school (ages 3-12) English learning material. The app helps children practice spelling vocabulary words from their school curriculum.

YOUR TASK: Extract ONLY legitimate English vocabulary words that a Hong Kong primary school student would learn.

WHAT TO EXTRACT (examples of appropriate words):
- Common nouns: apple, banana, cat, dog, family, school, teacher, friend, book, house, water, food
- Action verbs: run, jump, play, eat, drink, sleep, read, write, swim, walk, help, like, love
- Adjectives: big, small, happy, sad, good, bad, new, old, beautiful, wonderful, important
- Colors: red, blue, green, yellow, pink, orange, purple, brown, black, white
- Numbers written as words: one, two, three, four, five
- Days/months: Monday, Tuesday, January, February
- Body parts: head, hand, foot, eye, ear, nose, mouth
- Weather: sunny, rainy, cloudy, hot, cold, warm

WHAT TO SKIP (do NOT include):
- OCR errors or random letters (pas, lol, fos, tbe, wben, oria)
- Internet slang or abbreviations
- Words that don't make sense
- Very basic function words: the, a, an, is, are, to, of, in, for, on, at, by
- Pronouns: I, you, he, she, it, we, they
- Words shorter than 3 letters
- Chinese characters, numbers, or punctuation

OUTPUT FORMAT:
- List each word on its own line
- Mark important vocabulary words with ** like **apple**
- Only output 10-30 high-quality words
- If unsure whether something is a real word, DO NOT include it

QUALITY CHECK: Before outputting each word, ask yourself: "Would this word appear in a Hong Kong primary school English textbook?" If no, skip it.

Now extract the vocabulary words from this image:`;
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

// Common OCR garbage and non-words to reject
const GARBAGE_WORDS = new Set([
  // OCR artifacts
  'pas', 'lol', 'fos', 'tion', 'tbe', 'wben', 'bave', 'tben', 'witb',
  'tbat', 'tbis', 'wbat', 'wbich', 'tbing', 'notbing', 'sometbing',
  'oria', 'ing', 'ness', 'ment', 'ful', 'less', 'able', 'ible',
  'pre', 'pro', 'con', 'dis', 'mis', 'non', 'sub', 'super',
  // Internet slang (not suitable for kids)
  'lmao', 'omg', 'wtf', 'btw', 'idk', 'imo', 'tbh', 'smh', 'fyi',
  // Random letter combinations
  'aaa', 'bbb', 'ccc', 'ddd', 'eee', 'fff', 'ggg', 'hhh', 'iii',
  'jjj', 'kkk', 'lll', 'mmm', 'nnn', 'ooo', 'ppp', 'qqq', 'rrr',
  'sss', 'ttt', 'uuu', 'vvv', 'www', 'xxx', 'yyy', 'zzz',
  // Common OCR errors that look like words
  'tlie', 'liave', 'wlien', 'tliat', 'tliis', 'wliat', 'wliich',
  'rhe', 'ehe', 'che', 'dhe', 'fhe', 'ghe', 'hhe', 'jhe', 'khe',
  // Short meaningless combinations
  'ack', 'eck', 'ick', 'ock', 'uck', 'ank', 'enk', 'ink', 'onk', 'unk',
  'ast', 'est', 'ist', 'ost', 'ust', 'aft', 'eft', 'ift', 'oft', 'uft',
]);

// Check if a word looks like a valid English word
function isValidEnglishWord(word: string): boolean {
  // Must be at least 3 characters (skip 2-letter words like "ey")
  if (word.length < 3) return false;

  // Must only contain letters
  if (!/^[a-zA-Z]+$/.test(word)) return false;

  // Must have at least one vowel
  if (!/[aeiou]/i.test(word)) return false;

  // Check against known garbage words
  if (GARBAGE_WORDS.has(word.toLowerCase())) return false;

  // Skip words that are just vowels or consonants repeated
  if (/^(.)\1+$/.test(word)) return false;

  // Skip words with too many consecutive consonants (likely OCR errors)
  if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(word)) return false;

  // Skip words with too many consecutive vowels (likely OCR errors)
  if (/[aeiou]{4,}/i.test(word)) return false;

  // Common OCR garbage patterns to skip
  if (/^[aeiou]{2,3}$/i.test(word)) return false;  // Just 2-3 vowels like "ey", "oa"
  if (/^[bcdfghjklmnpqrstvwxyz]{2,3}$/i.test(word)) return false;  // Just consonants

  // Skip words that look like suffixes/prefixes only
  if (/^(un|re|de|pre|pro|anti|dis|mis|non|sub|super|over|under|out|up|down|fore|post|mid|semi|self|co|ex|bi|tri|multi|poly|mono|uni|omni|pan|auto|pseudo|neo|proto|meta|para|ultra|infra|intra|inter|trans|extra|hyper|hypo)$/i.test(word)) return false;

  // Skip words that are just common suffixes
  if (/^(ing|tion|sion|ness|ment|able|ible|ful|less|ous|ive|al|ly|er|est|ed|en|ity|ty|ry|ary|ory|ery)$/i.test(word)) return false;

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
