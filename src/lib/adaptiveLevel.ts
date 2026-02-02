// Adaptive Level System - Automatically adjusts difficulty based on student's spelling tests
// 自適應程度系統 - 根據學生默書內容自動調整難度

import { CustomWordList, getCustomWordLists } from './customWords';

// ============ Types ============

export interface WordAnalysis {
  word: string;
  length: number;
  difficulty: number;        // 1-5 scale
  patterns: string[];        // Identified patterns
  hasDoubleLetter: boolean;
  hasSilentLetter: boolean;
  hasIrregularSpelling: boolean;
}

export interface StudentLevel {
  estimatedGrade: number;       // 1-6 for primary school
  averageWordLength: number;
  averageDifficulty: number;    // 1-5 scale
  totalWordsAnalyzed: number;
  commonPatterns: string[];     // Patterns seen in spelling tests
  lastUpdated: string;          // ISO date string
  confidenceScore: number;      // 0-100, higher = more data
}

export interface AdaptiveWordBank {
  level: StudentLevel;
  recommendedWords: string[];   // Words matching student's level
  challengeWords: string[];     // Slightly harder words for growth
}

// ============ Word Difficulty Analysis ============

// Common patterns that increase difficulty
const DIFFICULT_PATTERNS = {
  doubleLetter: /(.)\1/,
  silentE: /[bcdfghjklmnpqrstvwxyz]e$/,
  silentK: /^kn/,
  silentW: /^wr/,
  silentB: /mb$/,
  silentGH: /gh/,
  ieRule: /ie|ei/,
  tion: /tion$/,
  sion: /sion$/,
  ough: /ough/,
  ight: /ight/,
  ould: /ould/,
  ck: /ck/,
  ph: /ph/,
  wh: /wh/,
  ch: /ch/,
  sh: /sh/,
  th: /th/,
  qu: /qu/,
};

// Words that are notoriously hard to spell (irregular spellings)
const IRREGULAR_WORDS = new Set([
  'said', 'says', 'their', 'there', 'where', 'were', 'would', 'could', 'should',
  'friend', 'because', 'beautiful', 'different', 'favourite', 'February',
  'Wednesday', 'surprise', 'enough', 'through', 'thought', 'though',
  'people', 'receive', 'believe', 'weird', 'height', 'foreign',
  'tomorrow', 'calendar', 'necessary', 'separate', 'definitely',
  'occurred', 'beginning', 'immediately', 'occasionally', 'accommodation',
]);

// Hong Kong primary school grade level word length expectations
const GRADE_WORD_LENGTH: Record<number, { min: number; max: number; avg: number }> = {
  1: { min: 2, max: 4, avg: 3 },    // P1: cat, dog, run
  2: { min: 3, max: 5, avg: 4 },    // P2: book, play, happy
  3: { min: 3, max: 6, avg: 4.5 },  // P3: school, friend, family
  4: { min: 4, max: 7, avg: 5 },    // P4: beautiful, different
  5: { min: 4, max: 8, avg: 5.5 },  // P5: important, environment
  6: { min: 5, max: 10, avg: 6 },   // P6: communication, temperature
};

export function analyzeWord(word: string): WordAnalysis {
  const lowerWord = word.toLowerCase();
  const patterns: string[] = [];

  // Check for patterns
  for (const [name, regex] of Object.entries(DIFFICULT_PATTERNS)) {
    if (regex.test(lowerWord)) {
      patterns.push(name);
    }
  }

  const hasDoubleLetter = DIFFICULT_PATTERNS.doubleLetter.test(lowerWord);
  const hasSilentLetter =
    DIFFICULT_PATTERNS.silentK.test(lowerWord) ||
    DIFFICULT_PATTERNS.silentW.test(lowerWord) ||
    DIFFICULT_PATTERNS.silentB.test(lowerWord) ||
    DIFFICULT_PATTERNS.silentGH.test(lowerWord) ||
    DIFFICULT_PATTERNS.silentE.test(lowerWord);
  const hasIrregularSpelling = IRREGULAR_WORDS.has(lowerWord);

  // Calculate difficulty score (1-5)
  let difficulty = 1;

  // Length-based difficulty
  if (word.length >= 3 && word.length <= 4) difficulty = 1;
  else if (word.length === 5) difficulty = 2;
  else if (word.length === 6) difficulty = 3;
  else if (word.length === 7) difficulty = 4;
  else if (word.length >= 8) difficulty = 5;

  // Pattern-based adjustments
  if (hasDoubleLetter) difficulty += 0.5;
  if (hasSilentLetter) difficulty += 0.5;
  if (hasIrregularSpelling) difficulty += 1;
  if (patterns.length >= 3) difficulty += 0.5;

  // Cap at 5
  difficulty = Math.min(5, Math.max(1, Math.round(difficulty * 10) / 10));

  return {
    word,
    length: word.length,
    difficulty,
    patterns,
    hasDoubleLetter,
    hasSilentLetter,
    hasIrregularSpelling,
  };
}

// ============ Student Level Estimation ============

const LEVEL_STORAGE_KEY = 'spelling-adaptive-level';

export function getStudentLevel(): StudentLevel | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(LEVEL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading student level:', e);
  }
  return null;
}

export function saveStudentLevel(level: StudentLevel): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LEVEL_STORAGE_KEY, JSON.stringify(level));
  } catch (e) {
    console.error('Error saving student level:', e);
  }
}

export function analyzeSpellingTests(): StudentLevel {
  const lists = getCustomWordLists();

  // Only analyze spelling test lists
  const spellingTests = lists.filter(list => list.isSpellingTest);

  if (spellingTests.length === 0) {
    // No spelling tests yet, return default level (P3)
    return createDefaultLevel();
  }

  // Analyze all words from spelling tests
  const allAnalyses: WordAnalysis[] = [];
  const patternCounts: Record<string, number> = {};

  for (const list of spellingTests) {
    for (const word of list.words) {
      const analysis = analyzeWord(word);
      allAnalyses.push(analysis);

      for (const pattern of analysis.patterns) {
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
      }
    }
  }

  if (allAnalyses.length === 0) {
    return createDefaultLevel();
  }

  // Calculate averages
  const totalLength = allAnalyses.reduce((sum, a) => sum + a.length, 0);
  const totalDifficulty = allAnalyses.reduce((sum, a) => sum + a.difficulty, 0);
  const averageWordLength = totalLength / allAnalyses.length;
  const averageDifficulty = totalDifficulty / allAnalyses.length;

  // Find common patterns (top 5)
  const sortedPatterns = Object.entries(patternCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pattern]) => pattern);

  // Estimate grade based on average word length
  let estimatedGrade = 3; // Default to P3
  for (const [grade, lengths] of Object.entries(GRADE_WORD_LENGTH)) {
    const gradeNum = parseInt(grade);
    if (averageWordLength >= lengths.avg - 0.5 && averageWordLength <= lengths.avg + 0.5) {
      estimatedGrade = gradeNum;
      break;
    } else if (averageWordLength < lengths.avg) {
      estimatedGrade = Math.max(1, gradeNum - 1);
      break;
    }
  }

  // Confidence score based on number of words analyzed
  const confidenceScore = Math.min(100, Math.round((allAnalyses.length / 50) * 100));

  const level: StudentLevel = {
    estimatedGrade,
    averageWordLength: Math.round(averageWordLength * 10) / 10,
    averageDifficulty: Math.round(averageDifficulty * 10) / 10,
    totalWordsAnalyzed: allAnalyses.length,
    commonPatterns: sortedPatterns,
    lastUpdated: new Date().toISOString(),
    confidenceScore,
  };

  saveStudentLevel(level);
  return level;
}

export function createDefaultLevel(): StudentLevel {
  return {
    estimatedGrade: 3,
    averageWordLength: 4.5,
    averageDifficulty: 2,
    totalWordsAnalyzed: 0,
    commonPatterns: [],
    lastUpdated: new Date().toISOString(),
    confidenceScore: 0,
  };
}

// ============ Adaptive Word Bank ============

// Extended word bank organized by grade level
// These words are common in Hong Kong primary school curriculum
const GRADE_WORDS: Record<number, string[]> = {
  1: [
    // P1 - Basic 2-4 letter words
    'cat', 'dog', 'run', 'sit', 'big', 'red', 'sun', 'hat', 'cup', 'pen',
    'bag', 'box', 'bus', 'car', 'bed', 'leg', 'arm', 'eye', 'ear', 'boy',
    'girl', 'man', 'mum', 'dad', 'one', 'two', 'yes', 'no', 'go', 'see',
    'eat', 'hot', 'wet', 'fun', 'sad', 'bad', 'ant', 'bee', 'cow', 'pig',
  ],
  2: [
    // P2 - 3-5 letter words
    'book', 'ball', 'bird', 'fish', 'duck', 'frog', 'bear', 'lion', 'blue',
    'pink', 'tree', 'rain', 'snow', 'moon', 'star', 'cake', 'milk', 'rice',
    'door', 'desk', 'lamp', 'ship', 'boat', 'bike', 'jump', 'walk', 'play',
    'read', 'sing', 'swim', 'good', 'fast', 'slow', 'tall', 'thin', 'soft',
    'hard', 'cold', 'warm', 'clean', 'dirty', 'new', 'old', 'long', 'short',
  ],
  3: [
    // P3 - 4-6 letter words
    'apple', 'water', 'house', 'happy', 'green', 'black', 'white', 'brown',
    'horse', 'mouse', 'sheep', 'snake', 'tiger', 'zebra', 'bread', 'juice',
    'pizza', 'chair', 'table', 'clock', 'phone', 'train', 'plane', 'truck',
    'dance', 'write', 'sleep', 'smile', 'think', 'speak', 'flower', 'school',
    'family', 'friend', 'mother', 'father', 'sister', 'brother', 'teacher',
    'student', 'market', 'garden', 'kitchen', 'bedroom', 'window', 'morning',
    'evening', 'Sunday', 'Monday', 'Friday', 'always', 'never', 'sometimes',
  ],
  4: [
    // P4 - 5-7 letter words
    'beautiful', 'different', 'favourite', 'important', 'wonderful', 'terrible',
    'delicious', 'interesting', 'exciting', 'boring', 'difficult', 'dangerous',
    'expensive', 'carefully', 'quickly', 'slowly', 'suddenly', 'together',
    'birthday', 'Christmas', 'holiday', 'festival', 'restaurant', 'hospital',
    'library', 'museum', 'airport', 'station', 'building', 'computer',
    'television', 'internet', 'message', 'question', 'answer', 'problem',
    'exercise', 'homework', 'subject', 'science', 'history', 'English',
    'Chinese', 'country', 'weather', 'summer', 'winter', 'autumn', 'spring',
  ],
  5: [
    // P5 - 6-8 letter words
    'environment', 'temperature', 'information', 'communication', 'celebration',
    'competition', 'organisation', 'population', 'government', 'education',
    'experience', 'imagination', 'adventure', 'discovery', 'invention',
    'development', 'improvement', 'entertainment', 'opportunity', 'possibility',
    'responsibility', 'achievement', 'relationship', 'neighbourhood', 'volunteer',
    'electricity', 'technology', 'agriculture', 'atmosphere', 'recycling',
    'pollution', 'protection', 'conservation', 'traditional', 'international',
    'professional', 'comfortable', 'responsible', 'independent', 'confident',
  ],
  6: [
    // P6 - Advanced words
    'accommodation', 'advertisement', 'approximately', 'championship', 'characteristic',
    'communicate', 'consequently', 'contemporary', 'controversial', 'disappointment',
    'discrimination', 'embarrassment', 'encouragement', 'extraordinary', 'frequently',
    'immediately', 'independence', 'infrastructure', 'magnificent', 'manufacturing',
    'occasionally', 'particularly', 'performance', 'permanently', 'personality',
    'photography', 'preparation', 'professional', 'pronunciation', 'psychological',
    'questionnaire', 'recommendation', 'refrigerator', 'representative', 'significance',
    'sophisticated', 'specifically', 'substantially', 'successfully', 'unfortunately',
  ],
};

export function getAdaptiveWordBank(): AdaptiveWordBank {
  const level = getStudentLevel() || analyzeSpellingTests();

  // Get words for student's estimated grade
  const gradeWords = GRADE_WORDS[level.estimatedGrade] || GRADE_WORDS[3];

  // Filter words that match student's difficulty level
  const recommendedWords = gradeWords.filter(word => {
    const analysis = analyzeWord(word);
    return Math.abs(analysis.difficulty - level.averageDifficulty) <= 1;
  });

  // Challenge words: slightly above current level
  const nextGradeWords = GRADE_WORDS[Math.min(6, level.estimatedGrade + 1)] || [];
  const challengeWords = nextGradeWords.filter(word => {
    const analysis = analyzeWord(word);
    return analysis.difficulty >= level.averageDifficulty &&
           analysis.difficulty <= level.averageDifficulty + 1.5;
  }).slice(0, 20);

  return {
    level,
    recommendedWords,
    challengeWords,
  };
}

// Get words that match student's level for practice
export function getAdaptiveWords(count: number = 10): string[] {
  const bank = getAdaptiveWordBank();

  // Mix recommended (80%) and challenge words (20%)
  const recommendedCount = Math.ceil(count * 0.8);
  const challengeCount = count - recommendedCount;

  // Shuffle and select
  const shuffled = [...bank.recommendedWords].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, recommendedCount);

  const shuffledChallenge = [...bank.challengeWords].sort(() => Math.random() - 0.5);
  selected.push(...shuffledChallenge.slice(0, challengeCount));

  return selected.sort(() => Math.random() - 0.5);
}

// ============ Spelling Test Integration ============

// Update student level when a new spelling test is added
export function onSpellingTestAdded(list: CustomWordList): StudentLevel {
  // Re-analyze all spelling tests to update level
  return analyzeSpellingTests();
}

// Get grade label in Chinese
export function getGradeLabel(grade: number): string {
  const labels: Record<number, string> = {
    1: '小一',
    2: '小二',
    3: '小三',
    4: '小四',
    5: '小五',
    6: '小六',
  };
  return labels[grade] || `P${grade}`;
}

// Get difficulty label
export function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 1.5) return '容易';
  if (difficulty <= 2.5) return '普通';
  if (difficulty <= 3.5) return '中等';
  if (difficulty <= 4.5) return '困難';
  return '挑戰';
}

// ============ Special Spelling Test Stages ============

// Create special adventure stages from spelling test lists
export interface SpellingTestStage {
  id: string;
  listId: string;
  listName: string;
  deadline?: string;
  wordCount: number;
  difficulty: number;
  isBoss: boolean;        // Treat as boss battle for achievement
  rewards: {
    stars: number;
    xp: number;
  };
}

export function createSpellingTestStages(): SpellingTestStage[] {
  const lists = getCustomWordLists();
  const spellingTests = lists.filter(list => list.isSpellingTest);

  return spellingTests.map(list => {
    // Analyze words to determine difficulty
    const analyses = list.words.map(analyzeWord);
    const avgDifficulty = analyses.reduce((sum, a) => sum + a.difficulty, 0) / analyses.length;

    // More words = more rewards
    const baseXP = 20 + list.words.length * 5;
    const baseStars = Math.min(5, Math.ceil(list.words.length / 5));

    return {
      id: `spelling-test-${list.id}`,
      listId: list.id,
      listName: list.name,
      deadline: list.deadline,
      wordCount: list.words.length,
      difficulty: Math.round(avgDifficulty * 10) / 10,
      isBoss: list.words.length >= 10, // 10+ words = boss level challenge
      rewards: {
        stars: baseStars * 5,
        xp: baseXP,
      },
    };
  });
}

// Get spelling test stage for display in adventure mode
export function getActiveSpellingTestStage(): SpellingTestStage | null {
  const stages = createSpellingTestStages();

  // Prioritize upcoming deadlines
  const now = new Date();
  const upcoming = stages
    .filter(s => s.deadline)
    .sort((a, b) => {
      const dateA = new Date(a.deadline!);
      const dateB = new Date(b.deadline!);
      return dateA.getTime() - dateB.getTime();
    })
    .filter(s => new Date(s.deadline!) >= now);

  if (upcoming.length > 0) {
    return upcoming[0];
  }

  // Return most recent if no upcoming
  return stages.length > 0 ? stages[stages.length - 1] : null;
}
