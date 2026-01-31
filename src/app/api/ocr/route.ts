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

// ===========================================
// TWO-STEP OCR APPROACH
// Step 1: Extract all text with highlight markers (raw OCR)
// Step 2: Filter and refine for valid vocabulary
// ===========================================

// Step 1 Prompt: Raw OCR extraction with context
function buildStep1Prompt(mode: string, highlightColors?: string[]): string {
  let colorText = 'any color';
  if (mode === 'highlighted' && highlightColors && highlightColors.length > 0 && highlightColors.length < 5) {
    if (highlightColors.length === 1) {
      colorText = COLOR_NAMES[highlightColors[0]] || highlightColors[0].toUpperCase();
    } else {
      const colorNames = highlightColors.map(c => COLOR_NAMES[c] || c.toUpperCase());
      colorText = colorNames.slice(0, -1).join(', ') + ' or ' + colorNames[colorNames.length - 1];
    }
  }

  if (mode === 'highlighted') {
    return `You are an OCR assistant. Extract text from this image of an English learning worksheet.

YOUR TASK: Identify all text that is highlighted with ${colorText} HIGHLIGHTER PEN.

IMPORTANT - PRESERVE PHRASES:
- If multiple words are highlighted TOGETHER (e.g., "Thank you", "Good morning", "Little boy"), keep them as ONE phrase
- Look for words that share the same continuous highlight marking
- Common phrases to look for: "Thank you", "Good morning", "Good night", "How are you", "I love you", "Little boy", "Little girl", "Big dog", etc.

OUTPUT FORMAT (use exactly this format):
For each highlighted item, output on its own line:
[HIGHLIGHT] word or phrase here

Examples:
[HIGHLIGHT] Thank you
[HIGHLIGHT] beautiful
[HIGHLIGHT] Little boy
[HIGHLIGHT] apple

RULES:
1. Include ALL highlighted text, even if you're unsure about some words
2. Preserve multi-word phrases that are highlighted together
3. Include the exact text as you see it (we will filter later)
4. If nothing is highlighted, output: NO_HIGHLIGHTS_FOUND

Now extract all ${colorText} highlighted text from this image:`;
  }

  // Smart mode
  return `You are an OCR assistant. Extract text from this image of an English learning worksheet.

YOUR TASK: Identify vocabulary words and phrases that appear to be key learning content.

IMPORTANT - PRESERVE PHRASES:
- If words appear together as a phrase (e.g., "Thank you", "Good morning"), keep them as ONE phrase
- Look for common English phrases children learn
- Common phrases: "Thank you", "Good morning", "Good night", "How are you", "I love you", etc.

OUTPUT FORMAT (use exactly this format):
For each vocabulary item, output on its own line:
[VOCAB] word or phrase here

Mark items that appear emphasized (bold, larger, highlighted) with [EMPHASIS]:
[VOCAB][EMPHASIS] important word

Examples:
[VOCAB][EMPHASIS] Thank you
[VOCAB] beautiful
[VOCAB][EMPHASIS] Little boy
[VOCAB] apple

RULES:
1. Include vocabulary words that students would learn to spell
2. Preserve multi-word phrases
3. Include the exact text as you see it

Now extract vocabulary from this image:`;
}

// Step 2 Prompt: Filter and validate
function buildStep2Prompt(rawOcrOutput: string): string {
  return `You are a vocabulary filter for a Hong Kong kindergarten/primary school (ages 3-8) English spelling practice app.

I just ran OCR on a children's English worksheet. Here is the raw output:

---
${rawOcrOutput}
---

YOUR TASK: Filter this list to include ONLY valid vocabulary that primary school students should learn to spell.

FILTERING RULES:

1. KEEP these types of words/phrases:
   - Real English dictionary words: apple, banana, beautiful, elephant
   - Common phrases children learn: "Thank you", "Good morning", "I love you"
   - Compound terms: "ice cream", "hot dog", "birthday cake"
   - Action words: running, jumping, swimming
   - Descriptive words: happy, sad, beautiful, wonderful

2. REMOVE these:
   - OCR errors/nonsense: uit, ingi, artel, oria, tbe, wben, fos, pas
   - Word fragments: ing, tion, ness, ment
   - Function words alone: the, a, an, is, are, to, of, in
   - Single letters or very short fragments
   - Anything that is NOT a real English word or phrase

3. For phrases:
   - Keep meaningful phrases: "Thank you" ✓, "Good morning" ✓
   - Split if not a real phrase: "the apple" → just "apple"

OUTPUT FORMAT:
List each valid word or phrase on its own line, wrapped with ** like:
**apple**
**Thank you**
**beautiful**
**ice cream**

Maximum 25 items. Only include items you are CERTAIN are real English vocabulary.

If nothing valid remains, output: NO_VALID_VOCABULARY

Now filter the vocabulary:`;
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

    // ===========================================
    // STEP 1: Raw OCR extraction with context
    // ===========================================
    const step1Prompt = buildStep1Prompt(mode, highlightColors);

    console.log('[OCR] Step 1: Raw extraction...');
    const step1Response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://spelling-practice.vercel.app',
        'X-Title': 'Spelling Practice OCR - Step 1',
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
                  url: image,
                },
              },
              {
                type: 'text',
                text: step1Prompt,
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0,
      }),
    });

    if (!step1Response.ok) {
      const errorText = await step1Response.text();
      console.error('OpenRouter API error (Step 1):', step1Response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to process image', detail: errorText, useLocalOCR: true },
        { status: 500 }
      );
    }

    const step1Result = await step1Response.json();
    const rawOcrOutput = step1Result.choices?.[0]?.message?.content || '';

    console.log('[OCR] Step 1 raw output:', rawOcrOutput.substring(0, 500));

    // Check for no highlights found
    if (rawOcrOutput.includes('NO_HIGHLIGHTS_FOUND')) {
      return NextResponse.json({
        success: true,
        words: [],
        highlightedWords: [],
        rawText: rawOcrOutput,
        source: 'gemini-ocr',
      });
    }

    // ===========================================
    // STEP 2: Filter and validate vocabulary
    // ===========================================
    const step2Prompt = buildStep2Prompt(rawOcrOutput);

    console.log('[OCR] Step 2: Filtering vocabulary...');
    const step2Response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://spelling-practice.vercel.app',
        'X-Title': 'Spelling Practice OCR - Step 2',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: step2Prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0,
      }),
    });

    if (!step2Response.ok) {
      const errorText = await step2Response.text();
      console.error('OpenRouter API error (Step 2):', step2Response.status, errorText);
      // Fall back to parsing step 1 output directly
      const { words, highlightedWords } = parseOCRResponse(rawOcrOutput, mode);
      return NextResponse.json({
        success: true,
        words,
        highlightedWords,
        rawText: rawOcrOutput,
        source: 'gemini-ocr',
      });
    }

    const step2Result = await step2Response.json();
    const filteredOutput = step2Result.choices?.[0]?.message?.content || '';

    console.log('[OCR] Step 2 filtered output:', filteredOutput.substring(0, 500));

    // Check for no valid vocabulary
    if (filteredOutput.includes('NO_VALID_VOCABULARY')) {
      return NextResponse.json({
        success: true,
        words: [],
        highlightedWords: [],
        rawText: `Step 1:\n${rawOcrOutput}\n\nStep 2:\n${filteredOutput}`,
        source: 'gemini-ocr',
      });
    }

    // Parse the final filtered output
    const { words, highlightedWords } = parseOCRResponse(filteredOutput, mode);

    return NextResponse.json({
      success: true,
      words,
      highlightedWords,
      rawText: `Step 1:\n${rawOcrOutput}\n\nStep 2:\n${filteredOutput}`,
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
  // Known OCR errors from testing
  'uit', 'ingi', 'artel', 'oria', 'pas', 'fos', 'lol',
  // OCR artifacts - 'h' misread as 'b' or 'li'
  'tbe', 'wben', 'bave', 'tben', 'witb', 'tbat', 'tbis', 'wbat', 'wbich',
  'tbing', 'notbing', 'sometbing', 'tlie', 'liave', 'wlien', 'tliat',
  'tliis', 'wliat', 'wliich',
  // Word fragments / suffixes / prefixes alone
  'ing', 'tion', 'sion', 'ness', 'ment', 'ful', 'less', 'able', 'ible',
  'ous', 'ive', 'ary', 'ory', 'ery', 'ity',
  'pre', 'pro', 'con', 'dis', 'mis', 'non', 'sub', 'super',
  // Internet slang (not suitable for kids)
  'lmao', 'omg', 'wtf', 'btw', 'idk', 'imo', 'tbh', 'smh', 'fyi',
  // Random letter combinations
  'aaa', 'bbb', 'ccc', 'ddd', 'eee', 'fff', 'ggg', 'hhh', 'iii',
  'jjj', 'kkk', 'lll', 'mmm', 'nnn', 'ooo', 'ppp', 'qqq', 'rrr',
  'sss', 'ttt', 'uuu', 'vvv', 'www', 'xxx', 'yyy', 'zzz',
  // Other common OCR misreads
  'rhe', 'ehe', 'che', 'dhe', 'fhe', 'ghe', 'hhe', 'jhe', 'khe',
  // Short meaningless combinations
  'ack', 'eck', 'ick', 'ock', 'uck', 'ank', 'enk', 'onk', 'unk',
  'ast', 'est', 'ist', 'ost', 'ust', 'aft', 'eft', 'ift', 'oft', 'uft',
  // Other gibberish
  'ght', 'nge', 'ple', 'ble', 'dle', 'tle', 'gle', 'fle', 'sle',
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

// Parse the OCR response to extract words/phrases and highlighted items
function parseOCRResponse(text: string, mode: string): { words: string[]; highlightedWords: string[] } {
  const words: string[] = [];
  const highlightedWords: string[] = [];
  const seen = new Set<string>();

  // Log raw response for debugging
  console.log('[OCR] Parsing response:', text.substring(0, 300));

  // Split by lines and process each
  const lines = text.split(/[\n\r]+/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip explanatory text
    if (trimmed.startsWith('#')) continue;
    if (trimmed.toLowerCase().includes('no valid') || trimmed.toLowerCase().includes('no highlight')) continue;

    // Check for markers from our two-step process
    const isHighlightMarked = trimmed.includes('[HIGHLIGHT]') || trimmed.includes('[EMPHASIS]');
    const isVocabMarked = trimmed.includes('[VOCAB]');
    const isStarMarked = trimmed.startsWith('**') && trimmed.endsWith('**');

    // Extract the phrase/word
    let phrase = trimmed;

    // Remove markers
    phrase = phrase.replace(/\[HIGHLIGHT\]/gi, '');
    phrase = phrase.replace(/\[VOCAB\]/gi, '');
    phrase = phrase.replace(/\[EMPHASIS\]/gi, '');
    phrase = phrase.replace(/^\*\*|\*\*$/g, '');
    phrase = phrase.trim();

    // Remove list markers like "1.", "•", "-" at the start
    phrase = phrase.replace(/^[\d\.\-\•\*]+\s*/, '');

    // Clean up: remove leading/trailing punctuation but preserve internal spaces for phrases
    phrase = phrase.replace(/^[^a-zA-Z]+/, '').replace(/[^a-zA-Z]+$/, '');

    // Skip if empty or too short
    if (!phrase || phrase.length < 2) continue;

    // Normalize: lowercase for comparison
    const normalizedPhrase = phrase.toLowerCase();

    // Skip if already seen
    if (seen.has(normalizedPhrase)) continue;

    // Validate: for single words, use isValidEnglishWord
    // For phrases (contains space), do basic validation
    const wordCount = phrase.split(/\s+/).length;

    if (wordCount === 1) {
      // Single word validation
      if (!isValidEnglishWord(phrase)) continue;
    } else {
      // Multi-word phrase validation
      // Check if it looks like a valid phrase (each word should have letters)
      const phraseWords = phrase.split(/\s+/);
      const allWordsValid = phraseWords.every(w => /^[a-zA-Z]+$/.test(w) && w.length >= 1);
      if (!allWordsValid) continue;

      // Skip if phrase is too long (more than 4 words is likely a sentence)
      if (wordCount > 4) continue;
    }

    seen.add(normalizedPhrase);
    words.push(phrase.toLowerCase());

    // Determine if highlighted
    if (mode === 'highlighted' || isHighlightMarked || isStarMarked) {
      highlightedWords.push(phrase.toLowerCase());
    } else if (isVocabMarked) {
      // In smart mode, vocab items are added but not necessarily highlighted
      // unless they also have emphasis
      if (trimmed.includes('[EMPHASIS]')) {
        highlightedWords.push(phrase.toLowerCase());
      }
    }
  }

  console.log('[OCR] Parsed words:', words.length, 'Highlighted:', highlightedWords.length);
  console.log('[OCR] Words:', words.slice(0, 10));

  return { words, highlightedWords };
}
