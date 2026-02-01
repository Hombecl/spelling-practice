'use client';

import Image from 'next/image';
import { PetState, PetStage, PetMood, getPetMood, PET_STAGE_NAMES_ZH } from '@/lib/progress';

// Custom SVG pet images for each evolution stage
// All stages are the same dragon character, growing from egg to adult
const PET_IMAGES: Record<PetStage, string> = {
  egg: '/pet/egg.svg',
  baby: '/pet/baby.svg',
  child: '/pet/child.svg',
  teen: '/pet/teen.svg',
  adult: '/pet/adult.svg',
};

// Fallback cute emojis if images fail to load
const FALLBACK_EMOJIS: Record<PetStage, string> = {
  egg: '🥚',
  baby: '🐣',
  child: '🦎',
  teen: '🐲',
  adult: '🐉',
};

// Mood-based animations
const MOOD_STYLES: Record<PetMood, string> = {
  happy: 'animate-bounce-gentle',
  content: 'animate-sway',
  hungry: 'animate-droop opacity-70',
  sleepy: 'animate-zzz opacity-50',
};

interface PetDisplayProps {
  pet: PetState;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
  showMood?: boolean;
  onClick?: () => void;
}

export default function PetDisplay({
  pet,
  size = 'medium',
  showName = true,
  showMood = true,
  onClick,
}: PetDisplayProps) {
  const mood = getPetMood(pet.happiness, pet.lastFedDate);

  // Size configurations
  const sizeConfig = {
    small: { container: 'w-16 h-16', imageSize: 56, emoji: 'text-4xl', name: 'text-xs' },
    medium: { container: 'w-32 h-32', imageSize: 112, emoji: 'text-7xl', name: 'text-sm' },
    large: { container: 'w-48 h-48', imageSize: 168, emoji: 'text-9xl', name: 'text-lg' },
  };

  const config = sizeConfig[size];

  // Mood indicator emoji
  const moodEmoji = {
    happy: '😊',
    content: '😌',
    hungry: '😢',
    sleepy: '😴',
  };

  const moodText = {
    happy: '好開心！',
    content: '普通',
    hungry: '肚餓...',
    sleepy: '好攰...',
  };

  return (
    <div
      className={`
        flex flex-col items-center gap-2
        ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''}
      `}
      onClick={onClick}
    >
      {/* Pet Image Container */}
      <div
        className={`
          ${config.container}
          relative flex items-center justify-center
          rounded-full
          bg-gradient-to-b from-blue-100 to-purple-100
          shadow-lg
          ${mood === 'happy' ? 'ring-4 ring-yellow-300 ring-opacity-50' : ''}
          ${mood === 'hungry' || mood === 'sleepy' ? 'grayscale-[30%]' : ''}
        `}
      >
        {/* Pet SVG Image with mood animation */}
        <div className={`${config.container} ${MOOD_STYLES[mood]} p-2`}>
          <Image
            src={PET_IMAGES[pet.stage]}
            alt={`${pet.name} - ${PET_STAGE_NAMES_ZH[pet.stage]}`}
            width={config.imageSize}
            height={config.imageSize}
            className="w-full h-full object-contain drop-shadow-md"
            priority
            onError={(e) => {
              // Fallback to emoji if image fails
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const emoji = document.createElement('span');
                emoji.className = `${config.emoji}`;
                emoji.textContent = FALLBACK_EMOJIS[pet.stage];
                parent.appendChild(emoji);
              }
            }}
          />
        </div>

        {/* Happiness Hearts */}
        {showMood && pet.happiness >= 70 && (
          <div className="absolute -top-2 -right-2">
            <span className="text-red-500 animate-pulse">❤️</span>
          </div>
        )}

        {/* Hungry/Sleepy indicator */}
        {showMood && (mood === 'hungry' || mood === 'sleepy') && (
          <div className="absolute -top-2 -right-2">
            <span className="animate-bounce">{mood === 'hungry' ? '🍖' : '💤'}</span>
          </div>
        )}
      </div>

      {/* Pet Name */}
      {showName && (
        <div className="text-center">
          <div className={`${config.name} font-bold text-gray-800`}>
            {pet.name}
          </div>
          <div className="text-xs text-gray-500">
            Lv.{pet.level} {PET_STAGE_NAMES_ZH[pet.stage]}
          </div>
        </div>
      )}

      {/* Mood indicator */}
      {showMood && size !== 'small' && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>{moodEmoji[mood]}</span>
          <span>{moodText[mood]}</span>
        </div>
      )}
    </div>
  );
}
