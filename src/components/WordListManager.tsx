'use client';

import { useState, useEffect } from 'react';
import {
  CustomWordList,
  getCustomWordLists,
  createWordList,
  deleteWordList,
} from '@/lib/customWords';
import OCRScanner from '@/components/OCRScanner';

interface WordListManagerProps {
  onSelectList: (list: CustomWordList) => void;
  onUseBuiltIn: () => void;
  selectedListId?: string;
}

export default function WordListManager({
  onSelectList,
  onUseBuiltIn,
  selectedListId,
}: WordListManagerProps) {
  const [lists, setLists] = useState<CustomWordList[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWords, setNewWords] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setLists(getCustomWordLists());
  }, []);

  const handleCreate = () => {
    if (!newWords.trim()) {
      setError('請輸入生字 Please enter some words');
      return;
    }

    const words = newWords
      .split(/[,\n\s]+/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0 && /^[a-z]+$/.test(w));

    if (words.length === 0) {
      setError('搵唔到有效嘅英文字 No valid English words found');
      return;
    }

    const list = createWordList(newName, newWords);
    setLists(getCustomWordLists());
    setNewName('');
    setNewWords('');
    setShowCreate(false);
    setError('');
    onSelectList(list);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('確定要刪除呢個默書範圍？')) {
      deleteWordList(id);
      setLists(getCustomWordLists());
      if (selectedListId === id) {
        onUseBuiltIn();
      }
    }
  };

  const handleOCRWords = (words: string[]) => {
    // Add OCR words to the text area
    const existingWords = newWords.trim();
    const newWordsText = words.join(', ');
    setNewWords(existingWords ? `${existingWords}, ${newWordsText}` : newWordsText);
    setShowOCR(false);
    setShowCreate(true);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">
        📝 默書範圍 Word Lists
      </h2>

      {/* Built-in option */}
      <button
        onClick={onUseBuiltIn}
        className={`
          w-full p-4 mb-3 rounded-xl border-2 text-left transition-all
          ${
            !selectedListId
              ? 'bg-blue-50 border-blue-400'
              : 'bg-white border-gray-200 hover:border-blue-300'
          }
        `}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📚</span>
          <div>
            <div className="font-bold text-gray-800">內置生字庫</div>
            <div className="text-sm text-gray-500">100+ 常用英文字</div>
          </div>
        </div>
      </button>

      {/* Custom lists */}
      {lists.map((list) => (
        <button
          key={list.id}
          onClick={() => onSelectList(list)}
          className={`
            w-full p-4 mb-3 rounded-xl border-2 text-left transition-all
            ${
              selectedListId === list.id
                ? 'bg-green-50 border-green-400'
                : 'bg-white border-gray-200 hover:border-green-300'
            }
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <div className="font-bold text-gray-800">{list.name}</div>
                <div className="text-sm text-gray-500">
                  {list.words.length} 個字 · {list.words.slice(0, 5).join(', ')}
                  {list.words.length > 5 ? '...' : ''}
                </div>
              </div>
            </div>
            <button
              onClick={(e) => handleDelete(list.id, e)}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              aria-label="Delete list"
            >
              🗑️
            </button>
          </div>
        </button>
      ))}

      {/* Create new list */}
      {!showCreate ? (
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="flex-1 p-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-all"
          >
            <span className="text-2xl">✏️</span>
            <div className="font-medium mt-1">手動輸入</div>
            <div className="text-sm">打字輸入生字</div>
          </button>
          <button
            onClick={() => setShowOCR(true)}
            className="flex-1 p-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-500 transition-all"
          >
            <span className="text-2xl">📷</span>
            <div className="font-medium mt-1">掃描教科書</div>
            <div className="text-sm">影相自動識字</div>
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-xl border-2 border-blue-300 bg-blue-50">
          <h3 className="font-bold text-gray-700 mb-3">新增默書範圍</h3>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              名稱 Name (可選)
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例如：Unit 5 默書"
              className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-lg"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              生字 Words *
            </label>
            <textarea
              value={newWords}
              onChange={(e) => {
                setNewWords(e.target.value);
                setError('');
              }}
              placeholder="輸入生字，用逗號、空格或換行分開&#10;例如：apple, banana, cat&#10;或者每行一個字"
              rows={5}
              className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-lg resize-none"
            />
            <div className="text-xs text-gray-500 mt-1">
              可以直接複製默書範圍貼上
            </div>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-red-100 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowCreate(false);
                setNewName('');
                setNewWords('');
                setError('');
              }}
              className="flex-1 p-3 rounded-lg border-2 border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              取消
            </button>
            <button
              onClick={() => setShowOCR(true)}
              className="p-3 rounded-lg bg-green-100 text-green-700 font-bold hover:bg-green-200"
              title="掃描教科書"
            >
              📷
            </button>
            <button
              onClick={handleCreate}
              className="flex-1 p-3 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600"
            >
              建立
            </button>
          </div>
        </div>
      )}

      {/* OCR Scanner Modal */}
      {showOCR && (
        <OCRScanner
          onWordsExtracted={handleOCRWords}
          onClose={() => setShowOCR(false)}
        />
      )}
    </div>
  );
}
