#!/usr/bin/env node
/**
 * 镜观作品集 API Server — Production Grade
 * ===========================================
 * 生产级 Express + WebSocket 后端，为公网部署设计
 * 支持: Railway / Zeabur / Render / Vercel / 裸机
 *
 * 架构:
 *   index.mjs        ← 入口，挂载中间件 + 路由 + WS
 *   db.mjs           ← 数据库抽象层 (PostgreSQL / SQLite)
 *   routes/           ← 各域路由模块
 *   middleware/       ← 自定义中间件
 *
 * 数据流:
 *   JSON 文件 (首次) → 数据库 (持久化) → API 响应
 *   文件变更 → watch → 自动重新 seed
 *   WebSocket → 实时推送 works/orders 变更
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { readFileSync, existsSync, watchFile } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── 路径常量 ──
const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT, 10) || 3000;
const REPO_ROOT = join(__dirname, '..');
const DATA_FILE = process.env.DATA_FILE || join(REPO_ROOT, 'portfolio-data.json');
const NOVEL_DATA_FILE = process.env.NOVEL_DATA_FILE || join(REPO_ROOT, 'novel-content.json');

// ── 应用初始化 ──
const app = express();
const httpServer = createServer(app);

// ── WebSocket ──
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
const broadcast = (event, payload) => {
  const message = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
  let count = 0;
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
      count++;
    }
  });
  return count;
};

wss.on('connection', (ws, req) => {
  console.log(`[WS] 客户端连接: ${req.socket.remoteAddress}`);
  ws.send(JSON.stringify({ event: 'connected', payload: { message: '镜观 API WebSocket 已连接' } }));
  ws.on('close', () => console.log('[WS] 客户端断开'));
  ws.on('error', err => console.error('[WS] 错误:', err.message));
});

// ── 中间件 ──
app.use(cors({
  origin: [
    'https://fengqywzx.github.io',
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
    /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
    'file://',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── 请求日志 (轻量) ──
app.use((req, _res, next) => {
  const start = Date.now();
  _res.on('finish', () => {
    const ms = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[REQ] ${req.method} ${req.path} ${_res.statusCode} ${ms}ms`);
    }
  });
  next();
});

// ── 数据库层 ──
import * as dbMod from './db.mjs';
let dbReady = false;

async function initDatabase() {
  try {
    // 使用 named exports 而非 sync wrapper
    await dbMod.initDB();
    dbReady = true;
    console.log('[DB] 数据库初始化成功');
  } catch (err) {
    console.error('[DB] 数据库初始化失败（降级为 JSON 模式）:', err.message);
    dbReady = false;
  }
}

// ── 种子数据: 从 JSON 导入数据库 ──
async function seedFromJson() {
  if (!dbReady) {
    console.log('[SEED] 数据库未就绪，跳过种子导入');
    return;
  }

  try {
    // 仅在数据库为空时执行
    const stats = await dbMod.getStats();
    if (stats?.total > 0) {
      console.log(`[SEED] 数据库已有 ${stats.total} 条作品，跳过导入`);
      return;
    }
  } catch {
    // getStats 可能失败
  }

  // 导入 portfolio-data.json
  if (existsSync(DATA_FILE)) {
    try {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      const works = JSON.parse(raw);
      if (Array.isArray(works) && works.length > 0) {
        await dbMod.seedFromJson(works, {});
        console.log(`[SEED] 已导入 ${works.length} 条作品数据`);
        broadcast('works-updated', { source: 'seed', count: works.length });
      }
    } catch (err) {
      console.error('[SEED] 作品数据导入失败:', err.message);
    }
  }

  // 导入 novel-content.json
  if (existsSync(NOVEL_DATA_FILE)) {
    try {
      const raw = readFileSync(NOVEL_DATA_FILE, 'utf-8');
      const novel = JSON.parse(raw);
      const chapters = novel.chapters || novel;
      if (chapters && typeof chapters === 'object' && !Array.isArray(chapters)) {
        const count = Object.keys(chapters).length;
        if (count > 0) {
          await dbMod.seedFromJson([], chapters);
          console.log(`[SEED] 已导入 ${count} 章小说数据`);
        }
      }
    } catch (err) {
      console.error('[SEED] 小说数据导入失败:', err.message);
    }
  }
}

// ── 文件监听: portfolio-data.json 变更时自动重载 ──
function setupFileWatcher() {
  if (!existsSync(DATA_FILE)) return;
  try {
    watchFile(DATA_FILE, { interval: 2000 }, (curr, prev) => {
      if (curr.mtimeMs === prev.mtimeMs) return;
      console.log('[WATCH] portfolio-data.json 已变更，自动重载...');
      if (dbReady) {
        try {
          const raw = readFileSync(DATA_FILE, 'utf-8');
          const works = JSON.parse(raw);
          if (Array.isArray(works)) {
            dbMod.seedFromJson(works, {}).then(() => {
              broadcast('works-updated', { source: 'file-watch', count: works.length });
              console.log(`[WATCH] 已重载 ${works.length} 条作品`);
            }).catch(err => console.error('[WATCH] 重载失败:', err.message));
          }
        } catch (err) {
          console.error('[WATCH] 解析失败:', err.message);
        }
      }
    });
  } catch (err) {
    console.warn('[WATCH] 文件监听不受支持（跳过）:', err.message);
  }
}

// ── 健康检查 ──
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage().rss,
    db: dbReady ? 'connected' : 'json-fallback',
    version: '2.0.0',
  });
});

// ── 路由挂载 ──
async function mountRoutes() {
  const routeModules = [
    './routes/works.mjs',
    './routes/orders.mjs',
    './routes/novel.mjs',
    './routes/admin.mjs',
    './routes/wechat.mjs',
  ];

  let mounted = 0;
  for (const module of routeModules) {
    try {
      const mod = await import(module);
      const router = mod.default || mod.router || mod;
      if (router && typeof router === 'function' && router.stack) {
        // 全部挂载在 /api 下（路由文件内使用相对路径如 /works, /orders）
        app.use('/api', router);
        mounted++;
        console.log(`[ROUTE] ✓ ${module}`);
      } else {
        console.warn(`[ROUTE] ✗ ${module} 未导出有效 router`);
      }
    } catch (err) {
      if (err.code === 'ERR_MODULE_NOT_FOUND' || err.code === 'MODULE_NOT_FOUND') {
        console.warn(`[ROUTE] ✗ ${module} 不存在`);
      } else {
        console.error(`[ROUTE] ✗ ${module} 加载失败:`, err.message);
      }
    }
  }
  console.log(`[ROUTE] 已挂载 ${mounted}/${routeModules.length} 个路由模块`);
}

// ── 静态文件服务 ──
// 提供仓库根目录下的所有静态文件 (portfolio.html, assets, 等)
app.use(express.static(REPO_ROOT, {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

// ── 启动 ──
async function start() {
  // 1. 初始化数据库
  await initDatabase();

  // 2. 首次自动 seed
  await seedFromJson();

  // 3. 挂载路由（必须先于错误/404 处理注册）
  await mountRoutes();

  // 4. 备用 SPA 回退
  app.get('/', (_req, res) => {
    res.sendFile(join(REPO_ROOT, 'portfolio.html'));
  });

  // 5. 全局错误处理（必须最后注册）
  app.use((err, _req, res, _next) => {
    console.error('[ERROR]', err.stack || err.message || err);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
      error: status >= 500 ? '服务器内部错误' : err.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
  });

  // 404 处理（必须最后注册）
  app.use((_req, res) => {
    res.status(404).json({ error: '接口不存在' });
  });

  // 6. 文件监听
  setupFileWatcher();

  // 7. 启动 HTTP + WebSocket 服务器
  httpServer.listen(PORT, () => {
    const isDev = process.env.NODE_ENV !== 'production';
    const banner = `
╔══════════════════════════════════════════════════╗
║        镜观作品集 API Server v2                  ║
║  ─────────────────────────────────────           ║
║  🌐  HTTP     → http://localhost:${PORT}          ║
║  🔗  WebSocket → ws://localhost:${PORT}/ws        ║
║  📡  DB       → ${dbReady ? '已连接' : 'JSON 降级'}         ║
║  ⚙️  模式     → ${isDev ? '开发' : '生产'}                    ║
║                                                 ║
║  端点:                                           ║
║    GET  /api/health    健康检查                   ║
║    GET  /api/works     作品列表 (分页/筛选/搜索)   ║
║    GET  /api/orders    订单管理                    ║
║    GET  /api/novel     小说连载                    ║
║    POST /api/admin     管理接口                    ║
║    POST /api/wechat    微信对接                    ║
║    WS   /ws            WebSocket 实时推送          ║
╚══════════════════════════════════════════════════╝`;
    console.log(banner);
  });
}

start().catch(err => {
  console.error('[FATAL] 启动失败:', err);
  process.exit(1);
});

// ── 优雅退出 ──
process.on('SIGTERM', () => {
  console.log('\n[SIGTERM] 收到终止信号，正在关闭...');
  wss.close();
  httpServer.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  console.log('\n[SIGINT] 收到中断信号，正在关闭...');
  wss.close();
  httpServer.close(() => process.exit(0));
});
process.on('uncaughtException', err => {
  console.error('[UNCAUGHT]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED]', reason);
});
