// 案例管理器 — IndexedDB 持久化案例历史
// 支持案例的 CRUD、搜索、导出

class CaseManager {
  constructor() {
    this.dbName = 'bridge-of-voices';
    this.dbVersion = 1;
    this.db = null;
    this._ready = this._init();
  }

  async _init() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('[CaseManager] IndexedDB not supported');
        resolve(null);
        return;
      }

      const req = indexedDB.open(this.dbName, this.dbVersion);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('cases')) {
          const store = db.createObjectStore('cases', { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };

      req.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      req.onerror = (e) => {
        console.warn('[CaseManager] Failed to open database:', e.target.error);
        resolve(null);
      };
    });
  }

  async _ensureDB() {
    if (this.db) return this.db;
    return this._ready;
  }

  // === CRUD ===

  async save(caseData) {
    const db = await this._ensureDB();
    if (!db) return null;

    const now = new Date().toISOString();
    const record = {
      id: caseData.id || Utils.uuid(),
      facts: caseData.facts || {},
      documents: caseData.documents || {},
      status: caseData.status || 'draft',
      notes: caseData.notes || [],
      deadlines: caseData.deadlines || [],
      problemType: caseData.facts?.problemType?.[0] || 'unknown',
      title: this._generateTitle(caseData.facts),
      createdAt: caseData.createdAt || now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('cases', 'readwrite');
      const store = tx.objectStore('cases');
      const req = store.put(record);

      req.onsuccess = () => resolve(record);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async get(id) {
    const db = await this._ensureDB();
    if (!db) return null;

    return new Promise((resolve, reject) => {
      const tx = db.transaction('cases', 'readonly');
      const store = tx.objectStore('cases');
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async list(options = {}) {
    const db = await this._ensureDB();
    if (!db) return [];

    const { status, limit = 50, offset = 0 } = options;

    return new Promise((resolve, reject) => {
      const tx = db.transaction('cases', 'readonly');
      const store = tx.objectStore('cases');
      const index = status ? store.index('status') : store.index('updatedAt');
      const req = index.openCursor(null, 'prev');

      const results = [];
      let skipped = 0;

      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (!cursor || results.length >= limit) {
          resolve(results);
          return;
        }

        const record = cursor.value;
        if (status && record.status !== status) {
          cursor.continue();
          return;
        }

        if (skipped < offset) {
          skipped++;
          cursor.continue();
          return;
        }

        results.push(this._summarize(record));
        cursor.continue();
      };

      req.onerror = (e) => reject(e.target.error);
    });
  }

  async update(id, patch) {
    const existing = await this.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...patch,
      id,
      updatedAt: new Date().toISOString()
    };

    return this.save(updated);
  }

  async delete(id) {
    const db = await this._ensureDB();
    if (!db) return false;

    return new Promise((resolve, reject) => {
      const tx = db.transaction('cases', 'readwrite');
      const store = tx.objectStore('cases');
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async count() {
    const db = await this._ensureDB();
    if (!db) return 0;

    return new Promise((resolve, reject) => {
      const tx = db.transaction('cases', 'readonly');
      const store = tx.objectStore('cases');
      const req = store.count();

      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // === 辅助 ===

  _generateTitle(facts) {
    if (!facts) return '未命名案例';
    const type = (facts.problemType?.[0]) || '';
    const typeLabel = {
      wage_arrears: '欠薪',
      no_contract: '未签合同',
      work_injury: '工伤',
      overtime: '加班费',
      unfair_dismissal: '违法辞退'
    }[type] || '劳动争议';
    const who = facts.who || '未具名';
    return `${who} ${typeLabel}案`;
  }

  _summarize(record) {
    return {
      id: record.id,
      title: record.title,
      problemType: record.problemType,
      status: record.status,
      who: record.facts?.who || '',
      whom: record.facts?.whom || '',
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      documentCount: Object.keys(record.documents || {}).length
    };
  }

  // === 导出/导入 ===

  async exportAll() {
    const cases = await this.list({ limit: 1000 });
    return JSON.stringify(cases, null, 2);
  }

  async importFromJSON(json) {
    try {
      const data = JSON.parse(json);
      const cases = Array.isArray(data) ? data : [data];
      for (const c of cases) {
        await this.save(c);
      }
      return cases.length;
    } catch (e) {
      console.error('[CaseManager] Import failed:', e);
      return 0;
    }
  }
}
