'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Word } from '@/lib/words';
import { speakEncouragement, speakTryAgain, speakWord } from '@/lib/speech';
import { speakPhonicsHint, getPhonicsHintForPosition, getSyllables, speakSyllables } from '@/lib/phonics';
import { hapticTap, hapticSuccess, hapticError, hapticWarning } from '@/lib/haptic';
import SpeakButton from '@/components/SpeakButton';
import WordDisplay from '@/components/WordDisplay';
import StarBurst from '@/components/StarBurst';
import WordImage from '@/components/WordImage';
import PhonicsDisplay from '@/components/PhonicsDisplay';

interface SpellModeProps {
  word: Word;
  onComplete: (correct: boolean, attempts: number) => void;
  onSkip: () => void;
  hintLetters?: number[]; // Indices of letters revealed by peek skill
}

const MAX_ERRORS = 3;
const COOLDOWN_MS = 2000;

// Check if user prefers on-screen keyboard (saved in localStorage)
function getKeyboardPreference(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem('spellMode_useOnScreenKeyboard');
  // Default to on-screen for touch devices
  if (saved === null) {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
  return saved === 'true';
}

export default function SpellMode({ word, onComplete, onSkip, hintLetters = [] }: SpellModeProps) {
  const [userInput, setUserInput] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [incorrectIndex, setIncorrectIndex] = useState(-1);
  const [isCooldown, setIsCooldown] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showPhonics, setShowPhonics] = useState(false);
  const [currentHint, setCurrentHint] = useState<{ syllable: string; syllableIndex: number } | null>(null);
  const [activeSyllable, setActiveSyllable] = useState(-1);
  const [useOnScreenKeyboard, setUseOnScreenKeyboard] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load keyboard preference on mount
  useEffect(() => {
    setUseOnScreenKeyboard(getKeyboardPreference());
  }, []);

  // Toggle keyboard preference
  const toggleKeyboard = () => {
    const newValue = !useOnScreenKeyboard;
    setUseOnScreenKeyboard(newValue);
    localStorage.setItem('spellMode_useOnScreenKeyboard', String(newValue));
    // Focus the input for native keyboard
    if (!newValue) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Reset the current word
  const resetWord = useCallback(() => {
    setUserInput([]);
    setCurrentIndex(0);
    setErrors(0);
    setShowReset(false);
    setIncorrectIndex(-1);
    setIsCooldown(false);
    speakWord(word.word);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [word.word]);

  useEffect(() => {
    setUserInput([]);
    setCurrentIndex(0);
    setAttempts(0);
    setErrors(0);
    setShowSuccess(false);
    setIncorrectIndex(-1);
    setIsCooldown(false);
    setShowReset(false);
    setShowPhonics(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [word]);

  const handleKeyPress = (key: string) => {
    if (showSuccess || isCooldown || showReset) return;

    const keyLower = key.toLowerCase();

    // Handle backspace
    if (keyLower === 'backspace') {
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
    if (!/^[a-z]$/.test(keyLower)) return;

    const expectedLetter = word.word[currentIndex];

    if (keyLower === expectedLetter.toLowerCase()) {
      // Correct letter
      hapticTap();
      const newInput = [...userInput, keyLower];
      setUserInput(newInput);
      setCurrentIndex(currentIndex + 1);
      setIncorrectIndex(-1);

      if (newInput.length === word.word.length) {
        // Word complete!
        setShowSuccess(true);
        hapticSuccess();
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
      setIncorrectIndex(currentIndex);
      hapticError();
      speakTryAgain();

      // Show the wrong letter briefly
      const newInput = [...userInput, keyLower];
      setUserInput(newInput);

      // Start cooldown
      setIsCooldown(true);
      setTimeout(() => {
        setUserInput(userInput);
        setIncorrectIndex(-1);
        setIsCooldown(false);
      }, COOLDOWN_MS);

      // Check if max errors reached
      if (newErrors >= MAX_ERRORS) {
        hapticWarning();
        setShowReset(true);
        setShowPhonics(true);
      }
    }
  };

  const handleKeyboardEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleKeyPress(e.key);
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  // Phonics-based hint: speak the syllable sound for current position
  const handlePhonicsHint = async () => {
    const hint = getPhonicsHintForPosition(word.word, currentIndex);
    if (hint) {
      setCurrentHint({ syllable: hint.syllable, syllableIndex: hint.syllableIndex });
      await speakPhonicsHint(word.word, currentIndex);
      setTimeout(() => setCurrentHint(null), 2000);
    }
  };

  // Speak all syllables one by one
  const handleSyllablesHint = async () => {
    await speakSyllables(word.word, (index) => {
      setActiveSyllable(index);
    });
    setActiveSyllable(-1);
  };

  // Mark letters revealed by peek skill
  const revealedLetters = word.word.split('').map((_, i) => hintLetters.includes(i));

  return (
    <div
      className="flex flex-col items-center gap-3 sm:gap-4 p-2 sm:p-4"
      onClick={handleContainerClick}
    >
      <StarBurst show={showSuccess} count={7} />

      {/* Hidden input for keyboard capture */}
      <input
        ref={inputRef}
        type="text"
        className="sr-only"
        onKeyDown={handleKeyboardEvent}
        autoFocus
        aria-label="Type the word"
      />

      {/* Instructions */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-700 mb-1">
          🏆 完整串字
        </h2>
        <p className="text-sm text-gray-500">聽讀音，自己串出成個字</p>
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
        mode="spell"
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
          <PhonicsDisplay word={word.word} showBreakdown />
        </div>
      )}

      {/* Keyboard Toggle Button */}
      {!showReset && (
        <button
          onClick={toggleKeyboard}
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          aria-label={useOnScreenKeyboard ? '切換到實體鍵盤' : '切換到螢幕鍵盤'}
        >
          ⌨️ {useOnScreenKeyboard ? '用實體鍵盤' : '用螢幕鍵盤'}
        </button>
      )}

      {/* On-screen keyboard for mobile (collapsible) */}
      {!showReset && useOnScreenKeyboard && (
        <div className={`w-full max-w-sm ${isCooldown ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-10 gap-1 mb-1">
            {['q','w','e','r','t','y','u','i','o','p'].map((letter) => (
              <button
                key={letter}
                onClick={() => handleKeyPress(letter)}
                disabled={isCooldown}
                aria-label={`字母 ${letter.toUpperCase()}`}
                className="h-10 sm:h-11 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded text-sm sm:text-base font-bold uppercase transition-colors focus:ring-2 focus:ring-blue-400"
              >
                {letter}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-9 gap-1 mb-1 px-2">
            {['a','s','d','f','g','h','j','k','l'].map((letter) => (
              <button
                key={letter}
                onClick={() => handleKeyPress(letter)}
                disabled={isCooldown}
                aria-label={`字母 ${letter.toUpperCase()}`}
                className="h-10 sm:h-11 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded text-sm sm:text-base font-bold uppercase transition-colors focus:ring-2 focus:ring-blue-400"
              >
                {letter}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-9 gap-1 px-1">
            <button
              onClick={() => handleKeyPress('backspace')}
              disabled={isCooldown}
              aria-label="刪除"
              className="h-10 sm:h-11 bg-red-200 hover:bg-red-300 active:bg-red-400 rounded text-xs font-bold col-span-2 transition-colors focus:ring-2 focus:ring-red-400"
            >
              ⌫
            </button>
            {['z','x','c','v','b','n','m'].map((letter) => (
              <button
                key={letter}
                onClick={() => handleKeyPress(letter)}
                disabled={isCooldown}
                aria-label={`字母 ${letter.toUpperCase()}`}
                className="h-10 sm:h-11 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded text-sm sm:text-base font-bold uppercase transition-colors focus:ring-2 focus:ring-blue-400"
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Native keyboard hint when on-screen keyboard is hidden */}
      {!showReset && !useOnScreenKeyboard && (
        <div className="text-center text-gray-500 text-sm p-4 bg-gray-50 rounded-lg">
          <p>⌨️ 用鍵盤打字</p>
          <p className="text-xs text-gray-400 mt-1">撳上面嘅框框開始打字</p>
        </div>
      )}

      {/* Syllable Display with Hints */}
      {!showReset && (
        <div className="w-full max-w-md text-center">
          <div className="flex gap-2 justify-center items-center flex-wrap mb-2">
            {getSyllables(word.word).map((syllable, idx) => (
              <span
                key={idx}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
                  activeSyllable === idx
                    ? 'bg-yellow-400 text-yellow-900 scale-110'
                    : currentHint?.syllableIndex === idx
                    ? 'bg-purple-500 text-white scale-110 ring-2 ring-purple-300'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {syllable}
              </span>
            ))}
          </div>
          {currentHint && (
            <p className="text-purple-600 text-sm animate-pulse">
              🔊 聽：「{currentHint.syllable}」
            </p>
          )}
        </div>
      )}

      {/* Hint and Skip Buttons */}
      <div className="flex gap-3 mt-2 flex-wrap justify-center">
        <button
          onClick={handlePhonicsHint}
          disabled={showReset}
          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 active:scale-95 disabled:opacity-50"
        >
          💡 音節提示
        </button>
        <button
          onClick={handleSyllablesHint}
          disabled={showReset}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 active:scale-95 disabled:opacity-50"
        >
          🔊 聽音節
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
