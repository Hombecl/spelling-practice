'use client';

import { useEffect, useState } from 'react';

interface XPGainAnimationProps {
  amount: number;
  onComplete?: () => void;
}

export default function XPGainAnimation({ amount, onComplete }: XPGainAnimationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="animate-xp-float">
        <div className="
          px-6 py-3
          bg-gradient-to-r from-purple-500 to-pink-500
          text-white font-bold text-2xl
          rounded-full
          shadow-lg
          flex items-center gap-2
        ">
          <span className="animate-pulse">⚡</span>
          <span>+{amount} XP</span>
        </div>
      </div>
    </div>
  );
}
