// 工伤/事件记录器
// 时间线式工作事件日志，支持导出证据包

class InjuryLog {
  constructor() {
    this.events = this._load();
  }

  _load() {
    try {
      return JSON.parse(localStorage.getItem('oj_events') || '[]');
    } catch { return []; }
  }

  _save() {
    localStorage.setItem('oj_events', JSON.stringify(this.events));
  }

  addEvent(type, description) {
    const event = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      type,
      description,
      date: new Date().toISOString(),
      location: null // 未来可加GPS
    };
    this.events.unshift(event);
    this._save();
    return event;
  }

  getEvents() {
    return this.events;
  }

  getCount() {
    return this.events.length;
  }

  deleteEvent(id) {
    this.events = this.events.filter(e => e.id !== id);
    this._save();
  }

  // 导出证据包（文本格式）
  exportEvidence() {
    if (this.events.length === 0) return '暂无记录。';

    let report = '═══════════════════════════════\n';
    report += '  橘子衣 · 工作事件记录\n';
    report += '  导出时间：' + new Date().toLocaleString('zh-CN') + '\n';
    report += '═══════════════════════════════\n\n';

    const typeLabels = {
      injury: '受伤',
      near_miss: '差点出事',
      unsafe: '不安全的工作条件',
      harassment: '被骚扰/被刁难',
      equipment: '工具/设备问题',
      other: '其他'
    };

    this.events.forEach((e, i) => {
      const d = new Date(e.date);
      report += `【${i + 1}】${typeLabels[e.type] || e.type}\n`;
      report += `时间：${d.toLocaleString('zh-CN')}\n`;
      report += `描述：${e.description}\n`;
      report += '\n---\n\n';
    });

    report += '\n═══════════════════════════════\n';
    report += '  本记录可作为工伤认定辅助材料\n';
    report += '═══════════════════════════════\n';

    return report;
  }

  // 导出为可下载文件
  downloadEvidence() {
    const text = this.exportEvidence();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `橘子衣-工作记录-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
