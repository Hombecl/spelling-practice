'use client';

import { useState, useEffect, useCallback } from 'react';
import { Word, shuffleArray } from '@/lib/words';
import { speakEncouragement, speakTryAgain, speakLetter, speakWord } from '@/lib/speech';
import LetterButton from '@/components/LetterButton';
import SpeakButton from '@/components/SpeakButton';
import WordDisplay from '@/components/WordDisplay';
import StarBurst from '@/components/StarBurst';
import WordImage from '@/components/WordImage';
import PhonicsDisplay from '@/components/PhonicsDisplay';

interface FillModeProps {
  word: Word;
  onComplete: (correct: boolean, attempts: number) => void;
  onSkip: () => void;
}

const MAX_ERRORS = 3;
const COOLDOWN_MS = 2000;

export default function FillMode({ word, onComplete, onSkip }: FillModeProps) {
  const [userInput, setUserInput] = useState<string[]>([]);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [incorrectIndex, setIncorrectIndex] = useState(-1);
  const [isCooldown, setIsCooldown] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showPhonics, setShowPhonics] = useState(false);

  // Reveal some letters (keep 1-2 hidden based on word length)
  const generateRevealedIndices = useCallback(() => {
    const wordLength = word.word.length;
    const numToHide = Math.min(2, Math.max(1, Math.floor(wordLength / 2)));
    const indices = Array.from({ length: wordLength }, (_, i) => i);
    const hidden = shuffleArray(indices).slice(0, numToHide);
    return indices.filter((i) => !hidden.includes(i));
  }, [word]);

  // Generate letter choices
  const generateLetters = useCallback((hiddenIndices: number[]) => {
    const hiddenLetters = hiddenIndices.map((i) => word.word[i]);
    const decoys = 'abcdefghijklmnopqrstuvwxyz'
      .split('')
      .filter((l) => !hiddenLetters.includes(l));

    const numDecoys = Math.max(4, 6 - hiddenLetters.length);
    const randomDecoys = shuffleArray(decoys).slice(0, numDecoys);

    return shuffleArray([...hiddenLetters, ...randomDecoys]);
  }, [word]);

  // Reset the current word
  const resetWord = useCallback(() => {
    const revealed = generateRevealedIndices();
    setRevealedIndices(revealed);
    setUserInput(new Array(word.word.length).fill(''));
    setCurrentIndex(
      Array.from({ length: word.word.length }, (_, i) => i).find(
        (i) => !revealed.includes(i)
      ) || 0
    );
    setErrors(0);
    setShowReset(false);
    setIncorrectIndex(-1);
    setIsCooldown(false);

    const hiddenIndices = Array.from({ length: word.word.length }, (_, i) => i).filter(
      (i) => !revealed.includes(i)
    );
    setAvailableLetters(generateLetters(hiddenIndices));
    speakWord(word.word);
  }, [word, generateRevealedIndices, generateLetters]);

  useEffect(() => {
    const revealed = generateRevealedIndices();
    setRevealedIndices(revealed);
    setUserInput(new Array(word.word.length).fill(''));
    setCurrentIndex(
      Array.from({ length: word.word.length }, (_, i) => i).find(
        (i) => !revealed.includes(i)
      ) || 0
    );
    setAttempts(0);
    setErrors(0);
    setShowSuccess(false);
    setIncorrectIndex(-1);
    setIsCooldown(false);
    setShowReset(false);
    setShowPhonics(false);

    const hiddenIndices = Array.from({ length: word.word.length }, (_, i) => i).filter(
      (i) => !revealed.includes(i)
    );
    setAvailableLetters(generateLetters(hiddenIndices));
  }, [word, generateRevealedIndices, generateLetters]);

  const handleLetterClick = (letter: string) => {
    if (isCooldown || showReset || showSuccess) return;

    const expectedLetter = word.word[currentIndex];

    if (letter.toLowerCase() === expectedLetter.toLowerCase()) {
      // Correct letter
      const newInput = [...userInput];
      newInput[currentIndex] = letter;
      setUserInput(newInput);

      // Find next hidden index
      const hiddenIndices = Array.from({ length: word.word.length }, (_, i) => i).filter(
        (i) => !revealedIndices.includes(i) && !newInput[i]
      );

      if (hiddenIndices.length === 0) {
        // Word complete!
        setShowSuccess(true);
        speakEncouragement();
        setTimeout(() => {
          onComplete(true, attempts + 1);
        }, 1500);
      } else {
        setCurrentIndex(hiddenIndices[0]);
      }
      setIncorrectIndex(-1);
    } else {
      // Wrong letter
      const newErrors = errors + 1;
      setErrors(newErrors);
      setAttempts(attempts + 1);
      setIncorrectIndex(currentIndex);
      speakTryAgain();

      // Start cooldown
      setIsCooldown(true);
      setTimeout(() => {
        setIsCooldown(false);
        setIncorrectIndex(-1);
      }, COOLDOWN_MS);

      // Check if max errors reached
      if (newErrors >= MAX_ERRORS) {
        setShowReset(true);
        setShowPhonics(true);
      }
    }
  };

  const handleHint = () => {
    const letter = word.word[currentIndex];
    speakLetter(letter);
  };

  const revealedLetters = word.word.split('').map((_, i) => revealedIndices.includes(i));

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 p-2 sm:p-4">
      <StarBurst show={showSuccess} count={5} />

      {/* Instructions */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-700 mb-1">
          填返漏咗嘅字母！
        </h2>
        <p className="text-sm text-gray-500">Fill in the missing letters</p>
      </div>

      {/* Word Image */}
      <WordImage word={word.word} size="md" />

      {/* Speak Button */}
      <SpeakButton word={word.word} size="md" label="聽讀音" />

      {/* Error Counter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">錯誤次數:</span>
        <div className="flex gap-1">
          {[...Array(MAX_ERRORS)].map((_, i) => (
            <span
              key={i}
              className={`w-4 h-4 rounded-full ${
                i < errors ? 'bg-red-400' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        {isCooldown && (
          <span className="text-sm text-orange-500 animate-pulse">
            等一等...
          </span>
        )}
      </div>

      {/* Word Display */}
      <WordDisplay
        word={word.word}
        revealedLetters={revealedLetters}
        userInput={userInput}
        mode="fill"
        currentIndex={currentIndex}
        incorrectIndex={incorrectIndex}
      />

      {/* Reset Warning */}
      {showReset && (
        <div className="w-full max-w-md p-4 bg-red-50 border-2 border-red-300 rounded-xl text-center">
          <p className="text-red-600 font-bold mb-2">
            錯咗 {MAX_ERRORS} 次！要重新聽讀音再試。
          </p>
          <button
            onClick={resetWord}
            className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 active:scale-95"
          >
            🔄 重新開始
          </button>
        </div>
      )}

      {/* Phonics Help */}
      {showPhonics && (
        <div className="w-full max-w-md">
          <div className="text-center text-sm text-gray-500 mb-2">
            💡 睇吓個字點拆：
          </div>
          <PhonicsDisplay word={word.word} showBreakdown={false} />
        </div>
      )}

      {/* Letter Choices */}
      {!showReset && (
        <div className={`grid grid-cols-5 sm:grid-cols-6 gap-2 sm:gap-3 max-w-md ${isCooldown ? 'opacity-50 pointer-events-none' : ''}`}>
          {availableLetters.map((letter, index) => (
            <LetterButton
              key={`${letter}-${index}`}
              letter={letter}
              onClick={handleLetterClick}
              disabled={isCooldown}
              size="md"
            />
          ))}
        </div>
      )}

      {/* Hint and Skip Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleHint}
          disabled={showReset}
          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 active:scale-95 disabled:opacity-50"
        >
          💡 提示
        </button>
        <button
          onClick={onSkip}
          className="text-gray-400 hover:text-gray-600 underline text-sm"
        >
          跳過
        </button>
      </div>
    </div>
  );
}
