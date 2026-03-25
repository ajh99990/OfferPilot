"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { CreateMissionDialog } from "@/components/create-mission-dialog";
import { PhoneLoginDialog } from "@/components/phone-login-dialog";
import { ProfileSetupDialog } from "@/components/profile-setup-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  hasDismissedLoginPrompt,
  markLoginPromptDismissed,
} from "@/lib/known-threads";
import type { MissionThread } from "@/lib/missions";
import { cn } from "@/lib/utils";
import {
  ChevronDownIcon,
  LoaderCircleIcon,
  LogOutIcon,
  PlusIcon,
} from "lucide-react";

function getInitials(name?: string) {
  if (!name) {
    return "访";
  }

  return name.trim().slice(0, 1);
}

export function AppHeader() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [isRouting, startRouting] = useTransition();
  const profileOpen = Boolean(
    auth.session.authenticated && auth.session.user?.needsProfileSetup,
  );

  const isMissionPage = pathname.startsWith("/missions/");

  function handleCreatedMission(mission: MissionThread) {
    startRouting(() => {
      router.push(`/missions/${mission.threadId}`);
    });
  }

  function handleOpenCreateDialog() {
    if (auth.session.authenticated || hasDismissedLoginPrompt()) {
      setCreateOpen(true);
      return;
    }

    setLoginPromptOpen(true);
  }

  return (
    <>
      <header className="z-40 shrink-0 border-b border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,255,0.88))] backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1720px] items-center justify-between gap-4 px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-3"
            >
              <div className="flex size-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] text-sm font-semibold text-white">
                OP
              </div>
              <span className="hidden min-w-0 font-heading text-lg tracking-[-0.04em] text-slate-950 sm:inline">
                OfferPilot
              </span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isMissionPage ? (
              <Button
                asChild
                variant="outline"
                className="hidden rounded-full border-slate-200 bg-white text-slate-700 sm:inline-flex"
              >
                <Link href="/">返回首页</Link>
              </Button>
            ) : null}

            <Button
              type="button"
              className="rounded-full bg-slate-950 text-slate-50 hover:bg-slate-800"
              onClick={handleOpenCreateDialog}
              disabled={isRouting}
            >
              <PlusIcon className="size-4" />
              {isRouting ? "正在进入..." : "创建任务"}
            </Button>

            {auth.isLoading ? (
              <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/74 px-3 py-2 text-sm text-slate-500">
                <LoaderCircleIcon className="size-4 animate-spin text-primary" />
                读取中
              </div>
            ) : auth.session.authenticated && auth.session.user ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-auto rounded-full border-slate-200 bg-white/82 px-2.5 py-2 text-slate-700 shadow-[0_10px_26px_rgba(15,23,42,0.05)]"
                  >
                    <Avatar size="sm" className="ring-1 ring-slate-200/80">
                      <AvatarImage src={auth.session.user.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-slate-100 text-slate-700">
                        {getInitials(auth.session.user.nickname)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-28 truncate text-sm font-medium sm:inline">
                      {auth.session.user.nickname}
                    </span>
                    <ChevronDownIcon className="size-4 text-slate-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-72 rounded-[22px] border border-slate-200/80 bg-white/96 p-3 shadow-[0_24px_64px_rgba(15,23,42,0.12)]"
                >
                  <PopoverHeader className="gap-1 border-b border-slate-200/80 pb-3">
                    <PopoverTitle className="text-base text-slate-950">
                      {auth.session.user.nickname}
                    </PopoverTitle>
                    <p className="text-sm text-slate-500">
                      {auth.session.user.needsProfileSetup
                        ? "资料待完善"
                        : "已登录"}
                    </p>
                  </PopoverHeader>
                  <div className="mt-3 grid gap-2">
                    {auth.session.user.needsProfileSetup ? (
                      <div className="rounded-[18px] border border-amber-200 bg-amber-50/90 px-3 py-2 text-sm text-amber-900">
                        头像和昵称还可以继续完善。
                      </div>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      className="justify-start rounded-full border-slate-200 bg-white text-slate-700"
                      onClick={() => void auth.logout()}
                    >
                      <LogOutIcon className="size-4" />
                      退出登录
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "rounded-full border-slate-200 bg-white text-slate-700",
                  isMissionPage && "hidden sm:inline-flex",
                )}
                onClick={() => setLoginPromptOpen(true)}
              >
                手机号登录
              </Button>
            )}
          </div>
        </div>
      </header>

      <CreateMissionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
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
          setCreateOpen(true);
        }}
        onSuccess={() => {
          setLoginPromptOpen(false);
          setCreateOpen(true);
        }}
      />
      <ProfileSetupDialog open={profileOpen} onOpenChange={() => undefined} />
    </>
  );
}
