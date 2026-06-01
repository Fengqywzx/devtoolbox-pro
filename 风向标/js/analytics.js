// 数据分析与可视化
// 基于 TripRecorder 的数据生成洞察报告

class Analytics {
  constructor(recorder) {
    this.recorder = recorder;
  }

  // 周度安全报告
  weeklyReport() {
    const trips = this.recorder.getAllTrips();
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekTrips = trips.filter(t => new Date(t.startTime).getTime() > weekAgo);

    if (weekTrips.length === 0) return null;

    const totalEvents = weekTrips.reduce((s, t) => s + t.events.length, 0);
    const avgSafety = weekTrips.reduce((s, t) => s + (t.safetyScore || 100), 0) / weekTrips.length;
    const totalDist = weekTrips.reduce((s, t) => s + (t.distance || 0), 0);
    const totalTime = weekTrips.reduce((s, t) => {
      if (!t.endTime) return s;
      return s + (new Date(t.endTime) - new Date(t.startTime));
    }, 0);
    const totalHours = totalTime / (1000 * 60 * 60);

    // 事件分布
    const eventDist = {};
    weekTrips.forEach(t => {
      t.events.forEach(e => {
        eventDist[e.type] = (eventDist[e.type] || 0) + 1;
      });
    });

    return {
      period: '最近7天',
      tripCount: weekTrips.length,
      totalDistance: parseFloat(totalDist.toFixed(1)),
      totalHours: parseFloat(totalHours.toFixed(1)),
      avgSafety: parseFloat(avgSafety.toFixed(0)),
      totalEvents,
      eventDistribution: eventDist,
      riskLevel: this._riskLevel(avgSafety, totalEvents)
    };
  }

  // 时薪分解
  earningBreakdown(dailyEarnings = 200) {
    const trips = this.recorder.getAllTrips();
    const today = new Date().toDateString();
    const todayTrips = trips.filter(t => new Date(t.startTime).toDateString() === today);

    const totalTime = todayTrips.reduce((s, t) => {
      if (!t.endTime) return s;
      return s + (new Date(t.endTime) - new Date(t.startTime));
    }, 0);
    const totalHours = totalTime / (1000 * 60 * 60);
    const rawHourly = totalHours > 0 ? dailyEarnings / totalHours : 0;

    // 安全代价 = 事故风险折算
    const totalEvents = todayTrips.reduce((s, t) => s + t.events.length, 0);
    const safetyCost = totalEvents * 5; // 每次危险事件估算 5 元的安全代价
    const effectiveHourly = totalHours > 0 ? (dailyEarnings - safetyCost) / totalHours : 0;

    return {
      date: today,
      tripCount: todayTrips.length,
      totalHours: parseFloat(totalHours.toFixed(1)),
      dailyEarnings,
      rawHourly: parseFloat(rawHourly.toFixed(0)),
      safetyEvents: totalEvents,
      safetyCost,
      effectiveHourly: parseFloat(effectiveHourly.toFixed(0)),
      message: effectiveHourly < 15
        ? '⚠️ 扣除安全代价后时薪偏低，建议减少接单量或避开高风险时段'
        : '✓ 时薪尚可，继续保持安全骑行'
    };
  }

  // 个人风险路段识别
  riskHeatmap() {
    const trips = this.recorder.getAllTrips();
    const eventLocations = [];

    trips.forEach(t => {
      t.events.forEach(e => {
        // 找到事件发生时的位置
        const eventTime = new Date(e.time).getTime();
        let closestPos = null;
        let minDiff = 30000; // 30秒内

        t.positions.forEach(p => {
          const diff = Math.abs(new Date(p.time).getTime() - eventTime);
          if (diff < minDiff) {
            minDiff = diff;
            closestPos = p;
          }
        });

        if (closestPos) {
          eventLocations.push({
            lat: closestPos.lat.toFixed(6),
            lng: closestPos.lng.toFixed(6),
            type: e.type
          });
        }
      });
    });

    // 聚类：相近位置的事件归并
    const clusters = this._clusterEvents(eventLocations);
    return clusters.filter(c => c.count >= 2); // 至少2次才视为风险路段
  }

  _riskLevel(avgSafety, totalEvents) {
    if (avgSafety >= 90 && totalEvents < 3) return { level: '低', color: '#22c55e' };
    if (avgSafety >= 70 || totalEvents < 10) return { level: '中', color: '#f59e0b' };
    return { level: '高', color: '#ef4444' };
  }

  _clusterEvents(events) {
    const clusters = [];
    const used = new Set();

    for (let i = 0; i < events.length; i++) {
      if (used.has(i)) continue;
      const cluster = { lat: events[i].lat, lng: events[i].lng, count: 1, types: [events[i].type] };
      used.add(i);

      for (let j = i + 1; j < events.length; j++) {
        if (used.has(j)) continue;
        const dist = Math.abs(parseFloat(events[i].lat) - parseFloat(events[j].lat))
                   + Math.abs(parseFloat(events[i].lng) - parseFloat(events[j].lng));
        if (dist < 0.005) { // 约500m
          cluster.count++;
          cluster.types.push(events[j].type);
          used.add(j);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  // 格式化报告用于显示
  formatReport(report) {
    if (!report) return '暂无足够数据生成报告';
    let text = '';
    text += `📊 ${report.period}安全报告\n`;
    text += `${'─'.repeat(30)}\n`;
    text += `行程数：${report.tripCount} 次\n`;
    text += `总里程：${report.totalDistance} km\n`;
    text += `骑行时间：${report.totalHours} 小时\n`;
    text += `安全评分：${report.avgSafety}/100 （${report.riskLevel.level}风险）\n`;
    text += `安全事件：${report.totalEvents} 次\n`;
    if (Object.keys(report.eventDistribution).length > 0) {
      text += `\n事件分布：\n`;
      for (const [type, count] of Object.entries(report.eventDistribution)) {
        const labels = {
          hard_brake: '急刹', overspeed: '超速', swerve: '蛇形',
          fall: '摔倒', near_miss: '险情'
        };
        text += `  ${labels[type] || type}：${count} 次\n`;
      }
    }
    return text;
  }
}
