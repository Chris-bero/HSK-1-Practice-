import { FinalExamDialogueLine } from '../types';

export interface ReadingComprehensionItem {
  id: string;
  chapterId: number;
  format: 'dialogue' | 'passage';
  dialogueLines?: FinalExamDialogueLine[];
  passageHanzi?: string;
  passagePinyin?: string;
  questionEn: string;
  correctOption: string;
  distractors: [string, string, string];
  explanation: string;
}

/**
 * Curated Reading & Dialogue Comprehension Bank (60 items: 4 per chapter across Chapters 1–15).
 * Strictly aligned with each chapter's vocabulary, grammar patterns, and communicative situations.
 */
export const READING_COMPREHENSION_DATA: ReadingComprehensionItem[] = [
  // ===================== CHAPTER 1: Greetings & Introductions =====================
  {
    id: 'rc-ch1-1',
    chapterId: 1,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '王老师，您好！', pinyin: 'Wáng lǎoshī, nín hǎo!' },
      { speaker: 'B', hanzi: '你好！请进，请坐。', pinyin: 'Nǐ hǎo! Qǐng jìn, qǐng zuò.' },
    ],
    questionEn: 'Who is Speaker A addressing, and what does Speaker B invite them to do?',
    correctOption: 'Speaker A greets Teacher Wang politely, and Teacher Wang invites them to come in and sit down.',
    distractors: [
      'Speaker A greets a classmate, and the classmate says goodbye.',
      'Speaker A apologizes to Teacher Wang, and Teacher Wang asks them to stand up.',
      'Speaker A thanks Teacher Li, and Teacher Li invites them to come tomorrow.',
    ],
    explanation: '王老师您好 uses the polite form 您好 for Teacher Wang; 请进，请坐 means "Please come in, please sit down."',
  },
  {
    id: 'rc-ch1-2',
    chapterId: 1,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '对不起，老师！', pinyin: 'Duìbuqǐ, lǎoshī!' },
      { speaker: 'B', hanzi: '没关系，请坐吧。', pinyin: 'Méi guānxi, qǐng zuò ba.' },
    ],
    questionEn: 'What is happening in this short exchange?',
    correctOption: 'A student apologizes to the teacher, and the teacher reassures them that it is okay.',
    distractors: [
      'A student thanks the teacher, and the teacher says "You are welcome."',
      'A teacher apologizes to the class, and the students say goodbye.',
      'A student asks for the teacher’s name, and the teacher declines.',
    ],
    explanation: '对不起 means "I am sorry," and 没关系 is the standard reply meaning "That’s okay / No problem."',
  },
  {
    id: 'rc-ch1-3',
    chapterId: 1,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '同学们，再见！', pinyin: 'Tóngxuémen, zàijiàn!' },
      { speaker: 'B', hanzi: '谢谢老师！老师，明天见！', pinyin: 'Xièxie lǎoshī! Lǎoshī, míngtiān jiàn!' },
    ],
    questionEn: 'When will Speaker A and Speaker B see each other again?',
    correctOption: 'Tomorrow.',
    distractors: [
      'This evening.',
      'Next week.',
      'They are meeting for the first time right now.',
    ],
    explanation: 'The students reply 老师，明天见！(See you tomorrow, teacher!), confirming they will meet again tomorrow.',
  },
  {
    id: 'rc-ch1-4',
    chapterId: 1,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '谢谢你，小语！', pinyin: 'Xièxie nǐ, Xiǎoyǔ!' },
      { speaker: 'B', hanzi: '不客气！', pinyin: 'Bú kèqi!' },
    ],
    questionEn: 'Why does Speaker B say 不客气?',
    correctOption: 'Because Speaker A thanked Xiaoyu, and 不客气 means "You are welcome."',
    distractors: [
      'Because Speaker A apologized, and 不客气 means "Never mind."',
      'Because Speaker A said goodbye, and 不客气 means "See you later."',
      'Because Speaker A asked for help, and Speaker B is refusing politely.',
    ],
    explanation: '不客气 (bú kèqi) is the polite response to 谢谢 (thank you), meaning "You’re welcome."',
  },

  // ===================== CHAPTER 2: My Name Is Li Wen =====================
  {
    id: 'rc-ch2-1',
    chapterId: 2,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '请问，您贵姓？', pinyin: 'Qǐngwèn, nín guìxìng?' },
      { speaker: 'B', hanzi: '我姓王，叫王明。请问，你叫什么名字？', pinyin: 'Wǒ xìng Wáng, jiào Wáng Míng. Qǐngwèn, nǐ jiào shénme míngzi?' },
      { speaker: 'A', hanzi: '我叫李文，很高兴认识您。', pinyin: 'Wǒ jiào Lǐ Wén, hěn gāoxìng rènshi nín.' },
    ],
    questionEn: 'What is Speaker B’s family name (surname)?',
    correctOption: 'Wang (王).',
    distractors: [
      'Li (李).',
      'Chen (陈).',
      'Ming (明).',
    ],
    explanation: 'Speaker B explicitly states 我姓王，叫王明 (My surname is Wang, my full name is Wang Ming).',
  },
  {
    id: 'rc-ch2-2',
    chapterId: 2,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '请问，您是王老师吗？', pinyin: 'Qǐngwèn, nín shì Wáng lǎoshī ma?' },
      { speaker: 'B', hanzi: '不是，我不是王老师，我姓陈。', pinyin: 'Bú shì, wǒ bú shì Wáng lǎoshī, wǒ xìng Chén.' },
    ],
    questionEn: 'What can we conclude about Speaker B?',
    correctOption: 'Speaker B is not Teacher Wang; their surname is Chen.',
    distractors: [
      'Speaker B is Teacher Wang’s student named Chen.',
      'Speaker B is Teacher Wang.',
      'Speaker B is looking for Teacher Chen.',
    ],
    explanation: 'Speaker B negates with 不是，我不是王老师 and adds 我姓陈 (My surname is Chen).',
  },
  {
    id: 'rc-ch2-3',
    chapterId: 2,
    format: 'passage',
    passageHanzi: '大家好！我叫陈天中。我不是老师，我是学生。很高兴认识大家！',
    passagePinyin: 'Dàjiā hǎo! Wǒ jiào Chén Tiānzhōng. Wǒ bú shì lǎoshī, wǒ shì xuéshēng. Hěn gāoxìng rènshi dàjiā!',
    questionEn: 'What is Chen Tianzhong’s role?',
    correctOption: 'He is a student.',
    distractors: [
      'He is a Chinese teacher.',
      'He is a doctor.',
      'He is Teacher Wang’s older brother.',
    ],
    explanation: 'The passage states 我不是老师，我是学生 (I am not a teacher; I am a student).',
  },
  {
    id: 'rc-ch2-4',
    chapterId: 2,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '李文，他叫什么名字？', pinyin: 'Lǐ Wén, tā jiào shénme míngzi?' },
      { speaker: 'B', hanzi: '他叫大卫，他是我的同学。', pinyin: 'Tā jiào Dàwèi, tā shì wǒ de tóngxué.' },
    ],
    questionEn: 'Who is David (大卫)?',
    correctOption: 'He is Li Wen’s classmate.',
    distractors: [
      'He is Li Wen’s teacher.',
      'He is Speaker A’s brother.',
      'He is Li Wen’s surname.',
    ],
    explanation: 'Li Wen replies 他叫大卫，他是我的同学 (His name is David; he is my classmate).',
  },

  // ===================== CHAPTER 3: I Am Chinese =====================
  {
    id: 'rc-ch3-1',
    chapterId: 3,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '你是哪国人？', pinyin: 'Nǐ shì nǎ guó rén?' },
      { speaker: 'B', hanzi: '我是法国人。你呢？', pinyin: 'Wǒ shì Fǎguórén. Nǐ ne?' },
      { speaker: 'A', hanzi: '我是中国人，我的朋友是泰国人。', pinyin: 'Wǒ shì Zhōngguórén, wǒ de péngyou shì Tàiguórén.' },
    ],
    questionEn: 'What nationality is Speaker A’s friend?',
    correctOption: 'Thai (泰国人).',
    distractors: [
      'French (法国人).',
      'Chinese (中国人).',
      'The dialogue does not mention the friend’s nationality.',
    ],
    explanation: 'Speaker A is Chinese, Speaker B is French, and Speaker A says 我的朋友是泰国人 (My friend is Thai).',
  },
  {
    id: 'rc-ch3-2',
    chapterId: 3,
    format: 'passage',
    passageHanzi: '我叫家月，我是法国人。我的中文老师是中国人，她姓王。她是一个很好的老师。',
    passagePinyin: 'Wǒ jiào Jiāyuè, wǒ shì Fǎguórén. Wǒ de Zhōngwén lǎoshī shì Zhōngguórén, tā xìng Wáng. Tā shì yí gè hěn hǎo de lǎoshī.',
    questionEn: 'Which statement is TRUE according to the passage?',
    correctOption: 'Jiayue is French, and her Chinese teacher is a Chinese woman surnamed Wang.',
    distractors: [
      'Jiayue is Chinese, and her teacher is French.',
      'Teacher Wang is a French student.',
      'Jiayue does not have a Chinese teacher yet.',
    ],
    explanation: '我是法国人 identifies Jiayue as French, while 我的中文老师是中国人，她姓王 identifies her female Chinese teacher.',
  },
  {
    id: 'rc-ch3-3',
    chapterId: 3,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '他是你的中文老师吗？', pinyin: 'Tā shì nǐ de Zhōngwén lǎoshī ma?' },
      { speaker: 'B', hanzi: '不是，他是我的好朋友。他也是学生。', pinyin: 'Bú shì, tā shì wǒ de hǎo péngyou. Tā yě shì xuéshēng.' },
    ],
    questionEn: 'What is the relationship between Speaker B and the man they are talking about?',
    correctOption: 'He is Speaker B’s good friend and fellow student.',
    distractors: [
      'He is Speaker B’s Chinese teacher.',
      'He is Speaker B’s older brother.',
      'He is a teacher from China.',
    ],
    explanation: 'Speaker B clarifies 不是，他是我的好朋友。他也是学生 (No, he is my good friend; he is also a student).',
  },
  {
    id: 'rc-ch3-4',
    chapterId: 3,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '你忙吗？', pinyin: 'Nǐ máng ma?' },
      { speaker: 'B', hanzi: '我不太忙，你呢？', pinyin: 'Wǒ bú tài máng, nǐ ne?' },
      { speaker: 'A', hanzi: '我很忙。', pinyin: 'Wǒ hěn máng.' },
    ],
    questionEn: 'Who is very busy?',
    correctOption: 'Speaker A.',
    distractors: [
      'Speaker B.',
      'Both Speaker A and Speaker B are not busy.',
      'Neither of them is busy.',
    ],
    explanation: 'Speaker B says 我不太忙 (I am not very busy), while Speaker A says 我很忙 (I am very busy).',
  },

  // ===================== CHAPTER 4: I Have Two Children =====================
  {
    id: 'rc-ch4-1',
    chapterId: 4,
    format: 'passage',
    passageHanzi: '我家有四口人：爸爸、妈妈、哥哥和我。我没有妹妹，也没有弟弟。',
    passagePinyin: 'Wǒ jiā yǒu sì kǒu rén: bàba, māma, gēge hé wǒ. Wǒ méiyǒu mèimei, yě méiyǒu dìdi.',
    questionEn: 'How many siblings does the speaker have?',
    correctOption: 'One older brother.',
    distractors: [
      'One younger brother and one younger sister.',
      'Four brothers and sisters.',
      'No siblings at all.',
    ],
    explanation: 'The family of four consists of dad, mom, one older brother (哥哥), and the speaker; 没有妹妹，也没有弟弟 confirms no younger siblings.',
  },
  {
    id: 'rc-ch4-2',
    chapterId: 4,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '王老师有多少个学生？', pinyin: 'Wáng lǎoshī yǒu duōshao gè xuéshēng?' },
      { speaker: 'B', hanzi: '她有二十个学生：十二个法国学生，八个泰国学生。', pinyin: 'Tā yǒu èrshí gè xuéshēng: shí\'èr gè Fǎguó xuéshēng, bā gè Tàiguó xuéshēng.' },
    ],
    questionEn: 'How many Thai students does Teacher Wang have?',
    correctOption: '8 Thai students.',
    distractors: [
      '12 Thai students.',
      '20 Thai students.',
      '18 Thai students.',
    ],
    explanation: 'Teacher Wang has 20 students in total: 12 French students (十二个法国学生) and 8 Thai students (八个泰国学生).',
  },
  {
    id: 'rc-ch4-3',
    chapterId: 4,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '你有孩子吗？', pinyin: 'Nǐ yǒu háizi ma?' },
      { speaker: 'B', hanzi: '有，我有两个孩子：一个儿子，一个女儿。', pinyin: 'Yǒu, wǒ yǒu liǎng gè háizi: yí gè érzi, yí gè nǚ\'ér.' },
    ],
    questionEn: 'What children does Speaker B have?',
    correctOption: 'One son and one daughter.',
    distractors: [
      'Two sons.',
      'Two daughters.',
      'No children yet.',
    ],
    explanation: 'Speaker B says 一个儿子，一个女儿 (one son and one daughter), totaling two children (两个孩子).',
  },
  {
    id: 'rc-ch4-4',
    chapterId: 4,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '你今年多大？', pinyin: 'Nǐ jīnnián duō dà?' },
      { speaker: 'B', hanzi: '我今年二十岁。我弟弟今年十岁。', pinyin: 'Wǒ jīnnián èrshí suì. Wǒ dìdi jīnnián shí suì.' },
    ],
    questionEn: 'How old is Speaker B’s younger brother this year?',
    correctOption: '10 years old.',
    distractors: [
      '20 years old.',
      '12 years old.',
      '30 years old.',
    ],
    explanation: 'Speaker B is 20 (二十岁) and explicitly states 我弟弟今年十岁 (My younger brother is 10 years old this year).',
  },

  // ===================== CHAPTER 5: Today I Have a Day Off =====================
  {
    id: 'rc-ch5-1',
    chapterId: 5,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '今天几月几号？星期几？', pinyin: 'Jīntiān jǐ yuè jǐ hào? Xīngqījǐ?' },
      { speaker: 'B', hanzi: '今天九月八号，星期六。明天是星期日，我休息。', pinyin: 'Jīntiān jiǔ yuè bā hào, xīngqīliù. Míngtiān shì xīngqīrì, wǒ xiūxi.' },
    ],
    questionEn: 'When does Speaker B have a day off?',
    correctOption: 'Tomorrow, on Sunday (September 9th).',
    distractors: [
      'Today, on Saturday (September 8th).',
      'On August 9th.',
      'On Monday.',
    ],
    explanation: 'Today is Saturday, Sept. 8; Speaker B says 明天是星期日，我休息 (Tomorrow is Sunday, I rest / have a day off).',
  },
  {
    id: 'rc-ch5-2',
    chapterId: 5,
    format: 'passage',
    passageHanzi: '我的生日是三月一号。今年三月一号是星期五，我们那天上午上课，晚上和朋友一起吃饭。',
    passagePinyin: 'Wǒ de shēngrì shì sānyuè yī hào. Jīnnián sānyuè yī hào shì xīngqīwǔ, wǒmen nà tiān shàngwǔ shàngkè, wǎnshang hé péngyou yìqǐ chīfàn.',
    questionEn: 'When is the speaker’s birthday, and what will they do in the evening?',
    correctOption: 'March 1st; they will have dinner with friends in the evening.',
    distractors: [
      'January 3rd; they will go to class in the evening.',
      'March 10th; they will rest at home all day.',
      'May 1st; they will have class with friends in the evening.',
    ],
    explanation: '三月一号 is March 1st (month before day in Chinese), and 晚上和朋友一起吃饭 means eating dinner together with friends in the evening.',
  },
  {
    id: 'rc-ch5-3',
    chapterId: 5,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '昨天是九月七号吗？', pinyin: 'Zuótiān shì jiǔ yuè qī hào ma?' },
      { speaker: 'B', hanzi: '对，昨天是九月七号，今天是九月八号。', pinyin: 'Duì, zuótiān shì jiǔ yuè qī hào, jīntiān shì jiǔ yuè bā hào.' },
    ],
    questionEn: 'What is today’s date?',
    correctOption: 'September 8th.',
    distractors: [
      'September 7th.',
      'July 9th.',
      'August 9th.',
    ],
    explanation: 'Yesterday (昨天) was September 7th; today (今天) is 九月八号 (September 8th).',
  },
  {
    id: 'rc-ch5-4',
    chapterId: 5,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '我们星期一上课吗？', pinyin: 'Wǒmen xīngqīyī shàngkè ma?' },
      { speaker: 'B', hanzi: '星期一到星期五上课，星期六和星期天休息。', pinyin: 'Xīngqīyī dào xīngqīwǔ shàngkè, xīngqīliù hé xīngqītiān xiūxi.' },
    ],
    questionEn: 'Which days do they have class?',
    correctOption: 'Monday through Friday.',
    distractors: [
      'Only on Monday and Friday.',
      'Saturday and Sunday.',
      'Every day of the week.',
    ],
    explanation: '星期一到星期五上课 means classes run from Monday to Friday, while Saturday and Sunday are rest days.',
  },

  // ===================== CHAPTER 6: What Is Your Phone Number? =====================
  {
    id: 'rc-ch6-1',
    chapterId: 6,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '家月，你的手机号是多少？', pinyin: 'Jiāyuè, nǐ de shǒujī hào shì duōshao?' },
      { speaker: 'B', hanzi: '我的手机号是13552721160。你有微信吗？', pinyin: 'Wǒ de shǒujī hào shì yāo-sān-wǔ-wǔ-èr-qī-èr-yāo-yāo-liù-líng. Nǐ yǒu Wēixìn ma?' },
      { speaker: 'A', hanzi: '有，我们加一下微信吧！', pinyin: 'Yǒu, wǒmen jiā yíxià Wēixìn ba!' },
    ],
    questionEn: 'What does Speaker A suggest doing after getting Jiayue’s phone number?',
    correctOption: 'Adding each other on WeChat.',
    distractors: [
      'Buying a new mobile phone together.',
      'Calling Teacher Wang right away.',
      'Writing down a home address.',
    ],
    explanation: '我们加一下微信吧 means "Let’s add each other on WeChat!"',
  },
  {
    id: 'rc-ch6-2',
    chapterId: 6,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '你住在哪儿？', pinyin: 'Nǐ zhù zài nǎr?' },
      { speaker: 'B', hanzi: '我住在学校，3号楼405房间。', pinyin: 'Wǒ zhù zài xuéxiào, sān hào lóu sì-líng-wǔ fángjiān.' },
    ],
    questionEn: 'Where does Speaker B live?',
    correctOption: 'At the school, in Building 3, Room 405.',
    distractors: [
      'Outside the school, in Building 4, Room 305.',
      'At a hotel near Building 5.',
      'In Building 3, Room 504.',
    ],
    explanation: '3号楼 is Building 3, and 405房间 is Room 405 at the school (学校).',
  },
  {
    id: 'rc-ch6-3',
    chapterId: 6,
    format: 'passage',
    passageHanzi: '这是李文的电话号码。他住在二号楼二一八房间。今天他不在房间，你可以给他打电话。',
    passagePinyin: 'Zhè shì Lǐ Wén de diànhuà hàomǎ. Tā zhù zài èr hào lóu èr-yāo-bā fángjiān. Jīntiān tā bú zài fángjiān, nǐ kěyǐ gěi tā dǎ diànhuà.',
    questionEn: 'How can you reach Li Wen today?',
    correctOption: 'By calling him on the phone, because he is not in his room today.',
    distractors: [
      'By visiting Room 218 right now because he is waiting there.',
      'By going to Building 8, Room 212.',
      'He does not have a phone number.',
    ],
    explanation: '今天他不在房间，你可以给他打电话 explains he is not in his room today, so you can call him.',
  },
  {
    id: 'rc-ch6-4',
    chapterId: 6,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '请问，这是王老师的办公室电话吗？', pinyin: 'Qǐngwèn, zhè shì Wáng lǎoshī de bàngōngshì diànhuà ma?' },
      { speaker: 'B', hanzi: '不是，这是我的手机。王老师的电话是6230-8819。', pinyin: 'Bú shì, zhè shì wǒ de shǒujī. Wáng lǎoshī de diànhuà shì liù-èr-sān-líng bā-bā-yāo-jiǔ.' },
    ],
    questionEn: 'Which statement is accurate?',
    correctOption: 'Speaker A dialed Speaker B’s mobile phone by mistake, and Speaker B gives Teacher Wang’s number.',
    distractors: [
      'Speaker A reached Teacher Wang’s office directly.',
      'Speaker B refuses to share Teacher Wang’s number.',
      'Teacher Wang’s mobile number ends in 6230.',
    ],
    explanation: '不是，这是我的手机 shows it is Speaker B’s mobile, followed by Teacher Wang’s number 6230-8819.',
  },

  // ===================== CHAPTER 7: I Get Off Work at 6:30 PM =====================
  {
    id: 'rc-ch7-1',
    chapterId: 7,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '现在几点？', pinyin: 'Xiànzài jǐ diǎn?' },
      { speaker: 'B', hanzi: '早上八点四十。你几点上课？', pinyin: 'Zǎoshang bā diǎn sìshí. Nǐ jǐ diǎn shàngkè?' },
      { speaker: 'A', hanzi: '我上午十点十分有课。', pinyin: 'Wǒ shàngwǔ shí diǎn shí fēn yǒu kè.' },
    ],
    questionEn: 'What time does Speaker A have class?',
    correctOption: '10:10 AM.',
    distractors: [
      '8:40 AM.',
      '10:40 AM.',
      '8:10 AM.',
    ],
    explanation: 'It is currently 8:40 AM (早上八点四十), and Speaker A has class at 上午十点十分 (10:10 AM).',
  },
  {
    id: 'rc-ch7-2',
    chapterId: 7,
    format: 'passage',
    passageHanzi: '我爸爸上午八点上班，中午十二点吃午饭，晚上六点半下班。他每天七点回家。',
    passagePinyin: 'Wǒ bàba shàngwǔ bā diǎn shàngbān, zhōngwǔ shí\'èr diǎn chī wǔfàn, wǎnshang liù diǎn bàn xiàbān. Tā měitiān qī diǎn huíjiā.',
    questionEn: 'When does the speaker’s dad get off work, and when does he get home?',
    correctOption: 'He gets off work at 6:30 PM and gets home at 7:00 PM.',
    distractors: [
      'He gets off work at 7:00 PM and gets home at 6:30 PM.',
      'He starts work at 6:30 AM and gets home at 8:00 PM.',
      'He gets off work at 12:00 PM.',
    ],
    explanation: '晚上六点半下班 means getting off work at 6:30 PM, and 七点回家 means arriving home at 7:00 PM.',
  },
  {
    id: 'rc-ch7-3',
    chapterId: 7,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '你每天几点起床？', pinyin: 'Nǐ měitiān jǐ diǎn qǐchuáng?' },
      { speaker: 'B', hanzi: '星期一到星期五六点半起床，星期天八点半起床。', pinyin: 'Xīngqīyī dào xīngqīwǔ liù diǎn bàn qǐchuáng, xīngqītiān bā diǎn bàn qǐchuáng.' },
    ],
    questionEn: 'What time does Speaker B wake up on Sundays?',
    correctOption: '8:30.',
    distractors: [
      '6:30.',
      '8:00.',
      '7:30.',
    ],
    explanation: 'On weekdays Speaker B wakes up at 6:30 (六点半), but on Sundays (星期天) at 八点半 (8:30).',
  },
  {
    id: 'rc-ch7-4',
    chapterId: 7,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '差一刻十点，我们去上课吧！', pinyin: 'Chà yí kè shí diǎn, wǒmen qù shàngkè ba!' },
      { speaker: 'B', hanzi: '好的，我们走吧。', pinyin: 'Hǎo de, wǒmen zǒu ba.' },
    ],
    questionEn: 'What time is it right now?',
    correctOption: '9:45 (a quarter to ten).',
    distractors: [
      '10:15 (a quarter past ten).',
      '9:15 (a quarter past nine).',
      '10:30 (half past ten).',
    ],
    explanation: '差一刻十点 literally means "15 minutes short of 10 o’clock," which is 9:45.',
  },

  // ===================== CHAPTER 8: My Dad Also Works at the Hospital =====================
  {
    id: 'rc-ch8-1',
    chapterId: 8,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '房间外有一只小猫。', pinyin: 'Fángjiān wài yǒu yì zhī xiǎomāo.' },
      { speaker: 'B', hanzi: '我没看见，它在哪儿呢？', pinyin: 'Wǒ méi kànjiàn, tā zài nǎr ne?' },
      { speaker: 'A', hanzi: '它在桌子下呢。', pinyin: 'Tā zài zhuōzi xià ne.' },
    ],
    questionEn: 'Where is the kitten?',
    correctOption: 'Outside the room, under the table.',
    distractors: [
      'Inside the room, on top of the table.',
      'On the chair inside the bedroom.',
      'Speaker A could not see it either.',
    ],
    explanation: 'Speaker A says 房间外有一只小猫 (outside the room) and then points out 它在桌子下呢 (it is under the table).',
  },
  {
    id: 'rc-ch8-2',
    chapterId: 8,
    format: 'passage',
    passageHanzi: '我妈妈是医生，她在医院工作。我爸爸也在医院工作。我哥哥不在医院工作，他在公司工作。',
    passagePinyin: 'Wǒ māma shì yīshēng, tā zài yīyuàn gōngzuò. Wǒ bàba yě zài yīyuàn gōngzuò. Wǒ gēge bú zài yīyuàn gōngzuò, tā zài gōngsī gōngzuò.',
    questionEn: 'Where does the speaker’s older brother work?',
    correctOption: 'At a company (公司).',
    distractors: [
      'At the hospital (医院).',
      'At a school (学校).',
      'He does not work yet.',
    ],
    explanation: 'Both parents work at the hospital (在医院工作), whereas the older brother works at a company (在公司工作).',
  },
  {
    id: 'rc-ch8-3',
    chapterId: 8,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '我的中文书在哪儿？', pinyin: 'Wǒ de Zhōngwén shū zài nǎr?' },
      { speaker: 'B', hanzi: '不在桌子上，在椅子上呢。', pinyin: 'Bú zài zhuōzi shàng, zài yǐzi shàng ne.' },
    ],
    questionEn: 'Where is Speaker A’s Chinese book?',
    correctOption: 'On the chair.',
    distractors: [
      'On the table.',
      'Under the chair.',
      'Outside the room.',
    ],
    explanation: 'Speaker B rules out the table (不在桌子上) and says it is on the chair (在椅子上呢).',
  },
  {
    id: 'rc-ch8-4',
    chapterId: 8,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '桌子上有什么？', pinyin: 'Zhuōzi shàng yǒu shénme?' },
      { speaker: 'B', hanzi: '桌子上有一个杯子、两本书和一部手机。', pinyin: 'Zhuōzi shàng yǒu yí gè bēizi, liǎng běn shū hé yí bù shǒujī.' },
    ],
    questionEn: 'How many books are on the table?',
    correctOption: 'Two books.',
    distractors: [
      'One book.',
      'Three books.',
      'None — only a cup and a phone.',
    ],
    explanation: '两本书 clearly specifies two books alongside one cup and one mobile phone.',
  },

  // ===================== CHAPTER 9: I Study at School Tomorrow Morning =====================
  {
    id: 'rc-ch9-1',
    chapterId: 9,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '学校前边有一家电影院。', pinyin: 'Xuéxiào qiánbian yǒu yì jiā diànyǐngyuàn.' },
      { speaker: 'B', hanzi: '对。我们晚上去那个电影院看电影吧。', pinyin: 'Duì. Wǒmen wǎnshang qù nàge diànyǐngyuàn kàn diànyǐng ba.' },
      { speaker: 'A', hanzi: '好！我们七点在电影院外边见，好吗？', pinyin: 'Hǎo! Wǒmen qī diǎn zài diànyǐngyuàn wàibian jiàn, hǎo ma?' },
    ],
    questionEn: 'Where and when do they agree to meet?',
    correctOption: 'At 7:00 PM outside the cinema in front of the school.',
    distractors: [
      'At 7:00 AM inside the school library.',
      'At 8:00 PM behind the cinema.',
      'Inside the cinema at 6:00 PM.',
    ],
    explanation: 'They agree to meet at 7:00 PM (晚上...七点) outside the cinema (在电影院外边见), which is in front of the school.',
  },
  {
    id: 'rc-ch9-2',
    chapterId: 9,
    format: 'passage',
    passageHanzi: '明天上午我在学校学习中文。中午我在学校饭店吃午饭。下午三点我去书店买书。',
    passagePinyin: 'Míngtiān shàngwǔ wǒ zài xuéxiào xuéxí Zhōngwén. Zhōngwǔ wǒ zài xuéxiào fàndiàn chī wǔfàn. Xiàwǔ sān diǎn wǒ qù shūdiàn mǎi shū.',
    questionEn: 'What does the speaker plan to do at 3:00 PM tomorrow?',
    correctOption: 'Go to the bookstore to buy books.',
    distractors: [
      'Study Chinese at school.',
      'Eat lunch at the school cafeteria.',
      'Go to the cinema with classmates.',
    ],
    explanation: '下午三点我去书店买书 states that at 3:00 PM tomorrow they will go to the bookstore (书店) to buy books.',
  },
  {
    id: 'rc-ch9-3',
    chapterId: 9,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '请问，书店在学校里边吗？', pinyin: 'Qǐngwèn, shūdiàn zài xuéxiào lǐbian ma?' },
      { speaker: 'B', hanzi: '不在里边，书店在学校后边，超市旁边。', pinyin: 'Bú zài lǐbian, shūdiàn zài xuéxiào hòubian, chāoshì pángbiān.' },
    ],
    questionEn: 'Where is the bookstore located?',
    correctOption: 'Behind the school, next to the supermarket.',
    distractors: [
      'Inside the school, next to the classroom.',
      'In front of the school, opposite the cinema.',
      'Inside the supermarket.',
    ],
    explanation: 'Speaker B says 不在里边，书店在学校后边，超市旁边 (not inside; behind the school, next to the supermarket).',
  },
  {
    id: 'rc-ch9-4',
    chapterId: 9,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '你星期六上午去哪儿？', pinyin: 'Nǐ xīngqīliù shàngwǔ qù nǎr?' },
      { speaker: 'B', hanzi: '上午我在家休息，下午去超市买水果。', pinyin: 'Shàngwǔ wǒ zài jiā xiūxi, xiàwǔ qù chāoshì mǎi shuǐguǒ.' },
    ],
    questionEn: 'Where will Speaker B be on Saturday morning?',
    correctOption: 'Resting at home.',
    distractors: [
      'Buying fruit at the supermarket.',
      'Studying at school.',
      'Watching a movie at the cinema.',
    ],
    explanation: '上午我在家休息 states they will rest at home in the morning, and only go to the supermarket in the afternoon.',
  },

  // ===================== CHAPTER 10: The Apples Here Are Really Cheap! =====================
  {
    id: 'rc-ch10-1',
    chapterId: 10,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '请问，这儿的苹果多少钱一斤？', pinyin: 'Qǐngwèn, zhèr de píngguǒ duōshao qián yì jīn?' },
      { speaker: 'B', hanzi: '五块钱一斤，很便宜！你要几斤？', pinyin: 'Wǔ kuài qián yì jīn, hěn piányi! Nǐ yào jǐ jīn?' },
      { speaker: 'A', hanzi: '我要两斤。', pinyin: 'Wǒ yào liǎng jīn.' },
    ],
    questionEn: 'How much will Speaker A pay in total for the apples?',
    correctOption: '10 yuan (5 yuan per jin × 2 jin).',
    distractors: [
      '5 yuan.',
      '15 yuan.',
      '2 yuan.',
    ],
    explanation: 'Apples cost 五块钱一斤 (5 yuan per jin), and Speaker A buys 两斤 (2 jin), totaling 10 yuan.',
  },
  {
    id: 'rc-ch10-2',
    chapterId: 10,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '请问，有杯子吗？', pinyin: 'Qǐngwèn, yǒu bēizi ma?' },
      { speaker: 'B', hanzi: '有，大的三十块，小的十八块。', pinyin: 'Yǒu, dà de sānshí kuài, xiǎo de shíbā kuài.' },
      { speaker: 'A', hanzi: '大的太贵了，我买一个小的吧。', pinyin: 'Dà de tài guì le, wǒ mǎi yí gè xiǎo de ba.' },
    ],
    questionEn: 'Which cup does Speaker A decide to buy, and why?',
    correctOption: 'The small 18-yuan cup, because the large one is too expensive.',
    distractors: [
      'The large 30-yuan cup, because the small one is sold out.',
      'Both cups for 48 yuan.',
      'Neither cup, because both are too expensive.',
    ],
    explanation: 'Speaker A remarks 大的太贵了 (The large one is too expensive) and chooses 一个小的 (one small cup for 18 yuan).',
  },
  {
    id: 'rc-ch10-3',
    chapterId: 10,
    format: 'passage',
    passageHanzi: '这个超市的水果很新鲜，也不贵。我买了两斤苹果、一斤香蕉和一瓶牛奶，一共花了二十五块钱。',
    passagePinyin: 'Zhège chāoshì de shuǐguǒ hěn xīnxiān, yě bú guì. Wǒ mǎi le liǎng jīn píngguǒ, yì jīn xiāngjiāo hé yì píng niúnǎi, yígòng huā le èrshíwǔ kuài qián.',
    questionEn: 'How much did the speaker spend in total at the supermarket?',
    correctOption: '25 yuan.',
    distractors: [
      '15 yuan.',
      '35 yuan.',
      '20 yuan.',
    ],
    explanation: '一共花了二十五块钱 means "spent 25 yuan in total."',
  },
  {
    id: 'rc-ch10-4',
    chapterId: 10,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '这件衣服真好看！多少钱？', pinyin: 'Zhè jiàn yīfu zhēn hǎokàn! Duōshao qián?' },
      { speaker: 'B', hanzi: '二百块。今天打折，一百八十块。', pinyin: 'Èrbǎi kuài. Jīntiān dǎzhé, yìbǎi bāshí kuài.' },
    ],
    questionEn: 'How much does the piece of clothing cost today?',
    correctOption: '180 yuan (discounted from 200 yuan).',
    distractors: [
      '200 yuan.',
      '108 yuan.',
      '280 yuan.',
    ],
    explanation: 'Although the original price is 200 yuan (二百块), today it is discounted to 一百八十块 (180 yuan).',
  },

  // ===================== CHAPTER 11: I Am Studying at University =====================
  {
    id: 'rc-ch11-1',
    chapterId: 11,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '喂，李文，你什么时候能到饭店？', pinyin: 'Wéi, Lǐ Wén, nǐ shénme shíhou néng dào fàndiàn?' },
      { speaker: 'B', hanzi: '还不知道，正在找呢。它是不是在超市后边？', pinyin: 'Hái bù zhīdào, zhèngzài zhǎo ne. Tā shì bú shì zài chāoshì hòubian?' },
      { speaker: 'A', hanzi: '是的，你开车没开车？', pinyin: 'Shì de, nǐ kāichē méi kāichē?' },
    ],
    questionEn: 'What is Li Wen doing right now?',
    correctOption: 'Still looking for the restaurant behind the supermarket.',
    distractors: [
      'Already eating inside the restaurant.',
      'Shopping inside the supermarket.',
      'Studying at the university library.',
    ],
    explanation: '正在找呢 uses 正在...呢 to express an ongoing action: Li Wen is currently looking for the restaurant.',
  },
  {
    id: 'rc-ch11-2',
    chapterId: 11,
    format: 'passage',
    passageHanzi: '我家有两个孩子。我姐姐在读大学，她学习中文。我弟弟读中学，他每天下午四点半放学回家。',
    passagePinyin: 'Wǒ jiā yǒu liǎng gè háizi. Wǒ jiějie zài dú dàxué, tā xuéxí Zhōngwén. Wǒ dìdi dú zhōngxué, tā měitiān xiàwǔ sì diǎn bàn fàngxué huíjiā.',
    questionEn: 'Where is the speaker’s older sister studying, and what about the younger brother?',
    correctOption: 'The older sister is at university studying Chinese, and the younger brother is in middle school.',
    distractors: [
      'Both the older sister and younger brother are in elementary school.',
      'The older sister is in middle school, and the younger brother is at university.',
      'The older sister works at a hospital.',
    ],
    explanation: '姐姐在读大学 (university) and 弟弟读中学 (middle school).',
  },
  {
    id: 'rc-ch11-3',
    chapterId: 11,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '你在做什么呢？', pinyin: 'Nǐ zài zuò shénme ne?' },
      { speaker: 'B', hanzi: '我在写汉字呢，明天有汉语课。', pinyin: 'Wǒ zài xiě Hànzì ne, míngtiān yǒu Hànyǔ kè.' },
    ],
    questionEn: 'Why is Speaker B writing Chinese characters right now?',
    correctOption: 'Because Speaker B has Chinese class tomorrow.',
    distractors: [
      'Because Speaker B is writing a letter to their mom.',
      'Because Speaker B just finished Chinese class today.',
      'Because Speaker B is a Chinese teacher.',
    ],
    explanation: '我在写汉字呢 shows the current action ("writing Hanzi"), and 明天有汉语课 gives the reason ("there is Chinese class tomorrow").',
  },
  {
    id: 'rc-ch11-4',
    chapterId: 11,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '你坐公共汽车去学校吗？', pinyin: 'Nǐ zuò gōnggòng qìchē qù xuéxiào ma?' },
      { speaker: 'B', hanzi: '不，我今天坐出租车去，因为快迟到了。', pinyin: 'Bù, wǒ jīntiān zuò chūzūchē qù, yīnwèi kuài chídào le.' },
    ],
    questionEn: 'How is Speaker B going to school today?',
    correctOption: 'By taxi (出租车).',
    distractors: [
      'By bus (公共汽车).',
      'By train (火车).',
      'On foot.',
    ],
    explanation: 'Speaker B says 不，我今天坐出租车去 (No, today I am taking a taxi).',
  },

  // ===================== CHAPTER 12: It Snowed Yesterday =====================
  {
    id: 'rc-ch12-1',
    chapterId: 12,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '今天天气怎么样？', pinyin: 'Jīntiān tiānqì zěnmeyàng?' },
      { speaker: 'B', hanzi: '这里的天不太好，下雨了。', pinyin: 'Zhèlǐ de tiān bú tài hǎo, xiàyǔ le.' },
      { speaker: 'A', hanzi: '雨大吗？冷不冷？', pinyin: 'Yǔ dà ma? Lěng bu lěng?' },
      { speaker: 'B', hanzi: '雨不大，但是有点儿冷。', pinyin: 'Yǔ bú dà, dànshì yǒudiǎnr lěng.' },
    ],
    questionEn: 'What is the weather like at Speaker B’s location today?',
    correctOption: 'It is raining lightly and feels a bit cold.',
    distractors: [
      'It is snowing heavily and very warm.',
      'It is sunny and very hot.',
      'It is pouring heavily, but not cold at all.',
    ],
    explanation: '下雨了 (it rained / is raining), 雨不大 (the rain is not heavy), 但是有点儿冷 (but a bit cold).',
  },
  {
    id: 'rc-ch12-2',
    chapterId: 12,
    format: 'passage',
    passageHanzi: '昨天北京下雪了，太冷了！今天不下雪了，天气很好，也不太冷，我们下午去公园走走吧。',
    passagePinyin: 'Zuótiān Běijīng xiàxuě le, tài lěng le! Jīntiān bú xiàxuě le, tiānqì hěn hǎo, yě bú tài lěng, wǒmen xiàwǔ qù gōngyuán zǒuzou ba.',
    questionEn: 'How has Beijing’s weather changed from yesterday to today?',
    correctOption: 'Yesterday it snowed and was very cold, but today it stopped snowing and the weather is nice.',
    distractors: [
      'Yesterday it was warm, and today it started snowing heavily.',
      'It is snowing both yesterday and today.',
      'Today it is raining too hard to go to the park.',
    ],
    explanation: '昨天...下雪了，太冷了 contrasts with 今天不下雪了，天气很好 (today it is no longer snowing and the weather is good).',
  },
  {
    id: 'rc-ch12-3',
    chapterId: 12,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '明天天气好不好？我们去爬山吧。', pinyin: 'Míngtiān tiānqì hǎo bu hǎo? Wǒmen qù páshān ba.' },
      { speaker: 'B', hanzi: '天气预报说明天会下雨，我们星期天再去吧。', pinyin: 'Tiānqì yùbào shuō míngtiān huì xiàyǔ, wǒmen xīngqītiān zài qù ba.' },
    ],
    questionEn: 'Why does Speaker B suggest going on Sunday instead of tomorrow?',
    correctOption: 'Because the weather forecast says it will rain tomorrow.',
    distractors: [
      'Because Speaker B has work tomorrow.',
      'Because it is snowing on Sunday.',
      'Because Speaker B does not like hiking.',
    ],
    explanation: '天气预报说明天会下雨 ("The weather forecast says it will rain tomorrow") explains the postponement.',
  },
  {
    id: 'rc-ch12-4',
    chapterId: 12,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '今天太热了，我不想出去。', pinyin: 'Jīntiān tài rè le, wǒ bù xiǎng chūqù.' },
      { speaker: 'B', hanzi: '那我们在家喝茶、看电影吧。', pinyin: 'Nà wǒmen zài jiā hē chá, kàn diànyǐng ba.' },
    ],
    questionEn: 'Why does Speaker A not want to go out today?',
    correctOption: 'Because it is too hot today.',
    distractors: [
      'Because it is too cold today.',
      'Because it is raining outside.',
      'Because they have too much homework.',
    ],
    explanation: '今天太热了 means "Today is too hot," so Speaker B proposes staying home to drink tea and watch a movie.',
  },

  // ===================== CHAPTER 13: Please Give Me a Cup of Tea =====================
  {
    id: 'rc-ch13-1',
    chapterId: 13,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '王老师，我可以再问您一个问题吗？', pinyin: 'Wáng lǎoshī, wǒ kěyǐ zài wèn nín yí gè wèntí ma?' },
      { speaker: 'B', hanzi: '可以。你有什么问题？', pinyin: 'Kěyǐ. Nǐ yǒu shénme wèntí?' },
      { speaker: 'A', hanzi: '这个汉字怎么读？', pinyin: 'Zhège Hànzì zěnme dú?' },
    ],
    questionEn: 'What is the student asking Teacher Wang?',
    correctOption: 'Permission to ask one more question — specifically how to pronounce a Chinese character.',
    distractors: [
      'Permission to leave class early.',
      'How to write Teacher Wang’s surname.',
      'Whether the small shop sells mobile phones.',
    ],
    explanation: '再问您一个问题 asks to ask another question, and 这个汉字怎么读 asks how this character is read/pronounced.',
  },
  {
    id: 'rc-ch13-2',
    chapterId: 13,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '你好！你想喝点儿什么？茶还是牛奶？', pinyin: 'Nǐ hǎo! Nǐ xiǎng hē diǎnr shénme? Chá háishi niúnǎi?' },
      { speaker: 'B', hanzi: '请给我一杯热茶，谢谢。', pinyin: 'Qǐng gěi wǒ yì bēi rè chá, xièxie.' },
    ],
    questionEn: 'What does Speaker B order?',
    correctOption: 'A cup of hot tea.',
    distractors: [
      'A glass of cold milk.',
      'Two cups of coffee.',
      'A bottle of cold water.',
    ],
    explanation: '请给我一杯热茶 clearly requests one cup of hot tea.',
  },
  {
    id: 'rc-ch13-3',
    chapterId: 13,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '今天中午你想吃面条儿还是吃米饭？', pinyin: 'Jīntiān zhōngwǔ nǐ xiǎng chī miàntiáor háishi chī mǐfàn?' },
      { speaker: 'B', hanzi: '我不想吃米饭，请给我一碗面条儿和两个包子。', pinyin: 'Wǒ bù xiǎng chī mǐfàn, qǐng gěi wǒ yì wǎn miàntiáor hé liǎng gè bāozi.' },
    ],
    questionEn: 'What does Speaker B want to eat for lunch?',
    correctOption: 'A bowl of noodles and two steamed buns.',
    distractors: [
      'Cooked rice and two steamed buns.',
      'Only dumplings.',
      'A bowl of noodles and cooked rice.',
    ],
    explanation: 'Speaker B declines rice (不想吃米饭) and asks for 一碗面条儿和两个包子 (a bowl of noodles and two steamed buns).',
  },
  {
    id: 'rc-ch13-4',
    chapterId: 13,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '那个小店卖不卖手机？', pinyin: 'Nàge xiǎodiàn mài bu mài shǒujī?' },
      { speaker: 'B', hanzi: '不卖手机，只卖书和杯子。', pinyin: 'Bú mài shǒujī, zhǐ mài shū hé bēizi.' },
    ],
    questionEn: 'What does that small shop sell?',
    correctOption: 'Only books and cups (not mobile phones).',
    distractors: [
      'Mobile phones and cups.',
      'Tea, milk, and steamed buns.',
      'Only mobile phones.',
    ],
    explanation: '不卖手机，只卖书和杯子 states it does not sell phones, only books and cups.',
  },

  // ===================== CHAPTER 14: I Watched a Movie =====================
  {
    id: 'rc-ch14-1',
    chapterId: 14,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '你们上火车后看见王老师了吗？', pinyin: 'Nǐmen shàng huǒchē hòu kànjiàn Wáng lǎoshī le ma?' },
      { speaker: 'B', hanzi: '没看见。中午车开后，有些人在看书，有些人睡觉了，我看了一个电影。', pinyin: 'Méi kànjiàn. Zhōngwǔ chē kāi hòu, yǒuxiē rén zài kànshū, yǒuxiē rén shuìjiào le, wǒ kàn le yí gè diànyǐng.' },
    ],
    questionEn: 'What did Speaker B do after the train departed at noon?',
    correctOption: 'Watched a movie (and did not see Teacher Wang).',
    distractors: [
      'Met Teacher Wang and read a book together.',
      'Slept during the entire trip.',
      'Got off the train at noon.',
    ],
    explanation: 'Speaker B answers 没看见 (did not see Teacher Wang) and says 我看了一个电影 (I watched a movie).',
  },
  {
    id: 'rc-ch14-2',
    chapterId: 14,
    format: 'passage',
    passageHanzi: '昨天晚上我和同学去了饭店。我们吃了饺子和中国菜，都很好吃。吃完饭以后，我们坐出租车回学校了。',
    passagePinyin: 'Zuótiān wǎnshang wǒ hé tóngxué qù le fàndiàn. Wǒmen chī le jiǎozi hé Zhōngguó cài, dōu hěn hǎochī. Chī wán fàn yǐhòu, wǒmen zuò chūzūchē huí xuéxiào le.',
    questionEn: 'How did they return to school after dinner?',
    correctOption: 'By taxi.',
    distractors: [
      'By train.',
      'By bus.',
      'They walked back to school.',
    ],
    explanation: '吃完饭以后，我们坐出租车回学校了 states that after finishing dinner they took a taxi back to school.',
  },
  {
    id: 'rc-ch14-3',
    chapterId: 14,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '你昨天买衣服了吗？', pinyin: 'Nǐ zuótiān mǎi yīfu le ma?' },
      { speaker: 'B', hanzi: '没买衣服，但是买了两本中文书和一杯茶。', pinyin: 'Méi mǎi yīfu, dànshì mǎi le liǎng běn Zhōngwén shū hé yì bēi chá.' },
    ],
    questionEn: 'What did Speaker B buy yesterday?',
    correctOption: 'Two Chinese books and a cup of tea.',
    distractors: [
      'Clothes and two Chinese books.',
      'Nothing at all.',
      'One Chinese book and two cups of tea.',
    ],
    explanation: '没买衣服 negates buying clothes; 买了两本中文书和一杯茶 lists what Speaker B actually bought.',
  },
  {
    id: 'rc-ch14-4',
    chapterId: 14,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '李文去西安了吗？', pinyin: 'Lǐ Wén qù Xī\'ān le ma?' },
      { speaker: 'B', hanzi: '去了，他昨天坐火车去西安了，星期天回来。', pinyin: 'Qù le, tā zuótiān zuò huǒchē qù Xī\'ān le, xīngqītiān huílai.' },
    ],
    questionEn: 'How did Li Wen travel to Xi’an, and when is he returning?',
    correctOption: 'He went by train yesterday and will return on Sunday.',
    distractors: [
      'He flew by airplane today and will return on Saturday.',
      'He has not left for Xi’an yet.',
      'He went to Beijing by train and will return tomorrow.',
    ],
    explanation: '他昨天坐火车去西安了，星期天回来 states he took the train yesterday and comes back on Sunday.',
  },

  // ===================== CHAPTER 15: See You at Daxing Airport! =====================
  {
    id: 'rc-ch15-1',
    chapterId: 15,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '你们爱吃哪个菜？', pinyin: 'Nǐmen ài chī nǎge cài?' },
      { speaker: 'B', hanzi: '我喜欢这个，也喜欢那个。这些菜都好吃，还很好看！', pinyin: 'Wǒ xǐhuan zhège, yě xǐhuan nàge. Zhèxiē cài dōu hǎochī, hái hěn hǎokàn!' },
    ],
    questionEn: 'What does Speaker B think about the dishes?',
    correctOption: 'All of the dishes are both delicious and visually appealing.',
    distractors: [
      'Speaker B only likes one of the dishes.',
      'The dishes look nice, but they are not delicious.',
      'The dishes are too expensive to order.',
    ],
    explanation: '这些菜都好吃，还很好看 uses 都 (all) and 还 (also/in addition) to praise both taste and appearance.',
  },
  {
    id: 'rc-ch15-2',
    chapterId: 15,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '你的飞机是明天几点？', pinyin: 'Nǐ de fēijī shì míngtiān jǐ diǎn?' },
      { speaker: 'B', hanzi: '下午三点。我们一点在大兴机场见吧！', pinyin: 'Xiàwǔ sān diǎn. Wǒmen yī diǎn zài Dàxīng jīchǎng jiàn ba!' },
    ],
    questionEn: 'When is Speaker B’s flight, and when will they meet at Daxing Airport?',
    correctOption: 'The flight is at 3:00 PM tomorrow, and they will meet at 1:00 PM.',
    distractors: [
      'The flight is at 1:00 PM tomorrow, and they will meet at 3:00 PM.',
      'The flight is at 3:00 AM today, and they will meet at the train station.',
      'The flight was yesterday afternoon.',
    ],
    explanation: 'The flight departs at 下午三点 (3:00 PM) tomorrow, and they agree to meet at 一点 (1:00 PM) at 大兴机场.',
  },
  {
    id: 'rc-ch15-3',
    chapterId: 15,
    format: 'passage',
    passageHanzi: '下个月我要坐飞机去北京旅游。北京有很多好吃的菜，还有很多好玩儿的地方。我非常高兴！',
    passagePinyin: 'Xià gè yuè wǒ yào zuò fēijī qù Běijīng lǚyóu. Běijīng yǒu hěn duō hǎochī de cài, hái yǒu hěn duō hǎowánr de dìfang. Wǒ fēicháng gāoxìng!',
    questionEn: 'How is the speaker traveling to Beijing next month, and why?',
    correctOption: 'By airplane for sightseeing/travel.',
    distractors: [
      'By train for a business meeting.',
      'By taxi to visit a hospital.',
      'By airplane to start elementary school.',
    ],
    explanation: '下个月我要坐飞机去北京旅游 clearly indicates flying (坐飞机) to Beijing next month for travel (旅游).',
  },
  {
    id: 'rc-ch15-4',
    chapterId: 15,
    format: 'dialogue',
    dialogueLines: [
      { speaker: 'A', hanzi: '怎么去大兴机场最快？', pinyin: 'Zěnme qù Dàxīng jīchǎng zuì kuài?' },
      { speaker: 'B', hanzi: '坐地铁很快，也不贵。开车有时候会堵车。', pinyin: 'Zuò dìtiě hěn kuài, yě bú guì. Kāichē yǒushíhou huì dǔchē.' },
    ],
    questionEn: 'Which mode of transport does Speaker B recommend for Daxing Airport?',
    correctOption: 'Taking the subway, because it is fast and inexpensive.',
    distractors: [
      'Driving a car, because it never hits traffic.',
      'Taking a bus, because the subway is too expensive.',
      'Walking, because the airport is next to the school.',
    ],
    explanation: '坐地铁很快，也不贵 recommends the subway as fast and affordable, noting driving can run into traffic.',
  },
];
