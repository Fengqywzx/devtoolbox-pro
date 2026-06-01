// 化学品接触记录器

class ChemicalLog {
  constructor() {
    this.entries = this._load();
  }

  _load() {
    try { return JSON.parse(localStorage.getItem('mt_chemicals') || '[]'); }
    catch { return []; }
  }

  _save() {
    localStorage.setItem('mt_chemicals', JSON.stringify(this.entries));
  }

  addEntry(name, duration, protection) {
    const entry = {
      id: Date.now().toString(36),
      date: new Date().toISOString(),
      name: name.trim(),
      duration: parseFloat(duration) || 8,
      protection: protection || 'none'
    };
    this.entries.unshift(entry);
    this._save();
    return entry;
  }

  getEntries() {
    return this.entries;
  }

  getCount() {
    return this.entries.length;
  }

  // 健康建议
  getHealthAdvice() {
    const chemicals = [...new Set(this.entries.map(e => e.name))];
    const advice = [];

    if (chemicals.some(c => /焊|烟雾|烟尘/i.test(c))) {
      advice.push('焊接烟尘含重金属，长期吸入可致尘肺。务必佩戴专业防尘口罩（N95以上）。每年做一次肺功能检查。');
    }
    if (chemicals.some(c => /漆|溶剂|稀释剂|甲苯|二甲苯/i.test(c))) {
      advice.push('有机溶剂可通过皮肤和呼吸道吸收。佩戴防有机气体口罩和丁腈手套。如果出现头晕、恶心立即离开并通风。');
    }
    if (chemicals.some(c => /酸|碱|腐蚀/i.test(c))) {
      advice.push('接触酸碱化学品：必须戴防化手套和护目镜。皮肤接触立即用大量清水冲洗15分钟。');
    }

    return advice;
  }

  deleteEntry(id) {
    this.entries = this.entries.filter(e => e.id !== id);
    this._save();
  }
}
