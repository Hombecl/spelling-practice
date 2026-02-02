'use client';

import { useState, useEffect } from 'react';
import {
  getDailyEngagement,
  canOpenDailyChest,
  openDailyChest,
  DailyQuest,
  DailyEngagement,
} from '@/lib/dailySystem';

interface DailyQuestsProps {
  onXPEarned?: (xp: number) => void;
  onChestOpened?: (rewards: { xp: number; freezes: number }) => void;
}

export default function DailyQuests({ onXPEarned, onChestOpened }: DailyQuestsProps) {
  const [engagement, setEngagement] = useState<DailyEngagement | null>(null);
  const [showChestAnimation, setShowChestAnimation] = useState(false);
  const [chestRewards, setChestRewards] = useState<{ xp: number; freezes: number } | null>(null);

  useEffect(() => {
    setEngagement(getDailyEngagement());
  }, []);

  const handleOpenChest = () => {
    if (!engagement || !canOpenDailyChest(engagement)) return;

    setShowChestAnimation(true);

    setTimeout(() => {
      const { engagement: updated, rewards } = openDailyChest();
      setEngagement(updated);
      setChestRewards(rewards);
      onChestOpened?.(rewards);
      onXPEarned?.(rewards.xp);
    }, 1000);
  };

  if (!engagement) return null;

  const completedCount = engagement.quests.filter(q => q.completed).length;
  const canOpen = canOpenDailyChest(engagement);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-700">📋 每日任務</h2>
        <span className="text-sm text-gray-500">{completedCount}/3 完成</span>
      </div>

      {/* Quests list */}
      <div className="space-y-2 mb-4">
        {engagement.quests.map((quest) => (
          <QuestItem key={quest.id} quest={quest} />
        ))}
      </div>

      {/* Daily Chest */}
      <div className={`
        relative rounded-xl p-4 transition-all
        ${canOpen ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300' : 'bg-gray-50'}
        ${engagement.chest.opened ? 'opacity-50' : ''}
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-4xl ${showChestAnimation ? 'animate-bounce' : ''}`}>
              {engagement.chest.opened ? '📭' : canOpen ? '🎁' : '📦'}
            </div>
            <div>
              <div className="font-bold text-gray-700">
                {engagement.chest.opened ? '已領取' : '每日寶箱'}
              </div>
              <div className="text-xs text-gray-500">
                {engagement.chest.opened
                  ? '聽日再嚟！'
                  : canOpen
                    ? '完成任務，即刻開箱！'
                    : `完成 ${1 - completedCount} 個任務解鎖`}
              </div>
            </div>
          </div>

          {!engagement.chest.opened && (
            <button
              onClick={handleOpenChest}
              disabled={!canOpen}
              className={`
                px-4 py-2 rounded-xl font-bold transition-all
                ${canOpen
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-lg active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              {canOpen ? '開箱！' : '🔒'}
            </button>
          )}
        </div>

        {/* Tier indicator */}
        <div className="flex gap-1 mt-2">
          {[1, 2, 3].map((tier) => (
            <div
              key={tier}
              className={`h-1 flex-1 rounded-full ${
                tier <= engagement.chest.currentTier ? 'bg-yellow-400' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          寶箱等級 {engagement.chest.currentTier}/3 （連勝越多，獎勵越好）
        </div>
      </div>

      {/* Chest opened animation */}
      {showChestAnimation && chestRewards && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-scale-in">
            <div className="text-7xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-bold text-yellow-600 mb-4">恭喜獲得！</h2>

            <div className="space-y-3 mb-6">
              <div className="bg-purple-50 rounded-xl p-3 flex items-center justify-center gap-3">
                <span className="text-3xl">✨</span>
                <span className="text-2xl font-bold text-purple-600">+{chestRewards.xp} XP</span>
              </div>

              {chestRewards.freezes > 0 && (
                <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-center gap-3">
                  <span className="text-3xl">🛡️</span>
                  <span className="text-lg font-bold text-blue-600">+{chestRewards.freezes} 連勝保護</span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setShowChestAnimation(false);
                setChestRewards(null);
              }}
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              太好喇！
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestItem({ quest }: { quest: DailyQuest }) {
  const progress = Math.min((quest.current / quest.target) * 100, 100);

  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-xl transition-all
      ${quest.completed ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}
    `}>
      <div className="text-2xl">{quest.emoji}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-bold ${quest.completed ? 'text-green-700' : 'text-gray-700'}`}>
            {quest.nameZh}
          </span>
          {quest.completed && <span className="text-green-500">✓</span>}
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
          <div
            className={`h-full transition-all duration-300 ${
              quest.completed
                ? 'bg-green-500'
                : 'bg-gradient-to-r from-blue-400 to-purple-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-500">{quest.current}/{quest.target}</span>
          <span className="text-purple-600">+{quest.xpReward} XP</span>
        </div>
      </div>
    </div>
  );
}
