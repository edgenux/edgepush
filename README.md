# EdgePush

基于 **Next.js** 与 **Cloudflare Workers**（OpenNext）的多渠道消息推送服务。控制台 UI 采用 Cloudflare 控制台（Kumo）风格，支持钉钉、企业微信、个人微信、Telegram、Discord 等渠道。

## 在线地址

- 控制台与 API：[https://moepush.app](https://moepush.app)（域名沿用历史配置，产品名称为 EdgePush）
- Workers 默认域名：`https://moepush.eonux.workers.dev`（EdgeNux 生产环境）

## 功能

- **多渠道**：钉钉、企业微信（应用 / 群机器人）、个人微信（iLink）、Telegram、飞书、Discord、Bark、通用 Webhook
- **接口与接口组**：单接口 `POST /api/push/:id`，接口组 `POST /api/push-group/:id`
- **Cloudflare 控制台风格 UI**：浅色 Kumo 主题，适配桌面与移动端
- **个人微信**：对接 [weixin-webhook-worker](https://github.com/edgenux/weixin-webhook-worker) 的扫码连接与纯文本发送
- **自托管**：D1 数据库 + Workers 部署，数据留在你的 Cloudflare 账号

## 控制台路径

登录后管理后台在 **`/admin`**（例如 `/admin/endpoints`、`/admin/channels`）。旧路径 `/moe/*` 会自动重定向到 `/admin/*`。

## 技术栈

- Next.js App Router、NextAuth（GitHub 登录）
- Cloudflare Workers、D1、OpenNext
- Tailwind CSS、Radix UI

## 本地开发

```bash
git clone https://github.com/edgenux/moepush.git
cd moepush
pnpm install
cp .env.example .env
cp wrangler.example.jsonc wrangler.jsonc
cp .dev.vars.example .dev.vars
pnpm run db:migrate-local
pnpm run dev
```

环境变量见 `.env.example` 与 `.dev.vars.example`。

本地 Workers 预览：

```bash
pnpm run preview
```

## 部署（Cloudflare Workers）

EdgeNux 生产环境账号 ID：`0a3ca4bc9d23a793826b69bcce206ad8`。

`scripts/deploy.ts` 会生成 `wrangler.jsonc`、应用 D1 迁移、OpenNext 构建并发布 Worker。

GitHub Actions 工作流 **Deploy** 支持：

- 推送 `v*` tag 自动部署
- 手动 **Run workflow**

所需 Secrets（生产环境仍使用历史 Worker / D1 名称 `moepush`，与产品名 EdgePush 无关）：

| Secret | 说明 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | 账号 ID |
| `D1_DATABASE_NAME` | 生产 D1 库名（EdgeNux：`moepush`） |
| `PROJECT_NAME` | Worker 名称（EdgeNux：`moepush`） |
| `AUTH_SECRET` / `AUTH_GITHUB_*` | 认证 |
| `DISABLE_REGISTER` | 可选，禁止注册 |

新环境可从 `wrangler.example.jsonc` 使用默认名 `edgepush` 创建独立 Worker 与 D1。

## 与 CloudMail 联动

CloudMail **系统设置 → Webhook** 中填写：

`https://moepush.app/api/push/<你的接口ID>`

CloudMail 会以 JSON  POST 新邮件字段（`subject`、`sendEmail`、`text` 等）；在 EdgePush **接口** 消息模板中使用 `${body.subject}`、`${body.text}` 等占位符即可。

## 仓库说明

本仓库 GitHub 路径仍为 `edgenux/moepush`（历史仓库名），npm 包名为 `edgepush`。

## 许可证

[MIT](LICENSE)
