'use client';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  showStars?: boolean;
  stars?: number;
}

export default function ProgressBar({
  current,
  total,
  label,
  showStars = false,
  stars = 0,
}: ProgressBarProps) {
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <div className="w-full max-w-md">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-medium text-gray-700">{label}</span>
          {showStars && (
            <span className="text-lg font-bold text-yellow-500">
              ⭐ {stars}
            </span>
          )}
        </div>
      )}
      <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
          style={{ width: `${percentage}%` }}
        >
          {percentage > 15 && (
            <span className="text-white text-xs font-bold">
              {current}/{total}
            </span>
          )}
        </div>
      </div>
      {percentage <= 15 && (
        <div className="text-right mt-1">
          <span className="text-sm text-gray-500">
            {current}/{total}
          </span>
        </div>
      )}
    </div>
  );
}
