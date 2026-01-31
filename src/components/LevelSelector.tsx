'use client';

import { UserProgress } from '@/lib/progress';

interface LevelSelectorProps {
  progress: UserProgress;
  onSelectLevel: (level: number) => void;
  onSelectMode: (mode: 'choose' | 'fill' | 'spell') => void;
}

export default function LevelSelector({
  progress,
  onSelectLevel,
  onSelectMode,
}: LevelSelectorProps) {
  const levels = [
    { level: 1, name: 'Level 1', description: '簡單字 (2-3個字母)', emoji: '🌱' },
    { level: 2, name: 'Level 2', description: '中等字 (4個字母)', emoji: '🌿' },
    { level: 3, name: 'Level 3', description: '進階字 (5+個字母)', emoji: '🌳' },
  ];

  const modes = [
    { mode: 'choose' as const, name: '揀字母', description: '聽讀音，揀啱嘅字母', emoji: '🎯' },
    { mode: 'fill' as const, name: '填充題', description: '填返漏咗嘅字母', emoji: '✏️' },
    { mode: 'spell' as const, name: '完整串字', description: '自己串出成個字', emoji: '🏆' },
  ];

  return (
    <div className="flex flex-col items-center gap-8 p-4 max-w-2xl mx-auto">
      {/* Level Selection */}
      <div className="w-full">
        <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">
          選擇難度 Choose Level
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {levels.map(({ level, name, description, emoji }) => {
            const levelProg = progress.levelProgress[level];
            const isUnlocked = levelProg?.unlocked;
            const isSelected = progress.currentLevel === level;

            return (
              <button
                key={level}
                onClick={() => isUnlocked && onSelectLevel(level)}
                disabled={!isUnlocked}
                className={`
                  p-6 rounded-2xl border-4 transition-all duration-200
                  ${
                    isSelected
                      ? 'bg-blue-100 border-blue-500 scale-105'
                      : isUnlocked
                      ? 'bg-white border-gray-200 hover:border-blue-300 hover:scale-102'
                      : 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                <div className="text-4xl mb-2">{isUnlocked ? emoji : '🔒'}</div>
                <div className="font-bold text-lg text-gray-800">{name}</div>
                <div className="text-sm text-gray-500 mt-1">{description}</div>
                {levelProg && (
                  <div className="mt-2 text-sm">
                    <span className="text-yellow-500">⭐ {levelProg.stars}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Selection */}
      <div className="w-full">
        <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">
          選擇模式 Choose Mode
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {modes.map(({ mode, name, description, emoji }) => {
            const isSelected = progress.currentMode === mode;

            return (
              <button
                key={mode}
                onClick={() => onSelectMode(mode)}
                className={`
                  p-6 rounded-2xl border-4 transition-all duration-200
                  ${
                    isSelected
                      ? 'bg-green-100 border-green-500 scale-105'
                      : 'bg-white border-gray-200 hover:border-green-300 hover:scale-102'
                  }
                `}
              >
                <div className="text-4xl mb-2">{emoji}</div>
                <div className="font-bold text-lg text-gray-800">{name}</div>
                <div className="text-sm text-gray-500 mt-1">{description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Progression hint */}
      <div className="text-center text-gray-500 text-sm mt-4">
        <p>💡 建議由「揀字母」開始，慢慢進階到「完整串字」</p>
        <p>Start with &quot;Choose Letters&quot; and progress to &quot;Full Spelling&quot;</p>
      </div>
    </div>
  );
}
