// 事实提取引擎 v3 — regex 预提取 + LLM 深度提取双引擎 + 一致性校验
// regex 引擎：快速、离线、免费，覆盖 85% 常见表达（合并v2增强模式）
// LLM 引擎：精准、理解上下文，处理复杂叙述
// 校验引擎：金额一致性、时间逻辑、时效检查、证据充分性

class FactExtractor {
  constructor(llmClient) {
    this.llm = llmClient || null;
    this.patterns = this._buildPatterns();
  }

  _buildPatterns() {
    return {
      // === 身份 ===
      name: [
        /我(?:叫|是|名字是|姓)([^\s，。,\.]{2,4})(?:，|。|\s|$)/,
        /本人\s*([^\s，。,\.]{2,4})/,
        /([^\s，。,\.]{2,4})\s*(?:是|系).*(?:申请人|劳动者|员工|工人)/,
        /(?:申请人|劳动者|员工)\s*(?:姓名)?[:：]?\s*([^\s，。,\.]{2,4})/
      ],
      idCard: [
        /(?:身份证|身份证号)[:：]?\s*(\d{17}[\dXx])/,
        /(\d{17}[\dXx])\s*(?:是我的身份证|身份证号)/
      ],

      // === 用人单位 ===
      employer: [
        /(?:在|给|跟)([^\s，。,\.]{2,30}?(?:公司|厂|店|工地|企业|单位|饭店|超市|酒店|平台|中心|工作室))[^。]*?(?:干活|做工|上班|工作|打工|跑|送)/,
        /([^\s，。,\.]{2,30}?(?:公司|有限公司|厂|集团))[^。]{0,20}(?:老板|负责人|经理|主管).*?(?:欠|拖|不给)/,
        /(?:单位|公司)[:：]?\s*([^\s，。,\.]{2,30})/,
        /老板\s*(?:叫|是|姓)([^\s，。,\.]{2,4})/
      ],
      employerAddress: [
        /(?:在|位于|地址在?)([^\s，。,\.]{2,30}(?:区|街道|路|号|工业园|科技园))/,
        /(?:地址|位置)[:：]?\s*([^\s，。,\.]{5,40})/
      ],

      // === 金额 ===
      money: [
        /(?:欠了?|拖欠|差|没给|还差|一共|总共)\s*(\d+\.?\d*)\s*(?:万|元|块|块钱|万元)/,
        /(\d+\.?\d*)\s*(?:万|元|块|块钱|万元)\s*(?:工资|钱|工钱|欠薪|薪水|薪酬)/,
        /每月\s*(\d+\.?\d*)\s*(?:元|块)\s*(?:工资|工钱)/,
        /(?:月薪|工资标准|底薪)[:：]?\s*(\d+\.?\d*)\s*(?:元|块|万)/,
        /(\d+)\s*个?月\s*(?:的?\s*)?(?:工资|工钱).*?(\d+\.?\d*)\s*(?:万|元|块)/,
        /(?:加班费|绩效|提成).*?(\d+\.?\d*)\s*(?:元|块|万)/
      ],
      moneyTotal: [
        /(?:一共|总共|合计|共计)\s*(\d+\.?\d*)\s*(?:万|元|块)/,
        /(?:欠|差|没给).*?(\d+\.?\d*)\s*(?:万|元|块).*(?:总共|合计)/
      ],

      // === 时间 ===
      timeFrom: [
        /(?:从|自从|自|于)(\d{4}\s*年\s*\d{1,2}\s*月|\d{1,2}\s*月\s*\d{1,2}\s*[号日]|去年\s*\d{1,2}\s*月|前年\s*\d{1,2}\s*月|今年\s*\d{1,2}\s*月)/,
        /(\d{4})年(\d{1,2})月/,
        /(\d+)个?月\s*(?:前|之前|开始)/,
        /(?:入职|开始上班|开始工作)[:：]?\s*(\d{4}年\d{1,2}月|\d{1,2}月)/
      ],
      timeArrears: [
        /(?:从|自)(\d{4}年\d{1,2}月|\d{1,2}月)(?:开始)?\s*(?:没发|拖欠|欠薪)/,
        /(?:欠薪|拖欠).{0,10}(\d{4}年\d{1,2}月|\d{1,2}月)/,
        /(?:已经|到现在)(\d+)\s*个?月\s*(?:没发|没给|拖欠)/
      ],
      timeDuration: [
        /(\d+)\s*(?:个?月|个?星期|周|天)(?:[^。]*(?:没发|没给|拖欠|没拿到|加班|工作))/,
        /干了?\s*(\d+)\s*(?:个?月|年|天)/,
        /(?:工作|上班|干了)\s*(\d+)\s*(?:个?月|年)/
      ],

      // === 岗位 ===
      jobType: [
        /(?:做|干|当|跑)\s*([^\s，。,\.]{2,6}(?:工|员|手|师|配送|外卖|快递|建筑|装修|搬运|保洁|保安|司机|管理|销售|客服|文员|会计|厨师|服务员))/,
        /(?:岗位|职位|工种)[:：]?\s*([^\s，。,\.]{2,10})/
      ],

      // === 问题类型 ===
      problemType: {
        wage_arrears: /(?:欠|拖欠|没发|不给|差|少给|克扣|没拿到|没给).*(?:工资|钱|工钱|薪水|薪酬|工资条)/,
        no_contract: /(?:没有|没签|不给签|没给签|一直没签).*(?:合同|劳动合同|协议|书面)/,
        work_injury: /(?:受伤|工伤|砸到|摔|碰伤|撞|压伤|掉下来|出事|骨折|缝针|住院|职业病).*(?:工作|上班|干活|工地|车间)/,
        overtime: /(?:加班|超时|没日没夜|天天|每天.{0,10}(?:小时|点).{0,5}(?:加班|工作)|节假日.{0,5}上班|周末.{0,5}上班)/,
        unfair_dismissal: /(?:开除|辞退|赶走|不让干|撵走|炒.{0,3}鱿鱼|解除.{0,3}劳动关系|口头.{0,5}辞退|被开|被辞|被退)/
      },

      // === 证据 ===
      evidence: [
        /(?:微信|聊天|截图|录音|转账|打卡|工牌|工服|照片|视频|合同|协议|证人|工友|银行.{0,5}流水|考勤|钉钉|邮件|短信)/g
      ],

      // === 诉求 ===
      demand: [
        /(?:想要|希望|要求).{0,10}(?:工资|赔偿|补偿|继续上班|恢复|补签|道歉)/,
        /(?:只要|只想|就要).{0,10}(?:工资|钱|赔偿)/,
        /(?:算了|不要了|放弃|不追).{0,5}(?:赔偿|工资)/
      ],

      // === 城市/地点 ===
      city: [
        /(?:在|位于|地址在?)([^\s，。,\.]{2,4}(?:市|区|县))/,
        /([^\s，。,\.]{2,4}(?:市|区|县))(?:[^\s，。,\.]{0,10}(?:劳动|仲裁|法院))/,
        /(?:住在|住|居住地)[:：]?\s*([^\s，。,\.]{2,15})/
      ]
    };
  }

  // === 主提取方法 ===

  extract(text) {
    const facts = {
      who: this._extractName(text),
      who_id: this._extractIdCard(text),
      whom: this._extractEmployer(text),
      what: text,
      when: this._extractTime(text),
      when_start: this._extractTimeStart(text),
      when_arrears: this._extractTimeArrears(text),
      where: this._extractCity(text),
      howMuch: this._extractMoney(text),
      wage_standard: this._extractWageStandard(text),
      jobType: this._extractJobType(text),
      problemType: this._detectProblemType(text),
      evidence: this._extractEvidence(text),
      demand: this._extractDemand(text),
      city: this._extractCity(text),
      legalRefs: []
    };

    facts.legalRefs = this._matchLegalRefs(facts.problemType);

    // 运行一致性校验
    const issues = this.validateConsistency(facts);
    if (issues.length > 0) {
      facts._validationIssues = issues;
    }

    return facts;
  }

  // === LLM 辅助提取 ===

  async extractWithLLM(text, existingFacts = null) {
    if (!this.llm || !this.llm.isConfigured) {
      console.log('[Extractor] LLM unavailable, using regex only');
      return this.extract(text);
    }

    const prompt = this._buildLLMPrompt(text, existingFacts);
    const result = await this.llm.complete(prompt, { temperature: 0.1, maxTokens: 800 });

    if (!result) {
      // LLM 失败，降级到 regex
      return this.extract(text);
    }

    // 合并 LLM 结果和 regex 结果（regex 作为补充）
    const regexFacts = this.extract(text);
    return this._mergeFacts(regexFacts, result);
  }

  _buildLLMPrompt(text, existingFacts) {
    let prompt = `你是劳动仲裁文书助手。从劳动者口语描述中提取事实，返回JSON。

示例：
"我叫王大力，在深圳龙华富士康厂里做装配工。2023年3月入职，没签过合同。从去年8月开始老板拖欠工资，到现在一共欠了3个月，每月5000块，总共15000元。我有微信聊天记录和银行转账截图。"
→ {
  "who": "王大力",
  "whom": "富士康（龙华工厂）",
  "what": "2023年3月入职深圳龙华富士康做装配工，未签劳动合同。从去年8月起老板连续拖欠3个月工资。",
  "when": "2023年3月入职，2025年8月开始被拖欠工资，持续3个月",
  "where": "深圳市龙华区",
  "howMuch": "每月5000元，3个月共15000元",
  "jobType": "装配工",
  "problemType": ["wage_arrears", "no_contract"],
  "evidence": "微信聊天记录、银行转账截图",
  "demand": "追回被拖欠工资15000元"
}

现在提取以下描述的事实，同样返回JSON（没提到的字段为空字符串）：
"""
${text}
"""

只返回JSON，不要其他内容。`;

    if (existingFacts) {
      prompt += `\n已有事实（补充完善）：\n${JSON.stringify(existingFacts, null, 2)}`;
    }

    return prompt;
  }

  _mergeFacts(regexFacts, llmResult) {
    const merged = { ...regexFacts };

    // LLM 结果通常更准确，优先使用（如果有值）
    if (llmResult && typeof llmResult === 'object' && !llmResult.raw) {
      for (const key of Object.keys(merged)) {
        const llmVal = llmResult[key];
        if (llmVal && (typeof llmVal === 'string' && llmVal.trim())) {
          merged[key] = llmVal;
        } else if (Array.isArray(llmVal) && llmVal.length > 0) {
          merged[key] = llmVal;
        }
      }
    }

    // 始终用 regex 补充证据（LLM 可能漏掉）
    if (regexFacts.evidence && regexFacts.evidence.length > 0) {
      const llmEvidence = (llmResult?.evidence) || '';
      merged.evidence = llmEvidence ? `${llmEvidence}；${regexFacts.evidence}` : regexFacts.evidence;
    }

    merged.legalRefs = this._matchLegalRefs(merged.problemType);
    return merged;
  }

  // === 字段级提取 ===

  _extractName(text) {
    for (const p of this.patterns.name) {
      const m = text.match(p);
      if (m) return m[1].trim();
    }
    return '';
  }

  _extractEmployer(text) {
    for (const p of this.patterns.employer) {
      const m = text.match(p);
      if (m) return m[1].trim();
    }
    return '';
  }

  _extractMoney(text) {
    // 优先匹配 "欠了XX元" 模式
    for (const p of this.patterns.money) {
      const m = text.match(p);
      if (m) {
        // 如果有两个捕获组（月数+金额），合并
        if (m[2]) return `${m[1]}个月共${m[2]}元`;
        return m[1];
      }
    }
    return '';
  }

  _extractTime(text) {
    const fromMatches = [];
    for (const p of this.patterns.timeFrom) {
      const m = text.match(p);
      if (m) {
        const t = m[1].replace(/\s/g, '');
        if (!fromMatches.includes(t)) fromMatches.push(t);
      }
    }

    const durMatches = [];
    for (const p of this.patterns.timeDuration) {
      const m = text.match(p);
      if (m) durMatches.push(m[1]);
    }

    let result = fromMatches.join('，');
    if (durMatches.length > 0 && !result.includes('月')) {
      if (result) result += '，';
      result += `持续${durMatches[0]}个月`;
    }

    return result || '';
  }

  _extractJobType(text) {
    for (const p of this.patterns.jobType) {
      const m = text.match(p);
      if (m) return m[1].trim();
    }
    return '';
  }

  _detectProblemType(text) {
    const matched = [];
    for (const [type, pattern] of Object.entries(this.patterns.problemType)) {
      if (pattern.test(text)) matched.push(type);
    }
    return matched.length > 0 ? matched : ['wage_arrears'];
  }

  _extractEvidence(text) {
    const hints = [];
    for (const p of this.patterns.evidence) {
      let m;
      while ((m = p.exec(text)) !== null) {
        if (!hints.includes(m[0])) hints.push(m[0]);
      }
    }
    return hints.join('、');
  }

  _extractCity(text) {
    for (const p of this.patterns.city) {
      const m = text.match(p);
      if (m) return m[1].trim();
    }
    return '';
  }

  _matchLegalRefs(problemTypes) {
    return problemTypes
      .map(t => LEGAL_REFERENCES ? LEGAL_REFERENCES[t] : null)
      .filter(Boolean);
  }

  // === v3: 一致性校验 ===

  validateConsistency(facts, history = []) {
    const issues = [];

    // 校验1：金额可计算性
    if (facts.howMuch && facts.wage_standard) {
      const total = this._extractNumber(facts.howMuch);
      const monthly = this._extractNumber(facts.wage_standard);
      const duration = this._extractDuration(facts.when || '');
      if (total && monthly && duration > 0) {
        const expected = monthly * duration;
        if (Math.abs(total - expected) > expected * 0.3) {
          issues.push({
            type: 'amount_calculation',
            severity: 'warning',
            message: `欠薪金额${total}元与月薪${monthly}元×${duration}月=${expected}元差距较大，建议确认。`,
            fields: ['howMuch', 'wage_standard', 'when']
          });
        }
      }
    }

    // 校验2：时间逻辑
    if (facts.when_start && facts.when_arrears) {
      const startYear = this._extractYear(facts.when_start);
      const arrearsYear = this._extractYear(facts.when_arrears);
      if (startYear && arrearsYear && arrearsYear < startYear) {
        issues.push({
          type: 'time_logic',
          severity: 'error',
          message: '欠薪开始时间早于入职时间，时间线有矛盾，请确认。',
          fields: ['when_start', 'when_arrears']
        });
      }
    }

    // 校验3：仲裁时效
    if (facts.when_arrears) {
      const year = this._extractYear(facts.when_arrears);
      if (year && year < new Date().getFullYear() - 1) {
        issues.push({
          type: 'limitation_warning',
          severity: 'critical',
          message: '欠薪时间已超过1年，可能超过仲裁时效。建议尽快申请仲裁，或确认是否存在时效中断的情形（如催要记录）。',
          fields: ['when_arrears']
        });
      }
    }

    // 校验4：证据充分性
    if (!facts.evidence || facts.evidence.length < 3) {
      issues.push({
        type: 'evidence_weak',
        severity: 'warning',
        message: '目前证据较少，建议补充工资转账记录、工牌照片或工友证言。',
        fields: ['evidence']
      });
    }

    return issues;
  }

  // === v3: 增强提取方法 ===

  _extractIdCard(text) {
    for (const p of (this.patterns.idCard || [])) {
      const m = text.match(p);
      if (m) return m[1].trim();
    }
    return '';
  }

  _extractWageStandard(text) {
    const match = text.match(/(?:月薪|工资标准|底薪|基本工资)[:：]?\s*(\d+\.?\d*)\s*(?:元|块|万)/);
    return match ? `${match[1]}元/月` : '';
  }

  _extractTimeStart(text) {
    const match = text.match(/(?:入职|开始上班|开始工作)[:：]?\s*(\d{4}年\d{1,2}月|\d{1,2}月)/);
    return match ? match[1] : '';
  }

  _extractTimeArrears(text) {
    for (const p of (this.patterns.timeArrears || [])) {
      const m = text.match(p);
      if (m) return m[1] || m[2];
    }
    return '';
  }

  _extractDemand(text) {
    for (const p of (this.patterns.demand || [])) {
      const m = text.match(p);
      if (m) return m[0];
    }
    return '';
  }

  _extractNumber(text) {
    const matches = text.match(/(\d+\.?\d*)\s*(?:万|元|块)/g);
    if (!matches) return null;
    const nums = matches.map(m => {
      const n = parseFloat(m.replace(/[^\d.]/g, ''));
      return m.includes('万') ? n * 10000 : n;
    });
    return Math.max(...nums);
  }

  _extractYear(text) {
    const match = text.match(/(\d{4})年/);
    return match ? parseInt(match[1]) : null;
  }

  _extractDuration(text) {
    const match = text.match(/(\d+)\s*个?月/);
    return match ? parseInt(match[1]) : null;
  }
}
