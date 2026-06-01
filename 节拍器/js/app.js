// 节拍器 · 主应用逻辑

class MetronomeApp {
  constructor() {
    this.rsi = new RSIAssessor();
    this.chemicals = new ChemicalLog();
    this.currentRSIQ = 0;
    this.init();
  }

  init() {
    this._bindEvents();
    this._renderExercises();
    this._renderChemicalLog();
  }

  _bindEvents() {
    // RSI评估
    document.getElementById('btnRSIAssess')?.addEventListener('click', () => {
      this._startRSI();
    });

    // 加班费计算
    document.getElementById('btnCalcOvertime')?.addEventListener('click', () => {
      this._calcOvertime();
    });

    // 化学品记录
    document.getElementById('btnRecordChemical')?.addEventListener('click', () => {
      document.getElementById('chemModal').classList.remove('hidden');
    });
    document.getElementById('btnChemCancel')?.addEventListener('click', () => {
      document.getElementById('chemModal').classList.add('hidden');
    });
    document.getElementById('btnChemSave')?.addEventListener('click', () => {
      this._saveChemical();
    });

    // 弹窗遮罩
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.add('hidden');
      });
    });
  }

  // === RSI评估 ===
  _startRSI() {
    this.currentRSIQ = 0;
    this.rsi.answers = {};
    document.getElementById('rsiModal').classList.remove('hidden');
    this._showRSIQuestion();
  }

  _showRSIQuestion() {
    const q = this.rsi.questions[this.currentRSIQ];
    const container = document.getElementById('rsiModal').querySelector('.modal-card');
    document.getElementById('rsiQuestion').textContent =
      `第${this.currentRSIQ + 1}题/${this.rsi.questions.length}：${q.text}`;

    document.getElementById('rsiOptions').innerHTML = q.options.map((opt, i) => `
      <button class="rsi-option" data-score="${opt.score}" data-idx="${i}">${opt.label}</button>
    `).join('');

    document.getElementById('rsiOptions').querySelectorAll('.rsi-option').forEach(btn => {
      btn.addEventListener('click', () => {
        this.rsi.recordAnswer(q.id, parseInt(btn.dataset.score));
        this._nextRSIQuestion();
      });
    });
  }

  _nextRSIQuestion() {
    if (this.currentRSIQ < this.rsi.questions.length - 1) {
      this.currentRSIQ++;
      this._showRSIQuestion();
    } else {
      document.getElementById('rsiModal').classList.add('hidden');
      this._showRSIResult();
    }
  }

  _showRSIResult() {
    const result = this.rsi.assess();
    if (!result) return;

    const container = document.getElementById('rsiResult');
    container.hidden = false;

    const levelLabels = { low: '✅ 低风险', medium: '⚠️ 中等风险', high: '🔴 高风险', critical: '🚨 极高风险' };
    container.innerHTML = `
      <div class="rsi-level ${result.level}">
        <div class="rsi-score">${result.total}/${result.max}</div>
        <div class="rsi-label">${levelLabels[result.level]}</div>
        <div style="font-size:16px;margin-top:4px;">重点部位：${result.bodyParts.join('、')}</div>
        <div class="rsi-advice">
          ${result.actions.map(a => `<div>• ${a}</div>`).join('')}
        </div>
      </div>
      <button class="btn-secondary" style="margin-top:12px;" onclick="location.reload()">
        🔄 重新评估
      </button>
    `;
  }

  // === 预防训练 ===
  _renderExercises() {
    const exercises = [
      { icon: '🤲', name: '手腕伸展', desc: '手臂伸直，手掌向上，另一只手轻拉手指', count: '每只手10秒 × 3次' },
      { icon: '🔄', name: '肩膀环绕', desc: '双肩同时向前/向后画圈', count: '各10圈' },
      { icon: '🙆', name: '颈部侧屈', desc: '头缓慢向一侧倾斜，手轻压加强拉伸', count: '每侧15秒 × 2次' },
      { icon: '🧘', name: '腰部扭转', desc: '坐姿，身体缓慢向一侧扭转，保持10秒', count: '每侧 × 3次' },
      { icon: '✊', name: '手指开合', desc: '用力握拳5秒，然后完全打开手指', count: '重复10次' },
    ];

    const container = document.getElementById('exerciseList');
    container.innerHTML = exercises.map((e, i) => `
      <div class="exercise-item" data-idx="${i}" onclick="this.classList.toggle('completed')">
        <div class="exercise-icon">${e.icon}</div>
        <div class="exercise-info">
          <div class="exercise-name">${e.name}</div>
          <div class="exercise-desc">${e.desc}</div>
        </div>
        <div class="exercise-timer">${e.count}</div>
      </div>
    `).join('');
  }

  // === 加班费 ===
  _calcOvertime() {
    const salary = parseFloat(document.getElementById('baseSalary').value) || 0;
    const weekday = parseFloat(document.getElementById('weekdayOT').value) || 0;
    const weekend = parseFloat(document.getElementById('weekendOT').value) || 0;
    const holiday = parseFloat(document.getElementById('holidayOT').value) || 0;

    if (salary <= 0) { this._toast('请填写月基本工资', 'error'); return; }

    const result = OvertimeCalculator.calculate(salary, weekday, weekend, holiday);
    const container = document.getElementById('overtimeResult');
    container.hidden = false;

    container.innerHTML = `
      <div style="font-size:16px;color:var(--text-secondary);margin-bottom:8px;">你的时薪：<strong>¥${result.hourlyRate}/小时</strong></div>
      ${result.breakdown.map(b => `
        <div class="overtime-line">
          <span>${b.label}</span>
          <span>${b.hours}h × ¥${b.rate} = <strong>¥${b.amount}</strong></span>
        </div>
      `).join('')}
      <div class="overtime-total">应得加班费合计：¥${result.total}</div>
      ${result.tips.length > 0 ? `
        <div style="margin-top:12px;padding:12px;background:var(--warning-bg);border-radius:8px;font-size:15px;line-height:1.8;">
          ${result.tips.map(t => `<div>${t}</div>`).join('')}
        </div>
      ` : ''}
    `;
  }

  // === 化学品 ===
  _saveChemical() {
    const name = document.getElementById('chemName').value.trim();
    const duration = document.getElementById('chemDuration').value;
    const protection = document.getElementById('chemProtection').value;

    if (!name) { this._toast('请填写化学品名称', 'error'); return; }

    this.chemicals.addEntry(name, duration, protection);
    document.getElementById('chemModal').classList.add('hidden');
    document.getElementById('chemName').value = '';
    this._renderChemicalLog();
    this._toast('✅ 已记录', 'success');
  }

  _renderChemicalLog() {
    const entries = this.chemicals.getEntries();
    document.getElementById('chemCount').textContent = entries.length + '条';

    const container = document.getElementById('chemicalLog');
    if (entries.length === 0) {
      container.innerHTML = '<div style="font-size:15px;color:var(--text-secondary);text-align:center;padding:12px;">还没有记录。化学品暴露记录是职业病认定的重要证据。</div>';
      return;
    }

    const protLabels = { none: '无防护', mask: '口罩', gloves: '手套', full: '全套' };
    const protClasses = { none: 'none', mask: 'partial', gloves: 'partial', full: 'full' };

    container.innerHTML = entries.slice(0, 10).map(e => {
      const d = new Date(e.date);
      return `
        <div class="chemical-item">
          <div class="chem-icon">🧪</div>
          <div class="chem-info">
            <div><strong>${e.name}</strong> · ${e.duration}h</div>
            <div class="chem-date">${d.toLocaleDateString('zh-CN')}</div>
          </div>
          <span class="chem-warning ${protClasses[e.protection]}">${protLabels[e.protection]}</span>
        </div>
      `;
    }).join('');

    const healthAdvice = this.chemicals.getHealthAdvice();
    if (healthAdvice.length > 0) {
      container.insertAdjacentHTML('beforeend', `
        <div style="margin-top:12px;padding:12px;background:var(--warning-bg);border-radius:8px;font-size:14px;line-height:1.8;">
          <strong>⚠ 健康提醒：</strong><br>
          ${healthAdvice.map(a => `• ${a}`).join('<br>')}
        </div>
      `);
    }
  }

  _toast(msg, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MetronomeApp();
});
