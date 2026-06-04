# 🚀 镜观作品集 v2 — 全栈生产部署

## 系统架构（当前状态）

```
┌─────────────────────────────────────────────┐
│  前端静态页（双重数据源）                     │
│  ├── portfolio.html — 作品集展示             │
│  ├── order.html — 接单表单                  │
│  ├── admin.html — 管理后台（暗色 SaaS）       │
│  ├── novel.html — 小说连载                   │
│  └── payment-demo.html — 微信支付演示         │
│                                              │
│  数据加载: API → 嵌入数据(PORTFOLIO_DATA)     │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│  Express API Server (index.mjs)              │
│                                              │
│  GET  /api/health          健康检查          │
│  GET  /api/works           作品列表/搜索/筛选 │
│  GET  /api/stats           统计概览          │
│  GET  /api/types           类型分布          │
│  POST /api/orders          提交订单          │
│  GET  /api/orders          订单列表(管理)    │
│  PUT  /api/orders/:id      更新订单状态      │
│  GET  /api/novel/status    小说状态          │
│  GET  /api/novel/chapter/:date 章节目录     │
│  POST /api/admin/seed      重新导入数据      │
│  GET  /api/wechat/config   微信支付配置      │
│  WS   /ws                  WebSocket 实时推送 │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│  数据库层 (db.mjs)                           │
│  ├── SQLite (server/data/jingguan.db) ← 默认 │
│  └── PostgreSQL (DATABASE_URL env) → 生产    │
│                                              │
│  作品: 322条 / 小说: 4章 / 订单: 动态        │
└─────────────────────────────────────────────┘
```

## 部署方案

### 方案一：Zeabur（推荐 · 中国用户首选）

Zeabur 免费额度足够运行此应用，无需信用卡，香港节点。

```
1. 注册: https://zeabur.com
2. 登录 → 创建项目 → 从 GitHub 导入
3. 选择 devtoolbox-pro 仓库
4. 环境变量（可选）:
   - DATABASE_URL=postgres://user:pass@host:5432/jingguan
   - WECHAT_MERCHANT_ID=你的商户号
5. 部署完成 → https://xxx.zeabur.app
```

### 方案二：Railway

```
1. 注册: https://railway.app
2. New Project → Deploy from GitHub repo
3. 可选添加 PostgreSQL 插件
4. 部署完成 → https://xxx.railway.app
```

### 方案三：Docker 自部署

```bash
docker build -t jingguan-api .
docker run -d -p 3000:3000 \
  -v jingguan-data:/app/server/data \
  jingguan-api
```

## 启动方式

```bash
# 开发
cd server && npm run dev

# 生产
cd server && npm run prod

# 手动种子导入
cd server && npm run seed
```

## 微信支付接入

获得微信商户号后，设置环境变量即可启用真实支付：

```
WECHAT_MERCHANT_ID=mch123456
WECHAT_API_KEY=your_api_key_here
WECHAT_APPID=wx1234567890
WECHAT_NOTIFY_URL=https://your-domain.com/api/wechat/pay/notify
```

未配置时自动使用模拟模式（开发/演示可用）。

## 数据同步

```bash
# 本地导出新数据后
python3 build-pages.py     # 重新嵌入数据到 HTML
git add . && git commit -m "更新数据"
git push                    # GitHub Actions 自动部署
```

## 技术栈

- **后端**: Express.js + WebSocket (ws)
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **前端**: 原生 JS + CSS（零框架，兼容 file://）
- **支付**: 微信支付 Native (QR Code)
- **实时**: WebSocket 双向推送
- **容器**: Docker + HEALTHCHECK
