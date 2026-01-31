'use client';

import { useState } from 'react';
import { getPhonicsBreakdown, getPronunciationGuide, speakPhonics } from '@/lib/phonics';

interface PhonicsDisplayProps {
  word: string;
  showBreakdown?: boolean;
}

export default function PhonicsDisplay({ word, showBreakdown = true }: PhonicsDisplayProps) {
  const [activeSound, setActiveSound] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const breakdown = getPhonicsBreakdown(word);
  const guide = getPronunciationGuide(word);

  const handlePlayPhonics = async () => {
    if (isPlaying) return;
    setIsPlaying(true);

    await speakPhonics(word, (index) => {
      setActiveSound(index);
    });

    setActiveSound(-1);
    setIsPlaying(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vowel':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'consonant':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'blend':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'silent':
        return 'bg-gray-100 text-gray-400 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'vowel':
        return '元音';
      case 'consonant':
        return '輔音';
      case 'blend':
        return '組合音';
      case 'silent':
        return '不發音';
      default:
        return '';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Phonics Sound Blocks */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {guide.map((item, index) => (
          <div
            key={index}
            className={`
              relative px-3 py-2 rounded-xl border-2 text-center transition-all duration-200
              ${getTypeColor(item.type)}
              ${activeSound === index ? 'scale-110 ring-4 ring-yellow-400' : ''}
            `}
          >
            <div className="text-2xl font-bold uppercase">{item.letter}</div>
            <div className="text-xs mt-1 opacity-70">{getTypeLabel(item.type)}</div>
          </div>
        ))}
      </div>

      {/* Play Phonics Button */}
      <button
        onClick={handlePlayPhonics}
        disabled={isPlaying}
        className={`
          w-full py-3 px-4 rounded-xl font-bold text-lg
          transition-all duration-200
          ${
            isPlaying
              ? 'bg-yellow-200 text-yellow-700'
              : 'bg-purple-500 text-white hover:bg-purple-600 active:scale-95'
          }
        `}
      >
        {isPlaying ? '🔊 播放中...' : '🔤 聽 Phonics 拆音'}
      </button>

      {/* Breakdown Info */}
      {showBreakdown && (
        <div className="mt-4 p-4 bg-white rounded-xl border-2 border-gray-200">
          {/* Syllables */}
          <div className="mb-3">
            <div className="text-sm font-bold text-gray-500 mb-1">音節 Syllables:</div>
            <div className="flex gap-2 flex-wrap">
              {breakdown.syllables.map((syllable, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold"
                >
                  {syllable}
                </span>
              ))}
            </div>
          </div>

          {/* Pattern */}
          <div className="mb-3">
            <div className="text-sm font-bold text-gray-500 mb-1">模式 Pattern:</div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {breakdown.pattern}
            </span>
          </div>

          {/* Blends */}
          {breakdown.blends.length > 0 && (
            <div>
              <div className="text-sm font-bold text-gray-500 mb-1">特別組合 Blends:</div>
              <div className="flex gap-2 flex-wrap">
                {breakdown.blends.map((blend, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-bold"
                  >
                    {blend}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-200 rounded"></span>
          <span className="text-gray-500">元音 Vowel</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-200 rounded"></span>
          <span className="text-gray-500">輔音 Consonant</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-purple-200 rounded"></span>
          <span className="text-gray-500">組合 Blend</span>
        </div>
      </div>
    </div>
  );
}
