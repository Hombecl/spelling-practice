'use client';

import { useState, useEffect, useCallback } from 'react';
import { Word, shuffleArray } from '@/lib/words';
import { speakEncouragement, speakTryAgain, speakLetter } from '@/lib/speech';
import LetterButton from '@/components/LetterButton';
import SpeakButton from '@/components/SpeakButton';
import WordDisplay from '@/components/WordDisplay';
import StarBurst from '@/components/StarBurst';

interface FillModeProps {
  word: Word;
  onComplete: (correct: boolean, attempts: number) => void;
  onSkip: () => void;
}

export default function FillMode({ word, onComplete, onSkip }: FillModeProps) {
  const [userInput, setUserInput] = useState<string[]>([]);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [incorrectIndex, setIncorrectIndex] = useState(-1);

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
    setShowSuccess(false);
    setIncorrectIndex(-1);

    const hiddenIndices = Array.from({ length: word.word.length }, (_, i) => i).filter(
      (i) => !revealed.includes(i)
    );
    setAvailableLetters(generateLetters(hiddenIndices));
  }, [word, generateRevealedIndices, generateLetters]);

  const handleLetterClick = (letter: string) => {
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
      setAttempts(attempts + 1);
      setIncorrectIndex(currentIndex);
      speakTryAgain();

      setTimeout(() => {
        setIncorrectIndex(-1);
      }, 500);
    }
  };

  const handleHint = () => {
    const letter = word.word[currentIndex];
    speakLetter(letter);
  };

  const revealedLetters = word.word.split('').map((_, i) => revealedIndices.includes(i));

  return (
    <div className="flex flex-col items-center gap-8 p-4">
      <StarBurst show={showSuccess} count={5} />

      {/* Instructions */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-2">
          填返啲漏咗嘅字母！
        </h2>
        <p className="text-gray-500">Fill in the missing letters</p>
      </div>

      {/* Speak Button */}
      <SpeakButton word={word.word} size="lg" label="聽讀音 Listen" />

      {/* Word Display */}
      <WordDisplay
        word={word.word}
        revealedLetters={revealedLetters}
        userInput={userInput}
        mode="fill"
        currentIndex={currentIndex}
        incorrectIndex={incorrectIndex}
      />

      {/* Letter Choices */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-w-md">
        {availableLetters.map((letter, index) => (
          <LetterButton
            key={`${letter}-${index}`}
            letter={letter}
            onClick={handleLetterClick}
            size="md"
          />
        ))}
      </div>

      {/* Hint and Skip Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleHint}
          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
        >
          💡 提示 Hint
        </button>
        <button
          onClick={onSkip}
          className="text-gray-400 hover:text-gray-600 underline text-sm"
        >
          跳過 Skip
        </button>
      </div>
    </div>
  );
}
