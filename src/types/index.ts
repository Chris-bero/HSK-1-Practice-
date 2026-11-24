export interface UnlockedAccess {
  chapters: number[];
  intlMocks?: number[];
  arabicMocks?: number[];
  patterns?: number[];
}

export interface Student {
  id: string;
  name: string;
  code: string;
  unlockedAccess?: UnlockedAccess;
  boundDeviceId?: string;
}

export interface VocabSyllable {
  hanzi: string;
  pinyin: string;
  tone: number;
}

export interface VocabItem {
  id: string;
  hanzi: string;
  pinyin: string;
  arabic: string;
  syllables?: VocabSyllable[];
  partOfSpeech?: string;
  /** Optional custom tone variants for Hanzi -> Pinyin drill */
  toneVariants?: [string, string];
  /** Optional custom similar-syllable distractors for Hanzi -> Pinyin drill */
  similarSyllables?: [string, string];
}

export interface SentenceItem {
  id: string;
  hanzi: string;
  pinyin: string;
  arabic: string;
  /** Ordered Chinese segments used in Sentence Builder drill */
  segments: string[];
  /** Exact substring inside `hanzi` replaced by ____ in Fill in the Blank drill */
  targetBlank: string;
  /** Optional custom 3 distractor words for Fill in the Blank drill */
  blankDistractors?: string[];
}

export interface ChapterData {
  id: number;
  chineseNumeral: string;
  titleAr: string;
  subtitleAr: string;
  vocab: VocabItem[];
  sentences: SentenceItem[];
}

export type DrillType =
  | 'hanzi-to-arabic'
  | 'arabic-to-hanzi'
  | 'hanzi-to-pinyin'
  | 'match-2-col'
  | 'match-3-col'
  | 'listening'
  | 'sentence-hanzi-to-arabic'
  | 'sentence-arabic-to-hanzi'
  | 'sentence-builder'
  | 'fill-in-blank'
  | 'true-false';

export type SessionDrillKey = DrillType | 'mixed';

export type QuizMode = 'practice' | 'exam';

export type AppView =
  | 'home'
  | 'chapters'
  | 'chapter-hub'
  | 'chapter-exam'
  | 'final-exams'
  | 'final-exam-runner'
  | 'collections'
  | 'labs'
  | 'vault'
  | 'custom-builder'
  | 'drill'
  | 'analytics';

export type StudyBookmarkItemType = 'vocab' | 'sentence';

export interface StudentStudyBookmark {
  key: string;
  itemType: StudyBookmarkItemType;
  itemId: string;
  chapterId: number;
  bookmarked: boolean;
  note: string;
  updatedAt: string;
}

export type BroadcastStyle = 'info' | 'important' | 'promo';

export interface TeacherBroadcast {
  id: string;
  enabled: boolean;
  message: string;
  style: BroadcastStyle;
  ctaLabel?: string;
  ctaUrl?: string;
  updatedAt: string;
}


export interface CustomQuizConfig {
  chapterIds: number[];
  drillScope: DrillType | 'all';
  questionLimit: 10 | 20 | 40 | 'all';
  mode: QuizMode;
}

export interface MistakeItem {
  key: string;
  chapterId: number;
  drillType: DrillType;
  sourceItemId: string;
  recordedAt: string;
  missCount?: number;
}

export interface DrillOption {
  id: string;
  label: string;
  subLabel?: string;
  isHanzi?: boolean;
  isPinyin?: boolean;
}

export interface MatchingEntry {
  id: string;
  hanzi: string;
  pinyin: string;
  arabic: string;
}

export interface DrillQuestion {
  id: string;
  chapterId: number;
  sourceItemId?: string;
  drillType: DrillType;
  promptPrimary: string;
  promptPinyin?: string;
  promptSecondary?: string;
  /** Used in Sentence Translation to indicate direction */
  direction?: 'hanzi-to-arabic' | 'arabic-to-hanzi';
  /** Used in Listening or TTS buttons for speechSynthesis */
  audioText?: string;
  /** Multiple-choice options */
  options?: DrillOption[];
  correctOptionId?: string;
  /** Matching sets (Drills 4, 5) */
  matchingEntries?: MatchingEntry[];
  /** Sentence Builder */
  correctSegments?: string[];
  shuffledSegments?: { tileId: string; text: string }[];
  /** Fill in the Blank */
  targetBlank?: string;
  sentenceWithBlank?: string;
  sentenceFullHanzi?: string;
  sentenceFullPinyin?: string;
  /** True or False (Grammar & Usage Judgment) */
  isStatementTrue?: boolean;
  correctedHanzi?: string;
  correctedPinyin?: string;
  explanation?: string;
  trapCategory?: string;
  /** Human-readable explanation shown in review / feedback */
  correctDisplay: string;
  correctPinyinDisplay?: string;
  meaningDisplay?: string;
}

export interface QuestionAnswerRecord {
  questionId: string;
  chapterId: number;
  sourceItemId?: string;
  drillType: DrillType;
  isAnswered: boolean;
  isCorrect: boolean;
  selectedOptionId?: string;
  assembledTileIds?: string[];
  matchedCorrectPairs?: number;
  totalMatchingPairs?: number;
  userDisplay: string;
  /** Optional question prompt & expected answer for granular WrongLog analytics */
  questionPrompt?: string;
  correctDisplay?: string;
}

export interface DrillStatEntry {
  attempted: number;
  correct: number;
}

export interface ChapterStatEntry {
  solved: number;
  correct: number;
  completedDrills: DrillType[];
  timeSeconds?: number;
}

export type ChapterExamPartNumber = 1 | 2 | 3 | 4;

export interface ChapterExamOption {
  id: string;
  label: string;
  subLabel?: string;
  isHanzi?: boolean;
  isPinyin?: boolean;
}

export interface ChapterExamQuestion {
  id: string;
  number: number; // 1..40
  part: ChapterExamPartNumber;
  chapterId: number;
  drillType: DrillType;
  sourceItemId: string;
  /** Short format tag shown next to the question number */
  subTypeLabel: string;
  promptPrimary: string;
  promptPinyin?: string;
  isHanziPrompt?: boolean;
  /** Part II sentence template with ____ */
  sentenceWithBlank?: string;
  targetBlank?: string;
  /** Audio clip text for playback */
  audioText?: string;
  options: ChapterExamOption[];
  correctOptionId: string;
  /** Part IV True/False metadata */
  isStatementTrue?: boolean;
  correctedHanzi?: string;
  correctedPinyin?: string;
  trapCategory?: string;
  /** Grading & Review explanation fields */
  correctDisplay: string;
  correctPinyinDisplay?: string;
  meaningDisplay?: string;
  explanation: string;
}

export interface ChapterExamPart {
  partNumber: ChapterExamPartNumber;
  romanNumeral: 'I' | 'II' | 'III' | 'IV';
  title: string;
  subtitle: string;
  instructions: string;
  questions: ChapterExamQuestion[];
}

export interface ChapterExamPaper {
  chapterId: number;
  chineseNumeral: string;
  chapterTitle: string;
  chapterSubtitle: string;
  totalQuestions: number;
  durationSeconds: number;
  parts: ChapterExamPart[];
}

export interface ChapterExamPartScore {
  partNumber: ChapterExamPartNumber;
  romanNumeral: 'I' | 'II' | 'III' | 'IV';
  title: string;
  correct: number;
  total: number;
}

export interface ChapterExamResult {
  id: string;
  chapterId: number;
  chapterTitle: string;
  score: number;
  total: number;
  percentage: number;
  partScores: ChapterExamPartScore[];
  durationSeconds: number;
  completedAt: string;
}

export type FinalExamModelId = 'model-1' | 'model-2' | 'model-3' | 'random';

export type FinalExamPartNumber = 1 | 2 | 3 | 4 | 5;

export interface FinalExamDialogueLine {
  speaker: string;
  hanzi: string;
  pinyin: string;
}

export interface FinalExamQuestion {
  id: string;
  number: number; // 1..50
  part: FinalExamPartNumber;
  chapterId: number;
  drillType: DrillType;
  sourceItemId: string;
  subTypeLabel: string;
  promptPrimary: string;
  promptPinyin?: string;
  isHanziPrompt?: boolean;
  /** Part II sentence template with ____ */
  sentenceWithBlank?: string;
  targetBlank?: string;
  /** Part III Reading & Dialogue Comprehension fields */
  readingFormat?: 'dialogue' | 'passage';
  dialogueLines?: FinalExamDialogueLine[];
  passageHanzi?: string;
  passagePinyin?: string;
  comprehensionQuestion?: string;
  /** Audio clip text for playback */
  audioText?: string;
  options: ChapterExamOption[];
  correctOptionId: string;
  /** Part V True/False metadata */
  isStatementTrue?: boolean;
  correctedHanzi?: string;
  correctedPinyin?: string;
  trapCategory?: string;
  /** Grading & Review explanation fields */
  correctDisplay: string;
  correctPinyinDisplay?: string;
  meaningDisplay?: string;
  explanation: string;
}

export interface FinalExamPart {
  partNumber: FinalExamPartNumber;
  romanNumeral: 'I' | 'II' | 'III' | 'IV' | 'V';
  title: string;
  subtitle: string;
  instructions: string;
  questions: FinalExamQuestion[];
}

export interface FinalExamPaper {
  modelId: FinalExamModelId;
  modelLabel: string;
  modelSubtitle: string;
  isDeterministic: boolean;
  seedTag: string;
  chapterIds: number[];
  scopeLabel: string;
  totalQuestions: number;
  durationSeconds: number;
  parts: FinalExamPart[];
}

export interface FinalExamPartScore {
  partNumber: FinalExamPartNumber;
  romanNumeral: 'I' | 'II' | 'III' | 'IV' | 'V';
  title: string;
  correct: number;
  total: number;
}

export interface FinalExamResult {
  id: string;
  modelId: FinalExamModelId;
  modelLabel: string;
  chapterIds: number[];
  scopeLabel: string;
  score: number;
  total: number;
  percentage: number;
  partScores: FinalExamPartScore[];
  durationSeconds: number;
  completedAt: string;
}

export interface StudentProgress {
  studentId: string;
  totalSolved: number;
  correctCount: number;
  wrongCount: number;
  activeSeconds: number;
  studyDates: string[];
  lastActive: string;
  drillStats: Record<DrillType, DrillStatEntry>;
  drillTimeSeconds: Record<DrillType, number>;
  chapterStats: Record<number, ChapterStatEntry>;
  mistakes: MistakeItem[];
  chapterExamResults?: ChapterExamResult[];
  finalExamResults?: FinalExamResult[];
}

export interface SheetsSyncPayload {
  studentId: string;
  studentName: string;
  studentCode: string;
  totalSolved: number;
  correctCount: number;
  wrongCount: number;
  accuracyPercent: number;
  activeMinutes: number;
  overallProgressPercent: number;
  lastActive: string;
  unlockedAccess?: string | UnlockedAccess;
  chapterExamResults?: ChapterExamResult[];
  finalExamResults?: FinalExamResult[];
  /** Optional granular analytics bundled with progress syncs */
  resultEntry?: AnalyticsResultLogEntry;
  examEntry?: AnalyticsExamLogEntry;
  wrongEntries?: AnalyticsWrongLogEntry[];
}

export interface AnalyticsResultLogEntry {
  ts: string;
  code: string;
  name: string;
  lesson: string;
  activity: string;
  kind: string;
  correct: number;
  total: number;
  pct: number;
  duration_ms: number;
  device: string;
}

export interface AnalyticsExamLogEntry {
  ts: string;
  code: string;
  name: string;
  exam_type: string;
  exam_title: string;
  chapters_scope: string;
  score: number;
  total: number;
  pct: number;
  duration_ms: number;
  device: string;
}

export interface AnalyticsWrongLogEntry {
  ts: string;
  code: string;
  name: string;
  lesson: string;
  activity: string;
  question: string;
  user_answer: string;
  correct_answer: string;
}

export interface AnalyticsLogBatchPayload {
  results?: AnalyticsResultLogEntry[];
  exams?: AnalyticsExamLogEntry[];
  wrongLog?: AnalyticsWrongLogEntry[];
}
