# EdgePush

基于 Next.js 与 Cloudflare Workers 的自托管消息推送服务。在 Web 控制台里配置推送渠道与消息模板，通过 HTTP 接口把通知发到钉钉、企业微信、个人微信、Telegram、飞书、Discord、Bark 或自定义 Webhook。

控制台 UI 参考 Cloudflare 控制台（Kumo）的浅色风格；管理后台路径为 `/admin`（历史路径 `/moe` 会重定向到 `/admin`）。

## 功能概览

- 多种推送渠道与可配置消息模板（占位符 `${body.xxx}`、内置函数如 `${truncate(...)}`）
- 推送接口：`POST /api/push/:endpointId`
- 接口组：`POST /api/push-group/:groupId`
- 渠道列表支持 **测试推送**，校验配置是否可用
- GitHub OAuth 登录；数据存储在 Cloudflare D1

## 技术栈

- [Next.js](https://nextjs.org/)（App Router）
- [OpenNext](https://opennext.js.org/cloudflare) + [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [NextAuth.js](https://authjs.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Tailwind CSS](https://tailwindcss.com/) · [Radix UI](https://www.radix-ui.com/)

## 本地开发

```bash
git clone https://github.com/edgenux/edgepush.git
cd edgepush
pnpm install
cp .env.example .env
cp wrangler.example.jsonc wrangler.jsonc
cp .dev.vars.example .dev.vars
pnpm run db:migrate-local
pnpm run dev
```

浏览器访问 `http://localhost:3000`。环境变量说明见 `.env.example` 与 `.dev.vars.example`。

接近线上运行时预览：

```bash
pnpm run preview
```

## 部署

### 1. 准备 Cloudflare 资源

1. 在 Cloudflare 创建 D1 数据库（名称与 `wrangler.jsonc` 中一致，默认可参考 `wrangler.example.jsonc` 里的 `edgepush`）。
2. 复制 `wrangler.example.jsonc` 为 `wrangler.jsonc`，填写 `account_id`、`d1_databases[].database_id` 等。
3. 创建 [GitHub OAuth App](https://github.com/settings/developers)，回调地址填 `https://<你的域名>/api/auth/callback/github`（本地开发为 `http://localhost:3000/api/auth/callback/github`）。

### 2. 环境变量 / Secrets

| 变量 | 说明 |
|------|------|
| `AUTH_SECRET` | Session 加密密钥 |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth |
| `DISABLE_REGISTER` | 设为 `true` 可关闭注册 |
| `AUTH_TRUST_HOST` | Workers 部署建议为 `true`（见 `wrangler.example.jsonc` 的 `vars`） |

个人微信渠道可选：`WEIXIN_CHANNEL_VERSION`、`WEIXIN_APP_ID`（默认与上游 iLink 实现一致）。

### 3. 发布 Worker

**脚本一键部署**（适合 CI 或本机，需已配置 `CLOUDFLARE_API_TOKEN` 等）：

```bash
export CLOUDFLARE_ACCOUNT_ID=<账号 ID>
export CLOUDFLARE_API_TOKEN=<API Token>
export D1_DATABASE_NAME=<D1 名称>
export PROJECT_NAME=<Worker 名称>
export AUTH_SECRET=...
export AUTH_GITHUB_ID=...
export AUTH_GITHUB_SECRET=...
pnpm dlx tsx scripts/deploy.ts
```

脚本会写入 `wrangler.jsonc`、执行 D1 远程迁移、OpenNext 构建并 `deploy`，最后 `wrangler secret bulk` 写入敏感变量。

**GitHub Actions**：`Deploy` 工作流会在以下情况自动运行：

- 推送到 `main` 分支
- 推送 `v*` 版本标签（例如 `v0.2.1`）
- 在 Actions 页手动 **Run workflow**

在仓库 **Settings → Secrets and variables → Actions** 中配置：

| Secret | 必需 | 说明 |
|--------|------|------|
| `CLOUDFLARE_API_TOKEN` | 是 | Cloudflare API Token（Workers + D1 权限） |
| `CLOUDFLARE_ACCOUNT_ID` | 是 | Cloudflare 账号 ID |
| `AUTH_SECRET` | 是 | Session 密钥 |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | 是 | GitHub OAuth |
| `D1_DATABASE_NAME` | 否 | 未设置时默认 `moepush` |
| `PROJECT_NAME` | 否 | 未设置时默认 `moepush`（Worker 服务名） |
| `DISABLE_REGISTER` | 否 | 设为 `true` 关闭注册 |

工作流会先执行 `next build` 做类型与编译检查，再运行 `scripts/deploy.ts` 完成 D1 迁移、Secret 同步与 OpenNext 部署。

**仅构建与上传**（已自行维护 `wrangler.jsonc` 时）：

```bash
pnpm run deploy
```

### 4. Docker（可选）

```bash
docker build -t edgepush .
docker run -d -p 3000:3000 \
  -v $(pwd)/.wrangler:/app/.wrangler \
  -e AUTH_SECRET=... \
  -e AUTH_GITHUB_ID=... \
  -e AUTH_GITHUB_SECRET=... \
  edgepush
```

Docker 镜像使用本地 D1，适合试用；生产环境推荐使用 Workers + 远程 D1。

## 致谢

- 本项目由 [MoePush](https://github.com/beilunyang/moepush) 演进而来，感谢原作者 [BeilunYang](https://github.com/beilunyang) 的开源工作。
- 个人微信 iLink 能力参考并对接 [weixin-webhook-worker](https://github.com/edgenux/weixin-webhook-worker) 及社区 iLink 协议实现（如 openclaw-weixin 相关公开代码）。
- UI 视觉参考 [Cloudflare Dashboard / Kumo](https://developers.cloudflare.com/) 设计规范；未使用官方 `@cloudflare/kumo` npm 包，在 Tailwind 中复刻主题 token。
- 运行时依赖 [OpenNext Cloudflare](https://opennext.js.org/cloudflare)、[Wrangler](https://developers.cloudflare.com/workers/wrangler/) 等生态项目。

## 许可证

[MIT](LICENSE)
