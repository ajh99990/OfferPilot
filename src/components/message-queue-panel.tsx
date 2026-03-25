"use client";

import {
  Queue,
  QueueItem,
  QueueItemAction,
  QueueItemActions,
  QueueItemContent,
  QueueItemDescription,
  QueueItemIndicator,
  QueueList,
} from "@/components/ai-elements/queue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";

export type MessageQueueEntry = {
  createdAt?: Date | string;
  id: string;
  values?: unknown;
};

type MessageQueuePanelProps = {
  className?: string;
  entries: MessageQueueEntry[];
  onCancel: (id: string) => void | Promise<void>;
  onClear: () => void | Promise<void>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractTextFromPart(part: unknown): string | null {
  if (!isRecord(part)) {
    return null;
  }

  if (typeof part.text === "string" && part.text.trim()) {
    return part.text.trim();
  }

  return null;
}

function extractTextFromMessage(message: unknown): string | null {
  if (typeof message === "string") {
    return message.trim() || null;
  }

  if (!isRecord(message)) {
    return null;
  }

  if (typeof message.content === "string" && message.content.trim()) {
    return message.content.trim();
  }

  if (Array.isArray(message.content)) {
    const joined = message.content
      .map(extractTextFromPart)
      .filter((value): value is string => Boolean(value))
      .join(" ");

    if (joined.trim()) {
      return joined.trim();
    }
  }

  return null;
}

function extractQueuePreview(entry: MessageQueueEntry): string {
  if (!isRecord(entry.values) || !Array.isArray(entry.values.messages)) {
    return "一条新的后续消息正在排队。";
  }

  const preview = entry.values.messages
    .map(extractTextFromMessage)
    .filter((value): value is string => Boolean(value))
    .join(" ");

  if (!preview) {
    return "一条新的后续消息正在排队。";
  }

  return preview.length > 120 ? `${preview.slice(0, 120)}…` : preview;
}

function formatQueuedAt(value?: Date | string): string {
  if (!value) {
    return "刚刚加入队列";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "刚刚加入队列";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function MessageQueuePanel({
  className,
  entries,
  onCancel,
  onClear,
}: MessageQueuePanelProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <Queue
      className={cn(
        "mx-auto w-full max-w-4xl rounded-[24px] border border-slate-200/80 bg-white/94 px-4 py-4 shadow-[0_14px_36px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-full border-sky-200 bg-sky-50 text-sky-700"
            >
              Queue
            </Badge>
            <p className="text-sm font-medium text-slate-800">
              已排队 {entries.length} 条后续消息
            </p>
          </div>
          <p className="mt-1 text-xs leading-6 text-slate-500">
            当前回复结束后，这些消息会按顺序自动继续发送。
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          onClick={() => {
            void onClear();
          }}
        >
          清空队列
        </Button>
      </div>

      <QueueList className="mt-3">
        {entries.map((entry, index) => (
          <QueueItem
            key={entry.id}
            className="rounded-[18px] border border-slate-200/80 bg-slate-50/72 px-4 py-3 hover:bg-white"
          >
            <div className="flex items-start gap-3">
              <QueueItemIndicator className="mt-1 border-sky-300 bg-sky-100" />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <QueueItemContent
                      className="line-clamp-2 text-sm font-medium leading-6 text-slate-800"
                    >
                      {extractQueuePreview(entry)}
                    </QueueItemContent>
                    <QueueItemDescription className="ml-0 mt-2 text-xs text-slate-500">
                      队列顺序 #{index + 1} · {formatQueuedAt(entry.createdAt)}
                    </QueueItemDescription>
                  </div>

                  <QueueItemActions className="self-start">
                    <QueueItemAction
                      aria-label="移除排队消息"
                      className="opacity-100"
                      onClick={() => {
                        void onCancel(entry.id);
                      }}
                    >
                      <XIcon className="size-3.5" />
                    </QueueItemAction>
                  </QueueItemActions>
                </div>
              </div>
            </div>
          </QueueItem>
        ))}
      </QueueList>
    </Queue>
  );
}
