import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ALL_DRILL_TYPES, CHAPTERS_DATA, DRILL_METADATA } from '../data/chaptersData';
import { authenticateStudent } from '../data/students';
import { useActiveStudyTimer } from '../hooks/useActiveStudyTimer';
import {
  bindStudentDeviceInSheet,
  fetchStudentSessionFromSheet,
  flushAnalyticsRetryQueue,
  logAnalyticsEvents,
  syncStudentStatsToSheets,
  SyncResult,
} from '../services/sheetsSync';
import {
  AnalyticsExamLogEntry,
  AnalyticsResultLogEntry,
  AnalyticsWrongLogEntry,
  ChapterExamResult,
  ChapterStatEntry,
  DrillStatEntry,
  DrillType,
  FinalExamResult,
  MistakeItem,
  QuestionAnswerRecord,
  SheetsSyncPayload,
  Student,
  StudentProgress,
  StudentStudyBookmark,
  StudyBookmarkItemType,
  UnlockedAccess,
} from '../types';
import { STORAGE_KEYS as APP_STORAGE_KEYS } from '../config/appConfig';
import { getOrCreateClientDeviceId, parseUnlockedAccess } from '../utils/accessControl';

type ThemeMode = 'light' | 'dark';

const STORAGE_KEYS = {
  SESSION: APP_STORAGE_KEYS.ACTIVE_STUDENT,
  THEME: APP_STORAGE_KEYS.THEME,
  PINYIN: APP_STORAGE_KEYS.SHOW_PINYIN,
  PROGRESS_PREFIX: APP_STORAGE_KEYS.PROGRESS_PREFIX,
  BOOKMARKS_PREFIX: APP_STORAGE_KEYS.BOOKMARKS_PREFIX,
};

export function makeStudyBookmarkKey(itemType: StudyBookmarkItemType, itemId: string): string {
  return `${itemType}:${itemId}`;
}

function loadStudentBookmarks(studentId: string): Record<string, StudentStudyBookmark> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.BOOKMARKS_PREFIX}${studentId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StudentStudyBookmark>;
    if (!parsed || typeof parsed !== 'object') return {};
    const cleaned: Record<string, StudentStudyBookmark> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (
        v &&
        (v.itemType === 'vocab' || v.itemType === 'sentence') &&
        typeof v.itemId === 'string' &&
        typeof v.chapterId === 'number'
      ) {
        const noteText = typeof v.note === 'string' ? v.note : '';
        const isBookmarked = Boolean(v.bookmarked);
        if (isBookmarked || noteText.trim().length > 0) {
          cleaned[k] = {
            key: k,
            itemType: v.itemType,
            itemId: v.itemId,
            chapterId: v.chapterId,
            bookmarked: isBookmarked,
            note: noteText,
            updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt : new Date().toISOString(),
          };
        }
      }
    }
    return cleaned;
  } catch {
    return {};
  }
}

function saveStudentBookmarks(
  studentId: string,
  bookmarks: Record<string, StudentStudyBookmark>
): void {
  try {
    localStorage.setItem(
      `${STORAGE_KEYS.BOOKMARKS_PREFIX}${studentId}`,
      JSON.stringify(bookmarks)
    );
  } catch {
    // Ignore storage quota errors
  }
}

function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function makeMistakeKey(chapterId: number, drillType: DrillType, sourceItemId: string): string {
  return `${chapterId}::${drillType}::${sourceItemId}`;
}

function createEmptyProgress(studentId: string): StudentProgress {
  const drillStats = {} as Record<DrillType, DrillStatEntry>;
  const drillTimeSeconds = {} as Record<DrillType, number>;
  for (const dt of ALL_DRILL_TYPES) {
    drillStats[dt] = { attempted: 0, correct: 0 };
    drillTimeSeconds[dt] = 0;
  }

  const chapterStats = {} as Record<number, ChapterStatEntry>;
  for (const ch of CHAPTERS_DATA) {
    chapterStats[ch.id] = { solved: 0, correct: 0, completedDrills: [], timeSeconds: 0 };
  }

  return {
    studentId,
    totalSolved: 0,
    correctCount: 0,
    wrongCount: 0,
    activeSeconds: 0,
    studyDates: [getTodayIsoDate()],
    lastActive: new Date().toISOString(),
    drillStats,
    drillTimeSeconds,
    chapterStats,
    mistakes: [],
    chapterExamResults: [],
    finalExamResults: [],
  };
}

function distributeSecondsToChapters(
  chapterStats: Record<number, ChapterStatEntry>,
  chapterQuestionCounts: Map<number, number>,
  totalSeconds: number
): void {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  if (safeSeconds <= 0 || chapterQuestionCounts.size === 0) return;

  const entries = Array.from(chapterQuestionCounts.entries()).filter(([, count]) => count > 0);
  if (entries.length === 0) return;

  if (entries.length === 1) {
    const [chId] = entries[0];
    const prevCh = chapterStats[chId] ?? {
      solved: 0,
      correct: 0,
      completedDrills: [],
      timeSeconds: 0,
    };
    chapterStats[chId] = {
      ...prevCh,
      timeSeconds: (prevCh.timeSeconds ?? 0) + safeSeconds,
    };
    return;
  }

  const totalQuestions = entries.reduce((sum, [, count]) => sum + count, 0);
  if (totalQuestions <= 0) return;

  let distributed = 0;
  let primaryChId = entries[0][0];
  let maxCount = entries[0][1];

  for (const [chId, count] of entries) {
    if (count > maxCount) {
      maxCount = count;
      primaryChId = chId;
    }
    const share = Math.floor((safeSeconds * count) / totalQuestions);
    distributed += share;
    const prevCh = chapterStats[chId] ?? {
      solved: 0,
      correct: 0,
      completedDrills: [],
      timeSeconds: 0,
    };
    chapterStats[chId] = {
      ...prevCh,
      timeSeconds: (prevCh.timeSeconds ?? 0) + share,
    };
  }

  const remainder = safeSeconds - distributed;
  if (remainder > 0) {
    const prevPrimary = chapterStats[primaryChId] ?? {
      solved: 0,
      correct: 0,
      completedDrills: [],
      timeSeconds: 0,
    };
    chapterStats[primaryChId] = {
      ...prevPrimary,
      timeSeconds: (prevPrimary.timeSeconds ?? 0) + remainder,
    };
  }
}

function loadStudentProgress(studentId: string): StudentProgress {
  const fallback = createEmptyProgress(studentId);
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.PROGRESS_PREFIX}${studentId}`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StudentProgress>;

    const mergedDrillStats = { ...fallback.drillStats };
    if (parsed.drillStats) {
      for (const dt of ALL_DRILL_TYPES) {
        if (parsed.drillStats[dt]) {
          mergedDrillStats[dt] = parsed.drillStats[dt];
        }
      }
    }

    const mergedDrillTime = { ...fallback.drillTimeSeconds };
    if (parsed.drillTimeSeconds) {
      for (const dt of ALL_DRILL_TYPES) {
        const val = parsed.drillTimeSeconds[dt];
        if (typeof val === 'number' && !Number.isNaN(val)) {
          mergedDrillTime[dt] = val;
        }
      }
    }

    const mergedChapterStats: Record<number, ChapterStatEntry> = { ...fallback.chapterStats };
    if (parsed.chapterStats) {
      for (const [rawId, entry] of Object.entries(parsed.chapterStats)) {
        const chId = Number(rawId);
        if (!Number.isNaN(chId) && entry) {
          mergedChapterStats[chId] = {
            solved: typeof entry.solved === 'number' ? entry.solved : 0,
            correct: typeof entry.correct === 'number' ? entry.correct : 0,
            completedDrills: Array.isArray(entry.completedDrills) ? entry.completedDrills : [],
            timeSeconds:
              typeof entry.timeSeconds === 'number' && !Number.isNaN(entry.timeSeconds)
                ? entry.timeSeconds
                : 0,
          };
        }
      }
    }
    const validDrillSet = new Set<string>(ALL_DRILL_TYPES);
    const cleanedMistakes: MistakeItem[] = Array.isArray(parsed.mistakes)
      ? parsed.mistakes.filter(
          (m): m is MistakeItem =>
            Boolean(m && m.key && m.sourceItemId && validDrillSet.has(m.drillType))
        )
      : [];

    return {
      ...fallback,
      ...parsed,
      studentId,
      drillStats: mergedDrillStats,
      drillTimeSeconds: mergedDrillTime,
      chapterStats: mergedChapterStats,
      mistakes: cleanedMistakes,
      chapterExamResults: Array.isArray(parsed.chapterExamResults)
        ? parsed.chapterExamResults
        : [],
      finalExamResults: Array.isArray(parsed.finalExamResults)
        ? parsed.finalExamResults
        : [],
      studyDates: Array.isArray(parsed.studyDates) ? parsed.studyDates : fallback.studyDates,
    };
  } catch {
    return fallback;
  }
}

function saveStudentProgress(progress: StudentProgress): void {
  try {
    localStorage.setItem(
      `${STORAGE_KEYS.PROGRESS_PREFIX}${progress.studentId}`,
      JSON.stringify(progress)
    );
  } catch {
    // Ignore storage quota errors
  }
}

function calculateStudyStreak(studyDates: string[]): number {
  if (studyDates.length === 0) return 0;
  const uniqueDates = Array.from(new Set(studyDates)).sort().reverse();
  const today = getTodayIsoDate();

  const parseDate = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  };

  const dayMs = 24 * 60 * 60 * 1000;
  const latestMs = parseDate(uniqueDates[0]);
  const todayMs = parseDate(today);

  if (Math.round((todayMs - latestMs) / dayMs) > 1) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prevMs = parseDate(uniqueDates[i - 1]);
    const currMs = parseDate(uniqueDates[i]);
    if (Math.round((prevMs - currMs) / dayMs) === 1) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

function computeChapterCompletion(chapterId: number, stats: ChapterStatEntry | undefined): number {
  const chapter = CHAPTERS_DATA.find((c) => c.id === chapterId);
  if (!chapter || (chapter.vocab.length === 0 && chapter.sentences.length === 0)) {
    return 0;
  }

  const availableDrills = ALL_DRILL_TYPES.filter((dt) => {
    if (
      dt === 'sentence-hanzi-to-arabic' ||
      dt === 'sentence-arabic-to-hanzi' ||
      dt === 'sentence-builder' ||
      dt === 'fill-in-blank' ||
      dt === 'true-false'
    ) {
      return chapter.sentences.length > 0;
    }
    return chapter.vocab.length > 0;
  });

  if (availableDrills.length === 0 || !stats) return 0;
  const completedCount = stats.completedDrills.filter((d) => availableDrills.includes(d)).length;
  return Math.min(100, Math.round((completedCount / availableDrills.length) * 100));
}

function computeOverallProgress(progress: StudentProgress): number {
  const sumPercent = CHAPTERS_DATA.reduce((acc, chapter) => {
    return acc + computeChapterCompletion(chapter.id, progress.chapterStats[chapter.id]);
  }, 0);
  return Math.round(sumPercent / CHAPTERS_DATA.length);
}

interface ComputedAnalytics {
  accuracyPercent: number;
  overallProgressPercent: number;
  streakDays: number;
  weakestDrillType: DrillType | null;
  getChapterCompletion: (chapterId: number) => number;
  getChapterAccuracy: (chapterId: number) => number;
}

interface AppContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  showPinyin: boolean;
  togglePinyin: () => void;
  currentStudent: Student | null;
  unlockedAccess: UnlockedAccess;
  refreshStudentAccess: () => Promise<UnlockedAccess | null>;
  login: (nameOrId: string, code: string, verifiedStudent?: Student) => boolean;
  logout: () => void;
  progress: StudentProgress | null;
  analytics: ComputedAnalytics;
  lastSyncResult: SyncResult | null;
  addDrillElapsedTime: (drillElapsedSeconds: Partial<Record<DrillType, number>>) => void;
  recordCompletedSession: (
    records: QuestionAnswerRecord[],
    drillElapsedSeconds?: Partial<Record<DrillType, number>>,
    options?: {
      isMistakeReview?: boolean;
      lesson?: string;
      activity?: string;
      kind?: string;
      durationMs?: number;
    }
  ) => Promise<SyncResult | null>;
  recordChapterExamResult: (
    examResult: ChapterExamResult,
    records: QuestionAnswerRecord[],
    drillElapsedSeconds?: Partial<Record<DrillType, number>>
  ) => Promise<SyncResult | null>;
  recordFinalExamResult: (
    examResult: FinalExamResult,
    records: QuestionAnswerRecord[],
    drillElapsedSeconds?: Partial<Record<DrillType, number>>
  ) => Promise<SyncResult | null>;
  studyVault: Record<string, StudentStudyBookmark>;
  vaultCount: number;
  isItemBookmarked: (itemType: StudyBookmarkItemType, itemId: string) => boolean;
  getItemNote: (itemType: StudyBookmarkItemType, itemId: string) => string;
  toggleBookmark: (itemType: StudyBookmarkItemType, itemId: string, chapterId: number) => void;
  saveItemNote: (
    itemType: StudyBookmarkItemType,
    itemId: string,
    chapterId: number,
    note: string
  ) => void;
  removeVaultEntry: (key: string) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [showPinyin, setShowPinyin] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PINYIN);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const [currentStudent, setCurrentStudent] = useState<Student | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!saved) return null;
      const parsed = JSON.parse(saved) as Student;
      return {
        ...parsed,
        unlockedAccess: parseUnlockedAccess(parsed.unlockedAccess),
      };
    } catch {
      return null;
    }
  });

  const [progress, setProgress] = useState<StudentProgress | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!saved) return null;
      const student = JSON.parse(saved) as Student;
      return loadStudentProgress(student.id);
    } catch {
      return null;
    }
  });

  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const [studyVault, setStudyVault] = useState<Record<string, StudentStudyBookmark>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!saved) return {};
      const student = JSON.parse(saved) as Student;
      return loadStudentBookmarks(student.id);
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PINYIN, String(showPinyin));
    } catch {
      // Ignore storage errors
    }
  }, [showPinyin]);

  const handleTimerTick = useCallback((deltaSeconds: number) => {
    setProgress((prev) => {
      if (!prev) return prev;
      const today = getTodayIsoDate();
      const studyDates = prev.studyDates.includes(today)
        ? prev.studyDates
        : [...prev.studyDates, today];
      const updated: StudentProgress = {
        ...prev,
        activeSeconds: prev.activeSeconds + deltaSeconds,
        studyDates,
        lastActive: new Date().toISOString(),
      };
      saveStudentProgress(updated);
      return updated;
    });
  }, []);

  useActiveStudyTimer(Boolean(currentStudent), handleTimerTick);

  // Automatically flush any offline-queued granular analytics on login/mount and browser reconnect
  useEffect(() => {
    if (!currentStudent) return;
    void flushAnalyticsRetryQueue();
    const handleOnline = () => {
      void flushAnalyticsRetryQueue();
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [currentStudent?.id]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const togglePinyin = useCallback(() => {
    setShowPinyin((prev) => !prev);
  }, []);

  const refreshStudentAccess = useCallback(async (): Promise<UnlockedAccess | null> => {
    if (!currentStudent) return null;
    const latestSession = await fetchStudentSessionFromSheet(currentStudent);
    if (!latestSession) return null;

    const clientDeviceId = getOrCreateClientDeviceId();
    if (latestSession.boundDeviceId && latestSession.boundDeviceId !== clientDeviceId) {
      setCurrentStudent(null);
      setProgress(null);
      try {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      } catch {
        // Ignore storage errors
      }
      return null;
    }

    if (!latestSession.boundDeviceId) {
      void bindStudentDeviceInSheet(currentStudent, clientDeviceId);
    }

    const latestAccess = latestSession.unlockedAccess;
    setCurrentStudent((prev) => {
      if (!prev) return prev;
      const prevJson = JSON.stringify(parseUnlockedAccess(prev.unlockedAccess));
      const nextJson = JSON.stringify(latestAccess);
      const nextBound = latestSession.boundDeviceId || clientDeviceId;
      if (prevJson === nextJson && prev.boundDeviceId === nextBound) return prev;
      const updatedStudent: Student = {
        ...prev,
        unlockedAccess: latestAccess,
        boundDeviceId: nextBound,
      };
      try {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedStudent));
      } catch {
        // Ignore storage errors
      }
      return updatedStudent;
    });

    return latestAccess;
  }, [currentStudent]);

  // Automatically sync student permissions and device binding from Google Sheets on page load/refresh
  useEffect(() => {
    if (!currentStudent) return;
    let active = true;
    const clientDeviceId = getOrCreateClientDeviceId();

    fetchStudentSessionFromSheet(currentStudent).then((latestSession) => {
      if (!active || !latestSession) return;

      if (latestSession.boundDeviceId && latestSession.boundDeviceId !== clientDeviceId) {
        setCurrentStudent(null);
        setProgress(null);
        try {
          localStorage.removeItem(STORAGE_KEYS.SESSION);
        } catch {
          // Ignore storage errors
        }
        return;
      }

      if (!latestSession.boundDeviceId) {
        void bindStudentDeviceInSheet(currentStudent, clientDeviceId);
      }

      const latestAccess = latestSession.unlockedAccess;
      const nextBound = latestSession.boundDeviceId || clientDeviceId;

      setCurrentStudent((prev) => {
        if (!prev || prev.id !== currentStudent.id) return prev;
        const prevJson = JSON.stringify(parseUnlockedAccess(prev.unlockedAccess));
        const nextJson = JSON.stringify(latestAccess);
        if (prevJson === nextJson && prev.boundDeviceId === nextBound) return prev;
        const updatedStudent: Student = {
          ...prev,
          unlockedAccess: latestAccess,
          boundDeviceId: nextBound,
        };
        try {
          localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedStudent));
        } catch {
          // Ignore storage errors
        }
        return updatedStudent;
      });
    });

    return () => {
      active = false;
    };
  }, [currentStudent?.id, currentStudent?.code]);

  const unlockedAccess = useMemo<UnlockedAccess>(
    () => parseUnlockedAccess(currentStudent?.unlockedAccess),
    [currentStudent?.unlockedAccess]
  );

  const login = useCallback(
    (nameOrId: string, code: string, verifiedStudent?: Student): boolean => {
      const matched = verifiedStudent ?? authenticateStudent(nameOrId, code);
      if (!matched) return false;

      const normalizedStudent: Student = {
        ...matched,
        unlockedAccess: parseUnlockedAccess(matched.unlockedAccess),
      };

      setCurrentStudent(normalizedStudent);
      const loaded = loadStudentProgress(normalizedStudent.id);
      const today = getTodayIsoDate();
      if (!loaded.studyDates.includes(today)) {
        loaded.studyDates = [...loaded.studyDates, today];
      }
      loaded.lastActive = new Date().toISOString();
      saveStudentProgress(loaded);
      setProgress(loaded);
      setStudyVault(loadStudentBookmarks(normalizedStudent.id));

      try {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(normalizedStudent));
      } catch {
        // Ignore storage errors
      }
      return true;
    },
    []
  );

  const logout = useCallback(() => {
    setCurrentStudent(null);
    setProgress(null);
    setStudyVault({});
    setLastSyncResult(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const isItemBookmarked = useCallback(
    (itemType: StudyBookmarkItemType, itemId: string): boolean => {
      const entry = studyVault[makeStudyBookmarkKey(itemType, itemId)];
      return Boolean(entry?.bookmarked);
    },
    [studyVault]
  );

  const getItemNote = useCallback(
    (itemType: StudyBookmarkItemType, itemId: string): string => {
      const entry = studyVault[makeStudyBookmarkKey(itemType, itemId)];
      return entry?.note ?? '';
    },
    [studyVault]
  );

  const toggleBookmark = useCallback(
    (itemType: StudyBookmarkItemType, itemId: string, chapterId: number) => {
      if (!currentStudent) return;
      const key = makeStudyBookmarkKey(itemType, itemId);
      setStudyVault((prev) => {
        const existing = prev[key];
        const nextBookmarked = !existing?.bookmarked;
        const existingNote = existing?.note ?? '';
        const next = { ...prev };
        if (!nextBookmarked && existingNote.trim().length === 0) {
          delete next[key];
        } else {
          next[key] = {
            key,
            itemType,
            itemId,
            chapterId,
            bookmarked: nextBookmarked,
            note: existingNote,
            updatedAt: new Date().toISOString(),
          };
        }
        saveStudentBookmarks(currentStudent.id, next);
        return next;
      });
    },
    [currentStudent]
  );

  const saveItemNote = useCallback(
    (itemType: StudyBookmarkItemType, itemId: string, chapterId: number, note: string) => {
      if (!currentStudent) return;
      const key = makeStudyBookmarkKey(itemType, itemId);
      const trimmed = note.trim();
      setStudyVault((prev) => {
        const existing = prev[key];
        const nextBookmarked = trimmed.length > 0 ? true : Boolean(existing?.bookmarked);
        const next = { ...prev };
        if (!nextBookmarked && trimmed.length === 0) {
          delete next[key];
        } else {
          next[key] = {
            key,
            itemType,
            itemId,
            chapterId,
            bookmarked: nextBookmarked,
            note: trimmed,
            updatedAt: new Date().toISOString(),
          };
        }
        saveStudentBookmarks(currentStudent.id, next);
        return next;
      });
    },
    [currentStudent]
  );

  const removeVaultEntry = useCallback(
    (key: string) => {
      if (!currentStudent) return;
      setStudyVault((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        saveStudentBookmarks(currentStudent.id, next);
        return next;
      });
    },
    [currentStudent]
  );

  const vaultCount = useMemo(() => Object.keys(studyVault).length, [studyVault]);

  const addDrillElapsedTime = useCallback(
    (drillElapsedSeconds: Partial<Record<DrillType, number>>) => {
      const entries = Object.entries(drillElapsedSeconds).filter(
        ([, secs]) => typeof secs === 'number' && secs > 0
      );
      if (entries.length === 0) return;

      const totalAddedSeconds = entries.reduce((sum, [, secs]) => sum + (secs ?? 0), 0);

      setProgress((prev) => {
        if (!prev) return prev;
        const updatedTimes = { ...prev.drillTimeSeconds };
        for (const [dt, secs] of entries) {
          const drillKey = dt as DrillType;
          updatedTimes[drillKey] = (updatedTimes[drillKey] ?? 0) + (secs ?? 0);
        }
        const updated: StudentProgress = {
          ...prev,
          drillTimeSeconds: updatedTimes,
          lastActive: new Date().toISOString(),
        };
        saveStudentProgress(updated);
        return updated;
      });

      // Log meaningful partial active study duration (>= 10s) to the Results tab with offline retry
      if (currentStudent && totalAddedSeconds >= 10) {
        const primaryDrillKey = entries[0][0] as DrillType;
        const activityLabel = DRILL_METADATA[primaryDrillKey]?.titleAr ?? primaryDrillKey;
        const activeEntry: AnalyticsResultLogEntry = {
          ts: new Date().toISOString(),
          code: currentStudent.code,
          name: currentStudent.name,
          lesson: 'Active Study',
          activity: activityLabel,
          kind: 'active-study',
          correct: 0,
          total: 0,
          pct: 0,
          duration_ms: Math.round(totalAddedSeconds * 1000),
          device: getOrCreateClientDeviceId(),
        };
        void logAnalyticsEvents({ results: [activeEntry] });
      }
    },
    [currentStudent]
  );

  const recordCompletedSession = useCallback(
    async (
      records: QuestionAnswerRecord[],
      drillElapsedSeconds?: Partial<Record<DrillType, number>>,
      options?: {
        isMistakeReview?: boolean;
        lesson?: string;
        activity?: string;
        kind?: string;
        durationMs?: number;
      }
    ): Promise<SyncResult | null> => {
      if (!currentStudent || !progress || records.length === 0) {
        return null;
      }

      const answeredRecords = records.filter((r) => r.isAnswered);
      if (answeredRecords.length === 0) return null;

      const addedSolved = answeredRecords.length;
      const addedCorrect = answeredRecords.filter((r) => r.isCorrect).length;
      const addedWrong = addedSolved - addedCorrect;

      const updatedDrillStats: Record<DrillType, DrillStatEntry> = {
        ...progress.drillStats,
      };
      const updatedDrillTimes: Record<DrillType, number> = {
        ...progress.drillTimeSeconds,
      };
      if (drillElapsedSeconds) {
        for (const [dt, secs] of Object.entries(drillElapsedSeconds)) {
          if (typeof secs === 'number' && secs > 0) {
            const key = dt as DrillType;
            updatedDrillTimes[key] = (updatedDrillTimes[key] ?? 0) + secs;
          }
        }
      }

      const updatedChapterStats: Record<number, ChapterStatEntry> = {
        ...progress.chapterStats,
      };

      const mistakesMap = new Map<string, MistakeItem>(
        progress.mistakes.map((m) => [m.key, m])
      );
      const nowIso = new Date().toISOString();

      const chapterQuestionCounts = new Map<number, number>();
      const computedDurationMs =
        typeof options?.durationMs === 'number' && options.durationMs >= 0
          ? Math.round(options.durationMs)
          : Math.round(
              Object.values(drillElapsedSeconds ?? {}).reduce(
                (sum, secs) => sum + (typeof secs === 'number' && secs > 0 ? secs : 0),
                0
              ) * 1000
            );
      const sessionSeconds = Math.max(0, Math.round(computedDurationMs / 1000));

      for (const rec of answeredRecords) {
        const existingDrill = updatedDrillStats[rec.drillType] ?? { attempted: 0, correct: 0 };
        updatedDrillStats[rec.drillType] = {
          attempted: existingDrill.attempted + 1,
          correct: existingDrill.correct + (rec.isCorrect ? 1 : 0),
        };

        const prevCh = updatedChapterStats[rec.chapterId] ?? {
          solved: 0,
          correct: 0,
          completedDrills: [],
          timeSeconds: 0,
        };
        const completedDrills = prevCh.completedDrills.includes(rec.drillType)
          ? prevCh.completedDrills
          : [...prevCh.completedDrills, rec.drillType];

        updatedChapterStats[rec.chapterId] = {
          solved: prevCh.solved + 1,
          correct: prevCh.correct + (rec.isCorrect ? 1 : 0),
          completedDrills,
          timeSeconds: prevCh.timeSeconds ?? 0,
        };
        chapterQuestionCounts.set(
          rec.chapterId,
          (chapterQuestionCounts.get(rec.chapterId) ?? 0) + 1
        );

        // Update mistakes bank (add/increment missCount or clear when answered correctly in Mistake Review mode)
        if (rec.sourceItemId) {
          const mKey = makeMistakeKey(rec.chapterId, rec.drillType, rec.sourceItemId);
          if (!rec.isCorrect) {
            const existingMistake = mistakesMap.get(mKey);
            mistakesMap.set(mKey, {
              key: mKey,
              chapterId: rec.chapterId,
              drillType: rec.drillType,
              sourceItemId: rec.sourceItemId,
              recordedAt: nowIso,
              missCount: (existingMistake?.missCount ?? 0) + 1,
            });
          } else if (options?.isMistakeReview) {
            mistakesMap.delete(mKey);
          }
        }
      }

      distributeSecondsToChapters(updatedChapterStats, chapterQuestionCounts, sessionSeconds);

      const today = getTodayIsoDate();
      const studyDates = progress.studyDates.includes(today)
        ? progress.studyDates
        : [...progress.studyDates, today];

      const updatedProgress: StudentProgress = {
        ...progress,
        totalSolved: progress.totalSolved + addedSolved,
        correctCount: progress.correctCount + addedCorrect,
        wrongCount: progress.wrongCount + addedWrong,
        studyDates,
        lastActive: nowIso,
        drillStats: updatedDrillStats,
        drillTimeSeconds: updatedDrillTimes,
        chapterStats: updatedChapterStats,
        mistakes: Array.from(mistakesMap.values()),
      };

      saveStudentProgress(updatedProgress);
      setProgress(updatedProgress);

      const accuracyPercent =
        updatedProgress.totalSolved > 0
          ? Math.round((updatedProgress.correctCount / updatedProgress.totalSolved) * 100)
          : 0;
      const overallProgressPercent = computeOverallProgress(updatedProgress);
      const activeMinutes = Math.round(updatedProgress.activeSeconds / 60);

      // Build granular Results + WrongLog entries
      const uniqueChapterIds = Array.from(new Set(answeredRecords.map((r) => r.chapterId))).sort(
        (a, b) => a - b
      );
      const inferredLesson =
        options?.lesson ||
        (options?.isMistakeReview
          ? 'Mistake Review'
          : uniqueChapterIds.length === 1
            ? `Chapter ${uniqueChapterIds[0]}`
            : `Chapters ${uniqueChapterIds.join(', ')}`);

      const uniqueDrills = Array.from(new Set(answeredRecords.map((r) => r.drillType)));
      const inferredActivity =
        options?.activity ||
        (uniqueDrills.length === 1
          ? (DRILL_METADATA[uniqueDrills[0]]?.titleAr ?? uniqueDrills[0])
          : 'Mixed Drills');

      const sessionPct =
        addedSolved > 0 ? Math.round((addedCorrect / addedSolved) * 100) : 0;
      const deviceId = getOrCreateClientDeviceId();

      const resultEntry: AnalyticsResultLogEntry = {
        ts: nowIso,
        code: currentStudent.code,
        name: currentStudent.name,
        lesson: inferredLesson,
        activity: inferredActivity,
        kind: options?.kind || (options?.isMistakeReview ? 'mistake-review' : 'drill'),
        correct: addedCorrect,
        total: addedSolved,
        pct: sessionPct,
        duration_ms: computedDurationMs,
        device: deviceId,
      };

      const wrongEntries: AnalyticsWrongLogEntry[] = answeredRecords
        .filter((rec) => !rec.isCorrect)
        .map((rec) => ({
          ts: nowIso,
          code: currentStudent.code,
          name: currentStudent.name,
          lesson: `Chapter ${rec.chapterId}`,
          activity: DRILL_METADATA[rec.drillType]?.titleAr ?? rec.drillType,
          question: rec.questionPrompt || rec.sourceItemId || rec.questionId,
          user_answer: rec.userDisplay || 'Not answered',
          correct_answer: rec.correctDisplay || '',
        }));

      const payload: SheetsSyncPayload = {
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        studentCode: currentStudent.code,
        totalSolved: updatedProgress.totalSolved,
        correctCount: updatedProgress.correctCount,
        wrongCount: updatedProgress.wrongCount,
        accuracyPercent,
        activeMinutes,
        overallProgressPercent,
        lastActive: nowIso,
        chapterExamResults: updatedProgress.chapterExamResults ?? [],
        finalExamResults: updatedProgress.finalExamResults ?? [],
        resultEntry,
        wrongEntries,
      };

      const result = await syncStudentStatsToSheets(payload);
      setLastSyncResult(result);
      return result;
    },
    [currentStudent, progress]
  );

  const recordChapterExamResult = useCallback(
    async (
      examResult: ChapterExamResult,
      records: QuestionAnswerRecord[],
      drillElapsedSeconds?: Partial<Record<DrillType, number>>
    ): Promise<SyncResult | null> => {
      if (!currentStudent || !progress) return null;

      const addedSolved = records.length;
      const addedCorrect = records.filter((r) => r.isCorrect).length;
      const addedWrong = addedSolved - addedCorrect;

      const updatedDrillStats: Record<DrillType, DrillStatEntry> = {
        ...progress.drillStats,
      };
      const updatedDrillTimes: Record<DrillType, number> = {
        ...progress.drillTimeSeconds,
      };
      if (drillElapsedSeconds) {
        for (const [dt, secs] of Object.entries(drillElapsedSeconds)) {
          if (typeof secs === 'number' && secs > 0) {
            const key = dt as DrillType;
            updatedDrillTimes[key] = (updatedDrillTimes[key] ?? 0) + secs;
          }
        }
      }

      const updatedChapterStats: Record<number, ChapterStatEntry> = {
        ...progress.chapterStats,
      };
      const mistakesMap = new Map<string, MistakeItem>(
        progress.mistakes.map((m) => [m.key, m])
      );
      const nowIso = examResult.completedAt || new Date().toISOString();

      for (const rec of records) {
        const existingDrill = updatedDrillStats[rec.drillType] ?? { attempted: 0, correct: 0 };
        updatedDrillStats[rec.drillType] = {
          attempted: existingDrill.attempted + 1,
          correct: existingDrill.correct + (rec.isCorrect ? 1 : 0),
        };

        const prevCh = updatedChapterStats[rec.chapterId] ?? {
          solved: 0,
          correct: 0,
          completedDrills: [],
          timeSeconds: 0,
        };
        const completedDrills = prevCh.completedDrills.includes(rec.drillType)
          ? prevCh.completedDrills
          : [...prevCh.completedDrills, rec.drillType];

        updatedChapterStats[rec.chapterId] = {
          solved: prevCh.solved + 1,
          correct: prevCh.correct + (rec.isCorrect ? 1 : 0),
          completedDrills,
          timeSeconds: prevCh.timeSeconds ?? 0,
        };

        if (rec.sourceItemId && !rec.isCorrect) {
          const mKey = makeMistakeKey(rec.chapterId, rec.drillType, rec.sourceItemId);
          const existingMistake = mistakesMap.get(mKey);
          mistakesMap.set(mKey, {
            key: mKey,
            chapterId: rec.chapterId,
            drillType: rec.drillType,
            sourceItemId: rec.sourceItemId,
            recordedAt: nowIso,
            missCount: (existingMistake?.missCount ?? 0) + 1,
          });
        }
      }

      const chapterExamSeconds = Math.max(0, Math.round(examResult.durationSeconds));
      if (chapterExamSeconds > 0) {
        const prevExamCh = updatedChapterStats[examResult.chapterId] ?? {
          solved: 0,
          correct: 0,
          completedDrills: [],
          timeSeconds: 0,
        };
        updatedChapterStats[examResult.chapterId] = {
          ...prevExamCh,
          timeSeconds: (prevExamCh.timeSeconds ?? 0) + chapterExamSeconds,
        };
      }

      const today = getTodayIsoDate();
      const studyDates = progress.studyDates.includes(today)
        ? progress.studyDates
        : [...progress.studyDates, today];

      const existingExams = Array.isArray(progress.chapterExamResults)
        ? progress.chapterExamResults
        : [];
      const updatedExamResults = [examResult, ...existingExams].slice(0, 60);

      const updatedProgress: StudentProgress = {
        ...progress,
        totalSolved: progress.totalSolved + addedSolved,
        correctCount: progress.correctCount + addedCorrect,
        wrongCount: progress.wrongCount + addedWrong,
        studyDates,
        lastActive: nowIso,
        drillStats: updatedDrillStats,
        drillTimeSeconds: updatedDrillTimes,
        chapterStats: updatedChapterStats,
        mistakes: Array.from(mistakesMap.values()),
        chapterExamResults: updatedExamResults,
      };

      saveStudentProgress(updatedProgress);
      setProgress(updatedProgress);

      const accuracyPercent =
        updatedProgress.totalSolved > 0
          ? Math.round((updatedProgress.correctCount / updatedProgress.totalSolved) * 100)
          : 0;
      const overallProgressPercent = computeOverallProgress(updatedProgress);
      const activeMinutes = Math.round(updatedProgress.activeSeconds / 60);

      const chapterExamEntry: AnalyticsExamLogEntry = {
        ts: nowIso,
        code: currentStudent.code,
        name: currentStudent.name,
        exam_type: 'chapter-exam',
        exam_title: examResult.chapterTitle,
        chapters_scope: `Chapter ${examResult.chapterId}`,
        score: examResult.score,
        total: examResult.total,
        pct: examResult.percentage,
        duration_ms: Math.max(0, Math.round(examResult.durationSeconds * 1000)),
        device: getOrCreateClientDeviceId(),
      };

      const chapterExamWrongEntries: AnalyticsWrongLogEntry[] = records
        .filter((rec) => !rec.isCorrect)
        .map((rec) => ({
          ts: nowIso,
          code: currentStudent.code,
          name: currentStudent.name,
          lesson: `Chapter ${rec.chapterId}`,
          activity: `Chapter ${examResult.chapterId} Exam (${DRILL_METADATA[rec.drillType]?.titleAr ?? rec.drillType})`,
          question: rec.questionPrompt || rec.sourceItemId || rec.questionId,
          user_answer: rec.userDisplay || 'Not answered',
          correct_answer: rec.correctDisplay || '',
        }));

      const payload: SheetsSyncPayload = {
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        studentCode: currentStudent.code,
        totalSolved: updatedProgress.totalSolved,
        correctCount: updatedProgress.correctCount,
        wrongCount: updatedProgress.wrongCount,
        accuracyPercent,
        activeMinutes,
        overallProgressPercent,
        lastActive: nowIso,
        chapterExamResults: updatedExamResults,
        finalExamResults: updatedProgress.finalExamResults ?? [],
        examEntry: chapterExamEntry,
        wrongEntries: chapterExamWrongEntries,
      };

      const result = await syncStudentStatsToSheets(payload);
      setLastSyncResult(result);
      return result;
    },
    [currentStudent, progress]
  );

  const recordFinalExamResult = useCallback(
    async (
      examResult: FinalExamResult,
      records: QuestionAnswerRecord[],
      drillElapsedSeconds?: Partial<Record<DrillType, number>>
    ): Promise<SyncResult | null> => {
      if (!currentStudent || !progress) return null;

      const addedSolved = records.length;
      const addedCorrect = records.filter((r) => r.isCorrect).length;
      const addedWrong = addedSolved - addedCorrect;

      const updatedDrillStats: Record<DrillType, DrillStatEntry> = {
        ...progress.drillStats,
      };
      const updatedDrillTimes: Record<DrillType, number> = {
        ...progress.drillTimeSeconds,
      };
      if (drillElapsedSeconds) {
        for (const [dt, secs] of Object.entries(drillElapsedSeconds)) {
          if (typeof secs === 'number' && secs > 0) {
            const key = dt as DrillType;
            updatedDrillTimes[key] = (updatedDrillTimes[key] ?? 0) + secs;
          }
        }
      }

      const updatedChapterStats: Record<number, ChapterStatEntry> = {
        ...progress.chapterStats,
      };
      const mistakesMap = new Map<string, MistakeItem>(
        progress.mistakes.map((m) => [m.key, m])
      );
      const nowIso = examResult.completedAt || new Date().toISOString();

      const finalExamChapterCounts = new Map<number, number>();
      for (const rec of records) {
        const existingDrill = updatedDrillStats[rec.drillType] ?? { attempted: 0, correct: 0 };
        updatedDrillStats[rec.drillType] = {
          attempted: existingDrill.attempted + 1,
          correct: existingDrill.correct + (rec.isCorrect ? 1 : 0),
        };

        const prevCh = updatedChapterStats[rec.chapterId] ?? {
          solved: 0,
          correct: 0,
          completedDrills: [],
          timeSeconds: 0,
        };
        const completedDrills = prevCh.completedDrills.includes(rec.drillType)
          ? prevCh.completedDrills
          : [...prevCh.completedDrills, rec.drillType];

        updatedChapterStats[rec.chapterId] = {
          solved: prevCh.solved + 1,
          correct: prevCh.correct + (rec.isCorrect ? 1 : 0),
          completedDrills,
          timeSeconds: prevCh.timeSeconds ?? 0,
        };
        finalExamChapterCounts.set(
          rec.chapterId,
          (finalExamChapterCounts.get(rec.chapterId) ?? 0) + 1
        );

        if (rec.sourceItemId && !rec.isCorrect && !rec.sourceItemId.startsWith('rc-')) {
          const mKey = makeMistakeKey(rec.chapterId, rec.drillType, rec.sourceItemId);
          const existingMistake = mistakesMap.get(mKey);
          mistakesMap.set(mKey, {
            key: mKey,
            chapterId: rec.chapterId,
            drillType: rec.drillType,
            sourceItemId: rec.sourceItemId,
            recordedAt: nowIso,
            missCount: (existingMistake?.missCount ?? 0) + 1,
          });
        }
      }

      distributeSecondsToChapters(
        updatedChapterStats,
        finalExamChapterCounts,
        Math.max(0, Math.round(examResult.durationSeconds))
      );

      const today = getTodayIsoDate();
      const studyDates = progress.studyDates.includes(today)
        ? progress.studyDates
        : [...progress.studyDates, today];

      const existingFinals = Array.isArray(progress.finalExamResults)
        ? progress.finalExamResults
        : [];
      const updatedFinalResults = [examResult, ...existingFinals].slice(0, 60);

      const updatedProgress: StudentProgress = {
        ...progress,
        totalSolved: progress.totalSolved + addedSolved,
        correctCount: progress.correctCount + addedCorrect,
        wrongCount: progress.wrongCount + addedWrong,
        studyDates,
        lastActive: nowIso,
        drillStats: updatedDrillStats,
        drillTimeSeconds: updatedDrillTimes,
        chapterStats: updatedChapterStats,
        mistakes: Array.from(mistakesMap.values()),
        finalExamResults: updatedFinalResults,
      };

      saveStudentProgress(updatedProgress);
      setProgress(updatedProgress);

      const accuracyPercent =
        updatedProgress.totalSolved > 0
          ? Math.round((updatedProgress.correctCount / updatedProgress.totalSolved) * 100)
          : 0;
      const overallProgressPercent = computeOverallProgress(updatedProgress);
      const activeMinutes = Math.round(updatedProgress.activeSeconds / 60);

      const finalExamEntry: AnalyticsExamLogEntry = {
        ts: nowIso,
        code: currentStudent.code,
        name: currentStudent.name,
        exam_type: examResult.modelId === 'random' ? 'final-random' : `final-${examResult.modelId}`,
        exam_title: examResult.modelLabel,
        chapters_scope: examResult.scopeLabel,
        score: examResult.score,
        total: examResult.total,
        pct: examResult.percentage,
        duration_ms: Math.max(0, Math.round(examResult.durationSeconds * 1000)),
        device: getOrCreateClientDeviceId(),
      };

      const finalExamWrongEntries: AnalyticsWrongLogEntry[] = records
        .filter((rec) => !rec.isCorrect)
        .map((rec) => ({
          ts: nowIso,
          code: currentStudent.code,
          name: currentStudent.name,
          lesson: `Chapter ${rec.chapterId}`,
          activity: `${examResult.modelLabel} (${DRILL_METADATA[rec.drillType]?.titleAr ?? rec.drillType})`,
          question: rec.questionPrompt || rec.sourceItemId || rec.questionId,
          user_answer: rec.userDisplay || 'Not answered',
          correct_answer: rec.correctDisplay || '',
        }));

      const payload: SheetsSyncPayload = {
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        studentCode: currentStudent.code,
        totalSolved: updatedProgress.totalSolved,
        correctCount: updatedProgress.correctCount,
        wrongCount: updatedProgress.wrongCount,
        accuracyPercent,
        activeMinutes,
        overallProgressPercent,
        lastActive: nowIso,
        chapterExamResults: updatedProgress.chapterExamResults ?? [],
        finalExamResults: updatedFinalResults,
        examEntry: finalExamEntry,
        wrongEntries: finalExamWrongEntries,
      };

      const result = await syncStudentStatsToSheets(payload);
      setLastSyncResult(result);
      return result;
    },
    [currentStudent, progress]
  );



  const analytics = useMemo<ComputedAnalytics>(() => {
    if (!progress) {
      return {
        accuracyPercent: 0,
        overallProgressPercent: 0,
        streakDays: 0,
        weakestDrillType: null,
        getChapterCompletion: () => 0,
        getChapterAccuracy: () => 0,
      };
    }

    const accuracyPercent =
      progress.totalSolved > 0
        ? Math.round((progress.correctCount / progress.totalSolved) * 100)
        : 0;

    const overallProgressPercent = computeOverallProgress(progress);
    const streakDays = calculateStudyStreak(progress.studyDates);

    let weakestDrillType: DrillType | null = null;
    let lowestRate = Infinity;
    for (const dt of ALL_DRILL_TYPES) {
      const stat = progress.drillStats[dt];
      if (stat && stat.attempted > 0) {
        const rate = stat.correct / stat.attempted;
        if (rate < lowestRate) {
          lowestRate = rate;
          weakestDrillType = dt;
        }
      }
    }

    return {
      accuracyPercent,
      overallProgressPercent,
      streakDays,
      weakestDrillType,
      getChapterCompletion: (chapterId: number) =>
        computeChapterCompletion(chapterId, progress.chapterStats[chapterId]),
      getChapterAccuracy: (chapterId: number) => {
        const st = progress.chapterStats[chapterId];
        if (!st || st.solved === 0) return 0;
        return Math.round((st.correct / st.solved) * 100);
      },
    };
  }, [progress]);

  const value: AppContextValue = {
    theme,
    toggleTheme,
    showPinyin,
    togglePinyin,
    currentStudent,
    unlockedAccess,
    refreshStudentAccess,
    login,
    logout,
    progress,
    analytics,
    lastSyncResult,
    addDrillElapsedTime,
    recordCompletedSession,
    recordChapterExamResult,
    recordFinalExamResult,
    studyVault,
    vaultCount,
    isItemBookmarked,
    getItemNote,
    toggleBookmark,
    saveItemNote,
    removeVaultEntry,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
