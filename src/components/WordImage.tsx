'use client';

import { useState, useEffect, useRef } from 'react';
import { getImageForWord, hasCuratedImage, getWordEmoji, fetchPexelsImage } from '@/lib/images';

interface WordImageProps {
  word: string;
  size?: 'sm' | 'md' | 'lg';
  showWord?: boolean;
  preferEmoji?: boolean; // If true, show emoji even if image exists
}

export default function WordImage({
  word,
  size = 'md',
  showWord = false,
  preferEmoji = false,
}: WordImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [pexelsUrl, setPexelsUrl] = useState<string | null>(null);
  const [pexelsLoading, setPexelsLoading] = useState(true);
  const [pexelsFetched, setPexelsFetched] = useState(false);
  const currentWordRef = useRef(word);

  // Fetch Pexels image when word changes
  useEffect(() => {
    // Track current word to prevent stale updates
    currentWordRef.current = word;

    // Reset all states for new word
    setImageError(false);
    setImageLoaded(false);
    setPexelsUrl(null);
    setPexelsFetched(false);

    // Skip Pexels if preferEmoji is set
    if (preferEmoji) {
      setPexelsLoading(false);
      setPexelsFetched(true);
      return;
    }

    setPexelsLoading(true);

    fetchPexelsImage(word)
      .then((url) => {
        // Only update if this is still the current word
        if (currentWordRef.current === word) {
          setPexelsUrl(url);
          setPexelsLoading(false);
          setPexelsFetched(true);
        }
      })
      .catch(() => {
        if (currentWordRef.current === word) {
          setPexelsLoading(false);
          setPexelsFetched(true);
        }
      });
  }, [word, preferEmoji]);

  const hasCurated = hasCuratedImage(word);
  const emoji = getWordEmoji(word);

  // Priority: Pexels → Curated → null (will use emoji or letter fallback)
  const imageUrl = pexelsUrl || (hasCurated ? getImageForWord(word) : null);

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
  };

  const emojiSizes = {
    sm: 'text-4xl',
    md: 'text-6xl',
    lg: 'text-8xl',
  };

  // Show emoji if: preferEmoji is true, or (no image available after fetch and has emoji), or image errored
  const shouldShowEmoji = preferEmoji || (pexelsFetched && !imageUrl && emoji) || (imageError && emoji);

  if (shouldShowEmoji && emoji) {
    return (
      <div className="relative">
        <div
          className={`
            ${sizeClasses[size]}
            bg-gradient-to-br from-blue-50 to-purple-50
            rounded-2xl flex items-center justify-center
            border-4 border-white shadow-lg
          `}
        >
          <span className={emojiSizes[size]}>{emoji}</span>
        </div>
        {showWord && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md">
            <span className="text-sm font-bold text-gray-700">{word}</span>
          </div>
        )}
      </div>
    );
  }

  // Loading state - only show briefly while fetching
  if (pexelsLoading && !pexelsFetched) {
    return (
      <div className="relative">
        <div
          className={`
            ${sizeClasses[size]}
            bg-gray-100 rounded-2xl flex items-center justify-center
            border-4 border-white shadow-lg
          `}
        >
          <div className="animate-pulse text-2xl">🖼️</div>
        </div>
      </div>
    );
  }

  // No image available - show letter fallback
  if (!imageUrl || (imageError && !emoji)) {
    const colors = [
      'from-red-200 to-red-300',
      'from-blue-200 to-blue-300',
      'from-green-200 to-green-300',
      'from-yellow-200 to-yellow-300',
      'from-purple-200 to-purple-300',
      'from-pink-200 to-pink-300',
    ];
    const colorIndex = word.charCodeAt(0) % colors.length;

    return (
      <div className="relative">
        <div
          className={`
            ${sizeClasses[size]}
            bg-gradient-to-br ${colors[colorIndex]}
            rounded-2xl flex items-center justify-center
            border-4 border-white shadow-lg
          `}
        >
          <span className={`${emojiSizes[size]} font-bold text-gray-700`}>
            {word[0]?.toUpperCase() || '?'}
          </span>
        </div>
        {showWord && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md">
            <span className="text-sm font-bold text-gray-700">{word}</span>
          </div>
        )}
      </div>
    );
  }

  // Show image
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
      {/* Show source indicator */}
      {pexelsUrl && (
        <div className="absolute -top-1 -right-1 text-white text-xs px-2 py-0.5 rounded-full bg-blue-500">
          📷
        </div>
      )}
    </div>
  );
}
