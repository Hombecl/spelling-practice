'use client';

import { useState, useEffect } from 'react';
import {
  getDailyEngagement,
  getStreakStatus,
  DailyEngagement,
  STREAK_MILESTONES,
} from '@/lib/dailySystem';

interface DailyStreakProps {
  onStreakUpdate?: (streak: number) => void;
}

export default function DailyStreak({ onStreakUpdate }: DailyStreakProps) {
  const [status, setStatus] = useState<ReturnType<typeof getStreakStatus> | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const s = getStreakStatus();
    setStatus(s);
    onStreakUpdate?.(s.current);
  }, [onStreakUpdate]);

  if (!status) return null;

  const progressToNext = status.nextMilestone
    ? ((status.current / status.nextMilestone.days) * 100)
    : 100;

  return (
    <>
      {/* Compact streak display */}
      <button
        onClick={() => setShowDetails(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all"
      >
        <span className="text-lg">🔥</span>
        <span className="font-bold">{status.current}</span>
        {status.freezesAvailable > 0 && (
          <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
            🛡️ {status.freezesAvailable}
          </span>
        )}
      </button>

      {/* Details modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">🔥</div>
              <h2 className="text-3xl font-bold text-orange-600">{status.current} 日連勝</h2>
              <p className="text-gray-500 text-sm">最長紀錄: {status.longest} 日</p>
            </div>

            {/* Progress to next milestone */}
            {status.nextMilestone && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">下一個里程碑</span>
                  <span className="font-bold text-orange-600">
                    {status.nextMilestone.emoji} {status.nextMilestone.days} 日
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500"
                    style={{ width: `${Math.min(progressToNext, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1 text-center">
                  仲差 {status.daysUntilNextMilestone} 日
                </div>
              </div>
            )}

            {/* Streak freezes */}
            <div className="bg-blue-50 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <div className="font-bold text-blue-700">連勝保護</div>
                    <div className="text-xs text-blue-500">可以保住一日唔練習</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {status.freezesAvailable}
                </div>
              </div>
            </div>

            {/* Milestone list */}
            <div className="mb-4">
              <h3 className="font-bold text-gray-700 mb-2">🏆 里程碑獎勵</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {STREAK_MILESTONES.map((m) => (
                  <div
                    key={m.days}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      status.current >= m.days
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={status.current >= m.days ? '' : 'grayscale opacity-50'}>
                        {m.emoji}
                      </span>
                      <span className={`text-sm ${status.current >= m.days ? 'text-green-700 font-bold' : 'text-gray-600'}`}>
                        {m.days} 日
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-purple-600">+{m.xp} XP</span>
                      {status.current >= m.days && (
                        <span className="text-green-500">✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-yellow-50 rounded-xl p-3 mb-4">
              <div className="text-sm text-yellow-700">
                💡 <strong>小貼士:</strong> 每日練習可以獲得連勝保護！完成 3 個每日任務有 30% 機會拎到。
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowDetails(false)}
              className="w-full py-3 bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              繼續練習 🔥
            </button>
          </div>
        </div>
      )}
    </>
  );
}
