import { NextRequest, NextResponse } from "next/server";
import {
  createSignedObjectUrl,
  getOssErrorResponse,
  resolveBucket,
} from "@/lib/server/oss";
import {
  applyCookiePatch,
  resolveServerSession,
} from "@/lib/server/auth";
import { canViewerAccessMissionThread } from "@/lib/server/thread-access";
import { getMissionThread } from "@/lib/server/agent";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await resolveServerSession(request, { allowRefresh: true });
    const bucket = resolveBucket(request.nextUrl.searchParams.get("bucket") ?? undefined);
    const key = request.nextUrl.searchParams.get("key") ?? "";
    const threadId = request.nextUrl.searchParams.get("threadId")?.trim() ?? "";

    if (!threadId) {
      throw new Error("缺少 threadId，无法校验文件访问权限。");
    }

    const canAccess = await canViewerAccessMissionThread({
      threadId,
      userId: session.auth.user?.uid,
      knownThreadIds: session.knownThreadIds,
    });

    if (!canAccess) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "MISSION_FORBIDDEN",
            message: "你当前无权查看这份任务文件。",
          },
        },
        { status: 403 },
      );
    }

    const mission = await getMissionThread(threadId);
    const storageOwnerId = mission.metadata.resumeStorageOwnerId;
    if (!storageOwnerId) {
      throw new Error("任务缺少简历归属信息，无法生成访问链接。");
    }

    const data = await createSignedObjectUrl({
      bucket,
      key,
      storageOwnerId,
    });
    const response = NextResponse.json({
      ok: true,
      data,
    });
    applyCookiePatch(response, session.cookiePatch);
    return response;
  } catch (error) {
    const { status, body } = getOssErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
