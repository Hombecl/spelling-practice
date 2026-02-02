'use client';

import { useState } from 'react';
import { UserProgress, WordProgress, BADGES } from '@/lib/progress';

interface ProgressExportProps {
  progress: UserProgress;
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-HK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function generateTextReport(progress: UserProgress): string {
  const lines: string[] = [];
  const now = new Date().toLocaleDateString('zh-HK');

  lines.push('=' .repeat(50));
  lines.push('串字練習 - 學習進度報告');
  lines.push('=' .repeat(50));
  lines.push(`生成日期: ${now}`);
  lines.push('');

  // Summary stats
  lines.push('📊 總體統計');
  lines.push('-'.repeat(30));
  const masteredWords = Object.values(progress.wordProgress).filter(w => w.mastered);
  const totalAttempts = Object.values(progress.wordProgress).reduce((sum, w) => sum + w.attempts, 0);
  const totalCorrect = Object.values(progress.wordProgress).reduce((sum, w) => sum + w.correct, 0);
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  lines.push(`已掌握生字: ${masteredWords.length} 個`);
  lines.push(`總練習次數: ${totalAttempts} 次`);
  lines.push(`整體正確率: ${accuracy}%`);
  lines.push(`獲得星星: ${progress.totalStars} 顆`);
  lines.push(`連續練習: ${progress.streakDays} 天`);
  lines.push('');

  // Pet info
  if (progress.pet) {
    lines.push('🐾 寵物資料');
    lines.push('-'.repeat(30));
    lines.push(`名稱: ${progress.pet.name}`);
    lines.push(`等級: ${progress.pet.level}`);
    lines.push(`總經驗值: ${progress.totalXP} XP`);
    lines.push(`開心值: ${progress.pet.happiness}%`);
    lines.push(`完成生字: ${progress.pet.totalWordsSpelled} 個`);
    lines.push('');
  }

  // Badges
  if (progress.badges.length > 0) {
    lines.push('🏆 獲得徽章');
    lines.push('-'.repeat(30));
    progress.badges.forEach(badgeId => {
      const badge = BADGES[badgeId];
      if (badge) {
        lines.push(`${badge.emoji} ${badge.name} - ${badge.description}`);
      }
    });
    lines.push('');
  }

  // Word progress detail
  const wordEntries = Object.entries(progress.wordProgress);
  if (wordEntries.length > 0) {
    lines.push('📖 生字進度明細');
    lines.push('-'.repeat(30));
    lines.push('生字\t嘗試\t正確\t正確率\t狀態\t\t最後練習');
    lines.push('-'.repeat(50));

    wordEntries
      .sort((a, b) => new Date(b[1].lastPracticed).getTime() - new Date(a[1].lastPracticed).getTime())
      .forEach(([word, data]) => {
        const wordAccuracy = data.attempts > 0 ? Math.round((data.correct / data.attempts) * 100) : 0;
        const status = data.mastered ? '✅ 已掌握' : '📝 練習中';
        lines.push(`${word}\t${data.attempts}\t${data.correct}\t${wordAccuracy}%\t${status}\t${formatDate(data.lastPracticed)}`);
      });
  }

  lines.push('');
  lines.push('=' .repeat(50));
  lines.push('感謝使用串字練習 App！');
  lines.push('=' .repeat(50));

  return lines.join('\n');
}

function generateCSV(progress: UserProgress): string {
  const lines: string[] = [];

  // Header
  lines.push('生字,嘗試次數,正確次數,正確率,連續正確,已掌握,最後練習日期');

  // Data rows
  Object.entries(progress.wordProgress).forEach(([word, data]) => {
    const accuracy = data.attempts > 0 ? Math.round((data.correct / data.attempts) * 100) : 0;
    lines.push([
      word,
      data.attempts,
      data.correct,
      `${accuracy}%`,
      data.streak,
      data.mastered ? '是' : '否',
      data.lastPracticed ? new Date(data.lastPracticed).toISOString().split('T')[0] : '',
    ].join(','));
  });

  return lines.join('\n');
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ProgressExport({ progress }: ProgressExportProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportText = () => {
    setExporting(true);
    const report = generateTextReport(progress);
    const now = new Date().toISOString().split('T')[0];
    downloadFile(report, `spelling-progress-${now}.txt`, 'text/plain;charset=utf-8');
    setExporting(false);
    setShowOptions(false);
  };

  const handleExportCSV = () => {
    setExporting(true);
    const csv = generateCSV(progress);
    const now = new Date().toISOString().split('T')[0];
    downloadFile(csv, `spelling-progress-${now}.csv`, 'text/csv;charset=utf-8');
    setExporting(false);
    setShowOptions(false);
  };

  const handleCopyToClipboard = async () => {
    setExporting(true);
    const report = generateTextReport(progress);
    try {
      await navigator.clipboard.writeText(report);
      alert('已複製到剪貼簿！');
    } catch {
      alert('無法複製，請嘗試下載檔案');
    }
    setExporting(false);
    setShowOptions(false);
  };

  return (
    <div>
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="w-full py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        📤 匯出學習進度
      </button>

      {showOptions && (
        <div className="mt-3 flex flex-col gap-2">
          <button
            onClick={handleExportText}
            disabled={exporting}
            className="py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            📄 下載文字報告 (.txt)
          </button>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="py-2 px-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            📊 下載 Excel 格式 (.csv)
          </button>
          <button
            onClick={handleCopyToClipboard}
            disabled={exporting}
            className="py-2 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            📋 複製到剪貼簿
          </button>
        </div>
      )}
    </div>
  );
}
