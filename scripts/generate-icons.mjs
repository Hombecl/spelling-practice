import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const iconsDir = join(rootDir, 'public', 'icons');

// Ensure icons directory exists
mkdirSync(iconsDir, { recursive: true });

// Read SVG
const svgPath = join(iconsDir, 'icon.svg');
const svgBuffer = readFileSync(svgPath);

// Icon sizes for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  console.log('Generating PWA icons...');

  for (const size of sizes) {
    const outputPath = join(iconsDir, `icon-${size}x${size}.png`);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`  Created: icon-${size}x${size}.png`);
  }

  // Also create apple-touch-icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(rootDir, 'public', 'apple-touch-icon.png'));
  console.log('  Created: apple-touch-icon.png');

  // Create favicon (32x32)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(rootDir, 'public', 'favicon.png'));
  console.log('  Created: favicon.png');

  console.log('Done!');
}

generateIcons().catch(console.error);
