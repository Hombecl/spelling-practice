import { NextRequest, NextResponse } from 'next/server';

// ===========================================
// TWO-STEP OCR APPROACH:
// 1. Google Cloud Vision API - accurate OCR with word positions
// 2. AI (via OpenRouter) - understand which words are highlighted
// ===========================================

const GOOGLE_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Use GPT-4o-mini for highlight analysis (good at following instructions)
const AI_MODEL = 'openai/gpt-4o-mini';

// Build prompt for AI to identify highlighted words from OCR text
function buildHighlightAnalysisPrompt(ocrText: string, mode: string, highlightColors?: string[]): string {
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

  if (mode === 'highlighted') {
    return `You are analyzing OCR text extracted from a photo of a Hong Kong primary school English textbook page.

The student has marked some words with a ${colorDesc} HIGHLIGHTER PEN for spelling practice.

Here is ALL the text from the page (from OCR):
---
${ocrText}
---

YOUR TASK: From the OCR text above, identify which English words are likely the KEY VOCABULARY WORDS that a student would highlight for spelling practice.

WHAT TO LOOK FOR:
- Nouns (things, animals, people, places)
- Verbs (action words)
- Adjectives (describing words)
- Words that appear in vocabulary lists or are emphasized
- Words that are suitable for primary school spelling practice

WHAT TO IGNORE:
❌ Common words: the, is, a, an, to, and, in, on, at, of, for, with, etc.
❌ Pronouns: I, you, he, she, it, we, they, my, your, etc.
❌ Question words in instructions: what, where, when, how, why
❌ Page numbers, headers, publisher names
❌ Chinese text
❌ Single letters or gibberish

OUTPUT RULES:
- List ONLY the vocabulary words (max 15-20 words)
- One word per line
- No bullets, numbers, or explanations
- If no suitable vocabulary words found, respond with: NO_WORDS_FOUND`;
  }

  // Smart mode - AI picks vocabulary
  return `You are analyzing OCR text extracted from a photo of a Hong Kong primary school English textbook page.

Here is ALL the text from the page (from OCR):
---
${ocrText}
---

YOUR TASK: Identify the KEY VOCABULARY WORDS that a student should learn from this page.

WHAT TO LOOK FOR:
- Important nouns (things, animals, people, places)
- Action verbs
- Descriptive adjectives
- Words that appear multiple times or seem emphasized
- Words suitable for primary school spelling practice (age 6-12)

WHAT TO IGNORE:
❌ Common words: the, is, a, an, to, and, in, on, at, of, for, with, etc.
❌ Pronouns: I, you, he, she, it, we, they, my, your, etc.
❌ Question words: what, where, when, how, why
❌ Page numbers, headers, instructions
❌ Chinese text
❌ Single letters or OCR errors

OUTPUT RULES:
- List only important vocabulary words (max 15-20 words)
- One word per line
- No bullets, numbers, or explanations
- If no clear vocabulary words found, respond with: NO_WORDS_FOUND`;
}

// Call Google Cloud Vision API for OCR
async function callGoogleVisionOCR(imageBase64: string, apiKey: string): Promise<{ text: string; error?: string }> {
  try {
    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const requestBody = {
      requests: [
        {
          image: {
            content: base64Data,
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1,
            },
          ],
          imageContext: {
            languageHints: ['en', 'zh'],
          },
        },
      ],
    };

    console.log('[OCR] Calling Google Cloud Vision API...');

    const response = await fetch(`${GOOGLE_VISION_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OCR] Google Vision API error:', response.status, errorText);
      return { text: '', error: `Google Vision API error: ${response.status}` };
    }

    const result = await response.json();

    // Extract full text from response
    const textAnnotations = result.responses?.[0]?.textAnnotations;
    if (!textAnnotations || textAnnotations.length === 0) {
      console.log('[OCR] No text found in image');
      return { text: '', error: 'No text found in image' };
    }

    // First annotation contains the full text
    const fullText = textAnnotations[0].description || '';
    console.log('[OCR] Google Vision extracted text length:', fullText.length);

    return { text: fullText };
  } catch (error) {
    console.error('[OCR] Google Vision API error:', error);
    return { text: '', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Call AI to analyze OCR text and identify vocabulary words
async function callAIForVocabularyExtraction(
  ocrText: string,
  mode: string,
  highlightColors: string[] | undefined,
  apiKey: string
): Promise<{ words: string[]; rawOutput: string; error?: string }> {
  try {
    const prompt = buildHighlightAnalysisPrompt(ocrText, mode, highlightColors);

    console.log('[OCR] Calling AI for vocabulary extraction...');

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
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OCR] AI API error:', response.status, errorText);
      return { words: [], rawOutput: '', error: `AI API error: ${response.status}` };
    }

    const result = await response.json();
    const rawOutput = result.choices?.[0]?.message?.content || '';

    console.log('[OCR] AI raw output:', rawOutput);

    // Parse the output
    const words = parseAIOutput(rawOutput);

    return { words, rawOutput };
  } catch (error) {
    console.error('[OCR] AI API error:', error);
    return { words: [], rawOutput: '', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Parse AI output to extract words
function parseAIOutput(text: string): string[] {
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

    // Must be English letters (allow spaces for phrases)
    if (!/^[a-zA-Z\s]+$/.test(word)) continue;

    // Skip common words that might slip through
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
    if (commonWords.has(wordLower)) continue;

    // Normalize for deduplication
    const normalized = wordLower.replace(/\s+/g, ' ');
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    // Capitalize first letter
    const cleaned = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    words.push(cleaned);
  }

  console.log('[OCR] Parsed vocabulary words:', words);
  return words;
}

export async function POST(request: NextRequest) {
  try {
    const { image, mode = 'smart', highlightColors } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Check for Google Vision API key
    const googleApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;

    if (!googleApiKey) {
      console.error('[OCR] GOOGLE_CLOUD_VISION_API_KEY not configured');
      return NextResponse.json(
        { error: 'GOOGLE_CLOUD_VISION_API_KEY not configured', useLocalOCR: true },
        { status: 500 }
      );
    }

    if (!openrouterApiKey) {
      console.error('[OCR] OPENROUTER_API_KEY not configured');
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY not configured', useLocalOCR: true },
        { status: 500 }
      );
    }

    // Step 1: Google Vision OCR
    const ocrResult = await callGoogleVisionOCR(image, googleApiKey);

    if (ocrResult.error || !ocrResult.text) {
      return NextResponse.json({
        success: false,
        words: [],
        highlightedWords: [],
        rawText: ocrResult.error || 'No text found',
        source: 'google-vision',
        error: ocrResult.error,
      });
    }

    // Step 2: AI vocabulary extraction
    const aiResult = await callAIForVocabularyExtraction(
      ocrResult.text,
      mode,
      highlightColors,
      openrouterApiKey
    );

    if (aiResult.error) {
      // If AI fails, return raw OCR text for debugging
      return NextResponse.json({
        success: false,
        words: [],
        highlightedWords: [],
        rawText: `[Google Vision OCR]\n${ocrResult.text}\n\n[AI Error]\n${aiResult.error}`,
        source: 'google-vision',
        error: aiResult.error,
      });
    }

    return NextResponse.json({
      success: true,
      words: aiResult.words,
      highlightedWords: mode === 'highlighted' ? aiResult.words : [],
      rawText: `[Google Vision OCR - ${ocrResult.text.length} chars]\n${ocrResult.text.substring(0, 500)}${ocrResult.text.length > 500 ? '...' : ''}\n\n[AI Vocabulary Extraction]\n${aiResult.rawOutput}`,
      source: 'google-vision-ai',
      modelUsed: AI_MODEL,
    });
  } catch (error) {
    console.error('[OCR] API error:', error);
    return NextResponse.json(
      { error: 'OCR processing failed', useLocalOCR: true },
      { status: 500 }
    );
  }
}
