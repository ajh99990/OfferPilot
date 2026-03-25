import { NextRequest, NextResponse } from "next/server";
import {
  createStsPayload,
  getOssErrorResponse,
  resolveBucket,
} from "@/lib/server/oss";
import {
  applyCookiePatch,
  ensureGuestId,
  getStorageOwnerIdForGuest,
  getStorageOwnerIdForUser,
  resolveServerSession,
} from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await resolveServerSession(request, { allowRefresh: true });
    const bucket = resolveBucket(request.nextUrl.searchParams.get("bucket") ?? undefined);
    let storageOwnerId: string;

    if (session.auth.authenticated && session.auth.user) {
      storageOwnerId = getStorageOwnerIdForUser(session.auth.user.uid);
    } else {
      const guestId = session.guestId ?? ensureGuestId(request, session.cookiePatch);
      storageOwnerId = getStorageOwnerIdForGuest(guestId);
    }

    const data = await createStsPayload({
      bucket,
      storageOwnerId,
    });
    const nextResponse = NextResponse.json({
      ok: true,
      data,
    });
    applyCookiePatch(nextResponse, session.cookiePatch);
    return nextResponse;
  } catch (error) {
    const { status, body } = getOssErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
