'use client';

import { useState, useEffect } from 'react';
import { getSettings, updateSetting, UserSettings } from '@/lib/settings';

export default function SettingsPanel() {
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  if (!settings) return null;

  const handleToggle = (key: keyof UserSettings) => {
    const newSettings = updateSetting(key, !settings[key] as boolean);
    setSettings(newSettings);
  };

  const handleLanguageChange = (lang: 'en' | 'zh-HK' | 'both') => {
    const newSettings = updateSetting('speechLanguage', lang);
    setSettings(newSettings);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sound Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <div className="font-bold text-gray-800">
            {settings.soundEnabled ? '🔊' : '🔇'} 語音提示
          </div>
          <div className="text-xs text-gray-500">
            朗讀生字同鼓勵語句
          </div>
        </div>
        <button
          onClick={() => handleToggle('soundEnabled')}
          className={`
            w-14 h-8 rounded-full transition-colors relative
            ${settings.soundEnabled ? 'bg-green-500' : 'bg-gray-300'}
          `}
          role="switch"
          aria-checked={settings.soundEnabled}
          aria-label="語音提示開關"
        >
          <div
            className={`
              w-6 h-6 bg-white rounded-full absolute top-1 transition-transform shadow
              ${settings.soundEnabled ? 'translate-x-7' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Speech Language */}
      {settings.soundEnabled && (
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="font-bold text-gray-800 mb-3">
            🗣️ 鼓勵語言
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`
                flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-colors
                ${settings.speechLanguage === 'en'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-300'
                }
              `}
            >
              English
            </button>
            <button
              onClick={() => handleLanguageChange('zh-HK')}
              className={`
                flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-colors
                ${settings.speechLanguage === 'zh-HK'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-300'
                }
              `}
            >
              廣東話
            </button>
            <button
              onClick={() => handleLanguageChange('both')}
              className={`
                flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-colors
                ${settings.speechLanguage === 'both'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-300'
                }
              `}
            >
              兩種都要
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {settings.speechLanguage === 'en' && '答啱/答錯時用英文鼓勵'}
            {settings.speechLanguage === 'zh-HK' && '答啱/答錯時用廣東話鼓勵'}
            {settings.speechLanguage === 'both' && '答啱/答錯時先英文後廣東話'}
          </div>
        </div>
      )}

      {/* Haptic Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <div className="font-bold text-gray-800">
            📳 觸感回饋
          </div>
          <div className="text-xs text-gray-500">
            答啱/答錯時震動提示
          </div>
        </div>
        <button
          onClick={() => handleToggle('hapticEnabled')}
          className={`
            w-14 h-8 rounded-full transition-colors relative
            ${settings.hapticEnabled ? 'bg-green-500' : 'bg-gray-300'}
          `}
          role="switch"
          aria-checked={settings.hapticEnabled}
          aria-label="觸感回饋開關"
        >
          <div
            className={`
              w-6 h-6 bg-white rounded-full absolute top-1 transition-transform shadow
              ${settings.hapticEnabled ? 'translate-x-7' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Info */}
      <div className="text-center text-gray-400 text-xs mt-2">
        設定會自動儲存
      </div>
    </div>
  );
}
