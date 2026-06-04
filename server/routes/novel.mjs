/**
 * 小说路由 — /api/novel/status, /api/novel/chapter/:date
 * 挂载点: index.mjs → app.use('/api', router)
 */
import { Router } from 'express';
import { getNovelStatus, getChapter } from '../db.mjs';

const router = Router();

// ── GET /api/novel/status ──
router.get('/novel/status', async (_req, res) => {
  try {
    const status = await getNovelStatus();
    res.json(status);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/novel/chapter/:date ──
router.get('/novel/chapter/:date', async (req, res) => {
  try {
    const chapter = await getChapter(req.params.date);
    if (!chapter) return res.status(404).json({ error: '章节不存在' });
    res.json(chapter);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
