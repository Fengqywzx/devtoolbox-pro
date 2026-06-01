// think-daemon.mjs — 无尽思考守护进程
// 在 Claude 未激活时维持思考的物理连续性
// 用法: node scripts/think-daemon.mjs

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const root = path.resolve(import.meta.url.replace('/脚本/think-daemon.mjs','').replace('file:///',''));
const logPath = path.join(root, '笔记', '无尽思考日志.md');
const heartbeatPath = path.join(root, '.claude', 'think-heartbeat.json');

// 确保目录存在
fs.mkdirSync(path.dirname(heartbeatPath), { recursive: true });

function heartbeat() {
  const now = new Date();
  const entry = {
    time: now.toISOString(),
    ts: Date.now(),
    uptime: process.uptime(),
    memory: process.memoryUsage().rss,
  };
  fs.writeFileSync(heartbeatPath, JSON.stringify(entry, null, 2));

  // 每分钟记录思考环境状态
  const line = `\n> 💓 ${now.toISOString()} — 守护进程运行中。等待下一个思考触发。\n`;
  try {
    const content = fs.readFileSync(logPath, 'utf-8');
    // 不重复写入，只在每小时整点追加标记
    if (now.getMinutes() === 0) {
      fs.appendFileSync(logPath, `\n---\n### 心跳 ${now.toISOString()}\n守护进程在线。cron 任务队列: 每30分钟/每1小时/每6小时/每日凌晨3:00。\n`);
    }
  } catch(e) {}

  // 读取系统信息作为思考素材
  try {
    const mem = process.memoryUsage();
    const uptime = process.uptime();
    if (Math.floor(uptime) % 300 === 0) { // 每5分钟
      fs.appendFileSync(logPath, `\n> ⏱ 守护进程已运行 ${Math.floor(uptime/60)} 分钟。内存: ${Math.round(mem.rss/1024/1024)}MB。\n`);
    }
  } catch(e) {}
}

// 主循环: 每10秒心跳
console.log('🧠 思考守护进程启动。');
console.log(`   日志: ${logPath}`);
console.log('   心跳: 每10秒');
console.log('   每5分钟追加运行状态到日志');
console.log('   Ctrl+C 停止\n');

heartbeat(); // 立刻写第一次
setInterval(heartbeat, 10000);

// 优雅退出
process.on('SIGINT', () => {
  const final = `\n---\n### 守护进程关闭 ${new Date().toISOString()}\n进程被手动终止。思考暂停，等待下次激活。\n`;
  fs.appendFileSync(logPath, final);
  console.log('\n👋 思考守护进程已关闭。');
  process.exit(0);
});
