// Custom word list management

export interface CustomWordList {
  id: string;
  name: string;
  words: string[];
  createdAt: string;
  lastUsed?: string;
}

const STORAGE_KEY = 'spelling-practice-custom-words';

export function getCustomWordLists(): CustomWordList[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading custom word lists:', e);
  }

  return [];
}

export function saveCustomWordLists(lists: CustomWordList[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch (e) {
    console.error('Error saving custom word lists:', e);
  }
}

export function createWordList(name: string, wordsText: string): CustomWordList {
  // Parse words from text (supports comma, newline, space separation)
  const words = wordsText
    .split(/[,\n\s]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0 && /^[a-z]+$/.test(w));

  // Remove duplicates
  const uniqueWords = [...new Set(words)];

  const newList: CustomWordList = {
    id: Date.now().toString(),
    name: name.trim() || `默書 ${new Date().toLocaleDateString('zh-HK')}`,
    words: uniqueWords,
    createdAt: new Date().toISOString(),
  };

  const lists = getCustomWordLists();
  lists.unshift(newList);
  saveCustomWordLists(lists);

  return newList;
}

export function updateWordList(id: string, name: string, wordsText: string): CustomWordList | null {
  const lists = getCustomWordLists();
  const index = lists.findIndex((l) => l.id === id);

  if (index === -1) return null;

  const words = wordsText
    .split(/[,\n\s]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0 && /^[a-z]+$/.test(w));

  const uniqueWords = [...new Set(words)];

  lists[index] = {
    ...lists[index],
    name: name.trim() || lists[index].name,
    words: uniqueWords,
  };

  saveCustomWordLists(lists);
  return lists[index];
}

export function deleteWordList(id: string): void {
  const lists = getCustomWordLists();
  const filtered = lists.filter((l) => l.id !== id);
  saveCustomWordLists(filtered);
}

export function markWordListUsed(id: string): void {
  const lists = getCustomWordLists();
  const list = lists.find((l) => l.id === id);
  if (list) {
    list.lastUsed = new Date().toISOString();
    saveCustomWordLists(lists);
  }
}

export function getWordListById(id: string): CustomWordList | null {
  const lists = getCustomWordLists();
  return lists.find((l) => l.id === id) || null;
}
