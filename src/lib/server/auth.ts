import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import {
  ACCESS_TOKEN_COOKIE,
  GUEST_ID_COOKIE,
  KNOWN_THREADS_COOKIE,
  LOGIN_CENTER_API_URL,
  REFRESH_TOKEN_COOKIE,
  type AuthSessionPayload,
} from "@/lib/auth";
import {
  parseKnownThreadsCookie,
  serializeKnownThreadsCookie,
} from "@/lib/known-threads";
import {
  ensureUserProfile,
  type AppUserProfile,
} from "@/lib/server/user-profiles";

type CookieOptions = Omit<ResponseCookie, "name" | "value">;

type LoginCenterEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

type LoginTokens = {
  accessToken: string;
  refreshToken: string;
};

type IntrospectPayload = {
  active?: boolean;
  uid?: number;
  sid?: string;
};

type LoginIdentity = {
  uid: number;
  sid: string;
};

export type SessionCookiePatch = {
  set: Array<{
    name: string;
    value: string;
    options: CookieOptions;
  }>;
  delete: Array<{
    name: string;
    options: CookieOptions;
  }>;
};

export type ResolvedServerSession = {
  auth: AuthSessionPayload;
  accessToken?: string;
  refreshToken?: string;
  guestId?: string;
  knownThreadIds: string[];
  cookiePatch: SessionCookiePatch;
};

function createEmptyCookiePatch(): SessionCookiePatch {
  return {
    set: [],
    delete: [],
  };
}

function getBaseCookieOptions(
  maxAgeSeconds: number,
  httpOnly: boolean,
): CookieOptions {
  return {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly,
    maxAge: maxAgeSeconds,
  };
}

function queueCookieSet(
  patch: SessionCookiePatch,
  name: string,
  value: string,
  options: CookieOptions,
) {
  patch.set.push({ name, value, options });
}

function queueCookieDelete(
  patch: SessionCookiePatch,
  name: string,
  httpOnly: boolean,
) {
  patch.delete.push({
    name,
    options: {
      ...getBaseCookieOptions(0, httpOnly),
      maxAge: 0,
    },
  });
}

export function applyCookiePatch(
  response: {
    cookies: {
      set: (name: string, value: string, options: ResponseCookie) => void;
      delete?: (name: string) => void;
    };
  },
  patch: SessionCookiePatch,
) {
  for (const item of patch.set) {
    response.cookies.set(item.name, item.value, item.options as ResponseCookie);
  }

  for (const item of patch.delete) {
    response.cookies.set(item.name, "", item.options as ResponseCookie);
  }
}

export function clearAuthCookies(patch: SessionCookiePatch) {
  queueCookieDelete(patch, ACCESS_TOKEN_COOKIE, true);
  queueCookieDelete(patch, REFRESH_TOKEN_COOKIE, true);
}

export function setAuthCookies(patch: SessionCookiePatch, tokens: LoginTokens) {
  queueCookieSet(
    patch,
    ACCESS_TOKEN_COOKIE,
    tokens.accessToken,
    getBaseCookieOptions(60 * 60 * 2, true),
  );
  queueCookieSet(
    patch,
    REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    getBaseCookieOptions(60 * 60 * 24 * 30, true),
  );
}

export function setKnownThreadsCookie(
  patch: SessionCookiePatch,
  threadIds: Iterable<string>,
) {
  queueCookieSet(
    patch,
    KNOWN_THREADS_COOKIE,
    serializeKnownThreadsCookie(threadIds),
    getBaseCookieOptions(60 * 60 * 24 * 365, false),
  );
}

export function getKnownThreadIdsFromRequest(request: NextRequest): string[] {
  return parseKnownThreadsCookie(request.cookies.get(KNOWN_THREADS_COOKIE)?.value);
}

export function ensureGuestId(request: NextRequest, patch: SessionCookiePatch): string {
  const existing = request.cookies.get(GUEST_ID_COOKIE)?.value?.trim();
  if (existing) {
    return existing;
  }

  const guestId = randomUUID();
  queueCookieSet(
    patch,
    GUEST_ID_COOKIE,
    guestId,
    getBaseCookieOptions(60 * 60 * 24 * 365, true),
  );
  return guestId;
}

export function getStorageOwnerIdForUser(userId: number): string {
  return `user:${userId}`;
}

export function getStorageOwnerIdForGuest(guestId: string): string {
  return `guest:${guestId}`;
}

function formatViewer(profile: AppUserProfile, sid: string): AuthSessionPayload {
  return {
    authenticated: true,
    user: {
      uid: profile.userId,
      sid,
      nickname: profile.nickname,
      avatarUrl: profile.avatarUrl,
      needsProfileSetup: !profile.profileSetupCompleted,
    },
  };
}

export function buildAuthSessionPayload(
  profile: AppUserProfile,
  sid: string,
): AuthSessionPayload {
  return formatViewer(profile, sid);
}

async function loginCenterFetch<T>(
  path: string,
  init?: RequestInit & { allowUnauthorized?: boolean },
): Promise<T> {
  const response = await fetch(`${LOGIN_CENTER_API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok && !init?.allowUnauthorized) {
    const text = await response.text();
    throw new Error(
      `登录中心请求失败：${response.status} ${response.statusText} ${text}`,
    );
  }

  return (await response.json()) as T;
}

function assertSuccessEnvelope<T>(payload: LoginCenterEnvelope<T>): T {
  if (payload.code !== 0) {
    throw new Error(payload.message || "登录中心返回了失败结果。");
  }

  return payload.data;
}

export async function sendSmsCode(phone: string): Promise<void> {
  const payload = await loginCenterFetch<LoginCenterEnvelope<string>>(
    "/auth/send-code",
    {
      method: "POST",
      body: JSON.stringify({ phone }),
    },
  );
  assertSuccessEnvelope(payload);
}

export async function loginWithSmsCode(params: {
  phone: string;
  code: string;
}): Promise<LoginTokens> {
  const payload = await loginCenterFetch<LoginCenterEnvelope<LoginTokens>>(
    "/auth/login/sms",
    {
      method: "POST",
      body: JSON.stringify({
        phone: params.phone,
        code: params.code,
      }),
    },
  );

  return assertSuccessEnvelope(payload);
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<string | null> {
  const payload = await loginCenterFetch<LoginCenterEnvelope<{ accessToken: string }>>(
    "/auth/refresh",
    {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    },
  );

  if (payload.code !== 0) {
    return null;
  }

  return payload.data?.accessToken ?? null;
}

export async function logoutByRefreshToken(refreshToken: string): Promise<void> {
  const payload = await loginCenterFetch<LoginCenterEnvelope<string>>(
    "/auth/logout",
    {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    },
  );
  assertSuccessEnvelope(payload);
}

export async function introspectAccessToken(
  accessToken: string,
): Promise<LoginIdentity | null> {
  const response = await fetch(`${LOGIN_CENTER_API_URL}/internal/auth/introspect`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ accessToken }),
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `登录态校验失败：${response.status} ${response.statusText} ${text}`,
    );
  }

  const payload = (await response.json()) as IntrospectPayload;
  if (!payload.active || !payload.uid || !payload.sid) {
    return null;
  }

  return {
    uid: Number(payload.uid),
    sid: String(payload.sid),
  };
}

async function buildAuthenticatedSession(identity: LoginIdentity) {
  const profile = await ensureUserProfile(identity.uid);
  return formatViewer(profile, identity.sid);
}

export async function resolveServerSession(
  request: NextRequest,
  options?: { allowRefresh?: boolean },
): Promise<ResolvedServerSession> {
  const cookiePatch = createEmptyCookiePatch();
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value?.trim();
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value?.trim();
  const knownThreadIds = getKnownThreadIdsFromRequest(request);
  const guestId = request.cookies.get(GUEST_ID_COOKIE)?.value?.trim() || undefined;

  let nextAccessToken = accessToken;
  let identity = nextAccessToken
    ? await introspectAccessToken(nextAccessToken)
    : null;

  if (!identity && refreshToken && options?.allowRefresh) {
    const refreshed = await refreshAccessToken(refreshToken);
    if (refreshed) {
      nextAccessToken = refreshed;
      queueCookieSet(
        cookiePatch,
        ACCESS_TOKEN_COOKIE,
        refreshed,
        getBaseCookieOptions(60 * 60 * 2, true),
      );
      identity = await introspectAccessToken(refreshed);
    } else {
      clearAuthCookies(cookiePatch);
    }
  }

  if (!identity) {
    return {
      auth: { authenticated: false },
      accessToken: nextAccessToken,
      refreshToken,
      guestId,
      knownThreadIds,
      cookiePatch,
    };
  }

  return {
    auth: await buildAuthenticatedSession(identity),
    accessToken: nextAccessToken,
    refreshToken,
    guestId,
    knownThreadIds,
    cookiePatch,
  };
}
