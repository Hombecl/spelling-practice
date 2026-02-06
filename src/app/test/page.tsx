'use client';

import { useState } from 'react';
import { PetStage, PET_STAGE_NAMES_ZH } from '@/lib/progress';
import { PetState, PetSpecies } from '@/lib/pet';
import PetDisplay from '@/components/pet/PetDisplay';

const TEST_PASSWORD = '123';

const PET_STAGES: PetStage[] = ['egg', 'baby', 'child', 'teen', 'adult'];

// Available species for testing
const TEST_SPECIES = [
  { id: 'slime', name: '史萊姆', emoji: '🟢' },
  { id: 'pixel_unicorn', name: '獨角獸', emoji: '🦄' },
  { id: 'pixel_dragon', name: '火龍', emoji: '🐉' },
  { id: 'pixel_ghost_cat', name: '幽靈貓', emoji: '👻' },
  { id: 'pixel_mecha_bird', name: '機械鳥', emoji: '🤖' },
  { id: 'pixel_crystal_rabbit', name: '水晶兔', emoji: '💎' },
] as const;

export default function TestPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Test pet states for each stage
  const [currentStage, setCurrentStage] = useState<PetStage>('egg');
  const [currentSpecies, setCurrentSpecies] = useState<PetSpecies>('pixel_unicorn');
  const [happiness, setHappiness] = useState(80);
  const [level, setLevel] = useState(1);

  const handleLogin = () => {
    if (password === TEST_PASSWORD) {
      setAuthenticated(true);
      setError('');
    } else {
      setError('密碼錯誤！');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  // Get current species info
  const speciesInfo = TEST_SPECIES.find(s => s.id === currentSpecies) || TEST_SPECIES[0];

  // Create a test pet state matching the current PetState interface
  const testPet: PetState = {
    name: `測試${speciesInfo.name}`,
    species: currentSpecies,
    stage: currentStage,
    xp: 50,
    level: level,
    lastFedDate: today,
    happiness: happiness,
    unlockedSkills: [],
    activeEffects: [],
    evolvedAt: {},
    totalWordsSpelled: 100,
    birthDate: today,
    patsToday: 0,
    lastPatDate: today,
    foodInventory: [],
    lastInteractionTime: new Date().toISOString(),
    dailyTasksCompleted: [],
    lastDailyTaskDate: today,
    activeEvent: null,
    lastEventDate: today,
    itemInventory: [],
    equippedItems: [],
    activeItemEffects: [],
  };

  // Quick evolve to next stage
  const handleEvolve = () => {
    const currentIndex = PET_STAGES.indexOf(currentStage);
    if (currentIndex < PET_STAGES.length - 1) {
      setCurrentStage(PET_STAGES[currentIndex + 1]);
      setLevel(prev => prev + 10);
    }
  };

  // Quick devolve to previous stage
  const handleDevolve = () => {
    const currentIndex = PET_STAGES.indexOf(currentStage);
    if (currentIndex > 0) {
      setCurrentStage(PET_STAGES[currentIndex - 1]);
      setLevel(prev => Math.max(1, prev - 10));
    }
  };

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-6">🔐 測試模式</h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                placeholder="輸入密碼..."
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              onClick={handleLogin}
              className="w-full py-3 bg-purple-500 text-white rounded-xl font-bold text-lg hover:bg-purple-600 active:scale-95 transition-all"
            >
              進入測試模式
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Test mode UI
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🧪 寵物測試模式</h1>
          <p className="text-gray-500 text-sm">快速預覽所有進化階段</p>
        </div>

        {/* Current Pet Display */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-center mb-4">
            <PetDisplay pet={testPet} size="large" showName showMood />
          </div>

          {/* Stage Info */}
          <div className="text-center mb-4">
            <div className="inline-block px-4 py-2 bg-purple-100 rounded-full">
              <span className="font-bold text-purple-700">
                階段 {PET_STAGES.indexOf(currentStage) + 1}/5: {PET_STAGE_NAMES_ZH[currentStage]}
              </span>
            </div>
          </div>

          {/* Evolution Controls */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleDevolve}
              disabled={currentStage === 'egg'}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                currentStage === 'egg'
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
              }`}
            >
              ⬅️ 退化
            </button>
            <button
              onClick={handleEvolve}
              disabled={currentStage === 'adult'}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                currentStage === 'adult'
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600 active:scale-95'
              }`}
            >
              進化 ➡️
            </button>
          </div>
        </div>

        {/* Species Selector */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <h2 className="font-bold text-gray-700 mb-3 text-center">選擇寵物種類</h2>
          <div className="grid grid-cols-3 gap-2">
            {TEST_SPECIES.map((species) => (
              <button
                key={species.id}
                onClick={() => setCurrentSpecies(species.id as PetSpecies)}
                className={`p-3 rounded-xl text-center transition-all ${
                  currentSpecies === species.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="text-2xl mb-1">{species.emoji}</div>
                <div className="text-xs font-medium">{species.name}</div>
                {(species.id === 'pixel_unicorn' || species.id === 'pixel_dragon') && (
                  <div className="text-[10px] text-green-500 font-bold">✨ 動畫</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stage Selector */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <h2 className="font-bold text-gray-700 mb-3 text-center">快速選擇階段</h2>
          <div className="grid grid-cols-5 gap-2">
            {PET_STAGES.map((stage, index) => (
              <button
                key={stage}
                onClick={() => {
                  setCurrentStage(stage);
                  setLevel(1 + index * 10);
                }}
                className={`p-3 rounded-xl text-center transition-all ${
                  currentStage === stage
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="text-2xl mb-1">
                  {stage === 'egg' ? '🥚' :
                   stage === 'baby' ? '🐣' :
                   stage === 'child' ? '🦎' :
                   stage === 'teen' ? '🐲' : '🐉'}
                </div>
                <div className="text-xs font-medium">
                  {PET_STAGE_NAMES_ZH[stage]}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mood Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <h2 className="font-bold text-gray-700 mb-3 text-center">心情控制</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>開心度</span>
                <span>{happiness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={happiness}
                onChange={(e) => setHappiness(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>😢 肚餓</span>
                <span>😌 普通</span>
                <span>😊 開心</span>
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setHappiness(20)}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200"
              >
                😢 肚餓
              </button>
              <button
                onClick={() => setHappiness(50)}
                className="px-4 py-2 bg-yellow-100 text-yellow-600 rounded-lg text-sm font-medium hover:bg-yellow-200"
              >
                😌 普通
              </button>
              <button
                onClick={() => setHappiness(90)}
                className="px-4 py-2 bg-green-100 text-green-600 rounded-lg text-sm font-medium hover:bg-green-200"
              >
                😊 開心
              </button>
            </div>
          </div>
        </div>

        {/* All Stages Preview */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <h2 className="font-bold text-gray-700 mb-3 text-center">{speciesInfo.name} 所有階段預覽</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {PET_STAGES.map((stage, index) => {
              const previewPet: PetState = {
                ...testPet,
                species: currentSpecies,
                stage,
                level: 1 + index * 10,
                name: PET_STAGE_NAMES_ZH[stage],
              };
              return (
                <div key={stage} className="text-center">
                  <PetDisplay pet={previewPet} size="small" showName={false} showMood={false} />
                  <div className="text-xs text-gray-500 mt-1">{PET_STAGE_NAMES_ZH[stage]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Level Control */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <h2 className="font-bold text-gray-700 mb-3 text-center">等級控制</h2>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setLevel(prev => Math.max(1, prev - 1))}
              className="w-12 h-12 bg-gray-200 rounded-xl font-bold text-xl hover:bg-gray-300 active:scale-95"
            >
              -
            </button>
            <div className="text-2xl font-bold text-purple-600 w-20 text-center">
              Lv.{level}
            </div>
            <button
              onClick={() => setLevel(prev => prev + 1)}
              className="w-12 h-12 bg-gray-200 rounded-xl font-bold text-xl hover:bg-gray-300 active:scale-95"
            >
              +
            </button>
          </div>
        </div>

        {/* Back to App */}
        <div className="text-center">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all"
          >
            ← 返回主程式
          </a>
        </div>
      </div>
    </div>
  );
}
