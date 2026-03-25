"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthSessionPayload } from "@/lib/auth";
import { syncKnownThreadsCookie } from "@/lib/known-threads";

type AuthContextValue = {
  session: AuthSessionPayload;
  isLoading: boolean;
  refreshSession: () => Promise<AuthSessionPayload>;
  sendCode: (phone: string) => Promise<void>;
  loginWithSms: (phone: string, code: string) => Promise<AuthSessionPayload>;
  completeProfileSetup: (input: {
    nickname?: string;
    avatarUrl?: string | null;
    skip?: boolean;
  }) => Promise<AuthSessionPayload>;
  logout: () => Promise<void>;
};

type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error?: { message?: string } };

const AuthContext = createContext<AuthContextValue | null>(null);

async function parseEnvelope<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.ok) {
    throw new Error(
      !payload.ok
        ? payload.error?.message || "请求失败，请稍后再试。"
        : "请求失败，请稍后再试。",
    );
  }

  return payload.data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSessionPayload>({
    authenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const response = await fetch("/api/auth/me", {
      cache: "no-store",
    });
    const data = await parseEnvelope<AuthSessionPayload>(response);
    setSession(data);
    return data;
  }, []);

  useEffect(() => {
    syncKnownThreadsCookie();
    void (async () => {
      try {
        await refreshSession();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      refreshSession,
      async sendCode(phone: string) {
        const response = await fetch("/api/auth/send-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone }),
        });
        await parseEnvelope<string>(response);
      },
      async loginWithSms(phone: string, code: string) {
        syncKnownThreadsCookie();
        const response = await fetch("/api/auth/login/sms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone, code }),
        });
        const data = await parseEnvelope<AuthSessionPayload>(response);
        setSession(data);
        return data;
      },
      async completeProfileSetup(input) {
        const response = await fetch("/api/auth/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
        const data = await parseEnvelope<AuthSessionPayload>(response);
        setSession(data);
        return data;
      },
      async logout() {
        await fetch("/api/auth/logout", {
          method: "POST",
        });
        setSession({ authenticated: false });
      },
    }),
    [isLoading, refreshSession, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
