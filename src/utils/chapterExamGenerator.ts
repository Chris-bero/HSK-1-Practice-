import { getChapterTrueFalseItems } from '../data/trueFalseData';
import {
  ChapterData,
  ChapterExamOption,
  ChapterExamPaper,
  ChapterExamPart,
  ChapterExamQuestion,
  SentenceItem,
  VocabItem,
} from '../types';
import { shuffleArray } from './drillGenerators';
import {
  buildCloseTranslationDistractors,
  CHINESE_SWAP_RULES,
  ENGLISH_SWAP_RULES,
  generateMutatedVariants,
  shuffleWithRng,
} from './translationDistractors';

export { CHINESE_SWAP_RULES, ENGLISH_SWAP_RULES, generateMutatedVariants, shuffleWithRng };
export type { SwapRule } from './translationDistractors';

const CHAPTER_EXAM_DURATION_SECONDS = 45 * 60; // 45 minutes

const TONE_MAP: Record<string, [string, string, string, string]> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

const REVERSE_TONE_MAP: Record<string, { base: string; tone: number }> = {};
Object.entries(TONE_MAP).forEach(([base, tones]) => {
  tones.forEach((char, idx) => {
    REVERSE_TONE_MAP[char] = { base, tone: idx + 1 };
  });
});

const SIMILAR_INITIAL_PAIRS: [string, string][] = [
  ['zh', 'z'],
  ['ch', 'c'],
  ['sh', 's'],
  ['j', 'q'],
  ['q', 'x'],
  ['x', 's'],
  ['n', 'l'],
  ['b', 'p'],
  ['d', 't'],
  ['g', 'k'],
  ['f', 'h'],
  ['z', 'c'],
];

export const EXTRA_PINYIN_LOOKUP: Record<string, string> = {
  同学们: 'tóngxuémen',
  王老师: 'Wáng lǎoshī',
  学生: 'xuéshēng',
  谢谢: 'xièxie',
  不客气: 'bú kèqi',
  再见: 'zàijiàn',
  你好: 'nǐ hǎo',
  您好: 'nín hǎo',
  大家: 'dàjiā',
  你们: 'nǐmen',
  他们: 'tāmen',
  她们: 'tāmen',
  它们: 'tāmen',
  个: 'gè',
  口: 'kǒu',
  只: 'zhī',
  本: 'běn',
  件: 'jiàn',
  杯: 'bēi',
  家: 'jiā',
  斤: 'jīn',
  块: 'kuài',
  元: 'yuán',
  岁: 'suì',
  不: 'bù',
  没: 'méi',
  没有: 'méiyǒu',
  在: 'zài',
  正在: 'zhèngzài',
  的: 'de',
  了: 'le',
  吗: 'ma',
  呢: 'ne',
  吧: 'ba',
  很: 'hěn',
  太: 'tài',
  真: 'zhēn',
  非常: 'fēicháng',
  也: 'yě',
  都: 'dōu',
  还: 'hái',
  再: 'zài',
  一点儿: 'yìdiǎnr',
  有点儿: 'yǒudiǎnr',
};

function mutatePinyinTone(pinyin: string, toneShift: number): string {
  const chars = Array.from(pinyin);
  for (let i = 0; i < chars.length; i++) {
    const info = REVERSE_TONE_MAP[chars[i]];
    if (info) {
      const nextToneIndex = (info.tone - 1 + toneShift + 4) % 4;
      chars[i] = TONE_MAP[info.base][nextToneIndex];
      return chars.join('');
    }
  }
  return pinyin;
}

function mutateSimilarSyllable(pinyin: string, attempt: number): string {
  const words = pinyin.split(' ');
  const targetIdx = attempt % words.length;
  const word = words[targetIdx];

  for (let i = 0; i < SIMILAR_INITIAL_PAIRS.length; i++) {
    const [a, b] = SIMILAR_INITIAL_PAIRS[(i + attempt) % SIMILAR_INITIAL_PAIRS.length];
    if (word.startsWith(a)) {
      words[targetIdx] = b + word.slice(a.length);
      return words.join(' ');
    }
    if (word.startsWith(b)) {
      words[targetIdx] = a + word.slice(b.length);
      return words.join(' ');
    }
  }
  if (word.includes('an')) {
    words[targetIdx] = word.replace('an', 'ang');
    return words.join(' ');
  }
  if (word.includes('en')) {
    words[targetIdx] = word.replace('en', 'eng');
    return words.join(' ');
  }
  return mutatePinyinTone(pinyin, attempt + 2);
}

export function buildFourPinyinOptions(
  item: VocabItem,
  vocabPool: VocabItem[],
  rng: () => number = Math.random
): ChapterExamOption[] {
  const unique = new Set<string>([item.pinyin]);
  const distractors: string[] = [];

  const toneCandidates = item.toneVariants
    ? [...item.toneVariants]
    : [mutatePinyinTone(item.pinyin, 1), mutatePinyinTone(item.pinyin, 2)];

  for (const c of toneCandidates) {
    if (c && !unique.has(c) && distractors.length < 2) {
      unique.add(c);
      distractors.push(c);
    }
  }

  const simCandidates = item.similarSyllables
    ? [...item.similarSyllables]
    : [mutateSimilarSyllable(item.pinyin, 0), mutateSimilarSyllable(item.pinyin, 1)];

  for (const c of simCandidates) {
    if (c && !unique.has(c) && distractors.length < 3) {
      unique.add(c);
      distractors.push(c);
    }
  }

  for (let shift = 1; distractors.length < 3 && shift <= 6; shift++) {
    const c = mutatePinyinTone(item.pinyin, shift);
    if (!unique.has(c)) {
      unique.add(c);
      distractors.push(c);
    }
  }

  for (const v of shuffleWithRng(vocabPool, rng)) {
    if (distractors.length >= 3) break;
    if (!unique.has(v.pinyin)) {
      unique.add(v.pinyin);
      distractors.push(v.pinyin);
    }
  }

  return shuffleWithRng(
    [
      { id: 'correct', label: item.pinyin, isPinyin: true },
      ...distractors.slice(0, 3).map((d, i) => ({ id: `d-${i}`, label: d, isPinyin: true })),
    ],
    rng
  );
}

function buildPartOneQuestions(chapter: ChapterData): ChapterExamQuestion[] {
  const picked = shuffleArray(chapter.vocab).slice(0, 10);
  const questions: ChapterExamQuestion[] = [];

  picked.forEach((item, idx) => {
    const qNum = idx + 1;
    const isMeaningQuestion = idx < 5;

    if (isMeaningQuestion) {
      const distractors = shuffleArray(
        chapter.vocab.filter((v) => v.hanzi !== item.hanzi && v.arabic !== item.arabic)
      ).slice(0, 3);

      const options: ChapterExamOption[] = shuffleArray([
        { id: 'correct', label: item.arabic },
        ...distractors.map((d, i) => ({ id: `d-${i}`, label: d.arabic })),
      ]);

      questions.push({
        id: `exam-p1-${chapter.id}-${item.id}-${qNum}`,
        number: qNum,
        part: 1,
        chapterId: chapter.id,
        drillType: 'hanzi-to-arabic',
        sourceItemId: item.id,
        subTypeLabel: 'Hanzi → Meaning',
        promptPrimary: item.hanzi,
        promptPinyin: item.pinyin,
        isHanziPrompt: true,
        audioText: item.hanzi,
        options,
        correctOptionId: 'correct',
        correctDisplay: item.arabic,
        correctPinyinDisplay: item.pinyin,
        meaningDisplay: item.arabic,
        explanation: `${item.hanzi} (${item.pinyin}) means "${item.arabic}".`,
      });
    } else {
      const options = buildFourPinyinOptions(item, chapter.vocab);
      questions.push({
        id: `exam-p1-${chapter.id}-${item.id}-${qNum}`,
        number: qNum,
        part: 1,
        chapterId: chapter.id,
        drillType: 'hanzi-to-pinyin',
        sourceItemId: item.id,
        subTypeLabel: 'Hanzi → Pinyin & Tones',
        promptPrimary: item.hanzi,
        isHanziPrompt: true,
        audioText: item.hanzi,
        options,
        correctOptionId: 'correct',
        correctDisplay: item.pinyin,
        correctPinyinDisplay: item.pinyin,
        meaningDisplay: item.arabic,
        explanation: `${item.hanzi} is pronounced "${item.pinyin}" and means "${item.arabic}". Pay close attention to tone marks and initials.`,
      });
    }
  });

  return questions;
}

function buildPartTwoQuestions(chapter: ChapterData): ChapterExamQuestion[] {
  const validSentences = chapter.sentences.filter(
    (s) => s.targetBlank && s.hanzi.includes(s.targetBlank) && (s.blankDistractors?.length ?? 0) >= 3
  );
  const picked = shuffleArray(validSentences).slice(0, 10);

  const lookupPinyin = (hanzi: string) => {
    const fromChapter = chapter.vocab.find((v) => v.hanzi === hanzi);
    if (fromChapter) return fromChapter.pinyin;
    return EXTRA_PINYIN_LOOKUP[hanzi];
  };

  return picked.map((s, idx) => {
    const qNum = 11 + idx;
    const blanked = s.hanzi.replace(s.targetBlank, ' ____ ');

    const explicitDistractors: string[] = [];
    const seen = new Set<string>([s.targetBlank]);
    for (const d of s.blankDistractors ?? []) {
      if (d && !seen.has(d)) {
        seen.add(d);
        explicitDistractors.push(d);
      }
    }

    const options: ChapterExamOption[] = shuffleArray([
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
    ]);

    return {
      id: `exam-p2-${chapter.id}-${s.id}-${qNum}`,
      number: qNum,
      part: 2,
      chapterId: chapter.id,
      drillType: 'fill-in-blank',
      sourceItemId: s.id,
      subTypeLabel: 'Grammar & Context Blank',
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
      explanation: `Only "${s.targetBlank}" completes the sentence accurately: ${s.hanzi} (${s.arabic}).`,
    };
  });
}

function buildPartThreeQuestions(chapter: ChapterData): ChapterExamQuestion[] {
  // Prioritize sentences that yield rich English or Chinese close-distractor mutations
  const scored = chapter.sentences.map((s) => {
    const enMut = generateMutatedVariants(s.arabic, ENGLISH_SWAP_RULES, 3);
    const zhMut = generateMutatedVariants(s.hanzi, CHINESE_SWAP_RULES, 3);
    return { s, enMut, zhMut };
  });

  const shuffled = shuffleArray(scored);
  // Sort slightly to prefer sentences with full 3 close mutations while preserving variety
  shuffled.sort(
    (a, b) =>
      Math.max(b.enMut.variants.length, b.zhMut.variants.length) -
      Math.max(a.enMut.variants.length, a.zhMut.variants.length)
  );

  const picked = shuffleArray(shuffled.slice(0, 10));

  const chapterCandidates = chapter.sentences.map((item) => ({
    id: item.id,
    chapterId: chapter.id,
    hanzi: item.hanzi,
    arabic: item.arabic,
  }));

  return picked.map(({ s, enMut, zhMut }, idx) => {
    const qNum = 21 + idx;
    // Aim for 6 ZH -> EN and 4 EN -> ZH, choosing whichever direction has stronger minimal-pair traps
    let direction: 'zh-to-en' | 'en-to-zh' = idx < 6 ? 'zh-to-en' : 'en-to-zh';
    if (direction === 'zh-to-en' && enMut.variants.length < 3 && zhMut.variants.length >= 3) {
      direction = 'en-to-zh';
    } else if (direction === 'en-to-zh' && zhMut.variants.length < 3 && enMut.variants.length >= 3) {
      direction = 'zh-to-en';
    }

    const { distractors, trapHint } = buildCloseTranslationDistractors(
      { id: s.id, chapterId: chapter.id, hanzi: s.hanzi, arabic: s.arabic },
      chapterCandidates,
      direction,
      3
    );

    if (direction === 'zh-to-en') {
      return {
        id: `exam-p3-${chapter.id}-${s.id}-${qNum}`,
        number: qNum,
        part: 3,
        chapterId: chapter.id,
        drillType: 'sentence-hanzi-to-arabic',
        sourceItemId: s.id,
        subTypeLabel: 'Translate ZH → EN',
        promptPrimary: s.hanzi,
        promptPinyin: s.pinyin,
        isHanziPrompt: true,
        audioText: s.hanzi,
        options: shuffleArray([
          { id: 'correct', label: s.arabic },
          ...distractors.slice(0, 3).map((d, i) => ({ id: `d-${i}`, label: d })),
        ]),
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
      id: `exam-p3-${chapter.id}-${s.id}-${qNum}`,
      number: qNum,
      part: 3,
      chapterId: chapter.id,
      drillType: 'sentence-arabic-to-hanzi',
      sourceItemId: s.id,
      subTypeLabel: 'Translate EN → ZH',
      promptPrimary: s.arabic,
      isHanziPrompt: false,
      audioText: s.hanzi,
      options: shuffleArray([
        { id: 'correct', label: s.hanzi, isHanzi: true },
        ...distractors.slice(0, 3).map((d, i) => ({ id: `d-${i}`, label: d, isHanzi: true })),
      ]),
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

function buildPartFourQuestions(chapter: ChapterData): ChapterExamQuestion[] {
  const allItems = getChapterTrueFalseItems(chapter.id);
  const truePool = shuffleArray(allItems.filter((item) => item.isTrue)).slice(0, 5);
  const falsePool = shuffleArray(allItems.filter((item) => !item.isTrue)).slice(0, 5);
  const picked = shuffleArray([...truePool, ...falsePool]);

  return picked.map((item, idx) => {
    const qNum = 31 + idx;
    const verdict = item.isTrue ? 'TRUE' : 'FALSE';
    return {
      id: `exam-p4-${chapter.id}-${item.id}-${qNum}`,
      number: qNum,
      part: 4,
      chapterId: chapter.id,
      drillType: 'true-false',
      sourceItemId: item.id,
      subTypeLabel: 'True or False',
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

export function generateChapterExam(chapter: ChapterData): ChapterExamPaper {
  const p1 = buildPartOneQuestions(chapter);
  const p2 = buildPartTwoQuestions(chapter);
  const p3 = buildPartThreeQuestions(chapter);
  const p4 = buildPartFourQuestions(chapter);

  const parts: ChapterExamPart[] = [
    {
      partNumber: 1,
      romanNumeral: 'I',
      title: 'Vocabulary — Hanzi Meaning & Pinyin Matching',
      subtitle: 'Questions 1–10 · 5 Meaning + 5 Pinyin & Tone Recognition',
      instructions:
        'Select the single accurate English meaning (Q1–Q5) or exact Pinyin pronunciation with tones (Q6–Q10) for each Chinese word.',
      questions: p1,
    },
    {
      partNumber: 2,
      romanNumeral: 'II',
      title: 'Sentence Completion — Grammar & Measure Words',
      subtitle: 'Questions 11–20 · Strictly Single Valid Answer',
      instructions:
        'Read each Chinese sentence carefully and select the only word, particle, or measure word that completes it grammatically.',
      questions: p2,
    },
    {
      partNumber: 3,
      romanNumeral: 'III',
      title: 'Sentence Translation — Precision & Nuance',
      subtitle: 'Questions 21–30 · Close-Distractor Traps',
      instructions:
        'Choose the exact translation. Distractors intentionally swap pronouns, time words, quantities, or negation — inspect every detail.',
      questions: p3,
    },
    {
      partNumber: 4,
      romanNumeral: 'IV',
      title: 'True or False — Grammar & Usage Judgment',
      subtitle: 'Questions 31–40 · Balanced 5 TRUE / 5 FALSE Statements',
      instructions:
        'Decide whether each Chinese sentence is grammatically and semantically natural (TRUE) or contains a mistake (FALSE).',
      questions: p4,
    },
  ];

  return {
    chapterId: chapter.id,
    chineseNumeral: chapter.chineseNumeral,
    chapterTitle: chapter.titleAr,
    chapterSubtitle: chapter.subtitleAr,
    totalQuestions: p1.length + p2.length + p3.length + p4.length,
    durationSeconds: CHAPTER_EXAM_DURATION_SECONDS,
    parts,
  };
}
