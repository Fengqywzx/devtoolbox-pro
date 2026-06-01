// RSI 重复性劳损评估引擎

class RSIAssessor {
  constructor() {
    this.questions = [
      {
        id: 'task_type',
        text: '你的工作主要是做什么动作？',
        options: [
          { label: '抓握/捏取（如装配小零件）', score: 3, bodyPart: '手指/手腕' },
          { label: '重复抬手/伸臂（如取放物品）', score: 2, bodyPart: '肩膀/手臂' },
          { label: '长时间站立弯腰（如包装/质检）', score: 2, bodyPart: '腰部/腿部' },
          { label: '重复按压/推拉（如操作机器按钮）', score: 2, bodyPart: '手指/手掌' },
          { label: '多样化动作（不固定），不重复', score: 0, bodyPart: '整体' }
        ]
      },
      {
        id: 'frequency',
        text: '同一个动作大概多久重复一次？',
        options: [
          { label: '每几秒就重复一次', score: 3 },
          { label: '一分钟重复几次', score: 2 },
          { label: '几分钟重复一次', score: 1 },
          { label: '动作多样，很少重复', score: 0 }
        ]
      },
      {
        id: 'duration',
        text: '每天做这个动作持续多长时间？',
        options: [
          { label: '几乎整天（8小时以上）', score: 3 },
          { label: '大半天（5-8小时）', score: 2 },
          { label: '半天（3-5小时）', score: 1 },
          { label: '偶尔做（不到3小时）', score: 0 }
        ]
      },
      {
        id: 'force',
        text: '做动作时需要用力吗？',
        options: [
          { label: '需要很大力气（如搬运、拧紧）', score: 3 },
          { label: '中等力气（如推拉、按压）', score: 2 },
          { label: '很小的力气（如轻触、拨动）', score: 1 },
          { label: '几乎不用力', score: 0 }
        ]
      },
      {
        id: 'vibration',
        text: '工作中会接触振动工具吗？（电钻/打磨机/冲击扳手等）',
        options: [
          { label: '每天使用振动工具', score: 3 },
          { label: '偶尔使用振动工具', score: 2 },
          { label: '很少接触振动', score: 1 },
          { label: '从不接触', score: 0 }
        ]
      },
      {
        id: 'posture',
        text: '工作时你的手腕/手臂姿势是什么样的？',
        options: [
          { label: '长时间弯曲或不自然的角度', score: 3 },
          { label: '有时需要弯曲手腕', score: 2 },
          { label: '大部分时候是自然姿势', score: 1 },
          { label: '姿势自然舒适', score: 0 }
        ]
      },
      {
        id: 'current_pain',
        text: '现在身体有疼痛或不适吗？',
        options: [
          { label: '手指/手腕/手肘麻木或刺痛', score: 3 },
          { label: '肩膀/颈部酸痛僵硬', score: 2 },
          { label: '偶尔有点酸，休息就好', score: 1 },
          { label: '目前没有任何不适', score: 0 }
        ]
      }
    ];
    this.answers = {};
  }

  recordAnswer(questionId, score) {
    this.answers[questionId] = score;
  }

  assess() {
    const scores = Object.values(this.answers);
    if (scores.length === 0) return null;

    const total = scores.reduce((a, b) => a + b, 0);
    const max = this.questions.length * 3;

    let level, bodyParts, actions;

    if (total <= 4) {
      level = 'low';
      bodyParts = ['整体状况良好'];
      actions = [
        '继续保持多样化的工作姿势',
        '每小时站起来活动1-2分钟',
        '保持正确的工作姿势'
      ];
    } else if (total <= 9) {
      level = 'medium';
      bodyParts = ['手腕', '手指'];
      actions = [
        '每1-2小时做一次手部伸展运动',
        '工作间隙转动肩膀和脖子',
        '考虑使用护腕或人体工学工具',
        '下班后热敷手腕和前臂'
      ];
    } else if (total <= 15) {
      level = 'high';
      bodyParts = ['手腕', '手肘', '肩膀', '颈部'];
      actions = [
        '每30-45分钟必须停下来伸展',
        '强烈建议使用护具（护腕/护肘）',
        '每天做10分钟预防性拉伸',
        '如果出现持续的麻木或刺痛，立即就医',
        '考虑申请调整工作岗位或任务轮换',
        '记录症状变化，拍照留证'
      ];
    } else {
      level = 'critical';
      bodyParts = ['手腕', '手肘', '肩膀', '颈部', '腰部'];
      actions = [
        '你的劳损风险非常高！',
        '建议立即就医做肌电图检查',
        '向雇主书面申请调整工作岗位',
        '每天详细记录症状（时间/部位/程度）',
        '如症状持续加重，可能需要申请工伤认定',
        '不要再硬撑——RSI造成的损伤可能是永久性的'
      ];
    }

    return { level, total, max, bodyParts, actions };
  }
}
