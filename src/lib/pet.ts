// Pet Raising/Evolution System
// 寵物養成系統 - 透過練習串字來養大虛擬寵物

// ============================================
// Types & Interfaces
// ============================================

export type PetStage = 'egg' | 'baby' | 'child' | 'teen' | 'adult';
export type PetMood = 'happy' | 'content' | 'hungry' | 'sleepy';
export type PetSpecies = 'dragon'; // Future: 'bunny' | 'fox' | 'panda' | 'phoenix'

export type SkillEffectType =
  | 'hint_reveal'
  | 'xp_multiplier'
  | 'streak_protection'
  | 'bonus_stars'
  | 'extra_attempt';

export interface SkillEffect {
  type: SkillEffectType;
  value: number;           // letters to reveal, multiplier, days, etc.
  durationMinutes?: number; // For time-based effects
}

export interface PetSkill {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  emoji: string;
  unlockLevel: number;
  effect: SkillEffect;
  cooldownHours: number;
}

export interface ActiveEffect {
  skillId: string;
  effect: SkillEffect;
  expiresAt: string;  // ISO date string
  usesRemaining?: number; // For per-use effects
}

export interface PetState {
  // Core identity
  name: string;
  species: PetSpecies;

  // Progression
  stage: PetStage;
  xp: number;
  level: number;

  // Health/Happiness
  lastFedDate: string;     // ISO date - tracks daily practice
  happiness: number;       // 0-100

  // Skills
  unlockedSkills: string[];
  activeEffects: ActiveEffect[];

  // Milestones
  evolvedAt: Partial<Record<PetStage, string>>;
  totalWordsSpelled: number;
  birthDate: string;
}

export interface XPCalculation {
  baseXP: number;
  starBonus: number;
  streakMultiplier: number;
  dailyFirstBonus: number;
  modeBonus: number;
  skillMultiplier: number;
  totalXP: number;
}

// ============================================
// Constants
// ============================================

// Evolution thresholds
export const EVOLUTION_THRESHOLDS: Record<PetStage, { minLevel: number; minXP: number }> = {
  egg: { minLevel: 1, minXP: 0 },
  baby: { minLevel: 6, minXP: 100 },
  child: { minLevel: 16, minXP: 500 },
  teen: { minLevel: 31, minXP: 1500 },
  adult: { minLevel: 51, minXP: 4000 }
};

// Pet visuals by stage
export const PET_EMOJIS: Record<PetStage, string> = {
  egg: '🥚',
  baby: '🐣',
  child: '🦎',
  teen: '🐲',
  adult: '🐉'
};

// Pet stage names in Chinese
export const PET_STAGE_NAMES_ZH: Record<PetStage, string> = {
  egg: '蛋蛋',
  baby: 'BB仔',
  child: '細路仔',
  teen: '少年龍',
  adult: '成年龍'
};

// CSS animation classes by stage
export const PET_ANIMATIONS: Record<PetStage, string> = {
  egg: 'animate-wobble',
  baby: 'animate-bounce-gentle',
  child: 'animate-sway',
  teen: 'animate-float',
  adult: 'animate-glow-float'
};

// Mood animations
export const MOOD_ANIMATIONS: Record<PetMood, string> = {
  happy: 'animate-bounce-gentle',
  content: 'animate-sway',
  hungry: 'animate-droop',
  sleepy: 'animate-zzz'
};

// Skills definitions
export const PET_SKILLS: PetSkill[] = [
  // Baby stage (Level 6+)
  {
    id: 'peek',
    name: 'Peek',
    nameZh: '偷睇一下',
    description: 'Reveals 1 letter in the word',
    descriptionZh: '顯示一個字母',
    emoji: '👀',
    unlockLevel: 6,
    effect: { type: 'hint_reveal', value: 1 },
    cooldownHours: 1
  },

  // Child stage (Level 16+)
  {
    id: 'focus',
    name: 'Focus Power',
    nameZh: '專注力',
    description: '1.5x XP for 10 minutes',
    descriptionZh: '10分鐘內經驗值 x1.5',
    emoji: '🎯',
    unlockLevel: 16,
    effect: { type: 'xp_multiplier', value: 1.5, durationMinutes: 10 },
    cooldownHours: 24
  },
  {
    id: 'shield',
    name: 'Streak Shield',
    nameZh: '護盾',
    description: 'Protects streak for 1 day',
    descriptionZh: '保護連續練習一天',
    emoji: '🛡️',
    unlockLevel: 20,
    effect: { type: 'streak_protection', value: 1 },
    cooldownHours: 168  // 7 days
  },

  // Teen stage (Level 31+)
  {
    id: 'double_peek',
    name: 'Super Peek',
    nameZh: '超級偷睇',
    description: 'Reveals 2 letters',
    descriptionZh: '顯示兩個字母',
    emoji: '🔍',
    unlockLevel: 31,
    effect: { type: 'hint_reveal', value: 2 },
    cooldownHours: 2
  },
  {
    id: 'star_boost',
    name: 'Star Boost',
    nameZh: '星星加成',
    description: '+1 bonus star per word',
    descriptionZh: '每個字額外加一粒星',
    emoji: '⭐',
    unlockLevel: 40,
    effect: { type: 'bonus_stars', value: 1 },
    cooldownHours: 12
  },

  // Adult stage (Level 51+)
  {
    id: 'mega_focus',
    name: 'Mega Focus',
    nameZh: '超級專注',
    description: '2x XP for 15 minutes',
    descriptionZh: '15分鐘內經驗值 x2',
    emoji: '🔥',
    unlockLevel: 51,
    effect: { type: 'xp_multiplier', value: 2, durationMinutes: 15 },
    cooldownHours: 48
  },
  {
    id: 'extra_life',
    name: 'Extra Life',
    nameZh: '額外機會',
    description: '+1 attempt before reset',
    descriptionZh: '串錯多一次機會',
    emoji: '💖',
    unlockLevel: 60,
    effect: { type: 'extra_attempt', value: 1 },
    cooldownHours: 4
  }
];

// ============================================
// XP & Level Calculations
// ============================================

/**
 * Calculate XP required for a given level
 * Formula: 10 * N * (N + 1) / 2
 * Level 1: 0 XP, Level 2: 20 XP, Level 5: 100 XP, etc.
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 10 * level * (level + 1) / 2;
}

/**
 * Get level from total XP
 */
export function getLevelFromXP(xp: number): number {
  if (xp <= 0) return 1;
  // Inverse of formula: solve for N in XP = 10 * N * (N + 1) / 2
  // N = (-1 + sqrt(1 + 0.8 * XP)) / 2
  const level = Math.floor((-1 + Math.sqrt(1 + 0.8 * xp)) / 2) + 1;
  return Math.max(1, level);
}

/**
 * Get XP progress within current level (0-100%)
 */
export function getXPProgress(xp: number): { current: number; needed: number; percent: number } {
  const level = getLevelFromXP(xp);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const current = xp - currentLevelXP;
  const needed = nextLevelXP - currentLevelXP;
  const percent = Math.min(100, Math.floor((current / needed) * 100));

  return { current, needed, percent };
}

/**
 * Get pet stage from level
 */
export function getStageFromLevel(level: number): PetStage {
  if (level >= 51) return 'adult';
  if (level >= 31) return 'teen';
  if (level >= 16) return 'child';
  if (level >= 6) return 'baby';
  return 'egg';
}

// ============================================
// XP Earning Calculations
// ============================================

/**
 * Calculate XP earned from completing a word
 */
export function calculateXP(
  starsEarned: number,
  attempts: number,
  isFirstSessionToday: boolean,
  streakDays: number,
  mode: 'phonics' | 'fill' | 'spell',
  activeEffects: ActiveEffect[]
): XPCalculation {
  // Base XP based on attempts (more stars = more XP)
  const baseXP = attempts === 1 ? 15 : attempts === 2 ? 10 : 5;

  // Star bonus: +2 XP per star
  const starBonus = starsEarned * 2;

  // Streak multiplier: +3% per day, max 100% (2x at 30 days)
  const streakMultiplier = Math.min(1 + streakDays * 0.03, 2);

  // First session of day bonus
  const dailyFirstBonus = isFirstSessionToday ? 10 : 0;

  // Mode bonus: harder modes give more XP
  const modeBonus = mode === 'spell' ? 5 : mode === 'fill' ? 2 : 0;

  // Active skill effects (XP multiplier)
  let skillMultiplier = 1;
  const now = new Date();
  activeEffects.forEach(effect => {
    if (effect.effect.type === 'xp_multiplier' && new Date(effect.expiresAt) > now) {
      skillMultiplier *= effect.effect.value;
    }
  });

  // Calculate total
  const subtotal = (baseXP + starBonus + dailyFirstBonus + modeBonus) * streakMultiplier;
  const totalXP = Math.floor(subtotal * skillMultiplier);

  return {
    baseXP,
    starBonus,
    streakMultiplier,
    dailyFirstBonus,
    modeBonus,
    skillMultiplier,
    totalXP
  };
}

// ============================================
// Pet State Management
// ============================================

/**
 * Get pet mood based on happiness
 */
export function getPetMood(happiness: number, lastFedDate: string): PetMood {
  const today = new Date().toISOString().split('T')[0];
  const fedToday = lastFedDate === today;

  if (happiness >= 70) return 'happy';
  if (happiness >= 40) return fedToday ? 'content' : 'hungry';
  if (happiness >= 20) return 'hungry';
  return 'sleepy';
}

/**
 * Calculate happiness decay based on days not practiced
 */
export function calculateHappinessDecay(lastFedDate: string, currentHappiness: number): number {
  const today = new Date();
  const lastFed = new Date(lastFedDate);
  const daysSinceLastFed = Math.floor(
    (today.getTime() - lastFed.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastFed <= 0) return currentHappiness;

  // Lose 15 happiness per day not practiced
  const decay = daysSinceLastFed * 15;
  return Math.max(0, currentHappiness - decay);
}

/**
 * Get skills available at a given level
 */
export function getUnlockedSkills(level: number): PetSkill[] {
  return PET_SKILLS.filter(skill => skill.unlockLevel <= level);
}

/**
 * Check if a skill is on cooldown
 */
export function isSkillOnCooldown(skillId: string, lastUsed?: string): boolean {
  if (!lastUsed) return false;

  const skill = PET_SKILLS.find(s => s.id === skillId);
  if (!skill) return false;

  const lastUsedTime = new Date(lastUsed).getTime();
  const cooldownMs = skill.cooldownHours * 60 * 60 * 1000;
  const now = Date.now();

  return now - lastUsedTime < cooldownMs;
}

/**
 * Get remaining cooldown time for a skill
 */
export function getSkillCooldownRemaining(skillId: string, lastUsed?: string): number {
  if (!lastUsed) return 0;

  const skill = PET_SKILLS.find(s => s.id === skillId);
  if (!skill) return 0;

  const lastUsedTime = new Date(lastUsed).getTime();
  const cooldownMs = skill.cooldownHours * 60 * 60 * 1000;
  const now = Date.now();
  const remaining = (lastUsedTime + cooldownMs) - now;

  return Math.max(0, remaining);
}

/**
 * Clean up expired active effects
 */
export function cleanupExpiredEffects(activeEffects: ActiveEffect[]): ActiveEffect[] {
  const now = new Date();
  return activeEffects.filter(effect => new Date(effect.expiresAt) > now);
}

/**
 * Create default pet state for new users
 */
export function createDefaultPet(name: string = '小龍龍'): PetState {
  const now = new Date().toISOString();
  const today = now.split('T')[0];

  return {
    name,
    species: 'dragon',
    stage: 'egg',
    xp: 0,
    level: 1,
    lastFedDate: today,
    happiness: 50,
    unlockedSkills: [],
    activeEffects: [],
    evolvedAt: { egg: now },
    totalWordsSpelled: 0,
    birthDate: now
  };
}

/**
 * Check if pet should evolve and return new stage if so
 */
export function checkEvolution(currentStage: PetStage, level: number): PetStage | null {
  const newStage = getStageFromLevel(level);
  if (newStage !== currentStage) {
    return newStage;
  }
  return null;
}

/**
 * Get XP needed for next evolution
 */
export function getXPToNextEvolution(xp: number, stage: PetStage): { needed: number; current: number } | null {
  const stages: PetStage[] = ['egg', 'baby', 'child', 'teen', 'adult'];
  const currentIndex = stages.indexOf(stage);

  if (currentIndex >= stages.length - 1) {
    return null; // Already at max evolution
  }

  const nextStage = stages[currentIndex + 1];
  const threshold = EVOLUTION_THRESHOLDS[nextStage].minXP;

  return {
    needed: threshold,
    current: xp
  };
}
