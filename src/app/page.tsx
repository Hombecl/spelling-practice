'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getProgress,
  saveProgress,
  updateWordProgress,
  addStars,
  updateStreak,
  UserProgress,
  addXP,
  feedPet,
  calculateXP,
  PET_EMOJIS,
  EvolutionResult,
  renamePet,
  activateSkill,
  PET_SKILLS,
  isSkillOnCooldown,
  getSkillCooldownRemaining,
  // Interaction imports
  patPet,
  feedPetWithFood,
  completeDailyTask,
  addFoodReward,
  calculateFoodReward,
  getPetMood,
  getRandomSpeech,
  getAvailableDailyTasks,
  getRemainingPats,
  getFoodInventorySummary,
  FOOD_TYPES,
  DAILY_TASKS,
  MAX_PATS_PER_DAY,
  // Events & Items imports
  getEventById,
  isEventExpired,
  ITEMS,
  getShopItems,
  calculateItemDrop,
  useItem,
  buyItem,
  hasItem,
  addItemToInventory,
} from '@/lib/progress';
import { Word } from '@/lib/words';
import {
  CustomWordList,
  markWordListUsed,
  getSmartPracticeWords,
  updateWordMastery,
  getWordListById,
  getCustomWordLists,
  getSpellingTestStats,
  getDaysUntilDeadline,
} from '@/lib/customWords';
import {
  getCurrentSession,
  logout,
  loadProgressFromCloud,
  saveProgressToCloud,
  AuthUser,
} from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import LoginScreen from '@/components/auth/LoginScreen';
import PhonicsMode from '@/components/modes/PhonicsMode';
import FillMode from '@/components/modes/FillMode';
import SpellMode from '@/components/modes/SpellMode';
import ModeSelector from '@/components/ModeSelector';
import WordListManager from '@/components/WordListManager';
import BadgeDisplay from '@/components/BadgeDisplay';
import ProgressBar from '@/components/ProgressBar';
import BottomTabBar, { Tab } from '@/components/BottomTabBar';
import { AdventureMap, StagePlay, BossBattle } from '@/components/adventure';
import {
  WorldId,
  WORLDS,
  getWorldById,
  getStageById,
  createDefaultAdventureProgress,
  updateWorldUnlocks,
  completeStage,
  completeBoss,
} from '@/lib/adventure';
import {
  getDailyEngagement,
  recordPractice,
  recordWordCompletion,
  recordAdventureStage,
  DailyEngagement,
  STREAK_MILESTONES,
} from '@/lib/dailySystem';
import DailyStreak from '@/components/DailyStreak';
import DailyQuests from '@/components/DailyQuests';
import MnemonicHint from '@/components/MnemonicHint';
import { SpellingTestStage, onSpellingTestAdded, getAdaptiveWords } from '@/lib/adaptiveLevel';
import SpellingTestChallenge from '@/components/adventure/SpellingTestChallenge';

type PetScreen = 'main' | 'shop' | 'badges';
type AdventureScreen = 'map' | 'stage' | 'boss' | 'spelling-test';

// Built-in words for different levels
const builtInWords = {
  simple: ['cat', 'dog', 'sun', 'hat', 'red', 'big', 'run', 'sit', 'cup', 'pen', 'bus', 'box', 'bed', 'leg', 'pig', 'fox', 'hen', 'net', 'wet', 'hot'],
  medium: ['book', 'tree', 'fish', 'bird', 'milk', 'door', 'ball', 'star', 'cake', 'rain', 'blue', 'jump', 'swim', 'play', 'fast', 'good', 'help', 'stop', 'look', 'read'],
  advanced: ['apple', 'water', 'happy', 'house', 'green', 'flower', 'school', 'friend', 'mother', 'father', 'sister', 'brother', 'teacher', 'animal', 'orange', 'yellow', 'purple', 'circle', 'square', 'number'],
};

export default function Home() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  // Tab navigation
  const [activeTab, setActiveTab] = useState<Tab>('play');
  const [isPracticing, setIsPracticing] = useState(false);
  const [petScreen, setPetScreen] = useState<PetScreen>('main');
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [sessionTarget, setSessionTarget] = useState(10);
  const [customList, setCustomList] = useState<CustomWordList | null>(null);
  const [practiceWords, setPracticeWords] = useState<string[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [showEvolution, setShowEvolution] = useState<EvolutionResult | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newPetName, setNewPetName] = useState('');
  const [hintLetters, setHintLetters] = useState<number[]>([]); // Revealed letter indices from peek skill
  const [skillUsedMessage, setSkillUsedMessage] = useState<string | null>(null);
  // Pet interaction states
  const [petSpeech, setPetSpeech] = useState<string | null>(null);
  const [patAnimation, setPatAnimation] = useState<string | null>(null);
  const [interactionMessage, setInteractionMessage] = useState<string | null>(null);
  const [showFoodReward, setShowFoodReward] = useState<{ type: string; emoji: string } | null>(null);
  const [showItemDrop, setShowItemDrop] = useState<{ nameZh: string; emoji: string } | null>(null);
  const [itemUseMessage, setItemUseMessage] = useState<string | null>(null);
  // Adventure mode states
  const [adventureScreen, setAdventureScreen] = useState<AdventureScreen>('map');
  const [currentWorldId, setCurrentWorldId] = useState<WorldId | null>(null);
  const [currentStageNum, setCurrentStageNum] = useState<number | null>(null);
  const [currentSpellingTestStage, setCurrentSpellingTestStage] = useState<SpellingTestStage | null>(null);
  // Daily engagement states
  const [dailyEngagement, setDailyEngagement] = useState<DailyEngagement | null>(null);
  const [showMilestone, setShowMilestone] = useState<typeof STREAK_MILESTONES[0] | null>(null);
  const [showMnemonicHint, setShowMnemonicHint] = useState(false);

  // Helper: Save progress locally and to cloud if logged in
  const saveProgressWithSync = useCallback((newProgress: UserProgress) => {
    saveProgress(newProgress);
    if (currentUser) {
      saveProgressToCloud(currentUser.id, newProgress);
    }
  }, [currentUser]);

  // Auth handlers
  const handleLogin = async (user: AuthUser) => {
    setCurrentUser(user);
    setIsGuest(false);

    // Load progress from cloud
    const cloudProgress = await loadProgressFromCloud(user.id);
    if (cloudProgress) {
      const updatedP = updateStreak(cloudProgress);
      setProgress(updatedP);
      saveProgress(updatedP);
    } else {
      // First time user or no cloud data - use local and sync to cloud
      const p = getProgress();
      const updatedP = updateStreak(p);
      setProgress(updatedP);
      saveProgress(updatedP);
      saveProgressToCloud(user.id, updatedP);
    }

    setIsLoggedIn(true);
  };

  const handleSkipLogin = () => {
    setIsGuest(true);
    const p = getProgress();
    const updatedP = updateStreak(p);
    setProgress(updatedP);
    saveProgress(updatedP);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setIsGuest(false);
    setIsLoggedIn(false);
  };

  // Check for existing session and load progress on mount
  useEffect(() => {
    const initApp = async () => {
      // Check for existing session
      const session = getCurrentSession();

      if (session) {
        setCurrentUser(session);
        // Try to load from cloud
        const cloudProgress = await loadProgressFromCloud(session.id);
        if (cloudProgress) {
          const updatedP = updateStreak(cloudProgress);
          setProgress(updatedP);
          saveProgress(updatedP);
          // Also save to cloud
          saveProgressToCloud(session.id, updatedP);
        } else {
          // No cloud data, use local
          const p = getProgress();
          const updatedP = updateStreak(p);
          setProgress(updatedP);
          saveProgress(updatedP);
        }
        setIsLoggedIn(true);
      } else if (!isSupabaseConfigured()) {
        // No Supabase configured, go directly to guest mode
        setIsGuest(true);
        const p = getProgress();
        const updatedP = updateStreak(p);
        setProgress(updatedP);
        saveProgress(updatedP);
        setIsLoggedIn(true);
      }
      // Otherwise stay on login screen

      // Initialize daily engagement
      setDailyEngagement(getDailyEngagement());
    };

    initApp();
  }, []);

  // Get the active word list based on progress.activeWordListId
  const getActiveWordList = useCallback((): CustomWordList | null => {
    if (!progress?.activeWordListId) return null;
    const lists = getCustomWordLists();
    return lists.find(l => l.id === progress.activeWordListId) || null;
  }, [progress?.activeWordListId]);

  // Get words based on selection
  const getWordsForPractice = useCallback((): string[] => {
    const activeList = getActiveWordList();
    if (activeList) {
      return [...activeList.words];
    }
    // Use built-in words based on mode difficulty
    if (!progress) return builtInWords.simple;

    switch (progress.currentMode) {
      case 'phonics':
        return builtInWords.simple;
      case 'fill':
        return builtInWords.medium;
      case 'spell':
        return builtInWords.advanced;
      default:
        return builtInWords.simple;
    }
  }, [getActiveWordList, progress]);

  // Shuffle array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Start playing
  const startPlaying = () => {
    const activeList = getActiveWordList();
    let words: string[];

    // Use smart word selection for spelling tests (prioritizes words that need practice)
    if (activeList?.isSpellingTest) {
      words = getSmartPracticeWords(activeList.id, 10);
    } else {
      words = shuffleArray(getWordsForPractice());
    }

    setPracticeWords(words);
    setWordIndex(0);
    setWordsCompleted(0);
    setSessionTarget(Math.min(words.length, 10));
    setCurrentWord({ word: words[0], category: 'custom' });
    setIsPracticing(true);

    if (activeList) {
      markWordListUsed(activeList.id);
    }

    // Record practice for daily streak
    const { engagement, streakIncreased, milestone } = recordPractice();
    setDailyEngagement(engagement);
    if (milestone) {
      setShowMilestone(milestone);
    }
  };

  // Get next word
  const getNextWord = useCallback(() => {
    setHintLetters([]); // Reset hints for new word
    const nextIndex = wordIndex + 1;
    if (nextIndex < practiceWords.length && wordsCompleted + 1 < sessionTarget) {
      setWordIndex(nextIndex);
      setCurrentWord({ word: practiceWords[nextIndex], category: 'custom' });
    } else {
      setIsPracticing(false);
    }
  }, [wordIndex, practiceWords, wordsCompleted, sessionTarget]);

  // Handle word completion
  const handleWordComplete = (correct: boolean, attempts: number) => {
    if (!progress || !currentWord) return;

    // Track mastery for spelling tests
    const activeList = getActiveWordList();
    if (activeList?.isSpellingTest) {
      updateWordMastery(activeList.id, currentWord.word, correct);
    }

    let newProgress = updateWordProgress(currentWord.word, correct, progress);

    if (correct) {
      const starsEarned = attempts === 1 ? 3 : attempts === 2 ? 2 : 1;
      newProgress = addStars(starsEarned, newProgress);

      // Calculate and add XP for the pet
      const xpCalc = calculateXP(
        starsEarned,
        attempts,
        newProgress.isFirstSessionToday,
        newProgress.streakDays,
        newProgress.currentMode,
        newProgress.pet.activeEffects
      );

      const { progress: xpProgress, evolution } = addXP(xpCalc.totalXP, newProgress);
      newProgress = feedPet(xpProgress);

      // Show XP animation
      setXpGained(xpCalc.totalXP);
      setTimeout(() => setXpGained(null), 1500);

      // Check for evolution
      if (evolution?.evolved) {
        setShowEvolution(evolution);
      }

      // Add food reward based on stars earned
      const foodReward = calculateFoodReward(starsEarned);
      if (foodReward) {
        newProgress = addFoodReward(foodReward, newProgress);
        // Show food reward notification
        const foodInfo = FOOD_TYPES[foodReward.type];
        setShowFoodReward({ type: foodReward.type, emoji: foodInfo.emoji });
        setTimeout(() => setShowFoodReward(null), 2000);
      }

      // Check for item drops
      const hasLuckyCharm = newProgress.pet.equippedItems.includes('lucky_charm');
      const itemDrop = calculateItemDrop(starsEarned, hasLuckyCharm);
      if (itemDrop) {
        newProgress = {
          ...newProgress,
          pet: {
            ...newProgress.pet,
            itemInventory: addItemToInventory(newProgress.pet.itemInventory, itemDrop.id),
          },
        };
        // Show item drop notification
        setShowItemDrop({ nameZh: itemDrop.nameZh, emoji: itemDrop.emoji });
        setTimeout(() => setShowItemDrop(null), 2500);
      }
    }

    setProgress(newProgress);
    saveProgressWithSync(newProgress);
    setWordsCompleted((prev) => prev + 1);

    // Update daily quests
    const updatedEngagement = recordWordCompletion(correct, attempts, newProgress.currentMode);
    setDailyEngagement(updatedEngagement);

    setTimeout(() => {
      getNextWord();
    }, 500);
  };

  // Handle skip
  const handleSkip = () => {
    // Track skip as wrong for spelling tests
    const activeList = getActiveWordList();
    if (activeList?.isSpellingTest && currentWord) {
      updateWordMastery(activeList.id, currentWord.word, false);
    }
    getNextWord();
  };

  // Handle mode change
  const handleSelectMode = (mode: 'phonics' | 'fill' | 'spell') => {
    if (!progress) return;
    const newProgress = { ...progress, currentMode: mode };
    setProgress(newProgress);
    saveProgressWithSync(newProgress);
  };

  // Handle active list selection (save to progress)
  const handleSetActiveList = (listId: string | null) => {
    if (!progress) return;
    const newProgress = { ...progress, activeWordListId: listId || undefined };
    setProgress(newProgress);
    saveProgressWithSync(newProgress);
  };

  // Handle using peek skill
  const handleUsePeekSkill = (skillId: 'peek' | 'double_peek') => {
    if (!progress || !currentWord) return;

    const skill = PET_SKILLS.find(s => s.id === skillId);
    if (!skill) return;

    // Check if skill is unlocked
    if (!progress.pet.unlockedSkills.includes(skillId)) return;

    // Get how many letters to reveal
    const lettersToReveal = skill.effect.value;
    const word = currentWord.word;

    // Find indices that haven't been revealed yet
    const availableIndices = Array.from({ length: word.length }, (_, i) => i)
      .filter(i => !hintLetters.includes(i));

    if (availableIndices.length === 0) {
      setSkillUsedMessage('已經冇字母可以睇喇！');
      setTimeout(() => setSkillUsedMessage(null), 2000);
      return;
    }

    // Randomly select letters to reveal
    const shuffled = availableIndices.sort(() => Math.random() - 0.5);
    const newRevealed = shuffled.slice(0, Math.min(lettersToReveal, shuffled.length));

    setHintLetters(prev => [...prev, ...newRevealed]);

    // Activate the skill effect
    const newProgress = activateSkill(skillId, progress);
    setProgress(newProgress);
    saveProgressWithSync(newProgress);

    setSkillUsedMessage(`${skill.emoji} 顯示咗 ${newRevealed.length} 個字母！`);
    setTimeout(() => setSkillUsedMessage(null), 2000);
  };

  // Reset hints when word changes
  const resetHints = useCallback(() => {
    setHintLetters([]);
  }, []);

  // ============ Adventure Mode Handlers ============

  const handleAdventureStageSelect = (worldId: WorldId, stageNumber: number) => {
    setCurrentWorldId(worldId);
    setCurrentStageNum(stageNumber);
    setAdventureScreen('stage');
  };

  const handleAdventureBossSelect = (worldId: WorldId) => {
    setCurrentWorldId(worldId);
    setAdventureScreen('boss');
  };

  const handleAdventureStageComplete = (stars: number, xpEarned: number) => {
    if (!progress || !currentWorldId || !currentStageNum) return;

    // Update adventure progress
    const adventureProgress = progress.adventureProgress || createDefaultAdventureProgress();
    const updatedAdventure = completeStage(adventureProgress, currentWorldId, currentStageNum, stars);

    // Update world unlocks based on pet level
    const withUnlocks = updateWorldUnlocks(updatedAdventure, progress.pet);

    // Add rewards
    let newProgress = addStars(stars + (getStageById(currentWorldId, currentStageNum)?.rewards.stars || 0), progress);
    const { progress: xpProgress, evolution } = addXP(xpEarned, newProgress);
    newProgress = {
      ...xpProgress,
      adventureProgress: withUnlocks,
    };

    setProgress(newProgress);
    saveProgressWithSync(newProgress);

    // Show XP animation
    setXpGained(xpEarned);
    setTimeout(() => setXpGained(null), 1500);

    // Check for evolution
    if (evolution?.evolved) {
      setShowEvolution(evolution);
    }

    // Update daily quest for adventure
    const updatedEngagement = recordAdventureStage();
    setDailyEngagement(updatedEngagement);

    // Return to map
    setAdventureScreen('map');
    setCurrentWorldId(null);
    setCurrentStageNum(null);
  };

  const handleAdventureBossVictory = (time: number) => {
    if (!progress || !currentWorldId) return;

    const world = getWorldById(currentWorldId);
    if (!world) return;

    // Update adventure progress
    const adventureProgress = progress.adventureProgress || createDefaultAdventureProgress();
    const updatedAdventure = completeBoss(adventureProgress, currentWorldId, time);

    // Update world unlocks
    const withUnlocks = updateWorldUnlocks(updatedAdventure, progress.pet);

    // Add boss rewards
    let newProgress = addStars(world.boss.rewards.stars, progress);
    const { progress: xpProgress, evolution } = addXP(world.boss.rewards.xp, newProgress);
    newProgress = {
      ...xpProgress,
      adventureProgress: withUnlocks,
    };

    setProgress(newProgress);
    saveProgressWithSync(newProgress);

    // Show XP animation
    setXpGained(world.boss.rewards.xp);
    setTimeout(() => setXpGained(null), 1500);

    // Check for evolution
    if (evolution?.evolved) {
      setShowEvolution(evolution);
    }

    // Return to map
    setAdventureScreen('map');
    setCurrentWorldId(null);
  };

  const handleSpellingTestSelect = (stage: SpellingTestStage) => {
    setCurrentSpellingTestStage(stage);
    setAdventureScreen('spelling-test');
  };

  const handleSpellingTestComplete = (stars: number, xp: number, allCorrect: boolean) => {
    if (!progress) return;

    // Add rewards
    let newProgress = addStars(stars, progress);
    const { progress: xpProgress, evolution } = addXP(xp, newProgress);
    newProgress = xpProgress;

    setProgress(newProgress);
    saveProgressWithSync(newProgress);

    // Show XP animation
    setXpGained(xp);
    setTimeout(() => setXpGained(null), 1500);

    // Check for evolution
    if (evolution?.evolved) {
      setShowEvolution(evolution);
    }

    // Update daily quest for adventure
    const updatedEngagement = recordAdventureStage();
    setDailyEngagement(updatedEngagement);

    // Return to map
    setAdventureScreen('map');
    setCurrentSpellingTestStage(null);
  };

  const handleAdventureExit = () => {
    setAdventureScreen('map');
    setCurrentWorldId(null);
    setCurrentStageNum(null);
    setCurrentSpellingTestStage(null);
  };

  // Show login screen
  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} onSkip={handleSkipLogin} />;
  }

  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50">
        <div className="text-2xl animate-pulse">載入中...</div>
      </div>
    );
  }

  // Get active word list for display
  const activeWordList = getActiveWordList();

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 pb-20">
      {/* Header - Simplified */}
      <header className="bg-white shadow-md sticky top-0 z-40 safe-top">
        <div className="max-w-4xl mx-auto px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between">
          <div className="text-lg sm:text-2xl font-bold text-blue-600">
            🔤 串字練習
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2 bg-yellow-100 px-2 sm:px-3 py-1 rounded-full">
              <span className="text-yellow-500">⭐</span>
              <span className="font-bold text-yellow-700 text-sm sm:text-base">{progress.totalStars}</span>
            </div>

            {progress.streakDays > 0 && (
              <div className="flex items-center gap-1 bg-orange-100 px-2 sm:px-3 py-1 rounded-full">
                <span>🔥</span>
                <span className="font-bold text-orange-700 text-sm sm:text-base">{progress.streakDays}</span>
              </div>
            )}

            {/* User/Login button */}
            {currentUser ? (
              <button
                onClick={handleLogout}
                className="text-xs bg-purple-100 hover:bg-purple-200 px-2 py-1 rounded-full text-purple-700 font-bold transition-colors"
                title="登出"
              >
                {currentUser.displayName.slice(0, 4)}
              </button>
            ) : isGuest ? (
              <button
                onClick={() => setIsLoggedIn(false)}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full text-gray-600 transition-colors"
              >
                登入
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4">
        {/* PLAY TAB */}
        {activeTab === 'play' && !isPracticing && (
          <div className="flex flex-col items-center gap-6 py-4 sm:py-8">
            {/* Header with Streak */}
            <div className="w-full max-w-lg flex items-center justify-between">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                🔤 串字練習
              </h1>
              <DailyStreak />
            </div>

            {/* Daily Quests */}
            <div className="w-full max-w-lg">
              <DailyQuests
                onXPEarned={(xp) => {
                  if (progress) {
                    const { progress: xpProgress, evolution } = addXP(xp, progress);
                    setProgress(xpProgress);
                    saveProgressWithSync(xpProgress);
                    setXpGained(xp);
                    setTimeout(() => setXpGained(null), 1500);
                    if (evolution?.evolved) {
                      setShowEvolution(evolution);
                    }
                  }
                }}
              />
            </div>

            {/* Spelling Test Progress (if active list is a spelling test) */}
            {activeWordList && (() => {
              const stats = getSpellingTestStats(activeWordList.id);
              const daysLeft = getDaysUntilDeadline(activeWordList);

              return (
                <div className="w-full max-w-lg">
                  {/* Deadline Banner */}
                  {daysLeft !== null && (
                    <div className={`
                      mb-3 px-4 py-2 rounded-xl text-center font-bold
                      ${daysLeft <= 1 ? 'bg-red-100 text-red-700' :
                        daysLeft <= 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'}
                    `}>
                      {daysLeft <= 0 ? '📝 今日默書！加油！' :
                       daysLeft === 1 ? '⏰ 聽日就默書喇！' :
                       `📅 距離默書仲有 ${daysLeft} 日`}
                    </div>
                  )}

                  {/* Progress Card */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
                    <div className="font-bold text-purple-700 text-lg mb-2">
                      📋 {activeWordList.name}
                    </div>

                    {/* Mastery Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>掌握進度</span>
                        <span className="font-bold">{stats.percentage}%</span>
                      </div>
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                          style={{ width: `${stats.percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-2 text-center text-sm">
                      <div className="bg-white/70 rounded-lg p-2">
                        <div className="text-lg font-bold text-green-600">{stats.mastered}</div>
                        <div className="text-xs text-gray-500">已掌握</div>
                      </div>
                      <div className="bg-white/70 rounded-lg p-2">
                        <div className="text-lg font-bold text-yellow-600">{stats.learning}</div>
                        <div className="text-xs text-gray-500">練緊</div>
                      </div>
                      <div className="bg-white/70 rounded-lg p-2">
                        <div className="text-lg font-bold text-gray-600">{stats.newWords}</div>
                        <div className="text-xs text-gray-500">未開始</div>
                      </div>
                      <div className="bg-white/70 rounded-lg p-2">
                        <div className="text-lg font-bold text-red-600">{stats.forgotten}</div>
                        <div className="text-xs text-gray-500">要複習</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Fallback for no active list */}
            {!activeWordList && (
              <div className="w-full max-w-lg bg-blue-50 border-2 border-blue-300 rounded-xl p-4 text-center">
                <div className="font-bold text-blue-700 text-lg">
                  📋 內置生字表
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  {getWordsForPractice().length} 個字
                </div>
              </div>
            )}

            {/* Start Button - Large touch target for mobile */}
            <button
              onClick={startPlaying}
              className="
                w-full max-w-sm
                px-8 py-6 sm:px-12 sm:py-8
                text-2xl sm:text-3xl font-bold
                bg-gradient-to-r from-green-400 to-green-600
                hover:from-green-500 hover:to-green-700
                active:from-green-600 active:to-green-800
                text-white rounded-2xl
                shadow-xl hover:shadow-2xl
                transition-all duration-200
                active:scale-95
              "
            >
              🚀 開始練習！
            </button>

            {/* Simple Stats */}
            <div className="flex gap-4 text-center">
              <div className="bg-yellow-100 px-4 py-2 rounded-xl">
                <div className="text-2xl">⭐</div>
                <div className="text-lg font-bold text-yellow-700">{progress.totalStars}</div>
                <div className="text-xs text-yellow-600">星星</div>
              </div>
              {progress.streakDays > 0 && (
                <div className="bg-orange-100 px-4 py-2 rounded-xl">
                  <div className="text-2xl">🔥</div>
                  <div className="text-lg font-bold text-orange-700">{progress.streakDays}</div>
                  <div className="text-xs text-orange-600">連續天數</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'play' && isPracticing && currentWord && (
          <div className="py-2 sm:py-4">
            {/* Session Progress */}
            <div className="mb-4 sm:mb-6">
              <ProgressBar
                current={wordsCompleted}
                total={sessionTarget}
                label={`第 ${wordsCompleted + 1}/${sessionTarget} 個字`}
              />
            </div>

            {/* Current Mode */}
            {progress.currentMode === 'phonics' && (
              <PhonicsMode
                word={currentWord}
                onComplete={handleWordComplete}
                onSkip={handleSkip}
              />
            )}
            {progress.currentMode === 'fill' && (
              <FillMode
                word={currentWord}
                onComplete={handleWordComplete}
                onSkip={handleSkip}
                hintLetters={hintLetters}
              />
            )}
            {progress.currentMode === 'spell' && (
              <SpellMode
                word={currentWord}
                onComplete={handleWordComplete}
                onSkip={handleSkip}
                hintLetters={hintLetters}
              />
            )}

            {/* Skill Buttons */}
            {(progress.currentMode === 'fill' || progress.currentMode === 'spell') && (
              <div className="mt-4 flex justify-center gap-3 flex-wrap">
                {progress.pet.unlockedSkills.includes('peek') && (
                  <button
                    onClick={() => handleUsePeekSkill('peek')}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full font-medium transition-colors"
                  >
                    <span>👀</span>
                    <span>偷睇 1 個字母</span>
                  </button>
                )}
                {progress.pet.unlockedSkills.includes('double_peek') && (
                  <button
                    onClick={() => handleUsePeekSkill('double_peek')}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full font-medium transition-colors"
                  >
                    <span>🔍</span>
                    <span>偷睇 2 個字母</span>
                  </button>
                )}
                {/* Mnemonic hint button */}
                <button
                  onClick={() => setShowMnemonicHint(!showMnemonicHint)}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-full font-medium transition-colors"
                >
                  <span>💡</span>
                  <span>記憶法</span>
                </button>
              </div>
            )}

            {/* Mnemonic Hint Display */}
            {showMnemonicHint && currentWord && (
              <div className="mt-4 max-w-md mx-auto">
                <MnemonicHint word={currentWord.word} />
              </div>
            )}

            {/* Skill Used Message */}
            {skillUsedMessage && (
              <div className="mt-3 text-center">
                <span className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium animate-bounce-in">
                  {skillUsedMessage}
                </span>
              </div>
            )}

            {/* Back Button */}
            <div className="mt-6 sm:mt-8 text-center">
              <button
                onClick={() => setIsPracticing(false)}
                className="px-6 py-3 text-gray-500 hover:text-gray-700 active:text-gray-900 text-base sm:text-lg"
              >
                ← 返回
              </button>
            </div>
          </div>
        )}

        {/* PET TAB - Badges Screen */}
        {activeTab === 'pet' && petScreen === 'badges' && (
          <div className="py-4 sm:py-8">
            <button
              onClick={() => setPetScreen('main')}
              className="mb-4 px-4 py-2 text-blue-500 hover:text-blue-700 active:text-blue-900 text-lg"
            >
              ← 返回
            </button>
            <BadgeDisplay earnedBadges={progress.badges} showAll />
          </div>
        )}

        {/* PET TAB - Main Screen */}
        {activeTab === 'pet' && petScreen === 'main' && (
          <div className="py-4 sm:py-8">
            {/* Pet Display */}
            <div className="flex flex-col items-center gap-4">
              {/* Speech Bubble */}
              {petSpeech && (
                <div className="relative bg-white rounded-2xl px-4 py-2 shadow-md border-2 border-purple-200 max-w-xs animate-bounce-in">
                  <p className="text-gray-700 text-sm">{petSpeech}</p>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-purple-200 rotate-45" />
                </div>
              )}

              {/* Pet Avatar - Clickable for pat */}
              <div className="relative">
                <button
                  onClick={() => {
                    const { progress: newProgress, result } = patPet(progress);
                    if (result.success) {
                      setProgress(newProgress);
                      saveProgressWithSync(newProgress);
                      setPatAnimation(result.response.animation);
                      setPetSpeech(result.response.message);
                      setInteractionMessage(`+${result.happinessGained} 開心 ${result.response.emoji}`);
                      setTimeout(() => {
                        setPatAnimation(null);
                        setInteractionMessage(null);
                      }, 1500);
                      setTimeout(() => setPetSpeech(null), 3000);
                    } else {
                      setPetSpeech(result.response.message);
                      setTimeout(() => setPetSpeech(null), 2000);
                    }
                  }}
                  className={`text-8xl sm:text-9xl cursor-pointer hover:scale-110 active:scale-95 transition-transform ${patAnimation || 'animate-bounce-gentle'}`}
                >
                  {PET_EMOJIS[progress.pet.stage]}
                </button>
                {/* Mood indicator */}
                <div className="absolute -top-2 -right-2 text-2xl">
                  {progress.pet.happiness >= 70 ? '💖' :
                   progress.pet.happiness >= 40 ? '😊' :
                   progress.pet.happiness >= 20 ? '😐' : '😢'}
                </div>
                {/* Interaction feedback */}
                {interactionMessage && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-xp-float">
                    <span className="text-lg font-bold text-pink-500 whitespace-nowrap">
                      {interactionMessage}
                    </span>
                  </div>
                )}
              </div>

              {/* Pat counter */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>今日摸摸次數：</span>
                <div className="flex gap-1">
                  {[...Array(MAX_PATS_PER_DAY)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-lg ${i < (progress.pet.patsToday || 0) ? 'opacity-30' : ''}`}
                    >
                      🖐️
                    </span>
                  ))}
                </div>
              </div>

              {/* Pet Name & Level */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setNewPetName(progress.pet.name);
                    setShowRenameModal(true);
                  }}
                  className="group flex items-center justify-center gap-2 hover:bg-gray-100 rounded-xl px-4 py-2 transition-colors"
                >
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    {progress.pet.name}
                  </h2>
                  <span className="text-gray-400 group-hover:text-gray-600 text-lg">✏️</span>
                </button>
                <p className="text-lg text-purple-600">
                  Lv.{progress.pet.level} · {
                    progress.pet.stage === 'egg' ? '蛋蛋' :
                    progress.pet.stage === 'baby' ? 'BB仔' :
                    progress.pet.stage === 'child' ? '細路仔' :
                    progress.pet.stage === 'teen' ? '少年龍' : '成年龍'
                  }
                </p>
              </div>

              {/* Progress Bars */}
              <div className="w-full max-w-sm space-y-3">
                {/* XP Bar */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>經驗值</span>
                    <span>{progress.totalXP} XP</span>
                  </div>
                  <div className="h-4 bg-purple-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-500"
                      style={{ width: `${Math.min(100, (progress.totalXP % 100))}%` }}
                    />
                  </div>
                </div>

                {/* Happiness Bar */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>開心指數</span>
                    <span>{progress.pet.happiness}%</span>
                  </div>
                  <div className="h-4 bg-pink-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-400 to-red-400 transition-all duration-500"
                      style={{ width: `${progress.pet.happiness}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Daily Tasks */}
              {(() => {
                const availableTasks = getAvailableDailyTasks(progress.pet);
                if (availableTasks.length === 0) return null;
                return (
                  <div className="w-full max-w-sm">
                    <h3 className="text-lg font-bold text-gray-700 mb-2">每日任務</h3>
                    <div className="space-y-2">
                      {availableTasks.map(task => (
                        <button
                          key={task.id}
                          onClick={() => {
                            const { progress: newProgress, result } = completeDailyTask(task.id, progress);
                            if (result) {
                              setProgress(newProgress);
                              saveProgressWithSync(newProgress);
                              setPetSpeech(`${task.emoji} ${task.nameZh} 完成！謝謝你！`);
                              setInteractionMessage(`+${result.xpGained} XP +${result.happinessGained} 開心`);
                              setTimeout(() => {
                                setPetSpeech(null);
                                setInteractionMessage(null);
                              }, 2500);
                            }
                          }}
                          className="w-full flex items-center gap-3 p-3 bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-300 rounded-xl transition-colors"
                        >
                          <span className="text-2xl">{task.emoji}</span>
                          <div className="flex-1 text-left">
                            <div className="font-bold text-gray-800">{task.nameZh}</div>
                            <div className="text-xs text-gray-500">{task.descriptionZh}</div>
                          </div>
                          <div className="text-xs text-yellow-600 font-bold">
                            +{task.xpReward} XP
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Food Inventory */}
              {(() => {
                const foodSummary = getFoodInventorySummary(progress);
                if (foodSummary.length === 0) return null;
                return (
                  <div className="w-full max-w-sm">
                    <h3 className="text-lg font-bold text-gray-700 mb-2">食物背包</h3>
                    <div className="flex gap-2 flex-wrap">
                      {foodSummary.map((food, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            const { progress: newProgress, result } = feedPetWithFood(
                              food.type as 'dragon_fruit' | 'magic_berry' | 'star_candy',
                              progress
                            );
                            if (result.success) {
                              setProgress(newProgress);
                              saveProgressWithSync(newProgress);
                              setPetSpeech(result.message);
                              setInteractionMessage(`+${result.happinessGained} 開心 +${result.xpGained} XP`);
                              setTimeout(() => {
                                setPetSpeech(null);
                                setInteractionMessage(null);
                              }, 2500);
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-orange-50 hover:bg-orange-100 border-2 border-orange-300 rounded-xl transition-colors"
                        >
                          <span className="text-xl">{food.emoji}</span>
                          <span className="text-sm font-bold text-gray-700">{food.nameZh}</span>
                          <span className="text-xs bg-orange-200 px-2 py-0.5 rounded-full">x{food.quantity}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">撳食物餵寵物</p>
                  </div>
                );
              })()}

              {/* Active Event Banner */}
              {(() => {
                const activeEvent = progress.pet.activeEvent;
                if (!activeEvent || isEventExpired(activeEvent)) return null;
                const event = getEventById(activeEvent.eventId);
                if (!event) return null;

                const expiresAt = new Date(activeEvent.expiresAt);
                const now = new Date();
                const hoursLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));

                return (
                  <div className="w-full max-w-sm bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-300 rounded-xl p-4 animate-pulse-slow">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{event.emoji}</span>
                      <div className="flex-1">
                        <div className="font-bold text-indigo-800">{event.nameZh}</div>
                        <div className="text-xs text-indigo-600">{event.descriptionZh}</div>
                        <div className="text-xs text-indigo-500 mt-1">
                          {hoursLeft > 0 ? `剩餘 ${hoursLeft} 小時` : '快將結束'}
                          {event.effects.xpMultiplier && ` · XP x${event.effects.xpMultiplier}`}
                          {event.effects.happinessMultiplier && ` · 開心度 x${event.effects.happinessMultiplier}`}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-indigo-700 italic">
                      &ldquo;{event.petResponse}&rdquo;
                    </div>
                  </div>
                );
              })()}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                <div className="bg-white rounded-xl p-3 text-center shadow-md">
                  <div className="text-xl mb-1">📝</div>
                  <div className="text-lg font-bold text-gray-800">{progress.pet.totalWordsSpelled}</div>
                  <div className="text-xs text-gray-500">已串字數</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center shadow-md">
                  <div className="text-xl mb-1">🔥</div>
                  <div className="text-lg font-bold text-gray-800">{progress.streakDays}</div>
                  <div className="text-xs text-gray-500">連續日數</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center shadow-md">
                  <div className="text-xl mb-1">🎯</div>
                  <div className="text-lg font-bold text-gray-800">{progress.pet.unlockedSkills.length}</div>
                  <div className="text-xs text-gray-500">技能</div>
                </div>
              </div>

              {/* Item Inventory */}
              {(() => {
                const inventory = progress.pet.itemInventory || [];
                if (inventory.length === 0) return null;
                return (
                  <div className="w-full max-w-sm">
                    <h3 className="text-lg font-bold text-gray-700 mb-2">道具背包 🎒</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {inventory.map((invItem, idx) => {
                        const item = ITEMS[invItem.itemId];
                        if (!item) return null;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              const result = useItem(invItem.itemId, progress.pet);
                              if (result.success) {
                                const newProgress = {
                                  ...progress,
                                  pet: result.pet,
                                  totalXP: progress.totalXP + (item.effects.xpBoost || 0),
                                };
                                setProgress(newProgress);
                                saveProgressWithSync(newProgress);
                                setItemUseMessage(result.message);
                                setTimeout(() => setItemUseMessage(null), 2500);
                              } else {
                                setItemUseMessage(result.message);
                                setTimeout(() => setItemUseMessage(null), 2000);
                              }
                            }}
                            className={`
                              relative flex flex-col items-center p-2 rounded-xl transition-all hover:scale-105
                              ${item.rarity === 'legendary' ? 'bg-yellow-100 border-2 border-yellow-400' :
                                item.rarity === 'rare' ? 'bg-purple-100 border-2 border-purple-300' :
                                item.rarity === 'uncommon' ? 'bg-blue-100 border-2 border-blue-300' :
                                'bg-gray-100 border border-gray-300'}
                            `}
                            title={`${item.nameZh}: ${item.descriptionZh}`}
                          >
                            <span className="text-2xl">{item.emoji}</span>
                            <span className="text-xs font-bold text-gray-600 truncate w-full text-center">{item.nameZh.slice(0, 4)}</span>
                            <span className="absolute -top-1 -right-1 bg-gray-800 text-white text-xs px-1.5 rounded-full">
                              {invItem.quantity}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">撳道具使用</p>
                  </div>
                );
              })()}

              {/* Item Use Message */}
              {itemUseMessage && (
                <div className="w-full max-w-sm">
                  <div className="bg-green-100 border border-green-300 rounded-xl p-3 text-center text-green-700 font-medium animate-bounce-in">
                    {itemUseMessage}
                  </div>
                </div>
              )}

              {/* Shop & Badges Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setPetScreen('shop')}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all"
                >
                  <span className="text-xl">🏪</span>
                  <span>星星商店</span>
                  <span className="bg-white/30 px-2 py-0.5 rounded-full text-sm">⭐ {progress.totalStars}</span>
                </button>
                <button
                  onClick={() => setPetScreen('badges')}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all"
                >
                  <span className="text-xl">🏆</span>
                  <span>獎章</span>
                </button>
              </div>

              {/* Skills Section */}
              {progress.pet.unlockedSkills.length > 0 && (
                <div className="w-full max-w-sm">
                  <h3 className="text-lg font-bold text-gray-700 mb-2">技能</h3>
                  <div className="space-y-2">
                    {progress.pet.unlockedSkills.map(skillId => {
                      const skill = PET_SKILLS.find(s => s.id === skillId);
                      if (!skill) return null;

                      const isActive = progress.pet.activeEffects.some(
                        e => e.skillId === skillId && new Date(e.expiresAt) > new Date()
                      );

                      return (
                        <div
                          key={skillId}
                          className={`
                            flex items-center gap-3 p-3 rounded-xl transition-all
                            ${isActive ? 'bg-purple-100 border-2 border-purple-400' : 'bg-white border border-gray-200'}
                          `}
                        >
                          <span className="text-2xl">{skill.emoji}</span>
                          <div className="flex-1">
                            <div className="font-bold text-gray-800">{skill.nameZh}</div>
                            <div className="text-xs text-gray-500">{skill.descriptionZh}</div>
                          </div>
                          {isActive && (
                            <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">
                              啟用中
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Practice CTA */}
              <button
                onClick={() => setActiveTab('play')}
                className="mt-4 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                去練習串字！📚
              </button>
            </div>
          </div>
        )}

        {/* PET TAB - Shop Screen */}
        {activeTab === 'pet' && petScreen === 'shop' && (
          <div className="py-4 sm:py-8">
            <button
              onClick={() => setPetScreen('main')}
              className="mb-4 px-4 py-2 text-blue-500 hover:text-blue-700 active:text-blue-900 text-lg"
            >
              ← 返回
            </button>

            <div className="flex flex-col items-center gap-6">
              {/* Shop Header */}
              <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  🏪 星星商店
                </h1>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-yellow-500 text-2xl">⭐</span>
                  <span className="text-2xl font-bold text-yellow-600">{progress.totalStars}</span>
                  <span className="text-gray-500">粒星星</span>
                </div>
              </div>

              {/* Shop Items */}
              <div className="w-full max-w-md space-y-3">
                {getShopItems().map(item => {
                  const canAfford = progress.totalStars >= (item.shopPrice || 0);
                  return (
                    <div
                      key={item.id}
                      className={`
                        flex items-center gap-3 p-4 rounded-xl transition-all
                        ${item.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400' :
                          item.rarity === 'rare' ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300' :
                          item.rarity === 'uncommon' ? 'bg-blue-50 border-2 border-blue-300' :
                          'bg-white border border-gray-200'}
                      `}
                    >
                      <span className="text-4xl">{item.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{item.nameZh}</span>
                          <span className={`
                            text-xs px-2 py-0.5 rounded-full
                            ${item.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                              item.rarity === 'rare' ? 'bg-purple-200 text-purple-800' :
                              item.rarity === 'uncommon' ? 'bg-blue-200 text-blue-800' :
                              'bg-gray-200 text-gray-600'}
                          `}>
                            {item.rarity === 'legendary' ? '傳說' :
                             item.rarity === 'rare' ? '稀有' :
                             item.rarity === 'uncommon' ? '優良' : '普通'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">{item.descriptionZh}</div>
                      </div>
                      <button
                        onClick={() => {
                          const result = buyItem(item.id, progress.totalStars, progress.pet.itemInventory);
                          if (result.success) {
                            const newProgress = {
                              ...progress,
                              totalStars: result.newStars,
                              pet: {
                                ...progress.pet,
                                itemInventory: result.newInventory,
                              },
                            };
                            setProgress(newProgress);
                            saveProgressWithSync(newProgress);
                            setItemUseMessage(result.message);
                            setTimeout(() => setItemUseMessage(null), 2000);
                          } else {
                            setItemUseMessage(result.message);
                            setTimeout(() => setItemUseMessage(null), 2000);
                          }
                        }}
                        disabled={!canAfford}
                        className={`
                          flex items-center gap-1 px-4 py-2 rounded-full font-bold transition-all
                          ${canAfford
                            ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 active:scale-95'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                        `}
                      >
                        <span>⭐</span>
                        <span>{item.shopPrice}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Purchase Message */}
              {itemUseMessage && (
                <div className="bg-green-100 border border-green-300 rounded-xl p-3 text-center text-green-700 font-medium animate-bounce-in">
                  {itemUseMessage}
                </div>
              )}

              {/* Tips */}
              <div className="bg-purple-50 rounded-xl p-4 max-w-md">
                <p className="text-sm text-purple-700 text-center">
                  💡 練習串字可以獲得星星同道具掉落！<br />
                  三星完成嘅機會最高！
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PARENT TAB */}
        {activeTab === 'parent' && (
          <div className="py-4 sm:py-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                👨‍👩‍👧 家長設定
              </h1>
            </div>

            <div className="flex flex-col gap-6 max-w-lg mx-auto">
              {/* Mode Selector */}
              <div className="bg-white rounded-2xl p-4 shadow-md">
                <h2 className="text-lg font-bold text-gray-700 mb-3">📚 練習模式</h2>
                <ModeSelector
                  currentMode={progress.currentMode}
                  onSelectMode={handleSelectMode}
                />
              </div>

              {/* Word List Manager */}
              <div className="bg-white rounded-2xl p-4 shadow-md">
                <h2 className="text-lg font-bold text-gray-700 mb-3">📋 生字表管理</h2>
                <WordListManager
                  onSelectList={(list) => handleSetActiveList(list.id)}
                  onUseBuiltIn={() => handleSetActiveList(null)}
                  selectedListId={progress.activeWordListId}
                />
              </div>

              {/* Progress Report */}
              <div className="bg-white rounded-2xl p-4 shadow-md">
                <h2 className="text-lg font-bold text-gray-700 mb-3">📊 學習進度</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Object.values(progress.wordProgress).filter(w => w.mastered).length}
                    </div>
                    <div className="text-xs text-blue-500">已掌握生字</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Object.values(progress.wordProgress).reduce((sum, w) => sum + w.attempts, 0)}
                    </div>
                    <div className="text-xs text-green-500">總練習次數</div>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {progress.totalStars}
                    </div>
                    <div className="text-xs text-yellow-500">獲得星星</div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {progress.streakDays}
                    </div>
                    <div className="text-xs text-orange-500">連續練習天數</div>
                  </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="mt-4">
                  <ProgressBar
                    current={Object.values(progress.wordProgress).filter(w => w.mastered).length}
                    total={Math.max(Object.keys(progress.wordProgress).length, 1)}
                    label="整體掌握進度"
                  />
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-white rounded-2xl p-4 shadow-md">
                <h2 className="text-lg font-bold text-gray-700 mb-3">👤 帳戶</h2>
                {currentUser ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-800">{currentUser.displayName}</div>
                      <div className="text-xs text-gray-500">已登入（雲端同步）</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-xl transition-colors"
                    >
                      登出
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-800">訪客模式</div>
                      <div className="text-xs text-gray-500">資料只存喺呢部機</div>
                    </div>
                    <button
                      onClick={() => setIsLoggedIn(false)}
                      className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-600 font-bold rounded-xl transition-colors"
                    >
                      登入/註冊
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ADVENTURE TAB */}
        {activeTab === 'adventure' && adventureScreen === 'map' && (
          <AdventureMap
            pet={progress.pet}
            adventureProgress={progress.adventureProgress}
            onStageSelect={handleAdventureStageSelect}
            onBossSelect={handleAdventureBossSelect}
            onSpellingTestSelect={handleSpellingTestSelect}
          />
        )}

        {activeTab === 'adventure' && adventureScreen === 'stage' && currentWorldId && currentStageNum && (
          (() => {
            const world = getWorldById(currentWorldId);
            const stage = getStageById(currentWorldId, currentStageNum);
            if (!world || !stage) return null;
            return (
              <StagePlay
                world={world}
                stage={stage}
                mode={progress.currentMode}
                activeWordListId={progress.activeWordListId}
                onComplete={handleAdventureStageComplete}
                onExit={handleAdventureExit}
              />
            );
          })()
        )}

        {activeTab === 'adventure' && adventureScreen === 'boss' && currentWorldId && (
          (() => {
            const world = getWorldById(currentWorldId);
            if (!world) return null;
            return (
              <BossBattle
                world={world}
                boss={world.boss}
                mode={progress.currentMode}
                activeWordListId={progress.activeWordListId}
                onVictory={handleAdventureBossVictory}
                onDefeat={handleAdventureExit}
                onExit={handleAdventureExit}
              />
            );
          })()
        )}

        {/* Spelling Test Challenge */}
        {activeTab === 'adventure' && adventureScreen === 'spelling-test' && currentSpellingTestStage && (
          <SpellingTestChallenge
            stage={currentSpellingTestStage}
            onComplete={handleSpellingTestComplete}
            onExit={handleAdventureExit}
          />
        )}
      </div>

      {/* XP Gain Animation */}
      {xpGained !== null && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="animate-xp-float text-2xl sm:text-3xl font-bold text-purple-600 bg-purple-100 px-4 py-2 rounded-full shadow-lg">
            +{xpGained} XP ✨
          </div>
        </div>
      )}

      {/* Item Drop Animation */}
      {showItemDrop && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="animate-scale-in text-center">
            <div className="text-6xl mb-2">{showItemDrop.emoji}</div>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold px-4 py-2 rounded-full shadow-lg">
              獲得 {showItemDrop.nameZh}！
            </div>
          </div>
        </div>
      )}

      {/* Evolution Modal */}
      {showEvolution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center animate-scale-in shadow-2xl">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-bold text-purple-600 mb-2">進化成功！</h2>
            <div className="flex items-center justify-center gap-4 my-6">
              <div className="text-5xl">{PET_EMOJIS[showEvolution.oldStage]}</div>
              <div className="text-2xl text-gray-400">→</div>
              <div className="text-6xl animate-pulse">{PET_EMOJIS[showEvolution.newStage]}</div>
            </div>
            <p className="text-lg text-gray-600 mb-6">
              你嘅寵物進化成為
              <span className="font-bold text-purple-600 mx-1">
                {showEvolution.newStage === 'baby' ? 'BB仔' :
                 showEvolution.newStage === 'child' ? '細路仔' :
                 showEvolution.newStage === 'teen' ? '少年龍' : '成年龍'}
              </span>
              喇！
            </p>
            <button
              onClick={() => setShowEvolution(null)}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >
              太好喇！ 🎊
            </button>
          </div>
        </div>
      )}

      {/* Streak Milestone Modal */}
      {showMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center animate-scale-in shadow-2xl">
            <div className="text-6xl mb-4 animate-bounce">{showMilestone.emoji}</div>
            <h2 className="text-2xl font-bold text-orange-600 mb-2">連勝里程碑！</h2>
            <div className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-2xl p-4 my-4">
              <div className="text-4xl font-bold text-orange-600 mb-1">
                {showMilestone.days} 日連勝
              </div>
              <div className="text-lg text-orange-500">
                {showMilestone.reward}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-lg text-yellow-600 mb-6">
              <span>+{showMilestone.xp}</span>
              <span className="text-xl">⭐</span>
              <span>XP</span>
            </div>
            <p className="text-gray-600 mb-6">
              繼續保持，挑戰更高紀錄！
            </p>
            <button
              onClick={() => setShowMilestone(null)}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-full text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >
              繼續努力！ 🔥
            </button>
          </div>
        </div>
      )}

      {/* Rename Pet Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full animate-scale-in shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
              幫寵物改名 ✏️
            </h2>

            <div className="text-center mb-4">
              <span className="text-6xl">{PET_EMOJIS[progress.pet.stage]}</span>
            </div>

            <input
              type="text"
              value={newPetName}
              onChange={(e) => setNewPetName(e.target.value)}
              placeholder="輸入新名..."
              maxLength={12}
              className="w-full px-4 py-3 text-lg border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none text-center"
              autoFocus
            />

            <p className="text-xs text-gray-400 text-center mt-2">
              最多 12 個字
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRenameModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (newPetName.trim()) {
                    const newProgress = renamePet(newPetName.trim(), progress);
                    setProgress(newProgress);
                    saveProgressWithSync(newProgress);
                  }
                  setShowRenameModal(false);
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-colors"
              >
                確定 ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-6 sm:py-8 text-gray-400 text-xs sm:text-sm px-4">
        <p>專為小朋友設計嘅串字練習 💙</p>
      </footer>

      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}
