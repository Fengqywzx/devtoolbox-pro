// 行程数据记录器
// 记录每次骑行的完整数据，存储于 localStorage

class TripRecorder {
  constructor() {
    this.storageKey = 'windvane_trips';
    this.currentTrip = null;
    this.trips = this._loadTrips();
  }

  _loadTrips() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  _saveTrips() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.trips));
  }

  startTrip() {
    this.currentTrip = {
      id: Date.now(),
      startTime: new Date().toISOString(),
      endTime: null,
      distance: 0,       // km
      maxSpeed: 0,       // km/h
      avgSpeed: 0,       // km/h
      events: [],        // 安全事件列表
      positions: [],     // GPS 轨迹（采样）
      safetyScore: 100,  // 起始满分
      earnings: 0,       // 预估收入
      deductions: 0      // 预估扣款
    };
    return this.currentTrip;
  }

  endTrip() {
    if (!this.currentTrip) return null;
    this.currentTrip.endTime = new Date().toISOString();

    // 计算统计
    if (this.currentTrip.positions.length > 0) {
      this.currentTrip.distance = this._computeDistance();
      this.currentTrip.avgSpeed = this._computeAvgSpeed();
    }

    // 保存
    this.trips.unshift(this.currentTrip);
    if (this.trips.length > 100) this.trips.length = 100;
    this._saveTrips();

    const trip = this.currentTrip;
    this.currentTrip = null;
    return trip;
  }

  recordEvent(type, data) {
    if (!this.currentTrip) return;
    const event = {
      time: new Date().toISOString(),
      type,       // hard_brake, overspeed, swerve, fall, near_miss
      ...data
    };
    this.currentTrip.events.push(event);

    // 安全评分扣减
    const penalties = {
      hard_brake: 3,
      overspeed: 2,
      swerve: 5,
      fall: 15,
      near_miss: 8
    };
    const penalty = penalties[type] || 1;
    this.currentTrip.safetyScore = Math.max(0, this.currentTrip.safetyScore - penalty);
  }

  recordPosition(lat, lng, speed) {
    if (!this.currentTrip) return;
    // 每 5 秒采样一次（由调用方控制）
    this.currentTrip.positions.push({
      lat, lng, speed,
      time: new Date().toISOString()
    });
    if (speed > this.currentTrip.maxSpeed) {
      this.currentTrip.maxSpeed = speed;
    }
  }

  getCurrentTrip() { return this.currentTrip; }

  getAllTrips() { return this.trips; }

  getRecentTrips(count = 10) {
    return this.trips.slice(0, count);
  }

  _computeDistance() {
    let dist = 0;
    const pts = this.currentTrip.positions;
    for (let i = 1; i < pts.length; i++) {
      dist += this._haversine(pts[i-1].lat, pts[i-1].lng, pts[i].lat, pts[i].lng);
    }
    return parseFloat(dist.toFixed(2));
  }

  _computeAvgSpeed() {
    const pts = this.currentTrip.positions;
    if (pts.length < 2) return 0;
    const totalSpeed = pts.reduce((sum, p) => sum + (p.speed || 0), 0);
    return parseFloat((totalSpeed / pts.length).toFixed(1));
  }

  _haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  // 统计总览
  getStats() {
    const total = this.trips.length;
    const totalDist = this.trips.reduce((s, t) => s + (t.distance || 0), 0);
    const totalEarnings = this.trips.reduce((s, t) => s + (t.earnings || 0), 0);
    const totalTime = this.trips.reduce((s, t) => {
      if (!t.endTime) return s;
      return s + (new Date(t.endTime) - new Date(t.startTime));
    }, 0);
    const totalHours = totalTime / (1000 * 60 * 60);
    const avgHourly = totalHours > 0 ? totalEarnings / totalHours : 0;

    return {
      totalTrips: total,
      totalDistance: parseFloat(totalDist.toFixed(1)),
      totalEarnings: parseFloat(totalEarnings.toFixed(0)),
      avgHourly: parseFloat(avgHourly.toFixed(0)),
      totalHours: parseFloat(totalHours.toFixed(1))
    };
  }

  // 清除所有数据
  clearAll() {
    this.trips = [];
    this.currentTrip = null;
    localStorage.removeItem(this.storageKey);
  }

  // 导出数据（后续加密）
  exportData() {
    return JSON.stringify({
      trips: this.trips,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }
}
