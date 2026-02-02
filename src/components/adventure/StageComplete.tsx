'use client';

import { World, Stage } from '@/lib/adventure';

interface StageCompleteProps {
  world: World;
  stage: Stage;
  stars: number;
  correctCount: number;
  totalCount: number;
  onContinue: () => void;
  onRetry: () => void;
}

export default function StageComplete({
  world,
  stage,
  stars,
  correctCount,
  totalCount,
  onContinue,
  onRetry,
}: StageCompleteProps) {
  const isPerfect = stars === 3;
  const passed = stars > 0;

  return (
    <div className={`min-h-screen bg-gradient-to-b ${world.bgGradient} flex items-center justify-center p-4`}>
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-scale-in">
        {/* Result Header */}
        <div className="text-5xl mb-4">
          {passed ? (isPerfect ? '🎉' : '👍') : '😢'}
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          {passed ? (isPerfect ? '完美通關！' : '恭喜過關！') : '再試一次！'}
        </h2>

        <p className="text-gray-500 text-sm mb-4">
          {stage.emoji} {stage.nameZh}
        </p>

        {/* Stars Display */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={`text-4xl transition-all duration-300 ${
                s <= stars ? 'scale-110 animate-bounce-once' : 'opacity-30 grayscale'
              }`}
              style={{ animationDelay: `${s * 0.2}s` }}
            >
              ⭐
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex justify-around">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{correctCount}</div>
              <div className="text-xs text-gray-500">答啱</div>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{totalCount}</div>
              <div className="text-xs text-gray-500">總共</div>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">+{stage.rewards.xp + stars * 5}</div>
              <div className="text-xs text-gray-500">XP</div>
            </div>
          </div>
        </div>

        {/* Rewards */}
        {passed && (
          <div className="bg-yellow-50 rounded-xl p-3 mb-6">
            <div className="flex items-center justify-center gap-2">
              <span className="text-yellow-500">⭐</span>
              <span className="font-bold text-yellow-700">+{stage.rewards.stars + stars}</span>
              <span className="text-gray-500 text-sm">星星</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className={`
              flex-1 py-3 rounded-xl font-bold transition-all
              ${passed
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gradient-to-r from-orange-400 to-orange-600 text-white hover:shadow-lg'}
            `}
          >
            {passed ? '再玩一次' : '重新挑戰'}
          </button>
          {passed && (
            <button
              onClick={onContinue}
              className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-green-400 to-green-600 text-white hover:shadow-lg transition-all"
            >
              繼續 →
            </button>
          )}
        </div>

        {/* Perfect bonus message */}
        {isPerfect && (
          <p className="mt-4 text-sm text-purple-600 font-medium">
            完美表現！獲得額外獎勵！
          </p>
        )}
      </div>
    </div>
  );
}
