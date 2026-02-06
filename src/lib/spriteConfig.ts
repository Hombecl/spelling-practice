import { PetStage } from './pet';

// Sprite sheet configuration
export interface SpriteConfig {
  path: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  fps: number;
}

// Define which species have sprite sheets available
export const SPRITE_ENABLED_SPECIES = ['pixel_unicorn', 'pixel_dragon'] as const;
export type SpriteEnabledSpecies = typeof SPRITE_ENABLED_SPECIES[number];

// Check if a species has sprite sheets
export function hasSpriteSheet(species: string): species is SpriteEnabledSpecies {
  return SPRITE_ENABLED_SPECIES.includes(species as SpriteEnabledSpecies);
}

// Get sprite sheet configuration for a species and stage
export function getSpriteConfig(species: string, stage: PetStage): SpriteConfig | null {
  if (!hasSpriteSheet(species)) {
    return null;
  }

  // All our sprite sheets are 3x3 grids with 9 frames
  // Image is 512x512 (compressed), so each frame is ~170x170 pixels
  const baseConfig = {
    frameWidth: 170,
    frameHeight: 170,
    columns: 3,
    rows: 3,
    fps: 6, // Smooth idle animation speed
  };

  const path = `/pet/sprites/${species}-${stage}.png`;

  return {
    ...baseConfig,
    path,
  };
}

// Get all sprite configs for a species
export function getAllSpriteConfigs(species: string): Record<PetStage, SpriteConfig | null> {
  const stages: PetStage[] = ['egg', 'baby', 'child', 'teen', 'adult'];
  const configs: Record<string, SpriteConfig | null> = {};

  for (const stage of stages) {
    configs[stage] = getSpriteConfig(species, stage);
  }

  return configs as Record<PetStage, SpriteConfig | null>;
}
