// Phonics breakdown utilities for English words

import { speak } from './speech';

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

// Common English suffixes (should be kept as separate syllables)
const SUFFIXES = [
  // Verb endings
  'ing', 'ed', 'es', 's',
  // Noun endings
  'tion', 'sion', 'ness', 'ment', 'ity', 'ty',
  'dom', 'hood', 'ship', 'ism', 'ist',
  // Adjective endings
  'ful', 'less', 'ous', 'ious', 'eous', 'ive', 'ative', 'itive',
  'able', 'ible', 'al', 'ial', 'ic', 'ical',
  'ant', 'ent', 'ish', 'like', 'ly',
  // Comparative/superlative
  'er', 'est',
  // Plural forms (important for words like fairies, babies, etc.)
  'ies', 'ves',
  // Consonant-le syllables (Final Stable Syllables)
  // These MUST be kept together as they make the schwa-l sound /əl/
  'tle', 'ble', 'dle', 'fle', 'gle', 'kle', 'ple', 'zle', 'cle', 'sle', 'stle',
  // Other common endings
  'ure', 'ture', 'sure', 'ance', 'ence',
  'ry', 'ary', 'ory', 'ery', 'age',
  'en', 'ern', 'ling', 'let', 'ette',
  'ward', 'wise',
];

// Common English prefixes
const PREFIXES = [
  'un', 're', 'pre', 'dis', 'mis', 'non', 'over', 'under',
  'sub', 'super', 'semi', 'anti', 'mid', 'inter', 'fore',
  'de', 'trans', 'ex', 'extra', 'pro', 'con', 'com',
  'en', 'em', 'in', 'im', 'il', 'ir',
];

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

// Break word into syllables using morpheme-aware algorithm
function breakIntoSyllables(word: string): string[] {
  const w = word.toLowerCase();

  if (w.length <= 3) {
    return [w];
  }

  // Special handling for -ies plurals (fairies, babies, stories, berries)
  // These should split as: fair-ies, bab-ies, stor-ies, berr-ies
  if (w.endsWith('ies') && w.length > 4) {
    const stem = w.slice(0, -3); // Remove 'ies'
    if (stem.length >= 2) {
      const stemSyllables = breakRootIntoSyllables(stem);
      return [...stemSyllables, 'ies'];
    }
  }

  // Step 1: Identify and separate suffixes first
  let remaining = w;
  const suffixParts: string[] = [];

  // Sort suffixes by length (longest first) to match correctly
  const sortedSuffixes = [...SUFFIXES].sort((a, b) => b.length - a.length);

  // Try to find suffixes (can have multiple, e.g., "hopelessness" = hope + less + ness)
  let foundSuffix = true;
  while (foundSuffix && remaining.length > 2) {
    foundSuffix = false;
    for (const suffix of sortedSuffixes) {
      if (remaining.endsWith(suffix) && remaining.length > suffix.length + 1) {
        // Check if removing suffix leaves a valid stem (has a vowel)
        const stem = remaining.slice(0, -suffix.length);
        if (stem.length >= 2 && /[aeiou]/.test(stem)) {
          suffixParts.unshift(suffix);
          remaining = stem;
          foundSuffix = true;
          break;
        }
      }
    }
  }

  // Step 2: Identify and separate prefixes
  const prefixParts: string[] = [];
  const sortedPrefixes = [...PREFIXES].sort((a, b) => b.length - a.length);

  let foundPrefix = true;
  while (foundPrefix && remaining.length > 2) {
    foundPrefix = false;
    for (const prefix of sortedPrefixes) {
      if (remaining.startsWith(prefix) && remaining.length > prefix.length + 1) {
        // Check if removing prefix leaves a valid stem
        const stem = remaining.slice(prefix.length);
        if (stem.length >= 2 && /[aeiou]/.test(stem)) {
          prefixParts.push(prefix);
          remaining = stem;
          foundPrefix = true;
          break;
        }
      }
    }
  }

  // Step 3: Break the remaining root into syllables
  const rootSyllables = breakRootIntoSyllables(remaining);

  // Step 4: Combine all parts
  return [...prefixParts, ...rootSyllables, ...suffixParts];
}

// Break a root word (without affixes) into syllables
function breakRootIntoSyllables(word: string): string[] {
  if (word.length <= 3) {
    return [word];
  }

  const syllables: string[] = [];
  let current = '';
  let i = 0;

  while (i < word.length) {
    current += word[i];

    // Check if we're at a syllable boundary
    if (i < word.length - 1) {
      const curr = word[i];
      const next = word[i + 1];
      const afterNext = i < word.length - 2 ? word[i + 2] : '';

      // Check for vowel team - don't break in the middle
      const twoChars = curr + next;
      if (VOWEL_TEAMS.includes(twoChars)) {
        current += next;
        i += 2;
        continue;
      }

      // Rule 1: VCV - break before the consonant (o-pen, e-ven)
      if (VOWELS.includes(curr) && !VOWELS.includes(next) && VOWELS.includes(afterNext)) {
        // But check if the consonant + next vowel forms a blend
        const blend = next + afterNext;
        if (!CONSONANT_BLENDS.includes(blend)) {
          syllables.push(current);
          current = '';
        }
      }
      // Rule 2: VCCV - break between consonants (hap-py, let-ter)
      else if (
        VOWELS.includes(curr) === false &&
        VOWELS.includes(next) === false &&
        i > 0 &&
        VOWELS.includes(word[i - 1])
      ) {
        // Keep consonant blends together
        const blend = curr + next;
        if (!CONSONANT_BLENDS.includes(blend) && !ENDING_BLENDS.includes(blend)) {
          syllables.push(current);
          current = '';
        }
      }
    }

    i++;
  }

  if (current) {
    syllables.push(current);
  }

  // Merge very short syllables
  const merged: string[] = [];
  for (const syl of syllables) {
    if (merged.length > 0 && (syl.length === 1 || merged[merged.length - 1].length === 1)) {
      merged[merged.length - 1] += syl;
    } else {
      merged.push(syl);
    }
  }

  return merged.length > 0 ? merged : [word];
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

// Speak phonics sounds one by one (letter by letter - legacy)
export async function speakPhonics(word: string, onSound?: (index: number) => void): Promise<void> {
  const sounds = identifySounds(word);

  for (let i = 0; i < sounds.length; i++) {
    if (onSound) onSound(i);

    // Use the centralized speak function
    await speak(sounds[i], 0.5);

    // Pause between sounds
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

// Pronunciation hints for syllables that TTS might mispronounce
// Maps written syllables to phonetic spellings that TTS can read correctly
// For Hong Kong ESL learners - optimized for clear syllable sounds
const SYLLABLE_PRONUNCIATION: Record<string, string> = {
  // ========== CONSONANT-LE SYLLABLES (Final Stable Syllables) ==========
  // These are CRITICAL - the 'e' is silent, pronunciation is consonant + "ul" (schwa-l)
  // Reference: https://blog.maketaketeach.com/teaching-the-consonantle-syllable-pattern/
  'tle': 'tul',      // little → lit-tul, bottle → bot-tul
  'ble': 'bul',      // table → ta-bul, bubble → bub-bul
  'dle': 'dul',      // middle → mid-dul, puddle → pud-dul
  'fle': 'ful',      // waffle → waf-ful, rifle → ri-ful
  'gle': 'gul',      // giggle → gig-gul, eagle → ee-gul
  'kle': 'kul',      // sparkle → spar-kul, pickle → pic-kul
  'ple': 'pul',      // apple → ap-pul, simple → sim-pul
  'zle': 'zul',      // puzzle → puz-zul, drizzle → driz-zul
  'cle': 'kul',      // circle → sir-kul, bicycle → bi-si-kul
  'sle': 'sul',      // castle → cas-sul (t is silent)
  'stle': 'sul',     // whistle → whis-sul, castle → cas-sul (t is silent)

  // ========== PLURAL/VERB SUFFIXES ==========
  // Use phonetic spellings that TTS reads correctly
  'ies': 'eez',      // fairies → fair-eez, babies → bab-eez
  'ves': 'vz',       // leaves → leevz
  'es': 'iz',        // boxes → box-iz, watches → watch-iz
  'ied': 'eed',      // carried → car-eed
  'ying': 'ee-ing',  // carrying → car-ee-ing

  // ========== COMMON SUFFIXES ==========
  'tion': 'shun',    // nation → na-shun, station → sta-shun
  'sion': 'zhun',    // vision → vi-zhun, television → tele-vi-zhun
  'cian': 'shun',    // musician → mu-zi-shun
  'tian': 'shun',    // martian → mar-shun
  'ious': 'ee-us',   // curious → cur-ee-us
  'eous': 'ee-us',   // gorgeous → gor-jus
  'ous': 'us',       // famous → fay-mus
  'ness': 'niss',    // happiness → hap-ee-niss
  'ment': 'ment',    // treatment → treet-ment
  'ful': 'full',     // beautiful → byoo-ti-full
  'less': 'liss',    // hopeless → hope-liss
  'able': 'uh-bul',  // capable → kay-puh-bul
  'ible': 'ih-bul',  // possible → poss-ih-bul
  'ing': 'ing',      // singing → sing-ing
  'ed': 'ed',        // wanted → won-ted
  'er': 'er',        // teacher → tee-cher
  'est': 'ist',      // biggest → big-ist
  'ly': 'lee',       // quickly → kwik-lee
  'ty': 'tee',       // beauty → byoo-tee
  'ity': 'ih-tee',   // city → sih-tee
  'al': 'ul',        // animal → an-ih-mul
  'ial': 'ee-ul',    // special → spesh-ul
  'ic': 'ick',       // magic → maj-ick
  'ical': 'ih-kul',  // magical → maj-ih-kul
  'ant': 'unt',      // elephant → el-eh-funt
  'ent': 'unt',      // student → stoo-dunt
  'ance': 'unce',    // dance → dance
  'ence': 'unce',    // fence → fence
  'ure': 'yer',      //ature → na-yer
  'ture': 'cher',    // nature → na-cher
  'sure': 'zher',    // measure → meh-zher
  'age': 'ij',       // village → vil-ij
  'ive': 'iv',       // active → ak-tiv
  'ary': 'air-ee',   // library → li-brair-ee
  'ory': 'or-ee',    // story → stor-ee
  'ery': 'er-ee',    // every → ev-er-ee

  // ========== PREFIXES ==========
  'un': 'un',        // unhappy → un-hap-ee
  're': 'ree',       // redo → ree-do
  'pre': 'pree',     // preview → pree-vyoo
  'dis': 'diss',     // disagree → diss-uh-gree
  'mis': 'miss',     // mistake → miss-take
  'non': 'non',      // nonstop → non-stop
  'over': 'oh-ver',  // overcome → oh-ver-cum
  'under': 'un-der', // understand → un-der-stand

  // ========== SHORT SYLLABLES (prevent TTS from spelling out) ==========
  // Add vowel sound to make them pronounceable
  'th': 'thuh',
  'ch': 'chuh',
  'sh': 'shuh',
  'wh': 'wuh',
  'ph': 'fuh',
  'gh': 'guh',
  'ck': 'ck',
  'ng': 'ng',
  'nk': 'nk',

  // ========== COMMON SHORT WORDS/SYLLABLES ==========
  // These get spelled out letter by letter - give them full pronunciation
  'the': 'thuh',
  'to': 'too',
  'be': 'bee',
  'he': 'hee',
  'we': 'wee',
  'me': 'mee',
  'my': 'my',
  'by': 'by',
  'so': 'so',
  'go': 'go',
  'no': 'no',
  'do': 'doo',
};

// Convert a syllable to a pronounceable form for TTS
function getSyllablePronunciation(syllable: string): string {
  const lower = syllable.toLowerCase();

  // Check for exact match first
  // 1. Check for exact match first
  if (SYLLABLE_PRONUNCIATION[lower]) {
    return SYLLABLE_PRONUNCIATION[lower];
  }

  // 2. Check if syllable ENDS with a known suffix (longest match first)
  const sortedSuffixes = Object.keys(SYLLABLE_PRONUNCIATION).sort((a, b) => b.length - a.length);
  for (const suffix of sortedSuffixes) {
    if (lower.endsWith(suffix) && lower.length > suffix.length) {
      // Get the prefix part and combine with suffix pronunciation
      const prefix = lower.slice(0, -suffix.length);
      const suffixPronunciation = SYLLABLE_PRONUNCIATION[suffix];
      // If prefix is pronounceable, combine them
      if (/[aeiou]/.test(prefix) || prefix.length >= 2) {
        return prefix + '-' + suffixPronunciation;
      }
    }
  }

  // 3. Check if syllable STARTS with a consonant-le pattern ending
  // Handle cases like "tle" at the start of a syllable (shouldn't happen but be safe)
  const consonantLeEndings = ['tle', 'ble', 'dle', 'fle', 'gle', 'kle', 'ple', 'zle', 'cle', 'sle', 'stle'];
  for (const ending of consonantLeEndings) {
    if (lower === ending) {
      return SYLLABLE_PRONUNCIATION[ending] || lower;
    }
  }

  // 4. If syllable is very short (1-2 chars) without vowels, make it pronounceable
  if (lower.length === 1 && !/[aeiou]/.test(lower)) {
    // Single consonant - add schwa to prevent spelling
    return lower + 'uh';
  }

  if (lower.length === 2 && !/[aeiou]/.test(lower)) {
    // Two consonants without vowel - check if it's a digraph
    if (SYLLABLE_PRONUNCIATION[lower]) {
      return SYLLABLE_PRONUNCIATION[lower];
    }
    return lower + 'uh';
  }

  // 5. For 3-letter syllables without vowels, add schwa
  if (lower.length === 3 && !/[aeiou]/.test(lower)) {
    return lower + 'uh';
  }

  // 6. Return as-is if it looks pronounceable (has a vowel)
  return syllable;
}

// Speak syllables one by one (e.g., "con" - "ven" - "ient")
export async function speakSyllables(word: string, onSyllable?: (index: number) => void): Promise<void> {
  const syllables = breakIntoSyllables(word);

  for (let i = 0; i < syllables.length; i++) {
    if (onSyllable) onSyllable(i);

    // Get the pronounceable form of the syllable
    const pronounceable = getSyllablePronunciation(syllables[i]);

    // Use the centralized speak function with slower rate for syllables
    await speak(pronounceable, 0.5);

    // Pause between syllables
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

// Get syllables for a word (exported for UI use)
export function getSyllables(word: string): string[] {
  return breakIntoSyllables(word);
}

// Find which syllable contains a given letter index
export function getSyllableAtIndex(word: string, letterIndex: number): { syllable: string; syllableIndex: number; positionInSyllable: number } | null {
  const syllables = breakIntoSyllables(word);
  let currentPos = 0;

  for (let i = 0; i < syllables.length; i++) {
    const syllable = syllables[i];
    const syllableStart = currentPos;
    const syllableEnd = currentPos + syllable.length;

    if (letterIndex >= syllableStart && letterIndex < syllableEnd) {
      return {
        syllable,
        syllableIndex: i,
        positionInSyllable: letterIndex - syllableStart,
      };
    }
    currentPos = syllableEnd;
  }
  return null;
}

// Get phonics hint for a specific letter position
// Instead of just saying the letter, we say the sound of the syllable containing that letter
export function getPhonicsHintForPosition(word: string, letterIndex: number): {
  syllable: string;
  pronunciation: string;
  hintText: string;
  syllableIndex: number;
} | null {
  const syllableInfo = getSyllableAtIndex(word, letterIndex);
  if (!syllableInfo) return null;

  const pronunciation = getSyllablePronunciation(syllableInfo.syllable);

  return {
    syllable: syllableInfo.syllable,
    pronunciation,
    hintText: `聽吓呢個音：「${syllableInfo.syllable}」`,
    syllableIndex: syllableInfo.syllableIndex,
  };
}

// Speak the phonics hint (syllable sound) for a letter position
export async function speakPhonicsHint(word: string, letterIndex: number): Promise<void> {
  const hint = getPhonicsHintForPosition(word, letterIndex);
  if (!hint) return;

  // Use the centralized speak function
  await speak(hint.pronunciation, 0.5);
}

// Get all letter-to-sound mappings for a word
// This helps show children how each letter contributes to the sound
export function getLetterSoundMapping(word: string): Array<{
  letter: string;
  letterIndex: number;
  syllable: string;
  syllableIndex: number;
  isPartOfBlend: boolean;
  blendType?: string;
}> {
  const syllables = breakIntoSyllables(word);
  const mapping: Array<{
    letter: string;
    letterIndex: number;
    syllable: string;
    syllableIndex: number;
    isPartOfBlend: boolean;
    blendType?: string;
  }> = [];

  let letterIndex = 0;

  for (let syllableIndex = 0; syllableIndex < syllables.length; syllableIndex++) {
    const syllable = syllables[syllableIndex];

    for (let i = 0; i < syllable.length; i++) {
      const letter = syllable[i];

      // Check if this letter is part of a blend
      let isPartOfBlend = false;
      let blendType: string | undefined;

      // Check for 2-letter blends
      if (i < syllable.length - 1) {
        const twoLetters = syllable.slice(i, i + 2);
        if (CONSONANT_BLENDS.includes(twoLetters) || VOWEL_TEAMS.includes(twoLetters)) {
          isPartOfBlend = true;
          blendType = VOWEL_TEAMS.includes(twoLetters) ? 'vowel-team' : 'consonant-blend';
        }
      }
      // Check if previous letter started a blend
      if (i > 0) {
        const twoLetters = syllable.slice(i - 1, i + 1);
        if (CONSONANT_BLENDS.includes(twoLetters) || VOWEL_TEAMS.includes(twoLetters)) {
          isPartOfBlend = true;
          blendType = VOWEL_TEAMS.includes(twoLetters) ? 'vowel-team' : 'consonant-blend';
        }
      }

      mapping.push({
        letter,
        letterIndex,
        syllable,
        syllableIndex,
        isPartOfBlend,
        blendType,
      });

      letterIndex++;
    }
  }

  return mapping;
}
