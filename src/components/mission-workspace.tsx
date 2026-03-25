"use client";

import { AIMessage } from "@langchain/core/messages";
import { useStream } from "@langchain/react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import type {
  CriticVerdict,
  MissionThread,
  PendingHumanConfirmation,
  ReviewTargetArtifactType,
} from "@/lib/missions";
import {
  ARTIFACT_LABELS,
  ARTIFACT_ORDER,
  createBootstrapPrompt,
  extractPlainText,
  getCriticVerdictLabel,
  getCriticVerdictOverall,
  type ArtifactType,
  type MissionGraphState,
} from "@/lib/missions";
import { LANGGRAPH_API_URL, LANGGRAPH_ASSISTANT_ID } from "@/lib/stream";
import { ArtifactViewerDialog } from "@/components/artifact-viewer-dialog";
import { HitlInterruptCard } from "@/components/hitl-interrupt-card";
import {
  MessageQueuePanel,
  type MessageQueueEntry,
} from "@/components/message-queue-panel";
import { MessageList } from "@/components/message-list";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  CopyIcon,
  LoaderCircleIcon,
  SquareIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MissionWorkspaceProps = {
  initialMission: MissionThread;
};

function formatDetailTime(value?: string) {
  if (!value) {
    return "暂无";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
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
      return "等待人工确认";
    case "error":
      return "运行异常";
    default:
      return "准备就绪";
  }
}

function getStatusTone(status: MissionThread["status"]) {
  switch (status) {
    case "busy":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "interrupted":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getReviewTone(review?: CriticVerdict) {
  if (!review) {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  switch (getCriticVerdictOverall(review.overall)) {
    case "pass":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "revise":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "block":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function summarizeArtifact(markdown?: string): string {
  const plain = extractPlainText(markdown);
  if (!plain) {
    return "Agent 还没有写入这份正式产物。";
  }

  return plain.length > 160 ? `${plain.slice(0, 160)}…` : plain;
}

function summarizeTailoredResume(state: MissionGraphState): string {
  const resume = state.tailoredResume;
  if (!resume) {
    return "定制简历会以排版后的结构化简历形式展示，不再在卡片里重复显示 markdown。";
  }

  const headline = resume.basics.headline || resume.targetRole;
  const sectionStats = [
    resume.skillGroups.length > 0 ? `${resume.skillGroups.length} 组技能` : null,
    resume.experience.length > 0 ? `${resume.experience.length} 段经历` : null,
    resume.projects.length > 0 ? `${resume.projects.length} 个项目` : null,
    resume.education.length > 0 ? `${resume.education.length} 段教育` : null,
  ].filter(Boolean);

  if (headline && sectionStats.length > 0) {
    return `${headline} · ${sectionStats.slice(0, 3).join(" · ")}`;
  }

  if (headline) {
    return headline;
  }

  if (sectionStats.length > 0) {
    return `已整理为结构化简历：${sectionStats.slice(0, 3).join(" · ")}`;
  }

  return "已生成结构化简历，详情页可查看完整排版效果。";
}

function getArtifactReview(
  state: MissionGraphState,
  artifactType: ArtifactType,
): CriticVerdict | undefined {
  return state.reviews?.[artifactType as ReviewTargetArtifactType];
}

function hasInterruptValue(value: unknown): value is { value: unknown } {
  return typeof value === "object" && value !== null && "value" in value;
}

function ArtifactPanel({
  state,
  onOpenArtifact,
}: {
  state: MissionGraphState;
  onOpenArtifact: (artifactType: ArtifactType) => void;
}) {
  const artifacts = state.artifacts ?? {};

  return (
    <div className="grid gap-3">
      {ARTIFACT_ORDER.map((artifactType) => {
        const artifact = artifacts[artifactType];
        const review = getArtifactReview(state, artifactType);
        const reviewLabel = getCriticVerdictLabel(review);
        const isTailoredResume = artifactType === "tailoredResume";
        const previewText = isTailoredResume
          ? summarizeTailoredResume(state)
          : summarizeArtifact(artifact?.markdown);

        return (
          <Card
            key={artifactType}
            className="rounded-[26px] border border-white/80 bg-white/88 shadow-[0_18px_44px_rgba(15,23,42,0.06)]"
          >
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="grid gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="rounded-full border-slate-200 bg-slate-50 text-slate-700"
                    >
                      {ARTIFACT_LABELS[artifactType]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full px-2.5",
                        artifact
                          ? "border-primary/15 bg-primary/8 text-primary"
                          : "border-slate-200 bg-slate-50 text-slate-500",
                      )}
                    >
                      {artifact ? "已写入" : "待生成"}
                    </Badge>
                    {reviewLabel && (
                      <Badge
                        variant="outline"
                        className={cn("rounded-full px-2.5", getReviewTone(review))}
                      >
                        {reviewLabel}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="font-heading text-[1.45rem] tracking-[-0.04em] text-slate-950">
                    {ARTIFACT_LABELS[artifactType]}
                  </CardTitle>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-slate-200 bg-white text-slate-700"
                  disabled={!artifact}
                  onClick={() => onOpenArtifact(artifactType)}
                >
                  {isTailoredResume ? "查看简历详情" : "展示全部内容"}
                </Button>
              </div>

              <CardDescription className="line-clamp-4 leading-7 text-slate-600">
                {previewText}
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3 rounded-[18px] border border-slate-200/80 bg-slate-50/80 px-3 py-2.5">
                <span className="text-slate-500">更新时间</span>
                <span className="font-medium text-slate-800">
                  {formatDetailTime(artifact?.updatedAt)}
                </span>
              </div>

              {review && (
                <div className="rounded-[20px] border border-slate-200/80 bg-slate-50/85 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Review Summary
                  </p>
                  <p className="mt-2 leading-7 text-slate-700">
                    {review.summary || "暂时还没有生成审查摘要。"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function EmptyWorkspaceState({
  mission,
  isBootstrapping,
}: {
  mission: MissionThread;
  isBootstrapping: boolean;
}) {
  return (
    <div className="grid h-full place-items-center px-6 py-8">
      <Card className="max-w-2xl rounded-[32px] border border-white/80 bg-white/92 shadow-[0_28px_70px_rgba(15,23,42,0.08)]">
        <CardHeader className="gap-4">
          <Badge
            variant="outline"
            className="w-fit rounded-full border-slate-200 bg-slate-50 text-slate-600"
          >
            {isBootstrapping ? "任务启动中" : "任务已就绪"}
          </Badge>
          <CardTitle className="font-heading text-4xl leading-tight tracking-[-0.05em] text-slate-950">
            {mission.metadata.title || "任务工作台"}
          </CardTitle>
          <CardDescription className="leading-8 text-slate-600">
            {isBootstrapping
              ? "正在为这个任务自动提交首条岗位分析请求。完成后，消息流、工具轨迹和正式产物都会开始出现。"
              : "任务已创建完成。你可以继续追问、修改方向，或者等待 Agent 写入正式产物。"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-slate-600">
          <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 px-4 py-4 leading-7">
            <p>
              <span className="font-medium text-slate-900">JD 线索：</span>
              {mission.metadata.jdPreview || "未记录"}
            </p>
            <p>
              <span className="font-medium text-slate-900">简历文件：</span>
              {mission.metadata.resumeFileName || "未记录"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MissionWorkspace({ initialMission }: MissionWorkspaceProps) {
  const [mission, setMission] = useState(initialMission);
  const [inputText, setInputText] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isSubmittingInterruptDecision, setIsSubmittingInterruptDecision] =
    useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [activeArtifactType, setActiveArtifactType] = useState<ArtifactType | null>(
    null,
  );
  const bootstrapAttemptedRef = useRef(false);

  const stream = useStream<MissionGraphState>({
    apiUrl: LANGGRAPH_API_URL,
    assistantId: LANGGRAPH_ASSISTANT_ID,
    threadId: mission.threadId,
    reconnectOnMount: true,
    fetchStateHistory: true,
  });

  const currentState =
    Object.keys(stream.values ?? {}).length > 0
      ? (stream.values as MissionGraphState)
      : (mission.values ?? {});
  const queueEntries = stream.queue.entries as MessageQueueEntry[];
  const streamInterruptValue = stream.interrupts.find(hasInterruptValue)?.value;

  const legacyPendingHumanConfirmation = currentState.pendingHumanConfirmation?.active
    ? (currentState.pendingHumanConfirmation as PendingHumanConfirmation)
    : undefined;
  const activeInterrupt = streamInterruptValue ?? legacyPendingHumanConfirmation;
  const isAwaitingHumanInput = Boolean(
    stream.interrupts.length > 0 || legacyPendingHumanConfirmation,
  );
  const hasMessages = stream.messages.length > 0;
  const hasQueuedMessages = queueEntries.length > 0;

  const activeArtifact = activeArtifactType
    ? currentState.artifacts?.[activeArtifactType]
    : undefined;

    console.log("Current St11ate:", stream.values);
  const activeReview = activeArtifactType
    ? getArtifactReview(currentState, activeArtifactType)
    : undefined;
  const activeTailoredResume =
    activeArtifactType === "tailoredResume"
      ? currentState.tailoredResume
      : undefined;

  const handleCopyLastMessage = () => {
    const lastAi = [...stream.messages].reverse().find(AIMessage.isInstance);
    if (!lastAi) return;

    const content =
      typeof lastAi.content === "string"
        ? lastAi.content
        : JSON.stringify(lastAi.content);
    navigator.clipboard.writeText(content).catch(() => undefined);
  };

  const handleSubmit = async (message: { text: string }) => {
    if (!message.text.trim()) return;
    setInputText("");
    await stream.submit(
      {
        messages: [{ type: "human", content: message.text }],
      },
      {
        multitaskStrategy: "enqueue",
      },
    );
  };

  const handleCancelQueuedMessage = async (id: string) => {
    await stream.queue.cancel(id);
  };

  const handleClearQueuedMessages = async () => {
    await stream.queue.clear();
  };

  const handleResumeInterrupt = async (value: unknown) => {
    setIsSubmittingInterruptDecision(true);
    setWorkspaceError(null);

    try {
      await stream.submit(null, {
        command: {
          resume: value,
        },
      });
    } catch (error) {
      setWorkspaceError(
        error instanceof Error
          ? error.message
          : "提交人工确认结果失败，请稍后重试。",
      );
    } finally {
      setIsSubmittingInterruptDecision(false);
    }
  };

  const bootstrapMission = useEffectEvent(async () => {
    if (
      !mission.metadata.jdInput ||
      !mission.metadata.resumeObjectKey ||
      !mission.metadata.resumeStorageOwnerId
    ) {
      return;
    }

    setIsBootstrapping(true);
    setWorkspaceError(null);

    try {
      const signResponse = await fetch(
        `/api/oss/sign?threadId=${encodeURIComponent(
          mission.threadId,
        )}&key=${encodeURIComponent(mission.metadata.resumeObjectKey)}`,
      );
      const signPayload = (await signResponse.json()) as
        | { ok: true; data: { url: string } }
        | { ok: false; error?: { message?: string } };

      if (!signResponse.ok || !signPayload.ok) {
        throw new Error(
          !signPayload.ok
            ? signPayload.error?.message || "生成简历临时链接失败。"
            : "生成简历临时链接失败。",
        );
      }

      await stream.submit({
        messages: [
          {
            type: "human",
            content: createBootstrapPrompt(
              mission.metadata.jdInput,
              signPayload.data.url,
            ),
          },
        ],
      });

      const patchResponse = await fetch(`/api/missions/${mission.threadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metadata: {
            bootstrapStatus: "completed",
          },
        }),
      });

      const patchPayload = (await patchResponse.json()) as
        | { ok: true; data: MissionThread }
        | { ok: false };

      if (patchResponse.ok && patchPayload.ok) {
        setMission(patchPayload.data);
      }
    } catch (error) {
      setWorkspaceError(
        error instanceof Error
          ? error.message
          : "工作台初始化失败，请手动重试。",
      );
      bootstrapAttemptedRef.current = false;
    } finally {
      setIsBootstrapping(false);
    }
  });

  useEffect(() => {
    if (bootstrapAttemptedRef.current) return;
    if (mission.metadata.bootstrapStatus === "completed") return;
    if (stream.isThreadLoading || stream.isLoading) return;
    if (hasMessages) return;

    bootstrapAttemptedRef.current = true;
    void bootstrapMission();
  }, [
    hasMessages,
    mission.metadata.bootstrapStatus,
    stream.isLoading,
    stream.isThreadLoading,
  ]);

  return (
    <>
      <div className="h-full min-h-0 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_22%),linear-gradient(180deg,#f7f9ff_0%,#f2f6ff_48%,#eef3fb_100%)] text-slate-900">
        <div className="mx-auto grid h-full min-h-0 max-w-[1760px] gap-5 overflow-hidden px-4 py-4 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-6">
          <main className="flex h-full min-h-0 flex-col overflow-hidden rounded-[34px] border border-white/75 bg-white/68 shadow-[0_36px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl">
            <header className="shrink-0 border-b border-slate-200/80 px-5 py-4 lg:px-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 grid gap-3">
                  <div className="grid gap-2">
                  </div>

                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn("rounded-full px-2.5", getStatusTone(mission.status))}
                    >
                      {getStatusLabel(mission.status)}
                    </Badge>
                       <Badge
                    variant="outline"
                    className="hidden rounded-full border-slate-200 bg-white text-slate-600 lg:inline-flex"
                  >
                    实时对话
                  </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-full border-slate-200 bg-white text-slate-500"
                    >
                      线程 {mission.threadId.slice(0, 8)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-full border-slate-200 bg-white text-slate-500"
                    >
                      更新于 {formatDetailTime(mission.updatedAt)}
                    </Badge>
                    
                    {isAwaitingHumanInput && (
                      <Badge
                        variant="outline"
                        className="rounded-full border-amber-200 bg-amber-50 text-amber-800"
                      >
                        人工确认中
                      </Badge>
                    )}
                    {hasQueuedMessages && (
                      <Badge
                        variant="outline"
                        className="rounded-full border-sky-200 bg-sky-50 text-sky-700"
                      >
                        队列 {queueEntries.length}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
               
                  {stream.isLoading && !isBootstrapping && (
                    <Button
                      variant="outline"
                      className="rounded-full border-slate-200 bg-white text-slate-700"
                      onClick={() => {
                        void stream.stop();
                      }}
                    >
                      <SquareIcon className="size-4" />
                      停止生成
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="rounded-full border-slate-200 bg-white text-slate-700"
                    onClick={handleCopyLastMessage}
                  >
                    <CopyIcon className="size-4" />
                    复制最后回复
                  </Button>
                </div>
              </div>

              {workspaceError && (
                <Alert className="mt-4 border-rose-200 bg-rose-50/90 text-rose-950">
                  <AlertTitle>工作台初始化未完成</AlertTitle>
                  <AlertDescription>{workspaceError}</AlertDescription>
                </Alert>
              )}
            </header>

            <div className="min-h-0 flex flex-1 flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(248,250,255,0.12))]">
              {!hasMessages && !activeInterrupt ? (
                <EmptyWorkspaceState
                  mission={mission}
                  isBootstrapping={isBootstrapping}
                />
              ) : (
                <MessageList
                  messages={stream.messages}
                  isLoading={stream.isLoading}
                  onCopyLastMessage={handleCopyLastMessage}
                  interruptCard={
                    activeInterrupt ? (
                      <HitlInterruptCard
                        interrupt={activeInterrupt}
                        canResume={streamInterruptValue !== undefined}
                        isSubmitting={isSubmittingInterruptDecision}
                        onResume={handleResumeInterrupt}
                      />
                    ) : undefined
                  }
                />
              )}
            </div>

            <div className="shrink-0 border-t border-slate-200/80 bg-white/72 px-4 py-4">
              <MessageQueuePanel
                className="mb-3"
                entries={queueEntries}
                onCancel={handleCancelQueuedMessage}
                onClear={handleClearQueuedMessages}
              />

              {(stream.isLoading || isBootstrapping) && (
                <div className="mb-3 flex items-center gap-2 px-2 text-sm text-slate-500">
                  <LoaderCircleIcon className="size-4 animate-spin text-primary" />
                  {isBootstrapping
                    ? "正在为这个任务发起首条岗位分析请求..."
                    : isAwaitingHumanInput
                      ? "Agent 已暂停，等待你在消息区卡片里给出确认结果。"
                    : hasQueuedMessages
                      ? `Agent 正在继续写作与推理，${queueEntries.length} 条新消息已进入队列。`
                      : "Agent 正在继续写作与推理，你可以继续发送后续问题。"}
                </div>
              )}

              <PromptInput
                onSubmit={handleSubmit}
                className="mx-auto w-full max-w-4xl rounded-[28px] border border-slate-200/80 bg-white/92 px-2 py-2 shadow-[0_16px_44px_rgba(15,23,42,0.06)]"
              >
                <PromptInputBody>
                  <PromptInputTextarea
                    disabled={isBootstrapping || isAwaitingHumanInput}
                    value={inputText}
                    onChange={(event) => setInputText(event.target.value)}
                    placeholder={
                      isAwaitingHumanInput
                        ? "Agent 当前正在等待你的人工确认，请先在消息区卡片里完成判断。"
                        : stream.isLoading
                        ? "当前回复仍在生成。继续输入的内容会自动加入队列。"
                        : "继续补充岗位信息、修改策略方向，或要求 Agent 生成下一步产物。"
                    }
                    className="min-h-[68px]"
                  />
                </PromptInputBody>
                <PromptInputFooter>
                  <PromptInputSubmit
                    status={isBootstrapping ? "submitted" : "ready"}
                    disabled={
                      !inputText.trim() ||
                      isBootstrapping ||
                      isAwaitingHumanInput
                    }
                  />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </main>

          <aside className="h-full min-h-0 overflow-hidden rounded-[30px] border border-white/75 bg-white/68 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="flex h-full min-h-0 flex-col">
              <div className="shrink-0 border-b border-slate-200/80 px-4 py-4">
                <div className="grid gap-1">
                  <h3 className="font-heading text-[2rem] leading-none tracking-[-0.05em] text-slate-950">
                    正式产物
                  </h3>
                </div>
              </div>

              <ScrollArea className="h-0 min-h-0 flex-1">
                <div className="p-4">
                  <ArtifactPanel
                    state={currentState}
                    onOpenArtifact={setActiveArtifactType}
                  />
                </div>
              </ScrollArea>
            </div>
          </aside>
        </div>
      </div>

      <ArtifactViewerDialog
        open={activeArtifactType !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveArtifactType(null);
          }
        }}
        title={activeArtifactType ? ARTIFACT_LABELS[activeArtifactType] : "Artifact"}
        artifact={activeArtifact}
        review={activeReview}
        tailoredResume={activeTailoredResume}
      />
    </>
  );
}
