// 议价权分析器 v3 — 深度分析劳动者的法律议价权和纠纷杠杆点
// 功能：证据强度评分、法律杠杆识别、雇主弱点分析、和解vs诉讼权衡、谈判策略建议

class BargainingAnalyzer {
  constructor(legalDB = null) {
    this.legalDB = legalDB || {};
  }

  // ============ 主分析方法 ============

  analyze(facts, problemType, difficulties = []) {
    const result = {
      // 核心指标
      overallBargainingScore: 0,       // 综合议价权评分 0-100
      evidenceStrength: {},            // 证据强度评级
      legalLeverage: [],               // 法律杠杆点
      employerVulnerabilities: [],     // 雇主弱点
      negotiationPower: {},            // 谈判力量分析
      settlementAnalysis: {},          // 和解vs诉讼分析
      recommendedStrategy: '',         // 推荐策略
      riskFactors: [],                 // 风险因素
      timeSensitivity: {},             // 时间敏感性
      monetaryExposure: {}             // 对方面临的经济风险
    };

    // 1. 证据强度分析
    result.evidenceStrength = this._analyzeEvidence(facts);

    // 2. 法律杠杆点识别
    result.legalLeverage = this._identifyLegalLeverage(problemType, facts);

    // 3. 雇主弱点分析
    result.employerVulnerabilities = this._analyzeEmployerVulnerabilities(facts, problemType);

    // 4. 谈判力量综合评估
    result.negotiationPower = this._assessNegotiationPower(facts, difficulties, result);

    // 5. 和解vs诉讼分析
    result.settlementAnalysis = this._analyzeSettlementVsLitigation(facts, problemType, result);

    // 6. 综合议价权评分
    result.overallBargainingScore = this._calculateOverallScore(result);

    // 7. 推荐策略
    result.recommendedStrategy = this._generateStrategy(result, facts, problemType);

    // 8. 风险因素
    result.riskFactors = this._identifyRisks(facts, problemType, result);

    // 9. 时间敏感性
    result.timeSensitivity = this._assessTimeSensitivity(facts, problemType);

    // 10. 对方经济暴露
    result.monetaryExposure = this._calculateMonetaryExposure(facts, problemType, result);

    return result;
  }

  // ============ 1. 证据强度分析 ============

  _analyzeEvidence(facts) {
    const categories = {
      identityProof: { score: 0, maxScore: 30, label: '身份证明', items: [] },
      employmentProof: { score: 0, maxScore: 40, label: '劳动关系证明', items: [] },
      coreFactsProof: { score: 0, maxScore: 50, label: '核心事实证明', items: [] },
      damageProof: { score: 0, maxScore: 40, label: '损害证明', items: [] },
      communicationProof: { score: 0, maxScore: 30, label: '沟通记录证明', items: [] },
      witnessProof: { score: 0, maxScore: 20, label: '人证', items: [] }
    };

    // 身份证明
    if (facts.who && facts.who.length >= 2) {
      categories.identityProof.score += 30;
      categories.identityProof.items.push('当事人姓名已提供');
    }

    // 劳动关系证明
    const evidenceText = (facts.evidence || '') + (facts.what || '');
    const hasContract = /合同|协议/.test(evidenceText);
    const hasPayRecord = /转账|银行|微信.*钱|支付宝|工资条|流水/.test(evidenceText);
    const hasWorkId = /工牌|工服|工装|工作证/.test(evidenceText);
    const hasAttendance = /打卡|考勤|钉钉|企业微信/.test(evidenceText);
    const hasWorkPhotos = /照片|视频|工作.*照/.test(evidenceText);

    if (hasContract) {
      categories.employmentProof.score += 40;
      categories.employmentProof.items.push('有劳动合同（最强劳动关系证据）');
    } else {
      if (hasPayRecord) {
        categories.employmentProof.score += 20;
        categories.employmentProof.items.push('有工资转账记录');
      }
      if (hasWorkId) {
        categories.employmentProof.score += 10;
        categories.employmentProof.items.push('有工牌/工服');
      }
      if (hasAttendance) {
        categories.employmentProof.score += 15;
        categories.employmentProof.items.push('有考勤记录');
      }
      if (hasWorkPhotos) {
        categories.employmentProof.score += 8;
        categories.employmentProof.items.push('有工作照片/视频');
      }
    }

    // 核心事实证明
    if (facts.what && facts.what.length > 30) {
      categories.coreFactsProof.score += 25;
      categories.coreFactsProof.items.push('事情经过描述较详细');
    } else if (facts.what) {
      categories.coreFactsProof.score += 10;
      categories.coreFactsProof.items.push('事情经过有基本描述');
    }

    if (facts.when) {
      categories.coreFactsProof.score += 15;
      categories.coreFactsProof.items.push('时间信息已提供');
    }

    if (facts.where) {
      categories.coreFactsProof.score += 10;
      categories.coreFactsProof.items.push('地点信息已提供');
    }

    // 损害证明
    if (facts.howMuch) {
      categories.damageProof.score += 30;
      categories.damageProof.items.push('金额信息已提供');
    }

    if (evidenceText.length > 20) {
      categories.damageProof.score += 10;
      categories.damageProof.items.push('有描述相关证据');
    }

    // 沟通记录
    if (/聊天|微信.*说|短信|电话|录音/.test(evidenceText)) {
      categories.communicationProof.score += 20;
      categories.communicationProof.items.push('有沟通记录证据');
    }

    if (/群.*消息|通知|公告/.test(evidenceText)) {
      categories.communicationProof.score += 10;
      categories.communicationProof.items.push('有工作群消息');
    }

    // 人证
    if (/工友|同事|证人|在场/.test(evidenceText)) {
      categories.witnessProof.score += 15;
      categories.witnessProof.items.push('有潜在证人');
    }

    // 计算百分比
    const totalScore = Object.values(categories).reduce((s, c) => s + c.score, 0);
    const totalMax = Object.values(categories).reduce((s, c) => s + c.maxScore, 0);
    const overallPercent = Math.round((totalScore / totalMax) * 100);

    // 评级
    let grade;
    if (overallPercent >= 80) grade = 'excellent';
    else if (overallPercent >= 60) grade = 'good';
    else if (overallPercent >= 40) grade = 'fair';
    else if (overallPercent >= 20) grade = 'weak';
    else grade = 'poor';

    return {
      categories,
      totalScore,
      totalMax,
      overallPercent,
      grade,
      gradeLabel: {
        excellent: '充分 — 证据链完整，胜诉把握大',
        good: '较好 — 关键证据齐全，可补充细节',
        fair: '一般 — 有核心证据但不够完整，需补充',
        weak: '薄弱 — 缺少关键证据，建议先收集再行动',
        poor: '严重不足 — 需要先大量收集证据'
      }[grade],
      improvementSuggestions: this._generateEvidenceImprovements(categories)
    };
  }

  _generateEvidenceImprovements(categories) {
    const suggestions = [];
    for (const [key, cat] of Object.entries(categories)) {
      if (cat.score < cat.maxScore * 0.5) {
        switch (key) {
          case 'employmentProof':
            suggestions.push('尽快收集工资转账记录截图、工作照片、工牌/工服照片——这些是证明劳动关系的基础证据');
            break;
          case 'coreFactsProof':
            suggestions.push('把事发经过写下来，越详细越好：时间、地点、人物、说了什么、做了什么');
            break;
          case 'damageProof':
            suggestions.push('计算并记录具体损失金额，保留所有相关票据和记录');
            break;
          case 'communicationProof':
            suggestions.push('将与对方的微信聊天记录逐屏截图，特别是提到欠薪/加班/辞退等内容的部分');
            break;
          case 'witnessProof':
            suggestions.push('联系愿意作证的工友，记下姓名和联系方式（至少1-2人）');
            break;
        }
      }
    }
    return suggestions;
  }

  // ============ 2. 法律杠杆点识别 ============

  _identifyLegalLeverage(problemType, facts) {
    const leveragePoints = [];

    const leverageTemplates = {
      wage_arrears: [
        {
          point: '50%-100%加付赔偿金',
          description: '根据《劳动合同法》第85条，经劳动监察责令后仍不支付的，可加付50%-100%赔偿金。这是迫使对方主动协商的最强杠杆。',
          strength: 'high',
          activation: '先向劳动监察（12333）投诉，取得责令整改通知书',
          negotiationScript: '如果现在协商解决，可以不追究赔偿金部分——走到仲裁这一步，你就得多付至少50%'
        },
        {
          point: '劳动监察行政处罚',
          description: '劳动监察可以对企业处以罚款（每人500-2000元），并列入失信名单。这对正规经营的企业有实际压力。',
          strength: 'medium',
          activation: '直接拨打12333或到当地劳动监察大队实名举报',
          negotiationScript: '劳动监察已经介入了，继续拖下去对谁都不好——咱们私下解决，我撤诉'
        },
        {
          point: '支付令快速通道',
          description: '根据《劳动合同法》第30条，事实清楚的欠薪可直接申请支付令，比仲裁快得多（15日内）。',
          strength: 'high',
          activation: '向有管辖权的人民法院提交支付令申请',
          prerequisite: '需要有明确的欠薪金额和欠薪事实证明'
        },
        {
          point: '刑事追诉（拒不支付劳动报酬罪）',
          description: '根据《刑法》第276条之一，转移财产/逃匿/有能力支付拒不支付的，可被追究刑事责任（最高7年有期徒刑）。',
          strength: 'extreme',
          activation: '先取得劳动监察责令支付决定书→对方仍不支付→劳动监察移送公安',
          condition: '金额较大（一般5000元以上）且经责令后仍不支付'
        }
      ],
      no_contract: [
        {
          point: '双倍工资差额（最多11个月）',
          description: '根据《劳动合同法》第82条，入职第2个月到第12个月每月双倍工资。这是未签合同案件的最强经济杠杆。',
          strength: 'extreme',
          calculation: `月工资 × 实际工作月数（最多11个月）= 双倍工资差额`,
          negotiationScript: '按法律你要付我XX元双倍工资。现在补签合同，双倍工资我可以不再主张——这是对你最划算的方案'
        },
        {
          point: '视为无固定期限合同',
          description: '满1年不签合同→视为已订立无固定期限劳动合同（永久合同），不能随意解除。',
          strength: 'high',
          activation: '工作满1年后自动生效，无需申请'
        },
        {
          point: '经济补偿金（辞职+未缴社保组合）',
          description: '如果公司同时没缴社保，你可以据此辞职并索要N个月经济补偿金。',
          strength: 'medium',
          activation: '书面提出解除合同（理由是未缴社保），然后申请仲裁'
        }
      ],
      work_injury: [
        {
          point: '全额工伤待遇（公司自付）',
          description: '没缴工伤保险的公司要自付全部费用（医疗费+停工留薪期工资+伤残补助金等），可能高达数十万。这是巨大经济压力。',
          strength: 'extreme',
          activation: '取得工伤认定决定书→劳动能力鉴定→主张全部待遇',
          negotiationScript: '工伤待遇全部加在一起可能超过XX万——你应该清楚走完全部程序的代价。如果我们协商一个公平的方案，对双方都好'
        },
        {
          point: '工伤保险基金先行支付',
          description: '公司不付的，工伤保险基金先行垫付再向公司追偿——公司逃不掉。',
          strength: 'high',
          activation: '取得工伤认定后向社保经办机构申请'
        },
        {
          point: '停工留薪期工资（最长24个月）',
          description: '工伤治疗期间工资照发——公司不能以"没上班"为由停发。',
          strength: 'high',
          activation: '工伤认定后自动享有，无需额外申请'
        }
      ],
      overtime: [
        {
          point: '加班费差额+加付赔偿金',
          description: '不仅补齐差额，还有50%-100%加付赔偿金。加班费差额通常累积很大——数年差额可达数万元。',
          strength: 'high',
          calculation: '小时工资=月工资÷21.75÷8，然后按1.5/2/3倍分别计算差额',
          negotiationScript: '这几年加班费差额加上赔偿金，加起来是XX元。协商解决的话我只主张差额部分，赔偿金可以不计——这样对双方都公平'
        },
        {
          point: '考勤记录在对方手中——举证责任倒置',
          description: '根据最高法司法解释，你提供初步证据后，考勤记录由公司提供。公司不提供→推定你的主张成立。',
          strength: 'high',
          activation: '在仲裁申请中明确提出加班费诉求→举证责任部分转移给公司'
        },
        {
          point: '违法延长工时的行政处罚',
          description: '每月加班超过36小时违反《劳动法》第41条，劳动监察可责令改正并罚款。',
          strength: 'medium',
          activation: '向劳动监察举报违法超时加班'
        }
      ],
      unfair_dismissal: [
        {
          point: '2N违法辞退赔偿金',
          description: '根据《劳动合同法》第87条，违法辞退=2倍经济补偿金。工作N年=2N个月工资。这是违法辞退案件的核心诉求金额。',
          strength: 'extreme',
          calculation: 'N（工作年限）× 月工资 × 2 = 2N赔偿金',
          negotiationScript: '你的辞退不符合《劳动合同法》第39条的任何一种合法情形，属于违法辞退。按第87条应付2N赔偿金，共计XX元。协商解决对双方都是最优选择'
        },
        {
          point: '特定人群特殊保护（第42条）',
          description: '孕期/产期/哺乳期女职工、工伤人员、医疗期人员、临退老员工——这些人群被辞退=严重违法。',
          strength: 'extreme',
          condition: '需证明自己属于第42条保护的特定人群'
        },
        {
          point: '继续工作请求权',
          description: '根据第48条，你可以选择要求恢复工作（而非拿赔偿金）——这对公司可能是更大的麻烦。',
          strength: 'medium',
          negotiationScript: '我可以选择回来继续上班——或者你支付合理的赔偿金。你希望怎样？'
        }
      ]
    };

    const points = leverageTemplates[problemType] || leverageTemplates.wage_arrears;

    // 根据实际事实筛选适用的杠杆点
    for (const point of points) {
      const applicable = this._checkLeverageApplicability(point, facts);
      leveragePoints.push({ ...point, applicable });
    }

    return leveragePoints;
  }

  _checkLeverageApplicability(point, facts) {
    // 检查前置条件
    if (point.condition) {
      if (point.condition.includes('5000') && (facts.howMuch || '').length === 0) return false;
    }
    if (point.prerequisite) {
      // 一般性前置条件都给true，在描述中说明即可
    }
    return true;
  }

  // ============ 3. 雇主弱点分析 ============

  _analyzeEmployerVulnerabilities(facts, problemType) {
    const vulnerabilities = [];

    // 通用弱点
    if (!facts.whom || facts.whom.length < 3) {
      vulnerabilities.push({
        type: 'info_gap',
        severity: 'medium',
        description: '对方身份信息不足——需要补充公司全称和地址，否则无法确定仲裁被申请人',
        impact: '影响仲裁申请受理',
        fix: '查看工资转账记录中的账户名、工牌上的公司名、或使用企查查/天眼查搜索'
      });
    }

    // 具体弱点分析
    const vulnChecks = [
      {
        check: (facts.whom || '').includes('老板') && !(facts.whom || '').includes('公司'),
        vuln: {
          type: 'individual_employer',
          severity: 'high',
          description: '对方可能是个体户或自然人雇主——此类雇主通常法律意识较弱、资产较少，但谈判灵活性更高',
          leverageForYou: '个体户更怕行政处罚和打官司——时间成本和心理压力对他们更大。直接谈赔偿比走流程可能更有效',
          riskForYou: '个体户资产有限，胜诉后可能执行困难。建议优先协商谈判'
        }
      },
      {
        check: (facts.evidence || '').includes('微信') && (facts.evidence || '').includes('聊天'),
        vuln: {
          type: 'digital_trail',
          severity: 'high',
          description: '对方在微信上留下了沟通记录——这些是有效电子证据',
          leverageForYou: '微信聊天记录可证明劳动关系、欠薪事实、沟通经过。截图公证后效力更强',
          riskForYou: '微信记录可能被对方删除——立即截图备份发送给信任的人'
        }
      },
      {
        check: problemType === 'unfair_dismissal',
        vuln: {
          type: 'procedural_flaw',
          severity: 'extreme',
          description: '绝大多数中小企业辞退程序不合法——缺少书面通知、未支付补偿、未提前30天通知。这些都是程序违法，劳动者胜诉率极高',
          leverageForYou: '只要对方给不出符合第39条的书面证据，你的2N主张就站得住脚',
          riskForYou: '对方可能伪造证据——不要签任何东西，坚持要书面文件'
        }
      },
      {
        check: problemType === 'wage_arrears',
        vuln: {
          type: 'cash_flow_pressure',
          severity: 'medium',
          description: '欠薪本身说明对方可能面临现金流问题——这是一把双刃剑',
          leverageForYou: '尽早行动，避免对方进一步恶化资产状况',
          riskForYou: '拖延可能导致对方转移资产或彻底无力支付——尽快采取行动'
        }
      }
    ];

    for (const vc of vulnChecks) {
      if (vc.check) {
        vulnerabilities.push(vc.vuln);
      }
    }

    // 没有特殊弱点时添加通用分析
    if (vulnerabilities.length <= 1) {
      vulnerabilities.push({
        type: 'general',
        severity: 'medium',
        description: '无法从当前信息中确定对方的具体弱点。一般来说，中小企业/个体户更怕：①劳动监察处罚 ②劳动仲裁（时间和精力成本）③社保稽查 ④税务牵连',
        leverageForYou: '掌握多项法律杠杆，可以先协商再逐步升级',
        riskForYou: '不了解对方底细的情况下不要亮出全部底牌——先试探'
      });
    }

    return vulnerabilities;
  }

  // ============ 4. 谈判力量评估 ============

  _assessNegotiationPower(facts, difficulties, analysisResult) {
    let powerScore = 50; // 基础分

    // +证据强度
    const evidenceScore = analysisResult.evidenceStrength.overallPercent;
    powerScore += (evidenceScore - 50) * 0.3;

    // +法律杠杆
    const strongLeverage = analysisResult.legalLeverage.filter(l =>
      (l.strength === 'high' || l.strength === 'extreme') && l.applicable
    ).length;
    powerScore += strongLeverage * 8;

    // +困境严重性（奇怪的但真实的逻辑——越困难，越需要维权，越不会轻易放弃）
    const highSeverityDifficulties = difficulties.filter(d => d.severity === '高').length;
    powerScore += highSeverityDifficulties * 3;

    // 限制范围
    powerScore = Math.max(10, Math.min(95, Math.round(powerScore)));

    // 谈判建议
    let approach;
    if (powerScore >= 75) {
      approach = '强势谈判——你手上的牌很多，可以直接提出明确的赔偿金额和法律依据。对方如果拒绝，走仲裁大概率胜诉。';
    } else if (powerScore >= 55) {
      approach = '对等谈判——有一定筹码但证据不够完整。重点利用法律杠杆点（加付赔偿金、双倍工资等）推动对方协商。同时加紧收集证据。';
    } else if (powerScore >= 35) {
      approach = '谨慎谈判——先收集证据，补齐短板，不要急于亮底牌。先用劳动监察投诉试探对方反应，再决定是否走仲裁。';
    } else {
      approach = '积累筹码——当前证据较弱，不建议直接对抗。先不动声色地收集证据（聊天记录、工友联系方式、工资记录），等证据积累充分后再行动。';
    }

    return {
      score: powerScore,
      level: powerScore >= 75 ? 'strong' : powerScore >= 55 ? 'moderate' : powerScore >= 35 ? 'weak' : 'very_weak',
      levelLabel: { strong: '强', moderate: '中等', weak: '较弱', very_weak: '很弱' }[powerScore >= 75 ? 'strong' : powerScore >= 55 ? 'moderate' : powerScore >= 35 ? 'weak' : 'very_weak'],
      approach,
      keyAdvantage: strongLeverage > 0
        ? `拥有${strongLeverage}个高强度法律杠杆点，这是你的核心谈判优势`
        : '法律杠杆点不足，建议补充证据后重新评估',
      keyWeakness: evidenceScore < 40
        ? '证据强度不足是主要弱点——优先收集关键证据'
        : '证据强度尚可，但不要掉以轻心——持续补充'
    };
  }

  // ============ 5. 和解vs诉讼分析 ============

  _analyzeSettlementVsLitigation(facts, problemType, analysisResult) {
    const powerScore = analysisResult.negotiationPower.score;

    // 估算法定赔偿金额
    const estimatedLegalAmount = this._estimateLegalAmount(facts, problemType);

    // 和解分析
    const settlement = {
      recommended: powerScore < 75, // 除非筹码很强，否则推荐尝试和解
      reasonableRange: {
        min: Math.round(estimatedLegalAmount * 0.6),
        max: Math.round(estimatedLegalAmount * 0.9),
        description: `建议和解金额范围：${Math.round(estimatedLegalAmount * 0.6)}-${Math.round(estimatedLegalAmount * 0.9)}元（法定赔偿的60%-90%）`
      },
      advantages: [
        '速度快——和解通常1-2周，仲裁需要2-3个月',
        '心理成本低——不用对簿公堂，不用反复跑仲裁委',
        '执行无忧——协商支付的到账率远高于仲裁裁决',
        '关系可控——特别是还想在同行业工作的，少一个公开的'敌人''
      ],
      disadvantages: [
        '金额可能低于法定标准——相当于用部分金额换取时间和确定性',
        '无强制执行力——对方口头答应但反悔的话仍需走仲裁',
        '注意签协议——和解必须有书面协议，口头承诺不算数'
      ],
      tips: [
        '和解协议需要书面形式，明确约定金额、支付时间、违约责任',
        '不要说"就这个数吧"——先让对方先出价，你在心里对比法定标准',
        '和解成功后让对方当场转账，不要接受"明天给你""过两天"之类的承诺',
        '对方问"你要多少"时——回答"按法律规定应该是XX元，你觉得呢？"而不是直接报底价'
      ]
    };

    // 诉讼/仲裁分析
    const litigation = {
      recommended: powerScore >= 60,
      estimatedDuration: '45天（仲裁法定期限）+ 可能的诉讼1-2个月',
      advantages: [
        '金额最大化——仲裁裁决按法定标准，不会因为协商而打折',
        '有强制执行力——裁决后可申请法院强制执行',
        '程序正义——有正式的裁决书，对方不能再抵赖',
        '震慑效果——仲裁记录对不规范的企业有实际压力'
      ],
      disadvantages: [
        '时间较长——从申请到执行可能2-4个月',
        '需要自己或请人跑流程——填表、交材料、开庭',
        '对方可能转移财产或有其他逃避行为——需要同步考虑财产保全'
      ],
      estimatedLegalAmount,
      estimatedCost: '劳动仲裁免费，法院诉讼费也很低（劳动争议案件收费标准优惠）',
      successProbability: powerScore >= 75 ? '高（80%以上）' : powerScore >= 55 ? '中高（60-80%）' : '中等（40-60%）'
    };

    return {
      settlement,
      litigation,
      estimatedLegalAmount,
      recommendation: powerScore >= 75
        ? '你的议价权较强，建议先尝试一次正式协商（带上你算好的法定金额），如果对方拒绝或拖延→直接走仲裁。'
        : powerScore >= 55
          ? '建议先走劳动监察投诉（免费、快），以此作为协商基础。如果无效再转仲裁。'
          : '建议优先收集证据，同时尝试协商。在证据不足时贸然走仲裁风险较大。'
    };
  }

  _estimateLegalAmount(facts, problemType) {
    try {
      const howMuch = facts.howMuch || '';
      const numbers = howMuch.match(/(\d+\.?\d*)\s*(?:万|元|块)/);
      if (numbers) {
        let amount = parseFloat(numbers[1]);
        if (howMuch.includes('万')) amount *= 10000;
        return amount;
      }

      // 尝试从what字段中提取
      const whatText = facts.what || '';
      const whatNumbers = whatText.match(/(\d+\.?\d*)\s*(?:万|元|块)/);
      if (whatNumbers) {
        let amount = parseFloat(whatNumbers[1]);
        if (whatText.includes('万')) amount *= 10000;
        return amount;
      }
    } catch {}

    // 默认估算
    const defaults = {
      wage_arrears: 15000,
      no_contract: 30000,
      work_injury: 50000,
      overtime: 20000,
      unfair_dismissal: 30000
    };
    return defaults[problemType] || 20000;
  }

  // ============ 6. 综合评分 ============

  _calculateOverallScore(result) {
    const weights = {
      evidence: 0.35,
      leverage: 0.30,
      negotiation: 0.20,
      employerVulnerability: 0.15
    };

    const evidenceScore = result.evidenceStrength.overallPercent;
    const leverageScore = Math.min(100, result.legalLeverage.filter(l => l.applicable).length * 20);
    const negotiationScore = result.negotiationPower.score;
    const vulnerabilityScore = Math.min(100, result.employerVulnerabilities.length * 25);

    return Math.round(
      evidenceScore * weights.evidence +
      leverageScore * weights.leverage +
      negotiationScore * weights.negotiation +
      vulnerabilityScore * weights.employerVulnerability
    );
  }

  // ============ 7. 推荐策略 ============

  _generateStrategy(result, facts, problemType) {
    const score = result.overallBargainingScore;
    const steps = [];

    if (score >= 75) {
      steps.push('🔴 第一步：整理你的法定赔偿金额计算（精确到元），这是谈判基础');
      steps.push('🟠 第二步：给对方发正式的书面催告（微信文字也算），引用相关法条，给出明确期限');
      steps.push('🟡 第三步：如果3-5个工作日无实质回应→直接去劳动仲裁委立案');
      steps.push('🟢 策略核心：你的筹码充足，不需要过度妥协。坚持法定标准，对方拒绝就仲裁——胜率很高。');
    } else if (score >= 55) {
      steps.push('🔴 第一步：补充收集当前最薄弱的证据项（参考证据分析建议）');
      steps.push('🟠 第二步：拨打12333向劳动监察投诉——免费、快、有震慑力');
      steps.push('🟡 第三步：以劳动监察的处理结果为基础，与对方协商和解');
      steps.push('🟢 第四步：协商不成→申请劳动仲裁');
      steps.push('🟢 策略核心：步步升级，用劳动监察铺路。不要一开始就亮出全部底牌。');
    } else if (score >= 35) {
      steps.push('🔴 第一步：不动声色大量收集证据——这是当前最重要的任务');
      steps.push('🟠 第二步：联系其他有同样遭遇的工友，联合行动力量更大');
      steps.push('🟡 第三步：证据基本齐全后，先打12348咨询公益律师');
      steps.push('🟢 第四步：咨询后再决定走劳动监察还是直接仲裁');
      steps.push('🟢 策略核心：先收集、再行动。证据不足时不要暴露维权意图——对方可能销毁证据。');
    } else {
      steps.push('🔴 第一步：核心任务——收集证据（微信截图、转账记录、工友联系方式）');
      steps.push('🟠 第二步：联系12348免费法律咨询，确认你的法律地位');
      steps.push('🟡 第三步：寻找同为劳动者的工友，联合起来更有力量');
      steps.push('🟢 第四步：证据积累充分后再启动正式维权程序');
      steps.push('🟢 策略核心：目前是证据积累阶段。保持日常工作，同时有意识地收集任何能证明劳动关系和争议事实的材料。');
    }

    return {
      score,
      steps,
      urgency: score >= 55 ? '中（建议2周内行动）' : score >= 35 ? '中高（建议1个月内行动）' : '高（立即开始收集证据）',
      oneLiner: score >= 75
        ? '你站在有利位置——法律在你这边，证据也比较充分。果断行动，不要拖。'
        : score >= 55
          ? '有一定筹码但不够完美——边补充证据边推进，劳动监察是好的第一步。'
          : score >= 35
            ? '证据是当前最大短板——先默默收集，不要打草惊蛇。'
            : '现在最重要的是积累证据——每天收集一点，等待合适时机。'
    };
  }

  // ============ 8. 风险因素 ============

  _identifyRisks(facts, problemType, result) {
    const risks = [];

    // 时效风险
    risks.push({
      category: '时效',
      risk: '劳动仲裁时效为1年，从知道权利被侵害之日起计算。如果快到期了，立即行动。',
      severity: 'high',
      mitigation: '如果不确定时效是否到期——先申请仲裁，不要等到确认了再行动'
    });

    // 证据不足风险
    if (result.evidenceStrength.overallPercent < 50) {
      risks.push({
        category: '证据',
        risk: '证据强度不足，仲裁时可能面对举证困难',
        severity: 'high',
        mitigation: '立即按照证据收集指南补充，特别是劳动关系证明和核心事实证明'
      });
    }

    // 雇主资产风险
    if ((facts.what || '').includes('关门') || (facts.what || '').includes('搬走') || (facts.what || '').includes('跑')) {
      risks.push({
        category: '执行',
        risk: '对方有转移资产或失联迹象——即使胜诉也可能执行困难',
        severity: 'extreme',
        mitigation: '立即行动！同时考虑申请财产保全，冻结对方银行账户或查封资产'
      });
    }

    // 证据灭失风险
    risks.push({
      category: '证据保全',
      risk: '电子证据（微信记录、钉钉打卡）可能随时被删除或失去访问权限',
      severity: 'medium',
      mitigation: '立即逐屏截图所有相关聊天记录→发送给一个信得过的朋友备份→保存好原始手机数据'
    });

    // 单独个体风险
    const isIndividual = !(facts.whom || '').includes('公司') && !(facts.whom || '').includes('厂') && !(facts.whom || '').includes('企业');
    if (isIndividual && (facts.whom || '').length > 2) {
      risks.push({
        category: '执行',
        risk: '对方可能是个人而非企业——个人资产有限，胜诉后执行难度更大',
        severity: 'medium',
        mitigation: '优先协商解决，避免走上执行难的困境'
      });
    }

    return risks;
  }

  // ============ 9. 时间敏感性分析 ============

  _assessTimeSensitivity(facts, problemType) {
    const analysis = {
      urgencyLevel: 'medium',
      deadline: null,
      countdownDays: null,
      reasons: [],
      recommendedActionWindow: '2周内'
    };

    // 工伤时效紧迫
    if (problemType === 'work_injury') {
      // 尝试从事实中提取受伤日期
      const whenText = facts.when || '';
      const dateMatch = whenText.match(/(\d{4})[年\-\/](\d{1,2})[月\-\/]/);
      if (dateMatch) {
        const injuryDate = new Date(parseInt(dateMatch[1]), parseInt(dateMatch[2]) - 1);
        const oneYearLater = new Date(injuryDate);
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        const now = new Date();
        const daysLeft = Math.ceil((oneYearLater.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft < 30) {
          analysis.urgencyLevel = 'extreme';
          analysis.reasons.push(`工伤认定时效仅剩约${daysLeft}天——立即去人社局申请！不能等！`);
        } else if (daysLeft < 90) {
          analysis.urgencyLevel = 'high';
          analysis.reasons.push(`工伤认定时效还剩约${daysLeft}天——尽快行动，预留意外延迟的时间`);
        } else {
          analysis.reasons.push(`工伤认定时效约${daysLeft}天——时间充裕但不要拖延`);
        }
        analysis.deadline = oneYearLater.toISOString().split('T')[0];
        analysis.countdownDays = daysLeft;
      } else {
        analysis.reasons.push('工伤认定时效为受伤之日起1年——如果已经过去很久了请立即行动');
        analysis.urgencyLevel = 'high';
      }

      analysis.reasons.push('公司申请工伤认定的期限是30天——如果受伤超过30天公司还没申请，说明他们可能不打算配合，你应该自己去申请');
    }

    // 离职后时效
    if (facts.what && /离职|辞退|开除|不干了|不做了/.test(facts.what)) {
      analysis.reasons.push('劳动关系已终止——欠薪等诉求需在终止后1年内提出');
      analysis.urgencyLevel = 'high';
    }

    // 通用时效提醒
    if (analysis.reasons.length === 0) {
      analysis.reasons.push('劳动仲裁时效为1年——在职期间欠薪不受此限，但收集证据应该尽早开始');
      analysis.reasons.push('证据越早收集越完整——时间越久，聊天记录越可能丢失，工友越难联系');
    }

    // 推荐行动窗口
    if (analysis.urgencyLevel === 'extreme') {
      analysis.recommendedActionWindow = '立即行动——今天/明天就去！';
    } else if (analysis.urgencyLevel === 'high') {
      analysis.recommendedActionWindow = '1周内';
    } else {
      analysis.recommendedActionWindow = '2周内——不要拖延';
    }

    return analysis;
  }

  // ============ 10. 对方经济暴露 ============

  _calculateMonetaryExposure(facts, problemType, result) {
    const estimatedLegalAmount = result.settlementAnalysis.estimatedLegalAmount;

    const exposure = {
      bestCaseForWorker: estimatedLegalAmount * 1.5,  // 加上赔偿金
      worstCaseForEmployer: estimatedLegalAmount * 2.0, // 加上处罚+赔偿金
      components: []
    };

    switch (problemType) {
      case 'wage_arrears':
        exposure.components.push({ item: '被拖欠工资', amount: estimatedLegalAmount });
        exposure.components.push({ item: '50%-100%加付赔偿金', amount: Math.round(estimatedLegalAmount * 0.75), note: '劳动监察责令后追加' });
        exposure.components.push({ item: '劳动监察罚款', amount: '500-2000元/人', note: '行政处罚' });
        break;
      case 'no_contract':
        exposure.components.push({ item: '双倍工资差额', amount: estimatedLegalAmount, note: '最多11个月' });
        exposure.components.push({ item: '社保补缴+滞纳金', amount: '按实际工资基数计算', note: '可向社保部门投诉' });
        break;
      case 'work_injury':
        exposure.components.push({ item: '医疗费用', amount: '实报实销', note: '无上限' });
        exposure.components.push({ item: '停工留薪期工资', amount: '原工资×治疗月数', note: '最长24个月' });
        exposure.components.push({ item: '伤残补助金', amount: '7-27个月本人工资', note: '按伤残等级' });
        break;
      case 'overtime':
        exposure.components.push({ item: '加班费差额', amount: estimatedLegalAmount });
        exposure.components.push({ item: '加付赔偿金', amount: Math.round(estimatedLegalAmount * 0.75) });
        break;
      case 'unfair_dismissal':
        exposure.components.push({ item: '2N违法辞退赔偿金', amount: estimatedLegalAmount });
        exposure.components.push({ item: '未付工资+社保', amount: '按实际天数计算' });
        break;
    }

    return exposure;
  }

  // ============ 辅助：格式化输出 ============

  formatForDisplay(analysisResult) {
    return {
      scoreCard: {
        score: analysisResult.overallBargainingScore,
        grade: analysisResult.overallBargainingScore >= 75 ? '🟢 强势' :
               analysisResult.overallBargainingScore >= 55 ? '🟡 中等' :
               analysisResult.overallBargainingScore >= 35 ? '🟠 较弱' : '🔴 弱势',
        oneLiner: analysisResult.recommendedStrategy.oneLiner
      },
      evidencePanel: {
        grade: analysisResult.evidenceStrength.gradeLabel,
        score: `${analysisResult.evidenceStrength.overallPercent}%`,
        improvements: analysisResult.evidenceStrength.improvementSuggestions
      },
      leveragePanel: analysisResult.legalLeverage
        .filter(l => l.applicable && (l.strength === 'high' || l.strength === 'extreme'))
        .map(l => ({ point: l.point, description: l.description, script: l.negotiationScript })),
      negotiationAdvice: analysisResult.negotiationPower.approach,
      strategy: {
        steps: analysisResult.recommendedStrategy.steps,
        urgency: analysisResult.recommendedStrategy.urgency
      },
      risks: analysisResult.riskFactors.map(r => `${r.severity === 'extreme' ? '🔴' : r.severity === 'high' ? '🟠' : '🟡'} ${r.category}：${r.risk}\n   → ${r.mitigation}`),
      timeWarning: analysisResult.timeSensitivity.urgencyLevel === 'extreme' || analysisResult.timeSensitivity.urgencyLevel === 'high'
        ? `⚠️ 时间紧迫：${analysisResult.timeSensitivity.reasons.join('；')}`
        : null
    };
  }
}
