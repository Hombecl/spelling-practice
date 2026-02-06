// Pet Evolution System - Pixel Art Pet with Branching Evolution Paths
// 寵物進化系統 - 像素風寵物養成，有分支進化路線

// ============================================
// Evolution Types & Interfaces
// ============================================

export type EvolutionStage = 'egg' | 'baby' | 'child' | 'teen' | 'adult';
export type EvolutionRoute = 'scholar' | 'balanced' | 'speed';
export type PetType = 'unicorn' | 'dragon' | 'ghost_cat' | 'mecha_bird' | 'crystal_rabbit';

// Evolution route determination based on accuracy
export interface EvolutionStats {
  totalWords: number;
  correctFirstTry: number;
  totalAttempts: number;
  practiceDays: number;
  averageAccuracy: number; // Calculated: correctFirstTry / totalWords * 100
}

// Pet form based on type, stage, and route
export interface PetForm {
  type: PetType;
  stage: EvolutionStage;
  route?: EvolutionRoute; // Only for teen and adult stages
  nameZh: string;
  nameEn: string;
  description: string;
  emoji: string;
  color: string; // Primary theme color
  animations: {
    idle: string;
    happy: string;
    sad: string;
    evolving: string;
  };
}

// Evolution requirements
export interface EvolutionRequirement {
  minLevel: number;
  minXP: number;
  minPracticeDays: number;
  minAccuracy?: number; // For route determination
  maxAccuracy?: number;
}

// ============================================
// Pet Type Definitions
// ============================================

export interface PetTypeInfo {
  id: PetType;
  nameZh: string;
  nameEn: string;
  descriptionZh: string;
  element: string;
  emoji: string;
  primaryColor: string;
  secondaryColor: string;
  // Forms by stage (and route for teen/adult)
  forms: Record<string, PetForm>;
}

export const PET_TYPES: Record<PetType, PetTypeInfo> = {
  unicorn: {
    id: 'unicorn',
    nameZh: '獨角獸',
    nameEn: 'Unicorn',
    descriptionZh: '夢幻嘅魔法獨角獸，擁有治癒之力',
    element: 'magic',
    emoji: '🦄',
    primaryColor: '#ec4899', // Pink
    secondaryColor: '#a855f7', // Purple
    forms: {
      egg: { type: 'unicorn', stage: 'egg', nameZh: '魔法蛋', nameEn: 'Magic Egg', description: '閃閃發光嘅粉紅蛋', emoji: '🥚', color: '#fce7f3', animations: { idle: 'animate-wobble', happy: 'animate-bounce', sad: 'animate-droop', evolving: 'animate-glow-pulse' } },
      baby: { type: 'unicorn', stage: 'baby', nameZh: '小獨角', nameEn: 'Unibaby', description: '剛出生嘅小獨角獸', emoji: '🦄', color: '#fbcfe8', animations: { idle: 'animate-bounce-gentle', happy: 'animate-jump', sad: 'animate-sad-sway', evolving: 'animate-evolve-spin' } },
      child: { type: 'unicorn', stage: 'child', nameZh: '彩虹獸', nameEn: 'Rainicorn', description: '學會變出彩虹', emoji: '🌈', color: '#f9a8d4', animations: { idle: 'animate-sway', happy: 'animate-sparkle-bounce', sad: 'animate-droop-slow', evolving: 'animate-rainbow-burst' } },
      // Teen stage - 3 routes
      'teen-scholar': { type: 'unicorn', stage: 'teen', route: 'scholar', nameZh: '賢者獸', nameEn: 'Sage Horn', description: '專注學習嘅智慧獨角獸', emoji: '📚', color: '#e879f9', animations: { idle: 'animate-float', happy: 'animate-sparkle', sad: 'animate-droop', evolving: 'animate-wisdom-glow' } },
      'teen-balanced': { type: 'unicorn', stage: 'teen', route: 'balanced', nameZh: '光輝獸', nameEn: 'Radiant Horn', description: '平衡發展嘅獨角獸', emoji: '✨', color: '#d946ef', animations: { idle: 'animate-float', happy: 'animate-sparkle', sad: 'animate-droop', evolving: 'animate-light-burst' } },
      'teen-speed': { type: 'unicorn', stage: 'teen', route: 'speed', nameZh: '疾風獸', nameEn: 'Swift Horn', description: '速度型嘅獨角獸', emoji: '💨', color: '#c026d3', animations: { idle: 'animate-fast-sway', happy: 'animate-zoom', sad: 'animate-slow', evolving: 'animate-wind-burst' } },
      // Adult stage - 3 routes
      'adult-scholar': { type: 'unicorn', stage: 'adult', route: 'scholar', nameZh: '天馬聖賢', nameEn: 'Celestial Sage', description: '最高智慧嘅天馬', emoji: '🌟', color: '#a855f7', animations: { idle: 'animate-glow-float', happy: 'animate-celestial', sad: 'animate-dim', evolving: 'animate-ascend' } },
      'adult-balanced': { type: 'unicorn', stage: 'adult', route: 'balanced', nameZh: '彩虹天馬', nameEn: 'Rainbow Pegasus', description: '完美平衡嘅天馬', emoji: '🦋', color: '#9333ea', animations: { idle: 'animate-glow-float', happy: 'animate-rainbow-aura', sad: 'animate-fade', evolving: 'animate-rainbow-ascend' } },
      'adult-speed': { type: 'unicorn', stage: 'adult', route: 'speed', nameZh: '疾風天馬', nameEn: 'Storm Pegasus', description: '風馳電掣嘅天馬', emoji: '⚡', color: '#7c3aed', animations: { idle: 'animate-fast-float', happy: 'animate-lightning', sad: 'animate-slow-down', evolving: 'animate-storm-ascend' } },
    },
  },
  dragon: {
    id: 'dragon',
    nameZh: '火龍',
    nameEn: 'Dragon',
    descriptionZh: '熱情嘅火焰之龍，力量強大',
    element: 'fire',
    emoji: '🐉',
    primaryColor: '#ef4444', // Red
    secondaryColor: '#f97316', // Orange
    forms: {
      egg: { type: 'dragon', stage: 'egg', nameZh: '火焰蛋', nameEn: 'Flame Egg', description: '溫暖嘅紅色蛋', emoji: '🥚', color: '#fef2f2', animations: { idle: 'animate-pulse-warm', happy: 'animate-flame-flicker', sad: 'animate-cool-down', evolving: 'animate-fire-burst' } },
      baby: { type: 'dragon', stage: 'baby', nameZh: '小火龍', nameEn: 'Flamelet', description: '剛出生嘅小火龍', emoji: '🔥', color: '#fecaca', animations: { idle: 'animate-bounce-gentle', happy: 'animate-flame-dance', sad: 'animate-smoke', evolving: 'animate-fire-grow' } },
      child: { type: 'dragon', stage: 'child', nameZh: '噴火獸', nameEn: 'Firebreath', description: '學會噴火嘅小龍', emoji: '🐲', color: '#fca5a5', animations: { idle: 'animate-sway', happy: 'animate-fire-breath', sad: 'animate-ember', evolving: 'animate-blaze' } },
      'teen-scholar': { type: 'dragon', stage: 'teen', route: 'scholar', nameZh: '智火龍', nameEn: 'Wise Flame', description: '智慧型嘅火龍', emoji: '📖', color: '#f87171', animations: { idle: 'animate-float', happy: 'animate-wisdom-fire', sad: 'animate-dim-flame', evolving: 'animate-ancient-fire' } },
      'teen-balanced': { type: 'dragon', stage: 'teen', route: 'balanced', nameZh: '炎龍', nameEn: 'Inferno', description: '平衡發展嘅火龍', emoji: '🌋', color: '#ef4444', animations: { idle: 'animate-float', happy: 'animate-lava-burst', sad: 'animate-cool', evolving: 'animate-volcano' } },
      'teen-speed': { type: 'dragon', stage: 'teen', route: 'speed', nameZh: '閃焰龍', nameEn: 'Flash Fire', description: '速度型嘅火龍', emoji: '⚡', color: '#dc2626', animations: { idle: 'animate-fast-sway', happy: 'animate-fire-dash', sad: 'animate-flicker', evolving: 'animate-fire-rush' } },
      'adult-scholar': { type: 'dragon', stage: 'adult', route: 'scholar', nameZh: '古龍聖賢', nameEn: 'Ancient Sage Dragon', description: '擁有古老智慧嘅神龍', emoji: '📜', color: '#b91c1c', animations: { idle: 'animate-glow-float', happy: 'animate-ancient-power', sad: 'animate-dormant', evolving: 'animate-enlighten' } },
      'adult-balanced': { type: 'dragon', stage: 'adult', route: 'balanced', nameZh: '帝王龍', nameEn: 'Emperor Dragon', description: '龍族之王', emoji: '👑', color: '#991b1b', animations: { idle: 'animate-glow-float', happy: 'animate-royal-flame', sad: 'animate-reign-end', evolving: 'animate-coronation' } },
      'adult-speed': { type: 'dragon', stage: 'adult', route: 'speed', nameZh: '疾風火龍', nameEn: 'Blaze Striker', description: '最快嘅火龍', emoji: '🌪️', color: '#7f1d1d', animations: { idle: 'animate-fast-float', happy: 'animate-fire-tornado', sad: 'animate-extinguish', evolving: 'animate-inferno-rise' } },
    },
  },
  ghost_cat: {
    id: 'ghost_cat',
    nameZh: '幽靈貓',
    nameEn: 'Ghost Cat',
    descriptionZh: '神秘嘅暗影之貓，可以隱身',
    element: 'shadow',
    emoji: '🐱',
    primaryColor: '#6366f1', // Indigo
    secondaryColor: '#4f46e5', // Deep indigo
    forms: {
      egg: { type: 'ghost_cat', stage: 'egg', nameZh: '暗影蛋', nameEn: 'Shadow Egg', description: '若隱若現嘅紫色蛋', emoji: '🥚', color: '#eef2ff', animations: { idle: 'animate-fade-pulse', happy: 'animate-phase', sad: 'animate-dim', evolving: 'animate-shadow-burst' } },
      baby: { type: 'ghost_cat', stage: 'baby', nameZh: '小幽靈', nameEn: 'Ghostling', description: '剛出生嘅小幽靈貓', emoji: '👻', color: '#e0e7ff', animations: { idle: 'animate-hover', happy: 'animate-phase-dance', sad: 'animate-fade-away', evolving: 'animate-materialize' } },
      child: { type: 'ghost_cat', stage: 'child', nameZh: '暗影貓', nameEn: 'Shadowpaw', description: '學會隱身嘅小貓', emoji: '🌙', color: '#c7d2fe', animations: { idle: 'animate-sway', happy: 'animate-teleport', sad: 'animate-disappear', evolving: 'animate-shadow-grow' } },
      'teen-scholar': { type: 'ghost_cat', stage: 'teen', route: 'scholar', nameZh: '智慧靈貓', nameEn: 'Mystic Cat', description: '智慧型嘅幽靈貓', emoji: '🔮', color: '#a5b4fc', animations: { idle: 'animate-float', happy: 'animate-magic-swirl', sad: 'animate-phase-out', evolving: 'animate-mystic-rise' } },
      'teen-balanced': { type: 'ghost_cat', stage: 'teen', route: 'balanced', nameZh: '幻影貓', nameEn: 'Phantom Cat', description: '平衡發展嘅幽靈貓', emoji: '✨', color: '#818cf8', animations: { idle: 'animate-float', happy: 'animate-illusion', sad: 'animate-fade', evolving: 'animate-phantom-rise' } },
      'teen-speed': { type: 'ghost_cat', stage: 'teen', route: 'speed', nameZh: '疾影貓', nameEn: 'Swift Shadow', description: '速度型嘅幽靈貓', emoji: '💨', color: '#6366f1', animations: { idle: 'animate-fast-sway', happy: 'animate-shadow-dash', sad: 'animate-slow-phase', evolving: 'animate-shadow-rush' } },
      'adult-scholar': { type: 'ghost_cat', stage: 'adult', route: 'scholar', nameZh: '九命聖靈', nameEn: 'Nine-Life Sage', description: '擁有九條命嘅智慧靈貓', emoji: '🌟', color: '#4f46e5', animations: { idle: 'animate-glow-float', happy: 'animate-nine-souls', sad: 'animate-soul-dim', evolving: 'animate-transcend' } },
      'adult-balanced': { type: 'ghost_cat', stage: 'adult', route: 'balanced', nameZh: '月光女神', nameEn: 'Luna Goddess', description: '月光守護神', emoji: '🌕', color: '#4338ca', animations: { idle: 'animate-glow-float', happy: 'animate-moonlight', sad: 'animate-eclipse', evolving: 'animate-moon-rise' } },
      'adult-speed': { type: 'ghost_cat', stage: 'adult', route: 'speed', nameZh: '暗影霸王', nameEn: 'Shadow Lord', description: '暗影之王', emoji: '👑', color: '#3730a3', animations: { idle: 'animate-fast-float', happy: 'animate-shadow-domain', sad: 'animate-shadow-shrink', evolving: 'animate-shadow-throne' } },
    },
  },
  mecha_bird: {
    id: 'mecha_bird',
    nameZh: '機械鳥',
    nameEn: 'Mecha Bird',
    descriptionZh: '高科技嘅機械鳥，翅膀可以發射激光',
    element: 'tech',
    emoji: '🤖',
    primaryColor: '#06b6d4', // Cyan
    secondaryColor: '#0891b2', // Dark cyan
    forms: {
      egg: { type: 'mecha_bird', stage: 'egg', nameZh: '電子蛋', nameEn: 'Tech Egg', description: '閃爍藍光嘅蛋', emoji: '🥚', color: '#ecfeff', animations: { idle: 'animate-blink', happy: 'animate-scan', sad: 'animate-power-low', evolving: 'animate-boot-up' } },
      baby: { type: 'mecha_bird', stage: 'baby', nameZh: '小機械', nameEn: 'Minibot', description: '剛啟動嘅小機械鳥', emoji: '🐤', color: '#cffafe', animations: { idle: 'animate-hover', happy: 'animate-beep', sad: 'animate-glitch', evolving: 'animate-upgrade' } },
      child: { type: 'mecha_bird', stage: 'child', nameZh: '飛行機', nameEn: 'Flybot', description: '學會飛行嘅機械鳥', emoji: '✈️', color: '#a5f3fc', animations: { idle: 'animate-sway', happy: 'animate-jet-boost', sad: 'animate-malfunction', evolving: 'animate-transform' } },
      'teen-scholar': { type: 'mecha_bird', stage: 'teen', route: 'scholar', nameZh: '智慧機', nameEn: 'Smart Drone', description: '智慧型嘅機械鳥', emoji: '🧠', color: '#67e8f9', animations: { idle: 'animate-float', happy: 'animate-calculate', sad: 'animate-error', evolving: 'animate-ai-evolve' } },
      'teen-balanced': { type: 'mecha_bird', stage: 'teen', route: 'balanced', nameZh: '戰鬥機', nameEn: 'Battle Drone', description: '平衡發展嘅機械鳥', emoji: '⚔️', color: '#22d3ee', animations: { idle: 'animate-float', happy: 'animate-weapons-ready', sad: 'animate-damaged', evolving: 'animate-battle-mode' } },
      'teen-speed': { type: 'mecha_bird', stage: 'teen', route: 'speed', nameZh: '高速機', nameEn: 'Speed Drone', description: '速度型嘅機械鳥', emoji: '🚀', color: '#06b6d4', animations: { idle: 'animate-fast-sway', happy: 'animate-turbo', sad: 'animate-overheat', evolving: 'animate-overdrive' } },
      'adult-scholar': { type: 'mecha_bird', stage: 'adult', route: 'scholar', nameZh: '量子鳳凰', nameEn: 'Quantum Phoenix', description: '量子計算嘅終極機械', emoji: '🌌', color: '#0891b2', animations: { idle: 'animate-glow-float', happy: 'animate-quantum-state', sad: 'animate-decohere', evolving: 'animate-quantum-leap' } },
      'adult-balanced': { type: 'mecha_bird', stage: 'adult', route: 'balanced', nameZh: '鋼鐵鳳凰', nameEn: 'Steel Phoenix', description: '重生嘅不死機械', emoji: '🔥', color: '#0e7490', animations: { idle: 'animate-glow-float', happy: 'animate-rebirth', sad: 'animate-shutdown', evolving: 'animate-phoenix-rise' } },
      'adult-speed': { type: 'mecha_bird', stage: 'adult', route: 'speed', nameZh: '光速鳳凰', nameEn: 'Light Phoenix', description: '光速飛行嘅終極形態', emoji: '💫', color: '#155e75', animations: { idle: 'animate-fast-float', happy: 'animate-light-speed', sad: 'animate-power-down', evolving: 'animate-warp-drive' } },
    },
  },
  crystal_rabbit: {
    id: 'crystal_rabbit',
    nameZh: '水晶兔',
    nameEn: 'Crystal Rabbit',
    descriptionZh: '冰雪嘅水晶兔子，身體閃閃發光',
    element: 'ice',
    emoji: '🐰',
    primaryColor: '#8b5cf6', // Violet
    secondaryColor: '#7c3aed', // Purple
    forms: {
      egg: { type: 'crystal_rabbit', stage: 'egg', nameZh: '水晶蛋', nameEn: 'Crystal Egg', description: '透明閃亮嘅蛋', emoji: '🥚', color: '#f5f3ff', animations: { idle: 'animate-shimmer', happy: 'animate-sparkle', sad: 'animate-crack', evolving: 'animate-crystal-grow' } },
      baby: { type: 'crystal_rabbit', stage: 'baby', nameZh: '小水晶', nameEn: 'Crystalkit', description: '剛出生嘅小水晶兔', emoji: '💎', color: '#ede9fe', animations: { idle: 'animate-bounce-gentle', happy: 'animate-hop', sad: 'animate-droop', evolving: 'animate-facet' } },
      child: { type: 'crystal_rabbit', stage: 'child', nameZh: '冰晶兔', nameEn: 'Frostbunny', description: '學會製造冰晶嘅兔子', emoji: '❄️', color: '#ddd6fe', animations: { idle: 'animate-sway', happy: 'animate-freeze-dance', sad: 'animate-melt', evolving: 'animate-ice-form' } },
      'teen-scholar': { type: 'crystal_rabbit', stage: 'teen', route: 'scholar', nameZh: '智慧冰兔', nameEn: 'Sage Bunny', description: '智慧型嘅水晶兔', emoji: '📚', color: '#c4b5fd', animations: { idle: 'animate-float', happy: 'animate-wisdom-aura', sad: 'animate-frost', evolving: 'animate-enlighten' } },
      'teen-balanced': { type: 'crystal_rabbit', stage: 'teen', route: 'balanced', nameZh: '極光兔', nameEn: 'Aurora Bunny', description: '平衡發展嘅水晶兔', emoji: '🌈', color: '#a78bfa', animations: { idle: 'animate-float', happy: 'animate-aurora', sad: 'animate-dim', evolving: 'animate-aurora-rise' } },
      'teen-speed': { type: 'crystal_rabbit', stage: 'teen', route: 'speed', nameZh: '疾風冰兔', nameEn: 'Swift Bunny', description: '速度型嘅水晶兔', emoji: '💨', color: '#8b5cf6', animations: { idle: 'animate-fast-sway', happy: 'animate-ice-dash', sad: 'animate-slow', evolving: 'animate-blizzard' } },
      'adult-scholar': { type: 'crystal_rabbit', stage: 'adult', route: 'scholar', nameZh: '月光聖兔', nameEn: 'Lunar Sage', description: '住在月亮上嘅聖兔', emoji: '🌙', color: '#7c3aed', animations: { idle: 'animate-glow-float', happy: 'animate-moonbeam', sad: 'animate-eclipse', evolving: 'animate-lunar-ascend' } },
      'adult-balanced': { type: 'crystal_rabbit', stage: 'adult', route: 'balanced', nameZh: '鑽石女王', nameEn: 'Diamond Queen', description: '水晶兔女王', emoji: '👑', color: '#6d28d9', animations: { idle: 'animate-glow-float', happy: 'animate-diamond-shine', sad: 'animate-shatter', evolving: 'animate-coronation' } },
      'adult-speed': { type: 'crystal_rabbit', stage: 'adult', route: 'speed', nameZh: '閃電兔王', nameEn: 'Thunder King', description: '閃電般嘅兔王', emoji: '⚡', color: '#5b21b6', animations: { idle: 'animate-fast-float', happy: 'animate-thunder-hop', sad: 'animate-static', evolving: 'animate-thunder-crown' } },
    },
  },
};

// ============================================
// Evolution Requirements
// ============================================

export const EVOLUTION_REQUIREMENTS: Record<EvolutionStage, EvolutionRequirement> = {
  egg: { minLevel: 1, minXP: 0, minPracticeDays: 0 },
  baby: { minLevel: 5, minXP: 50, minPracticeDays: 1 },
  child: { minLevel: 12, minXP: 200, minPracticeDays: 3 },
  teen: { minLevel: 25, minXP: 600, minPracticeDays: 7 },
  adult: { minLevel: 45, minXP: 1500, minPracticeDays: 14 },
};

// Evolution route thresholds
export const EVOLUTION_ROUTE_THRESHOLDS = {
  scholar: { minAccuracy: 90 }, // 90%+ accuracy = Scholar route
  balanced: { minAccuracy: 70, maxAccuracy: 90 }, // 70-90% = Balanced route
  speed: { maxAccuracy: 70 }, // <70% = Speed route (focus on quantity)
};

// ============================================
// Evolution Functions
// ============================================

/**
 * Calculate evolution stats from practice history
 */
export function calculateEvolutionStats(
  totalWords: number,
  correctFirstTry: number,
  practiceDays: number
): EvolutionStats {
  const averageAccuracy = totalWords > 0 ? (correctFirstTry / totalWords) * 100 : 0;

  return {
    totalWords,
    correctFirstTry,
    totalAttempts: totalWords, // Simplified
    practiceDays,
    averageAccuracy: Math.round(averageAccuracy * 10) / 10,
  };
}

/**
 * Determine evolution route based on accuracy
 */
export function determineEvolutionRoute(accuracy: number): EvolutionRoute {
  if (accuracy >= EVOLUTION_ROUTE_THRESHOLDS.scholar.minAccuracy) {
    return 'scholar';
  } else if (accuracy >= EVOLUTION_ROUTE_THRESHOLDS.balanced.minAccuracy) {
    return 'balanced';
  } else {
    return 'speed';
  }
}

/**
 * Check if pet can evolve to next stage
 */
export function canEvolve(
  currentStage: EvolutionStage,
  level: number,
  xp: number,
  practiceDays: number
): boolean {
  const stages: EvolutionStage[] = ['egg', 'baby', 'child', 'teen', 'adult'];
  const currentIndex = stages.indexOf(currentStage);

  if (currentIndex >= stages.length - 1) {
    return false; // Already at max
  }

  const nextStage = stages[currentIndex + 1];
  const requirements = EVOLUTION_REQUIREMENTS[nextStage];

  return (
    level >= requirements.minLevel &&
    xp >= requirements.minXP &&
    practiceDays >= requirements.minPracticeDays
  );
}

/**
 * Get next evolution stage
 */
export function getNextStage(currentStage: EvolutionStage): EvolutionStage | null {
  const stages: EvolutionStage[] = ['egg', 'baby', 'child', 'teen', 'adult'];
  const currentIndex = stages.indexOf(currentStage);

  if (currentIndex >= stages.length - 1) {
    return null;
  }

  return stages[currentIndex + 1];
}

/**
 * Get pet form by type, stage, and optional route
 */
export function getPetForm(
  petType: PetType,
  stage: EvolutionStage,
  route?: EvolutionRoute
): PetForm | null {
  const typeInfo = PET_TYPES[petType];
  if (!typeInfo) return null;

  // For teen and adult, route is required
  if ((stage === 'teen' || stage === 'adult') && route) {
    const formKey = `${stage}-${route}`;
    return typeInfo.forms[formKey] || null;
  }

  // For egg, baby, child - no route needed
  return typeInfo.forms[stage] || null;
}

/**
 * Get progress towards next evolution
 */
export function getEvolutionProgress(
  currentStage: EvolutionStage,
  level: number,
  xp: number,
  practiceDays: number
): { levelProgress: number; xpProgress: number; daysProgress: number; overall: number } | null {
  const nextStage = getNextStage(currentStage);
  if (!nextStage) return null;

  const requirements = EVOLUTION_REQUIREMENTS[nextStage];
  const currentReqs = EVOLUTION_REQUIREMENTS[currentStage];

  const levelRange = requirements.minLevel - currentReqs.minLevel;
  const xpRange = requirements.minXP - currentReqs.minXP;
  const daysRange = requirements.minPracticeDays - currentReqs.minPracticeDays;

  const levelProgress = Math.min(100, ((level - currentReqs.minLevel) / levelRange) * 100);
  const xpProgress = Math.min(100, ((xp - currentReqs.minXP) / xpRange) * 100);
  const daysProgress = daysRange > 0
    ? Math.min(100, ((practiceDays - currentReqs.minPracticeDays) / daysRange) * 100)
    : 100;

  const overall = (levelProgress + xpProgress + daysProgress) / 3;

  return {
    levelProgress: Math.round(levelProgress),
    xpProgress: Math.round(xpProgress),
    daysProgress: Math.round(daysProgress),
    overall: Math.round(overall),
  };
}

/**
 * Get evolution route description
 */
export function getRouteDescription(route: EvolutionRoute): { nameZh: string; nameEn: string; description: string; emoji: string } {
  const descriptions = {
    scholar: {
      nameZh: '學者路線',
      nameEn: 'Scholar Route',
      description: '專注學習，準確率90%以上',
      emoji: '📚',
    },
    balanced: {
      nameZh: '平衡路線',
      nameEn: 'Balanced Route',
      description: '穩定發展，準確率70-90%',
      emoji: '⚖️',
    },
    speed: {
      nameZh: '速度路線',
      nameEn: 'Speed Route',
      description: '快速練習，重視數量',
      emoji: '⚡',
    },
  };

  return descriptions[route];
}

/**
 * Get all possible adult forms for a pet type
 */
export function getAdultForms(petType: PetType): PetForm[] {
  const routes: EvolutionRoute[] = ['scholar', 'balanced', 'speed'];
  return routes
    .map(route => getPetForm(petType, 'adult', route))
    .filter((form): form is PetForm => form !== null);
}

/**
 * Get SVG path for pet sprite
 */
export function getPetSpritePath(petType: PetType, stage: EvolutionStage, route?: EvolutionRoute): string {
  if ((stage === 'teen' || stage === 'adult') && route) {
    return `/pet/sprites/${petType}-${stage}-${route}.svg`;
  }
  return `/pet/sprites/${petType}-${stage}.svg`;
}

/**
 * Get animation class for pet
 */
export function getPetAnimationClass(
  petType: PetType,
  stage: EvolutionStage,
  route: EvolutionRoute | undefined,
  mood: 'idle' | 'happy' | 'sad' | 'evolving'
): string {
  const form = getPetForm(petType, stage, route);
  if (!form) return 'animate-bounce-gentle';

  return form.animations[mood] || 'animate-bounce-gentle';
}
