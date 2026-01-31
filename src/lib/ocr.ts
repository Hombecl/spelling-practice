// OCR utilities using Tesseract.js
import Tesseract from 'tesseract.js';

export interface OCRResult {
  success: boolean;
  words: string[];
  highlightedWords: string[]; // Words that appear to be highlighted
  rawText: string;
  confidence: number;
  error?: string;
}

export interface HighlightDetectionResult {
  hasHighlights: boolean;
  highlightedRegions: { x: number; y: number; width: number; height: number }[];
}

// Common highlighter colors (HSL ranges) - relaxed for real-world photos
const HIGHLIGHT_COLORS = {
  // Yellow highlighter - most common, very wide range
  yellow: { hMin: 35, hMax: 75, sMin: 20, lMin: 45, lMax: 95 },
  // Pink/magenta highlighter
  pink: { hMin: 290, hMax: 360, sMin: 15, lMin: 45, lMax: 95 },
  // Also catch pink in 0-10 range (wraps around)
  pinkLow: { hMin: 0, hMax: 15, sMin: 15, lMin: 45, lMax: 95 },
  // Green highlighter
  green: { hMin: 70, hMax: 160, sMin: 15, lMin: 35, lMax: 90 },
  // Blue highlighter
  blue: { hMin: 170, hMax: 250, sMin: 15, lMin: 45, lMax: 90 },
  // Orange highlighter
  orange: { hMin: 10, hMax: 40, sMin: 25, lMin: 45, lMax: 90 },
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

// Extract English words from an image with highlight detection
export async function extractWordsFromImage(
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
    };
  } catch (error) {
    return {
      success: false,
      words: [],
      highlightedWords: [],
      rawText: '',
      confidence: 0,
      error: error instanceof Error ? error.message : 'OCR failed',
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
  const isHighlighted = ratio > 0.3;

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
