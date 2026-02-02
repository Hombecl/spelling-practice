'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  World,
  Stage,
  getWordsForStage,
  calculateStageStars,
} from '@/lib/adventure';
import { Word } from '@/lib/words';
import { updateWordMastery } from '@/lib/customWords';
import PhonicsMode from '@/components/modes/PhonicsMode';
import FillMode from '@/components/modes/FillMode';
import SpellMode from '@/components/modes/SpellMode';
import StageComplete from './StageComplete';

interface StagePlayProps {
  world: World;
  stage: Stage;
  mode: 'phonics' | 'fill' | 'spell';
  activeWordListId?: string;  // For spelling test integration
  onComplete: (stars: number, xpEarned: number) => void;
  onExit: () => void;
}

export default function StagePlay({
  world,
  stage,
  mode,
  activeWordListId,
  onComplete,
  onExit,
}: StagePlayProps) {
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  // Initialize words on mount
  useEffect(() => {
    const stageWords = getWordsForStage(world, stage, activeWordListId);
    setWords(stageWords);
  }, [world, stage, activeWordListId]);

  const currentWord: Word | null = words[currentIndex]
    ? { word: words[currentIndex], category: 'adventure' }
    : null;

  const handleWordComplete = useCallback((correct: boolean, attempts: number) => {
    // Update mastery tracking for spelling tests
    if (activeWordListId && words[currentIndex]) {
      updateWordMastery(activeWordListId, words[currentIndex], correct);
    }

    if (correct) {
      setCorrectCount(prev => prev + 1);
    }
    // Track total errors (attempts - 1 for each word)
    setTotalErrors(prev => prev + Math.max(0, attempts - 1));

    // Move to next word or complete
    if (currentIndex + 1 >= words.length) {
      // Stage complete
      const finalCorrect = correct ? correctCount + 1 : correctCount;
      const finalErrors = totalErrors + Math.max(0, attempts - 1);
      const stars = calculateStageStars(finalCorrect, words.length, finalErrors);
      setEarnedStars(stars);
      setIsComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, words, activeWordListId, correctCount, totalErrors]);

  const handleSkip = useCallback(() => {
    // Update mastery tracking - skip counts as wrong
    if (activeWordListId && words[currentIndex]) {
      updateWordMastery(activeWordListId, words[currentIndex], false);
    }

    // Skip counts as an error
    setTotalErrors(prev => prev + 3);
    if (currentIndex + 1 >= words.length) {
      const stars = calculateStageStars(correctCount, words.length, totalErrors + 3);
      setEarnedStars(stars);
      setIsComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, words, activeWordListId, correctCount, totalErrors]);

  const handleStageComplete = () => {
    const xpEarned = stage.rewards.xp + (earnedStars * 5);
    onComplete(earnedStars, xpEarned);
  };

  // Show completion screen
  if (isComplete) {
    return (
      <StageComplete
        world={world}
        stage={stage}
        stars={earnedStars}
        correctCount={correctCount}
        totalCount={words.length}
        onContinue={handleStageComplete}
        onRetry={() => {
          setWords(getWordsForStage(world, stage, activeWordListId));
          setCurrentIndex(0);
          setCorrectCount(0);
          setTotalErrors(0);
          setIsComplete(false);
          setEarnedStars(0);
        }}
      />
    );
  }

  // Loading state
  if (!currentWord) {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${world.bgGradient} flex items-center justify-center`}>
        <div className="text-2xl animate-pulse">載入中...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${world.bgGradient} pb-20`}>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm sticky top-0 z-40 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={onExit}
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            ✕ 離開
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl">{world.emoji}</span>
            <span className="font-bold text-gray-700">第 {stage.number} 關</span>
          </div>

          <div className="flex items-center gap-1 text-sm">
            <span className="font-bold text-gray-700">{currentIndex + 1}</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-500">{words.length}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-lg mx-auto mt-2">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
              style={{ width: `${(currentIndex / words.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stage Info Banner */}
      <div className="max-w-lg mx-auto px-4 mt-4 mb-2">
        <div className="flex items-center justify-center gap-2 bg-white/70 rounded-full py-2 px-4">
          <span className="text-xl">{stage.emoji}</span>
          <span className="font-bold text-gray-700">{stage.nameZh}</span>
        </div>
      </div>

      {/* Practice Mode */}
      <div className="max-w-lg mx-auto px-4">
        {mode === 'phonics' && (
          <PhonicsMode
            word={currentWord}
            onComplete={handleWordComplete}
            onSkip={handleSkip}
          />
        )}
        {mode === 'fill' && (
          <FillMode
            word={currentWord}
            onComplete={handleWordComplete}
            onSkip={handleSkip}
          />
        )}
        {mode === 'spell' && (
          <SpellMode
            word={currentWord}
            onComplete={handleWordComplete}
            onSkip={handleSkip}
          />
        )}
      </div>
    </div>
  );
}
