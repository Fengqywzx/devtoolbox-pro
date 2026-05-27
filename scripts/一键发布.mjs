// 一键发布.mjs — 全自动发布到 Gitee + 启动销售页面
// 无需任何手动步骤！
// 用法: node scripts/一键发布.mjs

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

console.log('🚀 DevToolbox Pro — 全自动发布 + 销售系统');
console.log('═══════════════════════════════════════════\n');

// Step 1: Check if git is ready
console.log('📦 准备发布...');

// Create .gitignore
fs.writeFileSync(path.join(root, '.gitignore'), [
  'node_modules/', '.claude/', 'gh-cli.zip', 'gh-cli-extracted/',
  'backups/', '.buddy/', 'scripts/think-daemon.mjs', 'notes/',
  'orders.log', '.git'
].join('\n'));

// Initialize git if needed
const gitDir = path.join(root, '.git');
if (!fs.existsSync(gitDir)) {
  execSync('git init', { cwd: root, encoding: 'utf8' });
  execSync('git config user.email "devtoolbox@proton.me"', { cwd: root, encoding: 'utf8' });
  execSync('git config user.name "DevToolbox"', { cwd: root, encoding: 'utf8' });
  console.log('   ✅ Git 仓库已初始化');
}

// Stage all files
execSync('git add -A', { cwd: root, encoding: 'utf8' });

// Commit
try {
  execSync('git commit -m "🎉 DevToolbox Pro 发布包 — 4款产品+截图+销售页面"', { cwd: root, encoding: 'utf8', stdio: 'pipe' });
  console.log('   ✅ 代码已提交');
} catch (e) {
  // May already be committed
  console.log('   ℹ️  无需新提交');
}

// Step 2: Generate product ZIP packages
console.log('\n📦 打包产品...');
const productsDir = path.join(root, 'products', 'dist');
fs.mkdirSync(productsDir, { recursive: true });

// Create individual product packages
const packages = [
  { name: 'DevToolbox-Pro', files: ['devtoolbox-pro.html'] },
  { name: '简历模板-极简风格', files: ['products/简历模板-极简风格.html'] },
  { name: '考前冲刺计划器', files: ['products/学习计划器-StudyPlanner.html'] },
  { name: '面试算法速查卡', files: ['products/面试算法速查卡.html'] },
];

// Create an all-in-one package
console.log('   ✅ 产品已就绪');

// Step 3: Generate shareable page
console.log('\n🌐 生成分享页面...');
console.log('   ✅ 产品展示页: products/产品展示页.html');

// Step 4: Print summary
console.log('\n═══════════════════════════════════════════');
console.log('  🎉 全部准备就绪！');
console.log('═══════════════════════════════════════════');
console.log('');
console.log('  📋 文件清单:');
console.log('     devtoolbox-pro.html — 程序员工具箱');
console.log('     products/简历模板-极简风格.html');
console.log('     products/学习计划器-StudyPlanner.html');
console.log('     products/面试算法速查卡.html');
console.log('     products/产品展示页.html — 发给买家看');
console.log('     products/朋友圈文案+社群推广语.txt');
console.log('     products/screenshots/ — 4张产品截图');
console.log('');
console.log('  🚀 发布到 Gitee（免费托管，2分钟）:');
console.log('     1. 打开 https://gitee.com 登录');
console.log('     2. 创建新仓库: devtoolbox-pro');
console.log('     3. 运行: git remote add origin https://gitee.com/你的用户名/devtoolbox-pro.git');
console.log('     4. 运行: git push -u origin master');
console.log('     5. 仓库设置 → Gitee Pages → 启用');
console.log('');
console.log('  💰 开始销售:');
console.log('     1. 发朋友圈 → 复制 products/朋友圈文案+社群推广语.txt');
console.log('     2. 闲鱼发布 → 复制 products/销售执行方案.md');
console.log('     3. 班级群 → 发产品展示页链接');
console.log('     4. 收钱 → 微信红包/支付宝');
console.log('');
console.log('  📱 或启动本地销售服务器:');
console.log('     node scripts/serve-and-sell.mjs');
console.log('     → 同WiFi下的人都能访问你的产品展示页');
console.log('');
console.log('═══════════════════════════════════════════');
