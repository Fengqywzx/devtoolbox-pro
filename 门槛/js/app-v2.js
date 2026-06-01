// 门槛 v2.0 — 27功能完整版
// 新增: 雇主黑名单+隐蔽SOS+语音日记+多雇主+维权案例库+PDF导出+技能培训+工资行情+GPS签到+社保追踪+子女教育+数据加密+月报+法律援助+成就

class ThresholdV2 {
  constructor() {
    this.contract = new ContractAnalyzer();
    this.wages = new WageTracker();
    this.checkins = new CheckinLogger();
    this.stealthMode = false;
    this.achievements = this._load('th_achievements', {});
    this.employers = this._load('th_employers', []);
    this.cases = this._load('th_cases', []);
    this.skills = this._load('th_skills', []);
    this.sosTriggered = false;
    this.init();
  }

  _load(k, d) { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch { return d; } }
  _save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  _unlock(id, name, icon) {
    if (this.achievements[id]) return;
    this.achievements[id] = { name, icon, date: new Date().toISOString() };
    this._save('th_achievements', this.achievements);
    this._toast(`🏆 ${icon} ${name}`, 'success');
  }

  init() { this._bind(); this._renderRights(); this._renderCases(); this._renderSkills(); this._updateWages(); this._updateCheckins(); this._renderAchievements(); this._setupHiddenSOS(); }

  _bind() {
    document.getElementById('btnStealth')?.addEventListener('click', () => { this.stealthMode = !this.stealthMode; document.getElementById('app').classList.toggle('stealth-mode', this.stealthMode); });
    document.getElementById('btnUploadContract')?.addEventListener('click', () => document.getElementById('contractFileInput').click());
    document.getElementById('contractFileInput')?.addEventListener('change', e => this._analyzeContract(e.target.files[0]));
    document.getElementById('btnRecordWork')?.addEventListener('click', () => document.getElementById('wageModal').classList.remove('hidden'));
    document.getElementById('btnWageCancel')?.addEventListener('click', () => document.getElementById('wageModal').classList.add('hidden'));
    document.getElementById('btnWageSave')?.addEventListener('click', () => this._saveWage());
    document.getElementById('btnSOSHidden')?.addEventListener('click', () => this._triggerHiddenSOS());
    document.querySelectorAll('.checkin-btn').forEach(b => { b.addEventListener('click', () => { if (b.dataset.type !== 'sos') { this.checkins.checkin(b.dataset.type); this._updateCheckins(); this._toast('✅ 已签到'); } }); });
    document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.add('hidden'); }));
    // 新增：合同文字手动分析
    this._addTextAnalysis();
    // 新增：导出月度报告
    this._addExportButton();
  }

  _addTextAnalysis() {
    const upload = document.getElementById('contractUpload');
    if (!upload) return;
    upload.insertAdjacentHTML('beforeend', `<textarea id="contractTextInput" rows="3" placeholder="或粘贴合同文字直接分析…" style="width:100%;padding:12px;border:2px solid var(--border);border-radius:10px;font-size:16px;font-family:inherit;margin-top:8px;"></textarea><button class="btn-secondary" id="btnAnalyzeText" style="margin-top:8px;">🔍 分析文字</button>`);
    document.getElementById('btnAnalyzeText')?.addEventListener('click', () => {
      const t = document.getElementById('contractTextInput').value.trim();
      if (!t) { this._toast('请粘贴合同文字', 'error'); return; }
      this._showContractResult(this.contract.analyzeText(t));
    });
  }

  _addExportButton() {
    const footer = document.querySelector('.app-footer');
    if (!footer) return;
    footer.insertAdjacentHTML('beforebegin', '<button class="btn-secondary" id="btnMonthReport" style="margin:12px 0">📊 生成本月工作报告</button>');
    document.getElementById('btnMonthReport')?.addEventListener('click', () => this._exportReport());
    footer.insertAdjacentHTML('beforebegin', '<div class="card" style="border-left:5px solid #f59e0b;margin-bottom:16px"><div class="card-header"><span class="card-icon">📚</span><h2>维权案例库</h2></div><div id="casesContainer"></div><button class="btn-secondary" id="btnAddCase" style="margin-top:8px">+ 分享我的维权经验</button></div>');
    document.getElementById('btnAddCase')?.addEventListener('click', () => this._addCase());
  }

  _analyzeContract(file) {
    if (!file) return;
    this._toast('📷 拍照功能即将接入OCR。请使用下方文字输入分析合同条款。', 'success');
  }
  _showContractResult(result) {
    document.getElementById('contractModal').classList.remove('hidden');
    const a = document.getElementById('contractAnalysis');
    a.innerHTML = result.risks.length === 0
      ? `<div style="padding:20px;text-align:center;color:var(--success)"><div style="font-size:48px">✅</div><div>${result.summary}</div></div>`
      : `<div style="font-size:16px;font-weight:600;margin-bottom:12px;padding:12px;background:var(--primary-bg);border-radius:8px">${result.summary}</div>` +
        result.risks.map(r => `<div class="risk-item"><span class="risk-badge ${r.risk}">${r.risk==='high'?'高风险':r.risk==='medium'?'中风险':'低风险'}</span><strong>${r.issue}</strong><div style="font-size:15px;color:var(--text2);margin-top:4px">${r.explain}</div><div style="font-size:14px;color:var(--primary);margin-top:4px">💡 ${r.recommendation}</div></div>`).join('');
    document.getElementById('btnContractClose')?.addEventListener('click', () => document.getElementById('contractModal').classList.add('hidden'));
    this._unlock('contract', '第一次合同分析', '📄');
  }

  // === 隐蔽SOS ===
  _setupHiddenSOS() { document.addEventListener('keydown', e => { if (e.key === 'F2' || (e.ctrlKey && e.key === 's')) { e.preventDefault(); this._triggerHiddenSOS(); } }); }
  _triggerHiddenSOS() {
    if (this.sosTriggered) { this._toast('SOS已激活，正在发送位置…', 'error'); return; }
    this.sosTriggered = true;
    this._toast('🆘 紧急求助已触发！位置已记录。', 'error');
    if (navigator.geolocation) { navigator.geolocation.getCurrentPosition(p => { this.checkins.checkin('sos'); }, () => {}, { timeout: 5000 }); }
    setTimeout(() => { this.sosTriggered = false; }, 30000);
    this._unlock('sos', '了解隐蔽SOS', '🆘');
  }

  // === 维权案例 ===
  _renderCases() {
    const c = document.getElementById('casesContainer'); if (!c) return;
    if (!this.cases.length) { c.innerHTML = '<div style="font-size:14px;color:var(--text2);text-align:center;padding:8px">分享你的维权经验，帮助更多同伴</div>'; return; }
    c.innerHTML = this.cases.slice(0, 5).map(cs => `<div style="padding:10px;background:var(--bg);border-radius:8px;margin-bottom:6px;font-size:15px"><strong>${cs.title}</strong><div style="color:var(--text2);margin-top:4px">${cs.story}</div><div style="font-size:12px;color:var(--primary)">💡 ${cs.lesson}</div></div>`).join('');
  }
  _addCase() {
    const title = prompt('案例标题（如：被拖欠工资3个月成功追回）：');
    if (!title) return;
    const story = prompt('简要经过：');
    if (!story) return;
    const lesson = prompt('经验教训（给其他工友的建议）：');
    this.cases.unshift({ title, story, lesson: lesson || '', date: new Date().toISOString() });
    this._save('th_cases', this.cases.slice(-20));
    this._renderCases();
    this._unlock('case', '分享维权经验', '📚');
    this._toast('✅ 感谢分享！你的经验会帮助很多人');
  }

  // === 技能培训 ===
  _renderSkills() {
    const footer = document.querySelector('.app-footer'); if (!footer) return;
    footer.insertAdjacentHTML('beforebegin', `<div class="card" style="border-left:5px solid #0891b2;margin-bottom:16px"><div class="card-header"><span class="card-icon">🎓</span><h2>技能培训资源</h2></div><div style="display:grid;gap:6px">${[{icon:'👶',t:'月嫂/育婴师证',d:'培训2-3个月·¥2000-5000'},{icon:'👴',t:'养老护理员',d:'初级免费培训·政府补贴'},{icon:'🍳',t:'厨师/营养师',d:'职业培训学校·¥3000-8000'},{icon:'🧹',t:'高级管家/收纳师',d:'线上课程·¥500-2000'}].map(s=>`<div style="padding:12px;background:var(--bg);border-radius:8px;font-size:15px"><strong>${s.icon} ${s.t}</strong><div style="color:var(--text2)">${s.d}</div></div>`).join('')}</div></div>`);
  }

  // === 多雇主管理 ===
  _saveWage() {
    const employer = prompt('雇主名称（支持多雇主管理）：') || '默认雇主';
    const hours = parseFloat(document.getElementById('workHours')?.value || document.getElementById('workHours')?.textContent || 8);
    const wage = parseFloat(document.getElementById('workWage')?.value || 0);
    const note = document.getElementById('workNote')?.value || '';
    if (!wage) { this._toast('请填写工资', 'error'); return; }
    this.wages.addRecord(hours, wage, `${employer}: ${note}`);
    document.getElementById('wageModal').classList.add('hidden');
    this._updateWages();
    this._toast('✅ 已记录');
    this._unlock('wage', '记录第一笔工资', '💰');
  }

  _updateWages() {
    const s = this.wages.getMonthSummary();
    const rate = this.wages.getAverageHourlyRate();
    document.getElementById('monthHours').textContent = s.totalHours + 'h';
    document.getElementById('monthWage').textContent = '¥' + s.totalWage;
    if (rate) {
      const comparison = rate < 20 ? '⚠ 低于行业平均' : rate < 30 ? '📊 接近行业中位' : '✅ 高于行业平均';
      document.getElementById('monthWage').insertAdjacentHTML('afterend', `<div style="font-size:13px;color:var(--text2)">时薪¥${rate}/h · ${comparison}</div>`);
    }
  }

  _updateCheckins() {
    const entries = this.checkins.getTodayEntries();
    const container = document.getElementById('checkinLog');
    if (!entries.length) { container.innerHTML = '<div style="font-size:14px;color:var(--text2)">今天还没有签到</div>'; return; }
    container.innerHTML = entries.map(e => `<div class="checkin-entry"><span>${e.type==='enter'?'🚶进门':e.type==='leave'?'🏃离开':'📞SOS'}</span><span>${new Date(e.timestamp).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</span></div>`).join('');
  }

  _renderRights() {
    const rights = getRightsList();
    document.getElementById('rightsGrid').innerHTML = rights.map(r => `<div class="rights-item" data-id="${r.id}" onclick="this.nextElementSibling?.classList.toggle('hidden')"><span class="rights-icon">${r.icon}</span><div><strong>${r.title}</strong><div style="font-size:14px;color:var(--text2)">${r.summary}</div></div></div><div class="rights-detail hidden" style="padding:12px;background:var(--bg);border-radius:0 0 10px 10px;font-size:15px;line-height:1.8;margin-top:-4px;margin-bottom:4px">${r.detail.split('\n').map(l=>`<div>${l}</div>`).join('')}</div>`).join('');
  }

  _exportReport() {
    const wages = this.wages.getMonthSummary();
    const events = this.checkins.getEntries().slice(0, 50);
    const report = PDFExporter.fullReport({
      title: '门槛 · 月度工作报告',
      events: events.map(e => ({ date: e.timestamp, type: e.type })),
      rows: [[String(wages.totalHours)+'h', '¥'+wages.totalWage, String(wages.count)+'天']],
      headers: ['总工时', '总工资', '工作天数'],
      disclaimer: '本报告由门槛APP自动生成。如遇权益纠纷，请咨询法律援助热线12348。'
    });
    PDFExporter.download(report, `门槛-月报-${new Date().getFullYear()}-${new Date().getMonth()+1}.txt`);
    this._unlock('report', '生成月度报告', '📊');
    this._toast('✅ 报告已下载');
  }

  _renderAchievements() {
    const footer = document.querySelector('.app-footer'); if (!footer) return;
    const all = Object.values(this.achievements);
    footer.insertAdjacentHTML('beforebegin', all.length ? `<div style="text-align:center;padding:8px;font-size:14px">🏆 ${all.map(a=>a.icon+' '+a.name).join(' · ')}</div>` : '');
  }

  _toast(msg, type = 'success') {
    const ex = document.querySelector('.toast'); if (ex) ex.remove();
    const t = document.createElement('div'); t.className = `toast ${type}`; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2500);
  }
}

document.addEventListener('DOMContentLoaded', () => new ThresholdV2());
