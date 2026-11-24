import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  BookMarked,
  CheckCircle2,
  FolderClock,
  Lock,
  Unlock,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { CHAPTERS_DATA } from '../data/chaptersData';
import { getChapterTrueFalseItems } from '../data/trueFalseData';
import { ChapterData } from '../types';
import { countUnlockedChapters, isChapterUnlocked } from '../utils/accessControl';
import { LockedAccessModal } from './LockedAccessModal';

interface ChaptersGridViewProps {
  onSelectChapter: (chapter: ChapterData) => void;
}

type ChapterFilter = 'all' | 'in-progress' | 'completed' | 'not-started';

/**
 * Separates a combined subtitle like "My Dad Also Works at the Hospital (我爸爸也在医院工作)"
 * into a clean English theme title and a dedicated Chinese lesson line so long titles never clip awkwardly.
 */
function parseChapterSubtitle(subtitle: string): {
  englishTheme: string;
  chineseLesson: string | null;
} {
  const match = subtitle.match(/^(.*?)\s*[（(]([^()（）]+)[）)]\s*$/);
  if (match) {
    return {
      englishTheme: match[1].trim(),
      chineseLesson: match[2].trim(),
    };
  }
  return {
    englishTheme: subtitle.trim(),
    chineseLesson: null,
  };
}

export function ChaptersGridView({ onSelectChapter }: ChaptersGridViewProps) {
  const { progress, analytics, unlockedAccess } = useApp();
  const [emptyChapterModal, setEmptyChapterModal] = useState<ChapterData | null>(null);
  const [lockedChapterModal, setLockedChapterModal] = useState<ChapterData | null>(null);
  const [activeFilter, setActiveFilter] = useState<ChapterFilter>('all');

  const unlockedCount = countUnlockedChapters(unlockedAccess);
  const isFullChapters = unlockedCount >= CHAPTERS_DATA.length;

  const curriculumTotals = useMemo(() => {
    let vocab = 0;
    let sentences = 0;
    let completedChapters = 0;
    let inProgressChapters = 0;
    let notStartedChapters = 0;

    CHAPTERS_DATA.forEach((ch) => {
      vocab += ch.vocab.length;
      sentences += ch.sentences.length;
      const unlocked = isChapterUnlocked(unlockedAccess, ch.id);
      if (!unlocked) return;
      const pct = analytics.getChapterCompletion(ch.id);
      if (pct === 100) completedChapters += 1;
      else if (pct > 0) inProgressChapters += 1;
      else notStartedChapters += 1;
    });

    return {
      vocab,
      sentences,
      completedChapters,
      inProgressChapters,
      notStartedChapters,
    };
  }, [analytics, unlockedAccess]);

  const bestExamByChapter = useMemo(() => {
    const map = new Map<number, { score: number; total: number; percentage: number }>();
    for (const res of progress?.chapterExamResults ?? []) {
      const existing = map.get(res.chapterId);
      if (!existing || res.percentage > existing.percentage) {
        map.set(res.chapterId, {
          score: res.score,
          total: res.total,
          percentage: res.percentage,
        });
      }
    }
    return map;
  }, [progress?.chapterExamResults]);

  const filteredChapters = useMemo(() => {
    return CHAPTERS_DATA.filter((chapter) => {
      if (activeFilter === 'all') return true;
      const isUnlocked = isChapterUnlocked(unlockedAccess, chapter.id);
      if (!isUnlocked) return false;
      const completion = analytics.getChapterCompletion(chapter.id);
      if (activeFilter === 'completed') return completion === 100;
      if (activeFilter === 'in-progress') return completion > 0 && completion < 100;
      return completion === 0;
    });
  }, [activeFilter, analytics, unlockedAccess]);

  const handleCardClick = (chapter: ChapterData) => {
    if (!isChapterUnlocked(unlockedAccess, chapter.id)) {
      setLockedChapterModal(chapter);
      return;
    }

    const totalItems = chapter.vocab.length + chapter.sentences.length;
    if (totalItems === 0) {
      setEmptyChapterModal(chapter);
      return;
    }
    onSelectChapter(chapter);
  };

  const filterTabs: { id: ChapterFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All Chapters', count: CHAPTERS_DATA.length },
    { id: 'in-progress', label: 'In Progress', count: curriculumTotals.inProgressChapters },
    { id: 'completed', label: 'Completed', count: curriculumTotals.completedChapters },
    { id: 'not-started', label: 'Not Started', count: curriculumTotals.notStartedChapters },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-7"
    >
      {/* Section Header */}
      <div className="space-y-5 border-b border-[#1C1917]/10 dark:border-[#F5F2EB]/10 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#57534E] dark:text-[#A8A29E] tabular-nums">
              <span className="font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
                HSK 3.0 Level 1 Curriculum
              </span>
              <span aria-hidden="true">·</span>
              <span>15 Chapters</span>
              <span aria-hidden="true">·</span>
              <span>{curriculumTotals.vocab} Vocab</span>
              <span aria-hidden="true">·</span>
              <span>{curriculumTotals.sentences} Sentences</span>
              <span aria-hidden="true">·</span>
              <span
                className={`inline-flex items-center gap-1 font-bold ${
                  isFullChapters
                    ? 'text-[#15803D] dark:text-[#22C55E]'
                    : 'text-[#B45309] dark:text-[#F59E0B]'
                }`}
              >
                {isFullChapters ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>All Unlocked</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>{unlockedCount}/15 Unlocked</span>
                  </>
                )}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1917] dark:text-[#F5F2EB]">
              HSK 3.0 Level 1 Chapters
            </h1>
            <p className="text-sm text-[#57534E] dark:text-[#A8A29E] max-w-2xl">
              Master all 15 sequential lessons with 11 interactive drill modes, 40-question chapter
              exams, and stroke-order labs.
            </p>
          </div>

          {/* Curriculum Progress Summary */}
          <div className="w-full lg:w-72 rounded-xl border border-[#1C1917]/10 dark:border-[#F5F2EB]/10 bg-white dark:bg-[#1E1C1A] px-4 py-3.5 space-y-2 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
            <div className="flex items-baseline justify-between gap-2 text-xs tabular-nums">
              <span className="font-semibold text-[#57534E] dark:text-[#A8A29E]">
                Curriculum Mastery
              </span>
              <span className="text-base font-bold text-[#15803D] dark:text-[#22C55E]">
                {analytics.overallProgressPercent}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#1C1917]/8 dark:bg-[#F5F2EB]/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#15803D] dark:bg-[#22C55E] transition-all duration-300"
                style={{ width: `${analytics.overallProgressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#57534E] dark:text-[#A8A29E] tabular-nums">
              <span>{curriculumTotals.completedChapters}/15 chapters completed</span>
              <span>{curriculumTotals.inProgressChapters} active</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div
            role="tablist"
            aria-label="Filter chapters by status"
            className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-lg border border-[#1C1917]/10 dark:border-[#F5F2EB]/10 bg-[#F2ECE1]/80 dark:bg-[#1A1816]"
          >
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-md text-xs font-bold transition-colors whitespace-nowrap tabular-nums ${
                    isActive
                      ? 'bg-white dark:bg-[#2A2724] text-[#B91C1C] dark:text-[#EF4444] shadow-xs'
                      : 'text-[#57534E] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#F5F2EB]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[11px] font-semibold ${
                      isActive
                        ? 'text-[#B91C1C]/80 dark:text-[#EF4444]/85'
                        : 'text-[#57534E]/75 dark:text-[#A8A29E]/75'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-xs text-[#57534E] dark:text-[#A8A29E] tabular-nums">
            Showing {filteredChapters.length} of {CHAPTERS_DATA.length} chapters
          </span>
        </div>
      </div>

      {/* 15 Chapters Grid */}
      {filteredChapters.length === 0 ? (
        <div className="rounded-xl border border-[#1C1917]/10 dark:border-[#F5F2EB]/10 bg-white dark:bg-[#1E1C1A] p-10 text-center space-y-3">
          <p className="text-base font-bold text-[#1C1917] dark:text-[#F5F2EB]">
            No chapters match this filter yet
          </p>
          <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#A8A29E]">
            Start practicing any chapter to track your in-progress and completed lessons here.
          </p>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className="inline-flex items-center justify-center px-4 py-2 min-h-[38px] rounded-lg border border-[#B91C1C] dark:border-[#EF4444] text-xs font-bold text-[#B91C1C] dark:text-[#EF4444] hover:bg-[#B91C1C] hover:text-white dark:hover:bg-[#EF4444] dark:hover:text-white transition-colors"
          >
            Show All 15 Chapters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChapters.map((chapter) => {
            const itemCount = chapter.vocab.length + chapter.sentences.length;
            const isEmpty = itemCount === 0;
            const isUnlocked = isChapterUnlocked(unlockedAccess, chapter.id);
            const completion = analytics.getChapterCompletion(chapter.id);
            const isCompleted = isUnlocked && completion === 100;
            const completedDrillsCount = progress?.chapterStats[chapter.id]?.completedDrills.length ?? 0;
            const tfCount = getChapterTrueFalseItems(chapter.id).length;
            const bestExam = bestExamByChapter.get(chapter.id);
            const { englishTheme, chineseLesson } = parseChapterSubtitle(chapter.subtitleAr);

            return (
              <button
                key={chapter.id}
                type="button"
                onClick={() => handleCardClick(chapter)}
                className={`group text-left rounded-xl border p-5 sm:p-6 flex flex-col justify-between gap-5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B91C1C] dark:focus-visible:ring-[#EF4444] ${
                  !isUnlocked
                    ? 'bg-[#F4EFE6]/85 dark:bg-[#191715] border-[#1C1917]/12 dark:border-[#F5F2EB]/12 hover:border-[#D97706]/55 dark:hover:border-[#F59E0B]/55 opacity-95'
                    : isEmpty
                      ? 'bg-white/75 dark:bg-[#1E1C1A]/75 border-[#1C1917]/10 dark:border-[#F5F2EB]/10 opacity-85 hover:opacity-100'
                      : isCompleted
                        ? 'bg-white dark:bg-[#1E1C1A] border-[#15803D]/25 dark:border-[#22C55E]/25 shadow-[0_1px_2px_rgba(28,25,23,0.04)] hover:shadow-[0_12px_26px_-14px_rgba(21,128,61,0.22)] dark:hover:shadow-[0_12px_26px_-14px_rgba(0,0,0,0.5)] hover:border-[#15803D]/55 dark:hover:border-[#22C55E]/55 hover:-translate-y-0.5'
                        : 'bg-white dark:bg-[#1E1C1A] border-[#1C1917]/12 dark:border-[#F5F2EB]/12 shadow-[0_1px_2px_rgba(28,25,23,0.04)] hover:shadow-[0_12px_26px_-14px_rgba(28,25,23,0.18)] dark:hover:shadow-[0_12px_26px_-14px_rgba(0,0,0,0.5)] hover:border-[#B91C1C]/45 dark:hover:border-[#EF4444]/45 hover:-translate-y-0.5'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar: Seal, Kicker & Action/State */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`font-hanzi w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold shrink-0 transition-colors duration-200 ${
                          !isUnlocked
                            ? 'border border-[#D97706]/35 dark:border-[#F59E0B]/35 text-[#B45309] dark:text-[#F59E0B] bg-[#D97706]/10 dark:bg-[#F59E0B]/12'
                            : isEmpty
                              ? 'border border-[#1C1917]/15 dark:border-[#F5F2EB]/15 text-[#57534E] dark:text-[#A8A29E] bg-[#F9F6F0] dark:bg-[#121110]'
                              : isCompleted
                                ? 'border border-[#15803D]/35 dark:border-[#22C55E]/35 text-[#15803D] dark:text-[#22C55E] bg-[#15803D]/8 dark:bg-[#22C55E]/12 group-hover:bg-[#15803D] group-hover:text-white dark:group-hover:bg-[#22C55E] dark:group-hover:text-[#121110]'
                                : 'cinnabar-seal bg-[#B91C1C]/5 dark:bg-[#EF4444]/10 group-hover:bg-[#B91C1C] group-hover:text-white dark:group-hover:bg-[#EF4444] dark:group-hover:text-white'
                        }`}
                      >
                        {chapter.chineseNumeral}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                          <span>Chapter {String(chapter.id).padStart(2, '0')}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-hanzi normal-case tracking-normal font-semibold">
                            第{chapter.id}课
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isUnlocked ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#B45309] dark:text-[#F59E0B] shrink-0">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked</span>
                      </span>
                    ) : isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#15803D] dark:text-[#22C55E] shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Done</span>
                      </span>
                    ) : (
                      !isEmpty && (
                        <ArrowRight className="w-4 h-4 text-[#57534E] dark:text-[#A8A29E] group-hover:text-[#B91C1C] dark:group-hover:text-[#EF4444] group-hover:translate-x-0.5 transition-all shrink-0" />
                      )
                    )}
                  </div>

                  {/* Clean Dual-Script Title Block (Zero Clipping) */}
                  <div className="space-y-1 min-h-[3.25rem]">
                    <h2 className="text-[15px] sm:text-base font-bold text-[#1C1917] dark:text-[#F5F2EB] leading-snug line-clamp-2 group-hover:text-[#B91C1C] dark:group-hover:text-[#EF4444] transition-colors">
                      {isEmpty ? `${chapter.titleAr} — Content Coming Soon` : englishTheme}
                    </h2>
                    {!isEmpty && chineseLesson && (
                      <p className="font-hanzi text-xs sm:text-[13px] font-medium text-[#57534E] dark:text-[#A8A29E] leading-relaxed">
                        {chineseLesson}
                      </p>
                    )}
                  </div>

                  {/* Unboxed Content & Exam Metadata */}
                  <div className="space-y-1.5 text-xs text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                    {!isUnlocked ? (
                      <span className="inline-flex items-center gap-1.5 text-[#B45309] dark:text-[#F59E0B] font-semibold">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>Click to see how to unlock this chapter</span>
                      </span>
                    ) : isEmpty ? (
                      <span className="inline-flex items-center gap-1.5">
                        <FolderClock className="w-3.5 h-3.5 shrink-0" />
                        <span>0 items available yet</span>
                      </span>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="inline-flex items-center gap-1 font-medium text-[#1C1917]/85 dark:text-[#F5F2EB]/85">
                            <BookMarked className="w-3.5 h-3.5 text-[#D97706] dark:text-[#F59E0B] shrink-0" />
                            <span>{chapter.vocab.length} vocab</span>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{chapter.sentences.length} sentences</span>
                          {tfCount > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{tfCount} T/F</span>
                            </>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                          <span>{completedDrillsCount}/11 drills</span>
                          {bestExam && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span
                                className={`inline-flex items-center gap-1 font-bold ${
                                  bestExam.percentage >= 70
                                    ? 'text-[#15803D] dark:text-[#22C55E]'
                                    : 'text-[#B91C1C] dark:text-[#EF4444]'
                                }`}
                              >
                                <Award className="w-3 h-3 shrink-0" />
                                <span>Best Exam {bestExam.percentage}%</span>
                              </span>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Completion Progress Bar */}
                <div className="w-full pt-3.5 border-t border-[#1C1917]/8 dark:border-[#F5F2EB]/8 space-y-1.5">
                  <div className="flex items-center justify-between text-xs tabular-nums">
                    <span className="text-[#57534E] dark:text-[#A8A29E] font-medium">
                      {!isUnlocked
                        ? 'Access Status'
                        : isCompleted
                          ? 'Chapter Mastered'
                          : completion > 0
                            ? 'In Progress'
                            : 'Not Started'}
                    </span>
                    <span
                      className={`font-bold ${
                        !isUnlocked
                          ? 'text-[#B45309] dark:text-[#F59E0B]'
                          : isCompleted
                            ? 'text-[#15803D] dark:text-[#22C55E]'
                            : completion > 0
                              ? 'text-[#B91C1C] dark:text-[#EF4444]'
                              : 'text-[#57534E] dark:text-[#A8A29E]'
                      }`}
                    >
                      {isUnlocked ? `${completion}%` : 'Locked'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#1C1917]/8 dark:bg-[#F5F2EB]/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        !isUnlocked
                          ? 'bg-[#D97706]/35 dark:bg-[#F59E0B]/35'
                          : isCompleted
                            ? 'bg-[#15803D] dark:bg-[#22C55E]'
                            : 'bg-[#B91C1C] dark:bg-[#EF4444]'
                      }`}
                      style={{ width: `${isUnlocked ? completion : 0}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Locked Chapter Access Modal */}
      <LockedAccessModal
        isOpen={Boolean(lockedChapterModal)}
        itemTitle={
          lockedChapterModal
            ? `${lockedChapterModal.titleAr} (第${lockedChapterModal.id}课)`
            : ''
        }
        itemType="chapter"
        onClose={() => setLockedChapterModal(null)}
      />

      {/* Empty Chapter Modal */}
      {emptyChapterModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="empty-chapter-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121110]/60 backdrop-blur-[2px]"
          onClick={() => setEmptyChapterModal(null)}
        >
          <div
            className="neo-frame w-full max-w-md rounded-xl p-7 bg-white dark:bg-[#1E1C1A] text-center space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-hanzi cinnabar-seal w-10 h-10 rounded-md flex items-center justify-center text-base font-bold">
                {emptyChapterModal.chineseNumeral}
              </span>
              <button
                type="button"
                onClick={() => setEmptyChapterModal(null)}
                aria-label="Close"
                className="w-9 h-9 rounded-md inline-flex items-center justify-center text-[#57534E] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#F5F2EB]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 py-2">
              <h2
                id="empty-chapter-title"
                className="text-xl font-bold text-[#1C1917] dark:text-[#F5F2EB]"
              >
                {emptyChapterModal.titleAr}
              </h2>
              <p className="text-base font-semibold text-[#B91C1C] dark:text-[#EF4444]">
                Chapter content coming soon
              </p>
              <p className="text-sm text-[#57534E] dark:text-[#A8A29E] leading-relaxed">
                Vocabulary and sentence drills for this chapter will become available once added by
                your instructor. Continue practicing in the available chapters meanwhile.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setEmptyChapterModal(null)}
              className="w-full py-2.5 px-5 min-h-[44px] rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] dark:bg-[#EF4444] dark:hover:bg-[#DC2626] text-white text-sm font-bold transition-colors"
            >
              Back to Chapters
            </button>
          </div>
        </div>
      )}
    </motion.section>
  );
}
