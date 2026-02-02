'use client';

import { useState } from 'react';
import { speakWord } from '@/lib/speech';
import { hapticTap } from '@/lib/haptic';

interface SpeakButtonProps {
  word: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export default function SpeakButton({ word, size = 'lg', label }: SpeakButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-16 text-3xl',
    md: 'w-20 h-20 text-4xl',
    lg: 'w-28 h-28 text-5xl',
  };

  const handleClick = async () => {
    if (isPlaying) return;
    hapticTap();
    setIsPlaying(true);
    await speakWord(word);
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isPlaying}
        className={`
          ${sizeClasses[size]}
          bg-gradient-to-br from-blue-400 to-blue-600
          hover:from-blue-500 hover:to-blue-700
          text-white rounded-full
          shadow-xl hover:shadow-2xl
          transition-all duration-200
          flex items-center justify-center
          ${isPlaying ? 'animate-pulse scale-110' : 'hover:scale-105 active:scale-95'}
          focus:outline-none focus:ring-4 focus:ring-blue-300
        `}
        aria-label="Listen to the word"
      >
        {isPlaying ? '🔊' : '🔈'}
      </button>
      {label && (
        <span className="text-lg font-medium text-gray-600">{label}</span>
      )}
    </div>
  );
}
