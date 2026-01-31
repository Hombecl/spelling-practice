// Text-to-Speech utility for reading words aloud

export function speak(text: string, rate: number = 0.8): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate; // Slower for children
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = 'en-US';

    // Try to use a clear voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (voice) =>
        voice.lang.startsWith('en') &&
        (voice.name.includes('Samantha') ||
          voice.name.includes('Google') ||
          voice.name.includes('Female'))
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
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
