// 橘子衣 · 主应用逻辑

class OrangeJacketApp {
  constructor() {
    this.weather = new WeatherEngine();
    this.health = new HealthCheck();
    this.log = new InjuryLog();
    this.currentQIndex = 0;
    this.init();
  }

  init() {
    this._bindEvents();
    this._loadWeather();
    this._updateHealthStatus();
    this._renderTimeline();
    this._setDefaultEventTime();
  }

  // === 事件绑定 ===
  _bindEvents() {
    // SOS
    document.getElementById('btnSOS')?.addEventListener('click', () => {
      document.getElementById('sosModal').classList.remove('hidden');
    });
    document.getElementById('btnSOSClose')?.addEventListener('click', () => {
      document.getElementById('sosModal').classList.add('hidden');
    });

    // 健康自检
    document.getElementById('btnHealthCheck')?.addEventListener('click', () => {
      this._startHealthCheck();
    });

    // 事件记录
    document.getElementById('btnRecordEvent')?.addEventListener('click', () => {
      document.getElementById('eventModal').classList.remove('hidden');
    });
    document.getElementById('btnEventCancel')?.addEventListener('click', () => {
      document.getElementById('eventModal').classList.add('hidden');
    });
    document.getElementById('btnEventSave')?.addEventListener('click', () => {
      this._saveEvent();
    });

    // 健康弹窗
    document.getElementById('btnHealthBack')?.addEventListener('click', () => {
      this._prevQuestion();
    });

    // 附近设施
    document.querySelectorAll('.nearby-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this._showToast('📍 功能开发中：将显示附近' + btn.querySelector('.nearby-label').textContent, 'success');
      });
    });

    // 点击弹窗遮罩关闭
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.add('hidden');
      });
    });
  }

  // === 天气 ===
  async _loadWeather() {
    const weather = await this.weather.fetchWeather();
    this._renderWeather(weather);
  }

  _renderWeather(weather) {
    const { risks, alerts } = this.weather.assessRisks(weather);
    const advice = this.weather.generateAdvice(weather, risks);

    const main = document.getElementById('weatherMain');
    main.innerHTML = `
      <div style="font-size:48px;font-weight:800;">${weather.temp}°C</div>
      <div>体感 ${weather.feelsLike}°C | ${weather.weatherDesc}</div>
      <div class="weather-detail" style="margin-top:8px;">
        💧 湿度 ${weather.humidity}% &nbsp; 🌬 风速 ${weather.windSpeed}km/h<br>
        ☀ UV指数 ${weather.uvIndex} &nbsp; 👁 能见度 ${weather.visibility}km<br>
        🌡 最高 ${weather.maxTemp}° / 最低 ${weather.minTemp}°<br>
        🌅 日出 ${weather.sunrise} / 日落 ${weather.sunset}
      </div>
    `;

    const alertsContainer = document.getElementById('weatherAlerts');
    if (alerts.length > 0) {
      alertsContainer.innerHTML = alerts.map(a => `
        <div style="margin-top:10px;">
          <span class="alert-tag ${a.level}">⚠ ${a.tag}</span>
          <div class="alert-desc">${a.msg}</div>
        </div>
      `).join('');

      // 最高预警级别
      const alertLevel = document.getElementById('alertLevel');
      const highestLevel = alerts.some(a => a.level === 'red') ? 'red' :
                           alerts.some(a => a.level === 'orange') ? 'orange' : 'yellow';
      alertLevel.textContent = highestLevel === 'red' ? '🔴 红色预警' :
                               highestLevel === 'orange' ? '🟠 橙色预警' : '🟡 黄色预警';
      alertLevel.hidden = false;
      alertLevel.style.cssText = `
        font-size:14px;font-weight:700;padding:4px 10px;border-radius:999px;
        background:${highestLevel === 'red' ? 'var(--danger-bg)' : highestLevel === 'orange' ? 'var(--orange-bg)' : 'var(--warning-bg)'};
        color:${highestLevel === 'red' ? 'var(--danger)' : highestLevel === 'orange' ? 'var(--orange-dark)' : '#92400e'};
      `;
    } else {
      alertsContainer.innerHTML = '<div style="color:var(--success);font-weight:600;margin-top:8px;">✅ 今日无特殊天气预警，可正常作业</div>';
    }

    // 作业建议
    if (advice) {
      const adviceHTML = `
        <div class="alert-desc" style="margin-top:12px;background:${advice.canWork ? 'var(--success-bg)' : 'var(--warning-bg)'}">
          <strong>📋 今日作业建议</strong><br>
          ✅ 适宜时段：${advice.bestTimes}<br>
          ⛔ 避开时段：${advice.avoidTimes}<br>
          💧 饮水量：${advice.waterNeeded}<br>
          ⏱ 休息频率：${advice.breakFrequency}
        </div>`;
      document.getElementById('weatherAlerts').insertAdjacentHTML('beforeend', adviceHTML);
    }
  }

  // === 健康自检 ===
  _updateHealthStatus() {
    const lastCheck = document.getElementById('lastCheckTime');
    const time = this.health.getLastCheckTime();
    lastCheck.textContent = time ? `上次检查：${time}` : '今天还未检查';

    // 显示最近结果
    if (this.health.completed) {
      const result = this.health.calculateRisk();
      this._showHealthResult(result);
    }
  }

  _startHealthCheck() {
    this.currentQIndex = 0;
    this.health.currentAnswers = {};
    document.getElementById('healthModal').classList.remove('hidden');
    document.getElementById('btnHealthBack').hidden = true;
    document.getElementById('qTotal').textContent = this.health.allQuestions.length;
    this._renderQuestion();
  }

  _renderQuestion() {
    const q = this.health.allQuestions[this.currentQIndex];
    document.getElementById('qCurrent').textContent = this.currentQIndex + 1;
    document.getElementById('healthQuestionText').textContent = q.text;
    document.getElementById('btnHealthBack').hidden = this.currentQIndex === 0;

    const optionsHTML = q.options.map((opt, i) => `
      <button class="health-option" data-score="${opt.score}" data-idx="${i}">
        ${opt.label}
      </button>
    `).join('');

    const container = document.getElementById('healthOptions');
    container.innerHTML = optionsHTML;
    container.querySelectorAll('.health-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const score = parseInt(btn.dataset.score);
        this.health.recordAnswer(q.id, score);
        this._nextQuestion();
      });
    });
  }

  _nextQuestion() {
    if (this.currentQIndex < this.health.allQuestions.length - 1) {
      this.currentQIndex++;
      document.getElementById('btnHealthBack').hidden = false;
      this._renderQuestion();
    } else {
      // 完成
      document.getElementById('healthModal').classList.add('hidden');
      const result = this.health.calculateRisk();
      this.health.saveResult(result);
      this._showHealthResult(result);
      document.getElementById('lastCheckTime').textContent =
        `上次检查：刚刚`;
    }
  }

  _prevQuestion() {
    if (this.currentQIndex > 0) {
      this.currentQIndex--;
      this._renderQuestion();
    }
  }

  _showHealthResult(result) {
    const container = document.getElementById('healthResult');
    container.hidden = false;
    container.className = `health-result ${result.level}`;
    container.innerHTML = `
      <div style="font-size:20px;font-weight:700;margin-bottom:8px;">
        ${result.level === 'low' ? '✅ 状态良好' :
          result.level === 'medium' ? '⚠️ 需要注意' :
          result.level === 'high' ? '🔴 风险较高' : '🚨 危险警告'}
      </div>
      <div>风险评分：${result.totalScore}/${result.maxScore}</div>
      <div style="margin-top:8px;">${result.advice}</div>
      ${result.specificAdvice.length > 0 ? `
        <div style="margin-top:8px;">
          ${result.specificAdvice.map(a => `<div>${a}</div>`).join('')}
        </div>
      ` : ''}
    `;
  }

  // === 事件记录 ===
  _setDefaultEventTime() {
    const input = document.getElementById('eventTime');
    if (input) {
      const now = new Date();
      input.value = now.toISOString().slice(0, 16);
    }
  }

  _saveEvent() {
    const type = document.getElementById('eventType').value;
    const desc = document.getElementById('eventDesc').value.trim();
    if (!desc) {
      this._showToast('请填写事件描述', 'error');
      return;
    }
    this.log.addEvent(type, desc);
    document.getElementById('eventModal').classList.add('hidden');
    document.getElementById('eventDesc').value = '';
    document.getElementById('injuryCount').textContent = this.log.getCount() + '条';
    this._renderTimeline();
    this._showToast('✅ 事件已记录', 'success');
  }

  _renderTimeline() {
    const events = this.log.getEvents();
    const container = document.getElementById('injuryTimeline');
    document.getElementById('injuryCount').textContent = events.length + '条';

    if (events.length === 0) {
      container.innerHTML = '<div class="empty-state">📋 还没有记录。发生任何事件都可以记录下来，作为工伤认定的证据。</div>';
      return;
    }

    const typeIcons = {
      injury: '🤕', near_miss: '⚠️', unsafe: '🔺',
      harassment: '😡', equipment: '🔧', other: '📝'
    };
    const typeLabels = {
      injury: '受伤', near_miss: '差点出事', unsafe: '不安全条件',
      harassment: '被骚扰', equipment: '设备问题', other: '其他'
    };

    container.innerHTML = events.slice(0, 10).map(e => {
      const d = new Date(e.date);
      return `
        <div class="timeline-item">
          <div class="timeline-icon">${typeIcons[e.type] || '📝'}</div>
          <div class="timeline-content">
            <div>${e.description}</div>
            <div class="timeline-date">${d.toLocaleString('zh-CN')}</div>
            <span class="timeline-tag ${e.type}">${typeLabels[e.type]}</span>
          </div>
        </div>
      `;
    }).join('');

    // 导出按钮
    if (events.length > 0) {
      container.insertAdjacentHTML('beforeend', `
        <button class="btn-secondary" style="margin-top:12px;" id="btnExportEvents">
          📥 导出全部记录
        </button>
      `);
      document.getElementById('btnExportEvents')?.addEventListener('click', () => {
        this.log.downloadEvidence();
        this._showToast('✅ 记录已下载', 'success');
      });
    }
  }

  // === Toast ===
  _showToast(msg, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  new OrangeJacketApp();
});
