// v3 AI洞察引擎 — 基于用户数据生成个性化建议
// 所有12项目共用此模块，各项目可扩展insightTypes

class AIInsights {
  constructor(projectId) {
    this.projectId = projectId;
    this.insightCache = {};
  }

  // 从localStorage收集用户数据
  _collectData(keys) {
    const data = {};
    keys.forEach(k => {
      try {
        const raw = localStorage.getItem(k);
        data[k] = raw ? JSON.parse(raw) : null;
      } catch { data[k] = null; }
    });
    return data;
  }

  // 生成健康风险预测
  predictHealthRisk(healthLog, weatherData) {
    const recent = (healthLog || []).slice(-7);
    if (recent.length < 3) return null;

    const scores = recent.map(h => h.score || h.totalScore || 0);
    const trend = scores[scores.length-1] - scores[0];
    const avg = scores.reduce((a,b)=>a+b,0)/scores.length;
    const temp = weatherData?.temp || 22;

    let risk = 'low', advice = '';
    if (trend > 3 && avg > 6) {
      risk = 'high';
      advice = '⚠ 健康风险上升趋势。建议减少工作量并就医检查。';
    } else if (trend > 1 || avg > 4) {
      risk = 'medium';
      advice = '📊 健康指标轻微恶化。注意休息和补水。';
    } else {
      advice = '✅ 健康趋势稳定。保持当前节奏。';
    }

    if (temp >= 35) advice += ' 高温天气请特别注意防暑。';
    if (temp <= -5) advice += ' 低温天气注意保暖防冻。';

    return { risk, trend, avg, advice, basedOn: recent.length + '天数据' };
  }

  // 收入预测
  predictIncome(incomeLog, days = 7) {
    const recent = (incomeLog || []).slice(-30);
    if (recent.length < 3) return null;

    const dailyAvg = recent.reduce((s, r) => s + (r.amount || r.wage || 0), 0) / Math.max(1, recent.length);
    const weekdays = recent.filter(r => {
      const d = new Date(r.date);
      return d.getDay() >= 1 && d.getDay() <= 5;
    });
    const weekends = recent.filter(r => {
      const d = new Date(r.date);
      return d.getDay() === 0 || d.getDay() === 6;
    });

    const weekdayAvg = weekdays.length ? weekdays.reduce((s,r) => s + (r.amount||r.wage||0), 0) / weekdays.length : dailyAvg;
    const weekendAvg = weekends.length ? weekends.reduce((s,r) => s + (r.amount||r.wage||0), 0) / weekends.length : dailyAvg;

    const futureDates = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() + i*86400000);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      futureDates.push({ date: d.toISOString().slice(0,10), predictedAmount: isWeekend ? weekendAvg : weekdayAvg });
    }

    const totalPredicted = Math.round(futureDates.reduce((s, d) => s + d.predictedAmount, 0));
    return { dailyAvg: Math.round(dailyAvg), totalPredicted, futureDates, confidence: Math.min(90, recent.length * 3) };
  }

  // 疲劳风险评估
  assessFatigue(workHours, restBreaks, consecutiveDays) {
    const score = (workHours / 8) * 40 + (1 - restBreaks / Math.max(1, workHours/2)) * 30 + (consecutiveDays / 7) * 30;
    const risk = score > 70 ? 'critical' : score > 45 ? 'high' : score > 25 ? 'medium' : 'low';

    let action;
    if (risk === 'critical') action = '🚨 立即停止工作！你已经严重透支。至少休息2天。';
    else if (risk === 'high') action = '⚠ 疲劳程度很高。建议明天休息或减少工作时长。';
    else if (risk === 'medium') action = '📊 有疲劳累积。每工作2小时强制休息15分钟。';
    else action = '✅ 状态良好。保持当前节奏。';

    return { score: Math.round(score), risk, action };
  }

  // 个性化建议生成（基于行为模式）
  generatePersonalizedAdvice(dataPoints, pattern) {
    // 检测异常模式
    const anomalies = [];
    const means = {};

    Object.entries(dataPoints).forEach(([key, values]) => {
      if (!Array.isArray(values) || values.length < 3) return;
      const nums = values.filter(v => typeof v === 'number');
      if (nums.length < 3) return;
      const mean = nums.reduce((a,b) => a+b, 0) / nums.length;
      means[key] = mean;
      const last = nums[nums.length - 1];
      const stdDev = Math.sqrt(nums.reduce((s, v) => s + Math.pow(v-mean,2), 0) / nums.length);
      if (Math.abs(last - mean) > 2 * stdDev && stdDev > 0) {
        anomalies.push({ key, mean, current: last, deviation: Math.round((last-mean)/stdDev*10)/10 });
      }
    });

    return { anomalies, means, pattern, generatedAt: new Date().toISOString() };
  }
}

// 工厂函数：为不同项目创建预配置的分析器
AIInsights.forProject = function(projectId) {
  const configs = {
    'orange-jacket': { healthKeys: ['oj_health_history'], weather: true },
    'threshold': { incomeKeys: ['th_wage_records'], contractKeys: [] },
    'metronome': { healthKeys: [], chemicalKeys: ['mt_chemicals'] },
    'steering-wheel': { incomeKeys: ['sw_incomes'], fatigueKeys: [] },
    'scaffold': { workKeys: ['sc_days'], weather: true },
    'thermometer': { moodKeys: ['th_moods'], gratitudeKeys: ['th_grat'] },
    'grain-rain': { wageKeys: ['gr_wages'], pesticideKeys: ['gr_pest'] },
    'parasol': { bizKeys: ['ps_biz'], conflictKeys: ['ps_conf'] },
    'ferry-bridge': { abilityKeys: ['fb_ability'] },
  };
  return new AIInsights(projectId);
};
