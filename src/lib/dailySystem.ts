// Daily Engagement System - Streak, Daily Quests, Daily Rewards
// Based on Duolingo's proven gamification mechanics

export interface DailyStreak {
  currentStreak: number;        // Current consecutive days
  longestStreak: number;        // All-time record
  lastPracticeDate: string;     // ISO date string (YYYY-MM-DD)
  streakFreezes: number;        // Available streak protections
  freezeUsedToday: boolean;     // Whether freeze was auto-used today
  totalPracticeDays: number;    // Lifetime practice days
}

export interface DailyQuest {
  id: string;
  type: 'words' | 'correct' | 'streak' | 'mode' | 'adventure' | 'perfect';
  nameZh: string;
  descriptionZh: string;
  emoji: string;
  target: number;               // Target to complete
  current: number;              // Current progress
  xpReward: number;
  completed: boolean;
}

export interface DailyChest {
  opened: boolean;
  lastOpenedDate: string;
  currentTier: 1 | 2 | 3;       // Tier increases with streak
}

export interface DailyEngagement {
  streak: DailyStreak;
  quests: DailyQuest[];
  questsGeneratedDate: string;  // When quests were generated
  chest: DailyChest;
  wordsCompletedToday: number;
  correctAnswersToday: number;
  perfectWordsToday: number;    // Words with 1 attempt
  adventureStagesCompletedToday: number;
  modesUsedToday: string[];     // Track different modes used
}

// Quest templates
const QUEST_TEMPLATES: Omit<DailyQuest, 'current' | 'completed'>[] = [
  // Word count quests
  { id: 'words_5', type: 'words', nameZh: '練習 5 個字', descriptionZh: '完成 5 個生字', emoji: '📝', target: 5, xpReward: 10 },
  { id: 'words_10', type: 'words', nameZh: '練習 10 個字', descriptionZh: '完成 10 個生字', emoji: '📝', target: 10, xpReward: 20 },
  { id: 'words_20', type: 'words', nameZh: '練習達人', descriptionZh: '完成 20 個生字', emoji: '🏆', target: 20, xpReward: 40 },

  // Correct answer quests
  { id: 'correct_5', type: 'correct', nameZh: '答啱 5 題', descriptionZh: '一次過答啱 5 個字', emoji: '✅', target: 5, xpReward: 15 },
  { id: 'correct_10', type: 'correct', nameZh: '答啱 10 題', descriptionZh: '一次過答啱 10 個字', emoji: '✅', target: 10, xpReward: 30 },

  // Perfect quests (1 attempt)
  { id: 'perfect_3', type: 'perfect', nameZh: '完美 3 個', descriptionZh: '3 個字一次過答啱', emoji: '⭐', target: 3, xpReward: 20 },
  { id: 'perfect_5', type: 'perfect', nameZh: '完美 5 個', descriptionZh: '5 個字一次過答啱', emoji: '🌟', target: 5, xpReward: 35 },

  // Mode variety quests
  { id: 'mode_2', type: 'mode', nameZh: '模式探險家', descriptionZh: '用 2 種唔同模式練習', emoji: '🎮', target: 2, xpReward: 15 },
  { id: 'mode_3', type: 'mode', nameZh: '全能選手', descriptionZh: '試晒 3 種模式', emoji: '🎯', target: 3, xpReward: 25 },

  // Adventure quests
  { id: 'adventure_1', type: 'adventure', nameZh: '冒險家', descriptionZh: '完成 1 個冒險關卡', emoji: '🗺️', target: 1, xpReward: 15 },
  { id: 'adventure_3', type: 'adventure', nameZh: '闖關達人', descriptionZh: '完成 3 個冒險關卡', emoji: '🏰', target: 3, xpReward: 35 },

  // Streak celebration (special)
  { id: 'streak_3', type: 'streak', nameZh: '3 日連勝！', descriptionZh: '連續 3 日練習', emoji: '🔥', target: 3, xpReward: 30 },
  { id: 'streak_7', type: 'streak', nameZh: '一週挑戰', descriptionZh: '連續 7 日練習', emoji: '🔥', target: 7, xpReward: 70 },
  { id: 'streak_30', type: 'streak', nameZh: '月度冠軍', descriptionZh: '連續 30 日練習', emoji: '👑', target: 30, xpReward: 300 },
];

// Streak milestone rewards
export const STREAK_MILESTONES: { days: number; reward: string; xp: number; emoji: string }[] = [
  { days: 3, reward: '🔥 連勝新手', xp: 30, emoji: '🔥' },
  { days: 7, reward: '🔥🔥 一週達人', xp: 70, emoji: '🔥' },
  { days: 14, reward: '🔥🔥🔥 兩週冠軍', xp: 150, emoji: '🔥' },
  { days: 30, reward: '👑 月度傳奇', xp: 300, emoji: '👑' },
  { days: 50, reward: '💎 半百英雄', xp: 500, emoji: '💎' },
  { days: 100, reward: '🏆 百日王者', xp: 1000, emoji: '🏆' },
];

const DAILY_SYSTEM_KEY = 'spelling-practice-daily';

export function createDefaultDailyEngagement(): DailyEngagement {
  return {
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDate: '',
      streakFreezes: 1, // Start with 1 free freeze
      freezeUsedToday: false,
      totalPracticeDays: 0,
    },
    quests: [],
    questsGeneratedDate: '',
    chest: {
      opened: false,
      lastOpenedDate: '',
      currentTier: 1,
    },
    wordsCompletedToday: 0,
    correctAnswersToday: 0,
    perfectWordsToday: 0,
    adventureStagesCompletedToday: 0,
    modesUsedToday: [],
  };
}

export function getDailyEngagement(): DailyEngagement {
  if (typeof window === 'undefined') {
    return createDefaultDailyEngagement();
  }

  try {
    const stored = localStorage.getItem(DAILY_SYSTEM_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return applyDailyReset(parsed);
    }
  } catch (e) {
    console.error('Error loading daily engagement:', e);
  }

  return createDefaultDailyEngagement();
}

export function saveDailyEngagement(engagement: DailyEngagement): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(DAILY_SYSTEM_KEY, JSON.stringify(engagement));
  } catch (e) {
    console.error('Error saving daily engagement:', e);
  }
}

function applyDailyReset(engagement: DailyEngagement): DailyEngagement {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = getYesterday();

  let updated = { ...engagement };

  // Check if streak needs updating
  if (engagement.streak.lastPracticeDate !== today) {
    // If last practice was yesterday, streak continues
    // If last practice was before yesterday, check for freeze
    if (engagement.streak.lastPracticeDate !== yesterday) {
      if (engagement.streak.lastPracticeDate && !engagement.streak.freezeUsedToday) {
        // Use freeze if available
        if (engagement.streak.streakFreezes > 0) {
          updated.streak = {
            ...updated.streak,
            streakFreezes: updated.streak.streakFreezes - 1,
            freezeUsedToday: true,
          };
        } else {
          // Streak broken!
          updated.streak = {
            ...updated.streak,
            currentStreak: 0,
          };
        }
      }
    }

    // Reset daily counters for new day
    updated = {
      ...updated,
      wordsCompletedToday: 0,
      correctAnswersToday: 0,
      perfectWordsToday: 0,
      adventureStagesCompletedToday: 0,
      modesUsedToday: [],
      streak: {
        ...updated.streak,
        freezeUsedToday: false,
      },
      chest: {
        ...updated.chest,
        opened: false,
      },
    };

    // Generate new quests
    updated.quests = generateDailyQuests(updated.streak.currentStreak);
    updated.questsGeneratedDate = today;
  }

  return updated;
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function generateDailyQuests(currentStreak: number): DailyQuest[] {
  // Select 3 quests based on streak level
  // Higher streak = harder quests but better rewards
  const difficultyLevel = Math.min(Math.floor(currentStreak / 7), 2); // 0, 1, or 2

  // Filter templates by difficulty
  const easyQuests = QUEST_TEMPLATES.filter(q =>
    ['words_5', 'correct_5', 'perfect_3', 'adventure_1'].includes(q.id)
  );
  const mediumQuests = QUEST_TEMPLATES.filter(q =>
    ['words_10', 'correct_10', 'perfect_5', 'mode_2', 'adventure_3'].includes(q.id)
  );
  const hardQuests = QUEST_TEMPLATES.filter(q =>
    ['words_20', 'mode_3'].includes(q.id)
  );

  // Always include a streak quest if applicable
  const streakQuests = QUEST_TEMPLATES.filter(q =>
    q.type === 'streak' && q.target <= currentStreak + 1
  );

  const selected: DailyQuest[] = [];

  // Pick based on difficulty
  if (difficultyLevel === 0) {
    // Beginner: 2 easy, 1 medium
    selected.push(...pickRandom(easyQuests, 2).map(q => ({ ...q, current: 0, completed: false })));
    selected.push(...pickRandom(mediumQuests, 1).map(q => ({ ...q, current: 0, completed: false })));
  } else if (difficultyLevel === 1) {
    // Intermediate: 1 easy, 2 medium
    selected.push(...pickRandom(easyQuests, 1).map(q => ({ ...q, current: 0, completed: false })));
    selected.push(...pickRandom(mediumQuests, 2).map(q => ({ ...q, current: 0, completed: false })));
  } else {
    // Advanced: 1 medium, 2 hard
    selected.push(...pickRandom(mediumQuests, 1).map(q => ({ ...q, current: 0, completed: false })));
    selected.push(...pickRandom(hardQuests, 2).map(q => ({ ...q, current: 0, completed: false })));
  }

  // Replace one with streak quest if available
  if (streakQuests.length > 0) {
    const streakQuest = streakQuests[streakQuests.length - 1]; // Highest applicable
    selected[0] = { ...streakQuest, current: currentStreak, completed: currentStreak >= streakQuest.target };
  }

  return selected.slice(0, 3);
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ============ Streak Functions ============

export function recordPractice(): { engagement: DailyEngagement; streakIncreased: boolean; milestone: typeof STREAK_MILESTONES[0] | null } {
  const engagement = getDailyEngagement();
  const today = new Date().toISOString().split('T')[0];

  let streakIncreased = false;
  let milestone: typeof STREAK_MILESTONES[0] | null = null;

  // If already practiced today, just return
  if (engagement.streak.lastPracticeDate === today) {
    return { engagement, streakIncreased: false, milestone: null };
  }

  // Update streak
  const newStreak = engagement.streak.currentStreak + 1;
  const newLongest = Math.max(newStreak, engagement.streak.longestStreak);

  // Check for milestone
  milestone = STREAK_MILESTONES.find(m => m.days === newStreak) || null;

  engagement.streak = {
    ...engagement.streak,
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastPracticeDate: today,
    totalPracticeDays: engagement.streak.totalPracticeDays + 1,
  };

  streakIncreased = true;

  // Update streak quest progress
  engagement.quests = engagement.quests.map(q => {
    if (q.type === 'streak') {
      return { ...q, current: newStreak, completed: newStreak >= q.target };
    }
    return q;
  });

  saveDailyEngagement(engagement);
  return { engagement, streakIncreased, milestone };
}

// ============ Quest Progress Functions ============

export function recordWordCompletion(correct: boolean, attempts: number, mode: string): DailyEngagement {
  const engagement = getDailyEngagement();
  const today = new Date().toISOString().split('T')[0];

  // Initialize if needed
  if (engagement.questsGeneratedDate !== today) {
    return applyDailyReset(engagement);
  }

  // Update counters
  engagement.wordsCompletedToday += 1;
  if (correct) {
    engagement.correctAnswersToday += 1;
    if (attempts === 1) {
      engagement.perfectWordsToday += 1;
    }
  }

  // Track mode used
  if (!engagement.modesUsedToday.includes(mode)) {
    engagement.modesUsedToday.push(mode);
  }

  // Update quest progress
  engagement.quests = engagement.quests.map(q => {
    let current = q.current;

    switch (q.type) {
      case 'words':
        current = engagement.wordsCompletedToday;
        break;
      case 'correct':
        current = engagement.correctAnswersToday;
        break;
      case 'perfect':
        current = engagement.perfectWordsToday;
        break;
      case 'mode':
        current = engagement.modesUsedToday.length;
        break;
    }

    return {
      ...q,
      current,
      completed: current >= q.target,
    };
  });

  saveDailyEngagement(engagement);
  return engagement;
}

export function recordAdventureStage(): DailyEngagement {
  const engagement = getDailyEngagement();

  engagement.adventureStagesCompletedToday += 1;

  // Update adventure quest progress
  engagement.quests = engagement.quests.map(q => {
    if (q.type === 'adventure') {
      const current = engagement.adventureStagesCompletedToday;
      return { ...q, current, completed: current >= q.target };
    }
    return q;
  });

  saveDailyEngagement(engagement);
  return engagement;
}

// ============ Daily Chest Functions ============

export function canOpenDailyChest(engagement: DailyEngagement): boolean {
  // Can open chest if completed at least 1 quest today
  const completedQuests = engagement.quests.filter(q => q.completed).length;
  return completedQuests >= 1 && !engagement.chest.opened;
}

export function openDailyChest(): { engagement: DailyEngagement; rewards: { xp: number; freezes: number; } } {
  const engagement = getDailyEngagement();
  const today = new Date().toISOString().split('T')[0];

  if (!canOpenDailyChest(engagement)) {
    return { engagement, rewards: { xp: 0, freezes: 0 } };
  }

  const completedQuests = engagement.quests.filter(q => q.completed).length;

  // Calculate tier based on streak
  let tier: 1 | 2 | 3 = 1;
  if (engagement.streak.currentStreak >= 7) tier = 2;
  if (engagement.streak.currentStreak >= 30) tier = 3;

  // Base rewards by tier
  const baseXP = tier === 3 ? 50 : tier === 2 ? 30 : 20;
  const xp = baseXP * completedQuests;

  // Chance for streak freeze (higher with more quests completed)
  const freezeChance = completedQuests === 3 ? 0.3 : completedQuests === 2 ? 0.15 : 0.05;
  const freezes = Math.random() < freezeChance ? 1 : 0;

  engagement.chest = {
    opened: true,
    lastOpenedDate: today,
    currentTier: tier,
  };

  if (freezes > 0) {
    engagement.streak.streakFreezes += freezes;
  }

  saveDailyEngagement(engagement);
  return { engagement, rewards: { xp, freezes } };
}

// ============ Streak Freeze Functions ============

export function purchaseStreakFreeze(cost: number): boolean {
  // This would deduct stars/gems from user
  // For now, just add a freeze
  const engagement = getDailyEngagement();
  engagement.streak.streakFreezes += 1;
  saveDailyEngagement(engagement);
  return true;
}

export function getStreakStatus(): {
  current: number;
  longest: number;
  freezesAvailable: number;
  daysUntilNextMilestone: number;
  nextMilestone: typeof STREAK_MILESTONES[0] | null;
} {
  const engagement = getDailyEngagement();
  const current = engagement.streak.currentStreak;

  // Find next milestone
  const nextMilestone = STREAK_MILESTONES.find(m => m.days > current) || null;
  const daysUntilNextMilestone = nextMilestone ? nextMilestone.days - current : 0;

  return {
    current,
    longest: engagement.streak.longestStreak,
    freezesAvailable: engagement.streak.streakFreezes,
    daysUntilNextMilestone,
    nextMilestone,
  };
}

// ============ Mnemonic / 口訣 Generator ============

// Common patterns for spelling mnemonics
const MNEMONIC_PATTERNS: Record<string, string> = {
  // Double letters
  'll': '兩個 L 企埋一齊',
  'ss': '兩條蛇 sss',
  'ee': '兩隻眼 ee',
  'oo': '兩個圈 oo',
  'ff': '兩陣風 ff',
  'tt': '兩棵樹 tt',
  'pp': '兩個波 pp',
  'rr': '兩聲狗叫 rr',
  'mm': '兩個山 mm',
  'nn': '兩度門 nn',

  // Silent letters
  'kn': 'k 唔出聲，只讀 n',
  'wr': 'w 唔出聲，只讀 r',
  'mb': 'b 唔出聲，只讀 m',
  'gn': 'g 唔出聲，只讀 n',
  'gh': 'gh 一齊唔出聲',

  // Common endings
  'tion': 'tion 讀 션',
  'sion': 'sion 讀 션',
  'ight': 'ight 讀 ait',
  'ough': 'ough 好多讀法',

  // Tricky patterns
  'ie': 'i 喺 e 前面',
  'ei': 'e 喺 i 前面',
  'ould': 'o-u-l-d 一齊',
};

// Famous mnemonics
const FAMOUS_MNEMONICS: Record<string, string> = {
  'because': 'Big Elephants Can Always Understand Small Elephants',
  'said': 'Silly Ants In Dresses',
  'friend': 'Fri-END - 朋友到最尾',
  'believe': 'Be-LIE-ve - 唔好信佢講大話',
  'piece': 'A piece of PIE',
  'necessary': 'Never Eat Cake, Eat Salmon Sandwiches And Remain Young',
  'rhythm': 'Rhythm Has Your Two Hips Moving',
  'separate': 'There is A RAT in sepARATE',
  'island': 'An island IS LAND',
  'February': 'Feb-RU-ary - 唔好漏咗 R',
  'Wednesday': 'Wed-NES-day - 記住 NES',
  'beautiful': 'Big Elephants Are Ugly - BEAU',
};

export interface WordMnemonic {
  word: string;
  mnemonic: string;
  type: 'pattern' | 'famous' | 'generated';
  highlight?: string[]; // Letters to highlight
}

export function generateMnemonic(word: string): WordMnemonic {
  const lowerWord = word.toLowerCase();

  // Check famous mnemonics first
  if (FAMOUS_MNEMONICS[lowerWord]) {
    return {
      word,
      mnemonic: FAMOUS_MNEMONICS[lowerWord],
      type: 'famous',
    };
  }

  // Check for pattern matches
  for (const [pattern, hint] of Object.entries(MNEMONIC_PATTERNS)) {
    if (lowerWord.includes(pattern)) {
      return {
        word,
        mnemonic: hint,
        type: 'pattern',
        highlight: [pattern],
      };
    }
  }

  // Generate simple mnemonic based on first letters
  const letters = word.split('');
  const simpleWords: Record<string, string> = {
    'a': '蘋果', 'b': '波', 'c': '貓', 'd': '狗', 'e': '蛋',
    'f': '魚', 'g': '提子', 'h': '帽', 'i': '雪糕', 'j': '果汁',
    'k': '風箏', 'l': '獅子', 'm': '猴子', 'n': '鼻', 'o': '橙',
    'p': '豬', 'q': '皇后', 'r': '兔', 's': '蛇', 't': '樹',
    'u': '雨傘', 'v': '小提琴', 'w': '西瓜', 'x': 'X光', 'y': '雪糕',
    'z': '斑馬',
  };

  const sentence = letters
    .map(l => simpleWords[l.toLowerCase()] || l)
    .join(' ');

  return {
    word,
    mnemonic: `${letters.join('-').toUpperCase()}: ${sentence}`,
    type: 'generated',
    highlight: letters,
  };
}

export function getMnemonicForWord(word: string): WordMnemonic | null {
  // Only generate for words 4+ letters that might be tricky
  if (word.length < 4) return null;

  return generateMnemonic(word);
}

// Get hint for specific tricky part of word
export function getTrickyPartHint(word: string): { part: string; hint: string } | null {
  const lowerWord = word.toLowerCase();

  for (const [pattern, hint] of Object.entries(MNEMONIC_PATTERNS)) {
    if (lowerWord.includes(pattern)) {
      return { part: pattern, hint };
    }
  }

  // Check for double letters
  const doubleMatch = lowerWord.match(/(.)\1/);
  if (doubleMatch) {
    return { part: doubleMatch[0], hint: `記住有兩個 ${doubleMatch[1].toUpperCase()}` };
  }

  return null;
}
