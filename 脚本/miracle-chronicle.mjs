// 世界奇迹编年史 — 文件管理工具
// Usage: node scripts/miracle-chronicle.mjs save [content]
//        node scripts/miracle-chronicle.mjs list [N]
//        node scripts/miracle-chronicle.mjs template
import { join } from 'path';
import { mkdirSync, existsSync, writeFileSync, readdirSync, statSync, readFileSync } from 'fs';

const PROJECT = join(import.meta.dirname, '..');
const CHRONICLES_DIR = join(PROJECT, '笔记', 'chronicles');
if (!existsSync(CHRONICLES_DIR)) mkdirSync(CHRONICLES_DIR, { recursive: true });

const pad = n => String(n).padStart(2, '0');

function nowStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function findNextFilename(base) {
  const basePath = join(CHRONICLES_DIR, `${base}.md`);
  if (!existsSync(basePath)) return basePath;
  for (let v = 2; v < 100; v++) {
    const alt = join(CHRONICLES_DIR, `${base}-v${v}.md`);
    if (!existsSync(alt)) return alt;
  }
  throw new Error('Too many versions for this timestamp');
}

async function main() {
  const cmd = process.argv[2];

  if (cmd === 'save') {
    const content = process.argv[3] || readFileSync('/dev/stdin', 'utf-8');
    if (!content || content.trim().length < 10) {
      console.error('[miracle-chronicle] ERROR: Content is empty or too short');
      process.exit(1);
    }
    const stamp = nowStamp();
    const filename = findNextFilename(stamp);
    writeFileSync(filename, content, 'utf-8');
    const size = Buffer.byteLength(content, 'utf-8');
    console.log(`[miracle-chronicle] Saved: ${filename} (${(size / 1024).toFixed(1)} KB)`);
    process.exit(0);
  }

  if (cmd === 'list') {
    const limit = parseInt(process.argv[3]) || 0;
    const files = readdirSync(CHRONICLES_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => ({ name: f, path: join(CHRONICLES_DIR, f), mtime: statSync(join(CHRONICLES_DIR, f)).mtime }))
      .sort((a, b) => b.mtime - a.mtime);

    const shown = limit > 0 ? files.slice(0, limit) : files;
    console.log(`[miracle-chronicle] ${files.length} chronicles found${limit > 0 ? ` (showing ${shown.length})` : ''}:\n`);
    for (const f of shown) {
      const content = readFileSync(f.path, 'utf-8');
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const countMatch = content.match(/收录事件\s*\|\s*(\d+)/);
      const title = titleMatch ? titleMatch[1] : f.name;
      const count = countMatch ? countMatch[1] : '?';
      console.log(`  ${f.name}  |  ${title}  |  ${count} events`);
    }
    process.exit(0);
  }

  if (cmd === 'template') {
    console.log(TEMPLATE);
    process.exit(0);
  }

  console.log('[miracle-chronicle] Usage: node scripts/miracle-chronicle.mjs <save|list|template> [args]');
  process.exit(0);
}

const TEMPLATE = `---
chronicle_id: N
timestamp_utc8: YYYY-MM-DD HH:MM
event_count: 0
categories_covered: []
---

# 世界奇迹编年史 · 第N卷
## World Miracle Chronicle · Volume N
### ✳ YYYY年M月D日 HH:MM — HH:MM (UTC+8)

> *"在这个小时里，宇宙以因果链条与情感波澜两种语法同时书写着自己。"*
> *"In this hour, the universe writes itself simultaneously in the grammar of causality and the poetry of feeling."*

---

## 🜃 自然奇观

### [事件标题]

#### ⌬ 绝对理性 | Absolute Rationality

[理性叙事内容 —— 因果链、统计语境、机制解释、反事实推演]

#### ❦ 绝对感性 | Absolute Sensibility

[感性叙事内容 —— 感官意象、人类主体、隐喻框架、诗性语言]

---

## ⚙ 科技突破

[同上结构]

---

## 𓀠 人类壮举

[同上结构]

---

## 𓃟 社会共鸣

[同上结构]

---

## ⧖ 巧合与同步性

[同上结构]

---

## ◈ 日常之谜

[同上结构]

---

## 本小时奇迹统计 | Hourly Miracle Statistics

| 指标 | 数值 |
|------|------|
| 收录事件 | 0 |
| 覆盖领域 | 0/6 |
| 理性版总字数 | 0 |
| 感性版总字数 | 0 |
| 编年体序列 | Chronicle #N |

---
*由世界奇迹编年史系统记录 · World Miracle Chronicle System*
*本项目致力于在每一个小时中见证宇宙同时以理性与感性的方式展开*
`;

main().catch(e => {
  console.error('[miracle-chronicle] FAIL:', e.message);
  process.exit(1);
});
