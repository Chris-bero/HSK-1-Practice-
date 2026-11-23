export interface GrammarExample {
  id: string;
  hanzi: string;
  pinyin: string;
  arabic: string;
}

export interface GrammarPointCard {
  id: string;
  lessonId: number;
  lessonLabelZh: string;
  lessonTitleAr: string;
  titleAr: string;
  titleZh: string;
  formula: string;
  explanationAr: string;
  examTrapTipAr: string;
  examples: GrammarExample[];
}

export const GRAMMAR_COLLECTION_DATA: GrammarPointCard[] = [
  // ==================== 第1课 ====================
  {
    id: 'g-1-1',
    lessonId: 1,
    lessonLabelZh: '第1课',
    lessonTitleAr: 'Chapter 1',
    titleAr: 'Personal Pronouns & Polite Greetings',
    titleZh: '人称代词与礼貌问候',
    formula: '我 / 你 / 您 / 他 / 她  +  好！ (Plural: Pronoun + 们)',
    explanationAr:
      'Use singular personal pronouns (我 I, 你 you, 您 polite you, 他 he, 她 she), and attach the plural suffix 们 for people (我们, 你们, 他们, 同学们). Greet someone politely using "Name / Title + 好".',
    examTrapTipAr:
      'Exam trap: Never attach 们 to 您 (*您们 is incorrect); use 你们 or 大家 when politely addressing a group. Also omit 们 whenever a noun is preceded by a number (incorrect: *三个学生们; correct: 三个学生).',
    examples: [
      {
        id: 'g-1-1-e1',
        hanzi: '王老师，您好！',
        pinyin: 'Wáng lǎoshī, nín hǎo!',
        arabic: 'Hello, Teacher Wang!',
      },
      {
        id: 'g-1-1-e2',
        hanzi: '同学们，大家好！',
        pinyin: 'Tóngxuémen, dàjiā hǎo!',
        arabic: 'Hello, classmates! Hello, everyone!',
      },
      {
        id: 'g-1-1-e3',
        hanzi: '谢谢您！— 不客气。',
        pinyin: 'Xièxie nín! — Bú kèqi.',
        arabic: 'Thank you very much! — You’re welcome.',
      },
    ],
  },
  {
    id: 'g-1-2',
    lessonId: 1,
    lessonLabelZh: '第1课',
    lessonTitleAr: 'Chapter 1',
    titleAr: 'Yes/No Questions with 吗 & Elliptical Questions with 呢(1)',
    titleZh: '疑问助词“吗”与“呢(1)”',
    formula: 'Statement + 吗？  |  Noun / Pronoun + 呢？',
    explanationAr:
      'Place 吗 at the end of any declarative sentence to turn it into a yes/no question without changing word order. Place 呢(1) after a noun or pronoun to ask "What about...?" based on the preceding context.',
    examTrapTipAr:
      'Exam trap: Never combine 吗 with another question word such as 什么, 谁, or 哪 (incorrect: *你叫什么名字吗？; correct: 你叫什么名字？).',
    examples: [
      {
        id: 'g-1-2-e1',
        hanzi: '你好吗？— 我很好，你呢？',
        pinyin: 'Nǐ hǎo ma? — Wǒ hěn hǎo, nǐ ne?',
        arabic: 'How are you? — I’m very well, and you?',
      },
      {
        id: 'g-1-2-e2',
        hanzi: '他是学生吗？',
        pinyin: 'Tā shì xuéshēng ma?',
        arabic: 'Is he a student?',
      },
    ],
  },

  // ==================== 第2课 ====================
  {
    id: 'g-2-1',
    lessonId: 2,
    lessonLabelZh: '第2课',
    lessonTitleAr: 'Chapter 2',
    titleAr: 'Identity Sentences with 是 & Negation with 不是',
    titleZh: '“是”字句及其否定形式',
    formula: 'Subject + 是 / 不是 + Noun (Predicate)',
    explanationAr:
      'The verb 是 links a subject to a noun identifying them (identity, occupation, nationality). To negate, place 不 directly before 是; note the tone change to 2nd tone (bú shì).',
    examTrapTipAr:
      'Exam trap: Do not place 是 before descriptive adjectives! Incorrect: *我是很高兴; correct: 我很高兴 (use the degree adverb 很 before the adjective instead).',
    examples: [
      {
        id: 'g-2-1-e1',
        hanzi: '我是学生，不是老师。',
        pinyin: 'Wǒ shì xuéshēng, bú shì lǎoshī.',
        arabic: 'I am a student, not a teacher.',
      },
      {
        id: 'g-2-1-e2',
        hanzi: '她是王老师。',
        pinyin: 'Tā shì Wáng lǎoshī.',
        arabic: 'She is Teacher Wang.',
      },
    ],
  },
  {
    id: 'g-2-2',
    lessonId: 2,
    lessonLabelZh: '第2课',
    lessonTitleAr: 'Chapter 2',
    titleAr: 'Asking Names & "What" with 什么',
    titleZh: '疑问代词“什么”',
    formula: 'Subject + 叫 / 是 + 什么 (+ Noun)？',
    explanationAr:
      'The interrogative pronoun 什么 ("what") stays in the exact same slot where the answer belongs, without moving to the front. Use the fixed phrase "你叫什么名字？" to ask someone’s name.',
    examTrapTipAr:
      'Exam trap: Word order does not invert in Chinese questions — simply replace the unknown item with 什么 (你叫什么名字？ → 我叫李文).',
    examples: [
      {
        id: 'g-2-2-e1',
        hanzi: '请问，你叫什么名字？',
        pinyin: 'Qǐngwèn, nǐ jiào shénme míngzi?',
        arabic: 'Excuse me, what is your name?',
      },
      {
        id: 'g-2-2-e2',
        hanzi: '认识你我很高兴。',
        pinyin: 'Rènshi nǐ wǒ hěn gāoxìng.',
        arabic: 'I’m very pleased to meet you.',
      },
    ],
  },
  {
    id: 'g-2-3',
    lessonId: 2,
    lessonLabelZh: '第2课',
    lessonTitleAr: 'Chapter 2',
    titleAr: 'Demonstratives 这 / 那 & Possessive Particle 的',
    titleZh: '指示代词“这 / 那”与结构助词“的”',
    formula: '这 / 那 + 是 + …  |  Possessor / Modifier + 的 + Head Noun',
    explanationAr:
      'Use 这 ("this") for nearby items and 那 ("that") for distant items. The structural particle 的 links a possessor or modifier to the head noun, which always follows 的.',
    examTrapTipAr:
      'Key tip: 的 is often omitted with close family and personal ties (e.g., 我爸爸, 我家, 我同学), but is normally kept with objects (e.g., 我的手机, 我的书).',
    examples: [
      {
        id: 'g-2-3-e1',
        hanzi: '这是我的中文老师。',
        pinyin: 'Zhè shì wǒ de Zhōngwén lǎoshī.',
        arabic: 'This is my Chinese teacher.',
      },
      {
        id: 'g-2-3-e2',
        hanzi: '那不是我的书。',
        pinyin: 'Nà bú shì wǒ de shū.',
        arabic: 'That is not my book.',
      },
    ],
  },

  // ==================== 第3课 ====================
  {
    id: 'g-3-1',
    lessonId: 3,
    lessonLabelZh: '第3课',
    lessonTitleAr: 'Chapter 3',
    titleAr: 'Asking Nationality & Origin with 哪',
    titleZh: '疑问代词“哪”与国籍表达',
    formula: 'Subject + 是 + 哪国人？  |  Subject + 是 + Country + 人',
    explanationAr:
      'To express nationality, add 人 ("person") directly after a country name (中国人 Chinese, 法国人 French, 泰国人 Thai). To ask nationality, place 哪 ("which") before 国人.',
    examTrapTipAr:
      'Exam trap: Distinguish both the tone and shape of 哪 (nǎ = "which?", includes the mouth radical 口) from 那 (nà = "that", no 口).',
    examples: [
      {
        id: 'g-3-1-e1',
        hanzi: '你是哪国人？— 我是中国人。',
        pinyin: 'Nǐ shì nǎ guó rén? — Wǒ shì Zhōngguó rén.',
        arabic: 'What is your nationality? — I am Chinese.',
      },
      {
        id: 'g-3-1-e2',
        hanzi: '她不是法国人，她是泰国人。',
        pinyin: 'Tā bú shì Fǎguó rén, tā shì Tàiguó rén.',
        arabic: 'She is not French; she is Thai.',
      },
    ],
  },
  {
    id: 'g-3-2',
    lessonId: 3,
    lessonLabelZh: '第3课',
    lessonTitleAr: 'Chapter 3',
    titleAr: 'Adverbs 也 & 都 and the Emphatic Pattern 是……的',
    titleZh: '副词“也 / 都”与“是……的”结构',
    formula: 'Subject + 也 / 都 + Verb / Adj  |  Subject + 是 + … + 的',
    explanationAr:
      'The adverbs 也 ("also") and 都 ("all/both") always appear after the subject and before the verb or adjective. When used together, 也 always precedes 都 (也都). The 是……的 pattern emphasizes a detail or confirms a statement (是的).',
    examTrapTipAr:
      'Exam trap: Never put 也 at the end of a sentence as in English "too"! Incorrect: *我是学生也; correct: 我也是学生. Keep the fixed order 也 + 都 (我们也都).',
    examples: [
      {
        id: 'g-3-2-e1',
        hanzi: '我也是中国人。',
        pinyin: 'Wǒ yě shì Zhōngguó rén.',
        arabic: 'I am Chinese too.',
      },
      {
        id: 'g-3-2-e2',
        hanzi: '我们都是王老师的学生。',
        pinyin: 'Wǒmen dōu shì Wáng lǎoshī de xuéshēng.',
        arabic: 'We are all Teacher Wang’s students.',
      },
      {
        id: 'g-3-2-e3',
        hanzi: '是的，她是我姐姐。',
        pinyin: 'Shì de, tā shì wǒ jiějie.',
        arabic: 'Yes, she is my older sister.',
      },
    ],
  },

  // ==================== 第4课 ====================
  {
    id: 'g-4-1',
    lessonId: 4,
    lessonLabelZh: '第4课',
    lessonTitleAr: 'Chapter 4',
    titleAr: 'Asking Quantity with 几 & 多少',
    titleZh: '疑问代词“几”与“多少”',
    formula: '几 + Measure Word + Noun  |  多少 + (Measure Word) + Noun',
    explanationAr:
      'Use 几 when expecting a small number (typically under 10); it must be followed by a measure word. Use 多少 for larger or unknown numbers, prices, and phone numbers; its measure word is optional.',
    examTrapTipAr:
      'Exam trap: Never omit the measure word after 几 (incorrect: *你家有几人？; correct: 你家有几口人？). With 多少, both 多少学生 and 多少个学生 are acceptable.',
    examples: [
      {
        id: 'g-4-1-e1',
        hanzi: '你家有几口人？',
        pinyin: 'Nǐ jiā yǒu jǐ kǒu rén?',
        arabic: 'How many people are in your family?',
      },
      {
        id: 'g-4-1-e2',
        hanzi: '她有多少个学生？',
        pinyin: 'Tā yǒu duōshao gè xuéshēng?',
        arabic: 'How many students does she have?',
      },
    ],
  },
  {
    id: 'g-4-2',
    lessonId: 4,
    lessonLabelZh: '第4课',
    lessonTitleAr: 'Chapter 4',
    titleAr: 'Measure Words (个, 口) & 二 vs. 两',
    titleZh: '量词“个 / 口”与“二 / 两”的区别',
    formula: 'Number + Measure Word (个 / 口) + Noun',
    explanationAr:
      'In Chinese, a measure word links a number to a noun: 个 is the general measure word, while 口 counts family members. Always use 两 (not 二) for "two" directly before a measure word (两个人, 两口人, 两个小时).',
    examTrapTipAr:
      'Exam trap: Use 二 for counting, dates, ordinals, and phone numbers (二月, 第二, 十二), and use 两 directly before measure words (两个, 两本, 两杯).',
    examples: [
      {
        id: 'g-4-2-e1',
        hanzi: '我家有五口人：爸爸、妈妈、哥哥、妹妹和我。',
        pinyin: 'Wǒ jiā yǒu wǔ kǒu rén: bàba, māma, gēge, mèimei hé wǒ.',
        arabic: 'There are five people in my family: Dad, Mom, older brother, younger sister, and me.',
      },
      {
        id: 'g-4-2-e2',
        hanzi: '她有两个孩子，一个儿子，一个女儿。',
        pinyin: 'Tā yǒu liǎng gè háizi, yí gè érzi, yí gè nǚ’ér.',
        arabic: 'She has two children: one son and one daughter.',
      },
    ],
  },
  {
    id: 'g-4-3',
    lessonId: 4,
    lessonLabelZh: '第4课',
    lessonTitleAr: 'Chapter 4',
    titleAr: 'Asking & Stating Age with 岁 and 多大',
    titleZh: '年龄的提问与表达',
    formula: 'Subject + (今年) + Number + 岁  |  Subject + 几岁 / 多大了？',
    explanationAr:
      'Ask a young child’s age (under 10) with 几岁, and ask older children or adults with 多大. State age directly with "Number + 岁" without 是 or 个.',
    examTrapTipAr:
      'Exam trap: 岁 acts as its own measure word — never insert 个 before 岁 and never use 是 before an age (incorrect: *我是二十个岁; correct: 我今年二十岁).',
    examples: [
      {
        id: 'g-4-3-e1',
        hanzi: '你女儿今年几岁了？— 她今年六岁。',
        pinyin: 'Nǐ nǚ’ér jīnnián jǐ suì le? — Tā jīnnián liù suì.',
        arabic: 'How old is your daughter this year? — She is six years old.',
      },
      {
        id: 'g-4-3-e2',
        hanzi: '他今年多大？— 他今年二十岁。',
        pinyin: 'Tā jīnnián duō dà? — Tā jīnnián èrshí suì.',
        arabic: 'How old is he this year? — He is twenty years old.',
      },
    ],
  },

  // ==================== 第5课 ====================
  {
    id: 'g-5-1',
    lessonId: 5,
    lessonLabelZh: '第5课',
    lessonTitleAr: 'Chapter 5',
    titleAr: 'Expressing Dates & Days of the Week',
    titleZh: '日期与星期的表达',
    formula: '…年 + …月 + …日 / 号 + 星期一～六 / 星期日(天)',
    explanationAr:
      'Chinese dates always move from largest to smallest unit: Year (年) → Month (月) → Day (号 in speech, 日 in writing) → Weekday (星期 + 1–6; Sunday is 星期日 or 星期天).',
    examTrapTipAr:
      'Exam trap: Sunday is 星期日 or 星期天 — never *星期七! Months are simply "Number + 月" (九月 = September), and years are read digit by digit (2026年 = èr líng èr liù nián).',
    examples: [
      {
        id: 'g-5-1-e1',
        hanzi: '今天9月8号，星期天。',
        pinyin: 'Jīntiān jiǔ yuè bā hào, Xīngqītiān.',
        arabic: 'Today is September 8th, Sunday.',
      },
      {
        id: 'g-5-1-e2',
        hanzi: '明天星期一，我上班。',
        pinyin: 'Míngtiān Xīngqīyī, wǒ shàngbān.',
        arabic: 'Tomorrow is Monday; I go to work.',
      },
    ],
  },
  {
    id: 'g-5-2',
    lessonId: 5,
    lessonLabelZh: '第5课',
    lessonTitleAr: 'Chapter 5',
    titleAr: 'Nominal Predicate Sentences & Question Word 谁',
    titleZh: '名词谓语句与疑问代词“谁”',
    formula: 'Subject + Nominal Predicate (Date / Day / Age / Price)  |  谁 + Verb…？',
    explanationAr:
      'In nominal-predicate sentences, a noun phrase (date, day of the week, age, or price) serves directly as the predicate without 是 in affirmative statements, though 不是 is required in negation (今天不是星期五). Use 谁 ("who") to ask about people.',
    examTrapTipAr:
      'Exam tip: When negating a date or weekday sentence, you must reintroduce 不是: never say *今天不星期天; say 今天不是星期天.',
    examples: [
      {
        id: 'g-5-2-e1',
        hanzi: '今天星期几？— 今天星期日。',
        pinyin: 'Jīntiān Xīngqī jǐ? — Jīntiān Xīngqīrì.',
        arabic: 'What day of the week is today? — Today is Sunday.',
      },
      {
        id: 'g-5-2-e2',
        hanzi: '谁会做中国菜？— 我妈妈会做。',
        pinyin: 'Shéi huì zuò Zhōngguó cài? — Wǒ māma huì zuò.',
        arabic: 'Who knows how to cook Chinese food? — My mom does.',
      },
    ],
  },

  // ==================== 第6课 ====================
  {
    id: 'g-6-1',
    lessonId: 6,
    lessonLabelZh: '第6课',
    lessonTitleAr: 'Chapter 6',
    titleAr: 'Serial Verb Sentences (连动句): Purpose & Means',
    titleZh: '连动句（目的与方式）',
    formula: 'Subject + 去 / 来 + Place + Verb 2 (Purpose)  |  坐 + Transport + 去 + Place',
    explanationAr:
      'A serial verb sentence places two verbs in sequence for the same subject without a conjunction: the first verb states movement or method (去超市, 坐出租车) and the second states purpose or destination (买东西, 去西安饭店).',
    examTrapTipAr:
      'Exam trap: Chronological and logical order is strict! Means of transport (坐出租车) comes before going (去饭店), and going to a place (去超市) comes before the purpose (买水果). Never reverse them.',
    examples: [
      {
        id: 'g-6-1-e1',
        hanzi: '明天我想去超市买一些东西。',
        pinyin: 'Míngtiān wǒ xiǎng qù chāoshì mǎi yìxiē dōngxi.',
        arabic: 'Tomorrow I want to go to the supermarket to buy some things.',
      },
      {
        id: 'g-6-1-e2',
        hanzi: '我们坐出租车去西安饭店吧。',
        pinyin: 'Wǒmen zuò chūzūchē qù Xī’ān Fàndiàn ba.',
        arabic: 'Let’s take a taxi to Xi’an Restaurant.',
      },
    ],
  },
  {
    id: 'g-6-2',
    lessonId: 6,
    lessonLabelZh: '第6课',
    lessonTitleAr: 'Chapter 6',
    titleAr: 'Modal Verb 想 & Interrogative 怎么',
    titleZh: '能愿动词“想”与疑问代词“怎么”',
    formula: 'Subject + 想 / 不想 + Verb  |  Subject + 怎么 + Verb…？',
    explanationAr:
      'Place 想 before a verb to express desire or intention ("would like to / want to"), negated as 不想. Place 怎么 directly before a verb to ask how something is done or what mode of transport to use.',
    examTrapTipAr:
      'Exam trap: Distinguish 怎么 (before a verb, asking method: 怎么去？) from 怎么样 (usually sentence-final, asking opinion or condition: 天气怎么样？).',
    examples: [
      {
        id: 'g-6-2-e1',
        hanzi: '你明天想去哪儿？',
        pinyin: 'Nǐ míngtiān xiǎng qù nǎr?',
        arabic: 'Where would you like to go tomorrow?',
      },
      {
        id: 'g-6-2-e2',
        hanzi: '我们怎么去西安饭店？',
        pinyin: 'Wǒmen zěnme qù Xī’ān Fàndiàn?',
        arabic: 'How do we get to Xi’an Restaurant?',
      },
    ],
  },

  // ==================== 第7课 ====================
  {
    id: 'g-7-1',
    lessonId: 7,
    lessonLabelZh: '第7课',
    lessonTitleAr: 'Chapter 7',
    titleAr: 'Telling Clock Time (点, 分, 半, 零)',
    titleZh: '时间的表达（点、分、半、零）',
    formula: 'Time of Day (早上/上午/中午/下午/晚上) + Hour 点 + Minutes 分 / 半',
    explanationAr:
      'Express clock time with 点 for hours and 分 for minutes. Insert 零 before single-digit minutes (8:05 = 八点零五分). Use 半 for half-past (9:30 = 九点半), and always say 两点 for 2 o’clock.',
    examTrapTipAr:
      'Exam trap: 2 o’clock is 两点, never *二点! Time of day always precedes the clock hour (下午三点, never *三点下午). Also distinguish 分 (clock minute) from 分钟 (duration in minutes).',
    examples: [
      {
        id: 'g-7-1-e1',
        hanzi: '现在几点？— 现在上午九点半。',
        pinyin: 'Xiànzài jǐ diǎn? — Xiànzài shàngwǔ jiǔ diǎn bàn.',
        arabic: 'What time is it now? — It is 9:30 in the morning.',
      },
      {
        id: 'g-7-1-e2',
        hanzi: '我下午两点零五分下课。',
        pinyin: 'Wǒ xiàwǔ liǎng diǎn líng wǔ fēn xiàkè.',
        arabic: 'My class finishes at 2:05 in the afternoon.',
      },
    ],
  },
  {
    id: 'g-7-2',
    lessonId: 7,
    lessonLabelZh: '第7课',
    lessonTitleAr: 'Chapter 7',
    titleAr: 'Particles 吧 & 呢(2) and Position of Time Words',
    titleZh: '语气助词“吧 / 呢(2)”与时间词的位置',
    formula: 'Subject + Time + Verb + Object  |  Time + Subject + Verb',
    explanationAr:
      'Time expressions (现在, 明天, 上午九点) sit either directly after the subject or at the very start of the sentence — never at the end! Sentence-final 吧 softens suggestions ("let’s..."), while 呢(2) affirms an ongoing or noteworthy fact.',
    examTrapTipAr:
      'Exam trap: Never place a time word at the end of a sentence as in English (incorrect: *我去电影院晚上; correct: 我晚上去电影院 or 晚上我去电影院).',
    examples: [
      {
        id: 'g-7-2-e1',
        hanzi: '我们下午三点去电影院看电影吧！',
        pinyin: 'Wǒmen xiàwǔ sān diǎn qù diànyǐngyuàn kàn diànyǐng ba!',
        arabic: 'Let’s go to the cinema to watch a movie at 3:00 p.m.!',
      },
      {
        id: 'g-7-2-e2',
        hanzi: '我爸爸晚上八点才下班呢。',
        pinyin: 'Wǒ bàba wǎnshang bā diǎn cái xiàbān ne.',
        arabic: 'My dad doesn’t get off work until 8:00 p.m.',
      },
    ],
  },

  // ==================== 第8课 ====================
  {
    id: 'g-8-1',
    lessonId: 8,
    lessonLabelZh: '第8课',
    lessonTitleAr: 'Chapter 8',
    titleAr: 'Location Words (上, 下, 里, 外, 前, 后) & Preposition 在',
    titleZh: '方位词与介词“在”',
    formula: 'Noun + 上 / 下 / 里 / 外 / 前 / 后  |  Subject + 在 + Place + Verb',
    explanationAr:
      'Position words follow the reference noun (opposite of English prepositions): 桌子下 under the table, 房间外 outside the room, 学校前 in front of the school, 家里 inside the house. When a main verb is present, the location phrase "在 + Place" always precedes the verb.',
    examTrapTipAr:
      'Exam trap: Never place "在 + Location" after the action verb! Incorrect: *医生工作在医院; correct: 医生在医院工作 (The doctor works at the hospital).',
    examples: [
      {
        id: 'g-8-1-e1',
        hanzi: '小猫在桌子下。',
        pinyin: 'Xiǎo māo zài zhuōzi xià.',
        arabic: 'The little cat is under the table.',
      },
      {
        id: 'g-8-1-e2',
        hanzi: '胡医生在医院工作。',
        pinyin: 'Hú yīshēng zài yīyuàn gōngzuò.',
        arabic: 'Dr. Hu works at the hospital.',
      },
      {
        id: 'g-8-1-e3',
        hanzi: '书店在学校前边。',
        pinyin: 'Shūdiàn zài xuéxiào qiánbian.',
        arabic: 'The bookstore is in front of the school.',
      },
    ],
  },
  {
    id: 'g-8-2',
    lessonId: 8,
    lessonLabelZh: '第8课',
    lessonTitleAr: 'Chapter 8',
    titleAr: 'Modal Verb 能 (Practical Ability & Possibility)',
    titleZh: '能愿动词“能”',
    formula: 'Subject + 能 / 不能 + Verb + Object',
    explanationAr:
      'The modal verb 能 expresses practical ability or feasibility given current circumstances (whether you have time, health, or conditions to do something). Negate with 不能.',
    examTrapTipAr:
      'Exam trap: Contrast 会 (acquired skill learned through study: 会说汉语, 会做饭) with 能 (practical feasibility/circumstances: 今天不能去, 几点能到).',
    examples: [
      {
        id: 'g-8-2-e1',
        hanzi: '你什么时候能到饭店？',
        pinyin: 'Nǐ shénme shíhou néng dào fàndiàn?',
        arabic: 'When can you arrive at the restaurant?',
      },
      {
        id: 'g-8-2-e2',
        hanzi: '医生很忙，中午不能回家吃午饭。',
        pinyin: 'Yīshēng hěn máng, zhōngwǔ bù néng huí jiā chī wǔfàn.',
        arabic: 'The doctor is very busy and cannot go home for lunch at noon.',
      },
    ],
  },

  // ==================== 第9课 ====================
  {
    id: 'g-9-1',
    lessonId: 9,
    lessonLabelZh: '第9课',
    lessonTitleAr: 'Chapter 9',
    titleAr: 'Existential Sentences (存现句) with 有 and 是',
    titleZh: '存现句（“有”字句与“是”字句）',
    formula: 'Place + 有 / 没有 + Indefinite Item  |  Place + 是 + Specific Item',
    explanationAr:
      'To state that something exists in a location, put the location first, followed by 有 ("there is/are") and the item. Use 是 instead when identifying specifically what occupies that spot.',
    examTrapTipAr:
      'Exam trap: Do NOT put 在 before the location in a 有 existential sentence! Incorrect: *在椅子上有一本书; correct: 椅子上有一本书 (There is a book on the chair).',
    examples: [
      {
        id: 'g-9-1-e1',
        hanzi: '学校前边有一家电影院。',
        pinyin: 'Xuéxiào qiánbian yǒu yì jiā diànyǐngyuàn.',
        arabic: 'There is a cinema in front of the school.',
      },
      {
        id: 'g-9-1-e2',
        hanzi: '椅子上有一本书。',
        pinyin: 'Yǐzi shàng yǒu yì běn shū.',
        arabic: 'There is a book on the chair.',
      },
      {
        id: 'g-9-1-e3',
        hanzi: '房间外有一只小猫。',
        pinyin: 'Fángjiān wài yǒu yì zhī xiǎo māo.',
        arabic: 'There is a little cat outside the room.',
      },
    ],
  },
  {
    id: 'g-9-2',
    lessonId: 9,
    lessonLabelZh: '第9课',
    lessonTitleAr: 'Chapter 9',
    titleAr: 'Time-Before-Place Word Order & Ordinals with 第',
    titleZh: '时间与地点状语语序及序数词“第”',
    formula: 'Subject + Time + 在 + Place + Verb  |  第 + Number + MW + Noun',
    explanationAr:
      'When both time and location appear in one sentence, time always precedes place (golden order: Subject → Time → Place → Verb). Form ordinal numbers (1st, 2nd, 3rd…) by placing 第 directly before the number.',
    examTrapTipAr:
      'Exam trap: Always keep Time before Place (我白天在学校读书), and remember "second" is always 第二, never *第两!',
    examples: [
      {
        id: 'g-9-2-e1',
        hanzi: '我白天在学校学习，晚上在家看电视。',
        pinyin: 'Wǒ báitiān zài xuéxiào xuéxí, wǎnshang zài jiā kàn diànshì.',
        arabic: 'I study at school during the day and watch TV at home in the evening.',
      },
      {
        id: 'g-9-2-e2',
        hanzi: '这是我读的第一本中文书。',
        pinyin: 'Zhè shì wǒ dú de dì-yī běn Zhōngwén shū.',
        arabic: 'This is the first Chinese book I have read.',
      },
    ],
  },

  // ==================== 第10课 ====================
  {
    id: 'g-10-1',
    lessonId: 10,
    lessonLabelZh: '第10课',
    lessonTitleAr: 'Chapter 10',
    titleAr: 'Expressing Chinese Currency & Prices (元/角/分 & 块/毛/分)',
    titleZh: '人民币金额表达',
    formula: '…元/块 + …角/毛 + …分  |  …多少钱？',
    explanationAr:
      'For the main unit (yuan), use 元 in formal writing and 块 in everyday speech; for tenths of a yuan, use 角 (formal) or 毛 (spoken); for cents, use 分. Ask prices with 多少钱 ("how much?").',
    examTrapTipAr:
      'Exam tip: When buying fruit, 1 斤 (jin) equals 500 grams (half a kilogram). Say 两块 for 2 yuan (not *二块), while 12 yuan is 十二块.',
    examples: [
      {
        id: 'g-10-1-e1',
        hanzi: '这些苹果多少钱一斤？— 六块五。',
        pinyin: 'Zhèxiē píngguǒ duōshao qián yì jīn? — Liù kuài wǔ.',
        arabic: 'How much are these apples per jin? — Six yuan fifty.',
      },
      {
        id: 'g-10-1-e2',
        hanzi: '这件衣服两百元，不贵。',
        pinyin: 'Zhè jiàn yīfu liǎng bǎi yuán, bú guì.',
        arabic: 'This piece of clothing is 200 yuan; it’s not expensive.',
      },
    ],
  },
  {
    id: 'g-10-2',
    lessonId: 10,
    lessonLabelZh: '第10课',
    lessonTitleAr: 'Chapter 10',
    titleAr: 'Adjectival Predicate Sentences & 怎么样',
    titleZh: '形容词谓语句与“怎么样”',
    formula: 'Subject + 很 / 非常 / 不 + Adjective  |  Subject + 怎么样？',
    explanationAr:
      'Adjectives act directly as predicates without 是, but affirmative statements usually include a degree adverb like 很 or 非常 so the sentence does not sound contrastive. Place 怎么样 at the end to ask for an opinion or status.',
    examTrapTipAr:
      'Exam trap: To negate an adjective, put 不 directly before it without 很 (不贵, 不便宜); 不很 / 不太 softens the negation to "not very / not too".',
    examples: [
      {
        id: 'g-10-2-e1',
        hanzi: '这件衣服怎么样？— 非常好看，也很便宜。',
        pinyin: 'Zhè jiàn yīfu zěnmeyàng? — Fēicháng hǎokàn, yě hěn piányi.',
        arabic: 'What do you think of these clothes? — Very stylish, and also very cheap.',
      },
      {
        id: 'g-10-2-e2',
        hanzi: '那边的包子非常好吃。',
        pinyin: 'Nàbiān de bāozi fēicháng hǎochī.',
        arabic: 'The steamed buns over there are delicious.',
      },
    ],
  },

  // ==================== 第11课 ====================
  {
    id: 'g-11-1',
    lessonId: 11,
    lessonLabelZh: '第11课',
    lessonTitleAr: 'Chapter 11',
    titleAr: 'Progressive Aspect: Actions in Progress (在 / 正在 + Verb + 呢)',
    titleZh: '动作的进行（在 / 正在……呢）',
    formula: 'Subject + 在 / 正在 + Verb (+ Object) + (呢)  |  Negation: 没(在) + Verb',
    explanationAr:
      'To show an action happening right now, put 在 or 正在 before the verb and optionally add 呢 at the end of the sentence. Negate ongoing actions with 没 (or 没在), dropping 呢.',
    examTrapTipAr:
      'Exam trap: Negate the progressive aspect with 没, NOT 不! Incorrect: *他不在睡觉; correct: 他没在睡觉 or 他没睡觉呢.',
    examples: [
      {
        id: 'g-11-1-e1',
        hanzi: '还不知道，正在找呢。',
        pinyin: 'Hái bù zhīdào, zhèngzài zhǎo ne.',
        arabic: 'I don’t know yet — I’m looking for it right now.',
      },
      {
        id: 'g-11-1-e2',
        hanzi: '弟弟没起床呢，还在睡觉。',
        pinyin: 'Dìdi méi qǐchuáng ne, hái zài shuìjiào.',
        arabic: 'My younger brother hasn’t gotten up yet; he’s still sleeping.',
      },
    ],
  },
  {
    id: 'g-11-2',
    lessonId: 11,
    lessonLabelZh: '第11课',
    lessonTitleAr: 'Chapter 11',
    titleAr: 'Affirmative–Negative Questions (正反问) & Modal Verb 要',
    titleZh: '正反疑问句与能愿动词“要”',
    formula: 'V不V / V没V / Adj不Adj  |  Subject + 要 + Verb / Object',
    explanationAr:
      'Form A-not-A questions by pairing a verb or adjective with its negative form using 不 (present/habit) or 没 (past): 忙不忙？, 是不是？, 开车没开车？. The modal verb 要 expresses strong intent, ordering, or near-future plans.',
    examTrapTipAr:
      'Exam trap: Never add 吗 to the end of an A-not-A (正反问) question! Incorrect: *你忙不忙吗？; correct: 你忙不忙？ (or 你忙吗？).',
    examples: [
      {
        id: 'g-11-2-e1',
        hanzi: '你们学习忙不忙？',
        pinyin: 'Nǐmen xuéxí máng bu máng?',
        arabic: 'Are you busy with your studies?',
      },
      {
        id: 'g-11-2-e2',
        hanzi: '它是不是在超市后边？',
        pinyin: 'Tā shì bu shì zài chāoshì hòubian?',
        arabic: 'Isn’t it behind the supermarket?',
      },
      {
        id: 'g-11-2-e3',
        hanzi: '你开车没开车？— 我没开车。',
        pinyin: 'Nǐ kāichē méi kāichē? — Wǒ méi kāichē.',
        arabic: 'Did you drive your car or not? — I didn’t drive.',
      },
    ],
  },

  // ==================== 第12课 ====================
  {
    id: 'g-12-1',
    lessonId: 12,
    lessonLabelZh: '第12课',
    lessonTitleAr: 'Chapter 12',
    titleAr: 'Sentence-Final Change-of-State 了(1) & Its Negation',
    titleZh: '句末语气助词“了(1)”（变化）',
    formula: 'Affirmative: Clause + 了  |  Negative: Subject + 没(有) + Verb (no 了)',
    explanationAr:
      'Sentence-final 了(1) marks a new situation or change of state (下雨了 it started raining, 天冷了 the weather got cold, 我生病了 I fell ill). When negating that an event happened, use 没 and omit 了.',
    examTrapTipAr:
      'Classic exam trap: Never use 没 and 了 together in the same clause! Incorrect: *我昨天没去医院了; correct: 我昨天没去医院.',
    examples: [
      {
        id: 'g-12-1-e1',
        hanzi: '这里的天不太好，下雨了。',
        pinyin: 'Zhèlǐ de tiān bú tài hǎo, xià yǔ le.',
        arabic: 'The weather here isn’t great; it has started raining.',
      },
      {
        id: 'g-12-1-e2',
        hanzi: '我昨天去医院看病了。',
        pinyin: 'Wǒ zuótiān qù yīyuàn kànbìng le.',
        arabic: 'I went to the hospital to see a doctor yesterday.',
      },
      {
        id: 'g-12-1-e3',
        hanzi: '你昨天没来公司，生病了？',
        pinyin: 'Nǐ zuótiān méi lái gōngsī, shēngbìng le?',
        arabic: 'You didn’t come to the company yesterday — are you sick?',
      },
    ],
  },
  {
    id: 'g-12-2',
    lessonId: 12,
    lessonLabelZh: '第12课',
    lessonTitleAr: 'Chapter 12',
    titleAr: 'Exclamation 太……了, 有点儿 vs. 一点儿, and Subjectless Clauses',
    titleZh: '“太……了”、有点儿 / 一点儿 与非主谓句',
    formula: '太 + Adj + 了！  |  有点儿 + Adj  |  Verb + 一点儿 + Noun',
    explanationAr:
      'Use 太 + Adjective + 了 for strong exclamations (太冷了! Way too cold!). Subjectless sentences (非主谓句) state weather events directly with verb + object (下雨了, 下雪了).',
    examTrapTipAr:
      'Golden exam trap: 有点儿 precedes an adjective (often a complaint: 有点儿冷, 有点儿贵), while 一点儿 follows a verb before a noun or follows an adjective (喝一点儿水, 吃一点儿药).',
    examples: [
      {
        id: 'g-12-2-e1',
        hanzi: '昨天下雪了，太冷了！',
        pinyin: 'Zuótiān xià xuě le, tài lěng le!',
        arabic: 'It snowed yesterday — it’s freezing cold!',
      },
      {
        id: 'g-12-2-e2',
        hanzi: '雨有点儿大，我觉得很冷。',
        pinyin: 'Yǔ yǒudiǎnr dà, wǒ juéde hěn lěng.',
        arabic: 'The rain is a bit heavy; I feel very cold.',
      },
      {
        id: 'g-12-2-e3',
        hanzi: '你吃一点儿药，再多喝点儿热水。',
        pinyin: 'Nǐ chī yìdiǎnr yào, zài duō hē diǎnr rè shuǐ.',
        arabic: 'Take a little medicine, and drink some more hot water.',
      },
    ],
  },

  // ==================== 第13课 ====================
  {
    id: 'g-13-1',
    lessonId: 13,
    lessonLabelZh: '第13课',
    lessonTitleAr: 'Chapter 13',
    titleAr: 'Double-Object Sentences (双宾语句) with 给 and 问',
    titleZh: '双宾语句（给 / 问）',
    formula: 'Subject + 给 / 问 + Indirect Object (Person) + Direct Object (Thing)',
    explanationAr:
      'Verbs like 给 ("to give") and 问 ("to ask") take two consecutive objects without a preposition: the first object is always the person (recipient), and the second is the thing or question.',
    examTrapTipAr:
      'Exam trap: Person always comes before thing! Correct: 给我一杯茶; incorrect: *给一杯茶我. Same for 问您一个问题 ("ask you a question").',
    examples: [
      {
        id: 'g-13-1-e1',
        hanzi: '王老师，我可以再问您一个问题吗？',
        pinyin: 'Wáng lǎoshī, wǒ kěyǐ zài wèn nín yí gè wèntí ma?',
        arabic: 'Teacher Wang, may I ask you one more question?',
      },
      {
        id: 'g-13-1-e2',
        hanzi: '请给我一杯牛奶。',
        pinyin: 'Qǐng gěi wǒ yì bēi niúnǎi.',
        arabic: 'Please give me a glass of milk.',
      },
    ],
  },
  {
    id: 'g-13-2',
    lessonId: 13,
    lessonLabelZh: '第13课',
    lessonTitleAr: 'Chapter 13',
    titleAr: 'Modal Verb 可以 & "Verb + 一下" (Brief / Polite Action)',
    titleZh: '能愿动词“可以”与“动词 + 一下”',
    formula: 'Subject + 可以 + Verb…吗？  |  Subject + Verb + 一下 (+ Object)',
    explanationAr:
      'Use 可以 to politely request or grant permission ("May I...?"); refuse politely with 不能 or 不可以. Placing 一下 after a verb softens a request or indicates a brief, casual action ("take a quick look / ask briefly").',
    examTrapTipAr:
      'Exam tip: Negate permission requests with 不能 or 不可以 (never *没可以). Also note that 看一下 has nearly the same soft tone as 看看 ("take a quick look").',
    examples: [
      {
        id: 'g-13-2-e1',
        hanzi: '你可以打电话问一下。',
        pinyin: 'Nǐ kěyǐ dǎ diànhuà wèn yíxià.',
        arabic: 'You can give them a quick call to ask.',
      },
      {
        id: 'g-13-2-e2',
        hanzi: '我看一下。请给我一杯茶。',
        pinyin: 'Wǒ kàn yíxià. Qǐng gěi wǒ yì bēi chá.',
        arabic: 'Let me take a look. Please give me a cup of tea.',
      },
    ],
  },

  // ==================== 第14课 ====================
  {
    id: 'g-14-1',
    lessonId: 14,
    lessonLabelZh: '第14课',
    lessonTitleAr: 'Chapter 14',
    titleAr: 'Completion Aspect Particle 了(2) Directly After the Verb',
    titleZh: '动态助词“了(2)”（动作完成）',
    formula: 'Subject + Verb + 了 + (Number + MW / Modifier) + Object',
    explanationAr:
      'Place 了(2) directly after the verb to emphasize that the action was completed. When the object carries a quantifier or modifier (一个电影, 一些水果), post-verb 了(2) alone completes the sentence.',
    examTrapTipAr:
      'Exam trap: To negate a completed past action, place 没 before the verb and drop 了(2) completely! Incorrect: *我没看了一个电影; correct: 我没看电影.',
    examples: [
      {
        id: 'g-14-1-e1',
        hanzi: '我看了一个电影。',
        pinyin: 'Wǒ kànle yí gè diànyǐng.',
        arabic: 'I watched a movie.',
      },
      {
        id: 'g-14-1-e2',
        hanzi: '去年我和男朋友去了西安。',
        pinyin: 'Qùnián wǒ hé nánpéngyou qùle Xī’ān.',
        arabic: 'Last year my boyfriend and I went to Xi’an.',
      },
    ],
  },
  {
    id: 'g-14-2',
    lessonId: 14,
    lessonLabelZh: '第14课',
    lessonTitleAr: 'Chapter 14',
    titleAr: 'Separable Verbs (离合词) & 都 with Negation (都不 vs. 不都)',
    titleZh: '离合词与“都不 / 不都”',
    formula: 'Separable Verb (V + O): 上课 / 睡觉 / 说话  |  都不 (none) vs. 不都 (not all)',
    explanationAr:
      'Separable verbs (离合词) consist of a built-in verb + object pair (上课, 睡觉, 说话, 读书, 开车). They cannot take a second direct object immediately after them, and modifiers can be inserted between the two syllables (睡了一会儿觉, 上汉语课). With 都: 都不 means "none / all not", whereas 不都 means "not all (only some)".',
    examTrapTipAr:
      'Sharp exam trap: Distinguish "我们都不去" (None of us are going) from "我们不都去" (Not all of us are going — only some). For prohibitions, use 不要 + Verb (请大家不要说话!).',
    examples: [
      {
        id: 'g-14-2-e1',
        hanzi: '请大家不要说话！',
        pinyin: 'Qǐng dàjiā búyào shuōhuà!',
        arabic: 'Everyone, please don’t talk!',
      },
      {
        id: 'g-14-2-e2',
        hanzi: '我们都会写这些汉字了。',
        pinyin: 'Wǒmen dōu huì xiě zhèxiē Hànzì le.',
        arabic: 'We can all write these Chinese characters now.',
      },
      {
        id: 'g-14-2-e3',
        hanzi: '明年女儿上中学，儿子也上小学了。',
        pinyin: 'Míngnián nǚ’ér shàng zhōngxué, érzi yě shàng xiǎoxué le.',
        arabic: 'Next year our daughter starts middle school, and our son has started elementary school too.',
      },
    ],
  },

  // ==================== 第15课 ====================
  {
    id: 'g-15-1',
    lessonId: 15,
    lessonLabelZh: '第15课',
    lessonTitleAr: 'Chapter 15',
    titleAr: 'Coordinate Compound Sentences (……，还 / 也……)',
    titleZh: '并列复句（……，还 / 也……）',
    formula: 'Clause 1，还 / 也 + Clause 2 (Addition & Reinforcement)',
    explanationAr:
      'Link two parallel qualities or actions of the same subject using 也 ("also") for equality or 还 ("in addition / moreover") to reinforce and add a further positive detail.',
    examTrapTipAr:
      'Exam tip: Note that 都, 还, and 也 all sit directly before the verb or adjective in the second clause (这些菜都好吃，还很好看), never before the subject.',
    examples: [
      {
        id: 'g-15-1-e1',
        hanzi: '这些菜都好吃，还很好看。',
        pinyin: 'Zhèxiē cài dōu hǎochī, hái hěn hǎokàn.',
        arabic: 'All of these dishes are delicious, and they look great too.',
      },
      {
        id: 'g-15-1-e2',
        hanzi: '我爱吃中国菜，也喜欢做。',
        pinyin: 'Wǒ ài chī Zhōngguó cài, yě xǐhuan zuò.',
        arabic: 'I love eating Chinese food, and I enjoy cooking it too.',
      },
    ],
  },
  {
    id: 'g-15-2',
    lessonId: 15,
    lessonLabelZh: '第15课',
    lessonTitleAr: 'Chapter 15',
    titleAr: 'Expressing Time Duration (小时, 时间) & Travel Plans',
    titleZh: '时量表达与出行计划',
    formula: '…到 + Destination + 要 + Number + 个小时  |  Time + Subject + 去 + Place',
    explanationAr:
      'To express how long a trip or task takes, use 要 ("to take / require") followed by the duration (e.g., 九个小时 nine hours). Notice that 小时 requires the measure word 个 after a number.',
    examTrapTipAr:
      'Exam trap: 小时 always takes 个 (一个小时, 两个小时, 几个小时), unlike 天 (day) and 年 (year), which never take 个 (三天, 两年).',
    examples: [
      {
        id: 'g-15-2-e1',
        hanzi: '你们的飞机到北京要几个小时？— 九个小时。',
        pinyin: 'Nǐmen de fēijī dào Běijīng yào jǐ gè xiǎoshí? — Jiǔ gè xiǎoshí.',
        arabic: 'How many hours does your flight to Beijing take? — Nine hours.',
      },
      {
        id: 'g-15-2-e2',
        hanzi: '前几年我去了西安，今年我也想去北京。',
        pinyin: 'Qián jǐ nián wǒ qùle Xī’ān, jīnnián wǒ yě xiǎng qù Běijīng.',
        arabic: 'A few years ago I went to Xi’an; this year I want to go to Beijing too.',
      },
      {
        id: 'g-15-2-e3',
        hanzi: '明天我去大兴机场接家人。',
        pinyin: 'Míngtiān wǒ qù Dàxīng Jīchǎng jiē jiārén.',
        arabic: 'Tomorrow I’m going to Daxing Airport to pick up my family.',
      },
    ],
  },
];
