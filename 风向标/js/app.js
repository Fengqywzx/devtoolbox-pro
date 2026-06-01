// 风信标 — 主控制器
// 管理页面状态、骑行生命周期、UI 更新

class WindVane {
  constructor() {
    this.recorder = new TripRecorder();
    this.monitor = new RideMonitor(this.recorder);
    this.analytics = new Analytics(this.recorder);
    this.appeal = new AppealHelper(this.recorder);

    this.isRiding = false;
    this.currentView = 'dashboard';

    this._bindEvents();
    this._updateHistoryView();
    this._tickTimer = null;
  }

  _bindEvents() {
    // 开始骑行
    document.getElementById('btn-start-ride')?.addEventListener('click', () => {
      this._startRide();
    });

    // 结束骑行
    document.getElementById('btn-end-ride')?.addEventListener('click', () => {
      this._endRide();
    });

    // 底部导航
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        this._switchView(item.dataset.view);
      });
    });

    // 申诉类型切换
    document.querySelectorAll('.appeal-type').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.appeal-type').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._renderAppeal(btn.dataset.type);
      });
    });

    // 复制申诉文本
    document.getElementById('btn-copy-appeal')?.addEventListener('click', () => {
      const text = document.getElementById('appeal-output').textContent;
      navigator.clipboard.writeText(text).then(() => alert('已复制')).catch(() => alert('复制失败'));
    });

    // 导出数据
    document.getElementById('btn-export-data')?.addEventListener('click', () => {
      const data = this.recorder.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `windvane_data_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  _startRide() {
    this.isRiding = true;
    this.recorder.startTrip();

    document.getElementById('btn-start-ride').classList.add('hidden');
    document.getElementById('btn-end-ride').classList.remove('hidden');

    // GPS 指示器
    const gpsEl = document.getElementById('gps-indicator');
    if (gpsEl) {
      gpsEl.textContent = '● GPS';
      gpsEl.className = 'gps-on';
    }

    // 启动监测
    this.monitor.start({
      onSpeedUpdate: (speed) => this._onSpeedUpdate(speed),
      onPositionUpdate: (lat, lng) => {
        // GPS 指示器保持绿色
        const gps = document.getElementById('gps-indicator');
        if (gps) gps.className = 'gps-on';
      },
      onEvent: (type, data) => this._onSafetyEvent(type, data)
    });

    // 计时器
    this._rideStartTime = Date.now();
    this._tickTimer = setInterval(() => this._tick(), 1000);

    // 清空事件列表
    document.getElementById('event-list').innerHTML = '';
  }

  _endRide() {
    this.isRiding = false;
    const trip = this.recorder.endTrip();
    this.monitor.stop();

    document.getElementById('btn-start-ride').classList.remove('hidden');
    document.getElementById('btn-end-ride').classList.add('hidden');

    if (this._tickTimer) {
      clearInterval(this._tickTimer);
      this._tickTimer = null;
    }

    // 重置速度显示
    document.getElementById('speed-display').textContent = '--';
    document.getElementById('speed-card').classList.remove('warning', 'danger');

    // 更新历史
    this._updateHistoryView();

    // 如果有申诉数据，提示
    if (trip && trip.events.length > 2) {
      document.getElementById('alert-banner').classList.remove('hidden');
      document.getElementById('alert-banner').className = 'alert-banner warning';
      document.getElementById('alert-text').textContent =
        `本次行程有 ${trip.events.length} 次安全事件，可生成申诉材料`;
    }

    // 添加结束事件
    this._addEvent('info', '行程结束', '数据已保存');
  }

  _onSpeedUpdate(speed) {
    const speedDisplay = document.getElementById('speed-display');
    const speedCard = document.getElementById('speed-card');

    speedDisplay.textContent = Math.round(speed);
    speedCard.classList.remove('warning', 'danger');

    if (speed > 25) {
      speedCard.classList.add('danger');
    } else if (speed > 20) {
      speedCard.classList.add('warning');
    }
  }

  _onSafetyEvent(type, data) {
    const labels = {
      hard_brake: '⚠️ 急刹',
      overspeed: '⚡ 超速',
      swerve: '↗ 蛇形',
      fall: '💥 摔倒',
      near_miss: '⚠ 险情'
    };

    const details = {
      hard_brake: `减速 ${data.deceleration} m/s²`,
      overspeed: `${data.speed} km/h (限${data.limit})`,
      swerve: `航向变化 ${data.headingChange}°`,
      fall: `速度从 ${data.lastSpeed} km/h 骤降`,
      near_miss: data.description || '接近碰撞'
    };

    this._addEvent(type, labels[type] || type, details[type] || '');

    // 显示警告横幅
    const banner = document.getElementById('alert-banner');
    const bannerText = document.getElementById('alert-text');
    if (banner && bannerText) {
      banner.classList.remove('hidden');
      banner.className = type === 'fall' ? 'alert-banner danger' : 'alert-banner warning';
      bannerText.textContent = `${labels[type] || type}：${details[type] || ''}`;

      // 3秒后自动消失
      clearTimeout(this._bannerTimeout);
      this._bannerTimeout = setTimeout(() => {
        banner.classList.add('hidden');
      }, 3000);
    }
  }

  _addEvent(type, label, detail) {
    const list = document.getElementById('event-list');
    const now = new Date();

    // 移除空状态
    const empty = list.querySelector('.event-empty');
    if (empty) empty.remove();

    const item = document.createElement('div');
    item.className = 'event-item';

    const time = document.createElement('span');
    time.className = 'event-time';
    time.textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const typeEl = document.createElement('span');
    typeEl.className = 'event-type';
    typeEl.textContent = label;

    const detailEl = document.createElement('span');
    detailEl.className = 'event-detail';
    detailEl.textContent = detail;

    item.appendChild(time);
    item.appendChild(typeEl);
    item.appendChild(detailEl);
    list.insertBefore(item, list.firstChild);

    // 限制显示20条
    while (list.children.length > 20) {
      list.removeChild(list.lastChild);
    }
  }

  _tick() {
    const elapsed = Math.floor((Date.now() - this._rideStartTime) / 1000);
    const min = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const sec = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('ride-time').textContent = `${min}:${sec}`;

    // 更新安全评分
    const trip = this.recorder.getCurrentTrip();
    if (trip) {
      document.getElementById('safety-score').textContent = trip.safetyScore;
    }
  }

  _switchView(viewName) {
    this.currentView = viewName;

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById(viewName)?.classList.add('active');
    document.querySelector(`.nav-item[data-view="${viewName}"]`)?.classList.add('active');

    if (viewName === 'history') this._updateHistoryView();
    if (viewName === 'appeal') this._renderAppeal('delay');
  }

  _updateHistoryView() {
    const trips = this.recorder.getAllTrips();
    const stats = this.recorder.getStats();

    document.getElementById('total-trips').textContent = stats.totalTrips;
    document.getElementById('total-distance').textContent = `${stats.totalDistance} km`;
    document.getElementById('total-earnings').textContent = `¥${stats.totalEarnings}`;
    document.getElementById('avg-hourly').textContent = `¥${stats.avgHourly}`;

    const tripList = document.getElementById('trip-list');
    if (trips.length === 0) {
      tripList.innerHTML = '<p class="event-empty">还没有行程记录</p>';
      return;
    }

    tripList.innerHTML = trips.slice(0, 20).map(t => {
      const date = new Date(t.startTime);
      const dateStr = date.toLocaleDateString('zh-CN');
      const safetyColor = t.safetyScore >= 90 ? '#22c55e' : t.safetyScore >= 70 ? '#f59e0b' : '#ef4444';
      return `
        <div class="trip-card">
          <div>
            <div class="trip-date">${dateStr} ${date.toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'})}</div>
            <div style="font-size:11px;color:#94a3b8;">事件：${t.events.length}次</div>
          </div>
          <div class="trip-distance">${t.distance || '—'} km</div>
          <div class="trip-safety" style="color:${safetyColor}">${t.safetyScore}分</div>
        </div>
      `;
    }).join('');
  }

  _renderAppeal(type) {
    const output = document.getElementById('appeal-output');
    const recentTrip = this.recorder.getRecentTrips(1)[0];

    if (type === 'delay') {
      output.textContent = this.appeal.generateDelayReason(recentTrip);
    } else {
      output.textContent = this.appeal.generateDeductionEvidence(recentTrip);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new WindVane();
});
