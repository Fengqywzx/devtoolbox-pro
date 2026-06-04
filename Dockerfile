# 镜观作品集 API — Docker 部署
FROM node:20-alpine

# better-sqlite3 需要编译工具
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 复制 server 依赖
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --only=production

# 复制所有项目文件（API server 会读取 portfolio-data.json 等）
COPY . .

# API server 入口
WORKDIR /app/server

EXPOSE 3000

CMD ["node", "index.mjs"]
