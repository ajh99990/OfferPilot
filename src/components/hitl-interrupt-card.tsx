"use client";

import { useState } from "react";
import {
  type ApprovalCardDecisionId,
  type ApprovalCardInterrupt,
  type BinaryConfirmationResumePayload,
  type QuestionnaireCardInterrupt,
  type QuestionnaireCardResumePayload,
  isApprovalCardInterrupt,
  isQuestionnaireCardInterrupt,
} from "@/lib/missions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircleIcon,
  CheckIcon,
  CircleHelpIcon,
  LoaderCircleIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";

type HitlInterruptCardProps = {
  interrupt: unknown;
  canResume: boolean;
  isSubmitting: boolean;
  onResume: (value: unknown) => Promise<void>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringifyInterrupt(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '"[中断数据无法序列化]"';
  }
}

function getLegacyQuestion(value: unknown) {
  if (!isRecord(value)) {
    return "Agent 当前正在等待你的确认。";
  }

  if (typeof value.question === "string" && value.question.trim()) {
    return value.question;
  }

  if (typeof value.summary === "string" && value.summary.trim()) {
    return value.summary;
  }

  if (typeof value.content === "string" && value.content.trim()) {
    return value.content;
  }

  if (typeof value.reason === "string" && value.reason.trim()) {
    return value.reason;
  }

  return "Agent 当前正在等待你的确认。";
}

function ApprovalCard({
  interrupt,
  isSubmitting,
  onResume,
}: {
  interrupt: ApprovalCardInterrupt;
  isSubmitting: boolean;
  onResume: (value: BinaryConfirmationResumePayload) => Promise<void>;
}) {
  const [pendingDecisionId, setPendingDecisionId] =
    useState<ApprovalCardDecisionId | null>(null);

  const approveOption =
    interrupt.options.find((option) => option.id === "approve") ??
    interrupt.options[0];
  const rejectOption =
    interrupt.options.find((option) => option.id === "reject") ??
    interrupt.options[1];

  const submitDecision = async (
    approved: boolean,
    decisionId: ApprovalCardDecisionId,
  ) => {
    setPendingDecisionId(decisionId);
    await onResume({
      approved,
      decisionId,
      source: "approval_card",
    });
  };

  return (
    <Card className="overflow-hidden rounded-[22px] border border-sky-200/80 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,rgba(248,252,255,0.98),rgba(255,255,255,0.98))] shadow-[0_16px_36px_rgba(37,99,235,0.08)]">
      <CardHeader className="gap-2 border-b border-sky-100/90 px-4 pb-3 pt-4">
        <div className="flex items-start gap-3">
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge className="rounded-full bg-sky-500/10 text-sky-900 hover:bg-sky-500/10">
                人工确认
              </Badge>
              <Badge
                variant="outline"
                className="rounded-full border-sky-200 bg-white/85 text-sky-800"
              >
                审批卡片
              </Badge>
            </div>
            <CardTitle className="font-heading text-[1.14rem] leading-tight tracking-[-0.04em] text-slate-950">
              {interrupt.title}
            </CardTitle>
            <CardDescription className="text-[13px] leading-5.5 text-slate-700">
              {interrupt.summary}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-2.5 px-4 pb-4 pt-3">
        {interrupt.sections.map((section) => (
          <div
            key={section.title}
            className="rounded-[16px] border border-slate-200/80 bg-white/86 px-3 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-center gap-1.5">
              <SparklesIcon className="size-3.5 text-primary" />
              <p className="text-[13px] font-semibold text-slate-900">
                {section.title}
              </p>
            </div>
            <ul className="mt-2 grid gap-1.5 text-[13px] leading-5.5 text-slate-700">
              {section.items.map((item) => (
                <li
                  key={item}
                  className="rounded-[13px] border border-slate-100/90 bg-slate-50/80 px-2.5 py-1.5"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {interrupt.question ? (
          <div className="rounded-[16px] border border-slate-200/80 bg-white/86 px-3 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-1.5">
              <CircleHelpIcon className="size-3.5 text-sky-700" />
              <p className="text-[13px] font-semibold text-slate-900">
                需要你决定的问题
              </p>
            </div>
            <p className="mt-1.5 text-[13.5px] leading-5.5 text-slate-700">
              {interrupt.question}
            </p>
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            className="h-10 rounded-full bg-sky-600 px-3 text-[13px] font-medium text-white hover:bg-sky-700"
            disabled={isSubmitting}
            onClick={() => void submitDecision(true, approveOption.id)}
          >
            {isSubmitting && pendingDecisionId === approveOption.id ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <CheckIcon className="size-4" />
            )}
            {approveOption.label}
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-full border-sky-200 bg-white px-3 text-[13px] font-medium text-slate-800 hover:bg-sky-50"
            disabled={isSubmitting}
            onClick={() => void submitDecision(false, rejectOption.id)}
          >
            {isSubmitting && pendingDecisionId === rejectOption.id ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <XIcon className="size-4" />
            )}
            {rejectOption.label}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QuestionnaireCard({
  interrupt,
  isSubmitting,
  onResume,
}: {
  interrupt: QuestionnaireCardInterrupt;
  isSubmitting: boolean;
  onResume: (value: QuestionnaireCardResumePayload) => Promise<void>;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(interrupt.fields.map((field) => [field.id, "" as string])),
  );
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    const missingFields = interrupt.fields.filter(
      (field) => field.required && !answers[field.id]?.trim(),
    );

    if (missingFields.length > 0) {
      setValidationMessage(
        `请先填写：${missingFields.map((field) => field.label).join("、")}`,
      );
      return;
    }

    setValidationMessage(null);
    await onResume({
      answers: Object.fromEntries(
        Object.entries(answers).map(([key, value]) => [key, value.trim()]),
      ),
      source: "questionnaire_card",
    });
  };

  return (
    <Card className="overflow-hidden rounded-[22px] border border-violet-200/80 bg-[radial-gradient(circle_at_top_right,rgba(192,132,252,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.08),transparent_24%),linear-gradient(180deg,rgba(250,245,255,0.98),rgba(255,255,255,0.98))] shadow-[0_16px_36px_rgba(109,40,217,0.08)]">
      <CardHeader className="gap-2 border-b border-violet-100/90 px-4 pb-3 pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className="rounded-full bg-violet-500/10 text-violet-900 hover:bg-violet-500/10">
            人工确认
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full border-violet-200 bg-white/85 text-violet-800"
          >
            问卷卡片
          </Badge>
        </div>
        <CardTitle className="font-heading text-[1.14rem] leading-tight tracking-[-0.04em] text-slate-950">
          {interrupt.title}
        </CardTitle>
        {interrupt.summary ? (
          <CardDescription className="text-[13px] leading-5.5 text-slate-700">
            {interrupt.summary}
          </CardDescription>
        ) : null}
      </CardHeader>

      <CardContent className="grid gap-3 px-4 pb-4 pt-3">
        {interrupt.fields.map((field) => (
          <label key={field.id} className="grid gap-1.5">
            <span className="text-[13px] font-semibold text-slate-900">
              {field.label}
              {field.required ? (
                <span className="ml-1 text-rose-600">*</span>
              ) : null}
            </span>
            {field.helpText ? (
              <span className="text-[12px] leading-5 text-slate-500">
                {field.helpText}
              </span>
            ) : null}
            {field.multiline ? (
              <Textarea
                value={answers[field.id] ?? ""}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [field.id]: event.target.value,
                  }))
                }
                placeholder={field.placeholder}
                className="min-h-[108px] rounded-[18px] border-slate-200 bg-white/90 px-3 py-2.5 text-[13px] leading-5.5 text-slate-800"
              />
            ) : (
              <Input
                value={answers[field.id] ?? ""}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [field.id]: event.target.value,
                  }))
                }
                placeholder={field.placeholder}
                className="h-11 rounded-full border-slate-200 bg-white/90 px-4 text-[13px] text-slate-800"
              />
            )}
          </label>
        ))}

        {validationMessage ? (
          <div className="rounded-[16px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900">
            {validationMessage}
          </div>
        ) : null}

        <Button
          className="h-10 rounded-full bg-violet-600 px-3 text-[13px] font-medium text-white hover:bg-violet-700"
          disabled={isSubmitting}
          onClick={() => void handleSubmit()}
        >
          {isSubmitting ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            <CheckIcon className="size-4" />
          )}
          {interrupt.submitLabel || "提交回答"}
        </Button>
      </CardContent>
    </Card>
  );
}

function FallbackInterruptCard({
  interrupt,
  isSubmitting,
  onResume,
}: {
  interrupt: unknown;
  isSubmitting: boolean;
  onResume: (value: unknown) => Promise<void>;
}) {
  const [resumeDraft, setResumeDraft] = useState(() => stringifyInterrupt(interrupt));
  const [parseError, setParseError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      const parsed = JSON.parse(resumeDraft);
      setParseError(null);
      await onResume(parsed);
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : "恢复数据不是有效 JSON。",
      );
    }
  };

  return (
    <Card className="rounded-[28px] border border-slate-200/90 bg-white/92 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-full border-slate-200 bg-slate-50 text-slate-700"
          >
            未识别中断
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full border-slate-200 bg-white text-slate-500"
          >
            JSON 回退模式
          </Badge>
        </div>
        <CardTitle className="font-heading text-[1.35rem] tracking-[-0.04em] text-slate-950">
          当前中断还没有对应的专用卡片
        </CardTitle>
        <CardDescription className="leading-7 text-slate-600">
          为了不阻塞流程，这里保留了一个 JSON 恢复入口。你可以直接调整恢复数据，然后继续运行。
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Textarea
          className="min-h-[220px] resize-y rounded-[22px] border-slate-200 bg-slate-50/80 px-4 py-3 font-mono text-[13px] leading-6 text-slate-800"
          value={resumeDraft}
          onChange={(event) => setResumeDraft(event.target.value)}
        />

        {parseError ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {parseError}
          </div>
        ) : null}

        <Button
          className="h-11 rounded-full bg-slate-950 text-slate-50 hover:bg-slate-800"
          disabled={isSubmitting}
          onClick={() => void handleSubmit()}
        >
          {isSubmitting ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            <AlertCircleIcon className="size-4" />
          )}
          提交恢复数据
        </Button>
      </CardContent>
    </Card>
  );
}

function LegacyInterruptNotice({ interrupt }: { interrupt: unknown }) {
  return (
    <Card className="rounded-[28px] border border-amber-200/80 bg-amber-50/80 shadow-[0_16px_40px_rgba(217,119,6,0.08)]">
      <CardHeader className="gap-3">
        <div className="flex items-center gap-2">
          <Badge className="rounded-full bg-amber-500/10 text-amber-900 hover:bg-amber-500/10">
            人工确认
          </Badge>
        </div>
        <CardTitle className="font-heading text-[1.3rem] tracking-[-0.04em] text-slate-950">
          Agent 正在等待你的决定
        </CardTitle>
        <CardDescription className="leading-7 text-slate-700">
          {getLegacyQuestion(interrupt)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-7 text-slate-600">
          当前线程里还没有拿到可恢复的 interrupt payload，所以这里只能先展示提醒。刷新后如果后端协议已生效，这里会自动切换成可操作的 HITL 卡片。
        </p>
      </CardContent>
    </Card>
  );
}

export function HitlInterruptCard({
  interrupt,
  canResume,
  isSubmitting,
  onResume,
}: HitlInterruptCardProps) {
  const interruptKey = stringifyInterrupt(interrupt);

  if (isApprovalCardInterrupt(interrupt)) {
    return (
      <ApprovalCard
        key={interruptKey}
        interrupt={interrupt}
        isSubmitting={isSubmitting}
        onResume={onResume}
      />
    );
  }

  if (isQuestionnaireCardInterrupt(interrupt)) {
    return (
      <QuestionnaireCard
        key={interruptKey}
        interrupt={interrupt}
        isSubmitting={isSubmitting}
        onResume={onResume}
      />
    );
  }

  if (!canResume) {
    return <LegacyInterruptNotice interrupt={interrupt} />;
  }

  return (
    <FallbackInterruptCard
      key={interruptKey}
      interrupt={interrupt}
      isSubmitting={isSubmitting}
      onResume={onResume}
    />
  );
}
