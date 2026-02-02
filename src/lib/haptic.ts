/**
 * Haptic feedback utilities for better tactile response
 * Works on mobile devices that support vibration API
 */

import { isHapticEnabled } from './settings';

// Check if vibration is supported and enabled
export function isHapticSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator && isHapticEnabled();
}

// Light tap feedback - for button presses
export function hapticTap(): void {
  if (isHapticSupported()) {
    navigator.vibrate(10);
  }
}

// Medium feedback - for selections
export function hapticSelect(): void {
  if (isHapticSupported()) {
    navigator.vibrate(20);
  }
}

// Success feedback - for correct answers
export function hapticSuccess(): void {
  if (isHapticSupported()) {
    navigator.vibrate([30, 50, 30]); // Two short pulses
  }
}

// Error feedback - for wrong answers
export function hapticError(): void {
  if (isHapticSupported()) {
    navigator.vibrate([100, 30, 100, 30, 100]); // Three pulses
  }
}

// Level up / celebration feedback
export function hapticCelebration(): void {
  if (isHapticSupported()) {
    navigator.vibrate([50, 50, 50, 50, 100, 50, 100]); // Fancy pattern
  }
}

// Warning feedback
export function hapticWarning(): void {
  if (isHapticSupported()) {
    navigator.vibrate([50, 100, 50]); // Two pulses with pause
  }
}

// Custom pattern
export function hapticPattern(pattern: number | number[]): void {
  if (isHapticSupported()) {
    navigator.vibrate(pattern);
  }
}
