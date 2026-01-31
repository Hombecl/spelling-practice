'use client';

interface ModeSelectorProps {
  currentMode: 'phonics' | 'fill' | 'spell';
  onSelectMode: (mode: 'phonics' | 'fill' | 'spell') => void;
}

export default function ModeSelector({ currentMode, onSelectMode }: ModeSelectorProps) {
  const modes = [
    {
      mode: 'phonics' as const,
      stage: '第一階段',
      name: 'Phonics 認字',
      description: '睇字 → 學拆件 → 認讀音',
      emoji: '📖',
      color: 'blue',
    },
    {
      mode: 'fill' as const,
      stage: '第二階段',
      name: '填充練習',
      description: '聽讀音 → 填漏咗嘅字母',
      emoji: '✏️',
      color: 'yellow',
    },
    {
      mode: 'spell' as const,
      stage: '第三階段',
      name: '完整串字',
      description: '聽讀音 → 自己串成個字',
      emoji: '🏆',
      color: 'green',
    },
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors: Record<string, { selected: string; unselected: string; badge: string }> = {
      blue: {
        selected: 'bg-blue-50 border-blue-400',
        unselected: 'bg-white border-gray-200 hover:border-blue-300',
        badge: 'bg-blue-100 text-blue-700',
      },
      yellow: {
        selected: 'bg-yellow-50 border-yellow-400',
        unselected: 'bg-white border-gray-200 hover:border-yellow-300',
        badge: 'bg-yellow-100 text-yellow-700',
      },
      green: {
        selected: 'bg-green-50 border-green-400',
        unselected: 'bg-white border-gray-200 hover:border-green-300',
        badge: 'bg-green-100 text-green-700',
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="w-full max-w-lg">
      <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">
        🎯 選擇練習階段
      </h2>

      {/* Progress Arrow */}
      <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-4">
        <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded">認字</span>
        <span>→</span>
        <span className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded">填充</span>
        <span>→</span>
        <span className="px-2 py-1 bg-green-100 text-green-600 rounded">串字</span>
      </div>

      <div className="flex flex-col gap-3">
        {modes.map(({ mode, stage, name, description, emoji, color }) => {
          const isSelected = currentMode === mode;
          const colorClasses = getColorClasses(color, isSelected);

          return (
            <button
              key={mode}
              onClick={() => onSelectMode(mode)}
              className={`
                w-full p-4 rounded-xl border-2 text-left transition-all
                active:scale-98
                ${isSelected ? colorClasses.selected + ' shadow-md' : colorClasses.unselected}
              `}
            >
              <div className="flex items-center gap-3">
                <div className="text-4xl">{emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${colorClasses.badge}`}>
                      {stage}
                    </span>
                  </div>
                  <div className="font-bold text-gray-800 text-lg">{name}</div>
                  <div className="text-sm text-gray-500">{description}</div>
                </div>
                {isSelected && (
                  <span className="text-2xl">✓</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-gray-400 text-sm mt-4">
        💡 循序漸進：先認字，再填充，最後完整串字
      </p>
    </div>
  );
}
