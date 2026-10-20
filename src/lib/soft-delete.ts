/**
 * Soft-delete policy (Phase 3)
 * - Column: deleted_at (timestamptz | null)
 * - Public queries: .is("deleted_at", null)
 * - Admin may soft-delete; hard delete only via service role + explicit ops
 */

export const SOFT_DELETE_COLUMN = "deleted_at" as const;

export type SoftDeleteRow = {
  deleted_at?: string | null;
};

export function isSoftDeleted(row: SoftDeleteRow | null | undefined): boolean {
  return Boolean(row?.deleted_at);
}

/** Filter helper for in-memory lists */
export function excludeSoftDeleted<T extends SoftDeleteRow>(rows: T[]): T[] {
  return rows.filter((r) => !r.deleted_at);
}
