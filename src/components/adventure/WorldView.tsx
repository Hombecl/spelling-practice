'use client';

import {
  World,
  WorldProgress,
  isStageAvailable,
  isBossAvailable,
  AdventureProgress,
} from '@/lib/adventure';
import { PetState } from '@/lib/pet';

interface WorldViewProps {
  world: World;
  worldProgress: WorldProgress;
  pet: PetState;
  onBack: () => void;
  onStageSelect: (stageNumber: number) => void;
  onBossSelect: () => void;
}

export default function WorldView({
  world,
  worldProgress,
  onBack,
  onStageSelect,
  onBossSelect,
}: WorldViewProps) {
  // Create a simple adventure progress object for the helper
  const adventureProgress: AdventureProgress = {
    currentWorld: world.id,
    worldProgress: { [world.id]: worldProgress } as AdventureProgress['worldProgress'],
  };

  const bossAvailable = isBossAvailable(world.id, adventureProgress);
  const totalStars = Object.values(worldProgress.stageStars).reduce((a, b) => a + b, 0);

  return (
    <div className={`min-h-screen bg-gradient-to-b ${world.bgGradient} py-4`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-800 font-medium"
        >
          ← 返回
        </button>
        <div className="flex items-center gap-2 bg-white/70 px-3 py-1 rounded-full">
          <span className="text-yellow-500">⭐</span>
          <span className="font-bold text-gray-700">{totalStars}</span>
        </div>
      </div>

      {/* World Title */}
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">{world.emoji}</div>
        <h1 className="text-2xl font-bold text-gray-800">{world.nameZh}</h1>
        <p className="text-gray-600 text-sm mt-1">{world.description}</p>
      </div>

      {/* Boss Node (at top) */}
      <div className="flex justify-center mb-6">
        <button
          onClick={onBossSelect}
          disabled={!bossAvailable}
          className={`
            relative flex flex-col items-center p-4 rounded-2xl transition-all
            ${bossAvailable
              ? worldProgress.bossDefeated
                ? 'bg-yellow-100 border-4 border-yellow-400'
                : 'bg-red-100 border-4 border-red-400 animate-pulse hover:scale-105'
              : 'bg-gray-200 opacity-50 cursor-not-allowed'}
          `}
        >
          <span className="text-5xl">{world.boss.bossEmoji}</span>
          <span className="font-bold text-gray-800 mt-1">{world.boss.nameZh}</span>
          {worldProgress.bossDefeated && (
            <span className="absolute -top-2 -right-2 text-2xl">👑</span>
          )}
          {!bossAvailable && (
            <span className="text-xs text-gray-500 mt-1">完成所有關卡解鎖</span>
          )}
          {bossAvailable && !worldProgress.bossDefeated && (
            <span className="text-xs text-red-600 font-bold mt-1">挑戰 Boss！</span>
          )}
        </button>
      </div>

      {/* Connecting Line */}
      <div className="flex justify-center">
        <div className="w-1 h-8 bg-gray-300 rounded-full" />
      </div>

      {/* Stage Nodes (vertical path, bottom to top) */}
      <div className="flex flex-col-reverse items-center gap-2 px-4">
        {world.stages.map((stage, index) => {
          const available = isStageAvailable(world.id, stage.number, adventureProgress);
          const stars = worldProgress.stageStars[stage.id] || 0;
          const completed = stars > 0;

          // Alternate left/right position for visual interest
          const offsetClass = index % 2 === 0 ? '-translate-x-8' : 'translate-x-8';

          return (
            <div key={stage.id} className="flex flex-col items-center">
              {/* Connecting line */}
              {index < world.stages.length - 1 && (
                <div className="w-1 h-4 bg-gray-300 rounded-full" />
              )}

              {/* Stage Node */}
              <button
                onClick={() => available && onStageSelect(stage.number)}
                disabled={!available}
                className={`
                  relative flex flex-col items-center p-3 rounded-xl transition-all transform ${offsetClass}
                  ${available
                    ? completed
                      ? 'bg-white border-2 border-green-400 shadow-md'
                      : 'bg-white border-2 border-blue-400 shadow-md hover:scale-105 animate-bounce-gentle'
                    : 'bg-gray-100 border-2 border-gray-300 opacity-50 cursor-not-allowed'}
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{stage.emoji}</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-gray-700">第 {stage.number} 關</div>
                    <div className="text-xs text-gray-500">{stage.nameZh}</div>
                  </div>
                </div>

                {/* Stars display */}
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3].map((s) => (
                    <span
                      key={s}
                      className={`text-sm ${s <= stars ? 'text-yellow-500' : 'text-gray-300'}`}
                    >
                      ⭐
                    </span>
                  ))}
                </div>

                {/* Lock icon */}
                {!available && (
                  <div className="absolute -top-1 -right-1 text-lg">🔒</div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Start indicator */}
      <div className="flex justify-center mt-4">
        <div className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold">
          🏁 起點
        </div>
      </div>
    </div>
  );
}
