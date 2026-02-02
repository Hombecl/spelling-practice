// Custom word list management

export interface CustomWordList {
  id: string;
  name: string;
  words: string[];
  createdAt: string;
  lastUsed?: string;
  // Spelling test mode
  isSpellingTest?: boolean;      // Is this a spelling test (默書)?
  deadline?: string;              // ISO date string for test date
}

// Per-word mastery tracking for spelling tests
export interface WordMastery {
  word: string;
  correctStreak: number;         // Consecutive correct answers
  totalAttempts: number;
  lastPracticed?: string;        // ISO date string
  status: 'new' | 'learning' | 'mastered' | 'forgotten';
}

export interface SpellingTestProgress {
  listId: string;
  wordMastery: Record<string, WordMastery>;
  lastPracticed?: string;
}

// Mastery thresholds
const MASTERY_STREAK = 3;           // Need 3 correct in a row to master
const FORGET_DAYS = 2;              // After 2 days without practice, may forget

const MASTERY_STORAGE_KEY = 'spelling-test-mastery';

const STORAGE_KEY = 'spelling-practice-custom-words';

export function getCustomWordLists(): CustomWordList[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading custom word lists:', e);
  }

  return [];
}

export function saveCustomWordLists(lists: CustomWordList[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch (e) {
    console.error('Error saving custom word lists:', e);
  }
}

export function createWordList(name: string, wordsText: string): CustomWordList {
  // Parse words from text (supports comma, newline, space separation)
  const words = wordsText
    .split(/[,\n\s]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0 && /^[a-z]+$/.test(w));

  // Remove duplicates
  const uniqueWords = [...new Set(words)];

  const newList: CustomWordList = {
    id: Date.now().toString(),
    name: name.trim() || `默書 ${new Date().toLocaleDateString('zh-HK')}`,
    words: uniqueWords,
    createdAt: new Date().toISOString(),
  };

  const lists = getCustomWordLists();
  lists.unshift(newList);
  saveCustomWordLists(lists);

  return newList;
}

export function updateWordList(id: string, name: string, wordsText: string): CustomWordList | null {
  const lists = getCustomWordLists();
  const index = lists.findIndex((l) => l.id === id);

  if (index === -1) return null;

  const words = wordsText
    .split(/[,\n\s]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0 && /^[a-z]+$/.test(w));

  const uniqueWords = [...new Set(words)];

  lists[index] = {
    ...lists[index],
    name: name.trim() || lists[index].name,
    words: uniqueWords,
  };

  saveCustomWordLists(lists);
  return lists[index];
}

export function deleteWordList(id: string): void {
  const lists = getCustomWordLists();
  const filtered = lists.filter((l) => l.id !== id);
  saveCustomWordLists(filtered);
}

export function markWordListUsed(id: string): void {
  const lists = getCustomWordLists();
  const list = lists.find((l) => l.id === id);
  if (list) {
    list.lastUsed = new Date().toISOString();
    saveCustomWordLists(lists);
  }
}

export function getWordListById(id: string): CustomWordList | null {
  const lists = getCustomWordLists();
  return lists.find((l) => l.id === id) || null;
}

// ============ Spelling Test Mastery Functions ============

export function getSpellingTestProgress(listId: string): SpellingTestProgress | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(MASTERY_STORAGE_KEY);
    if (stored) {
      const allProgress: Record<string, SpellingTestProgress> = JSON.parse(stored);
      return allProgress[listId] || null;
    }
  } catch (e) {
    console.error('Error loading spelling test progress:', e);
  }
  return null;
}

export function saveSpellingTestProgress(progress: SpellingTestProgress): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(MASTERY_STORAGE_KEY);
    const allProgress: Record<string, SpellingTestProgress> = stored ? JSON.parse(stored) : {};
    allProgress[progress.listId] = progress;
    localStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(allProgress));
  } catch (e) {
    console.error('Error saving spelling test progress:', e);
  }
}

export function initializeSpellingTestProgress(list: CustomWordList): SpellingTestProgress {
  const existing = getSpellingTestProgress(list.id);
  if (existing) {
    // Apply forgetting - check if any mastered words should become forgotten
    const updated = applyForgetting(existing);

    // Add any new words that might have been added to the list
    for (const word of list.words) {
      if (!updated.wordMastery[word]) {
        updated.wordMastery[word] = {
          word,
          correctStreak: 0,
          totalAttempts: 0,
          status: 'new',
        };
      }
    }

    saveSpellingTestProgress(updated);
    return updated;
  }

  // Create new progress
  const newProgress: SpellingTestProgress = {
    listId: list.id,
    wordMastery: {},
  };

  for (const word of list.words) {
    newProgress.wordMastery[word] = {
      word,
      correctStreak: 0,
      totalAttempts: 0,
      status: 'new',
    };
  }

  saveSpellingTestProgress(newProgress);
  return newProgress;
}

function applyForgetting(progress: SpellingTestProgress): SpellingTestProgress {
  const now = new Date();
  const updated = { ...progress, wordMastery: { ...progress.wordMastery } };

  for (const word of Object.keys(updated.wordMastery)) {
    const mastery = updated.wordMastery[word];
    if (mastery.status === 'mastered' && mastery.lastPracticed) {
      const lastPracticed = new Date(mastery.lastPracticed);
      const daysSince = (now.getTime() - lastPracticed.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince >= FORGET_DAYS) {
        updated.wordMastery[word] = {
          ...mastery,
          status: 'forgotten',
          correctStreak: Math.max(0, mastery.correctStreak - 1), // Reduce streak
        };
      }
    }
  }

  return updated;
}

export function updateWordMastery(
  listId: string,
  word: string,
  correct: boolean
): SpellingTestProgress {
  let progress = getSpellingTestProgress(listId);

  if (!progress) {
    const list = getWordListById(listId);
    if (!list) throw new Error('Word list not found');
    progress = initializeSpellingTestProgress(list);
  }

  const mastery = progress.wordMastery[word] || {
    word,
    correctStreak: 0,
    totalAttempts: 0,
    status: 'new' as const,
  };

  const now = new Date().toISOString();

  if (correct) {
    mastery.correctStreak += 1;
    mastery.totalAttempts += 1;
    mastery.lastPracticed = now;

    // Check if word is now mastered
    if (mastery.correctStreak >= MASTERY_STREAK) {
      mastery.status = 'mastered';
    } else if (mastery.status === 'new' || mastery.status === 'forgotten') {
      mastery.status = 'learning';
    }
  } else {
    mastery.correctStreak = 0; // Reset streak on error
    mastery.totalAttempts += 1;
    mastery.lastPracticed = now;
    mastery.status = 'learning';
  }

  progress.wordMastery[word] = mastery;
  progress.lastPracticed = now;
  saveSpellingTestProgress(progress);

  return progress;
}

// Get summary stats for a spelling test
export function getSpellingTestStats(listId: string): {
  total: number;
  mastered: number;
  learning: number;
  newWords: number;
  forgotten: number;
  percentage: number;
} {
  const progress = getSpellingTestProgress(listId);
  const list = getWordListById(listId);

  if (!progress || !list) {
    return { total: list?.words.length || 0, mastered: 0, learning: 0, newWords: list?.words.length || 0, forgotten: 0, percentage: 0 };
  }

  let mastered = 0, learning = 0, newWords = 0, forgotten = 0;

  for (const word of list.words) {
    const mastery = progress.wordMastery[word];
    if (!mastery || mastery.status === 'new') {
      newWords++;
    } else if (mastery.status === 'mastered') {
      mastered++;
    } else if (mastery.status === 'forgotten') {
      forgotten++;
    } else {
      learning++;
    }
  }

  const total = list.words.length;
  const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return { total, mastered, learning, newWords, forgotten, percentage };
}

// Smart word selection for practice - prioritizes words that need more practice
export function getSmartPracticeWords(listId: string, count: number = 5): string[] {
  const progress = getSpellingTestProgress(listId);
  const list = getWordListById(listId);

  if (!list) return [];

  if (!progress) {
    // No progress yet, return random words
    const shuffled = [...list.words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Priority order: forgotten > learning > new > mastered
  const forgotten: string[] = [];
  const learning: string[] = [];
  const newWords: string[] = [];
  const mastered: string[] = [];

  for (const word of list.words) {
    const mastery = progress.wordMastery[word];
    if (!mastery || mastery.status === 'new') {
      newWords.push(word);
    } else if (mastery.status === 'forgotten') {
      forgotten.push(word);
    } else if (mastery.status === 'learning') {
      learning.push(word);
    } else {
      mastered.push(word);
    }
  }

  // Shuffle each category
  const shuffle = (arr: string[]) => arr.sort(() => Math.random() - 0.5);
  shuffle(forgotten);
  shuffle(learning);
  shuffle(newWords);
  shuffle(mastered);

  // Build selection with priority
  const selection: string[] = [];

  // Add forgotten words first (high priority)
  for (const word of forgotten) {
    if (selection.length >= count) break;
    selection.push(word);
  }

  // Add learning words
  for (const word of learning) {
    if (selection.length >= count) break;
    selection.push(word);
  }

  // Add new words
  for (const word of newWords) {
    if (selection.length >= count) break;
    selection.push(word);
  }

  // Add some mastered words for review (max 20% of selection)
  const maxMastered = Math.ceil(count * 0.2);
  let masteredAdded = 0;
  for (const word of mastered) {
    if (selection.length >= count || masteredAdded >= maxMastered) break;
    selection.push(word);
    masteredAdded++;
  }

  // Final shuffle to mix it up
  return shuffle(selection);
}

// Get days until deadline
export function getDaysUntilDeadline(list: CustomWordList): number | null {
  if (!list.deadline) return null;

  const deadline = new Date(list.deadline);
  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

// Update word list with spelling test settings
export function setSpellingTestMode(
  listId: string,
  isSpellingTest: boolean,
  deadline?: string
): CustomWordList | null {
  const lists = getCustomWordLists();
  const index = lists.findIndex((l) => l.id === listId);

  if (index === -1) return null;

  lists[index] = {
    ...lists[index],
    isSpellingTest,
    deadline: isSpellingTest ? deadline : undefined,
  };

  saveCustomWordLists(lists);

  // Initialize progress tracking if enabling spelling test mode
  if (isSpellingTest) {
    initializeSpellingTestProgress(lists[index]);
  }

  return lists[index];
}
