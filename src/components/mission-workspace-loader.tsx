"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MissionThread } from "@/lib/missions";
import { rememberKnownThreadId, syncKnownThreadsCookie } from "@/lib/known-threads";
import { useAuth } from "@/components/auth-provider";
import { MissionWorkspace } from "@/components/mission-workspace";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LoaderCircleIcon } from "lucide-react";

type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error?: { message?: string } };

export function MissionWorkspaceLoader({ threadId }: { threadId: string }) {
  const auth = useAuth();
  const [mission, setMission] = useState<MissionThread | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    syncKnownThreadsCookie();
    void (async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/missions/${threadId}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as ApiEnvelope<MissionThread>;
        if (!response.ok || !payload.ok) {
          throw new Error(
            !payload.ok
              ? payload.error?.message || "读取任务失败。"
              : "读取任务失败。",
          );
        }

        rememberKnownThreadId(payload.data.threadId);
        setMission(payload.data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "读取任务失败，请稍后重试。",
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, [auth.session.authenticated, auth.session.user?.uid, threadId]);

  if (mission) {
    return <MissionWorkspace initialMission={mission} />;
  }

  return (
    <div className="grid h-full min-h-0 place-items-center bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_22%),linear-gradient(180deg,#f7f9ff_0%,#f2f6ff_48%,#eef3fb_100%)] px-6">
      <div className="grid max-w-lg gap-4 rounded-[30px] border border-white/85 bg-white/90 p-6 shadow-[0_28px_70px_rgba(15,23,42,0.10)]">
        {isLoading ? (
          <div className="flex items-center gap-3 text-slate-600">
            <LoaderCircleIcon className="size-5 animate-spin text-primary" />
            正在加载任务工作台...
          </div>
        ) : (
          <>
            <Alert className="border-rose-200 bg-rose-50 text-rose-950">
              <AlertTitle>暂时无法打开这个任务</AlertTitle>
              <AlertDescription>{errorMessage || "请稍后再试。"}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button asChild className="rounded-full bg-slate-950 text-slate-50 hover:bg-slate-800">
                <Link href="/">返回首页</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-slate-200 bg-white text-slate-700"
                onClick={() => window.location.reload()}
              >
                重新加载
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
