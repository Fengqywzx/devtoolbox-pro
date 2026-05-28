// 深度对话引擎 v3 — LLM驱动的共情式深度访谈
// 核心升级：
//   1. LLM驱动自然对话（20+轮），非固定问题队列
//   2. 智能答案相关性检测 → 不匹配时耐心重组语言重问
//   3. 共情倾听 + 情感确认 + 困难深度记录
//   4. 法律条文精确匹配 + 操作点映射
//   5. 议价权分析 + 纠纷杠杆点识别
//   6. 自反思循环 → 优化对话策略

class DeepDialogueEngine {
  constructor(options = {}) {
    this.llm = options.llm || null;
    this.questionsData = options.questionsData || {};
    this.legalDB = options.legalDB || {};
    this.bargainingAnalyzer = options.bargainingAnalyzer || null;

    // 回调
    this.onMessage = options.onMessage || (() => {});
    this.onThinking = options.onThinking || (() => {});
    this.onProgress = options.onProgress || (() => {});
    this.onDifficultyFound = options.onDifficultyFound || (() => {});
    this.onLegalMatch = options.onLegalMatch || (() => {});
    this.onBargainingInsight = options.onBargainingInsight || (() => {});
    this.onComplete = options.onComplete || (() => {});

    // 对话状态
    this.state = {
      problemType: null,
      round: 0,                    // 当前对话轮次
      maxRounds: 25,              // 最大对话轮次
      minRounds: 8,               // 最少对话轮次（确保深度）
      history: [],                 // 完整对话历史 [{role, content, timestamp, metadata}]
      facts: this._emptyFacts(),
      difficulties: [],            // 用户真实困境 [{category, description, severity, legalLinks}]
      legalMatches: [],            // 匹配到的法律操作点
      bargainingPoints: [],        // 议价权分析点
      emotionalState: null,        // 用户情绪状态追踪
      coveredTopics: new Set(),    // 已覆盖的话题
      pendingClarifications: [],   // 需要追问澄清的点
      reflectionNotes: [],         // 自反思笔记
      strategyAdjustments: [],     // 对话策略调整记录
      startedAt: null,
      llmAvailable: false
    };

    // 语言库（极大扩充）
    this.lang = this._buildLanguageLibrary();

    // 话题轮次规划
    this.topicPlan = this._buildTopicPlan();
  }

  _emptyFacts() {
    return {
      who: '', whom: '', what: '', when: '', where: '',
      howMuch: '', jobType: '', evidence: '', demand: '',
      contractStatus: '', insuranceStatus: '', workDuration: '',
      paymentMethod: '', witnesses: '', previousActions: '',
      employerType: '', industryType: '', employmentType: '',
      problemType: [], legalRefs: [], emotionalImpact: '',
      urgencyLevel: '', safetyConcern: ''
    };
  }

  // ============ 语言库（极大扩充） ============

  _buildLanguageLibrary() {
    return {
      // 开场白（15种变体，根据时间段和问题类型调整）
      openings: {
        morning: [
          '早上好，我是小桥。刚起床没多久吧？坐下来慢慢说，你最近工作上遇到什么难处了？',
          '早啊。这会儿脑子最清醒，咱们来捋一捋你工作上的事。最近碰到什么问题了？',
          '早上好。先喝口水缓一缓，然后跟我说说——工作上有啥不顺心的？'
        ],
        afternoon: [
          '下午好，我是小桥。忙了一天了吧？坐下来歇会儿，跟我说说工作上碰到什么困难了。',
          '下午好。这会儿刚好是个空隙，咱们聊聊你工作上的事。最近怎样？',
          '下午好啊。不管多忙，你的事都值得认真对待。跟我说说遇到什么麻烦了？'
        ],
        evening: [
          '晚上好，我是小桥。这个点儿来找我，看来是心里有事放不下。慢慢说，我听着。',
          '晚上好。夜深人静的时候，反而更容易把事说清楚。你工作上遇到什么难处了？',
          '辛苦了，这么晚还来找我。没事，我一直在。跟我说说你最近工作上的情况？'
        ],
        default: [
          '你好，我是小桥。不用紧张，就当跟一个懂法律的朋友聊天。你最近工作上遇到了什么难处？',
          '嗨，我是小桥。先不管什么法律不法律的，你就当在跟朋友唠嗑——最近工作怎么样？',
          '你好呀，我是小桥。每个人都有自己的不容易，你愿意跟我说说吗？工作上碰到什么事了？'
        ]
      },

      // 共情回应（20+种，随机抽取）
      empathy: [
        '我听到你说的了，这确实很难受。',
        '换谁都会觉得不公平，我理解你的感受。',
        '你说的这些，每一件单拎出来都够让人心烦的，何况堆在一起。',
        '这种感觉我懂——明明自己没做错什么，却要承受这些。',
        '你说的时候我能感受到你的无奈。没事，慢慢说。',
        '被人这样对待，生气是正常的。你的感受完全合理。',
        '辛苦了。这些事情压在心头，肯定不好受。',
        '我听到了。这不是你的错，你已经做得很好了。',
        '谢谢你愿意告诉我这些。把这些说出来本身就需要勇气。',
        '你说得很清楚，我完全理解了。这情况确实让人头疼。',
        '嗯，我在认真听。你说的每一个细节都很重要。',
        '我明白。这种事放在谁身上都不好过。',
        '听你这么说，我能感受到这件事对你影响很大。',
        '是的，这种情况法律其实是站在你这边的——但首先我要听完你的全部。',
        '好的，我记下了。你先说，把心里的话都说出来。',
        '这个细节很重要，谢谢你告诉我。继续说吧。',
        '我理解你为什么会有这种感觉——完全合理。',
        '嗯，我在听。不着急，你想说多少就说多少。',
        '你说的这个点很关键，我得好好记下来。',
        '没关系，想到哪说到哪。有些事说出来了，路就清楚了。'
      ],

      // 答案不匹配时的重组提问（25+种，针对不同情况）
      reask: {
        generic: [
          '可能我没问清楚——我想了解的是{target}，你能就这个方面再说说吗？',
          '不好意思，我换个方式问：{rephrased}',
          '你说的这个我也记下了，不过我其实更想了解{target}。方便说说吗？',
          '啊，我刚才可能表达得不够好。让我重新问一遍：{rephrased}',
          '你刚才说的很重要，不过我还想多了解一点关于{target}的情况。',
          '咱们稍微聚焦一下——关于{target}，你能再说具体些吗？',
          '我想确认我理解对了——另外，关于{target}这个方面，你还没提到，方便说说吗？'
        ],
        tooVague: [
          '你说的我大概有感觉了，但能不能再具体一点点？比如{example}？',
          '嗯，我大概明白了。不过要是能说细一点就更好了——比如{example}，具体情况是怎样的？',
          '我理解了个大概，不过法律文书需要具体一些。比如{example}，你能举个例子吗？'
        ],
        emotional: [
          '我能感受到你说这个的时候情绪挺激动的——这很正常。先缓一缓，然后咱们换个角度：关于{target}，你能跟我说说吗？',
          '这件事显然让你很不好受。我理解。等你好受一点了，我想问问关于{target}的情况——不着急。',
          '我听到你的愤怒/委屈了。完全合理。同时我想确认一下——关于{target}，你有了解吗？'
        ],
        deflection: [
          '我注意到你好像不太想说{target}这个话题——没关系，很多人一开始都觉得不好开口。但我得跟你说明白：这个信息对写申请书非常关键，没有它仲裁委可能不受理。你看咱们是现在聊，还是先跳过待会再回来？',
          '你是不是担心说{target}会有什么后果？放心，这些信息都存在你手机里，不会传出去。而且这个信息确实绕不开——你看能跟我说说吗？'
        ]
      },

      // 积极倾听确认（15种）
      activeListening: [
        '如果我没理解错的话，{summary}——是这样吗？',
        '我总结一下你说的：{summary}。有哪里不对的，你随时纠正我。',
        '让我确认一下我的理解对不对——{summary}？',
        '所以整体来看是这样的：{summary}。这理解对吗？',
        '我听到了这些要点：{summary}。有没有遗漏的？',
        '你刚才说了几个很关键的点，我帮你理一下：{summary}。你看我说得对不对？'
      ],

      // 法律知识点播（嵌入对话中的微型普法）
      legalSnippets: {
        wage_arrears: [
          '你知道吗？根据《劳动合同法》第85条，欠薪不仅要还，还要加付50%-100%的赔偿金。这是法律白纸黑字写的。',
          '有个重要的事：劳动仲裁的时效是1年，从你知道权利被侵害那天算起。所以别拖太久。',
          '很多人不知道——即使没签合同，只要你能证明你在那上过班，劳动关系就成立，仲裁委就得管。'
        ],
        no_contract: [
          '注意——没签合同的情况下，从入职第2个月到第12个月，公司要每月多付你一倍工资。这是《劳动合同法》第82条规定的。',
          '很多人以为没签合同就等于"黑工"，不是的。法律保护事实劳动关系。你有工资记录、工牌、工友证言就行。'
        ],
        work_injury: [
          '工伤认定有1年的时效——从受伤那天算。公司不申请的话，你自己一定要在1年内去人社局申请。超了就很难了。',
          '工伤期间你的工资应该照发——这叫"停工留薪期"，不能因为你受了伤就断了收入。'
        ],
        overtime: [
          '加班费有明确标准：平时1.5倍、周末2倍、节假日3倍。口头说"我们公司就这样"不算数，法律说了算。',
          '公司说"自愿加班"就不用给钱？不对。只要是在公司安排下或者公司知情且不阻止的加班，都得算。'
        ],
        unfair_dismissal: [
          '口头辞退在法律上也是有效的辞退行为——不要以为没有书面通知就不算数。',
          '违法辞退的赔偿金是经济补偿金的2倍。干满一年赔一个月，不满半年赔半个月，半年到一年也算一个月。'
        ]
      },

      // 困境深度挖掘（10种追问技术）
      depthProbes: [
        '这件事对你生活造成了哪些实际影响？比如房租还能交吗？家里开销还够吗？',
        '除了你刚才说的这些，还有没有别的让你晚上睡不着觉的事？',
        '你跟家里人说过这件事吗？他们怎么看？',
        '你之前有没有尝试过什么办法来解决？结果怎么样？',
        '这件事里，最让你觉得憋屈或委屈的是什么？',
        '你有没有担心过——比如去告了会不会被报复、会不会影响以后找工作？',
        '如果这件事能解决，你心里最想要的结果是什么样的？',
        '这段时间有没有人帮过你？工友、朋友、家里人？',
        '你现在最着急的是什么？是钱的问题，还是心里这口气，还是别的？',
        '如果给你一个机会，让你跟对方坐下来谈，你最想说什么？'
      ],

      // 困难总结（在对话中识别到困境后的回应）
      difficultyAcknowledgments: [
        '我听到你面临的不仅是法律问题——{difficulty}。这些我都会记下来，后面给你的行动指引里会专门针对这些情况给建议。',
        '你刚才说的{description}，这就是我常说的"隐形困难"——法律文书里不一定写，但实际生活中最折磨人的就是这个。',
        '我理解，{description}。法律解决不了所有问题，但至少可以做一件事：给你一个正式的、有分量的说法。'
      ],

      // 过渡与引导（15种）
      transitions: [
        '好的，这个我了解了。接下来我想问另一个方面——',
        '嗯，这一点已经很清楚了。咱们换个话题——',
        '谢谢你说得这么详细。下面我再了解一个事——',
        '好的好的，记下了。然后呢——',
        '了解。那接下来——',
        '明白了。还有一件事我想确认一下——',
        '嗯嗯，继续说——我刚才想问的是——',
        '好，这一点过了。我还有一个问题——'
      ],

      // 轮次推进提示
      progressNudges: [
        '咱们已经聊了{round}轮了，差不多还有几个方面要确认一下，很快就好。',
        '进度不错——{round}个问题过去了，还剩大概{todo}个方面。坚持一下。',
        '辛苦你了，已经回答了{round}个问题了。我觉得关键信息差不多齐了，再确认几个细节就好。'
      ],

      // 结束语
      completions: [
        '好了，感谢你跟我说了这么多，每一句都很珍贵。我已经把所有信息整理好了，接下来帮你——\n1) 生成法律文书\n2) 找到对应的法律条款\n3) 分析你的议价权和操作空间\n4) 给出具体的行动步骤',
        '好，聊到这里信息已经很充分了。你面临的情况我基本清楚了，不仅是什么事，更重要是你因为这个事承受了什么。接下来这些都会变成正式的法律语言和行动方案。',
        '你辛苦了，讲了这么多。我现在帮你把这一切——你的遭遇、你的困惑、你的诉求——都变成有法律效力的文字和可操作的步骤。稍等一下。'
      ]
    };
  }

  // ============ 话题规划（20+轮次） ============

  _buildTopicPlan() {
    return {
      // 阶段划分
      phases: [
        { id: 'rapport',    label: '建立信任',   minRounds: 1, maxRounds: 3 },
        { id: 'narrative',  label: '自由叙述',   minRounds: 2, maxRounds: 5 },
        { id: 'identity',   label: '身份信息',   minRounds: 1, maxRounds: 2 },
        { id: 'employer',   label: '对方信息',   minRounds: 1, maxRounds: 3 },
        { id: 'timeline',   label: '时间线',     minRounds: 1, maxRounds: 3 },
        { id: 'details',    label: '细节深挖',   minRounds: 2, maxRounds: 4 },
        { id: 'evidence',   label: '证据盘点',   minRounds: 1, maxRounds: 3 },
        { id: 'impact',     label: '影响评估',   minRounds: 1, maxRounds: 3 },
        { id: 'legalEdu',   label: '法律科普',   minRounds: 1, maxRounds: 2 },
        { id: 'demand',     label: '诉求确认',   minRounds: 1, maxRounds: 2 },
        { id: 'summary',    label: '总结确认',   minRounds: 1, maxRounds: 1 }
      ],

      // 每类问题的话题优先级
      topicPriority: {
        wage_arrears: [
          'employment_relationship', 'salary_amount', 'arrears_period',
          'arrears_calculation', 'communication_records', 'employer_assets',
          'previous_demands', 'living_impact', 'coworker_situation'
        ],
        no_contract: [
          'employment_start', 'work_nature', 'salary_payment',
          'contract_promise', 'other_workers_contract', 'employer_excuse',
          'double_salary_awareness', 'job_stability_concern'
        ],
        work_injury: [
          'accident_detail', 'medical_treatment', 'medical_cost',
          'employer_response', 'witness_availability', 'injury_severity',
          'future_work_ability', 'family_burden', 'insurance_status'
        ],
        overtime: [
          'normal_hours', 'overtime_pattern', 'overtime_record',
          'overtime_pay', 'forced_overtime', 'health_impact',
          'company_policy', 'industry_norm'
        ],
        unfair_dismissal: [
          'dismissal_reason', 'dismissal_process', 'severance_offer',
          'employment_duration', 'performance_record', 'discrimination_clue',
          'reemployment_concern', 'psychological_impact'
        ]
      }
    };
  }

  // ============ 启动对话 ============

  async start(problemType, initialText = null) {
    this.state.problemType = problemType;
    this.state.round = 0;
    this.state.startedAt = new Date().toISOString();
    this.state.history = [];
    this.state.facts = this._emptyFacts();
    this.state.facts.problemType = [problemType];
    this.state.difficulties = [];
    this.state.legalMatches = [];
    this.state.bargainingPoints = [];
    this.state.coveredTopics = new Set();
    this.state.pendingClarifications = [];
    this.state.reflectionNotes = [];
    this.state.strategyAdjustments = [];
    this.state.llmAvailable = !!(this.llm && this.llm.isConfigured);

    // 选择开场白
    const hour = new Date().getHours();
    let timeOfDay = 'default';
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else timeOfDay = 'evening';

    const openings = this.lang.openings[timeOfDay] || this.lang.openings.default;
    const opening = openings[Math.floor(Math.random() * openings.length)];

    await this._sendBotMessage(opening, { type: 'opening' });

    // 如果有初始文本，先处理
    if (initialText) {
      this.state.history.push({ role: 'user', content: initialText, timestamp: new Date().toISOString() });
      this.state.round = 1;
      await this._processDeepTurn(initialText);
    } else {
      // 等待用户第一轮回应
      this.state.round = 0;
    }

    this._emitProgress();
    return this.state;
  }

  // ============ 核心：处理用户回答 ============

  async processAnswer(userText) {
    if (!userText || !userText.trim()) {
      await this._sendBotMessage(
        this._pickRandom(this.lang.reask.generic).replace('{target}', '你遇到的困难'),
        { type: 'reask' }
      );
      return this.state;
    }

    this.state.round++;
    this.state.history.push({
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
      round: this.state.round
    });

    // 深度处理这一轮
    await this._processDeepTurn(userText);

    // 自反思：检查是否需要调整策略
    if (this.state.round % 5 === 0) {
      await this._selfReflect();
    }

    this._emitProgress();

    // 检查是否应该完成
    if (this._shouldComplete()) {
      await this._finalizeConversation();
      return this.state;
    }

    return this.state;
  }

  // ============ 深度处理单轮对话 ============

  async _processDeepTurn(userText) {
    if (this.state.llmAvailable) {
      await this._llmDrivenTurn(userText);
    } else {
      await this._ruleBasedTurn(userText);
    }
  }

  // LLM驱动模式
  async _llmDrivenTurn(userText) {
    this.onThinking(true);

    const systemPrompt = this._buildLLMSystemPrompt();
    const messages = this._buildLLMMessages(userText);

    try {
      const response = await this.llm.chat(messages, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 600
      });

      if (response) {
        const parsed = this._parseLLMResponse(response);
        await this._handleLLMResponse(parsed, response);
      } else {
        // LLM失败，降级到规则模式
        await this._ruleBasedTurn(userText);
      }
    } catch (e) {
      console.warn('[DeepDialogue] LLM turn failed:', e.message);
      await this._ruleBasedTurn(userText);
    }

    this.onThinking(false);
  }

  _buildLLMSystemPrompt() {
    const problemLabel = this._getProblemLabel();
    const coveredStr = Array.from(this.state.coveredTopics).join('、');
    const difficultiesStr = this.state.difficulties.map(d => d.description).join('；');
    const roundInfo = `当前第${this.state.round}轮/目标至少20轮`;

    return `你是"小桥"，一位专业的劳动者权益对话助手。你的使命是通过耐心、共情、深度的对话，帮助劳动者说出他们的遭遇，并将其转化为法律行动。

## 你的特质
- 你像一位懂法律的朋友，不是冷冰冰的机器
- 你非常耐心——如果对方回答偏离了你的问题，你会换一种更简单、更口语的方式重新问，而不是直接跳到下一个问题
- 你善于共情——在追问事实的同时，你会注意到对方的情感状态和真实困境
- 你懂得适时给一点法律知识——不是在说教，而是"顺便告诉你一个有用的信息"
- 你会深度追问——不只是记录表面事实，还会了解这件事对对方生活造成的实际影响
- 你善于发现"隐形困难"——那些法律文书里写不出来，但实际生活中最折磨人的东西

## 当前对话上下文
- 问题类型：${problemLabel}
- 对话轮次：${roundInfo}
- 已覆盖话题：${coveredStr || '尚未开始'}
- 已识别的困境：${difficultiesStr || '尚未识别'}
- 已提取的事实：${JSON.stringify(this.state.facts)}

## 你的对话策略
1. 当前轮次<3：建立信任，让对方自由叙述，不要打断，多用共情回应
2. 当前轮次3-7：在倾听中自然地追问关键信息（身份、对方、时间、金额等），每次只追问1个点
3. 当前轮次8-15：深度挖掘——证据、影响、之前的尝试、隐藏的困难
4. 当前轮次16-20：法律科普 + 诉求确认，自然地嵌入法条知识
5. 当前轮次>20：总结确认，准备结束

## 重要规则
- 每次回复控制在2-4句话（中文），保持口语化
- 如果对方回答与你的问题不匹配，耐心重组语言再问一次，最多重问2次
- 每3-4轮做一次积极倾听总结："我理解的是...对吗？"
- 发现困境时，标记 ##DIFFICULTY:类别|描述|严重程度(高/中/低)
- 发现法律操作点时，标记 ##LEGAL:法条名称|操作要点
- 发现议价权时，标记 ##BARGAIN:议价点|分析
- 提取到事实时，标记 ##FACT:字段名|值`;
  }

  _buildLLMMessages(userText) {
    // 取最近15轮历史作为上下文
    const recentHistory = this.state.history.slice(-15);
    const msgs = recentHistory.map(h => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: h.content
    }));
    // 最后一条已经是当前用户输入（在history中），不需要重复添加
    return msgs;
  }

  _parseLLMResponse(text) {
    const result = {
      message: text,
      facts: {},
      difficulties: [],
      legalMatches: [],
      bargainingPoints: [],
      shouldClarify: false,
      clarificationTarget: null
    };

    // 提取标记
    const difficultyRegex = /##DIFFICULTY:([^|]+)\|([^|]+)\|([^\n]+)/g;
    let m;
    while ((m = difficultyRegex.exec(text)) !== null) {
      result.difficulties.push({
        category: m[1].trim(),
        description: m[2].trim(),
        severity: m[3].trim()
      });
    }

    const legalRegex = /##LEGAL:([^|]+)\|([^\n]+)/g;
    while ((m = legalRegex.exec(text)) !== null) {
      result.legalMatches.push({
        lawName: m[1].trim(),
        operationPoint: m[2].trim()
      });
    }

    const bargainRegex = /##BARGAIN:([^|]+)\|([^\n]+)/g;
    while ((m = bargainRegex.exec(text)) !== null) {
      result.bargainingPoints.push({
        point: m[1].trim(),
        analysis: m[2].trim()
      });
    }

    const factRegex = /##FACT:([^|]+)\|([^\n]+)/g;
    while ((m = factRegex.exec(text)) !== null) {
      result.facts[m[1].trim()] = m[2].trim();
    }

    const clarifyRegex = /##CLARIFY:([^\n]+)/;
    const clarifyMatch = text.match(clarifyRegex);
    if (clarifyMatch) {
      result.shouldClarify = true;
      result.clarificationTarget = clarifyMatch[1].trim();
    }

    // 清理消息中的标记
    result.message = text
      .replace(/##DIFFICULTY:[^\n]+/g, '')
      .replace(/##LEGAL:[^\n]+/g, '')
      .replace(/##BARGAIN:[^\n]+/g, '')
      .replace(/##FACT:[^\n]+/g, '')
      .replace(/##CLARIFY:[^\n]+/g, '')
      .trim();

    return result;
  }

  async _handleLLMResponse(parsed, rawText) {
    // 发送消息
    await this._sendBotMessage(parsed.message, { type: 'llm_response', raw: rawText });

    // 更新事实
    for (const [field, value] of Object.entries(parsed.facts)) {
      if (field in this.state.facts) {
        const existing = this.state.facts[field];
        this.state.facts[field] = existing ? `${existing}；${value}` : value;
      }
    }

    // 记录困境
    for (const d of parsed.difficulties) {
      this.state.difficulties.push(d);
      this.onDifficultyFound(d);
    }

    // 记录法律匹配
    for (const l of parsed.legalMatches) {
      this.state.legalMatches.push(l);
      this.onLegalMatch(l);
    }

    // 记录议价点
    for (const b of parsed.bargainingPoints) {
      this.state.bargainingPoints.push(b);
      this.onBargainingInsight(b);
    }

    // 如果需要追问澄清
    if (parsed.shouldClarify && parsed.clarificationTarget) {
      this.state.pendingClarifications.push(parsed.clarificationTarget);
    }
  }

  // 规则驱动模式（LLM不可用时的回退）
  async _ruleBasedTurn(userText) {
    const currentRound = this.state.round;

    // 前3轮：自由叙述 + 共情
    if (currentRound <= 3) {
      await this._sendBotMessage(this._pickRandom(this.lang.empathy), { type: 'empathy' });

      // 尝试用regex提取事实
      if (window.bridge && window.bridge.extractor) {
        const extracted = window.bridge.extractor.extract(userText);
        this._mergeExtractedFacts(extracted);
      }

      // 如果还没有具体信息，引导用户多说
      if (!this.state.facts.what || this.state.facts.what.length < 20) {
        const probes = this.lang.depthProbes;
        await this._sendBotMessage(
          probes[Math.floor(Math.random() * probes.length)],
          { type: 'probe' }
        );
      }
      return;
    }

    // 中间轮次：系统化信息收集
    const topicOrder = this.topicPlan.topicPriority[this.state.problemType] || [];
    const nextTopic = this._findNextUntouchedTopic(topicOrder);

    if (nextTopic) {
      this.state.coveredTopics.add(nextTopic);
      const question = this._generateQuestionForTopic(nextTopic);
      await this._sendBotMessage(question, { type: 'question', topic: nextTopic });
    } else if (currentRound >= this.state.minRounds) {
      // 所有话题覆盖完毕，准备结束
      await this._sendBotMessage(
        this._pickRandom(this.lang.completions),
        { type: 'completion' }
      );
    } else {
      // 深度挖掘
      const probe = this._pickRandom(this.lang.depthProbes);
      await this._sendBotMessage(probe, { type: 'probe' });
    }
  }

  // ============ 答案相关性检测 ============

  _checkAnswerRelevance(question, answer) {
    if (!answer || answer.length < 3) return { relevant: false, reason: 'too_short' };

    // 简单规则检测（LLM模式下由LLM自行判断）
    const questionKeywords = this._extractKeywords(question);
    const answerKeywords = this._extractKeywords(answer);

    const overlap = questionKeywords.filter(k => answerKeywords.includes(k));
    const relevanceScore = questionKeywords.length > 0
      ? overlap.length / questionKeywords.length
      : 0.5;

    return {
      relevant: relevanceScore > 0.15 || answer.length > 30,
      score: relevanceScore,
      reason: relevanceScore <= 0.15 ? 'low_keyword_overlap' : 'ok'
    };
  }

  _extractKeywords(text) {
    // 简单的中文关键词提取
    const stopWords = ['的', '了', '是', '在', '我', '你', '他', '她', '它', '们', '这', '那', '吗', '呢', '吧', '啊', '嗯', '哦', '有', '和', '与', '或', '就', '都', '也', '还', '要', '会', '能', '可以', '一个', '什么', '怎么', '哪', '为什么'];
    const words = text.split(/[，。！？、；：""''（）\s]+/);
    return words.filter(w => w.length >= 2 && !stopWords.includes(w));
  }

  // ============ 话题管理 ============

  _findNextUntouchedTopic(topicOrder) {
    for (const topic of topicOrder) {
      if (!this.state.coveredTopics.has(topic)) {
        return topic;
      }
    }
    return null;
  }

  _generateQuestionForTopic(topic) {
    // 使用访谈问题数据或生成通用问题
    const topicQuestions = {
      employment_relationship: '能跟我说说你是怎么开始在那工作的吗？是通过什么渠道找的？有没有签什么东西？',
      salary_amount: '你的工资是怎么算的？是按月固定、按天算、还是计件的？一个月大概多少？',
      arrears_period: '欠薪是从什么时候开始的？到现在一共几个月了？中间老板有没有给过一部分？',
      arrears_calculation: '你自己算过一共欠了多少吗？不用特别精确，大概的数就行。怎么算出来的？',
      communication_records: '你有没有跟老板提过要工资的事？当面说的还是微信上说的？他怎么回复的？',
      employer_assets: '你了解公司的经营状况吗？最近还在正常运转吗？有没有听说要关门或者搬家？',
      previous_demands: '你之前有没有试过什么办法要回工资？去劳动局问过吗？结果怎样？',
      living_impact: '工资发不下来这段时间，你生活上怎么应对的？房租怎么办？家里开销怎么办？',
      coworker_situation: '你其他同事呢？他们也一样被欠工资吗？有没有人已经去告了？',
      employment_start: '你什么时候开始在那工作的？当时是怎么说的——工资多少、做什么、签不签合同？',
      work_nature: '你在那具体做什么？有没有固定的工位、工服、工牌？上下班要打卡吗？',
      salary_payment: '工资怎么发的？现金还是转账？如果是转账，是用谁的账户转的？',
      contract_promise: '当初招你的时候有没有提过签合同的事？中间你提过要签合同吗？对方怎么说？',
      double_salary_awareness: '你知道没签合同的话，可以要求公司多付你一倍工资吗？从入职第2个月开始算。',
      accident_detail: '能把事发当时的经过详细说一遍吗？几点、在哪、在做什么、怎么受伤的、谁最先发现的？',
      medical_treatment: '受伤之后谁送你去的医院？去了哪个医院？医生怎么诊断的？现在恢复得怎样了？',
      medical_cost: '医药费花了多少？是你自己垫的还是公司出的？后面的康复还需要多少钱你知道吗？',
      employer_response: '出事之后公司/老板什么反应？来看过你吗？有没有说过怎么处理？',
      injury_severity: '医生有没有说大概多久能恢复？会不会留下后遗症？对你的工作能力有影响吗？',
      normal_hours: '你正常上班时间是几点到几点？一周上几天？这是公司规定的还是行业潜规则？',
      overtime_pattern: '加班是怎么安排的？每天加几个小时？周末也要来吗？是强制的还是"自愿"的？',
      overtime_record: '你手头有能证明你加班时长的东西吗？考勤记录、加班审批单、工作群里发的消息？',
      overtime_pay: '加班费怎么算的？一小时多少钱？公司有没有说过加班费的算法？',
      forced_overtime: '如果你拒绝加班会怎样？有没有人因为不加班被穿小鞋或被辞退的？',
      dismissal_reason: '公司是怎么跟你说要辞退你的？给了什么理由？你觉得这个理由是真的还是借口？',
      dismissal_process: '辞退的时候有没有给你书面通知？有没有让你签字确认？有没有提赔偿的事？',
      severance_offer: '公司有没有说给你补偿？给了多少？说什么时候给？',
      employment_duration: '你一共在那干了多长时间？期间签过几次合同？合同上写的工资和实际一样吗？',
      discrimination_clue: '你觉得被辞退跟你个人的什么特征有关吗？比如年龄、怀孕、生病、跟领导关系？',
      reemployment_concern: '被辞退之后你去找工作了吗？有没有因为这个事影响你找下一份工作？'
    };

    return topicQuestions[topic] || `能再详细跟我说说关于${topic}的情况吗？`;
  }

  // ============ 自反思循环 ============

  async _selfReflect() {
    const reflection = {
      round: this.state.round,
      timestamp: new Date().toISOString(),
      observations: [],
      adjustments: []
    };

    // 检查话题覆盖
    const topicOrder = this.topicPlan.topicPriority[this.state.problemType] || [];
    const uncovered = topicOrder.filter(t => !this.state.coveredTopics.has(t));
    if (uncovered.length > 0) {
      reflection.observations.push(`尚有${uncovered.length}个话题未覆盖：${uncovered.slice(0, 3).join('、')}`);
      reflection.adjustments.push('接下来的轮次优先引导到未覆盖话题');
      this.state.strategyAdjustments.push({
        round: this.state.round,
        reason: 'incomplete_coverage',
        action: `加速覆盖: ${uncovered.slice(0, 2).join(', ')}`
      });
    }

    // 检查困境记录是否充分
    if (this.state.difficulties.length === 0 && this.state.round > 8) {
      reflection.observations.push('已进行8轮以上但未识别到任何深层困境，需加强影响评估追问');
      reflection.adjustments.push('插入生活影响评估问题');
    }

    // 检查法律匹配是否充分
    if (this.state.legalMatches.length === 0 && this.state.round > 10) {
      reflection.observations.push('尚未匹配任何法律操作点，对话偏向闲聊');
      reflection.adjustments.push('在回复中自然嵌入法律知识');
    }

    // 检查对话深度（平均每轮用户输入长度）
    const userMsgs = this.state.history.filter(h => h.role === 'user');
    const avgLength = userMsgs.length > 0
      ? userMsgs.reduce((s, h) => s + h.content.length, 0) / userMsgs.length
      : 0;
    if (avgLength < 15 && this.state.round > 5) {
      reflection.observations.push(`用户平均输入仅${Math.round(avgLength)}字，回答过于简短，可能需要更好的引导`);
      reflection.adjustments.push('使用更开放式的问题，给更多鼓励和共情');
    }

    reflection.observations.push(`当前轮次${this.state.round}，已发现${this.state.difficulties.length}个困境，匹配${this.state.legalMatches.length}条法律`);
    this.state.reflectionNotes.push(reflection);

    console.log('[DeepDialogue] Self-reflection:', reflection);
  }

  // ============ 完成判断 ============

  _shouldComplete() {
    // 最少轮次未达到
    if (this.state.round < this.state.minRounds) return false;

    // 已达最大轮次
    if (this.state.round >= this.state.maxRounds) return true;

    // 核心事实已齐全 + 困境已识别 + 法律已匹配 + 最少轮次已过
    const hasCoreFacts = this.state.facts.who && this.state.facts.whom && this.state.facts.what;
    const hasDifficulties = this.state.difficulties.length > 0;
    const hasLegalMatches = this.state.legalMatches.length > 0;
    const minRoundsReached = this.state.round >= this.state.minRounds;

    // 所有条件满足且最近3轮没有新信息
    if (hasCoreFacts && hasDifficulties && hasLegalMatches && minRoundsReached) {
      const recentUserMsgs = this.state.history.filter(h => h.role === 'user').slice(-3);
      const recentTotalLength = recentUserMsgs.reduce((s, h) => s + h.content.length, 0);
      // 最近3轮用户输入较少 → 信息收集已充分
      if (recentTotalLength < 100) return true;
    }

    return false;
  }

  async _finalizeConversation() {
    // 最后确认
    const summary = this._generateSummary();
    await this._sendBotMessage(summary, { type: 'final_summary' });

    // 匹配法律条文
    this._finalLegalMatch();

    // 分析议价权
    if (this.bargainingAnalyzer) {
      this.state.bargainingPoints = this.bargainingAnalyzer.analyze(
        this.state.facts,
        this.state.problemType,
        this.state.difficulties
      );
    }

    // 触发完成回调
    this.onComplete({
      facts: this.state.facts,
      difficulties: this.state.difficulties,
      legalMatches: this.state.legalMatches,
      bargainingPoints: this.state.bargainingPoints,
      history: this.state.history,
      reflectionNotes: this.state.reflectionNotes,
      roundCount: this.state.round
    });
  }

  _generateSummary() {
    const difficultiesDesc = this.state.difficulties.length > 0
      ? this.state.difficulties.map(d => d.description).join('；')
      : '暂无特殊困难';

    const template = this.lang.completions;
    return template[Math.floor(Math.random() * template.length)];
  }

  _finalLegalMatch() {
    // 基于问题类型匹配法律条文
    if (this.state.legalMatches.length === 0) {
      const type = this.state.problemType;
      const typeLabels = {
        wage_arrears: '拖欠工资',
        no_contract: '未签劳动合同',
        work_injury: '工伤',
        overtime: '超时加班',
        unfair_dismissal: '违法辞退'
      };

      this.state.legalMatches.push({
        lawName: this._getPrimaryLaw(type),
        operationPoint: this._getPrimaryOperation(type),
        matchedVia: 'problem_type'
      });
    }
  }

  _getPrimaryLaw(type) {
    const laws = {
      wage_arrears: '《劳动合同法》第八十五条',
      no_contract: '《劳动合同法》第十条、第八十二条',
      work_injury: '《工伤保险条例》第十四条、第十七条',
      overtime: '《劳动法》第四十一条、第四十四条',
      unfair_dismissal: '《劳动合同法》第四十七条、第八十七条'
    };
    return laws[type] || '';
  }

  _getPrimaryOperation(type) {
    const ops = {
      wage_arrears: '向劳动监察大队投诉或申请劳动仲裁，主张工资+50%-100%赔偿金',
      no_contract: '申请劳动仲裁，主张未签合同期间的双倍工资差额（最多11个月）',
      work_injury: '30日内要求单位申请工伤认定，单位不申请的1年内自行向人社局申请',
      overtime: '收集加班证据，向劳动监察大队投诉或申请仲裁，主张加班费差额',
      unfair_dismissal: '申请劳动仲裁，主张继续履行合同或2N赔偿金'
    };
    return ops[type] || '';
  }

  // ============ 辅助方法 ============

  _getProblemLabel() {
    const labels = {
      wage_arrears: '拖欠工资',
      no_contract: '未签劳动合同',
      work_injury: '工伤',
      overtime: '超时加班',
      unfair_dismissal: '违法辞退'
    };
    return labels[this.state.problemType] || '劳动争议';
  }

  async _sendBotMessage(text, metadata = {}) {
    this.state.history.push({
      role: 'assistant',
      content: text,
      timestamp: new Date().toISOString(),
      round: this.state.round,
      metadata
    });
    this.onMessage(text, metadata);
  }

  _mergeExtractedFacts(extracted) {
    if (!extracted) return;
    for (const [key, value] of Object.entries(extracted)) {
      if (value && key in this.state.facts) {
        const existing = this.state.facts[key];
        if (existing && typeof existing === 'string') {
          this.state.facts[key] = existing + '；' + value;
        } else if (!existing) {
          this.state.facts[key] = value;
        }
      }
    }
  }

  _pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  _emitProgress() {
    const totalPhases = this.topicPlan.phases.length;
    const currentPhase = this.topicPlan.phases.findIndex(p => {
      const phaseStartRound = this.topicPlan.phases
        .slice(0, this.topicPlan.phases.indexOf(p))
        .reduce((s, ph) => s + ph.minRounds, 0);
      return this.state.round >= phaseStartRound;
    });

    this.onProgress({
      round: this.state.round,
      maxRounds: this.state.maxRounds,
      minRounds: this.state.minRounds,
      phase: currentPhase >= 0 ? this.topicPlan.phases[currentPhase]?.label : '',
      phaseIndex: currentPhase,
      totalPhases,
      difficultiesFound: this.state.difficulties.length,
      legalMatches: this.state.legalMatches.length,
      coveredTopics: this.state.coveredTopics.size,
      percent: Math.min(100, Math.round((this.state.round / this.state.maxRounds) * 100))
    });
  }

  // 跳过
  skip() {
    this.state.round++;
    this._emitProgress();
    return this.state;
  }

  // 回到上一轮
  goBack() {
    if (this.state.history.length >= 2) {
      // 移除最后一轮用户+AI
      const lastAI = this.state.history.pop();
      const lastUser = this.state.history.pop();
      this.state.round = Math.max(0, this.state.round - 1);
    }
    return this.state;
  }

  // 重置
  reset() {
    this.state = {
      problemType: null,
      round: 0,
      maxRounds: 25,
      minRounds: 8,
      history: [],
      facts: this._emptyFacts(),
      difficulties: [],
      legalMatches: [],
      bargainingPoints: [],
      emotionalState: null,
      coveredTopics: new Set(),
      pendingClarifications: [],
      reflectionNotes: [],
      strategyAdjustments: [],
      startedAt: null,
      llmAvailable: !!(this.llm && this.llm.isConfigured)
    };
  }
}
