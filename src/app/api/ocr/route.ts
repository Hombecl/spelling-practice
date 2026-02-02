import { NextRequest, NextResponse } from 'next/server';

// OpenRouter API endpoint (OpenAI-compatible)
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Gemini 2.0 Flash - Google's latest vision model with good highlight understanding
// Using Gemini because OpenAI models may have issues with base64 images on OpenRouter
const MODEL = 'google/gemini-2.0-flash-001';

// Fallback model
const FALLBACK_MODEL = 'google/gemini-2.5-flash-preview-05-20';

// ===========================================
// GPT-4o APPROACH: Strong visual understanding
// GPT-4o can understand "highlighted text" as a visual concept
// ===========================================

function buildPrompt(mode: string, highlightColors?: string[]): string {
  // Build color description
  let colorDesc = 'any color';
  let colorDescZh = '任何顏色';

  if (mode === 'highlighted' && highlightColors && highlightColors.length > 0 && highlightColors.length < 5) {
    const colorMapEn: Record<string, string> = {
      yellow: 'yellow',
      pink: 'pink/magenta',
      green: 'green',
      blue: 'blue',
      orange: 'orange',
    };
    const colorMapZh: Record<string, string> = {
      yellow: '黃色',
      pink: '粉紅色',
      green: '綠色',
      blue: '藍色',
      orange: '橙色',
    };
    colorDesc = highlightColors.map(c => colorMapEn[c] || c).join(' or ');
    colorDescZh = highlightColors.map(c => colorMapZh[c] || c).join('或');
  }

  if (mode === 'highlighted') {
    // Strong prompt to prevent raw OCR - emphasize visual highlight detection
    return `⚠️ CRITICAL: This is NOT an OCR task. Do NOT transcribe all text from the image.

You are analyzing a photo of a Hong Kong primary school English textbook page.

YOUR ONLY TASK: Find words that have been marked with a ${colorDesc} HIGHLIGHTER PEN by a student.

WHAT A HIGHLIGHTER MARK LOOKS LIKE:
- A semi-transparent colored stripe (${colorDesc}) drawn OVER the text
- The colored mark was added BY HAND with a highlighter marker
- It's NOT printed formatting - it's a physical highlighter mark on paper

WHAT TO IGNORE (DO NOT EXTRACT):
❌ Regular printed text (even if bold or colorful)
❌ Text in colored boxes or banners (these are printed, not highlighted)
❌ Headers, titles, page numbers
❌ Instructions or dialogue text
❌ ANY text without a visible highlighter mark over it

OUTPUT RULES:
- ONLY list words/phrases with visible highlighter marks
- One word or phrase per line
- No bullets, numbers, or explanations
- If you see NO highlighter marks, respond with exactly: NO_WORDS_FOUND

REMEMBER: Most of the text on this page is NOT highlighted. Only extract the few words (if any) that have a ${colorDesc} highlighter mark drawn over them.`;
  }

  // Smart mode - AI picks vocabulary (but still not raw OCR)
  return `⚠️ CRITICAL: This is NOT an OCR task. Do NOT transcribe all text from the image.

You are analyzing a photo of a Hong Kong primary school English textbook page.

YOUR TASK: Identify the KEY VOCABULARY WORDS that a student should learn from this page.

WHAT TO LOOK FOR:
- Words that are BOLD or in a LARGER font
- Words inside vocabulary boxes or word lists
- Key nouns, verbs, and adjectives that are emphasized
- Target vocabulary that the lesson is teaching

WHAT TO IGNORE (DO NOT EXTRACT):
❌ Common words (the, is, a, to, and, in, on, at, etc.)
❌ Headers, page numbers, publisher names
❌ Instructions or question text
❌ Random text from the page

OUTPUT RULES:
- List only important vocabulary words (max 15-20 words)
- One word or phrase per line
- No bullets, numbers, or explanations
- If no clear vocabulary words found, respond with: NO_WORDS_FOUND

REMEMBER: Extract ONLY key vocabulary, not all text on the page.`;
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

    const prompt = buildPrompt(mode, highlightColors);

    console.log('[OCR] Calling Gemini 2.0 Flash with mode:', mode);

    // Try GPT-4o first
    let response = await fetch(OPENROUTER_API_URL, {
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
                  url: image,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0,
      }),
    });

    let modelUsed = MODEL;
    let fallbackReason = '';

    // If GPT-4o fails, try fallback
    if (!response.ok) {
      fallbackReason = `Gemini 2.0 Flash failed with status ${response.status}`;
      console.log('[OCR] Gemini 2.0 Flash failed, trying fallback model:', response.status);
      response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://spelling-practice.vercel.app',
          'X-Title': 'Spelling Practice OCR',
        },
        body: JSON.stringify({
          model: FALLBACK_MODEL,
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
                  text: prompt,
                },
              ],
            },
          ],
          max_tokens: 1000,
          temperature: 0,
        }),
      });
      modelUsed = FALLBACK_MODEL;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to process image', detail: errorText, useLocalOCR: true },
        { status: 500 }
      );
    }

    const result = await response.json();
    const rawOutput = result.choices?.[0]?.message?.content || '';

    console.log(`[OCR] ${modelUsed} output:`, rawOutput);

    // Check for no words found
    if (rawOutput.includes('NO_WORDS_FOUND')) {
      return NextResponse.json({
        success: true,
        words: [],
        highlightedWords: [],
        rawText: rawOutput,
        source: modelUsed === MODEL ? 'gemini2-ocr' : 'gemini-fallback-ocr',
        modelUsed,
        fallbackReason: fallbackReason || undefined,
      });
    }

    // Parse the simple line-by-line output
    const { words, highlightedWords } = parseSimpleOutput(rawOutput, mode);

    return NextResponse.json({
      success: true,
      words,
      highlightedWords,
      rawText: rawOutput,
      source: modelUsed === MODEL ? 'gemini2-ocr' : 'gemini-fallback-ocr',
      modelUsed,
      fallbackReason: fallbackReason || undefined,
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

// Parse output - handles both single words and full phrases/sentences
function parseSimpleOutput(text: string, mode: string): { words: string[]; highlightedWords: string[] } {
  const words: string[] = [];
  const seen = new Set<string>();

  // Split by lines
  const lines = text.split(/[\n\r]+/);

  for (const line of lines) {
    let phrase = line.trim();
    if (!phrase) continue;

    // Skip obvious non-content lines
    if (phrase.toLowerCase().includes('no_words') || phrase.toLowerCase().includes('no words')) continue;
    if (phrase.toLowerCase().includes('找不到') || phrase.toLowerCase().includes('沒有')) continue;
    if (phrase.toLowerCase().includes('not found') || phrase.toLowerCase().includes('no highlighted')) continue;

    // Skip section headers (e.g., "From Section 3:", "Highlighted Words:")
    if (/^(from|section|highlighted|additional|song|lyrics|note|output)[\s\w]*:/i.test(phrase)) continue;
    if (phrase.startsWith('#')) continue;

    // Skip explanatory text
    if (phrase.toLowerCase().startsWith('the image') || phrase.toLowerCase().startsWith('i can see')) continue;
    if (phrase.toLowerCase().startsWith('there are') || phrase.toLowerCase().startsWith('these are')) continue;

    // Remove bullet points and numbering prefixes
    phrase = phrase.replace(/^[\-\•\*]+\s*/, '');
    phrase = phrase.replace(/^\d+[\.\)]\s*/, '');

    // Remove surrounding quotes if present (keep content inside)
    phrase = phrase.replace(/^["'""](.+)["'""]$/, '$1');

    // Clean internal spaces
    phrase = phrase.replace(/\s+/g, ' ').trim();

    if (!phrase || phrase.length < 2) continue;

    // Must contain at least one English letter
    if (!/[a-zA-Z]/.test(phrase)) continue;

    // Skip if it's mostly Chinese (allow mixed content like explanations to be filtered)
    const chineseChars = (phrase.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishChars = (phrase.match(/[a-zA-Z]/g) || []).length;
    if (chineseChars > englishChars) continue;

    // Normalize for deduplication (lowercase, trim punctuation for comparison)
    const normalized = phrase.toLowerCase().replace(/[^\w\s]/g, '').trim();
    if (seen.has(normalized)) continue;
    if (!normalized) continue;

    // Skip single garbage words (but allow phrases)
    const wordCount = phrase.split(/\s+/).length;
    if (wordCount === 1 && GARBAGE_WORDS.has(normalized)) continue;

    seen.add(normalized);

    // Keep the original phrase with proper casing and punctuation for display
    // But clean up any leading/trailing punctuation
    let cleaned = phrase.replace(/^[^\w]+/, '').replace(/[^\w!?.]+$/, '');
    // Capitalize first letter
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

    words.push(cleaned);
  }

  console.log('[OCR] Parsed words:', words);

  return {
    words,
    highlightedWords: mode === 'highlighted' ? words : [],
  };
}
