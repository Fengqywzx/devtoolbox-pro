// 骑行安全监测引擎
// 检测：急刹、超速、蛇形、摔倒、逆行
// 通过回调通知上层 UI

class RideMonitor {
  constructor(recorder) {
    this.recorder = recorder;
    this.watchId = null;
    this.lastPosition = null;
    this.lastHeading = null;
    this.speedHistory = [];
    this.headingHistory = [];
    this.isMonitoring = false;

    // 阈值配置
    this.config = {
      speedLimit: 25,           // km/h（非机动车道限速）
      hardBrakeThreshold: -4.5, // m/s²（减速度低于此值视为急刹）
      swerveHeadingChange: 30,  // 度（航向突变超过此值视为蛇形）
      fallAccelThreshold: 2.5,  // g（加速度超过此值 + 静止 => 摔倒）
      overspeedDuration: 3000,  // ms（超速持续多久才警告）
      sampleInterval: 1000      // ms（采样间隔）
    };

    this.callbacks = {
      onEvent: null,       // (type, data) => void
      onSpeedUpdate: null, // (speed) => void
      onPositionUpdate: null // (lat, lng) => void
    };
  }

  start(callbacks = {}) {
    this.callbacks = { ...this.callbacks, ...callbacks };
    this.isMonitoring = true;

    if (!navigator.geolocation) {
      console.warn('GPS 不可用，将使用模拟数据');
      this._startSimulation();
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this._onPosition(pos),
      (err) => {
        console.warn('GPS 错误，切换到模拟模式:', err.message);
        this._startSimulation();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000
      }
    );
  }

  stop() {
    this.isMonitoring = false;
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this._simTimer) {
      clearInterval(this._simTimer);
      this._simTimer = null;
    }
  }

  _onPosition(pos) {
    const speed = pos.coords.speed != null ? pos.coords.speed * 3.6 : 0; // m/s → km/h
    const heading = pos.coords.heading;
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const accel = this._computeAccel(speed);

    // 更新 UI
    if (this.callbacks.onSpeedUpdate) this.callbacks.onSpeedUpdate(speed);
    if (this.callbacks.onPositionUpdate) this.callbacks.onPositionUpdate(lat, lng);

    // 记录位置
    this.recorder.recordPosition(lat, lng, speed);

    // 检测事件
    this._detect(speed, accel, heading, lat, lng);

    this.lastPosition = { speed, lat, lng, time: Date.now() };
    if (heading != null) this.lastHeading = heading;
  }

  _detect(speed, accel, heading, lat, lng) {
    // 超速
    if (speed > this.config.speedLimit) {
      this._triggerEvent('overspeed', { speed, limit: this.config.speedLimit });
    }

    // 急刹（减速剧烈）
    if (accel < this.config.hardBrakeThreshold) {
      this._triggerEvent('hard_brake', { deceleration: Math.abs(accel).toFixed(1) });
    }

    // 蛇形（航向突变）
    if (this.lastHeading != null && heading != null) {
      let headingDiff = Math.abs(heading - this.lastHeading);
      if (headingDiff > 180) headingDiff = 360 - headingDiff;
      if (headingDiff > this.config.swerveHeadingChange) {
        this._triggerEvent('swerve', { headingChange: headingDiff.toFixed(0) });
      }
    }

    // 摔倒（速度从>15骤降到0）
    if (this.lastPosition && this.lastPosition.speed > 15 && speed < 1) {
      this._triggerEvent('fall', {
        lastSpeed: this.lastPosition.speed.toFixed(0),
        location: `${lat.toFixed(4)},${lng.toFixed(4)}`
      });
    }
  }

  _computeAccel(currentSpeed) {
    if (!this.lastPosition || !this.lastPosition.speed) return 0;
    const dt = (Date.now() - this.lastPosition.time) / 1000;
    if (dt < 0.1) return 0;
    const dv = (currentSpeed - this.lastPosition.speed) / 3.6; // km/h → m/s
    return dv / dt; // m/s²
  }

  _triggerEvent(type, data) {
    this.recorder.recordEvent(type, data);
    if (this.callbacks.onEvent) {
      this.callbacks.onEvent(type, data);
    }
  }

  // === GPS 不可用时的模拟模式 ===
  _startSimulation() {
    const baseLat = 22.5431; // 深圳
    const baseLng = 114.0579;
    let simSpeed = 20;
    let simLat = baseLat;
    let simLng = baseLng;
    let simHeading = 0;

    this._simTimer = setInterval(() => {
      // 随机速度波动
      simSpeed += (Math.random() - 0.5) * 8;
      simSpeed = Math.max(3, Math.min(35, simSpeed));

      // 随机方向变化
      simHeading += (Math.random() - 0.5) * 30;
      simHeading = simHeading % 360;
      if (simHeading < 0) simHeading += 360;

      // 移动位置
      const d = (simSpeed / 3600) * 0.001; // 1秒移动的距离（度）
      simLat += d * Math.cos(simHeading * Math.PI / 180);
      simLng += d * Math.sin(simHeading * Math.PI / 180);

      // 模拟事件（每30秒触发一次随机事件）
      if (Math.random() < 0.03) {
        const events = ['hard_brake', 'overspeed', 'swerve'];
        const type = events[Math.floor(Math.random() * events.length)];
        const dataMap = {
          hard_brake: { deceleration: (3 + Math.random() * 3).toFixed(1) },
          overspeed: { speed: simSpeed.toFixed(0), limit: this.config.speedLimit },
          swerve: { headingChange: (30 + Math.random() * 60).toFixed(0) }
        };
        this._triggerEvent(type, dataMap[type]);
      }

      // 更新
      if (this.callbacks.onSpeedUpdate) this.callbacks.onSpeedUpdate(simSpeed);
      if (this.callbacks.onPositionUpdate) this.callbacks.onPositionUpdate(simLat, simLng);
      this.recorder.recordPosition(simLat, simLng, simSpeed);
    }, this.config.sampleInterval);
  }
}
