import { NextRequest, NextResponse } from "next/server";
import {
  applyCookiePatch,
  buildAuthSessionPayload,
  resolveServerSession,
} from "@/lib/server/auth";
import { completeUserProfileSetup } from "@/lib/server/user-profiles";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await resolveServerSession(request, { allowRefresh: true });
    if (!session.auth.authenticated || !session.auth.user) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "AUTH_REQUIRED",
            message: "请先登录。",
          },
        },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      nickname?: string;
      avatarUrl?: string | null;
      skip?: boolean;
    };

    const profile = await completeUserProfileSetup({
      userId: session.auth.user.uid,
      nickname: body.nickname,
      avatarUrl: body.avatarUrl,
      skip: body.skip,
    });

    const response = NextResponse.json({
      ok: true,
      data: buildAuthSessionPayload(profile, session.auth.user.sid),
    });
    applyCookiePatch(response, session.cookiePatch);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROFILE_SETUP_FAILED",
          message:
            error instanceof Error ? error.message : "保存资料失败，请稍后重试。",
        },
      },
      { status: 400 },
    );
  }
}
