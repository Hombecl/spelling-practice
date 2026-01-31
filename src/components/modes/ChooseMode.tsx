'use client';

import { useState, useEffect, useCallback } from 'react';
import { Word, shuffleArray } from '@/lib/words';
import { speakEncouragement, speakTryAgain } from '@/lib/speech';
import LetterButton from '@/components/LetterButton';
import SpeakButton from '@/components/SpeakButton';
import WordDisplay from '@/components/WordDisplay';
import StarBurst from '@/components/StarBurst';

interface ChooseModeProps {
  word: Word;
  onComplete: (correct: boolean, attempts: number) => void;
  onSkip: () => void;
}

export default function ChooseMode({ word, onComplete, onSkip }: ChooseModeProps) {
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [incorrectLetter, setIncorrectLetter] = useState<string | null>(null);

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

  useEffect(() => {
    setSelectedLetters([]);
    setCurrentIndex(0);
    setAttempts(0);
    setShowSuccess(false);
    setIncorrectLetter(null);
    setAvailableLetters(generateLetters());
  }, [word, generateLetters]);

  const handleLetterClick = (letter: string) => {
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
      setAttempts(attempts + 1);
      setIncorrectLetter(letter);
      speakTryAgain();

      setTimeout(() => {
        setIncorrectLetter(null);
      }, 500);
    }
  };

  const revealedLetters = word.word.split('').map((_, i) => i < currentIndex);

  return (
    <div className="flex flex-col items-center gap-8 p-4">
      <StarBurst show={showSuccess} count={5} />

      {/* Instructions */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-2">
          聽讀音，揀啱嘅字母！
        </h2>
        <p className="text-gray-500">Listen and choose the correct letters</p>
      </div>

      {/* Speak Button */}
      <SpeakButton word={word.word} size="lg" label="聽讀音 Listen" />

      {/* Word Display */}
      <WordDisplay
        word={word.word}
        revealedLetters={revealedLetters}
        userInput={selectedLetters}
        mode="choose"
        currentIndex={currentIndex}
      />

      {/* Letter Choices */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-w-md">
        {availableLetters.map((letter, index) => (
          <LetterButton
            key={`${letter}-${index}`}
            letter={letter}
            onClick={handleLetterClick}
            disabled={selectedLetters.includes(letter) && word.word.split('').filter(l => l === letter).length <= selectedLetters.filter(l => l === letter).length}
            selected={selectedLetters.includes(letter)}
            incorrect={incorrectLetter === letter}
            size="md"
          />
        ))}
      </div>

      {/* Skip Button */}
      <button
        onClick={onSkip}
        className="text-gray-400 hover:text-gray-600 underline text-sm mt-4"
      >
        跳過呢個字 Skip this word
      </button>
    </div>
  );
}
