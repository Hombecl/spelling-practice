'use client';

import { useState, useEffect, useRef } from 'react';
import { Word } from '@/lib/words';
import { speakEncouragement, speakTryAgain, speakSpelling } from '@/lib/speech';
import SpeakButton from '@/components/SpeakButton';
import WordDisplay from '@/components/WordDisplay';
import StarBurst from '@/components/StarBurst';

interface SpellModeProps {
  word: Word;
  onComplete: (correct: boolean, attempts: number) => void;
  onSkip: () => void;
}

export default function SpellMode({ word, onComplete, onSkip }: SpellModeProps) {
  const [userInput, setUserInput] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [incorrectIndex, setIncorrectIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUserInput([]);
    setCurrentIndex(0);
    setAttempts(0);
    setShowSuccess(false);
    setIncorrectIndex(-1);
    // Focus the hidden input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [word]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuccess) return;

    const key = e.key.toLowerCase();

    // Handle backspace
    if (key === 'backspace') {
      if (currentIndex > 0) {
        const newInput = [...userInput];
        newInput.pop();
        setUserInput(newInput);
        setCurrentIndex(currentIndex - 1);
        setIncorrectIndex(-1);
      }
      return;
    }

    // Only accept letters
    if (!/^[a-z]$/.test(key)) return;

    const expectedLetter = word.word[currentIndex];

    if (key === expectedLetter.toLowerCase()) {
      // Correct letter
      const newInput = [...userInput, key];
      setUserInput(newInput);
      setCurrentIndex(currentIndex + 1);
      setIncorrectIndex(-1);

      if (newInput.length === word.word.length) {
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
      setIncorrectIndex(currentIndex);
      speakTryAgain();

      // Show the wrong letter briefly
      const newInput = [...userInput, key];
      setUserInput(newInput);

      setTimeout(() => {
        setUserInput(userInput);
        setIncorrectIndex(-1);
      }, 500);
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const handleSpellingHint = () => {
    speakSpelling(word.word);
  };

  const revealedLetters = word.word.split('').map(() => false);

  return (
    <div
      className="flex flex-col items-center gap-8 p-4 min-h-[60vh]"
      onClick={handleContainerClick}
    >
      <StarBurst show={showSuccess} count={7} />

      {/* Hidden input for keyboard capture */}
      <input
        ref={inputRef}
        type="text"
        className="sr-only"
        onKeyDown={handleKeyPress}
        autoFocus
        aria-label="Type the word"
      />

      {/* Instructions */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-2">
          聽讀音，串出成個字！
        </h2>
        <p className="text-gray-500">Listen and spell the whole word</p>
      </div>

      {/* Speak Button */}
      <SpeakButton word={word.word} size="lg" label="聽讀音 Listen" />

      {/* Word Display */}
      <WordDisplay
        word={word.word}
        revealedLetters={revealedLetters}
        userInput={userInput}
        mode="spell"
        currentIndex={currentIndex}
        incorrectIndex={incorrectIndex}
      />

      {/* Keyboard hint for mobile */}
      <div className="text-center text-gray-500">
        <p className="text-lg">⌨️ 用鍵盤打字 Type with keyboard</p>
        <p className="text-sm mt-2">點擊畫面，然後打字</p>
        <p className="text-sm">Click here, then type</p>
      </div>

      {/* On-screen keyboard for mobile */}
      <div className="grid grid-cols-10 gap-1 max-w-lg">
        {['q','w','e','r','t','y','u','i','o','p'].map((letter) => (
          <button
            key={letter}
            onClick={() => {
              const event = { key: letter, preventDefault: () => {} } as React.KeyboardEvent<HTMLInputElement>;
              handleKeyPress(event);
            }}
            className="w-8 h-10 sm:w-10 sm:h-12 bg-gray-200 hover:bg-gray-300 rounded text-sm sm:text-lg font-bold uppercase"
          >
            {letter}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-9 gap-1 max-w-lg">
        {['a','s','d','f','g','h','j','k','l'].map((letter) => (
          <button
            key={letter}
            onClick={() => {
              const event = { key: letter, preventDefault: () => {} } as React.KeyboardEvent<HTMLInputElement>;
              handleKeyPress(event);
            }}
            className="w-8 h-10 sm:w-10 sm:h-12 bg-gray-200 hover:bg-gray-300 rounded text-sm sm:text-lg font-bold uppercase"
          >
            {letter}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-9 gap-1 max-w-lg">
        <button
          onClick={() => {
            const event = { key: 'backspace', preventDefault: () => {} } as unknown as React.KeyboardEvent<HTMLInputElement>;
            handleKeyPress(event);
          }}
          className="w-8 h-10 sm:w-10 sm:h-12 bg-red-200 hover:bg-red-300 rounded text-xs sm:text-sm font-bold col-span-2"
        >
          ⌫
        </button>
        {['z','x','c','v','b','n','m'].map((letter) => (
          <button
            key={letter}
            onClick={() => {
              const event = { key: letter, preventDefault: () => {} } as React.KeyboardEvent<HTMLInputElement>;
              handleKeyPress(event);
            }}
            className="w-8 h-10 sm:w-10 sm:h-12 bg-gray-200 hover:bg-gray-300 rounded text-sm sm:text-lg font-bold uppercase"
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Hint and Skip Buttons */}
      <div className="flex gap-4 mt-4">
        <button
          onClick={handleSpellingHint}
          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
        >
          🔤 聽拼法 Hear spelling
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
