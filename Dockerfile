# 镜观作品集 API v2 — Docker 生产部署
FROM node:20-alpine

# better-sqlite3 需要编译工具
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 先复制依赖清单，利用 Docker 缓存
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --only=production && npm cache clean --force

# 复制所有项目文件
COPY . .

# 创建 SQLite 数据目录
RUN mkdir -p /app/server/data

# 环境变量（可被 docker run -e 覆盖）
ENV NODE_ENV=production
ENV PORT=3000
# ENV DATABASE_URL=postgres://user:pass@host:5432/jingguan

# API server 入口
WORKDIR /app/server

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "index.mjs"]
