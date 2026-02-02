'use client';

import { useState, useEffect } from 'react';
import {
  WORLDS,
  WorldId,
  World,
  isWorldUnlocked,
  AdventureProgress,
  createDefaultAdventureProgress,
} from '@/lib/adventure';
import { PetState } from '@/lib/pet';
import { getCustomWordLists, getDaysUntilDeadline, getSpellingTestStats } from '@/lib/customWords';
import { SpellingTestStage, createSpellingTestStages, getGradeLabel, getStudentLevel, analyzeSpellingTests } from '@/lib/adaptiveLevel';
import WorldView from './WorldView';

interface AdventureMapProps {
  pet: PetState;
  adventureProgress: AdventureProgress | undefined;
  onStageSelect: (worldId: WorldId, stageNumber: number) => void;
  onBossSelect: (worldId: WorldId) => void;
  onSpellingTestSelect?: (stage: SpellingTestStage) => void;
}

export default function AdventureMap({
  pet,
  adventureProgress,
  onStageSelect,
  onBossSelect,
  onSpellingTestSelect,
}: AdventureMapProps) {
  const [selectedWorld, setSelectedWorld] = useState<WorldId | null>(null);
  const [spellingTestStages, setSpellingTestStages] = useState<SpellingTestStage[]>([]);
  const [studentLevel, setStudentLevel] = useState(getStudentLevel());
  const progress = adventureProgress || createDefaultAdventureProgress();

  // Load spelling test stages
  useEffect(() => {
    const stages = createSpellingTestStages();
    setSpellingTestStages(stages);

    // Re-analyze student level
    if (stages.length > 0) {
      const level = analyzeSpellingTests();
      setStudentLevel(level);
    }
  }, []);

  // If a world is selected, show WorldView
  if (selectedWorld) {
    const world = WORLDS.find(w => w.id === selectedWorld);
    if (world) {
      return (
        <WorldView
          world={world}
          worldProgress={progress.worldProgress[selectedWorld]}
          pet={pet}
          onBack={() => setSelectedWorld(null)}
          onStageSelect={(stageNum) => onStageSelect(selectedWorld, stageNum)}
          onBossSelect={() => onBossSelect(selectedWorld)}
        />
      );
    }
  }

  return (
    <div className="py-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          🗺️ 冒險地圖
        </h1>
        <p className="text-gray-500 mt-1">選擇一個世界開始冒險！</p>
      </div>

      {/* Student Level Badge (if available) */}
      {studentLevel && studentLevel.totalWordsAnalyzed > 0 && (
        <div className="max-w-lg mx-auto mb-4">
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <div>
                <div className="text-sm font-bold text-purple-700">
                  程度估計：{getGradeLabel(studentLevel.estimatedGrade)}
                </div>
                <div className="text-xs text-gray-500">
                  已分析 {studentLevel.totalWordsAnalyzed} 個字
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">信心度</div>
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500"
                  style={{ width: `${studentLevel.confidenceScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spelling Test Challenges Section */}
      {spellingTestStages.length > 0 && onSpellingTestSelect && (
        <div className="max-w-lg mx-auto mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📝</span>
            <h2 className="text-lg font-bold text-gray-700">默書大挑戰</h2>
          </div>

          <div className="flex flex-col gap-3">
            {spellingTestStages.map((stage) => (
              <SpellingTestCard
                key={stage.id}
                stage={stage}
                onClick={() => onSpellingTestSelect(stage)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Divider if there are spelling tests */}
      {spellingTestStages.length > 0 && (
        <div className="max-w-lg mx-auto mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">冒險世界</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </div>
      )}

      {/* World Cards */}
      <div className="flex flex-col gap-4 max-w-lg mx-auto">
        {WORLDS.map((world) => {
          const unlocked = isWorldUnlocked(world.id, pet);
          const worldProgress = progress.worldProgress[world.id];
          const starsEarned = Object.values(worldProgress?.stageStars || {}).reduce((a, b) => a + b, 0);
          const maxStars = world.stages.length * 3; // 3 stars per stage

          return (
            <WorldCard
              key={world.id}
              world={world}
              unlocked={unlocked}
              stagesCompleted={worldProgress?.stagesCompleted || 0}
              bossDefeated={worldProgress?.bossDefeated || false}
              starsEarned={starsEarned}
              maxStars={maxStars}
              onClick={() => unlocked && setSelectedWorld(world.id)}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 text-center text-sm text-gray-400">
        <p>完成所有關卡解鎖 Boss 戰！</p>
        <p>升級寵物解鎖新世界！</p>
      </div>
    </div>
  );
}

// World Card Component
interface WorldCardProps {
  world: World;
  unlocked: boolean;
  stagesCompleted: number;
  bossDefeated: boolean;
  starsEarned: number;
  maxStars: number;
  onClick: () => void;
}

function WorldCard({
  world,
  unlocked,
  stagesCompleted,
  bossDefeated,
  starsEarned,
  maxStars,
  onClick,
}: WorldCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={!unlocked}
      className={`
        relative w-full p-4 rounded-2xl text-left transition-all duration-300
        ${unlocked
          ? `bg-gradient-to-r ${world.bgGradient} hover:shadow-lg active:scale-98 cursor-pointer`
          : 'bg-gray-200 cursor-not-allowed opacity-60'}
      `}
    >
      {/* Lock overlay for locked worlds */}
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl">
          <div className="text-center">
            <span className="text-4xl">🔒</span>
            <p className="text-white text-sm mt-1 font-bold">
              需要 Lv.{world.requiredPetLevel} {world.requiredPetStage === 'baby' ? 'BB仔' :
                world.requiredPetStage === 'child' ? '細路仔' :
                world.requiredPetStage === 'teen' ? '少年龍' :
                world.requiredPetStage === 'adult' ? '成年龍' : '蛋蛋'}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* World Icon */}
        <div className="text-5xl">{world.emoji}</div>

        {/* World Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-800">{world.nameZh}</h3>
            {bossDefeated && <span className="text-xl">👑</span>}
          </div>
          <p className="text-sm text-gray-600 mt-0.5">{world.description}</p>

          {/* Progress */}
          {unlocked && (
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-500">關卡:</span>
                <span className="font-bold text-gray-700">{stagesCompleted}/10</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-yellow-500">⭐</span>
                <span className="font-bold text-gray-700">{starsEarned}/{maxStars}</span>
              </div>
            </div>
          )}
        </div>

        {/* Arrow */}
        {unlocked && (
          <div className="text-2xl text-gray-400">→</div>
        )}
      </div>

      {/* Boss indicator */}
      {unlocked && stagesCompleted >= 10 && !bossDefeated && (
        <div className="mt-3 flex items-center justify-center gap-2 bg-red-100 rounded-lg py-2">
          <span className="text-xl">{world.boss.bossEmoji}</span>
          <span className="text-red-600 font-bold text-sm">Boss 已解鎖！</span>
        </div>
      )}
    </button>
  );
}

// Spelling Test Card Component
interface SpellingTestCardProps {
  stage: SpellingTestStage;
  onClick: () => void;
}

function SpellingTestCard({ stage, onClick }: SpellingTestCardProps) {
  const list = getCustomWordLists().find(l => l.id === stage.listId);
  const daysUntil = list ? getDaysUntilDeadline(list) : null;
  const stats = getSpellingTestStats(stage.listId);

  // Determine urgency color
  const getUrgencyStyle = () => {
    if (daysUntil === null) return 'from-orange-100 to-yellow-100';
    if (daysUntil <= 0) return 'from-red-100 to-red-200';
    if (daysUntil === 1) return 'from-orange-100 to-orange-200';
    if (daysUntil <= 3) return 'from-yellow-100 to-yellow-200';
    return 'from-blue-100 to-blue-200';
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 rounded-2xl text-left transition-all duration-300
        bg-gradient-to-r ${getUrgencyStyle()}
        hover:shadow-lg active:scale-98 cursor-pointer
      `}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={`text-4xl ${stage.isBoss ? 'animate-bounce' : ''}`}>
          {stage.isBoss ? '📝' : '📋'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-800 truncate">{stage.listName}</h3>
            {stage.isBoss && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                大挑戰
              </span>
            )}
          </div>

          {/* Deadline */}
          {daysUntil !== null && (
            <div className={`text-sm mt-1 font-medium ${
              daysUntil <= 0 ? 'text-red-600' :
              daysUntil === 1 ? 'text-orange-600' :
              daysUntil <= 3 ? 'text-yellow-600' :
              'text-blue-600'
            }`}>
              {daysUntil < 0 ? '📅 已過期' :
               daysUntil === 0 ? '⚠️ 今日默書！' :
               daysUntil === 1 ? '⏰ 聽日默書！' :
               `📅 ${daysUntil} 日後`}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span>{stage.wordCount} 個字</span>
            {stats && stats.mastered > 0 && (
              <span className="text-green-600">✓ {stats.mastered}/{stats.total} 已掌握</span>
            )}
          </div>
        </div>

        {/* Progress circle or arrow */}
        <div className="flex flex-col items-center">
          {stats ? (
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke={stats.percentage === 100 ? '#22c55e' : '#f59e0b'}
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${stats.percentage * 1.26} 126`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {stats.percentage}%
              </div>
            </div>
          ) : (
            <div className="text-2xl text-gray-400">→</div>
          )}
        </div>
      </div>

      {/* Rewards preview */}
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-gray-500">
        <span>⭐ {stage.rewards.stars}</span>
        <span>+{stage.rewards.xp} XP</span>
      </div>
    </button>
  );
}
