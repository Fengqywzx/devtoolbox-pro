// 门槛 · 主应用逻辑

class ThresholdApp {
  constructor() {
    this.contract = new ContractAnalyzer();
    this.wages = new WageTracker();
    this.checkins = new CheckinLogger();
    this.stealthMode = false;
    this.init();
  }

  init() {
    this._bindEvents();
    this._renderRights();
    this._updateWageSummary();
    this._updateCheckinLog();
  }

  _bindEvents() {
    // 隐蔽模式
    document.getElementById('btnStealth')?.addEventListener('click', () => {
      this.stealthMode = !this.stealthMode;
      document.getElementById('app').classList.toggle('stealth-mode', this.stealthMode);
      this._toast(this.stealthMode ? '🔀 已切换为普通界面' : '🔀 已恢复原界面', 'success');
    });

    // 合同上传
    document.getElementById('btnUploadContract')?.addEventListener('click', () => {
      document.getElementById('contractFileInput').click();
    });
    document.getElementById('contractFileInput')?.addEventListener('change', (e) => {
      this._handleContractUpload(e.target.files[0]);
    });

    // 合同文字手动输入（作为备选）
    const contractResult = document.getElementById('contractResult');
    // 在合同区域下方添加手动输入
    const manualInput = document.createElement('div');
    manualInput.innerHTML = `
      <p style="margin-top:12px;font-size:14px;color:var(--text-secondary);">或者直接粘贴合同文字分析：</p>
      <textarea id="contractTextInput" rows="4" placeholder="粘贴合同中的关键条款…"
        style="width:100%;padding:12px;border:2px solid var(--border);border-radius:10px;font-size:16px;font-family:inherit;margin-top:4px;"></textarea>
      <button class="btn-secondary" id="btnAnalyzeText" style="margin-top:8px;">🔍 分析合同文字</button>
    `;
    document.getElementById('contractUpload').appendChild(manualInput);

    document.getElementById('btnAnalyzeText')?.addEventListener('click', () => {
      const text = document.getElementById('contractTextInput').value.trim();
      if (!text) { this._toast('请粘贴合同文字', 'error'); return; }
      this._analyzeAndShow(text);
    });

    // 签到
    document.querySelectorAll('.checkin-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        if (type === 'sos') {
          this._handleSOS();
        } else {
          this.checkins.checkin(type);
          this._updateCheckinLog();
          const label = type === 'enter' ? '已记录进门时间' : '已记录离开时间';
          this._toast(`✅ ${label}`, 'success');
        }
      });
    });

    // 工资记录
    document.getElementById('btnRecordWork')?.addEventListener('click', () => {
      document.getElementById('wageModal').classList.remove('hidden');
    });
    document.getElementById('btnWageCancel')?.addEventListener('click', () => {
      document.getElementById('wageModal').classList.add('hidden');
    });
    document.getElementById('btnWageSave')?.addEventListener('click', () => {
      this._saveWageRecord();
    });

    // 合同结果弹窗关闭
    document.getElementById('btnContractClose')?.addEventListener('click', () => {
      document.getElementById('contractModal').classList.add('hidden');
    });

    // 弹窗遮罩关闭
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.add('hidden');
      });
    });
  }

  // === 合同 ===
  _handleContractUpload(file) {
    if (!file) return;
    this._toast('📷 正在分析合同照片…', 'success');
    // 未来接入真实OCR
    setTimeout(() => {
      this._toast('💡 拍照功能需要接入OCR服务\n请使用下方的文字输入功能进行分析', 'error');
    }, 800);
  }

  _analyzeAndShow(text) {
    const result = this.contract.analyzeText(text);
    const modal = document.getElementById('contractModal');
    const analysis = document.getElementById('contractAnalysis');

    if (result.risks.length === 0) {
      analysis.innerHTML = `
        <div style="padding:20px;text-align:center;color:var(--success);">
          <div style="font-size:48px;">✅</div>
          <div style="font-size:18px;font-weight:600;margin-top:12px;">${result.summary}</div>
        </div>`;
    } else {
      analysis.innerHTML = `
        <div style="font-size:16px;font-weight:600;margin-bottom:12px;padding:12px;background:var(--primary-bg);border-radius:8px;">${result.summary}</div>
        ${result.risks.map(r => `
          <div class="risk-item">
            <span class="risk-badge ${r.risk}">${r.risk === 'high' ? '高风险' : r.risk === 'medium' ? '中风险' : '低风险'}</span>
            <strong>${r.issue}</strong>
            <div style="font-size:15px;color:var(--text-secondary);margin-top:4px;">${r.explain}</div>
            <div style="font-size:14px;color:var(--primary);margin-top:4px;">💡 ${r.recommendation}</div>
          </div>
        `).join('')}
      `;
    }

    modal.classList.remove('hidden');
  }

  // === 工资 ===
  _saveWageRecord() {
    const hours = document.getElementById('workHours').value;
    const wage = document.getElementById('workWage').value;
    const note = document.getElementById('workNote').value;

    if (!hours || parseFloat(hours) <= 0) {
      this._toast('请填写工作小时数', 'error');
      return;
    }

    this.wages.addRecord(hours, wage, note);
    document.getElementById('wageModal').classList.add('hidden');
    this._updateWageSummary();
    this._toast('✅ 已记录', 'success');
  }

  _updateWageSummary() {
    const s = this.wages.getMonthSummary();
    document.getElementById('monthHours').textContent = s.totalHours + 'h';
    document.getElementById('monthWage').textContent = '¥' + s.totalWage;
  }

  // === 签到 ===
  _updateCheckinLog() {
    const entries = this.checkins.getTodayEntries();
    const container = document.getElementById('checkinLog');
    if (entries.length === 0) {
      container.innerHTML = '<div style="font-size:14px;color:var(--text-secondary);margin-top:8px;">今天还没有签到记录</div>';
      return;
    }
    const typeLabels = { enter: '🚶 进门', leave: '🏃 离开', sos: '📞 紧急求助' };
    container.innerHTML = entries.map(e => {
      const d = new Date(e.timestamp);
      return `<div class="checkin-entry">
        <span>${typeLabels[e.type]}</span>
        <span style="flex:1;text-align:right;">${d.toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'})}</span>
      </div>`;
    }).join('');
  }

  _handleSOS() {
    if (confirm('确定要拨打紧急求助电话吗？')) {
      window.location.href = 'tel:110';
    }
  }

  // === 权益知识 ===
  _renderRights() {
    const rights = getRightsList();
    const container = document.getElementById('rightsGrid');
    container.innerHTML = rights.map(r => `
      <div class="rights-item" data-id="${r.id}" onclick="this.nextElementSibling?.classList.toggle('hidden')">
        <span class="rights-icon">${r.icon}</span>
        <div style="flex:1;">
          <div style="font-weight:700;">${r.title}</div>
          <div style="font-size:14px;color:var(--text-secondary);">${r.summary}</div>
        </div>
      </div>
      <div class="rights-detail hidden" style="padding:12px 16px;background:var(--bg);border-radius:0 0 10px 10px;font-size:15px;line-height:1.8;margin-top:-4px;margin-bottom:4px;">
        ${r.detail.split('\n').map(line => `<div>${line}</div>`).join('')}
      </div>
    `).join('');
  }

  // === Toast ===
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
  new ThresholdApp();
});
