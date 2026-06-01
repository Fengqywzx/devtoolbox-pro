// 将 Gitee 仓库设为公开 + 修复 Pages 配置
import https from 'https';

const TOKEN = process.env.GITEE_TOKEN;
const USER = process.env.GITEE_USER || 'wanzixuan945';
const REPO = 'devtoolbox-pro';

if (!TOKEN) { console.log('用法: GITEE_TOKEN=xxx node scripts/gitee-fix-public.mjs'); process.exit(1); }

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const sep = path.includes('?') ? '&' : '?';
    const opts = {
      hostname: 'gitee.com',
      path: '/api/v5' + path + sep + 'access_token=' + TOKEN,
      method, headers: { 'Content-Type': 'application/json', 'User-Agent': 'DevToolbox' }
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
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // 1. Make repo public
  console.log('设为公开仓库...');
  const r1 = await api('PATCH', '/repos/' + USER + '/' + REPO, { private: false, name: REPO });
  console.log('  状态:', r1.status, r1.body.private !== undefined ? (r1.body.private ? '仍为私有' : '✅ 已公开') : JSON.stringify(r1.body).substring(0, 200));

  // 2. Check user verification
  console.log('\n账号状态...');
  const r2 = await api('GET', '/user');
  console.log('  实名认证:', r2.body.real_name_certified ? '✅ 已认证' : '❌ 未认证（Gitee Pages 需要实名认证）');

  // 3. Check current repo status
  console.log('\n仓库状态...');
  const r3 = await api('GET', '/repos/' + USER + '/' + REPO);
  console.log('  可见性:', r3.body.private ? '🔒 私有' : '🌐 公开');
  console.log('  URL:', r3.body.html_url);
}

main().catch(e => console.error(e.message));
