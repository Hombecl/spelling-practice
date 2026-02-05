import { NextRequest, NextResponse } from 'next/server';

// ===========================================
// GEMINI VISION OCR APPROACH:
// Use Gemini 2.0 Flash to directly analyze the image
// - Can see highlighter colors
// - Can understand context
// - Returns vocabulary words directly
// ===========================================

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Use Gemini 3 Flash Preview for vision (most advanced, best at visual understanding)
const AI_MODEL = 'google/gemini-3-flash-preview';

// Build prompt for Gemini Vision to analyze the image directly
function buildVisionPrompt(mode: string, highlightColors?: string[], phraseMode?: boolean): string {
  let colorDesc = 'any color';

  if (mode === 'highlighted' && highlightColors && highlightColors.length > 0 && highlightColors.length < 5) {
    const colorMapEn: Record<string, string> = {
      yellow: 'yellow',
      pink: 'pink/magenta',
      green: 'green',
      blue: 'blue',
      orange: 'orange',
    };
    colorDesc = highlightColors.map(c => colorMapEn[c] || c).join(' or ');
  }

  // Always preserve phrases - we'll let the UI handle splitting if needed
  if (mode === 'highlighted') {
    return `You are a visual analyzer looking at a photo of an English textbook page.

CRITICAL TASK: Find ALL text that has been physically marked with a ${colorDesc} HIGHLIGHTER PEN.

WHAT HIGHLIGHTER MARKS LOOK LIKE:
- A semi-transparent colored stripe/band going THROUGH the text
- The color (${colorDesc}) appears as a background behind the black text
- Like someone used a real highlighter marker to draw over words
- The highlight may be messy, uneven, or partially covering words

⚠️ VERY IMPORTANT RULES:
1. Do NOT guess vocabulary words. ONLY report text with VISIBLE highlighter marks.
2. PRESERVE PHRASES: If multiple words are highlighted together in ONE continuous mark, output them as ONE phrase.
   - Example: If "beautiful flower" is highlighted with one stroke → output "beautiful flower"
   - Example: If "thank you" is highlighted together → output "thank you"
   - Example: If "food" and "drinks" are highlighted separately → output them as separate items
3. Look for EACH separate highlighter stroke. Each stroke = one output line.

HOW TO DECIDE IF IT'S ONE PHRASE OR SEPARATE WORDS:
- If the highlighter mark is ONE continuous band covering multiple words → ONE phrase
- If there are separate/distinct highlighter marks on different words → separate items
- When in doubt, preserve as phrase (better to keep together than split wrongly)

OUTPUT FORMAT:
- One highlighted item per line (can be single word OR phrase)
- No bullets, numbers, or explanations
- No Chinese text
- Preserve the EXACT text that is highlighted

If you cannot see any ${colorDesc} highlighter marks on any text, respond with exactly: NO_WORDS_FOUND`;
  }

  // Smart mode - AI picks vocabulary (preserve meaningful phrases)
  return `You are looking at a photo of a Hong Kong primary school English textbook page.

YOUR TASK: Identify KEY VOCABULARY for spelling practice.

WHAT TO LOOK FOR:
- Important nouns, verbs, adjectives
- Common phrases that should be learned together (e.g., "thank you", "excuse me", "good morning")
- Words/phrases suitable for primary school (age 6-12)

WHAT TO IGNORE:
❌ Common words alone: the, is, a, an, to, and, in, on, at, of, for, with
❌ Pronouns alone: I, you, he, she, it, we, they
❌ Page numbers, headers, Chinese text

PHRASE RULES - VERY IMPORTANT:
Keep these types of phrases together (DO NOT split):
- Greetings: "thank you", "good morning", "excuse me", "how are you"
- Verb phrases: "is flying", "are singing", "do not harm"
- Noun phrases: "beautiful flower", "little girl", "good things"
- Fixed expressions: "look at", "listen to", "a lot of"

OUTPUT FORMAT:
- One item per line (single word OR phrase)
- No bullets, numbers, or explanations
- Maximum 20 items
- If no clear vocabulary, respond with: NO_WORDS_FOUND`;
}

// Call Gemini Vision to analyze the image directly
async function callGeminiVision(
  imageBase64: string,
  mode: string,
  highlightColors: string[] | undefined,
  phraseMode: boolean,
  apiKey: string
): Promise<{ words: string[]; rawOutput: string; error?: string }> {
  try {
    const prompt = buildVisionPrompt(mode, highlightColors, phraseMode);

    console.log('[OCR] Calling Gemini Vision...');
    console.log('[OCR] Mode:', mode, '| Phrase mode:', phraseMode);

    // Prepare the image for Gemini (needs to be in the content array)
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://spelling-practice.vercel.app',
        'X-Title': 'Spelling Practice OCR',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
        max_tokens: 800,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OCR] Gemini Vision API error:', response.status, errorText);
      return { words: [], rawOutput: '', error: `Gemini Vision API error: ${response.status}` };
    }

    const result = await response.json();
    const rawOutput = result.choices?.[0]?.message?.content || '';

    console.log('[OCR] Gemini Vision raw output:', rawOutput);

    // Parse the output
    const words = parseAIOutput(rawOutput, phraseMode);

    return { words, rawOutput };
  } catch (error) {
    console.error('[OCR] Gemini Vision API error:', error);
    return { words: [], rawOutput: '', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Common phrases that should NEVER be split (for spelling practice)
const UNSPLITTABLE_PHRASES = new Set([
  'thank you', 'excuse me', 'good morning', 'good afternoon', 'good evening',
  'good night', 'good bye', 'how are you', 'nice to meet you', 'see you',
  'of course', 'a lot', 'a lot of', 'lots of', 'kind of', 'sort of',
  'look at', 'listen to', 'wait for', 'ask for', 'look for',
  'wake up', 'get up', 'sit down', 'stand up', 'come in', 'go out',
  'turn on', 'turn off', 'put on', 'take off', 'pick up', 'put down',
  'do not', 'does not', 'did not', 'will not', 'would not', 'could not',
  'don\'t', 'doesn\'t', 'didn\'t', 'won\'t', 'wouldn\'t', 'couldn\'t',
  'i\'m', 'you\'re', 'he\'s', 'she\'s', 'it\'s', 'we\'re', 'they\'re',
  'i am', 'you are', 'he is', 'she is', 'it is', 'we are', 'they are',
]);

// Parse AI output to extract words/phrases
function parseAIOutput(text: string, _phraseMode: boolean = false): string[] {
  const words: string[] = [];
  const seen = new Set<string>();

  // Check for no words found
  if (text.includes('NO_WORDS_FOUND')) {
    return [];
  }

  const lines = text.split(/[\n\r]+/);

  for (const line of lines) {
    let word = line.trim();
    if (!word) continue;

    // Remove bullet points and numbering
    word = word.replace(/^[\-\•\*]+\s*/, '');
    word = word.replace(/^\d+[\.\)]\s*/, '');
    word = word.replace(/^["'""](.+)["'""]$/, '$1');
    word = word.trim();

    if (!word || word.length < 2) continue;

    // Must be English letters (allow spaces for phrases, allow apostrophes for contractions)
    if (!/^[a-zA-Z\s']+$/.test(word)) continue;

    // Skip if it's just common words (for single words only)
    const commonWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
      'of', 'to', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'up',
      'about', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'under', 'again', 'further', 'then', 'once',
      'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
      'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just',
      'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves',
      'you', 'your', 'yours', 'yourself', 'yourselves',
      'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
      'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
      'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
      'am', 'if', 'no', 'yes', 'as', 'all', 'any', 'each', 'every',
    ]);

    const wordLower = word.toLowerCase();

    // For single words, skip common words
    // For phrases, allow them (phrases like "is flying" are OK)
    if (!word.includes(' ') && commonWords.has(wordLower)) continue;

    // Normalize for deduplication
    const normalized = wordLower.replace(/\s+/g, ' ');
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    // Format: capitalize first letter of each word
    const cleaned = word
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    words.push(cleaned);
  }

  console.log('[OCR] Parsed vocabulary words/phrases:', words);
  return words;
}

export async function POST(request: NextRequest) {
  console.log('[OCR] ========== NEW OCR REQUEST ==========');
  console.log('[OCR] API Version: Gemini 3 Flash Preview (v4)');

  try {
    const { image, mode = 'smart', highlightColors, phraseMode = false } = await request.json();
    console.log('[OCR] Mode:', mode, '| Highlight colors:', highlightColors, '| Phrase mode:', phraseMode);

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const openrouterApiKey = process.env.OPENROUTER_API_KEY;

    if (!openrouterApiKey) {
      console.error('[OCR] OPENROUTER_API_KEY not configured');
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY not configured', useLocalOCR: true },
        { status: 500 }
      );
    }

    // Call Gemini Vision directly with the image
    const result = await callGeminiVision(
      image,
      mode,
      highlightColors,
      phraseMode,
      openrouterApiKey
    );

    if (result.error) {
      return NextResponse.json({
        success: false,
        words: [],
        highlightedWords: [],
        rawText: `[Gemini Vision Error]\n${result.error}`,
        source: 'gemini-vision',
        error: result.error,
      });
    }

    // Mark which items are phrases vs single words
    const items = result.words.map(word => ({
      text: word,
      isPhrase: word.includes(' '),
      canSplit: word.includes(' ') && !UNSPLITTABLE_PHRASES.has(word.toLowerCase()),
    }));

    const finalResponse = {
      success: true,
      words: result.words,
      items: items, // New: structured items with phrase info
      highlightedWords: mode === 'highlighted' ? result.words : [],
      rawText: `[Gemini 3 Flash Vision - ${mode} mode]\n\n${result.rawOutput}`,
      source: 'gemini-vision',
      modelUsed: AI_MODEL,
    };

    console.log('[OCR] ========== SUCCESS ==========');
    console.log('[OCR] Words found:', result.words.length);
    console.log('[OCR] Response source:', finalResponse.source);

    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error('[OCR] API error:', error);
    return NextResponse.json(
      { error: 'OCR processing failed', useLocalOCR: true },
      { status: 500 }
    );
  }
}
