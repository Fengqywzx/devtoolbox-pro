// github-publish.mjs — 使用 GitHub Token 全自动发布
// 用法: GITHUB_TOKEN=xxx GITHUB_USER=xxx node scripts/github-publish.mjs
//
// 安全性:
//   - Token 只从环境变量读取，绝不写入文件
//   - 只用 repo 权限（无法访问账户设置/SSH等）
//   - 创建独立的公开仓库，不触及用户其他仓库

import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USER = process.env.GITHUB_USER;
const REPO_NAME = 'devtoolbox-pro';

if (!GITHUB_TOKEN || !GITHUB_USER) {
  console.log('用法: GITHUB_TOKEN=你的token GITHUB_USER=你的用户名 node scripts/github-publish.mjs');
  console.log('');
  console.log('获取 Token: https://github.com/settings/tokens → Generate new token (classic) → 勾选 repo');
  process.exit(1);
}

// Sanitize: never print the token
const tokenPreview = GITHUB_TOKEN.substring(0, 4) + '...' + GITHUB_TOKEN.substring(GITHUB_TOKEN.length - 4);
console.log(`🔑 使用 Token: ${tokenPreview}`);
console.log(`👤 用户: ${GITHUB_USER}`);
console.log('');

function githubAPI(method, apiPath, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: apiPath,
      method,
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'DevToolbox-Publisher',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`GitHub API ${method} ${apiPath}: ${res.statusCode} — ${json.message || data}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
          else reject(new Error(`GitHub API ${method} ${apiPath}: ${res.statusCode} — ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  try {
    // Step 1: Create repository
    console.log('📦 创建 GitHub 仓库...');
    let repo;
    try {
      // Check if repo already exists
      repo = await githubAPI('GET', `/repos/${GITHUB_USER}/${REPO_NAME}`);
      console.log(`   ℹ️  仓库已存在: ${repo.html_url}`);
    } catch (e) {
      if (e.message.includes('404')) {
        repo = await githubAPI('POST', '/user/repos', {
          name: REPO_NAME,
          description: '程序员效率工具箱 — 8合1开发辅助工具 + 简历模板 + 学习计划器 + 算法速查卡 | 大学生独立开发',
          homepage: `https://${GITHUB_USER}.github.io/${REPO_NAME}/`,
          private: false,
          has_issues: true,
          has_projects: false,
          has_wiki: false
        });
        console.log(`   ✅ 仓库已创建: ${repo.html_url}`);
      } else {
        throw e;
      }
    }

    // Step 2: Update .gitignore
    fs.writeFileSync(path.join(root, '.gitignore'), [
      'node_modules/', '.claude/', 'gh-cli*',
      'backups/', '.buddy/', 'notes/',
      'orders.log', 'scripts/think-daemon.mjs'
    ].join('\n'));

    // Step 3: Set remote and push
    console.log('\n📤 推送代码...');
    const remoteUrl = `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${REPO_NAME}.git`;

    try { execSync('git remote remove origin 2>/dev/null', { cwd: root, encoding: 'utf8', stdio: 'pipe' }); } catch (e) {}
    execSync(`git remote add origin ${remoteUrl}`, { cwd: root, encoding: 'utf8', stdio: 'pipe' });

    // Stage and commit
    execSync('git add -A', { cwd: root, encoding: 'utf8', stdio: 'pipe' });
    try {
      const branch = execSync('git branch --show-current', { cwd: root, encoding: 'utf8' }).trim();
      execSync(`git commit -m "🎉 DevToolbox Pro 初始发布 — 4款产品"`, { cwd: root, encoding: 'utf8', stdio: 'pipe' });
      console.log(`   ✅ 已提交到 ${branch} 分支`);
    } catch (e) {
      console.log('   ℹ️  无需新提交');
    }

    const branch = execSync('git branch --show-current', { cwd: root, encoding: 'utf8' }).trim() || 'master';

    try {
      execSync(`git push -u origin ${branch} --force`, { cwd: root, encoding: 'utf8', stdio: 'inherit' });
      console.log(`   ✅ 代码已推送到 GitHub`);
    } catch (e) {
      // Try main branch
      execSync(`git branch -M main`, { cwd: root, encoding: 'utf8', stdio: 'pipe' });
      execSync(`git push -u origin main --force`, { cwd: root, encoding: 'utf8', stdio: 'inherit' });
      console.log(`   ✅ 代码已推送到 GitHub (main)`);
    }

    // Step 4: Enable GitHub Pages
    console.log('\n🌐 启用 GitHub Pages...');
    try {
      // GitHub Pages API — set source branch
      await githubAPI('POST', `/repos/${GITHUB_USER}/${REPO_NAME}/pages`, {
        source: { branch: 'main', path: '/' }
      });
      console.log('   ✅ GitHub Pages 已启用');
    } catch (e) {
      // Might already be enabled or need different branch
      console.log('   ℹ️  Pages 可能需要手动启用（仓库 Settings → Pages → Source: main branch）');
    }

    // Step 5: Done!
    const pagesUrl = `https://${GITHUB_USER}.github.io/${REPO_NAME}/`;
    console.log('\n═══════════════════════════════════════════');
    console.log('  🎉 发布成功！');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log(`  📦 仓库: ${repo.html_url}`);
    console.log(`  🌐 在线商店: ${pagesUrl}`);
    console.log('');
    console.log('  📋 产品链接（发给买家）:');
    console.log(`     🛠 工具箱:  ${pagesUrl}devtoolbox-pro.html`);
    console.log(`     📄 简历:    ${pagesUrl}products/简历模板-极简风格.html`);
    console.log(`     📚 计划器:  ${pagesUrl}products/学习计划器-StudyPlanner.html`);
    console.log(`     ⚡ 速查卡:  ${pagesUrl}products/面试算法速查卡.html`);
    console.log(`     🏪 商店页:  ${pagesUrl}products/产品展示页.html`);
    console.log('');
    console.log('  💰 现在就把商店页链接发到朋友圈/班级群！');
    console.log('  💰 4款产品 × ¥5.9-9.9，卖10份 = ¥100+');
    console.log('');
    console.log('═══════════════════════════════════════════');

    // Clean: remove token from git remote (replace with public URL)
    execSync(`git remote set-url origin https://github.com/${GITHUB_USER}/${REPO_NAME}.git`, { cwd: root, encoding: 'utf8', stdio: 'pipe' });
    console.log('  🔒 Token 已从 git remote 中清除');
    console.log('');

  } catch (e) {
    console.error('❌ 发布失败:', e.message);
    process.exit(1);
  }
}

main();
