import { NextRequest, NextResponse } from "next/server";
import { applyCookiePatch, resolveServerSession } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await resolveServerSession(request, { allowRefresh: true });
    const response = NextResponse.json({
      ok: true,
      data: session.auth,
    });
    applyCookiePatch(response, session.cookiePatch);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "AUTH_ME_FAILED",
          message:
            error instanceof Error ? error.message : "读取登录状态失败，请稍后重试。",
        },
      },
      { status: 500 },
    );
  }
}
