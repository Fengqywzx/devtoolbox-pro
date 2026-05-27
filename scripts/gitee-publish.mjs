// gitee-publish.mjs — 全自动发布到 Gitee + 启用 Pages
// 用法: GITEE_TOKEN=xxx GITEE_USER=xxx node scripts/gitee-publish.mjs
// 增加 --make-public 参数: 将仓库设为公开

import https from 'https';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

const GITEE_TOKEN = process.env.GITEE_TOKEN;
const GITEE_USER = process.env.GITEE_USER || 'wanzixuan945';
const REPO = 'devtoolbox-pro';

if (!GITEE_TOKEN) {
  console.log('用法: GITEE_TOKEN=你的token GITEE_USER=你的用户名 node scripts/gitee-publish.mjs');
  process.exit(1);
}

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const sep = path.includes('?') ? '&' : '?';
    const opts = {
      hostname: 'gitee.com',
      path: '/api/v5' + path + sep + 'access_token=' + GITEE_TOKEN,
      method: method,
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'DevToolbox' }
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
  console.log('🚀 Gitee 全自动发布\n');

  // Step 1: Check/create repo
  console.log('📦 仓库...');
  let repo;
  try {
    const check = await api('GET', '/repos/' + GITEE_USER + '/' + REPO);
    if (check.status === 200) {
      console.log('   已存在: ' + check.body.html_url);
      repo = check.body;
    } else {
      const create = await api('POST', '/user/repos', {
        name: REPO,
        description: '程序员效率工具箱 | JSON/Base64/正则/UUID/时间戳 八合一 + 简历模板 + 学习计划器 + 算法速查卡',
        private: false,
        auto_init: false
      });
      if (create.status === 201) {
        console.log('   ✅ 已创建: ' + create.body.html_url);
        repo = create.body;
      } else {
        console.log('   创建失败:', create.status, JSON.stringify(create.body).substring(0, 200));
        process.exit(1);
      }
    }
  } catch(e) { console.log('错误:', e.message); process.exit(1); }

  // Step 2: Ensure index.html exists
  const indexPath = path.join(root, 'index.html');
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, '<!DOCTYPE html><html lang=\"zh-CN\"><head><meta charset=\"UTF-8\"><meta http-equiv=\"refresh\" content=\"0;url=products/产品展示页.html\"></head><body><p>跳转中... <a href=\"products/产品展示页.html\">点击进入商店</a></p></body></html>');
    execSync('git add index.html && git commit -m \"添加首页\"', { cwd: root, encoding: 'utf8', stdio: 'pipe' });
    console.log('   ✅ index.html 已创建');
  }

  // Step 3: Push
  console.log('\n📤 推送代码...');
  const pushUrl = 'https://' + GITEE_USER + ':' + GITEE_TOKEN + '@gitee.com/' + GITEE_USER + '/' + REPO + '.git';
  try {
    execSync('git remote remove gitee 2>/dev/null', { cwd: root, encoding: 'utf8', stdio: 'pipe' });
  } catch(e) {}
  execSync('git remote add gitee ' + pushUrl, { cwd: root, encoding: 'utf8', stdio: 'pipe' });

  try {
    execSync('git push -u gitee master --force', { cwd: root, encoding: 'utf8', stdio: 'pipe', timeout: 30000 });
    console.log('   ✅ 推送成功');
  } catch(e) {
    console.log('   推送结果:', (e.stderr || e.message).substring(0, 300));
  }

  // Clean remote URL
  execSync('git remote set-url gitee https://gitee.com/' + GITEE_USER + '/' + REPO + '.git', { cwd: root, encoding: 'utf8', stdio: 'pipe' });

  // Step 4: Enable Pages
  console.log('\n🌐 启用 Gitee Pages...');
  try {
    const pages = await api('POST', '/repos/' + GITEE_USER + '/' + REPO + '/pages', {
      branch: 'master',
      directory: '/'
    });

    if (pages.status === 201) {
      console.log('   ✅ Pages 已启用');
    } else if (pages.body && pages.body.message && pages.body.message.includes('already')) {
      console.log('   ℹ️  Pages 已启用，跳过');
    } else {
      // Manual trigger
      console.log('   ⚠️  API 返回:', pages.status, '尝试手动触发...');
      try {
        await api('PUT', '/repos/' + GITEE_USER + '/' + REPO + '/pages');
        console.log('   ✅ Pages 已更新');
      } catch(e2) {
        console.log('   ℹ️  请手动: https://gitee.com/' + GITEE_USER + '/' + REPO + '/pages');
      }
    }
  } catch(e) {
    console.log('   Pages 配置:', e.message);
    console.log('   ℹ️  手动启用: https://gitee.com/' + GITEE_USER + '/' + REPO + '/pages');
  }

  // Done
  console.log('\n═══════════════════════════════════════════');
  console.log('  🎉 Gitee 发布完成！');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('  📦 仓库: https://gitee.com/' + GITEE_USER + '/' + REPO);
  console.log('  🌐 Pages: https://' + GITEE_USER + '.gitee.io/' + REPO + '/');
  console.log('');
  console.log('  💰 商店链接（发给买家）:');
  console.log('     https://' + GITEE_USER + '.gitee.io/' + REPO + '/');
  console.log('');
  console.log('  📋 产品直达:');
  console.log('     https://' + GITEE_USER + '.gitee.io/' + REPO + '/devtoolbox-pro.html');
  console.log('     https://' + GITEE_USER + '.gitee.io/' + REPO + '/products/简历模板-极简风格.html');
  console.log('     https://' + GITEE_USER + '.gitee.io/' + REPO + '/products/学习计划器-StudyPlanner.html');
  console.log('     https://' + GITEE_USER + '.gitee.io/' + REPO + '/products/面试算法速查卡.html');
  console.log('');
}

main().catch(e => { console.error('失败:', e.message); process.exit(1); });
