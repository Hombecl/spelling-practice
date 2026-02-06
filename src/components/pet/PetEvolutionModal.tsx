'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  PetStage,
  PET_STAGE_NAMES_ZH,
  PET_EMOJIS,
  PetSpecies,
  EvolutionRoute,
  PET_SPECIES,
  getPetStageName,
  getPetSvgPath,
  getEvolutionRouteInfo,
  isPixelPet,
} from '@/lib/progress';

interface PetEvolutionModalProps {
  oldStage: PetStage;
  newStage: PetStage;
  petName: string;
  species?: PetSpecies;
  evolutionRoute?: EvolutionRoute;
  accuracy?: number; // Current accuracy to show which route was earned
  onClose: () => void;
}

export default function PetEvolutionModal({
  oldStage,
  newStage,
  petName,
  species = 'slime',
  evolutionRoute,
  accuracy,
  onClose,
}: PetEvolutionModalProps) {
  const [phase, setPhase] = useState<'intro' | 'evolving' | 'route_reveal' | 'reveal'>('intro');

  const speciesInfo = PET_SPECIES[species];
  const isPixel = isPixelPet(species);
  const showRouteReveal = isPixel && evolutionRoute && (newStage === 'teen' || newStage === 'adult');
  const routeInfo = evolutionRoute ? getEvolutionRouteInfo(evolutionRoute) : null;

  useEffect(() => {
    // Animation sequence - longer for route reveal
    const timer1 = setTimeout(() => setPhase('evolving'), 1000);

    if (showRouteReveal) {
      // Show route reveal before final form
      const timer2 = setTimeout(() => setPhase('route_reveal'), 3000);
      const timer3 = setTimeout(() => setPhase('reveal'), 5500);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      const timer2 = setTimeout(() => setPhase('reveal'), 3000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [showRouteReveal]);

  // Confetti particles
  const confettiColors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      {/* Confetti */}
      {phase === 'reveal' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: confettiColors[i % confettiColors.length],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal Content */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden">
        {/* Sparkle background */}
        <div className="absolute inset-0 overflow-hidden">
          {phase !== 'intro' &&
            Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-sparkle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              >
                ✨
              </div>
            ))}
        </div>

        <div className="relative z-10">
          {/* Phase: Intro */}
          {phase === 'intro' && (
            <div className="animate-pulse">
              {isPixel ? (
                <div className="w-24 h-24 mx-auto mb-4 relative">
                  <Image
                    src={getPetSvgPath(species, oldStage)}
                    alt={petName}
                    width={96}
                    height={96}
                    className="pixel-art"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              ) : (
                <div className="text-6xl mb-4">{PET_EMOJIS[oldStage]}</div>
              )}
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {petName} 有啲唔同...
              </h2>
              <p className="text-gray-500">發生緊啲咩事？</p>
            </div>
          )}

          {/* Phase: Evolving */}
          {phase === 'evolving' && (
            <div>
              <div className="relative">
                {isPixel ? (
                  <div className="w-32 h-32 mx-auto animate-evolution-burst">
                    <Image
                      src={getPetSvgPath(species, oldStage)}
                      alt={petName}
                      width={128}
                      height={128}
                      className="pixel-art"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                ) : (
                  <div className="text-8xl animate-evolution-glow">
                    {PET_EMOJIS[oldStage]}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-yellow-300 rounded-full animate-ping opacity-50" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-purple-600 mt-4 animate-pulse">
                正在進化中...
              </h2>
            </div>
          )}

          {/* Phase: Route Reveal (for pixel pets) */}
          {phase === 'route_reveal' && showRouteReveal && routeInfo && (
            <div className="animate-bounce-in">
              <div className="text-5xl mb-3">{routeInfo.emoji}</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: routeInfo.color }}>
                {routeInfo.nameZh}
              </h2>
              <p className="text-gray-600 mb-4">{routeInfo.description}</p>
              {accuracy !== undefined && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg mb-4">
                  <span className="text-sm text-gray-500">你嘅準確率:</span>
                  <span className="text-lg font-bold" style={{ color: routeInfo.color }}>
                    {accuracy.toFixed(1)}%
                  </span>
                </div>
              )}
              <p className="text-gray-500 text-sm animate-pulse">
                進化路線已決定...
              </p>
            </div>
          )}

          {/* Phase: Reveal */}
          {phase === 'reveal' && (
            <div className="animate-bounce-in">
              {isPixel ? (
                <div className="w-36 h-36 mx-auto mb-4 animate-float">
                  <Image
                    src={getPetSvgPath(species, newStage, evolutionRoute)}
                    alt={petName}
                    width={144}
                    height={144}
                    className="pixel-art"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              ) : (
                <div className="text-9xl mb-4 animate-float">
                  {PET_EMOJIS[newStage]}
                </div>
              )}
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                恭喜！進化成功！
              </h2>
              <p className="text-xl text-gray-700 mb-2">
                {petName} 進化成為
              </p>
              <p className="text-2xl font-bold text-purple-600 mb-2">
                {getPetStageName(species, newStage, evolutionRoute)}！
              </p>

              {/* Route badge for pixel pets */}
              {showRouteReveal && routeInfo && (
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4"
                  style={{ backgroundColor: `${routeInfo.color}20`, color: routeInfo.color }}
                >
                  {routeInfo.emoji} {routeInfo.nameZh}
                </div>
              )}

              {/* Evolution comparison */}
              <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="text-center">
                  {isPixel ? (
                    <div className="w-16 h-16 mx-auto mb-1">
                      <Image
                        src={getPetSvgPath(species, oldStage)}
                        alt="舊形態"
                        width={64}
                        height={64}
                        className="pixel-art"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                  ) : (
                    <div className="text-4xl mb-1">{PET_EMOJIS[oldStage]}</div>
                  )}
                  <div className="text-sm text-gray-500">
                    {getPetStageName(species, oldStage)}
                  </div>
                </div>
                <div className="text-2xl text-purple-400">→</div>
                <div className="text-center">
                  {isPixel ? (
                    <div className="w-16 h-16 mx-auto mb-1 animate-bounce">
                      <Image
                        src={getPetSvgPath(species, newStage, evolutionRoute)}
                        alt="新形態"
                        width={64}
                        height={64}
                        className="pixel-art"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                  ) : (
                    <div className="text-4xl mb-1 animate-bounce">
                      {PET_EMOJIS[newStage]}
                    </div>
                  )}
                  <div className="text-sm font-bold text-purple-600">
                    {getPetStageName(species, newStage, evolutionRoute)}
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="
                  px-8 py-3
                  bg-gradient-to-r from-purple-500 to-pink-500
                  hover:from-purple-600 hover:to-pink-600
                  text-white font-bold text-lg
                  rounded-full
                  shadow-lg hover:shadow-xl
                  transform hover:scale-105 active:scale-95
                  transition-all duration-200
                "
              >
                太好了！🎉
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
