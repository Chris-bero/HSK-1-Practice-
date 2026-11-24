/*
================================================================================
Google Apps Script Web App Setup (see root Code.gs for full backend script)
================================================================================
1. Create a new Google Sheet for the English HSK 3.0 Level 1 course.
2. Open Extensions > Apps Script, paste the contents of Code.gs, and save.
3. Click Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
4. Copy the Web App URL into `src/config/appConfig.ts` (`DEFAULT_SHEETS_WEB_APP_URL`)
   or set `VITE_SHEETS_WEB_APP_URL` in your environment variables, and mirror it
   inside `public/teacher-dashboard.html`.
================================================================================
*/

import { GOOGLE_SCRIPT_WEB_APP_URL, STORAGE_KEYS } from '../config/appConfig';
import { ALLOWED_STUDENTS, authenticateStudent } from '../data/students';
import {
  AnalyticsExamLogEntry,
  AnalyticsLogBatchPayload,
  AnalyticsResultLogEntry,
  AnalyticsWrongLogEntry,
  BroadcastStyle,
  ChapterExamResult,
  FinalExamResult,
  SheetsSyncPayload,
  Student,
  TeacherBroadcast,
  UnlockedAccess,
} from '../types';
import { getOrCreateClientDeviceId, parseUnlockedAccess } from '../utils/accessControl';

export { GOOGLE_SCRIPT_WEB_APP_URL };

const LOCAL_SYNC_BACKUP_KEY = STORAGE_KEYS.SHEETS_SYNC_BACKUP;
const STUDENT_PROGRESS_PREFIX = STORAGE_KEYS.PROGRESS_PREFIX;
export const TEACHER_URL_STORAGE_KEY = STORAGE_KEYS.TEACHER_SHEETS_URL;
const LOCAL_REGISTERED_STUDENTS_KEY = STORAGE_KEYS.REGISTERED_STUDENTS;
const ANALYTICS_RETRY_QUEUE_KEY = STORAGE_KEYS.ANALYTICS_RETRY_QUEUE;
const MAX_RETRY_QUEUE_ITEMS = 150;
const TOTAL_CHAPTERS = 15;

// Automatically sync the configured Web App URL into localStorage for alignment with the Teacher Dashboard
if (typeof window !== 'undefined' && GOOGLE_SCRIPT_WEB_APP_URL.trim()) {
  try {
    localStorage.setItem(TEACHER_URL_STORAGE_KEY, GOOGLE_SCRIPT_WEB_APP_URL.trim());
  } catch {
    // Ignore localStorage errors
  }
}

export interface ChapterBreakdownEntry {
  chapterId: number;
  solved: number;
  correct: number;
  wrong: number;
}

export interface EnrichedSheetsSyncPayload extends SheetsSyncPayload {
  chaptersBreakdown: string;
  hskMockResults: string;
  hskPatternStats: string;
}

export interface SyncResult {
  syncedRemotely: boolean;
  savedLocally: boolean;
  timestamp: string;
}

function normalizeCredential(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeCodeCompact(value: string): string {
  return value.trim().replace(/\s+/g, '').toLowerCase();
}

export function getConfiguredSheetsUrl(): string {
  const configured = GOOGLE_SCRIPT_WEB_APP_URL.trim();
  if (configured) return configured;

  try {
    const saved = localStorage.getItem(TEACHER_URL_STORAGE_KEY);
    return saved ? saved.trim() : '';
  } catch {
    return '';
  }
}

function registerDynamicStudentInMemory(student: Student): void {
  const normId = normalizeCredential(student.id);
  const normName = normalizeCredential(student.name);
  const normCode = normalizeCodeCompact(student.code);

  const existingIdx = ALLOWED_STUDENTS.findIndex(
    (s) =>
      normalizeCredential(s.id) === normId ||
      (normalizeCredential(s.name) === normName && normalizeCodeCompact(s.code) === normCode)
  );
  if (existingIdx === -1) {
    ALLOWED_STUDENTS.push(student);
  } else {
    ALLOWED_STUDENTS[existingIdx] = {
      ...ALLOWED_STUDENTS[existingIdx],
      ...student,
    };
  }
}

export const DEVICE_LOCKED_WARNING =
  'This access code is already linked to another device and cannot be used on multiple devices. Please contact your instructor if you switched devices.';
export const DEVICE_LOCKED_WARNING_AR = DEVICE_LOCKED_WARNING;

export type StudentVerificationResult =
  | { status: 'ok'; student: Student }
  | { status: 'device_locked'; message: string }
  | { status: 'not_found' };

export interface StudentSheetSessionState {
  unlockedAccess: UnlockedAccess;
  boundDeviceId: string;
}

function updateLocalStudentBoundDevice(studentId: string, studentCode: string, deviceId: string): void {
  const normId = normalizeCredential(studentId);
  const compactCode = normalizeCodeCompact(studentCode);
  try {
    const raw = localStorage.getItem(LOCAL_REGISTERED_STUDENTS_KEY);
    if (!raw) return;
    const list = JSON.parse(raw) as Array<Record<string, unknown>>;
    if (!Array.isArray(list)) return;
    let changed = false;
    for (const item of list) {
      const itemId = normalizeCredential(String(item.studentId ?? item.id ?? ''));
      const itemCode = normalizeCodeCompact(String(item.studentCode ?? item.code ?? ''));
      if ((normId && itemId === normId) || (compactCode && itemCode === compactCode)) {
        item.boundDeviceId = deviceId;
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(LOCAL_REGISTERED_STUDENTS_KEY, JSON.stringify(list));
    }
  } catch {
    // Ignore storage errors
  }
}

export async function bindStudentDeviceInSheet(
  student: Pick<Student, 'id' | 'name' | 'code'>,
  deviceId: string
): Promise<void> {
  updateLocalStudentBoundDevice(student.id, student.code, deviceId);
  const endpoint = getConfiguredSheetsUrl();
  if (!endpoint || !deviceId.trim()) return;

  try {
    await fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'bindDevice',
        studentId: student.id,
        studentName: student.name,
        studentCode: student.code,
        boundDeviceId: deviceId,
      }),
    });
  } catch {
    // Ignore transient network errors; saved locally
  }
}

function findLocallyRegisteredStudent(name: string, code: string): Student | null {
  const cleanedName = normalizeCredential(name);
  const cleanedCode = normalizeCredential(code);
  const compactCode = normalizeCodeCompact(code);
  if (!cleanedName || !cleanedCode) return null;

  try {
    const raw = localStorage.getItem(LOCAL_REGISTERED_STUDENTS_KEY);
    if (!raw) return null;
    const list = JSON.parse(raw) as Array<{
      studentId?: string;
      id?: string;
      studentName?: string;
      name?: string;
      studentCode?: string;
      code?: string;
      unlockedAccess?: unknown;
      boundDeviceId?: unknown;
    }>;

    if (!Array.isArray(list)) return null;

    for (const item of list) {
      const sName = String(item.studentName ?? item.name ?? '').trim().replace(/\s+/g, ' ');
      const sCode = String(item.studentCode ?? item.code ?? '').trim().replace(/\s+/g, ' ');
      const sId = String(item.studentId ?? item.id ?? sCode).trim();

      const nameMatches =
        normalizeCredential(sName) === cleanedName || normalizeCredential(sId) === cleanedName;
      const codeMatches =
        normalizeCredential(sCode) === cleanedCode || normalizeCodeCompact(sCode) === compactCode;

      if (nameMatches && codeMatches) {
        const matched: Student = {
          id: sId,
          name: sName,
          code: sCode,
          unlockedAccess: parseUnlockedAccess(item.unlockedAccess),
          boundDeviceId: String(item.boundDeviceId ?? '').trim(),
        };
        registerDynamicStudentInMemory(matched);
        return matched;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function findLocalSessionOverride(
  studentId: string,
  studentCode: string
): StudentSheetSessionState | null {
  const normId = normalizeCredential(studentId);
  const compactCode = normalizeCodeCompact(studentCode);
  try {
    const raw = localStorage.getItem(LOCAL_REGISTERED_STUDENTS_KEY);
    if (!raw) return null;
    const list = JSON.parse(raw) as Array<{
      studentId?: string;
      id?: string;
      studentCode?: string;
      code?: string;
      unlockedAccess?: unknown;
      boundDeviceId?: unknown;
    }>;
    if (!Array.isArray(list)) return null;

    for (const item of list) {
      const itemId = normalizeCredential(String(item.studentId ?? item.id ?? ''));
      const itemCode = normalizeCodeCompact(String(item.studentCode ?? item.code ?? ''));
      if ((normId && itemId === normId) || (compactCode && itemCode === compactCode)) {
        return {
          unlockedAccess: parseUnlockedAccess(item.unlockedAccess),
          boundDeviceId: String(item.boundDeviceId ?? '').trim(),
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Dynamically verifies student credentials via Google Sheets (GET) with single-device lock:
 * - If boundDeviceId is empty, binds the current device automatically via `action: 'bindDevice'`.
 * - If bound to the current device, grants login.
 * - If bound to a different device, blocks login with a clear warning.
 */
export async function verifyStudentFromSheet(
  name: string,
  code: string
): Promise<StudentVerificationResult> {
  const normalizedInputName = normalizeCredential(name);
  const normalizedInputCode = normalizeCredential(code);
  const compactInputCode = normalizeCodeCompact(code);
  if (!normalizedInputName || !normalizedInputCode) {
    return { status: 'not_found' };
  }

  const clientDeviceId = getOrCreateClientDeviceId();
  const endpoint = getConfiguredSheetsUrl();

  if (endpoint) {
    try {
      const response = await fetch(endpoint, { method: 'GET', cache: 'no-store' });
      if (response.ok) {
        const data: unknown = await response.json();
        const rows = Array.isArray(data)
          ? data
          : data &&
              typeof data === 'object' &&
              'students' in data &&
              Array.isArray((data as { students?: unknown }).students)
            ? (data as { students: unknown[] }).students
            : data &&
                typeof data === 'object' &&
                'rows' in data &&
                Array.isArray((data as { rows?: unknown }).rows)
              ? (data as { rows: unknown[] }).rows
              : [];

        for (const rawRow of rows) {
          if (!rawRow || typeof rawRow !== 'object') continue;
          const row = rawRow as Record<string, unknown>;
          const rowName = String(row.studentName ?? row.name ?? '')
            .trim()
            .replace(/\s+/g, ' ');
          const rowCode = String(row.studentCode ?? row.code ?? '')
            .trim()
            .replace(/\s+/g, ' ');
          const rowId = String(row.studentId ?? row.id ?? rowCode).trim();

          const nameMatches =
            normalizeCredential(rowName) === normalizedInputName ||
            normalizeCredential(rowId) === normalizedInputName;
          const codeMatches =
            normalizeCredential(rowCode) === normalizedInputCode ||
            normalizeCodeCompact(rowCode) === compactInputCode;

          if (nameMatches && codeMatches) {
            const existingBoundDevice = String(row.boundDeviceId ?? '').trim();

            if (existingBoundDevice && existingBoundDevice !== clientDeviceId) {
              return {
                status: 'device_locked',
                message: DEVICE_LOCKED_WARNING_AR,
              };
            }

            const matched: Student = {
              id: rowId || rowCode,
              name: rowName || name.trim().replace(/\s+/g, ' '),
              code: rowCode,
              unlockedAccess: parseUnlockedAccess(row.unlockedAccess),
              boundDeviceId: existingBoundDevice || clientDeviceId,
            };

            if (!existingBoundDevice) {
              void bindStudentDeviceInSheet(matched, clientDeviceId);
            }

            registerDynamicStudentInMemory(matched);
            return { status: 'ok', student: matched };
          }
        }
      }
    } catch {
      // On network failure, fall back to local verification below
    }
  }

  const localDynamic = findLocallyRegisteredStudent(name, code);
  if (localDynamic) {
    const existingLocalDevice = String(localDynamic.boundDeviceId ?? '').trim();
    if (existingLocalDevice && existingLocalDevice !== clientDeviceId) {
      return {
        status: 'device_locked',
        message: DEVICE_LOCKED_WARNING_AR,
      };
    }
    const boundStudent: Student = {
      ...localDynamic,
      boundDeviceId: existingLocalDevice || clientDeviceId,
    };
    if (!existingLocalDevice) {
      void bindStudentDeviceInSheet(boundStudent, clientDeviceId);
    }
    return { status: 'ok', student: boundStudent };
  }

  const fallback = authenticateStudent(name, code);
  if (fallback) {
    return {
      status: 'ok',
      student: {
        ...fallback,
        unlockedAccess: parseUnlockedAccess(fallback.unlockedAccess),
        boundDeviceId: clientDeviceId,
      },
    };
  }

  return { status: 'not_found' };
}

/**
 * Fetches the latest student access permissions (`unlockedAccess`) and device lock (`boundDeviceId`) from Google Sheets.
 */
export async function fetchStudentSessionFromSheet(
  student: Pick<Student, 'id' | 'code'>
): Promise<StudentSheetSessionState | null> {
  const normId = normalizeCredential(student.id);
  const compactCode = normalizeCodeCompact(student.code);
  const endpoint = getConfiguredSheetsUrl();

  if (endpoint) {
    try {
      const response = await fetch(endpoint, { method: 'GET', cache: 'no-store' });
      if (response.ok) {
        const data: unknown = await response.json();
        const rows = Array.isArray(data)
          ? data
          : data &&
              typeof data === 'object' &&
              'students' in data &&
              Array.isArray((data as { students?: unknown }).students)
            ? (data as { students: unknown[] }).students
            : data &&
                typeof data === 'object' &&
                'rows' in data &&
                Array.isArray((data as { rows?: unknown }).rows)
              ? (data as { rows: unknown[] }).rows
              : [];

        for (const rawRow of rows) {
          if (!rawRow || typeof rawRow !== 'object') continue;
          const row = rawRow as Record<string, unknown>;
          const rowCode = String(row.studentCode ?? row.code ?? '').trim();
          const rowId = String(row.studentId ?? row.id ?? rowCode).trim();

          if (
            (normId && normalizeCredential(rowId) === normId) ||
            (compactCode && normalizeCodeCompact(rowCode) === compactCode)
          ) {
            return {
              unlockedAccess: parseUnlockedAccess(row.unlockedAccess),
              boundDeviceId: String(row.boundDeviceId ?? '').trim(),
            };
          }
        }
      }
    } catch {
      // Fall back to local cache when offline
    }
  }

  return findLocalSessionOverride(student.id, student.code);
}

export async function fetchStudentAccessFromSheet(
  student: Pick<Student, 'id' | 'code'>
): Promise<UnlockedAccess | null> {
  const session = await fetchStudentSessionFromSheet(student);
  return session ? session.unlockedAccess : null;
}

function buildChaptersBreakdownFromStorage(studentId: string): ChapterBreakdownEntry[] {
  const breakdown: ChapterBreakdownEntry[] = [];
  let chapterStats: Record<string, { solved?: number; correct?: number }> = {};

  try {
    const raw = localStorage.getItem(`${STUDENT_PROGRESS_PREFIX}${studentId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        chapterStats?: Record<string, { solved?: number; correct?: number }>;
      };
      if (parsed && parsed.chapterStats) {
        chapterStats = parsed.chapterStats;
      }
    }
  } catch {
    // Use zeroed default chapter array if storage cannot be read
  }

  for (let chapterId = 1; chapterId <= TOTAL_CHAPTERS; chapterId++) {
    const stat = chapterStats[String(chapterId)];
    const solved = Math.max(0, Number(stat?.solved ?? 0));
    const correct = Math.max(0, Math.min(solved, Number(stat?.correct ?? 0)));
    const wrong = Math.max(0, solved - correct);
    breakdown.push({ chapterId, solved, correct, wrong });
  }

  return breakdown;
}

function resolveChaptersBreakdownJson(
  payload: SheetsSyncPayload & { chaptersBreakdown?: string | ChapterBreakdownEntry[] }
): string {
  if (typeof payload.chaptersBreakdown === 'string' && payload.chaptersBreakdown.trim()) {
    return payload.chaptersBreakdown;
  }
  if (Array.isArray(payload.chaptersBreakdown)) {
    return JSON.stringify(payload.chaptersBreakdown);
  }
  return JSON.stringify(buildChaptersBreakdownFromStorage(payload.studentId));
}

function saveLocalBackup(payload: EnrichedSheetsSyncPayload): void {
  try {
    const existingRaw = localStorage.getItem(LOCAL_SYNC_BACKUP_KEY);
    const records: Record<string, EnrichedSheetsSyncPayload> = existingRaw
      ? (JSON.parse(existingRaw) as Record<string, EnrichedSheetsSyncPayload>)
      : {};
    records[payload.studentId] = payload;
    localStorage.setItem(LOCAL_SYNC_BACKUP_KEY, JSON.stringify(records));
  } catch {
    // Ignore local storage errors if browser quota is exceeded
  }
}

export function getLastLocalSync(studentId: string): EnrichedSheetsSyncPayload | null {
  try {
    const existingRaw = localStorage.getItem(LOCAL_SYNC_BACKUP_KEY);
    if (!existingRaw) return null;
    const records = JSON.parse(existingRaw) as Record<string, EnrichedSheetsSyncPayload>;
    return records[studentId] ?? null;
  } catch {
    return null;
  }
}

function resolveChapterExamResultsJson(
  payload: SheetsSyncPayload & { chapterExamResults?: ChapterExamResult[] }
): string {
  if (Array.isArray(payload.chapterExamResults)) {
    return JSON.stringify(payload.chapterExamResults);
  }
  try {
    const raw = localStorage.getItem(`${STUDENT_PROGRESS_PREFIX}${payload.studentId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as { chapterExamResults?: ChapterExamResult[] };
      if (Array.isArray(parsed?.chapterExamResults)) {
        return JSON.stringify(parsed.chapterExamResults);
      }
    }
  } catch {
    // Fallback to empty array if storage cannot be read
  }
  return '[]';
}

function resolveFinalExamResultsJson(
  payload: SheetsSyncPayload & { finalExamResults?: FinalExamResult[] }
): string {
  if (Array.isArray(payload.finalExamResults)) {
    return JSON.stringify({ finalExams: payload.finalExamResults });
  }
  try {
    const raw = localStorage.getItem(`${STUDENT_PROGRESS_PREFIX}${payload.studentId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as { finalExamResults?: FinalExamResult[] };
      if (Array.isArray(parsed?.finalExamResults)) {
        return JSON.stringify({ finalExams: parsed.finalExamResults });
      }
    }
  } catch {
    // Fallback to empty object if storage cannot be read
  }
  return JSON.stringify({ finalExams: [] });
}

interface QueuedAnalyticsBatch {
  id: string;
  queuedAt: string;
  results: AnalyticsResultLogEntry[];
  exams: AnalyticsExamLogEntry[];
  wrongLog: AnalyticsWrongLogEntry[];
}

function isBrowserOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function readAnalyticsRetryQueue(): QueuedAnalyticsBatch[] {
  try {
    const raw = localStorage.getItem(ANALYTICS_RETRY_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is QueuedAnalyticsBatch =>
        Boolean(item && typeof item === 'object' && typeof (item as QueuedAnalyticsBatch).id === 'string')
    );
  } catch {
    return [];
  }
}

function writeAnalyticsRetryQueue(items: QueuedAnalyticsBatch[]): void {
  try {
    if (items.length === 0) {
      localStorage.removeItem(ANALYTICS_RETRY_QUEUE_KEY);
      return;
    }
    const bounded = items.slice(-MAX_RETRY_QUEUE_ITEMS);
    localStorage.setItem(ANALYTICS_RETRY_QUEUE_KEY, JSON.stringify(bounded));
  } catch {
    // Ignore storage quota errors
  }
}

export function getPendingAnalyticsQueueCount(): number {
  return readAnalyticsRetryQueue().length;
}

export function enqueueAnalyticsBatch(payload: AnalyticsLogBatchPayload): void {
  const results = Array.isArray(payload.results) ? payload.results : [];
  const exams = Array.isArray(payload.exams) ? payload.exams : [];
  const wrongLog = Array.isArray(payload.wrongLog) ? payload.wrongLog : [];
  if (results.length === 0 && exams.length === 0 && wrongLog.length === 0) return;

  const existing = readAnalyticsRetryQueue();
  existing.push({
    id: `aq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    queuedAt: new Date().toISOString(),
    results,
    exams,
    wrongLog,
  });
  writeAnalyticsRetryQueue(existing);
}

let retryFlushInFlight = false;

/**
 * Drains offline-queued drill results, exam attempts, and wrong answers from
 * `hsk1_en_analytics_retry_queue_v1` in localStorage to Google Apps Script.
 */
export async function flushAnalyticsRetryQueue(): Promise<{
  flushedCount: number;
  remainingCount: number;
}> {
  if (retryFlushInFlight) {
    return { flushedCount: 0, remainingCount: getPendingAnalyticsQueueCount() };
  }

  const queue = readAnalyticsRetryQueue();
  if (queue.length === 0) {
    return { flushedCount: 0, remainingCount: 0 };
  }

  const endpoint = getConfiguredSheetsUrl();
  if (!endpoint || isBrowserOffline()) {
    return { flushedCount: 0, remainingCount: queue.length };
  }

  retryFlushInFlight = true;
  let totalFlushed = 0;
  try {
    let pending = [...queue];
    while (pending.length > 0) {
      if (isBrowserOffline()) break;

      const chunk: QueuedAnalyticsBatch[] = [];
      const mergedResults: AnalyticsResultLogEntry[] = [];
      const mergedExams: AnalyticsExamLogEntry[] = [];
      const mergedWrongs: AnalyticsWrongLogEntry[] = [];

      for (const batch of pending) {
        if (
          chunk.length > 0 &&
          (chunk.length >= 10 || mergedWrongs.length + batch.wrongLog.length > 250)
        ) {
          break;
        }
        chunk.push(batch);
        mergedResults.push(...batch.results);
        mergedExams.push(...batch.exams);
        mergedWrongs.push(...batch.wrongLog);
      }

      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'logAnalyticsBatch',
          results: mergedResults,
          exams: mergedExams,
          wrongLog: mergedWrongs,
        }),
      });

      const flushedIds = new Set(chunk.map((q) => q.id));
      const latest = readAnalyticsRetryQueue().filter((q) => !flushedIds.has(q.id));
      writeAnalyticsRetryQueue(latest);
      totalFlushed += chunk.length;
      pending = pending.slice(chunk.length);
    }

    return { flushedCount: totalFlushed, remainingCount: readAnalyticsRetryQueue().length };
  } catch {
    return { flushedCount: totalFlushed, remainingCount: readAnalyticsRetryQueue().length };
  } finally {
    retryFlushInFlight = false;
  }
}

/**
 * Posts standalone granular analytics (e.g., partial active-study duration or direct logs)
 * with automatic offline retry queueing in localStorage.
 */
export async function logAnalyticsEvents(
  payload: AnalyticsLogBatchPayload
): Promise<{ syncedRemotely: boolean; queuedOffline: boolean }> {
  const results = Array.isArray(payload.results) ? payload.results : [];
  const exams = Array.isArray(payload.exams) ? payload.exams : [];
  const wrongLog = Array.isArray(payload.wrongLog) ? payload.wrongLog : [];
  if (results.length === 0 && exams.length === 0 && wrongLog.length === 0) {
    return { syncedRemotely: false, queuedOffline: false };
  }

  const endpoint = getConfiguredSheetsUrl();
  if (!endpoint || isBrowserOffline()) {
    enqueueAnalyticsBatch({ results, exams, wrongLog });
    return { syncedRemotely: false, queuedOffline: true };
  }

  try {
    const body =
      results.length === 1 && exams.length === 0
        ? {
            action: 'logResult',
            resultEntry: results[0],
            wrongEntries: wrongLog,
          }
        : exams.length === 1 && results.length === 0
          ? {
              action: 'logExam',
              examEntry: exams[0],
              wrongEntries: wrongLog,
            }
          : {
              action: 'logAnalyticsBatch',
              results,
              exams,
              wrongLog,
            };

    await fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(body),
    });

    void flushAnalyticsRetryQueue();
    return { syncedRemotely: true, queuedOffline: false };
  } catch {
    enqueueAnalyticsBatch({ results, exams, wrongLog });
    return { syncedRemotely: false, queuedOffline: true };
  }
}

export async function syncStudentStatsToSheets(
  payload: SheetsSyncPayload & { chaptersBreakdown?: string | ChapterBreakdownEntry[] }
): Promise<SyncResult> {
  const timestamp = new Date().toISOString();
  const enrichedPayload: EnrichedSheetsSyncPayload = {
    ...payload,
    chaptersBreakdown: resolveChaptersBreakdownJson(payload),
    hskMockResults: resolveChapterExamResultsJson(payload),
    hskPatternStats: resolveFinalExamResultsJson(payload),
  };

  saveLocalBackup(enrichedPayload);

  const queuedGranular: AnalyticsLogBatchPayload = {
    results: payload.resultEntry ? [payload.resultEntry] : [],
    exams: payload.examEntry ? [payload.examEntry] : [],
    wrongLog: Array.isArray(payload.wrongEntries) ? payload.wrongEntries : [],
  };
  const hasGranular =
    (queuedGranular.results?.length ?? 0) > 0 ||
    (queuedGranular.exams?.length ?? 0) > 0 ||
    (queuedGranular.wrongLog?.length ?? 0) > 0;

  const endpoint = getConfiguredSheetsUrl();
  if (!endpoint || isBrowserOffline()) {
    if (hasGranular) {
      enqueueAnalyticsBatch(queuedGranular);
    }
    return {
      syncedRemotely: false,
      savedLocally: true,
      timestamp,
    };
  }

  try {
    await fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(enrichedPayload),
    });

    // Drain any previously offline-queued granular events now that the network succeeded
    void flushAnalyticsRetryQueue();

    return {
      syncedRemotely: true,
      savedLocally: true,
      timestamp,
    };
  } catch {
    if (hasGranular) {
      enqueueAnalyticsBatch(queuedGranular);
    }
    return {
      syncedRemotely: false,
      savedLocally: true,
      timestamp,
    };
  }
}

export const TEACHER_BROADCAST_LOCAL_KEY = STORAGE_KEYS.TEACHER_BROADCAST;

export function sanitizeBroadcastUrl(rawUrl?: string): string | undefined {
  if (!rawUrl || typeof rawUrl !== 'string') return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function normalizeTeacherBroadcast(raw: unknown): TeacherBroadcast | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const styleCandidate = String(obj.style ?? 'info');
  const style: BroadcastStyle =
    styleCandidate === 'important' || styleCandidate === 'promo' ? styleCandidate : 'info';
  const message = String(obj.message ?? '').trim();
  const enabled = Boolean(obj.enabled);
  const updatedAt =
    typeof obj.updatedAt === 'string' && obj.updatedAt.trim()
      ? obj.updatedAt.trim()
      : new Date().toISOString();
  const id =
    typeof obj.id === 'string' && obj.id.trim()
      ? obj.id.trim()
      : `bc_${message.slice(0, 24)}_${updatedAt}`;
  const ctaLabel = typeof obj.ctaLabel === 'string' ? obj.ctaLabel.trim() : '';
  const ctaUrl = sanitizeBroadcastUrl(typeof obj.ctaUrl === 'string' ? obj.ctaUrl : undefined);

  return {
    id,
    enabled,
    message,
    style,
    ctaLabel: ctaLabel || undefined,
    ctaUrl,
    updatedAt,
  };
}

export function loadLocalTeacherBroadcast(): TeacherBroadcast | null {
  try {
    const raw = localStorage.getItem(TEACHER_BROADCAST_LOCAL_KEY);
    if (!raw) return null;
    return normalizeTeacherBroadcast(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Fetches the active instructor announcement banner from Google Sheets via `?action=getBroadcast`,
 * with silent fallback to local storage when offline.
 */
export async function fetchTeacherBroadcast(): Promise<TeacherBroadcast | null> {
  const endpoint = getConfiguredSheetsUrl();

  if (endpoint) {
    try {
      const separator = endpoint.includes('?') ? '&' : '?';
      const response = await fetch(`${endpoint}${separator}action=getBroadcast`, {
        method: 'GET',
        cache: 'no-store',
      });
      if (response.ok) {
        const data: unknown = await response.json();
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          const payload = data as Record<string, unknown>;
          if ('broadcast' in payload) {
            const normalized = normalizeTeacherBroadcast(payload.broadcast);
            try {
              if (normalized) {
                localStorage.setItem(TEACHER_BROADCAST_LOCAL_KEY, JSON.stringify(normalized));
              } else {
                localStorage.removeItem(TEACHER_BROADCAST_LOCAL_KEY);
              }
            } catch {
              // Ignore storage errors
            }
            return normalized;
          }
          const direct = normalizeTeacherBroadcast(payload);
          if (direct) {
            try {
              localStorage.setItem(TEACHER_BROADCAST_LOCAL_KEY, JSON.stringify(direct));
            } catch {
              // Ignore storage errors
            }
            return direct;
          }
        }
      }
    } catch {
      // Silent fallback to local storage on network failure
    }
  }

  return loadLocalTeacherBroadcast();
}

