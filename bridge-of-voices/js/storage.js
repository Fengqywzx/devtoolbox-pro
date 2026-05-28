// localStorage 持久化层
// 自动保存/恢复草稿，管理用户偏好

const Storage = {
  _prefix: 'bv_',

  // === 草稿管理 ===

  saveDraft(facts, interviewState) {
    const draft = {
      facts,
      interviewState,
      savedAt: new Date().toISOString(),
      version: 2
    };
    try {
      localStorage.setItem(this._prefix + 'draft', JSON.stringify(draft));
      return true;
    } catch (e) {
      console.warn('[Storage] Failed to save draft:', e.message);
      return false;
    }
  },

  loadDraft() {
    try {
      const raw = localStorage.getItem(this._prefix + 'draft');
      if (!raw) return null;
      const draft = JSON.parse(raw);
      // 草稿超过 7 天自动清理
      if (Date.now() - new Date(draft.savedAt).getTime() > 7 * 24 * 3600 * 1000) {
        this.clearDraft();
        return null;
      }
      return draft;
    } catch {
      return null;
    }
  },

  clearDraft() {
    localStorage.removeItem(this._prefix + 'draft');
  },

  hasDraft() {
    return !!localStorage.getItem(this._prefix + 'draft');
  },

  // === 用户偏好 ===

  getPreference(key, defaultValue) {
    try {
      const prefs = JSON.parse(localStorage.getItem(this._prefix + 'prefs') || '{}');
      return prefs[key] ?? defaultValue;
    } catch {
      return defaultValue;
    }
  },

  setPreference(key, value) {
    try {
      const prefs = JSON.parse(localStorage.getItem(this._prefix + 'prefs') || '{}');
      prefs[key] = value;
      localStorage.setItem(this._prefix + 'prefs', JSON.stringify(prefs));
    } catch { /* ignore */ }
  },

  // === 欢迎引导 ===

  hasSeenWelcome() {
    return localStorage.getItem(this._prefix + 'welcome_seen') === '1';
  },

  markWelcomeSeen() {
    localStorage.setItem(this._prefix + 'welcome_seen', '1');
  },

  // === 语音权限状态 ===

  getMicPermission() {
    return localStorage.getItem(this._prefix + 'mic_permission');
  },

  setMicPermission(status) {
    localStorage.setItem(this._prefix + 'mic_permission', status);
  },

  // === 存储空间检查 ===

  getUsage() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this._prefix)) {
        total += localStorage.getItem(key).length;
      }
    }
    return total;
  },

  // 估算剩余空间（localStorage 通常 5-10MB）
  isNearQuota() {
    return this.getUsage() > 4 * 1024 * 1024; // 4MB 警告
  }
};
