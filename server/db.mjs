#!/usr/bin/env node
/**
 * 镜观数据库层 — PostgreSQL / SQLite 双驱动
 *
 * 自动检测：优先 PostgreSQL (由 DATABASE_URL 环境变量控制)，回退到 better-sqlite3
 * 所有数据库函数均为 async，返回 Promise。
 *
 * 四张表：
 *   works    — 作品集
 *   orders   — 订单/联系
 *   chapters — 小说章节
 *   settings — 键值设置
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || join(__dirname, 'data');

// ── 驱动状态 ──
let driver = null;       // 'postgres' | 'sqlite'
let pgPool = null;       // pg.Pool 实例
let sqliteDb = null;     // better-sqlite3 Database 实例
let _initialized = false;

const DATABASE_URL = process.env.DATABASE_URL || '';

// ══════════════════════════════════════════════════════════════
//  连接管理
// ══════════════════════════════════════════════════════════════

async function connect() {
  if (DATABASE_URL && DATABASE_URL.startsWith('postgres')) {
    try {
      const { default: pg } = await import('pg');
      pgPool = new pg.Pool({ connectionString: DATABASE_URL, max: 10 });
      const client = await pgPool.connect();
      client.release();
      driver = 'postgres';
      console.log('[DB] 已连接 PostgreSQL');
      return;
    } catch (e) {
      console.warn('[DB] PostgreSQL 连接失败, 回退到 SQLite:', e.message);
      pgPool = null;
    }
  }

  // SQLite 回退
  try {
    const BetterSqlite3 = (await import('better-sqlite3')).default;
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    const dbPath = join(DATA_DIR, 'jingguan.db');
    sqliteDb = new BetterSqlite3(dbPath);
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('foreign_keys = ON');
    driver = 'sqlite';
    console.log('[DB] 已连接 SQLite:', dbPath);
  } catch (e) {
    console.error('[DB] SQLite 连接失败:', e.message);
    throw e;
  }
}

/**
 * 底层查询封装
 * @param {string} sql
 * @param  {...any} params
 * @returns {Promise<{rows:Array, rowCount:number, insertId?:number}>}
 */
async function query(sql, ...params) {
  if (driver === 'postgres') {
    const result = await pgPool.query(sql, params);
    return { rows: result.rows, rowCount: result.rowCount ?? result.rows.length };
  }

  // SQLite
  const stmt = sqliteDb.prepare(sql);
  const upper = sql.trim().toUpperCase();

  if (upper.startsWith('SELECT') || upper.startsWith('WITH') || upper.startsWith('PRAGMA')) {
    const rows = stmt.all(...params);
    return { rows, rowCount: rows.length };
  }

  if (upper.startsWith('INSERT')) {
    const info = stmt.run(...params);
    return { rows: [], rowCount: info.changes, insertId: Number(info.lastInsertRowid) };
  }

  const info = stmt.run(...params);
  return { rows: [], rowCount: info.changes };
}

/** 返回驱动特定的占位符风格 */
function ph(i) {
  return driver === 'postgres' ? `$${i}` : '?';
}

/** 返回驱动特定的 NOW() 表达式 */
function sqlNow() {
  return driver === 'postgres' ? 'NOW()' : "datetime('now')";
}

// ══════════════════════════════════════════════════════════════
//  建表 DDL（分 postgres / sqlite 两种方言）
// ══════════════════════════════════════════════════════════════

const DDL_WORKS = {
  postgres: `
    CREATE TABLE IF NOT EXISTS works (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      grade TEXT DEFAULT '',
      score INT DEFAULT 0,
      type TEXT DEFAULT '',
      style TEXT DEFAULT '',
      content TEXT DEFAULT '',
      preview TEXT DEFAULT '',
      suggestions TEXT DEFAULT '',
      is_top BOOLEAN DEFAULT false,
      word_count INT DEFAULT 0,
      source_file TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_works_score     ON works(score);
    CREATE INDEX IF NOT EXISTS idx_works_type      ON works(type);
    CREATE INDEX IF NOT EXISTS idx_works_is_top    ON works(is_top);
    CREATE INDEX IF NOT EXISTS idx_works_created_at ON works(created_at);
  `,
  sqlite: `
    CREATE TABLE IF NOT EXISTS works (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      grade TEXT DEFAULT '',
      score INTEGER DEFAULT 0,
      type TEXT DEFAULT '',
      style TEXT DEFAULT '',
      content TEXT DEFAULT '',
      preview TEXT DEFAULT '',
      suggestions TEXT DEFAULT '',
      is_top INTEGER DEFAULT 0,
      word_count INTEGER DEFAULT 0,
      source_file TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_works_score     ON works(score);
    CREATE INDEX IF NOT EXISTS idx_works_type      ON works(type);
    CREATE INDEX IF NOT EXISTS idx_works_is_top    ON works(is_top);
    CREATE INDEX IF NOT EXISTS idx_works_created_at ON works(created_at);
  `,
};

const DDL_ORDERS = {
  postgres: `
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      client_name TEXT NOT NULL DEFAULT '',
      client_contact TEXT DEFAULT '',
      project_type TEXT DEFAULT '',
      description TEXT DEFAULT '',
      budget TEXT DEFAULT '',
      deadline TEXT DEFAULT '',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','contacted','completed','cancelled')),
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON orders(created_at);
  `,
  sqlite: `
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL DEFAULT '',
      client_contact TEXT DEFAULT '',
      project_type TEXT DEFAULT '',
      description TEXT DEFAULT '',
      budget TEXT DEFAULT '',
      deadline TEXT DEFAULT '',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','contacted','completed','cancelled')),
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON orders(created_at);
  `,
};

const DDL_CHAPTERS = {
  postgres: `
    CREATE TABLE IF NOT EXISTS chapters (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      title TEXT DEFAULT '',
      num INT DEFAULT 0,
      content TEXT DEFAULT '',
      word_count INT DEFAULT 0,
      topics TEXT DEFAULT '',
      done BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_chapters_date ON chapters(date);
  `,
  sqlite: `
    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      title TEXT DEFAULT '',
      num INTEGER DEFAULT 0,
      content TEXT DEFAULT '',
      word_count INTEGER DEFAULT 0,
      topics TEXT DEFAULT '',
      done INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_chapters_date ON chapters(date);
  `,
};

const DDL_SETTINGS = {
  postgres: `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT DEFAULT ''
    );
  `,
  sqlite: `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT DEFAULT ''
    );
  `,
};

const ALL_DDLS = { works: DDL_WORKS, orders: DDL_ORDERS, chapters: DDL_CHAPTERS, settings: DDL_SETTINGS };

// ── 执行一条 DDL 语句（忽略 "已存在" 类错误） ──
async function execDDL(sql) {
  try {
    await query(sql);
  } catch (e) {
    if (!e.message?.toLowerCase().includes('already exists')) {
      console.warn('[DB] DDL 警告:', e.message.slice(0, 120));
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  导出 API
// ══════════════════════════════════════════════════════════════

/**
 * 初始化数据库 — 建表 + 索引
 * @returns {Promise<void>}
 */
export async function initDB() {
  if (!driver) await connect();

  const dialect = driver;
  for (const ddl of Object.values(ALL_DDLS)) {
    const block = ddl[dialect];
    for (const stmt of block.split(';').map(s => s.trim()).filter(Boolean)) {
      await execDDL(stmt);
    }
  }

  _initialized = true;
  console.log('[DB] 表结构初始化完成');
}

// ──────────────────────────────────────────────
//  Works (作品集)
// ──────────────────────────────────────────────

/**
 * 分页查询作品列表
 * @param {Object} opts
 * @param {string}  [opts.grade]
 * @param {string}  [opts.type]
 * @param {string}  [opts.search]
 * @param {number}  [opts.page=1]
 * @param {number}  [opts.limit=30]
 * @param {string}  [opts.sort='score']
 * @returns {Promise<{works:Array, pagination:{page,limit,total,totalPages}}>}
 */
export async function getWorks(opts = {}) {
  const { grade, type, search, page = 1, limit = 30, sort } = opts;
  const cond = [];
  const p = [];
  let idx = 1;

  if (grade) { cond.push(`grade = ${ph(idx)}`); p.push(grade); idx++; }
  if (type)  { cond.push(`type = ${ph(idx)}`);  p.push(type);  idx++; }
  if (search) {
    const likeOp = driver === 'postgres' ? 'ILIKE' : 'LIKE';
    cond.push(`(title ${likeOp} ${ph(idx)} OR preview ${likeOp} ${ph(idx)})`);
    p.push(`%${search}%`);
    idx++;
  }

  const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
  const sField = ['score', 'id', 'created_at', 'updated_at', 'word_count', 'title'].includes(sort) ? sort : 'score';
  const order = `ORDER BY is_top DESC, ${sField} DESC`;

  // 总数
  const cnt = await query(`SELECT COUNT(*) AS total FROM works ${where}`, ...p);
  const total = Number(cnt.rows[0]?.total ?? 0);

  // 数据
  const off = (page - 1) * limit;
  p.push(limit, off);
  const sql = `SELECT * FROM works ${where} ${order} LIMIT ${ph(idx)} OFFSET ${ph(idx + 1)}`;
  const data = await query(sql, ...p);
  const rows = data.rows.map(normalizeWork);

  return {
    works: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

/**
 * 单篇作品
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
export async function getWork(id) {
  const r = await query(`SELECT * FROM works WHERE id = ${ph(1)}`, id);
  return r.rows[0] ? normalizeWork(r.rows[0]) : null;
}

/**
 * 创建作品
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function createWork(data) {
  const cols = ['title', 'grade', 'score', 'type', 'style', 'content', 'preview', 'suggestions', 'is_top', 'word_count', 'source_file'];
  const vals = cols.map(c => {
    if (c === 'is_top') return (data.is_top ?? data.isTop ?? false) ? 1 : 0;
    return data[c] ?? '';
  });

  if (driver === 'postgres') {
    const phs = cols.map((_, i) => `$${i + 1}`).join(', ');
    const r = await query(`INSERT INTO works (${cols.join(', ')}) VALUES (${phs}) RETURNING *`, ...vals);
    return normalizeWork(r.rows[0]);
  }

  const phs = cols.map(() => '?').join(', ');
  const r = await query(`INSERT INTO works (${cols.join(', ')}) VALUES (${phs})`, ...vals);
  return getWork(r.insertId);
}

/**
 * 更新作品
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
export async function updateWork(id, data) {
  const allow = ['title', 'grade', 'score', 'type', 'style', 'content', 'preview', 'suggestions', 'is_top', 'word_count', 'source_file'];
  const set = [];
  const p = [];
  let idx = 1;

  for (const [k, v] of Object.entries(data)) {
    if (allow.includes(k)) {
      set.push(`${k} = ${ph(idx)}`);
      if (k === 'is_top') {
        p.push(v ? 1 : 0);
      } else {
        p.push(v ?? '');
      }
      idx++;
    }
  }
  if (!set.length) return getWork(id);

  set.push(`updated_at = ${sqlNow()}`);
  p.push(id);
  await query(`UPDATE works SET ${set.join(', ')} WHERE id = ${ph(idx)}`, ...p);
  return getWork(id);
}

/**
 * 删除作品
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function deleteWork(id) {
  const r = await query(`DELETE FROM works WHERE id = ${ph(1)}`, id);
  return r.rowCount > 0;
}

// ──────────────────────────────────────────────
//  Stats (统计)
// ──────────────────────────────────────────────

/**
 * 作品集统计
 * @returns {Promise<Object>}
 */
export async function getStats() {
  const r = await query('SELECT * FROM works');
  const rows = r.rows;

  const scores = rows.map(w => w.score || 0);
  const stats = {
    total: rows.length,
    top: rows.filter(w => w.is_top).length,
    totalWords: rows.reduce((s, w) => s + (w.word_count || 0), 0),
    maxScore: scores.length ? Math.max(...scores) : 0,
    avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    types: {},
    grades: {},
  };

  rows.forEach(w => {
    const t = w.type || '其他';
    stats.types[t] = (stats.types[t] || 0) + 1;
    const g = w.grade || '?';
    stats.grades[g] = (stats.grades[g] || 0) + 1;
  });

  return stats;
}

/**
 * 作品类型列表（按数量降序）
 * @returns {Promise<Array<{type:string, count:number}>>}
 */
export async function getTypes() {
  const r = await query('SELECT type, COUNT(*) AS count FROM works GROUP BY type ORDER BY count DESC');
  return r.rows.map(row => ({ type: row.type || '其他', count: Number(row.count) }));
}

// ──────────────────────────────────────────────
//  Orders (订单)
// ──────────────────────────────────────────────

/**
 * 订单列表
 * @param {Object} opts
 * @param {string} [opts.status]
 * @param {number} [opts.page=1]
 * @param {number} [opts.limit=30]
 * @returns {Promise<{orders:Array, pagination:Object}>}
 */
export async function getOrders(opts = {}) {
  const { status, page = 1, limit = 30 } = opts;
  const cond = [];
  const p = [];
  let idx = 1;

  if (status) { cond.push(`status = ${ph(idx)}`); p.push(status); idx++; }
  const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';

  const cnt = await query(`SELECT COUNT(*) AS total FROM orders ${where}`, ...p);
  const total = Number(cnt.rows[0]?.total ?? 0);

  const off = (page - 1) * limit;
  p.push(limit, off);
  const sql = `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ${ph(idx)} OFFSET ${ph(idx + 1)}`;
  const data = await query(sql, ...p);

  return {
    orders: data.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

/**
 * 创建订单
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function createOrder(data) {
  const cols = ['client_name', 'client_contact', 'project_type', 'description', 'budget', 'deadline', 'status', 'notes'];
  const vals = cols.map(c => {
    if (c === 'status') return data.status || 'pending';
    return data[c] ?? '';
  });

  if (driver === 'postgres') {
    const phs = cols.map((_, i) => `$${i + 1}`).join(', ');
    const r = await query(`INSERT INTO orders (${cols.join(', ')}) VALUES (${phs}) RETURNING *`, ...vals);
    return r.rows[0];
  }

  const phs = cols.map(() => '?').join(', ');
  const r = await query(`INSERT INTO orders (${cols.join(', ')}) VALUES (${phs})`, ...vals);
  return { ...Object.fromEntries(cols.map((c, i) => [c, vals[i]])), id: r.insertId };
}

/**
 * 获取单条订单
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
export async function getOrder(id) {
  const r = await query(`SELECT * FROM orders WHERE id = ${ph(1)}`, id);
  return r.rows[0] || null;
}

/**
 * 更新订单状态及备注
 * @param {number} id
 * @param {string} status - pending | contacted | completed | cancelled
 * @param {string} [notes]
 * @returns {Promise<Object|null>}
 */
export async function updateOrderStatus(id, status, notes) {
  const valid = ['pending', 'contacted', 'completed', 'cancelled'];
  if (!valid.includes(status)) {
    throw new Error(`无效状态: ${status}。允许值: ${valid.join(', ')}`);
  }

  if (notes != null) {
    await query(
      `UPDATE orders SET status = ${ph(1)}, notes = ${ph(2)}, updated_at = ${sqlNow()} WHERE id = ${ph(3)}`,
      status, notes, id
    );
  } else {
    await query(
      `UPDATE orders SET status = ${ph(1)}, updated_at = ${sqlNow()} WHERE id = ${ph(2)}`,
      status, id
    );
  }
  return getOrder(id);
}

/**
 * 通用更新订单（兼容旧路由）
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
export async function updateOrder(id, data) {
  const allow = ['client_name', 'client_contact', 'project_type', 'description', 'budget', 'deadline', 'status', 'notes'];
  const set = [];
  const p = [];
  let idx = 1;

  for (const [k, v] of Object.entries(data)) {
    if (allow.includes(k)) {
      set.push(`${k} = ${ph(idx)}`);
      p.push(v ?? '');
      idx++;
    }
  }
  if (!set.length) return getOrder(id);

  set.push(`updated_at = ${sqlNow()}`);
  p.push(id);
  await query(`UPDATE orders SET ${set.join(', ')} WHERE id = ${ph(idx)}`, ...p);
  return getOrder(id);
}

/**
 * 删除订单
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function deleteOrder(id) {
  const r = await query(`DELETE FROM orders WHERE id = ${ph(1)}`, id);
  return r.rowCount > 0;
}

// ──────────────────────────────────────────────
//  Chapters (小说章节)
// ──────────────────────────────────────────────

/**
 * 章节列表
 * @returns {Promise<Array>}
 */
export async function getChapters() {
  const r = await query('SELECT * FROM chapters ORDER BY date DESC');
  return r.rows;
}

/**
 * 小说概览（兼容旧路由）
 * @returns {Promise<{totalChapters:number, chapters:Array}>}
 */
export async function getNovelStatus() {
  const rows = await getChapters();
  return {
    totalChapters: rows.length,
    chapters: rows.map(c => ({ date: c.date, wordCount: c.word_count })),
  };
}

/**
 * 获取单章
 * @param {string} date
 * @returns {Promise<Object|null>}
 */
export async function getChapter(date) {
  const r = await query(`SELECT * FROM chapters WHERE date = ${ph(1)}`, date);
  return r.rows[0] || null;
}

/**
 * 插入或更新章节
 * @param {Object} data - { date, title?, num?, content?, word_count?, topics?, done? }
 * @returns {Promise<Object>}
 */
export async function upsertChapter(data) {
  const { date, title, num, content, word_count, topics, done } = data;

  if (driver === 'postgres') {
    const r = await query(
      `INSERT INTO chapters (date, title, num, content, word_count, topics, done)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (date) DO UPDATE SET
         title      = COALESCE($2, chapters.title),
         num        = COALESCE($3, chapters.num),
         content    = COALESCE($4, chapters.content),
         word_count = COALESCE($5, chapters.word_count),
         topics     = COALESCE($6, chapters.topics),
         done       = COALESCE($7, chapters.done)
       RETURNING *`,
      date, title ?? '', num ?? 0, content ?? '', word_count ?? 0, topics ?? '', done ?? false
    );
    return r.rows[0];
  }

  // SQLite — INSERT OR REPLACE (Upsert)
  await query(
    `INSERT OR REPLACE INTO chapters (date, title, num, content, word_count, topics, done)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    date, title ?? '', num ?? 0, content ?? '', word_count ?? 0, topics ?? '', (done ?? false) ? 1 : 0
  );
  return getChapter(date);
}

// ──────────────────────────────────────────────
//  Settings (键值设置)
// ──────────────────────────────────────────────

/**
 * 读取设置
 * @param {string} key
 * @returns {Promise<string|null>}
 */
export async function getSetting(key) {
  const r = await query(`SELECT value FROM settings WHERE key = ${ph(1)}`, key);
  return r.rows[0]?.value ?? null;
}

/**
 * 写入设置
 * @param {string} key
 * @param {string} value
 * @returns {Promise<void>}
 */
export async function setSetting(key, value) {
  const v = String(value);
  if (driver === 'postgres') {
    await query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      key, v
    );
  } else {
    await query('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, v);
  }
}

// ──────────────────────────────────────────────
//  Seed (批量导入)
// ──────────────────────────────────────────────

/**
 * 从 JS 对象批量导入数据
 *
 * @param {Array}  works    — 作品数组
 * @param {Object} chapters — { "2026-06-01": "content..." } 或 { chapters: { "2026-06-01": "content..." } }
 * @returns {Promise<{works:number, chapters:number}>}
 */
export async function seedFromJson(works, chapters) {
  let wc = 0;
  let cc = 0;

  // 规范化 chapters 输入
  let chMap = chapters;
  if (chapters && typeof chapters === 'object' && !Array.isArray(chapters)) {
    if (chapters.chapters && typeof chapters.chapters === 'object') {
      chMap = chapters.chapters;
    }
  }

  // ── 导入 works ──
  if (Array.isArray(works)) {
    for (const w of works) {
      try {
        const row = {
          title:       w.title ?? '',
          grade:       w.grade ?? '',
          score:       w.score ?? 0,
          type:        w.type ?? '',
          style:       w.style ?? '',
          content:     w.content ?? '',
          preview:     w.preview ?? '',
          suggestions: w.suggestions ?? '',
          is_top:      (w.is_top ?? w.isTop ?? false) ? 1 : 0,
          word_count:  w.word_count ?? 0,
          source_file: w.source_file ?? '',
        };

        if (w.id != null) {
          const existing = await getWork(w.id);
          if (existing) {
            await updateWork(w.id, row);
          } else {
            // Insert with explicit id
            const cols = Object.keys(row);
            const vals = Object.values(row);
            if (driver === 'postgres') {
              const phs = cols.map((_, i) => `$${i + 2}`).join(', ');
              const upsert = cols.map((c, i) => `${c} = $${i + 2}`).join(', ');
              await query(
                `INSERT INTO works (id, ${cols.join(', ')}) VALUES ($1, ${phs}) ON CONFLICT (id) DO UPDATE SET ${upsert}`,
                w.id, ...vals
              );
            } else {
              // SQLite: INSERT OR REPLACE by id
              const qs = cols.map(() => '?').join(', ');
              await query(
                `INSERT OR REPLACE INTO works (id, ${cols.join(', ')}) VALUES (?, ${qs})`,
                w.id, ...vals
              );
            }
          }
        } else {
          await createWork(row);
        }
        wc++;
      } catch (e) {
        console.error(`[SEED] 作品导入失败 (id=${w.id}):`, e.message);
      }
    }
  }

  // ── 导入 chapters ──
  if (chMap && typeof chMap === 'object') {
    for (const [date, content] of Object.entries(chMap)) {
      if (!content) continue;

      let title = '';
      const m = content.match(/^#\s+(.+)/m);
      if (m) title = m[1].trim();

      const clean = content.replace(/[#*_>`~\[\]()|]/g, '').replace(/-{3,}/g, '').replace(/\s+/g, '').trim();
      const wc = clean.length;

      try {
        await upsertChapter({ date, title, content, word_count: wc, done: true });
        cc++;
      } catch (e) {
        console.error(`[SEED] 章节导入失败 (${date}):`, e.message);
      }
    }
  }

  return { works: wc, chapters: cc };
}

// ──────────────────────────────────────────────
//  工具函数
// ──────────────────────────────────────────────

/** 标准化作品行 (数据库 snake_case -> 应用层兼容) */
function normalizeWork(row) {
  if (!row) return null;
  return {
    ...row,
    isTop: row.is_top ? true : false,
  };
}

/**
 * 健康检查
 * @returns {Promise<Object>}
 */
export async function getHealth() {
  const ws = await query('SELECT COUNT(*) AS total FROM works');
  const os = await query('SELECT COUNT(*) AS total FROM orders');
  const cs = await query('SELECT COUNT(*) AS total FROM chapters');
  return {
    status: 'ok',
    db: driver,
    works: Number(ws.rows[0]?.total ?? 0),
    novels: Number(cs.rows[0]?.total ?? 0),
    orders: Number(os.rows[0]?.total ?? 0),
    memory: process.memoryUsage ? process.memoryUsage().rss : 0,
    uptime: process.uptime ? Math.floor(process.uptime()) : 0,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 关闭连接
 * @returns {Promise<void>}
 */
export async function closeDB() {
  if (driver === 'postgres' && pgPool) {
    await pgPool.end();
    console.log('[DB] PostgreSQL 连接已关闭');
  }
  if (driver === 'sqlite' && sqliteDb) {
    sqliteDb.close();
    console.log('[DB] SQLite 连接已关闭');
  }
}

// ══════════════════════════════════════════════════════════════
//  默认导出（兼容旧路由 — 同步包装器）
//  ❗ 路由迁移完成后删除此部分
// ══════════════════════════════════════════════════════════════

const dbSync = {
  getWorks(opts = {}) {
    getWorks(opts).then(r => { dbSync._worksCache = r; }).catch(() => {});
    return dbSync._worksCache || { works: [], pagination: { page: 1, limit: 30, total: 0, totalPages: 0 } };
  },
  getWork(id) {
    getWork(id).then(r => { dbSync._workCache = r; }).catch(() => {});
    return dbSync._workCache || null;
  },
  getStats() {
    getStats().then(r => { dbSync._statsCache = r; }).catch(() => {});
    return dbSync._statsCache || { total: 0, top: 0, totalWords: 0, maxScore: 0, avgScore: 0, types: {}, grades: {} };
  },
  getTypes() {
    getTypes().then(r => { dbSync._typesCache = r; }).catch(() => {});
    return dbSync._typesCache || [];
  },
  createOrder(data) {
    createOrder(data).then(r => { dbSync._orderCache = r; }).catch(() => {});
    return dbSync._orderCache || data;
  },
  getOrders(opts = {}) {
    getOrders(opts).then(r => { dbSync._ordersCache = r; }).catch(() => {});
    return dbSync._ordersCache || { orders: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  },
  getOrder(id) {
    getOrder(id).then(r => { dbSync._orderOneCache = r; }).catch(() => {});
    return dbSync._orderOneCache || null;
  },
  updateOrder(id, data) {
    updateOrder(id, data).then(r => { dbSync._orderUpdCache = r; }).catch(() => {});
    return dbSync._orderUpdCache || null;
  },
  deleteOrder(id) {
    deleteOrder(id).then(r => { dbSync._delOk = r; }).catch(() => {});
    return dbSync._delOk ?? true;
  },
  getNovelStatus() {
    getNovelStatus().then(r => { dbSync._novelStatusCache = r; }).catch(() => {});
    return dbSync._novelStatusCache || { totalChapters: 0, chapters: [] };
  },
  getChapter(date) {
    getChapter(date).then(r => { dbSync._chapterCache = r; }).catch(() => {});
    return dbSync._chapterCache || null;
  },
  seedFromJson() {
    const dataFile = process.env.DATA_FILE || join(__dirname, '..', 'portfolio-data.json');
    const novelFile = process.env.NOVEL_DATA_FILE || join(__dirname, '..', 'novel-content.json');
    let works = [];
    let chapters = {};
    try { works = JSON.parse(readFileSync(dataFile, 'utf-8')); } catch {}
    try { chapters = JSON.parse(readFileSync(novelFile, 'utf-8')); } catch {}
    seedFromJson(works, chapters).then(r => { dbSync._seedCache = r; }).catch(() => {});
    return dbSync._seedCache || { works: 0, chapters: 0 };
  },
  getSetting(key) {
    getSetting(key).then(r => { dbSync._settingCache = r; }).catch(() => {});
    return dbSync._settingCache;
  },
  setSetting(key, value) {
    setSetting(key, value).catch(() => {});
  },
  getHealth() {
    getHealth().then(r => { dbSync._healthCache = r; }).catch(() => {});
    return dbSync._healthCache || { status: 'init' };
  },
};
dbSync._worksCache = null;

export default dbSync;
