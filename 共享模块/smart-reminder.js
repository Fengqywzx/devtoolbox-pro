// v3 智能提醒引擎 — 基于用户行为模式的自适应提醒
// 根据用户活跃时间、偏好、风险等级动态调整提醒频率和内容

class SmartReminder {
  constructor(options = {}) {
    this.projectId = options.projectId || 'default';
    this.storageKey = `sr_${this.projectId}`;
    this.preferences = this._load();
    this.activeTimers = [];
    this.quietHours = this.preferences.quietHours || [22, 7]; // 默认22点-7点不打扰
  }

  _load() {
    try { return JSON.parse(localStorage.getItem(this.storageKey) || '{}'); }
    catch { return {}; }
  }

  _save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
  }

  // 学习用户活跃时间
  learnActiveHours() {
    const hour = new Date().getHours();
    if (!this.preferences.hourlyActivity) this.preferences.hourlyActivity = {};
    this.preferences.hourlyActivity[hour] = (this.preferences.hourlyActivity[hour] || 0) + 1;
    this._save();

    // 自动调整静默时段
    const sorted = Object.entries(this.preferences.hourlyActivity)
      .sort((a, b) => b[1] - a[1]);
    if (sorted.length >= 4) {
      const activeStart = Math.min(...sorted.slice(0, 4).map(e => parseInt(e[0])));
      const activeEnd = Math.max(...sorted.slice(0, 4).map(e => parseInt(e[0])));
      this.quietHours = [(activeEnd + 2) % 24, (activeStart - 1 + 24) % 24];
    }
  }

  // 检查当前是否在静默时段
  isQuietTime() {
    const h = new Date().getHours();
    const [start, end] = this.quietHours;
    if (start < end) return h >= start && h < end;
    return h >= start || h < end;
  }

  // 调度自适应提醒
  schedule(callback, options = {}) {
    const {
      id = 'default',
      intervalMinutes = 60,
      priority = 'normal', // 'high' | 'normal' | 'low'
      condition = null,    // () => boolean
    } = options;

    // 清除同名旧定时器
    this.clear(id);

    // 根据优先级调整频率
    let actualInterval = intervalMinutes;
    if (priority === 'high') actualInterval = Math.max(15, intervalMinutes * 0.5);
    if (priority === 'low') actualInterval = intervalMinutes * 2;

    const timer = setInterval(() => {
      if (this.isQuietTime() && priority !== 'high') return;
      if (condition && !condition()) return;

      this.learnActiveHours();
      callback();
    }, actualInterval * 60000);

    this.activeTimers.push({ id, timer, options });
    return id;
  }

  // 清除定时器
  clear(id) {
    const idx = this.activeTimers.findIndex(t => t.id === id);
    if (idx >= 0) {
      clearInterval(this.activeTimers[idx].timer);
      this.activeTimers.splice(idx, 1);
    }
  }

  // 清除所有
  clearAll() {
    this.activeTimers.forEach(t => clearInterval(t.timer));
    this.activeTimers = [];
  }

  // 生成上下文感知提醒
  generateContextualReminder(data) {
    const hour = new Date().getHours();
    const reminders = [];

    // 根据时段生成不同内容
    if (hour >= 5 && hour < 8) {
      reminders.push('🌅 早上好！开工前记得检查安全装备。');
    } else if (hour >= 11 && hour < 14) {
      reminders.push('🍱 午饭时间！记得补充能量和水分。');
      if (data?.temp >= 35) reminders.push('⚠ 高温时段，注意防暑降温。');
    } else if (hour >= 14 && hour < 17) {
      reminders.push('💪 下午时段，注意保持正确的作业姿势。');
    } else if (hour >= 20 && hour < 23) {
      reminders.push('🌙 收工了。记得记录今天的工时和收入。');
      reminders.push('😴 早点休息，身体是革命的本钱。');
    }

    // 风险联动提醒
    if (data?.rsiRisk === 'high') reminders.push('⚠ 你的劳损风险较高，每小时做一次伸展运动。');
    if (data?.fatigueRisk === 'high') reminders.push('🚨 疲劳程度高，建议提前收工休息。');
    if (data?.weatherAlert) reminders.push(`🌤 ${data.weatherAlert}`);
    if (data?.unpaidDays > 7) reminders.push('💰 你已经连续工作7天，注意休息权益。');

    return reminders;
  }

  // 判断是否应该提醒（基于用户习惯）
  shouldRemind(type) {
    const key = `last_${type}`;
    const last = this.preferences[key];
    if (!last) return true;

    const elapsed = Date.now() - last;
    const intervals = { health: 4 * 3600000, rest: 2 * 3600000, water: 1 * 3600000, posture: 0.5 * 3600000 };
    return elapsed > (intervals[type] || 3600000);
  }

  // 记录提醒事件
  recordReminder(type) {
    this.preferences[`last_${type}`] = Date.now();
    this._save();
  }
}
