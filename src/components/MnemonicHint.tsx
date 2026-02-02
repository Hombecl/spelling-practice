'use client';

import { useState } from 'react';
import { getMnemonicForWord, getTrickyPartHint, WordMnemonic } from '@/lib/dailySystem';

interface MnemonicHintProps {
  word: string;
  showOnError?: boolean;  // Show automatically on error
  isError?: boolean;
}

export default function MnemonicHint({ word, showOnError = true, isError = false }: MnemonicHintProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const mnemonic = getMnemonicForWord(word);
  const trickyPart = getTrickyPartHint(word);

  // Auto-expand on error if enabled
  const shouldShow = isExpanded || (showOnError && isError);

  if (!mnemonic && !trickyPart) return null;

  return (
    <div className="mt-2">
      {/* Collapsed state - just a hint button */}
      {!shouldShow && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 transition-colors"
        >
          <span>💡</span>
          <span>睇記憶小貼士</span>
        </button>
      )}

      {/* Expanded state - show mnemonic */}
      {shouldShow && (
        <div className="bg-purple-50 rounded-xl p-3 border border-purple-200 animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-purple-700 font-bold mb-2">
              <span>💡</span>
              <span>記憶小貼士</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-purple-400 hover:text-purple-600 text-sm"
            >
              ✕
            </button>
          </div>

          {/* Tricky part highlight */}
          {trickyPart && (
            <div className="mb-2 p-2 bg-white rounded-lg">
              <div className="flex items-center gap-2">
                <span className="bg-yellow-200 px-2 py-0.5 rounded font-mono font-bold text-lg">
                  {trickyPart.part}
                </span>
                <span className="text-gray-600 text-sm">{trickyPart.hint}</span>
              </div>
            </div>
          )}

          {/* Full mnemonic */}
          {mnemonic && (
            <div className="text-gray-700">
              {mnemonic.type === 'famous' && (
                <div className="flex items-start gap-2">
                  <span className="text-xl">🌟</span>
                  <div>
                    <div className="font-bold text-purple-700 mb-1">經典口訣：</div>
                    <div className="text-lg">{mnemonic.mnemonic}</div>
                  </div>
                </div>
              )}

              {mnemonic.type === 'pattern' && (
                <div className="flex items-start gap-2">
                  <span className="text-xl">🔍</span>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">記住呢個 pattern：</div>
                    <div className="text-lg">{mnemonic.mnemonic}</div>
                  </div>
                </div>
              )}

              {mnemonic.type === 'generated' && (
                <div className="flex items-start gap-2">
                  <span className="text-xl">📝</span>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">拆字記憶：</div>
                    <div className="text-lg">{mnemonic.mnemonic}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Word visualization */}
          <div className="mt-3 flex flex-wrap gap-1 justify-center">
            {word.split('').map((letter, i) => {
              const isHighlighted = mnemonic?.highlight?.some(h =>
                word.toLowerCase().indexOf(h) <= i &&
                i < word.toLowerCase().indexOf(h) + h.length
              );

              return (
                <span
                  key={i}
                  className={`
                    w-8 h-10 flex items-center justify-center rounded-lg font-mono text-xl font-bold
                    ${isHighlighted
                      ? 'bg-yellow-300 text-yellow-800'
                      : 'bg-gray-100 text-gray-700'}
                  `}
                >
                  {letter.toUpperCase()}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for use during practice
export function MnemonicButton({ word, onClick }: { word: string; onClick: () => void }) {
  const mnemonic = getMnemonicForWord(word);
  const trickyPart = getTrickyPartHint(word);

  if (!mnemonic && !trickyPart) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full text-sm font-medium transition-colors"
    >
      <span>💡</span>
      <span>提示</span>
    </button>
  );
}
