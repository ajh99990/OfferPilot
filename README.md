# Next.js AI Elements Starter

一个最小可用的前端 starter，目标是先把下面这套组合跑起来：

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- AI Elements
- AI SDK（当前只装依赖，后续你再接 Egg.js / LangChain / LangGraph）

## 项目位置

```bash
/Users/yangguang/Desktop/简历/nextjs-ai-elements-starter
```

## 已完成的事情

- 使用 `create-next-app` 创建了 App Router + TypeScript + Tailwind 项目
- 按 AI Elements 文档要求安装了 `ai` 和 AI Elements 组件
- 自动生成了 `components.json`
- 注入了 `src/components/ai-elements/*` 与相关 `ui/*` 组件
- 创建了一个本地 mock 的聊天首页，方便你先确认 UI 是否可用

## 现在怎么启动

```bash
cd /Users/yangguang/Desktop/简历/nextjs-ai-elements-starter
pnpm dev
```

打开：<http://localhost:3000>

## 当前实现说明

当前页面不连接任何后端，只是演示：

- `Conversation`
- `Message`
- `MessageResponse`
- 基础输入区

也就是说，这个 starter 现在是“前端壳子先跑通”的状态。

## 后续你接 Egg.js / LangChain / LangGraph 时

你主要会替换这里：

- `src/components/chat-starter.tsx`
  - 把本地 mock 的 `handleSubmit()`
  - 改成调用你的 Egg.js 接口
  - 再把返回结果接到真实消息流里

## 关于依赖

AI Elements CLI 默认会拉进一批组件和依赖，数量会比“纯最小聊天页”更多，这是正常的。

原因是：

- AI Elements 本身是一个组件集合，不只是单个聊天框
- CLI 会把常用基础 UI 与 AI 组件一并准备好
- 这样你后面继续加 reasoning、tool、artifact、sources 等组件时，不用再反复补环境

如果你后面确定只保留极少数组件，我可以再帮你做一轮“依赖瘦身”。

## 建议的下一步

1. 先确认页面能正常跑起来
2. 再决定你和 Egg.js 的接口协议
3. 然后把前端输入提交替换为真实请求
4. 最后再接 LangChain / LangGraph 的流式输出
