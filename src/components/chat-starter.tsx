"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import { SparklesIcon } from "lucide-react";
import { useMemo, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const AGENT_API_URL =
  process.env.NEXT_PUBLIC_AGENT_API_URL ?? "http://localhost:8787/api/chat";

const initialMessages: ChatMessage[] = [
  {
    id: "assistant-welcome",
    role: "assistant",
    text: [
      "前端已经接上独立的 LangChain Agent 服务。",
      "",
      `默认请求地址：\`${AGENT_API_URL}\``,
      "",
      "你现在发送的内容会真正请求后端模型，而不是本地 mock。",
    ].join("\n"),
  },
];

const suggestions = [
  "帮我总结 React Server Components",
  "写一个 Tailwind 按钮组件",
  "解释一下 LangGraph 适合做什么",
];

export function ChatStarter() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const canSubmit = input.trim().length > 0 && !isSending;

  async function handleSubmit(nextValue?: string) {
    const value = (nextValue ?? input).trim();
    if (!value || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: value,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch(AGENT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((message) => ({
            role: message.role,
            content: message.text,
          })),
        }),
      });

      const data = (await response.json()) as {
        text?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "请求后端服务失败");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.text?.trim() || "模型没有返回文本内容。",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text:
            error instanceof Error
              ? `请求失败：${error.message}`
              : "请求失败：未知错误",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  const emptyState = useMemo(
    () => (
      <ConversationEmptyState
        title="还没有消息"
        description="输入一条消息，看看前端是否已经成功接上 agent 服务。"
        icon={<SparklesIcon className="size-5" />}
      />
    ),
    []
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Next.js + AI Elements + LangChain Agent
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              前端聊天 UI 已连接独立 Agent 服务
            </h1>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            这个页面负责聊天展示和输入，后端模型能力来自独立运行的
            react-agent-js 服务。现在是非流式调用，后面可以再升级为流式输出。
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
        <div className="grid gap-4 rounded-3xl border bg-card shadow-sm">
          <Conversation className="h-[62vh] rounded-t-3xl">
            <ConversationContent className="px-5 py-6">
              {messages.length === 0
                ? emptyState
                : messages.map((message) => (
                    <Message key={message.id} from={message.role}>
                      <MessageContent>
                        <MessageResponse>{message.text}</MessageResponse>
                      </MessageContent>
                    </Message>
                  ))}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="border-t px-4 py-4 sm:px-5">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className="rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  onClick={() => {
                    setInput(suggestion);
                  }}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form
              className="flex flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
            >
              <textarea
                className="min-h-28 w-full resize-none rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) => setInput(event.target.value)}
                placeholder="输入消息，发送到你的 LangChain Agent 服务。"
                value={input}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  后端地址：{AGENT_API_URL}
                </p>
                <Button disabled={!canSubmit} type="submit">
                  {isSending ? "生成中..." : "发送消息"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
