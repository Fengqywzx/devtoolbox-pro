#!/usr/bin/env node
/**
 * 镜观数据库种子脚本
 *
 * 从 JSON 文件导入作品集和小说章节到数据库。
 * 用法: node seed.mjs
 *
 * 环境变量:
 *   DATA_FILE       — 作品集 JSON 路径 (默认: ../portfolio-data.json)
 *   NOVEL_DATA_FILE — 小说 JSON 路径   (默认: ../novel-content.json)
 *   DATABASE_URL    — PostgreSQL 连接串 (可选, 缺省则用 SQLite)
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

// ── 文件路径 ──
const DATA_FILE = resolve(process.env.DATA_FILE || join(PROJECT_ROOT, 'portfolio-data.json'));
const NOVEL_FILE = resolve(process.env.NOVEL_DATA_FILE || join(PROJECT_ROOT, 'novel-content.json'));

// ── 导入 db 模块 ──
import { initDB, seedFromJson, closeDB, getWorks, getChapters } from './db.mjs';

// ══════════════════════════════════════════════════════════════

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  镜观数据库 — 种子导入工具               ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  // 1. 初始化数据库
  console.log('[1/4] 初始化数据库...');
  await initDB();

  // 2. 读取 JSON 文件
  console.log('[2/4] 读取数据文件...');

  if (!existsSync(DATA_FILE)) {
    console.error(`  ❌ 作品数据文件不存在: ${DATA_FILE}`);
    process.exit(1);
  }
  if (!existsSync(NOVEL_FILE)) {
    console.error(`  ❌ 小说数据文件不存在: ${NOVEL_FILE}`);
    process.exit(1);
  }

  let worksData, novelData;
  try {
    const raw = readFileSync(DATA_FILE, 'utf-8');
    worksData = JSON.parse(raw);
    if (!Array.isArray(worksData)) {
      throw new Error('作品数据应为 JSON 数组');
    }
    console.log(`  ✓ 作品数据: ${worksData.length} 篇`);
  } catch (e) {
    console.error(`  ❌ 读取作品数据失败: ${e.message}`);
    process.exit(1);
  }

  try {
    const raw = readFileSync(NOVEL_FILE, 'utf-8');
    novelData = JSON.parse(raw);
    const chapters = novelData.chapters || novelData;
    const count = typeof chapters === 'object' && !Array.isArray(chapters)
      ? Object.keys(chapters).length
      : 0;
    console.log(`  ✓ 小说数据: ${count} 章`);
  } catch (e) {
    console.error(`  ❌ 读取小说数据失败: ${e.message}`);
    process.exit(1);
  }

  // 3. 导入数据库
  console.log('[3/4] 导入数据库...');

  const startTime = Date.now();
  const result = await seedFromJson(worksData, novelData);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`  ✓ 作品导入: ${result.works} 篇`);
  console.log(`  ✓ 章节导入: ${result.chapters} 章`);
  console.log(`  ⏱  耗时: ${elapsed}s`);

  // 4. 验证
  console.log('[4/4] 验证导入结果...');

  try {
    const wsResult = await getWorks({ limit: 1 });
    const wsCount = wsResult.pagination?.total ?? 0;
    const chCount = (await getChapters()).length;

    console.log('');
    console.log('  ┌────────────────────────────────────┐');
    console.log(`  │  数据库状态                         │`);
    console.log(`  │  作品: ${String(wsCount).padStart(4)} 篇                     │`);
    console.log(`  │  章节: ${String(chCount).padStart(4)} 章                     │`);
    console.log('  └────────────────────────────────────┘');
    console.log('');

    if (wsCount > 0) {
      console.log('  ✅ 导入成功!');
    } else {
      console.log('  ⚠️  导入完成但作品数为 0，请检查数据文件格式');
    }
  } catch (e) {
    console.error(`  ❌ 验证失败: ${e.message}`);
  }

  // 5. 清理
  await closeDB();
  process.exit(0);
}

main().catch(e => {
  console.error('\n[SEED] 种子导入失败:', e.message);
  process.exit(1);
});
