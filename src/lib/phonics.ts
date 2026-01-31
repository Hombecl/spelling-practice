// Phonics breakdown utilities for English words

export interface PhonicsBreakdown {
  word: string;
  syllables: string[];
  sounds: string[];
  blends: string[];
  pattern: string;
}

// Common phonics patterns
const CONSONANT_BLENDS = ['bl', 'br', 'ch', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sh', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'th', 'tr', 'tw', 'wh', 'wr'];
const ENDING_BLENDS = ['ck', 'ff', 'll', 'ng', 'nk', 'ss', 'zz', 'tch', 'dge'];
const VOWEL_TEAMS = ['ai', 'ay', 'ea', 'ee', 'ie', 'oa', 'oe', 'oo', 'ou', 'ow', 'ue', 'ui', 'ey', 'au', 'aw', 'ew'];
const VOWELS = ['a', 'e', 'i', 'o', 'u'];

// Phonics rules mapping
const SOUND_MAP: Record<string, string> = {
  // Consonant blends
  'ch': 'ch',
  'sh': 'sh',
  'th': 'th',
  'wh': 'w',
  'ph': 'f',
  'ck': 'k',
  'ng': 'ng',
  'tch': 'ch',
  'dge': 'j',
  // Vowel teams
  'ai': 'ā',
  'ay': 'ā',
  'ea': 'ē',
  'ee': 'ē',
  'ie': 'ī',
  'oa': 'ō',
  'oe': 'ō',
  'oo': 'oo',
  'ou': 'ow',
  'ow': 'ō/ow',
  'ue': 'ū',
  'ui': 'ū',
  'au': 'aw',
  'aw': 'aw',
  'ew': 'ū',
};

// Simple syllable counter based on vowel groups
function countSyllables(word: string): number {
  const w = word.toLowerCase();
  let count = 0;
  let prevWasVowel = false;

  for (let i = 0; i < w.length; i++) {
    const isVowel = VOWELS.includes(w[i]);
    if (isVowel && !prevWasVowel) {
      count++;
    }
    prevWasVowel = isVowel;
  }

  // Handle silent e
  if (w.endsWith('e') && count > 1) {
    count--;
  }

  return Math.max(1, count);
}

// Break word into syllables (simplified)
function breakIntoSyllables(word: string): string[] {
  const w = word.toLowerCase();
  const syllableCount = countSyllables(w);

  if (syllableCount === 1) {
    return [w];
  }

  // Simple syllable breaking rules
  const syllables: string[] = [];
  let current = '';

  for (let i = 0; i < w.length; i++) {
    current += w[i];

    // Check if we should break
    if (i < w.length - 2) {
      const curr = w[i];
      const next = w[i + 1];
      const afterNext = w[i + 2];

      // V/CV pattern (break before consonant)
      if (VOWELS.includes(curr) && !VOWELS.includes(next) && VOWELS.includes(afterNext)) {
        syllables.push(current);
        current = '';
      }
      // VC/CV pattern (break between consonants)
      else if (!VOWELS.includes(curr) && !VOWELS.includes(next) && i > 0 && VOWELS.includes(w[i - 1])) {
        // Keep consonant blends together
        const blend = curr + next;
        if (!CONSONANT_BLENDS.includes(blend)) {
          syllables.push(current);
          current = '';
        }
      }
    }
  }

  if (current) {
    syllables.push(current);
  }

  // If we got too many or too few, just split evenly
  if (syllables.length !== syllableCount && syllableCount > 1) {
    const chunkSize = Math.ceil(w.length / syllableCount);
    const evenSyllables: string[] = [];
    for (let i = 0; i < w.length; i += chunkSize) {
      evenSyllables.push(w.slice(i, i + chunkSize));
    }
    return evenSyllables;
  }

  return syllables;
}

// Identify phonics sounds in a word
function identifySounds(word: string): string[] {
  const w = word.toLowerCase();
  const sounds: string[] = [];
  let i = 0;

  while (i < w.length) {
    // Check for 3-letter patterns first
    if (i < w.length - 2) {
      const three = w.slice(i, i + 3);
      if (SOUND_MAP[three]) {
        sounds.push(three);
        i += 3;
        continue;
      }
    }

    // Check for 2-letter patterns
    if (i < w.length - 1) {
      const two = w.slice(i, i + 2);
      if (SOUND_MAP[two] || CONSONANT_BLENDS.includes(two) || VOWEL_TEAMS.includes(two) || ENDING_BLENDS.includes(two)) {
        sounds.push(two);
        i += 2;
        continue;
      }
    }

    // Single letter
    sounds.push(w[i]);
    i++;
  }

  return sounds;
}

// Identify consonant blends and vowel teams
function identifyBlends(word: string): string[] {
  const w = word.toLowerCase();
  const blends: string[] = [];

  // Check for consonant blends
  for (const blend of CONSONANT_BLENDS) {
    if (w.includes(blend)) {
      blends.push(blend);
    }
  }

  // Check for vowel teams
  for (const team of VOWEL_TEAMS) {
    if (w.includes(team)) {
      blends.push(team);
    }
  }

  // Check for ending blends
  for (const end of ENDING_BLENDS) {
    if (w.includes(end)) {
      blends.push(end);
    }
  }

  return [...new Set(blends)];
}

// Identify the phonics pattern type
function identifyPattern(word: string): string {
  const w = word.toLowerCase();

  // CVC pattern (cat, dog, pig)
  if (w.length === 3 && !VOWELS.includes(w[0]) && VOWELS.includes(w[1]) && !VOWELS.includes(w[2])) {
    return 'CVC (短元音)';
  }

  // CVCe pattern (cake, like, home)
  if (w.length >= 4 && w.endsWith('e')) {
    const beforeE = w[w.length - 2];
    const vowel = w[w.length - 3];
    if (!VOWELS.includes(beforeE) && VOWELS.includes(vowel)) {
      return 'CVCe (魔法 e)';
    }
  }

  // CVVC pattern (rain, boat, meat)
  for (const team of VOWEL_TEAMS) {
    if (w.includes(team)) {
      return 'CVVC (元音組合)';
    }
  }

  // Consonant blend at start
  for (const blend of CONSONANT_BLENDS) {
    if (w.startsWith(blend)) {
      return 'CCVC (輔音組合)';
    }
  }

  return '基本模式';
}

// Main function to get phonics breakdown
export function getPhonicsBreakdown(word: string): PhonicsBreakdown {
  return {
    word: word.toLowerCase(),
    syllables: breakIntoSyllables(word),
    sounds: identifySounds(word),
    blends: identifyBlends(word),
    pattern: identifyPattern(word),
  };
}

// Get pronunciation guide with colors
export function getPronunciationGuide(word: string): { letter: string; type: 'consonant' | 'vowel' | 'blend' | 'silent'; sound: string }[] {
  const sounds = identifySounds(word.toLowerCase());
  const guide: { letter: string; type: 'consonant' | 'vowel' | 'blend' | 'silent'; sound: string }[] = [];

  for (const sound of sounds) {
    let type: 'consonant' | 'vowel' | 'blend' | 'silent';
    let displaySound = sound;

    if (sound.length > 1) {
      type = 'blend';
      displaySound = SOUND_MAP[sound] || sound;
    } else if (VOWELS.includes(sound)) {
      type = 'vowel';
    } else {
      type = 'consonant';
    }

    // Check for silent e
    if (sound === 'e' && word.toLowerCase().endsWith('e') && countSyllables(word) > 0) {
      const prevChar = word[word.length - 2];
      if (prevChar && !VOWELS.includes(prevChar.toLowerCase())) {
        type = 'silent';
      }
    }

    guide.push({ letter: sound, type, sound: displaySound });
  }

  return guide;
}

// Speak phonics sounds one by one
export async function speakPhonics(word: string, onSound?: (index: number) => void): Promise<void> {
  const sounds = identifySounds(word);

  for (let i = 0; i < sounds.length; i++) {
    if (onSound) onSound(i);

    await new Promise<void>((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        setTimeout(resolve, 500);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(sounds[i]);
      utterance.rate = 0.5;
      utterance.pitch = 1;
      utterance.lang = 'en-US';

      utterance.onend = () => {
        setTimeout(resolve, 300);
      };
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }
}
