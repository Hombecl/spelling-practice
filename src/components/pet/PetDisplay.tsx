'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  PetState,
  PetStage,
  PetMood,
  PetSpecies,
  EvolutionRoute,
  getPetMood,
  getPetStageName,
  getPetSvgPath,
  PET_SPECIES,
  isPixelPet,
} from '@/lib/pet';
import { hasSpriteSheet, getSpriteConfig } from '@/lib/spriteConfig';
import SpriteAnimation from './SpriteAnimation';

// Fallback emoji by species and stage
const FALLBACK_EMOJIS: Record<string, Record<PetStage, string>> = {
  // Legacy pets
  slime: { egg: '🥚', baby: '🟢', child: '🟩', teen: '💚', adult: '👑' },
  unicorn: { egg: '🥚', baby: '🦄', child: '🌸', teen: '💜', adult: '🪽' },
  dog: { egg: '🥚', baby: '🐕', child: '🐕‍🦺', teen: '🐺', adult: '🔥' },
  // New pixel pets
  pixel_unicorn: { egg: '🥚', baby: '🦄', child: '🌈', teen: '✨', adult: '🌟' },
  pixel_dragon: { egg: '🥚', baby: '🔥', child: '🐲', teen: '🌋', adult: '🐉' },
  pixel_ghost_cat: { egg: '🥚', baby: '👻', child: '🌙', teen: '🔮', adult: '🌕' },
  pixel_mecha_bird: { egg: '🥚', baby: '🐤', child: '✈️', teen: '🤖', adult: '🦅' },
  pixel_crystal_rabbit: { egg: '🥚', baby: '💎', child: '❄️', teen: '🌈', adult: '👑' },
};

// Pixel art stage-specific animation classes (base bounce/float)
const STAGE_ANIMATIONS: Record<PetStage, string> = {
  egg: 'pet-egg',
  baby: 'pet-baby',
  child: 'pet-child',
  teen: 'pet-teen',
  adult: 'pet-adult',
};

// 3D turn animations for depth effect
const TURN_ANIMATIONS = ['animate-look-around', 'animate-playful', 'animate-bounce-turn'];

// Mood-based animation overrides
const MOOD_ANIMATIONS: Record<PetMood, string> = {
  happy: 'animate-pixel-bounce',
  content: 'animate-pixel-idle',
  hungry: 'animate-pixel-hungry',
  sleepy: 'animate-pixel-sleepy',
};

// Background glow colors by species
const SPECIES_GLOW_COLORS: Record<string, Record<PetStage, string>> = {
  // Legacy pets
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
  // New pixel pets
  pixel_unicorn: {
    egg: 'from-pink-100 to-fuchsia-100',
    baby: 'from-pink-100 to-fuchsia-100',
    child: 'from-fuchsia-100 to-purple-100',
    teen: 'from-purple-100 to-violet-100',
    adult: 'from-violet-200 to-fuchsia-100',
  },
  pixel_dragon: {
    egg: 'from-red-100 to-orange-100',
    baby: 'from-red-100 to-orange-100',
    child: 'from-orange-100 to-amber-100',
    teen: 'from-red-100 to-rose-100',
    adult: 'from-red-200 to-orange-100',
  },
  pixel_ghost_cat: {
    egg: 'from-indigo-100 to-purple-100',
    baby: 'from-indigo-100 to-purple-100',
    child: 'from-violet-100 to-indigo-100',
    teen: 'from-indigo-100 to-blue-100',
    adult: 'from-indigo-200 to-violet-100',
  },
  pixel_mecha_bird: {
    egg: 'from-cyan-100 to-teal-100',
    baby: 'from-cyan-100 to-teal-100',
    child: 'from-teal-100 to-emerald-100',
    teen: 'from-cyan-100 to-sky-100',
    adult: 'from-cyan-200 to-teal-100',
  },
  pixel_crystal_rabbit: {
    egg: 'from-violet-100 to-purple-100',
    baby: 'from-violet-100 to-purple-100',
    child: 'from-purple-100 to-fuchsia-100',
    teen: 'from-violet-100 to-indigo-100',
    adult: 'from-violet-200 to-purple-100',
  },
};

// Element-based animation classes for pixel pets
const ELEMENT_ANIMATIONS: Record<string, string> = {
  magic: 'animate-balanced-rainbow',
  fire: 'animate-fire-flicker',
  shadow: 'animate-shadow-phase',
  tech: 'animate-tech-scan',
  ice: 'animate-ice-shimmer',
};

// Route-based animation modifiers
const ROUTE_ANIMATIONS: Record<EvolutionRoute, { idle: string; happy: string }> = {
  scholar: { idle: 'animate-scholar-glow', happy: 'animate-float' },
  balanced: { idle: 'animate-glow-float', happy: 'animate-balanced-rainbow' },
  speed: { idle: 'animate-fast-float', happy: 'animate-fast-sway' },
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

  // State for 3D turn animation
  const [turnAnimation, setTurnAnimation] = useState<string>('');

  // Randomly trigger 3D turn animations for more lifelike feel
  useEffect(() => {
    // Only animate when pet is happy or content (not hungry/sleepy)
    if (mood === 'hungry' || mood === 'sleepy') return;

    const triggerRandomTurn = () => {
      // Random chance to trigger a turn animation
      if (Math.random() < 0.4) { // 40% chance
        const randomAnim = TURN_ANIMATIONS[Math.floor(Math.random() * TURN_ANIMATIONS.length)];
        setTurnAnimation(randomAnim);

        // Clear after animation completes
        setTimeout(() => {
          setTurnAnimation('');
        }, 4000); // Match the longest animation duration
      }
    };

    // Trigger first animation after a short delay
    const initialTimer = setTimeout(triggerRandomTurn, 2000);

    // Set up interval for recurring animations
    const interval = setInterval(triggerRandomTurn, 6000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [mood]);

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

  // Get animation class based on mood, species, and evolution route
  const getAnimationClass = () => {
    // Mood overrides for all pets
    if (mood === 'hungry' || mood === 'sleepy') {
      return MOOD_ANIMATIONS[mood];
    }

    const speciesInfo = PET_SPECIES[species];

    // For pixel pets with evolution routes
    if (speciesInfo?.isPixelPet && pet.evolutionRoute && (pet.stage === 'teen' || pet.stage === 'adult')) {
      const routeAnim = ROUTE_ANIMATIONS[pet.evolutionRoute];
      if (mood === 'happy') {
        return routeAnim.happy;
      }
      return routeAnim.idle;
    }

    // For pixel pets without routes or at earlier stages
    if (speciesInfo?.isPixelPet && speciesInfo.element) {
      const elementAnim = ELEMENT_ANIMATIONS[speciesInfo.element];
      if (mood === 'happy') {
        return 'animate-pixel-bounce';
      }
      // Use element animation for adult/teen, stage animation for others
      if (pet.stage === 'teen' || pet.stage === 'adult') {
        return elementAnim || STAGE_ANIMATIONS[pet.stage];
      }
    }

    // Default behavior for legacy pets
    if (mood === 'happy') {
      return MOOD_ANIMATIONS.happy;
    }
    return STAGE_ANIMATIONS[pet.stage];
  };

  // Get glow color based on species
  const glowColor = SPECIES_GLOW_COLORS[species]?.[pet.stage] || 'from-gray-100 to-gray-100';

  // Get pet image path (include route for pixel pets at teen/adult stage)
  const imagePath = getPetSvgPath(species, pet.stage, pet.evolutionRoute);

  // Get element class for pixel pets
  const speciesInfo = PET_SPECIES[species];
  const elementClass = speciesInfo?.isPixelPet && speciesInfo?.element
    ? `element-${speciesInfo.element}`
    : '';
  const routeClass = pet.evolutionRoute ? `route-${pet.evolutionRoute}` : '';

  return (
    <div
      className={`
        flex flex-col items-center gap-2
        ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''}
      `}
      onClick={onClick}
    >
      {/* Pet Image Container with 3D perspective */}
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
          pet-3d-container
          ${elementClass}
          ${routeClass}
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

        {/* Pet Pixel Art Image with animations + 3D turn */}
        <div
          className={`
            ${config.container}
            ${getAnimationClass()}
            ${turnAnimation}
            p-2 pixel-art flex items-center justify-center
            transition-transform duration-300
          `}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Use SpriteAnimation for species with sprite sheets */}
          {hasSpriteSheet(species) ? (
            (() => {
              const spriteConfig = getSpriteConfig(species, pet.stage);
              if (spriteConfig) {
                // Calculate scale based on container size
                const scale = config.imageSize / spriteConfig.frameWidth;
                return (
                  <SpriteAnimation
                    spriteSheet={spriteConfig.path}
                    frameWidth={spriteConfig.frameWidth}
                    frameHeight={spriteConfig.frameHeight}
                    columns={spriteConfig.columns}
                    rows={spriteConfig.rows}
                    fps={spriteConfig.fps}
                    scale={scale}
                    className="pixel-art"
                  />
                );
              }
              return null;
            })()
          ) : (
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
          )}
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
            Lv.{pet.level} {getPetStageName(species, pet.stage, pet.evolutionRoute)}
          </div>
          {/* Show evolution route badge for pixel pets */}
          {speciesInfo?.isPixelPet && pet.evolutionRoute && (pet.stage === 'teen' || pet.stage === 'adult') && (
            <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
              ${pet.evolutionRoute === 'scholar' ? 'bg-blue-100 text-blue-700' : ''}
              ${pet.evolutionRoute === 'balanced' ? 'bg-green-100 text-green-700' : ''}
              ${pet.evolutionRoute === 'speed' ? 'bg-amber-100 text-amber-700' : ''}
            `}>
              {pet.evolutionRoute === 'scholar' && '📚 學者'}
              {pet.evolutionRoute === 'balanced' && '⚖️ 平衡'}
              {pet.evolutionRoute === 'speed' && '⚡ 速度'}
            </div>
          )}
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
