// 健康自检引擎
// 针对环卫工人的每日健康快速评估

class HealthCheck {
  constructor() {
    this.questions = [
      {
        id: 'fatigue',
        text: '今天感觉有多累？',
        options: [
          { label: '精力充沛', score: 0 },
          { label: '有点累，但还行', score: 1 },
          { label: '很累，不太想动', score: 2 },
          { label: '极度疲劳，撑不住了', score: 3 }
        ]
      },
      {
        id: 'dizzy',
        text: '有没有头晕、头痛或恶心的感觉？',
        options: [
          { label: '完全没有', score: 0 },
          { label: '有一点', score: 1 },
          { label: '比较明显', score: 2 },
          { label: '很严重', score: 3 }
        ]
      },
      {
        id: 'pain',
        text: '身体有哪里疼吗？（腰/背/膝盖/肩膀）',
        options: [
          { label: '哪里都不疼', score: 0 },
          { label: '轻微酸痛', score: 1 },
          { label: '持续疼痛', score: 2 },
          { label: '疼得影响活动', score: 3 }
        ]
      },
      {
        id: 'breathing',
        text: '今天呼吸顺畅吗？',
        options: [
          { label: '完全正常', score: 0 },
          { label: '稍微有点闷', score: 1 },
          { label: '感觉胸闷气短', score: 2 },
          { label: '呼吸困难', score: 3 }
        ]
      },
      {
        id: 'skin',
        text: '皮肤有没有异常？（红肿/晒伤/冻伤/皮疹）',
        options: [
          { label: '一切正常', score: 0 },
          { label: '轻微发红或干燥', score: 1 },
          { label: '有明显的晒伤或红肿', score: 2 },
          { label: '有水泡或溃烂', score: 3 }
        ]
      },
      {
        id: 'water',
        text: '今天喝了多少水？',
        options: [
          { label: '超过2升', score: 0 },
          { label: '大约1-2升', score: 1 },
          { label: '不到1升', score: 2 },
          { label: '几乎没喝', score: 3 }
        ]
      },
      {
        id: 'sleep',
        text: '昨晚睡得怎么样？',
        options: [
          { label: '睡得很好，7小时以上', score: 0 },
          { label: '还行，5-7小时', score: 1 },
          { label: '不太好，不到5小时', score: 2 },
          { label: '几乎没睡', score: 3 }
        ]
      },
      {
        id: 'mood',
        text: '今天心情如何？',
        options: [
          { label: '挺好的', score: 0 },
          { label: '一般般', score: 1 },
          { label: '不太好', score: 2 },
          { label: '非常低落', score: 3 }
        ]
      }
    ];

    this.currentAnswers = {};
    this.completed = false;
    this.loadHistory();
  }

  get allQuestions() { return this.questions; }

  recordAnswer(questionId, score) {
    this.currentAnswers[questionId] = score;
  }

  // 计算健康风险评分
  calculateRisk() {
    const scores = Object.values(this.currentAnswers);
    if (scores.length === 0) return { level: 'unknown', totalScore: 0, maxScore: 0 };

    const totalScore = scores.reduce((a, b) => a + b, 0);
    const maxScore = this.questions.length * 3;

    let level, advice;
    if (totalScore <= 4) {
      level = 'low';
      advice = '📌 今天身体状态良好，可以正常作业。记得按时喝水和休息。';
    } else if (totalScore <= 10) {
      level = 'medium';
      advice = '⚠ 今天有一些健康风险。建议适当减少工作量，多休息。如果症状持续，下班后去看医生。';
    } else if (totalScore <= 16) {
      level = 'high';
      advice = '🔴 今天健康状况不太乐观。强烈建议今天减轻工作量或休息一天。如果出现以下情况请立即就医：持续头晕、呼吸困难、剧烈疼痛。';
    } else {
      level = 'critical';
      advice = '🚨 你的身体在发出严重警告！今天不应该工作。请立即休息，如果症状严重请拨打120。身体比工作重要。';
    }

    // 专项建议
    const specificAdvice = [];
    if (this.currentAnswers.water >= 2) specificAdvice.push('💧 你今天喝水严重不足，请立即补水');
    if (this.currentAnswers.dizzy >= 2) specificAdvice.push('🏥 头晕可能是中暑前兆，请立即到阴凉处休息');
    if (this.currentAnswers.pain >= 2) specificAdvice.push('💆 身体疼痛说明你的劳损在加重，下班后热敷疼痛部位');
    if (this.currentAnswers.sleep >= 2) specificAdvice.push('😴 睡眠不足会严重影响安全和健康，今晚请早点休息');
    if (this.currentAnswers.mood >= 2) specificAdvice.push('💙 心情不好不是你的错。找工友聊聊天，或者给家人打个电话');

    return { level, totalScore, maxScore, advice, specificAdvice };
  }

  // 保存检查记录
  saveResult(result) {
    const history = this.loadHistory();
    history.push({
      date: new Date().toISOString(),
      ...result
    });
    // 只保留最近30条
    const trimmed = history.slice(-30);
    localStorage.setItem('oj_health_history', JSON.stringify(trimmed));
    localStorage.setItem('oj_last_check', new Date().toISOString());
    this.completed = true;
  }

  loadHistory() {
    try {
      return JSON.parse(localStorage.getItem('oj_health_history') || '[]');
    } catch { return []; }
  }

  getLastCheckTime() {
    const t = localStorage.getItem('oj_last_check');
    if (!t) return null;
    const d = new Date(t);
    return `${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  hasCheckedToday() {
    const t = localStorage.getItem('oj_last_check');
    if (!t) return false;
    const last = new Date(t);
    const now = new Date();
    return last.toDateString() === now.toDateString();
  }
}
