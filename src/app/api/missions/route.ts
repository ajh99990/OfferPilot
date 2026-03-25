import { NextRequest, NextResponse } from "next/server";
import {
  createMissionPreview,
  createMissionTitle,
  inferJdSourceType,
} from "@/lib/missions";
import {
  createMissionThread,
  getMissionThreadsByIds,
} from "@/lib/server/agent";
import {
  applyCookiePatch,
  ensureGuestId,
  getStorageOwnerIdForGuest,
  getStorageOwnerIdForUser,
  resolveServerSession,
  setKnownThreadsCookie,
} from "@/lib/server/auth";
import {
  listAccessibleMissionThreadIds,
  recordMissionThreadAccess,
} from "@/lib/server/thread-access";

export const dynamic = "force-dynamic";

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: NextRequest) {
  try {
    const session = await resolveServerSession(request, { allowRefresh: true });
    const threadIds = await listAccessibleMissionThreadIds({
      userId: session.auth.user?.uid,
      knownThreadIds: session.knownThreadIds,
    });
    const missions = await getMissionThreadsByIds(threadIds);
    const response = NextResponse.json({
      ok: true,
      data: missions,
    });
    applyCookiePatch(response, session.cookiePatch);
    return response;
  } catch (error) {
    console.error("list missions error", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "MISSIONS_LIST_FAILED",
          message: "读取任务列表失败。",
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await resolveServerSession(request, { allowRefresh: true });
    const body = (await request.json()) as Record<string, unknown>;
    const jdInput = getStringValue(body.jdInput);
    const resumeObjectKey = getStringValue(body.resumeObjectKey);
    const resumeObjectUrl = getStringValue(body.resumeObjectUrl);
    const resumeFileName = getStringValue(body.resumeFileName);

    if (!jdInput) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "JD_REQUIRED",
            message: "请填写 JD 链接或岗位描述。",
          },
        },
        { status: 400 },
      );
    }

    if (!resumeObjectKey || !resumeFileName) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "RESUME_REQUIRED",
            message: "简历上传信息不完整，请重新上传 PDF。",
          },
        },
        { status: 400 },
      );
    }

    const jdSourceType = inferJdSourceType(jdInput);
    let ownerUserId: number | null = null;
    let createdByGuestId: string | null = null;
    let resumeStorageOwnerId: string;

    if (session.auth.authenticated && session.auth.user) {
      ownerUserId = session.auth.user.uid;
      resumeStorageOwnerId = getStorageOwnerIdForUser(session.auth.user.uid);
    } else {
      const guestId = session.guestId ?? ensureGuestId(request, session.cookiePatch);
      createdByGuestId = guestId;
      resumeStorageOwnerId = getStorageOwnerIdForGuest(guestId);
    }

    const mission = await createMissionThread({
      title: createMissionTitle(jdInput, jdSourceType),
      jdInput,
      jdPreview: createMissionPreview(jdInput, jdSourceType),
      jdSourceType,
      resumeFileName,
      resumeObjectKey,
      resumeObjectUrl: resumeObjectUrl || undefined,
      resumeStorageOwnerId,
      bootstrapStatus: "pending",
    });

    await recordMissionThreadAccess({
      threadId: mission.threadId,
      ownerUserId,
      createdByGuestId,
    });

    setKnownThreadsCookie(session.cookiePatch, [
      mission.threadId,
      ...session.knownThreadIds,
    ]);

    const response = NextResponse.json({
      ok: true,
      data: mission,
    });
    applyCookiePatch(response, session.cookiePatch);
    return response;
  } catch (error) {
    console.error("create mission error", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "MISSION_CREATE_FAILED",
          message: "创建任务失败，请稍后再试。",
        },
      },
      { status: 500 },
    );
  }
}
