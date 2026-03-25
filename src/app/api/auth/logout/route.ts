import { NextRequest, NextResponse } from "next/server";
import {
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth";
import {
  applyCookiePatch,
  clearAuthCookies,
  logoutByRefreshToken,
  type SessionCookiePatch,
} from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value?.trim();
  const patch: SessionCookiePatch = { set: [], delete: [] };

  try {
    if (refreshToken) {
      await logoutByRefreshToken(refreshToken);
    }
  } catch (error) {
    console.warn("logout error", error);
  }

  clearAuthCookies(patch);

  const response = NextResponse.json({
    ok: true,
    data: {
      authenticated: false,
    },
  });
  applyCookiePatch(response, patch);
  return response;
}
