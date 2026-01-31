import { NextRequest, NextResponse } from 'next/server';

// OpenRouter API endpoint (OpenAI-compatible)
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Gemini 2.5 Flash - more capable vision model (~$0.25/1M input tokens)
// Upgraded from Flash Lite for better vocabulary extraction accuracy
const MODEL = 'google/gemini-2.5-flash-preview-05-20';

// Color name mapping for prompts
const COLOR_NAMES: Record<string, string> = {
  yellow: 'YELLOW',
  pink: 'PINK/MAGENTA',
  green: 'GREEN',
  blue: 'BLUE',
  orange: 'ORANGE',
};

// ===========================================
// SINGLE-STEP APPROACH: One prompt does everything
// Gemini reads image → identifies highlights → outputs only valid vocabulary
// ===========================================

function buildPrompt(mode: string, highlightColors?: string[]): string {
  // Build color description for Chinese prompt
  let colorDesc = '任何顏色';
  if (mode === 'highlighted' && highlightColors && highlightColors.length > 0 && highlightColors.length < 5) {
    const colorMap: Record<string, string> = {
      yellow: '黃色',
      pink: '粉紅色',
      green: '綠色',
      blue: '藍色',
      orange: '橙色',
    };
    const colors = highlightColors.map(c => colorMap[c] || c);
    colorDesc = colors.join('或');
  }

  if (mode === 'highlighted') {
    // Simple Chinese prompt - like what worked with Grok
    return `這是一張香港幼稚園及小學生學習英文的教科書或工作紙照片。

請幫我從這張照片中，將所有用${colorDesc}螢光筆highlight的英文字詞提取出來。

這些內容可能是單字（如 apple, beautiful）或詞語/句子（如 "Good morning", "Thank you"）。

請逐行列出每個highlight的字詞，每行一個。只需要列出字詞本身，不需要任何解釋或編號。

如果找不到任何highlight的字詞，請回覆：NO_WORDS_FOUND`;
  }

  // Smart mode - AI picks vocabulary
  return `這是一張香港幼稚園及小學生學習英文的教科書或工作紙照片。

請幫我識別這張照片中的重要英文生字和詞語。

重點找出：
- 粗體、放大、或特別標示的字詞
- 生字表或詞彙框內的字詞
- 課文中的關鍵詞彙

這些可能是單字（如 apple, beautiful）或詞語/句子（如 "Good morning", "Thank you"）。

請逐行列出每個字詞，每行一個。只需要列出字詞本身，不需要任何解釋或編號。最多20個。

如果找不到適合的字詞，請回覆：NO_WORDS_FOUND`;
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

    // Single-step: Gemini does OCR + filtering in one go
    const prompt = buildPrompt(mode, highlightColors);

    console.log('[OCR] Calling Gemini with mode:', mode);
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

    console.log('[OCR] Gemini output:', rawOutput);

    // Check for no words found
    if (rawOutput.includes('NO_WORDS_FOUND')) {
      return NextResponse.json({
        success: true,
        words: [],
        highlightedWords: [],
        rawText: rawOutput,
        source: 'gemini-ocr',
      });
    }

    // Parse the simple line-by-line output
    const { words, highlightedWords } = parseSimpleOutput(rawOutput, mode);

    return NextResponse.json({
      success: true,
      words,
      highlightedWords,
      rawText: rawOutput,
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

// Parse simple line-by-line output from Gemini
function parseSimpleOutput(text: string, mode: string): { words: string[]; highlightedWords: string[] } {
  const words: string[] = [];
  const seen = new Set<string>();

  // Split by lines
  const lines = text.split(/[\n\r]+/);

  for (const line of lines) {
    let phrase = line.trim();
    if (!phrase) continue;

    // Skip if it looks like instructions or explanations
    if (phrase.includes(':') && phrase.length > 30) continue;
    if (phrase.toLowerCase().includes('no_words') || phrase.toLowerCase().includes('no words')) continue;
    if (phrase.startsWith('#') || phrase.startsWith('*')) continue;

    // Remove common prefixes like "- ", "• ", "1. "
    phrase = phrase.replace(/^[\-\•\*\d\.]+\s*/, '');

    // Remove any remaining non-letter characters at start/end
    phrase = phrase.replace(/^[^a-zA-Z]+/, '').replace(/[^a-zA-Z\s]+$/, '');

    // Clean internal spaces (normalize multiple spaces)
    phrase = phrase.replace(/\s+/g, ' ').trim();

    if (!phrase || phrase.length < 2) continue;

    // Normalize to lowercase for deduplication
    const normalized = phrase.toLowerCase();
    if (seen.has(normalized)) continue;

    // Basic validation: must contain letters, not too long
    if (!/[a-zA-Z]/.test(phrase)) continue;
    if (phrase.split(/\s+/).length > 4) continue; // Max 4 words

    // Skip known garbage words (backup filter)
    if (GARBAGE_WORDS.has(normalized)) continue;

    seen.add(normalized);
    words.push(normalized);
  }

  console.log('[OCR] Parsed words:', words);

  // In highlighted mode, all words are considered highlighted
  // In smart mode, all words are vocabulary
  return {
    words,
    highlightedWords: mode === 'highlighted' ? words : [],
  };
}
