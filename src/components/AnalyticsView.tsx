import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  HelpCircle,
  RotateCcw,
  Target,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { ALL_DRILL_TYPES, CHAPTERS_DATA, DRILL_METADATA } from '../data/chaptersData';
import { formatStudyDuration } from '../hooks/useActiveStudyTimer';
import { GOOGLE_SCRIPT_WEB_APP_URL } from '../services/sheetsSync';

interface AnalyticsViewProps {
  onStartMistakeReview?: () => void;
}

function formatDrillSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  if (safe === 0) return '00:00';
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  if (hrs > 0) {
    return `${hrs}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function AnalyticsView({ onStartMistakeReview }: AnalyticsViewProps) {
  const { currentStudent, progress, analytics, lastSyncResult } = useApp();

  if (!currentStudent || !progress) return null;

  const weakestLabel = analytics.weakestDrillType
    ? DRILL_METADATA[analytics.weakestDrillType].titleAr
    : 'Not enough data yet';

  const mistakesCount = progress.mistakes?.length ?? 0;

  const totalDrillTimeSeconds = ALL_DRILL_TYPES.reduce(
    (sum, dt) => sum + (progress.drillTimeSeconds?.[dt] ?? 0),
    0
  );
  const maxDrillTimeSeconds = Math.max(
    1,
    ...ALL_DRILL_TYPES.map((dt) => progress.drillTimeSeconds?.[dt] ?? 0)
  );

  const kpiCards = [
    {
      label: 'Total Questions Solved',
      value: String(progress.totalSolved),
      icon: HelpCircle,
      tone: 'text-[#1C1917] dark:text-[#F5F2EB]',
    },
    {
      label: 'Correct Answers',
      value: String(progress.correctCount),
      icon: CheckCircle2,
      tone: 'text-[#15803D] dark:text-[#22C55E]',
    },
    {
      label: 'Incorrect Answers',
      value: String(progress.wrongCount),
      icon: XCircle,
      tone: 'text-[#B91C1C] dark:text-[#EF4444]',
    },
    {
      label: 'Accuracy Rate',
      value: `${analytics.accuracyPercent}%`,
      icon: Target,
      tone: 'text-[#D97706] dark:text-[#F59E0B]',
    },
    {
      label: 'Active Study Time',
      value: formatStudyDuration(progress.activeSeconds),
      icon: Clock,
      tone: 'text-[#1C1917] dark:text-[#F5F2EB]',
    },
    {
      label: '15-Chapter Progress',
      value: `${analytics.overallProgressPercent}%`,
      icon: BookOpen,
      tone: 'text-[#15803D] dark:text-[#22C55E]',
    },
    {
      label: 'Study Streak',
      value: `${analytics.streakDays} ${analytics.streakDays === 1 ? 'day' : 'days'}`,
      icon: Flame,
      tone: 'text-[#D97706] dark:text-[#F59E0B]',
    },
    {
      label: 'Weakest Drill Mode',
      value: weakestLabel,
      icon: AlertTriangle,
      tone: 'text-[#B91C1C] dark:text-[#EF4444]',
      smallText: true,
    },
  ];

  const isRemoteConfigured = Boolean(GOOGLE_SCRIPT_WEB_APP_URL.trim());

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-10"
    >
      {/* Student Profile Header */}
      <div className="neo-frame rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="cinnabar-seal w-14 h-14 rounded-lg flex items-center justify-center bg-[#B91C1C]/5 dark:bg-[#EF4444]/10 shrink-0">
            <Award className="w-7 h-7 text-[#B91C1C] dark:text-[#EF4444]" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-[#57534E] dark:text-[#A8A29E] mb-1">
              <span>Performance Analytics</span>
              <span aria-hidden="true">·</span>
              <span>HSK 3.0 Level 1</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] dark:text-[#F5F2EB]">
              {currentStudent.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-2">
          {onStartMistakeReview && mistakesCount > 0 && (
            <button
              type="button"
              onClick={onStartMistakeReview}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] dark:bg-[#EF4444] dark:hover:bg-[#DC2626] text-white text-xs font-bold transition-colors self-start sm:self-end"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Review Mistakes ({mistakesCount})</span>
            </button>
          )}

          <div className="text-xs text-[#57534E] dark:text-[#A8A29E] sm:text-right space-y-1">
            <p>
              Sync Status:{' '}
              <strong className="text-[#15803D] dark:text-[#22C55E]">
                {isRemoteConfigured
                  ? lastSyncResult?.syncedRemotely
                    ? 'Synced with Instructor Sheet'
                    : 'Connected (auto-syncs after each session)'
                  : 'Saved locally on this device'}
              </strong>
            </p>
            <p className="tabular-nums">
              Last active:{' '}
              {new Date(progress.lastActive).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* 8 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-xl border border-[#1C1917]/10 dark:border-[#F5F2EB]/10 bg-white dark:bg-[#1E1C1A] p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-semibold text-[#57534E] dark:text-[#A8A29E]">
                  {kpi.label}
                </span>
                <Icon className={`w-4 h-4 shrink-0 ${kpi.tone}`} />
              </div>
              <p
                className={`font-bold tabular-nums leading-snug ${kpi.tone} ${
                  kpi.smallText ? 'text-base' : 'text-2xl'
                }`}
              >
                {kpi.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Time Spent by Drill Mode */}
      <div className="rounded-xl border border-[#1C1917]/10 dark:border-[#F5F2EB]/10 bg-white dark:bg-[#1E1C1A] p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1C1917]/10 dark:border-[#F5F2EB]/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-[#D97706] dark:text-[#F59E0B] shrink-0" />
            <h2 className="text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB]">
              Time Spent by Drill Mode
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#57534E] dark:text-[#A8A29E] tabular-nums">
            Total Logged Drill Time:{' '}
            <strong className="text-[#1C1917] dark:text-[#F5F2EB]">
              {formatStudyDuration(totalDrillTimeSeconds)}
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ALL_DRILL_TYPES.map((dt) => {
            const secs = progress.drillTimeSeconds?.[dt] ?? 0;
            const widthPct =
              secs > 0 ? Math.max(4, Math.round((secs / maxDrillTimeSeconds) * 100)) : 0;

            return (
              <div
                key={dt}
                className="rounded-lg border border-[#1C1917]/10 dark:border-[#F5F2EB]/10 bg-[#F9F6F0]/60 dark:bg-[#121110]/60 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                    {DRILL_METADATA[dt].titleAr}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-[#D97706] dark:text-[#F59E0B] shrink-0">
                    {formatDrillSeconds(secs)}
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-[#1C1917]/8 dark:bg-[#F5F2EB]/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#D97706] dark:bg-[#F59E0B] transition-all duration-300"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>

                <p className="text-xs text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                  {secs > 0 ? formatStudyDuration(secs) : 'Not practiced yet'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chapter-by-Chapter Breakdown (1..15) */}
      <div className="rounded-xl border border-[#1C1917]/10 dark:border-[#F5F2EB]/10 bg-white dark:bg-[#1E1C1A] p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1C1917]/10 dark:border-[#F5F2EB]/10 pb-4">
          <h2 className="text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB]">
            Progress &amp; Accuracy by Chapter
          </h2>
          <span className="text-xs text-[#57534E] dark:text-[#A8A29E]">
            All Chapters (1 to 15)
          </span>
        </div>

        <div className="divide-y divide-[#1C1917]/8 dark:divide-[#F5F2EB]/8">
          {CHAPTERS_DATA.map((chapter) => {
            const st = progress.chapterStats[chapter.id];
            const completion = analytics.getChapterCompletion(chapter.id);
            const accuracy = analytics.getChapterAccuracy(chapter.id);
            const isEmpty = chapter.vocab.length === 0 && chapter.sentences.length === 0;

            return (
              <div
                key={chapter.id}
                className="py-4 grid grid-cols-1 md:grid-cols-12 items-center gap-4"
              >
                <div className="md:col-span-4 flex items-center gap-3">
                  <span className="font-hanzi w-9 h-9 rounded-md border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-[#F9F6F0] dark:bg-[#121110] flex items-center justify-center text-sm font-bold shrink-0">
                    {chapter.chineseNumeral}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1C1917] dark:text-[#F5F2EB] truncate">
                      {chapter.titleAr}
                    </p>
                    <p className="text-xs text-[#57534E] dark:text-[#A8A29E] truncate">
                      {isEmpty ? 'Content coming soon' : chapter.subtitleAr}
                    </p>
                  </div>
                </div>

                <div className="md:col-span-5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs tabular-nums">
                    <span className="text-[#57534E] dark:text-[#A8A29E]">Completion</span>
                    <span className="font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                      {completion}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#1C1917]/8 dark:bg-[#F5F2EB]/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        completion === 100
                          ? 'bg-[#15803D] dark:bg-[#22C55E]'
                          : 'bg-[#B91C1C] dark:bg-[#EF4444]'
                      }`}
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>

                <div className="md:col-span-3 flex items-center md:justify-end gap-4 text-xs tabular-nums">
                  <span className="text-[#57534E] dark:text-[#A8A29E]">
                    Solved:{' '}
                    <strong className="text-[#1C1917] dark:text-[#F5F2EB]">
                      {st?.solved ?? 0}
                    </strong>
                  </span>
                  <span aria-hidden="true" className="text-[#1C1917]/20 dark:text-[#F5F2EB]/20">
                    /
                  </span>
                  <span className="text-[#57534E] dark:text-[#A8A29E]">
                    Accuracy:{' '}
                    <strong
                      className={
                        st && st.solved > 0
                          ? accuracy >= 75
                            ? 'text-[#15803D] dark:text-[#22C55E]'
                            : 'text-[#D97706] dark:text-[#F59E0B]'
                          : 'text-[#57534E] dark:text-[#A8A29E]'
                      }
                    >
                      {st && st.solved > 0 ? `${accuracy}%` : '—'}
                    </strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accuracy Across All 10 Drill Types */}
      <div className="rounded-xl border border-[#1C1917]/10 dark:border-[#F5F2EB]/10 bg-white dark:bg-[#1E1C1A] p-6 sm:p-8 space-y-5">
        <h2 className="text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB] border-b border-[#1C1917]/10 dark:border-[#F5F2EB]/10 pb-4">
          Accuracy by Drill Mode
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_DRILL_TYPES.map((dt) => {
            const stat = progress.drillStats[dt] ?? { attempted: 0, correct: 0 };
            const rate =
              stat.attempted > 0 ? Math.round((stat.correct / stat.attempted) * 100) : null;
            const isWeakest = analytics.weakestDrillType === dt;

            return (
              <div
                key={dt}
                className={`rounded-lg border p-4 space-y-2 ${
                  isWeakest
                    ? 'border-[#B91C1C]/35 dark:border-[#EF4444]/40 bg-[#B91C1C]/5 dark:bg-[#EF4444]/8'
                    : 'border-[#1C1917]/10 dark:border-[#F5F2EB]/10 bg-[#F9F6F0]/60 dark:bg-[#121110]/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                    {DRILL_METADATA[dt].titleAr}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-[#1C1917] dark:text-[#F5F2EB]">
                    {rate === null ? '—' : `${rate}%`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                  <span>
                    {stat.correct} correct of {stat.attempted}
                  </span>
                  {isWeakest && (
                    <span className="font-semibold text-[#B91C1C] dark:text-[#EF4444]">
                      Needs Review
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
