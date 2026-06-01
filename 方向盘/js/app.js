// 方向盘 · 主应用

class SteeringWheelApp {
  constructor() {
    this.isDriving = false;
    this.driveStartTime = null;
    this.todayDriveMinutes = 0;
    this.incomes = this._loadIncomes();
    this.platformStats = {};
    this._updateTimer = null;
    this.init();
  }

  init() {
    this._bindEvents();
    this._renderIncomeLog();
    this._updatePlatformStats();
    this._updateDisplay();
  }

  _loadIncomes() {
    try {
      const saved = JSON.parse(localStorage.getItem('sw_incomes') || '[]');
      return saved;
    } catch { return []; }
  }

  _saveIncomes() {
    localStorage.setItem('sw_incomes', JSON.stringify(this.incomes));
  }

  _bindEvents() {
    document.getElementById('btnToggleDriving')?.addEventListener('click', () => this._toggleDriving());
    document.getElementById('btnAddIncome')?.addEventListener('click', () => {
      document.getElementById('incomeModal').classList.remove('hidden');
    });
    document.getElementById('btnIncomeCancel')?.addEventListener('click', () => {
      document.getElementById('incomeModal').classList.add('hidden');
    });
    document.getElementById('btnIncomeSave')?.addEventListener('click', () => this._saveIncome());
    document.querySelectorAll('.modal-overlay').forEach(o => {
      o.addEventListener('click', (e) => { if (e.target === o) o.classList.add('hidden'); });
    });
  }

  _toggleDriving() {
    if (!this.isDriving) {
      this.isDriving = true;
      this.driveStartTime = new Date();
      document.getElementById('btnToggleDriving').classList.add('active');
      document.getElementById('drivingStatus').textContent = '⏹ 停止记录';
      this._startTimer();
      this._toast('开始记录驾驶时间，注意安全！', 'success');
    } else {
      this.isDriving = false;
      if (this.driveStartTime) {
        const mins = Math.round((new Date() - this.driveStartTime) / 60000);
        this.todayDriveMinutes += mins;
      }
      document.getElementById('btnToggleDriving').classList.remove('active');
      document.getElementById('drivingStatus').textContent = '▶ 开始记录';
      clearInterval(this._updateTimer);
      this._updateDisplay();
      this._toast('已停止记录，辛苦了！', 'success');
    }
  }

  _startTimer() {
    this._updateTimer = setInterval(() => {
      if (this.isDriving && this.driveStartTime) {
        const extraMin = Math.round((new Date() - this.driveStartTime) / 60000);
        this._updateDisplay(extraMin);
      }
    }, 30000);
  }

  _updateDisplay(extraMin = 0) {
    const totalMin = this.todayDriveMinutes + extraMin;
    const hours = (totalMin / 60).toFixed(1);
    document.getElementById('todayHours').textContent = hours + 'h';

    // 疲劳评分
    let fatigueLevel, fatigueText, restMsg;
    if (totalMin < 180) {
      fatigueLevel = 'low'; fatigueText = '正常'; restMsg = '暂时不需要';
    } else if (totalMin < 360) {
      fatigueLevel = 'medium'; fatigueText = '注意'; restMsg = '建议休息15分钟';
    } else if (totalMin < 480) {
      fatigueLevel = 'high'; fatigueText = '疲劳'; restMsg = '立即休息！';
    } else {
      fatigueLevel = 'critical'; fatigueText = '危险'; restMsg = '必须停车休息！';
    }

    document.getElementById('fatigueScore').textContent = fatigueText;
    document.getElementById('restReminder').textContent = restMsg;

    const bar = document.getElementById('fatigueBar');
    const pct = Math.min(100, (totalMin / 480) * 100);
    bar.innerHTML = `<div class="fatigue-fill ${fatigueLevel}" style="width:${pct}%"></div>`;
  }

  _saveIncome() {
    const platform = document.getElementById('incomePlatform').value;
    const amount = parseFloat(document.getElementById('incomeAmount').value) || 0;
    const hours = parseFloat(document.getElementById('incomeHours').value) || 0;

    if (!amount) { this._toast('请填写收入金额', 'error'); return; }

    this.incomes.unshift({
      id: Date.now().toString(36),
      date: new Date().toISOString(),
      platform,
      amount,
      hours
    });
    this._saveIncomes();
    document.getElementById('incomeModal').classList.add('hidden');
    document.getElementById('incomeAmount').value = '';
    this._renderIncomeLog();
    this._updatePlatformStats();
    this._toast('✅ 已记录', 'success');
  }

  _renderIncomeLog() {
    const today = new Date().toDateString();
    const todayEntries = this.incomes.filter(e => new Date(e.date).toDateString() === today);
    const totalToday = todayEntries.reduce((s, e) => s + e.amount, 0);
    const hoursToday = todayEntries.reduce((s, e) => s + e.hours, 0);

    document.getElementById('todayIncome').textContent = '¥' + totalToday;
    document.getElementById('todayHourlyRate').textContent =
      hoursToday > 0 ? '¥' + Math.round(totalToday / hoursToday) + '/h' : '¥0/h';

    const container = document.getElementById('incomeLog');
    if (todayEntries.length === 0) {
      container.innerHTML = '<div style="font-size:15px;color:var(--text-secondary);text-align:center;padding:8px;">今天还没有记录</div>';
      return;
    }
    container.innerHTML = todayEntries.slice(0, 8).map(e => `
      <div class="income-item">
        <span class="income-platform">${e.platform}</span>
        <span>${e.hours}h</span>
        <strong>¥${e.amount}</strong>
      </div>
    `).join('');
  }

  _updatePlatformStats() {
    const now = new Date();
    const monthEntries = this.incomes.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const stats = {};
    monthEntries.forEach(e => {
      if (!stats[e.platform]) stats[e.platform] = { total: 0, hours: 0 };
      stats[e.platform].total += e.amount;
      stats[e.platform].hours += e.hours;
    });

    const container = document.getElementById('platformGrid');
    const entries = Object.entries(stats).sort((a, b) => b[1].total - a[1].total);

    if (entries.length === 0) {
      container.innerHTML = '<div style="font-size:15px;color:var(--text-secondary);text-align:center;">本月还没有收入记录</div>';
      return;
    }

    const maxTotal = Math.max(...entries.map(e => e[1].total), 1);
    container.innerHTML = entries.map(([name, s]) => {
      const rate = s.hours > 0 ? Math.round(s.total / s.hours) : 0;
      return `
        <div class="platform-item">
          <div style="flex:1;">
            <strong>${name}</strong>
            <div>¥${s.total} / ${s.hours}h · 时薪¥${rate}</div>
            <div class="platform-bar"><div class="platform-fill" style="width:${(s.total/maxTotal)*100}%"></div></div>
          </div>
        </div>
      `;
    }).join('');
  }

  _toast(msg, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const t = document.createElement('div');
    t.className = `toast ${type}`; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }
}

document.addEventListener('DOMContentLoaded', () => new SteeringWheelApp());
