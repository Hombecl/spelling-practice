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
  FoodItem,
  DailyTask,
  InteractionResponse,
  getPatResponse,
  canPatPet,
  getRemainingPats,
  HAPPINESS_PER_PAT,
  XP_PER_PAT,
  MAX_PATS_PER_DAY,
  FOOD_TYPES,
  DAILY_TASKS,
  calculateFoodReward,
  getAvailableDailyTasks,
  // Events & Items imports
  RandomEvent,
  ActiveEvent,
  Item,
  InventoryItem,
  ActiveItemEffect,
  ITEMS,
  ALL_EVENTS,
  shouldTriggerEvent,
  generateRandomEvent,
  createActiveEvent,
  isEventExpired,
  getEventById,
  calculateItemDrop,
  addItemToInventory,
  removeItemFromInventory,
  hasItem,
  useItem,
  cleanupExpiredItemEffects,
  getActiveXPMultiplier,
  getActiveHappinessMultiplier,
  equipItem,
  unequipItem,
  buyItem,
  getShopItems,
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

  // Parent settings
  activeWordListId?: string; // null/undefined = use built-in words

  // Adventure mode
  adventureProgress?: import('./adventure').AdventureProgress;
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
 * Apply daily updates: happiness decay, check first session, cleanup effects, reset daily tasks
 */
function applyDailyUpdates(progress: UserProgress): UserProgress {
  const today = new Date().toISOString().split('T')[0];
  const isFirstSession = progress.lastXPDate !== today;
  const isNewDay = progress.pet.lastPatDate !== today;

  // Calculate happiness decay if not practiced today
  const decayedHappiness = calculateHappinessDecay(
    progress.pet.lastFedDate,
    progress.pet.happiness
  );

  // Cleanup expired active effects
  const cleanedEffects = cleanupExpiredEffects(progress.pet.activeEffects);

  // Reset daily tasks and pats if new day
  const resetDailyTasks = progress.pet.lastDailyTaskDate !== today;

  // Cleanup expired item effects
  const cleanedItemEffects = cleanupExpiredItemEffects(progress.pet.activeItemEffects || []);

  // Check if active event expired
  const currentEvent = progress.pet.activeEvent;
  const eventExpired = isEventExpired(currentEvent);

  // Check if should trigger new event (only if no active event or expired)
  let newEvent = currentEvent;
  let newLastEventDate = progress.pet.lastEventDate || '';

  if (eventExpired && shouldTriggerEvent(progress.pet.lastEventDate || '')) {
    const randomEvent = generateRandomEvent();
    newEvent = createActiveEvent(randomEvent);
    newLastEventDate = new Date().toISOString().split('T')[0];
  } else if (eventExpired) {
    newEvent = null;
  }

  return {
    ...progress,
    isFirstSessionToday: isFirstSession,
    xpEarnedToday: isFirstSession ? 0 : progress.xpEarnedToday,
    wordsCompletedToday: isFirstSession ? 0 : progress.wordsCompletedToday,
    pet: {
      ...progress.pet,
      happiness: decayedHappiness,
      activeEffects: cleanedEffects,
      // Reset pats for new day
      patsToday: isNewDay ? 0 : (progress.pet.patsToday || 0),
      lastPatDate: progress.pet.lastPatDate || '',
      // Reset daily tasks for new day
      dailyTasksCompleted: resetDailyTasks ? [] : (progress.pet.dailyTasksCompleted || []),
      lastDailyTaskDate: progress.pet.lastDailyTaskDate || '',
      // Ensure interaction fields exist
      foodInventory: progress.pet.foodInventory || [],
      lastInteractionTime: progress.pet.lastInteractionTime || '',
      // Events & Items fields
      activeEvent: newEvent,
      lastEventDate: newLastEventDate,
      itemInventory: progress.pet.itemInventory || [],
      equippedItems: progress.pet.equippedItems || [],
      activeItemEffects: cleanedItemEffects,
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

// ============================================
// Pet Interaction Functions
// ============================================

export interface PatResult {
  success: boolean;
  response: InteractionResponse;
  happinessGained: number;
  xpGained: number;
  remainingPats: number;
}

/**
 * Pat the pet - increases happiness and gives small XP
 */
export function patPet(progress: UserProgress): { progress: UserProgress; result: PatResult } {
  const today = new Date().toISOString().split('T')[0];

  // Check if can pat
  if (!canPatPet(progress.pet)) {
    return {
      progress,
      result: {
        success: false,
        response: { animation: '', message: '今日已經摸夠喇！明天再嚟～', emoji: '😅' },
        happinessGained: 0,
        xpGained: 0,
        remainingPats: 0,
      },
    };
  }

  // Reset count if new day
  const patsToday = progress.pet.lastPatDate === today ? progress.pet.patsToday + 1 : 1;
  const response = getPatResponse(progress.pet.stage);

  const newProgress: UserProgress = {
    ...progress,
    totalXP: progress.totalXP + XP_PER_PAT,
    pet: {
      ...progress.pet,
      happiness: Math.min(100, progress.pet.happiness + HAPPINESS_PER_PAT),
      patsToday,
      lastPatDate: today,
      lastInteractionTime: new Date().toISOString(),
    },
  };

  return {
    progress: newProgress,
    result: {
      success: true,
      response,
      happinessGained: HAPPINESS_PER_PAT,
      xpGained: XP_PER_PAT,
      remainingPats: MAX_PATS_PER_DAY - patsToday,
    },
  };
}

export interface FeedResult {
  success: boolean;
  message: string;
  happinessGained: number;
  xpGained: number;
}

/**
 * Feed the pet with food from inventory
 */
export function feedPetWithFood(
  foodType: 'dragon_fruit' | 'magic_berry' | 'star_candy',
  progress: UserProgress
): { progress: UserProgress; result: FeedResult } {
  // Check if has food
  const foodIndex = progress.pet.foodInventory.findIndex(f => f.type === foodType && f.quantity > 0);

  if (foodIndex === -1) {
    return {
      progress,
      result: {
        success: false,
        message: '冇呢種食物喇！',
        happinessGained: 0,
        xpGained: 0,
      },
    };
  }

  const foodInfo = FOOD_TYPES[foodType];
  const newInventory = [...progress.pet.foodInventory];

  // Decrease quantity or remove
  if (newInventory[foodIndex].quantity <= 1) {
    newInventory.splice(foodIndex, 1);
  } else {
    newInventory[foodIndex] = {
      ...newInventory[foodIndex],
      quantity: newInventory[foodIndex].quantity - 1,
    };
  }

  const newProgress: UserProgress = {
    ...progress,
    totalXP: progress.totalXP + foodInfo.xpBoost,
    pet: {
      ...progress.pet,
      happiness: Math.min(100, progress.pet.happiness + foodInfo.happinessBoost),
      foodInventory: newInventory,
      lastInteractionTime: new Date().toISOString(),
    },
  };

  return {
    progress: newProgress,
    result: {
      success: true,
      message: `${progress.pet.name} 好鍾意食 ${foodInfo.nameZh}！`,
      happinessGained: foodInfo.happinessBoost,
      xpGained: foodInfo.xpBoost,
    },
  };
}

/**
 * Add food to inventory (called after practice)
 */
export function addFoodReward(
  food: FoodItem,
  progress: UserProgress
): UserProgress {
  const existingIndex = progress.pet.foodInventory.findIndex(f => f.type === food.type);

  let newInventory: FoodItem[];
  if (existingIndex >= 0) {
    newInventory = [...progress.pet.foodInventory];
    newInventory[existingIndex] = {
      ...newInventory[existingIndex],
      quantity: newInventory[existingIndex].quantity + food.quantity,
    };
  } else {
    newInventory = [...progress.pet.foodInventory, food];
  }

  return {
    ...progress,
    pet: {
      ...progress.pet,
      foodInventory: newInventory,
    },
  };
}

export interface DailyTaskResult {
  success: boolean;
  task: DailyTask;
  xpGained: number;
  happinessGained: number;
}

/**
 * Complete a daily task
 */
export function completeDailyTask(
  taskId: string,
  progress: UserProgress
): { progress: UserProgress; result: DailyTaskResult | null } {
  const today = new Date().toISOString().split('T')[0];
  const task = DAILY_TASKS.find(t => t.id === taskId);

  if (!task) {
    return { progress, result: null };
  }

  // Check if already completed
  const completedTasks = progress.pet.lastDailyTaskDate === today
    ? progress.pet.dailyTasksCompleted
    : [];

  if (completedTasks.includes(taskId)) {
    return { progress, result: null };
  }

  // Check time window
  if (task.timeWindow) {
    const currentHour = new Date().getHours();
    if (currentHour < task.timeWindow.start || currentHour > task.timeWindow.end) {
      return { progress, result: null };
    }
  }

  const newProgress: UserProgress = {
    ...progress,
    totalXP: progress.totalXP + task.xpReward,
    pet: {
      ...progress.pet,
      happiness: Math.min(100, progress.pet.happiness + task.happinessReward),
      dailyTasksCompleted: [...completedTasks, taskId],
      lastDailyTaskDate: today,
      lastInteractionTime: new Date().toISOString(),
    },
  };

  return {
    progress: newProgress,
    result: {
      success: true,
      task,
      xpGained: task.xpReward,
      happinessGained: task.happinessReward,
    },
  };
}

/**
 * Get food inventory summary
 */
export function getFoodInventorySummary(progress: UserProgress): { type: string; nameZh: string; emoji: string; quantity: number }[] {
  return progress.pet.foodInventory.map(food => ({
    type: food.type,
    nameZh: FOOD_TYPES[food.type].nameZh,
    emoji: FOOD_TYPES[food.type].emoji,
    quantity: food.quantity,
  }));
}

// Re-export pet types and functions for convenience
export type {
  PetState,
  PetStage,
  PetMood,
  FoodItem,
  DailyTask,
  InteractionResponse,
  // Events & Items types
  RandomEvent,
  ActiveEvent,
  Item,
  InventoryItem,
  ActiveItemEffect,
  ItemRarity,
  ItemCategory,
  EventType,
} from './pet';
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
  // Interaction exports
  getPatResponse,
  canPatPet,
  getRemainingPats,
  getRandomSpeech,
  getAvailableDailyTasks,
  calculateFoodReward,
  FOOD_TYPES,
  DAILY_TASKS,
  MAX_PATS_PER_DAY,
  PAT_RESPONSES,
  PET_SPEECHES,
  // Events exports
  WEATHER_EVENTS,
  VISITOR_EVENTS,
  DISCOVERY_EVENTS,
  ALL_EVENTS,
  shouldTriggerEvent,
  generateRandomEvent,
  createActiveEvent,
  isEventExpired,
  getEventById,
  // Items exports
  ITEMS,
  getShopItems,
  calculateItemDrop,
  addItemToInventory,
  removeItemFromInventory,
  hasItem,
  useItem,
  cleanupExpiredItemEffects,
  getActiveXPMultiplier,
  getActiveHappinessMultiplier,
  equipItem,
  unequipItem,
  buyItem,
} from './pet';
