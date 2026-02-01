// Progress tracking with localStorage
import {
  PetState,
  createDefaultPet,
  getLevelFromXP,
  getStageFromLevel,
  getUnlockedSkills,
  calculateHappinessDecay,
  cleanupExpiredEffects,
  PET_SKILLS,
} from './pet';

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

  // Pet system
  pet: PetState;
  totalXP: number;
  xpEarnedToday: number;
  lastXPDate: string;
  isFirstSessionToday: boolean;
  wordsCompletedToday: number;
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

  // Pet system defaults
  pet: createDefaultPet(),
  totalXP: 0,
  xpEarnedToday: 0,
  lastXPDate: '',
  isFirstSessionToday: true,
  wordsCompletedToday: 0,
};

export function getProgress(): UserProgress {
  if (typeof window === 'undefined') {
    return defaultProgress;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Apply migration for existing users without pet data
      const migrated = migrateProgress({ ...defaultProgress, ...parsed });
      // Apply happiness decay and cleanup expired effects
      return applyDailyUpdates(migrated);
    }
  } catch (e) {
    console.error('Error loading progress:', e);
  }

  return defaultProgress;
}

/**
 * Migrate old progress data to include pet system
 */
function migrateProgress(progress: UserProgress): UserProgress {
  // If pet already exists and has valid data, no migration needed
  if (progress.pet && progress.pet.species && progress.pet.birthDate) {
    return progress;
  }

  // Create default pet for existing users
  const defaultPet = createDefaultPet();

  // Reward existing users with XP based on their stars
  const bonusXP = Math.floor((progress.totalStars || 0) * 2);
  const initialLevel = getLevelFromXP(bonusXP);
  const initialStage = getStageFromLevel(initialLevel);

  // Build evolved stages based on level
  const evolvedAt: Partial<Record<string, string>> = { egg: defaultPet.birthDate };
  if (initialLevel >= 6) evolvedAt.baby = defaultPet.birthDate;
  if (initialLevel >= 16) evolvedAt.child = defaultPet.birthDate;
  if (initialLevel >= 31) evolvedAt.teen = defaultPet.birthDate;
  if (initialLevel >= 51) evolvedAt.adult = defaultPet.birthDate;

  return {
    ...progress,
    pet: {
      ...defaultPet,
      xp: bonusXP,
      level: initialLevel,
      stage: initialStage,
      unlockedSkills: getUnlockedSkills(initialLevel).map(s => s.id),
      evolvedAt: evolvedAt as PetState['evolvedAt'],
    },
    totalXP: bonusXP,
    xpEarnedToday: 0,
    lastXPDate: '',
    isFirstSessionToday: true,
    wordsCompletedToday: 0,
  };
}

/**
 * Apply daily updates: happiness decay, check first session, cleanup effects
 */
function applyDailyUpdates(progress: UserProgress): UserProgress {
  const today = new Date().toISOString().split('T')[0];
  const isFirstSession = progress.lastXPDate !== today;

  // Calculate happiness decay if not practiced today
  const decayedHappiness = calculateHappinessDecay(
    progress.pet.lastFedDate,
    progress.pet.happiness
  );

  // Cleanup expired active effects
  const cleanedEffects = cleanupExpiredEffects(progress.pet.activeEffects);

  return {
    ...progress,
    isFirstSessionToday: isFirstSession,
    xpEarnedToday: isFirstSession ? 0 : progress.xpEarnedToday,
    wordsCompletedToday: isFirstSession ? 0 : progress.wordsCompletedToday,
    pet: {
      ...progress.pet,
      happiness: decayedHappiness,
      activeEffects: cleanedEffects,
    },
  };
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

// ============================================
// Pet System Functions
// ============================================

export interface EvolutionResult {
  evolved: boolean;
  oldStage: PetState['stage'];
  newStage: PetState['stage'];
}

/**
 * Add XP to the pet and check for evolution
 */
export function addXP(amount: number, progress: UserProgress): { progress: UserProgress; evolution: EvolutionResult | null } {
  const newTotalXP = progress.totalXP + amount;
  const newLevel = getLevelFromXP(newTotalXP);
  const oldStage = progress.pet.stage;
  const newStage = getStageFromLevel(newLevel);

  let updatedPet = {
    ...progress.pet,
    xp: newTotalXP,
    level: newLevel,
    stage: newStage,
  };

  let evolution: EvolutionResult | null = null;

  // Check for evolution
  if (newStage !== oldStage) {
    updatedPet = {
      ...updatedPet,
      evolvedAt: {
        ...updatedPet.evolvedAt,
        [newStage]: new Date().toISOString(),
      },
      // Unlock new skills
      unlockedSkills: getUnlockedSkills(newLevel).map(s => s.id),
    };
    evolution = { evolved: true, oldStage, newStage };
  } else {
    // Check for new skill unlocks without evolution
    const unlockedSkills = getUnlockedSkills(newLevel).map(s => s.id);
    if (unlockedSkills.length > updatedPet.unlockedSkills.length) {
      updatedPet = { ...updatedPet, unlockedSkills };
    }
  }

  const today = new Date().toISOString().split('T')[0];

  return {
    progress: {
      ...progress,
      totalXP: newTotalXP,
      xpEarnedToday: (progress.lastXPDate === today ? progress.xpEarnedToday : 0) + amount,
      lastXPDate: today,
      isFirstSessionToday: progress.lastXPDate !== today,
      pet: updatedPet,
    },
    evolution,
  };
}

/**
 * Feed the pet (called when completing a word)
 */
export function feedPet(progress: UserProgress): UserProgress {
  const today = new Date().toISOString().split('T')[0];
  const isNewDay = progress.pet.lastFedDate !== today;

  return {
    ...progress,
    pet: {
      ...progress.pet,
      lastFedDate: today,
      // Increase happiness when practicing (cap at 100)
      happiness: Math.min(100, progress.pet.happiness + (isNewDay ? 20 : 5)),
      totalWordsSpelled: progress.pet.totalWordsSpelled + 1,
    },
    wordsCompletedToday: (progress.lastXPDate === today ? progress.wordsCompletedToday : 0) + 1,
  };
}

/**
 * Activate a pet skill
 */
export function activateSkill(skillId: string, progress: UserProgress): UserProgress {
  const skill = PET_SKILLS.find(s => s.id === skillId);
  if (!skill) return progress;

  // Check if skill is unlocked
  if (!progress.pet.unlockedSkills.includes(skillId)) return progress;

  const now = new Date();
  let expiresAt = now.toISOString();

  // Calculate expiration based on skill type
  if (skill.effect.durationMinutes) {
    expiresAt = new Date(now.getTime() + skill.effect.durationMinutes * 60 * 1000).toISOString();
  } else {
    // For instant effects, set expiration to far future (will be cleaned up after use)
    expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  }

  const newEffect = {
    skillId,
    effect: skill.effect,
    expiresAt,
  };

  return {
    ...progress,
    pet: {
      ...progress.pet,
      activeEffects: [...progress.pet.activeEffects, newEffect],
    },
  };
}

/**
 * Rename the pet
 */
export function renamePet(newName: string, progress: UserProgress): UserProgress {
  return {
    ...progress,
    pet: {
      ...progress.pet,
      name: newName.trim() || progress.pet.name,
    },
  };
}

// Re-export pet types and functions for convenience
export type { PetState, PetStage, PetMood } from './pet';
export {
  calculateXP,
  getPetMood,
  getXPProgress,
  PET_EMOJIS,
  PET_STAGE_NAMES_ZH,
  PET_ANIMATIONS,
  MOOD_ANIMATIONS,
  PET_SKILLS,
  getXPToNextEvolution,
  isSkillOnCooldown,
  getSkillCooldownRemaining,
} from './pet';
