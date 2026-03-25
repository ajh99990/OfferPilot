import { getDbPool } from "@/lib/server/db";
import { normalizeKnownThreadIds } from "@/lib/known-threads";

export async function recordMissionThreadAccess(params: {
  threadId: string;
  ownerUserId: number | null;
  createdByGuestId?: string | null;
}): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    `
      INSERT INTO mission_thread_access (
        thread_id,
        owner_user_id,
        created_by_guest_id,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (thread_id)
      DO UPDATE SET
        owner_user_id = COALESCE(EXCLUDED.owner_user_id, mission_thread_access.owner_user_id),
        created_by_guest_id = COALESCE(EXCLUDED.created_by_guest_id, mission_thread_access.created_by_guest_id),
        updated_at = NOW()
    `,
    [params.threadId, params.ownerUserId, params.createdByGuestId ?? null],
  );
}

export async function claimMissionThreadsForUser(
  userId: number,
  threadIds: Iterable<string>,
): Promise<void> {
  const normalizedIds = normalizeKnownThreadIds(threadIds);
  if (normalizedIds.length === 0) {
    return;
  }

  const pool = getDbPool();
  await pool.query(
    `
      UPDATE mission_thread_access
      SET
        owner_user_id = $1,
        updated_at = NOW()
      WHERE thread_id = ANY($2::text[])
    `,
    [userId, normalizedIds],
  );
}

export async function listOwnedMissionThreadIds(userId: number): Promise<string[]> {
  const pool = getDbPool();
  const result = await pool.query<{ thread_id: string }>(
    `
      SELECT thread_id
      FROM mission_thread_access
      WHERE owner_user_id = $1
      ORDER BY updated_at DESC
    `,
    [userId],
  );

  return result.rows.map((row) => row.thread_id);
}

export async function canViewerAccessMissionThread(params: {
  threadId: string;
  userId?: number;
  knownThreadIds?: Iterable<string>;
}): Promise<boolean> {
  const knownThreadIds = normalizeKnownThreadIds(params.knownThreadIds ?? []);
  if (knownThreadIds.includes(params.threadId)) {
    return true;
  }

  if (!params.userId) {
    return false;
  }

  const pool = getDbPool();
  const result = await pool.query(
    `
      SELECT 1
      FROM mission_thread_access
      WHERE thread_id = $1 AND owner_user_id = $2
      LIMIT 1
    `,
    [params.threadId, params.userId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function listAccessibleMissionThreadIds(params: {
  userId?: number;
  knownThreadIds?: Iterable<string>;
}): Promise<string[]> {
  const knownThreadIds = normalizeKnownThreadIds(params.knownThreadIds ?? []);
  const merged = new Set<string>(knownThreadIds);

  if (params.userId) {
    const ownedIds = await listOwnedMissionThreadIds(params.userId);
    for (const id of ownedIds) {
      merged.add(id);
    }
  }

  return [...merged];
}
