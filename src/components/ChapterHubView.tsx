import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Clock,
  FileText,
  GraduationCap,
  Headphones,
  Layers,
  Mic,
  PenTool,
  Sparkles,
  Star,
  Volume2,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { DRILL_METADATA } from '../data/chaptersData';
import { getChapterTrueFalseItems } from '../data/trueFalseData';
import { ChapterData, DrillType, QuizMode, SessionDrillKey } from '../types';
import { speakChinese, stopChineseSpeech } from '../utils/speech';
import { BookmarkNoteControls } from './BookmarkNoteControls';
import { RubyChinese } from './RubyChinese';

interface ChapterHubViewProps {
  chapter: ChapterData;
  selectedMode: QuizMode;
  onModeChange: (mode: QuizMode) => void;
  onStartDrill: (drillKey: SessionDrillKey) => void;
  onStartChapterExam: () => void;
  onOpenLab: (tab: 'writing' | 'speaking' | 'speed', chapterId: number) => void;
  onBack: () => void;
}

type SkillFilter = 'all' | 'vocab' | 'tones' | 'translation' | 'grammar';

interface DrillCardConfig {
  type: DrillType;
  numberLabel: string;
  skillFilter: Exclude<SkillFilter, 'all'>;
  skillLabel: string;
  difficultyLabel: 'Easy' | 'Medium' | 'Advanced';
  difficultyTone: 'jade' | 'gold' | 'cinnabar';
}

interface DrillSkillGroup {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  accent: 'jade' | 'gold' | 'cinnabar';
  drills: DrillCardConfig[];
}

const DRILL_SKILL_GROUPS: DrillSkillGroup[] = [
  {
    id: 'vocab-recognition',
    kicker: 'Group 1 · 4 Vocabulary & Matching Drills',
    title: 'Vocabulary & Character Recognition',
    subtitle: 'Build fast Hanzi-to-English recognition, active recall, and multi-column pairing.',
    accent: 'jade',
    drills: [
      {
        type: 'hanzi-to-arabic',
        numberLabel: '01',
        skillFilter: 'vocab',
        skillLabel: 'Recognition',
        difficultyLabel: 'Easy',
        difficultyTone: 'jade',
      },
      {
        type: 'arabic-to-hanzi',
        numberLabel: '02',
        skillFilter: 'vocab',
        skillLabel: 'Recall',
        difficultyLabel: 'Easy',
        difficultyTone: 'jade',
      },
      {
        type: 'match-2-col',
        numberLabel: '05',
        skillFilter: 'vocab',
        skillLabel: 'Pairing',
        difficultyLabel: 'Medium',
        difficultyTone: 'gold',
      },
      {
        type: 'match-3-col',
        numberLabel: '06',
        skillFilter: 'vocab',
        skillLabel: 'Triple Link',
        difficultyLabel: 'Medium',
        difficultyTone: 'gold',
      },
    ],
  },
  {
    id: 'tones-listening',
    kicker: 'Group 2 · 2 Audio & Tone Drills',
    title: 'Pronunciation, Tones & Listening',
    subtitle: 'Sharpen Mandarin tone discrimination and spoken word recognition at normal or slow speed.',
    accent: 'gold',
    drills: [
      {
        type: 'hanzi-to-pinyin',
        numberLabel: '03',
        skillFilter: 'tones',
        skillLabel: 'Pinyin & Tones',
        difficultyLabel: 'Medium',
        difficultyTone: 'gold',
      },
      {
        type: 'listening',
        numberLabel: '04',
        skillFilter: 'tones',
        skillLabel: 'Audio',
        difficultyLabel: 'Medium',
        difficultyTone: 'gold',
      },
    ],
  },
  {
    id: 'sentences-grammar',
    kicker: 'Group 3 · 5 Translation & Grammar Drills',
    title: 'Sentences, Translation & Grammar',
    subtitle: 'Apply vocabulary in context with anti-elimination translation traps, blanks, word order, and True/False logic.',
    accent: 'cinnabar',
    drills: [
      {
        type: 'sentence-hanzi-to-arabic',
        numberLabel: '07',
        skillFilter: 'translation',
        skillLabel: 'Translation',
        difficultyLabel: 'Medium',
        difficultyTone: 'gold',
      },
      {
        type: 'sentence-arabic-to-hanzi',
        numberLabel: '08',
        skillFilter: 'translation',
        skillLabel: 'Translation',
        difficultyLabel: 'Medium',
        difficultyTone: 'gold',
      },
      {
        type: 'fill-in-blank',
        numberLabel: '09',
        skillFilter: 'grammar',
        skillLabel: 'Grammar',
        difficultyLabel: 'Medium',
        difficultyTone: 'gold',
      },
      {
        type: 'sentence-builder',
        numberLabel: '10',
        skillFilter: 'grammar',
        skillLabel: 'Word Order',
        difficultyLabel: 'Advanced',
        difficultyTone: 'cinnabar',
      },
      {
        type: 'true-false',
        numberLabel: '11',
        skillFilter: 'grammar',
        skillLabel: 'Grammar Logic',
        difficultyLabel: 'Advanced',
        difficultyTone: 'cinnabar',
      },
    ],
  },
];

const ALL_DRILL_CONFIGS: DrillCardConfig[] = DRILL_SKILL_GROUPS.flatMap((g) => g.drills);

const SKILL_FILTER_OPTIONS: { id: SkillFilter; label: string; count: number }[] = [
  { id: 'all', label: 'All Drills', count: ALL_DRILL_CONFIGS.length },
  {
    id: 'vocab',
    label: 'Vocab & Matching',
    count: ALL_DRILL_CONFIGS.filter((d) => d.skillFilter === 'vocab').length,
  },
  {
    id: 'tones',
    label: 'Tones & Listening',
    count: ALL_DRILL_CONFIGS.filter((d) => d.skillFilter === 'tones').length,
  },
  {
    id: 'translation',
    label: 'Translation',
    count: ALL_DRILL_CONFIGS.filter((d) => d.skillFilter === 'translation').length,
  },
  {
    id: 'grammar',
    label: 'Grammar & Logic',
    count: ALL_DRILL_CONFIGS.filter((d) => d.skillFilter === 'grammar').length,
  },
];

function getDifficultyColorClasses(tone: 'jade' | 'gold' | 'cinnabar'): string {
  if (tone === 'jade') {
    return 'text-[#15803D] dark:text-[#22C55E]';
  }
  if (tone === 'gold') {
    return 'text-[#B45309] dark:text-[#F59E0B]';
  }
  return 'text-[#B91C1C] dark:text-[#EF4444]';
}

function parseChapterSubtitle(subtitle: string): {
  englishTheme: string;
  chineseLesson: string | null;
} {
  const match = subtitle.match(/^(.*?)\s*[（(]([^()（）]+)[）)]\s*$/);
  if (match) {
    return { englishTheme: match[1].trim(), chineseLesson: match[2].trim() };
  }
  return { englishTheme: subtitle.trim(), chineseLesson: null };
}

function DrillFormatMiniPreview({ type }: { type: DrillType }) {
  switch (type) {
    case 'hanzi-to-arabic':
      return (
        <div
          aria-hidden="true"
          className="rounded-lg bg-[#F9F6F0] dark:bg-[#141312] border border-[#1C1917]/8 dark:border-[#F5F2EB]/8 px-3 py-2.5 flex items-center justify-between gap-2"
        >
          <span className="font-hanzi text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB]">
            你好
          </span>
          <span className="text-[11px] text-[#57534E] dark:text-[#A8A29E]">→</span>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-[#15803D]/12 dark:bg-[#22C55E]/15 text-[#15803D] dark:text-[#22C55E] font-bold">
              Hello
            </span>
            <span className="px-2 py-0.5 rounded bg-[#1C1917]/6 dark:bg-[#F5F2EB]/8 text-[#57534E] dark:text-[#A8A29E]">
              Teacher
            </span>
          </div>
        </div>
      );

    case 'arabic-to-hanzi':
      return (
        <div
          aria-hidden="true"
          className="rounded-lg bg-[#F9F6F0] dark:bg-[#141312] border border-[#1C1917]/8 dark:border-[#F5F2EB]/8 px-3 py-2.5 flex items-center justify-between gap-2"
        >
          <span className="text-xs font-bold text-[#1C1917] dark:text-[#F5F2EB]">Teacher</span>
          <span className="text-[11px] text-[#57534E] dark:text-[#A8A29E]">→</span>
          <div className="flex items-center gap-1.5 font-hanzi text-sm">
            <span className="px-2 py-0.5 rounded bg-[#B91C1C]/12 dark:bg-[#EF4444]/18 text-[#B91C1C] dark:text-[#EF4444] font-bold">
              老师
            </span>
            <span className="px-2 py-0.5 rounded bg-[#1C1917]/6 dark:bg-[#F5F2EB]/8 text-[#57534E] dark:text-[#A8A29E]">
              学生
            </span>
          </div>
        </div>
      );

    case 'hanzi-to-pinyin':
      return (
        <div
          aria-hidden="true"
          className="rounded-lg bg-[#F9F6F0] dark:bg-[#141312] border border-[#1C1917]/8 dark:border-[#F5F2EB]/8 px-3 py-2.5 flex items-center justify-between gap-2"
        >
          <span className="font-hanzi text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB]">
            中国
          </span>
          <div className="flex items-center gap-1.5 font-pinyin text-xs">
            <span className="px-2 py-0.5 rounded bg-[#D97706]/15 dark:bg-[#F59E0B]/18 text-[#92400E] dark:text-[#F59E0B] font-bold">
              zhōngguó
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#1C1917]/6 dark:bg-[#F5F2EB]/8 text-[#57534E] dark:text-[#A8A29E]">
              zhǒngguò
            </span>
          </div>
        </div>
      );

    case 'listening':
      return (
        <div
          aria-hidden="true"
          className="rounded-lg bg-[#F9F6F0] dark:bg-[#141312] border border-[#1C1917]/8 dark:border-[#F5F2EB]/8 px-3 py-2.5 flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-[#B91C1C]/12 dark:bg-[#EF4444]/18 text-[#B91C1C] dark:text-[#EF4444] flex items-center justify-center">
              <Volume2 className="w-3.5 h-3.5" />
            </span>
            <div className="flex items-end gap-0.5 h-4">
              <span className="w-0.5 h-2 bg-[#B91C1C]/70 dark:bg-[#EF4444]/70 rounded-full" />
              <span className="w-0.5 h-4 bg-[#B91C1C] dark:bg-[#EF4444] rounded-full" />
              <span className="w-0.5 h-3 bg-[#B91C1C]/80 dark:bg-[#EF4444]/80 rounded-full" />
              <span className="w-0.5 h-1.5 bg-[#B91C1C]/60 dark:bg-[#EF4444]/60 rounded-full" />
            </div>
          </div>
          <span className="text-[11px] font-semibold text-[#57534E] dark:text-[#A8A29E]">
            Listen → Select Meaning
          </span>
        </div>
      );

    case 'match-2-col':
      return (
        <div
          aria-hidden="true"
          className="rounded-lg bg-[#F9F6F0] dark:bg-[#141312] border border-[#1C1917]/8 dark:border-[#F5F2EB]/8 px-3 py-2 flex items-center justify-between gap-2 text-[11px]"
        >
          <div className="flex flex-col gap-1 font-hanzi font-bold text-[#1C1917] dark:text-[#F5F2EB]">
            <span>朋友</span>
            <span>学生</span>
          </div>
          <div className="flex-1 border-t border-dashed border-[#D97706]/60 mx-1" />
          <div className="flex flex-col gap-1 text-[#57534E] dark:text-[#A8A29E]">
            <span>Friend</span>
            <span>Student</span>
          </div>
        </div>
      );

    case 'match-3-col':
      return (
        <div
          aria-hidden="true"
          className="rounded-lg bg-[#F9F6F0] dark:bg-[#141312] border border-[#1C1917]/8 dark:border-[#F5F2EB]/8 px-3 py-2.5 flex items-center justify-between gap-1 text-[11px]"
        >
          <span className="font-hanzi font-bold text-[#1C1917] dark:text-[#F5F2EB]">名字</span>
          <span className="text-[#D97706]">↔</span>
          <span className="font-pinyin text-[#57534E] dark:text-[#A8A29E]">míngzi</span>
          <span className="text-[#D97706]">↔</span>
          <span className="font-semibold text-[#15803D] dark:text-[#22C55E]">Name</span>
        </div>
      );

    case 'sentence-hanzi-to-arabic':
      return (
        <div
          aria-hidden="true"
          className="rounded-lg bg-[#F9F6F0] dark:bg-[#141312] border border-[#1C1917]/8 dark:border-[#F5F2EB]/8 px-3 py-2 space-y-1"
        >
          <p className="font-hanzi text-xs font-bold text-[#1C1917] dark:text-[#F5F2EB] text-left">
            我是中国人。
          </p>
          <p className="text-[11px] font-semibold text-[#15803D] dark:text-[#22C55E]">
            → I am Chinese.
          </p>
        </div>
      );

    case 'sentence-arabic-to-hanzi':
      return (
        <div
          aria-hidden="true"
          className="rounded-lg bg-[#F9F6F0] dark:bg-[#141312] border border-[#1C1917]/8 dark:border-[#F5F2EB]/8 px-3 py-2 space-y-1"
        >
          <p className="text-[11px] font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
            Can you speak Chinese?
          </p>
          <p className="font-hanzi text-xs font-bold text-[#B91C1C] dark:text-[#EF4444] text-left">
            你会说中文吗？
          </p>
        </div>
      );

    case 'fill-in-blank':
      return (
        <div
          aria-hidden="true"
          className="rounded-lg bg-[#F9F6F0] dark:bg-[#141312] border border-[#1C1917]/8 dark:border-[#F5F2EB]/8 px-3 py-2.5 flex items-center justify-between gap-2"
        >
          <span className="font-hanzi text-xs font-bold text-[#1C1917] dark:text-[#F5F2EB]">
            他{' '}
            <span className="inline-block border-b-2 border-[#B91C1C] dark:border-[#EF4444] px-1.5 text-[#B91C1C] dark:text-[#EF4444]">
              ___
            </span>{' '}
            两个孩子
          </span>
          <span className="font-hanzi text-[11px] px-1.5 py-0.5 rounded bg-[#B91C1C]/12 dark:bg-[#EF4444]/18 text-[#B91C1C] dark:text-[#EF4444] font-bold">
            有
          </span>
        </div>
      );

    case 'true-false':
      return (
        <div
          aria-hidden="true"
          className="rounded-lg bg-[#F9F6F0] dark:bg-[#141312] border border-[#1C1917]/8 dark:border-[#F5F2EB]/8 px-3 py-2.5 flex items-center justify-between gap-2"
        >
          <span className="font-hanzi text-xs font-bold text-[#1C1917] dark:text-[#F5F2EB]">
            我明天去学校。
          </span>
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <span className="px-2 py-0.5 rounded bg-[#15803D]/12 dark:bg-[#22C55E]/18 text-[#15803D] dark:text-[#22C55E]">
              ✓ True
            </span>
            <span className="px-2 py-0.5 rounded bg-[#B91C1C]/12 dark:bg-[#EF4444]/18 text-[#B91C1C] dark:text-[#EF4444]">
              ✗ False
            </span>
          </div>
        </div>
      );

    case 'sentence-builder':
    default:
      return (
        <div
          aria-hidden="true"
          className="rounded-lg bg-[#F9F6F0] dark:bg-[#141312] border border-[#1C1917]/8 dark:border-[#F5F2EB]/8 px-3 py-2.5 flex items-center justify-center gap-1.5 font-hanzi text-xs"
        >
          <span className="px-2 py-0.5 rounded border border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-white dark:bg-[#1E1C1A] font-bold">
            我
          </span>
          <span className="px-2 py-0.5 rounded border border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-white dark:bg-[#1E1C1A] font-bold">
            会
          </span>
          <span className="px-2 py-0.5 rounded border border-[#B91C1C]/35 dark:border-[#EF4444]/35 bg-[#B91C1C]/8 dark:bg-[#EF4444]/12 text-[#B91C1C] dark:text-[#EF4444] font-bold">
            做饭
          </span>
        </div>
      );
  }
}

export function ChapterHubView({
  chapter,
  selectedMode,
  onModeChange,
  onStartDrill,
  onStartChapterExam,
  onOpenLab,
  onBack,
}: ChapterHubViewProps) {
  const { progress, analytics, showPinyin, getItemNote, studyVault } = useApp();
  const [studyDrawerOpen, setStudyDrawerOpen] = useState(false);
  const [studyDrawerTab, setStudyDrawerTab] = useState<'vocab' | 'sentences'>('vocab');
  const [speakingItemKey, setSpeakingItemKey] = useState<string | null>(null);
  const [activeSkillFilter, setActiveSkillFilter] = useState<SkillFilter>('all');

  const { englishTheme, chineseLesson } = parseChapterSubtitle(chapter.subtitleAr);

  const chapterSavedCount = Object.values(studyVault).filter(
    (entry) => entry.chapterId === chapter.id
  ).length;

  const chapterExamHistory = (progress?.chapterExamResults ?? []).filter(
    (res) => res.chapterId === chapter.id
  );
  const bestChapterExam = chapterExamHistory.reduce<
    (typeof chapterExamHistory)[number] | null
  >((best, cur) => {
    if (!best || cur.percentage > best.percentage) return cur;
    return best;
  }, null);

  const handlePlayStudyAudio = (key: string, hanzi: string, rate: 1.0 | 0.7 = 1.0) => {
    const playKey = `${key}-${rate}`;
    if (speakingItemKey === playKey) {
      stopChineseSpeech();
      setSpeakingItemKey(null);
      return;
    }
    setSpeakingItemKey(playKey);
    const ok = speakChinese(hanzi, rate, {
      onEnd: () => setSpeakingItemKey((cur) => (cur === playKey ? null : cur)),
      onError: () => setSpeakingItemKey((cur) => (cur === playKey ? null : cur)),
    });
    if (!ok) setSpeakingItemKey(null);
  };

  const chapterStats = progress?.chapterStats[chapter.id];
  const completedDrills = new Set<DrillType>(chapterStats?.completedDrills ?? []);
  const completionPercent = analytics.getChapterCompletion(chapter.id);

  const trueFalseCount = getChapterTrueFalseItems(chapter.id).length;

  const isDrillAvailable = (drillType: DrillType) => {
    if (drillType === 'true-false') return trueFalseCount > 0;
    const req = DRILL_METADATA[drillType].requires;
    return req === 'vocab' ? chapter.vocab.length > 0 : chapter.sentences.length > 0;
  };

  const hasAnyContent = chapter.vocab.length > 0 || chapter.sentences.length > 0;

  const renderDrillGrid = (items: DrillCardConfig[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((cfg) => {
        const meta = DRILL_METADATA[cfg.type];
        const available = isDrillAvailable(cfg.type);
        const isCompleted = completedDrills.has(cfg.type);
        const itemCount =
          cfg.type === 'true-false'
            ? trueFalseCount
            : meta.requires === 'vocab'
              ? chapter.vocab.length
              : chapter.sentences.length;

        return (
          <button
            key={cfg.type}
            type="button"
            disabled={!available}
            onClick={() => onStartDrill(cfg.type)}
            className={`group text-left rounded-xl border p-5 flex flex-col justify-between gap-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B91C1C] dark:focus-visible:ring-[#EF4444] ${
              !available
                ? 'border-[#1C1917]/8 dark:border-[#F5F2EB]/8 bg-[#F2ECE1]/60 dark:bg-[#181614] opacity-60 cursor-not-allowed'
                : isCompleted
                  ? 'border-[#15803D]/25 dark:border-[#22C55E]/25 bg-white dark:bg-[#1E1C1A] shadow-[0_1px_2px_rgba(28,25,23,0.03)] hover:shadow-[0_10px_22px_-12px_rgba(21,128,61,0.22)] dark:hover:shadow-[0_10px_22px_-12px_rgba(0,0,0,0.45)] hover:border-[#15803D]/55 dark:hover:border-[#22C55E]/55 hover:-translate-y-0.5'
                  : 'border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] shadow-[0_1px_2px_rgba(28,25,23,0.03)] hover:shadow-[0_10px_22px_-12px_rgba(28,25,23,0.16)] dark:hover:shadow-[0_10px_22px_-12px_rgba(0,0,0,0.45)] hover:border-[#B91C1C]/45 dark:hover:border-[#EF4444]/45 hover:-translate-y-0.5'
            }`}
          >
            <div className="space-y-3.5">
              {/* Unboxed Index · Skill · Difficulty + Completion */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5 tabular-nums">
                  <span className="font-bold text-[#1C1917]/75 dark:text-[#F5F2EB]/75">
                    {cfg.numberLabel}
                  </span>
                  <span aria-hidden="true" className="text-[#1C1917]/25 dark:text-[#F5F2EB]/25">
                    ·
                  </span>
                  <span className="font-semibold text-[#57534E] dark:text-[#A8A29E]">
                    {cfg.skillLabel}
                  </span>
                  <span aria-hidden="true" className="text-[#1C1917]/25 dark:text-[#F5F2EB]/25">
                    ·
                  </span>
                  <span className={`font-bold ${getDifficultyColorClasses(cfg.difficultyTone)}`}>
                    {cfg.difficultyLabel}
                  </span>
                </div>

                {isCompleted && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#15803D] dark:text-[#22C55E] shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-[15px] sm:text-base font-bold text-[#1C1917] dark:text-[#F5F2EB] leading-snug group-hover:text-[#B91C1C] dark:group-hover:text-[#EF4444] transition-colors">
                  {meta.titleAr}
                </h3>
                <p className="text-xs text-[#57534E] dark:text-[#A8A29E] leading-relaxed">
                  {meta.descriptionAr}
                </p>
              </div>

              {/* Format Mini Preview */}
              <DrillFormatMiniPreview type={cfg.type} />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#1C1917]/8 dark:border-[#F5F2EB]/8 text-xs">
              <span className="text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                {available
                  ? `${itemCount} ${cfg.type === 'true-false' ? 'statements' : meta.requires === 'vocab' ? 'words' : 'sentences'}`
                  : 'No items available'}
              </span>
              {available && (
                <span className="inline-flex items-center gap-1 font-bold text-[#B91C1C] dark:text-[#EF4444]">
                  <span>{selectedMode === 'practice' ? 'Practice' : 'Start Exam'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-8"
    >
      {/* Header & Back Button */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#57534E] dark:text-[#A8A29E] hover:text-[#B91C1C] dark:hover:text-[#EF4444] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All 15 Chapters</span>
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#1C1917]/10 dark:border-[#F5F2EB]/10 pb-6">
          <div className="flex items-center gap-4">
            <span className="cinnabar-seal font-hanzi w-14 h-14 rounded-lg flex items-center justify-center text-2xl font-bold bg-white dark:bg-[#1E1C1A] shrink-0">
              {chapter.chineseNumeral}
            </span>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                <span className="font-bold uppercase tracking-wider text-[#1C1917]/80 dark:text-[#F5F2EB]/80">
                  {chapter.titleAr} · 第{chapter.id}课
                </span>
                <span aria-hidden="true">·</span>
                <span>{chapter.vocab.length} vocab</span>
                <span aria-hidden="true">·</span>
                <span>{chapter.sentences.length} sentences</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[#15803D] dark:text-[#22C55E]">
                  {completionPercent}% complete
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1917] dark:text-[#F5F2EB] leading-snug">
                {englishTheme}
              </h1>
              {chineseLesson && (
                <p className="font-hanzi text-sm sm:text-base font-medium text-[#57534E] dark:text-[#A8A29E]">
                  {chineseLesson}
                </p>
              )}
            </div>
          </div>

          {/* Practice vs Exam Mode Toggle */}
          <div
            role="radiogroup"
            aria-label="Session Mode"
            className="inline-flex p-1 rounded-lg border border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-[#F2ECE1] dark:bg-[#1E1C1A] self-start lg:self-auto"
          >
            <button
              type="button"
              role="radio"
              aria-checked={selectedMode === 'practice'}
              onClick={() => onModeChange('practice')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-md text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                selectedMode === 'practice'
                  ? 'bg-white dark:bg-[#292623] text-[#15803D] dark:text-[#22C55E] shadow-xs'
                  : 'text-[#57534E] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#F5F2EB]'
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Practice Mode</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={selectedMode === 'exam'}
              onClick={() => onModeChange('exam')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-md text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                selectedMode === 'exam'
                  ? 'bg-white dark:bg-[#292623] text-[#B91C1C] dark:text-[#EF4444] shadow-xs'
                  : 'text-[#57534E] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#F5F2EB]'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 shrink-0" />
              <span>Exam Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode Description */}
      <div className="rounded-lg border border-[#1C1917]/10 dark:border-[#F5F2EB]/10 bg-white dark:bg-[#1E1C1A] px-5 py-3.5 text-sm text-[#57534E] dark:text-[#A8A29E]">
        {selectedMode === 'practice' ? (
          <span>
            <strong className="text-[#15803D] dark:text-[#22C55E]">Practice Mode:</strong> Shows
            immediate feedback and correct answers after every question to reinforce retention.
          </span>
        ) : (
          <span>
            <strong className="text-[#B91C1C] dark:text-[#EF4444]">Exam Mode:</strong> Navigate
            freely across questions and edit answers before final submission, followed by a full
            score breakdown.
          </span>
        )}
      </div>

      {!hasAnyContent ? (
        <div className="neo-frame rounded-xl p-12 text-center space-y-3">
          <p className="text-xl font-bold text-[#1C1917] dark:text-[#F5F2EB]">
            Chapter content coming soon
          </p>
          <p className="text-sm text-[#57534E] dark:text-[#A8A29E]">
            No vocabulary or sentences have been added to this chapter yet.
          </p>
        </div>
      ) : (
        <>
          {/* Dedicated Chapter Exam (40 Questions) + Mixed Comprehensive Review */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Dedicated Chapter Exam (40 Questions) Single-Page Assessment Card */}
            <div className="lg:col-span-7 neo-frame rounded-xl p-6 sm:p-7 flex flex-col justify-between gap-5 bg-white dark:bg-[#1E1C1A]">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-[#B91C1C] dark:text-[#EF4444]">
                    <FileText className="w-4 h-4" />
                    <span>Single-Page Exam Sheet · 4 Parts × 10 Questions</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold tabular-nums text-[#57534E] dark:text-[#A8A29E]">
                    <Clock className="w-3.5 h-3.5 text-[#D97706] dark:text-[#F59E0B]" />
                    <span>45 min</span>
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                  Chapter Exam <span className="text-[#B91C1C] dark:text-[#EF4444]">(40 Questions)</span>
                </h2>

                <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#A8A29E] leading-relaxed">
                  Test your full mastery of {chapter.titleAr} on one timed exam sheet: Part I
                  Vocabulary &amp; Pinyin, Part II Grammar Fill-in-the-Blank, Part III Precision
                  Translation, and Part IV True/False traps.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
                <div className="text-xs text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                  {bestChapterExam ? (
                    <span>
                      Best score:{' '}
                      <strong
                        className={
                          bestChapterExam.percentage >= 70
                            ? 'text-[#15803D] dark:text-[#22C55E]'
                            : 'text-[#B91C1C] dark:text-[#EF4444]'
                        }
                      >
                        {bestChapterExam.score}/{bestChapterExam.total} ({bestChapterExam.percentage}%)
                      </strong>{' '}
                      · {chapterExamHistory.length}{' '}
                      {chapterExamHistory.length === 1 ? 'attempt' : 'attempts'}
                    </span>
                  ) : (
                    <span>Not attempted yet · Auto-graded with full corrections</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onStartChapterExam}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[46px] rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] dark:bg-[#EF4444] dark:hover:bg-[#DC2626] text-white font-bold text-sm transition-colors whitespace-nowrap shrink-0"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Start Chapter Exam</span>
                </button>
              </div>
            </div>

            {/* Mixed Comprehensive Drill Session Card */}
            <div className="lg:col-span-5 rounded-xl border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] p-6 sm:p-7 flex flex-col justify-between gap-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#D97706] dark:text-[#F59E0B]">
                  <Layers className="w-4 h-4" />
                  <span>Quick 11-Mode Sampler</span>
                </div>
                <h2 className="text-xl font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                  Comprehensive Mixed Practice
                </h2>
                <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#A8A29E] leading-relaxed">
                  A rapid one-question-per-mode warm-up combining reading, tones, listening,
                  matching, sentence building, and True/False.
                </p>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
                <button
                  type="button"
                  onClick={() => onStartDrill('mixed')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] rounded-lg border border-[#B91C1C] dark:border-[#EF4444] text-[#B91C1C] dark:text-[#EF4444] hover:bg-[#B91C1C] hover:text-white dark:hover:bg-[#EF4444] dark:hover:text-white font-bold text-sm transition-colors whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {selectedMode === 'practice' ? 'Start Mixed Practice' : 'Start Mixed Quiz'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Chapter Labs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] p-5 flex flex-col justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B91C1C] dark:text-[#EF4444]">
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Stroke Order &amp; Handwriting</span>
                </div>
                <h3 className="text-base font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                  Hanzi Writing Lab
                </h3>
                <p className="text-xs text-[#57534E] dark:text-[#A8A29E] leading-relaxed">
                  Watch animated stroke order and trace this chapter’s characters on a traditional
                  米字格 grid.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenLab('writing', chapter.id)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg border border-[#B91C1C] dark:border-[#EF4444] text-[#B91C1C] dark:text-[#EF4444] hover:bg-[#B91C1C] hover:text-white dark:hover:bg-[#EF4444] dark:hover:text-white font-bold text-xs transition-colors whitespace-nowrap"
              >
                <PenTool className="w-4 h-4 shrink-0" />
                <span>Open Hanzi Lab</span>
              </button>
            </div>

            <div className="rounded-xl border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] p-5 flex flex-col justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#15803D] dark:text-[#22C55E]">
                  <Mic className="w-3.5 h-3.5" />
                  <span>Live Microphone Assessment</span>
                </div>
                <h3 className="text-base font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                  Speaking Voice Trainer
                </h3>
                <p className="text-xs text-[#57534E] dark:text-[#A8A29E] leading-relaxed">
                  Speak this chapter’s vocabulary and sentences aloud for instant character-level
                  accuracy feedback.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenLab('speaking', chapter.id)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg border border-[#15803D] dark:border-[#22C55E] text-[#15803D] dark:text-[#22C55E] hover:bg-[#15803D] hover:text-white dark:hover:bg-[#22C55E] dark:hover:text-[#121110] font-bold text-xs transition-colors whitespace-nowrap"
              >
                <Mic className="w-4 h-4 shrink-0" />
                <span>Open Voice Trainer</span>
              </button>
            </div>

            <div className="rounded-xl border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] p-5 flex flex-col justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D97706] dark:text-[#F59E0B]">
                  <Zap className="w-3.5 h-3.5" />
                  <span>60-Second Rapid Pairing</span>
                </div>
                <h3 className="text-base font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                  Speed Match Challenge
                </h3>
                <p className="text-xs text-[#57534E] dark:text-[#A8A29E] leading-relaxed">
                  Match this chapter’s vocabulary against the clock in one minute and beat your
                  personal record.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenLab('speed', chapter.id)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg border border-[#D97706] dark:border-[#F59E0B] text-[#B45309] dark:text-[#F59E0B] hover:bg-[#D97706] hover:text-white dark:hover:bg-[#F59E0B] dark:hover:text-[#121110] font-bold text-xs transition-colors whitespace-nowrap"
              >
                <Zap className="w-4 h-4 shrink-0" />
                <span>Start Speed Match</span>
              </button>
            </div>
          </div>

          {/* Chapter Vocabulary & Sentences Study Drawer with Bookmarks & Notes */}
          <div className="rounded-xl border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] overflow-hidden">
            <button
              type="button"
              onClick={() => setStudyDrawerOpen((prev) => !prev)}
              className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-[#F9F6F0]/70 dark:hover:bg-[#25221F]/60 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-lg border border-[#D97706]/30 dark:border-[#F59E0B]/35 bg-[#D97706]/10 dark:bg-[#F59E0B]/12 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-[#D97706] dark:text-[#F59E0B]" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                    <span className="font-bold text-[#D97706] dark:text-[#F59E0B]">
                      Study Reference &amp; Bookmarks
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{chapter.vocab.length} vocab</span>
                    <span aria-hidden="true">·</span>
                    <span>{chapter.sentences.length} sentences</span>
                    {chapterSavedCount > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-bold text-[#15803D] dark:text-[#22C55E]">
                          Saved in Vault: {chapterSavedCount}
                        </span>
                      </>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                    Browse Chapter Vocabulary, Sentences &amp; Personal Notes
                  </h2>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B91C1C] dark:text-[#EF4444] shrink-0">
                <span>{studyDrawerOpen ? 'Hide List' : 'View List'}</span>
                {studyDrawerOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </span>
            </button>

            {studyDrawerOpen && (
              <div className="border-t border-[#1C1917]/10 dark:border-[#F5F2EB]/10 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex p-1 rounded-lg bg-[#F2ECE1] dark:bg-[#141312] border border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
                    <button
                      type="button"
                      onClick={() => setStudyDrawerTab('vocab')}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap tabular-nums ${
                        studyDrawerTab === 'vocab'
                          ? 'bg-white dark:bg-[#292623] text-[#B91C1C] dark:text-[#EF4444] shadow-xs'
                          : 'text-[#57534E] dark:text-[#A8A29E]'
                      }`}
                    >
                      Vocabulary ({chapter.vocab.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudyDrawerTab('sentences')}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap tabular-nums ${
                        studyDrawerTab === 'sentences'
                          ? 'bg-white dark:bg-[#292623] text-[#15803D] dark:text-[#22C55E] shadow-xs'
                          : 'text-[#57534E] dark:text-[#A8A29E]'
                      }`}
                    >
                      Sentences &amp; Dialogues ({chapter.sentences.length})
                    </button>
                  </div>
                  <span className="text-xs text-[#57534E] dark:text-[#A8A29E]">
                    Click the star to bookmark or the note icon to attach a personal study tip
                  </span>
                </div>

                {studyDrawerTab === 'vocab' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {chapter.vocab.map((v) => {
                      const note = getItemNote('vocab', v.id);
                      const isPlaying = speakingItemKey === `${v.id}-1`;
                      return (
                        <div
                          key={v.id}
                          className="rounded-lg border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-[#F9F6F0]/60 dark:bg-[#141312] p-3.5 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="font-hanzi text-xl font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                                  {v.hanzi}
                                </span>
                                {showPinyin && (
                                  <span className="font-pinyin text-xs font-semibold text-[#57534E] dark:text-[#A8A29E]">
                                    {v.pinyin}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-[#57534E] dark:text-[#A8A29E] mt-0.5">
                                {v.arabic}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handlePlayStudyAudio(v.id, v.hanzi, 1.0)}
                                aria-label={`Listen to ${v.hanzi}`}
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-md border transition-colors ${
                                  isPlaying
                                    ? 'border-[#B91C1C] dark:border-[#EF4444] bg-[#B91C1C] dark:bg-[#EF4444] text-white'
                                    : 'border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] text-[#57534E] dark:text-[#A8A29E] hover:text-[#B91C1C]'
                                }`}
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                              <BookmarkNoteControls
                                itemType="vocab"
                                itemId={v.id}
                                chapterId={chapter.id}
                                hanzi={v.hanzi}
                                pinyin={v.pinyin}
                                arabic={v.arabic}
                              />
                            </div>
                          </div>

                          {note && (
                            <p className="text-[11px] text-[#B91C1C] dark:text-[#EF4444] bg-white/80 dark:bg-[#1E1C1A] rounded px-2.5 py-1.5 border border-[#B91C1C]/15 dark:border-[#EF4444]/20">
                              <strong className="mr-1">Note:</strong>
                              {note}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="divide-y divide-[#1C1917]/10 dark:divide-[#F5F2EB]/10 rounded-lg border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-[#F9F6F0]/45 dark:bg-[#141312]">
                    {chapter.sentences.map((s, idx) => {
                      const note = getItemNote('sentence', s.id);
                      const activeNormal = speakingItemKey === `${s.id}-1`;
                      const activeSlow = speakingItemKey === `${s.id}-0.7`;
                      return (
                        <div
                          key={s.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-start gap-2.5">
                              <span className="text-xs font-bold tabular-nums text-[#57534E] dark:text-[#A8A29E] mt-1">
                                {idx + 1}.
                              </span>
                              <div className="space-y-1 min-w-0">
                                <div className="text-base sm:text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                                  <RubyChinese
                                    hanzi={s.hanzi}
                                    pinyin={s.pinyin}
                                    showPinyin={showPinyin}
                                  />
                                </div>
                                <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#A8A29E]">
                                  {s.arabic}
                                </p>
                                {note && (
                                  <p className="text-[11px] text-[#B91C1C] dark:text-[#EF4444] bg-white dark:bg-[#1E1C1A] rounded px-2.5 py-1.5 border border-[#B91C1C]/15 dark:border-[#EF4444]/20">
                                    <strong className="mr-1">Note:</strong>
                                    {note}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handlePlayStudyAudio(s.id, s.hanzi, 1.0)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] rounded-md border text-xs font-bold tabular-nums ${
                                activeNormal
                                  ? 'border-[#B91C1C] bg-[#B91C1C] text-white'
                                  : 'border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-white dark:bg-[#1E1C1A] text-[#1C1917] dark:text-[#F5F2EB]'
                              }`}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>1.0x</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePlayStudyAudio(s.id, s.hanzi, 0.7)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] rounded-md border text-xs font-bold tabular-nums ${
                                activeSlow
                                  ? 'border-[#D97706] bg-[#D97706] text-white'
                                  : 'border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-white dark:bg-[#1E1C1A] text-[#1C1917] dark:text-[#F5F2EB]'
                              }`}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>0.7x</span>
                            </button>
                            <BookmarkNoteControls
                              itemType="sentence"
                              itemId={s.id}
                              chapterId={chapter.id}
                              hanzi={s.hanzi}
                              pinyin={s.pinyin}
                              arabic={s.arabic}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 11 Daily Practice Drills Section Header & Skill Filter Bar */}
          <div className="space-y-6 pt-2">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#1C1917]/10 dark:border-[#F5F2EB]/10 pb-5">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                  <span className="font-bold text-[#B91C1C] dark:text-[#EF4444]">
                    Daily Drill Suite
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>11 Skill Modes across 3 Domains</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-bold text-[#15803D] dark:text-[#22C55E]">
                    {completedDrills.size}/11 Completed
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                  Choose a Practice Drill by Skill
                </h2>
              </div>

              {/* Interactive Skill Filter Control */}
              <div
                role="tablist"
                aria-label="Filter chapter drills by skill"
                className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg border border-[#1C1917]/10 dark:border-[#F5F2EB]/10 bg-[#F2ECE1]/80 dark:bg-[#1A1816]"
              >
                {SKILL_FILTER_OPTIONS.map((opt) => {
                  const isActive = activeSkillFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveSkillFilter(opt.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-md text-xs font-bold transition-colors whitespace-nowrap tabular-nums ${
                        isActive
                          ? 'bg-white dark:bg-[#2A2724] text-[#B91C1C] dark:text-[#EF4444] shadow-xs'
                          : 'text-[#57534E] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#F5F2EB]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span
                        className={`text-[11px] font-semibold ${
                          isActive
                            ? 'text-[#B91C1C]/80 dark:text-[#EF4444]/85'
                            : 'text-[#57534E]/75 dark:text-[#A8A29E]/75'
                        }`}
                      >
                        {opt.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {activeSkillFilter === 'all' ? (
              <div className="space-y-9">
                {DRILL_SKILL_GROUPS.map((group) => {
                  const completedInGroup = group.drills.filter((d) =>
                    completedDrills.has(d.type)
                  ).length;

                  const iconWrapClasses =
                    group.accent === 'jade'
                      ? 'border-[#15803D]/30 dark:border-[#22C55E]/30 bg-[#15803D]/10 dark:bg-[#22C55E]/12 text-[#15803D] dark:text-[#22C55E]'
                      : group.accent === 'gold'
                        ? 'border-[#D97706]/30 dark:border-[#F59E0B]/30 bg-[#D97706]/10 dark:bg-[#F59E0B]/12 text-[#B45309] dark:text-[#F59E0B]'
                        : 'border-[#B91C1C]/30 dark:border-[#EF4444]/30 bg-[#B91C1C]/10 dark:bg-[#EF4444]/12 text-[#B91C1C] dark:text-[#EF4444]';

                  const kickerClasses =
                    group.accent === 'jade'
                      ? 'text-[#15803D] dark:text-[#22C55E]'
                      : group.accent === 'gold'
                        ? 'text-[#B45309] dark:text-[#F59E0B]'
                        : 'text-[#B91C1C] dark:text-[#EF4444]';

                  const GroupIcon =
                    group.accent === 'jade'
                      ? BookOpen
                      : group.accent === 'gold'
                        ? Headphones
                        : PenTool;

                  return (
                    <div key={group.id} className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                        <div className="flex items-start sm:items-center gap-3">
                          <span
                            className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${iconWrapClasses}`}
                          >
                            <GroupIcon className="w-5 h-5" />
                          </span>
                          <div>
                            <div
                              className={`flex flex-wrap items-center gap-2 text-xs font-bold tabular-nums ${kickerClasses}`}
                            >
                              <span>{group.kicker}</span>
                              <span aria-hidden="true">·</span>
                              <span>
                                {completedInGroup}/{group.drills.length} done
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                              {group.title}
                            </h3>
                          </div>
                        </div>
                        <p className="text-xs text-[#57534E] dark:text-[#A8A29E] sm:max-w-sm sm:text-right">
                          {group.subtitle}
                        </p>
                      </div>

                      {renderDrillGrid(group.drills)}
                    </div>
                  );
                })}
              </div>
            ) : (
              renderDrillGrid(
                ALL_DRILL_CONFIGS.filter((d) => d.skillFilter === activeSkillFilter)
              )
            )}
          </div>
        </>
      )}
    </motion.section>
  );
}
