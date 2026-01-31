'use client';

interface ModeSelectorProps {
  currentMode: 'choose' | 'fill' | 'spell';
  onSelectMode: (mode: 'choose' | 'fill' | 'spell') => void;
}

export default function ModeSelector({ currentMode, onSelectMode }: ModeSelectorProps) {
  const modes = [
    {
      mode: 'choose' as const,
      name: '揀字母',
      description: '最簡單，聽讀音揀啱嘅字母',
      emoji: '🎯',
      difficulty: '初級',
    },
    {
      mode: 'fill' as const,
      name: '填充題',
      description: '填返漏咗嘅字母',
      emoji: '✏️',
      difficulty: '中級',
    },
    {
      mode: 'spell' as const,
      name: '完整串字',
      description: '自己串出成個字',
      emoji: '🏆',
      difficulty: '進階',
    },
  ];

  return (
    <div className="w-full max-w-lg">
      <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">
        🎮 練習模式
      </h2>
      <div className="flex flex-col gap-3">
        {modes.map(({ mode, name, description, emoji, difficulty }) => {
          const isSelected = currentMode === mode;

          return (
            <button
              key={mode}
              onClick={() => onSelectMode(mode)}
              className={`
                w-full p-4 rounded-xl border-2 text-left transition-all
                active:scale-98
                ${
                  isSelected
                    ? 'bg-purple-50 border-purple-400 shadow-md'
                    : 'bg-white border-gray-200 hover:border-purple-300'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 text-lg">{name}</span>
                    <span
                      className={`
                        text-xs px-2 py-0.5 rounded-full
                        ${
                          mode === 'choose'
                            ? 'bg-green-100 text-green-700'
                            : mode === 'fill'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }
                      `}
                    >
                      {difficulty}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{description}</div>
                </div>
                {isSelected && (
                  <span className="text-purple-500 text-xl">✓</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-center text-gray-400 text-sm mt-3">
        💡 建議由「揀字母」開始
      </p>
    </div>
  );
}
