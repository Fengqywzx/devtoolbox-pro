// 事实完整性校验器
// 评估提取事实的完整度，给出缺失项提示和补充建议

const Validator = {
  // 必填字段定义（按问题类型）
  requiredFields: {
    wage_arrears: ['who', 'whom', 'when', 'howMuch'],
    no_contract: ['who', 'whom', 'when', 'evidence'],
    work_injury: ['who', 'whom', 'what', 'when', 'evidence'],
    overtime: ['who', 'whom', 'when', 'howMuch'],
    unfair_dismissal: ['who', 'whom', 'what', 'when']
  },

  // 字段权重（用于计算完整度评分）
  fieldWeights: {
    who: 20,
    whom: 20,
    what: 15,
    when: 15,
    where: 10,
    howMuch: 10,
    evidence: 5,
    demand: 5
  },

  // 主校验方法 — 返回校验报告
  validate(facts) {
    const problemTypes = facts.problemType || ['wage_arrears'];
    const primaryType = problemTypes[0];

    // 收集所有必填字段
    const required = new Set();
    for (const type of problemTypes) {
      (this.requiredFields[type] || this.requiredFields.wage_arrears)
        .forEach(f => required.add(f));
    }

    // 检查每个字段
    const missing = [];
    const weak = [];
    const complete = [];

    for (const field of required) {
      const value = facts[field];
      const isEmpty = !value || value.trim() === '' || value.includes('（请补充') || value.includes('待补充');
      const isVague = !isEmpty && value.length < 4;

      if (isEmpty) {
        missing.push({
          field,
          label: this._fieldLabel(field),
          severity: this.fieldWeights[field] >= 15 ? 'high' : 'medium',
          prompt: this._missingPrompt(field, primaryType)
        });
      } else if (isVague) {
        weak.push({
          field,
          label: this._fieldLabel(field),
          value,
          prompt: this._weakPrompt(field)
        });
      } else {
        complete.push(field);
      }
    }

    const score = this._completenessScore(facts, required);

    return {
      score,
      grade: score >= 80 ? 'good' : score >= 50 ? 'fair' : 'poor',
      missing,
      weak,
      complete,
      total: required.size,
      readyForGeneration: score >= 60
    };
  },

  // 计算完整性评分
  _completenessScore(facts, requiredFields) {
    let earned = 0;
    let total = 0;

    for (const field of requiredFields) {
      const weight = this.fieldWeights[field] || 10;
      total += weight;

      const value = facts[field];
      if (value && value.trim() && !value.includes('（请补充') && !value.includes('待补充')) {
        if (value.length >= 6) {
          earned += weight;
        } else if (value.length >= 2) {
          earned += weight * 0.6;
        } else {
          earned += weight * 0.3;
        }
      }
    }

    return total > 0 ? Math.round((earned / total) * 100) : 0;
  },

  _fieldLabel(field) {
    const labels = {
      who: '当事人姓名',
      whom: '对方（公司/雇主）',
      what: '事情经过',
      when: '发生时间',
      where: '工作地点',
      howMuch: '涉及金额',
      evidence: '手头证据',
      demand: '您的诉求'
    };
    return labels[field] || field;
  },

  _missingPrompt(field, problemType) {
    const prompts = {
      who: '请告诉我们你的姓名，这是申请书的必要信息',
      whom: '请告诉我们你工作的公司或老板的名字',
      what: '请详细说一下发生了什么事',
      when: '请说一下事情发生的时间，大概就行',
      where: '请说一下工作地点',
      howMuch: '请说一下涉及多少金额',
      evidence: '请说一下你有什么证据材料',
      demand: '请说一下你希望怎么解决'
    };
    return prompts[field] || `请补充${this._fieldLabel(field)}`;
  },

  _weakPrompt(field) {
    const prompts = {
      who: '姓名似乎太短了，能说一下全名吗？',
      whom: '公司的名字能说完整一点吗？',
      what: '能再详细一点吗？把事情经过说一下',
      when: '时间能再具体一点吗？',
      howMuch: '金额能再确认一下吗？'
    };
    return prompts[field] || '能再说具体一点吗？';
  }
};
