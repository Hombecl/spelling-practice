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

TASK: Analyze the image and provide TWO sections of output.

=== SECTION 1: HIGHLIGHTED TEXT ===
Find ALL text that has been physically marked with a ${colorDesc} HIGHLIGHTER PEN.

WHAT HIGHLIGHTER MARKS LOOK LIKE:
- A semi-transparent colored stripe/band going THROUGH the text
- The color (${colorDesc}) appears as a background behind the black text
- The highlight may be messy, uneven, or partially covering words

RULES FOR HIGHLIGHTED TEXT:
1. ONLY report text with VISIBLE highlighter marks
2. PRESERVE PHRASES: If multiple words are highlighted together → output as ONE phrase
3. Each separate highlighter stroke = one output line
4. When in doubt, include it (better to include than miss)

=== SECTION 2: ALL VOCABULARY ===
List ALL English vocabulary words/phrases visible on the page that could be useful for spelling practice.
(This helps parents verify nothing was missed)

OUTPUT FORMAT (use this exact format):
---HIGHLIGHTED---
[list highlighted words/phrases, one per line]
---ALL_VOCABULARY---
[list all vocabulary words/phrases, one per line]
---END---

RULES:
- No bullets, numbers, or explanations
- No Chinese text
- If no highlighted text found, write NO_WORDS_FOUND under ---HIGHLIGHTED---
- Include names like "Henry", "Gloria", "The Fairies" if they appear highlighted`;
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
): Promise<{ words: string[]; allVocabulary?: string[]; rawOutput: string; error?: string }> {
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

    // Parse the structured output
    const { highlighted, allVocabulary } = parseStructuredOutput(rawOutput);

    return { words: highlighted, allVocabulary, rawOutput };
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

// Parse the new structured AI output with sections
function parseStructuredOutput(text: string): { highlighted: string[]; allVocabulary: string[] } {
  const highlighted: string[] = [];
  const allVocabulary: string[] = [];

  // Check if it's the new structured format
  if (text.includes('---HIGHLIGHTED---') && text.includes('---ALL_VOCABULARY---')) {
    const highlightedMatch = text.match(/---HIGHLIGHTED---\s*([\s\S]*?)---ALL_VOCABULARY---/);
    const allVocabMatch = text.match(/---ALL_VOCABULARY---\s*([\s\S]*?)(?:---END---|$)/);

    if (highlightedMatch) {
      const highlightedText = highlightedMatch[1].trim();
      if (!highlightedText.includes('NO_WORDS_FOUND')) {
        highlighted.push(...parseWordList(highlightedText));
      }
    }

    if (allVocabMatch) {
      const allVocabText = allVocabMatch[1].trim();
      allVocabulary.push(...parseWordList(allVocabText));
    }
  } else {
    // Fallback: treat entire output as highlighted words (old format)
    if (!text.includes('NO_WORDS_FOUND')) {
      highlighted.push(...parseWordList(text));
    }
  }

  return { highlighted, allVocabulary };
}

// Parse a list of words/phrases from text
function parseWordList(text: string): string[] {
  const words: string[] = [];
  const seen = new Set<string>();

  if (!text || text.includes('NO_WORDS_FOUND')) {
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

  console.log('[OCR] Parsed words/phrases:', words);
  return words;
}

// Legacy function for backward compatibility
function parseAIOutput(text: string, _phraseMode: boolean = false): string[] {
  const { highlighted } = parseStructuredOutput(text);
  return highlighted;
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

    // For highlighted mode, also include all vocabulary for parent to verify
    const allVocabItems = (result.allVocabulary || []).map(word => ({
      text: word,
      isPhrase: word.includes(' '),
      isHighlighted: result.words.some(hw => hw.toLowerCase() === word.toLowerCase()),
    }));

    const finalResponse = {
      success: true,
      words: result.words,
      items: items, // Structured items with phrase info
      allVocabulary: result.allVocabulary || [], // All vocab for verification
      allVocabItems: allVocabItems, // Structured with highlight status
      highlightedWords: mode === 'highlighted' ? result.words : [],
      rawText: `[Gemini 3 Flash Vision - ${mode} mode]\n\nHighlighted: ${result.words.length} items\nAll vocabulary: ${(result.allVocabulary || []).length} items\n\n${result.rawOutput}`,
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
