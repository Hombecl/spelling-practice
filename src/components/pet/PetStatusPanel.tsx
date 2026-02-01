'use client';

import { PetState, getXPProgress, PET_STAGE_NAMES_ZH, getXPToNextEvolution } from '@/lib/progress';

interface PetStatusPanelProps {
  pet: PetState;
  totalXP: number;
  xpEarnedToday: number;
  compact?: boolean;
}

export default function PetStatusPanel({
  pet,
  totalXP,
  xpEarnedToday,
  compact = false,
}: PetStatusPanelProps) {
  const xpProgress = getXPProgress(totalXP);
  const evolutionInfo = getXPToNextEvolution(totalXP, pet.stage);

  // Happiness bar color
  const happinessColor =
    pet.happiness >= 70
      ? 'bg-green-500'
      : pet.happiness >= 40
      ? 'bg-yellow-500'
      : pet.happiness >= 20
      ? 'bg-orange-500'
      : 'bg-red-500';

  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-white/80 rounded-full px-4 py-2 shadow">
        {/* Level */}
        <div className="flex items-center gap-1">
          <span className="text-purple-600 font-bold">Lv.{pet.level}</span>
        </div>

        {/* XP Mini Bar */}
        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-300"
            style={{ width: `${xpProgress.percent}%` }}
          />
        </div>

        {/* Today's XP */}
        {xpEarnedToday > 0 && (
          <div className="text-xs text-purple-600 font-medium">
            +{xpEarnedToday} XP
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-800">{pet.name}</h3>
          <p className="text-sm text-gray-500">
            Lv.{pet.level} {PET_STAGE_NAMES_ZH[pet.stage]}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600">{totalXP}</div>
          <div className="text-xs text-gray-400">總 XP</div>
        </div>
      </div>

      {/* XP Progress to Next Level */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>升級進度</span>
          <span>
            {xpProgress.current} / {xpProgress.needed} XP
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${xpProgress.percent}%` }}
          />
        </div>
      </div>

      {/* Evolution Progress */}
      {evolutionInfo && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>進化進度</span>
            <span>
              {evolutionInfo.current} / {evolutionInfo.needed} XP
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
              style={{
                width: `${Math.min(100, (evolutionInfo.current / evolutionInfo.needed) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Happiness */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>開心度</span>
          <span>{pet.happiness}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${happinessColor} transition-all duration-500`}
            style={{ width: `${pet.happiness}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-blue-50 rounded-lg p-2">
          <div className="text-lg font-bold text-blue-600">
            {pet.totalWordsSpelled}
          </div>
          <div className="text-xs text-blue-400">串過嘅字</div>
        </div>
        <div className="bg-green-50 rounded-lg p-2">
          <div className="text-lg font-bold text-green-600">
            {xpEarnedToday}
          </div>
          <div className="text-xs text-green-400">今日 XP</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-2">
          <div className="text-lg font-bold text-purple-600">
            {pet.unlockedSkills.length}
          </div>
          <div className="text-xs text-purple-400">技能</div>
        </div>
      </div>

      {/* Tips based on happiness */}
      {pet.happiness < 50 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            💡 {pet.name} 好似有啲唔開心，快啲練習串字餵佢啦！
          </p>
        </div>
      )}
    </div>
  );
}
