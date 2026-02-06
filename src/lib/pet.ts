// Pet Raising/Evolution System
// 寵物養成系統 - 透過練習串字來養大虛擬寵物

// ============================================
// Types & Interfaces
// ============================================

export type PetStage = 'egg' | 'baby' | 'child' | 'teen' | 'adult';
export type PetMood = 'happy' | 'content' | 'hungry' | 'sleepy';
export type EvolutionRoute = 'scholar' | 'balanced' | 'speed';

// Original species (legacy support)
export type LegacyPetSpecies = 'slime' | 'unicorn' | 'dog';
// New pixel pet types
export type PixelPetType = 'pixel_unicorn' | 'pixel_dragon' | 'pixel_ghost_cat' | 'pixel_mecha_bird' | 'pixel_crystal_rabbit';
// Combined type
export type PetSpecies = LegacyPetSpecies | PixelPetType;

// Species info for selection screen
export interface PetSpeciesInfo {
  id: PetSpecies;
  nameZh: string;
  descriptionZh: string;
  emoji: string;
  color: string;            // Primary color for UI
  stageNames: Record<PetStage, string>;
  finalFormName: string;    // Name of adult form
  isPixelPet?: boolean;     // True for new pixel art pets
  element?: string;         // Element type for pixel pets
  routeNames?: Record<EvolutionRoute, Record<'teen' | 'adult', string>>; // Names by evolution route
}

export const PET_SPECIES: Record<PetSpecies, PetSpeciesInfo> = {
  // ============================================
  // Legacy Pets (for backward compatibility)
  // ============================================
  slime: {
    id: 'slime',
    nameZh: '史萊姆',
    descriptionZh: '可愛嘅綠色史萊姆，長大後會變成帝王史萊姆！',
    emoji: '🟢',
    color: '#22c55e',
    stageNames: {
      egg: '史萊姆蛋',
      baby: 'BB史萊姆',
      child: '小史萊姆',
      teen: '少年史萊姆',
      adult: '帝王史萊姆',
    },
    finalFormName: '帝王史萊姆',
  },
  unicorn: {
    id: 'unicorn',
    nameZh: '獨角獸',
    descriptionZh: '夢幻嘅粉紅獨角獸，長大後會變成天馬！',
    emoji: '🦄',
    color: '#ec4899',
    stageNames: {
      egg: '獨角獸蛋',
      baby: 'BB獨角獸',
      child: '小獨角獸',
      teen: '少年獨角獸',
      adult: '天馬獨角獸',
    },
    finalFormName: '天馬獨角獸',
  },
  dog: {
    id: 'dog',
    nameZh: '小狗',
    descriptionZh: '忠誠嘅小狗，長大後會變成神話中嘅哮天犬！',
    emoji: '🐕',
    color: '#d97706',
    stageNames: {
      egg: '小狗蛋',
      baby: 'BB狗仔',
      child: '小狗仔',
      teen: '少年狼犬',
      adult: '哮天犬',
    },
    finalFormName: '哮天犬',
  },

  // ============================================
  // New Pixel Art Pets with Evolution Routes
  // ============================================
  pixel_unicorn: {
    id: 'pixel_unicorn',
    nameZh: '魔法獨角獸',
    descriptionZh: '夢幻嘅魔法獨角獸，擁有治癒之力！進化路線會影響最終形態',
    emoji: '🦄',
    color: '#ec4899',
    element: 'magic',
    isPixelPet: true,
    stageNames: {
      egg: '魔法蛋',
      baby: '小獨角',
      child: '彩虹獸',
      teen: '光輝獸', // Default to balanced
      adult: '彩虹天馬',
    },
    finalFormName: '天馬',
    routeNames: {
      scholar: { teen: '賢者獸', adult: '天馬聖賢' },
      balanced: { teen: '光輝獸', adult: '彩虹天馬' },
      speed: { teen: '疾風獸', adult: '疾風天馬' },
    },
  },
  pixel_dragon: {
    id: 'pixel_dragon',
    nameZh: '火焰龍',
    descriptionZh: '熱情嘅火焰之龍，力量強大！進化路線會影響最終形態',
    emoji: '🐉',
    color: '#ef4444',
    element: 'fire',
    isPixelPet: true,
    stageNames: {
      egg: '火焰蛋',
      baby: '小火龍',
      child: '噴火獸',
      teen: '炎龍',
      adult: '帝王龍',
    },
    finalFormName: '帝王龍',
    routeNames: {
      scholar: { teen: '智火龍', adult: '古龍聖賢' },
      balanced: { teen: '炎龍', adult: '帝王龍' },
      speed: { teen: '閃焰龍', adult: '疾風火龍' },
    },
  },
  pixel_ghost_cat: {
    id: 'pixel_ghost_cat',
    nameZh: '幽靈貓',
    descriptionZh: '神秘嘅暗影之貓，可以隱身！進化路線會影響最終形態',
    emoji: '🐱',
    color: '#6366f1',
    element: 'shadow',
    isPixelPet: true,
    stageNames: {
      egg: '暗影蛋',
      baby: '小幽靈',
      child: '暗影貓',
      teen: '幻影貓',
      adult: '月光女神',
    },
    finalFormName: '月光女神',
    routeNames: {
      scholar: { teen: '智慧靈貓', adult: '九命聖靈' },
      balanced: { teen: '幻影貓', adult: '月光女神' },
      speed: { teen: '疾影貓', adult: '暗影霸王' },
    },
  },
  pixel_mecha_bird: {
    id: 'pixel_mecha_bird',
    nameZh: '機械鳥',
    descriptionZh: '高科技嘅機械鳥，翅膀可以發射激光！進化路線會影響最終形態',
    emoji: '🤖',
    color: '#06b6d4',
    element: 'tech',
    isPixelPet: true,
    stageNames: {
      egg: '電子蛋',
      baby: '小機械',
      child: '飛行機',
      teen: '戰鬥機',
      adult: '鋼鐵鳳凰',
    },
    finalFormName: '鳳凰',
    routeNames: {
      scholar: { teen: '智慧機', adult: '量子鳳凰' },
      balanced: { teen: '戰鬥機', adult: '鋼鐵鳳凰' },
      speed: { teen: '高速機', adult: '光速鳳凰' },
    },
  },
  pixel_crystal_rabbit: {
    id: 'pixel_crystal_rabbit',
    nameZh: '水晶兔',
    descriptionZh: '冰雪嘅水晶兔子，身體閃閃發光！進化路線會影響最終形態',
    emoji: '🐰',
    color: '#8b5cf6',
    element: 'ice',
    isPixelPet: true,
    stageNames: {
      egg: '水晶蛋',
      baby: '小水晶',
      child: '冰晶兔',
      teen: '極光兔',
      adult: '鑽石女王',
    },
    finalFormName: '月兔',
    routeNames: {
      scholar: { teen: '智慧冰兔', adult: '月光聖兔' },
      balanced: { teen: '極光兔', adult: '鑽石女王' },
      speed: { teen: '疾風冰兔', adult: '閃電兔王' },
    },
  },
};

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

// Food item from practice rewards
export interface FoodItem {
  id: string;
  type: 'dragon_fruit' | 'magic_berry' | 'star_candy';
  quantity: number;
}

// Daily task definition
export interface DailyTask {
  id: string;
  nameZh: string;
  descriptionZh: string;
  emoji: string;
  xpReward: number;
  happinessReward: number;
  timeWindow?: { start: number; end: number }; // Hour of day (0-23)
}

// Pet interaction response
export interface InteractionResponse {
  animation: string;
  message: string;
  emoji: string;
}

export interface PetState {
  // Core identity
  name: string;
  species: PetSpecies;

  // Progression
  stage: PetStage;
  xp: number;
  level: number;

  // Evolution route (for pixel pets at teen/adult stage)
  evolutionRoute?: EvolutionRoute;
  evolutionStats?: {
    totalWords: number;
    correctFirstTry: number;
    practiceDays: number;
    averageAccuracy: number;
  };

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

  // Interaction system
  patsToday: number;           // How many times patted today
  lastPatDate: string;         // Date of last pat
  foodInventory: FoodItem[];   // Food items from practice
  lastInteractionTime: string; // For cooldowns
  dailyTasksCompleted: string[]; // IDs of completed daily tasks
  lastDailyTaskDate: string;   // For resetting daily tasks

  // Events & Items system
  activeEvent: ActiveEvent | null;  // Current active event
  lastEventDate: string;            // For event cooldown
  itemInventory: InventoryItem[];   // Items owned
  equippedItems: string[];          // IDs of equipped items
  activeItemEffects: ActiveItemEffect[]; // Temporary item effects
}

// Active event instance
export interface ActiveEvent {
  eventId: string;
  startedAt: string;  // ISO date
  expiresAt: string;  // ISO date
  claimed: boolean;   // If rewards claimed
}

// Inventory item with quantity
export interface InventoryItem {
  itemId: string;
  quantity: number;
}

// Active item effect (from consumables)
export interface ActiveItemEffect {
  itemId: string;
  effect: Item['effects'];
  expiresAt: string;  // ISO date
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

// Pet visuals by stage (for backward compatibility - use PET_SPECIES for new code)
export const PET_EMOJIS: Record<PetStage, string> = {
  egg: '🥚',
  baby: '🐣',
  child: '🦎',
  teen: '🐲',
  adult: '🐉'
};

// Pet stage names in Chinese (default - use getPetStageName for species-specific)
export const PET_STAGE_NAMES_ZH: Record<PetStage, string> = {
  egg: '蛋蛋',
  baby: 'BB仔',
  child: '細路仔',
  teen: '少年龍',
  adult: '成年龍'
};

// Get species-specific stage name
export function getPetStageName(species: PetSpecies, stage: PetStage, route?: EvolutionRoute): string {
  const speciesInfo = PET_SPECIES[species];
  if (!speciesInfo) return PET_STAGE_NAMES_ZH[stage];

  // For pixel pets with evolution routes
  if (speciesInfo.isPixelPet && route && speciesInfo.routeNames && (stage === 'teen' || stage === 'adult')) {
    return speciesInfo.routeNames[route]?.[stage] || speciesInfo.stageNames[stage];
  }

  return speciesInfo.stageNames[stage] || PET_STAGE_NAMES_ZH[stage];
}

// Check if species is a pixel pet
export function isPixelPet(species: PetSpecies): boolean {
  return PET_SPECIES[species]?.isPixelPet === true;
}

// Determine evolution route based on accuracy
export function determineEvolutionRoute(accuracy: number): EvolutionRoute {
  if (accuracy >= 90) return 'scholar';
  if (accuracy >= 70) return 'balanced';
  return 'speed';
}

// Get evolution route description
export function getEvolutionRouteInfo(route: EvolutionRoute): { nameZh: string; description: string; emoji: string; color: string } {
  const info: Record<EvolutionRoute, { nameZh: string; description: string; emoji: string; color: string }> = {
    scholar: {
      nameZh: '學者路線',
      description: '專注學習，準確率90%以上',
      emoji: '📚',
      color: '#3b82f6', // Blue
    },
    balanced: {
      nameZh: '平衡路線',
      description: '穩定發展，準確率70-90%',
      emoji: '⚖️',
      color: '#22c55e', // Green
    },
    speed: {
      nameZh: '速度路線',
      description: '快速練習，重視數量',
      emoji: '⚡',
      color: '#f59e0b', // Amber
    },
  };
  return info[route];
}

// Get pet SVG path by species and stage
export function getPetSvgPath(species: PetSpecies, stage: PetStage, route?: EvolutionRoute): string {
  const speciesInfo = PET_SPECIES[species];

  // For pixel pets with routes at teen/adult stage
  if (speciesInfo?.isPixelPet && route && (stage === 'teen' || stage === 'adult')) {
    return `/pet/sprites/${species}-${stage}-${route}.svg`;
  }

  // For pixel pets without routes (egg, baby, child)
  if (speciesInfo?.isPixelPet) {
    return `/pet/sprites/${species}-${stage}.svg`;
  }

  // Legacy pets
  return `/pet/${species}-${stage}.svg`;
}

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

// ============================================
// Interaction System Constants
// ============================================

// Maximum pats per day
export const MAX_PATS_PER_DAY = 5;

// Happiness gained per pat
export const HAPPINESS_PER_PAT = 3;

// XP gained per pat (small amount)
export const XP_PER_PAT = 1;

// Food types and their effects
export const FOOD_TYPES = {
  dragon_fruit: {
    nameZh: '龍果',
    emoji: '🍇',
    happinessBoost: 10,
    xpBoost: 5,
    description: '寵物最愛嘅水果！'
  },
  magic_berry: {
    nameZh: '魔法莓',
    emoji: '🫐',
    happinessBoost: 15,
    xpBoost: 10,
    description: '閃閃發光嘅神奇莓果'
  },
  star_candy: {
    nameZh: '星星糖',
    emoji: '🍬',
    happinessBoost: 20,
    xpBoost: 15,
    description: '用星星造成嘅糖果'
  }
} as const;

// Pat responses by stage
export const PAT_RESPONSES: Record<PetStage, InteractionResponse[]> = {
  egg: [
    { animation: 'animate-wobble', message: '蛋蛋搖咗搖！', emoji: '✨' },
    { animation: 'animate-shake', message: '入面好似有聲...', emoji: '👂' },
    { animation: 'animate-pulse', message: '蛋蛋暖暖哋！', emoji: '💕' },
  ],
  baby: [
    { animation: 'animate-bounce-gentle', message: '嘰嘰！好開心！', emoji: '💖' },
    { animation: 'animate-wobble', message: '搖搖擺擺～', emoji: '🎵' },
    { animation: 'animate-pulse', message: '舒服到瞇埋眼！', emoji: '😊' },
  ],
  child: [
    { animation: 'animate-bounce-gentle', message: '摸多啲！摸多啲！', emoji: '🥰' },
    { animation: 'animate-sway', message: '尾巴搖晒！', emoji: '💫' },
    { animation: 'animate-float', message: '開心到想飛！', emoji: '✨' },
  ],
  teen: [
    { animation: 'animate-float', message: '唔錯喎～', emoji: '😎' },
    { animation: 'animate-pulse', message: '...其實幾舒服', emoji: '😌' },
    { animation: 'animate-sway', message: '好啦好啦～', emoji: '💕' },
  ],
  adult: [
    { animation: 'animate-glow-float', message: '謝謝你嘅關心！', emoji: '💖' },
    { animation: 'animate-float', message: '呼～噴咗少少煙', emoji: '💨' },
    { animation: 'animate-pulse', message: '你係最好嘅朋友！', emoji: '🌟' },
  ],
};

// Random pet speech bubbles by mood
export const PET_SPEECHES: Record<PetMood, string[]> = {
  happy: [
    '今日一齊練習啦！',
    '我哋係最好嘅拍檔！',
    '你好叻呀！',
    '繼續加油！💪',
    '我好開心呀！',
    '多謝你陪我！',
  ],
  content: [
    '今日天氣真好～',
    '想學新嘢！',
    '一齊練習吖？',
    '我等緊你～',
    '嗯～普通啦',
  ],
  hungry: [
    '好耐冇練習喇...',
    '有啲悶悶哋...',
    '你喺邊呀？',
    '想你陪我練習...',
    '我等緊你返嚟...',
  ],
  sleepy: [
    'zzZ... zzZ...',
    '好攰... 要瞓覺...',
    '(打喊露)',
    '冇精神...',
    '要休息吓...',
  ],
};

// Daily tasks
export const DAILY_TASKS: DailyTask[] = [
  {
    id: 'morning_greeting',
    nameZh: '早晨打招呼',
    descriptionZh: '朝早同寵物講早晨',
    emoji: '🌅',
    xpReward: 5,
    happinessReward: 10,
    timeWindow: { start: 6, end: 11 }, // 6am - 11am
  },
  {
    id: 'afternoon_play',
    nameZh: '下午玩耍',
    descriptionZh: '下午同寵物玩吓',
    emoji: '🎮',
    xpReward: 5,
    happinessReward: 10,
    timeWindow: { start: 12, end: 17 }, // 12pm - 5pm
  },
  {
    id: 'goodnight',
    nameZh: '晚安道別',
    descriptionZh: '臨瞓前同寵物講晚安',
    emoji: '🌙',
    xpReward: 5,
    happinessReward: 10,
    timeWindow: { start: 18, end: 23 }, // 6pm - 11pm
  },
];

// ============================================
// Random Events System
// ============================================

export type EventType = 'weather' | 'visitor' | 'discovery' | 'special';

export interface RandomEvent {
  id: string;
  type: EventType;
  nameZh: string;
  descriptionZh: string;
  emoji: string;
  duration: number; // hours
  effects: {
    xpMultiplier?: number;
    happinessMultiplier?: number;
    bonusXP?: number;
    bonusHappiness?: number;
    itemDrop?: { itemId: string; chance: number };
  };
  petResponse: string; // What the pet says
}

// Weather events (last 24 hours)
export const WEATHER_EVENTS: RandomEvent[] = [
  {
    id: 'sunny_day',
    type: 'weather',
    nameZh: '陽光普照',
    descriptionZh: '今日天氣好好，寵物特別精神！',
    emoji: '☀️',
    duration: 24,
    effects: { xpMultiplier: 1.2, bonusHappiness: 5 },
    petResponse: '今日陽光好好呀！一齊練習啦！'
  },
  {
    id: 'rainy_day',
    type: 'weather',
    nameZh: '下雨天',
    descriptionZh: '落雨喇，留喺屋企練習啱晒！',
    emoji: '🌧️',
    duration: 24,
    effects: { happinessMultiplier: 1.3 },
    petResponse: '落雨喇～留喺屋企陪我好唔好？'
  },
  {
    id: 'rainbow',
    type: 'weather',
    nameZh: '彩虹出現',
    descriptionZh: '嘩！有彩虹呀！好幸運！',
    emoji: '🌈',
    duration: 12,
    effects: { xpMultiplier: 1.5, bonusHappiness: 10, itemDrop: { itemId: 'lucky_clover', chance: 0.3 } },
    petResponse: '彩虹呀！今日一定會好運！'
  },
  {
    id: 'snowy_day',
    type: 'weather',
    nameZh: '落雪天',
    descriptionZh: '好凍呀，寵物需要更多關愛！',
    emoji: '❄️',
    duration: 24,
    effects: { happinessMultiplier: 1.2, itemDrop: { itemId: 'warm_scarf', chance: 0.2 } },
    petResponse: '好凍呀～攬住我暖吓得唔得？'
  },
  {
    id: 'starry_night',
    type: 'weather',
    nameZh: '星空之夜',
    descriptionZh: '今晚星星好多好靚！',
    emoji: '🌟',
    duration: 12,
    effects: { xpMultiplier: 1.3, itemDrop: { itemId: 'star_dust', chance: 0.25 } },
    petResponse: '你睇！好多星星呀！'
  },
];

// Visitor events (special interactions)
export const VISITOR_EVENTS: RandomEvent[] = [
  {
    id: 'fairy_visit',
    type: 'visitor',
    nameZh: '小仙子來訪',
    descriptionZh: '一隻小仙子嚟探你嘅寵物！',
    emoji: '🧚',
    duration: 6,
    effects: { bonusXP: 20, itemDrop: { itemId: 'fairy_dust', chance: 0.5 } },
    petResponse: '哇！小仙子嚟咗！佢好靚呀！'
  },
  {
    id: 'dragon_friend',
    type: 'visitor',
    nameZh: '龍朋友探訪',
    descriptionZh: '另一隻龍嚟同你嘅寵物玩！',
    emoji: '🐲',
    duration: 8,
    effects: { bonusHappiness: 15, xpMultiplier: 1.2 },
    petResponse: '我嘅朋友嚟咗！我哋一齊玩好開心！'
  },
  {
    id: 'wise_owl',
    type: 'visitor',
    nameZh: '智慧貓頭鷹',
    descriptionZh: '一隻聰明嘅貓頭鷹嚟教你嘅寵物！',
    emoji: '🦉',
    duration: 6,
    effects: { xpMultiplier: 1.5, itemDrop: { itemId: 'wisdom_scroll', chance: 0.4 } },
    petResponse: '貓頭鷹老師嚟咗！佢教咗我好多嘢！'
  },
  {
    id: 'bunny_merchant',
    type: 'visitor',
    nameZh: '兔仔商人',
    descriptionZh: '一隻兔仔商人帶嚟咗禮物！',
    emoji: '🐰',
    duration: 4,
    effects: { itemDrop: { itemId: 'mystery_box', chance: 0.6 } },
    petResponse: '兔仔商人好好人！佢送咗禮物俾我！'
  },
];

// Discovery events (special finds)
export const DISCOVERY_EVENTS: RandomEvent[] = [
  {
    id: 'treasure_found',
    type: 'discovery',
    nameZh: '發現寶藏',
    descriptionZh: '寵物喺花園搵到咗寶藏！',
    emoji: '💎',
    duration: 1,
    effects: { bonusXP: 30, itemDrop: { itemId: 'treasure_coin', chance: 0.8 } },
    petResponse: '我搵到寶藏呀！好開心！'
  },
  {
    id: 'magic_flower',
    type: 'discovery',
    nameZh: '魔法花開',
    descriptionZh: '花園入面開咗一朵魔法花！',
    emoji: '🌸',
    duration: 6,
    effects: { bonusHappiness: 20, itemDrop: { itemId: 'magic_petal', chance: 0.5 } },
    petResponse: '好靚嘅花呀！聞落好香！'
  },
];

// All events combined
export const ALL_EVENTS: RandomEvent[] = [
  ...WEATHER_EVENTS,
  ...VISITOR_EVENTS,
  ...DISCOVERY_EVENTS,
];

// ============================================
// Items/Props System
// ============================================

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type ItemCategory = 'consumable' | 'equipment' | 'decoration' | 'special';

export interface Item {
  id: string;
  nameZh: string;
  descriptionZh: string;
  emoji: string;
  category: ItemCategory;
  rarity: ItemRarity;
  effects: {
    xpBoost?: number;           // Flat XP bonus when used
    xpMultiplier?: number;      // XP multiplier (duration-based)
    happinessBoost?: number;    // Flat happiness bonus
    happinessMultiplier?: number;
    durationMinutes?: number;   // For time-based effects
    permanent?: boolean;        // For permanent boosts
  };
  shopPrice?: number;  // Stars to buy (undefined = not for sale)
  dropChance?: number; // Base drop chance from practice (0-1)
}

export const ITEMS: Record<string, Item> = {
  // Consumables - XP Boosters
  xp_potion_small: {
    id: 'xp_potion_small',
    nameZh: '經驗藥水 (小)',
    descriptionZh: '飲咗之後 10 分鐘內經驗值 x1.5',
    emoji: '🧪',
    category: 'consumable',
    rarity: 'common',
    effects: { xpMultiplier: 1.5, durationMinutes: 10 },
    shopPrice: 50,
    dropChance: 0.08,
  },
  xp_potion_medium: {
    id: 'xp_potion_medium',
    nameZh: '經驗藥水 (中)',
    descriptionZh: '飲咗之後 20 分鐘內經驗值 x2',
    emoji: '⚗️',
    category: 'consumable',
    rarity: 'uncommon',
    effects: { xpMultiplier: 2, durationMinutes: 20 },
    shopPrice: 120,
    dropChance: 0.03,
  },
  xp_potion_large: {
    id: 'xp_potion_large',
    nameZh: '經驗藥水 (大)',
    descriptionZh: '飲咗之後 30 分鐘內經驗值 x3！',
    emoji: '🔮',
    category: 'consumable',
    rarity: 'rare',
    effects: { xpMultiplier: 3, durationMinutes: 30 },
    shopPrice: 300,
    dropChance: 0.01,
  },

  // Consumables - Happiness Boosters
  happiness_candy: {
    id: 'happiness_candy',
    nameZh: '開心糖',
    descriptionZh: '即時增加 20 開心度',
    emoji: '🍭',
    category: 'consumable',
    rarity: 'common',
    effects: { happinessBoost: 20 },
    shopPrice: 30,
    dropChance: 0.1,
  },
  super_treat: {
    id: 'super_treat',
    nameZh: '超級零食',
    descriptionZh: '即時增加 50 開心度！',
    emoji: '🎂',
    category: 'consumable',
    rarity: 'uncommon',
    effects: { happinessBoost: 50 },
    shopPrice: 80,
    dropChance: 0.04,
  },

  // Consumables - Instant XP
  wisdom_scroll: {
    id: 'wisdom_scroll',
    nameZh: '智慧卷軸',
    descriptionZh: '即時獲得 50 經驗值',
    emoji: '📜',
    category: 'consumable',
    rarity: 'uncommon',
    effects: { xpBoost: 50 },
    dropChance: 0.02,
  },
  ancient_tome: {
    id: 'ancient_tome',
    nameZh: '古老典籍',
    descriptionZh: '即時獲得 150 經驗值！',
    emoji: '📚',
    category: 'consumable',
    rarity: 'rare',
    effects: { xpBoost: 150 },
    dropChance: 0.005,
  },

  // Special items from events
  lucky_clover: {
    id: 'lucky_clover',
    nameZh: '幸運四葉草',
    descriptionZh: '帶來好運！下次練習掉落率 x2',
    emoji: '🍀',
    category: 'special',
    rarity: 'rare',
    effects: { durationMinutes: 60 },
  },
  fairy_dust: {
    id: 'fairy_dust',
    nameZh: '仙子粉塵',
    descriptionZh: '閃閃發光！經驗值 x2 持續 15 分鐘',
    emoji: '✨',
    category: 'special',
    rarity: 'rare',
    effects: { xpMultiplier: 2, durationMinutes: 15 },
  },
  star_dust: {
    id: 'star_dust',
    nameZh: '星塵',
    descriptionZh: '星星嘅力量！即時獲得 30 經驗值',
    emoji: '💫',
    category: 'special',
    rarity: 'uncommon',
    effects: { xpBoost: 30 },
  },
  warm_scarf: {
    id: 'warm_scarf',
    nameZh: '溫暖圍巾',
    descriptionZh: '好暖呀！開心度 +30',
    emoji: '🧣',
    category: 'special',
    rarity: 'uncommon',
    effects: { happinessBoost: 30 },
  },
  treasure_coin: {
    id: 'treasure_coin',
    nameZh: '寶藏金幣',
    descriptionZh: '閃閃發亮嘅金幣！可以換 100 星星',
    emoji: '🪙',
    category: 'special',
    rarity: 'rare',
    effects: { xpBoost: 100 },
  },
  magic_petal: {
    id: 'magic_petal',
    nameZh: '魔法花瓣',
    descriptionZh: '好香好靚！開心度 +40',
    emoji: '🌺',
    category: 'special',
    rarity: 'uncommon',
    effects: { happinessBoost: 40 },
  },
  mystery_box: {
    id: 'mystery_box',
    nameZh: '神秘盒子',
    descriptionZh: '入面會有咩呢？打開嚟睇吓！',
    emoji: '🎁',
    category: 'special',
    rarity: 'rare',
    effects: {},  // Special handling - gives random item
  },

  // Equipment (permanent bonuses while equipped)
  lucky_charm: {
    id: 'lucky_charm',
    nameZh: '幸運吊飾',
    descriptionZh: '永久增加 5% 物品掉落率',
    emoji: '🔮',
    category: 'equipment',
    rarity: 'legendary',
    effects: { permanent: true },
    shopPrice: 500,
  },
  study_hat: {
    id: 'study_hat',
    nameZh: '學習帽',
    descriptionZh: '永久增加 10% 經驗值',
    emoji: '🎓',
    category: 'equipment',
    rarity: 'legendary',
    effects: { xpMultiplier: 1.1, permanent: true },
    shopPrice: 800,
  },
};

// Get items available in shop
export function getShopItems(): Item[] {
  return Object.values(ITEMS).filter(item => item.shopPrice !== undefined);
}

// Get items by rarity
export function getItemsByRarity(rarity: ItemRarity): Item[] {
  return Object.values(ITEMS).filter(item => item.rarity === rarity);
}

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

// Default pet names by species
export const DEFAULT_PET_NAMES: Record<PetSpecies, string> = {
  // Legacy pets
  slime: '小綠綠',
  unicorn: '小彩虹',
  dog: '小旺旺',
  // New pixel pets
  pixel_unicorn: '小彩彩',
  pixel_dragon: '小火火',
  pixel_ghost_cat: '小幽幽',
  pixel_mecha_bird: '小機機',
  pixel_crystal_rabbit: '小晶晶',
};

/**
 * Create default pet state for new users
 */
export function createDefaultPet(name?: string, species: PetSpecies = 'slime'): PetState {
  const now = new Date().toISOString();
  const today = now.split('T')[0];
  const petName = name || DEFAULT_PET_NAMES[species];

  return {
    name: petName,
    species,
    stage: 'egg',
    xp: 0,
    level: 1,
    lastFedDate: today,
    happiness: 50,
    unlockedSkills: [],
    activeEffects: [],
    evolvedAt: { egg: now },
    totalWordsSpelled: 0,
    birthDate: now,
    // Interaction system defaults
    patsToday: 0,
    lastPatDate: '',
    foodInventory: [],
    lastInteractionTime: '',
    dailyTasksCompleted: [],
    lastDailyTaskDate: '',
    // Events & Items system defaults
    activeEvent: null,
    lastEventDate: '',
    itemInventory: [],
    equippedItems: [],
    activeItemEffects: [],
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

// ============================================
// Interaction System Functions
// ============================================

/**
 * Get a random pat response for the pet's current stage
 */
export function getPatResponse(stage: PetStage): InteractionResponse {
  const responses = PAT_RESPONSES[stage];
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Check if pet can be patted (haven't reached daily limit)
 */
export function canPatPet(pet: PetState): boolean {
  const today = new Date().toISOString().split('T')[0];
  if (pet.lastPatDate !== today) {
    return true; // New day, reset count
  }
  return pet.patsToday < MAX_PATS_PER_DAY;
}

/**
 * Get remaining pats for today
 */
export function getRemainingPats(pet: PetState): number {
  const today = new Date().toISOString().split('T')[0];
  if (pet.lastPatDate !== today) {
    return MAX_PATS_PER_DAY;
  }
  return Math.max(0, MAX_PATS_PER_DAY - pet.patsToday);
}

/**
 * Get random speech bubble based on mood
 */
export function getRandomSpeech(mood: PetMood): string {
  const speeches = PET_SPEECHES[mood];
  return speeches[Math.floor(Math.random() * speeches.length)];
}

/**
 * Check if a daily task is available now
 */
export function isDailyTaskAvailable(task: DailyTask, completedTasks: string[], lastTaskDate: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();

  // Reset tasks for new day
  if (lastTaskDate !== today) {
    // Check time window
    if (task.timeWindow) {
      return currentHour >= task.timeWindow.start && currentHour <= task.timeWindow.end;
    }
    return true;
  }

  // Already completed today
  if (completedTasks.includes(task.id)) {
    return false;
  }

  // Check time window
  if (task.timeWindow) {
    return currentHour >= task.timeWindow.start && currentHour <= task.timeWindow.end;
  }

  return true;
}

/**
 * Get all available daily tasks
 */
export function getAvailableDailyTasks(pet: PetState): DailyTask[] {
  return DAILY_TASKS.filter(task =>
    isDailyTaskAvailable(task, pet.dailyTasksCompleted, pet.lastDailyTaskDate)
  );
}

/**
 * Award food based on practice performance
 */
export function calculateFoodReward(starsEarned: number): FoodItem | null {
  // 3 stars = chance for star candy
  // 2 stars = chance for magic berry
  // 1 star = chance for dragon fruit
  const random = Math.random();

  if (starsEarned >= 3 && random < 0.3) {
    return { id: Date.now().toString(), type: 'star_candy', quantity: 1 };
  } else if (starsEarned >= 2 && random < 0.4) {
    return { id: Date.now().toString(), type: 'magic_berry', quantity: 1 };
  } else if (random < 0.5) {
    return { id: Date.now().toString(), type: 'dragon_fruit', quantity: 1 };
  }

  return null;
}

// ============================================
// Events System Functions
// ============================================

/**
 * Check if should trigger a new random event
 * Events trigger every 2-3 days with some randomness
 */
export function shouldTriggerEvent(lastEventDate: string): boolean {
  if (!lastEventDate) return true; // First time

  const lastEvent = new Date(lastEventDate);
  const now = new Date();
  const daysSinceLastEvent = Math.floor((now.getTime() - lastEvent.getTime()) / (1000 * 60 * 60 * 24));

  // Base chance increases each day, guaranteed after 4 days
  if (daysSinceLastEvent >= 4) return true;
  if (daysSinceLastEvent < 2) return false;

  // 30% chance on day 2, 60% on day 3
  const chance = daysSinceLastEvent === 2 ? 0.3 : 0.6;
  return Math.random() < chance;
}

/**
 * Generate a random event
 */
export function generateRandomEvent(): RandomEvent {
  // Weight towards weather events (more common)
  const rand = Math.random();
  let eventPool: RandomEvent[];

  if (rand < 0.5) {
    eventPool = WEATHER_EVENTS;
  } else if (rand < 0.8) {
    eventPool = VISITOR_EVENTS;
  } else {
    eventPool = DISCOVERY_EVENTS;
  }

  return eventPool[Math.floor(Math.random() * eventPool.length)];
}

/**
 * Create an active event instance
 */
export function createActiveEvent(event: RandomEvent): ActiveEvent {
  const now = new Date();
  const expires = new Date(now.getTime() + event.duration * 60 * 60 * 1000);

  return {
    eventId: event.id,
    startedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    claimed: false,
  };
}

/**
 * Check if an active event has expired
 */
export function isEventExpired(event: ActiveEvent | null): boolean {
  if (!event) return true;
  return new Date() > new Date(event.expiresAt);
}

/**
 * Get event by ID
 */
export function getEventById(eventId: string): RandomEvent | undefined {
  return ALL_EVENTS.find(e => e.id === eventId);
}

// ============================================
// Items System Functions
// ============================================

/**
 * Calculate item drop from practice
 */
export function calculateItemDrop(starsEarned: number, hasLuckyCharm: boolean): Item | null {
  // Better stars = higher chance
  const baseMultiplier = starsEarned === 3 ? 1.5 : starsEarned === 2 ? 1.2 : 1;
  const luckyMultiplier = hasLuckyCharm ? 2 : 1;

  // Try each item's drop chance
  for (const item of Object.values(ITEMS)) {
    if (item.dropChance) {
      const adjustedChance = item.dropChance * baseMultiplier * luckyMultiplier;
      if (Math.random() < adjustedChance) {
        return item;
      }
    }
  }

  return null;
}

/**
 * Add item to inventory
 */
export function addItemToInventory(inventory: InventoryItem[], itemId: string, quantity: number = 1): InventoryItem[] {
  const existingIndex = inventory.findIndex(i => i.itemId === itemId);

  if (existingIndex >= 0) {
    const newInventory = [...inventory];
    newInventory[existingIndex] = {
      ...newInventory[existingIndex],
      quantity: newInventory[existingIndex].quantity + quantity,
    };
    return newInventory;
  }

  return [...inventory, { itemId, quantity }];
}

/**
 * Remove item from inventory
 */
export function removeItemFromInventory(inventory: InventoryItem[], itemId: string, quantity: number = 1): InventoryItem[] {
  const existingIndex = inventory.findIndex(i => i.itemId === itemId);

  if (existingIndex === -1) return inventory;

  const newInventory = [...inventory];
  const current = newInventory[existingIndex].quantity;

  if (current <= quantity) {
    newInventory.splice(existingIndex, 1);
  } else {
    newInventory[existingIndex] = {
      ...newInventory[existingIndex],
      quantity: current - quantity,
    };
  }

  return newInventory;
}

/**
 * Check if has item in inventory
 */
export function hasItem(inventory: InventoryItem[], itemId: string, quantity: number = 1): boolean {
  const item = inventory.find(i => i.itemId === itemId);
  return item ? item.quantity >= quantity : false;
}

/**
 * Use a consumable item
 */
export function useItem(itemId: string, pet: PetState): { pet: PetState; success: boolean; message: string } {
  const item = ITEMS[itemId];
  if (!item) {
    return { pet, success: false, message: '搵唔到呢件道具' };
  }

  if (!hasItem(pet.itemInventory, itemId)) {
    return { pet, success: false, message: '你冇呢件道具' };
  }

  // Handle mystery box specially
  if (itemId === 'mystery_box') {
    const possibleItems = Object.values(ITEMS).filter(i =>
      i.category !== 'equipment' && i.id !== 'mystery_box'
    );
    const randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];

    const newInventory = removeItemFromInventory(pet.itemInventory, itemId);
    const finalInventory = addItemToInventory(newInventory, randomItem.id);

    return {
      pet: { ...pet, itemInventory: finalInventory },
      success: true,
      message: `打開咗神秘盒子，獲得 ${randomItem.emoji} ${randomItem.nameZh}！`,
    };
  }

  // Apply item effects
  let newPet = { ...pet };
  let message = `使用咗 ${item.emoji} ${item.nameZh}！`;

  // Instant XP boost
  if (item.effects.xpBoost) {
    newPet.xp += item.effects.xpBoost;
    message += ` +${item.effects.xpBoost} 經驗值`;
  }

  // Instant happiness boost
  if (item.effects.happinessBoost) {
    newPet.happiness = Math.min(100, newPet.happiness + item.effects.happinessBoost);
    message += ` +${item.effects.happinessBoost} 開心度`;
  }

  // Time-based effects
  if (item.effects.durationMinutes && (item.effects.xpMultiplier || item.effects.happinessMultiplier)) {
    const expiresAt = new Date(Date.now() + item.effects.durationMinutes * 60 * 1000).toISOString();
    const newEffect: ActiveItemEffect = {
      itemId,
      effect: item.effects,
      expiresAt,
    };
    newPet.activeItemEffects = [...(newPet.activeItemEffects || []), newEffect];
    message += ` (${item.effects.durationMinutes}分鐘)`;
  }

  // Remove from inventory
  newPet.itemInventory = removeItemFromInventory(pet.itemInventory, itemId);

  return { pet: newPet, success: true, message };
}

/**
 * Clean up expired item effects
 */
export function cleanupExpiredItemEffects(effects: ActiveItemEffect[]): ActiveItemEffect[] {
  const now = new Date();
  return effects.filter(effect => new Date(effect.expiresAt) > now);
}

/**
 * Get current XP multiplier from active effects
 */
export function getActiveXPMultiplier(effects: ActiveItemEffect[], activeEvent: ActiveEvent | null): number {
  let multiplier = 1;

  // From item effects
  for (const effect of effects) {
    if (effect.effect.xpMultiplier && new Date(effect.expiresAt) > new Date()) {
      multiplier *= effect.effect.xpMultiplier;
    }
  }

  // From active event
  if (activeEvent && !isEventExpired(activeEvent)) {
    const event = getEventById(activeEvent.eventId);
    if (event?.effects.xpMultiplier) {
      multiplier *= event.effects.xpMultiplier;
    }
  }

  return multiplier;
}

/**
 * Get current happiness multiplier from active effects
 */
export function getActiveHappinessMultiplier(effects: ActiveItemEffect[], activeEvent: ActiveEvent | null): number {
  let multiplier = 1;

  // From item effects
  for (const effect of effects) {
    if (effect.effect.happinessMultiplier && new Date(effect.expiresAt) > new Date()) {
      multiplier *= effect.effect.happinessMultiplier;
    }
  }

  // From active event
  if (activeEvent && !isEventExpired(activeEvent)) {
    const event = getEventById(activeEvent.eventId);
    if (event?.effects.happinessMultiplier) {
      multiplier *= event.effects.happinessMultiplier;
    }
  }

  return multiplier;
}

/**
 * Equip an item
 */
export function equipItem(pet: PetState, itemId: string): { pet: PetState; success: boolean; message: string } {
  const item = ITEMS[itemId];
  if (!item || item.category !== 'equipment') {
    return { pet, success: false, message: '呢件道具唔可以裝備' };
  }

  if (!hasItem(pet.itemInventory, itemId)) {
    return { pet, success: false, message: '你冇呢件道具' };
  }

  if (pet.equippedItems.includes(itemId)) {
    return { pet, success: false, message: '已經裝備咗' };
  }

  return {
    pet: {
      ...pet,
      equippedItems: [...pet.equippedItems, itemId],
    },
    success: true,
    message: `裝備咗 ${item.emoji} ${item.nameZh}！`,
  };
}

/**
 * Unequip an item
 */
export function unequipItem(pet: PetState, itemId: string): { pet: PetState; success: boolean; message: string } {
  if (!pet.equippedItems.includes(itemId)) {
    return { pet, success: false, message: '冇裝備呢件道具' };
  }

  const item = ITEMS[itemId];
  return {
    pet: {
      ...pet,
      equippedItems: pet.equippedItems.filter(id => id !== itemId),
    },
    success: true,
    message: item ? `卸下咗 ${item.emoji} ${item.nameZh}` : '卸下咗道具',
  };
}

/**
 * Buy item from shop
 */
export function buyItem(itemId: string, currentStars: number, inventory: InventoryItem[]): {
  success: boolean;
  message: string;
  newStars: number;
  newInventory: InventoryItem[];
} {
  const item = ITEMS[itemId];
  if (!item || !item.shopPrice) {
    return { success: false, message: '呢件道具唔賣', newStars: currentStars, newInventory: inventory };
  }

  if (currentStars < item.shopPrice) {
    return { success: false, message: `星星唔夠！需要 ${item.shopPrice} 粒星`, newStars: currentStars, newInventory: inventory };
  }

  return {
    success: true,
    message: `買咗 ${item.emoji} ${item.nameZh}！`,
    newStars: currentStars - item.shopPrice,
    newInventory: addItemToInventory(inventory, itemId),
  };
}
