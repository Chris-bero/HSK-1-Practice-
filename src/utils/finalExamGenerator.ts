import { CHAPTERS_DATA } from '../data/chaptersData';
import {
  READING_COMPREHENSION_DATA,
  ReadingComprehensionItem,
} from '../data/readingComprehensionData';
import { getChapterTrueFalseItems, TrueFalseItem } from '../data/trueFalseData';
import {
  ChapterData,
  ChapterExamOption,
  FinalExamModelId,
  FinalExamPaper,
  FinalExamPart,
  FinalExamQuestion,
  SentenceItem,
  VocabItem,
} from '../types';
import { buildFourPinyinOptions, EXTRA_PINYIN_LOOKUP } from './chapterExamGenerator';
import {
  buildCloseTranslationDistractors,
  CHINESE_SWAP_RULES,
  ENGLISH_SWAP_RULES,
  generateMutatedVariants,
  shuffleWithRng,
} from './translationDistractors';

export const FINAL_EXAM_PART_TARGETS = {
  part1: 20, // 10 Meaning + 10 Pinyin & Tones
  part2: 15, // 15 Grammar & Fill-in-the-Blank
  part3: 15, // Up to 15 unique Reading & Dialogue Comprehension passages
  part4: 15, // 15 Sentence Translation (anti-elimination close distractors)
  part5: 15, // 15 True or False (balanced 8 TRUE / 7 FALSE)
} as const;

export const FINAL_EXAM_TARGET_TOTAL =
  FINAL_EXAM_PART_TARGETS.part1 +
  FINAL_EXAM_PART_TARGETS.part2 +
  FINAL_EXAM_PART_TARGETS.part3 +
  FINAL_EXAM_PART_TARGETS.part4 +
  FINAL_EXAM_PART_TARGETS.part5; // 80 questions

export const FINAL_EXAM_DURATION_MINUTES = 90;
const FINAL_EXAM_DURATION_SECONDS = FINAL_EXAM_DURATION_MINUTES * 60; // 90 minutes for 80 questions

export interface FinalExamScopeEstimate {
  partCounts: [number, number, number, number, number];
  totalQuestions: number;
  targetTotal: number;
  isCapped: boolean;
  minChaptersForFullExam: number;
  durationMinutes: number;
}

/**
 * Estimates exact Final Exam question counts for a selected chapter scope,
 * ensuring zero repeated vocabulary, sentences, reading passages, or T/F items.
 */
export function estimateFinalExamScope(chapterIds: number[]): FinalExamScopeEstimate {
  if (chapterIds.length === 0) {
    return {
      partCounts: [
        FINAL_EXAM_PART_TARGETS.part1,
        FINAL_EXAM_PART_TARGETS.part2,
        FINAL_EXAM_PART_TARGETS.part3,
        FINAL_EXAM_PART_TARGETS.part4,
        FINAL_EXAM_PART_TARGETS.part5,
      ],
      totalQuestions: FINAL_EXAM_TARGET_TOTAL,
      targetTotal: FINAL_EXAM_TARGET_TOTAL,
      isCapped: false,
      minChaptersForFullExam: 4,
      durationMinutes: FINAL_EXAM_DURATION_MINUTES,
    };
  }

  const idSet = new Set<number>(chapterIds);
  const selected = CHAPTERS_DATA.filter((c) => idSet.has(c.id));
  const vocabTotal = selected.reduce((sum, c) => sum + c.vocab.length, 0);
  const validBlankTotal = selected.reduce(
    (sum, c) =>
      sum +
      c.sentences.filter(
        (s) => s.targetBlank && s.hanzi.includes(s.targetBlank) && (s.blankDistractors?.length ?? 0) >= 3
      ).length,
    0
  );
  const sentenceTotal = selected.reduce((sum, c) => sum + c.sentences.length, 0);
  const readingTotal = READING_COMPREHENSION_DATA.filter((item) => idSet.has(item.chapterId)).length;
  const tfItems = selected.flatMap((c) => getChapterTrueFalseItems(c.id));
  const tfTrueTotal = tfItems.filter((i) => i.isTrue).length;
  const tfFalseTotal = tfItems.filter((i) => !i.isTrue).length;

  const p1 = Math.min(FINAL_EXAM_PART_TARGETS.part1, vocabTotal);
  const p2 = Math.min(FINAL_EXAM_PART_TARGETS.part2, validBlankTotal);
  const p3 = Math.min(FINAL_EXAM_PART_TARGETS.part3, readingTotal);
  const p4 = Math.min(FINAL_EXAM_PART_TARGETS.part4, sentenceTotal);
  const targetTrue = Math.ceil(FINAL_EXAM_PART_TARGETS.part5 / 2);
  const targetFalse = Math.floor(FINAL_EXAM_PART_TARGETS.part5 / 2);
  const p5 = Math.min(targetTrue, tfTrueTotal) + Math.min(targetFalse, tfFalseTotal);

  const totalQuestions = p1 + p2 + p3 + p4 + p5;
  return {
    partCounts: [p1, p2, p3, p4, p5],
    totalQuestions,
    targetTotal: FINAL_EXAM_TARGET_TOTAL,
    isCapped: totalQuestions < FINAL_EXAM_TARGET_TOTAL,
    minChaptersForFullExam: 4,
    durationMinutes: FINAL_EXAM_DURATION_MINUTES,
  };
}

export interface FinalExamModelMeta {
  id: FinalExamModelId;
  code: string;
  label: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  isDeterministic: boolean;
  seedSalt: string;
  partitionSlot: 0 | 1 | 2 | null;
}

export const FINAL_EXAM_MODELS: FinalExamModelMeta[] = [
  {
    id: 'model-1',
    code: 'MODEL 1',
    label: 'Model 1 — Standardized Mock Exam A',
    shortTitle: 'Model 1',
    subtitle: 'Fixed Standardized Paper A · 80 Questions · 90 Min',
    description:
      'Fixed-seed comprehensive mock exam. Every student selecting the same chapters receives the exact same 80 questions and choices for fair score comparison.',
    isDeterministic: true,
    seedSalt: 'HSK1-FINAL-MODEL-1-ALPHA-2026',
    partitionSlot: 0,
  },
  {
    id: 'model-2',
    code: 'MODEL 2',
    label: 'Model 2 — Standardized Mock Exam B',
    shortTitle: 'Model 2',
    subtitle: 'Fixed Standardized Paper B · 80 Questions · 90 Min',
    description:
      'Second fixed-seed comprehensive 80-question paper with a distinct question set drawn from your chosen chapters — ideal for a second timed benchmark.',
    isDeterministic: true,
    seedSalt: 'HSK1-FINAL-MODEL-2-BETA-2026',
    partitionSlot: 1,
  },
  {
    id: 'model-3',
    code: 'MODEL 3',
    label: 'Model 3 — Standardized Mock Exam C',
    shortTitle: 'Model 3',
    subtitle: 'Fixed Standardized Paper C · 80 Questions · 90 Min',
    description:
      'Third fixed-seed standardized 80-question paper covering a separate slice of vocabulary, dialogues, translations, and grammar traps.',
    isDeterministic: true,
    seedSalt: 'HSK1-FINAL-MODEL-3-GAMMA-2026',
    partitionSlot: 2,
  },
  {
    id: 'random',
    code: 'DYNAMIC',
    label: 'Random Comprehensive Exam',
    shortTitle: 'Random Exam',
    subtitle: 'Fresh Randomized Generator · 80 Questions · 90 Min',
    description:
      'Generates a brand-new randomized 80-question comprehensive exam across your selected chapters every time you start or retake.',
    isDeterministic: false,
    seedSalt: 'HSK1-FINAL-RANDOM',
    partitionSlot: null,
  },
];

export function getFinalExamModelMeta(modelId: FinalExamModelId): FinalExamModelMeta {
  return FINAL_EXAM_MODELS.find((m) => m.id === modelId) ?? FINAL_EXAM_MODELS[0];
}

/** Fast deterministic 32-bit FNV-1a string hash */
function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32 deterministic PRNG returning floats in [0, 1) */
function createSeededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function formatChapterScopeLabel(chapterIds: number[]): string {
  const sorted = Array.from(new Set(chapterIds))
    .filter((id) => id >= 1 && id <= CHAPTERS_DATA.length)
    .sort((a, b) => a - b);

  if (sorted.length === 0) return 'No Chapters Selected';
  if (sorted.length === CHAPTERS_DATA.length) return 'All 15 Chapters (Ch. 1–15)';
  if (sorted.length === 1) return `Chapter ${sorted[0]}`;

  // Group contiguous ranges cleanly: e.g. [1,2,3,4,5] -> "Chapters 1–5"
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
    } else {
      ranges.push(start === prev ? `${start}` : `${start}–${prev}`);
      start = sorted[i];
      prev = sorted[i];
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}–${prev}`);

  return `Chapters ${ranges.join(', ')} (${sorted.length} ch.)`;
}

interface ScopedVocab extends VocabItem {
  chapterId: number;
}

interface ScopedSentence extends SentenceItem {
  chapterId: number;
}

/**
 * Picks `count` unique items from `pool`.
 * For Models 1/2/3 (`partitionSlot` 0/1/2), canonically shuffles the pool with `scopeSeed`
 * and prioritizes items in the model's disjoint modulo-3 partition so Models 1, 2, and 3
 * do not overlap whenever the pool is large enough, while still remaining 100% deterministic.
 */
function pickForModel<T>(
  pool: T[],
  count: number,
  partitionSlot: 0 | 1 | 2 | null,
  scopeSeed: number,
  modelRng: () => number
): T[] {
  if (pool.length <= count) {
    return shuffleWithRng(pool, modelRng);
  }

  if (partitionSlot === null) {
    return shuffleWithRng(pool, modelRng).slice(0, count);
  }

  const canonicalOrder = shuffleWithRng(pool, createSeededRng(scopeSeed));
  const primary: T[] = [];
  const secondary: T[] = [];

  canonicalOrder.forEach((item, idx) => {
    if (idx % 3 === partitionSlot) {
      primary.push(item);
    } else {
      secondary.push(item);
    }
  });

  const chosenPrimary = shuffleWithRng(primary, modelRng).slice(0, count);
  if (chosenPrimary.length >= count) {
    return chosenPrimary;
  }

  const remainderNeeded = count - chosenPrimary.length;
  const chosenSecondary = shuffleWithRng(secondary, modelRng).slice(0, remainderNeeded);
  return shuffleWithRng([...chosenPrimary, ...chosenSecondary], modelRng);
}

function buildFinalPartOne(
  vocabPool: ScopedVocab[],
  partitionSlot: 0 | 1 | 2 | null,
  scopeSeed: number,
  rng: () => number
): FinalExamQuestion[] {
  const targetCount = Math.min(FINAL_EXAM_PART_TARGETS.part1, vocabPool.length);
  const picked = pickForModel(vocabPool, targetCount, partitionSlot, scopeSeed ^ 0x11111111, rng);
  const meaningCut = Math.ceil(picked.length / 2);

  return picked.map((item, idx) => {
    const qNum = idx + 1;
    const isMeaningQuestion = idx < meaningCut;

    if (isMeaningQuestion) {
      const sameChapterCandidates = vocabPool.filter(
        (v) => v.chapterId === item.chapterId && v.hanzi !== item.hanzi && v.arabic !== item.arabic
      );
      const otherCandidates = vocabPool.filter(
        (v) => v.chapterId !== item.chapterId && v.hanzi !== item.hanzi && v.arabic !== item.arabic
      );

      const seenMeanings = new Set<string>([item.arabic]);
      const distractors: string[] = [];

      for (const candidate of [
        ...shuffleWithRng(sameChapterCandidates, rng),
        ...shuffleWithRng(otherCandidates, rng),
      ]) {
        if (distractors.length >= 3) break;
        if (!seenMeanings.has(candidate.arabic)) {
          seenMeanings.add(candidate.arabic);
          distractors.push(candidate.arabic);
        }
      }

      const options: ChapterExamOption[] = shuffleWithRng(
        [
          { id: 'correct', label: item.arabic },
          ...distractors.slice(0, 3).map((d, i) => ({ id: `d-${i}`, label: d })),
        ],
        rng
      );

      return {
        id: `final-p1-ch${item.chapterId}-${item.id}-${qNum}`,
        number: qNum,
        part: 1,
        chapterId: item.chapterId,
        drillType: 'hanzi-to-arabic',
        sourceItemId: item.id,
        subTypeLabel: `Ch. ${item.chapterId} · Hanzi → Meaning`,
        promptPrimary: item.hanzi,
        promptPinyin: item.pinyin,
        isHanziPrompt: true,
        audioText: item.hanzi,
        options,
        correctOptionId: 'correct',
        correctDisplay: item.arabic,
        correctPinyinDisplay: item.pinyin,
        meaningDisplay: item.arabic,
        explanation: `${item.hanzi} (${item.pinyin}) means "${item.arabic}" (Chapter ${item.chapterId}).`,
      };
    }

    const options = buildFourPinyinOptions(item, vocabPool, rng);
    return {
      id: `final-p1-ch${item.chapterId}-${item.id}-${qNum}`,
      number: qNum,
      part: 1,
      chapterId: item.chapterId,
      drillType: 'hanzi-to-pinyin',
      sourceItemId: item.id,
      subTypeLabel: `Ch. ${item.chapterId} · Hanzi → Pinyin`,
      promptPrimary: item.hanzi,
      isHanziPrompt: true,
      audioText: item.hanzi,
      options,
      correctOptionId: 'correct',
      correctDisplay: item.pinyin,
      correctPinyinDisplay: item.pinyin,
      meaningDisplay: item.arabic,
      explanation: `${item.hanzi} is pronounced "${item.pinyin}" and means "${item.arabic}" (Chapter ${item.chapterId}).`,
    };
  });
}

function buildFinalPartTwo(
  sentencePool: ScopedSentence[],
  vocabPool: ScopedVocab[],
  partitionSlot: 0 | 1 | 2 | null,
  scopeSeed: number,
  rng: () => number
): FinalExamQuestion[] {
  const validSentences = sentencePool.filter(
    (s) => s.targetBlank && s.hanzi.includes(s.targetBlank) && (s.blankDistractors?.length ?? 0) >= 3
  );
  const targetCount = Math.min(FINAL_EXAM_PART_TARGETS.part2, validSentences.length);
  const picked = pickForModel(
    validSentences,
    targetCount,
    partitionSlot,
    scopeSeed ^ 0x22222222,
    rng
  );

  const lookupPinyin = (hanzi: string) => {
    const fromScope = vocabPool.find((v) => v.hanzi === hanzi);
    if (fromScope) return fromScope.pinyin;
    return EXTRA_PINYIN_LOOKUP[hanzi];
  };

  return picked.map((s, idx) => {
    const qNum = 11 + idx;
    const blanked = s.hanzi.replace(s.targetBlank, ' ____ ');

    const seen = new Set<string>([s.targetBlank]);
    const explicitDistractors: string[] = [];
    for (const d of s.blankDistractors ?? []) {
      if (d && !seen.has(d)) {
        seen.add(d);
        explicitDistractors.push(d);
      }
    }

    const options: ChapterExamOption[] = shuffleWithRng(
      [
        {
          id: 'correct',
          label: s.targetBlank,
          subLabel: lookupPinyin(s.targetBlank),
          isHanzi: true,
        },
        ...explicitDistractors.slice(0, 3).map((w, i) => ({
          id: `d-${i}`,
          label: w,
          subLabel: lookupPinyin(w),
          isHanzi: true,
        })),
      ],
      rng
    );

    return {
      id: `final-p2-ch${s.chapterId}-${s.id}-${qNum}`,
      number: qNum,
      part: 2,
      chapterId: s.chapterId,
      drillType: 'fill-in-blank',
      sourceItemId: s.id,
      subTypeLabel: `Ch. ${s.chapterId} · Grammar Blank`,
      promptPrimary: blanked,
      sentenceWithBlank: blanked,
      targetBlank: s.targetBlank,
      isHanziPrompt: true,
      audioText: s.hanzi,
      options,
      correctOptionId: 'correct',
      correctedHanzi: s.hanzi,
      correctedPinyin: s.pinyin,
      correctDisplay: s.targetBlank,
      correctPinyinDisplay: s.pinyin,
      meaningDisplay: s.arabic,
      explanation: `Only "${s.targetBlank}" completes this Chapter ${s.chapterId} sentence accurately: ${s.hanzi} (${s.arabic}).`,
    };
  });
}

function buildFinalPartThree(
  chapterIdSet: Set<number>,
  partitionSlot: 0 | 1 | 2 | null,
  scopeSeed: number,
  rng: () => number
): FinalExamQuestion[] {
  const curatedPool: ReadingComprehensionItem[] = READING_COMPREHENSION_DATA.filter((item) =>
    chapterIdSet.has(item.chapterId)
  );

  // Cap Part III strictly to the unique curated reading passages available for the chosen scope
  // (up to 15) so narrow 1–3 chapter scopes never repeat passages or duplicate Part IV sentences.
  const targetCount = Math.min(FINAL_EXAM_PART_TARGETS.part3, curatedPool.length);
  const pickedCurated = pickForModel(
    curatedPool,
    targetCount,
    partitionSlot,
    scopeSeed ^ 0x33333333,
    rng
  );

  return pickedCurated.map((item, idx) => {
    const qNum = 21 + idx;
    const options: ChapterExamOption[] = shuffleWithRng(
      [
        { id: 'correct', label: item.correctOption },
        ...item.distractors.map((d, i) => ({ id: `d-${i}`, label: d })),
      ],
      rng
    );

    const audioText =
      item.format === 'dialogue' && item.dialogueLines
        ? item.dialogueLines.map((l) => l.hanzi).join(' ')
        : item.passageHanzi ?? '';

    const fullHanzi =
      item.format === 'dialogue' && item.dialogueLines
        ? item.dialogueLines.map((l) => `${l.speaker}: ${l.hanzi}`).join(' / ')
        : item.passageHanzi ?? '';

    const fullPinyin =
      item.format === 'dialogue' && item.dialogueLines
        ? item.dialogueLines.map((l) => `${l.speaker}: ${l.pinyin}`).join(' / ')
        : item.passagePinyin;

    return {
      id: `final-p3-ch${item.chapterId}-${item.id}-${qNum}`,
      number: qNum,
      part: 3,
      chapterId: item.chapterId,
      drillType: 'sentence-hanzi-to-arabic',
      sourceItemId: item.id,
      subTypeLabel:
        item.format === 'dialogue'
          ? `Ch. ${item.chapterId} · Dialogue Comprehension`
          : `Ch. ${item.chapterId} · Short Passage`,
      promptPrimary: item.questionEn,
      comprehensionQuestion: item.questionEn,
      readingFormat: item.format,
      dialogueLines: item.dialogueLines,
      passageHanzi: item.passageHanzi,
      passagePinyin: item.passagePinyin,
      isHanziPrompt: false,
      audioText,
      options,
      correctOptionId: 'correct',
      correctedHanzi: fullHanzi,
      correctedPinyin: fullPinyin,
      correctDisplay: item.correctOption,
      explanation: item.explanation,
    };
  });
}

function buildFinalPartFour(
  sentencePool: ScopedSentence[],
  partitionSlot: 0 | 1 | 2 | null,
  scopeSeed: number,
  rng: () => number
): FinalExamQuestion[] {
  const targetCount = Math.min(FINAL_EXAM_PART_TARGETS.part4, sentencePool.length);
  const picked = pickForModel(sentencePool, targetCount, partitionSlot, scopeSeed ^ 0x44444444, rng);
  const zhToEnCut = Math.ceil(picked.length * 0.6);

  return picked.map((s, idx) => {
    const qNum = 51 + idx;
    const enMut = generateMutatedVariants(s.arabic, ENGLISH_SWAP_RULES, 3, rng);
    const zhMut = generateMutatedVariants(s.hanzi, CHINESE_SWAP_RULES, 3, rng);

    let direction: 'zh-to-en' | 'en-to-zh' = idx < zhToEnCut ? 'zh-to-en' : 'en-to-zh';
    if (direction === 'zh-to-en' && enMut.variants.length < 3 && zhMut.variants.length >= 3) {
      direction = 'en-to-zh';
    } else if (direction === 'en-to-zh' && zhMut.variants.length < 3 && enMut.variants.length >= 3) {
      direction = 'zh-to-en';
    }

    const { distractors, trapHint } = buildCloseTranslationDistractors(
      { id: s.id, chapterId: s.chapterId, hanzi: s.hanzi, arabic: s.arabic },
      sentencePool,
      direction,
      3,
      rng
    );

    if (direction === 'zh-to-en') {
      return {
        id: `final-p4-ch${s.chapterId}-${s.id}-${qNum}`,
        number: qNum,
        part: 4,
        chapterId: s.chapterId,
        drillType: 'sentence-hanzi-to-arabic',
        sourceItemId: s.id,
        subTypeLabel: `Ch. ${s.chapterId} · Translate ZH → EN`,
        promptPrimary: s.hanzi,
        promptPinyin: s.pinyin,
        isHanziPrompt: true,
        audioText: s.hanzi,
        options: shuffleWithRng(
          [
            { id: 'correct', label: s.arabic },
            ...distractors.slice(0, 3).map((d, i) => ({ id: `d-${i}`, label: d })),
          ],
          rng
        ),
        correctOptionId: 'correct',
        correctedHanzi: s.hanzi,
        correctedPinyin: s.pinyin,
        correctDisplay: s.arabic,
        correctPinyinDisplay: s.pinyin,
        meaningDisplay: s.arabic,
        explanation: `"${s.hanzi}" accurately translates to "${s.arabic}". ${trapHint}`,
      };
    }

    return {
      id: `final-p4-ch${s.chapterId}-${s.id}-${qNum}`,
      number: qNum,
      part: 4,
      chapterId: s.chapterId,
      drillType: 'sentence-arabic-to-hanzi',
      sourceItemId: s.id,
      subTypeLabel: `Ch. ${s.chapterId} · Translate EN → ZH`,
      promptPrimary: s.arabic,
      isHanziPrompt: false,
      audioText: s.hanzi,
      options: shuffleWithRng(
        [
          { id: 'correct', label: s.hanzi, isHanzi: true },
          ...distractors.slice(0, 3).map((d, i) => ({ id: `d-${i}`, label: d, isHanzi: true })),
        ],
        rng
      ),
      correctOptionId: 'correct',
      correctedHanzi: s.hanzi,
      correctedPinyin: s.pinyin,
      correctDisplay: s.hanzi,
      correctPinyinDisplay: s.pinyin,
      meaningDisplay: s.arabic,
      explanation: `"${s.arabic}" is expressed in Mandarin as "${s.hanzi}" (${s.pinyin}). ${trapHint}`,
    };
  });
}

function buildFinalPartFive(
  chapterIdSet: Set<number>,
  partitionSlot: 0 | 1 | 2 | null,
  scopeSeed: number,
  rng: () => number
): FinalExamQuestion[] {
  const scopedItems: TrueFalseItem[] = Array.from(chapterIdSet)
    .sort((a, b) => a - b)
    .flatMap((chapterId) => getChapterTrueFalseItems(chapterId));
  const trueItems = scopedItems.filter((item) => item.isTrue);
  const falseItems = scopedItems.filter((item) => !item.isTrue);

  const targetTrue = Math.min(Math.ceil(FINAL_EXAM_PART_TARGETS.part5 / 2), trueItems.length);
  const targetFalse = Math.min(Math.floor(FINAL_EXAM_PART_TARGETS.part5 / 2), falseItems.length);

  const pickedTrue = pickForModel(trueItems, targetTrue, partitionSlot, scopeSeed ^ 0x55555555, rng);
  const pickedFalse = pickForModel(falseItems, targetFalse, partitionSlot, scopeSeed ^ 0x5a5a5a5a, rng);
  const picked = shuffleWithRng([...pickedTrue, ...pickedFalse], rng);

  return picked.map((item, idx) => {
    const qNum = 41 + idx;
    const verdict = item.isTrue ? 'TRUE' : 'FALSE';
    return {
      id: `final-p5-ch${item.chapterId}-${item.id}-${qNum}`,
      number: qNum,
      part: 5,
      chapterId: item.chapterId,
      drillType: 'true-false',
      sourceItemId: item.id,
      subTypeLabel: `Ch. ${item.chapterId} · True or False`,
      promptPrimary: item.hanzi,
      promptPinyin: item.pinyin,
      isHanziPrompt: true,
      audioText: item.isTrue ? item.hanzi : (item.correctedHanzi ?? item.hanzi),
      options: [
        { id: 'true', label: 'TRUE' },
        { id: 'false', label: 'FALSE' },
      ],
      correctOptionId: item.isTrue ? 'true' : 'false',
      isStatementTrue: item.isTrue,
      correctedHanzi: item.correctedHanzi,
      correctedPinyin: item.correctedPinyin,
      trapCategory: item.trapCategory,
      correctDisplay: verdict,
      correctPinyinDisplay: item.isTrue ? item.pinyin : item.correctedPinyin,
      meaningDisplay: item.meaning,
      explanation: item.explanation,
    };
  });
}

/**
 * Generates a 50-question comprehensive Final Exam across the chosen chapters.
 * - Model 1, Model 2, and Model 3 use deterministic seeds derived from (model salt + sorted chapterIds)
 *   so every student taking the same model on the same chapters receives the exact same exam paper.
 * - Random Comprehensive Exam uses a fresh random seed every time.
 */
export function generateFinalExam(
  modelId: FinalExamModelId,
  rawChapterIds: number[],
  randomNonce?: number
): FinalExamPaper {
  const sortedChapterIds = Array.from(new Set(rawChapterIds))
    .filter((id) => CHAPTERS_DATA.some((c) => c.id === id))
    .sort((a, b) => a - b);

  const effectiveChapterIds =
    sortedChapterIds.length > 0 ? sortedChapterIds : CHAPTERS_DATA.map((c) => c.id);

  const chapterIdSet = new Set<number>(effectiveChapterIds);
  const selectedChapters: ChapterData[] = CHAPTERS_DATA.filter((c) => chapterIdSet.has(c.id));

  const vocabPool: ScopedVocab[] = selectedChapters.flatMap((ch) =>
    ch.vocab.map((v) => ({ ...v, chapterId: ch.id }))
  );
  const sentencePool: ScopedSentence[] = selectedChapters.flatMap((ch) =>
    ch.sentences.map((s) => ({ ...s, chapterId: ch.id }))
  );

  const meta = getFinalExamModelMeta(modelId);
  const scopeKey = effectiveChapterIds.join(',');
  const scopeSeed = hashString(`HSK1-SCOPE-${scopeKey}`);

  const finalSeed = meta.isDeterministic
    ? hashString(`${meta.seedSalt}::${scopeKey}`)
    : hashString(
        `${meta.seedSalt}::${scopeKey}::${Date.now()}::${randomNonce ?? 0}::${Math.floor(Math.random() * 1e9)}`
      );

  const rng = createSeededRng(finalSeed);

  const rawP1 = buildFinalPartOne(vocabPool, meta.partitionSlot, scopeSeed, rng);
  const rawP2 = buildFinalPartTwo(sentencePool, vocabPool, meta.partitionSlot, scopeSeed, rng);
  const rawP3 = buildFinalPartThree(chapterIdSet, meta.partitionSlot, scopeSeed, rng);
  const rawP4 = buildFinalPartFour(sentencePool, meta.partitionSlot, scopeSeed, rng);
  const rawP5 = buildFinalPartFive(chapterIdSet, meta.partitionSlot, scopeSeed, rng);

  // Sequentially number all questions 1..totalQuestions so narrow scopes (where Part III has 4 or 8 unique passages) have continuous numbering
  let runningNum = 1;
  const renumber = (qs: FinalExamQuestion[]): FinalExamQuestion[] =>
    qs.map((q) => {
      const num = runningNum++;
      return { ...q, number: num };
    });

  const p1 = renumber(rawP1);
  const p2 = renumber(rawP2);
  const p3 = renumber(rawP3);
  const p4 = renumber(rawP4);
  const p5 = renumber(rawP5);

  const rangeLabel = (qs: FinalExamQuestion[]) =>
    qs.length > 0 ? `Questions ${qs[0].number}–${qs[qs.length - 1].number}` : 'No Questions';

  const meaningCount = p1.filter((q) => q.drillType === 'hanzi-to-arabic').length;
  const pinyinCount = p1.length - meaningCount;
  const trueCount = p5.filter((q) => q.isStatementTrue).length;
  const falseCount = p5.length - trueCount;

  const parts: FinalExamPart[] = [
    {
      partNumber: 1,
      romanNumeral: 'I',
      title: 'Vocabulary & Pinyin — Meaning & Tone Recognition',
      subtitle: `${rangeLabel(p1)} · ${meaningCount} Hanzi → Meaning + ${pinyinCount} Hanzi → Pinyin & Tones`,
      instructions:
        'Choose the single exact English meaning or accurate Pinyin with tone marks for each Chinese word.',
      questions: p1,
    },
    {
      partNumber: 2,
      romanNumeral: 'II',
      title: 'Grammar & Fill-in-the-Blank — Measure Words & Particles',
      subtitle: `${rangeLabel(p2)} · Strictly Single Valid Answer`,
      instructions:
        'Select the only Chinese word, particle, or measure word that completes each sentence grammatically.',
      questions: p2,
    },
    {
      partNumber: 3,
      romanNumeral: 'III',
      title: 'Reading & Dialogue Comprehension',
      subtitle: `${rangeLabel(p3)} · ${p3.length} Unique Authentic Dialogues & Short Passages`,
      instructions:
        'Read each Mandarin mini-dialogue or short passage carefully and select the statement that accurately answers the comprehension question.',
      questions: p3,
    },
    {
      partNumber: 4,
      romanNumeral: 'IV',
      title: 'Sentence Translation — Precision & Nuance',
      subtitle: `${rangeLabel(p4)} · Close-Distractor Traps`,
      instructions:
        'Choose the exact translation. Distractors intentionally mirror length and vocabulary while introducing negation, time, pronoun, or word-meaning traps.',
      questions: p4,
    },
    {
      partNumber: 5,
      romanNumeral: 'V',
      title: 'True or False — Grammar & Usage Judgment',
      subtitle: `${rangeLabel(p5)} · Balanced ${trueCount} TRUE / ${falseCount} FALSE Statements`,
      instructions:
        'Decide whether each Chinese sentence is grammatically and semantically natural (TRUE) or contains a mistake (FALSE).',
      questions: p5,
    },
  ];

  const totalQuestions = p1.length + p2.length + p3.length + p4.length + p5.length;
  const seedTag = meta.isDeterministic
    ? `${meta.code.replace(/\s+/g, '-')}-${(finalSeed % 9000 + 1000).toString(10)}`
    : `RAND-${(finalSeed % 9000 + 1000).toString(10)}`;

  return {
    modelId,
    modelLabel: meta.label,
    modelSubtitle: meta.subtitle.replace(/\b80 Questions\b/, `${totalQuestions} Questions`),
    isDeterministic: meta.isDeterministic,
    seedTag,
    chapterIds: effectiveChapterIds,
    scopeLabel: formatChapterScopeLabel(effectiveChapterIds),
    totalQuestions,
    durationSeconds: FINAL_EXAM_DURATION_SECONDS,
    parts,
  };
}
