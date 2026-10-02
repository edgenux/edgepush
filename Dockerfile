FROM ubuntu:22.04

# 添加镜像元数据
LABEL org.opencontainers.image.title="EdgePush"
LABEL org.opencontainers.image.description="基于 Next.js 与 Cloudflare Workers 的多渠道消息推送服务"
LABEL org.opencontainers.image.source="https://github.com/edgenux/edgepush"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.version="latest"

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 安装必要的软件包
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# 安装 Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_23.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY . .

# 安装依赖
RUN pnpm install

# 复制 wrangler 配置（Docker 使用本地 D1）
RUN cp wrangler.example.jsonc wrangler.jsonc

# 构建项目
RUN pnpm run build

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV AUTH_TRUST_HOST true
ENV AUTH_SECRET ""
ENV AUTH_GITHUB_ID ""
ENV AUTH_GITHUB_SECRET ""
ENV DISABLE_REGISTER false

# 创建启动脚本
RUN echo '#!/bin/sh\n\
# 创建 .env 文件\n\
echo "AUTH_TRUST_HOST=true" > .env\n\
if [ ! -z "$AUTH_SECRET" ]; then\n\
  echo "AUTH_SECRET=$AUTH_SECRET" >> .env\n\
fi\n\
if [ ! -z "$AUTH_GITHUB_ID" ]; then\n\
  echo "AUTH_GITHUB_ID=$AUTH_GITHUB_ID" >> .env\n\
fi\n\
if [ ! -z "$AUTH_GITHUB_SECRET" ]; then\n\
  echo "AUTH_GITHUB_SECRET=$AUTH_GITHUB_SECRET" >> .env\n\
fi\n\
if [ ! -z "$DISABLE_REGISTER" ]; then\n\
  echo "DISABLE_REGISTER=$DISABLE_REGISTER" >> .env\n\
fi\n\
\n\
# 初始化或者更新数据库\n\
pnpm wrangler d1 migrations apply edgepush --local\n\
# 确保目录权限正确\n\
chmod -R 777 .wrangler\n\
# 启动应用\n\
pnpm run start\n\
' > /app/start.sh && chmod +x /app/start.sh

# 定义卷
VOLUME ["/app/.wrangler"]

# 设置启动命令
CMD ["/app/start.sh"]