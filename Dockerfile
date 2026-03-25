FROM registry.cn-hangzhou.aliyuncs.com/rhett/useforself:node-20-17 AS base

ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apk add --no-cache libc6-compat \
  && corepack enable

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* variables are inlined at build time.
ARG NEXT_PUBLIC_LANGGRAPH_API_URL
ARG NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID=agent

ENV NEXT_PUBLIC_LANGGRAPH_API_URL=${NEXT_PUBLIC_LANGGRAPH_API_URL}
ENV NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID=${NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID}

RUN test -n "$NEXT_PUBLIC_LANGGRAPH_API_URL" \
  || (echo "NEXT_PUBLIC_LANGGRAPH_API_URL build arg is required" >&2 && exit 1)
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN apk add --no-cache libc6-compat \
  && addgroup -S nodejs \
  && adduser -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
