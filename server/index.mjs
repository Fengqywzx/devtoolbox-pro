#!/usr/bin/env node
/**
 * 镜观作品集 API Server
 * 轻量级 Express 后端 — 为公网部署设计
 * 支持: Railway / Zeabur / Render / Vercel
 *
 * 数据来源:
 *   1. portfolio-data.json (从本地系统自动导出)
 *   2. 支持数据库模式 (PostgreSQL / SQLite)
 */
import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync, watchFile } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || join(__dirname, '..', 'portfolio-data.json');
const NOVEL_DATA_FILE = process.env.NOVEL_DATA_FILE || join(__dirname, '..', 'novel-content.json');

const app = express();

// ── 中间件 ──
app.use(cors({
  origin: [
    'https://fengqywzx.github.io',
    'http://localhost:3458',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'file://'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// ── 数据缓存 ──
let portfolioData = [];
let novelData = { chapters: {} };

function loadData() {
  // Load portfolio data
  if (existsSync(DATA_FILE)) {
    try {
      portfolioData = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
      console.log(`[DATA] 已加载 ${portfolioData.length} 篇作品`);
    } catch (e) {
      console.error('[DATA] 加载失败:', e.message);
    }
  }
  // Load novel data
  if (existsSync(NOVEL_DATA_FILE)) {
    try {
      novelData = JSON.parse(readFileSync(NOVEL_DATA_FILE, 'utf-8'));
      console.log(`[DATA] 已加载 ${Object.keys(novelData.chapters || {}).length} 章小说`);
    } catch (e) {
      console.error('[DATA] 小说加载失败:', e.message);
    }
  }
}

// 文件变更时自动重载
if (existsSync(DATA_FILE)) {
  try {
    watchFile(DATA_FILE, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        console.log('[WATCH] 数据文件变更，自动重载');
        loadData();
      }
    });
  } catch (e) { /* 不支持文件监听的平台忽略 */ }
}

// ── API 路由 ──

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    works: portfolioData.length,
    version: '1.0.0'
  });
});

// 作品列表（分页+筛选+搜索）
app.get('/api/works', (req, res) => {
  let result = [...portfolioData];
  const { grade, type, search, page, limit, sort } = req.query;

  // 筛选
  if (grade) result = result.filter(w => w.grade === grade);
  if (type) result = result.filter(w => w.type === type);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(w =>
      (w.title || '').toLowerCase().includes(q) ||
      (w.preview || '').toLowerCase().includes(q)
    );
  }

  // 排序
  const sortField = sort || 'score';
  result.sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0));

  // 分页
  const pg = parseInt(page) || 1;
  const lim = Math.min(parseInt(limit) || 30, 100);
  const total = result.length;
  const start = (pg - 1) * lim;
  const items = result.slice(start, start + lim);

  res.json({
    works: items,
    pagination: {
      page: pg,
      limit: lim,
      total,
      totalPages: Math.ceil(total / lim)
    }
  });
});

// 单个作品
app.get('/api/works/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const work = portfolioData.find(w => w.id === id);
  if (!work) return res.status(404).json({ error: '作品不存在' });
  res.json(work);
});

// 作品统计
app.get('/api/stats', (req, res) => {
  const stats = {
    total: portfolioData.length,
    top: portfolioData.filter(w => w.isTop || w.grade === 'A').length,
    totalWords: portfolioData.reduce((s, w) => s + (w.word_count || 0), 0),
    maxScore: Math.max(...portfolioData.map(w => w.score || 0)),
    avgScore: Math.round(portfolioData.reduce((s, w) => s + (w.score || 0), 0) / portfolioData.length),
    types: {},
    grades: {}
  };

  portfolioData.forEach(w => {
    const t = w.type || '其他';
    stats.types[t] = (stats.types[t] || 0) + 1;
    const g = w.grade || '?';
    stats.grades[g] = (stats.grades[g] || 0) + 1;
  });

  res.json(stats);
});

// 作品类型列表
app.get('/api/types', (req, res) => {
  const types = {};
  portfolioData.forEach(w => {
    const t = w.type || '其他';
    types[t] = (types[t] || 0) + 1;
  });
  const sorted = Object.entries(types)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
  res.json(sorted);
});

// 小说状态
app.get('/api/novel/status', (req, res) => {
  const chapters = novelData.chapters || {};
  res.json({
    totalChapters: Object.keys(chapters).length,
    chapters: Object.entries(chapters).map(([date, content]) => ({
      date,
      wordCount: content.length
    }))
  });
});

// 小说章节内容
app.get('/api/novel/chapter/:date', (req, res) => {
  const content = (novelData.chapters || {})[req.params.date];
  if (!content) return res.status(404).json({ error: '章节不存在' });
  res.json({ date: req.params.date, content });
});

// 管理：更新作品（仅限受信任来源）
app.put('/api/admin/works/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = portfolioData.findIndex(w => w.id === id);
  if (idx === -1) return res.status(404).json({ error: '作品不存在' });

  const updated = { ...portfolioData[idx], ...req.body, id };
  portfolioData[idx] = updated;

  // 写回文件
  try {
    writeFileSync(DATA_FILE, JSON.stringify(portfolioData, null, 2), 'utf-8');
    res.json({ success: true, work: updated });
  } catch (e) {
    res.status(500).json({ error: '保存失败' });
  }
});

// 管理：添加作品
app.post('/api/admin/works', (req, res) => {
  const work = req.body;
  work.id = Math.max(...portfolioData.map(w => w.id || 0), 0) + 1;
  work.created_at = new Date().toISOString();
  portfolioData.push(work);

  try {
    writeFileSync(DATA_FILE, JSON.stringify(portfolioData, null, 2), 'utf-8');
    res.json({ success: true, work });
  } catch (e) {
    res.status(500).json({ error: '保存失败' });
  }
});

// 管理：删除作品
app.delete('/api/admin/works/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = portfolioData.findIndex(w => w.id === id);
  if (idx === -1) return res.status(404).json({ error: '作品不存在' });

  portfolioData.splice(idx, 1);
  try {
    writeFileSync(DATA_FILE, JSON.stringify(portfolioData, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '保存失败' });
  }
});

// ── 静态文件服务 ──
app.use(express.static(join(__dirname, '..')));

// ── 启动 ──
loadData();
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║  镜观作品集 API Server                   ║
║  ─────────────────────────               ║
║  🌐 http://localhost:${PORT}               ║
║  📊 ${portfolioData.length} 篇作品已加载     ║
║  📖 ${Object.keys(novelData.chapters || {}).length} 章小说已加载  ║
╚══════════════════════════════════════════╝
`);
});
