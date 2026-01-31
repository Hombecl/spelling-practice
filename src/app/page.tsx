'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getProgress,
  saveProgress,
  updateWordProgress,
  addStars,
  updateStreak,
  UserProgress,
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

type Screen = 'home' | 'play' | 'badges' | 'wordlists';

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
              />
            )}
            {progress.currentMode === 'spell' && (
              <SpellMode
                word={currentWord}
                onComplete={handleWordComplete}
                onSkip={handleSkip}
              />
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
      </div>

      {/* Footer */}
      <footer className="text-center py-6 sm:py-8 text-gray-400 text-xs sm:text-sm px-4">
        <p>專為小朋友設計嘅串字練習 💙</p>
      </footer>
    </main>
  );
}
