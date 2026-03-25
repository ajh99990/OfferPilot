"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { PhoneLoginDialog } from "@/components/phone-login-dialog";
import { ProfileSetupDialog } from "@/components/profile-setup-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LoaderCircleIcon, LogOutIcon } from "lucide-react";

function getInitials(name?: string) {
  if (!name) {
    return "访";
  }

  return name.trim().slice(0, 1);
}

export function AuthFloatingBar() {
  const auth = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const profileOpen = Boolean(
    auth.session.authenticated && auth.session.user?.needsProfileSetup,
  );

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-end px-4 py-4 lg:px-6">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/80 bg-white/86 px-3 py-2 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          {auth.isLoading ? (
            <div className="flex items-center gap-2 px-1 text-sm text-slate-500">
              <LoaderCircleIcon className="size-4 animate-spin text-primary" />
              正在读取登录状态...
            </div>
          ) : auth.session.authenticated && auth.session.user ? (
            <>
              <Avatar size="sm" className="ring-1 ring-slate-200/80">
                <AvatarImage src={auth.session.user.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-slate-100 text-slate-700">
                  {getInitials(auth.session.user.nickname)}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-0.5 pr-1">
                <span className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  当前用户
                </span>
                <span className="max-w-40 truncate text-sm font-semibold text-slate-900">
                  {auth.session.user.nickname}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full border-slate-200 bg-white text-slate-700"
                onClick={() => void auth.logout()}
              >
                <LogOutIcon className="size-4" />
                退出
              </Button>
            </>
          ) : (
            <Button
              type="button"
              className="rounded-full bg-slate-950 text-slate-50 hover:bg-slate-800"
              onClick={() => setLoginOpen(true)}
            >
              手机号登录
            </Button>
          )}
        </div>
      </div>

      <PhoneLoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      <ProfileSetupDialog open={profileOpen} onOpenChange={() => undefined} />
    </>
  );
}
