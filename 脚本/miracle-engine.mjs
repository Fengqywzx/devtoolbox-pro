// ═══════════════════════════════════════════════════════════════
//  奇迹编年史 v3 — 每日连载小说引擎
//  Miracle Chronicle Engine v3 — Daily Serial Novel System
// ═══════════════════════════════════════════════════════════════
// Usage:
//   node 脚本/miracle-engine.mjs status        — 显示覆盖状态
//   node 脚本/miracle-engine.mjs gap           — 列出缺失日期
//   node 脚本/miracle-engine.mjs mark [date]   — 标记某日已覆盖
//   node 脚本/miracle-engine.mjs init          — 初始化状态文件
//   node 脚本/miracle-engine.mjs chapter [date]— 生成小说章节模板
//   node 脚本/miracle-engine.mjs publish       — 准备发布包(含index.html)
//   node 脚本/miracle-engine.mjs deploy        — 推送发布包到GitHub Pages
//   node 脚本/miracle-engine.mjs novel-status  — 连载状态总览

import { join } from 'path';
import { mkdirSync, existsSync, writeFileSync, readFileSync, readdirSync, statSync, copyFileSync } from 'fs';

const PROJECT = join(import.meta.dirname, '..');
const CHRONICLES_DIR = join(PROJECT, '笔记', 'chronicles');
const NOVEL_DIR = join(PROJECT, '连载小说');
const PUBLISH_DIR = join(PROJECT, '连载小说', 'publish');
const STATE_FILE = join(PROJECT, '.miracle-state.json');

// Ensure directories
for (const dir of [CHRONICLES_DIR, NOVEL_DIR, PUBLISH_DIR]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

const pad = n => String(n).padStart(2, '0');

function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function loadState() {
  if (!existsSync(STATE_FILE)) {
    return { format: 'daily', startDate: todayDate(), covered: {}, lastChapter: null, totalChapters: 0, novelTitle: '万象——世界奇迹日誌' };
  }
  return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
}

function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

function listChapters() {
  if (!existsSync(CHRONICLES_DIR)) return [];
  return readdirSync(CHRONICLES_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const match = f.match(/^(\d{4}-\d{2}-\d{2})\.md$/);
      if (!match) return null;
      const stat = statSync(join(CHRONICLES_DIR, f));
      const content = readFileSync(join(CHRONICLES_DIR, f), 'utf-8');
      const titleMatch = content.match(/^##\s+第[一二三四五六七八九十百千]+章\s*[·|]\s*(.+)$/m) || content.match(/^#\s+(.+)$/m);
      const wordCount = content.replace(/[^一-鿿]/g, '').length;
      return {
        file: f,
        date: match[1],
        title: titleMatch ? titleMatch[1] : f,
        wordCount,
        size: stat.size,
        mtime: stat.mtime
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function findGaps() {
  const chapters = listChapters();
  const state = loadState();
  const today = todayDate();

  const coveredDates = new Set(chapters.map(c => c.date));

  // Find all dates that should have chapters
  const allDates = new Set();
  const startDate = state.startDate;
  const start = new Date(startDate);
  const end = new Date(today);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    allDates.add(ds);
  }

  const gaps = [...allDates].filter(d => !coveredDates.has(d)).sort();

  return {
    today,
    coveredDates: [...coveredDates].sort(),
    gaps,
    totalChapters: chapters.length,
    latestChapter: chapters.length > 0 ? chapters[chapters.length - 1] : null
  };
}

function getChapterNumber(dateStr) {
  const state = loadState();
  const start = new Date(state.startDate);
  const target = new Date(dateStr);
  const diffDays = Math.floor((target - start) / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

function numberToChinese(n) {
  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (n <= 10) return digits[n];
  if (n < 20) return '十' + (n % 10 === 0 ? '' : digits[n % 10]);
  if (n < 100) return digits[Math.floor(n / 10)] + '十' + (n % 10 === 0 ? '' : digits[n % 10]);
  return String(n);
}

// Novel chapter template
function generateChapterTemplate(dateStr, chapterNum, title, events, motifs) {
  const chineseNum = numberToChinese(chapterNum);
  const [year, month, day] = dateStr.split('-');
  const monthNames = ['', '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  return `---
chapter: ${chapterNum}
date: ${dateStr}
title: "${title}"
word_count: 0
categories: []
motifs: []
---

# 万象——世界奇迹日誌
## Myriad Forms — World Miracle Daily Chronicle

---

## 第${chineseNum}章 · ${title}

### ${year}年${monthNames[parseInt(month)]}${parseInt(day)}日

> *"[卷首语——将以本日核心事件为主题，创作一句中英双语的诗性题记]"*
> *"[Epigraph — a poetic bilingual inscription capturing the day's essence]"*

---

### 日晷 · Timeline

| 时辰 | 事件 |
|------|------|
| 子时 23-01 | — |
| 丑时 01-03 | — |
| 寅时 03-05 | — |
| 卯时 05-07 | — |
| 辰时 07-09 | — |
| 巳时 09-11 | — |
| 午时 11-13 | — |
| 未时 13-15 | — |
| 申时 15-17 | — |
| 酉时 17-19 | — |
| 戌时 19-21 | — |
| 亥时 21-23 | — |

---

### 正文

[本章正文——将当日3-5个核心事件编织成连贯的叙事。采用连载小说的技法：伏笔、回响、人物视角、场景切换。理性分析和感性描写交替出现，互为镜像。]

---

### ⌬ 理性之镜 · Mirror of Reason

[本章事件的数据化复盘与因果链分析]

---

### ❦ 感性之窗 · Window of Sensibility

[本章事件的文学化重述与情感映射]

---

### 卷末语 · Coda

> *"[下一章预告与主题回响]"*

---

*《万象》连载中 · 下一章：${year}年${monthNames[parseInt(month)]}${parseInt(day) + 1}日*
*Myriad Forms — Serial in Progress*
`;
}

function generateIndexHtml(chapters, stats) {
  const chapterCards = chapters.map(ch => `
    <a class="chapter" href="${ch.file}">
      <div class="ch-num">${ch.date}</div>
      <div class="ch-title">第${ch.chineseNum}章 · ${ch.title}</div>
      <div class="ch-meta"><span>📄 ${ch.wordCount.toLocaleString()} 字</span></div>
    </a>`).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${stats.title}</title>
<meta name="description" content="每天一个改变世界的瞬间——以绝对理性与极致诗意，记录地球上每一天发生的奇迹。">
<style>
  :root{--bg:#0d0d0d;--card:#1a1a1a;--text:#c8c3b8;--gold:#c9a84c;--dim:#6b6560;--accent:#8b7355;--border:#2a2520}
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:var(--bg);color:var(--text);font-family:"Noto Serif SC","Source Han Serif SC","SimSun","Songti SC",Georgia,serif;line-height:1.9;min-height:100vh}
  .hero{text-align:center;padding:80px 24px 60px;background:linear-gradient(180deg,#1a1410 0%,#0d0d0d 100%);border-bottom:1px solid var(--border)}
  .hero h1{font-size:clamp(2rem,5vw,3.4rem);color:var(--gold);font-weight:700;letter-spacing:.08em;margin-bottom:12px}
  .hero .subtitle{font-style:italic;color:var(--dim);font-size:1.05rem;margin-bottom:6px}
  .hero .tagline{color:var(--accent);font-size:.95rem;margin-top:20px;max-width:600px;margin-left:auto;margin-right:auto}
  .stats{display:flex;justify-content:center;gap:48px;margin:40px auto 0;flex-wrap:wrap}
  .stat{text-align:center}
  .stat .num{font-size:1.8rem;color:var(--gold);font-weight:700}
  .stat .label{font-size:.8rem;color:var(--dim);text-transform:uppercase;letter-spacing:.1em}
  .container{max-width:780px;margin:0 auto;padding:40px 24px 80px}
  .section-title{color:var(--gold);font-size:1.2rem;letter-spacing:.12em;margin:48px 0 20px;padding-bottom:10px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
  .section-title::before{content:'◆';font-size:.5rem}
  .chapter{display:block;padding:20px 24px;margin-bottom:10px;background:var(--card);border:1px solid var(--border);border-radius:4px;text-decoration:none;color:var(--text);transition:all .25s}
  .chapter:hover{border-color:var(--gold);background:#1e1c18}
  .chapter .ch-num{font-size:.75rem;color:var(--accent);letter-spacing:.08em}
  .chapter .ch-title{font-size:1.1rem;color:#e0d8c8;margin:4px 0}
  .chapter .ch-meta{font-size:.8rem;color:var(--dim)}
  .chapter .ch-meta span{margin-right:16px}
  .about{background:var(--card);border:1px solid var(--border);border-radius:4px;padding:28px 24px;margin-top:40px}
  .about p{margin-bottom:10px;font-size:.95rem}
  .domains{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
  .domain-tag{font-size:.78rem;padding:3px 12px;border:1px solid var(--border);border-radius:20px;color:var(--accent)}
  footer{text-align:center;color:var(--dim);font-size:.75rem;padding:40px 24px;border-top:1px solid var(--border)}
  footer a{color:var(--gold);text-decoration:none}
  .empty{text-align:center;padding:60px 24px;color:var(--dim)}
  .empty .icon{font-size:3rem;margin-bottom:16px}
  @media(max-width:600px){.stats{gap:28px}.hero{padding:48px 16px 36px}}
</style>
</head>
<body>
<div class="hero">
  <h1>万&ensp;象</h1>
  <p class="subtitle">Myriad Forms — World Miracle Daily Chronicle</p>
  <p class="tagline">
    以绝对理性与极致诗意两种眼光，记录每一天地球上的奇迹——<br>
    从AI的觉醒到数字城邦的复活，从芯片战争到日暮线上的黄昏。
  </p>
  <div class="stats">
    <div class="stat"><div class="num">${stats.totalChapters}</div><div class="label">章 节</div></div>
    <div class="stat"><div class="num">${stats.totalWords.toLocaleString()}</div><div class="label">总字数</div></div>
    <div class="stat"><div class="num">${stats.startDate}</div><div class="label">创刊日</div></div>
  </div>
</div>
<div class="container">
  <h2 class="section-title">章 节 目 录</h2>
  ${chapterCards || '<div class="empty"><div class="icon">📖</div><p>编年史正在书写中……</p></div>'}
  <div class="about">
    <h2 class="section-title" style="margin-top:0">关 于 本 刊</h2>
    <p>《万象——世界奇迹日誌》是一本每日连载的编年体小说。每天选取全世界最非凡的事件，以<strong>⌬ 绝对理性</strong>（因果链、统计数据、机制解释）和<strong>❦ 绝对感性</strong>（感官意象、人类视角、诗性叙事）两种维度进行创作。</p>
    <p>每章覆盖六大领域，在看似独立的事件之间寻找隐藏的联结。</p>
    <div class="domains">
      <span class="domain-tag">🜃 自然奇观</span><span class="domain-tag">⚙ 科技突破</span>
      <span class="domain-tag">𓀠 人类壮举</span><span class="domain-tag">𓃟 社会共鸣</span>
      <span class="domain-tag">⧖ 巧合与同步性</span><span class="domain-tag">◈ 日常之谜</span>
    </div>
  </div>
</div>
<footer>
  《万象》连载中 · 由 <a href="https://github.com/Fengqywzx/devtoolbox-pro">奇迹编年史引擎</a> 驱动<br>
  每日自动更新 · 全平台阅读：起点 / 番茄 / 豆瓣 / 知乎 / 微信公众号
</footer>
</body>
</html>`;
}

async function main() {
  const cmd = process.argv[2];

  if (cmd === 'status') {
    const { today, coveredDates, gaps, totalChapters, latestChapter } = findGaps();
    const state = loadState();
    console.log('══════════════════════════════════════════════');
    console.log('  📖 奇迹编年史 v3 · 每日连载小说引擎');
    console.log('══════════════════════════════════════════════');
    console.log(`  书名:    《${state.novelTitle}》`);
    console.log(`  今日:    ${today}`);
    console.log(`  已连载:  ${totalChapters} 章`);
    console.log(`  覆盖:    ${coveredDates.length > 0 ? coveredDates[0] + ' ~ ' + coveredDates[coveredDates.length - 1] : '无'}`);
    console.log(`  缺失:    ${gaps.length > 0 ? gaps.join(', ') : '✅ 无缺失'}`);
    if (latestChapter) {
      console.log(`  最新:    第${getChapterNumber(latestChapter.date)}章 · ${latestChapter.title} (${latestChapter.wordCount}字)`);
    }
    console.log('══════════════════════════════════════════════');
    if (gaps.length > 0) {
      console.log(`\n⚠️  发现 ${gaps.length} 天缺失！运行 /miracle 自动补齐。`);
    }
    process.exit(0);
  }

  if (cmd === 'gap') {
    const { gaps, today } = findGaps();
    console.log(JSON.stringify({ today, gaps, count: gaps.length }));
    process.exit(0);
  }

  if (cmd === 'mark' && process.argv[3]) {
    const state = loadState();
    const dateStr = process.argv[3]; // YYYY-MM-DD
    state.covered[dateStr] = true;
    state.lastChapter = dateStr;
    state.totalChapters = Math.max(state.totalChapters, Object.keys(state.covered).length);
    saveState(state);
    console.log(`[miracle-engine] ✅ 标记 ${dateStr} 已覆盖。总章节: ${state.totalChapters}`);
    process.exit(0);
  }

  if (cmd === 'init') {
    const state = {
      format: 'daily',
      startDate: todayDate(),
      covered: {},
      lastChapter: null,
      totalChapters: 0,
      novelTitle: '万象——世界奇迹日誌'
    };
    saveState(state);
    console.log('[miracle-engine] 📖 引擎初始化完成');
    console.log(JSON.stringify(state, null, 2));
    process.exit(0);
  }

  if (cmd === 'chapter') {
    const dateStr = process.argv[3] || todayDate();
    const chapterNum = getChapterNumber(dateStr);
    const chineseNum = numberToChinese(chapterNum);
    const template = generateChapterTemplate(dateStr, chapterNum, '标题待定', [], []);
    const outPath = join(CHRONICLES_DIR, `${dateStr}.md`);
    if (!existsSync(outPath)) {
      writeFileSync(outPath, template, 'utf-8');
      console.log(`[miracle-engine] 📝 章节模板已生成: ${outPath}`);
      console.log(`  第${chineseNum}章 · ${dateStr}`);
    } else {
      console.log(`[miracle-engine] ⚠️  章节已存在: ${outPath}`);
    }
    process.exit(0);
  }

  if (cmd === 'novel-status') {
    const chapters = listChapters();
    const state = loadState();
    const totalWords = chapters.reduce((sum, c) => sum + c.wordCount, 0);

    console.log('═══════════════════════════════════════════════');
    console.log(`  📚 《${state.novelTitle}》连载状态`);
    console.log('═══════════════════════════════════════════════');
    console.log(`  总章节:  ${chapters.length}`);
    console.log(`  总字数:  ${totalWords.toLocaleString()}`);
    console.log(`  起始:    ${chapters.length > 0 ? chapters[0].date : 'N/A'}`);
    console.log(`  最新:    ${chapters.length > 0 ? chapters[chapters.length - 1].date : 'N/A'}`);
    console.log(`  日均:    ${chapters.length > 0 ? Math.round(totalWords / chapters.length).toLocaleString() : 0} 字`);
    console.log('───────────────────────────────────────────────');
    console.log('  章节目录:');
    for (const ch of chapters) {
      const num = getChapterNumber(ch.date);
      const cn = numberToChinese(num);
      console.log(`    第${cn}章 | ${ch.date} | ${ch.title.substring(0, 30)} | ${ch.wordCount.toLocaleString()}字`);
    }
    console.log('═══════════════════════════════════════════════');
    process.exit(0);
  }

  if (cmd === 'publish') {
    // Generate publish-ready files
    const chapters = listChapters();
    if (chapters.length === 0) {
      console.log('[miracle-engine] ❌ 没有章节可发布');
      process.exit(1);
    }

    const state = loadState();

    // 1. Generate single-file novel (for epub/全文阅读)
    let fullNovel = `# 《${state.novelTitle}》\n\n`;
    fullNovel += `> 世界奇迹编年史 · 每日连载小说\n`;
    fullNovel += `> 共 ${chapters.length} 章 · ${chapters.reduce((s, c) => s + c.wordCount, 0).toLocaleString()} 字\n\n---\n\n`;

    for (const ch of chapters) {
      const content = readFileSync(join(CHRONICLES_DIR, ch.file), 'utf-8');
      fullNovel += content + '\n\n---\n\n';
    }
    writeFileSync(join(PUBLISH_DIR, 'full-novel.md'), fullNovel, 'utf-8');

    // 2. Generate chapter index (for serial platforms)
    let index = `# 章节目录\n\n`;
    for (const ch of chapters) {
      const num = getChapterNumber(ch.date);
      const cn = numberToChinese(num);
      index += `- [第${cn}章 · ${ch.title}](${ch.file}) — ${ch.date} — ${ch.wordCount.toLocaleString()}字\n`;
    }
    writeFileSync(join(PUBLISH_DIR, 'chapter-index.md'), index, 'utf-8');

    // 3. Generate upload-ready formatted versions
    // Format for 起点/番茄 (纯文本，段落间空行)
    let qidianFormat = '';
    for (const ch of chapters) {
      const raw = readFileSync(join(CHRONICLES_DIR, ch.file), 'utf-8');
      // Strip YAML frontmatter
      const body = raw.replace(/^---[\s\S]*?---\n*/m, '');
      qidianFormat += body.replace(/\n\n/g, '\n\n') + '\n\n━━━━━━━━━━━━━━━━━━━━\n\n';
    }
    writeFileSync(join(PUBLISH_DIR, 'for-qidian.txt'), qidianFormat, 'utf-8');

    // 4. Generate Douban/知乎 format (markdown with clean formatting)
    let doubanFormat = '';
    for (const ch of chapters) {
      const raw = readFileSync(join(CHRONICLES_DIR, ch.file), 'utf-8');
      doubanFormat += raw + '\n\n---\n\n';
    }
    writeFileSync(join(PUBLISH_DIR, 'for-douban.md'), doubanFormat, 'utf-8');

    // 5. Generate index.html for GitHub Pages
    const totalWords = chapters.reduce((sum, c) => sum + c.wordCount, 0);
    const firstDate = chapters.length > 0 ? chapters[0].date : '';
    const indexHtml = generateIndexHtml(chapters.map(ch => ({
      ...ch,
      chapterNum: getChapterNumber(ch.date),
      chineseNum: numberToChinese(getChapterNumber(ch.date))
    })), { totalChapters: chapters.length, totalWords, startDate: firstDate, title: state.novelTitle });
    writeFileSync(join(PUBLISH_DIR, 'index.html'), indexHtml, 'utf-8');

    console.log('[miracle-engine] 📦 发布包已生成:');
    console.log(`  🌐 连载小说/publish/index.html         — GitHub Pages 首页`);
    console.log(`  📄 连载小说/publish/full-novel.md     — 全文合集 (${(Buffer.byteLength(fullNovel, 'utf-8') / 1024).toFixed(1)} KB)`);
    console.log(`  📋 连载小说/publish/chapter-index.md   — 章节目录`);
    console.log(`  📝 连载小说/publish/for-qidian.txt     — 起点/番茄格式`);
    console.log(`  📝 连载小说/publish/for-douban.md      — 豆瓣/知乎格式`);
    console.log(`\n  🚀 运行 node 脚本/miracle-engine.mjs deploy 推送到 GitHub Pages`);
    process.exit(0);
  }

  if (cmd === 'upload-guide') {
    console.log(await generateUploadGuide());
    process.exit(0);
  }

  if (cmd === 'deploy') {
    // Git push publish directory to trigger GitHub Actions deployment
    const { execSync } = await import('child_process');
    try {
      console.log('[miracle-engine] 🚀 推送发布包到 GitHub...');
      const cmds = [
        'git add 连载小说/publish/ .github/workflows/deploy-pages.yml 脚本/miracle-engine.mjs',
        `git commit -m "deploy: chronicle update ${todayDate()}" --allow-empty`,
        'git pull origin master --no-edit',
        'git push origin master'
      ];
      for (const c of cmds) {
        console.log(`  $ ${c}`);
        execSync(c, { cwd: PROJECT, encoding: 'utf-8', stdio: 'inherit' });
      }
      console.log('[miracle-engine] ✅ 已推送！GitHub Actions 将自动部署到 Pages。');
      console.log('  查看进度: https://github.com/Fengqywzx/devtoolbox-pro/actions');
      console.log('  网站地址: https://fengqywzx.github.io/devtoolbox-pro/');
    } catch (e) {
      console.error('[miracle-engine] ❌ 推送失败:', e.message);
      console.error('  请确认 git remote 已配置且已认证。');
      process.exit(1);
    }
    process.exit(0);
  }

  // Default: show usage
  console.log('[miracle-engine v3] 📖 每日连载小说引擎');
  console.log('');
  console.log('  状态与诊断:');
  console.log('    node 脚本/miracle-engine.mjs status        显示覆盖状态');
  console.log('    node 脚本/miracle-engine.mjs gap           列出缺失日期');
  console.log('    node 脚本/miracle-engine.mjs novel-status  连载总览');
  console.log('');
  console.log('  创作工具:');
  console.log('    node 脚本/miracle-engine.mjs chapter [date] 生成章节模板');
  console.log('    node 脚本/miracle-engine.mjs mark [date]    标记日期已覆盖');
  console.log('');
  console.log('  发布工具:');
  console.log('    node 脚本/miracle-engine.mjs publish        生成全平台发布包');
  console.log('    node 脚本/miracle-engine.mjs deploy         推送到GitHub Pages');
  console.log('    node 脚本/miracle-engine.mjs upload-guide   查看全平台投稿指南');
  console.log('');
  console.log('  系统:');
  console.log('    node 脚本/miracle-engine.mjs init           初始化引擎');
  process.exit(0);
}

async function generateUploadGuide() {
  const guide = `
═══════════════════════════════════════════════════════════════
  📖 《万象》连载小说 — 全平台投稿与流量获取指南
═══════════════════════════════════════════════════════════════

## 🎯 自动发布方案

### 方案A：GitHub Pages 博客（全自动 ✅）
- 运行 \`node 脚本/miracle-engine.mjs publish\` 生成发布包
- 将 连载小说/publish/ 推送到 GitHub Pages 仓库
- 自动部署为静态博客
- ⚡ 这是唯一可以完全自动化的发布渠道

### 方案B：微信公众号（半自动 ⚡）
- 使用 publish/for-douban.md 的内容
- 配合微信公众平台编辑器手动粘贴
- 或用微信公众号 API（需企业认证）自动发布

---

## 📋 真人手动投稿平台指南

### 1. 起点中文网 (qidian.com) 🏆
**适合**：长篇连载，流量最大，读者基数最广
**投稿步骤**：
  1. 注册作者账号 → 进入"作家专区"
  2. 创建作品 → 类型选"现实·人文"或"散文·随笔"
  3. 使用 \`连载小说/publish/for-qidian.txt\` 中的内容
  4. 每章 2000-4000 字为最佳（本作品每章约3000-5000字，可直接使用）
  5. 首日发布3章（快速通过审核），之后每日更新1章

**🔥 流量技巧**：
  - **书名优化**：《万象——世界奇迹日誌》已够吸引人，可加副标题"每天一个改变世界的瞬间"
  - **简介公式**："如果每一天都是一颗种子，那么历史就是它们长成的森林。本书以绝对理性与极致诗意两种眼光，记录每一天地球上发生的奇迹——从AI的觉醒到天涯的重生，从芯片战争到日暮线上的黄昏。这是一本写给未来的日记，也是一封写给过去的情书。"
  - **标签**：#纪实 #人文 #科技 #每日更新 #深度思考
  - **互动**：每章末尾加"今日话题"引导评论（如"你觉得今天的哪个事件最像奇迹？"）
  - **更新时间**：早上 7:30-8:30 或晚上 19:00-21:00（流量高峰）
  - **推荐票**：新书期每天求推荐票，前30天最关键

### 2. 番茄小说 (fanqienovel.com) 🍅
**适合**：AI推荐算法强，新书曝光机会多
**特点**：免费阅读+广告分成，适合流量型作品
**投稿步骤**：
  1. 下载"番茄作家助手"APP
  2. 创建作品 → 发布章节
  3. 使用 publish/for-qidian.txt 格式（纯文本）

**🔥 流量技巧**：
  - 番茄算法偏好**高完读率**，前3章务必精彩抓人
  - 每章开头用**一个具体的画面或场景**抓住读者（不要从大道理开始）
  - 章节标题要有"爆点感"（如"第一章·AI终于学会了说谎——不，它学会了说'我不知道'"）
  - 封面设计：深色背景+金色字体，营造"史诗感"
  - 首日10章一次性发布可获得"新书爆更"流量扶持

### 3. 豆瓣阅读 (read.douban.com) 📚
**适合**：文学性强的作品，读者品味较高
**投稿步骤**：
  1. 注册豆瓣作者 → 进入"豆瓣阅读作者中心"
  2. 创建专栏或长篇连载
  3. 使用 publish/for-douban.md 格式（支持Markdown）

**🔥 流量技巧**：
  - 豆瓣读者重**文笔和思想深度**，你的双叙事（理性+感性）在这里是巨大优势
  - 在豆瓣广播中每天发一条"今日奇迹"短摘（100字精华+链接）
  - 参与豆瓣相关小组讨论（如"每日观察""非虚构写作"）
  - 申请豆瓣阅读的"编辑推荐"和"新作速递"栏目

### 4. 知乎 (zhihu.com) 📝
**适合**：知识型内容，精准读者群
**投稿策略**：
  1. 在知乎发布"文章"（非回答），创建专栏
  2. 专栏名称：《万象·世界奇迹日誌》
  3. 每章同时发布为专栏文章
  4. 在相关问题下写高质量回答，文末附专栏链接

**🔥 流量技巧**：
  - 找到当天热点问题，写深度回答时引用你的编年史内容
  - 例如"如何评价天涯社区恢复访问？"→ 回答中引述你的分析 + 附专栏链接
  - 知乎算法偏好**长文+高赞同率**，你的深度分析天然匹配
  - 每章提炼3-5条"金句"发在"想法"中引流
  - 参与知乎盐选专栏申请

### 5. 微信公众号 (WeChat Official Account) 💬
**适合**：私域流量，粉丝忠诚度高
**投稿步骤**：
  1. 注册订阅号（个人即可）
  2. 使用 publish/for-douban.md 内容
  3. 配合秀米/135编辑器美化排版

**🔥 流量技巧**：
  - 标题公式："[日期] 今天地球上发生了三件你可能不知道的奇迹"
  - 每篇文章末尾加"转发给一个会欣赏这些文字的人"
  - 建立"奇迹读者群"微信群，每天推送
  - 和同类型公众号互推
  - 文章配图：使用 Unsplash/Pexels 高质量免费图片

### 6. B站专栏 (bilibili.com) 📺
**适合**：年轻读者，可视化潜力大
**策略**：将每章制作成视频（文字转语音+配图），专栏区同步发文字版

---

## 🔥 通用流量增长策略

### 标题优化
| 类型 | 示例 |
|------|------|
| 悬念式 | "2026年6月1日，一座拥有1.27亿人的城市从互联网的废墟中站了起来" |
| 对比式 | "AI学会说'我不知道'的同一天，一个博士生不用论文拿到了博士学位" |
| 数字式 | "今天的3个奇迹：一个复活、一次觉醒、一场黄昏" |

### 内容传播
- **金句卡片**：每章提炼1-3句金句，做成小红书/朋友圈卡片图
- **音频版**：用AI语音合成每章内容，发布在喜马拉雅/小宇宙
- **短视频**：抖音/快手发布60秒"今日奇迹速览"

### 读者运营
- 每章末尾设置"今日互动话题"
- 建立读者社群（微信群/知识星球）
- 定期发布"月度奇迹回顾"精选集
- 鼓励读者投稿"我身边的奇迹"

### SEO优化
- 标题包含当天的热点关键词
- 文章开头200字包含核心事件描述
- 每个平台用不同的标题变体（防重复内容惩罚）

---

## ⚡ 快速启动清单

□ 1. 注册起点中文网作者账号
□ 2. 注册番茄小说作者账号
□ 3. 注册豆瓣阅读作者账号
□ 4. 创建知乎专栏《万象·世界奇迹日誌》
□ 5. 注册微信公众号订阅号
□ 6. 运行 \`node 脚本/miracle-engine.mjs publish\` 获取发布包
□ 7. 在起点发布前3章，通过审核
□ 8. 设置每日更新提醒
□ 9. 制作第一张金句卡片发小红书
□ 10. 在知乎写第一个引流回答

═══════════════════════════════════════════════════════════════
  *以上指南基于2026年6月各平台最新规则整理*
  *运行 node 脚本/miracle-engine.mjs publish 生成适配各平台的发布文件*
═══════════════════════════════════════════════════════════════
`;
  return guide;
}

main().catch(e => {
  console.error('[miracle-engine] ❌ FAIL:', e.message);
  process.exit(1);
});
