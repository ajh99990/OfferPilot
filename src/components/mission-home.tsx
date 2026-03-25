"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { MissionThread } from "@/lib/missions";
import { useAuth } from "@/components/auth-provider";
import { PhoneLoginDialog } from "@/components/phone-login-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowRightIcon,
  BrainCircuitIcon,
  FileTextIcon,
  MessageSquareIcon,
  SparklesIcon,
  TargetIcon,
  type LucideIcon,
} from "lucide-react";
import {
  hasDismissedLoginPrompt,
  markLoginPromptDismissed,
  syncKnownThreadsCookie,
} from "@/lib/known-threads";
import { cn } from "@/lib/utils";
import { CreateMissionDialog } from "./create-mission-dialog";

type MissionHomeProps = {
  initialMissions: MissionThread[];
  initialLoadError?: string | null;
};

const capabilityHighlights: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "岗位拆解",
    description: "提炼关键要求、硬性门槛和潜在风险，先把方向看清。",
    icon: TargetIcon,
  },
  {
    title: "简历策略",
    description: "指出该补的证据、该强化的亮点，以及更合适的表达方式。",
    icon: BrainCircuitIcon,
  },
  {
    title: "正式产物",
    description: "沉淀定制简历、求职信和结构化输出，不只是停留在聊天里。",
    icon: FileTextIcon,
  },
  {
    title: "持续推进",
    description: "后续可以继续追问、改方向、补材料，让任务一路往前走。",
    icon: MessageSquareIcon,
  },
];

const deliveryChips = ["岗位分析", "简历策略", "定制简历", "面试提纲"];

function formatMissionTime(value?: string): string {
  if (!value) {
    return "刚刚";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusLabel(status: MissionThread["status"]) {
  switch (status) {
    case "busy":
      return "运行中";
    case "interrupted":
      return "待确认";
    case "error":
      return "异常";
    default:
      return "空闲";
  }
}

export function MissionHome({
  initialMissions,
  initialLoadError,
}: MissionHomeProps) {
  const auth = useAuth();
  const router = useRouter();
  const [missions, setMissions] = useState(initialMissions);
  const [loadError, setLoadError] = useState(initialLoadError ?? null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [isRouting, startRouting] = useTransition();
  const [isLoadingMissions, setIsLoadingMissions] = useState(
    initialMissions.length === 0,
  );

  const leftColumnTitle = useMemo(() => {
    if (missions.length === 0) {
      return "还没有任务";
    }
    return `${missions.length} 条历史任务`;
  }, [missions.length]);

  function handleCreatedMission(mission: MissionThread) {
    setMissions((current) => [mission, ...current]);
    startRouting(() => {
      router.push(`/missions/${mission.threadId}`);
    });
  }

  const loadMissions = useCallback(async () => {
    setIsLoadingMissions(true);
    setLoadError(null);
    syncKnownThreadsCookie();

    try {
      const response = await fetch("/api/missions", {
        cache: "no-store",
      });
      const payload = (await response.json()) as
        | { ok: true; data: MissionThread[] }
        | { ok: false; error?: { message?: string } };

      if (!response.ok || !payload.ok) {
        throw new Error(
          !payload.ok
            ? payload.error?.message || "读取任务列表失败。"
            : "读取任务列表失败。",
        );
      }

      setMissions(payload.data);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "读取任务列表失败，请稍后重试。",
      );
    } finally {
      setIsLoadingMissions(false);
    }
  }, []);

  useEffect(() => {
    void loadMissions();
  }, [loadMissions, auth.session.authenticated, auth.session.user?.uid]);

  function handleOpenCreateDialog() {
    if (auth.session.authenticated || hasDismissedLoginPrompt()) {
      setDialogOpen(true);
      return;
    }

    setLoginPromptOpen(true);
  }

  return (
    <>
      <div className="h-full min-h-0 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_22%),linear-gradient(180deg,#f7f9ff_0%,#f2f6ff_48%,#eef3fb_100%)] text-slate-900">
        <div className="mx-auto grid h-full min-h-0 max-w-[1680px] gap-4 overflow-hidden px-4 py-4 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-6 lg:px-6">
          <aside className="h-full min-h-0 overflow-hidden rounded-[30px] border border-white/70 bg-white/72 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 px-5 py-5">
                <div className="grid gap-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
                    任务档案
                  </p>
                  <h1 className="font-heading text-3xl tracking-[-0.03em] text-slate-950">
                    {leftColumnTitle}
                  </h1>
                </div>
              </div>

              <ScrollArea className="h-0 min-h-0 flex-1">
                <div className="grid gap-3 p-4">
                  {missions.map((mission) => (
                    <Link key={mission.threadId} href={`/missions/${mission.threadId}`}>
                      <Card
                        size="sm"
                        className="rounded-[24px] border border-white/70 bg-white/88 transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                      >
                        <CardHeader className="gap-2">
                          <div className="flex items-center justify-between gap-3">
                            <CardTitle className="line-clamp-2 font-heading text-xl leading-6 tracking-[-0.03em] text-slate-950">
                              {mission.metadata.title || "未命名任务"}
                            </CardTitle>
                            <Badge
                              variant="outline"
                              className={cn(
                                "shrink-0 rounded-full border px-2.5",
                                mission.status === "busy" &&
                                  "border-sky-200 bg-sky-50 text-sky-800",
                                mission.status === "interrupted" &&
                                  "border-amber-200 bg-amber-50 text-amber-800",
                                mission.status === "error" &&
                                  "border-rose-200 bg-rose-50 text-rose-800",
                                mission.status === "idle" &&
                                  "border-slate-200 bg-slate-50 text-slate-700",
                              )}
                            >
                              {getStatusLabel(mission.status)}
                            </Badge>
                          </div>
                          <CardDescription className="line-clamp-3 text-[13px] leading-6 text-slate-600">
                            {mission.metadata.jdPreview || "等待岗位信息"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-500">
                          <span>{formatMissionTime(mission.updatedAt)}</span>
                          <span>{mission.threadId.slice(0, 8)}</span>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}

                  {missions.length === 0 && (
                    <Card className="rounded-[24px] border border-dashed border-slate-300/80 bg-white/70">
                      <CardHeader>
                        <CardTitle className="font-heading text-2xl tracking-[-0.03em]">
                          第一条任务
                        </CardTitle>
                        <CardDescription className="leading-7 text-slate-600">
                          还没有历史记录。先创建一个求职任务，工作台会自动给出第一版岗位分析。
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}

                  {isLoadingMissions && missions.length === 0 && (
                    <Card className="rounded-[24px] border border-slate-200 bg-white/80">
                      <CardHeader>
                        <CardTitle className="text-base text-slate-900">
                          正在读取任务列表
                        </CardTitle>
                        <CardDescription className="text-slate-600">
                          正在同步你当前可访问的任务，请稍候。
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}

                  {loadError && (
                    <Card className="rounded-[24px] border border-rose-200 bg-rose-50/80">
                      <CardHeader>
                        <CardTitle className="text-base text-rose-950">
                          读取历史任务失败
                        </CardTitle>
                        <CardDescription className="text-rose-800">
                          {loadError}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </div>
          </aside>

          <main className="h-full min-h-0 overflow-hidden rounded-[36px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.76),rgba(245,248,255,0.66))] shadow-[0_36px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl">
            <ScrollArea className="h-full">
              <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-start lg:gap-6 lg:p-6">
                <div className="grid gap-4 lg:gap-5">
                  <div className="grid gap-3">
                    <h2 className="max-w-4xl font-heading text-5xl leading-[0.94] tracking-[-0.05em] text-slate-950 sm:text-6xl xl:text-7xl">
                      把岗位链接和基础简历，
                      <span className="text-primary">变成可持续推进的求职任务。</span>
                    </h2>
                    <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                      创建任务后，Agent 会先拆解岗位要求，再持续输出简历策略、正式产物和面试准备内容。你得到的不是一次性回答，而是一条能反复推进的求职工作流。
                    </p>
                  </div>
                </div>

                <section className="relative overflow-hidden rounded-[30px] border border-slate-900/15 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.26),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_28%),linear-gradient(145deg,#020617_0%,#0f172a_52%,#111827_100%)] p-5 text-slate-50 shadow-[0_32px_80px_rgba(15,23,42,0.24)] lg:p-6">
                  <div className="absolute right-5 top-5 size-24 rounded-full border border-white/10 bg-white/5 blur-sm" />
                  <div className="absolute -left-12 bottom-6 size-28 rounded-full bg-sky-400/15 blur-3xl" />

                  <div className="relative grid gap-5 lg:gap-6">
                    <div className="flex items-center gap-2 text-slate-300">
                      <SparklesIcon className="size-4" />
                      <span className="text-xs font-semibold uppercase tracking-[0.24em]">
                        Agent 能帮你产出什么
                      </span>
                    </div>

                    

                    <div className="flex flex-wrap gap-2">
                      {deliveryChips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-medium text-slate-200"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {capabilityHighlights.map(({ title, description, icon: Icon }) => (
                        <div
                          key={title}
                          className="rounded-[22px] border border-white/10 bg-white/6 p-4 backdrop-blur-sm"
                        >
                          <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-white/10 text-sky-200">
                            <Icon className="size-5" />
                          </div>
                          <p className="text-sm font-semibold text-slate-50">{title}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {description}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/7 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="grid gap-1">
                        <p className="text-sm font-medium text-slate-50">
                          创建后会先交付第一版岗位分析，再继续沉淀后续产物。
                        </p>
                        <p className="text-sm leading-6 text-slate-400">
                          你可以随时回到任务工作台，继续补充信息、修改方向、要求 Agent 产出下一版。
                        </p>
                      </div>
                      <Button
                        onClick={handleOpenCreateDialog}
                        className="h-12 rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground hover:brightness-110"
                        disabled={isRouting}
                      >
                        {isRouting ? "正在进入工作台..." : "创建新任务"}
                        <ArrowRightIcon className="size-4" />
                      </Button>
                    </div>
                  </div>
                </section>
              </div>
            </ScrollArea>
          </main>
        </div>
      </div>

      <CreateMissionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleCreatedMission}
      />
      <PhoneLoginDialog
        open={loginPromptOpen}
        onOpenChange={setLoginPromptOpen}
        title="登录后再创建任务，会更稳妥"
        description="登录后你创建过的任务会自动归档到账户下。你也可以暂不登录，先在当前浏览器里继续使用。"
        showSkipButton
        onSkip={() => {
          markLoginPromptDismissed();
          setLoginPromptOpen(false);
          setDialogOpen(true);
        }}
        onSuccess={() => {
          setLoginPromptOpen(false);
          setDialogOpen(true);
        }}
      />
    </>
  );
}
