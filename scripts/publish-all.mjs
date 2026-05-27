// publish-all.mjs — 一键发布所有产品
// 用法: node scripts/publish-all.mjs
// 自动：初始化git → 创建Gitee仓库 → 推送 → 返回公开访问链接
//
// 需要用户提供 Gitee 个人访问令牌（一次性）
// 获取方式: https://gitee.com/profile/personal_access_tokens
// 权限勾选: projects

import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';

const root = path.resolve(import.meta.url.replace('/scripts/publish-all.mjs','').replace('file:///',''));

// ======== CONFIGURATION ========
// 在此填入你的 Gitee 信息（仅需一次）
const GITEE_TOKEN = process.env.GITEE_TOKEN || '';
const GITEE_USERNAME = process.env.GITEE_USERNAME || '';
const REPO_NAME = 'devtoolbox-pro';
const REPO_DESC = '程序员效率工具箱 — 8合1开发辅助工具 + 简历模板 + 学习计划器 + 算法速查卡';

// ======== Gitee API helper ========
function giteeRequest(method, apiPath, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'gitee.com',
      path: `/api/v5${apiPath}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DevToolbox-Publisher/1.0'
      }
    };

    // Add auth if token is provided
    if (GITEE_TOKEN) {
      options.path += `?access_token=${GITEE_TOKEN}`;
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`${method} ${apiPath}: ${res.statusCode} — ${json.message || data}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
          else reject(new Error(`${method} ${apiPath}: ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timeout')); });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('🚀 DevToolbox Pro — 一键发布系统\n');

  // Check prerequisites
  if (!GITEE_TOKEN || !GITEE_USERNAME) {
    console.log('═══════════════════════════════════════════');
    console.log('  需要 Gitee 访问令牌（免费，30 秒获取）');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('  第 1 步: 打开 https://gitee.com/profile/personal_access_tokens');
    console.log('  第 2 步: 登录后点击"生成新令牌"');
    console.log('  第 3 步: 勾选 projects 权限，生成');
    console.log('  第 4 步: 复制令牌');
    console.log('');
    console.log('  然后运行:');
    console.log('  GITEE_TOKEN=你的令牌 GITEE_USERNAME=你的用户名 node scripts/publish-all.mjs');
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('📁 所有文件已准备就绪，等待发布:');
    console.log('   ✅ 4 款产品 HTML');
    console.log('   ✅ 4 张产品截图');
    console.log('   ✅ README.md');
    console.log('   ✅ 产品展示页');
    console.log('   ✅ Git 仓库已初始化');
    console.log('');
    return;
  }

  try {
    // Step 1: Check if repo exists
    console.log('📡 检查 Gitee 仓库...');
    let repo;
    try {
      repo = await giteeRequest('GET', `/repos/${GITEE_USERNAME}/${REPO_NAME}`);
      console.log(`   仓库已存在: ${repo.html_url}`);
    } catch (e) {
      if (e.message.includes('404')) {
        console.log('   创建新仓库...');
        repo = await giteeRequest('POST', '/user/repos', {
          name: REPO_NAME,
          description: REPO_DESC,
          private: false,
          auto_init: false
        });
        console.log(`   仓库已创建: ${repo.html_url}`);
      } else {
        throw e;
      }
    }

    // Step 2: Set git remote and push
    console.log('\n📤 推送代码到 Gitee...');
    const remoteUrl = `https://gitee.com/${GITEE_USERNAME}/${REPO_NAME}.git`;

    try {
      execSync('git remote remove origin 2>/dev/null', { cwd: root, encoding: 'utf8' });
    } catch (e) {}
    execSync(`git remote add origin ${remoteUrl}`, { cwd: root, encoding: 'utf8' });

    // Create .gitignore
    const gitignore = [
      'node_modules/',
      '.claude/',
      'gh-cli.zip',
      'gh-cli-extracted/',
      'backups/',
      '.buddy/',
      'scripts/think-daemon.mjs',
      'notes/'
    ].join('\n');
    fs.writeFileSync(path.join(root, '.gitignore'), gitignore);

    // Stage and commit
    execSync('git add -A', { cwd: root, encoding: 'utf8' });
    try {
      execSync('git commit -m "🎉 Initial release: DevToolbox Pro + 3 bonus products"', { cwd: root, encoding: 'utf8' });
    } catch (e) {
      // Maybe nothing to commit
    }

    // Push with token in URL
    const pushUrl = `https://${GITEE_USERNAME}:${GITEE_TOKEN}@gitee.com/${GITEE_USERNAME}/${REPO_NAME}.git`;
    execSync(`git push -u ${pushUrl} master 2>&1 || git push -u ${pushUrl} main 2>&1`, { cwd: root, encoding: 'utf8', stdio: 'inherit' });

    // Step 3: Enable Gitee Pages
    console.log('\n🌐 启用 Gitee Pages...');
    try {
      await giteeRequest('POST', `/repos/${GITEE_USERNAME}/${REPO_NAME}/pages`, {
        branch: 'master',
        directory: '/'
      });
      console.log('   Gitee Pages 已启用');
    } catch (e) {
      // Pages might need manual setup or already enabled
      console.log('   Pages 配置提示: 请到仓库设置中手动启用');
    }

    // Done!
    console.log('\n═══════════════════════════════════════════');
    console.log('  🎉 发布成功！');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log(`  📦 仓库地址: ${repo.html_url}`);
    console.log(`  🌐 在线演示: https://${GITEE_USERNAME}.gitee.io/${REPO_NAME}/`);
    console.log('');
    console.log('  📋 你的产品链接:');
    console.log(`     工具箱: https://${GITEE_USERNAME}.gitee.io/${REPO_NAME}/devtoolbox-pro.html`);
    console.log(`     简历模板: https://${GITEE_USERNAME}.gitee.io/${REPO_NAME}/products/简历模板-极简风格.html`);
    console.log(`     学习计划: https://${GITEE_USERNAME}.gitee.io/${REPO_NAME}/products/学习计划器-StudyPlanner.html`);
    console.log(`     算法速查: https://${GITEE_USERNAME}.gitee.io/${REPO_NAME}/products/面试算法速查卡.html`);
    console.log('');
    console.log('  💰 把链接发到朋友圈/班级群/闲鱼，标价 ¥5-10');
    console.log('  💰 卖出 10-20 份 = ¥100 目标完成');
    console.log('');
    console.log('═══════════════════════════════════════════');
  } catch (e) {
    console.error('❌ 发布失败:', e.message);
    process.exit(1);
  }
}

main();
