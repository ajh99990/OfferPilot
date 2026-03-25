"use client";

import {
  getCriticVerdictLabel,
  type ArtifactSlot,
  type CriticVerdict,
  type TailoredResume,
} from "@/lib/missions";
import { MessageResponse } from "@/components/ai-elements/message";
import { TailoredResumeView } from "@/components/tailored-resume-view";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckIcon,
  CircleAlertIcon,
  CopyIcon,
  FileDownIcon,
} from "lucide-react";
import { useState } from "react";

type ArtifactViewerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  artifact?: ArtifactSlot;
  review?: CriticVerdict;
  tailoredResume?: TailoredResume;
};

function formatDetailTime(value?: string) {
  if (!value) {
    return "暂无";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ArtifactViewerDialog({
  open,
  onOpenChange,
  title,
  artifact,
  review,
  tailoredResume,
}: ArtifactViewerDialogProps) {
  const [copied, setCopied] = useState(false);
  const reviewLabel = getCriticVerdictLabel(review);
  const isResumeArtifact = tailoredResume !== undefined;
  const hasResumeNotes = Boolean(
    tailoredResume &&
      (tailoredResume.warnings.length > 0 ||
        tailoredResume.missingFacts.length > 0),
  );

  const handleCopy = async () => {
    if (!artifact?.markdown) return;
    await navigator.clipboard.writeText(artifact.markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[min(92vh,1040px)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] gap-0 overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,255,0.98))] p-0 shadow-[0_40px_120px_rgba(15,23,42,0.22)] xl:w-[min(98vw,1800px)] xl:max-w-[min(98vw,1800px)]">
        <DialogHeader className="gap-2 border-b border-slate-200/80 px-5 py-3.5 lg:px-6 lg:py-4">
          <div className="flex items-start justify-between gap-4 pr-10">
            <div className="min-w-0 grid gap-1">
              <DialogTitle className="font-heading text-[1.65rem] leading-tight text-slate-950 lg:text-[1.85rem]">
                {title}
              </DialogTitle>
              <DialogDescription className="max-w-4xl text-sm leading-6 text-slate-600">
                更新时间 {formatDetailTime(artifact?.updatedAt)}
                {reviewLabel ? ` · 审查结论 ${reviewLabel}` : ""}
              </DialogDescription>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {hasResumeNotes && tailoredResume ? (
                <HoverCard openDelay={120}>
                  <HoverCardTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-full border-slate-200 bg-white text-slate-700"
                    >
                      <CircleAlertIcon className="size-4" />
                      简历提示
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent
                    align="end"
                    className="w-[360px] rounded-[22px] border border-slate-200/80 bg-white/96 p-4 shadow-[0_24px_64px_rgba(15,23,42,0.12)]"
                  >
                    <div className="grid gap-4">
                      {tailoredResume.warnings.length > 0 ? (
                        <div className="grid gap-2">
                          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            注意事项
                          </h3>
                          <ul className="grid list-disc gap-1.5 pl-5 text-sm leading-7 text-slate-700 marker:text-slate-400">
                            {tailoredResume.warnings.map((warning, index) => (
                              <li key={`warning-${index}`}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {tailoredResume.missingFacts.length > 0 ? (
                        <div className="grid gap-2">
                          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            待补充事实
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {tailoredResume.missingFacts.map((fact, index) => (
                              <span
                                key={`missing-${index}`}
                                className="rounded-full border border-slate-200/80 bg-slate-50/90 px-3 py-1.5 text-xs font-medium text-slate-700"
                              >
                                {fact}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ) : null}

              {isResumeArtifact ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button
                          variant="outline"
                          className="rounded-full border-slate-200 bg-white text-slate-700"
                          disabled
                        >
                          <FileDownIcon className="size-4" />
                          导出 PDF
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>功能开发中</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button
                  variant="outline"
                  className="rounded-full border-slate-200 bg-white text-slate-700"
                  onClick={handleCopy}
                  disabled={!artifact?.markdown}
                >
                  {copied ? (
                    <CheckIcon className="size-4 text-emerald-600" />
                  ) : (
                    <CopyIcon className="size-4" />
                  )}
                  {copied ? "已复制" : "复制全文"}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="w-full p-4 sm:p-6 lg:p-8 xl:p-10">
              {tailoredResume ? (
                <TailoredResumeView resume={tailoredResume} />
              ) : artifact?.markdown ? (
                <div className="w-full rounded-[28px] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_16px_48px_rgba(15,23,42,0.06)] sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-10 xl:py-10">
                  <MessageResponse className="size-full text-[15px] leading-8 text-slate-800 [&_a]:text-primary [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_code]:rounded-md [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_h1]:font-heading [&_h1]:text-3xl [&_h1]:tracking-[-0.03em] [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:tracking-[-0.03em] [&_h3]:font-heading [&_h3]:text-xl [&_li]:leading-8 [&_p]:leading-8 [&_pre]:rounded-[20px] [&_pre]:border [&_pre]:border-slate-200/80 [&_pre]:bg-slate-950 [&_pre]:shadow-none">
                    {artifact.markdown}
                  </MessageResponse>
                </div>
              ) : (
                <div className="grid place-items-center rounded-[28px] border border-dashed border-slate-300 bg-white/70 px-6 py-20 text-center">
                  <div className="max-w-md space-y-3">
                    <p className="font-heading text-2xl text-slate-950">
                      这份正式产物还没有内容
                    </p>
                    <p className="text-sm leading-7 text-slate-600">
                      当 Agent 把完整 markdown 写入 artifact 后，这里会显示全文阅读视图。
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
