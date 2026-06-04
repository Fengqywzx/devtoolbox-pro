# 🚀 镜观作品集 — 全栈部署方案

## 方案一：Zeabur（推荐 · 中国用户首选）

Zeabur 是中国团队开发的云平台，国内访问速度快，有免费额度。

**1. 注册：** https://zeabur.com

**2. 部署：**
```
1. 登录 Zeabur → 创建项目
2. 选择 "从 GitHub 导入"
3. 选择 devtoolbox-pro 仓库
4. 平台自动检测 Dockerfile → 一键部署
5. 部署完成后，获得 https://xxx.zeabur.app 域名
```

**3. 绑定自定义域名（可选）：**
```
Zeabur 控制台 → 域名 → 绑定你的域名
```

## 方案二：Railway

**1. 注册：** https://railway.app

**2. 一键部署按钮：**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/xxxx)

**3. 手动部署：**
```
1. 登录 Railway → New Project
2. Deploy from GitHub repo → 选择 devtoolbox-pro
3. Railway 自动检测 Dockerfile → 部署
4. 获得 https://xxx.railway.app 域名
```

## 方案三：GitHub Actions + Docker

如果自己有 VPS，可以用 GitHub Actions 自动部署：

```yaml
# .github/workflows/deploy-server.yml
name: Deploy Server
on:
  push:
    branches: [master]
    paths:
      - 'server/**'
      - 'portfolio-data.json'
      - 'novel-content.json'
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and Deploy
        run: |
          docker build -t portfolio-api .
          docker tag portfolio-api your-registry/portfolio-api:latest
          docker push your-registry/portfolio-api:latest
```

## 部署后配置

### 1. 更新前端 API 地址

默认前端通过 `/api/...` 相对路径请求（同源部署）。
如果 API 和前端在不同域名，需要修改所有 HTML 文件中的 API 基地址：

```javascript
// 在页面顶部添加（默认使用相对路径，同源无需修改）
var API_BASE = 'https://你的域名.com';
```

### 2. 数据自动同步

```bash
# 本地导出新数据后，推送到 GitHub 即自动触发部署
cd /c/Users/18612/Desktop/万子轩的项目
python3 build-pages.py  # 重新构建 HTML
git add . && git commit -m "更新数据" && git push
```

## 架构图

```
┌─────────────────────────────────────────────────────┐
│                  GitHub                             │
│  ┌──────────────────────────────────────────────┐   │
│  │ master branch                                 │   │
│  │  ├── portfolio.html (self-contained)          │   │
│  │  ├── admin.html                               │   │
│  │  ├── novel.html                               │   │
│  │  ├── server/index.mjs (Express API)           │   │
│  │  ├── Dockerfile (deployment)                  │   │
│  │  └── portfolio-data.json (data export)        │   │
│  └──────────────────────────────────────────────┘   │
│                        │                            │
│                        ▼                            │
├─────────────────────────────────────────────────────┤
│              GitHub Actions                         │
│  ┌──────────────────────────────────────────────┐   │
│  │ 1. deploy-pages.yml → GitHub Pages (static)  │   │
│  │ 2. [可选] deploy-server.yml → Docker/VPS     │   │
│  └──────────────────────────────────────────────┘   │
│                        │                            │
└────────────────────────┼────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│  Cloud Platform (Zeabur / Railway)                  │
│  ┌──────────────────────────────────────────────┐   │
│  │ Docker Container                             │   │
│  │  ├── Express API at port 3000                │   │
│  │  ├── /api/works → 作品数据                   │   │
│  │  ├── /api/stats → 统计数据                   │   │
│  │  ├── /api/novel → 小说内容                   │   │
│  │  └── portfolio.html → 前端页面               │   │
│  └──────────────────────────────────────────────┘   │
│                        │                            │
│                        ▼                            │
│              https://xxx.zeabur.app                  │
│              (公网可直接访问)                        │
└─────────────────────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
          GitHub Pages (备用)       用户直接访问
          https://fengqywzx.github.  产品集网站
          io/devtoolbox-pro/        接单展示
