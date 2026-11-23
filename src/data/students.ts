import { Student } from '../types';

/**
 * Optional local student allow-list.
 * Remains empty by default so students are authenticated dynamically via the instructor's Google Sheet.
 */
export const ALLOWED_STUDENTS: Student[] = [];

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function authenticateStudent(nameOrId: string, code: string): Student | null {
  const cleanedIdentity = normalizeText(nameOrId);
  const cleanedCode = normalizeText(code);

  if (!cleanedIdentity || !cleanedCode) {
    return null;
  }

  return (
    ALLOWED_STUDENTS.find(
      (student) =>
        (normalizeText(student.name) === cleanedIdentity ||
          normalizeText(student.id) === cleanedIdentity) &&
        normalizeText(student.code) === cleanedCode
    ) ?? null
  );
}
