// 工资工时追踪器

class WageTracker {
  constructor() {
    this.records = this._load();
  }

  _load() {
    try { return JSON.parse(localStorage.getItem('th_wage_records') || '[]'); }
    catch { return []; }
  }

  _save() {
    localStorage.setItem('th_wage_records', JSON.stringify(this.records));
  }

  addRecord(hours, wage, note = '') {
    const record = {
      id: Date.now().toString(36),
      date: new Date().toISOString(),
      hours: parseFloat(hours) || 0,
      wage: parseFloat(wage) || 0,
      note: note.trim()
    };
    this.records.unshift(record);
    this._save();
    return record;
  }

  getRecords() {
    return this.records;
  }

  // 本月汇总
  getMonthSummary() {
    const now = new Date();
    const monthRecords = this.records.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const totalHours = monthRecords.reduce((sum, r) => sum + r.hours, 0);
    const totalWage = monthRecords.reduce((sum, r) => sum + r.wage, 0);

    return { totalHours, totalWage, count: monthRecords.length };
  }

  // 获取日平均时薪
  getAverageHourlyRate() {
    const summary = this.getMonthSummary();
    if (summary.totalHours === 0) return 0;
    return Math.round(summary.totalWage / summary.totalHours);
  }

  deleteRecord(id) {
    this.records = this.records.filter(r => r.id !== id);
    this._save();
  }
}
