'use client';

import { useState } from 'react';
import PinInput from './PinInput';
import { login, register, AuthUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
  onSkip: () => void;
}

type Mode = 'choose' | 'login' | 'register';

export default function LoginScreen({ onLogin, onSkip }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>('choose');
  const [displayName, setDisplayName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isConfigured = isSupabaseConfigured();

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    const result = await login(displayName, pin);

    setLoading(false);

    if (result.success && result.user) {
      onLogin(result.user);
    } else {
      setError(result.error || '登入失敗');
    }
  };

  const handleRegister = async () => {
    setError('');

    // Validate PIN match
    if (pin !== confirmPin) {
      setError('兩次 PIN 碼唔一樣');
      return;
    }

    setLoading(true);

    const result = await register(displayName, pin);

    setLoading(false);

    if (result.success && result.user) {
      onLogin(result.user);
    } else {
      setError(result.error || '註冊失敗');
    }
  };

  const resetForm = () => {
    setDisplayName('');
    setPin('');
    setConfirmPin('');
    setError('');
  };

  // Choose screen
  if (mode === 'choose') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🐉</div>
            <h1 className="text-2xl font-bold text-gray-800">串字練習</h1>
            <p className="text-gray-500 mt-2">Spelling Practice</p>
          </div>

          {isConfigured ? (
            <>
              {/* Login Button */}
              <button
                onClick={() => { setMode('login'); resetForm(); }}
                className="w-full py-4 bg-purple-500 text-white rounded-2xl font-bold text-lg mb-4 hover:bg-purple-600 transition-colors"
              >
                我有帳號 📱
              </button>

              {/* Register Button */}
              <button
                onClick={() => { setMode('register'); resetForm(); }}
                className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold text-lg mb-4 hover:bg-blue-600 transition-colors"
              >
                建立新帳號 ✨
              </button>

              {/* Divider */}
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-4 text-gray-400 text-sm">或者</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <p className="text-yellow-700 text-sm text-center">
                ⚠️ 雲端儲存未設定<br />
                進度只會儲存喺呢部機
              </p>
            </div>
          )}

          {/* Guest Button */}
          <button
            onClick={onSkip}
            className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-colors"
          >
            唔登入直接玩 👋
          </button>

          <p className="text-center text-gray-400 text-xs mt-6">
            {isConfigured
              ? '登入後可以喺唔同裝置睇到你嘅寵物'
              : '設定好 Supabase 後就可以登入'}
          </p>
        </div>
      </div>
    );
  }

  // Login screen
  if (mode === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm">
          {/* Back button */}
          <button
            onClick={() => { setMode('choose'); resetForm(); }}
            className="text-gray-400 hover:text-gray-600 mb-4"
          >
            ← 返回
          </button>

          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
            登入 📱
          </h2>

          {/* Display Name */}
          <div className="mb-6">
            <label className="block text-gray-600 text-sm mb-2">你嘅名</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="例如：小明"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 text-lg"
              disabled={loading}
            />
          </div>

          {/* PIN */}
          <div className="mb-6">
            <label className="block text-gray-600 text-sm mb-2">PIN 碼 (4-6位數字)</label>
            <PinInput
              length={6}
              value={pin}
              onChange={setPin}
              disabled={loading}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading || !displayName || pin.length < 4}
            className={`
              w-full py-4 rounded-2xl font-bold text-lg transition-all
              ${loading || !displayName || pin.length < 4
                ? 'bg-gray-200 text-gray-400'
                : 'bg-purple-500 text-white hover:bg-purple-600'}
            `}
          >
            {loading ? '登入中...' : '登入 →'}
          </button>

          {/* Switch to register */}
          <p className="text-center text-gray-500 text-sm mt-6">
            未有帳號？{' '}
            <button
              onClick={() => { setMode('register'); resetForm(); }}
              className="text-purple-500 font-bold"
            >
              建立新帳號
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Register screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm">
        {/* Back button */}
        <button
          onClick={() => { setMode('choose'); resetForm(); }}
          className="text-gray-400 hover:text-gray-600 mb-4"
        >
          ← 返回
        </button>

        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
          建立新帳號 ✨
        </h2>

        {/* Display Name */}
        <div className="mb-6">
          <label className="block text-gray-600 text-sm mb-2">改個名俾自己</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="例如：小明、公主、超人"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 text-lg"
            disabled={loading}
            maxLength={20}
          />
        </div>

        {/* PIN */}
        <div className="mb-4">
          <label className="block text-gray-600 text-sm mb-2">設定 PIN 碼 (4-6位數字)</label>
          <PinInput
            length={6}
            value={pin}
            onChange={setPin}
            disabled={loading}
          />
        </div>

        {/* Confirm PIN */}
        <div className="mb-6">
          <label className="block text-gray-600 text-sm mb-2">再輸入一次 PIN 碼</label>
          <PinInput
            length={6}
            value={confirmPin}
            onChange={setConfirmPin}
            disabled={loading}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Register Button */}
        <button
          onClick={handleRegister}
          disabled={loading || !displayName || pin.length < 4 || confirmPin.length < 4}
          className={`
            w-full py-4 rounded-2xl font-bold text-lg transition-all
            ${loading || !displayName || pin.length < 4 || confirmPin.length < 4
              ? 'bg-gray-200 text-gray-400'
              : 'bg-blue-500 text-white hover:bg-blue-600'}
          `}
        >
          {loading ? '建立中...' : '建立帳號 →'}
        </button>

        {/* Tips */}
        <div className="bg-purple-50 rounded-xl p-3 mt-4">
          <p className="text-purple-700 text-xs text-center">
            💡 記住你嘅名同 PIN 碼<br />
            下次喺其他裝置登入就可以見返你嘅寵物！
          </p>
        </div>

        {/* Switch to login */}
        <p className="text-center text-gray-500 text-sm mt-6">
          已有帳號？{' '}
          <button
            onClick={() => { setMode('login'); resetForm(); }}
            className="text-purple-500 font-bold"
          >
            登入
          </button>
        </p>
      </div>
    </div>
  );
}
