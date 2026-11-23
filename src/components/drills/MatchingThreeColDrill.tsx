import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { DrillQuestion, QuizMode } from '../../types';
import { shuffleArray } from '../../utils/drillGenerators';

interface MatchingThreeColProps {
  question: DrillQuestion;
  mode: QuizMode;
  onComplete: (correctSets: number, totalSets: number, summaryDisplay: string) => void;
}

interface TripleLink {
  hanziId: string;
  pinyinId: string;
  arabicId: string;
}

/**
 * 3-column matching engine (Chinese Character ↔ Pinyin ↔ Meaning).
 * Always displays the Pinyin column as a core part of the drill.
 */
export function MatchingThreeColDrill({ question, mode, onComplete }: MatchingThreeColProps) {
  const entries = question.matchingEntries ?? [];

  const colHanzi = useMemo(() => shuffleArray(entries), [question.id]);
  const colPinyin = useMemo(() => shuffleArray(entries), [question.id]);
  const colArabic = useMemo(() => shuffleArray(entries), [question.id]);

  const [selH, setSelH] = useState<string | null>(null);
  const [selP, setSelP] = useState<string | null>(null);
  const [selA, setSelA] = useState<string | null>(null);

  const [triples, setTriples] = useState<TripleLink[]>([]);
  const [wrongFlash, setWrongFlash] = useState<TripleLink | null>(null);
  const [mistakesCount, setMistakesCount] = useState(0);

  useEffect(() => {
    setSelH(null);
    setSelP(null);
    setSelA(null);
    setTriples([]);
    setWrongFlash(null);
    setMistakesCount(0);
  }, [question.id]);

  const finalizeTriple = (hId: string, pId: string, aId: string) => {
    if (mode === 'practice') {
      if (hId === pId && pId === aId) {
        const nextTriples = [...triples, { hanziId: hId, pinyinId: pId, arabicId: aId }];
        setTriples(nextTriples);
        setSelH(null);
        setSelP(null);
        setSelA(null);

        if (nextTriples.length === entries.length) {
          const effectiveCorrect = Math.max(0, entries.length - mistakesCount);
          const summary =
            mistakesCount === 0
              ? `Matched all 3-way sets (${entries.length}/${entries.length}) successfully`
              : `Completed 3-column matching with ${mistakesCount} incorrect ${mistakesCount === 1 ? 'attempt' : 'attempts'}`;
          onComplete(effectiveCorrect, entries.length, summary);
        }
      } else {
        setMistakesCount((m) => m + 1);
        setWrongFlash({ hanziId: hId, pinyinId: pId, arabicId: aId });
        window.setTimeout(() => {
          setWrongFlash(null);
          setSelH(null);
          setSelP(null);
          setSelA(null);
        }, 600);
      }
      return;
    }

    // Exam mode: replace any previously linked item and evaluate automatically
    const filtered = triples.filter(
      (t) => t.hanziId !== hId && t.pinyinId !== pId && t.arabicId !== aId
    );
    const nextTriples = [...filtered, { hanziId: hId, pinyinId: pId, arabicId: aId }];
    setTriples(nextTriples);
    setSelH(null);
    setSelP(null);
    setSelA(null);

    if (nextTriples.length === entries.length) {
      const correctCount = nextTriples.filter(
        (t) => t.hanziId === t.pinyinId && t.pinyinId === t.arabicId
      ).length;
      onComplete(
        correctCount,
        entries.length,
        `Matched ${correctCount} of ${entries.length} 3-way sets correctly`
      );
    }
  };

  const handlePick = (col: 'h' | 'p' | 'a', id: string) => {
    const nextH = col === 'h' ? (selH === id ? null : id) : selH;
    const nextP = col === 'p' ? (selP === id ? null : id) : selP;
    const nextA = col === 'a' ? (selA === id ? null : id) : selA;

    if (nextH && nextP && nextA) {
      finalizeTriple(nextH, nextP, nextA);
    } else {
      setSelH(nextH);
      setSelP(nextP);
      setSelA(nextA);
    }
  };

  const getTripleIndex = (col: 'h' | 'p' | 'a', id: string): number | null => {
    const idx = triples.findIndex((t) =>
      col === 'h' ? t.hanziId === id : col === 'p' ? t.pinyinId === id : t.arabicId === id
    );
    return idx >= 0 ? idx + 1 : null;
  };

  const getCardStyle = (col: 'h' | 'p' | 'a', id: string) => {
    const tIdx = getTripleIndex(col, id);
    const isSelected =
      (col === 'h' && selH === id) ||
      (col === 'p' && selP === id) ||
      (col === 'a' && selA === id);
    const isWrong =
      wrongFlash &&
      ((col === 'h' && wrongFlash.hanziId === id) ||
        (col === 'p' && wrongFlash.pinyinId === id) ||
        (col === 'a' && wrongFlash.arabicId === id));

    if (isWrong) {
      return 'border-[#B91C1C] dark:border-[#EF4444] bg-[#B91C1C]/12 dark:bg-[#EF4444]/15 text-[#B91C1C] dark:text-[#EF4444]';
    }
    if (tIdx !== null && mode === 'practice') {
      return 'border-[#15803D] dark:border-[#22C55E] bg-[#15803D]/10 dark:bg-[#22C55E]/15 text-[#15803D] dark:text-[#22C55E]';
    }
    if (tIdx !== null && mode === 'exam') {
      return 'border-[#D97706] dark:border-[#F59E0B] bg-[#D97706]/10 dark:bg-[#F59E0B]/15';
    }
    if (isSelected) {
      return 'border-[#B91C1C] dark:border-[#EF4444] bg-[#B91C1C]/8 dark:bg-[#EF4444]/12 ring-1 ring-[#B91C1C]/35';
    }
    return 'border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] hover:border-[#B91C1C]/45 dark:hover:border-[#EF4444]/45';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#57534E] dark:text-[#A8A29E]">
          Select one item from each column (Chinese Character, Pinyin, Meaning) to form a matching
          trio.
        </p>

        <div className="flex items-center gap-3 text-xs tabular-nums">
          <span className="text-[#57534E] dark:text-[#A8A29E]">
            Completed sets:{' '}
            <strong className="text-[#1C1917] dark:text-[#F5F2EB]">
              {triples.length}/{entries.length}
            </strong>
          </span>
          {mode === 'exam' && triples.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setTriples([]);
                setSelH(null);
                setSelP(null);
                setSelA(null);
              }}
              className="inline-flex items-center gap-1 text-[#B91C1C] dark:text-[#EF4444] font-semibold hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Chinese Character */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-[#57534E] dark:text-[#A8A29E] pb-1 border-b border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
            1. Chinese Character
          </h3>
          {colHanzi.map((item) => {
            const tIdx = getTripleIndex('h', item.id);
            const isWrong = wrongFlash?.hanziId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={mode === 'practice' && tIdx !== null}
                onClick={() => handlePick('h', item.id)}
                className={`w-full min-h-[66px] px-4 py-3 rounded-xl border flex items-center justify-between gap-2 transition-all duration-150 ${getCardStyle(
                  'h',
                  item.id
                )}`}
              >
                <span className="font-hanzi text-2xl sm:text-3xl font-bold">{item.hanzi}</span>
                {mode === 'practice' && tIdx !== null && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                {isWrong && <XCircle className="w-4 h-4 shrink-0" />}
                {mode === 'exam' && tIdx !== null && (
                  <span className="text-xs font-bold tabular-nums text-[#D97706] dark:text-[#F59E0B]">
                    #{tIdx}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Column 2: Pronunciation (Pinyin) */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-[#57534E] dark:text-[#A8A29E] pb-1 border-b border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
            2. Pronunciation (Pinyin)
          </h3>
          {colPinyin.map((item) => {
            const tIdx = getTripleIndex('p', item.id);
            const isWrong = wrongFlash?.pinyinId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={mode === 'practice' && tIdx !== null}
                onClick={() => handlePick('p', item.id)}
                className={`w-full min-h-[66px] px-4 py-3 rounded-xl border flex items-center justify-between gap-2 transition-all duration-150 ${getCardStyle(
                  'p',
                  item.id
                )}`}
              >
                <span className="font-pinyin text-lg font-bold">{item.pinyin}</span>
                {mode === 'practice' && tIdx !== null && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                {isWrong && <XCircle className="w-4 h-4 shrink-0" />}
                {mode === 'exam' && tIdx !== null && (
                  <span className="text-xs font-bold tabular-nums text-[#D97706] dark:text-[#F59E0B]">
                    #{tIdx}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Column 3: Meaning */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-[#57534E] dark:text-[#A8A29E] pb-1 border-b border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
            3. Meaning
          </h3>
          {colArabic.map((item) => {
            const tIdx = getTripleIndex('a', item.id);
            const isWrong = wrongFlash?.arabicId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={mode === 'practice' && tIdx !== null}
                onClick={() => handlePick('a', item.id)}
                className={`w-full min-h-[66px] px-4 py-3 rounded-xl border flex items-center justify-between gap-2 text-left font-semibold text-base transition-all duration-150 ${getCardStyle(
                  'a',
                  item.id
                )}`}
              >
                <span>{item.arabic}</span>
                {mode === 'practice' && tIdx !== null && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                {isWrong && <XCircle className="w-4 h-4 shrink-0" />}
                {mode === 'exam' && tIdx !== null && (
                  <span className="text-xs font-bold tabular-nums text-[#D97706] dark:text-[#F59E0B]">
                    #{tIdx}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
