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

export function shuffleWithRng<T>(items: T[], rng: () => number = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

/* ============================================================================
 * PART III CLOSE-DISTRACTOR MUTATION ENGINE
 * Generates tricky, closely related sentence translations by mutating
 * pronouns, time expressions, numbers/measure words, polarity, or nearby nouns
 * so questions cannot be solved by simple keyword elimination.
 * ============================================================================ */

export interface SwapRule {
  pattern: RegExp;
  replacements: string[];
  tag: string;
}

export const ENGLISH_SWAP_RULES: SwapRule[] = [
  // Multi-word pronoun + verb phrases (preserves subject-verb agreement)
  { pattern: /\bI am not\b/g, replacements: ['He is not', 'She is not', 'You are not'], tag: 'pronoun' },
  { pattern: /\bI am\b/g, replacements: ['He is', 'She is', 'You are', 'We are'], tag: 'pronoun' },
  { pattern: /\bHe is\b/g, replacements: ['She is', 'I am', 'You are'], tag: 'pronoun' },
  { pattern: /\bShe is\b/g, replacements: ['He is', 'I am', 'You are'], tag: 'pronoun' },
  { pattern: /\bWe are\b/g, replacements: ['They are', 'You are'], tag: 'pronoun' },
  { pattern: /\bThey are\b/g, replacements: ['We are', 'You are'], tag: 'pronoun' },
  { pattern: /\bAre you\b/g, replacements: ['Is he', 'Is she', 'Are they'], tag: 'pronoun' },
  { pattern: /\bDo you\b/g, replacements: ['Does he', 'Does she', 'Do they'], tag: 'pronoun' },
  { pattern: /\bI have\b/g, replacements: ['He has', 'She has', 'We have'], tag: 'pronoun' },
  { pattern: /\bShe has\b/g, replacements: ['He has', 'I have', 'They have'], tag: 'pronoun' },
  { pattern: /\bHe has\b/g, replacements: ['She has', 'I have', 'We have'], tag: 'pronoun' },
  { pattern: /\bI do not\b/g, replacements: ['He does not', 'She does not', 'We do not'], tag: 'pronoun' },
  { pattern: /\bI did not\b/g, replacements: ['He did not', 'She did not', 'We did not'], tag: 'pronoun' },
  { pattern: /\bI want to\b/g, replacements: ['He wants to', 'She wants to', 'We want to'], tag: 'pronoun' },
  { pattern: /\bI like\b/g, replacements: ['He likes', 'She likes', 'We like'], tag: 'pronoun' },
  { pattern: /\bI love\b/g, replacements: ['He loves', 'She loves', 'We love'], tag: 'pronoun' },
  { pattern: /\bI can\b/g, replacements: ['He can', 'She can', 'We can'], tag: 'pronoun' },
  { pattern: /\bI will\b/g, replacements: ['He will', 'She will', 'We will'], tag: 'pronoun' },
  { pattern: /\bMy name is\b/g, replacements: ['His name is', 'Her name is'], tag: 'pronoun' },
  { pattern: /\bWhat is your\b/g, replacements: ['What is his', 'What is her'], tag: 'pronoun' },
  { pattern: /\bmy\b/g, replacements: ['your', 'his', 'her'], tag: 'pronoun' },
  { pattern: /\bMy\b/g, replacements: ['Your', 'His', 'Her'], tag: 'pronoun' },
  { pattern: /\byour\b/g, replacements: ['his', 'her', 'my', 'their'], tag: 'pronoun' },
  { pattern: /\bYour\b/g, replacements: ['His', 'Her', 'My'], tag: 'pronoun' },
  { pattern: /\bhis\b/g, replacements: ['her', 'my', 'your'], tag: 'pronoun' },
  { pattern: /\bHis\b/g, replacements: ['Her', 'My', 'Your'], tag: 'pronoun' },
  { pattern: /\bher\b/g, replacements: ['his', 'my', 'your'], tag: 'pronoun' },
  { pattern: /\bHer\b/g, replacements: ['His', 'My', 'Your'], tag: 'pronoun' },
  { pattern: /\bour\b/g, replacements: ['their', 'your', 'my'], tag: 'pronoun' },
  { pattern: /\bOur\b/g, replacements: ['Their', 'Your', 'My'], tag: 'pronoun' },
  { pattern: /\bwe\b/g, replacements: ['they', 'you all'], tag: 'pronoun' },
  { pattern: /\bWe\b/g, replacements: ['They', 'You all'], tag: 'pronoun' },

  // Time words & days
  { pattern: /\btoday\b/g, replacements: ['tomorrow', 'yesterday'], tag: 'time' },
  { pattern: /\bToday\b/g, replacements: ['Tomorrow', 'Yesterday'], tag: 'time' },
  { pattern: /\btomorrow\b/g, replacements: ['today', 'yesterday'], tag: 'time' },
  { pattern: /\bTomorrow\b/g, replacements: ['Today', 'Yesterday'], tag: 'time' },
  { pattern: /\byesterday\b/g, replacements: ['today', 'tomorrow'], tag: 'time' },
  { pattern: /\bYesterday\b/g, replacements: ['Today', 'Tomorrow'], tag: 'time' },
  { pattern: /\bthis year\b/g, replacements: ['last year', 'next year'], tag: 'time' },
  { pattern: /\bThis year\b/g, replacements: ['Last year', 'Next year'], tag: 'time' },
  { pattern: /\blast year\b/g, replacements: ['this year', 'next year'], tag: 'time' },
  { pattern: /\bLast year\b/g, replacements: ['This year', 'Next year'], tag: 'time' },
  { pattern: /\bnext year\b/g, replacements: ['this year', 'last year'], tag: 'time' },
  { pattern: /\bNext year\b/g, replacements: ['This year', 'Last year'], tag: 'time' },
  { pattern: /\bmorning\b/g, replacements: ['afternoon', 'evening'], tag: 'time' },
  { pattern: /\bafternoon\b/g, replacements: ['morning', 'evening'], tag: 'time' },
  { pattern: /\bevening\b/g, replacements: ['morning', 'afternoon'], tag: 'time' },
  { pattern: /\bnoon\b/g, replacements: ['evening', 'morning'], tag: 'time' },
  { pattern: /\bSunday\b/g, replacements: ['Saturday', 'Monday'], tag: 'time' },
  { pattern: /\bSaturday\b/g, replacements: ['Sunday', 'Friday'], tag: 'time' },
  { pattern: /\btonight\b/g, replacements: ['tomorrow evening', 'this afternoon'], tag: 'time' },
  { pattern: /\bnow\b/g, replacements: ['tomorrow', 'earlier'], tag: 'time' },
  { pattern: /\b6:30\b/g, replacements: ['7:30', '5:30'], tag: 'time' },
  { pattern: /\b2:00 PM\b/g, replacements: ['3:00 PM', '4:00 PM'], tag: 'time' },
  { pattern: /\b3:00 PM\b/g, replacements: ['2:00 PM', '5:00 PM'], tag: 'time' },
  { pattern: /\b7:00 PM\b/g, replacements: ['8:00 PM', '6:00 PM'], tag: 'time' },
  { pattern: /\b8:00 AM\b/g, replacements: ['9:00 AM', '7:00 AM'], tag: 'time' },
  { pattern: /\b8:40\b/g, replacements: ['8:20', '9:40'], tag: 'time' },
  { pattern: /\b10:10\b/g, replacements: ['10:30', '9:10'], tag: 'time' },
  { pattern: /\bSeptember 8th\b/g, replacements: ['August 9th', 'September 7th'], tag: 'time' },
  { pattern: /\bSeptember 7th\b/g, replacements: ['July 9th', 'September 8th'], tag: 'time' },
  { pattern: /\bMarch 1st\b/g, replacements: ['March 10th', 'January 3rd'], tag: 'time' },
  { pattern: /\bMarch 6\b/g, replacements: ['June 3', 'March 8'], tag: 'time' },

  // Numbers, measure units & quantities
  { pattern: /\btwo\b/g, replacements: ['three', 'four'], tag: 'quantity' },
  { pattern: /\bthree\b/g, replacements: ['two', 'five'], tag: 'quantity' },
  { pattern: /\bfour\b/g, replacements: ['three', 'five'], tag: 'quantity' },
  { pattern: /\bfive\b/g, replacements: ['four', 'six'], tag: 'quantity' },
  { pattern: /\bsix\b/g, replacements: ['seven', 'eight'], tag: 'quantity' },
  { pattern: /\bseven\b/g, replacements: ['six', 'eight'], tag: 'quantity' },
  { pattern: /\beight\b/g, replacements: ['seven', 'nine'], tag: 'quantity' },
  { pattern: /\bnine\b/g, replacements: ['eight', 'ten'], tag: 'quantity' },
  { pattern: /\bten\b/g, replacements: ['twenty', 'eight'], tag: 'quantity' },
  { pattern: /\btwenty\b/g, replacements: ['twelve', 'thirty'], tag: 'quantity' },
  { pattern: /\ba cup of\b/g, replacements: ['two cups of', 'a pot of'], tag: 'measure' },
  { pattern: /\ba glass of\b/g, replacements: ['two glasses of', 'a bottle of'], tag: 'measure' },
  { pattern: /\bhalf a day\b/g, replacements: ['two days', 'a full day'], tag: 'quantity' },
  { pattern: /\bsecond\b/g, replacements: ['first', 'third'], tag: 'quantity' },

  // Family & people roles
  { pattern: /\bolder brother\b/g, replacements: ['younger brother', 'older sister'], tag: 'person' },
  { pattern: /\byounger brother\b/g, replacements: ['older brother', 'younger sister'], tag: 'person' },
  { pattern: /\bolder sister\b/g, replacements: ['younger sister', 'older brother'], tag: 'person' },
  { pattern: /\byounger sister\b/g, replacements: ['older sister', 'younger brother'], tag: 'person' },
  { pattern: /\bson\b/g, replacements: ['daughter', 'younger brother'], tag: 'person' },
  { pattern: /\bdaughter\b/g, replacements: ['son', 'younger sister'], tag: 'person' },
  { pattern: /\bdad\b/g, replacements: ['mom', 'older brother'], tag: 'person' },
  { pattern: /\bmom\b/g, replacements: ['dad', 'older sister'], tag: 'person' },
  { pattern: /\bMom\b/g, replacements: ['Dad', 'Older sister'], tag: 'person' },
  { pattern: /\bDad\b/g, replacements: ['Mom', 'Older brother'], tag: 'person' },
  { pattern: /\bgirlfriend\b/g, replacements: ['boyfriend', 'classmate'], tag: 'person' },
  { pattern: /\bboyfriend\b/g, replacements: ['girlfriend', 'friend'], tag: 'person' },
  { pattern: /\bTeacher Wang\b/g, replacements: ['Teacher Li', 'Teacher Chen'], tag: 'person' },
  { pattern: /\bTeacher Li\b/g, replacements: ['Teacher Wang', 'Teacher Zhang'], tag: 'person' },
  { pattern: /\bclassmate\b/g, replacements: ['friend', 'teacher'], tag: 'person' },
  { pattern: /\bstudent\b/g, replacements: ['teacher', 'doctor'], tag: 'person' },
  { pattern: /\bteacher\b/g, replacements: ['student', 'classmate'], tag: 'person' },
  { pattern: /\bdoctor\b/g, replacements: ['teacher', 'patient'], tag: 'person' },
  { pattern: /\bfriend\b/g, replacements: ['classmate', 'older brother'], tag: 'person' },

  // Places & countries
  { pattern: /\bChinese\b/g, replacements: ['French', 'Thai'], tag: 'place' },
  { pattern: /\bChina\b/g, replacements: ['France', 'Thailand'], tag: 'place' },
  { pattern: /\bFrance\b/g, replacements: ['China', 'Thailand'], tag: 'place' },
  { pattern: /\bFrench\b/g, replacements: ['Chinese', 'Thai'], tag: 'place' },
  { pattern: /\bThailand\b/g, replacements: ['China', 'France'], tag: 'place' },
  { pattern: /\bThai\b/g, replacements: ['Chinese', 'French'], tag: 'place' },
  { pattern: /\bBeijing\b/g, replacements: ["Xi'an", 'Shanghai'], tag: 'place' },
  { pattern: /\bXi'an\b/g, replacements: ['Beijing', 'Shanghai'], tag: 'place' },
  { pattern: /\bschool\b/g, replacements: ['hospital', 'bookstore'], tag: 'place' },
  { pattern: /\bhospital\b/g, replacements: ['school', 'company'], tag: 'place' },
  { pattern: /\bsupermarket\b/g, replacements: ['bookstore', 'restaurant'], tag: 'place' },
  { pattern: /\bbookstore\b/g, replacements: ['supermarket', 'cinema'], tag: 'place' },
  { pattern: /\bcinema\b/g, replacements: ['restaurant', 'supermarket'], tag: 'place' },
  { pattern: /\brestaurant\b/g, replacements: ['supermarket', 'school'], tag: 'place' },
  { pattern: /\bcompany\b/g, replacements: ['hospital', 'school'], tag: 'place' },
  { pattern: /\bairport\b/g, replacements: ['train station', 'hotel'], tag: 'place' },
  { pattern: /\bhome\b/g, replacements: ['school', 'the office'], tag: 'place' },

  // Food, objects, animals, transport & adjectives
  { pattern: /\bcat\b/g, replacements: ['dog', 'bird'], tag: 'noun' },
  { pattern: /\bdog\b/g, replacements: ['cat', 'rabbit'], tag: 'noun' },
  { pattern: /\btea\b/g, replacements: ['milk', 'hot water'], tag: 'noun' },
  { pattern: /\bmilk\b/g, replacements: ['tea', 'water'], tag: 'noun' },
  { pattern: /\bwater\b/g, replacements: ['tea', 'milk'], tag: 'noun' },
  { pattern: /\bnoodles\b/g, replacements: ['dumplings', 'cooked rice'], tag: 'noun' },
  { pattern: /\bdumplings\b/g, replacements: ['noodles', 'steamed buns'], tag: 'noun' },
  { pattern: /\bsteamed buns\b/g, replacements: ['dumplings', 'cooked rice'], tag: 'noun' },
  { pattern: /\brice\b/g, replacements: ['noodles', 'steamed buns'], tag: 'noun' },
  { pattern: /\bapples\b/g, replacements: ['fruit', 'cups'], tag: 'noun' },
  { pattern: /\bapple\b/g, replacements: ['cup', 'book'], tag: 'noun' },
  { pattern: /\btaxi\b/g, replacements: ['train', 'bus'], tag: 'noun' },
  { pattern: /\btrain\b/g, replacements: ['airplane', 'taxi'], tag: 'noun' },
  { pattern: /\bairplane\b/g, replacements: ['train', 'taxi'], tag: 'noun' },
  { pattern: /\bcheap\b/g, replacements: ['expensive', 'small'], tag: 'adjective' },
  { pattern: /\bexpensive\b/g, replacements: ['cheap', 'nice'], tag: 'adjective' },
  { pattern: /\bcold\b/g, replacements: ['hot', 'warm'], tag: 'adjective' },
  { pattern: /\bhot\b/g, replacements: ['cold', 'cool'], tag: 'adjective' },
  { pattern: /\bsnowed\b/g, replacements: ['rained'], tag: 'verb' },
  { pattern: /\braining\b/g, replacements: ['snowing'], tag: 'verb' },
  { pattern: /\bin front of\b/g, replacements: ['behind', 'inside'], tag: 'position' },
  { pattern: /\bbehind\b/g, replacements: ['in front of', 'next to'], tag: 'position' },
  { pattern: /\bon the table\b/g, replacements: ['under the table', 'on the chair'], tag: 'position' },
  { pattern: /\bunder the table\b/g, replacements: ['on the table', 'outside the room'], tag: 'position' },
  { pattern: /\bon the chair\b/g, replacements: ['under the chair', 'on the table'], tag: 'position' },
  { pattern: /\boutside\b/g, replacements: ['inside', 'in front of'], tag: 'position' },
  { pattern: /\bnot busy\b/g, replacements: ['very busy'], tag: 'polarity' },
  { pattern: /\bnot good\b/g, replacements: ['very good'], tag: 'polarity' },
  { pattern: /\bnot expensive\b/g, replacements: ['very expensive'], tag: 'polarity' },
  { pattern: /\bvery busy\b/g, replacements: ['not busy'], tag: 'polarity' },
  { pattern: /\bvery happy\b/g, replacements: ['not happy'], tag: 'polarity' },
  { pattern: /\bvery glad\b/g, replacements: ['also sorry'], tag: 'polarity' },
  { pattern: /\bvery delicious\b/g, replacements: ['not very tasty'], tag: 'polarity' },
  { pattern: /\breally delicious\b/g, replacements: ['not very tasty'], tag: 'polarity' },
  { pattern: /\bmiddle school\b/g, replacements: ['elementary school', 'university'], tag: 'place' },
  { pattern: /\belementary school\b/g, replacements: ['middle school', 'university'], tag: 'place' },
  { pattern: /\buniversity\b/g, replacements: ['middle school', 'elementary school'], tag: 'place' },
  { pattern: /\bHello\b/g, replacements: ['Goodbye', 'Thank you'], tag: 'greeting' },
  { pattern: /\bGoodbye\b/g, replacements: ['Hello', 'Thank you'], tag: 'greeting' },
  { pattern: /\bsee you tomorrow\b/g, replacements: ['see you this afternoon', 'see you next week'], tag: 'time' },
  { pattern: /\bSee you tomorrow\b/g, replacements: ['See you this afternoon', 'See you next week'], tag: 'time' },
  { pattern: /\boff work\b/g, replacements: ['at work', 'in class'], tag: 'verb' },
  { pattern: /\bin class\b/g, replacements: ['off work', 'at home'], tag: 'verb' },
  { pattern: /\bWhere are you\b/g, replacements: ['Where is he', 'Where are they'], tag: 'pronoun' },
];

export const CHINESE_SWAP_RULES: SwapRule[] = [
  // Pronouns
  { pattern: /我们/g, replacements: ['他们', '你们'], tag: 'pronoun' },
  { pattern: /你们/g, replacements: ['我们', '他们'], tag: 'pronoun' },
  { pattern: /他们/g, replacements: ['我们', '你们'], tag: 'pronoun' },
  { pattern: /我/g, replacements: ['他', '她', '你'], tag: 'pronoun' },
  { pattern: /你/g, replacements: ['他', '她', '我'], tag: 'pronoun' },
  { pattern: /您/g, replacements: ['他', '她'], tag: 'pronoun' },
  { pattern: /他/g, replacements: ['她', '我', '你'], tag: 'pronoun' },
  { pattern: /她/g, replacements: ['他', '我', '你'], tag: 'pronoun' },

  // Time words
  { pattern: /今天/g, replacements: ['明天', '昨天'], tag: 'time' },
  { pattern: /明天/g, replacements: ['今天', '昨天'], tag: 'time' },
  { pattern: /昨天/g, replacements: ['今天', '明天'], tag: 'time' },
  { pattern: /今年/g, replacements: ['去年', '明年'], tag: 'time' },
  { pattern: /去年/g, replacements: ['今年', '明年'], tag: 'time' },
  { pattern: /明年/g, replacements: ['今年', '去年'], tag: 'time' },
  { pattern: /上午/g, replacements: ['下午', '晚上'], tag: 'time' },
  { pattern: /下午/g, replacements: ['上午', '晚上'], tag: 'time' },
  { pattern: /晚上/g, replacements: ['上午', '下午'], tag: 'time' },
  { pattern: /早上/g, replacements: ['晚上', '下午'], tag: 'time' },
  { pattern: /中午/g, replacements: ['晚上', '上午'], tag: 'time' },
  { pattern: /星期天/g, replacements: ['星期六', '星期一'], tag: 'time' },
  { pattern: /星期日/g, replacements: ['星期六', '星期一'], tag: 'time' },
  { pattern: /星期六/g, replacements: ['星期天', '星期五'], tag: 'time' },

  // Measure words & numbers
  { pattern: /两/g, replacements: ['三', '四'], tag: 'quantity' },
  { pattern: /三/g, replacements: ['两', '五'], tag: 'quantity' },
  { pattern: /四/g, replacements: ['三', '五'], tag: 'quantity' },
  { pattern: /五/g, replacements: ['四', '六'], tag: 'quantity' },
  { pattern: /六/g, replacements: ['七', '八'], tag: 'quantity' },
  { pattern: /七/g, replacements: ['六', '八'], tag: 'quantity' },
  { pattern: /八/g, replacements: ['七', '九'], tag: 'quantity' },
  { pattern: /九/g, replacements: ['八', '十'], tag: 'quantity' },
  { pattern: /十/g, replacements: ['八', '九'], tag: 'quantity' },
  { pattern: /一杯/g, replacements: ['两杯', '一个'], tag: 'measure' },
  { pattern: /一件/g, replacements: ['两件', '一个'], tag: 'measure' },
  { pattern: /一本/g, replacements: ['两本', '一个'], tag: 'measure' },
  { pattern: /一只/g, replacements: ['两只', '一个'], tag: 'measure' },
  { pattern: /两斤/g, replacements: ['三斤', '一斤'], tag: 'measure' },
  { pattern: /四口/g, replacements: ['三口', '五口'], tag: 'measure' },

  // Family & people
  { pattern: /哥哥/g, replacements: ['弟弟', '姐姐'], tag: 'person' },
  { pattern: /弟弟/g, replacements: ['哥哥', '妹妹'], tag: 'person' },
  { pattern: /姐姐/g, replacements: ['妹妹', '哥哥'], tag: 'person' },
  { pattern: /妹妹/g, replacements: ['姐姐', '弟弟'], tag: 'person' },
  { pattern: /儿子/g, replacements: ['女儿', '弟弟'], tag: 'person' },
  { pattern: /女儿/g, replacements: ['儿子', '妹妹'], tag: 'person' },
  { pattern: /爸爸/g, replacements: ['妈妈', '哥哥'], tag: 'person' },
  { pattern: /妈妈/g, replacements: ['爸爸', '姐姐'], tag: 'person' },
  { pattern: /王老师/g, replacements: ['李老师', '陈老师'], tag: 'person' },
  { pattern: /李老师/g, replacements: ['王老师', '张老师'], tag: 'person' },
  { pattern: /男朋友/g, replacements: ['女朋友', '同学'], tag: 'person' },
  { pattern: /女朋友/g, replacements: ['男朋友', '同学'], tag: 'person' },

  // Places & countries
  { pattern: /中国/g, replacements: ['法国', '泰国'], tag: 'place' },
  { pattern: /法国/g, replacements: ['中国', '泰国'], tag: 'place' },
  { pattern: /泰国/g, replacements: ['中国', '法国'], tag: 'place' },
  { pattern: /北京/g, replacements: ['西安'], tag: 'place' },
  { pattern: /西安/g, replacements: ['北京'], tag: 'place' },
  { pattern: /学校/g, replacements: ['医院', '书店'], tag: 'place' },
  { pattern: /医院/g, replacements: ['学校', '公司'], tag: 'place' },
  { pattern: /超市/g, replacements: ['书店', '商店'], tag: 'place' },
  { pattern: /书店/g, replacements: ['超市', '电影院'], tag: 'place' },
  { pattern: /电影院/g, replacements: ['饭店', '超市'], tag: 'place' },
  { pattern: /饭店/g, replacements: ['超市', '学校'], tag: 'place' },
  { pattern: /公司/g, replacements: ['医院', '学校'], tag: 'place' },

  // Negation / polarity / position / food
  { pattern: /不是/g, replacements: ['是'], tag: 'polarity' },
  { pattern: /没有/g, replacements: ['有'], tag: 'polarity' },
  { pattern: /不想/g, replacements: ['想'], tag: 'polarity' },
  { pattern: /不能/g, replacements: ['能'], tag: 'polarity' },
  { pattern: /不忙/g, replacements: ['很忙'], tag: 'polarity' },
  { pattern: /不贵/g, replacements: ['很贵'], tag: 'polarity' },
  { pattern: /便宜/g, replacements: ['贵'], tag: 'adjective' },
  { pattern: /很冷/g, replacements: ['很热'], tag: 'adjective' },
  { pattern: /很热/g, replacements: ['很冷'], tag: 'adjective' },
  { pattern: /太冷/g, replacements: ['太热'], tag: 'adjective' },
  { pattern: /太热/g, replacements: ['太冷'], tag: 'adjective' },
  { pattern: /下雪/g, replacements: ['下雨'], tag: 'verb' },
  { pattern: /下雨/g, replacements: ['下雪'], tag: 'verb' },
  { pattern: /前边/g, replacements: ['后边'], tag: 'position' },
  { pattern: /后边/g, replacements: ['前边'], tag: 'position' },
  { pattern: /桌子上/g, replacements: ['桌子下'], tag: 'position' },
  { pattern: /桌子下/g, replacements: ['桌子上'], tag: 'position' },
  { pattern: /椅子上/g, replacements: ['椅子下'], tag: 'position' },
  { pattern: /小猫/g, replacements: ['小狗'], tag: 'noun' },
  { pattern: /小狗/g, replacements: ['小猫'], tag: 'noun' },
  { pattern: /面条儿/g, replacements: ['饺子', '米饭'], tag: 'noun' },
  { pattern: /饺子/g, replacements: ['面条儿', '包子'], tag: 'noun' },
  { pattern: /包子/g, replacements: ['饺子', '米饭'], tag: 'noun' },
  { pattern: /米饭/g, replacements: ['面条儿', '包子'], tag: 'noun' },
  { pattern: /牛奶/g, replacements: ['茶', '热水'], tag: 'noun' },
  { pattern: /茶/g, replacements: ['牛奶', '水'], tag: 'noun' },
  { pattern: /出租车/g, replacements: ['火车', '飞机'], tag: 'noun' },
  { pattern: /火车/g, replacements: ['飞机', '出租车'], tag: 'noun' },
  { pattern: /飞机/g, replacements: ['火车', '出租车'], tag: 'noun' },
  { pattern: /中学/g, replacements: ['小学', '大学'], tag: 'place' },
  { pattern: /小学/g, replacements: ['中学', '大学'], tag: 'place' },
  { pattern: /大学/g, replacements: ['中学', '小学'], tag: 'place' },
];

export function generateMutatedVariants(
  text: string,
  rules: SwapRule[],
  maxVariants: number,
  rng: () => number = Math.random
): {
  variants: string[];
  tagsUsed: string[];
} {
  const unique = new Set<string>([text]);
  const variants: string[] = [];
  const tagsUsed = new Set<string>();

  // Pass 1: Single targeted swap from different semantic categories for maximal subtlety
  const matchingRules = rules.filter((r) => {
    r.pattern.lastIndex = 0;
    return r.pattern.test(text);
  });

  // Prioritize diverse categories (pronoun, time, measure/quantity, polarity, person, place)
  const usedTagsInPass1 = new Set<string>();
  const orderedRules = shuffleWithRng(matchingRules, rng);

  for (const rule of orderedRules) {
    if (variants.length >= maxVariants) break;
    if (usedTagsInPass1.has(rule.tag)) continue;

    for (const rep of shuffleWithRng(rule.replacements, rng)) {
      rule.pattern.lastIndex = 0;
      const mutated = text.replace(rule.pattern, rep);
      if (mutated !== text && !unique.has(mutated)) {
        unique.add(mutated);
        variants.push(mutated);
        tagsUsed.add(rule.tag);
        usedTagsInPass1.add(rule.tag);
        break;
      }
    }
  }

  // Pass 2: Additional single swaps from remaining replacements
  for (const rule of orderedRules) {
    if (variants.length >= maxVariants) break;
    for (const rep of shuffleWithRng(rule.replacements, rng)) {
      if (variants.length >= maxVariants) break;
      rule.pattern.lastIndex = 0;
      const mutated = text.replace(rule.pattern, rep);
      if (mutated !== text && !unique.has(mutated)) {
        unique.add(mutated);
        variants.push(mutated);
        tagsUsed.add(rule.tag);
      }
    }
  }

  // Pass 3: Combine two mutations if needed to reach 3 distinct close variants
  if (variants.length < maxVariants && variants.length > 0 && orderedRules.length >= 2) {
    const base = variants[0];
    for (const rule of orderedRules) {
      if (variants.length >= maxVariants) break;
      for (const rep of rule.replacements) {
        if (variants.length >= maxVariants) break;
        rule.pattern.lastIndex = 0;
        const mutated = base.replace(rule.pattern, rep);
        if (mutated !== text && !unique.has(mutated)) {
          unique.add(mutated);
          variants.push(mutated);
          tagsUsed.add(rule.tag);
        }
      }
    }
  }

  return { variants: variants.slice(0, maxVariants), tagsUsed: Array.from(tagsUsed) };
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

  return picked.map(({ s, enMut, zhMut }, idx) => {
    const qNum = 21 + idx;
    // Aim for 6 ZH -> EN and 4 EN -> ZH, choosing whichever direction has stronger minimal-pair traps
    let direction: 'zh-to-en' | 'en-to-zh' = idx < 6 ? 'zh-to-en' : 'en-to-zh';
    if (direction === 'zh-to-en' && enMut.variants.length < 3 && zhMut.variants.length >= 3) {
      direction = 'en-to-zh';
    } else if (direction === 'en-to-zh' && zhMut.variants.length < 3 && enMut.variants.length >= 3) {
      direction = 'zh-to-en';
    }

    if (direction === 'zh-to-en') {
      const distractors = [...enMut.variants];
      const fallbackPool = shuffleArray(
        chapter.sentences.filter((other) => other.id !== s.id && other.arabic !== s.arabic)
      );
      for (const fb of fallbackPool) {
        if (distractors.length >= 3) break;
        if (!distractors.includes(fb.arabic)) {
          distractors.push(fb.arabic);
        }
      }

      const trapHint =
        enMut.tagsUsed.length > 0
          ? `Watch closely for swapped ${enMut.tagsUsed.slice(0, 3).join(' / ')} details among the choices.`
          : 'Compare every pronoun, time word, and verb carefully against the Chinese original.';

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

    // EN -> ZH with closely mutated Chinese sentences
    const distractors = [...zhMut.variants];
    const fallbackPool = shuffleArray(
      chapter.sentences.filter((other) => other.id !== s.id && other.hanzi !== s.hanzi)
    );
    for (const fb of fallbackPool) {
      if (distractors.length >= 3) break;
      if (!distractors.includes(fb.hanzi)) {
        distractors.push(fb.hanzi);
      }
    }

    const trapHint =
      zhMut.tagsUsed.length > 0
        ? `Check the exact Chinese ${zhMut.tagsUsed.slice(0, 3).join(' / ')} characters — the distractors change just one key detail.`
        : 'Verify every pronoun, measure word, and time word against the English sentence.';

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
