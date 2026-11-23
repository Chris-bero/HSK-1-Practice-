/**
 * Centralized application configuration for HSK 3.0 Level 1 Practice Portal (English Edition).
 *
 * 1. Google Apps Script Web App URL:
 *    - Point to your new English Google Sheet's Apps Script Web App deployment by setting
 *      `VITE_SHEETS_WEB_APP_URL` in `.env` (or Vercel Environment Variables), OR by replacing
 *      `DEFAULT_SHEETS_WEB_APP_URL` below.
 *    - Also mirror the same URL in `public/teacher-dashboard.html` (`DEFAULT_GOOGLE_SCRIPT_URL`).
 *
 * 2. Namespaced localStorage Keys:
 *    - All client-side storage keys use the `hsk1_en_` prefix so session data, progress,
 *      bookmarks, study timers, and lab records never collide with the Arabic edition.
 */

export const DEFAULT_SHEETS_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbxA27jKarngLH1l9aIK8vVxd_vNj1UZG6dXTMqluOcaBe6VoFd0VzE7snVvPXqQFdR_fQ/exec';

export const GOOGLE_SCRIPT_WEB_APP_URL: string = (
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    typeof import.meta.env.VITE_SHEETS_WEB_APP_URL === 'string' &&
    import.meta.env.VITE_SHEETS_WEB_APP_URL.trim()) ||
  DEFAULT_SHEETS_WEB_APP_URL
).trim();

export const STORAGE_PREFIX = 'hsk1_en_' as const;

export const STORAGE_KEYS = {
  ACTIVE_STUDENT: `${STORAGE_PREFIX}active_student_v1`,
  THEME: `${STORAGE_PREFIX}theme_v1`,
  SHOW_PINYIN: `${STORAGE_PREFIX}show_pinyin_v1`,
  PROGRESS_PREFIX: `${STORAGE_PREFIX}progress_v1_`,
  BOOKMARKS_PREFIX: `${STORAGE_PREFIX}bookmarks_v1_`,
  SHEETS_SYNC_BACKUP: `${STORAGE_PREFIX}sheets_sync_backup_v1`,
  TEACHER_SHEETS_URL: `${STORAGE_PREFIX}teacher_sheets_url_v1`,
  REGISTERED_STUDENTS: `${STORAGE_PREFIX}registered_students_v1`,
  TEACHER_BROADCAST: `${STORAGE_PREFIX}teacher_broadcast_v1`,
  CLIENT_DEVICE_ID: `${STORAGE_PREFIX}client_device_id_v1`,
  DISMISSED_BROADCASTS: `${STORAGE_PREFIX}dismissed_broadcasts_v1`,
  SPEED_MATCH_BEST_PREFIX: `${STORAGE_PREFIX}speed_best_v1_`,
} as const;
