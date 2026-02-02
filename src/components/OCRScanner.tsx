'use client';

import { useState, useRef } from 'react';
import { extractWordsFromImage, isValidEnglishWord } from '@/lib/ocr';

// Scan mode options
type ScanMode = 'select' | 'highlighted' | 'smart';
type HighlightColor = 'yellow' | 'pink' | 'green' | 'blue' | 'orange';

interface OCRScannerProps {
  onWordsExtracted: (words: string[]) => void;
  onClose: () => void;
}

export default function OCRScanner({ onWordsExtracted, onClose }: OCRScannerProps) {
  // Pre-scan selection state
  const [scanMode, setScanMode] = useState<ScanMode>('select');
  const [selectedColors, setSelectedColors] = useState<Set<HighlightColor>>(new Set(['yellow']));
  const [anyColor, setAnyColor] = useState(false);

  // Multiple images state
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [extractedWords, setExtractedWords] = useState<string[]>([]);
  const [highlightedWords, setHighlightedWords] = useState<Set<string>>(new Set());
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'highlighted'>('all');
  const [ocrSource, setOcrSource] = useState<'gemini-ocr' | 'gemini2-ocr' | 'gemini-fallback-ocr' | 'tesseract' | null>(null);
  const [rawOutput, setRawOutput] = useState<string>(''); // Debug: show Gemini raw output
  const [showDebug, setShowDebug] = useState(true); // Default open for debugging

  const MAX_IMAGES = 3;

  // Separate refs for camera and gallery
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert FileList to array and limit to MAX_IMAGES
    const fileArray = Array.from(files).slice(0, MAX_IMAGES);

    // Create previews for all files
    const newImages: { file: File; preview: string }[] = [];
    for (const file of fileArray) {
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      newImages.push({ file, preview });
    }

    setImages(newImages);
    setCurrentImageIndex(0);

    // Process all images
    await processAllImages(newImages);
  };

  const processAllImages = async (imagesToProcess: { file: File; preview: string }[]) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    const allWords: string[] = [];
    const allHighlightedWords: string[] = [];
    let lastSource: 'gemini-ocr' | 'gemini2-ocr' | 'gemini-fallback-ocr' | 'tesseract' | null = null;

    // Pass scan options to OCR
    const colorsArray = Array.from(selectedColors);
    const ocrOptions = {
      mode: scanMode,
      // If "any color" is selected, pass undefined to let AI detect any highlighter
      highlightColors: scanMode === 'highlighted' && !anyColor ? colorsArray : undefined,
    };

    for (let i = 0; i < imagesToProcess.length; i++) {
      const image = imagesToProcess[i];
      setCurrentImageIndex(i);
      setProcessingStatus(`處理緊第 ${i + 1}/${imagesToProcess.length} 張相...`);

      const result = await extractWordsFromImage(
        image.file,
        (p) => {
          // Calculate overall progress across all images
          const baseProgress = (i / imagesToProcess.length) * 100;
          const imageProgress = (p / imagesToProcess.length);
          setProgress(Math.round(baseProgress + imageProgress));
        },
        ocrOptions
      );

      if (result.success) {
        // Store raw output for debugging (include model info)
        if (result.rawText) {
          const debugInfo = result.modelUsed ? `[Model: ${result.modelUsed}]${result.fallbackReason ? ` (${result.fallbackReason})` : ''}\n\n` : '';
          setRawOutput(prev => prev ? prev + '\n\n---IMAGE---\n\n' + debugInfo + result.rawText : debugInfo + result.rawText);
        }

        // Filter to valid words and add to collection (avoid duplicates)
        const validWords = result.words.filter(isValidEnglishWord);
        const validHighlighted = result.highlightedWords.filter(isValidEnglishWord);

        for (const word of validWords) {
          if (!allWords.includes(word)) {
            allWords.push(word);
          }
        }
        for (const word of validHighlighted) {
          if (!allHighlightedWords.includes(word)) {
            allHighlightedWords.push(word);
          }
        }
        lastSource = result.source || null;
      }
    }

    setIsProcessing(false);
    setProcessingStatus('');
    setProgress(100);

    if (allWords.length > 0) {
      setExtractedWords(allWords);
      setHighlightedWords(new Set(allHighlightedWords));
      setOcrSource(lastSource);
      setRawOutput(prev => prev); // Keep raw output

      // If highlighted words found, select only those by default
      if (allHighlightedWords.length > 0) {
        setSelectedWords(new Set(allHighlightedWords));
        setFilterMode('highlighted');
      } else {
        setSelectedWords(new Set(allWords));
        setFilterMode('all');
      }
    } else {
      setError('搵唔到英文字');
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
    const wordsToSelect = filterMode === 'highlighted'
      ? extractedWords.filter(w => highlightedWords.has(w))
      : extractedWords;
    setSelectedWords(new Set(wordsToSelect));
  };

  const selectNone = () => {
    setSelectedWords(new Set());
  };

  const selectHighlightedOnly = () => {
    setSelectedWords(new Set(highlightedWords));
    setFilterMode('highlighted');
  };

  const showAllWords = () => {
    setFilterMode('all');
  };

  // Get words to display based on filter mode
  const displayedWords = filterMode === 'highlighted'
    ? extractedWords.filter(w => highlightedWords.has(w))
    : extractedWords;

  const handleConfirm = () => {
    const words = Array.from(selectedWords);
    if (words.length > 0) {
      onWordsExtracted(words);
    }
  };

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  const triggerGallery = () => {
    galleryInputRef.current?.click();
  };

  const resetToSelection = () => {
    setScanMode('select');
    setImages([]);
    setCurrentImageIndex(0);
    setExtractedWords([]);
    setSelectedWords(new Set());
    setHighlightedWords(new Set());
    setError(null);
    setAnyColor(false);
    setSelectedColors(new Set(['yellow']));
    setProcessingStatus('');
    setRawOutput('');
    setShowDebug(false);
  };

  const toggleColor = (color: HighlightColor) => {
    // If "any color" is on, turn it off when selecting specific colors
    if (anyColor) {
      setAnyColor(false);
    }
    const newColors = new Set(selectedColors);
    if (newColors.has(color)) {
      // Don't allow deselecting if it's the last one (unless any color is selected)
      if (newColors.size > 1) {
        newColors.delete(color);
      }
    } else {
      newColors.add(color);
    }
    setSelectedColors(newColors);
  };

  const toggleAnyColor = () => {
    setAnyColor(!anyColor);
    // When turning on "any color", clear specific selections
    if (!anyColor) {
      setSelectedColors(new Set());
    } else {
      // When turning off, default to yellow
      setSelectedColors(new Set(['yellow']));
    }
  };

  const selectAllColors = () => {
    setAnyColor(false);
    setSelectedColors(new Set(['yellow', 'pink', 'green', 'blue', 'orange']));
  };

  const highlightColorOptions: { value: HighlightColor; label: string; emoji: string; bgClass: string; selectedClass: string }[] = [
    { value: 'yellow', label: '黃色', emoji: '💛', bgClass: 'bg-yellow-100', selectedClass: 'bg-yellow-300 border-yellow-500 ring-2 ring-yellow-400' },
    { value: 'pink', label: '粉紅', emoji: '💗', bgClass: 'bg-pink-100', selectedClass: 'bg-pink-300 border-pink-500 ring-2 ring-pink-400' },
    { value: 'green', label: '綠色', emoji: '💚', bgClass: 'bg-green-100', selectedClass: 'bg-green-300 border-green-500 ring-2 ring-green-400' },
    { value: 'blue', label: '藍色', emoji: '💙', bgClass: 'bg-blue-100', selectedClass: 'bg-blue-300 border-blue-500 ring-2 ring-blue-400' },
    { value: 'orange', label: '橙色', emoji: '🧡', bgClass: 'bg-orange-100', selectedClass: 'bg-orange-300 border-orange-500 ring-2 ring-orange-400' },
  ];

  // Get selected colors text for display
  const getSelectedColorsText = () => {
    if (anyColor) return '任何顏色';
    if (selectedColors.size === 5) return '所有顏色';
    if (selectedColors.size === 1) {
      const color = Array.from(selectedColors)[0];
      return highlightColorOptions.find(o => o.value === color)?.label || '';
    }
    return `${selectedColors.size} 種顏色`;
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
          {/* Step 1: Mode Selection */}
          {scanMode === 'select' && images.length === 0 && !isProcessing && (
            <div className="space-y-4">
              <p className="text-center text-gray-600 mb-4">
                請先揀返你嘅教科書情況：
              </p>

              {/* Option 1: Has highlights */}
              <button
                onClick={() => setScanMode('highlighted')}
                className="w-full p-4 border-2 border-gray-200 rounded-2xl hover:border-yellow-400 hover:bg-yellow-50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🖍️</span>
                  <div>
                    <p className="font-bold text-gray-800">有螢光筆標記</p>
                    <p className="text-sm text-gray-500">
                      我已經用螢光筆標記咗要練習嘅字
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 2: No highlights - AI picks */}
              <button
                onClick={() => setScanMode('smart')}
                className="w-full p-4 border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🤖</span>
                  <div>
                    <p className="font-bold text-gray-800">冇螢光筆標記</p>
                    <p className="text-sm text-gray-500">
                      AI 幫我揀適合練習串字嘅生字
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Step 1b: Color Selection (if highlighted mode) */}
          {scanMode === 'highlighted' && images.length === 0 && !isProcessing && (
            <div className="space-y-4">
              <button
                onClick={() => setScanMode('select')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                ← 返回
              </button>

              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  你用咗咩顏色嘅螢光筆？
                </p>
                <button
                  onClick={selectAllColors}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                >
                  全選
                </button>
              </div>

              <p className="text-xs text-gray-400">
                可以揀多過一種顏色
              </p>

              {/* "Any color" option */}
              <button
                onClick={toggleAnyColor}
                className={`w-full p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                  anyColor
                    ? 'bg-gradient-to-r from-yellow-200 via-pink-200 to-blue-200 border-purple-400 ring-2 ring-purple-300'
                    : 'bg-gradient-to-r from-yellow-50 via-pink-50 to-blue-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  anyColor ? 'bg-white border-gray-400' : 'border-gray-300'
                }`}>
                  {anyColor && <span className="text-green-600 text-sm">✓</span>}
                </div>
                <span className="text-xl">🌈</span>
                <span className="text-sm font-medium">任何顏色</span>
                <span className="text-xs text-gray-500 ml-auto">（自動偵測）</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span>或者揀特定顏色</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Color checkboxes */}
              <div className={`grid grid-cols-2 gap-2 ${anyColor ? 'opacity-50' : ''}`}>
                {highlightColorOptions.map((option) => {
                  const isSelected = selectedColors.has(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => toggleColor(option.value)}
                      disabled={anyColor}
                      className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                        isSelected && !anyColor
                          ? option.selectedClass
                          : `${option.bgClass} border-gray-200 hover:border-gray-300`
                      } ${anyColor ? 'cursor-not-allowed' : ''}`}
                    >
                      {/* Checkbox indicator */}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected && !anyColor
                          ? 'bg-white border-gray-400'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && !anyColor && <span className="text-green-600 text-sm">✓</span>}
                      </div>
                      <span className="text-xl">{option.emoji}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Camera and Gallery buttons */}
              <div className="mt-6 space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={triggerCamera}
                    className="flex-1 py-4 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="text-2xl">📷</span>
                    影相
                  </button>
                  <button
                    onClick={triggerGallery}
                    className="flex-1 py-4 bg-yellow-100 text-yellow-700 font-bold rounded-xl hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2 border-2 border-yellow-300"
                  >
                    <span className="text-2xl">🖼️</span>
                    相簿
                  </button>
                </div>
                <p className="text-center text-xs text-gray-400">
                  會搵出 {getSelectedColorsText()} 螢光筆標記嘅字
                </p>
                <p className="text-center text-xs text-gray-400">
                  📚 可以一次過揀最多 {MAX_IMAGES} 張相
                </p>
              </div>
            </div>
          )}

          {/* Step 1c: Smart mode - direct to camera */}
          {scanMode === 'smart' && images.length === 0 && !isProcessing && (
            <div className="space-y-4">
              <button
                onClick={() => setScanMode('select')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                ← 返回
              </button>

              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <span className="text-5xl">🤖</span>
                <p className="font-bold text-gray-800 mt-2">AI 智能模式</p>
                <p className="text-sm text-gray-600 mt-1">
                  AI 會自動揀出適合小朋友練習串字嘅生字，例如：
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  <span className="px-2 py-1 bg-white rounded-lg text-sm">girl</span>
                  <span className="px-2 py-1 bg-white rounded-lg text-sm">beautiful</span>
                  <span className="px-2 py-1 bg-white rounded-lg text-sm">happy</span>
                  <span className="px-2 py-1 bg-white rounded-lg text-sm">family</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  會略過 &quot;the&quot;、&quot;is&quot;、&quot;to&quot; 等簡單字
                </p>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Camera and Gallery buttons */}
              <div className="flex gap-3">
                <button
                  onClick={triggerCamera}
                  className="flex-1 py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">📷</span>
                  影相
                </button>
                <button
                  onClick={triggerGallery}
                  className="flex-1 py-4 bg-blue-100 text-blue-700 font-bold rounded-xl hover:bg-blue-200 transition-colors flex items-center justify-center gap-2 border-2 border-blue-300"
                >
                  <span className="text-2xl">🖼️</span>
                  相簿
                </button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">
                📚 可以一次過揀最多 {MAX_IMAGES} 張相
              </p>
            </div>
          )}

          {/* Processing */}
          {isProcessing && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4 animate-pulse">🔍</div>
              <p className="text-gray-600 font-bold mb-2">
                {scanMode === 'highlighted' ? '搵緊螢光筆標記...' : '識別緊生字...'}
              </p>
              {processingStatus && (
                <p className="text-sm text-blue-600 mb-4">{processingStatus}</p>
              )}
              {/* Image thumbnails during processing */}
              {images.length > 1 && (
                <div className="flex justify-center gap-2 mb-4">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 ${
                        idx === currentImageIndex
                          ? 'border-blue-500 ring-2 ring-blue-300'
                          : idx < currentImageIndex
                          ? 'border-green-500 opacity-50'
                          : 'border-gray-300 opacity-50'
                      }`}
                    >
                      <img src={img.preview} alt={`第${idx + 1}張`} className="w-full h-full object-cover" />
                      {idx < currentImageIndex && (
                        <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                onClick={resetToSelection}
                className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                再試
              </button>
            </div>
          )}

          {/* Results */}
          {images.length > 0 && extractedWords.length > 0 && !isProcessing && (
            <div>
              {/* Preview Images */}
              <div className="mb-4">
                {images.length === 1 ? (
                  <img
                    src={images[0].preview}
                    alt="Uploaded"
                    className="w-full h-32 object-cover rounded-xl"
                  />
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="flex-shrink-0 relative">
                        <img
                          src={img.preview}
                          alt={`第${idx + 1}張`}
                          className="h-24 w-auto rounded-lg object-cover"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                          {idx + 1}/{images.length}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Debug: Show raw Gemini output - FIRST for visibility */}
              {rawOutput && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-300 rounded-xl">
                  <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-sm text-purple-700 font-bold flex items-center gap-2"
                  >
                    🔍 {showDebug ? '收起' : '展開'} AI 原始輸出
                  </button>
                  {showDebug && (
                    <div className="mt-2 p-2 bg-white rounded text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto border">
                      {rawOutput || '(無輸出)'}
                    </div>
                  )}
                </div>
              )}

              {/* Highlight Detection Notice */}
              {highlightedWords.size > 0 && (
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-300 rounded-xl">
                  <p className="text-sm text-yellow-800">
                    🖍️ 偵測到 <span className="font-bold">{highlightedWords.size}</span> 個螢光筆標記嘅字！
                  </p>
                </div>
              )}

              {/* Smart mode notice */}
              {scanMode === 'smart' && highlightedWords.size === 0 && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-300 rounded-xl">
                  <p className="text-sm text-blue-800">
                    🤖 AI 揀咗 <span className="font-bold">{extractedWords.length}</span> 個適合練習嘅生字
                  </p>
                </div>
              )}

              {/* Filter Tabs */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={showAllWords}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                    filterMode === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  全部 ({extractedWords.length})
                </button>
                {highlightedWords.size > 0 && (
                  <button
                    onClick={selectHighlightedOnly}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                      filterMode === 'highlighted'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    }`}
                  >
                    🖍️ 標記咗 ({highlightedWords.size})
                  </button>
                )}
              </div>

              {/* Word Count */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-600 text-sm">
                  顯示緊 <span className="font-bold text-green-600">{displayedWords.length}</span> 個字
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
                    取消
                  </button>
                </div>
              </div>

              {/* Word List */}
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-xl">
                {displayedWords.map((word) => (
                  <button
                    key={word}
                    onClick={() => toggleWord(word)}
                    className={`
                      px-3 py-2 rounded-lg font-bold transition-all relative
                      ${selectedWords.has(word)
                        ? 'bg-green-500 text-white'
                        : 'bg-white border-2 border-gray-300 text-gray-600'
                      }
                      ${highlightedWords.has(word) && !selectedWords.has(word)
                        ? 'border-yellow-400 bg-yellow-50'
                        : ''
                      }
                    `}
                  >
                    {highlightedWords.has(word) && (
                      <span className="absolute -top-1 -right-1 text-xs">🖍️</span>
                    )}
                    {word}
                  </button>
                ))}
              </div>

              {/* Selected Count and OCR Source */}
              <div className="text-center mt-3">
                <p className="text-sm text-gray-500">
                  已選擇 {selectedWords.size} 個字
                </p>
                {ocrSource && (
                  <p className="text-xs text-gray-400 mt-1">
                    {ocrSource === 'tesseract' ? '📝 本地 OCR' : '🤖 AI OCR'}
                  </p>
                )}
              </div>

            </div>
          )}

          {/* No words found */}
          {images.length > 0 && extractedWords.length === 0 && !isProcessing && !error && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🤔</div>
              <p className="text-gray-600 font-bold mb-4">搵唔到英文字</p>
              <p className="text-sm text-gray-400 mb-4">
                {scanMode === 'highlighted'
                  ? '搵唔到螢光筆標記嘅字，請確保螢光筆顏色清晰'
                  : '請試吓影另一張相，確保文字清晰'}
              </p>
              <button
                onClick={resetToSelection}
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
              onClick={resetToSelection}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300"
            >
              重新掃描
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
