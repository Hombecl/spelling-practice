'use client';

import Image from 'next/image';
import { PetState, PetStage, PetMood, getPetMood, PET_STAGE_NAMES_ZH } from '@/lib/progress';

// Pixel art SVG images for each evolution stage
const PET_IMAGES: Record<PetStage, string> = {
  egg: '/pet/pixel-egg.svg',
  baby: '/pet/pixel-baby.svg',
  child: '/pet/pixel-child.svg',
  teen: '/pet/pixel-teen.svg',
  adult: '/pet/pixel-adult.svg',
};

// Fallback to original SVGs if pixel versions fail
const FALLBACK_IMAGES: Record<PetStage, string> = {
  egg: '/pet/egg.svg',
  baby: '/pet/baby.svg',
  child: '/pet/child.svg',
  teen: '/pet/teen.svg',
  adult: '/pet/adult.svg',
};

// Last resort emoji fallbacks
const FALLBACK_EMOJIS: Record<PetStage, string> = {
  egg: '🥚',
  baby: '🐣',
  child: '🦎',
  teen: '🐲',
  adult: '🐉',
};

// Pixel art stage-specific animation classes
const STAGE_ANIMATIONS: Record<PetStage, string> = {
  egg: 'pet-egg',
  baby: 'pet-baby',
  child: 'pet-child',
  teen: 'pet-teen',
  adult: 'pet-adult',
};

// Mood-based animation overrides
const MOOD_ANIMATIONS: Record<PetMood, string> = {
  happy: 'animate-pixel-bounce',
  content: 'animate-pixel-idle',
  hungry: 'animate-pixel-hungry',
  sleepy: 'animate-pixel-sleepy',
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

  // Size configurations - larger for pixel art visibility
  const sizeConfig = {
    small: { container: 'w-20 h-20', imageSize: 64, emoji: 'text-4xl', name: 'text-xs' },
    medium: { container: 'w-36 h-36', imageSize: 128, emoji: 'text-7xl', name: 'text-sm' },
    large: { container: 'w-52 h-52', imageSize: 192, emoji: 'text-9xl', name: 'text-lg' },
  };

  const config = sizeConfig[size];

  // Mood indicator emoji
  const moodEmoji: Record<PetMood, string> = {
    happy: '😊',
    content: '😌',
    hungry: '😢',
    sleepy: '😴',
  };

  const moodText: Record<PetMood, string> = {
    happy: '好開心！',
    content: '普通',
    hungry: '肚餓...',
    sleepy: '好攰...',
  };

  // Get animation class based on mood
  const getAnimationClass = () => {
    if (mood === 'hungry' || mood === 'sleepy') {
      return MOOD_ANIMATIONS[mood];
    }
    if (mood === 'happy') {
      return MOOD_ANIMATIONS.happy;
    }
    return STAGE_ANIMATIONS[pet.stage];
  };

  // Background glow color based on stage
  const stageGlowColors: Record<PetStage, string> = {
    egg: 'from-purple-100 to-violet-100',
    baby: 'from-purple-100 to-pink-100',
    child: 'from-violet-100 to-purple-100',
    teen: 'from-purple-100 to-indigo-100',
    adult: 'from-purple-200 to-yellow-100',
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
          rounded-2xl
          bg-gradient-to-b ${stageGlowColors[pet.stage]}
          shadow-lg
          ${mood === 'happy' ? 'ring-4 ring-yellow-300/50' : ''}
          ${mood === 'hungry' || mood === 'sleepy' ? 'opacity-80' : ''}
          overflow-hidden
        `}
      >
        {/* Pixel grid background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '4px 4px',
          }}
        />

        {/* Pet Pixel Art Image with animations */}
        <div className={`${config.container} ${getAnimationClass()} p-2 pixel-art flex items-center justify-center`}>
          <Image
            src={PET_IMAGES[pet.stage]}
            alt={`${pet.name} - ${PET_STAGE_NAMES_ZH[pet.stage]}`}
            width={config.imageSize}
            height={config.imageSize}
            className="w-full h-full object-contain pixel-art"
            style={{
              imageRendering: 'pixelated',
            }}
            priority
            onError={(e) => {
              // Try fallback to original SVG first
              const target = e.target as HTMLImageElement;
              if (target.src.includes('pixel-')) {
                target.src = FALLBACK_IMAGES[pet.stage];
              } else {
                // Final fallback to emoji
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const emoji = document.createElement('span');
                  emoji.className = `${config.emoji}`;
                  emoji.textContent = FALLBACK_EMOJIS[pet.stage];
                  parent.appendChild(emoji);
                }
              }
            }}
          />
        </div>

        {/* Happiness Hearts */}
        {showMood && pet.happiness >= 70 && (
          <div className="absolute -top-1 -right-1">
            <span className="text-red-500 animate-pulse text-lg">❤️</span>
          </div>
        )}

        {/* Hungry/Sleepy indicator */}
        {showMood && (mood === 'hungry' || mood === 'sleepy') && (
          <div className="absolute -top-1 -right-1">
            <span className="animate-bounce text-lg">{mood === 'hungry' ? '🍖' : '💤'}</span>
          </div>
        )}

        {/* Sparkle effects for adult dragon */}
        {pet.stage === 'adult' && mood === 'happy' && (
          <>
            <div className="absolute top-2 left-2 text-yellow-400 animate-pixel-sparkle text-sm">✦</div>
            <div className="absolute bottom-2 right-2 text-yellow-400 animate-pixel-sparkle text-sm" style={{ animationDelay: '0.5s' }}>✦</div>
          </>
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
