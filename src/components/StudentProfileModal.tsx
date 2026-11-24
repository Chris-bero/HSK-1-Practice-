import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileCheck2,
  Flame,
  Lock,
  RotateCcw,
  Target,
  TrendingDown,
  X,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CHAPTERS_DATA, DRILL_METADATA } from '../data/chaptersData';
import { getChapterTrueFalseItems } from '../data/trueFalseData';
import { formatStudyDurationHM } from '../hooks/useActiveStudyTimer';
import { ChapterData, DrillType } from '../types';
import { isChapterUnlocked } from '../utils/accessControl';
import { SpeakChineseButton } from './drills/SpeakChineseButton';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToChapter?: (chapter: ChapterData) => void;
  onStartMistakeReview?: () => void;
}

interface ResolvedMissedItem {
  key: string;
  chapterId: number;
  drillType: DrillType;
  drillLabel: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  itemKind: 'Word' | 'Sentence' | 'True/False';
  missCount: number;
  recordedAt: string;
}

function formatChapterTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  if (safe === 0) return '—';
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (mins > 0) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  return `${secs}s`;
}

function getStudentInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function StudentProfileModal({
  isOpen,
  onClose,
  onJumpToChapter,
  onStartMistakeReview,
}: StudentProfileModalProps) {
  const { currentStudent, unlockedAccess, progress, analytics, showPinyin } = useApp();
  const [copiedCode, setCopiedCode] = useState(false);

  // Close on Escape and lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const chapterSummaryRows = useMemo(() => {
    if (!progress) return [];
    const chapterExams = progress.chapterExamResults ?? [];
    return CHAPTERS_DATA.map((ch) => {
      const stat = progress.chapterStats[ch.id];
      const solved = stat?.solved ?? 0;
      const correct = stat?.correct ?? 0;
      const wrong = Math.max(0, solved - correct);
      const accuracy = solved > 0 ? Math.round((correct / solved) * 100) : null;
      const timeSeconds = stat?.timeSeconds ?? 0;
      const unlocked = isChapterUnlocked(unlockedAccess, ch.id);
      const examsForChapter = chapterExams.filter((e) => e.chapterId === ch.id);
      const bestExamPct =
        examsForChapter.length > 0
          ? Math.max(...examsForChapter.map((e) => e.percentage))
          : null;

      return {
        chapter: ch,
        solved,
        correct,
        wrong,
        accuracy,
        timeSeconds,
        unlocked,
        bestExamPct,
      };
    });
  }, [progress, unlockedAccess]);

  const examStats = useMemo(() => {
    const chapterExams = progress?.chapterExamResults ?? [];
    const finalExams = progress?.finalExamResults ?? [];
    const allScores = [
      ...chapterExams.map((e) => e.percentage),
      ...finalExams.map((e) => e.percentage),
    ];
    const totalCount = allScores.length;
    const avgScore =
      totalCount > 0
        ? Math.round(allScores.reduce((sum, pct) => sum + pct, 0) / totalCount)
        : null;

    return {
      totalCount,
      chapterCount: chapterExams.length,
      finalCount: finalExams.length,
      avgScore,
    };
  }, [progress]);

  const chaptersPracticedCount = useMemo(
    () => chapterSummaryRows.filter((row) => row.solved > 0).length,
    [chapterSummaryRows]
  );

  const unlockedChaptersCount = useMemo(
    () => chapterSummaryRows.filter((row) => row.unlocked).length,
    [chapterSummaryRows]
  );

  // Weakest Chapters: practiced chapters sorted ascending by accuracy % (ties broken by highest wrong count)
  const weakestChapters = useMemo(() => {
    return chapterSummaryRows
      .filter((row) => row.solved > 0 && row.accuracy !== null)
      .sort((a, b) => {
        const accDiff = (a.accuracy ?? 100) - (b.accuracy ?? 100);
        if (accDiff !== 0) return accDiff;
        return b.wrong - a.wrong;
      })
      .slice(0, 4);
  }, [chapterSummaryRows]);

  // Most Missed Questions & Words resolved from CHAPTERS_DATA + TRUE_FALSE_DATA
  const mostMissedItems = useMemo<ResolvedMissedItem[]>(() => {
    if (!progress || !progress.mistakes.length) return [];

    // Aggregate by (chapterId + sourceItemId) so if a word/sentence was missed in multiple drills, we show total misses cleanly
    const chapterMap = new Map<number, ChapterData>(CHAPTERS_DATA.map((c) => [c.id, c]));

    const resolved: ResolvedMissedItem[] = [];
    for (const m of progress.mistakes) {
      const ch = chapterMap.get(m.chapterId);
      if (!ch) continue;
      const drillLabel = DRILL_METADATA[m.drillType]?.titleAr ?? m.drillType;
      const missCount = Math.max(1, m.missCount ?? 1);

      const vocab = ch.vocab.find((v) => v.id === m.sourceItemId);
      if (vocab) {
        resolved.push({
          key: m.key,
          chapterId: m.chapterId,
          drillType: m.drillType,
          drillLabel,
          hanzi: vocab.hanzi,
          pinyin: vocab.pinyin,
          meaning: vocab.arabic,
          itemKind: 'Word',
          missCount,
          recordedAt: m.recordedAt,
        });
        continue;
      }

      const sentence = ch.sentences.find((s) => s.id === m.sourceItemId);
      if (sentence) {
        resolved.push({
          key: m.key,
          chapterId: m.chapterId,
          drillType: m.drillType,
          drillLabel,
          hanzi: sentence.hanzi,
          pinyin: sentence.pinyin,
          meaning: sentence.arabic,
          itemKind: 'Sentence',
          missCount,
          recordedAt: m.recordedAt,
        });
        continue;
      }

      const tfItem = getChapterTrueFalseItems(m.chapterId).find((t) => t.id === m.sourceItemId);
      if (tfItem) {
        resolved.push({
          key: m.key,
          chapterId: m.chapterId,
          drillType: m.drillType,
          drillLabel,
          hanzi: tfItem.correctedHanzi ?? tfItem.hanzi,
          pinyin: tfItem.correctedPinyin ?? tfItem.pinyin,
          meaning: tfItem.meaning,
          itemKind: 'True/False',
          missCount,
          recordedAt: m.recordedAt,
        });
      }
    }

    return resolved
      .sort((a, b) => {
        if (b.missCount !== a.missCount) return b.missCount - a.missCount;
        return b.recordedAt.localeCompare(a.recordedAt);
      })
      .slice(0, 8);
  }, [progress]);

  if (!isOpen || !currentStudent || !progress) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentStudent.code);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Ignore clipboard errors in restricted frames
    }
  };

  const handleJumpChapter = (chapter: ChapterData) => {
    if (!isChapterUnlocked(unlockedAccess, chapter.id)) return;
    onClose();
    onJumpToChapter?.(chapter);
  };

  const handleReviewMistakes = () => {
    onClose();
    onStartMistakeReview?.();
  };

  const accuracyTone =
    progress.totalSolved === 0
      ? 'text-[#57534E] dark:text-[#A8A29E]'
      : analytics.accuracyPercent >= 80
        ? 'text-[#15803D] dark:text-[#22C55E]'
        : analytics.accuracyPercent >= 65
          ? 'text-[#B45309] dark:text-[#F59E0B]'
          : 'text-[#B91C1C] dark:text-[#EF4444]';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-profile-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#121110]/70 backdrop-blur-[2px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="neo-frame w-full max-w-5xl max-h-[92vh] rounded-xl bg-[#F9F6F0] dark:bg-[#141312] border border-[#1C1917]/15 dark:border-[#F5F2EB]/15 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Sticky Modal Header */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 bg-white dark:bg-[#1E1C1A] border-b border-[#1C1917]/12 dark:border-[#F5F2EB]/12 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="cinnabar-seal w-12 h-12 rounded-lg flex items-center justify-center text-base font-extrabold bg-[#B91C1C]/8 dark:bg-[#EF4444]/14 text-[#B91C1C] dark:text-[#EF4444] shrink-0">
              {getStudentInitials(currentStudent.name)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="student-profile-modal-title"
                  className="text-lg sm:text-xl font-bold text-[#1C1917] dark:text-[#F5F2EB] truncate"
                >
                  {currentStudent.name}
                </h2>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  title="Copy student access code"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-[#F9F6F0] dark:bg-[#141312] text-xs font-bold tabular-nums text-[#B91C1C] dark:text-[#EF4444] hover:border-[#B91C1C]/50 transition-colors"
                >
                  <span>{currentStudent.code}</span>
                  {copiedCode ? (
                    <Check className="w-3 h-3 text-[#15803D] dark:text-[#22C55E]" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-70" />
                  )}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-[#57534E] dark:text-[#A8A29E] mt-0.5">
                <span>Student Profile &amp; Progress Report</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#D97706] dark:text-[#F59E0B] tabular-nums">
                  <Flame className="w-3.5 h-3.5" />
                  {analytics.streakDays} {analytics.streakDays === 1 ? 'day' : 'days'} streak
                </span>
                <span aria-hidden="true" className="hidden sm:inline">
                  ·
                </span>
                <span className="hidden sm:inline tabular-nums">
                  Last active:{' '}
                  {new Date(progress.lastActive).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile modal"
            className="w-10 h-10 rounded-lg border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-[#F9F6F0] dark:bg-[#141312] hover:border-[#B91C1C]/45 text-[#57534E] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#F5F2EB] inline-flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-6 space-y-7">
          {/* 1. Personal KPI Cards */}
          <section className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#57534E] dark:text-[#A8A29E]">
              Personal Performance Overview
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* KPI 1: Total Active Study Time */}
              <div className="rounded-xl border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] p-4 sm:p-5 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#57534E] dark:text-[#A8A29E]">
                    Total Active Study Time
                  </span>
                  <Clock className="w-4 h-4 text-[#D97706] dark:text-[#F59E0B] shrink-0" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] dark:text-[#F5F2EB] tabular-nums">
                  {formatStudyDurationHM(progress.activeSeconds)}
                </p>
                <p className="text-[11px] text-[#57534E] dark:text-[#A8A29E]">
                  Auto-tracked · pauses if idle &gt;60s
                </p>
              </div>

              {/* KPI 2: Questions Solved + Correct/Wrong + Accuracy % */}
              <div className="rounded-xl border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] p-4 sm:p-5 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#57534E] dark:text-[#A8A29E]">
                    Questions Solved
                  </span>
                  <Target className={`w-4 h-4 shrink-0 ${accuracyTone}`} />
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] dark:text-[#F5F2EB] tabular-nums">
                    {progress.totalSolved}
                  </p>
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-extrabold tabular-nums border border-current/25 bg-current/8 ${accuracyTone}`}
                  >
                    {progress.totalSolved > 0 ? `${analytics.accuracyPercent}% Acc` : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold tabular-nums">
                  <span className="inline-flex items-center gap-1 text-[#15803D] dark:text-[#22C55E]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {progress.correctCount} Correct
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#B91C1C] dark:text-[#EF4444]">
                    <XCircle className="w-3.5 h-3.5" />
                    {progress.wrongCount} Wrong
                  </span>
                </div>
              </div>

              {/* KPI 3: Exams Completed + Average Score */}
              <div className="rounded-xl border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] p-4 sm:p-5 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#57534E] dark:text-[#A8A29E]">
                    Exams Completed
                  </span>
                  <FileCheck2 className="w-4 h-4 text-[#B91C1C] dark:text-[#EF4444] shrink-0" />
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] dark:text-[#F5F2EB] tabular-nums">
                    {examStats.totalCount}
                  </p>
                  <span className="text-xs font-bold text-[#15803D] dark:text-[#22C55E] tabular-nums">
                    {examStats.avgScore !== null ? `Avg ${examStats.avgScore}%` : 'No exams yet'}
                  </span>
                </div>
                <p className="text-[11px] text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                  {examStats.chapterCount} Chapter · {examStats.finalCount} Final
                </p>
              </div>

              {/* KPI 4: Chapters Practiced */}
              <div className="rounded-xl border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] p-4 sm:p-5 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#57534E] dark:text-[#A8A29E]">
                    Chapters Practiced
                  </span>
                  <BookOpen className="w-4 h-4 text-[#15803D] dark:text-[#22C55E] shrink-0" />
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] dark:text-[#F5F2EB] tabular-nums">
                    {chaptersPracticedCount}
                    <span className="text-base font-bold text-[#57534E] dark:text-[#A8A29E]">
                      {' '}
                      / 15
                    </span>
                  </p>
                  <span className="text-xs font-bold text-[#D97706] dark:text-[#F59E0B] tabular-nums">
                    {analytics.overallProgressPercent}% Mastery
                  </span>
                </div>
                <p className="text-[11px] text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                  {unlockedChaptersCount} of 15 chapters unlocked
                </p>
              </div>
            </div>
          </section>

          {/* 2. Smart "Focus Areas" Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#B91C1C] dark:text-[#EF4444]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#B91C1C] dark:text-[#EF4444]">
                  Smart Focus Areas — What to Review Next
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Weakest Chapters */}
              <div className="lg:col-span-5 rounded-xl border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-[#B91C1C] dark:text-[#EF4444]" />
                    <h4 className="text-sm font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                      Weakest Chapters
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-[#57534E] dark:text-[#A8A29E]">
                    Lowest accuracy %
                  </span>
                </div>

                {weakestChapters.length === 0 ? (
                  <div className="py-6 text-center space-y-1.5">
                    <Award className="w-8 h-8 text-[#D97706] dark:text-[#F59E0B] mx-auto opacity-80" />
                    <p className="text-xs font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                      No chapter weaknesses yet
                    </p>
                    <p className="text-xs text-[#57534E] dark:text-[#A8A29E]">
                      Complete any chapter drill or exam to identify your lowest-accuracy lessons.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {weakestChapters.map((row) => {
                      const pct = row.accuracy ?? 0;
                      const barTone =
                        pct < 65
                          ? 'bg-[#B91C1C] dark:bg-[#EF4444]'
                          : pct < 80
                            ? 'bg-[#D97706] dark:bg-[#F59E0B]'
                            : 'bg-[#15803D] dark:bg-[#22C55E]';
                      const textTone =
                        pct < 65
                          ? 'text-[#B91C1C] dark:text-[#EF4444]'
                          : pct < 80
                            ? 'text-[#B45309] dark:text-[#F59E0B]'
                            : 'text-[#15803D] dark:text-[#22C55E]';

                      return (
                        <div
                          key={row.chapter.id}
                          className="rounded-lg border border-[#1C1917]/10 dark:border-[#F5F2EB]/10 bg-[#F9F6F0]/70 dark:bg-[#141312] p-3.5 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#1C1917] dark:text-[#F5F2EB] truncate">
                                Ch. {row.chapter.id} · {row.chapter.subtitleAr.split('(')[0].trim()}
                              </p>
                              <p className="text-[11px] text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                                {row.correct} correct / {row.solved} solved ({row.wrong} wrong)
                              </p>
                            </div>
                            <span className={`text-sm font-extrabold tabular-nums shrink-0 ${textTone}`}>
                              {pct}%
                            </span>
                          </div>

                          <div className="h-1.5 w-full rounded-full bg-[#1C1917]/10 dark:bg-[#F5F2EB]/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barTone}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          {row.unlocked && onJumpToChapter && (
                            <div className="pt-0.5 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleJumpChapter(row.chapter)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B91C1C] dark:text-[#EF4444] hover:underline"
                              >
                                <span>Practice Ch. {row.chapter.id}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Most Missed Questions / Words */}
              <div className="lg:col-span-7 rounded-xl border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-[#B91C1C] dark:text-[#EF4444]" />
                    <h4 className="text-sm font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                      Most Missed Questions &amp; Words
                    </h4>
                  </div>
                  {mostMissedItems.length > 0 && onStartMistakeReview && (
                    <button
                      type="button"
                      onClick={handleReviewMistakes}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#B91C1C] hover:bg-[#991B1B] dark:bg-[#EF4444] dark:hover:bg-[#DC2626] text-white text-[11px] font-bold transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Practice Mistakes ({progress.mistakes.length})</span>
                    </button>
                  )}
                </div>

                {mostMissedItems.length === 0 ? (
                  <div className="py-6 text-center space-y-1.5">
                    <CheckCircle2 className="w-8 h-8 text-[#15803D] dark:text-[#22C55E] mx-auto opacity-85" />
                    <p className="text-xs font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                      Clean slate — zero missed items waiting!
                    </p>
                    <p className="text-xs text-[#57534E] dark:text-[#A8A29E]">
                      Any words or sentences you miss during drills or exams will automatically
                      appear here for targeted review.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#1C1917]/8 dark:divide-[#F5F2EB]/8 max-h-[300px] overflow-y-auto pr-1">
                    {mostMissedItems.map((item) => (
                      <div
                        key={item.key}
                        className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="px-1.5 py-0.5 rounded bg-[#B91C1C]/10 dark:bg-[#EF4444]/15 text-[#B91C1C] dark:text-[#EF4444] font-extrabold tabular-nums">
                              Missed {item.missCount}×
                            </span>
                            <span className="font-bold text-[#1C1917] dark:text-[#F5F2EB] tabular-nums">
                              Ch. {item.chapterId}
                            </span>
                            <span aria-hidden="true" className="text-[#57534E]/50">
                              ·
                            </span>
                            <span className="text-[#57534E] dark:text-[#A8A29E] truncate">
                              {item.drillLabel}
                            </span>
                          </div>

                          <p
                            dir="ltr"
                            className="font-hanzi text-base sm:text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB] leading-snug"
                          >
                            {item.hanzi}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                            {showPinyin && item.pinyin && (
                              <span className="font-pinyin font-semibold text-[#D97706] dark:text-[#F59E0B]">
                                {item.pinyin}
                              </span>
                            )}
                            <span className="text-[#57534E] dark:text-[#A8A29E]">
                              {item.meaning}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <SpeakChineseButton text={item.hanzi} compact showSlow={false} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 3. Chapter-by-Chapter Breakdown */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#57534E] dark:text-[#A8A29E]">
                Chapter-by-Chapter Breakdown (Lessons 1–15)
              </h3>
              <span className="text-xs text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                Solved · Accuracy % · Time Spent
              </span>
            </div>

            <div className="rounded-xl border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#F2ECE1]/70 dark:bg-[#25221F] text-[#57534E] dark:text-[#A8A29E] text-xs border-b border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
                    <tr>
                      <th className="px-4 py-3 font-bold">Lesson</th>
                      <th className="px-3 py-3 font-bold text-center">Questions Solved</th>
                      <th className="px-3 py-3 font-bold">Accuracy</th>
                      <th className="px-3 py-3 font-bold text-right">Time Spent</th>
                      <th className="px-4 py-3 font-bold text-right">Chapter Exam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C1917]/8 dark:divide-[#F5F2EB]/8">
                    {chapterSummaryRows.map((row) => {
                      const acc = row.accuracy;
                      const accColor =
                        acc === null
                          ? 'text-[#57534E] dark:text-[#A8A29E]'
                          : acc >= 80
                            ? 'text-[#15803D] dark:text-[#22C55E]'
                            : acc >= 65
                              ? 'text-[#B45309] dark:text-[#F59E0B]'
                              : 'text-[#B91C1C] dark:text-[#EF4444]';
                      const barColor =
                        acc === null
                          ? 'bg-[#1C1917]/15'
                          : acc >= 80
                            ? 'bg-[#15803D] dark:bg-[#22C55E]'
                            : acc >= 65
                              ? 'bg-[#D97706] dark:bg-[#F59E0B]'
                              : 'bg-[#B91C1C] dark:bg-[#EF4444]';

                      return (
                        <tr
                          key={row.chapter.id}
                          className="hover:bg-[#F9F6F0]/70 dark:hover:bg-[#25221F]/60 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-hanzi w-8 h-8 rounded-md border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-[#F9F6F0] dark:bg-[#141312] text-xs font-bold flex items-center justify-center shrink-0">
                                {row.chapter.chineseNumeral}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {row.unlocked && onJumpToChapter ? (
                                    <button
                                      type="button"
                                      onClick={() => handleJumpChapter(row.chapter)}
                                      className="font-bold text-[#1C1917] dark:text-[#F5F2EB] hover:text-[#B91C1C] dark:hover:text-[#EF4444] transition-colors text-left"
                                    >
                                      Chapter {row.chapter.id}
                                    </button>
                                  ) : (
                                    <span className="font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                                      Chapter {row.chapter.id}
                                    </span>
                                  )}
                                  {!row.unlocked && (
                                    <Lock className="w-3 h-3 text-[#B45309] dark:text-[#F59E0B] shrink-0" />
                                  )}
                                </div>
                                <p className="text-[11px] text-[#57534E] dark:text-[#A8A29E] truncate max-w-[230px]">
                                  {row.chapter.subtitleAr.split('(')[0].trim()}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3 text-center tabular-nums whitespace-nowrap">
                            {row.solved > 0 ? (
                              <div>
                                <span className="font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                                  {row.solved}
                                </span>
                                <span className="block text-[11px] text-[#57534E] dark:text-[#A8A29E]">
                                  <span className="text-[#15803D] dark:text-[#22C55E]">
                                    {row.correct}✓
                                  </span>{' '}
                                  ·{' '}
                                  <span className="text-[#B91C1C] dark:text-[#EF4444]">
                                    {row.wrong}✗
                                  </span>
                                </span>
                              </div>
                            ) : (
                              <span className="text-[#57534E] dark:text-[#A8A29E]">0</span>
                            )}
                          </td>

                          <td className="px-3 py-3 min-w-[130px]">
                            <div className="flex items-center gap-2.5">
                              <div className="flex-1 h-1.5 rounded-full bg-[#1C1917]/10 dark:bg-[#F5F2EB]/10 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${barColor}`}
                                  style={{ width: `${acc ?? 0}%` }}
                                />
                              </div>
                              <span
                                className={`text-xs font-extrabold tabular-nums w-9 text-right ${accColor}`}
                              >
                                {acc !== null ? `${acc}%` : '—'}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-[#57534E] dark:text-[#A8A29E] whitespace-nowrap">
                            {formatChapterTime(row.timeSeconds)}
                          </td>

                          <td className="px-4 py-3 text-right text-xs font-bold tabular-nums whitespace-nowrap">
                            {row.bestExamPct !== null ? (
                              <span
                                className={
                                  row.bestExamPct >= 80
                                    ? 'text-[#15803D] dark:text-[#22C55E]'
                                    : row.bestExamPct >= 70
                                      ? 'text-[#B45309] dark:text-[#F59E0B]'
                                      : 'text-[#B91C1C] dark:text-[#EF4444]'
                                }
                              >
                                Best {row.bestExamPct}%
                              </span>
                            ) : (
                              <span className="font-normal text-[#57534E] dark:text-[#A8A29E]">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
