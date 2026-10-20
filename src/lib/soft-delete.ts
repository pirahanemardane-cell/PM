/**
 * Soft-delete policy (Phase 3)
 * Column: deleted_at (timestamptz | null)
 * Public queries: .is("deleted_at", null)
 */

export const SOFT_DELETE_COLUMN = "deleted_at" as const;

export type SoftDeleteRow = {
  deleted_at?: string | null;
};

export function isSoftDeleted(row: SoftDeleteRow | null | undefined): boolean {
  return Boolean(row?.deleted_at);
}

export function excludeSoftDeleted<T extends SoftDeleteRow>(rows: T[]): T[] {
  return rows.filter((r) => !r.deleted_at);
}

/** Supabase filter fragment for active rows */
export function activeOnlyFilter() {
  return { column: SOFT_DELETE_COLUMN, value: null as null };
}

export function softDeletePatch(now = new Date().toISOString()) {
  return { deleted_at: now };
}

export function restoreSoftDeletePatch() {
  return { deleted_at: null as null };
}
