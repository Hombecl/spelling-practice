// Word database organized by difficulty
export interface Word {
  word: string;
  phonetic?: string;
  category: string;
}

// Level 1: 2-3 letter words
export const level1Words: Word[] = [
  { word: 'at', category: 'basic' },
  { word: 'it', category: 'basic' },
  { word: 'on', category: 'basic' },
  { word: 'up', category: 'basic' },
  { word: 'go', category: 'basic' },
  { word: 'no', category: 'basic' },
  { word: 'so', category: 'basic' },
  { word: 'we', category: 'basic' },
  { word: 'he', category: 'basic' },
  { word: 'me', category: 'basic' },
  { word: 'cat', category: 'animals' },
  { word: 'dog', category: 'animals' },
  { word: 'pig', category: 'animals' },
  { word: 'hen', category: 'animals' },
  { word: 'bat', category: 'animals' },
  { word: 'rat', category: 'animals' },
  { word: 'ant', category: 'animals' },
  { word: 'red', category: 'colors' },
  { word: 'sun', category: 'nature' },
  { word: 'cup', category: 'objects' },
  { word: 'hat', category: 'objects' },
  { word: 'bag', category: 'objects' },
  { word: 'pen', category: 'objects' },
  { word: 'box', category: 'objects' },
  { word: 'bus', category: 'transport' },
  { word: 'car', category: 'transport' },
  { word: 'run', category: 'actions' },
  { word: 'sit', category: 'actions' },
  { word: 'hop', category: 'actions' },
  { word: 'big', category: 'adjectives' },
  { word: 'hot', category: 'adjectives' },
  { word: 'wet', category: 'adjectives' },
];

// Level 2: 4 letter words
export const level2Words: Word[] = [
  { word: 'book', category: 'objects' },
  { word: 'ball', category: 'objects' },
  { word: 'bird', category: 'animals' },
  { word: 'fish', category: 'animals' },
  { word: 'duck', category: 'animals' },
  { word: 'frog', category: 'animals' },
  { word: 'bear', category: 'animals' },
  { word: 'lion', category: 'animals' },
  { word: 'blue', category: 'colors' },
  { word: 'pink', category: 'colors' },
  { word: 'tree', category: 'nature' },
  { word: 'rain', category: 'nature' },
  { word: 'snow', category: 'nature' },
  { word: 'moon', category: 'nature' },
  { word: 'star', category: 'nature' },
  { word: 'cake', category: 'food' },
  { word: 'milk', category: 'food' },
  { word: 'rice', category: 'food' },
  { word: 'door', category: 'objects' },
  { word: 'desk', category: 'objects' },
  { word: 'lamp', category: 'objects' },
  { word: 'ship', category: 'transport' },
  { word: 'boat', category: 'transport' },
  { word: 'bike', category: 'transport' },
  { word: 'jump', category: 'actions' },
  { word: 'walk', category: 'actions' },
  { word: 'play', category: 'actions' },
  { word: 'read', category: 'actions' },
  { word: 'sing', category: 'actions' },
  { word: 'swim', category: 'actions' },
  { word: 'good', category: 'adjectives' },
  { word: 'fast', category: 'adjectives' },
];

// Level 3: 5+ letter words
export const level3Words: Word[] = [
  { word: 'apple', category: 'food' },
  { word: 'water', category: 'nature' },
  { word: 'house', category: 'places' },
  { word: 'happy', category: 'feelings' },
  { word: 'green', category: 'colors' },
  { word: 'black', category: 'colors' },
  { word: 'white', category: 'colors' },
  { word: 'brown', category: 'colors' },
  { word: 'horse', category: 'animals' },
  { word: 'mouse', category: 'animals' },
  { word: 'sheep', category: 'animals' },
  { word: 'snake', category: 'animals' },
  { word: 'tiger', category: 'animals' },
  { word: 'zebra', category: 'animals' },
  { word: 'bread', category: 'food' },
  { word: 'juice', category: 'food' },
  { word: 'pizza', category: 'food' },
  { word: 'chair', category: 'objects' },
  { word: 'table', category: 'objects' },
  { word: 'clock', category: 'objects' },
  { word: 'phone', category: 'objects' },
  { word: 'train', category: 'transport' },
  { word: 'plane', category: 'transport' },
  { word: 'truck', category: 'transport' },
  { word: 'dance', category: 'actions' },
  { word: 'write', category: 'actions' },
  { word: 'sleep', category: 'actions' },
  { word: 'smile', category: 'actions' },
  { word: 'think', category: 'actions' },
  { word: 'speak', category: 'actions' },
  { word: 'flower', category: 'nature' },
  { word: 'school', category: 'places' },
  { word: 'family', category: 'people' },
  { word: 'friend', category: 'people' },
  { word: 'mother', category: 'people' },
  { word: 'father', category: 'people' },
  { word: 'sister', category: 'people' },
  { word: 'brother', category: 'people' },
  { word: 'teacher', category: 'people' },
  { word: 'student', category: 'people' },
];

export const allWords = {
  1: level1Words,
  2: level2Words,
  3: level3Words,
};

export function getWordsByLevel(level: number): Word[] {
  return allWords[level as keyof typeof allWords] || level1Words;
}

export function getRandomWord(level: number): Word {
  const words = getWordsByLevel(level);
  return words[Math.floor(Math.random() * words.length)];
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
