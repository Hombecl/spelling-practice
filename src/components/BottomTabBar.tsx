'use client';

export type Tab = 'play' | 'pet' | 'adventure' | 'parent';

interface BottomTabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; emoji: string }[] = [
  { id: 'play', label: '玩', emoji: '🎮' },
  { id: 'adventure', label: '冒險', emoji: '🗺️' },
  { id: 'pet', label: '寵物', emoji: '🐲' },
  { id: 'parent', label: '家長', emoji: '👨‍👩‍👧' },
];

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg safe-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center
                flex-1 h-full py-2
                transition-all duration-200
                ${isActive
                  ? 'text-purple-600'
                  : 'text-gray-400 hover:text-gray-600'}
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={`text-2xl ${isActive ? 'scale-110' : ''} transition-transform`}>
                {tab.emoji}
              </span>
              <span className={`text-xs mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-1 bg-purple-500 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
