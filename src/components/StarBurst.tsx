'use client';

import { useEffect, useState } from 'react';

interface StarBurstProps {
  show: boolean;
  count?: number;
}

export default function StarBurst({ show, count = 3 }: StarBurstProps) {
  const [stars, setStars] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    if (show) {
      const newStars = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.3,
      }));
      setStars(newStars);
    } else {
      setStars([]);
    }
  }, [show, count]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute text-6xl animate-star-burst"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            animationDelay: `${star.delay}s`,
          }}
        >
          ⭐
        </div>
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-8xl animate-bounce-in">🎉</div>
      </div>
    </div>
  );
}
