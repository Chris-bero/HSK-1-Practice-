import { STORAGE_KEYS } from '../config/appConfig';
import { UnlockedAccess } from '../types';

export const TOTAL_COURSE_CHAPTERS = 15;

export const ALL_CHAPTER_IDS: number[] = Array.from(
  { length: TOTAL_COURSE_CHAPTERS },
  (_, idx) => idx + 1
);

export const DEFAULT_FREE_TRIAL_ACCESS: UnlockedAccess = {
  chapters: [1],
  intlMocks: [],
  arabicMocks: [],
  patterns: [],
};

export function createDefaultFreeTrialAccess(): UnlockedAccess {
  return {
    chapters: [1],
    intlMocks: [],
    arabicMocks: [],
    patterns: [],
  };
}

export function createFullVipAccess(): UnlockedAccess {
  return {
    chapters: [...ALL_CHAPTER_IDS],
    intlMocks: [],
    arabicMocks: [],
    patterns: [],
  };
}

function sanitizeRangeArray(raw: unknown, max: number): number[] {
  if (!Array.isArray(raw)) return [];
  return Array.from(
    new Set(
      raw
        .map((n) => Number(n))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= max)
    )
  ).sort((a, b) => a - b);
}

/**
 * Parses student chapter access permissions with backward compatibility
 * for legacy rows using `chapters: "ALL"`.
 */
export function parseUnlockedAccess(raw: unknown): UnlockedAccess {
  if (!raw) {
    return createDefaultFreeTrialAccess();
  }

  let obj: unknown = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return createDefaultFreeTrialAccess();
    try {
      obj = JSON.parse(trimmed);
    } catch {
      return createDefaultFreeTrialAccess();
    }
  }

  if (!obj || typeof obj !== 'object') {
    return createDefaultFreeTrialAccess();
  }

  const record = obj as {
    chapters?: unknown;
  };

  let chapters: number[] = [1];
  if (typeof record.chapters === 'string' && record.chapters.trim().toUpperCase() === 'ALL') {
    chapters = [...ALL_CHAPTER_IDS];
  } else if (Array.isArray(record.chapters)) {
    chapters = sanitizeRangeArray(record.chapters, TOTAL_COURSE_CHAPTERS);
  }

  return { chapters, intlMocks: [], arabicMocks: [], patterns: [] };
}

export function isChapterUnlocked(
  access: UnlockedAccess | undefined | null,
  chapterId: number
): boolean {
  const resolved = access ? parseUnlockedAccess(access) : DEFAULT_FREE_TRIAL_ACCESS;
  return resolved.chapters.includes(chapterId);
}

export function countUnlockedChapters(access: UnlockedAccess | undefined | null): number {
  const resolved = access ? parseUnlockedAccess(access) : DEFAULT_FREE_TRIAL_ACCESS;
  return resolved.chapters.length;
}

const CLIENT_DEVICE_ID_KEY = STORAGE_KEYS.CLIENT_DEVICE_ID;

export function getOrCreateClientDeviceId(): string {
  if (typeof window === 'undefined') return 'DEV-SSR';
  try {
    const existing = localStorage.getItem(CLIENT_DEVICE_ID_KEY);
    if (existing && existing.trim()) {
      return existing.trim();
    }
  } catch {
    // Ignore storage errors
  }

  let randomPart = '';
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      randomPart = crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase();
    }
  } catch {
    // Ignore
  }

  if (!randomPart) {
    randomPart = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
      .slice(0, 16)
      .toUpperCase();
  }

  const newDeviceId = `DEV-${randomPart}`;
  try {
    localStorage.setItem(CLIENT_DEVICE_ID_KEY, newDeviceId);
  } catch {
    // Ignore
  }
  return newDeviceId;
}
