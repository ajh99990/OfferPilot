"use client";

import { startTransition, useMemo, useState } from "react";
import type { MissionThread } from "@/lib/missions";
import { rememberKnownThreadId } from "@/lib/known-threads";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { FileIcon, LoaderCircleIcon, UploadCloudIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type OssStsResponse = {
  ok: true;
  data: {
    AccessKeyId: string;
    AccessKeySecret: string;
    SecurityToken: string;
    Expiration: string;
    bucket: string;
    region: string;
    prefix: string;
    perPath: string;
    cdnHost?: string;
  };
};

type MissionCreateResponse = {
  ok: true;
  data: MissionThread;
};

type ErrorResponse = {
  ok: false;
  error?: {
    message?: string;
  };
};

type CreateMissionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (mission: MissionThread) => void;
};

function sanitizeFileName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "") || "resume.pdf";
}

function buildObjectUrl(params: {
  objectKey: string;
  uploadUrl?: string;
  bucket: string;
  region: string;
  cdnHost?: string;
}): string {
  if (params.cdnHost) {
    return `https://${params.cdnHost}/${params.objectKey}`;
  }

  if (params.uploadUrl) {
    return params.uploadUrl;
  }

  return `https://${params.bucket}.${params.region}.aliyuncs.com/${params.objectKey}`;
}

export function CreateMissionDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateMissionDialogProps) {
  const [jdInput, setJdInput] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "uploading" | "creating">("idle");

  const progressValue = useMemo(() => {
    if (step === "uploading") return 42;
    if (step === "creating") return 86;
    return 0;
  }, [step]);

  const resetForm = () => {
    setJdInput("");
    setResumeFile(null);
    setErrorMessage(null);
    setIsSubmitting(false);
    setStep("idle");
  };

  async function uploadResume(file: File) {
    const stsResponse = await fetch("/api/oss/sts");
    const stsPayload = (await stsResponse.json()) as
      | OssStsResponse
      | ErrorResponse;

    if (!stsResponse.ok || !stsPayload.ok) {
      throw new Error(
        !stsPayload.ok
          ? stsPayload.error?.message || "获取简历上传凭证失败。"
          : "获取简历上传凭证失败。",
      );
    }

    const OSS = (await import("ali-oss")).default;
    const objectKey = `${stsPayload.data.prefix}${Date.now()}-${sanitizeFileName(file.name)}`;
    const client = new OSS({
      accessKeyId: stsPayload.data.AccessKeyId,
      accessKeySecret: stsPayload.data.AccessKeySecret,
      stsToken: stsPayload.data.SecurityToken,
      bucket: stsPayload.data.bucket,
      region: stsPayload.data.region,
      secure: true,
      useFetch: true,
    });

    const result = await client.put(objectKey, file);

    return {
      objectKey,
      objectUrl: buildObjectUrl({
        objectKey,
        uploadUrl: result.url,
        bucket: stsPayload.data.bucket,
        region: stsPayload.data.region,
        cdnHost: stsPayload.data.cdnHost,
      }),
    };
  }

  async function handleCreateMission() {
    const trimmedJd = jdInput.trim();

    if (!trimmedJd) {
      setErrorMessage("请先填写 JD 链接或岗位描述。");
      return;
    }

    if (!resumeFile) {
      setErrorMessage("请上传一份 PDF 简历。");
      return;
    }

    if (resumeFile.type !== "application/pdf") {
      setErrorMessage("当前仅支持上传 PDF 简历。");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      setStep("uploading");
      const uploaded = await uploadResume(resumeFile);

      setStep("creating");
      const response = await fetch("/api/missions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jdInput: trimmedJd,
          resumeObjectKey: uploaded.objectKey,
          resumeObjectUrl: uploaded.objectUrl,
          resumeFileName: resumeFile.name,
        }),
      });

      const payload = (await response.json()) as
        | MissionCreateResponse
        | ErrorResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(
          !payload.ok ? payload.error?.message || "创建任务失败。" : "创建任务失败。",
        );
      }

      startTransition(() => {
        rememberKnownThreadId(payload.data.threadId);
        onCreated(payload.data);
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "创建任务失败，请稍后再试。",
      );
    } finally {
      setIsSubmitting(false);
      setStep("idle");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogContent className="flex w-[min(96vw,980px)] max-h-[min(90dvh,880px)] flex-col gap-6 overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,255,0.98))] p-0 shadow-[0_36px_120px_rgba(15,23,42,0.18)] sm:max-w-[980px]">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="font-heading text-3xl tracking-[-0.03em] text-slate-950">
            创建新任务
          </DialogTitle>
          <DialogDescription className="text-sm leading-7 text-slate-600">
            先提交岗位信息和基础简历。进入任务工作台后，Agent 会自动给出第一版岗位分析，并继续帮你推进后续产物。
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-6 pb-1">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              岗位信息
            </span>
            <Textarea
              value={jdInput}
              onChange={(event) => setJdInput(event.target.value)}
              placeholder="请直接粘贴完整JD文本。"
              className="min-h-40 max-h-[min(34dvh,360px)] resize-none overflow-y-auto rounded-[20px] border-slate-200 bg-white px-4 py-3 text-sm leading-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              基础简历
            </span>
            <div
              className={cn(
                "rounded-[24px] border border-dashed border-slate-300 bg-white p-5 transition-colors",
                resumeFile && "border-primary/40 bg-sky-50/50",
              )}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="grid gap-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <UploadCloudIcon className="size-4 text-primary" />
                    上传基础简历
                  </div>
                  <p className="text-sm leading-7 text-slate-600">
                    目前仅支持 PDF。它会作为 Agent 生成岗位分析、简历策略和后续正式产物的基础输入。
                  </p>
                </div>
                <Input
                  type="file"
                  accept="application/pdf"
                  className="max-w-64 rounded-full border-slate-200 bg-slate-50"
                  onChange={(event) =>
                    setResumeFile(event.target.files?.[0] ?? null)
                  }
                />
              </div>

              {resumeFile && (
                <div className="mt-4 flex items-center gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-slate-950 text-slate-50">
                    <FileIcon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {resumeFile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </label>

          {isSubmitting && (
            <div className="grid gap-2 rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <LoaderCircleIcon className="size-4 animate-spin text-primary" />
                {step === "uploading" ? "正在准备简历文件..." : "正在创建任务..."}
              </div>
              <Progress value={progressValue} className="h-1.5 bg-slate-200" />
            </div>
          )}

          {errorMessage && (
            <Alert className="border-rose-200 bg-rose-50 text-rose-950">
              <AlertTitle>创建未完成</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="rounded-b-[28px] border-slate-200/80 bg-slate-950/[0.03] px-6" showCloseButton>
          <Button
            onClick={handleCreateMission}
            disabled={isSubmitting}
            className="min-w-32 rounded-full bg-slate-950 text-slate-50 hover:bg-slate-800"
          >
            {isSubmitting ? "处理中..." : "创建任务"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
