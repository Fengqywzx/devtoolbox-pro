/**
 * 作品集路由 — /api/works, /api/stats, /api/types
 * 挂载点: index.mjs → app.use('/api', router)
 */
import { Router } from 'express';
import { getWorks, getWork, getStats, getTypes } from '../db.mjs';

const router = Router();

// ── GET /api/works ──
// 作品列表（分页 + 筛选 + 搜索 + 排序）
router.get('/works', async (req, res) => {
  try {
    const { page, limit, grade, type, search, sort } = req.query;
    const result = await getWorks({ page, limit, grade, type, search, sort });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/works/:id ──
// 单篇作品全文
router.get('/works/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const work = await getWork(id);
    if (!work) return res.status(404).json({ error: '作品不存在' });
    res.json(work);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/stats ──
// 作品统计（总数、最高分、平均分、类型/等级分布）
router.get('/stats', async (_req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/types ──
// 作品类型列表（附带各类型数量）
router.get('/types', async (_req, res) => {
  try {
    const types = await getTypes();
    res.json(types);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
