// 对话式访谈引擎 v3 — 双模式：深度LLM对话 + 规则化回退
// 集成 DeepDialogueEngine（20+轮LLM驱动共情对话）
// 保留规则化流程（LLM不可用时使用）

class InterviewEngine {
  constructor(options = {}) {
    this.questions = options.questions || {};
    this.llm = options.llm || null;
    this.legalDB = options.legalDB || {};
    this.bargainingAnalyzer = options.bargainingAnalyzer || null;

    this.onQuestion = options.onQuestion || (() => {});
    this.onAcknowledgment = options.onAcknowledgment || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onProgress = options.onProgress || (() => {});
    this.onDifficultyFound = options.onDifficultyFound || (() => {});
    this.onLegalMatch = options.onLegalMatch || (() => {});
    this.onBargainingInsight = options.onBargainingInsight || (() => {});
    this.onThinking = options.onThinking || (() => {});

    // 模式选择
    this.useDeepMode = false;

    // 深度对话引擎
    this.deepDialogue = null;

    // 规则模式状态（保留兼容）
    this.state = {
      problemType: null,
      currentQuestionIndex: 0,
      questionFlow: [],
      answers: {},
      history: [],
      skippedQuestions: [],
      startedAt: null,
      mode: 'rule' // 'rule' | 'deep'
    };

    this.facts = this._emptyFacts();
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

  // ============ 主入口 ============

  start(problemType, options = {}) {
    this.state.problemType = problemType;
    this.state.startedAt = new Date().toISOString();

    // 判断是否使用深度模式
    this.useDeepMode = !!(this.llm && this.llm.isConfigured);

    if (this.useDeepMode) {
      return this._startDeepMode(problemType, options);
    } else {
      return this._startRuleMode(problemType);
    }
  }

  // ============ 深度模式 ============

  _startDeepMode(problemType, options) {
    this.state.mode = 'deep';

    this.deepDialogue = new DeepDialogueEngine({
      llm: this.llm,
      questionsData: { questions: this.questions },
      legalDB: this.legalDB,
      bargainingAnalyzer: this.bargainingAnalyzer,
      onMessage: (text, metadata) => {
        this.state.history.push({
          role: metadata.type === 'user' ? 'user' : 'bot',
          content: text,
          timestamp: new Date().toISOString(),
          metadata
        });
        if (metadata.type === 'opening' || metadata.type === 'llm_response' ||
            metadata.type === 'question' || metadata.type === 'probe' ||
            metadata.type === 'empathy' || metadata.type === 'acknowledgment' ||
            metadata.type === 'final_summary') {
          this.onQuestion({ text, ttsText: text, type: 'bot', metadata });
        }
      },
      onThinking: (thinking) => { this.onThinking(thinking); },
      onProgress: (progress) => { this.onProgress(progress); },
      onDifficultyFound: (d) => {
        this.state.difficulties = this.state.difficulties || [];
        this.state.difficulties.push(d);
        this.onDifficultyFound(d);
      },
      onLegalMatch: (l) => {
        this.state.legalMatches = this.state.legalMatches || [];
        this.state.legalMatches.push(l);
        this.onLegalMatch(l);
      },
      onBargainingInsight: (b) => {
        this.state.bargainingPoints = this.state.bargainingPoints || [];
        this.state.bargainingPoints.push(b);
        this.onBargainingInsight(b);
      },
      onComplete: (result) => {
        this.facts = result.facts;
        this._deepComplete(result);
      }
    });

    this.deepDialogue.start(problemType, options.initialText || null);
    return this.state;
  }

  async _deepComplete(result) {
    this.onComplete({
      ...this.facts,
      _deepResult: result
    });
  }

  // ============ 规则模式（回退） ============

  _startRuleMode(problemType) {
    this.state.mode = 'rule';
    this.state.currentQuestionIndex = 0;
    this.state.answers = {};
    this.state.history = [];
    this.state.skippedQuestions = [];

    const flow = this.questions[problemType];
    if (!flow || flow.length === 0) {
      this.state.questionFlow = this._getFallbackFlow();
    } else {
      this.state.questionFlow = flow;
    }

    this.facts = this._emptyFacts();
    this.facts.problemType = [problemType];

    const first = this.state.questionFlow[0];
    this._emitQuestion(first);
    this._updateProgress();

    return this.state;
  }

  // ============ 统一处理入口 ============

  async processAnswer(answer, questionId) {
    if (this.state.mode === 'deep' && this.deepDialogue) {
      return await this.deepDialogue.processAnswer(answer);
    }
    return this._processRuleAnswer(answer, questionId);
  }

  skip(questionId) {
    if (this.state.mode === 'deep' && this.deepDialogue) {
      return this.deepDialogue.skip();
    }
    return this._skipRule(questionId);
  }

  goBack() {
    if (this.state.mode === 'deep' && this.deepDialogue) {
      return this.deepDialogue.goBack();
    }
    return this._goBackRule();
  }

  // ============ 规则模式处理 ============

  _processRuleAnswer(answer, questionId) {
    if (!answer || !answer.trim()) {
      this._skipCurrent();
      return this.state;
    }

    const q = this._findCurrentQuestion(questionId);
    if (!q) return this.state;

    // 答案相关性检测
    const relevanceCheck = this._checkAnswerRelevance(q, answer);
    if (!relevanceCheck.relevant && !q.deepProbe) {
      // 不匹配——重新提问（最多重试一次）
      if (!this.state._reaskCount) this.state._reaskCount = {};
      const reaskCount = this.state._reaskCount[q.id] || 0;
      if (reaskCount < 1) {
        this.state._reaskCount[q.id] = reaskCount + 1;
        this._emitReask(q);
        return this.state;
      }
      // 已经重问过——接受这个答案，继续
    }

    this.state._reaskCount = {};

    // 保存回答
    this.state.answers[q.id] = answer;
    this.state.history.push({
      questionId: q.id,
      question: q.text,
      answer,
      timestamp: new Date().toISOString()
    });

    // 更新事实
    if (q.field && q.field in this.facts) {
      const existing = this.facts[q.field];
      this.facts[q.field] = existing ? `${existing}；${answer}` : answer;
    }

    // 追加到叙事字段
    if (q.field !== 'what' && answer.length > 10) {
      this.facts.what = this.facts.what ? `${this.facts.what}\n${answer}` : answer;
    }

    // 法律片段提示
    if (q.legalSnippet && this.onAcknowledgment) {
      setTimeout(() => this.onAcknowledgment(q.legalSnippet, 'legal'), 500);
    }

    this._advance();
    this._updateProgress();
    return this.state;
  }

  _skipRule(questionId) {
    const q = this._findCurrentQuestion(questionId);
    if (q) {
      this.state.skippedQuestions.push(q.id);
      this.state.history.push({
        questionId: q.id, question: q.text, answer: '（跳过）',
        timestamp: new Date().toISOString()
      });
    }
    this._advance();
    this._updateProgress();
    return this.state;
  }

  _goBackRule() {
    if (this.state.history.length <= 1) return this.state;
    const last = this.state.history.pop();
    if (last.questionId) delete this.state.answers[last.questionId];
    this.state.currentQuestionIndex = Math.max(0, this.state.currentQuestionIndex - 2);
    const q = this.state.questionFlow[this.state.currentQuestionIndex];
    if (q) this._emitQuestion(q);
    this._updateProgress();
    return this.state;
  }

  // ============ 答案相关性检测 ============

  _checkAnswerRelevance(question, answer) {
    if (!answer || answer.length < 3) return { relevant: false, reason: 'too_short' };
    // 如果用户回答很长（30字以上），一般包含了相关信息
    if (answer.length > 30) return { relevant: true, score: 0.8 };
    const qKeywords = this._extractKeywords(question.text);
    const aKeywords = this._extractKeywords(answer);
    const overlap = qKeywords.filter(k => aKeywords.includes(k));
    const score = qKeywords.length > 0 ? overlap.length / qKeywords.length : 0.5;
    return { relevant: score > 0.1, score };
  }

  _extractKeywords(text) {
    const stopWords = ['的', '了', '是', '在', '我', '你', '他', '她', '它', '们', '这', '那', '吗', '呢', '吧', '啊', '嗯', '哦', '有', '和', '与', '或', '就', '都', '也', '还', '要', '会', '能', '可以', '一个', '什么', '怎么', '哪', '为什么', '一下', '一下', '这个', '那个'];
    const words = text.split(/[，。！？、；：""''（）\s]+/);
    return words.filter(w => w.length >= 2 && !stopWords.includes(w));
  }

  _emitReask(q) {
    if (q.variants && q.variants.length > 0) {
      const variant = q.variants[Math.floor(Math.random() * q.variants.length)];
      this.onQuestion({ ...q, text: variant, isReask: true });
    } else {
      this.onQuestion({
        ...q,
        text: `不好意思，可能我没问清楚——${q.text}`,
        isReask: true
      });
    }
  }

  // ============ 内部方法 ============

  _findCurrentQuestion(questionId) {
    if (questionId) return this.state.questionFlow.find(q => q.id === questionId) || null;
    return this.state.questionFlow[this.state.currentQuestionIndex] || null;
  }

  _advance() {
    this.state.currentQuestionIndex++;
    if (this.state.currentQuestionIndex >= this.state.questionFlow.length) {
      this.state.completedAt = new Date().toISOString();
      this.onComplete(this.facts);
      return;
    }

    // 每3个问题插入一个确认
    const answeredCount = Object.keys(this.state.answers).length;
    if (answeredCount > 0 && answeredCount % 3 === 0 && this.onAcknowledgment) {
      const acks = [
        '明白了，我记下来了。这些信息都很重要。',
        '好的，我听懂了。你说的很清楚。',
        '嗯，了解了。你提供的信息很有用。'
      ];
      this.onAcknowledgment(acks[Math.floor(Math.random() * acks.length)], 'ack');
    }

    const next = this.state.questionFlow[this.state.currentQuestionIndex];
    this._emitQuestion(next);
  }

  _skipCurrent() {
    const current = this.state.questionFlow[this.state.currentQuestionIndex];
    if (current) this.state.skippedQuestions.push(current.id);
    this._advance();
    this._updateProgress();
  }

  _emitQuestion(q) {
    if (!q) return;
    this.onQuestion(q, this.state.currentQuestionIndex, this.state.questionFlow.length);
  }

  _updateProgress() {
    const total = this.state.questionFlow.length;
    const answered = Object.keys(this.state.answers).length;
    this.onProgress({
      answered, total,
      percent: total > 0 ? Math.round((answered / total) * 100) : 0,
      mode: 'rule'
    });
  }

  // ============ 公共API ============

  getProgress() {
    if (this.state.mode === 'deep' && this.deepDialogue) {
      return {
        answered: this.deepDialogue.state.round,
        total: this.deepDialogue.state.maxRounds,
        percent: Math.min(100, Math.round((this.deepDialogue.state.round / this.deepDialogue.state.maxRounds) * 100)),
        mode: 'deep',
        phase: this.deepDialogue.state.coveredTopics ? `${this.deepDialogue.state.coveredTopics.size}个话题` : '',
        difficultiesFound: this.deepDialogue.state.difficulties?.length || 0,
        legalMatches: this.deepDialogue.state.legalMatches?.length || 0
      };
    }
    const total = this.state.questionFlow.length;
    const answered = Object.keys(this.state.answers).length;
    return { answered, total, percent: total > 0 ? Math.round((answered / total) * 100) : 0, mode: 'rule' };
  }

  getFacts() {
    if (this.state.mode === 'deep' && this.deepDialogue) {
      return { ...this.deepDialogue.state.facts };
    }
    return { ...this.facts };
  }

  getDeepResult() {
    if (this.state.mode === 'deep' && this.deepDialogue) {
      return {
        facts: this.deepDialogue.state.facts,
        difficulties: this.deepDialogue.state.difficulties,
        legalMatches: this.deepDialogue.state.legalMatches,
        bargainingPoints: this.deepDialogue.state.bargainingPoints,
        reflectionNotes: this.deepDialogue.state.reflectionNotes,
        history: this.deepDialogue.state.history,
        roundCount: this.deepDialogue.state.round
      };
    }
    return null;
  }

  isComplete() {
    if (this.state.mode === 'deep') {
      return this.deepDialogue ? this.deepDialogue._shouldComplete() : false;
    }
    return this.state.currentQuestionIndex >= this.state.questionFlow.length;
  }

  editField(field, value) {
    if (this.state.mode === 'deep' && this.deepDialogue) {
      if (field in this.deepDialogue.state.facts) {
        this.deepDialogue.state.facts[field] = value;
      }
    } else if (field in this.facts) {
      this.facts[field] = value;
    }
  }

  reset() {
    if (this.deepDialogue) this.deepDialogue.reset();
    this.state = {
      problemType: null, currentQuestionIndex: 0, questionFlow: [],
      answers: {}, history: [], skippedQuestions: [], startedAt: null,
      mode: this.useDeepMode ? 'deep' : 'rule'
    };
    this.facts = this._emptyFacts();
  }

  _getFallbackFlow() {
    return [
      { id: 'fb_what', text: '请详细说说你遇到了什么事？', field: 'what', type: 'open', required: true, nextQuestion: 'fb_who' },
      { id: 'fb_who', text: '你叫什么名字？', field: 'who', type: 'open', required: true, nextQuestion: 'fb_whom' },
      { id: 'fb_whom', text: '对方是谁？公司名字或老板名字？', field: 'whom', type: 'open', required: true, nextQuestion: 'fb_when' },
      { id: 'fb_when', text: '什么时候发生的事？', field: 'when', type: 'open', required: true, nextQuestion: 'fb_where' },
      { id: 'fb_where', text: '在什么地方？', field: 'where', type: 'open', required: false, nextQuestion: 'fb_money' },
      { id: 'fb_money', text: '涉及多少钱？', field: 'howMuch', type: 'open', required: false, nextQuestion: 'fb_evidence' },
      { id: 'fb_evidence', text: '有什么证据吗？', field: 'evidence', type: 'open', required: false, nextQuestion: 'fb_demand' },
      { id: 'fb_demand', text: '你希望怎么解决？', field: 'demand', type: 'open', required: true, nextQuestion: null }
    ];
  }
}
