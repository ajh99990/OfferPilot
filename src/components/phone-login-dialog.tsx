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
import { LoaderCircleIcon, SmartphoneIcon } from "lucide-react";

type PhoneLoginDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  showSkipButton?: boolean;
  onSkip?: () => void;
  onSuccess?: () => void;
};

export function PhoneLoginDialog({
  open,
  onOpenChange,
  title = "手机号验证码登录",
  description = "登录后可以跨设备保存任务进度，并自动归档你已经创建过的任务。",
  showSkipButton = false,
  onSkip,
  onSuccess,
}: PhoneLoginDialogProps) {
  const auth = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldown((current) => current - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      setCode("");
    }
  }, [open]);

  async function handleSendCode() {
    if (!phone.trim()) {
      setErrorMessage("请先填写手机号。");
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      await auth.sendCode(phone.trim());
      setCooldown(60);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "验证码发送失败，请稍后重试。",
      );
    } finally {
      setIsSending(false);
    }
  }

  async function handleSubmit() {
    if (!phone.trim() || !code.trim()) {
      setErrorMessage("请输入手机号和验证码。");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await auth.loginWithSms(phone.trim(), code.trim());
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "登录失败，请稍后重试。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,520px)] rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,255,0.98))] p-0 shadow-[0_28px_100px_rgba(15,23,42,0.16)] sm:max-w-[520px]">
        <DialogHeader className="px-6 pt-6">
          <div className="mb-3 flex size-12 items-center justify-center rounded-[18px] bg-slate-950 text-slate-50">
            <SmartphoneIcon className="size-5" />
          </div>
          <DialogTitle className="font-heading text-[1.75rem] tracking-[-0.04em] text-slate-950">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-7 text-slate-600">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 px-6 pb-6 pt-2">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              手机号
            </span>
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="例如 13800138000"
              className="rounded-full border-slate-200 bg-white"
            />
          </label>

          <div className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              验证码
            </span>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="6 位验证码"
                className="rounded-full border-slate-200 bg-white"
              />
              <Button
                type="button"
                variant="outline"
                className="min-w-28 rounded-full border-slate-200 bg-white text-slate-700"
                disabled={isSending || cooldown > 0}
                onClick={handleSendCode}
              >
                {isSending
                  ? "发送中..."
                  : cooldown > 0
                    ? `${cooldown}s 后重发`
                    : "发送验证码"}
              </Button>
            </div>
          </div>

          {errorMessage && (
            <Alert className="border-rose-200 bg-rose-50 text-rose-950">
              <AlertTitle>登录未完成</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {showSkipButton && (
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-slate-200 bg-white text-slate-700"
                onClick={onSkip}
              >
                暂不登录
              </Button>
            )}
            <Button
              type="button"
              className="rounded-full bg-slate-950 text-slate-50 hover:bg-slate-800"
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  正在登录...
                </>
              ) : (
                "完成登录"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
