/**
 * 订单/联系路由 — /api/orders
 * 挂载点: index.mjs → app.use('/api', router)
 */
import { Router } from 'express';
import { createOrder, getOrders, getOrder, updateOrder, deleteOrder } from '../db.mjs';

const router = Router();

// ── POST /api/orders ──
// 提交新订单
router.post('/orders', async (req, res) => {
  try {
    const { client_name, client_contact, project_type, description, budget, deadline } = req.body;

    // 必填字段验证
    if (!client_name || !client_contact) {
      return res.status(400).json({ error: 'client_name 和 client_contact 为必填项' });
    }

    const order = await createOrder({ client_name, client_contact, project_type, description, budget, deadline });
    res.status(201).json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/orders ──
// 订单列表（管理用）
router.get('/orders', async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const result = await getOrders({ status, page, limit });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/orders/:id ──
// 单条订单详情
router.get('/orders/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const order = await getOrder(id);
    if (!order) return res.status(404).json({ error: '订单不存在' });
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── PUT /api/orders/:id ──
// 更新订单（状态、备注等）
router.put('/orders/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, notes } = req.body;
    const order = await updateOrder(id, { status, notes });
    if (!order) return res.status(404).json({ error: '订单不存在' });
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── DELETE /api/orders/:id ──
// 删除订单
router.delete('/orders/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const ok = await deleteOrder(id);
    if (!ok) return res.status(404).json({ error: '订单不存在' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
