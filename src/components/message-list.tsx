"use client";

import type { BaseMessage } from "@langchain/core/messages";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "./ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "./ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "./ai-elements/reasoning";
import { Shimmer } from "./ai-elements/shimmer";
import { ToolCall } from "./tool-call";

interface RenderedItem {
  id: string;
  kind: "human" | "ai" | "tool-call";
  content?: string;
  reasoning?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: unknown;
  toolError?: string;
  isStreaming?: boolean;
}

function buildRenderItems(
  messages: BaseMessage[],
  isLoading: boolean,
): RenderedItem[] {
  const items: RenderedItem[] = [];
  const toolResultMap = new Map<string, { output?: unknown; error?: string }>();

  for (const msg of messages) {
    const msgType = msg.type;
    if (msgType === "tool") {
      const toolMsg = msg as BaseMessage & { tool_call_id?: string };
      if (toolMsg.tool_call_id) {
        const raw = msg.text;
        try {
          toolResultMap.set(toolMsg.tool_call_id, { output: JSON.parse(raw) });
        } catch {
          toolResultMap.set(toolMsg.tool_call_id, { output: raw });
        }
      }
    }
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const msgType = msg.type;
    const isLastMsg = i === messages.length - 1;

    if (msgType === "human") {
      items.push({ id: `human-${i}`, kind: "human", content: msg.text });
      continue;
    }

    if (msgType === "ai") {
      const aiMsg = msg as BaseMessage & {
        tool_calls?: Array<{
          id: string;
          name: string;
          args: Record<string, unknown>;
        }>;
      };

      const reasoning = msg.contentBlocks.find(
        (block) => block.type === "reasoning",
      )?.reasoning;
      const textContent = msg.text;

      // Reasoning is still streaming when the last message is loading and text hasn't arrived yet.
      const reasoningStreaming = isLastMsg && isLoading && !textContent;

      if (reasoning) {
        items.push({
          id: `reasoning-${i}`,
          kind: "ai",
          reasoning,
          content: textContent || undefined,
          isStreaming: reasoningStreaming,
        });
      } else if (textContent) {
        items.push({ id: `ai-${i}`, kind: "ai", content: textContent });
      }

      if (aiMsg.tool_calls && aiMsg.tool_calls.length > 0) {
        for (const tc of aiMsg.tool_calls) {
          const result = toolResultMap.get(tc.id ?? "");
          items.push({
            id: `tc-${tc.id ?? i}`,
            kind: "tool-call",
            toolName: tc.name,
            toolInput: tc.args,
            toolOutput: result?.output,
            toolError: result?.error,
            isStreaming: isLastMsg && isLoading && !result,
          });
        }
      }

      continue;
    }
  }

  return items;
}

function renderThinkingMessage(isStreaming: boolean, duration?: number) {
  if (isStreaming || duration === 0) {
    return <span>思考中...</span>;
  }

  if (duration === undefined) {
    return <span>已完成思考</span>;
  }

  return <span>思考了 {duration} 秒</span>;
}

interface MessageListProps {
  messages: BaseMessage[];
  isLoading: boolean;
  onCopyLastMessage: () => void;
  interruptCard?: ReactNode;
}

export function MessageList({
  messages,
  isLoading,
  onCopyLastMessage,
  interruptCard,
}: MessageListProps) {
  const [copied, setCopied] = useState(false);
  const items = buildRenderItems(messages, isLoading);
  const lastAiIndex = [...items].reverse().findIndex((it) => it.kind === "ai");
  const lastAiItemIndex =
    lastAiIndex >= 0 ? items.length - 1 - lastAiIndex : -1;
  const showShimmer =
    isLoading && items.length > 0 && items[items.length - 1].kind === "human";

  function handleCopy() {
    onCopyLastMessage();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Conversation className="min-h-0 flex-1">
      <ConversationContent>
        {items.map((item, idx) => {
          if (item.kind === "human") {
            return (
              <Message key={item.id} from="user">
                <MessageContent>{item.content}</MessageContent>
              </Message>
            );
          }

          if (item.kind === "tool-call") {
            return (
              <ToolCall
                key={item.id}
                toolName={item.toolName ?? "unknown"}
                input={item.toolInput ?? {}}
                output={item.toolOutput}
                error={item.toolError}
                isStreaming={item.isStreaming}
              />
            );
          }

          const isLastAi = idx === lastAiItemIndex;

          return (
            <div key={item.id} className="flex flex-col gap-1">
              {item.reasoning && (
                <Reasoning
                  isStreaming={item.isStreaming}
                  className="w-full rounded-[22px] border border-slate-200/80 bg-white/82 px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.04)]"
                >
                  <ReasoningTrigger
                    className="font-medium text-slate-600 hover:text-slate-900"
                    getThinkingMessage={renderThinkingMessage}
                  />
                  <ReasoningContent className="mt-3 text-slate-600">
                    {item.reasoning}
                  </ReasoningContent>
                </Reasoning>
              )}
              {item.content && (
                <Message from="assistant">
                  <MessageContent>
                    <MessageResponse>{item.content}</MessageResponse>
                  </MessageContent>
                </Message>
              )}
              {isLastAi && !isLoading && (
                <MessageActions>
                  <MessageAction
                    label={copied ? "Copied" : "Copy"}
                    tooltip={copied ? "Copied!" : "Copy message"}
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <CheckIcon className="size-3 text-green-500" />
                    ) : (
                      <CopyIcon className="size-3" />
                    )}
                  </MessageAction>
                </MessageActions>
              )}
            </div>
          );
        })}

        {showShimmer && (
          <div className="px-1">
            <Shimmer as="span" className="text-sm">
              Thinking...
            </Shimmer>
          </div>
        )}

        {interruptCard && (
          <div className="w-full max-w-[52rem]">
            {interruptCard}
          </div>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
