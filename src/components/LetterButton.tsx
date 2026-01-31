'use client';

import { speakLetter } from '@/lib/speech';

interface LetterButtonProps {
  letter: string;
  onClick: (letter: string) => void;
  disabled?: boolean;
  selected?: boolean;
  correct?: boolean;
  incorrect?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function LetterButton({
  letter,
  onClick,
  disabled = false,
  selected = false,
  correct = false,
  incorrect = false,
  size = 'md',
}: LetterButtonProps) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl',
  };

  const baseClasses = `
    ${sizeClasses[size]}
    font-bold rounded-2xl
    transition-all duration-200
    flex items-center justify-center
    shadow-lg
    select-none
    focus:outline-none focus:ring-4 focus:ring-blue-300
  `;

  const stateClasses = correct
    ? 'bg-green-400 text-white border-4 border-green-600 scale-110'
    : incorrect
    ? 'bg-red-400 text-white border-4 border-red-600 animate-shake'
    : selected
    ? 'bg-blue-500 text-white border-4 border-blue-700'
    : disabled
    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
    : 'bg-yellow-300 text-gray-800 border-4 border-yellow-500 hover:bg-yellow-400 hover:scale-105 active:scale-95';

  const handleClick = () => {
    if (!disabled) {
      speakLetter(letter);
      onClick(letter);
    }
  };

  return (
    <button
      className={`${baseClasses} ${stateClasses}`}
      onClick={handleClick}
      disabled={disabled}
      aria-label={`Letter ${letter}`}
    >
      {letter.toUpperCase()}
    </button>
  );
}
