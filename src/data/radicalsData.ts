export interface RadicalItem {
  id: string;
  radical: string;
  pinyin: string;
  meaningAr: string;
  meaningEn: string;
  memoryTipAr: string;
  /** Exact simplified Hanzi characters appearing in our curriculum that contain this radical */
  matchChars: string[];
}

export const HSK_RADICALS_DATA: RadicalItem[] = [
  {
    id: 'rad-ren',
    radical: '亻',
    pinyin: 'rén zì páng',
    meaningAr: 'Person / Human',
    meaningEn: 'Person',
    memoryTipAr:
      'Resembles a person standing in profile — appears on the left of characters related to people, pronouns, and everyday human actions such as 你, 他, 们, 做, and 住.',
    matchChars: ['你', '们', '他', '休', '做', '住', '件', '便', '什', '候', '你'],
  },
  {
    id: 'rad-shui',
    radical: '氵',
    pinyin: 'sān diǎn shuǐ',
    meaningAr: 'Water / Liquid',
    meaningEn: 'Water',
    memoryTipAr:
      'Three droplets of water stacked on the left — appears in characters linked to liquids, flow, and Chinese language/culture such as 没, 法, 汉 (汉语), and 漂.',
    matchChars: ['没', '法', '汉', '漂', '泰'],
  },
  {
    id: 'rad-kou',
    radical: '口',
    pinyin: 'kǒu zì páng',
    meaningAr: 'Mouth / Speech / Eating',
    meaningEn: 'Mouth',
    memoryTipAr:
      'A square depicting an open mouth — appears in verbs of eating, drinking, singing, calling, and question particles such as 吃, 喝, 叫, 唱, 吗, 呢, and 吧.',
    matchChars: [
      '口', '叫', '吗', '呢', '吃', '喝', '唱', '听', '问', '吧',
      '喂', '哪', '哥', '同', '喜', '售', '员', '号', '商', '回', '只', '和',
    ],
  },
  {
    id: 'rad-yan',
    radical: '讠',
    pinyin: 'yán zì páng',
    meaningAr: 'Speech / Words / Language',
    meaningEn: 'Speech',
    memoryTipAr:
      'A dot over a vertical hook symbolizing spoken words — consistently linked to speaking, reading, lessons, and language such as 请, 谢, 说, 话, 认, 识, 读, 课, and 谁.',
    matchChars: ['请', '谢', '说', '话', '认', '识', '读', '课', '谁'],
  },
  {
    id: 'rad-nv',
    radical: '女',
    pinyin: 'nǚ zì páng',
    meaningAr: 'Woman / Female',
    meaningEn: 'Woman',
    memoryTipAr:
      'Depicts a seated woman — appears in female family members, the pronoun 她, and 好 (woman 女 + child 子 = good!).',
    matchChars: ['女', '她', '好', '妈', '姐', '妹', '奶'],
  },
  {
    id: 'rad-mu',
    radical: '木',
    pinyin: 'mù zì páng',
    meaningAr: 'Tree / Wood',
    meaningEn: 'Tree / Wood',
    memoryTipAr:
      'A tree trunk with branches and roots — appears in furniture, school, fruit, and cups such as 桌 (table), 椅 (chair), 杯 (cup), 校, 果, and 本.',
    matchChars: ['桌', '椅', '本', '校', '机', '休', '杯', '样', '果', '来'],
  },
  {
    id: 'rad-ri',
    radical: '日',
    pinyin: 'rì zì páng',
    meaningAr: 'Sun / Day / Time',
    meaningEn: 'Sun / Day',
    memoryTipAr:
      'A rectangular window representing the sun — appears in characters tied to time, morning, evening, and days such as 日, 明, 时, 早, 晚, 星, 昨, and 是.',
    matchChars: ['日', '明', '时', '早', '晚', '星', '昨', '是'],
  },
  {
    id: 'rad-yue',
    radical: '月',
    pinyin: 'yuè zì páng',
    meaningAr: 'Moon / Month / Body',
    meaningEn: 'Moon / Body',
    memoryTipAr:
      'A crescent moon with two inner strokes — marks months and time (月, 期, 明), friendship (朋 = two moons together), clothing (服), and body/mind (脑).',
    matchChars: ['月', '明', '期', '朋', '脑', '服', '能', '有', '胡'],
  },
  {
    id: 'rad-xin',
    radical: '心 / 忄',
    pinyin: 'xīn zì dǐ / shù xīn',
    meaningAr: 'Heart / Emotion / Thought',
    meaningEn: 'Heart / Mind',
    memoryTipAr:
      'Appears in two forms: 心 at the bottom (您 polite "you" from the heart, 想 think/miss, 怎, 息) or 忄 on the left (忙 busy: heart + losing focus).',
    matchChars: ['您', '想', '忙', '怎', '息'],
  },
  {
    id: 'rad-shou',
    radical: '扌',
    pinyin: 'tí shǒu páng',
    meaningAr: 'Hand / Manual Action',
    meaningEn: 'Hand',
    memoryTipAr:
      'A condensed form of hand (手) on the left — signals physical actions done with the hands such as 打 (call/hit), 找 (look for), and 接 (pick up/receive).',
    matchChars: ['打', '找', '接', '手'],
  },
  {
    id: 'rad-zouzhi',
    radical: '辶',
    pinyin: 'zǒu zhī páng',
    meaningAr: 'Walk / Movement / Path',
    meaningEn: 'Walk / Path',
    memoryTipAr:
      'Looks like a winding road or boat carrying the character — denotes direction, motion, and paths as in 这, 边, 还, and 道.',
    matchChars: ['这', '边', '还', '道'],
  },
  {
    id: 'rad-baogai',
    radical: '宀',
    pinyin: 'bǎo gài tóu',
    meaningAr: 'Roof / Home / Shelter',
    meaningEn: 'Roof / House',
    memoryTipAr:
      'Resembles the roof of a house overarching the character — appears in home, safety, hospitality, and writing such as 家 (home), 客 (guest), 安 (peace), 宜, 字, and 它.',
    matchChars: ['家', '客', '安', '宜', '字', '它'],
  },
  {
    id: 'rad-shi',
    radical: '饣',
    pinyin: 'shí zì páng',
    meaningAr: 'Food / Meal',
    meaningEn: 'Food / Eat',
    memoryTipAr:
      'A simplified food vessel on the left — immediately signals food, meals, or restaurants as in 饭 (meal/rice/restaurant) and 饺 (dumpling).',
    matchChars: ['饭', '饺'],
  },
  {
    id: 'rad-mu-eye',
    radical: '目',
    pinyin: 'mù zì páng',
    meaningAr: 'Eye / Sight / Sleep',
    meaningEn: 'Eye',
    memoryTipAr:
      'Depicts an eye with three horizontal lines — appears in seeing, sleeping, and truth such as 看 (hand 手 over eye 目 = look!), 睡 (sleep), and 真 (real/truly).',
    matchChars: ['看', '睡', '真'],
  },
  {
    id: 'rad-che',
    radical: '车',
    pinyin: 'chē zì páng',
    meaningAr: 'Vehicle / Car / Cart',
    meaningEn: 'Vehicle',
    memoryTipAr:
      'Depicts a wheeled carriage and axle — appears in land transport terms across the course including 车, 开车 (drive), 出租车 (taxi), and 火车 (train).',
    matchChars: ['车'],
  },
  {
    id: 'rad-men',
    radical: '门',
    pinyin: 'mén zì kuàng',
    meaningAr: 'Gate / Doorway',
    meaningEn: 'Gate / Door',
    memoryTipAr:
      'Resembles a double swinging door — notice the vivid logic: mouth 口 inside door 门 = 问 (ask), and sun 日 inside door 门 = 间 (room / space / time)!',
    matchChars: ['问', '间', '们'],
  },
  {
    id: 'rad-cao',
    radical: '艹',
    pinyin: 'cǎo zì tóu',
    meaningAr: 'Plant / Grass / Herbs',
    meaningEn: 'Grass / Plant',
    memoryTipAr:
      'Two tiny sprouts atop the character — marks plant-based or herbal items such as 菜 (vegetable/dish), 茶 (tea), 苹 (apple), and 药 (medicine).',
    matchChars: ['菜', '茶', '苹', '药'],
  },
  {
    id: 'rad-yu',
    radical: '雨',
    pinyin: 'yǔ zì tóu',
    meaningAr: 'Rain / Weather',
    meaningEn: 'Rain / Weather',
    memoryTipAr:
      'A cloud releasing four raindrops — appears in weather phenomena such as 雨 (rain), 下雨 (to rain), and 雪 (snow).',
    matchChars: ['雨', '雪'],
  },
  {
    id: 'rad-bei',
    radical: '贝',
    pinyin: 'bèi zì páng',
    meaningAr: 'Money / Trade / Value',
    meaningEn: 'Shell / Wealth',
    memoryTipAr:
      'Cowrie shells (贝) served as currency in ancient China — so this radical marks trade and value in 贵 (expensive), 买 (buy), 卖 (sell), 货, and 员.',
    matchChars: ['贵', '买', '卖', '货', '员'],
  },
  {
    id: 'rad-zu',
    radical: '足 / 走',
    pinyin: 'zú / zǒu zì dǐ',
    meaningAr: 'Foot / Stepping / Rising',
    meaningEn: 'Foot / Stepping',
    memoryTipAr:
      'The radicals 足 (foot) and 走 (walk/move) indicate foot motion or rising — seen in 起 (起床 get up, 对不起 sorry) and 超 (超市 supermarket).',
    matchChars: ['足', '起', '超', '路', '跑'],
  },
];
