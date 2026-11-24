import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Clock,
  FileCheck2,
  Filter,
  Lock,
  Shuffle,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { CHAPTERS_DATA } from '../data/chaptersData';
import { ChapterData, FinalExamModelId, FinalExamResult } from '../types';
import { isChapterUnlocked } from '../utils/accessControl';
import {
  estimateFinalExamScope,
  FINAL_EXAM_DURATION_MINUTES,
  FINAL_EXAM_MODELS,
  formatChapterScopeLabel,
} from '../utils/finalExamGenerator';
import { LockedAccessModal } from './LockedAccessModal';

interface FinalExamsPortalViewProps {
  onStartFinalExam: (modelId: FinalExamModelId, chapterIds: number[]) => void;
  onBack: () => void;
}

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDateShort(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FinalExamsPortalView({
  onStartFinalExam,
  onBack,
}: FinalExamsPortalViewProps) {
  const { unlockedAccess, progress } = useApp();

  const unlockedChapterIds = useMemo(
    () =>
      CHAPTERS_DATA.filter((ch) => isChapterUnlocked(unlockedAccess, ch.id)).map((ch) => ch.id),
    [unlockedAccess]
  );

  const [selectedChapterIds, setSelectedChapterIds] = useState<number[]>(() =>
    unlockedChapterIds.length > 0 ? unlockedChapterIds : [1]
  );
  const [lockedChapterModal, setLockedChapterModal] = useState<ChapterData | null>(null);

  useEffect(() => {
    setSelectedChapterIds((prev) => {
      const valid = prev.filter((id) => unlockedChapterIds.includes(id));
      if (valid.length > 0) return valid;
      return unlockedChapterIds.length > 0 ? unlockedChapterIds : [];
    });
  }, [unlockedChapterIds]);

  const toggleChapter = (chapter: ChapterData) => {
    if (!isChapterUnlocked(unlockedAccess, chapter.id)) {
      setLockedChapterModal(chapter);
      return;
    }
    setSelectedChapterIds((prev) =>
      prev.includes(chapter.id)
        ? prev.filter((id) => id !== chapter.id)
        : [...prev, chapter.id].sort((a, b) => a - b)
    );
  };

  const applyRangePreset = (minId: number, maxId: number) => {
    const matching = unlockedChapterIds.filter((id) => id >= minId && id <= maxId);
    if (matching.length === 0) {
      const firstLocked = CHAPTERS_DATA.find(
        (c) => c.id >= minId && c.id <= maxId && !isChapterUnlocked(unlockedAccess, c.id)
      );
      if (firstLocked) setLockedChapterModal(firstLocked);
      return;
    }
    setSelectedChapterIds(matching);
  };

  const scopeStats = useMemo(() => {
    const selectedSet = new Set(selectedChapterIds);
    const chapters = CHAPTERS_DATA.filter((c) => selectedSet.has(c.id));
    const vocabCount = chapters.reduce((sum, c) => sum + c.vocab.length, 0);
    const sentenceCount = chapters.reduce((sum, c) => sum + c.sentences.length, 0);
    const estimate = estimateFinalExamScope(selectedChapterIds);
    return {
      chapterCount: chapters.length,
      vocabCount,
      sentenceCount,
      partCounts: estimate.partCounts,
      estimatedTotalQuestions: estimate.totalQuestions,
      isCapped: estimate.isCapped,
      minChaptersForFullExam: estimate.minChaptersForFullExam,
      durationMinutes: estimate.durationMinutes,
      scopeLabel: formatChapterScopeLabel(selectedChapterIds),
    };
  }, [selectedChapterIds]);

  const finalResults: FinalExamResult[] = progress?.finalExamResults ?? [];

  const getModelStats = (modelId: FinalExamModelId) => {
    const attempts = finalResults.filter((r) => r.modelId === modelId);
    if (attempts.length === 0) return null;
    const best = attempts.reduce((max, item) =>
      item.percentage > max.percentage ? item : max
    );
    return {
      attemptsCount: attempts.length,
      bestScore: best.score,
      bestTotal: best.total,
      bestPercentage: best.percentage,
    };
  };

  const canLaunch = selectedChapterIds.length > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 space-y-8"
    >
      {/* Top Breadcrumb & Header */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#57534E] dark:text-[#A8A29E] hover:text-[#B91C1C] dark:hover:text-[#EF4444] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="neo-frame rounded-xl p-6 sm:p-8 bg-white dark:bg-[#1E1C1A] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <span className="cinnabar-seal font-hanzi w-14 h-14 rounded-lg flex items-center justify-center text-2xl font-bold bg-[#F9F6F0] dark:bg-[#141312] shrink-0">
              考
            </span>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#B91C1C] dark:text-[#EF4444] uppercase tracking-wider">
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>HSK 3.0 Level 1 · Final Assessment Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                Final Exams Portal
              </h1>
              <p className="text-sm text-[#57534E] dark:text-[#A8A29E] max-w-2xl leading-relaxed">
                Take standardized 80-question comprehensive mock exams (Models 1–3) for fair
                benchmark comparison, or generate a fresh randomized exam across any custom chapter
                range — from midterms to the full 15-chapter curriculum.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 shrink-0 text-center">
            <div className="rounded-lg border border-[#1C1917]/10 dark:border-[#F5F2EB]/10 bg-[#F9F6F0] dark:bg-[#141312] px-3.5 py-2.5">
              <p className="text-lg font-extrabold text-[#1C1917] dark:text-[#F5F2EB] tabular-nums">
                {scopeStats.estimatedTotalQuestions}
              </p>
              <p className="text-[11px] font-semibold text-[#57534E] dark:text-[#A8A29E]">
                Questions
              </p>
            </div>
            <div className="rounded-lg border border-[#1C1917]/10 dark:border-[#F5F2EB]/10 bg-[#F9F6F0] dark:bg-[#141312] px-3.5 py-2.5">
              <p className="text-lg font-extrabold text-[#B91C1C] dark:text-[#EF4444] tabular-nums">
                5
              </p>
              <p className="text-[11px] font-semibold text-[#57534E] dark:text-[#A8A29E]">
                Parts
              </p>
            </div>
            <div className="rounded-lg border border-[#1C1917]/10 dark:border-[#F5F2EB]/10 bg-[#F9F6F0] dark:bg-[#141312] px-3.5 py-2.5">
              <p className="text-lg font-extrabold text-[#D97706] dark:text-[#F59E0B] tabular-nums">
                {FINAL_EXAM_DURATION_MINUTES}m
              </p>
              <p className="text-[11px] font-semibold text-[#57534E] dark:text-[#A8A29E]">
                Timer
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Custom Chapter Scope Filter */}
      <div className="rounded-xl border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] p-6 sm:p-7 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#B91C1C] dark:text-[#EF4444]" />
              <h2 className="text-base sm:text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                Step 1 · Select Chapter Scope
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#A8A29E]">
              Choose a quick range preset or toggle individual chapters below before starting any
              Final Exam model.
            </p>
          </div>

          <div className="inline-flex flex-wrap items-center gap-2 text-xs font-bold tabular-nums px-3.5 py-2 rounded-lg border border-[#15803D]/30 dark:border-[#22C55E]/30 bg-[#15803D]/8 dark:bg-[#22C55E]/12 text-[#15803D] dark:text-[#22C55E]">
            <span>{scopeStats.scopeLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{scopeStats.vocabCount} vocab</span>
            <span aria-hidden="true">·</span>
            <span>{scopeStats.sentenceCount} sentences</span>
          </div>
        </div>

        {/* Quick Range Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedChapterIds([...unlockedChapterIds])}
            className={`px-3.5 py-2 min-h-[38px] rounded-lg border text-xs font-bold transition-colors ${
              selectedChapterIds.length === unlockedChapterIds.length && unlockedChapterIds.length > 0
                ? 'border-[#B91C1C] dark:border-[#EF4444] bg-[#B91C1C] dark:bg-[#EF4444] text-white'
                : 'border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-[#F9F6F0] dark:bg-[#141312] text-[#1C1917] dark:text-[#F5F2EB] hover:border-[#B91C1C]/45'
            }`}
          >
            All Chapters ({unlockedChapterIds.length})
          </button>

          <button
            type="button"
            onClick={() => applyRangePreset(1, 5)}
            className="px-3.5 py-2 min-h-[38px] rounded-lg border border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-[#F9F6F0] dark:bg-[#141312] hover:border-[#B91C1C]/45 text-xs font-bold text-[#1C1917] dark:text-[#F5F2EB] transition-colors"
          >
            Chapters 1–5
          </button>

          <button
            type="button"
            onClick={() => applyRangePreset(6, 10)}
            className="px-3.5 py-2 min-h-[38px] rounded-lg border border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-[#F9F6F0] dark:bg-[#141312] hover:border-[#B91C1C]/45 text-xs font-bold text-[#1C1917] dark:text-[#F5F2EB] transition-colors"
          >
            Chapters 6–10
          </button>

          <button
            type="button"
            onClick={() => applyRangePreset(11, 15)}
            className="px-3.5 py-2 min-h-[38px] rounded-lg border border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-[#F9F6F0] dark:bg-[#141312] hover:border-[#B91C1C]/45 text-xs font-bold text-[#1C1917] dark:text-[#F5F2EB] transition-colors"
          >
            Chapters 11–15
          </button>

          <button
            type="button"
            onClick={() => applyRangePreset(1, 8)}
            className="px-3.5 py-2 min-h-[38px] rounded-lg border border-[#D97706]/35 dark:border-[#F59E0B]/35 bg-[#D97706]/8 dark:bg-[#F59E0B]/12 hover:border-[#D97706] text-xs font-bold text-[#92400E] dark:text-[#F59E0B] transition-colors"
          >
            Midterm (Ch. 1–8)
          </button>

          <button
            type="button"
            onClick={() => setSelectedChapterIds([])}
            className="px-3 py-2 min-h-[38px] rounded-lg border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 text-xs font-semibold text-[#57534E] dark:text-[#A8A29E] hover:text-[#B91C1C] dark:hover:text-[#EF4444] transition-colors"
          >
            Clear
          </button>
        </div>

        {/* 15-Chapter Interactive Checkbox Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {CHAPTERS_DATA.map((ch) => {
            const unlocked = isChapterUnlocked(unlockedAccess, ch.id);
            const checked = selectedChapterIds.includes(ch.id);
            return (
              <button
                key={ch.id}
                type="button"
                aria-pressed={checked}
                onClick={() => toggleChapter(ch)}
                className={`text-left rounded-lg border p-3 transition-all flex items-start gap-2.5 ${
                  !unlocked
                    ? 'border-[#D97706]/25 bg-[#F2ECE1]/55 dark:bg-[#181614] opacity-75 hover:border-[#D97706]/55'
                    : checked
                      ? 'border-[#B91C1C] dark:border-[#EF4444] bg-[#B91C1C]/8 dark:bg-[#EF4444]/14 ring-1 ring-[#B91C1C]/25'
                      : 'border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-[#F9F6F0]/55 dark:bg-[#141312] hover:border-[#B91C1C]/40'
                }`}
              >
                <span
                  className={`mt-0.5 w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
                    !unlocked
                      ? 'border-[#D97706]/40 bg-[#D97706]/10 text-[#B45309] dark:text-[#F59E0B]'
                      : checked
                        ? 'border-[#B91C1C] dark:border-[#EF4444] bg-[#B91C1C] dark:bg-[#EF4444] text-white'
                        : 'border-[#1C1917]/25 dark:border-[#F5F2EB]/25 bg-white dark:bg-[#1E1C1A]'
                  }`}
                >
                  {!unlocked ? (
                    <Lock className="w-2.5 h-2.5" />
                  ) : checked ? (
                    <Check className="w-3 h-3 stroke-[3]" />
                  ) : null}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[#1C1917] dark:text-[#F5F2EB] tabular-nums">
                      Ch. {ch.id}
                    </span>
                    <span className="font-hanzi text-[11px] font-semibold text-[#57534E] dark:text-[#A8A29E]">
                      第{ch.id}课
                    </span>
                  </div>
                  <p className="text-[11px] text-[#57534E] dark:text-[#A8A29E] truncate mt-0.5">
                    {ch.subtitleAr.split('(')[0].trim()}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {!canLaunch && (
          <p className="text-xs font-bold text-[#B91C1C] dark:text-[#EF4444]">
            Select at least 1 chapter above to unlock the Final Exam models.
          </p>
        )}

        {canLaunch && scopeStats.isCapped && (
          <p className="text-xs font-medium text-[#92400E] dark:text-[#F59E0B] bg-[#D97706]/8 dark:bg-[#F59E0B]/10 border border-[#D97706]/25 rounded-lg px-3.5 py-2.5 leading-relaxed">
            Narrow scope selected ({scopeStats.chapterCount}{' '}
            {scopeStats.chapterCount === 1 ? 'chapter' : 'chapters'}): This paper is automatically
            capped to{' '}
            <strong>{scopeStats.estimatedTotalQuestions} unique questions</strong> (including{' '}
            <strong>{scopeStats.partCounts[2]} unique reading passages</strong>) so no passages or
            items ever repeat. Select {scopeStats.minChaptersForFullExam}+ chapters for a full
            80-question Final Exam.
          </p>
        )}
      </div>

      {/* Step 2: 3 Fixed Models + 1 Dynamic Random Exam Generator */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1C1917] dark:text-[#F5F2EB]">
              Step 2 · Choose Your Final Exam Paper
            </h2>
            <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#A8A29E]">
              Covers 5 Parts ({scopeStats.estimatedTotalQuestions} Questions for current scope ·{' '}
              {scopeStats.durationMinutes} min): Vocabulary &amp; Pinyin, Grammar Blanks, Reading
              &amp; Dialogue Comprehension, Sentence Translation, and True/False.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FINAL_EXAM_MODELS.map((model) => {
            const stats = getModelStats(model.id);
            const isRandom = !model.isDeterministic;

            return (
              <div
                key={model.id}
                className={`rounded-xl border p-6 flex flex-col justify-between gap-5 transition-all ${
                  isRandom
                    ? 'border-[#D97706]/40 dark:border-[#F59E0B]/40 bg-gradient-to-br from-white via-white to-[#D97706]/6 dark:from-[#1E1C1A] dark:via-[#1E1C1A] dark:to-[#F59E0B]/8'
                    : 'border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] hover:border-[#B91C1C]/45 dark:hover:border-[#EF4444]/45'
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
                          isRandom
                            ? 'border-[#D97706]/35 bg-[#D97706]/12 text-[#B45309] dark:text-[#F59E0B]'
                            : 'border-[#B91C1C]/30 bg-[#B91C1C]/10 text-[#B91C1C] dark:text-[#EF4444]'
                        }`}
                      >
                        {isRandom ? (
                          <Shuffle className="w-5 h-5" />
                        ) : (
                          <FileCheck2 className="w-5 h-5" />
                        )}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-extrabold uppercase tracking-wider ${
                              isRandom
                                ? 'text-[#B45309] dark:text-[#F59E0B]'
                                : 'text-[#B91C1C] dark:text-[#EF4444]'
                            }`}
                          >
                            {model.code}
                          </span>
                          <span aria-hidden="true" className="text-[#57534E]/50">
                            ·
                          </span>
                          <span className="text-[11px] font-semibold text-[#57534E] dark:text-[#A8A29E]">
                            {model.isDeterministic ? 'Fixed Standardized Seed' : 'Dynamic Fresh Seed'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                          {model.label}
                        </h3>
                      </div>
                    </div>

                    {stats && (
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-extrabold tabular-nums ${
                            stats.bestPercentage >= 80
                              ? 'bg-[#15803D]/12 text-[#15803D] dark:text-[#22C55E]'
                              : stats.bestPercentage >= 70
                                ? 'bg-[#D97706]/12 text-[#B45309] dark:text-[#F59E0B]'
                                : 'bg-[#B91C1C]/12 text-[#B91C1C] dark:text-[#EF4444]'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>
                            Best: {stats.bestScore}/{stats.bestTotal} ({stats.bestPercentage}%)
                          </span>
                        </span>
                        <p className="text-[11px] text-[#57534E] dark:text-[#A8A29E] mt-1 tabular-nums">
                          {stats.attemptsCount}{' '}
                          {stats.attemptsCount === 1 ? 'attempt' : 'attempts'}
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#A8A29E] leading-relaxed">
                    {model.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                    <span>I · Vocab &amp; Pinyin ({scopeStats.partCounts[0]})</span>
                    <span aria-hidden="true">·</span>
                    <span>II · Grammar Blanks ({scopeStats.partCounts[1]})</span>
                    <span aria-hidden="true">·</span>
                    <span>III · Reading &amp; Dialogues ({scopeStats.partCounts[2]})</span>
                    <span aria-hidden="true">·</span>
                    <span>IV · Translation Traps ({scopeStats.partCounts[3]})</span>
                    <span aria-hidden="true">·</span>
                    <span>V · True / False ({scopeStats.partCounts[4]})</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1C1917]/10 dark:border-[#F5F2EB]/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {scopeStats.durationMinutes} min · {scopeStats.estimatedTotalQuestions} Qs ·{' '}
                      {scopeStats.scopeLabel}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={!canLaunch}
                    onClick={() => onStartFinalExam(model.id, selectedChapterIds)}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] rounded-lg text-xs sm:text-sm font-bold transition-colors disabled:opacity-45 ${
                      isRandom
                        ? 'bg-[#D97706] hover:bg-[#B45309] dark:bg-[#F59E0B] dark:hover:bg-[#D97706] text-white dark:text-[#121110]'
                        : 'bg-[#B91C1C] hover:bg-[#991B1B] dark:bg-[#EF4444] dark:hover:bg-[#DC2626] text-white'
                    }`}
                  >
                    {isRandom ? (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Random Exam</span>
                      </>
                    ) : (
                      <>
                        <span>Start {model.shortTitle}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Final Exam History */}
      {finalResults.length > 0 && (
        <div className="rounded-xl border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1C1917]/10 dark:border-[#F5F2EB]/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#15803D] dark:text-[#22C55E]" />
              <h2 className="text-base font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                Your Recent Final Exam Attempts
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#57534E] dark:text-[#A8A29E] tabular-nums">
              {finalResults.length} {finalResults.length === 1 ? 'attempt' : 'attempts'} synced
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F9F6F0] dark:bg-[#141312] text-[#57534E] dark:text-[#A8A29E] text-xs">
                <tr>
                  <th className="px-5 py-3 font-bold">Model</th>
                  <th className="px-4 py-3 font-bold">Chapter Scope</th>
                  <th className="px-4 py-3 font-bold">Score</th>
                  <th className="px-4 py-3 font-bold">Parts I–V</th>
                  <th className="px-4 py-3 font-bold">Time</th>
                  <th className="px-4 py-3 font-bold">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1917]/10 dark:divide-[#F5F2EB]/10">
                {finalResults.slice(0, 10).map((res) => {
                  const pctTone =
                    res.percentage >= 85
                      ? 'text-[#15803D] dark:text-[#22C55E]'
                      : res.percentage >= 70
                        ? 'text-[#B45309] dark:text-[#F59E0B]'
                        : 'text-[#B91C1C] dark:text-[#EF4444]';
                  const partsText = res.partScores
                    .map((p) => `P${p.romanNumeral}:${p.correct}/${p.total}`)
                    .join(' · ');
                  return (
                    <tr key={res.id} className="hover:bg-[#F9F6F0]/60 dark:hover:bg-[#25221F]/50">
                      <td className="px-5 py-3 font-bold text-[#1C1917] dark:text-[#F5F2EB] whitespace-nowrap">
                        {res.modelLabel}
                      </td>
                      <td className="px-4 py-3 text-[#57534E] dark:text-[#A8A29E]">
                        {res.scopeLabel}
                      </td>
                      <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                        <strong className="text-[#1C1917] dark:text-[#F5F2EB]">
                          {res.score}/{res.total}
                        </strong>{' '}
                        <span className={`font-bold ${pctTone}`}>({res.percentage}%)</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#57534E] dark:text-[#A8A29E] tabular-nums whitespace-nowrap">
                        {partsText}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#57534E] dark:text-[#A8A29E] tabular-nums whitespace-nowrap">
                        {formatDuration(res.durationSeconds)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#57534E] dark:text-[#A8A29E] tabular-nums whitespace-nowrap">
                        {formatDateShort(res.completedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Locked Chapter Access Modal */}
      <LockedAccessModal
        isOpen={Boolean(lockedChapterModal)}
        itemTitle={
          lockedChapterModal
            ? `Chapter ${lockedChapterModal.id}: ${lockedChapterModal.subtitleAr}`
            : ''
        }
        itemType="chapter"
        onClose={() => setLockedChapterModal(null)}
      />
    </motion.section>
  );
}
