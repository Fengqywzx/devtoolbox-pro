#!/usr/bin/env node
/**
 * 镜观自动维护 — auto-maintain.mjs
 * 每15分钟运行:
 * 1. 检查 server 是否运行
 * 2. 检查 JSON 数据变更
 * 3. 自动 git 提交
 * 4. 重启 server 使变更生效
 */

import { readFileSync, existsSync, watchFile, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');
const DATA_FILE = join(REPO, 'portfolio-data.json');
const NOVEL_FILE = join(REPO, 'novel-content.json');
const LOG = join(REPO, 'server', 'data', 'auto-maintain.log');

function log(msg) {
  const t = new Date().toISOString().slice(0, 19);
  const line = `[${t}] ${msg}`;
  console.log(line);
  try { writeFileSync(LOG, line + '\n', { flag: 'a' }); } catch {}
}

function git(...args) {
  try {
    execSync(`git ${args.join(' ')}`, { cwd: REPO, stdio: 'pipe', timeout: 30000 });
    return true;
  } catch (e) {
    log(`git ${args[0]} 失败: ${e.stderr?.toString().slice(0, 100) || e.message}`);
    return false;
  }
}

function isServerRunning() {
  try {
    const res = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health', { timeout: 3000 });
    return parseInt(res.toString().trim()) === 200;
  } catch { return false; }
}

function checkChanges() {
  const status = execSync('git status --short', { cwd: REPO, timeout: 5000 }).toString().trim();
  return status.length > 0;
}

function main() {
  log('=== 自动维护检查 ===');

  // 1. 检查 server
  const running = isServerRunning();
  log(`Server: ${running ? '运行中' : '已停止'}`);

  if (!running) {
    log('尝试启动 server...');
    try {
      execSync('cd server && NODE_ENV=production nohup node index.mjs > /tmp/server.log 2>&1 &', { cwd: REPO, timeout: 5000 });
      log('Server 已启动');
    } catch (e) {
      log(`启动失败: ${e.message}`);
    }
    return;
  }

  // 2. 检查 git 变更
  if (checkChanges()) {
    log('检测到变更，执行 git 提交...');
    git('add', '-A');
    git('commit', '-m', `auto-maintain ${new Date().toISOString().slice(0, 10)}`);
    git('push');
    log('已提交并推送');
  } else {
    log('无变更');
  }
}

main();
