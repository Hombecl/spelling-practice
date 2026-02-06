'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PetSpecies, PET_SPECIES, getPetSvgPath, isPixelPet, EvolutionRoute, getEvolutionRouteInfo } from '@/lib/pet';

interface PetSelectionProps {
  onSelect: (species: PetSpecies, name: string) => void;
}

// Separate pixel pets from legacy pets
const PIXEL_PET_IDS: PetSpecies[] = ['pixel_unicorn', 'pixel_dragon', 'pixel_ghost_cat', 'pixel_mecha_bird', 'pixel_crystal_rabbit'];
const LEGACY_PET_IDS: PetSpecies[] = ['slime', 'unicorn', 'dog'];

export default function PetSelection({ onSelect }: PetSelectionProps) {
  const [selectedSpecies, setSelectedSpecies] = useState<PetSpecies | null>(null);
  const [petName, setPetName] = useState('');
  const [step, setStep] = useState<'choose' | 'name'>('choose');
  const [showCategory, setShowCategory] = useState<'pixel' | 'legacy'>('pixel');

  const pixelPets = PIXEL_PET_IDS.map(id => PET_SPECIES[id]);
  const legacyPets = LEGACY_PET_IDS.map(id => PET_SPECIES[id]);

  const handleSelectSpecies = (species: PetSpecies) => {
    setSelectedSpecies(species);
    setStep('name');
  };

  const handleConfirm = () => {
    if (selectedSpecies) {
      const finalName = petName.trim() || PET_SPECIES[selectedSpecies].stageNames.egg;
      onSelect(selectedSpecies, finalName);
    }
  };

  const handleBack = () => {
    setStep('choose');
    setSelectedSpecies(null);
    setPetName('');
  };

  if (step === 'name' && selectedSpecies) {
    const speciesInfo = PET_SPECIES[selectedSpecies];
    const isPixel = isPixelPet(selectedSpecies);
    const routes: EvolutionRoute[] = ['scholar', 'balanced', 'speed'];

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 max-h-[90vh] overflow-y-auto">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="mb-4 text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            ← 返回
          </button>

          {/* Selected pet preview */}
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-40 h-40 relative flex items-center justify-center rounded-2xl shadow-lg overflow-hidden pet-egg"
              style={{ background: `linear-gradient(to bottom, white, ${speciesInfo.color}15)` }}
            >
              <Image
                src={getPetSvgPath(selectedSpecies, 'egg')}
                alt={speciesInfo.nameZh}
                width={128}
                height={128}
                className="pixel-art"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="mt-4 text-center">
              <span className="text-2xl">{speciesInfo.emoji}</span>
              <h3 className="text-xl font-bold" style={{ color: speciesInfo.color }}>
                {speciesInfo.nameZh}
              </h3>
              {isPixel && speciesInfo.element && (
                <span className="text-xs text-gray-500">元素：{speciesInfo.element}</span>
              )}
            </div>
          </div>

          {/* Name input */}
          <div className="mb-6">
            <label className="block text-gray-700 text-lg font-medium mb-2">
              幫你嘅寵物改個名啦！
            </label>
            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder={speciesInfo.stageNames.egg}
              className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none"
              maxLength={10}
            />
            <p className="text-xs text-gray-400 mt-1">留空會用默認名</p>
          </div>

          {/* Evolution preview */}
          <div className="mb-4 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600 mb-3 text-center">進化預覽</p>
            <div className="flex justify-center gap-2 overflow-x-auto pb-2">
              {(['egg', 'baby', 'child', 'teen', 'adult'] as const).map((stage, idx) => (
                <div key={stage} className="flex flex-col items-center min-w-fit">
                  <div className="w-12 h-12 relative flex items-center justify-center rounded-lg bg-white shadow">
                    <Image
                      src={getPetSvgPath(selectedSpecies, stage)}
                      alt={speciesInfo.stageNames[stage]}
                      width={40}
                      height={40}
                      className="pixel-art"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 whitespace-nowrap">
                    {speciesInfo.stageNames[stage]}
                  </span>
                  {idx < 4 && <span className="text-gray-300 mt-1">→</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Evolution routes preview (only for pixel pets) */}
          {isPixel && speciesInfo.routeNames && (
            <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                🌟 進化路線（由準確率決定）
              </p>
              <div className="grid grid-cols-3 gap-2">
                {routes.map(route => {
                  const routeInfo = getEvolutionRouteInfo(route);
                  const routeNames = speciesInfo.routeNames?.[route];
                  return (
                    <div
                      key={route}
                      className="text-center p-2 bg-white rounded-lg shadow-sm"
                    >
                      <div className="text-2xl mb-1">{routeInfo.emoji}</div>
                      <div className="text-xs font-bold" style={{ color: routeInfo.color }}>
                        {routeInfo.nameZh}
                      </div>
                      {routeNames && (
                        <div className="text-[10px] text-gray-500 mt-1">
                          {routeNames.adult}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">
                準確率90%+ = 學者 | 70-90% = 平衡 | 70%- = 速度
              </p>
            </div>
          )}

          {/* Final form highlight */}
          <div className="mb-6 p-3 rounded-xl text-center" style={{ backgroundColor: `${speciesInfo.color}15` }}>
            <p className="text-sm text-gray-600">
              {isPixel ? (
                <>進化路線會影響最終形態！</>
              ) : (
                <>最終形態：<span className="font-bold" style={{ color: speciesInfo.color }}>{speciesInfo.finalFormName}</span></>
              )}
            </p>
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            className="w-full py-4 text-xl font-bold text-white rounded-xl shadow-lg active:scale-98 transition-transform"
            style={{ backgroundColor: speciesInfo.color }}
          >
            開始養育！🎉
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            歡迎嚟到串字練習！
          </h1>
          <p className="text-gray-600">
            揀一隻寵物，同佢一齊成長啦！
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setShowCategory('pixel')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              showCategory === 'pixel'
                ? 'bg-white shadow text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ✨ 新像素寵物
          </button>
          <button
            onClick={() => setShowCategory('legacy')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              showCategory === 'legacy'
                ? 'bg-white shadow text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🎮 經典寵物
          </button>
        </div>

        {/* Pixel pets info banner */}
        {showCategory === 'pixel' && (
          <div className="mb-4 p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl text-center">
            <p className="text-sm text-purple-700">
              🌟 像素寵物有<strong>進化路線系統</strong>！
            </p>
            <p className="text-xs text-purple-500 mt-1">
              準確率會影響進化方向：學者 / 平衡 / 速度
            </p>
          </div>
        )}

        {/* Pet selection grid */}
        <div className="grid grid-cols-1 gap-4">
          {(showCategory === 'pixel' ? pixelPets : legacyPets).map((species) => (
            <button
              key={species.id}
              onClick={() => handleSelectSpecies(species.id)}
              className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4 hover:scale-102 active:scale-98 transition-transform border-2 border-transparent hover:border-purple-200"
            >
              {/* Pet egg preview */}
              <div
                className="w-24 h-24 relative flex items-center justify-center rounded-xl shadow-inner pet-egg"
                style={{ backgroundColor: `${species.color}15` }}
              >
                <Image
                  src={getPetSvgPath(species.id, 'egg')}
                  alt={species.nameZh}
                  width={72}
                  height={72}
                  className="pixel-art"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              {/* Pet info */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{species.emoji}</span>
                  <h3 className="text-xl font-bold" style={{ color: species.color }}>
                    {species.nameZh}
                  </h3>
                  {species.isPixelPet && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full">
                      進化路線
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {species.descriptionZh}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  {species.element && (
                    <>
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
                        {species.element === 'magic' && '✨ 魔法'}
                        {species.element === 'fire' && '🔥 火焰'}
                        {species.element === 'shadow' && '🌙 暗影'}
                        {species.element === 'tech' && '⚡ 科技'}
                        {species.element === 'ice' && '❄️ 冰雪'}
                      </span>
                    </>
                  )}
                  {!species.isPixelPet && (
                    <>
                      <span>最終形態：</span>
                      <span className="font-medium" style={{ color: species.color }}>
                        {species.finalFormName}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <div className="text-gray-300 text-2xl">›</div>
            </button>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          透過練習串字，你嘅寵物會慢慢成長進化！
        </p>
      </div>
    </div>
  );
}
