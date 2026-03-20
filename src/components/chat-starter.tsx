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

const initialMessages: ChatMessage[] = [
  {
    id: "assistant-welcome",
    role: "assistant",
    text: [
      "这是一个最小可用的 **Next.js + AI Elements + TypeScript + Tailwind CSS** starter。",
      "",
      "目前先不接后端，所以这里用的是前端本地 mock。你之后可以把提交逻辑替换成 Egg.js / LangChain / LangGraph 的接口。",
    ].join("\n"),
  },
];

const suggestions = [
  "帮我总结 React Server Components",
  "写一个 Tailwind 按钮组件",
  "解释一下 LangGraph 适合做什么",
];

function buildMockReply(input: string) {
  return [
    `你刚刚输入的是：**${input}**`,
    "",
    "这个 starter 现在只演示前端消息 UI：",
    "- 使用 AI Elements 的 Conversation / Message 组件",
    "- 使用 Tailwind CSS 4 做基础样式",
    "- 保持 Next.js App Router + TypeScript 结构",
    "",
    "等你接入后端时，可以把这里替换成真实的流式请求。",
  ].join("\n");
}

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

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: buildMockReply(value),
        },
      ]);
      setIsSending(false);
    }, 450);
  }

  const emptyState = useMemo(
    () => (
      <ConversationEmptyState
        title="还没有消息"
        description="输入一条消息，看看 AI Elements 的对话 UI 长什么样。"
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
              Next.js + AI Elements Starter
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              先把前端聊天壳子搭起来
            </h1>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            当前页面只负责前端展示，不依赖后端。后续你可以把发送逻辑替换成
            Egg.js + LangChain / LangGraph 的接口，保留这套 UI 组件继续用。
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
                placeholder="输入点什么，先验证 UI 跑通。后面再把这里接到你的 Egg.js / LangGraph 接口。"
                value={input}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  这是纯前端 mock；现在不调用任何模型。
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
