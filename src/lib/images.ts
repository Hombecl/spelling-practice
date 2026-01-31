// Word image utilities using Unsplash

// Unsplash Source URL (free, no API key needed for basic usage)
export function getWordImageUrl(word: string, size: number = 300): string {
  // Use Unsplash Source for simple image fetching
  // This is a free service that returns a random image based on search term
  const encodedWord = encodeURIComponent(word.toLowerCase());
  return `https://source.unsplash.com/${size}x${size}/?${encodedWord}`;
}

// Alternative: Use a curated list of common word images
// This is more reliable for educational purposes
const CURATED_IMAGES: Record<string, string> = {
  // Animals
  cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=300&fit=crop',
  dog: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=300&fit=crop',
  bird: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=300&h=300&fit=crop',
  fish: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=300&h=300&fit=crop',
  pig: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=300&h=300&fit=crop',
  hen: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=300&h=300&fit=crop',
  duck: 'https://images.unsplash.com/photo-1459682687441-7761439a709d?w=300&h=300&fit=crop',
  frog: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=300&h=300&fit=crop',
  bear: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=300&h=300&fit=crop',
  lion: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=300&h=300&fit=crop',
  horse: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=300&h=300&fit=crop',
  mouse: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=300&h=300&fit=crop',
  sheep: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=300&h=300&fit=crop',
  snake: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?w=300&h=300&fit=crop',
  tiger: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=300&h=300&fit=crop',
  zebra: 'https://images.unsplash.com/photo-1526095179574-86e545f5e893?w=300&h=300&fit=crop',
  fox: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=300&h=300&fit=crop',
  bat: 'https://images.unsplash.com/photo-1593085260707-5377ba37f868?w=300&h=300&fit=crop',
  rat: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=300&h=300&fit=crop',
  ant: 'https://images.unsplash.com/photo-1518882605630-8eb009080500?w=300&h=300&fit=crop',

  // Food
  apple: 'https://images.unsplash.com/photo-1584306812952-3a7f40efc0e3?w=300&h=300&fit=crop',
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=300&fit=crop',
  milk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop',
  rice: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=300&h=300&fit=crop',
  bread: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=300&h=300&fit=crop',
  juice: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=300&h=300&fit=crop',
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=300&fit=crop',
  water: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&h=300&fit=crop',

  // Nature
  sun: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop',
  moon: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=300&h=300&fit=crop',
  star: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=300&h=300&fit=crop',
  tree: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=300&h=300&fit=crop',
  rain: 'https://images.unsplash.com/photo-1428592953211-077101b2021b?w=300&h=300&fit=crop',
  snow: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=300&h=300&fit=crop',
  flower: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=300&h=300&fit=crop',

  // Objects
  book: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=300&fit=crop',
  ball: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop',
  cup: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=300&h=300&fit=crop',
  hat: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=300&h=300&fit=crop',
  bag: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop',
  pen: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300&h=300&fit=crop',
  box: 'https://images.unsplash.com/photo-1607166452427-7e4477079cb9?w=300&h=300&fit=crop',
  door: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop',
  desk: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=300&h=300&fit=crop',
  lamp: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300&h=300&fit=crop',
  chair: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=300&h=300&fit=crop',
  table: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=300&h=300&fit=crop',
  clock: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=300&h=300&fit=crop',
  phone: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop',
  bed: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=300&h=300&fit=crop',
  net: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop',

  // Transport
  bus: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&h=300&fit=crop',
  car: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=300&h=300&fit=crop',
  ship: 'https://images.unsplash.com/photo-1534951009808-766178b47a4f?w=300&h=300&fit=crop',
  boat: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&h=300&fit=crop',
  bike: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=300&h=300&fit=crop',
  train: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=300&h=300&fit=crop',
  plane: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=300&h=300&fit=crop',
  truck: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=300&h=300&fit=crop',

  // Colors
  red: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=300&h=300&fit=crop',
  blue: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=300&h=300&fit=crop',
  pink: 'https://images.unsplash.com/photo-1557682260-96773eb01377?w=300&h=300&fit=crop',
  green: 'https://images.unsplash.com/photo-1557682268-e3955ed5d83f?w=300&h=300&fit=crop',
  black: 'https://images.unsplash.com/photo-1557682233-43e671455dfa?w=300&h=300&fit=crop',
  white: 'https://images.unsplash.com/photo-1557682257-2f9c37a3a5f3?w=300&h=300&fit=crop',
  brown: 'https://images.unsplash.com/photo-1557682250-0f8f7f2f7b28?w=300&h=300&fit=crop',
  orange: 'https://images.unsplash.com/photo-1557682204-e53f4e78e850?w=300&h=300&fit=crop',
  yellow: 'https://images.unsplash.com/photo-1557682204-e33f4e78e850?w=300&h=300&fit=crop',
  purple: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=300&h=300&fit=crop',

  // Places
  house: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=300&h=300&fit=crop',
  school: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=300&h=300&fit=crop',

  // People
  family: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=300&h=300&fit=crop',
  friend: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&h=300&fit=crop',
  mother: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop',
  father: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=300&h=300&fit=crop',
  sister: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop',
  brother: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=300&h=300&fit=crop',
  teacher: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&h=300&fit=crop',
  student: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=300&h=300&fit=crop',

  // Actions (using representative images)
  run: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=300&h=300&fit=crop',
  sit: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=300&h=300&fit=crop',
  jump: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=300&h=300&fit=crop',
  walk: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=300&h=300&fit=crop',
  swim: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=300&h=300&fit=crop',
  play: 'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=300&h=300&fit=crop',
  read: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=300&h=300&fit=crop',
  sing: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
  dance: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=300&h=300&fit=crop',
  write: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=300&h=300&fit=crop',
  sleep: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=300&h=300&fit=crop',
  smile: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=300&h=300&fit=crop',

  // Adjectives (using representative images)
  big: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=300&h=300&fit=crop',
  hot: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop',
  wet: 'https://images.unsplash.com/photo-1428592953211-077101b2021b?w=300&h=300&fit=crop',
  fast: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=300&h=300&fit=crop',
  good: 'https://images.unsplash.com/photo-1531747056595-07f6cbbe10ad?w=300&h=300&fit=crop',
  happy: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=300&h=300&fit=crop',
};

// Get image URL for a word (curated or fallback to Unsplash)
export function getImageForWord(word: string): string | null {
  const w = word.toLowerCase().trim();

  // Check curated images first
  if (CURATED_IMAGES[w]) {
    return CURATED_IMAGES[w];
  }

  // Fallback to Unsplash Source
  return getWordImageUrl(w);
}

// Check if we have a curated image for a word
export function hasCuratedImage(word: string): boolean {
  return word.toLowerCase().trim() in CURATED_IMAGES;
}
