// Text-to-Speech utility for reading words aloud

import { isSoundEnabled, getSpeechLanguage } from './settings';

// Cache for voices - they may not be available immediately
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesInitialized = false;

// Initialize voices when available
function initVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      return;
    }

    // Already initialized
    if (voicesInitialized && cachedVoices.length > 0) {
      resolve(cachedVoices);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      cachedVoices = voices;
      voicesInitialized = true;
      resolve(voices);
      return;
    }

    // Wait for voices to load (Chrome loads them async)
    const handleVoicesChanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      voicesInitialized = true;
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      resolve(cachedVoices);
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    // Fallback timeout in case event never fires
    setTimeout(() => {
      if (!voicesInitialized) {
        cachedVoices = window.speechSynthesis.getVoices();
        voicesInitialized = true;
        resolve(cachedVoices);
      }
    }, 500);
  });
}

// Get the best voice for English
function getBestVoice(): SpeechSynthesisVoice | null {
  if (cachedVoices.length === 0 && typeof window !== 'undefined' && window.speechSynthesis) {
    cachedVoices = window.speechSynthesis.getVoices();
  }

  if (cachedVoices.length === 0) return null;

  // Prefer these voices in order (common on macOS/iOS)
  const preferredNames = ['Samantha', 'Google US English', 'Google UK English Female', 'Alex', 'Victoria', 'Karen', 'Daniel'];

  for (const name of preferredNames) {
    const voice = cachedVoices.find(v => v.name.includes(name));
    if (voice) return voice;
  }

  // Fallback to any English voice
  return cachedVoices.find(v => v.lang.startsWith('en')) || cachedVoices[0] || null;
}

// Get the best voice for Cantonese/Chinese
function getCantoneseVoice(): SpeechSynthesisVoice | null {
  if (cachedVoices.length === 0 && typeof window !== 'undefined' && window.speechSynthesis) {
    cachedVoices = window.speechSynthesis.getVoices();
  }

  if (cachedVoices.length === 0) return null;

  // Try Cantonese first (zh-HK)
  const cantoneseVoice = cachedVoices.find(v =>
    v.lang === 'zh-HK' ||
    v.lang.startsWith('zh-HK') ||
    v.name.includes('Cantonese') ||
    v.name.includes('Sin-Ji') // macOS Cantonese voice
  );
  if (cantoneseVoice) return cantoneseVoice;

  // Fallback to Traditional Chinese (zh-TW)
  const twVoice = cachedVoices.find(v =>
    v.lang === 'zh-TW' ||
    v.lang.startsWith('zh-TW') ||
    v.name.includes('Mei-Jia')
  );
  if (twVoice) return twVoice;

  // Fallback to any Chinese voice
  return cachedVoices.find(v => v.lang.startsWith('zh')) || null;
}

export async function speak(text: string, rate: number = 0.8): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }

  // Check if sound is enabled
  if (!isSoundEnabled()) {
    return;
  }

  // Ensure voices are loaded first
  await initVoices();

  return new Promise((resolve) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate; // Slower for children
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = 'en-US';

    // Use best available voice
    const voice = getBestVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      resolve();
    };

    // Workaround for Chrome bug: speech may not start if called too quickly after cancel
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  });
}

export function speakLetter(letter: string): Promise<void> {
  return speak(letter, 0.7);
}

export function speakWord(word: string): Promise<void> {
  return speak(word, 0.6);
}

export function speakSpelling(word: string): Promise<void> {
  // Speak each letter with pauses
  const letters = word.split('').join(', ');
  return speak(letters, 0.5);
}

export function speakEncouragement(): void {
  const lang = getSpeechLanguage();

  if (lang === 'en' || lang === 'both') {
    const phrases = [
      'Great job!',
      'Well done!',
      'Excellent!',
      'You did it!',
      'Amazing!',
      'Fantastic!',
      'Super!',
      'Wonderful!',
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    speak(phrase, 0.9);
  }

  if (lang === 'zh-HK' || lang === 'both') {
    // Delay Cantonese if playing both
    const delay = lang === 'both' ? 800 : 0;
    setTimeout(() => speakCantoneseEncouragement(), delay);
  }
}

export function speakTryAgain(): void {
  const lang = getSpeechLanguage();

  if (lang === 'en' || lang === 'both') {
    const phrases = [
      'Try again!',
      'Almost there!',
      'You can do it!',
      'One more try!',
      "Let's try again!",
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    speak(phrase, 0.9);
  }

  if (lang === 'zh-HK' || lang === 'both') {
    // Delay Cantonese if playing both
    const delay = lang === 'both' ? 800 : 0;
    setTimeout(() => speakCantoneseTryAgain(), delay);
  }
}

// Speak in Cantonese
export async function speakCantonese(text: string, rate: number = 0.9): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }

  // Check if sound is enabled
  if (!isSoundEnabled()) {
    return;
  }

  await initVoices();

  return new Promise((resolve) => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voice = getCantoneseVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'zh-HK';
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  });
}

// Cantonese encouragement for correct answers
export function speakCantoneseEncouragement(): void {
  const phrases = [
    '做得好！',
    '好叻呀！',
    '太棒了！',
    '勁呀！',
    '好威呀！',
    '正呀！',
    '好嘢！',
    '叻仔！',
  ];
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  speakCantonese(phrase, 1.0);
}

// Cantonese encouragement for wrong answers (gentle)
export function speakCantoneseTryAgain(): void {
  const phrases = [
    '再試吓！',
    '加油！',
    '你得㗎！',
    '差啲啫！',
    '慢慢嚟！',
    '唔好急！',
    '試多次！',
    '繼續努力！',
  ];
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  speakCantonese(phrase, 1.0);
}
