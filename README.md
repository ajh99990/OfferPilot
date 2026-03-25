# OfferPilot Web

一个基于 Next.js 16 的求职 Agent 前端，包含：

- 任务首页与任务工作台
- LangGraph 实时消息流
- HITL 中断卡片
- 定制简历详情视图
- 登录中心短信验证码登录
- PostgreSQL 用户资料与线程归属
- 阿里云 OSS 简历上传与签名访问

## 本地启动

先准备本地环境变量：

```bash
cp .env.development.example .env.local
```

然后把 `.env.local` 里的真实密钥和服务地址补进去。

```bash
pnpm install
pnpm dev
```

默认打开：`http://localhost:3088`

## 生产部署前置条件

这个前端不是独立单体，生产环境至少还需要这些外部服务：

- LangGraph 服务
- 登录中心
- PostgreSQL
- 阿里云 OSS / STS

另外，生产环境应通过 HTTPS 暴露站点。因为认证 cookie 在 `NODE_ENV=production` 下会带 `secure` 标记。

## 数据库初始化

首次上线前，请先在目标 PostgreSQL 执行：

```bash
psql "$DATABASE_URL" -f sql/login-auth.sql
```

如果你不用 `DATABASE_URL`，也可以改成使用 `PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD` 连接后再执行同一份 SQL。

## 环境变量

环境变量模板分成两类：

- [`.env.example`](./.env.example)：本地开发参考
- [`.env.production.example`](./.env.production.example)：生产 / Docker 参考

最容易混淆的一点是数据库主机名：

- 本地开发通常用 `localhost`
- Docker / 容器网络里才适合用 `postgres` 这类 service name

其中要特别注意两类变量：

### 1. 构建时变量

- `NEXT_PUBLIC_LANGGRAPH_API_URL`
- `NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID`

它们会被直接写进浏览器产物里，所以在 Docker 场景下，必须在 **构建镜像时** 传入正确值。

### 2. 运行时变量

- `LANGGRAPH_API_URL`
- `LOGIN_CENTER_API_URL`
- `DATABASE_URL` 或 `PG*`
- `OSS_ACCESS_KEY_ID`
- `OSS_ACCESS_KEY_SECRET`
- `OSS_BUCKET`
- `OSS_REGION`
- `OSS_ROLE_ARN`
- `CDN_HOST`

## Docker 部署

仓库已经提供：

- [`Dockerfile`](./Dockerfile)
- [`.dockerignore`](./.dockerignore)
- [`docker-compose.yml`](./docker-compose.yml)

并且已经启用了 Next.js `output: "standalone"`，因此镜像会基于 `.next/standalone` 运行。

### 服务器上的推荐操作方式

GitHub 不应该保存真实的 `.env`。  
因此在服务器上，推荐这样做：

```bash
cp .env.production.example .env.production
```

然后手动编辑服务器上的 `.env.production`，内容参考 [`.env.production.example`](./.env.production.example)。

### 使用 docker compose 启动

```bash
docker compose --env-file .env.production up -d --build
```

### 一套完整的服务器操作示例

```bash
git pull
cp .env.production.example .env.production
# 编辑 .env.production，填入真实生产配置
psql "$DATABASE_URL" -f sql/login-auth.sql
docker compose --env-file .env.production up -d --build
```

### 查看状态和日志

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f
```

### 停止服务

```bash
docker compose --env-file .env.production down
```

## 部署注意事项

### LangGraph 地址要区分浏览器和服务端

当前项目同时使用两类地址：

- `NEXT_PUBLIC_LANGGRAPH_API_URL`
  给浏览器使用，必须是浏览器可访问的地址
- `LANGGRAPH_API_URL`
  给 Next.js 服务端使用，可以是容器网络里的内部地址

如果二者都能用同一个公网地址，也可以设成一样。

在你当前的部署方式里，`docker-compose.yml` 已经接入和 agent 侧一致的外部网络 `offerpilot_agent_shared`。  
结合你现在的 agent compose：

- `LANGGRAPH_API_URL` 应该写成 `http://langgraph-api:8000`
- `NEXT_PUBLIC_LANGGRAPH_API_URL` 仍然应该写浏览器可访问的地址，比如反向代理后的公网域名

也就是说，浏览器侧不要写 `http://langgraph-api:8000`，因为浏览器无法解析 Docker 内部 service name。

### `NEXT_PUBLIC_*` 不能在镜像构建后再改

如果你把同一份镜像推广到多个环境，`NEXT_PUBLIC_*` 不会在容器启动时重新注入。它们只在 `docker build` 时生效。

如果后续你需要“单镜像多环境”能力，建议再把客户端对 LangGraph 的访问改成运行时配置方案。

## 当前已补齐的生产项

- 已加入 `pg` 运行时依赖
- 已启用 Next.js `standalone` 输出
- 已补齐 Dockerfile
- 已补齐 `.dockerignore`
- 已补齐环境变量样例
- 已保留数据库建表 SQL

## 仍需要你在部署侧完成的事

- 提供实际的 LangGraph / 登录中心 / PostgreSQL / OSS 生产配置
- 执行 `sql/login-auth.sql`
- 配置 HTTPS 与反向代理
- 配置 HTTPS 与反向代理，让浏览器能访问 `NEXT_PUBLIC_LANGGRAPH_API_URL`

使用docker-compose启动
docker compose --env-file .env.production up -d --build
