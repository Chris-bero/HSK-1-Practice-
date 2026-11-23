import { NumberedVocabEntry } from '../utils/exportVocabWord';

export type VocabCategoryId =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15;

export interface VocabCategoryDefinition {
  id: VocabCategoryId;
  anchorId: string;
  titleAr: string;
  titleEn: string;
}

export interface CategorizedVocabGroup {
  category: VocabCategoryDefinition;
  entries: NumberedVocabEntry[];
}

export const VOCAB_CATEGORIES: VocabCategoryDefinition[] = [
  {
    id: 1,
    anchorId: 'vocab-cat-1',
    titleAr: 'Greetings & Polite Expressions',
    titleEn: 'Greetings & Polite Expressions',
  },
  {
    id: 2,
    anchorId: 'vocab-cat-2',
    titleAr: 'Pronouns & Demonstratives',
    titleEn: 'Pronouns & Demonstratives',
  },
  {
    id: 3,
    anchorId: 'vocab-cat-3',
    titleAr: 'People, Family & Occupations',
    titleEn: 'People, Family & Occupations',
  },
  {
    id: 4,
    anchorId: 'vocab-cat-4',
    titleAr: 'Time & Date',
    titleEn: 'Time & Date',
  },
  {
    id: 5,
    anchorId: 'vocab-cat-5',
    titleAr: 'Places, Locations & Countries',
    titleEn: 'Places, Locations & Countries',
  },
  {
    id: 6,
    anchorId: 'vocab-cat-6',
    titleAr: 'Directions & Positions',
    titleEn: 'Directions & Positions',
  },
  {
    id: 7,
    anchorId: 'vocab-cat-7',
    titleAr: 'Common Verbs & Actions',
    titleEn: 'Common Verbs & Actions',
  },
  {
    id: 8,
    anchorId: 'vocab-cat-8',
    titleAr: 'Common Adjectives',
    titleEn: 'Common Adjectives',
  },
  {
    id: 9,
    anchorId: 'vocab-cat-9',
    titleAr: 'Adverbs, Prepositions & Conjunctions',
    titleEn: 'Adverbs, Prepositions & Conjunctions',
  },
  {
    id: 10,
    anchorId: 'vocab-cat-10',
    titleAr: 'Question Words & Interrogatives',
    titleEn: 'Question Words & Interrogatives',
  },
  {
    id: 11,
    anchorId: 'vocab-cat-11',
    titleAr: 'Measure Words & Quantifiers',
    titleEn: 'Measure Words & Quantifiers',
  },
  {
    id: 12,
    anchorId: 'vocab-cat-12',
    titleAr: 'Food & Drink',
    titleEn: 'Food & Drink',
  },
  {
    id: 13,
    anchorId: 'vocab-cat-13',
    titleAr: 'Objects & Common Nouns',
    titleEn: 'Objects & Common Nouns',
  },
  {
    id: 14,
    anchorId: 'vocab-cat-14',
    titleAr: 'Weather & Nature',
    titleEn: 'Weather & Nature',
  },
  {
    id: 15,
    anchorId: 'vocab-cat-15',
    titleAr: 'Numbers & Grammar Particles',
    titleEn: 'Numbers & Grammar Particles',
  },
];

/**
 * Curated thematic mapping for all 329 vocabulary entries in src/data/chaptersData.ts,
 * distinguishing polysemous entries by context (e.g., 在, 对, 那, 号, 家, 上, 下, 多, 几, 呢).
 */
const VOCAB_ID_TO_CATEGORY: Record<string, VocabCategoryId> = {
  // ===== Chapter 1 =====
  'c1-v1': 1, // 你好
  'c1-v2': 3, // 王老师
  'c1-v3': 2, // 大家
  'c1-v4': 8, // 好
  'c1-v5': 3, // 学生
  'c1-v6': 15, // 们
  'c1-v7': 3, // 老师
  'c1-v8': 2, // 您
  'c1-v9': 2, // 你们
  'c1-v10': 1, // 谢谢
  'c1-v11': 1, // 不客气
  'c1-v12': 3, // 同学
  'c1-v13': 1, // 再见

  // ===== Chapter 2 =====
  'c2-v1': 1, // 请问
  'c2-v2': 2, // 你
  'c2-v3': 7, // 叫
  'c2-v4': 2, // 什么
  'c2-v5': 13, // 名字
  'c2-v6': 2, // 我
  'c2-v7': 9, // 不
  'c2-v8': 7, // 是
  'c2-v9': 1, // 对不起
  'c2-v10': 1, // 没关系
  'c2-v11': 1, // 没事
  'c2-v12': 9, // 很
  'c2-v13': 8, // 高兴
  'c2-v14': 7, // 认识
  'c2-v15': 9, // 也

  // ===== Chapter 3 =====
  'c3-v1': 3, // 人
  'c3-v2': 15, // 的
  'c3-v3': 5, // 中国
  'c3-v4': 5, // 法国
  'c3-v5': 13, // 中文
  'c3-v6': 2, // 这
  'c3-v7': 2, // 谁
  'c3-v8': 3, // 女朋友
  'c3-v9': 2, // 哪
  'c3-v10': 5, // 国
  'c3-v11': 2, // 她
  'c3-v12': 5, // 泰国
  'c3-v13': 1, // 喂
  'c3-v14': 3, // 姐姐
  'c3-v15': 7, // 工作
  'c3-v16': 9, // 还
  'c3-v17': 8, // 忙
  'c3-v18': 10, // 吗
  'c3-v19': 8, // 对 (correct / yes)
  'c3-v20': 9, // 太
  'c3-v21': 2, // 我们
  'c3-v22': 7, // 想

  // ===== Chapter 4 =====
  'c4-v1': 7, // 有
  'c4-v2': 10, // 多少
  'c4-v3': 11, // 个
  'c4-v4': 3, // 哥哥
  'c4-v5': 10, // 呢 (question particle)
  'c4-v6': 7, // 没有
  'c4-v7': 5, // 家 (family / home)
  'c4-v8': 10, // 几 (how many)
  'c4-v9': 11, // 口
  'c4-v10': 3, // 爸爸
  'c4-v11': 3, // 妈妈
  'c4-v12': 3, // 妹妹
  'c4-v13': 9, // 和
  'c4-v14': 3, // 儿子
  'c4-v15': 3, // 孩子
  'c4-v16': 3, // 女儿
  'c4-v17': 11, // 岁
  'c4-v18': 2, // 他
  'c4-v19': 4, // 今年
  'c4-v20': 10, // 多 (how / to what extent)
  'c4-v21': 8, // 大

  // ===== Chapter 5 =====
  'c5-v1': 4, // 今天
  'c5-v2': 4, // 号 (day of month)
  'c5-v3': 4, // 月
  'c5-v4': 4, // 日
  'c5-v5': 4, // 星期
  'c5-v6': 4, // 星期日
  'c5-v7': 4, // 星期天
  'c5-v8': 7, // 休息
  'c5-v9': 7, // 会
  'c5-v10': 7, // 做饭
  'c5-v11': 7, // 做
  'c5-v12': 12, // 面条儿
  'c5-v13': 12, // 饺子
  'c5-v14': 11, // 一些
  'c5-v15': 12, // 菜
  'c5-v16': 7, // 下班
  'c5-v17': 8, // 新
  'c5-v18': 13, // 电脑
  'c5-v19': 9, // 真
  'c5-v20': 8, // 好看
  'c5-v21': 7, // 喜欢
  'c5-v22': 2, // 它

  // ===== Chapter 6 =====
  '6-1': 13, // 手机
  '6-2': 13, // 电话
  '6-3': 13, // 号 (number)
  '6-4': 4, // 明天
  '6-5': 7, // 去
  '6-6': 2, // 哪儿
  '6-7': 7, // 想
  '6-8': 5, // 超市
  '6-9': 7, // 买
  '6-10': 13, // 东西
  '6-11': 11, // 些
  '6-12': 12, // 牛奶
  '6-13': 7, // 吃
  '6-14': 12, // 晚饭
  '6-15': 2, // 那边
  '6-16': 12, // 包子
  '6-17': 9, // 非常
  '6-18': 8, // 好吃
  '6-19': 12, // 米饭
  '6-20': 10, // 怎么
  '6-21': 7, // 坐
  '6-22': 13, // 出租车
  '6-23': 5, // 西安饭店

  // ===== Chapter 7 =====
  '7-1': 4, // 现在
  '7-2': 4, // 点
  '7-3': 4, // 早上
  '7-4': 4, // 上午
  '7-5': 4, // 分
  '7-6': 13, // 课
  '7-7': 4, // 下午
  '7-8': 7, // 见
  '7-9': 10, // 吧
  '7-10': 5, // 电影院
  '7-11': 7, // 看
  '7-12': 13, // 电影
  '7-13': 13, // 事
  '7-14': 7, // 上课
  '7-15': 15, // 呢 (affirmative / ongoing particle)
  '7-16': 4, // 半
  '7-17': 7, // 下课
  '7-18': 7, // 在 (to be at - verb)
  '7-19': 5, // 家 (home / house)
  '7-20': 6, // 里
  '7-21': 4, // 晚上
  '7-22': 5, // 医院
  '7-23': 7, // 上班
  '7-24': 7, // 下班
  '7-25': 5, // 店
  '7-26': 12, // 菜
  '7-27': 4, // 分钟
  '7-28': 6, // 后

  // ===== Chapter 8 =====
  '8-1': 5, // 房间
  '8-2': 6, // 外
  '8-3': 11, // 只
  '8-4': 8, // 小
  '8-5': 14, // 猫
  '8-6': 9, // 没
  '8-7': 7, // 看见
  '8-8': 13, // 桌子
  '8-9': 6, // 下 (under / below)
  '8-10': 8, // 漂亮
  '8-11': 9, // 在 (preposition: in/at)
  '8-12': 5, // 学校
  '8-13': 5, // 书店
  '8-14': 6, // 前
  '8-15': 7, // 能
  '8-16': 7, // 到
  '8-17': 12, // 午饭
  '8-18': 12, // 饭
  '8-19': 8, // 大
  '8-20': 3, // 病人
  '8-21': 8, // 多
  '8-22': 3, // 医生
  '8-23': 7, // 工作
  '8-24': 3, // 胡医生

  // ===== Chapter 9 =====
  '9-1': 6, // 前边
  '9-2': 6, // 边
  '9-3': 11, // 家 (measure word for shops/families)
  '9-4': 2, // 那个
  '9-5': 6, // 外边
  '9-6': 13, // 椅子
  '9-7': 6, // 上 (on / above)
  '9-8': 11, // 本
  '9-9': 13, // 书
  '9-10': 2, // 那 (that)
  '9-11': 15, // 第
  '9-12': 7, // 学习
  '9-13': 7, // 做
  '9-14': 4, // 白天
  '9-15': 7, // 读书
  '9-16': 9, // 和
  '9-17': 3, // 朋友
  '9-18': 7, // 唱
  '9-19': 13, // 歌
  '9-20': 8, // 好听
  '9-21': 13, // 电视
  '9-22': 14, // 狗
  '9-23': 7, // 玩

  // ===== Chapter 10 =====
  '10-1': 13, // 杯子
  '10-2': 3, // 售货员
  '10-3': 2, // 这边
  '10-4': 13, // 钱
  '10-5': 2, // 这些
  '10-6': 11, // 块
  '10-7': 2, // 那些
  '10-8': 2, // 这儿
  '10-9': 12, // 水果
  '10-10': 8, // 少
  '10-11': 11, // 斤
  '10-12': 12, // 苹果
  '10-13': 8, // 便宜
  '10-14': 5, // 商店
  '10-15': 13, // 衣服
  '10-16': 11, // 件
  '10-17': 11, // 元
  '10-18': 10, // 怎么样
  '10-19': 8, // 贵
  '10-20': 7, // 穿
  '10-21': 3, // 女
  '10-22': 3, // 男
  '10-23': 2, // 那儿

  // ===== Chapter 11 =====
  '11-1': 4, // 时候
  '11-2': 5, // 饭店
  '11-3': 7, // 知道
  '11-4': 9, // 正在
  '11-5': 7, // 找
  '11-6': 7, // 开车
  '11-7': 13, // 车
  '11-8': 9, // 在 (progressive adverb)
  '11-9': 7, // 读
  '11-10': 5, // 大学
  '11-11': 3, // 大学生
  '11-12': 7, // 学
  '11-13': 13, // 医
  '11-14': 3, // 弟弟
  '11-15': 7, // 起床
  '11-16': 7, // 睡觉
  '11-17': 7, // 睡
  '11-18': 2, // 那里
  '11-19': 2, // 哪里
  '11-20': 4, // 昨天
  '11-21': 7, // 问
  '11-22': 9, // 对 (to / toward - preposition)
  '11-23': 7, // 说
  '11-24': 7, // 要
  '11-25': 3, // 小朋友

  // ===== Chapter 12 =====
  '12-1': 14, // 天气
  '12-2': 2, // 这里
  '12-3': 14, // 天 (weather / sky / day)
  '12-4': 14, // 下雨
  '12-5': 15, // 了 (change of state)
  '12-6': 14, // 雨
  '12-7': 9, // 有点儿
  '12-8': 7, // 觉得
  '12-9': 8, // 冷
  '12-10': 14, // 下 (to fall - rain/snow)
  '12-11': 14, // 雪
  '12-12': 7, // 来
  '12-13': 5, // 公司
  '12-14': 7, // 生病
  '12-15': 7, // 看病
  '12-16': 7, // 病
  '12-17': 13, // 药
  '12-18': 11, // 一点儿
  '12-19': 7, // 回
  '12-20': 9, // 再 (then / afterwards)
  '12-21': 7, // 喝
  '12-22': 8, // 热
  '12-23': 12, // 水

  // ===== Chapter 13 =====
  '13-1': 7, // 可以
  '13-2': 9, // 再 (again)
  '13-3': 13, // 问题
  '13-4': 7, // 卖
  '13-5': 7, // 打电话
  '13-6': 11, // 一下
  '13-7': 3, // 服务员
  '13-8': 3, // 女士
  '13-9': 1, // 请
  '13-10': 7, // 坐
  '13-11': 7, // 给
  '13-12': 11, // 杯
  '13-13': 7, // 要
  '13-14': 12, // 早饭
  '13-15': 2, // 这个
  '13-16': 12, // 面包
  '13-17': 12, // 鸡蛋
  '13-18': 3, // 先生
  '13-19': 4, // 一半
  '13-20': 12, // 茶

  // ===== Chapter 14 =====
  '14-1': 7, // 上 (to board / get on)
  '14-2': 13, // 火车
  '14-3': 4, // 中午
  '14-4': 7, // 开
  '14-5': 11, // 有些
  '14-6': 11, // 有的
  '14-7': 15, // 了 (completed action)
  '14-8': 7, // 写
  '14-9': 9, // 都
  '14-10': 7, // 听见
  '14-11': 9, // 不要
  '14-12': 7, // 说话
  '14-13': 7, // 听
  '14-14': 2, // 哪些
  '14-15': 13, // 字
  '14-16': 13, // 汉语
  '14-17': 13, // 汉字
  '14-18': 4, // 明年
  '14-19': 5, // 中学
  '14-20': 5, // 小学
  '14-21': 3, // 中学生
  '14-22': 3, // 小学生
  '14-23': 7, // 上学
  '14-24': 2, // 他们
  '14-25': 2, // 她们
  '14-26': 2, // 它们
  '14-27': 8, // 晚

  // ===== Chapter 15 =====
  '15-1': 7, // 爱
  '15-2': 2, // 哪个
  '15-3': 4, // 去年
  '15-4': 3, // 男朋友
  '15-5': 11, // 几 (several / a few)
  '15-6': 4, // 年
  '15-7': 8, // 好玩儿
  '15-8': 5, // 西安
  '15-9': 5, // 北京
  '15-10': 13, // 飞机
  '15-11': 7, // 要 (to take / require time)
  '15-12': 4, // 小时
  '15-13': 3, // 家人
  '15-14': 4, // 时间
  '15-15': 5, // 机场
  '15-16': 7, // 接
  '15-17': 7, // 住
  '15-18': 8, // 早
  '15-19': 9, // 那 (then / in that case)
  '15-20': 5, // 大兴机场
};

export function getVocabCategoryId(entry: Pick<NumberedVocabEntry, 'id' | 'hanzi'>): VocabCategoryId {
  const exact = VOCAB_ID_TO_CATEGORY[entry.id];
  if (exact) return exact;

  // Fallback classifier for any future vocabulary additions
  if (/^[零一二两三四五六七八九十百千万第的了]+$/.test(entry.hanzi)) {
    return 15;
  }
  return 13;
}

export function groupVocabularyByCategory(
  entries: NumberedVocabEntry[]
): CategorizedVocabGroup[] {
  const buckets = new Map<VocabCategoryId, NumberedVocabEntry[]>();
  for (const cat of VOCAB_CATEGORIES) {
    buckets.set(cat.id, []);
  }

  for (const entry of entries) {
    const catId = getVocabCategoryId(entry);
    buckets.get(catId)?.push(entry);
  }

  return VOCAB_CATEGORIES.map((category) => ({
    category,
    entries: buckets.get(category.id) ?? [],
  }));
}
