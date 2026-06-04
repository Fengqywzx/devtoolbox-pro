/**
 * 管理路由 — /api/admin/seed, /api/admin/settings, /api/admin/health
 * 挂载点: index.mjs → app.use('/api', router)
 */
import { Router } from 'express';
import { seedFromJson, getSetting, setSetting, getHealth, initDB } from '../db.mjs';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

// ── POST /api/admin/seed ──
// 从 JSON 文件重新导入数据（热重载）
router.post('/admin/seed', async (_req, res) => {
  try {
    const dataFile = process.env.DATA_FILE || join(__dirname, '..', '..', 'portfolio-data.json');
    const novelFile = process.env.NOVEL_DATA_FILE || join(__dirname, '..', '..', 'novel-content.json');

    let works = [];
    let chapters = {};
    try { works = JSON.parse(readFileSync(dataFile, 'utf-8')); } catch (e) { return res.status(400).json({ error: `读取作品数据失败: ${e.message}` }); }
    try { chapters = JSON.parse(readFileSync(novelFile, 'utf-8')); } catch (e) { /* novel file optional */ }

    const result = await seedFromJson(works, chapters);
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/admin/settings/:key ──
// 读取设置项
router.get('/admin/settings/:key', async (req, res) => {
  try {
    const value = await getSetting(req.params.key);
    res.json({ key: req.params.key, value });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── PUT /api/admin/settings/:key ──
// 写入设置项
router.put('/admin/settings/:key', async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ error: 'value 为必填项' });
    }
    await setSetting(req.params.key, value);
    res.json({ success: true, key: req.params.key, value });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/admin/health ──
// 详细健康检查
router.get('/admin/health', async (_req, res) => {
  try {
    const health = await getHealth();
    res.json(health);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
