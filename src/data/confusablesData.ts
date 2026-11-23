export type ConfusableCategory = 'visual-phonetic' | 'grammar-trap';

export interface ConfusableItem {
  hanzi: string;
  pinyin: string;
  meaningAr: string;
  hintAr?: string;
  /** Optional custom text for speech synthesis if different from display */
  audioText?: string;
}

export interface ConfusableExample {
  hanzi: string;
  pinyin: string;
  arabic: string;
}

export interface ConfusableGroup {
  id: string;
  category: ConfusableCategory;
  number: number;
  titleAr: string;
  chapterRef: string;
  items: ConfusableItem[];
  trapTipAr: string;
  examples: ConfusableExample[];
}

export interface ConfusableQuizQuestion {
  id: string;
  groupId: string;
  category: ConfusableCategory;
  promptZh: string;
  promptPinyin: string;
  promptAr: string;
  options: { hanzi: string; pinyin: string }[];
  correctIndex: number;
  explanationAr: string;
}

export const CONFUSABLE_GROUPS_DATA: ConfusableGroup[] = [
  // =========================================================================
  // Section A: Visual & Phonetic Confusables (10 core groups)
  // =========================================================================
  {
    id: 'vp-1-da-tai-tian',
    category: 'visual-phonetic',
    number: 1,
    titleAr: 'Big · Too / Extremely · Day / Sky',
    chapterRef: 'Chapters 2, 4, 11',
    items: [
      { hanzi: '大', pinyin: 'dà', meaningAr: 'big / large (size or age)', hintAr: 'No bottom dot or top horizontal bar' },
      { hanzi: '太', pinyin: 'tài', meaningAr: 'too / extremely (often with 了)', hintAr: 'Adds a single dot beneath 大' },
      { hanzi: '天', pinyin: 'tiān', meaningAr: 'day / sky / weather', hintAr: 'Adds a horizontal stroke above 大' },
    ],
    trapTipAr:
      'Watch the subtle stroke differences: 大 is the base shape; adding a bottom dot turns it into 太 (extremely), while adding a top horizontal bar like the sky above turns it into 天 (sky/day).',
    examples: [
      { hanzi: '今天天气太冷了！', pinyin: 'Jīntiān tiānqì tài lěng le!', arabic: 'Today’s weather is way too cold!' },
      { hanzi: '这个苹果很大。', pinyin: 'Zhège píngguǒ hěn dà.', arabic: 'This apple is very big.' },
    ],
  },
  {
    id: 'vp-2-mai-mai',
    category: 'visual-phonetic',
    number: 2,
    titleAr: 'To Buy · To Sell (Tone & Shape Trap)',
    chapterRef: 'Chapter 9',
    items: [
      { hanzi: '买', pinyin: 'mǎi', meaningAr: 'to buy', hintAr: '3rd tone (mǎi) — no 十 on top' },
      { hanzi: '卖', pinyin: 'mài', meaningAr: 'to sell', hintAr: '4th tone (mài) — carries 十 on top (extra goods to sell)' },
    ],
    trapTipAr:
      'One of the most famous HSK listening and reading traps! Remember: the seller 卖 has surplus stock (the 十 cross on top) and uses the sharp 4th tone mài, whereas the buyer 买 has no 十 and uses the 3rd tone mǎi.',
    examples: [
      { hanzi: '我想买两斤苹果。', pinyin: 'Wǒ xiǎng mǎi liǎng jīn píngguǒ.', arabic: 'I want to buy two jin (1 kg) of apples.' },
      { hanzi: '这个商店卖水果。', pinyin: 'Zhège shāngdiàn mài shuǐguǒ.', arabic: 'This shop sells fruit.' },
    ],
  },
  {
    id: 'vp-3-na-na',
    category: 'visual-phonetic',
    number: 3,
    titleAr: 'Which (Question) · That (Demonstrative)',
    chapterRef: 'Chapters 2, 7, 8',
    items: [
      { hanzi: '哪', pinyin: 'nǎ', meaningAr: 'which? / where (with 儿)', hintAr: 'Starts with mouth radical 口 (you ask with your mouth) — 3rd tone' },
      { hanzi: '那', pinyin: 'nà', meaningAr: 'that / there (with 儿)', hintAr: 'No mouth radical 口 — 4th tone' },
    ],
    trapTipAr:
      'If you see the mouth radical 口 on the left, it is a question word (哪国人? / 哪儿?). Without 口, it points to something far away (那个人 / 那儿).',
    examples: [
      { hanzi: '你是哪国人？', pinyin: 'Nǐ shì nǎ guó rén?', arabic: 'Which country are you from?' },
      { hanzi: '那个人是我的老师。', pinyin: 'Nàge rén shì wǒ de lǎoshī.', arabic: 'That person is my teacher.' },
    ],
  },
  {
    id: 'vp-4-ren-ba',
    category: 'visual-phonetic',
    number: 4,
    titleAr: 'Person · Number Eight',
    chapterRef: 'Chapters 2, 3',
    items: [
      { hanzi: '人', pinyin: 'rén', meaningAr: 'person / people', hintAr: 'The two strokes connect at the top' },
      { hanzi: '八', pinyin: 'bā', meaningAr: 'eight (8)', hintAr: 'The two strokes stay clearly separated at the top' },
    ],
    trapTipAr:
      'In 人 (person), the two strokes meet together like a figure standing upright; in 八 (eight), the two strokes remain open and apart at the top.',
    examples: [
      { hanzi: '我家有八个人。', pinyin: 'Wǒ jiā yǒu bā ge rén.', arabic: 'There are eight people in my family.' },
      { hanzi: '现在八点了。', pinyin: 'Xiànzài bā diǎn le.', arabic: 'It is eight o’clock now.' },
    ],
  },
  {
    id: 'vp-5-wu-niu',
    category: 'visual-phonetic',
    number: 5,
    titleAr: 'Noon (Time) · Cow / Milk',
    chapterRef: 'Chapters 4, 6, 9',
    items: [
      { hanzi: '午', pinyin: 'wǔ', meaningAr: 'noon (上午 / 中午 / 下午)', hintAr: 'Vertical stroke stops at the top horizontal line', audioText: '中午' },
      { hanzi: '牛', pinyin: 'niú', meaningAr: 'cow / ox (牛奶 milk)', hintAr: 'Vertical stroke pokes through the top like a cow’s horn', audioText: '牛奶' },
    ],
    trapTipAr:
      'Check the top of the vertical stroke: in 牛 (cow), it extends above the top bar like a horn; in 午 (time of day: 上午 morning, 中午 noon, 下午 afternoon), it stops cleanly at the bar.',
    examples: [
      { hanzi: '我上午喝一杯牛奶。', pinyin: 'Wǒ shàngwǔ hē yì bēi niúnǎi.', arabic: 'I drink a glass of milk in the morning.' },
      { hanzi: '中午十二点我们吃饭。', pinyin: 'Zhōngwǔ shí’èr diǎn wǒmen chīfàn.', arabic: 'We eat lunch at twelve noon.' },
    ],
  },
  {
    id: 'vp-6-wen-jian',
    category: 'visual-phonetic',
    number: 6,
    titleAr: 'To Ask / Question · Time / Room (Inside Door 门)',
    chapterRef: 'Chapters 4, 8, 12',
    items: [
      { hanzi: '问', pinyin: 'wèn', meaningAr: 'to ask (请问 / 问题)', hintAr: 'Mouth 口 inside door 门 → asking at the doorway', audioText: '问题' },
      { hanzi: '间', pinyin: 'jiān', meaningAr: 'space / time (时间 / 房间)', hintAr: 'Sun 日 inside door 门 → sunlight marks time and space', audioText: '时间' },
    ],
    trapTipAr:
      'Both characters share the gate radical 门, so focus on what sits inside: a mouth 口 means asking (问), while the sun 日 signals time or room space (时间 / 房间).',
    examples: [
      { hanzi: '请问，你现在有时间吗？', pinyin: 'Qǐngwèn, nǐ xiànzài yǒu shíjiān ma?', arabic: 'Excuse me, do you have time right now?' },
      { hanzi: '我有一个问题想问老师。', pinyin: 'Wǒ yǒu yí ge wèntí xiǎng wèn lǎoshī.', arabic: 'I have a question I want to ask the teacher.' },
    ],
  },
  {
    id: 'vp-7-ri-yue',
    category: 'visual-phonetic',
    number: 7,
    titleAr: 'Day / Sun · Month / Moon',
    chapterRef: 'Chapter 4',
    items: [
      { hanzi: '日', pinyin: 'rì', meaningAr: 'day (in dates) / sun', hintAr: 'Closed rectangle with a single middle bar' },
      { hanzi: '月', pinyin: 'yuè', meaningAr: 'month / moon', hintAr: 'Open at the bottom with two inner bars and a hooked leg' },
    ],
    trapTipAr:
      'In Chinese dates, month always comes before day (月 then 日 / 号): for example, 5月10日 means May 10, never October 5!',
    examples: [
      { hanzi: '今天是三月八日。', pinyin: 'Jīntiān shì sānyuè bārì.', arabic: 'Today is March 8th.' },
      { hanzi: '你的生日是几月几号？', pinyin: 'Nǐ de shēngrì shì jǐ yuè jǐ hào?', arabic: 'What month and day is your birthday?' },
    ],
  },
  {
    id: 'vp-8-shang-xia',
    category: 'visual-phonetic',
    number: 8,
    titleAr: 'Up / Start · Down / Finish',
    chapterRef: 'Chapters 4, 7, 8',
    items: [
      { hanzi: '上', pinyin: 'shàng', meaningAr: 'on / up / morning / start (上课 / 上午 / 桌子上面)', hintAr: 'Strokes rise above the baseline' },
      { hanzi: '下', pinyin: 'xià', meaningAr: 'under / afternoon / finish / next (下课 / 下午 / 下雨)', hintAr: 'Strokes hang downward beneath the top bar' },
    ],
    trapTipAr:
      'Common calendar trap: with weeks and months, 上 means "last / previous" (上个月 last month), whereas 下 means "next" (下个星期 next week) — often the opposite of what beginners guess!',
    examples: [
      { hanzi: '书在桌子上，猫在桌子下。', pinyin: 'Shū zài zhuōzi shàng, māo zài zhuōzi xià.', arabic: 'The book is on the table, and the cat is under the table.' },
      { hanzi: '我们上午八点上课，十二点下课。', pinyin: 'Wǒmen shàngwǔ bā diǎn shàngkè, shí’èr diǎn xiàkè.', arabic: 'We start class at 8:00 a.m. and finish at 12:00.' },
    ],
  },
  {
    id: 'vp-9-er-ji',
    category: 'visual-phonetic',
    number: 9,
    titleAr: 'Son / Suffix · How Many',
    chapterRef: 'Chapters 3, 5, 7',
    items: [
      { hanzi: '儿', pinyin: 'ér', meaningAr: 'son / suffix (儿子 / 哪儿 / 一点儿)', hintAr: 'Completely open at the top', audioText: '儿子' },
      { hanzi: '几', pinyin: 'jǐ', meaningAr: 'how many (small number) / several', hintAr: 'Closed across the top like a small table' },
    ],
    trapTipAr:
      'Learners frequently mix up 儿 and 几 when skimming: 几 (how many) is bridged across the top like a little stool, whereas 儿 stays open on top.',
    examples: [
      { hanzi: '你儿子今年几岁了？', pinyin: 'Nǐ érzi jīnnián jǐ suì le?', arabic: 'How old is your son this year?' },
      { hanzi: '你去哪儿？', pinyin: 'Nǐ qù nǎr?', arabic: 'Where are you going?' },
    ],
  },
  {
    id: 'vp-10-kan-ting',
    category: 'visual-phonetic',
    number: 10,
    titleAr: 'Action vs. Result of Perception (看/看见 · 听/听见)',
    chapterRef: 'Chapters 6, 10, 13',
    items: [
      { hanzi: '看', pinyin: 'kàn', meaningAr: 'to look / watch / read (the action)', hintAr: 'Focuses on looking, not perceiving' },
      { hanzi: '看见', pinyin: 'kànjiàn', meaningAr: 'to see (result: eyes caught sight of it)', hintAr: 'Verb + result complement 见' },
      { hanzi: '听', pinyin: 'tīng', meaningAr: 'to listen (the action)', hintAr: 'Focuses on listening, not hearing clearly' },
      { hanzi: '听见', pinyin: 'tīngjiàn', meaningAr: 'to hear (result: sound reached you)', hintAr: 'Verb + result complement 见' },
    ],
    trapTipAr:
      'Exam rule: use 看 with books or TV (看书 / 看电视), but when saying whether you spotted someone or something, use 看见 / 没看见. Likewise, contrast 听音乐 (listening to music) with 没听见 (did not hear).',
    examples: [
      { hanzi: '我没看见王老师。', pinyin: 'Wǒ méi kànjiàn Wáng lǎoshī.', arabic: 'I didn’t see Teacher Wang.' },
      { hanzi: '我在听音乐，没听见你说话。', pinyin: 'Wǒ zài tīng yīnyuè, méi tīngjiàn nǐ shuōhuà.', arabic: 'I was listening to music and didn’t hear you speaking.' },
    ],
  },

  // =========================================================================
  // Section B: Grammar & Usage Traps (10 recurring chapter exam traps)
  // =========================================================================
  {
    id: 'gt-1-bu-mei',
    category: 'grammar-trap',
    number: 1,
    titleAr: 'Negation with 不 vs. Negation with 没',
    chapterRef: 'Chapters 1, 5, 10',
    items: [
      { hanzi: '不', pinyin: 'bù', meaningAr: 'negates present, habits, future, adjectives, and 是', hintAr: 'Never used before 有' },
      { hanzi: '没', pinyin: 'méi', meaningAr: 'negates past actions (did not) and possession (没有)', hintAr: 'Drop 了 when negating with 没' },
    ],
    trapTipAr:
      'Two guaranteed exam traps: (1) Never say *不有 — always 没有. (2) When negating a past event with 没, omit 了: say 昨天我没去 (never *没去了).',
    examples: [
      { hanzi: '昨天我没去学校，明天我也不去。', pinyin: 'Zuótiān wǒ méi qù xuéxiào, míngtiān wǒ yě bú qù.', arabic: 'Yesterday I didn’t go to school, and tomorrow I won’t go either.' },
      { hanzi: '我没有哥哥，也不是老师。', pinyin: 'Wǒ méiyǒu gēge, yě bú shì lǎoshī.', arabic: 'I don’t have an older brother, and I am not a teacher either.' },
    ],
  },
  {
    id: 'gt-2-er-liang',
    category: 'grammar-trap',
    number: 2,
    titleAr: 'The Number Two: 二 vs. 两',
    chapterRef: 'Chapters 3, 4, 9',
    items: [
      { hanzi: '二', pinyin: 'èr', meaningAr: 'counting, compound numbers, dates, and ordinals', hintAr: '十二, 二十, 二月, 第二' },
      { hanzi: '两', pinyin: 'liǎng', meaningAr: 'before measure words and for 2 o’clock', hintAr: '两个人, 两点, 两本书, 两百' },
    ],
    trapTipAr:
      'Golden rule: whenever a measure word follows 2 (个, 本, 杯, 块, 点), use 两 (两点 two o’clock, 两个苹果 two apples). For 12, 20, dates, phone numbers, and ordinals, always use 二.',
    examples: [
      { hanzi: '现在两点，我要买两杯茶。', pinyin: 'Xiànzài liǎng diǎn, wǒ yào mǎi liǎng bēi chá.', arabic: 'It’s two o’clock now; I want to buy two cups of tea.' },
      { hanzi: '二月十二号我二十二岁。', pinyin: 'Èryuè shí’èr hào wǒ èrshí’èr suì.', arabic: 'On February 12th I turn twenty-two years old.' },
    ],
  },
  {
    id: 'gt-3-youdianr-yidianr',
    category: 'grammar-trap',
    number: 3,
    titleAr: '"A Little": 有点儿 vs. 一点儿',
    chapterRef: 'Chapters 9, 11, 13',
    items: [
      { hanzi: '有点儿', pinyin: 'yǒudiǎnr', meaningAr: 'a bit / somewhat (before adjectives, usually negative)', hintAr: 'Position: 有点儿 + Adjective' },
      { hanzi: '一点儿', pinyin: 'yìdiǎnr', meaningAr: 'a little (after verbs before nouns, or after adjectives)', hintAr: 'Position: Verb + 一点儿 + Noun' },
    ],
    trapTipAr:
      'Check the blank’s position! If the blank comes BEFORE an adjective (___贵, ___冷, ___累), choose 有点儿. If it comes AFTER a verb (喝___水, 会说___汉语) or after an adjective (小___), choose 一点儿.',
    examples: [
      { hanzi: '这件衣服有点儿贵。', pinyin: 'Zhè jiàn yīfu yǒudiǎnr guì.', arabic: 'This piece of clothing is a bit expensive.' },
      { hanzi: '我会说一点儿汉语。', pinyin: 'Wǒ huì shuō yìdiǎnr Hànyǔ.', arabic: 'I can speak a little Chinese.' },
    ],
  },
  {
    id: 'gt-4-hui-neng-keyi',
    category: 'grammar-trap',
    number: 4,
    titleAr: 'Modal Verbs of Ability & Permission: 会 · 能 · 可以',
    chapterRef: 'Chapters 6, 10, 12',
    items: [
      { hanzi: '会', pinyin: 'huì', meaningAr: 'learned skill (or future likelihood)', hintAr: '会说汉语 / 会做饭 / 会下雨' },
      { hanzi: '能', pinyin: 'néng', meaningAr: 'physical capacity or practical circumstances', hintAr: 'Too sick to go: 不能去' },
      { hanzi: '可以', pinyin: 'kěyǐ', meaningAr: 'permission / polite request ("may I?")', hintAr: '我可以坐这儿吗？' },
    ],
    trapTipAr:
      'Quick distinction: learned skills (cooking, swimming, languages) take 会; physical conditions/time/circumstances take 能; asking or granting permission takes 可以.',
    examples: [
      { hanzi: '我会写汉字，但是今天手疼不能写。', pinyin: 'Wǒ huì xiě Hànzì, dànshì jīntiān shǒu téng bù néng xiě.', arabic: 'I know how to write Chinese characters, but my hand hurts today so I can’t write.' },
      { hanzi: '请问，我可以坐在这儿吗？', pinyin: 'Qǐngwèn, wǒ kěyǐ zuò zài zhèr ma?', arabic: 'Excuse me, may I sit here?' },
    ],
  },
  {
    id: 'gt-5-xiang-yao',
    category: 'grammar-trap',
    number: 5,
    titleAr: 'Desire vs. Intent & Ordering: 想 vs. 要',
    chapterRef: 'Chapters 6, 9, 14',
    items: [
      { hanzi: '想', pinyin: 'xiǎng', meaningAr: 'would like to / feel like (softer mental wish)', hintAr: 'Negation: 不想 (don’t feel like)' },
      { hanzi: '要', pinyin: 'yào', meaningAr: 'want firmly / order at a shop or restaurant / will', hintAr: 'Direct order + noun: 我要一杯茶' },
    ],
    trapTipAr:
      'Watch the negation! The opposite of 要 (want to) is 不想, NOT 不要 — because 不要 means "Don’t!" (prohibition, e.g., 不要说话 Don’t talk!). Also, 要 can precede a noun directly (我要米饭), whereas 想 needs a verb (我想吃米饭).',
    examples: [
      { hanzi: '我想去中国学习汉语。', pinyin: 'Wǒ xiǎng qù Zhōngguó xuéxí Hànyǔ.', arabic: 'I would like to go to China to study Chinese.' },
      { hanzi: '服务员，我要一碗面条。', pinyin: 'Fúwùyuán, wǒ yào yì wǎn miàntiáo.', arabic: 'Waiter, I’d like a bowl of noodles.' },
    ],
  },
  {
    id: 'gt-6-zenme-zenmeyang',
    category: 'grammar-trap',
    number: 6,
    titleAr: '"How" (Method) vs. "How Is It?" (Opinion): 怎么 · 怎么样',
    chapterRef: 'Chapters 7, 11, 13',
    items: [
      { hanzi: '怎么', pinyin: 'zěnme', meaningAr: 'how? (placed before a verb to ask method or reason)', hintAr: '怎么去? / 怎么读? / 怎么了?' },
      { hanzi: '怎么样', pinyin: 'zěnmeyàng', meaningAr: 'how is it / what do you think? (at the end of a sentence)', hintAr: '天气怎么样? / 这本书怎么样?' },
    ],
    trapTipAr:
      'Instant exam cue: if a verb comes right after the blank (___走, ___写, ___去), always pick 怎么. If the blank sits at the end of the sentence asking for an opinion or status, pick 怎么样.',
    examples: [
      { hanzi: '请问，去火车站怎么走？', pinyin: 'Qǐngwèn, qù huǒchēzhàn zěnme zǒu?', arabic: 'Excuse me, how do I get to the train station?' },
      { hanzi: '北京的天气怎么样？', pinyin: 'Běijīng de tiānqì zěnmeyàng?', arabic: 'How is the weather in Beijing?' },
    ],
  },
  {
    id: 'gt-7-ji-duoshao',
    category: 'grammar-trap',
    number: 7,
    titleAr: 'Asking Quantity: 几 vs. 多少',
    chapterRef: 'Chapters 3, 5, 9',
    items: [
      { hanzi: '几', pinyin: 'jǐ', meaningAr: 'how many? (small numbers under 10; requires a measure word)', hintAr: '几口人 / 几个苹果 / 几点' },
      { hanzi: '多少', pinyin: 'duōshao', meaningAr: 'how many / how much? (any number, prices, phone numbers)', hintAr: '多少钱 / 多少学生' },
    ],
    trapTipAr:
      'Two quick rules: (1) Asking prices is always 多少钱, never *几钱. (2) 几 strictly requires a measure word (几本书), whereas 多少 may omit it (多少学生).',
    examples: [
      { hanzi: '你们班有多少学生？', pinyin: 'Nǐmen bān yǒu duōshao xuésheng?', arabic: 'How many students are in your class?' },
      { hanzi: '你家有几口人？', pinyin: 'Nǐ jiā yǒu jǐ kǒu rén?', arabic: 'How many people are in your family?' },
    ],
  },
  {
    id: 'gt-8-le1-le2',
    category: 'grammar-trap',
    number: 8,
    titleAr: 'Positions of 了: Sentence-Final (Change) vs. Post-Verb (Completion)',
    chapterRef: 'Chapters 10, 11, 15',
    items: [
      { hanzi: '了 (sentence-final)', pinyin: 'le', meaningAr: 'marks a new situation or change of state', hintAr: '下雨了 / 太冷了 / 八点了', audioText: '下雨了' },
      { hanzi: 'Verb + 了 + Num + Noun', pinyin: 'V + le + O', meaningAr: 'marks completion of an action with a quantified object', hintAr: '买了三本书 / 喝了一杯茶', audioText: '买了三本书' },
    ],
    trapTipAr:
      'When the object has a quantity or modifier (三本书 / 一杯咖啡), place 了 directly after the verb (买了三本书). When describing a new state (it got cold, it started raining), put 了 at the end of the sentence.',
    examples: [
      { hanzi: '天气冷了，快多穿点儿衣服。', pinyin: 'Tiānqì lěng le, kuài duō chuān diǎnr yīfu.', arabic: 'The weather has turned cold; hurry and put on warmer clothes.' },
      { hanzi: '昨天我在书店买了两本书。', pinyin: 'Zuótiān wǒ zài shūdiàn mǎi le liǎng běn shū.', arabic: 'Yesterday I bought two books at the bookstore.' },
    ],
  },
  {
    id: 'gt-9-doubu-budou',
    category: 'grammar-trap',
    number: 9,
    titleAr: 'Total Negation vs. Partial Negation: 都不 / 都没 · 不都 / 没都',
    chapterRef: 'Chapters 2, 10, 15',
    items: [
      { hanzi: '都不 / 都没', pinyin: 'dōu bù / dōu méi', meaningAr: 'total negation: none of them (all are not...)', hintAr: '都 comes first → 100% negative', audioText: '都不' },
      { hanzi: '不都 / 没都', pinyin: 'bù dōu / méi dōu', meaningAr: 'partial negation: not all of them (some are, some aren’t)', hintAr: '不 comes first → only some', audioText: '不都' },
    ],
    trapTipAr:
      'Classic reading comprehension trap! Compare: 我们都不是中国人 (None of us are Chinese) vs. 我们不都是中国人 (Not all of us are Chinese — some are, some aren’t).',
    examples: [
      { hanzi: '这些书我都还没看。', pinyin: 'Zhèxiē shū wǒ dōu hái méi kàn.', arabic: 'I haven’t read any of these books yet (total negation).' },
      { hanzi: '他们不都是大学生。', pinyin: 'Tāmen bù dōu shì dàxuéshēng.', arabic: 'Not all of them are university students (only some are).' },
    ],
  },
  {
    id: 'gt-10-zhengzai-le',
    category: 'grammar-trap',
    number: 10,
    titleAr: 'Ongoing Action vs. Completed Action: 在 / 正在...呢 · Verb + 了',
    chapterRef: 'Chapters 10, 13, 14',
    items: [
      { hanzi: '在 / 正在 + Verb + 呢', pinyin: 'zài / zhèngzài ... ne', meaningAr: 'action is in progress right now (present continuous)', hintAr: 'Never combined with 了 on the same verb', audioText: '正在学习呢' },
      { hanzi: 'Verb + 了', pinyin: 'V + le', meaningAr: 'action has already finished / completed', hintAr: 'Signals completion, not ongoing progress', audioText: '吃了饭' },
    ],
    trapTipAr:
      'Crucial exam alert: never combine the progressive marker 正在 / 呢 with the completion marker 了 on the same verb! If you see 正在 or 呢, the action is happening right now.',
    examples: [
      { hanzi: '妈妈正在做饭呢。', pinyin: 'Māma zhèngzài zuòfàn ne.', arabic: 'Mom is cooking right now (ongoing).' },
      { hanzi: '妈妈做好饭了。', pinyin: 'Māma zuòhǎo fàn le.', arabic: 'Mom has finished cooking the meal (completed).' },
    ],
  },
];

export const CONFUSABLES_QUIZ_QUESTIONS: ConfusableQuizQuestion[] = [
  {
    id: 'cq-1',
    groupId: 'vp-2-mai-mai',
    category: 'visual-phonetic',
    promptZh: '我想去水果店____两斤苹果。',
    promptPinyin: 'Wǒ xiǎng qù shuǐguǒdiàn ____ liǎng jīn píngguǒ.',
    promptAr: 'I want to go to the fruit shop to (buy) two jin of apples.',
    options: [
      { hanzi: '买', pinyin: 'mǎi' },
      { hanzi: '卖', pinyin: 'mài' },
      { hanzi: '读', pinyin: 'dú' },
    ],
    correctIndex: 0,
    explanationAr: 'The right choice is 买 (mǎi, "to buy"), which has no 十 on top; 卖 (mài) means "to sell".',
  },
  {
    id: 'cq-2',
    groupId: 'vp-3-na-na',
    category: 'visual-phonetic',
    promptZh: '请问，你是____国人？',
    promptPinyin: 'Qǐngwèn, nǐ shì ____ guó rén?',
    promptAr: 'Excuse me, (which) country are you from?',
    options: [
      { hanzi: '那', pinyin: 'nà' },
      { hanzi: '哪', pinyin: 'nǎ' },
      { hanzi: '呢', pinyin: 'ne' },
    ],
    correctIndex: 1,
    explanationAr: 'Because this is a question, choose 哪 (nǎ) with the mouth radical 口 on the left; 那 (nà) means "that".',
  },
  {
    id: 'cq-3',
    groupId: 'vp-1-da-tai-tian',
    category: 'visual-phonetic',
    promptZh: '今天的天气____热了！',
    promptPinyin: 'Jīntiān de tiānqì ____ rè le!',
    promptAr: 'Today’s weather is (too / extremely) hot!',
    options: [
      { hanzi: '大', pinyin: 'dà' },
      { hanzi: '天', pinyin: 'tiān' },
      { hanzi: '太', pinyin: 'tài' },
    ],
    correctIndex: 2,
    explanationAr: 'The pattern 太 + adjective + 了 expresses "too / extremely", distinguished by the dot beneath 大.',
  },
  {
    id: 'cq-4',
    groupId: 'vp-5-wu-niu',
    category: 'visual-phonetic',
    promptZh: '我每天上午喝一杯____奶。',
    promptPinyin: 'Wǒ měitiān shàngwǔ hē yì bēi ____ nǎi.',
    promptAr: 'Every morning I drink a glass of (milk).',
    options: [
      { hanzi: '午', pinyin: 'wǔ' },
      { hanzi: '牛', pinyin: 'niú' },
      { hanzi: '生', pinyin: 'shēng' },
    ],
    correctIndex: 1,
    explanationAr: 'Milk is 牛奶 (niúnǎi). Notice how the vertical stroke in 牛 extends above the top bar, unlike 午 (noon).',
  },
  {
    id: 'cq-5',
    groupId: 'vp-6-wen-jian',
    category: 'visual-phonetic',
    promptZh: '老师，我有一个____题想请教您。',
    promptPinyin: 'Lǎoshī, wǒ yǒu yí ge ____ tí xiǎng qǐngjiào nín.',
    promptAr: 'Teacher, I have a (question) I’d like to ask you.',
    options: [
      { hanzi: '间', pinyin: 'jiān' },
      { hanzi: '门', pinyin: 'mén' },
      { hanzi: '问', pinyin: 'wèn' },
    ],
    correctIndex: 2,
    explanationAr: '"Question" is 问题 (wèntí), using 问 (mouth 口 inside door 门), while 间 appears in 时间 (time) and 房间 (room).',
  },
  {
    id: 'cq-6',
    groupId: 'vp-10-kan-ting',
    category: 'visual-phonetic',
    promptZh: '房间里太暗了，我没____你的手机。',
    promptPinyin: 'Fángjiān lǐ tài àn le, wǒ méi ____ nǐ de shǒujī.',
    promptAr: 'The room is too dark; I didn’t (see) your phone.',
    options: [
      { hanzi: '看见', pinyin: 'kànjiàn' },
      { hanzi: '看', pinyin: 'kàn' },
      { hanzi: '听', pinyin: 'tīng' },
    ],
    correctIndex: 0,
    explanationAr: 'To express the result of seeing (or failing to spot) something, use 看见 / 没看见; 看 alone only means the action of looking.',
  },
  {
    id: 'cq-7',
    groupId: 'gt-1-bu-mei',
    category: 'grammar-trap',
    promptZh: '昨天我____去医院，今天才去。',
    promptPinyin: 'Zuótiān wǒ ____ qù yīyuàn, jīntiān cái qù.',
    promptAr: 'Yesterday I (did not) go to the hospital; I went today instead.',
    options: [
      { hanzi: '不', pinyin: 'bù' },
      { hanzi: '没', pinyin: 'méi' },
      { hanzi: '别', pinyin: 'bié' },
    ],
    correctIndex: 1,
    explanationAr: 'Because the sentence refers to 昨天 (yesterday), past-tense negation requires 没 (and no 了).',
  },
  {
    id: 'cq-8',
    groupId: 'gt-2-er-liang',
    category: 'grammar-trap',
    promptZh: '现在____点半，我买了____本书。',
    promptPinyin: 'Xiànzài ____ diǎn bàn, wǒ mǎi le ____ běn shū.',
    promptAr: 'It is (2):30 now, and I bought (two) books.',
    options: [
      { hanzi: '二 ... 二', pinyin: 'èr ... èr' },
      { hanzi: '两 ... 两', pinyin: 'liǎng ... liǎng' },
      { hanzi: '二 ... 两', pinyin: 'èr ... liǎng' },
    ],
    correctIndex: 1,
    explanationAr: 'Before 点 (2 o’clock) and before measure words like 本, always use 两: 两点半 and 两本书.',
  },
  {
    id: 'cq-9',
    groupId: 'gt-3-youdianr-yidianr',
    category: 'grammar-trap',
    promptZh: '这件衣服____大，有没有小一点儿的？',
    promptPinyin: 'Zhè jiàn yīfu ____ dà, yǒu méiyǒu xiǎo yìdiǎnr de?',
    promptAr: 'This piece of clothing is (a bit) big; do you have a slightly smaller one?',
    options: [
      { hanzi: '一点儿', pinyin: 'yìdiǎnr' },
      { hanzi: '有点儿', pinyin: 'yǒudiǎnr' },
      { hanzi: '几', pinyin: 'jǐ' },
    ],
    correctIndex: 1,
    explanationAr: 'The blank precedes the undesirable adjective 大 (too big), so use 有点儿 (whereas 一点儿 follows an adjective, as in 小一点儿).',
  },
  {
    id: 'cq-10',
    groupId: 'gt-4-hui-neng-keyi',
    category: 'grammar-trap',
    promptZh: '请问，我____在这儿拍照吗？',
    promptPinyin: 'Qǐngwèn, wǒ ____ zài zhèr pāizhào ma?',
    promptAr: 'Excuse me, (may) I take photos here?',
    options: [
      { hanzi: '可以', pinyin: 'kěyǐ' },
      { hanzi: '会', pinyin: 'huì' },
      { hanzi: '想', pinyin: 'xiǎng' },
    ],
    correctIndex: 0,
    explanationAr: 'For politely asking permission ("May I...?"), use 可以; 会 is used for learned skills.',
  },
  {
    id: 'cq-11',
    groupId: 'gt-5-xiang-yao',
    category: 'grammar-trap',
    promptZh: '服务员，我____一碗米饭和一杯茶。',
    promptPinyin: 'Fúwùyuán, wǒ ____ yì wǎn mǐfàn hé yì bēi chá.',
    promptAr: 'Waiter, I (would like / will have) a bowl of rice and a cup of tea.',
    options: [
      { hanzi: '想', pinyin: 'xiǎng' },
      { hanzi: '要', pinyin: 'yào' },
      { hanzi: '会', pinyin: 'huì' },
    ],
    correctIndex: 1,
    explanationAr: 'When ordering directly before a noun with no second verb, use 要 (我要一碗米饭); 想 requires a verb such as 我想吃米饭.',
  },
  {
    id: 'cq-12',
    groupId: 'gt-6-zenme-zenmeyang',
    category: 'grammar-trap',
    promptZh: '请问，这个汉字____读？',
    promptPinyin: 'Qǐngwèn, zhège Hànzì ____ dú?',
    promptAr: 'Excuse me, (how) is this Chinese character pronounced?',
    options: [
      { hanzi: '怎么样', pinyin: 'zěnmeyàng' },
      { hanzi: '怎么', pinyin: 'zěnme' },
      { hanzi: '什么', pinyin: 'shénme' },
    ],
    correctIndex: 1,
    explanationAr: 'Because the verb 读 (to read/pronounce) directly follows the blank, choose 怎么; 怎么样 sits at the end to ask opinions.',
  },
  {
    id: 'cq-13',
    groupId: 'gt-7-ji-duoshao',
    category: 'grammar-trap',
    promptZh: '请问，这件衣服____钱？',
    promptPinyin: 'Qǐngwèn, zhè jiàn yīfu ____ qián?',
    promptAr: 'Excuse me, (how much) does this piece of clothing cost?',
    options: [
      { hanzi: '几', pinyin: 'jǐ' },
      { hanzi: '多少', pinyin: 'duōshao' },
      { hanzi: '怎么', pinyin: 'zěnme' },
    ],
    correctIndex: 1,
    explanationAr: 'Asking a price in Chinese is always 多少钱; never use 几 directly before 钱.',
  },
  {
    id: 'cq-14',
    groupId: 'gt-9-doubu-budou',
    category: 'grammar-trap',
    promptZh: '他们____是中国人，有的是中国人，有的是英国人。',
    promptPinyin: 'Tāmen ____ shì Zhōngguórén, yǒude shì Zhōngguórén, yǒude shì Yīngguórén.',
    promptAr: '(Not all of them) are Chinese; some are Chinese and some are British.',
    options: [
      { hanzi: '都不', pinyin: 'dōu bù' },
      { hanzi: '不都', pinyin: 'bù dōu' },
      { hanzi: '都没', pinyin: 'dōu méi' },
    ],
    correctIndex: 1,
    explanationAr: 'Since some are Chinese and some are not, this is partial negation: 不都 ("not all"). 都不 means total negation ("none of them").',
  },
  {
    id: 'cq-15',
    groupId: 'gt-10-zhengzai-le',
    category: 'grammar-trap',
    promptZh: '别打扰他，他____看书呢。',
    promptPinyin: 'Bié dǎrǎo tā, tā ____ kànshū ne.',
    promptAr: 'Don’t disturb him; he (is currently) reading a book.',
    options: [
      { hanzi: '了', pinyin: 'le' },
      { hanzi: '正在', pinyin: 'zhèngzài' },
      { hanzi: '没', pinyin: 'méi' },
    ],
    correctIndex: 1,
    explanationAr: 'Sentence-final 呢 and the context "don’t disturb him" mark an ongoing action, requiring 正在 + verb + 呢.',
  },
];
