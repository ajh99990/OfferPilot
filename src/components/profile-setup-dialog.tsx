"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LoaderCircleIcon, SparklesIcon } from "lucide-react";

type ProfileSetupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProfileSetupDialog({
  open,
  onOpenChange,
}: ProfileSetupDialogProps) {
  const auth = useAuth();
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setNickname(auth.session.user?.nickname ?? "");
    setAvatarUrl(auth.session.user?.avatarUrl ?? "");
    setErrorMessage(null);
  }, [auth.session.user?.avatarUrl, auth.session.user?.nickname, open]);

  async function handleSubmit(skip = false) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await auth.completeProfileSetup({
        nickname: skip ? undefined : nickname.trim(),
        avatarUrl: skip ? undefined : avatarUrl.trim(),
        skip,
      });
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "保存资料失败，请稍后重试。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,560px)] rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.98))] p-0 shadow-[0_32px_110px_rgba(15,23,42,0.18)] sm:max-w-[560px]">
        <DialogHeader className="px-6 pt-6">
          <div className="mb-3 flex size-12 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
            <SparklesIcon className="size-5" />
          </div>
          <DialogTitle className="font-heading text-[1.8rem] tracking-[-0.04em] text-slate-950">
            完善你的展示资料
          </DialogTitle>
          <DialogDescription className="text-sm leading-7 text-slate-600">
            登录中心不会保存头像和昵称。你可以现在补全，也可以先跳过，系统会先给你一个随机昵称。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 px-6 pb-6 pt-2">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              昵称
            </span>
            <Input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="例如 光年候选人"
              className="rounded-full border-slate-200 bg-white"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              头像链接
            </span>
            <Input
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="可选，填写图片 URL"
              className="rounded-full border-slate-200 bg-white"
            />
          </label>

          {errorMessage && (
            <Alert className="border-rose-200 bg-rose-50 text-rose-950">
              <AlertTitle>保存未完成</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-slate-200 bg-white text-slate-700"
              disabled={isSubmitting}
              onClick={() => void handleSubmit(true)}
            >
              暂不提供
            </Button>
            <Button
              type="button"
              className="rounded-full bg-slate-950 text-slate-50 hover:bg-slate-800"
              disabled={isSubmitting}
              onClick={() => void handleSubmit(false)}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  正在保存...
                </>
              ) : (
                "保存资料"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
