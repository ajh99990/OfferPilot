import { getDbPool } from "@/lib/server/db";

export type AppUserProfile = {
  userId: number;
  nickname: string;
  avatarUrl: string | null;
  profileSetupCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

const PROFILE_INSERT_SQL = `
  INSERT INTO app_user_profile (
    user_id,
    nickname,
    avatar_url,
    profile_setup_completed
  )
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (user_id) DO NOTHING
`;

const NICKNAME_ADJECTIVES = [
  "冷静的",
  "敏锐的",
  "沉稳的",
  "清醒的",
  "可靠的",
  "果断的",
  "机智的",
  "耐心的",
];

const NICKNAME_NOUNS = [
  "求职者",
  "候选人",
  "创作者",
  "行动派",
  "探索者",
  "实干家",
  "进阶者",
  "提案者",
];

function mapProfileRow(row: Record<string, unknown>): AppUserProfile {
  return {
    userId: Number(row.user_id),
    nickname: String(row.nickname),
    avatarUrl:
      typeof row.avatar_url === "string" && row.avatar_url.trim()
        ? row.avatar_url
        : null,
    profileSetupCompleted: Boolean(row.profile_setup_completed),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export function buildRandomNickname(seed?: number): string {
  const safeSeed = Math.abs(seed ?? Math.floor(Math.random() * 10_000));
  const adjective = NICKNAME_ADJECTIVES[safeSeed % NICKNAME_ADJECTIVES.length];
  const noun = NICKNAME_NOUNS[safeSeed % NICKNAME_NOUNS.length];
  const suffix = String((safeSeed % 9000) + 1000);
  return `${adjective}${noun}${suffix}`;
}

export async function getUserProfileById(
  userId: number,
): Promise<AppUserProfile | null> {
  const pool = getDbPool();
  const result = await pool.query(
    `
      SELECT
        user_id,
        nickname,
        avatar_url,
        profile_setup_completed,
        created_at,
        updated_at
      FROM app_user_profile
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId],
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapProfileRow(result.rows[0] as Record<string, unknown>);
}

export async function ensureUserProfile(userId: number): Promise<AppUserProfile> {
  const existing = await getUserProfileById(userId);
  if (existing) {
    return existing;
  }

  const nickname = buildRandomNickname(userId);
  const pool = getDbPool();

  await pool.query(PROFILE_INSERT_SQL, [userId, nickname, null, false]);

  const created = await getUserProfileById(userId);
  if (!created) {
    throw new Error("创建用户资料失败。");
  }

  return created;
}

export async function completeUserProfileSetup(params: {
  userId: number;
  nickname?: string;
  avatarUrl?: string | null;
  skip?: boolean;
}): Promise<AppUserProfile> {
  const current = await ensureUserProfile(params.userId);
  const trimmedNickname = params.nickname?.trim();
  const trimmedAvatar = params.avatarUrl?.trim();

  const nextNickname =
    trimmedNickname || current.nickname || buildRandomNickname(params.userId);
  const nextAvatarUrl =
    trimmedAvatar === undefined
      ? current.avatarUrl
      : trimmedAvatar || null;

  const pool = getDbPool();
  const result = await pool.query(
    `
      UPDATE app_user_profile
      SET
        nickname = $2,
        avatar_url = $3,
        profile_setup_completed = TRUE,
        updated_at = NOW()
      WHERE user_id = $1
      RETURNING
        user_id,
        nickname,
        avatar_url,
        profile_setup_completed,
        created_at,
        updated_at
    `,
    [params.userId, nextNickname, nextAvatarUrl],
  );

  return mapProfileRow(result.rows[0] as Record<string, unknown>);
}
