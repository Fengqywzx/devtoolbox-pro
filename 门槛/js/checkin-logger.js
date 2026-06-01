// 安全签到记录器

class CheckinLogger {
  constructor() {
    this.entries = this._load();
  }

  _load() {
    try { return JSON.parse(localStorage.getItem('th_checkins') || '[]'); }
    catch { return []; }
  }

  _save() {
    localStorage.setItem('th_checkins', JSON.stringify(this.entries));
  }

  checkin(type) {
    const entry = {
      id: Date.now().toString(36),
      type, // 'enter' | 'leave' | 'sos'
      timestamp: new Date().toISOString(),
    };
    this.entries.unshift(entry);
    this.entries = this.entries.slice(0, 50);
    this._save();
    return entry;
  }

  getEntries() {
    return this.entries;
  }

  getTodayEntries() {
    const today = new Date().toDateString();
    return this.entries.filter(e => new Date(e.timestamp).toDateString() === today);
  }

  getLastEntry() {
    return this.entries[0] || null;
  }
}
