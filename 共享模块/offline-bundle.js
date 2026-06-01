// v4 完整离线包 — PWA离线+IndexedDB+后台同步+安装提示
// 所有12项目引用此模块获得完整的离线PWA能力

class OfflineBundle {
  constructor(options = {}) {
    this.appName = options.appName || '劳动者工具';
    this.version = options.version || '1.0.0';
    this.cacheName = `labor-app-${this.appName}-v${this.version}`;
    this.dbName = `laborDB_${this.appName}`;
    this.db = null;
    this.init();
  }

  async init() {
    await this._initDB();
    this._registerSW();
    this._checkInstallPrompt();
    this._setupSync();
  }

  // IndexedDB初始化（大数据离线存储）
  async _initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('records')) {
          db.createObjectStore('records', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = (e) => { this.db = e.target.result; resolve(); };
      request.onerror = () => { console.warn('[Offline] IndexedDB init failed'); resolve(); };
    });
  }

  // 离线存储操作
  async saveRecord(data) {
    if (!this.db) return;
    const tx = this.db.transaction('records', 'readwrite');
    tx.objectStore('records').put({ ...data, synced: false });
    // 添加到同步队列
    const syncTx = this.db.transaction('syncQueue', 'readwrite');
    syncTx.objectStore('syncQueue').put({ type: 'record', data, timestamp: Date.now() });
  }

  async getRecords(limit = 100) {
    if (!this.db) return [];
    return new Promise((resolve) => {
      const tx = this.db.transaction('records', 'readonly');
      const store = tx.objectStore('records');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.slice(-limit));
      request.onerror = () => resolve([]);
    });
  }

  async saveSetting(key, value) {
    if (!this.db) { localStorage.setItem(key, JSON.stringify(value)); return; }
    const tx = this.db.transaction('settings', 'readwrite');
    tx.objectStore('settings').put({ key, value });
  }

  async getSetting(key) {
    if (!this.db) {
      try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    }
    return new Promise((resolve) => {
      const tx = this.db.transaction('settings', 'readonly');
      const request = tx.objectStore('settings').get(key);
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => resolve(null);
    });
  }

  // Service Worker注册
  async _registerSW() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.register('../../共享模块/service-worker.js', { scope: '/' });
      console.log(`[Offline] SW registered: ${this.appName}`);
    } catch (e) { console.warn('[Offline] SW registration failed'); }
  }

  // PWA安装提示
  _checkInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this._installPrompt = e;
      this._showInstallBanner();
    });
    window.addEventListener('appinstalled', () => {
      console.log('[Offline] PWA installed');
      this._installPrompt = null;
    });
  }

  _showInstallBanner() {
    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#1e40af;color:#fff;padding:16px;text-align:center;z-index:999;font-size:18px;font-weight:600;cursor:pointer';
    banner.textContent = '📲 点击安装到手机桌面（离线可用）';
    banner.addEventListener('click', async () => {
      if (this._installPrompt) {
        this._installPrompt.prompt();
        const result = await this._installPrompt.userChoice;
        console.log('[Offline] Install:', result.outcome);
        this._installPrompt = null;
      }
      banner.remove();
    });
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 15000);
  }

  // 后台同步
  _setupSync() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(registration => {
      setInterval(() => {
        registration.sync.register('sync-data').catch(() => {});
      }, 300000); // 每5分钟尝试同步
    });
  }

  // 网络状态检测
  isOnline() { return navigator.onLine; }
  onStatusChange(callback) {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }

  // 存储使用量估算
  async getStorageUsage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: Math.round(estimate.usage / 1024),
        quota: Math.round(estimate.quota / 1024),
        percent: Math.round((estimate.usage / estimate.quota) * 100)
      };
    }
    return { used: 0, quota: 0, percent: 0 };
  }
}
