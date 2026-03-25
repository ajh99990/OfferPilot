import {
  KNOWN_THREADS_COOKIE,
  KNOWN_THREADS_STORAGE_KEY,
  LOGIN_PROMPT_DISMISSED_KEY,
} from "@/lib/auth";

const THREAD_ID_PATTERN = /^[a-zA-Z0-9_-]{1,160}$/;
const MAX_KNOWN_THREADS = 120;
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function normalizeKnownThreadIds(ids: Iterable<string>): string[] {
  const normalized = new Set<string>();

  for (const id of ids) {
    const value = id.trim();
    if (!THREAD_ID_PATTERN.test(value)) {
      continue;
    }
    normalized.add(value);
    if (normalized.size >= MAX_KNOWN_THREADS) {
      break;
    }
  }

  return [...normalized];
}

export function parseKnownThreadsCookie(value?: string | null): string[] {
  if (!value) {
    return [];
  }

  return normalizeKnownThreadIds(value.split(","));
}

export function serializeKnownThreadsCookie(ids: Iterable<string>): string {
  return normalizeKnownThreadIds(ids).join(",");
}

export function readKnownThreadIdsFromStorage(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(KNOWN_THREADS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? normalizeKnownThreadIds(parsed) : [];
  } catch {
    return [];
  }
}

export function writeKnownThreadIdsToStorage(ids: Iterable<string>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    KNOWN_THREADS_STORAGE_KEY,
    JSON.stringify(normalizeKnownThreadIds(ids)),
  );
}

export function syncKnownThreadsCookie(ids?: Iterable<string>) {
  if (typeof document === "undefined") {
    return;
  }

  const serialized = serializeKnownThreadsCookie(
    ids ?? readKnownThreadIdsFromStorage(),
  );
  document.cookie = `${KNOWN_THREADS_COOKIE}=${encodeURIComponent(serialized)}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}

export function rememberKnownThreadId(threadId: string) {
  const next = normalizeKnownThreadIds([
    threadId,
    ...readKnownThreadIdsFromStorage(),
  ]);
  writeKnownThreadIdsToStorage(next);
  syncKnownThreadsCookie(next);
}

export function hasDismissedLoginPrompt(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(LOGIN_PROMPT_DISMISSED_KEY) === "1";
}

export function markLoginPromptDismissed() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOGIN_PROMPT_DISMISSED_KEY, "1");
}
