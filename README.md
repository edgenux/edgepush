<p align="center">
  <img src="public/moe_logo.png" alt="MoePush Logo" width="100" height="100">
  <h1 align="center">MoePush</h1>
</p>

<p align="center">
  一个基于 NextJS + Cloudflare 技术栈构建的可爱消息推送服务, 支持多种消息推送渠道✨
</p>

## 在线演示

[https://moepush.app](https://moepush.app)

![home](https://pic.otaku.ren/20250221/AQAD5b8xG9vVwFV-.jpg)

![login](https://pic.otaku.ren/20250221/AQAD678xG9vVwFV-.jpg)

![dashboard](https://pic.otaku.ren/20250221/AQAD7b8xG9vVwFV-.jpg)

## 特性

- 📡**多渠道支持** ：支持钉钉、企业微信、个人微信、Telegram 等多种消息推送渠道。
- 🛠️**简单易用** ：提供简单的接口调用，支持多种消息模板，快速集成。
- 💖**开源免费** ：基础功能完全免费使用，代码开源，欢迎贡献。
- 🎨**精美 UI** ：界面按最新 Cloudflare 控制台（Kumo）设计：橙色云标、蓝色主按钮、浅灰画布与 hairline 边框。
- 🚀**快速部署** ：基于 [Cloudflare Workers](https://developers.cloudflare.com/workers/) 部署，免费且稳定。
- 📦**接口组功能** ：支持创建接口组，一次性推送消息到多个渠道接口。

## 已支持渠道

- 钉钉群机器人
- 企业微信应用
- 企业微信群机器人
- 个人微信（iLink 扫码连接）
- Telegram 机器人
- 飞书群机器人
- Discord Webhook
- Bark App
- 通用 Webhook

## 个人微信

个人微信渠道把 [weixin-webhook-worker](https://github.com/edgenux/weixin-webhook-worker) 的 iLink 扫码连接和纯文本发送接到 MoePush 现有的「渠道 → 接口 → HTTP 推送」模型里，不另起一套后台。

1. 在控制台新建渠道，类型选择「个人微信」。
2. 点击「扫码连接微信」，用手机微信扫码并确认。
3. 保存渠道。让默认收件人先给这个微信发一条消息。
4. 点击「刷新会话」捕获会话后，即可创建接口并 `POST /api/push/:id`。发送通知前也会自动刷新一次会话。
5. 接口模板只支持纯文本，单条最多 4000 字。

首次连接后如果提示会话未就绪，通常是收件人还没发过消息。生产环境建议在 `wrangler.jsonc` 里保留每 5 分钟的 Cron，用来后台维护 iLink 连接。Cloudflare Workers 免费版每个账号最多 5 个 Cron；OnWarp 预览会跳过 Cron，改用发送前刷新和渠道里的「刷新会话」。定时提醒仍用 MoePush 自己的接口：由外部定时器调用推送 URL 即可，不在渠道里再做一套待办系统。

iLink 协议来自腾讯 `openclaw-weixin` 当前公开实现，上游变化时可能需要同步调整。部署时可按需覆盖 `WEIXIN_CHANNEL_VERSION` 和 `WEIXIN_APP_ID`，默认值与上游一致。

## 技术栈
- **框架**: [Next.js](https://nextjs.org/) (App Router)
- **平台**: [Cloudflare Workers](https://developers.cloudflare.com/workers/)（[OpenNext](https://opennext.js.org/cloudflare)）
- **数据库**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)
- **认证**: [NextAuth](https://authjs.dev/getting-started/installation?framework=Next.js) 配合 GitHub 登录
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **UI 组件**: 基于 [Radix UI](https://www.radix-ui.com/) 的自定义组件
- **类型安全**: [TypeScript](https://www.typescriptlang.org/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)

## 本地运行

1. 克隆项目并安装依赖：

```bash
git clone https://github.com/beilunyang/moepush.git
cd moepush
pnpm install
```

2. 复制环境变量文件：

```bash
cp .env.example .env
```

环境变量文件 `.env` 中需要配置以下变量：

- `AUTH_SECRET`：加密 Session 的密钥
- `AUTH_GITHUB_ID`：GitHub OAuth App ID
- `AUTH_GITHUB_SECRET`：GitHub OAuth App Secret
- `DISABLE_REGISTER`：是否禁止注册，默认为`false`，设置为 `true` 则禁止注册

3. 创建 Wrangler 与本地 Workers 环境文件：
```bash
cp wrangler.example.jsonc wrangler.jsonc
cp .dev.vars.example .dev.vars
```

4. 初始化本地数据库
```bash
pnpm run db:migrate-local
```

5. 运行开发服务器：

```bash
pnpm run dev
```

访问 http://localhost:3000 查看应用。

使用 `pnpm run preview` 可以在本地 Workers 运行时中预览（`opennextjs-cloudflare preview`），更接近线上环境。

## 部署

### 视频版保姆级部署教程
https://www.bilibili.com/video/BV1dtZBYnEUX/?p=2

部署目标是 EdgeNux 账号下的 **Cloudflare Workers**（账号 ID `0a3ca4bc9d23a793826b69bcce206ad8`），不再创建 Pages 项目。`scripts/deploy.ts` 会写入 `wrangler.jsonc`、复用 EdgeNux 上的 D1 `moepush`、应用迁移，然后用 OpenNext 构建并发布 Worker。线上地址：https://moepush.eonux.workers.dev

### 从 Cloudflare Pages 迁移

- 自定义域名需要改绑到新的 Worker；确认流量切换后再删除旧的 Pages 项目。
- 现有 D1 可以继续使用，GitHub Secret `D1_DATABASE_NAME` 保持原库名即可。
- 认证相关 Secret 会通过 `wrangler secret bulk` 写入 Worker，而不是 Pages Secrets。

### GitHub Actions 自动部署

项目已配置 GitHub Actions 用于自动部署, 可以通过两种方式进行触发：

- 推送新的 tag（格式：`v*`）会触发自动部署。例如：`git tag v1.0.0 && git push origin v1.0.0`
- 手动触发工作流。前往 [Actions](https://github.com/beilunyang/moepush/actions) 页面，点击 `Deploy` 工作流，点击 `Run workflow` 按钮即可。

### 部署前需要在 GitHub 仓库设置中添加以下 Secrets：
- `CLOUDFLARE_API_TOKEN`：Cloudflare API Token
- `CLOUDFLARE_ACCOUNT_ID`：Cloudflare Account ID（EdgeNux：`0a3ca4bc9d23a793826b69bcce206ad8`）
- `D1_DATABASE_NAME`：D1 数据库名称（EdgeNux 上为 `moepush`）
- `AUTH_SECRET`：加密 Session 的密钥
- `AUTH_GITHUB_ID`：GitHub OAuth App ID
- `AUTH_GITHUB_SECRET`：GitHub OAuth App Secret
- `PROJECT_NAME`：项目名称 (可选，默认：moepush)
- `DISABLE_REGISTER`：是否禁止注册，默认关闭，设置为 `true` 则禁止注册

### 使用 Docker 部署

```bash
docker pull beilunyang/moepush
docker run -d -p 3000:3000 -v $(pwd)/.wrangler:/app/.wrangler -e AUTH_SECRET=<你的AUTH_SECRET> -e AUTH_GITHUB_ID=<你的AUTH_GITHUB_ID> -e AUTH_GITHUB_SECRET=<你的AUTH_GITHUB_SECRET> moepush
```

## 贡献

欢迎提交 Pull Request 或者 Issue来帮助改进这个项目

## 交流
<table>
  <tr style="max-width: 360px">
    <td>
      <img src="https://pic.otaku.ren/20250309/AQADAcQxGxQjaVZ-.jpg" />
    </td>
    <td>
      <img src="https://pic.otaku.ren/20250309/AQADCMQxGxQjaVZ-.jpg" />
    </td>
  </tr>
  <tr style="max-width: 360px">
    <td>
      关注公众号，了解更多项目进展以及AI，区块链，独立开发资讯
    </td>
    <td>
      添加微信，备注 "MoePush" 拉你进微信交流群
    </td>
  </tr>
</table>

## 支持

如果你喜欢这个项目，欢迎给它一个 Star ⭐️
或者进行赞助
<br />
<br />
<img src="https://pic.otaku.ren/20240212/AQADPrgxGwoIWFZ-.jpg" style="width: 400px;"/>
<br />
<br />
<a href="https://www.buymeacoffee.com/beilunyang" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" alt="Buy Me A Coffee" style="width: 400px;" ></a>

## 许可证

[MIT](LICENSE)
