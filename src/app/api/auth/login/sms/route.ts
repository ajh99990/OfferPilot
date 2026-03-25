import { NextRequest, NextResponse } from "next/server";
import {
  applyCookiePatch,
  buildAuthSessionPayload,
  getKnownThreadIdsFromRequest,
  introspectAccessToken,
  loginWithSmsCode,
  setAuthCookies,
  setKnownThreadsCookie,
  type SessionCookiePatch,
} from "@/lib/server/auth";
import { claimMissionThreadsForUser } from "@/lib/server/thread-access";
import { ensureUserProfile } from "@/lib/server/user-profiles";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      phone?: string;
      code?: string;
    };
    const phone = body.phone?.trim() ?? "";
    const code = body.code?.trim() ?? "";

    if (!phone || !code) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PHONE_CODE_REQUIRED",
            message: "请输入手机号和验证码。",
          },
        },
        { status: 400 },
      );
    }

    const tokens = await loginWithSmsCode({ phone, code });
    const identity = await introspectAccessToken(tokens.accessToken);
    if (!identity) {
      throw new Error("登录成功，但未能获取当前会话信息。");
    }

    const profile = await ensureUserProfile(identity.uid);
    const knownThreadIds = getKnownThreadIdsFromRequest(request);
    await claimMissionThreadsForUser(identity.uid, knownThreadIds);

    const patch: SessionCookiePatch = { set: [], delete: [] };
    setAuthCookies(patch, tokens);
    setKnownThreadsCookie(patch, knownThreadIds);

    const response = NextResponse.json({
      ok: true,
      data: buildAuthSessionPayload(profile, identity.sid),
    });
    applyCookiePatch(response, patch);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "LOGIN_FAILED",
          message:
            error instanceof Error ? error.message : "登录失败，请稍后再试。",
        },
      },
      { status: 400 },
    );
  }
}
