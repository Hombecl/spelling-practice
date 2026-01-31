// OCR utilities using Tesseract.js
import Tesseract from 'tesseract.js';

export interface OCRResult {
  success: boolean;
  words: string[];
  rawText: string;
  confidence: number;
  error?: string;
}

// Extract English words from an image
export async function extractWordsFromImage(
  imageSource: File | string,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  try {
    const result = await Tesseract.recognize(imageSource, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    const rawText = result.data.text;
    const confidence = result.data.confidence;

    // Extract English words (filter out numbers, symbols, Chinese characters)
    const words = extractEnglishWords(rawText);

    return {
      success: true,
      words,
      rawText,
      confidence,
    };
  } catch (error) {
    return {
      success: false,
      words: [],
      rawText: '',
      confidence: 0,
      error: error instanceof Error ? error.message : 'OCR failed',
    };
  }
}

// Extract clean English words from raw OCR text
function extractEnglishWords(text: string): string[] {
  // Split by whitespace and newlines
  const tokens = text.split(/[\s\n\r]+/);

  const words: string[] = [];

  for (const token of tokens) {
    // Clean the token - remove punctuation from start/end
    let cleaned = token.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');

    // Skip if empty or too short
    if (cleaned.length < 2) continue;

    // Skip if contains numbers
    if (/\d/.test(cleaned)) continue;

    // Skip if contains non-English characters (Chinese, etc.)
    if (/[^\x00-\x7F]/.test(cleaned)) continue;

    // Convert to lowercase for consistency
    cleaned = cleaned.toLowerCase();

    // Skip common OCR artifacts and non-words
    const skipWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
                       'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
                       'could', 'should', 'may', 'might', 'must', 'shall', 'can',
                       'of', 'to', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
                       'or', 'and', 'but', 'not', 'no', 'yes', 'if', 'so', 'as',
                       'it', 'its', 'this', 'that', 'these', 'those', 'my', 'your',
                       'his', 'her', 'our', 'their', 'i', 'you', 'he', 'she', 'we', 'they'];

    if (skipWords.includes(cleaned)) continue;

    // Add if not already in list
    if (!words.includes(cleaned)) {
      words.push(cleaned);
    }
  }

  return words;
}

// Validate if a string looks like a valid English word
export function isValidEnglishWord(word: string): boolean {
  // Must be at least 2 characters
  if (word.length < 2) return false;

  // Must only contain letters
  if (!/^[a-zA-Z]+$/.test(word)) return false;

  // Must have at least one vowel (basic check)
  if (!/[aeiouAEIOU]/.test(word)) return false;

  return true;
}
