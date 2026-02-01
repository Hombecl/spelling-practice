'use client';

import { useState, useEffect, useCallback } from 'react';
import { Word, shuffleArray } from '@/lib/words';
import { speakEncouragement, speakTryAgain, speakWord } from '@/lib/speech';
import { speakPhonicsHint, getPhonicsHintForPosition, getSyllables } from '@/lib/phonics';
import LetterButton from '@/components/LetterButton';
import SpeakButton from '@/components/SpeakButton';
import StarBurst from '@/components/StarBurst';
import WordImage from '@/components/WordImage';
import PhonicsDisplay from '@/components/PhonicsDisplay';

interface FillModeProps {
  word: Word;
  onComplete: (correct: boolean, attempts: number) => void;
  onSkip: () => void;
  hintLetters?: number[]; // Indices of letters revealed by peek skill
}

const MAX_ERRORS = 3;
const COOLDOWN_MS = 2000;

export default function FillMode({ word, onComplete, onSkip, hintLetters = [] }: FillModeProps) {
  const [userInput, setUserInput] = useState<string[]>([]);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [incorrectLetter, setIncorrectLetter] = useState<string | null>(null);
  const [isCooldown, setIsCooldown] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showPhonics, setShowPhonics] = useState(false);
  const [currentHint, setCurrentHint] = useState<{ syllable: string; syllableIndex: number } | null>(null);

  // Reveal some letters based on word length
  const generateRevealedIndices = useCallback(() => {
    const wordLength = word.word.length;
    // Hide more letters for longer words
    const numToHide = Math.min(3, Math.max(1, Math.ceil(wordLength / 2)));
    const indices = Array.from({ length: wordLength }, (_, i) => i);
    const hidden = shuffleArray(indices).slice(0, numToHide);
    return indices.filter((i) => !hidden.includes(i)).sort((a, b) => a - b);
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

  // Find first hidden index
  const findFirstHiddenIndex = useCallback((revealed: number[], input: string[]) => {
    for (let i = 0; i < word.word.length; i++) {
      if (!revealed.includes(i) && !input[i]) {
        return i;
      }
    }
    return -1;
  }, [word.word.length]);

  // Reset the current word
  const resetWord = useCallback(() => {
    const revealed = generateRevealedIndices();
    setRevealedIndices(revealed);
    const newInput = new Array(word.word.length).fill('');
    setUserInput(newInput);
    setCurrentIndex(findFirstHiddenIndex(revealed, newInput));
    setErrors(0);
    setShowReset(false);
    setIncorrectLetter(null);
    setIsCooldown(false);

    const hiddenIndices = Array.from({ length: word.word.length }, (_, i) => i).filter(
      (i) => !revealed.includes(i)
    );
    setAvailableLetters(generateLetters(hiddenIndices));
    speakWord(word.word);
  }, [word, generateRevealedIndices, generateLetters, findFirstHiddenIndex]);

  useEffect(() => {
    const revealed = generateRevealedIndices();
    setRevealedIndices(revealed);
    const newInput = new Array(word.word.length).fill('');
    setUserInput(newInput);
    setCurrentIndex(findFirstHiddenIndex(revealed, newInput));
    setAttempts(0);
    setErrors(0);
    setShowSuccess(false);
    setIncorrectLetter(null);
    setIsCooldown(false);
    setShowReset(false);
    setShowPhonics(false);

    const hiddenIndices = Array.from({ length: word.word.length }, (_, i) => i).filter(
      (i) => !revealed.includes(i)
    );
    setAvailableLetters(generateLetters(hiddenIndices));
  }, [word, generateRevealedIndices, generateLetters, findFirstHiddenIndex]);

  const handleLetterClick = (letter: string) => {
    if (isCooldown || showReset || showSuccess || currentIndex === -1) return;

    const expectedLetter = word.word[currentIndex];

    if (letter.toLowerCase() === expectedLetter.toLowerCase()) {
      // Correct letter
      const newInput = [...userInput];
      newInput[currentIndex] = letter;
      setUserInput(newInput);

      // Find next hidden index
      const nextIndex = findFirstHiddenIndex(revealedIndices, newInput);

      if (nextIndex === -1) {
        // Word complete!
        setShowSuccess(true);
        speakEncouragement();
        setTimeout(() => {
          onComplete(true, attempts + 1);
        }, 1500);
      } else {
        setCurrentIndex(nextIndex);
      }
      setIncorrectLetter(null);
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

  // Phonics-based hint: speak the syllable sound instead of the letter
  const handleHint = async () => {
    if (currentIndex >= 0) {
      const hint = getPhonicsHintForPosition(word.word, currentIndex);
      if (hint) {
        setCurrentHint({ syllable: hint.syllable, syllableIndex: hint.syllableIndex });
        await speakPhonicsHint(word.word, currentIndex);
        // Clear hint highlight after 2 seconds
        setTimeout(() => setCurrentHint(null), 2000);
      }
    }
  };

  // Build display with revealed, user input, and hint letters
  const displayLetters = word.word.split('').map((letter, index) => {
    if (revealedIndices.includes(index)) {
      return { letter, status: 'revealed' as const };
    }
    // Check if this letter was revealed by peek skill
    if (hintLetters.includes(index)) {
      return { letter, status: 'hint' as const };
    }
    if (userInput[index]) {
      return { letter: userInput[index], status: 'filled' as const };
    }
    if (index === currentIndex) {
      return { letter: '_', status: 'current' as const };
    }
    return { letter: '_', status: 'empty' as const };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-5 p-2 sm:p-4">
      <StarBurst show={showSuccess} count={5} />

      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-700 mb-1">
          ✏️ 填充練習
        </h2>
        <p className="text-sm text-gray-500">聽讀音，填返漏咗嘅字母</p>
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
      <div className="flex gap-2 sm:gap-3 justify-center items-center flex-wrap">
        {displayLetters.map((item, index) => (
          <div
            key={index}
            className={`
              w-12 h-14 sm:w-14 sm:h-16
              rounded-xl border-3
              flex items-center justify-center
              text-2xl sm:text-3xl font-bold
              transition-all duration-200
              ${
                item.status === 'revealed'
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : item.status === 'hint'
                  ? 'bg-purple-100 border-purple-400 text-purple-700 ring-2 ring-purple-300'
                  : item.status === 'filled'
                  ? 'bg-green-100 border-green-400 text-green-700'
                  : item.status === 'current'
                  ? 'bg-yellow-100 border-yellow-400 text-yellow-700 animate-pulse'
                  : 'bg-gray-100 border-gray-300 text-gray-400'
              }
            `}
          >
            {item.letter.toUpperCase()}
          </div>
        ))}
      </div>

      {/* Syllable Display for Phonics Hints */}
      {!showReset && currentIndex >= 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">
            填第 {currentIndex + 1} 個字母
          </p>
          {/* Show syllables with current one highlighted */}
          <div className="flex gap-2 justify-center items-center flex-wrap">
            {getSyllables(word.word).map((syllable, idx) => (
              <span
                key={idx}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
                  currentHint?.syllableIndex === idx
                    ? 'bg-purple-500 text-white scale-110 ring-2 ring-purple-300'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {syllable}
              </span>
            ))}
          </div>
          {currentHint && (
            <p className="text-purple-600 text-sm mt-2 animate-pulse">
              🔊 聽：「{currentHint.syllable}」
            </p>
          )}
        </div>
      )}

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
              incorrect={incorrectLetter === letter}
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
