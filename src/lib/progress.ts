// Progress tracking with localStorage

export interface WordProgress {
  word: string;
  attempts: number;
  correct: number;
  lastPracticed: string;
  mastered: boolean; // Considered mastered after 3 correct in a row
  streak: number;
}

export interface LevelProgress {
  level: number;
  wordsCompleted: number;
  totalWords: number;
  stars: number;
  unlocked: boolean;
}

export interface UserProgress {
  name?: string;
  currentLevel: number;
  currentMode: 'phonics' | 'fill' | 'spell';
  totalStars: number;
  badges: string[];
  wordProgress: Record<string, WordProgress>;
  levelProgress: Record<number, LevelProgress>;
  streakDays: number;
  lastPlayedDate: string;
  totalWordsLearned: number;
}

const STORAGE_KEY = 'spelling-practice-progress';

const defaultProgress: UserProgress = {
  currentLevel: 1,
  currentMode: 'phonics',
  totalStars: 0,
  badges: [],
  wordProgress: {},
  levelProgress: {
    1: { level: 1, wordsCompleted: 0, totalWords: 32, stars: 0, unlocked: true },
    2: { level: 2, wordsCompleted: 0, totalWords: 32, stars: 0, unlocked: false },
    3: { level: 3, wordsCompleted: 0, totalWords: 40, stars: 0, unlocked: false },
  },
  streakDays: 0,
  lastPlayedDate: '',
  totalWordsLearned: 0,
};

export function getProgress(): UserProgress {
  if (typeof window === 'undefined') {
    return defaultProgress;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultProgress, ...parsed };
    }
  } catch (e) {
    console.error('Error loading progress:', e);
  }

  return defaultProgress;
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Error saving progress:', e);
  }
}

export function updateWordProgress(
  word: string,
  correct: boolean,
  progress: UserProgress
): UserProgress {
  const now = new Date().toISOString();
  const wordProg = progress.wordProgress[word] || {
    word,
    attempts: 0,
    correct: 0,
    lastPracticed: now,
    mastered: false,
    streak: 0,
  };

  wordProg.attempts += 1;
  wordProg.lastPracticed = now;

  if (correct) {
    wordProg.correct += 1;
    wordProg.streak += 1;
    if (wordProg.streak >= 3) {
      wordProg.mastered = true;
    }
  } else {
    wordProg.streak = 0;
  }

  const newProgress = {
    ...progress,
    wordProgress: {
      ...progress.wordProgress,
      [word]: wordProg,
    },
  };

  // Update level progress
  const masteredWordsInLevel = Object.values(newProgress.wordProgress).filter(
    (wp) => wp.mastered
  ).length;

  const levelProg = newProgress.levelProgress[progress.currentLevel];
  if (levelProg) {
    levelProg.wordsCompleted = masteredWordsInLevel;
  }

  return newProgress;
}

export function addStars(amount: number, progress: UserProgress): UserProgress {
  const newProgress = {
    ...progress,
    totalStars: progress.totalStars + amount,
  };

  // Update level stars
  const levelProg = newProgress.levelProgress[progress.currentLevel];
  if (levelProg) {
    levelProg.stars += amount;
  }

  // Check for badges
  const newBadges = [...progress.badges];

  if (newProgress.totalStars >= 10 && !newBadges.includes('first-10-stars')) {
    newBadges.push('first-10-stars');
  }
  if (newProgress.totalStars >= 50 && !newBadges.includes('star-collector')) {
    newBadges.push('star-collector');
  }
  if (newProgress.totalStars >= 100 && !newBadges.includes('superstar')) {
    newBadges.push('superstar');
  }

  const masteredWords = Object.values(newProgress.wordProgress).filter(
    (wp) => wp.mastered
  ).length;

  if (masteredWords >= 5 && !newBadges.includes('word-learner')) {
    newBadges.push('word-learner');
  }
  if (masteredWords >= 20 && !newBadges.includes('word-master')) {
    newBadges.push('word-master');
  }
  if (masteredWords >= 50 && !newBadges.includes('spelling-champion')) {
    newBadges.push('spelling-champion');
  }

  newProgress.badges = newBadges;

  return newProgress;
}

export function unlockNextLevel(progress: UserProgress): UserProgress {
  const nextLevel = progress.currentLevel + 1;
  if (nextLevel <= 3 && progress.levelProgress[nextLevel]) {
    return {
      ...progress,
      levelProgress: {
        ...progress.levelProgress,
        [nextLevel]: {
          ...progress.levelProgress[nextLevel],
          unlocked: true,
        },
      },
    };
  }
  return progress;
}

export function updateStreak(progress: UserProgress): UserProgress {
  const today = new Date().toISOString().split('T')[0];
  const lastPlayed = progress.lastPlayedDate;

  if (lastPlayed === today) {
    return progress;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak = progress.streakDays;
  if (lastPlayed === yesterdayStr) {
    newStreak += 1;
  } else if (lastPlayed !== today) {
    newStreak = 1;
  }

  const newProgress = {
    ...progress,
    streakDays: newStreak,
    lastPlayedDate: today,
  };

  // Streak badges
  const newBadges = [...progress.badges];
  if (newStreak >= 3 && !newBadges.includes('3-day-streak')) {
    newBadges.push('3-day-streak');
  }
  if (newStreak >= 7 && !newBadges.includes('week-warrior')) {
    newBadges.push('week-warrior');
  }
  if (newStreak >= 30 && !newBadges.includes('monthly-master')) {
    newBadges.push('monthly-master');
  }
  newProgress.badges = newBadges;

  return newProgress;
}

export function resetProgress(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export const BADGES: Record<string, { name: string; description: string; emoji: string }> = {
  'first-10-stars': {
    name: 'Rising Star',
    description: 'Earned 10 stars',
    emoji: '⭐',
  },
  'star-collector': {
    name: 'Star Collector',
    description: 'Earned 50 stars',
    emoji: '🌟',
  },
  'superstar': {
    name: 'Superstar',
    description: 'Earned 100 stars',
    emoji: '💫',
  },
  'word-learner': {
    name: 'Word Learner',
    description: 'Mastered 5 words',
    emoji: '📚',
  },
  'word-master': {
    name: 'Word Master',
    description: 'Mastered 20 words',
    emoji: '🎓',
  },
  'spelling-champion': {
    name: 'Spelling Champion',
    description: 'Mastered 50 words',
    emoji: '🏆',
  },
  '3-day-streak': {
    name: 'Getting Started',
    description: '3 days in a row',
    emoji: '🔥',
  },
  'week-warrior': {
    name: 'Week Warrior',
    description: '7 days in a row',
    emoji: '💪',
  },
  'monthly-master': {
    name: 'Monthly Master',
    description: '30 days in a row',
    emoji: '👑',
  },
};
