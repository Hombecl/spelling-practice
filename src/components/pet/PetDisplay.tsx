'use client';

import Image from 'next/image';
import { PetState, PetStage, PetMood, PetSpecies, getPetMood, getPetStageName, getPetSvgPath, PET_SPECIES } from '@/lib/pet';

// Fallback emoji by species and stage
const FALLBACK_EMOJIS: Record<PetSpecies, Record<PetStage, string>> = {
  slime: { egg: '🥚', baby: '🟢', child: '🟩', teen: '💚', adult: '👑' },
  unicorn: { egg: '🥚', baby: '🦄', child: '🌸', teen: '💜', adult: '🪽' },
  dog: { egg: '🥚', baby: '🐕', child: '🐕‍🦺', teen: '🐺', adult: '🔥' },
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

// Background glow colors by species
const SPECIES_GLOW_COLORS: Record<PetSpecies, Record<PetStage, string>> = {
  slime: {
    egg: 'from-green-100 to-emerald-100',
    baby: 'from-green-100 to-emerald-100',
    child: 'from-green-100 to-emerald-100',
    teen: 'from-green-100 to-emerald-100',
    adult: 'from-green-200 to-yellow-100',
  },
  unicorn: {
    egg: 'from-pink-100 to-purple-100',
    baby: 'from-pink-100 to-purple-100',
    child: 'from-pink-100 to-purple-100',
    teen: 'from-purple-100 to-violet-100',
    adult: 'from-purple-200 to-pink-100',
  },
  dog: {
    egg: 'from-amber-100 to-orange-100',
    baby: 'from-amber-100 to-orange-100',
    child: 'from-amber-100 to-orange-100',
    teen: 'from-orange-100 to-red-100',
    adult: 'from-orange-200 to-red-100',
  },
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
  const species = pet.species || 'slime'; // Default to slime for backward compatibility

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

  // Get glow color based on species
  const glowColor = SPECIES_GLOW_COLORS[species]?.[pet.stage] || 'from-gray-100 to-gray-100';

  // Get pet image path
  const imagePath = getPetSvgPath(species, pet.stage);

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
          bg-gradient-to-b ${glowColor}
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
            src={imagePath}
            alt={`${pet.name} - ${getPetStageName(species, pet.stage)}`}
            width={config.imageSize}
            height={config.imageSize}
            className="w-full h-full object-contain pixel-art"
            style={{
              imageRendering: 'pixelated',
            }}
            priority
            onError={(e) => {
              // Fallback to emoji
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const emoji = document.createElement('span');
                emoji.className = `${config.emoji}`;
                emoji.textContent = FALLBACK_EMOJIS[species]?.[pet.stage] || '🥚';
                parent.appendChild(emoji);
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

        {/* Sparkle effects for adult stage */}
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
            Lv.{pet.level} {getPetStageName(species, pet.stage)}
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
