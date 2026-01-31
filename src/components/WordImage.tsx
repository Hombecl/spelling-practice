'use client';

import { useState } from 'react';
import { getImageForWord, hasCuratedImage } from '@/lib/images';

interface WordImageProps {
  word: string;
  size?: 'sm' | 'md' | 'lg';
  showWord?: boolean;
}

export default function WordImage({ word, size = 'md', showWord = false }: WordImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const imageUrl = getImageForWord(word);
  const hasCurated = hasCuratedImage(word);

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
  };

  if (!imageUrl || imageError) {
    // Fallback: show emoji or first letter
    return (
      <div
        className={`
          ${sizeClasses[size]}
          bg-gradient-to-br from-blue-100 to-purple-100
          rounded-2xl flex items-center justify-center
          border-4 border-white shadow-lg
        `}
      >
        <span className="text-4xl">📝</span>
        {showWord && (
          <span className="absolute bottom-2 text-sm font-bold text-gray-600">
            {word}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className={`
          ${sizeClasses[size]}
          rounded-2xl overflow-hidden
          border-4 border-white shadow-lg
          bg-gray-100
        `}
      >
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-pulse text-2xl">🖼️</div>
          </div>
        )}
        <img
          src={imageUrl}
          alt={word}
          className={`
            w-full h-full object-cover
            transition-opacity duration-300
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          loading="eager"
        />
      </div>
      {showWord && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md">
          <span className="text-sm font-bold text-gray-700">{word}</span>
        </div>
      )}
      {hasCurated && (
        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
          ✓
        </div>
      )}
    </div>
  );
}
