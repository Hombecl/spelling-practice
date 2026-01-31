'use client';

import { BADGES } from '@/lib/progress';

interface BadgeDisplayProps {
  earnedBadges: string[];
  showAll?: boolean;
}

export default function BadgeDisplay({ earnedBadges, showAll = false }: BadgeDisplayProps) {
  const badgeEntries = Object.entries(BADGES);

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">
        🏅 獎章 Badges
      </h2>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {badgeEntries.map(([id, badge]) => {
          const isEarned = earnedBadges.includes(id);

          if (!showAll && !isEarned) return null;

          return (
            <div
              key={id}
              className={`
                flex flex-col items-center p-3 rounded-xl transition-all
                ${
                  isEarned
                    ? 'bg-yellow-50 border-2 border-yellow-300'
                    : 'bg-gray-100 border-2 border-gray-200 opacity-40'
                }
              `}
            >
              <div className={`text-4xl ${isEarned ? '' : 'grayscale'}`}>
                {badge.emoji}
              </div>
              <div className="text-xs font-bold text-gray-700 text-center mt-1">
                {badge.name}
              </div>
              <div className="text-xs text-gray-500 text-center">
                {badge.description}
              </div>
            </div>
          );
        })}
      </div>

      {earnedBadges.length === 0 && (
        <p className="text-center text-gray-500 mt-4">
          繼續練習嚟攞獎章！ Keep practicing to earn badges!
        </p>
      )}
    </div>
  );
}
