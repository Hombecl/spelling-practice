// Text-to-Speech utility for reading words aloud

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

export async function speak(text: string, rate: number = 0.8): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
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

export function speakTryAgain(): void {
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
