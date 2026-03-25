ARG NODE_VERSION=24.13.0-slim
ARG PNPM_REGISTRY=https://registry.npmmirror.com

FROM registry.cn-hangzhou.aliyuncs.com/rhett/useforself:node-24-12 AS base

ARG PNPM_REGISTRY
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NPM_CONFIG_REGISTRY=${PNPM_REGISTRY}
ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}

RUN npm config set registry "${PNPM_REGISTRY}" \
  && npm install -g pnpm@10 \
  && pnpm config set registry "${PNPM_REGISTRY}"

FROM base AS dependencies

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

FROM base AS builder

WORKDIR /app

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* variables are inlined into the browser bundle at build time.
ARG NEXT_PUBLIC_LANGGRAPH_API_URL
ARG NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID=agent

ENV NEXT_PUBLIC_LANGGRAPH_API_URL=${NEXT_PUBLIC_LANGGRAPH_API_URL}
ENV NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID=${NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID}

RUN test -n "$NEXT_PUBLIC_LANGGRAPH_API_URL" \
  || (echo "NEXT_PUBLIC_LANGGRAPH_API_URL build arg is required" >&2 && exit 1)

RUN pnpm build

FROM registry.cn-hangzhou.aliyuncs.com/rhett/useforself:node-24-12 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder --chown=node:node /app/public ./public

RUN mkdir .next && chown node:node .next

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

CMD ["node", "server.js"]
