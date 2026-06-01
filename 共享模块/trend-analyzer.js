// v3 趋势分析引擎 — 7/30/90天趋势+异常检测+预测
// Canvas-free: 返回数据供各项目的DataViz渲染

class TrendAnalyzer {
  // 简单移动平均
  static SMA(data, window = 7) {
    if (!data || data.length < window) return data || [];
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) { result.push(null); continue; }
      const slice = data.slice(i - window + 1, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / window);
    }
    return result;
  }

  // 线性回归趋势
  static linearTrend(data) {
    if (!data || data.length < 2) return { slope: 0, direction: 'stable', confidence: 0 };
    const n = data.length;
    const validData = data.map((v, i) => v !== null ? { x: i, y: v } : null).filter(Boolean);
    if (validData.length < 2) return { slope: 0, direction: 'stable', confidence: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    validData.forEach(({ x, y }) => {
      sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x;
    });
    const m = validData.length;
    const slope = (m * sumXY - sumX * sumY) / (m * sumX2 - sumX * sumX);
    const r = (m * sumXY - sumX * sumY) / Math.sqrt((m * sumX2 - sumX * sumX) * (m * validData.reduce((s, d) => s + d.y * d.y, 0) - sumY * sumY));

    return {
      slope: Math.round(slope * 1000) / 1000,
      direction: slope > 0.05 ? 'rising' : slope < -0.05 ? 'falling' : 'stable',
      confidence: Math.min(95, Math.round(Math.abs(r) * 100)),
      prediction: validData.length > 0 ? Math.round((validData[validData.length-1].y + slope * 3) * 10) / 10 : 0
    };
  }

  // 异常检测（Z-score方法）
  static detectAnomalies(data, threshold = 2) {
    if (!data || data.length < 5) return [];
    const valid = data.filter(v => v !== null && v !== undefined);
    if (valid.length < 5) return [];

    const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
    const std = Math.sqrt(valid.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / valid.length);
    if (std === 0) return [];

    return data.map((v, i) => {
      if (v === null || v === undefined) return null;
      const z = Math.abs((v - mean) / std);
      return z > threshold ? { index: i, value: v, zScore: Math.round(z * 10) / 10, severity: z > 3 ? 'extreme' : 'moderate' } : null;
    }).filter(Boolean);
  }

  // 周期性检测（自相关）
  static detectPeriodicity(data, maxLag = 14) {
    if (!data || data.length < maxLag * 2) return null;
    const valid = data.map(v => v !== null ? v : 0);
    const mean = valid.reduce((a,b) => a+b, 0) / valid.length;

    let bestLag = 0, bestCorr = 0;
    for (let lag = 2; lag <= Math.min(maxLag, Math.floor(valid.length/2)); lag++) {
      let corr = 0;
      for (let i = 0; i < valid.length - lag; i++) {
        corr += (valid[i] - mean) * (valid[i+lag] - mean);
      }
      corr /= (valid.length - lag);
      if (corr > bestCorr) { bestCorr = corr; bestLag = lag; }
    }

    return bestLag > 0 && bestCorr > 0.3 ? { period: bestLag, strength: Math.round(bestCorr * 100) / 100 } : null;
  }

  // 综合趋势报告
  static fullReport(data, label = '数据', options = {}) {
    const trend = TrendAnalyzer.linearTrend(data);
    const anomalies = TrendAnalyzer.detectAnomalies(data);
    const periodicity = TrendAnalyzer.detectPeriodicity(data);
    const sma = TrendAnalyzer.SMA(data, options.window || 7);

    let summary = '';
    if (trend.direction === 'rising' && trend.confidence > 70) {
      summary = `📈 ${label}呈上升趋势（置信度${trend.confidence}%）。预计未来3天将达到${trend.prediction}。`;
    } else if (trend.direction === 'falling' && trend.confidence > 70) {
      summary = `📉 ${label}呈下降趋势（置信度${trend.confidence}%）。`;
    } else {
      summary = `📊 ${label}趋势稳定。`;
    }

    if (anomalies.length > 0) {
      summary += ` ⚠ 检测到${anomalies.length}个异常点。`;
    }
    if (periodicity) {
      summary += ` 🔄 检测到约${periodicity.period}天周期。`;
    }

    return { summary, trend, anomalies, periodicity, sma, dataPoints: data.length };
  }
}
