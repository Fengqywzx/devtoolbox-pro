// 检查 Gitee 状态 + 尝试公开仓库 + 启用 Pages
import https from 'https';

const TOKEN = process.env.GITEE_TOKEN;
const USER = process.env.GITEE_USER || 'wanzixuan945';
const REPO = 'devtoolbox-pro';

if (!TOKEN) {
  console.log('用法: GITEE_TOKEN=xxx node scripts/gitee-check-and-fix.mjs');
  process.exit(1);
}

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
  console.log('=== Gitee 状态检查 ===\n');

  // 1. User info
  const u = await api('GET', '/user');
  console.log('账号:', u.body.login || u.body.name || USER);
  console.log('实名认证:', u.body.real_name_certified ? '✅ 已认证' : '❌ 未认证（Pages 需要认证）');
  console.log('2FA:', u.body.two_factor_enabled ? '✅ 已启用' : '❌ 未启用');

  // 2. Repo status
  console.log('');
  const r = await api('GET', '/repos/' + USER + '/' + REPO);
  console.log('仓库:', r.body.full_name || (USER + '/' + REPO));
  console.log('可见性:', r.body.private ? '🔒 私有' : '🌐 公开');
  console.log('URL:', r.body.html_url);

  // 3. Try to make public
  if (r.body.private) {
    console.log('\n尝试公开仓库...');
    const p = await api('PATCH', '/repos/' + USER + '/' + REPO, { private: false, name: REPO });
    if (p.status === 200 && !p.body.private) {
      console.log('  ✅ 仓库已公开！');
    } else {
      const msg = p.body.message || JSON.stringify(p.body);
      console.log('  ❌ 无法公开:', msg.substring(0, 200));
      if (msg.includes('安全评级')) {
        console.log('  💡 需要: Gitee 个人设置 → 绑定手机/微信/QQ 或启用2FA');
      }
    }
  }

  // 4. Pages status
  console.log('\nPages 状态...');
  try {
    const pg = await api('GET', '/repos/' + USER + '/' + REPO + '/pages');
    console.log('  Status:', pg.body.status || pg.status);
    if (pg.body.html_url) console.log('  URL:', pg.body.html_url);
  } catch(e) {
    console.log('  未启用或查询失败');
  }

  // 5. If public, try enable Pages
  const r2 = await api('GET', '/repos/' + USER + '/' + REPO);
  if (!r2.body.private) {
    console.log('\n尝试启用 Pages...');
    try {
      const ep = await api('POST', '/repos/' + USER + '/' + REPO + '/pages', {
        branch: 'master',
        directory: '/'
      });
      if (ep.status === 201) {
        console.log('  ✅ Pages 已启用！');
        console.log('  🌐 https://' + USER + '.gitee.io/' + REPO + '/');
      } else {
        console.log('  结果:', ep.status, JSON.stringify(ep.body).substring(0, 200));
      }
    } catch(e) {
      console.log('  错误:', e.message);
    }
  }

  console.log('\n=== 检查完成 ===');
}

main().catch(e => console.error(e.message));
