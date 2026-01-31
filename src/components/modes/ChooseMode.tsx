'use client';

import { useState, useEffect, useCallback } from 'react';
import { Word, shuffleArray } from '@/lib/words';
import { speakEncouragement, speakTryAgain, speakWord } from '@/lib/speech';
import LetterButton from '@/components/LetterButton';
import SpeakButton from '@/components/SpeakButton';
import WordDisplay from '@/components/WordDisplay';
import StarBurst from '@/components/StarBurst';
import WordImage from '@/components/WordImage';
import PhonicsDisplay from '@/components/PhonicsDisplay';

interface ChooseModeProps {
  word: Word;
  onComplete: (correct: boolean, attempts: number) => void;
  onSkip: () => void;
}

const MAX_ERRORS = 3;
const COOLDOWN_MS = 2000;

export default function ChooseMode({ word, onComplete, onSkip }: ChooseModeProps) {
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [incorrectLetter, setIncorrectLetter] = useState<string | null>(null);
  const [isCooldown, setIsCooldown] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showPhonics, setShowPhonics] = useState(false);

  // Generate available letters (correct letters + some decoys)
  const generateLetters = useCallback(() => {
    const wordLetters = word.word.split('');
    const decoys = 'abcdefghijklmnopqrstuvwxyz'
      .split('')
      .filter((l) => !wordLetters.includes(l));

    // Add 4-6 random decoy letters
    const numDecoys = Math.min(6, Math.max(4, 8 - wordLetters.length));
    const randomDecoys = shuffleArray(decoys).slice(0, numDecoys);

    return shuffleArray([...wordLetters, ...randomDecoys]);
  }, [word]);

  // Reset the current word
  const resetWord = useCallback(() => {
    setSelectedLetters([]);
    setCurrentIndex(0);
    setErrors(0);
    setShowReset(false);
    setIncorrectLetter(null);
    setIsCooldown(false);
    setAvailableLetters(generateLetters());
    // Play the word again
    speakWord(word.word);
  }, [generateLetters, word.word]);

  useEffect(() => {
    setSelectedLetters([]);
    setCurrentIndex(0);
    setAttempts(0);
    setErrors(0);
    setShowSuccess(false);
    setIncorrectLetter(null);
    setIsCooldown(false);
    setShowReset(false);
    setShowPhonics(false);
    setAvailableLetters(generateLetters());
  }, [word, generateLetters]);

  const handleLetterClick = (letter: string) => {
    // Prevent clicks during cooldown
    if (isCooldown || showReset || showSuccess) return;

    const expectedLetter = word.word[currentIndex];

    if (letter.toLowerCase() === expectedLetter.toLowerCase()) {
      // Correct letter
      const newSelected = [...selectedLetters, letter];
      setSelectedLetters(newSelected);
      setCurrentIndex(currentIndex + 1);
      setIncorrectLetter(null);

      if (newSelected.length === word.word.length) {
        // Word complete!
        setShowSuccess(true);
        speakEncouragement();
        setTimeout(() => {
          onComplete(true, attempts + 1);
        }, 1500);
      }
    } else {
      // Wrong letter
      const newErrors = errors + 1;
      setErrors(newErrors);
      setAttempts(attempts + 1);
      setIncorrectLetter(letter);
      speakTryAgain();

      // Start cooldown
      setIsCooldown(true);
      setTimeout(() => {
        setIsCooldown(false);
        setIncorrectLetter(null);
      }, COOLDOWN_MS);

      // Check if max errors reached
      if (newErrors >= MAX_ERRORS) {
        setShowReset(true);
        setShowPhonics(true);
      }
    }
  };

  const revealedLetters = word.word.split('').map((_, i) => i < currentIndex);

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 p-2 sm:p-4">
      <StarBurst show={showSuccess} count={5} />

      {/* Instructions */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-700 mb-1">
          聽讀音，順序揀字母！
        </h2>
        <p className="text-sm text-gray-500">Listen and choose letters in order</p>
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
        userInput={selectedLetters}
        mode="choose"
        currentIndex={currentIndex}
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

      {/* Phonics Help (shown after errors) */}
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
              disabled={
                isCooldown ||
                (selectedLetters.includes(letter) &&
                  word.word.split('').filter((l) => l === letter).length <=
                    selectedLetters.filter((l) => l === letter).length)
              }
              selected={selectedLetters.includes(letter)}
              incorrect={incorrectLetter === letter}
              size="md"
            />
          ))}
        </div>
      )}

      {/* Skip Button */}
      <button
        onClick={onSkip}
        className="text-gray-400 hover:text-gray-600 underline text-sm mt-2"
      >
        跳過
      </button>
    </div>
  );
}
