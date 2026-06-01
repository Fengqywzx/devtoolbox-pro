// buddy-server.mjs — 本地宠物服务器
// 用法: node scripts/buddy-server.mjs [端口，默认8000]
// 支持: 静态文件 + pet-state.json 读写

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const port = parseInt(process.argv[2]) || 8000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
}

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${port}`);
  const filePath = path.join(root, url.pathname);

  // PUT: 保存 pet-state.json
  if (req.method === 'PUT' && url.pathname === '/.buddy/pet-state.json') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        JSON.parse(body); // 验证 JSON
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, body, 'utf-8');
        console.log('✅ pet-state.json 已同步保存');
        res.writeHead(200);
        res.end('OK');
      } catch (e) {
        console.error('保存失败:', e.message);
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
    return;
  }

  // GET: 静态文件
  serveFile(res, filePath);
});

server.listen(port, () => {
  console.log(`\n🐱 Buddy Pet 服务器已启动！`);
  console.log(`   地址: http://localhost:${port}/buddy-pet.html`);
  console.log(`   存档: http://localhost:${port}/.buddy/pet-state.json`);
  console.log(`   💡 关闭浏览器前点「💾 导出」备份存档`);
  console.log(`   💡 换浏览器后用「📥 导入」恢复存档\n`);
});
