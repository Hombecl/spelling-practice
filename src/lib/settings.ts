/**
 * User settings management using localStorage
 */

export interface UserSettings {
  // Audio settings
  soundEnabled: boolean;
  speechLanguage: 'en' | 'zh-HK' | 'both'; // English, Cantonese, or both
  hapticEnabled: boolean;

  // Display settings
  showPhonicsHints: boolean;
}

const SETTINGS_KEY = 'spelling-practice-settings';

const defaultSettings: UserSettings = {
  soundEnabled: true,
  speechLanguage: 'both', // Default to both English and Cantonese
  hapticEnabled: true,
  showPhonicsHints: true,
};

export function getSettings(): UserSettings {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }

  return defaultSettings;
}

export function saveSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

export function updateSetting<K extends keyof UserSettings>(
  key: K,
  value: UserSettings[K]
): UserSettings {
  const settings = getSettings();
  const newSettings = { ...settings, [key]: value };
  saveSettings(newSettings);
  return newSettings;
}

export function isSoundEnabled(): boolean {
  return getSettings().soundEnabled;
}

export function isHapticEnabled(): boolean {
  return getSettings().hapticEnabled;
}

export function getSpeechLanguage(): 'en' | 'zh-HK' | 'both' {
  return getSettings().speechLanguage;
}
