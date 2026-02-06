// OCR utilities - supports Gemini Vision (via OpenRouter) with Tesseract.js fallback
import Tesseract from 'tesseract.js';

export interface OCRWordItem {
  text: string;
  isPhrase: boolean;
  canSplit?: boolean;
  isHighlighted?: boolean;
}

export interface OCRResult {
  success: boolean;
  words: string[];
  highlightedWords: string[]; // Words that appear to be highlighted
  rawText: string;
  confidence: number;
  error?: string;
  source?: 'gemini-ocr' | 'gemini2-ocr' | 'gemini-fallback-ocr' | 'tesseract' | 'gemini-vision';
  modelUsed?: string;
  fallbackReason?: string;
  // New fields for vocabulary comparison
  items?: OCRWordItem[];
  allVocabulary?: string[];
  allVocabItems?: OCRWordItem[];
}

// Gemini OCR API response type
interface GeminiOCRResponse {
  success: boolean;
  words: string[];
  highlightedWords: string[];
  rawText: string;
  source: string;
  error?: string;
  useLocalOCR?: boolean;
  modelUsed?: string;
  fallbackReason?: string;
  // New fields for vocabulary comparison
  items?: OCRWordItem[];
  allVocabulary?: string[];
  allVocabItems?: OCRWordItem[];
}

// OCR scan options
export interface OCRScanOptions {
  mode: 'select' | 'highlighted' | 'smart';
  highlightColors?: ('yellow' | 'pink' | 'green' | 'blue' | 'orange')[];
}

export interface HighlightDetectionResult {
  hasHighlights: boolean;
  highlightedRegions: { x: number; y: number; width: number; height: number }[];
}

// Common highlighter colors (HSL ranges) - very relaxed for real-world photos
// Note: Phone cameras can shift colors significantly
const HIGHLIGHT_COLORS = {
  // Yellow highlighter - most common, very wide range (includes greenish-yellow)
  yellow: { hMin: 30, hMax: 80, sMin: 15, lMin: 40, lMax: 98 },
  // Pink/magenta highlighter - wide range
  pink: { hMin: 280, hMax: 360, sMin: 10, lMin: 40, lMax: 98 },
  // Also catch pink in 0-20 range (wraps around)
  pinkLow: { hMin: 0, hMax: 20, sMin: 10, lMin: 40, lMax: 98 },
  // Green highlighter - wider range
  green: { hMin: 60, hMax: 170, sMin: 10, lMin: 30, lMax: 95 },
  // Blue highlighter - wider range
  blue: { hMin: 160, hMax: 260, sMin: 10, lMin: 40, lMax: 95 },
  // Orange highlighter - wider range
  orange: { hMin: 5, hMax: 45, sMin: 20, lMin: 40, lMax: 95 },
};

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Check if a color matches a highlighter color
function isHighlightColor(r: number, g: number, b: number): boolean {
  const { h, s, l } = rgbToHsl(r, g, b);

  for (const [colorName, color] of Object.entries(HIGHLIGHT_COLORS)) {
    if (
      h >= color.hMin &&
      h <= color.hMax &&
      s >= color.sMin &&
      l >= color.lMin &&
      l <= color.lMax
    ) {
      return true;
    }
  }
  return false;
}

// Debug function to analyze image colors
export function debugImageColors(imageData: ImageData): void {
  const { width, height, data } = imageData;
  const colorSamples: { r: number; g: number; b: number; h: number; s: number; l: number }[] = [];

  // Sample every 50th pixel to get color distribution
  for (let y = 0; y < height; y += 50) {
    for (let x = 0; x < width; x += 50) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const hsl = rgbToHsl(r, g, b);
      colorSamples.push({ r, g, b, ...hsl });
    }
  }

  // Find potential highlight colors (high lightness, some saturation)
  const potentialHighlights = colorSamples.filter(c => c.l > 40 && c.s > 10);
  console.log('[OCR Debug] Color samples:', colorSamples.length);
  console.log('[OCR Debug] Potential highlight colors:', potentialHighlights.slice(0, 10));
}

// Detect highlighted regions in an image
async function detectHighlightedRegions(imageSource: File | string): Promise<ImageData | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };

    img.onerror = () => resolve(null);

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(imageSource);
    }
  });
}

// Create a mask of highlighted areas
function createHighlightMask(imageData: ImageData): boolean[][] {
  const { width, height, data } = imageData;
  const mask: boolean[][] = [];
  let highlightedPixels = 0;
  const totalPixels = width * height;

  for (let y = 0; y < height; y++) {
    mask[y] = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const isHighlight = isHighlightColor(r, g, b);
      mask[y][x] = isHighlight;
      if (isHighlight) highlightedPixels++;
    }
  }

  // Debug logging
  console.log(`[OCR Debug] Image size: ${width}x${height}`);
  console.log(`[OCR Debug] Highlighted pixels: ${highlightedPixels} / ${totalPixels} (${((highlightedPixels / totalPixels) * 100).toFixed(2)}%)`);

  return mask;
}

// Resize image to max dimension while maintaining aspect ratio
// Returns a compressed JPEG base64 data URL
async function resizeImage(file: File, maxDimension: number = 1600, quality: number = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Use better image smoothing for text
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG base64
      const base64 = canvas.toDataURL('image/jpeg', quality);

      // Log compression stats
      const originalSize = file.size;
      const compressedSize = Math.round((base64.length * 3) / 4); // Approximate base64 to bytes
      console.log(`[OCR] Image resized: ${img.naturalWidth}x${img.naturalHeight} → ${width}x${height}`);
      console.log(`[OCR] Size: ${(originalSize / 1024).toFixed(0)}KB → ~${(compressedSize / 1024).toFixed(0)}KB (${Math.round((compressedSize / originalSize) * 100)}%)`);

      resolve(base64);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
  });
}

// Convert File to base64 data URL (with resize for large images)
async function fileToBase64(file: File): Promise<string> {
  // Always resize to ensure consistent API behavior
  // 1600px is enough for OCR and keeps file size manageable
  return resizeImage(file, 1600, 0.85);
}

// Try Gemini OCR via our API route (OpenRouter)
async function tryGeminiOCR(
  imageSource: File | string,
  onProgress?: (progress: number) => void,
  options?: OCRScanOptions
): Promise<OCRResult | null> {
  try {
    onProgress?.(10);

    // Convert to base64 if it's a File
    let imageData: string;
    if (typeof imageSource === 'string') {
      imageData = imageSource;
    } else {
      imageData = await fileToBase64(imageSource);
    }

    onProgress?.(20);

    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageData,
        mode: options?.mode || 'smart',
        highlightColors: options?.highlightColors,
      }),
    });

    onProgress?.(80);

    const data: GeminiOCRResponse = await response.json();

    console.log('[OCR Client] API Response:', {
      success: data.success,
      source: data.source,
      modelUsed: data.modelUsed,
      wordsCount: data.words?.length,
      rawTextPreview: data.rawText?.substring(0, 200),
      error: data.error,
    });

    // If API says to use local OCR, return null to trigger fallback
    if (data.useLocalOCR || !response.ok) {
      console.log('[OCR Client] API unavailable, falling back to Tesseract');
      return null;
    }

    onProgress?.(100);

    return {
      success: data.success,
      words: data.words || [],
      highlightedWords: data.highlightedWords || [],
      rawText: data.rawText || '',
      confidence: 95, // Gemini Vision is generally very accurate
      source: data.source as OCRResult['source'] || 'gemini-ocr',
      modelUsed: data.modelUsed,
      fallbackReason: data.fallbackReason,
      // Pass through vocabulary comparison fields
      items: data.items,
      allVocabulary: data.allVocabulary,
      allVocabItems: data.allVocabItems,
    };
  } catch (error) {
    console.log('[OCR] Gemini OCR failed, falling back to Tesseract:', error);
    return null;
  }
}

// Extract English words from an image with highlight detection
// Uses AI OCR only - no Tesseract fallback to ensure highlight detection works
export async function extractWordsFromImage(
  imageSource: File | string,
  onProgress?: (progress: number) => void,
  options?: OCRScanOptions
): Promise<OCRResult> {
  // Use AI OCR only (Tesseract can't detect highlights)
  const aiResult = await tryGeminiOCR(imageSource, onProgress, options);
  if (aiResult) {
    return aiResult;
  }

  // If AI OCR fails, return error instead of falling back to Tesseract
  // (Tesseract does raw OCR and can't understand highlights)
  return {
    success: false,
    words: [],
    highlightedWords: [],
    rawText: '',
    confidence: 0,
    error: 'AI OCR 暫時唔得用，請稍後再試',
    source: 'tesseract', // Mark as failed
  };
}

// Original Tesseract-based OCR (kept as fallback)
async function extractWordsWithTesseract(
  imageSource: File | string,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  try {
    // Step 1: Detect highlighted regions
    const imageData = await detectHighlightedRegions(imageSource);
    let highlightMask: boolean[][] | null = null;

    if (imageData) {
      // Debug: analyze colors in the image
      debugImageColors(imageData);
      highlightMask = createHighlightMask(imageData);
    } else {
      console.log('[OCR Debug] Failed to load image data');
    }

    // Step 2: Run OCR
    const result = await Tesseract.recognize(imageSource, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    const rawText = result.data.text;
    const confidence = result.data.confidence;

    // Step 3: Extract words and check if they're highlighted
    const allWords: string[] = [];
    const highlightedWords: string[] = [];

    // Get word-level data with bounding boxes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const words = (result.data as any).words || [];

    for (const wordData of words) {
      const cleaned = cleanWord(wordData.text);
      if (!cleaned || !isValidEnglishWord(cleaned)) continue;

      const lowerWord = cleaned.toLowerCase();
      if (!allWords.includes(lowerWord)) {
        allWords.push(lowerWord);

        // Check if this word is in a highlighted region
        if (highlightMask && wordData.bbox) {
          const { x0, y0, x1, y1 } = wordData.bbox;
          const isHighlighted = checkWordHighlighted(highlightMask, x0, y0, x1, y1, lowerWord);
          if (isHighlighted && !highlightedWords.includes(lowerWord)) {
            highlightedWords.push(lowerWord);
          }
        }
      }
    }

    // If no word-level data, fall back to text extraction
    if (allWords.length === 0) {
      const fallbackWords = extractEnglishWords(rawText);
      allWords.push(...fallbackWords);
    }

    return {
      success: true,
      words: allWords,
      highlightedWords,
      rawText,
      confidence,
      source: 'tesseract',
    };
  } catch (error) {
    return {
      success: false,
      words: [],
      highlightedWords: [],
      rawText: '',
      confidence: 0,
      error: error instanceof Error ? error.message : 'OCR failed',
      source: 'tesseract',
    };
  }
}

// Check if a word's bounding box overlaps with highlighted regions
function checkWordHighlighted(
  mask: boolean[][],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  wordText?: string
): boolean {
  // Sample points within the bounding box
  const samplePoints = 10;
  let highlightedCount = 0;
  let totalSamples = 0;

  const height = mask.length;
  const width = mask[0]?.length || 0;

  for (let i = 0; i <= samplePoints; i++) {
    for (let j = 0; j <= samplePoints; j++) {
      const x = Math.floor(x0 + (x1 - x0) * (i / samplePoints));
      const y = Math.floor(y0 + (y1 - y0) * (j / samplePoints));

      if (y >= 0 && y < height && x >= 0 && x < width) {
        totalSamples++;
        if (mask[y][x]) {
          highlightedCount++;
        }
      }
    }
  }

  const ratio = totalSamples > 0 ? highlightedCount / totalSamples : 0;
  // Lower threshold to 15% for better detection (highlighter may only partially cover text)
  const isHighlighted = ratio > 0.15;

  // Debug logging for first few words
  if (wordText) {
    console.log(`[OCR Debug] Word "${wordText}" at (${x0},${y0})-(${x1},${y1}): ${highlightedCount}/${totalSamples} = ${(ratio * 100).toFixed(1)}% → ${isHighlighted ? 'HIGHLIGHTED' : 'normal'}`);
  }

  return isHighlighted;
}

// Clean a single word
function cleanWord(word: string): string | null {
  // Remove punctuation from start/end
  let cleaned = word.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');

  // Skip if empty or too short
  if (cleaned.length < 2) return null;

  // Skip if contains numbers
  if (/\d/.test(cleaned)) return null;

  // Skip if contains non-English characters
  if (/[^\x00-\x7F]/.test(cleaned)) return null;

  return cleaned;
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

// Common OCR garbage and non-words to reject
const GARBAGE_WORDS = new Set([
  // Known OCR errors from testing - MUST MATCH route.ts
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

// Validate if a string looks like a valid English word or phrase
export function isValidEnglishWord(input: string): boolean {
  // Clean input - remove punctuation for validation but keep spaces
  const cleaned = input.replace(/[^\w\s]/g, '').trim();
  if (!cleaned) return false;

  // Handle phrases (contains space) - more lenient for AI-extracted phrases
  if (cleaned.includes(' ')) {
    const words = cleaned.split(/\s+/);
    // Allow longer phrases (up to 12 words for sentences like song lyrics)
    if (words.length > 12) return false;
    // Each word should be mostly letters (allow contractions like "don't" → "dont" after cleaning)
    return words.every(w => /^[a-zA-Z]+$/.test(w) && w.length >= 1);
  }

  // Single word validation
  const word = cleaned;

  // Must be at least 2 characters (allow short words like "do", "go", "we")
  if (word.length < 2) return false;

  // Must only contain letters
  if (!/^[a-zA-Z]+$/.test(word)) return false;

  // Must have at least one vowel (for words 3+ chars)
  if (word.length >= 3 && !/[aeiou]/i.test(word)) return false;

  // Check against known garbage words
  if (GARBAGE_WORDS.has(word.toLowerCase())) return false;

  // Skip words that are just vowels or consonants repeated (like "aaa")
  if (/^(.)\1+$/.test(word)) return false;

  // Skip words with too many consecutive consonants (likely OCR errors)
  if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(word)) return false;

  // Skip words with too many consecutive vowels (likely OCR errors)
  if (/[aeiou]{4,}/i.test(word)) return false;

  // Common OCR garbage patterns (only for short words)
  if (word.length <= 3) {
    if (/^[aeiou]{2,3}$/i.test(word)) return false;  // Just vowels like "ey", "oa"
    if (/^[bcdfghjklmnpqrstvwxyz]{2,3}$/i.test(word)) return false;  // Just consonants
  }

  // Skip words that are just common suffixes (only for standalone words)
  if (/^(ing|tion|sion|ness|ment|able|ible|ful|less|ous|ive|ary|ory|ery|ity)$/i.test(word)) return false;

  return true;
}
