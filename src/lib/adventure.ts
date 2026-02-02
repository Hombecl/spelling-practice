// Adventure Mode - Worlds, Stages, and Boss Battles
import { PetStage, PetState } from './pet';
import { Word, level1Words, level2Words, level3Words, shuffleArray } from './words';

// ============ Types ============

export type WorldId = 'forest' | 'ocean' | 'mountain' | 'sky' | 'volcano';

export interface Stage {
  id: string;           // e.g., "forest-1"
  number: number;       // 1-10
  nameZh: string;
  emoji: string;
  wordCount: number;    // 3-5 words per stage
  rewards: {
    stars: number;
    xp: number;
  };
}

export type BossChallengeType = 'streak' | 'speed' | 'accuracy' | 'marathon' | 'ultimate';

export interface BossBattle {
  id: string;
  nameZh: string;
  bossEmoji: string;
  storyIntro: string;
  storyVictory: string;
  challenge: {
    type: BossChallengeType;
    wordCount: number;
    timeLimit?: number;      // seconds (for speed/ultimate)
    requiredStreak?: number; // for streak/ultimate
    requiredPerfect?: number; // for accuracy
  };
  rewards: {
    stars: number;
    xp: number;
    specialItem: string;
  };
}

export interface World {
  id: WorldId;
  nameZh: string;
  emoji: string;
  bgGradient: string;       // Tailwind gradient classes
  accentColor: string;      // For UI elements
  description: string;
  requiredPetStage: PetStage;
  requiredPetLevel: number;
  wordDifficulty: 1 | 2 | 3;
  wordCategories: string[]; // Filter words by these categories
  stages: Stage[];
  boss: BossBattle;
}

// Adventure progress stored in UserProgress
export interface AdventureProgress {
  currentWorld: WorldId;
  worldProgress: Record<WorldId, WorldProgress>;
}

export interface WorldProgress {
  unlocked: boolean;
  stagesCompleted: number;      // 0-10
  stageStars: Record<string, number>;  // e.g., "forest-1": 3
  bossDefeated: boolean;
  bestBossTime?: number;        // milliseconds
}

// ============ Stage Generation Helper ============

function generateStages(worldId: WorldId, count: number = 10): Stage[] {
  const stageEmojis: Record<WorldId, string[]> = {
    forest: ['🌱', '🍄', '🌿', '🌸', '🍀', '🌻', '🌳', '🪵', '🏕️', '⭐'],
    ocean: ['🐚', '🦀', '🐠', '🐙', '🦈', '🐬', '🐋', '🏝️', '⚓', '⭐'],
    mountain: ['🪨', '🏔️', '⛺', '🦅', '🌲', '❄️', '🎿', '🏰', '🗻', '⭐'],
    sky: ['☁️', '🎈', '🌈', '🦋', '🐦', '✈️', '🚀', '⭐', '🌙', '⭐'],
    volcano: ['🔥', '🌋', '💎', '🦎', '🐉', '⚡', '💫', '👑', '🏆', '⭐'],
  };

  const stageNames: Record<WorldId, string[]> = {
    forest: ['小草地', '蘑菇林', '綠葉徑', '櫻花坡', '幸運谷', '向日葵原', '大樹下', '木橋邊', '營地', '星光空地'],
    ocean: ['貝殼灘', '螃蟹洞', '珊瑚礁', '章魚園', '鯊魚灣', '海豚灣', '鯨魚海', '寶島', '沉船', '海底寶藏'],
    mountain: ['山腳石', '雪山口', '營地', '鷹巢', '松林', '雪原', '滑雪道', '古堡', '山頂', '星空峰'],
    sky: ['白雲朵', '氣球站', '彩虹橋', '蝴蝶谷', '鳥巢', '飛機場', '火箭台', '星星站', '月亮灣', '天堂門'],
    volcano: ['火焰路', '熔岩池', '寶石洞', '蜥蜴谷', '龍穴口', '閃電崖', '流星坡', '王座前', '終極擂台', '龍王寶座'],
  };

  return Array.from({ length: count }, (_, i) => ({
    id: `${worldId}-${i + 1}`,
    number: i + 1,
    nameZh: stageNames[worldId][i],
    emoji: stageEmojis[worldId][i],
    wordCount: i < 3 ? 3 : i < 7 ? 4 : 5, // 3 words for stages 1-3, 4 for 4-7, 5 for 8-10
    rewards: {
      stars: i < 3 ? 2 : i < 7 ? 3 : 4,   // 2 stars for early, 3 for mid, 4 for late
      xp: 10 + i * 5,                      // 10-55 XP
    },
  }));
}

// ============ World Definitions ============

export const WORLDS: World[] = [
  {
    id: 'forest',
    nameZh: '森林王國',
    emoji: '🌲',
    bgGradient: 'from-green-100 to-emerald-200',
    accentColor: 'green',
    description: '歡迎來到森林王國！認識動物朋友們！',
    requiredPetStage: 'egg',
    requiredPetLevel: 1,
    wordDifficulty: 1,
    wordCategories: ['animals', 'nature', 'basic'],
    stages: generateStages('forest'),
    boss: {
      id: 'forest-boss',
      nameZh: '大樹精靈',
      bossEmoji: '🌳',
      storyIntro: '大樹精靈守護住森林嘅出口！要連續答啱 5 個字先可以通過！',
      storyVictory: '大樹精靈：「做得好！你已經掌握咗森林嘅語言！」',
      challenge: {
        type: 'streak',
        wordCount: 5,
        requiredStreak: 5,
      },
      rewards: {
        stars: 20,
        xp: 100,
        specialItem: 'forest_badge',
      },
    },
  },
  {
    id: 'ocean',
    nameZh: '海洋世界',
    emoji: '🌊',
    bgGradient: 'from-blue-100 to-cyan-200',
    accentColor: 'blue',
    description: '潛入深海，探索海底奧秘！',
    requiredPetStage: 'baby',
    requiredPetLevel: 6,
    wordDifficulty: 1,
    wordCategories: ['animals', 'colors', 'nature'],
    stages: generateStages('ocean'),
    boss: {
      id: 'ocean-boss',
      nameZh: '章魚公主',
      bossEmoji: '🐙',
      storyIntro: '章魚公主好鍾意玩限時遊戲！90 秒內完成 5 個字！',
      storyVictory: '章魚公主：「你好快！歡迎你成為海洋嘅朋友！」',
      challenge: {
        type: 'speed',
        wordCount: 5,
        timeLimit: 90,
      },
      rewards: {
        stars: 25,
        xp: 120,
        specialItem: 'ocean_badge',
      },
    },
  },
  {
    id: 'mountain',
    nameZh: '雪山之巔',
    emoji: '⛰️',
    bgGradient: 'from-slate-100 to-gray-300',
    accentColor: 'slate',
    description: '攀上高山，挑戰更難嘅生字！',
    requiredPetStage: 'child',
    requiredPetLevel: 16,
    wordDifficulty: 2,
    wordCategories: ['objects', 'actions', 'nature'],
    stages: generateStages('mountain'),
    boss: {
      id: 'mountain-boss',
      nameZh: '雪人國王',
      bossEmoji: '☃️',
      storyIntro: '雪人國王要求完美！連續 3 個字拎滿星先得！',
      storyVictory: '雪人國王：「完美！你嘅串字能力已經到達新高度！」',
      challenge: {
        type: 'accuracy',
        wordCount: 5,
        requiredPerfect: 3,
      },
      rewards: {
        stars: 30,
        xp: 150,
        specialItem: 'mountain_badge',
      },
    },
  },
  {
    id: 'sky',
    nameZh: '天空之城',
    emoji: '☁️',
    bgGradient: 'from-sky-100 to-indigo-200',
    accentColor: 'sky',
    description: '飛上雲端，探索天空嘅秘密！',
    requiredPetStage: 'teen',
    requiredPetLevel: 31,
    wordDifficulty: 2,
    wordCategories: ['transport', 'nature', 'feelings', 'actions'],
    stages: generateStages('sky'),
    boss: {
      id: 'sky-boss',
      nameZh: '雲上仙女',
      bossEmoji: '🧚',
      storyIntro: '仙女要測試你嘅耐力！完成 8 個字嘅馬拉松！',
      storyVictory: '仙女：「你嘅堅持令人佩服！天空之門為你打開！」',
      challenge: {
        type: 'marathon',
        wordCount: 8,
      },
      rewards: {
        stars: 40,
        xp: 200,
        specialItem: 'sky_badge',
      },
    },
  },
  {
    id: 'volcano',
    nameZh: '火龍之巢',
    emoji: '🌋',
    bgGradient: 'from-orange-100 to-red-300',
    accentColor: 'red',
    description: '最終挑戰！面對火龍王！',
    requiredPetStage: 'adult',
    requiredPetLevel: 51,
    wordDifficulty: 3,
    wordCategories: ['people', 'places', 'food', 'objects', 'actions'],
    stages: generateStages('volcano'),
    boss: {
      id: 'volcano-boss',
      nameZh: '火龍王',
      bossEmoji: '🐉',
      storyIntro: '火龍王係最終挑戰！60 秒內連續答啱 5 個字！',
      storyVictory: '火龍王：「傳奇誕生！你係真正嘅串字大師！」',
      challenge: {
        type: 'ultimate',
        wordCount: 5,
        timeLimit: 60,
        requiredStreak: 5,
      },
      rewards: {
        stars: 50,
        xp: 300,
        specialItem: 'dragon_crown',
      },
    },
  },
];

// ============ Helper Functions ============

export function getWorldById(worldId: WorldId): World | undefined {
  return WORLDS.find(w => w.id === worldId);
}

export function getStageById(worldId: WorldId, stageNumber: number): Stage | undefined {
  const world = getWorldById(worldId);
  return world?.stages.find(s => s.number === stageNumber);
}

export function isWorldUnlocked(worldId: WorldId, pet: PetState): boolean {
  const world = getWorldById(worldId);
  if (!world) return false;

  const stageOrder: PetStage[] = ['egg', 'baby', 'child', 'teen', 'adult'];
  const currentStageIndex = stageOrder.indexOf(pet.stage);
  const requiredStageIndex = stageOrder.indexOf(world.requiredPetStage);

  return currentStageIndex >= requiredStageIndex && pet.level >= world.requiredPetLevel;
}

export function isStageAvailable(
  worldId: WorldId,
  stageNumber: number,
  adventureProgress: AdventureProgress | undefined
): boolean {
  // Stage 1 is always available if world is unlocked
  if (stageNumber === 1) return true;

  // Need previous stage completed
  const worldProgress = adventureProgress?.worldProgress[worldId];
  if (!worldProgress) return stageNumber === 1;

  return worldProgress.stagesCompleted >= stageNumber - 1;
}

export function isBossAvailable(
  worldId: WorldId,
  adventureProgress: AdventureProgress | undefined
): boolean {
  const worldProgress = adventureProgress?.worldProgress[worldId];
  if (!worldProgress) return false;

  // Need all 10 stages completed
  return worldProgress.stagesCompleted >= 10;
}

export function getWordsForStage(
  world: World,
  stage: Stage,
  activeWordListId?: string
): string[] {
  // If there's an active word list (spelling test), use smart selection from it
  if (activeWordListId) {
    const { getSmartPracticeWords, getWordListById } = require('./customWords');
    const list = getWordListById(activeWordListId);
    if (list && list.words.length > 0) {
      return getSmartPracticeWords(activeWordListId, stage.wordCount);
    }
  }

  // Fallback to built-in words based on world difficulty
  const wordList = world.wordDifficulty === 1
    ? level1Words
    : world.wordDifficulty === 2
      ? level2Words
      : level3Words;

  // Filter by world categories if specified
  let filteredWords = wordList;
  if (world.wordCategories.length > 0) {
    filteredWords = wordList.filter(w =>
      world.wordCategories.includes(w.category)
    );
  }

  // If not enough words after filtering, use all words
  if (filteredWords.length < stage.wordCount) {
    filteredWords = wordList;
  }

  // Shuffle and take required number
  const shuffled = shuffleArray(filteredWords);
  return shuffled.slice(0, stage.wordCount).map(w => w.word);
}

export function getWordsForBoss(
  world: World,
  boss: BossBattle,
  activeWordListId?: string
): string[] {
  // If there's an active word list, use it for boss battles too
  if (activeWordListId) {
    const { getSmartPracticeWords, getWordListById } = require('./customWords');
    const list = getWordListById(activeWordListId);
    if (list && list.words.length > 0) {
      return getSmartPracticeWords(activeWordListId, boss.challenge.wordCount);
    }
  }

  // Fallback to built-in words
  const wordList = world.wordDifficulty === 1
    ? level1Words
    : world.wordDifficulty === 2
      ? level2Words
      : level3Words;

  const shuffled = shuffleArray(wordList);
  return shuffled.slice(0, boss.challenge.wordCount).map(w => w.word);
}

export function calculateStageStars(
  correctCount: number,
  totalCount: number,
  totalErrors: number
): number {
  // 3 stars: All correct with 0-1 total errors
  // 2 stars: All correct with 2-3 errors
  // 1 star: All correct with 4+ errors
  if (correctCount < totalCount) return 0;

  if (totalErrors <= 1) return 3;
  if (totalErrors <= 3) return 2;
  return 1;
}

export function createDefaultAdventureProgress(): AdventureProgress {
  return {
    currentWorld: 'forest',
    worldProgress: {
      forest: { unlocked: true, stagesCompleted: 0, stageStars: {}, bossDefeated: false },
      ocean: { unlocked: false, stagesCompleted: 0, stageStars: {}, bossDefeated: false },
      mountain: { unlocked: false, stagesCompleted: 0, stageStars: {}, bossDefeated: false },
      sky: { unlocked: false, stagesCompleted: 0, stageStars: {}, bossDefeated: false },
      volcano: { unlocked: false, stagesCompleted: 0, stageStars: {}, bossDefeated: false },
    },
  };
}

export function updateWorldUnlocks(
  adventureProgress: AdventureProgress,
  pet: PetState
): AdventureProgress {
  const updated = { ...adventureProgress };

  for (const world of WORLDS) {
    if (isWorldUnlocked(world.id, pet)) {
      updated.worldProgress[world.id] = {
        ...updated.worldProgress[world.id],
        unlocked: true,
      };
    }
  }

  return updated;
}

export function completeStage(
  adventureProgress: AdventureProgress,
  worldId: WorldId,
  stageNumber: number,
  stars: number
): AdventureProgress {
  const worldProgress = adventureProgress.worldProgress[worldId];
  const stageId = `${worldId}-${stageNumber}`;

  // Update stage stars (keep best)
  const existingStars = worldProgress.stageStars[stageId] || 0;
  const newStageStars = {
    ...worldProgress.stageStars,
    [stageId]: Math.max(existingStars, stars),
  };

  // Update stages completed count
  const newStagesCompleted = Math.max(
    worldProgress.stagesCompleted,
    stageNumber
  );

  return {
    ...adventureProgress,
    worldProgress: {
      ...adventureProgress.worldProgress,
      [worldId]: {
        ...worldProgress,
        stageStars: newStageStars,
        stagesCompleted: newStagesCompleted,
      },
    },
  };
}

export function completeBoss(
  adventureProgress: AdventureProgress,
  worldId: WorldId,
  time?: number
): AdventureProgress {
  const worldProgress = adventureProgress.worldProgress[worldId];

  return {
    ...adventureProgress,
    worldProgress: {
      ...adventureProgress.worldProgress,
      [worldId]: {
        ...worldProgress,
        bossDefeated: true,
        bestBossTime: time !== undefined
          ? Math.min(worldProgress.bestBossTime || Infinity, time)
          : worldProgress.bestBossTime,
      },
    },
  };
}

// Get total stars earned across all worlds
export function getTotalAdventureStars(adventureProgress: AdventureProgress): number {
  let total = 0;
  for (const worldId of Object.keys(adventureProgress.worldProgress) as WorldId[]) {
    const worldProgress = adventureProgress.worldProgress[worldId];
    for (const stars of Object.values(worldProgress.stageStars)) {
      total += stars;
    }
  }
  return total;
}

// Get completion percentage for a world
export function getWorldCompletion(
  adventureProgress: AdventureProgress,
  worldId: WorldId
): { stages: number; maxStages: number; boss: boolean } {
  const worldProgress = adventureProgress.worldProgress[worldId];
  return {
    stages: worldProgress.stagesCompleted,
    maxStages: 10,
    boss: worldProgress.bossDefeated,
  };
}
