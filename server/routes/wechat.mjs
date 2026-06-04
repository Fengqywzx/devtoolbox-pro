#!/usr/bin/env node
/**
 * 微信支付 Native (QR Code) 路由 — 镜观文案
 *
 * ── 工作模式 ──
 * 1. REAL MODE: 设置环境变量 WECHAT_MERCHANT_ID、WECHAT_API_KEY、WECHAT_APPID
 *    后自动启用真实微信支付 Native API 调用。
 * 2. MOCK MODE: 未配置时自动进入模拟模式，返回虚假二维码信息用于开发/演示。
 *
 * ── 接入真实微信支付 ──
 * 当获得微信商户号后:
 *   1. 安装 `wechat-pay-sdk` 或使用原生 axios 调微信支付 API
 *   2. 设置环境变量 (见下方)
 *   3. 取消注释 REAL MODE 部分的 SDK 调用代码
 *   4. MOCK MODE 代码可保留作为 fallback 或开发环境使用
 *
 * 微信 Native Pay 官方文档:
 *   https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_4_1.shtml
 */
import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

// ── 配置 ──
const CONFIG = {
  // 真实商户配置 (从环境变量读取)
  merchantId: process.env.WECHAT_MERCHANT_ID || '',
  apiKey: process.env.WECHAT_API_KEY || '',
  appId: process.env.WECHAT_APPID || '',
  // 回调地址 — 部署后需改为公网可访问地址
  notifyUrl: process.env.WECHAT_NOTIFY_URL || 'https://your-domain.com/api/wechat/pay/notify',

  // Mock 模式配置
  mockQrBaseUrl: process.env.MOCK_QR_URL || 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=',
};

// 是否已配置真实微信支付
const isConfigured = !!(CONFIG.merchantId && CONFIG.apiKey && CONFIG.appId);

// ── 内存订单存储 (生产环境应使用数据库) ──
const orders = new Map();

/**
 * 生成订单号: yyyyMMdd + 8位随机数字
 */
function generateOrderId() {
  const now = new Date();
  const date = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `JG${date}${rand}`;
}

/**
 * 微信支付签名 (HMAC-SHA256)
 * 真实模式中用于请求微信支付的签名
 */
function sign(data, key) {
  const sorted = Object.keys(data).sort();
  const str = sorted.map(k => `${k}=${data[k]}`).join('&') + `&key=${key}`;
  return crypto.createHmac('sha256', key).update(str).digest('hex').toUpperCase();
}

/**
 * 生成模拟支付二维码
 * 在 mock 模式下，生成一个包含订单信息的 QR 码便于演示
 */
function generateMockQr(orderId, amount, description) {
  const params = new URLSearchParams({
    orderId,
    amount: amount.toString(),
    description: description.substring(0, 30),
    mock: '1',
    timestamp: Date.now().toString()
  });
  // 使用 qrserver.com 生成二维码 (免费 API)
  const qrData = `https://mock.wechat.pay/order?${params.toString()}`;
  return `${CONFIG.mockQrBaseUrl}${encodeURIComponent(qrData)}`;
}

// ═══════════════════════════════════════════
//  API: GET /api/wechat/config
//  返回微信支付配置状态
// ═══════════════════════════════════════════
router.get('/wechat/config', (req, res) => {
  res.json({
    configured: isConfigured,
    mode: isConfigured ? 'real' : 'mock',
    appId: isConfigured ? CONFIG.appId : null,
    merchantId: isConfigured ? CONFIG.merchantId : null,
    // 前端基于此标志决定展示真实支付还是演示页面
    message: isConfigured
      ? '微信支付已配置'
      : '微信支付未配置，当前为模拟模式。配置 WECHAT_MERCHANT_ID、WECHAT_API_KEY、WECHAT_APPID 启用真实支付。'
  });
});

// ═══════════════════════════════════════════
//  API: POST /api/wechat/pay/order
//  创建支付订单，返回二维码 URL
//
//  请求体: { orderId, amount, description, clientName }
//  响应:   { success, code_url, orderId, mode }
// ═══════════════════════════════════════════
router.post('/wechat/pay/order', (req, res) => {
  try {
    const { orderId: existingId, amount, description, clientName } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: '金额无效，请提供大于0的金额'
      });
    }

    // 生成或复用订单号
    const orderId = existingId || generateOrderId();
    const totalAmount = Math.round(amount * 100); // 微信以分为单位

    // ── 真实模式: 调用微信 Native Pay API ──
    if (isConfigured) {
      /*
       * =========================================
       *  真实微信支付接入代码 (取消注释即可使用)
       * =========================================
       *
       * 需要安装: npm install axios xml2js (或 wechat-pay-sdk)
       *
       * const axios = require('axios');
       * const xml2js = require('xml2js');
       *
       * const wxPayData = {
       *   appid: CONFIG.appId,
       *   mch_id: CONFIG.merchantId,
       *   nonce_str: crypto.randomBytes(16).toString('hex'),
       *   body: (description || '文案服务').substring(0, 128),
       *   out_trade_no: orderId,
       *   total_fee: totalAmount,
       *   spbill_create_ip: req.ip || req.connection.remoteAddress || '127.0.0.1',
       *   notify_url: CONFIG.notifyUrl,
       *   trade_type: 'NATIVE'
       * };
       *
       * // 签名
       * wxPayData.sign = sign(wxPayData, CONFIG.apiKey);
       *
       * // 构建 XML
       * const builder = new xml2js.Builder({ rootName: 'xml', cdata: true });
       * const xmlData = builder.buildObject(wxPayData);
       *
       * // 调用微信支付统一下单 API
       * const wxResp = await axios.post('https://api.mch.weixin.qq.com/pay/unifiedorder', xmlData, {
       *   headers: { 'Content-Type': 'application/xml' }
       * });
       *
       * // 解析响应
       * const parser = new xml2js.Parser({ explicitArray: false });
       * const result = await parser.parseStringPromise(wxResp.data);
       * const xml = result.xml;
       *
       * if (xml.return_code === 'SUCCESS' && xml.result_code === 'SUCCESS') {
       *   // 保存订单状态
       *   orders.set(orderId, {
       *     orderId,
       *     amount: totalAmount,
       *     description,
       *     clientName,
       *     status: 'pending',
       *     createdAt: new Date().toISOString(),
       *     prepayId: xml.prepay_id
       *   });
       *
       *   return res.json({
       *     success: true,
       *     code_url: xml.code_url,
       *     orderId,
       *     mode: 'real',
       *     amount: totalAmount / 100
       *   });
       * } else {
       *   return res.status(500).json({
       *     success: false,
       *     error: `微信支付错误: ${xml.return_msg || xml.err_code_des || '未知错误'}`,
       *     mode: 'real'
       *   });
       * }
       */

      // ── 真实模式暂未接入 SDK, 返回提示 ──
      return res.status(501).json({
        success: false,
        error: '真实微信支付 SDK 尚未接入。请配置商户信息后取消注释 wechat.mjs 中的支付代码。',
        mode: 'real',
        orderId
      });
    }

    // ── 模拟模式: 生成虚假二维码 ──
    const codeUrl = generateMockQr(orderId, amount, description || '文案服务');

    // 保存订单
    orders.set(orderId, {
      orderId,
      amount: totalAmount,
      description,
      clientName,
      status: 'pending',
      createdAt: new Date().toISOString(),
      mock: true
    });

    return res.json({
      success: true,
      code_url: codeUrl,
      orderId,
      mode: 'mock',
      amount,
      // 模拟模式下同时返回支付演示页面的链接
      paymentPage: `/payment-demo.html?orderId=${orderId}&amount=${amount}`
    });

  } catch (err) {
    console.error('[WECHAT] 创建订单失败:', err);
    return res.status(500).json({
      success: false,
      error: '服务器内部错误，请稍后重试'
    });
  }
});

// ═══════════════════════════════════════════
//  API: POST /api/wechat/pay/notify
//  微信支付回调通知
//
//  真实模式: 微信服务器以 POST XML 形式调用此接口
//  模拟模式: 仅记录日志，可手动调用模拟支付成功
// ═══════════════════════════════════════════
router.post('/wechat/pay/notify', (req, res) => {
  /*
   * =========================================
   *  真实模式回调处理 (取消注释)
   * =========================================
   *
   * // 解析微信回调 XML
   * const parser = new xml2js.Parser({ explicitArray: false });
   * const result = await parser.parseStringPromise(req.body);
   * const xml = result.xml;
   *
   * // 验证签名
   * const receivedSign = xml.sign;
   * delete xml.sign;
   * const calculatedSign = sign(xml, CONFIG.apiKey);
   *
   * if (receivedSign !== calculatedSign) {
   *   console.error('[WECHAT] 签名验证失败');
   *   res.set('Content-Type', 'application/xml');
   *   return res.send(`<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[签名失败]]></return_msg></xml>`);
   * }
   *
   * if (xml.return_code === 'SUCCESS' && xml.result_code === 'SUCCESS') {
   *   const orderId = xml.out_trade_no;
   *   const transactionId = xml.transaction_id;
   *
   *   // 更新订单状态
   *   if (orders.has(orderId)) {
   *     const order = orders.get(orderId);
   *     order.status = 'paid';
   *     order.paidAt = new Date().toISOString();
   *     order.transactionId = transactionId;
   *     orders.set(orderId, order);
   *     console.log(`[WECHAT] 订单 ${orderId} 支付成功，微信订单号: ${transactionId}`);
   *   }
   * }
   *
   * // 响应微信服务器
   * res.set('Content-Type', 'application/xml');
   * res.send(`<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>`);
   */

  // 模拟模式: 仅记录收到的通知
  console.log('[WECHAT:NOTIFY] 收到支付回调 (mock)');
  console.log('[WECHAT:NOTIFY] Body:', typeof req.body === 'object' ? JSON.stringify(req.body) : req.body);

  // 如果请求体包含 orderId 和 status，模拟更新订单状态
  if (req.body && req.body.orderId && req.body.status === 'paid') {
    const orderId = req.body.orderId;
    if (orders.has(orderId)) {
      const order = orders.get(orderId);
      order.status = 'paid';
      order.paidAt = new Date().toISOString();
      orders.set(orderId, order);
      console.log(`[WECHAT:NOTIFY] 订单 ${orderId} 标记为已支付 (mock)`);
    }
  }

  // 模拟模式直接返回成功
  res.json({
    success: true,
    message: '回调已接收 (mock)'
  });
});

// ═══════════════════════════════════════════
//  API: GET /api/wechat/pay/status/:orderId
//  查询订单支付状态
// ═══════════════════════════════════════════
router.get('/wechat/pay/status/:orderId', (req, res) => {
  const { orderId } = req.params;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      error: '缺少订单号'
    });
  }

  const order = orders.get(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      error: '订单不存在',
      orderId
    });
  }

  // ── 真实模式: 可调用微信查单 API ──
  /*
   * =========================================
   *  真实模式查单 (取消注释)
   * =========================================
   *
   * 使用微信支付订单查询 API:
   *   GET https://api.mch.weixin.qq.com/pay/orderquery
   *   参数: appid, mch_id, out_trade_no, nonce_str, sign
   *
   * 返回订单真实状态后更新本地记录
   */

  return res.json({
    success: true,
    orderId: order.orderId,
    status: order.status,
    amount: order.amount / 100, // 转为元
    createdAt: order.createdAt,
    paidAt: order.paidAt || null,
    mode: order.mock ? 'mock' : 'real',
    // mock 模式下额外返回模拟支付链接以便前端演示
    mockPayUrl: order.mock ? `/api/wechat/pay/mock-pay/${order.orderId}` : null
  });
});

// ═══════════════════════════════════════════
//  API: POST /api/wechat/pay/mock-pay/:orderId
//  模拟支付成功 (仅 mock 模式可用)
//
//  用于开发测试：模拟用户扫码支付成功
// ═══════════════════════════════════════════
router.post('/wechat/pay/mock-pay/:orderId', (req, res) => {
  const { orderId } = req.params;

  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      error: '订单不存在'
    });
  }

  if (!order.mock) {
    return res.status(400).json({
      success: false,
      error: '真实订单不能通过模拟接口支付'
    });
  }

  if (order.status === 'paid') {
    return res.json({
      success: true,
      message: '订单已支付',
      orderId,
      status: 'paid'
    });
  }

  // 模拟支付成功
  order.status = 'paid';
  order.paidAt = new Date().toISOString();
  orders.set(orderId, order);

  console.log(`[WECHAT:MOCK] 订单 ${orderId} 模拟支付成功`);

  return res.json({
    success: true,
    message: '模拟支付成功',
    orderId,
    status: 'paid',
    paidAt: order.paidAt
  });
});

// ── 清理过期订单 (每10分钟运行一次, 仅清理内存中的mock订单) ──
setInterval(() => {
  const now = Date.now();
  const expireMs = 24 * 60 * 60 * 1000; // 24小时
  for (const [id, order] of orders.entries()) {
    const createdAt = new Date(order.createdAt).getTime();
    if (now - createdAt > expireMs) {
      orders.delete(id);
      console.log(`[WECHAT] 清理过期订单: ${id}`);
    }
  }
}, 10 * 60 * 1000);

export default router;
export { CONFIG, isConfigured };
