import { NextRequest, NextResponse } from "next/server";
import { sendSmsCode } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { phone?: string };
    const phone = body.phone?.trim() ?? "";

    if (!phone) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PHONE_REQUIRED",
            message: "请输入手机号。",
          },
        },
        { status: 400 },
      );
    }

    await sendSmsCode(phone);

    return NextResponse.json({
      ok: true,
      data: "success",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SEND_CODE_FAILED",
          message:
            error instanceof Error ? error.message : "验证码发送失败，请稍后重试。",
        },
      },
      { status: 400 },
    );
  }
}
