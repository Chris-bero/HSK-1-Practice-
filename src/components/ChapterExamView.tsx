import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  ChapterData,
  ChapterExamPartScore,
  ChapterExamQuestion,
  ChapterExamResult,
  DrillType,
  QuestionAnswerRecord,
} from '../types';
import { generateChapterExam } from '../utils/chapterExamGenerator';
import { stopChineseSpeech } from '../utils/speech';
import { SpeakChineseButton } from './drills/SpeakChineseButton';

interface ChapterExamViewProps {
  chapter: ChapterData;
  onExit: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function ChapterExamView({ chapter, onExit }: ChapterExamViewProps) {
  const { showPinyin, recordChapterExamResult } = useApp();

  const [examSeed, setExamSeed] = useState(0);
  const examPaper = useMemo(() => generateChapterExam(chapter), [chapter, examSeed]);
  const allQuestions = useMemo(
    () => examPaper.parts.flatMap((p) => p.questions),
    [examPaper]
  );

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(examPaper.durationSeconds);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [showUnansweredConfirm, setShowUnansweredConfirm] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'wrong' | 'all'>('wrong');
  const [syncMessage, setSyncMessage] = useState('');
  const [finalResult, setFinalResult] = useState<ChapterExamResult | null>(null);

  const submittedRef = useRef(false);
  const selectedAnswersRef = useRef(selectedAnswers);
  const remainingRef = useRef(remainingSeconds);

  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  useEffect(() => {
    remainingRef.current = remainingSeconds;
  }, [remainingSeconds]);

  useEffect(() => {
    return () => {
      stopChineseSpeech();
    };
  }, []);

  const answeredCount = useMemo(
    () => allQuestions.filter((q) => Boolean(selectedAnswers[q.id])).length,
    [allQuestions, selectedAnswers]
  );
  const unansweredCount = examPaper.totalQuestions - answeredCount;

  const submitExam = useCallback(
    async (triggeredByTimeout: boolean) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      stopChineseSpeech();

      const currentSelections = selectedAnswersRef.current;
      const elapsed = Math.max(1, examPaper.durationSeconds - remainingRef.current);

      const partScores: ChapterExamPartScore[] = examPaper.parts.map((part) => {
        const correctInPart = part.questions.filter(
          (q) => currentSelections[q.id] === q.correctOptionId
        ).length;
        return {
          partNumber: part.partNumber,
          romanNumeral: part.romanNumeral,
          title: part.title,
          correct: correctInPart,
          total: part.questions.length,
        };
      });

      const totalCorrect = partScores.reduce((sum, p) => sum + p.correct, 0);
      const total = examPaper.totalQuestions;
      const percentage = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;

      const records: QuestionAnswerRecord[] = allQuestions.map((q) => {
        const chosenId = currentSelections[q.id];
        const chosenOpt = q.options.find((o) => o.id === chosenId);
        const isCorrect = chosenId === q.correctOptionId;
        return {
          questionId: q.id,
          chapterId: q.chapterId,
          sourceItemId: q.sourceItemId,
          drillType: q.drillType,
          isAnswered: true,
          isCorrect,
          selectedOptionId: chosenId,
          userDisplay: chosenOpt?.label ?? 'Not answered',
          questionPrompt: q.sentenceWithBlank || q.promptPrimary,
          correctDisplay:
            q.part === 4 && !q.isStatementTrue && q.correctedHanzi
              ? `FALSE (${q.correctedHanzi})`
              : q.correctDisplay,
        };
      });

      // Distribute elapsed exam seconds evenly across represented drill types
      const drillCounts: Partial<Record<DrillType, number>> = {};
      for (const q of allQuestions) {
        drillCounts[q.drillType] = (drillCounts[q.drillType] ?? 0) + 1;
      }
      const drillElapsedSeconds: Partial<Record<DrillType, number>> = {};
      for (const [dt, cnt] of Object.entries(drillCounts)) {
        if (cnt && total > 0) {
          drillElapsedSeconds[dt as DrillType] = Math.max(1, Math.round((elapsed * cnt) / total));
        }
      }

      const resultObj: ChapterExamResult = {
        id: `chexm-${chapter.id}-${Date.now()}`,
        chapterId: chapter.id,
        chapterTitle: `${chapter.titleAr}: ${chapter.subtitleAr}`,
        score: totalCorrect,
        total,
        percentage,
        partScores,
        durationSeconds: elapsed,
        completedAt: new Date().toISOString(),
      };

      setFinalResult(resultObj);
      setTimedOut(triggeredByTimeout);
      setIsSubmitted(true);
      setShowUnansweredConfirm(false);
      setReviewFilter(totalCorrect < total ? 'wrong' : 'all');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      const syncRes = await recordChapterExamResult(resultObj, records, drillElapsedSeconds);
      if (syncRes) {
        setSyncMessage(
          syncRes.syncedRemotely
            ? 'Exam score and part breakdown synced to the Teacher Dashboard.'
            : 'Exam score saved locally on this device.'
        );
      }
    },
    [allQuestions, chapter, examPaper, recordChapterExamResult]
  );

  // 45-minute countdown timer
  useEffect(() => {
    if (isSubmitted) return;

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          void submitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isSubmitted, submitExam, examSeed]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setShowUnansweredConfirm(false);
  };

  const handleAttemptSubmit = () => {
    if (unansweredCount > 0) {
      setShowUnansweredConfirm(true);
      return;
    }
    void submitExam(false);
  };

  const handleJumpToPart = (partNumber: number) => {
    const el = document.getElementById(`exam-part-${partNumber}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleJumpToFirstUnanswered = () => {
    const firstMissing = allQuestions.find((q) => !selectedAnswers[q.id]);
    if (firstMissing) {
      const el = document.getElementById(`exam-q-${firstMissing.number}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    setShowUnansweredConfirm(false);
  };

  const handleRetake = () => {
    stopChineseSpeech();
    submittedRef.current = false;
    setSelectedAnswers({});
    setRemainingSeconds(examPaper.durationSeconds);
    setIsSubmitted(false);
    setTimedOut(false);
    setShowUnansweredConfirm(false);
    setFinalResult(null);
    setSyncMessage('');
    setExamSeed((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ===================== GRADED RESULTS & EXPLANATIONS VIEW ===================== */
  if (isSubmitted && finalResult) {
    const wrongQuestions = allQuestions.filter(
      (q) => selectedAnswers[q.id] !== q.correctOptionId
    );
    const displayedQuestions = reviewFilter === 'wrong' ? wrongQuestions : allQuestions;
    const band =
      finalResult.percentage >= 90
        ? {
            label: 'Distinction',
            tone: 'text-[#15803D] dark:text-[#22C55E]',
            badgeBg: 'bg-[#15803D]/12 dark:bg-[#22C55E]/15 border-[#15803D]/30',
          }
        : finalResult.percentage >= 70
          ? {
              label: 'Passed',
              tone: 'text-[#B45309] dark:text-[#F59E0B]',
              badgeBg: 'bg-[#D97706]/12 dark:bg-[#F59E0B]/15 border-[#D97706]/30',
            }
          : {
              label: 'Needs Review',
              tone: 'text-[#B91C1C] dark:text-[#EF4444]',
              badgeBg: 'bg-[#B91C1C]/12 dark:bg-[#EF4444]/15 border-[#B91C1C]/30',
            };

    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-8"
      >
        {/* Final Score Hero Card */}
        <div className="neo-frame rounded-xl p-7 sm:p-9 bg-white dark:bg-[#1E1C1A] text-center space-y-6">
          <div className="mx-auto cinnabar-seal w-16 h-16 rounded-lg flex items-center justify-center bg-[#B91C1C]/5 dark:bg-[#EF4444]/10">
            <Award className="w-8 h-8 text-[#B91C1C] dark:text-[#EF4444]" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#57534E] dark:text-[#A8A29E]">
              <span>{examPaper.chapterTitle} Comprehensive Exam</span>
              <span aria-hidden="true">·</span>
              <span className={`px-2 py-0.5 rounded border ${band.badgeBg} ${band.tone}`}>
                {band.label}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-[#1C1917] dark:text-[#F5F2EB] tabular-nums">
              {finalResult.score} / {finalResult.total}{' '}
              <span className={band.tone}>({finalResult.percentage}%)</span>
            </h1>

            <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#A8A29E]">
              {examPaper.chapterSubtitle}
              {timedOut ? ' · Submitted automatically when the 45-minute timer expired.' : ''}
            </p>

            {syncMessage && (
              <p className="text-xs font-semibold text-[#15803D] dark:text-[#22C55E] pt-1">
                {syncMessage}
              </p>
            )}
          </div>

          {/* 4 Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-2xl mx-auto">
            <div className="rounded-lg border border-[#1C1917]/10 dark:border-[#F5F2EB]/10 p-3.5 bg-[#F9F6F0] dark:bg-[#121110]">
              <p className="text-xs text-[#57534E] dark:text-[#A8A29E] mb-1">Questions</p>
              <p className="text-xl font-bold tabular-nums">{finalResult.total}</p>
            </div>
            <div className="rounded-lg border border-[#15803D]/25 dark:border-[#22C55E]/25 p-3.5 bg-[#15803D]/8 dark:bg-[#22C55E]/10">
              <p className="text-xs text-[#15803D] dark:text-[#22C55E] mb-1">Correct</p>
              <p className="text-xl font-bold tabular-nums text-[#15803D] dark:text-[#22C55E]">
                {finalResult.score}
              </p>
            </div>
            <div className="rounded-lg border border-[#B91C1C]/25 dark:border-[#EF4444]/25 p-3.5 bg-[#B91C1C]/8 dark:bg-[#EF4444]/10">
              <p className="text-xs text-[#B91C1C] dark:text-[#EF4444] mb-1">Wrong</p>
              <p className="text-xl font-bold tabular-nums text-[#B91C1C] dark:text-[#EF4444]">
                {finalResult.total - finalResult.score}
              </p>
            </div>
            <div className="rounded-lg border border-[#D97706]/25 dark:border-[#F59E0B]/25 p-3.5 bg-[#D97706]/8 dark:bg-[#F59E0B]/10">
              <p className="text-xs text-[#D97706] dark:text-[#F59E0B] mb-1">Time Used</p>
              <p className="text-xl font-bold tabular-nums text-[#92400E] dark:text-[#F59E0B]">
                {formatCountdown(finalResult.durationSeconds)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleRetake}
              className="inline-flex items-center gap-2 px-6 py-3 min-h-[46px] rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] dark:bg-[#EF4444] dark:hover:bg-[#DC2626] text-white text-sm font-bold transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Chapter Exam</span>
            </button>

            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-2 px-6 py-3 min-h-[46px] rounded-lg border border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-[#F9F6F0] dark:bg-[#121110] hover:border-[#B91C1C]/40 text-sm font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Chapter Hub</span>
            </button>
          </div>
        </div>

        {/* Part-by-Part Breakdown */}
        <div className="rounded-xl border border-[#1C1917]/10 dark:border-[#F5F2EB]/10 bg-white dark:bg-[#1E1C1A] p-6 sm:p-7 space-y-5">
          <h2 className="text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB] border-b border-[#1C1917]/10 dark:border-[#F5F2EB]/10 pb-3.5">
            Part-by-Part Score Breakdown
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {finalResult.partScores.map((ps) => {
              const pct = ps.total > 0 ? Math.round((ps.correct / ps.total) * 100) : 0;
              const barColor =
                pct >= 80
                  ? 'bg-[#15803D] dark:bg-[#22C55E]'
                  : pct >= 60
                    ? 'bg-[#D97706] dark:bg-[#F59E0B]'
                    : 'bg-[#B91C1C] dark:bg-[#EF4444]';
              const textColor =
                pct >= 80
                  ? 'text-[#15803D] dark:text-[#22C55E]'
                  : pct >= 60
                    ? 'text-[#B45309] dark:text-[#F59E0B]'
                    : 'text-[#B91C1C] dark:text-[#EF4444]';

              return (
                <div
                  key={ps.partNumber}
                  className="rounded-xl border border-[#1C1917]/10 dark:border-[#F5F2EB]/10 bg-[#F9F6F0]/65 dark:bg-[#141312] p-4 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#B91C1C] dark:text-[#EF4444]">
                        Part {ps.romanNumeral}
                      </p>
                      <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                        {ps.title}
                      </h3>
                    </div>
                    <span className={`text-base font-extrabold tabular-nums shrink-0 ${textColor}`}>
                      {ps.correct}/{ps.total}
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-[#1C1917]/10 dark:bg-[#F5F2EB]/10 overflow-hidden">
                    <div className={`h-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>

                  <p className="text-xs text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                    Accuracy: <strong className={textColor}>{pct}%</strong>
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Corrected Explanations & Question Review */}
        <div className="rounded-xl border border-[#1C1917]/10 dark:border-[#F5F2EB]/10 bg-white dark:bg-[#1E1C1A] p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1C1917]/10 dark:border-[#F5F2EB]/10 pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                Corrected Explanations &amp; Answer Key
              </h2>
              <p className="text-xs text-[#57534E] dark:text-[#A8A29E] mt-0.5">
                Review every mistake with the corrected Chinese sentence and grammar explanation.
              </p>
            </div>

            <div className="inline-flex p-1 rounded-lg border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-[#F2ECE1] dark:bg-[#141312]">
              <button
                type="button"
                onClick={() => setReviewFilter('wrong')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold tabular-nums transition-colors ${
                  reviewFilter === 'wrong'
                    ? 'bg-white dark:bg-[#292623] text-[#B91C1C] dark:text-[#EF4444] shadow-xs'
                    : 'text-[#57534E] dark:text-[#A8A29E]'
                }`}
              >
                Wrong Only ({wrongQuestions.length})
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter('all')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold tabular-nums transition-colors ${
                  reviewFilter === 'all'
                    ? 'bg-white dark:bg-[#292623] text-[#1C1917] dark:text-[#F5F2EB] shadow-xs'
                    : 'text-[#57534E] dark:text-[#A8A29E]'
                }`}
              >
                All Questions ({allQuestions.length})
              </button>
            </div>
          </div>

          {displayedQuestions.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#15803D] dark:text-[#22C55E] mx-auto" />
              <p className="text-base font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                Perfect 40 / 40 — Zero Mistakes!
              </p>
              <p className="text-xs text-[#57534E] dark:text-[#A8A29E]">
                Switch to &ldquo;All Questions&rdquo; above if you would like to review the complete answer key.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#1C1917]/10 dark:divide-[#F5F2EB]/10">
              {displayedQuestions.map((q) => {
                const chosenId = selectedAnswers[q.id];
                const chosenOpt = q.options.find((o) => o.id === chosenId);
                const isCorrect = chosenId === q.correctOptionId;
                const roman = ['I', 'II', 'III', 'IV'][q.part - 1];

                return (
                  <div key={q.id} className="py-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E] dark:text-[#A8A29E]">
                          <span className="font-bold tabular-nums text-[#1C1917] dark:text-[#F5F2EB]">
                            Q{q.number}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-[#B91C1C] dark:text-[#EF4444]">
                            Part {roman}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{q.subTypeLabel}</span>
                          {q.trapCategory && q.part === 4 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold">{q.trapCategory}</span>
                            </>
                          )}
                        </div>

                        <p
                          dir="ltr"
                          className={`font-bold text-[#1C1917] dark:text-[#F5F2EB] ${
                            q.isHanziPrompt ? 'font-hanzi text-xl sm:text-2xl' : 'text-base'
                          }`}
                        >
                          {q.promptPrimary}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-1">
                          <span className="text-[#57534E] dark:text-[#A8A29E]">
                            Your answer:{' '}
                            <strong
                              className={
                                isCorrect
                                  ? 'text-[#15803D] dark:text-[#22C55E]'
                                  : 'text-[#B91C1C] dark:text-[#EF4444]'
                              }
                            >
                              {chosenOpt?.label ?? 'Not answered'}
                            </strong>
                          </span>

                          <span className="text-[#15803D] dark:text-[#22C55E]">
                            Correct answer: <strong>{q.correctDisplay}</strong>
                          </span>
                        </div>

                        {/* Corrected Chinese sentence block for FALSE traps & fill-in-the-blank / translation corrections */}
                        {q.correctedHanzi && (!isCorrect || (q.part === 4 && !q.isStatementTrue)) && (
                          <div className="mt-2 rounded-lg border border-[#15803D]/25 dark:border-[#22C55E]/30 bg-[#15803D]/6 dark:bg-[#22C55E]/10 px-3.5 py-2.5 space-y-0.5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#15803D] dark:text-[#22C55E]">
                              {q.part === 4 && !q.isStatementTrue
                                ? 'Corrected Chinese Sentence'
                                : 'Complete Correct Sentence'}
                            </p>
                            <p
                              dir="ltr"
                              className="font-hanzi text-base sm:text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB]"
                            >
                              {q.correctedHanzi}
                            </p>
                            {showPinyin && q.correctedPinyin && (
                              <p className="font-pinyin text-xs text-[#D97706] dark:text-[#F59E0B]">
                                {q.correctedPinyin}
                              </p>
                            )}
                          </div>
                        )}

                        <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#A8A29E] leading-relaxed pt-1">
                          <strong className="text-[#1C1917] dark:text-[#F5F2EB] mr-1">
                            Explanation:
                          </strong>
                          {q.explanation}
                        </p>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-2">
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#15803D] dark:text-[#22C55E]">
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Correct</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#B91C1C] dark:text-[#EF4444]">
                            <XCircle className="w-5 h-5" />
                            <span>Wrong</span>
                          </span>
                        )}

                        {q.audioText && (
                          <SpeakChineseButton text={q.audioText} compact showSlow={false} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.section>
    );
  }

  /* ===================== SINGLE-PAGE 40-QUESTION EXAM SHEET ===================== */
  const timerUrgent = remainingSeconds <= 60;
  const timerWarning = !timerUrgent && remainingSeconds <= 5 * 60;
  const progressPercent = Math.round((answeredCount / examPaper.totalQuestions) * 100);

  return (
    <div className="pb-14">
      {/* Sticky Exam Top Bar */}
      <div className="sticky top-16 z-30 border-b border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-[#F9F6F0]/96 dark:bg-[#121110]/96 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                stopChineseSpeech();
                onExit();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-md border border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-white dark:bg-[#1E1C1A] text-xs font-bold hover:border-[#B91C1C]/45 transition-colors shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>

            <div className="min-w-0">
              <p className="text-[11px] font-bold text-[#B91C1C] dark:text-[#EF4444] uppercase tracking-wider">
                {examPaper.chapterTitle} Exam
              </p>
              <p className="text-xs sm:text-sm font-bold text-[#1C1917] dark:text-[#F5F2EB] truncate">
                {examPaper.chapterSubtitle}
              </p>
            </div>
          </div>

          {/* Quick-jump Part Links (Desktop) */}
          <div className="hidden md:flex items-center gap-1.5">
            {examPaper.parts.map((part) => {
              const partAnswered = part.questions.filter((q) => Boolean(selectedAnswers[q.id])).length;
              const partComplete = partAnswered === part.questions.length;
              return (
                <button
                  key={part.partNumber}
                  type="button"
                  onClick={() => handleJumpToPart(part.partNumber)}
                  className={`px-2.5 py-1.5 rounded-md border text-xs font-bold tabular-nums transition-colors ${
                    partComplete
                      ? 'border-[#15803D]/35 bg-[#15803D]/10 text-[#15803D] dark:text-[#22C55E]'
                      : 'border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] text-[#57534E] dark:text-[#A8A29E] hover:border-[#B91C1C]/40'
                  }`}
                >
                  Part {part.romanNumeral} ({partAnswered}/{part.questions.length})
                </button>
              );
            })}
          </div>

          {/* Live 45-Minute Countdown + Answered Counter */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              aria-label="Answered questions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] text-xs sm:text-sm font-bold tabular-nums text-[#1C1917] dark:text-[#F5F2EB]"
            >
              <ClipboardCheck className="w-4 h-4 text-[#15803D] dark:text-[#22C55E] shrink-0" />
              <span>
                {answeredCount} / {examPaper.totalQuestions}
              </span>
            </div>

            <div
              aria-label="Exam countdown timer"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs sm:text-sm font-bold tabular-nums ${
                timerUrgent
                  ? 'border-[#B91C1C] bg-[#B91C1C] text-white'
                  : timerWarning
                    ? 'border-[#D97706]/50 bg-[#D97706]/12 text-[#92400E] dark:text-[#F59E0B]'
                    : 'border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] text-[#B91C1C] dark:text-[#EF4444]'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>{formatCountdown(remainingSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Thin Answer Progress Bar */}
        <div className="h-1 w-full bg-[#1C1917]/8 dark:bg-[#F5F2EB]/8">
          <div
            className="h-full bg-[#B91C1C] dark:bg-[#EF4444] transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Scrollable Exam Paper */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-8 space-y-10">
        {/* Formal Exam Paper Cover Header */}
        <div className="neo-frame rounded-xl p-6 sm:p-8 bg-white dark:bg-[#1E1C1A] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="cinnabar-seal font-hanzi w-14 h-14 rounded-lg flex items-center justify-center text-2xl font-bold bg-[#F9F6F0] dark:bg-[#141312] shrink-0">
                {examPaper.chineseNumeral}
              </span>
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B91C1C] dark:text-[#EF4444]">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Single-Page Comprehensive Assessment</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                  {examPaper.chapterTitle} Exam (40 Questions)
                </h1>
                <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#A8A29E]">
                  {examPaper.chapterSubtitle}
                </p>
              </div>
            </div>

            <div className="text-xs text-[#57534E] dark:text-[#A8A29E] space-y-1 sm:text-right tabular-nums">
              <p className="font-bold text-[#1C1917] dark:text-[#F5F2EB]">Time Limit: 45 Minutes</p>
              <p>4 Parts × 10 Questions = 40 Points</p>
              <p>Passing Threshold: 70% (28 / 40)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#1C1917]/10 dark:border-[#F5F2EB]/10 text-xs">
            {examPaper.parts.map((p) => (
              <button
                key={p.partNumber}
                type="button"
                onClick={() => handleJumpToPart(p.partNumber)}
                className="text-left rounded-lg border border-[#1C1917]/10 dark:border-[#F5F2EB]/10 bg-[#F9F6F0]/70 dark:bg-[#141312] px-3 py-2 hover:border-[#B91C1C]/40 transition-colors"
              >
                <span className="block font-bold text-[#B91C1C] dark:text-[#EF4444]">
                  Part {p.romanNumeral} (10 Q)
                </span>
                <span className="block text-[11px] text-[#57534E] dark:text-[#A8A29E] truncate">
                  {p.title.split('—')[0].trim()}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* All 4 Exam Parts Stacked on One Scrollable Page */}
        {examPaper.parts.map((part) => {
          const partAnswered = part.questions.filter((q) => Boolean(selectedAnswers[q.id])).length;

          return (
            <section
              key={part.partNumber}
              id={`exam-part-${part.partNumber}`}
              className="scroll-mt-36 space-y-4"
            >
              {/* Part Header Banner */}
              <div className="rounded-xl border-l-4 border-l-[#B91C1C] dark:border-l-[#EF4444] border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#B91C1C] dark:text-[#EF4444] uppercase tracking-wider">
                    <span>Part {part.romanNumeral}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#57534E] dark:text-[#A8A29E] normal-case tracking-normal">
                      {part.subtitle}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                    {part.title}
                  </h2>
                  <p className="text-xs text-[#57534E] dark:text-[#A8A29E]">{part.instructions}</p>
                </div>

                <span className="text-xs font-bold tabular-nums px-3 py-1 rounded-md border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-[#F9F6F0] dark:bg-[#141312] text-[#1C1917] dark:text-[#F5F2EB] self-start sm:self-center shrink-0">
                  {partAnswered} / {part.questions.length} answered
                </span>
              </div>

              {/* Questions in this Part */}
              <div className="space-y-4">
                {part.questions.map((q) => (
                  <ExamQuestionCard
                    key={q.id}
                    question={q}
                    selectedOptionId={selectedAnswers[q.id]}
                    showPinyin={showPinyin}
                    onSelect={(optId) => handleSelectOption(q.id, optId)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* Bottom Submit Section */}
        <div className="neo-frame rounded-xl p-6 sm:p-8 bg-white dark:bg-[#1E1C1A] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                Ready to Grade Your Exam?
              </h3>
              <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                You have answered <strong>{answeredCount}</strong> of{' '}
                <strong>{examPaper.totalQuestions}</strong> questions. Time remaining:{' '}
                <strong>{formatCountdown(remainingSeconds)}</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAttemptSubmit}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 min-h-[48px] rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] dark:bg-[#EF4444] dark:hover:bg-[#DC2626] text-white font-bold text-sm transition-colors whitespace-nowrap shrink-0"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Submit Exam</span>
            </button>
          </div>

          {showUnansweredConfirm && unansweredCount > 0 && (
            <div className="rounded-lg border border-[#D97706]/40 bg-[#D97706]/10 dark:bg-[#F59E0B]/12 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#92400E] dark:text-[#F59E0B]">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>
                  You still have <strong>{unansweredCount}</strong> unanswered{' '}
                  {unansweredCount === 1 ? 'question' : 'questions'}. Unanswered items will be
                  scored as incorrect.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleJumpToFirstUnanswered}
                  className="px-3.5 py-2 rounded-md border border-[#1C1917]/20 dark:border-[#F5F2EB]/20 bg-white dark:bg-[#1E1C1A] text-xs font-bold text-[#1C1917] dark:text-[#F5F2EB]"
                >
                  Review Unanswered
                </button>
                <button
                  type="button"
                  onClick={() => void submitExam(false)}
                  className="px-4 py-2 rounded-md bg-[#B91C1C] hover:bg-[#991B1B] dark:bg-[#EF4444] text-white text-xs font-bold"
                >
                  Confirm &amp; Submit Anyway
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ExamQuestionCardProps {
  question: ChapterExamQuestion;
  selectedOptionId?: string;
  showPinyin: boolean;
  onSelect: (optionId: string) => void;
}

function ExamQuestionCard({
  question,
  selectedOptionId,
  showPinyin,
  onSelect,
}: ExamQuestionCardProps) {
  const isAnswered = Boolean(selectedOptionId);
  const isTrueFalse = question.part === 4;
  const blankParts =
    question.part === 2 && question.sentenceWithBlank
      ? question.sentenceWithBlank.split('____')
      : [];
  const selectedOpt = question.options.find((o) => o.id === selectedOptionId);

  return (
    <article
      id={`exam-q-${question.number}`}
      className={`rounded-xl border p-5 sm:p-6 bg-white dark:bg-[#1E1C1A] space-y-4 transition-colors ${
        isAnswered
          ? 'border-[#15803D]/30 dark:border-[#22C55E]/30'
          : 'border-[#1C1917]/12 dark:border-[#F5F2EB]/12'
      }`}
    >
      {/* Question Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs">
          <span
            className={`w-7 h-7 rounded-md font-bold tabular-nums flex items-center justify-center shrink-0 ${
              isAnswered
                ? 'bg-[#15803D] dark:bg-[#22C55E] text-white dark:text-[#121110]'
                : 'bg-[#F2ECE1] dark:bg-[#292623] text-[#1C1917] dark:text-[#F5F2EB]'
            }`}
          >
            {String(question.number).padStart(2, '0')}
          </span>
          <span className="font-semibold text-[#57534E] dark:text-[#A8A29E]">
            {question.subTypeLabel}
          </span>
        </div>

        {/* Audio playback on Chinese prompts (hidden on Part I Pinyin matching so tones are genuinely tested) */}
        {question.isHanziPrompt && question.drillType !== 'hanzi-to-pinyin' && question.audioText && (
          <SpeakChineseButton
            text={question.part === 4 ? question.promptPrimary : question.audioText}
            compact
            showSlow={false}
          />
        )}
      </div>

      {/* Question Prompt */}
      <div className="space-y-1.5">
        {question.part === 2 && blankParts.length >= 2 ? (
          <div
            dir="ltr"
            className="font-hanzi text-xl sm:text-2xl font-bold text-[#1C1917] dark:text-[#F5F2EB] leading-relaxed flex flex-wrap items-center gap-1"
          >
            <span>{blankParts[0]}</span>
            <span className="mx-1 px-2.5 py-0.5 rounded-md border-b-2 border-[#B91C1C] dark:border-[#EF4444] text-[#B91C1C] dark:text-[#EF4444]">
              {selectedOpt?.label ?? '____'}
            </span>
            <span>{blankParts.slice(1).join('____')}</span>
          </div>
        ) : (
          <p
            dir="ltr"
            className={`font-bold text-[#1C1917] dark:text-[#F5F2EB] leading-relaxed ${
              question.isHanziPrompt ? 'font-hanzi text-2xl sm:text-3xl' : 'text-base sm:text-lg'
            }`}
          >
            {question.promptPrimary}
          </p>
        )}

        {showPinyin &&
          question.promptPinyin &&
          question.drillType !== 'hanzi-to-pinyin' && (
            <p className="font-pinyin text-xs sm:text-sm text-[#D97706] dark:text-[#F59E0B]">
              {question.promptPinyin}
            </p>
          )}
      </div>

      {/* Options */}
      {isTrueFalse ? (
        <div className="grid grid-cols-2 gap-3">
          {question.options.map((opt) => {
            const selected = selectedOptionId === opt.id;
            const isTrueChoice = opt.id === 'true';
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(opt.id)}
                className={`min-h-[54px] px-4 py-3 rounded-lg border flex items-center justify-center gap-2.5 text-sm font-bold transition-all ${
                  selected
                    ? isTrueChoice
                      ? 'border-[#15803D] dark:border-[#22C55E] bg-[#15803D]/12 dark:bg-[#22C55E]/16 text-[#15803D] dark:text-[#22C55E] ring-1 ring-[#15803D]/30'
                      : 'border-[#B91C1C] dark:border-[#EF4444] bg-[#B91C1C]/12 dark:bg-[#EF4444]/16 text-[#B91C1C] dark:text-[#EF4444] ring-1 ring-[#B91C1C]/30'
                    : 'border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-[#F9F6F0]/60 dark:bg-[#141312] text-[#1C1917] dark:text-[#F5F2EB] hover:border-[#B91C1C]/40'
                }`}
              >
                {isTrueChoice ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div
          className={`grid gap-2.5 ${
            question.part === 3 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
          }`}
        >
          {question.options.map((opt, idx) => {
            const selected = selectedOptionId === opt.id;
            const letter = OPTION_LETTERS[idx] ?? String(idx + 1);
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(opt.id)}
                className={`text-left px-4 py-3 rounded-lg border flex items-center gap-3 transition-all ${
                  selected
                    ? 'border-[#B91C1C] dark:border-[#EF4444] bg-[#B91C1C]/8 dark:bg-[#EF4444]/14 text-[#1C1917] dark:text-[#F5F2EB] ring-1 ring-[#B91C1C]/30 dark:ring-[#EF4444]/30'
                    : 'border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-[#F9F6F0]/55 dark:bg-[#141312] text-[#1C1917] dark:text-[#F5F2EB] hover:border-[#B91C1C]/40'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-md border text-xs font-bold flex items-center justify-center shrink-0 ${
                    selected
                      ? 'border-[#B91C1C] dark:border-[#EF4444] bg-[#B91C1C] dark:bg-[#EF4444] text-white'
                      : 'border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-white dark:bg-[#1E1C1A] text-[#57534E] dark:text-[#A8A29E]'
                  }`}
                >
                  {letter}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className={`block ${
                      opt.isHanzi
                        ? 'font-hanzi text-lg sm:text-xl font-bold'
                        : opt.isPinyin
                          ? 'font-pinyin text-base font-bold'
                          : 'text-sm font-semibold'
                    }`}
                  >
                    {opt.label}
                  </span>
                  {showPinyin && opt.subLabel && question.part !== 1 && (
                    <span className="block font-pinyin text-xs text-[#57534E] dark:text-[#A8A29E] mt-0.5">
                      {opt.subLabel}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </article>
  );
}
