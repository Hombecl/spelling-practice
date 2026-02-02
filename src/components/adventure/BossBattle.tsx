'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  World,
  BossBattle as BossBattleType,
  getWordsForBoss,
} from '@/lib/adventure';
import { Word } from '@/lib/words';
import { updateWordMastery } from '@/lib/customWords';
import SpellMode from '@/components/modes/SpellMode';

interface BossBattleProps {
  world: World;
  boss: BossBattleType;
  mode: 'phonics' | 'fill' | 'spell';
  activeWordListId?: string;  // For spelling test integration
  onVictory: (time: number) => void;
  onDefeat: () => void;
  onExit: () => void;
}

type BattlePhase = 'intro' | 'battle' | 'victory' | 'defeat';

export default function BossBattle({
  world,
  boss,
  mode,
  activeWordListId,
  onVictory,
  onDefeat,
  onExit,
}: BossBattleProps) {
  const [phase, setPhase] = useState<BattlePhase>('intro');
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [perfectCount, setPerfectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [finalTime, setFinalTime] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize boss battle
  useEffect(() => {
    const bossWords = getWordsForBoss(world, boss, activeWordListId);
    setWords(bossWords);

    if (boss.challenge.timeLimit) {
      setTimeLeft(boss.challenge.timeLimit);
    }
  }, [world, boss, activeWordListId]);

  // Timer for speed/ultimate challenges
  useEffect(() => {
    if (phase === 'battle' && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            // Time's up!
            clearInterval(timerRef.current!);
            setPhase('defeat');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [phase, timeLeft]);

  const startBattle = () => {
    setPhase('battle');
    setStartTime(Date.now());
  };

  const currentWord: Word | null = words[currentIndex]
    ? { word: words[currentIndex], category: 'boss' }
    : null;

  const handleWordComplete = useCallback((correct: boolean, attempts: number) => {
    // Update mastery tracking for spelling tests
    if (activeWordListId && words[currentIndex]) {
      updateWordMastery(activeWordListId, words[currentIndex], correct);
    }

    const isPerfect = attempts === 1;

    // Check challenge-specific conditions
    switch (boss.challenge.type) {
      case 'streak':
      case 'ultimate':
        if (!correct) {
          // Streak broken - defeat
          setPhase('defeat');
          return;
        }
        setStreak(prev => prev + 1);
        break;

      case 'accuracy':
        if (isPerfect) {
          setPerfectCount(prev => prev + 1);
        }
        break;

      case 'speed':
      case 'marathon':
        // Just need to complete all words
        break;
    }

    // Check if battle is won
    if (currentIndex + 1 >= words.length) {
      // Check accuracy requirement
      if (boss.challenge.type === 'accuracy') {
        const finalPerfect = isPerfect ? perfectCount + 1 : perfectCount;
        if (finalPerfect < (boss.challenge.requiredPerfect || 0)) {
          setPhase('defeat');
          return;
        }
      }

      // Victory!
      if (timerRef.current) clearInterval(timerRef.current);
      setFinalTime(Date.now() - startTime);
      setPhase('victory');
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, words, activeWordListId, boss.challenge, perfectCount, startTime]);

  const handleSkip = useCallback(() => {
    // Update mastery tracking - skip counts as wrong
    if (activeWordListId && words[currentIndex]) {
      updateWordMastery(activeWordListId, words[currentIndex], false);
    }

    // In boss battle, skip = defeat for streak challenges
    if (boss.challenge.type === 'streak' || boss.challenge.type === 'ultimate') {
      setPhase('defeat');
      return;
    }

    // For other challenges, skip but don't count as perfect
    if (currentIndex + 1 >= words.length) {
      if (boss.challenge.type === 'accuracy') {
        if (perfectCount < (boss.challenge.requiredPerfect || 0)) {
          setPhase('defeat');
          return;
        }
      }
      setFinalTime(Date.now() - startTime);
      setPhase('victory');
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [boss.challenge, currentIndex, words, activeWordListId, perfectCount, startTime]);

  // Intro Phase
  if (phase === 'intro') {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${world.bgGradient} flex items-center justify-center p-4`}>
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
          {/* Boss Appearance */}
          <div className="text-8xl mb-4 animate-bounce">{boss.bossEmoji}</div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {boss.nameZh}
          </h2>

          {/* Story */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {boss.storyIntro}
          </p>

          {/* Challenge Info */}
          <div className="bg-red-50 rounded-xl p-4 mb-6">
            <div className="text-sm text-red-600 font-bold mb-2">挑戰條件</div>
            {boss.challenge.type === 'streak' && (
              <p className="text-red-700">連續答啱 {boss.challenge.wordCount} 個字</p>
            )}
            {boss.challenge.type === 'speed' && (
              <p className="text-red-700">{boss.challenge.timeLimit} 秒內完成 {boss.challenge.wordCount} 個字</p>
            )}
            {boss.challenge.type === 'accuracy' && (
              <p className="text-red-700">連續 {boss.challenge.requiredPerfect} 個字拎滿星</p>
            )}
            {boss.challenge.type === 'marathon' && (
              <p className="text-red-700">完成 {boss.challenge.wordCount} 個字</p>
            )}
            {boss.challenge.type === 'ultimate' && (
              <p className="text-red-700">{boss.challenge.timeLimit} 秒內連續答啱 {boss.challenge.wordCount} 個字</p>
            )}
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
              onClick={startBattle}
              className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-lg transition-all"
            >
              開始挑戰！
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Victory Phase
  if (phase === 'victory') {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${world.bgGradient} flex items-center justify-center p-4`}>
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-scale-in">
          <div className="text-6xl mb-4">🎉</div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            勝利！
          </h2>

          <div className="text-5xl mb-4">{boss.bossEmoji}</div>

          <p className="text-gray-600 mb-6 leading-relaxed italic">
            &ldquo;{boss.storyVictory}&rdquo;
          </p>

          {/* Rewards */}
          <div className="bg-yellow-50 rounded-xl p-4 mb-6">
            <div className="text-sm text-yellow-600 font-bold mb-2">獎勵</div>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">⭐ {boss.rewards.stars}</div>
                <div className="text-xs text-gray-500">星星</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">+{boss.rewards.xp}</div>
                <div className="text-xs text-gray-500">XP</div>
              </div>
            </div>
          </div>

          {/* Special Item */}
          <div className="bg-purple-50 rounded-xl p-3 mb-6">
            <div className="text-sm text-purple-600 font-bold">獲得特殊獎勵！</div>
            <div className="text-2xl mt-1">👑</div>
          </div>

          <button
            onClick={() => onVictory(finalTime)}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-green-400 to-green-600 text-white hover:shadow-lg transition-all"
          >
            太好喇！
          </button>
        </div>
      </div>
    );
  }

  // Defeat Phase
  if (phase === 'defeat') {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${world.bgGradient} flex items-center justify-center p-4`}>
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-scale-in">
          <div className="text-6xl mb-4">😢</div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            挑戰失敗
          </h2>

          <div className="text-5xl mb-4 opacity-50">{boss.bossEmoji}</div>

          <p className="text-gray-600 mb-6">
            唔緊要！練習多啲再嚟挑戰！
          </p>

          <div className="flex gap-3">
            <button
              onClick={onDefeat}
              className="flex-1 py-3 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
            >
              返回
            </button>
            <button
              onClick={() => {
                setWords(getWordsForBoss(world, boss, activeWordListId));
                setCurrentIndex(0);
                setStreak(0);
                setPerfectCount(0);
                if (boss.challenge.timeLimit) {
                  setTimeLeft(boss.challenge.timeLimit);
                }
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
      <div className={`min-h-screen bg-gradient-to-b ${world.bgGradient} flex items-center justify-center`}>
        <div className="text-2xl animate-pulse">載入中...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-red-100 to-orange-200 pb-20`}>
      {/* Boss Battle Header */}
      <div className="bg-red-600 text-white sticky top-0 z-40 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{boss.bossEmoji}</span>
            <span className="font-bold">Boss 戰</span>
          </div>

          {/* Timer (if applicable) */}
          {timeLeft !== null && (
            <div className={`text-xl font-bold ${timeLeft <= 10 ? 'text-yellow-300 animate-pulse' : ''}`}>
              ⏱️ {timeLeft}s
            </div>
          )}

          {/* Progress */}
          <div className="flex items-center gap-1">
            <span className="font-bold">{currentIndex + 1}</span>
            <span className="opacity-70">/</span>
            <span className="opacity-70">{words.length}</span>
          </div>
        </div>

        {/* HP Bar (Boss health = words remaining) */}
        <div className="max-w-lg mx-auto mt-2">
          <div className="h-3 bg-red-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
              style={{ width: `${((words.length - currentIndex) / words.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Challenge Status */}
        <div className="max-w-lg mx-auto mt-2 text-center text-sm">
          {(boss.challenge.type === 'streak' || boss.challenge.type === 'ultimate') && (
            <span>🔥 連擊: {streak}</span>
          )}
          {boss.challenge.type === 'accuracy' && (
            <span>⭐ 完美: {perfectCount}/{boss.challenge.requiredPerfect}</span>
          )}
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
