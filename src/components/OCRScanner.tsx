'use client';

import { useState, useRef } from 'react';
import { extractWordsFromImage, isValidEnglishWord } from '@/lib/ocr';

interface OCRScannerProps {
  onWordsExtracted: (words: string[]) => void;
  onClose: () => void;
}

export default function OCRScanner({ onWordsExtracted, onClose }: OCRScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedWords, setExtractedWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Process with OCR
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    const result = await extractWordsFromImage(file, (p) => setProgress(p));

    setIsProcessing(false);

    if (result.success) {
      // Filter to valid words
      const validWords = result.words.filter(isValidEnglishWord);
      setExtractedWords(validWords);
      // Select all by default
      setSelectedWords(new Set(validWords));
    } else {
      setError(result.error || 'OCR 處理失敗');
    }
  };

  const toggleWord = (word: string) => {
    const newSelected = new Set(selectedWords);
    if (newSelected.has(word)) {
      newSelected.delete(word);
    } else {
      newSelected.add(word);
    }
    setSelectedWords(newSelected);
  };

  const selectAll = () => {
    setSelectedWords(new Set(extractedWords));
  };

  const selectNone = () => {
    setSelectedWords(new Set());
  };

  const handleConfirm = () => {
    const words = Array.from(selectedWords);
    if (words.length > 0) {
      onWordsExtracted(words);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">📷 掃描教科書</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* Upload Area */}
          {!preview && !isProcessing && (
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={triggerFileInput}
                className="border-3 border-dashed border-gray-300 rounded-2xl p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="text-5xl mb-4">📷</div>
                <p className="text-gray-600 font-bold mb-2">
                  影相或選擇圖片
                </p>
                <p className="text-sm text-gray-400">
                  將教科書嘅默書範圍影低
                </p>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                <p>💡 提示：</p>
                <ul className="text-left mt-2 space-y-1">
                  <li>• 確保光線充足</li>
                  <li>• 保持相機穩定</li>
                  <li>• 文字要清晰可見</li>
                </ul>
              </div>
            </div>
          )}

          {/* Processing */}
          {isProcessing && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4 animate-pulse">🔍</div>
              <p className="text-gray-600 font-bold mb-4">識別緊文字...</p>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">{progress}%</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">❌</div>
              <p className="text-red-600 font-bold mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setPreview(null);
                }}
                className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                再試
              </button>
            </div>
          )}

          {/* Results */}
          {preview && extractedWords.length > 0 && !isProcessing && (
            <div>
              {/* Preview Image */}
              <div className="mb-4">
                <img
                  src={preview}
                  alt="Uploaded"
                  className="w-full h-32 object-cover rounded-xl"
                />
              </div>

              {/* Word Count */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-600">
                  搵到 <span className="font-bold text-green-600">{extractedWords.length}</span> 個英文字
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                  >
                    全選
                  </button>
                  <button
                    onClick={selectNone}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                  >
                    取消全選
                  </button>
                </div>
              </div>

              {/* Word List */}
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-xl">
                {extractedWords.map((word) => (
                  <button
                    key={word}
                    onClick={() => toggleWord(word)}
                    className={`
                      px-3 py-2 rounded-lg font-bold transition-all
                      ${selectedWords.has(word)
                        ? 'bg-green-500 text-white'
                        : 'bg-white border-2 border-gray-300 text-gray-600'
                      }
                    `}
                  >
                    {word}
                  </button>
                ))}
              </div>

              {/* Selected Count */}
              <p className="text-center text-sm text-gray-500 mt-3">
                已選擇 {selectedWords.size} 個字
              </p>
            </div>
          )}

          {/* No words found */}
          {preview && extractedWords.length === 0 && !isProcessing && !error && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🤔</div>
              <p className="text-gray-600 font-bold mb-4">搵唔到英文字</p>
              <p className="text-sm text-gray-400 mb-4">
                請試吓影另一張相，確保文字清晰
              </p>
              <button
                onClick={() => {
                  setPreview(null);
                  setExtractedWords([]);
                }}
                className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                再試
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {extractedWords.length > 0 && !isProcessing && (
          <div className="p-4 border-t flex gap-3">
            <button
              onClick={() => {
                setPreview(null);
                setExtractedWords([]);
                setSelectedWords(new Set());
              }}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300"
            >
              重新影相
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedWords.size === 0}
              className="flex-1 px-4 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              確認 ({selectedWords.size} 個字)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
