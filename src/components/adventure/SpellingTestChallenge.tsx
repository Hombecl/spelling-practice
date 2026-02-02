'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  SpellingTestStage,
  getGradeLabel,
  getDifficultyLabel,
} from '@/lib/adaptiveLevel';
import {
  getWordListById,
  getSpellingTestStats,
  updateWordMastery,
  getDaysUntilDeadline,
} from '@/lib/customWords';
import { Word } from '@/lib/words';
import SpellMode from '@/components/modes/SpellMode';

interface SpellingTestChallengeProps {
  stage: SpellingTestStage;
  onComplete: (stars: number, xp: number, allCorrect: boolean) => void;
  onExit: () => void;
}

type ChallengePhase = 'intro' | 'battle' | 'victory' | 'defeat';

export default function SpellingTestChallenge({
  stage,
  onComplete,
  onExit,
}: SpellingTestChallengeProps) {
  const [phase, setPhase] = useState<ChallengePhase>('intro');
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [perfectCount, setPerfectCount] = useState(0);

  // Initialize words
  useEffect(() => {
    const list = getWordListById(stage.listId);
    if (list) {
      // Shuffle the words for the challenge
      const shuffled = [...list.words].sort(() => Math.random() - 0.5);
      setWords(shuffled);
    }
  }, [stage.listId]);

  const currentWord: Word | null = words[currentIndex]
    ? { word: words[currentIndex], category: 'spelling-test' }
    : null;

  const list = getWordListById(stage.listId);
  const stats = list ? getSpellingTestStats(stage.listId) : null;
  const daysUntil = list ? getDaysUntilDeadline(list) : null;

  const handleWordComplete = useCallback((correct: boolean, attempts: number) => {
    // Update mastery tracking
    if (words[currentIndex]) {
      updateWordMastery(stage.listId, words[currentIndex], correct);
    }

    if (correct) {
      setCorrectCount(prev => prev + 1);
      if (attempts === 1) {
        setPerfectCount(prev => prev + 1);
      }
    }
    setTotalErrors(prev => prev + Math.max(0, attempts - 1));

    // Check if challenge complete
    if (currentIndex + 1 >= words.length) {
      const finalCorrect = correct ? correctCount + 1 : correctCount;
      const allCorrect = finalCorrect === words.length;

      if (allCorrect) {
        setPhase('victory');
      } else {
        setPhase('defeat');
      }
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, words, stage.listId, correctCount]);

  const handleSkip = useCallback(() => {
    // Skip counts as wrong
    if (words[currentIndex]) {
      updateWordMastery(stage.listId, words[currentIndex], false);
    }

    setTotalErrors(prev => prev + 3);

    if (currentIndex + 1 >= words.length) {
      setPhase('defeat');
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, words, stage.listId]);

  const calculateStars = () => {
    const percentage = (correctCount / words.length) * 100;
    if (percentage === 100 && totalErrors === 0) return 5;
    if (percentage === 100) return 4;
    if (percentage >= 90) return 3;
    if (percentage >= 70) return 2;
    if (percentage >= 50) return 1;
    return 0;
  };

  // Intro Phase
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-100 to-red-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
          {/* Boss/Challenge Emoji */}
          <div className={`text-8xl mb-4 ${stage.isBoss ? 'animate-bounce' : ''}`}>
            {stage.isBoss ? '📝' : '📋'}
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {stage.isBoss ? '默書大挑戰' : '默書練習'}
          </h2>

          <div className="text-lg text-orange-600 font-medium mb-4">
            {stage.listName}
          </div>

          {/* Deadline Warning */}
          {daysUntil !== null && (
            <div className={`mb-4 p-3 rounded-xl ${
              daysUntil === 0 ? 'bg-red-100 text-red-700' :
              daysUntil === 1 ? 'bg-orange-100 text-orange-700' :
              daysUntil <= 3 ? 'bg-yellow-100 text-yellow-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              <div className="text-2xl mb-1">
                {daysUntil === 0 ? '⚠️' :
                 daysUntil === 1 ? '⏰' :
                 daysUntil <= 3 ? '📅' : '📆'}
              </div>
              <div className="font-bold">
                {daysUntil < 0 ? '已過期' :
                 daysUntil === 0 ? '今日默書！' :
                 daysUntil === 1 ? '聽日默書！' :
                 `仲有 ${daysUntil} 日`}
              </div>
            </div>
          )}

          {/* Challenge Info */}
          <div className="bg-orange-50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stage.wordCount}</div>
                <div className="text-gray-500">個字</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{getDifficultyLabel(stage.difficulty)}</div>
                <div className="text-gray-500">難度</div>
              </div>
            </div>
          </div>

          {/* Current Mastery */}
          {stats && (
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <div className="text-xs text-gray-500 mb-2">目前掌握度</div>
              <div className="flex gap-2 text-xs">
                <div className="flex-1 text-center p-2 bg-green-100 rounded">
                  <div className="font-bold text-green-600">{stats.mastered}</div>
                  <div className="text-green-500">已掌握</div>
                </div>
                <div className="flex-1 text-center p-2 bg-yellow-100 rounded">
                  <div className="font-bold text-yellow-600">{stats.learning}</div>
                  <div className="text-yellow-500">學緊</div>
                </div>
                <div className="flex-1 text-center p-2 bg-gray-100 rounded">
                  <div className="font-bold text-gray-600">{stats.newWords}</div>
                  <div className="text-gray-500">未練</div>
                </div>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Challenge Description */}
          {stage.isBoss && (
            <p className="text-gray-600 mb-4 text-sm">
              🎯 完成所有字詞嘅終極挑戰！答啱所有字先算通關！
            </p>
          )}

          {/* Rewards */}
          <div className="flex justify-center gap-4 mb-6 text-sm">
            <div className="text-center">
              <div className="text-xl text-yellow-500">⭐</div>
              <div className="font-bold">{stage.rewards.stars}</div>
            </div>
            <div className="text-center">
              <div className="text-xl text-purple-500">✨</div>
              <div className="font-bold">+{stage.rewards.xp} XP</div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onExit}
              className="flex-1 py-3 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
            >
              返回
            </button>
            <button
              onClick={() => setPhase('battle')}
              className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg transition-all"
            >
              {stage.isBoss ? '開始挑戰！' : '開始練習'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Victory Phase
  if (phase === 'victory') {
    const stars = calculateStars();
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-orange-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-scale-in">
          <div className="text-6xl mb-4">🎉</div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {stage.isBoss ? '挑戰成功！' : '練習完成！'}
          </h2>

          <div className="text-lg text-orange-600 font-medium mb-4">
            {stage.listName}
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={`text-3xl ${i <= stars ? 'animate-pulse' : 'opacity-30'}`}
              >
                ⭐
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="bg-green-50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{correctCount}</div>
                <div className="text-gray-500">答啱</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{perfectCount}</div>
                <div className="text-gray-500">完美</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{words.length}</div>
                <div className="text-gray-500">總數</div>
              </div>
            </div>
          </div>

          {/* Rewards */}
          <div className="bg-yellow-50 rounded-xl p-4 mb-6">
            <div className="text-sm text-yellow-600 font-bold mb-2">獲得獎勵</div>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">⭐ {stage.rewards.stars}</div>
                <div className="text-xs text-gray-500">星星</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">+{stage.rewards.xp}</div>
                <div className="text-xs text-gray-500">XP</div>
              </div>
            </div>
          </div>

          {/* Achievement for perfect score */}
          {correctCount === words.length && totalErrors === 0 && (
            <div className="bg-purple-50 rounded-xl p-3 mb-6">
              <div className="text-sm text-purple-600 font-bold">🏆 完美通關！</div>
              <div className="text-xs text-gray-500">零失誤完成所有字詞！</div>
            </div>
          )}

          <button
            onClick={() => onComplete(stars, stage.rewards.xp, correctCount === words.length)}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-green-400 to-green-600 text-white hover:shadow-lg transition-all"
          >
            太好喇！ 🎊
          </button>
        </div>
      </div>
    );
  }

  // Defeat Phase (didn't get all correct)
  if (phase === 'defeat') {
    const stars = calculateStars();
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-300 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-scale-in">
          <div className="text-6xl mb-4">💪</div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            繼續努力！
          </h2>

          <div className="text-lg text-gray-600 font-medium mb-4">
            {stage.listName}
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={`text-3xl ${i <= stars ? '' : 'opacity-30'}`}
              >
                ⭐
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="bg-orange-50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{correctCount}</div>
                <div className="text-gray-500">答啱</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{words.length - correctCount}</div>
                <div className="text-gray-500">要溫</div>
              </div>
            </div>
          </div>

          {/* Encouragement */}
          <p className="text-gray-600 mb-6">
            {correctCount >= words.length * 0.8
              ? '差啲就完美喇！再練習一次！'
              : correctCount >= words.length * 0.5
                ? '唔錯！繼續練習會更好！'
                : '多啲練習，你一定得！'}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => onComplete(stars, Math.floor(stage.rewards.xp * 0.5), false)}
              className="flex-1 py-3 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
            >
              返回
            </button>
            <button
              onClick={() => {
                // Reset for retry
                const list = getWordListById(stage.listId);
                if (list) {
                  const shuffled = [...list.words].sort(() => Math.random() - 0.5);
                  setWords(shuffled);
                }
                setCurrentIndex(0);
                setCorrectCount(0);
                setTotalErrors(0);
                setPerfectCount(0);
                setPhase('intro');
              }}
              className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 text-white hover:shadow-lg transition-all"
            >
              再試一次
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Battle Phase
  if (!currentWord) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-100 to-red-200 flex items-center justify-center">
        <div className="text-2xl animate-pulse">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 to-red-200 pb-20">
      {/* Challenge Header */}
      <div className="bg-orange-600 text-white sticky top-0 z-40 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{stage.isBoss ? '📝' : '📋'}</span>
            <span className="font-bold truncate max-w-[150px]">{stage.listName}</span>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-1">
            <span className="font-bold">{currentIndex + 1}</span>
            <span className="opacity-70">/</span>
            <span className="opacity-70">{words.length}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-lg mx-auto mt-2">
          <div className="h-3 bg-orange-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-300"
              style={{ width: `${((currentIndex) / words.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="max-w-lg mx-auto mt-2 flex justify-center gap-4 text-sm">
          <span className="text-green-300">✓ {correctCount}</span>
          <span className="text-yellow-300">⭐ {perfectCount}</span>
        </div>
      </div>

      {/* Practice Mode */}
      <div className="max-w-lg mx-auto px-4 mt-4">
        <SpellMode
          word={currentWord}
          onComplete={handleWordComplete}
          onSkip={handleSkip}
        />
      </div>
    </div>
  );
}
