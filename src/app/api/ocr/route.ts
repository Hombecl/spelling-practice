import { NextRequest, NextResponse } from 'next/server';

// Replicate API endpoint for DeepSeek OCR
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

interface ReplicateResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const apiKey = process.env.REPLICATE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'REPLICATE_API_KEY not configured', useLocalOCR: true },
        { status: 500 }
      );
    }

    // Create prediction with DeepSeek OCR
    const createResponse = await fetch(REPLICATE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait', // Wait for result instead of polling
      },
      body: JSON.stringify({
        // DeepSeek OCR model on Replicate
        version: 'lucataco/deepseek-ocr:latest',
        input: {
          image: image, // base64 data URL or URL
          task_type: 'Free OCR', // Just extract text, no markdown conversion needed
          resolution_size: 'Base', // Good balance of speed and quality
        },
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Replicate API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create OCR prediction', useLocalOCR: true },
        { status: 500 }
      );
    }

    let result: ReplicateResponse = await createResponse.json();

    // If not using "Prefer: wait", poll for completion
    if (result.status !== 'succeeded' && result.status !== 'failed') {
      // Poll for result (max 60 seconds)
      const maxAttempts = 30;
      let attempts = 0;

      while (attempts < maxAttempts && result.status !== 'succeeded' && result.status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

        const pollResponse = await fetch(`${REPLICATE_API_URL}/${result.id}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        if (!pollResponse.ok) {
          throw new Error('Failed to poll OCR status');
        }

        result = await pollResponse.json();
        attempts++;
      }
    }

    if (result.status === 'failed') {
      console.error('DeepSeek OCR failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'OCR processing failed', useLocalOCR: true },
        { status: 500 }
      );
    }

    if (result.status !== 'succeeded' || !result.output) {
      return NextResponse.json(
        { error: 'OCR timeout', useLocalOCR: true },
        { status: 500 }
      );
    }

    // Parse the OCR output to extract words
    const rawText = result.output;
    const words = extractEnglishWords(rawText);
    const highlightedWords = detectHighlightedWords(rawText);

    return NextResponse.json({
      success: true,
      words,
      highlightedWords,
      rawText,
      source: 'deepseek-ocr',
    });
  } catch (error) {
    console.error('OCR API error:', error);
    return NextResponse.json(
      { error: 'OCR processing failed', useLocalOCR: true },
      { status: 500 }
    );
  }
}

// Extract clean English words from OCR text
function extractEnglishWords(text: string): string[] {
  // Split by whitespace, newlines, and common delimiters
  const tokens = text.split(/[\s\n\r,;:!?()[\]{}""''""]+/);

  const words: string[] = [];
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

  for (const token of tokens) {
    // Remove punctuation from start/end
    let cleaned = token.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');

    // Skip if empty or too short
    if (cleaned.length < 2) continue;

    // Skip if contains numbers
    if (/\d/.test(cleaned)) continue;

    // Skip if contains non-English characters
    if (/[^\x00-\x7F]/.test(cleaned)) continue;

    // Convert to lowercase
    cleaned = cleaned.toLowerCase();

    // Skip stop words
    if (skipWords.has(cleaned)) continue;

    // Skip if already seen
    if (seen.has(cleaned)) continue;

    // Must have at least one vowel
    if (!/[aeiou]/.test(cleaned)) continue;

    seen.add(cleaned);
    words.push(cleaned);
  }

  return words;
}

// Detect words that might be highlighted (DeepSeek OCR may indicate this in output)
// This is a placeholder - DeepSeek OCR doesn't directly detect highlights
// But we can look for patterns like **bold**, ==highlight==, or specific formatting
function detectHighlightedWords(text: string): string[] {
  const highlighted: string[] = [];

  // Look for markdown-style highlights: ==word== or **word**
  const highlightPatterns = [
    /==([^=]+)==/g,           // ==highlighted==
    /\*\*([^*]+)\*\*/g,       // **bold**
    /\[\[([^\]]+)\]\]/g,      // [[marked]]
    /<mark>([^<]+)<\/mark>/g, // <mark>highlighted</mark>
  ];

  for (const pattern of highlightPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const words = match[1].split(/\s+/);
      for (const word of words) {
        const cleaned = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (cleaned.length >= 2 && !highlighted.includes(cleaned)) {
          highlighted.push(cleaned);
        }
      }
    }
  }

  return highlighted;
}
