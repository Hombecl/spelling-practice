'use client';

import { useState, useEffect } from 'react';
import { Word } from '@/lib/words';
import { speakWord } from '@/lib/speech';
import { getPhonicsBreakdown, getPronunciationGuide, speakPhonics } from '@/lib/phonics';
import WordImage from '@/components/WordImage';
import StarBurst from '@/components/StarBurst';

interface PhonicsModePros {
  word: Word;
  onComplete: (correct: boolean, attempts: number) => void;
  onSkip: () => void;
}

export default function PhonicsMode({ word, onComplete, onSkip }: PhonicsModePros) {
  const [step, setStep] = useState<'see' | 'listen' | 'phonics' | 'quiz'>('see');
  const [activeSound, setActiveSound] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const breakdown = getPhonicsBreakdown(word.word);
  const guide = getPronunciationGuide(word.word);

  useEffect(() => {
    setStep('see');
    setActiveSound(-1);
    setIsPlaying(false);
    setQuizAnswer(null);
    setShowSuccess(false);
  }, [word]);

  const handleListenWord = async () => {
    setIsPlaying(true);
    await speakWord(word.word);
    setIsPlaying(false);
    if (step === 'see') setStep('listen');
  };

  const handlePlayPhonics = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setStep('phonics');

    await speakPhonics(word.word, (index) => {
      setActiveSound(index);
    });

    setActiveSound(-1);
    setIsPlaying(false);
  };

  const handleQuiz = () => {
    setStep('quiz');
  };

  const handleQuizAnswer = (syllableCount: number) => {
    setQuizAnswer(syllableCount);
    const correct = syllableCount === breakdown.syllables.length;

    if (correct) {
      setShowSuccess(true);
      setTimeout(() => {
        onComplete(true, 1);
      }, 1500);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vowel':
        return 'bg-red-100 text-red-700 border-red-400';
      case 'consonant':
        return 'bg-blue-100 text-blue-700 border-blue-400';
      case 'blend':
        return 'bg-purple-100 text-purple-700 border-purple-400';
      case 'silent':
        return 'bg-gray-100 text-gray-400 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-400';
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 p-2 sm:p-4">
      <StarBurst show={showSuccess} count={5} />

      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-700 mb-1">
          📖 Phonics 認字
        </h2>
        <p className="text-sm text-gray-500">Learn how to read and break down the word</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 text-sm">
        <span className={`px-3 py-1 rounded-full ${step === 'see' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
          1. 睇字
        </span>
        <span className="text-gray-300">→</span>
        <span className={`px-3 py-1 rounded-full ${step === 'listen' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
          2. 聽音
        </span>
        <span className="text-gray-300">→</span>
        <span className={`px-3 py-1 rounded-full ${step === 'phonics' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
          3. 拆件
        </span>
        <span className="text-gray-300">→</span>
        <span className={`px-3 py-1 rounded-full ${step === 'quiz' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
          4. 測試
        </span>
      </div>

      {/* Word Image */}
      <WordImage word={word.word} size="lg" />

      {/* The Word */}
      <div className="text-5xl sm:text-6xl font-bold text-gray-800 tracking-wider">
        {word.word}
      </div>

      {/* Step 1: See the word */}
      {step === 'see' && (
        <div className="text-center">
          <p className="text-gray-600 mb-4">呢個字係 &quot;{word.word}&quot;</p>
          <button
            onClick={handleListenWord}
            disabled={isPlaying}
            className="px-8 py-4 bg-blue-500 text-white text-xl font-bold rounded-2xl hover:bg-blue-600 active:scale-95 disabled:opacity-50"
          >
            {isPlaying ? '🔊 播放中...' : '🔈 聽讀音'}
          </button>
        </div>
      )}

      {/* Step 2: Listen */}
      {step === 'listen' && (
        <div className="text-center">
          <p className="text-gray-600 mb-4">聽到點讀未？再聽多次或者學拆件！</p>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={handleListenWord}
              disabled={isPlaying}
              className="px-6 py-3 bg-blue-100 text-blue-700 font-bold rounded-xl hover:bg-blue-200 active:scale-95"
            >
              🔈 再聽一次
            </button>
            <button
              onClick={handlePlayPhonics}
              disabled={isPlaying}
              className="px-6 py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 active:scale-95"
            >
              🔤 學 Phonics 拆件
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Phonics Breakdown */}
      {(step === 'phonics' || step === 'quiz') && (
        <div className="w-full max-w-md">
          {/* Phonics Sound Blocks */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {guide.map((item, index) => (
              <div
                key={index}
                className={`
                  relative px-4 py-3 rounded-xl border-3 text-center transition-all duration-200
                  ${getTypeColor(item.type)}
                  ${activeSound === index ? 'scale-125 ring-4 ring-yellow-400 z-10' : ''}
                `}
              >
                <div className="text-2xl sm:text-3xl font-bold uppercase">{item.letter}</div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-3 text-xs mb-4">
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-red-200 rounded border border-red-400"></span>
              <span className="text-gray-600">元音 Vowel</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-blue-200 rounded border border-blue-400"></span>
              <span className="text-gray-600">輔音 Consonant</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-purple-200 rounded border border-purple-400"></span>
              <span className="text-gray-600">組合 Blend</span>
            </div>
          </div>

          {/* Syllables */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mb-4">
            <div className="text-sm font-bold text-gray-500 mb-2">音節 Syllables:</div>
            <div className="flex gap-2 justify-center flex-wrap">
              {breakdown.syllables.map((syllable, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-bold text-lg border-2 border-green-300"
                >
                  {syllable}
                </span>
              ))}
            </div>
            <div className="text-center text-gray-500 mt-2">
              共 {breakdown.syllables.length} 個音節
            </div>
          </div>

          {/* Pattern Info */}
          <div className="text-center mb-4">
            <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
              模式: {breakdown.pattern}
            </span>
          </div>

          {step === 'phonics' && (
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={handlePlayPhonics}
                disabled={isPlaying}
                className="px-6 py-3 bg-purple-100 text-purple-700 font-bold rounded-xl hover:bg-purple-200 active:scale-95"
              >
                {isPlaying ? '🔊 播放中...' : '🔤 再聽 Phonics'}
              </button>
              <button
                onClick={handleQuiz}
                className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 active:scale-95"
              >
                ✅ 去測試
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Quick Quiz */}
      {step === 'quiz' && !showSuccess && (
        <div className="w-full max-w-md bg-yellow-50 rounded-xl border-2 border-yellow-300 p-4">
          <p className="text-center font-bold text-gray-700 mb-4">
            「{word.word}」有幾多個音節？
          </p>
          <div className="flex gap-3 justify-center">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => handleQuizAnswer(num)}
                disabled={quizAnswer !== null}
                className={`
                  w-14 h-14 text-2xl font-bold rounded-xl transition-all
                  ${
                    quizAnswer === num
                      ? num === breakdown.syllables.length
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-white border-2 border-gray-300 hover:border-yellow-400 active:scale-95'
                  }
                `}
              >
                {num}
              </button>
            ))}
          </div>
          {quizAnswer !== null && quizAnswer !== breakdown.syllables.length && (
            <p className="text-center text-red-600 mt-3">
              唔啱喎！正確答案係 {breakdown.syllables.length} 個音節。再試吓！
            </p>
          )}
          {quizAnswer !== null && quizAnswer !== breakdown.syllables.length && (
            <button
              onClick={() => setQuizAnswer(null)}
              className="w-full mt-3 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              再試
            </button>
          )}
        </div>
      )}

      {/* Skip Button */}
      <button
        onClick={onSkip}
        className="text-gray-400 hover:text-gray-600 underline text-sm mt-2"
      >
        跳過
      </button>
    </div>
  );
}
