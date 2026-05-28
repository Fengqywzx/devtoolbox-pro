// 通过 GitHub Contents API 更新 devtoolbox-pro.html
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const TOKEN = process.env.GITHUB_TOKEN;
const USER = process.env.GITHUB_USER || 'Fengqywzx';
const REPO = 'devtoolbox-pro';

if (!TOKEN) {
  console.log('用法: GITHUB_TOKEN=xxx node scripts/github-update-file.mjs');
  process.exit(1);
}

function api(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.github.com',
      path: apiPath,
      method,
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'DevToolbox',
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const filePath = path.join(root, 'devtoolbox-pro.html');
  const content = fs.readFileSync(filePath, 'utf8');
  const base64 = Buffer.from(content).toString('base64');

  console.log('更新 devtoolbox-pro.html (' + (content.length / 1024).toFixed(1) + ' KB)...');

  // Get current file SHA
  let sha = null;
  try {
    const get = await api('GET', '/repos/' + USER + '/' + REPO + '/contents/devtoolbox-pro.html');
    if (get.status === 200) {
      sha = get.body.sha;
      console.log('  已有文件 SHA:', sha.substring(0, 7));
    }
  } catch(e) {}

  // Update or create
  const payload = {
    message: 'devtoolbox-pro升级: 8工具→14工具 + 暗亮主题 + 键盘快捷键 + JWT/哈希/SQL/代码美化/QR/Markdown',
    content: base64,
    branch: 'master'
  };
  if (sha) payload.sha = sha;

  const result = await api('PUT', '/repos/' + USER + '/' + REPO + '/contents/devtoolbox-pro.html', payload);

  if (result.status === 200 || result.status === 201) {
    console.log('   ✅ 已更新:', result.body.content?.html_url || result.body.commit?.html_url);
    console.log('');
    console.log('  🌐 GitHub Pages: https://' + USER + '.github.io/' + REPO + '/devtoolbox-pro.html');
  } else {
    console.log('   ❌ 失败:', result.status, JSON.stringify(result.body).substring(0, 300));
  }
}

main().catch(e => console.error(e.message));
