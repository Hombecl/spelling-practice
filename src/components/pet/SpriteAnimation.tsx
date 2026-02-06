'use client';

import { useState, useEffect, useRef } from 'react';

interface SpriteAnimationProps {
  spriteSheet: string; // Path to sprite sheet image
  frameWidth: number;  // Width of each frame
  frameHeight: number; // Height of each frame
  columns: number;     // Number of columns in sprite sheet
  rows: number;        // Number of rows in sprite sheet
  fps?: number;        // Frames per second (default: 8)
  scale?: number;      // Scale factor (default: 1)
  className?: string;  // Additional CSS classes
}

export default function SpriteAnimation({
  spriteSheet,
  frameWidth,
  frameHeight,
  columns,
  rows,
  fps = 8,
  scale = 1,
  className = '',
}: SpriteAnimationProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const totalFrames = columns * rows;
  const displayWidth = frameWidth * scale;
  const displayHeight = frameHeight * scale;

  // Load the sprite sheet image
  useEffect(() => {
    const img = new Image();
    img.src = spriteSheet;
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error('Failed to load sprite sheet:', spriteSheet);
    };
  }, [spriteSheet]);

  // Animation loop
  useEffect(() => {
    if (!imageLoaded) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % totalFrames);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [imageLoaded, totalFrames, fps]);

  // Draw current frame to canvas
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate source position in sprite sheet
    const col = currentFrame % columns;
    const row = Math.floor(currentFrame / columns);
    const sourceX = col * frameWidth;
    const sourceY = row * frameHeight;

    // Clear and draw
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.imageSmoothingEnabled = false; // Keep pixel art crisp

    ctx.drawImage(
      imageRef.current,
      sourceX, sourceY,           // Source position
      frameWidth, frameHeight,    // Source size
      0, 0,                       // Destination position
      displayWidth, displayHeight // Destination size
    );
  }, [currentFrame, imageLoaded, frameWidth, frameHeight, columns, displayWidth, displayHeight]);

  if (!imageLoaded) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width: displayWidth, height: displayHeight }}
      >
        <div className="animate-pulse bg-gray-200 rounded-lg w-full h-full" />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={displayWidth}
      height={displayHeight}
      className={`${className}`}
      style={{
        imageRendering: 'pixelated',
        width: displayWidth,
        height: displayHeight,
      }}
    />
  );
}
