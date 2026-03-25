import { NextRequest, NextResponse } from "next/server";
import { getMissionThread, patchMissionThread } from "@/lib/server/agent";
import type { MissionMetadata } from "@/lib/missions";
import {
  applyCookiePatch,
  resolveServerSession,
} from "@/lib/server/auth";
import { canViewerAccessMissionThread } from "@/lib/server/thread-access";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ threadId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { threadId } = await context.params;
    const session = await resolveServerSession(_request, { allowRefresh: true });
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
            message: "你当前无权访问这个任务。",
          },
        },
        { status: 403 },
      );
    }

    const mission = await getMissionThread(threadId);
    const response = NextResponse.json({
      ok: true,
      data: mission,
    });
    applyCookiePatch(response, session.cookiePatch);
    return response;
  } catch (error) {
    console.error("get mission error", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "MISSION_GET_FAILED",
          message: "读取任务失败。",
        },
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { threadId } = await context.params;
    const session = await resolveServerSession(request, { allowRefresh: true });
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
            message: "你当前无权修改这个任务。",
          },
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      metadata?: Partial<MissionMetadata>;
    };
    const mission = await patchMissionThread(threadId, body.metadata ?? {});

    const response = NextResponse.json({
      ok: true,
      data: mission,
    });
    applyCookiePatch(response, session.cookiePatch);
    return response;
  } catch (error) {
    console.error("patch mission error", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "MISSION_PATCH_FAILED",
          message: "更新任务元数据失败。",
        },
      },
      { status: 500 },
    );
  }
}
