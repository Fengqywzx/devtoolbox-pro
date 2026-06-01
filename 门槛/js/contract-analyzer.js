// 合同分析器
// OCR + 风险条款检测（本地规则版，可接入LLM增强）

class ContractAnalyzer {
  constructor() {
    this.riskPatterns = [
      { keyword: /试用期.*[6-9]个月|[1-9]\d*个月.*试用/, risk: 'high', issue: '试用期过长', explain: '法定最长试用期6个月。超过6个月的试用期条款无效。' },
      { keyword: /不缴|不交.*社保|无社保|自缴社保/, risk: 'high', issue: '不缴纳社保', explain: '这是违法的。雇主必须为你缴纳社保。你可以向社保部门投诉要求补缴。' },
      { keyword: /随时.*辞退|无理由.*解雇|无条件.*终止/, risk: 'high', issue: '无理由辞退条款', explain: '雇主不能"随时""无理由"辞退你。必须有法定理由，否则需要支付经济补偿。' },
      { keyword: /工伤.*自负|工伤.*自担|发生.*意外.*不负/, risk: 'high', issue: '工伤免责条款', explain: '任何"工伤自负"的条款都是无效的。雇主必须承担工伤责任。' },
      { keyword: /扣押.*身份证|扣押.*证件|交押金|交保证金/, risk: 'high', issue: '扣押证件/收取押金', explain: '这是法律明确禁止的。雇主不得扣押你的证件或收取押金。' },
      { keyword: /无休息|不休息|全年.*无休|无节假日/, risk: 'high', issue: '剥夺休息权', explain: '每周至少休息1天，法定节假日有休假权。全年无休违法。' },
      { keyword: /低于.*最低工资|工资.*少于/, risk: 'high', issue: '工资低于法定最低标准', explain: '工资不得低于当地最低工资标准。低于标准的条款无效。' },
      { keyword: /试用.*工资.*低于|试用.*半价|试用.*%/, risk: 'medium', issue: '试用期工资过低', explain: '试用期工资不得低于正式工资的80%，且不得低于最低工资标准。' },
      { keyword: /不签.*合同|口头.*约定|无书面/, risk: 'medium', issue: '无书面合同', explain: '签订书面劳动合同是你的法定权利。一个月内不签的，雇主需支付双倍工资。' },
      { keyword: /加班.*无偿|加班.*不.*钱|自愿.*加班/, risk: 'medium', issue: '无偿加班条款', explain: '加班应付加班费。工作日加班1.5倍，休息日2倍，法定节假日3倍。' },
      { keyword: /离职.*赔偿|离职.*罚款|辞职.*违约金/, risk: 'medium', issue: '不当的离职罚款', explain: '一般情况下辞职不需要付违约金。只有特定情形（如公司出资培训）才可能需赔偿。' },
      { keyword: /保密.*终身|竞业.*终身|永不得从事/, risk: 'low', issue: '过度的限制条款', explain: '竞业限制最长2年，且需支付补偿金。"终身"禁止无效。' },
    ];
  }

  // 模拟OCR分析（实际使用时接入真实OCR或LLM）
  async analyzeImage(file) {
    // 模拟"扫描"过程
    return new Promise((resolve) => {
      setTimeout(() => {
        // 暂时返回模拟结果——真实场景会用OCR提取文字后分析
        resolve({
          extractedText: '（图片中的合同文字将通过OCR提取）',
          note: '请在真实使用时接入OCR服务（如百度OCR/腾讯OCR）或手动输入合同文字进行分析'
        });
      }, 800);
    });
  }

  // 分析合同文字（核心方法）
  analyzeText(text) {
    if (!text || text.trim().length < 10) {
      return { risks: [], summary: '文字太少，无法分析。请输入完整的合同条款。' };
    }

    const risks = [];
    for (const pattern of this.riskPatterns) {
      if (pattern.keyword.test(text)) {
        const match = text.match(pattern.keyword);
        risks.push({
          ...pattern,
          matchedText: match ? match[0] : text.substring(0, 50),
          recommendation: this._getRecommendation(pattern.issue)
        });
      }
    }

    // 按风险排序
    risks.sort((a, b) => {
      const order = { high: 3, medium: 2, low: 1 };
      return order[b.risk] - order[a.risk];
    });

    const highCount = risks.filter(r => r.risk === 'high').length;
    const mediumCount = risks.filter(r => r.risk === 'medium').length;

    let summary;
    if (highCount > 0) {
      summary = `⚠️ 检测到 ${highCount} 个高风险条款和 ${mediumCount} 个中风险条款。这些条款可能侵犯你的合法权益。建议在签订前与雇主协商修改，或咨询法律援助。`;
    } else if (mediumCount > 0) {
      summary = `📋 检测到 ${mediumCount} 个需要注意的条款。建议仔细阅读并确认理解这些条款的含义。`;
    } else if (risks.length > 0) {
      summary = `✅ 未检测到严重风险条款。但建议仍然仔细阅读每一项规定。`;
    } else {
      summary = `✅ 未检测到已知风险模式。但这不是法律意见——建议将合同给专业人士审查。`;
    }

    return { risks, summary, totalRisks: risks.length };
  }

  _getRecommendation(issue) {
    const recs = {
      '试用期过长': '要求将试用期修改为不超过6个月。',
      '不缴纳社保': '坚决要求雇主为你缴纳社保。这是法定强制性义务。',
      '无理由辞退条款': '要求删除此条款。辞退必须有法定理由。',
      '工伤免责条款': '此条款无效，但建议直接要求删除。保留一份合同副本。',
      '扣押证件/收取押金': '拒绝交出证件或支付押金。这本身就是违法的。',
      '剥夺休息权': '要求明确每周休息日和节假日安排。',
      '工资低于法定最低标准': '要求工资不低于当地最低工资标准。',
      '试用期工资过低': '要求试用期工资不低于正式工资的80%。',
      '无书面合同': '要求签订书面合同。这是你的法定权利。',
      '无偿加班条款': '要求明确加班费计算方式。',
      '不当的离职罚款': '要求删除不合理的离职赔偿条款。',
      '过度的限制条款': '竞业限制最长2年且需支付补偿。可协商删除或缩减。',
    };
    return recs[issue] || '建议咨询法律援助热线12348获取专业意见。';
  }
}
