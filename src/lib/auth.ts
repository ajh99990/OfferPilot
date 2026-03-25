export const LOGIN_CENTER_API_URL =
  process.env.LOGIN_CENTER_API_URL?.trim() ||
  "https://ygstudio.online/login-center";

export const ACCESS_TOKEN_COOKIE = "offerpilot_access_token";
export const REFRESH_TOKEN_COOKIE = "offerpilot_refresh_token";
export const GUEST_ID_COOKIE = "offerpilot_guest_id";
export const KNOWN_THREADS_COOKIE = "offerpilot_known_threads";

export const KNOWN_THREADS_STORAGE_KEY = "offerpilot.known-thread-ids";
export const LOGIN_PROMPT_DISMISSED_KEY = "offerpilot.login-prompt-dismissed";

export type AuthenticatedViewer = {
  uid: number;
  sid: string;
  nickname: string;
  avatarUrl: string | null;
  needsProfileSetup: boolean;
};

export type AuthSessionPayload = {
  authenticated: boolean;
  user?: AuthenticatedViewer;
};
