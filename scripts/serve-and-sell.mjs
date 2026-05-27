// serve-and-sell.mjs — 本地销售服务器
// 启动后在同一 WiFi/校园网下所有人都能访问
// 展示产品 → 买家选择 → 展示付款方式
// 用法: node scripts/serve-and-sell.mjs

import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

const root = path.resolve(import.meta.url.replace('/scripts/serve-and-sell.mjs','').replace('file:///',''));
const PORT = process.env.PORT || 8000;

// MIME types
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

// Product metadata
const PRODUCTS = [
  { id: 'devtoolbox', name: 'DevToolbox Pro 程序员工具箱', file: 'devtoolbox-pro.html', price: '¥9.9', icon: '🛠', desc: 'JSON格式化/Base64/正则/时间戳/UUID/颜色工具 八合一' },
  { id: 'resume', name: '极简简历模板', file: 'products/简历模板-极简风格.html', price: '¥5.9', icon: '📄', desc: 'A4纸直接打印，浏览器打开可编辑，适合找实习/秋招' },
  { id: 'planner', name: '考前冲刺计划器', file: 'products/学习计划器-StudyPlanner.html', price: '¥5.9', icon: '📚', desc: '番茄钟+任务管理+艾宾浩斯复习提醒，期末必备' },
  { id: 'algo', name: '面试算法速查卡', file: 'products/面试算法速查卡.html', price: '¥5.9', icon: '⚡', desc: '20+核心算法模板，排序/DP/图论/系统设计，面试前速查' },
];

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const [name, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        ips.push({ name, ip: addr.address });
      }
    }
  }
  return ips;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // API: product list
  if (url.pathname === '/api/products') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(PRODUCTS.map(p => ({ ...p, file: undefined }))));
    return;
  }

  // API: buy (just records the request)
  if (url.pathname === '/api/buy' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const order = JSON.parse(body || '{}');
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const log = `[${ts}] ORDER: ${order.product} | Buyer: ${order.buyer || 'anonymous'}\n`;
      fs.appendFileSync(path.join(root, 'orders.log'), log);
      console.log(`💰 新订单: ${order.product} — ${order.buyer || '匿名买家'}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: '请通过微信/支付宝付款后联系发货' }));
    });
    return;
  }

  // Serve static files
  let filePath = url.pathname === '/' ? '/products/产品展示页.html' : url.pathname;
  filePath = path.join(root, filePath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Try as directory
        try {
          const indexData = fs.readFileSync(path.join(filePath, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(indexData);
        } catch (e) {
          res.writeHead(404);
          res.end('Not Found');
        }
      } else {
        res.writeHead(500);
        res.end('Internal Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  🛍  DevToolbox 销售服务器已启动');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('  📱 同一WiFi/校园网下，其他人访问:');
  ips.forEach(({ name, ip }) => {
    console.log(`     http://${ip}:${PORT}/  (${name})`);
  });
  console.log('');
  console.log('  🖥  本机访问: http://localhost:${PORT}/');
  console.log('');
  console.log('  在售产品:');
  PRODUCTS.forEach(p => {
    console.log(`     ${p.icon} ${p.name} — ${p.price}`);
  });
  console.log('');
  console.log('  💡 把上面的链接发到班级群/朋友圈，同学直接打开就能看产品和下单');
  console.log('  📋 订单记录: orders.log');
  console.log('');
  console.log('  Ctrl+C 停止服务器');
  console.log('═══════════════════════════════════════════');
  console.log('');
});
