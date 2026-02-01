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
} from '@/lib/progress';
import { Word } from '@/lib/words';
import { CustomWordList, markWordListUsed } from '@/lib/customWords';
import PhonicsMode from '@/components/modes/PhonicsMode';
import FillMode from '@/components/modes/FillMode';
import SpellMode from '@/components/modes/SpellMode';
import ModeSelector from '@/components/ModeSelector';
import WordListManager from '@/components/WordListManager';
import BadgeDisplay from '@/components/BadgeDisplay';
import ProgressBar from '@/components/ProgressBar';

type Screen = 'home' | 'play' | 'badges' | 'wordlists' | 'pet';

// Built-in words for different levels
const builtInWords = {
  simple: ['cat', 'dog', 'sun', 'hat', 'red', 'big', 'run', 'sit', 'cup', 'pen', 'bus', 'box', 'bed', 'leg', 'pig', 'fox', 'hen', 'net', 'wet', 'hot'],
  medium: ['book', 'tree', 'fish', 'bird', 'milk', 'door', 'ball', 'star', 'cake', 'rain', 'blue', 'jump', 'swim', 'play', 'fast', 'good', 'help', 'stop', 'look', 'read'],
  advanced: ['apple', 'water', 'happy', 'house', 'green', 'flower', 'school', 'friend', 'mother', 'father', 'sister', 'brother', 'teacher', 'animal', 'orange', 'yellow', 'purple', 'circle', 'square', 'number'],
};

export default function Home() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
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

  // Load progress on mount
  useEffect(() => {
    const p = getProgress();
    const updatedP = updateStreak(p);
    setProgress(updatedP);
    saveProgress(updatedP);
  }, []);

  // Get words based on selection
  const getWordsForPractice = useCallback((): string[] => {
    if (customList) {
      return [...customList.words];
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
  }, [customList, progress]);

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
    const words = shuffleArray(getWordsForPractice());
    setPracticeWords(words);
    setWordIndex(0);
    setWordsCompleted(0);
    setSessionTarget(Math.min(words.length, 10));
    setCurrentWord({ word: words[0], category: 'custom' });
    setScreen('play');

    if (customList) {
      markWordListUsed(customList.id);
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
      setScreen('home');
    }
  }, [wordIndex, practiceWords, wordsCompleted, sessionTarget]);

  // Handle word completion
  const handleWordComplete = (correct: boolean, attempts: number) => {
    if (!progress || !currentWord) return;

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
    }

    setProgress(newProgress);
    saveProgress(newProgress);
    setWordsCompleted((prev) => prev + 1);

    setTimeout(() => {
      getNextWord();
    }, 500);
  };

  // Handle skip
  const handleSkip = () => {
    getNextWord();
  };

  // Handle mode change
  const handleSelectMode = (mode: 'phonics' | 'fill' | 'spell') => {
    if (!progress) return;
    const newProgress = { ...progress, currentMode: mode };
    setProgress(newProgress);
    saveProgress(newProgress);
  };

  // Handle custom list selection
  const handleSelectList = (list: CustomWordList) => {
    setCustomList(list);
  };

  // Handle built-in selection
  const handleUseBuiltIn = () => {
    setCustomList(null);
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
    saveProgress(newProgress);

    setSkillUsedMessage(`${skill.emoji} 顯示咗 ${newRevealed.length} 個字母！`);
    setTimeout(() => setSkillUsedMessage(null), 2000);
  };

  // Reset hints when word changes
  const resetHints = useCallback(() => {
    setHintLetters([]);
  }, []);

  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50">
        <div className="text-2xl animate-pulse">載入中...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 pb-safe">
      {/* Header - Mobile optimized */}
      <header className="bg-white shadow-md sticky top-0 z-40 safe-top">
        <div className="max-w-4xl mx-auto px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between">
          <button
            onClick={() => setScreen('home')}
            className="text-lg sm:text-2xl font-bold text-blue-600 hover:text-blue-700 active:scale-95"
          >
            🔤 串字練習
          </button>

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

            <button
              onClick={() => setScreen('pet')}
              className="text-xl sm:text-2xl hover:scale-110 active:scale-95 transition-transform p-1 relative"
              aria-label="View pet"
            >
              {PET_EMOJIS[progress.pet.stage]}
              <span className="absolute -bottom-1 -right-1 text-xs bg-purple-500 text-white rounded-full px-1 min-w-[1.25rem] text-center">
                {progress.pet.level}
              </span>
            </button>

            <button
              onClick={() => setScreen('badges')}
              className="text-xl sm:text-2xl hover:scale-110 active:scale-95 transition-transform p-1"
              aria-label="View badges"
            >
              🏅
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4">
        {screen === 'home' && (
          <div className="flex flex-col items-center gap-6 py-4 sm:py-8">
            {/* Welcome Message */}
            <div className="text-center">
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">
                歡迎返嚟！ 👋
              </h1>
              <p className="text-lg sm:text-xl text-gray-600">
                準備好練習串字未？
              </p>
            </div>

            {/* Word List Manager */}
            <WordListManager
              onSelectList={handleSelectList}
              onUseBuiltIn={handleUseBuiltIn}
              selectedListId={customList?.id}
            />

            {/* Mode Selector */}
            <ModeSelector
              currentMode={progress.currentMode}
              onSelectMode={handleSelectMode}
            />

            {/* Selected list info */}
            {customList && (
              <div className="w-full max-w-lg bg-green-50 border-2 border-green-300 rounded-xl p-4 text-center">
                <div className="font-bold text-green-700">
                  📋 {customList.name}
                </div>
                <div className="text-sm text-green-600">
                  {customList.words.length} 個字要練習
                </div>
              </div>
            )}

            {/* Start Button - Large touch target for mobile */}
            <button
              onClick={startPlaying}
              className="
                w-full max-w-sm
                px-8 py-5 sm:px-12 sm:py-6
                text-xl sm:text-2xl font-bold
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

            {/* Progress Overview */}
            <div className="w-full max-w-md mt-2">
              <ProgressBar
                current={Object.values(progress.wordProgress).filter((w) => w.mastered).length}
                total={Object.keys(progress.wordProgress).length || 1}
                label="已掌握嘅字"
                showStars
                stars={progress.totalStars}
              />
            </div>
          </div>
        )}

        {screen === 'play' && currentWord && (
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
              <div className="mt-4 flex justify-center gap-3">
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
                onClick={() => setScreen('home')}
                className="px-6 py-3 text-gray-500 hover:text-gray-700 active:text-gray-900 text-base sm:text-lg"
              >
                ← 返回主頁
              </button>
            </div>
          </div>
        )}

        {screen === 'badges' && (
          <div className="py-4 sm:py-8">
            <button
              onClick={() => setScreen('home')}
              className="mb-4 px-4 py-2 text-blue-500 hover:text-blue-700 active:text-blue-900 text-lg"
            >
              ← 返回
            </button>
            <BadgeDisplay earnedBadges={progress.badges} showAll />
          </div>
        )}

        {screen === 'pet' && (
          <div className="py-4 sm:py-8">
            <button
              onClick={() => setScreen('home')}
              className="mb-4 px-4 py-2 text-blue-500 hover:text-blue-700 active:text-blue-900 text-lg"
            >
              ← 返回
            </button>

            {/* Pet Display */}
            <div className="flex flex-col items-center gap-6">
              {/* Pet Avatar */}
              <div className="relative">
                <div className={`text-8xl sm:text-9xl animate-bounce-gentle`}>
                  {PET_EMOJIS[progress.pet.stage]}
                </div>
                {/* Mood indicator */}
                <div className="absolute -top-2 -right-2 text-2xl">
                  {progress.pet.happiness >= 70 ? '💖' :
                   progress.pet.happiness >= 40 ? '😊' :
                   progress.pet.happiness >= 20 ? '😐' : '😢'}
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
                <p className="text-xs text-gray-400 mt-1">撳名改名</p>
              </div>

              {/* XP Bar */}
              <div className="w-full max-w-sm">
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
              <div className="w-full max-w-sm">
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

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="bg-white rounded-xl p-4 text-center shadow-md">
                  <div className="text-2xl mb-1">📝</div>
                  <div className="text-xl font-bold text-gray-800">{progress.pet.totalWordsSpelled}</div>
                  <div className="text-sm text-gray-500">已串字數</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-md">
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="text-xl font-bold text-gray-800">{progress.pet.unlockedSkills.length}</div>
                  <div className="text-sm text-gray-500">已解鎖技能</div>
                </div>
              </div>

              {/* Skills Section */}
              {progress.pet.unlockedSkills.length > 0 && (
                <div className="w-full max-w-sm">
                  <h3 className="text-lg font-bold text-gray-700 mb-3">技能</h3>
                  <div className="space-y-2">
                    {progress.pet.unlockedSkills.map(skillId => {
                      const skill = PET_SKILLS.find(s => s.id === skillId);
                      if (!skill) return null;

                      // Check if skill is active
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
                  <p className="text-xs text-gray-400 mt-3 text-center">
                    💡 喺練習時可以使用「偷睇」技能
                  </p>
                </div>
              )}

              {/* Tip */}
              <div className="text-center text-gray-500 text-sm mt-4">
                💡 每日練習串字可以令你嘅寵物開心同升級！
              </div>
            </div>
          </div>
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
                    saveProgress(newProgress);
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
    </main>
  );
}
