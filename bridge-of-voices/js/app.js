// 声音的桥 v3 — 主控制器
// 路由：Welcome → TypeSelect → Interview → Review → Document
// v3升级：深度LLM对话(20+轮)、共情倾听、法律条文精确匹配、议价权分析、自反思循环

class VoiceBridge {
  constructor() {
    // 模块初始化
    this.llm = new LLMClient();
    this.extractor = new FactExtractor(this.llm);
    this.speech = new SpeechRecognizer();
    this.tts = new SpeechTTS();
    this.generator = new DocumentGenerator();
    this.caseManager = new CaseManager();
    this.bargainingAnalyzer = new BargainingAnalyzer();
    this.interview = null;

    // 全局状态
    this.currentStage = 'welcome';
    this.currentDocType = 'arbitration';
    this.facts = null;
    this.documents = {};
    this.questionsData = null;
    this.legalData = null;
    this.deepResult = null;   // 深度对话结果
    this.bargainingResult = null; // 议价权分析结果
    this.isRecording = false;
    this.isThinking = false;  // LLM思考中

    // 初始化
    this._init();
  }

  async _init() {
    await this._loadData();
    this.tts.loadPreference();
    this._bindGlobalEvents();
    this._initSettings();
    this._initEmergency();
    this._updateModeBadge();
    this._checkReturningUser();
  }

  async _loadData() {
    try {
      const [questionsResp, legalResp, cityResp] = await Promise.all([
        fetch('data/interview-questions.json'),
        fetch('data/legal-knowledge.json'),
        fetch('data/city-venues.json')
      ]);
      this.questionsData = await questionsResp.json();
      this.legalData = await legalResp.json();
      this.generator.cityInfo = await cityResp.json();
      this.bargainingAnalyzer.legalDB = this.legalData;
    } catch (e) {
      console.warn('[App] Failed to load data files:', e.message);
    }
  }

  _checkReturningUser() {
    // 检查是否有未完成的草稿
    if (Storage.hasDraft()) {
      this.navigate('resume-choice');
    } else if (!Storage.hasSeenWelcome()) {
      this.navigate('welcome');
    } else {
      this.navigate('type-select');
    }
  }

  // === 路由 ===

  navigate(stage, data = null) {
    this.currentStage = stage;
    this._hideAllStages();

    switch (stage) {
      case 'welcome': this._showWelcome(); break;
      case 'resume-choice': this._showResumeChoice(); break;
      case 'type-select': this._showTypeSelect(); break;
      case 'interview': this._startInterview(data); break;
      case 'review': this._showReview(data); break;
      case 'document': this._showDocument(); break;
      case 'cases': this._showCaseList(); break;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  _hideAllStages() {
    document.querySelectorAll('.stage').forEach(el => el.classList.remove('active'));
  }

  // === 阶段：欢迎引导 ===

  _showWelcome() {
    const stage = document.getElementById('stage-welcome');
    stage.classList.add('active');

    // 3 屏滑动引导
    const screens = stage.querySelectorAll('.welcome-screen');
    const dots = stage.querySelectorAll('.welcome-dot');
    let currentScreen = 0;

    const showScreen = (index) => {
      screens.forEach((s, i) => s.classList.toggle('active', i === index));
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
      currentScreen = index;
    };

    stage.querySelector('.welcome-next')?.addEventListener('click', () => {
      if (currentScreen < screens.length - 1) {
        showScreen(currentScreen + 1);
      } else {
        Storage.markWelcomeSeen();
        this.navigate('type-select');
      }
    });

    stage.querySelector('.welcome-skip')?.addEventListener('click', () => {
      Storage.markWelcomeSeen();
      this.navigate('type-select');
    });

    // 滑动支持
    let touchStartX = 0;
    stage.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
    stage.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (diff > 50 && currentScreen < screens.length - 1) showScreen(currentScreen + 1);
      if (diff < -50 && currentScreen > 0) showScreen(currentScreen - 1);
    });

    showScreen(0);
  }

  // === 阶段：恢复选择 ===

  _showResumeChoice() {
    const stage = document.getElementById('stage-resume');
    stage.classList.add('active');

    stage.querySelector('.btn-resume-continue')?.addEventListener('click', () => {
      const draft = Storage.loadDraft();
      if (draft && draft.interviewState) {
        this._resumeInterview(draft);
      } else if (draft && draft.facts) {
        this.navigate('review', draft.facts);
      }
    });

    stage.querySelector('.btn-resume-new')?.addEventListener('click', () => {
      Storage.clearDraft();
      this.navigate('type-select');
    });
  }

  _resumeInterview(draft) {
    this.facts = draft.facts;
    const state = draft.interviewState;
    this.navigate('interview', { problemType: state.problemType, resumeState: state });
  }

  // === 阶段：问题类型选择 ===

  _showTypeSelect() {
    const stage = document.getElementById('stage-type');
    stage.classList.add('active');

    // 快捷选择
    stage.querySelectorAll('.type-card').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.dataset.type;
        this.navigate('interview', { problemType: type });
      });
    });

    // 自由描述（不确定类型）
    stage.querySelector('.btn-free-describe')?.addEventListener('click', async () => {
      const text = stage.querySelector('.free-describe-input')?.value?.trim();
      if (!text) {
        Utils.toast('请先简单描述一下你的情况', 'error');
        return;
      }
      const btn = stage.querySelector('.btn-free-describe');
      btn.disabled = true;
      btn.textContent = 'AI 分析中…';
      const facts = await this.extractor.extractWithLLM(text);
      btn.disabled = false;
      btn.textContent = '开始对话 →';
      const problemType = facts.problemType?.[0] || 'wage_arrears';
      this.facts = facts;
      this.navigate('interview', { problemType, initialText: text });
    });
  }

  // === 阶段：对话式访谈 ===

  _startInterview({ problemType, initialText, resumeState }) {
    const stage = document.getElementById('stage-interview');
    stage.classList.add('active');

    const chatArea = stage.querySelector('.chat-area');
    const progressBar = stage.querySelector('.progress-fill');
    const modeBadge = document.createElement('span');

    // 清空聊天区
    chatArea.innerHTML = '';

    // 初始化深度访谈引擎
    this.interview = new InterviewEngine({
      questions: this.questionsData?.questions || {},
      llm: this.llm,
      legalDB: this.legalData,
      bargainingAnalyzer: this.bargainingAnalyzer,

      onQuestion: (q, index, total) => {
        this._addBotMessage(q.text, q.ttsText);
        if (this.tts.enabled && q.ttsText) {
          this.tts.prompt(q.ttsText);
        }
        const hint = stage.querySelector('.input-hint');
        if (hint) hint.textContent = q.hint || '';
      },

      onAcknowledgment: (msg, type) => {
        if (type === 'legal') {
          this._addBotMessage('💡 ' + msg, '', 'legal');
        } else {
          this._addBotMessage(msg, '', 'ack');
        }
      },

      onThinking: (thinking) => {
        this.isThinking = thinking;
        const sendBtn = stage.querySelector('.btn-send');
        if (sendBtn) sendBtn.disabled = thinking;
        // 显示/隐藏思考指示器
        const existing = chatArea.querySelector('.typing-indicator');
        if (thinking && !existing) {
          const ti = document.createElement('div');
          ti.className = 'chat-message bot typing-indicator-wrap';
          ti.innerHTML = '<div class="chat-avatar">🔉</div><div class="typing-indicator"><span></span><span></span><span></span></div>';
          chatArea.appendChild(ti);
          chatArea.scrollTop = chatArea.scrollHeight;
        } else if (!thinking && existing) {
          existing.remove();
        }
      },

      onDifficultyFound: (d) => {
        console.log('[App] Difficulty found:', d);
      },

      onLegalMatch: (l) => {
        this._addBotMessage(`📋 相关法律：${l.lawName} — ${l.operationPoint}`, '', 'legal');
      },

      onBargainingInsight: (b) => {
        console.log('[App] Bargaining insight:', b);
      },

      onComplete: async (result) => {
        this.facts = result._deepResult
          ? result._deepResult.facts
          : result;
        this.deepResult = result._deepResult || null;

        // 运行议价权分析
        if (this.bargainingAnalyzer && this.facts) {
          this.bargainingResult = this.bargainingAnalyzer.analyze(
            this.facts,
            this.interview.state.problemType,
            this.deepResult?.difficulties || []
          );
        }

        this._addBotMessage('好的，我问完了。现在帮你整理信息…', '');
        setTimeout(() => this.navigate('review', this.facts), 1200);
      },

      onProgress: (progress) => {
        if (progressBar) {
          const pct = progress.percent || 0;
          progressBar.style.width = `${pct}%`;
          if (progress.mode === 'deep') {
            progressBar.style.background = 'linear-gradient(90deg, var(--primary), #7c3aed)';
          } else {
            progressBar.style.background = 'var(--primary)';
          }
        }
        const counter = stage.querySelector('.progress-text');
        if (counter) {
          if (progress.mode === 'deep') {
            counter.textContent = `第${progress.round || progress.answered}轮`;
          } else {
            counter.textContent = `${progress.answered}/${progress.total}`;
          }
        }
      }
    });

    // 开始或恢复访谈
    if (resumeState) {
      this.interview.state = resumeState;
      const q = this.interview.state.questionFlow[resumeState.currentQuestionIndex];
      if (q) this._addBotMessage(q.text, q.ttsText);
    } else {
      this.interview.start(problemType, { initialText });
    }

    // 如果有初始文本，先发送用户消息
    if (initialText) {
      this._addUserMessage(initialText);
    }

    // 绑定输入事件
    this._bindInterviewInput(stage);
  }

  _bindInterviewInput(stage) {
    const textInput = stage.querySelector('.chat-text-input');
    const btnSend = stage.querySelector('.btn-send');
    const btnRecord = stage.querySelector('.btn-chat-record');
    const btnSkip = stage.querySelector('.btn-skip');
    const btnBack = stage.querySelector('.btn-interview-back');
    const btnTTSToggle = stage.querySelector('.btn-tts-toggle');

    const sendText = async () => {
      const text = textInput.value.trim();
      if (!text || this.isThinking) return;
      this._addUserMessage(text);
      textInput.value = '';
      btnSend.disabled = true;

      try {
        if (this.interview) {
          const currentQ = this.interview.state.questionFlow?.[this.interview.state.currentQuestionIndex];
          await this.interview.processAnswer(text, currentQ?.id);
        }
      } catch (e) {
        console.warn('[App] processAnswer error:', e);
      }

      btnSend.disabled = false;
    };

    btnSend?.addEventListener('click', sendText);
    textInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendText();
      }
    });

    // 语音录制
    if (btnRecord) {
      btnRecord.addEventListener('pointerdown', () => {
        if (!this.speech.isSupported) {
          Utils.toast('浏览器不支持语音，请打字输入', 'error');
          return;
        }
        this.isRecording = true;
        btnRecord.classList.add('recording');
        this.speech.start(
          (fullText) => {
            textInput.value = fullText;
          },
          (finalText) => {
            btnRecord.classList.remove('recording');
            this.isRecording = false;
            if (finalText && finalText.trim()) {
              textInput.value = finalText;
            }
          },
          (error) => {
            btnRecord.classList.remove('recording');
            this.isRecording = false;
            Utils.toast(error, 'error');
          }
        );
      });

      btnRecord.addEventListener('pointerup', () => {
        if (this.isRecording) {
          const final = this.speech.stop();
          btnRecord.classList.remove('recording');
          this.isRecording = false;
          if (final && final.trim()) {
            textInput.value = final;
          }
        }
      });

      btnRecord.addEventListener('pointerleave', () => {
        if (this.isRecording) {
          const final = this.speech.stop();
          btnRecord.classList.remove('recording');
          this.isRecording = false;
          if (final && final.trim()) {
            textInput.value = final;
          }
        }
      });
    }

    btnSkip?.addEventListener('click', () => {
      if (this.interview) {
        const currentQ = this.interview.state.questionFlow[this.interview.state.currentQuestionIndex];
        this.interview.skip(currentQ?.id);
      }
    });

    btnBack?.addEventListener('click', () => {
      if (this.interview && this.interview.state.history.length > 0) {
        this.interview.goBack();
      }
    });

    btnTTSToggle?.addEventListener('click', () => {
      const enabled = this.tts.toggle();
      btnTTSToggle.classList.toggle('active', enabled);
      btnTTSToggle.title = enabled ? '语音播报已开启' : '语音播报已关闭';
      Utils.toast(enabled ? '语音播报已开启' : '语音播报已关闭', 'info');
    });
  }

  // === 聊天消息 ===

  _addBotMessage(text, ttsText, type = 'bot') {
    const chatArea = document.querySelector('#stage-interview .chat-area');
    if (!chatArea) return;

    const msg = document.createElement('div');
    if (type === 'ack') {
      msg.className = 'chat-message ack';
      msg.innerHTML = `<div class="chat-bubble">${Utils.escapeHtml(text)}</div>`;
    } else if (type === 'legal') {
      msg.className = 'chat-message bot legal-snippet';
      msg.innerHTML = `
        <div class="chat-avatar">📋</div>
        <div class="chat-bubble legal-bubble">${Utils.escapeHtml(text)}</div>
      `;
    } else if (type === 'deep_info') {
      msg.className = 'chat-message bot deep-info';
      msg.innerHTML = `
        <div class="chat-avatar">🔍</div>
        <div class="chat-bubble deep-bubble">${Utils.escapeHtml(text)}</div>
      `;
    } else {
      msg.className = 'chat-message bot';
      msg.innerHTML = `
        <div class="chat-avatar">🔉</div>
        <div class="chat-bubble">${Utils.escapeHtml(text)}</div>
      `;
    }
    chatArea.appendChild(msg);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  _addUserMessage(text) {
    const chatArea = document.querySelector('#stage-interview .chat-area');
    if (!chatArea) return;

    const msg = document.createElement('div');
    msg.className = 'chat-message user';
    msg.innerHTML = `
      <div class="chat-bubble">${Utils.escapeHtml(text)}</div>
      <div class="chat-avatar">👤</div>
    `;
    chatArea.appendChild(msg);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  // === 阶段：事实确认 ===

  _showReview(facts) {
    this.facts = facts;
    const stage = document.getElementById('stage-review');
    stage.classList.add('active');

    // 校验完整性
    const report = Validator.validate(facts);

    // 完整性评分
    const scoreEl = stage.querySelector('.completeness-score');
    if (scoreEl) {
      scoreEl.textContent = `${report.score}%`;
      scoreEl.style.color = report.grade === 'good' ? '#16a34a' : report.grade === 'fair' ? '#f59e0b' : '#dc2626';
    }

    const scoreBar = stage.querySelector('.score-bar-fill');
    if (scoreBar) {
      scoreBar.style.width = `${report.score}%`;
      scoreBar.style.background = report.grade === 'good' ? '#16a34a' : report.grade === 'fair' ? '#f59e0b' : '#dc2626';
    }

    // === v3 新增：深度对话结果面板 ===
    this._renderDeepResultPanel(stage);

    // 填充表单
    const fields = ['who', 'whom', 'what', 'when', 'where', 'howMuch', 'evidence', 'demand'];
    for (const field of fields) {
      const input = stage.querySelector(`#fact-${field}`);
      if (input) {
        input.value = facts[field] || '';
        const isMissing = report.missing.some(m => m.field === field);
        input.classList.toggle('missing', isMissing);
      }
    }

    // 缺失提示
    const missingList = stage.querySelector('.missing-fields');
    if (missingList) {
      if (report.missing.length > 0) {
        missingList.innerHTML = report.missing.map(m =>
          `<span class="missing-tag severity-${m.severity}" data-field="${m.field}">⚠ ${m.label}未填写 — ${m.prompt}</span>`
        ).join('');
        missingList.classList.remove('hidden');
      } else {
        missingList.classList.add('hidden');
      }
    }

    // 绑定按钮
    stage.querySelector('#btn-gen-doc')?.addEventListener('click', () => {
      this._collectReviewFacts(stage);
      const reReport = Validator.validate(this.facts);
      if (!reReport.readyForGeneration) {
        Utils.toast('请先补充必填信息（红色标注项）', 'error');
        return;
      }
      this._generateAllDocs();
      this.navigate('document');
    });

    // 证据收集指南切换
    const btnEvidenceHelp = stage.querySelector('#btnEvidenceHelp');
    const evidenceGuide = stage.querySelector('#evidenceGuide');
    btnEvidenceHelp?.addEventListener('click', () => {
      evidenceGuide.classList.toggle('hidden');
      btnEvidenceHelp.textContent = evidenceGuide.classList.contains('hidden')
        ? '📸 怎么收集证据？' : '📸 收起指南';
    });

    stage.querySelector('#btn-back-interview')?.addEventListener('click', () => {
      if (this.interview) {
        this.interview.goBack();
        this.navigate('interview');
      }
    });

    // 保存草稿（增强版：包含深度对话状态）
    const draftData = {
      facts: this.facts,
      interviewState: this.interview?.state || null,
      deepResult: this.deepResult,
      bargainingResult: this.bargainingResult
    };
    Storage.saveDraft(draftData.facts, draftData.interviewState);
    // 额外保存深度结果
    try { localStorage.setItem('bv_deep_draft', JSON.stringify(draftData)); } catch {}
  }

  _renderDeepResultPanel(stage) {
    // 移除旧面板
    const oldPanel = stage.querySelector('.deep-result-panel');
    if (oldPanel) oldPanel.remove();

    if (!this.deepResult && !this.bargainingResult) return;

    const panel = document.createElement('div');
    panel.className = 'deep-result-panel';
    let html = '';

    // 对话统计
    if (this.deepResult) {
      html += `<div class="deep-stat-row">
        <span>🗣 深度对话共 <strong>${this.deepResult.roundCount || '?'}</strong> 轮</span>
        <span>📋 匹配 <strong>${(this.deepResult.legalMatches || []).length}</strong> 条法律</span>
        <span>💡 发现 <strong>${(this.deepResult.difficulties || []).length}</strong> 个困境</span>
      </div>`;

      // 困境展示
      const diffs = this.deepResult.difficulties || [];
      if (diffs.length > 0) {
        html += '<div class="deep-section"><h4>📌 识别的困境</h4>';
        for (const d of diffs) {
          html += `<div class="deep-tag difficulty-tag severity-${d.severity || '中'}">
            <span class="tag-dot"></span>${d.category || ''}：${d.description}
          </div>`;
        }
        html += '</div>';
      }
    }

    // 议价权分析
    if (this.bargainingResult) {
      const display = this.bargainingAnalyzer.formatForDisplay(this.bargainingResult);
      html += `<div class="deep-section">
        <h4>⚖️ 议价权分析 — ${display.scoreCard.grade} ${display.scoreCard.score}分</h4>
        <p class="deep-one-liner">${display.scoreCard.oneLiner}</p>
      </div>`;
    }

    if (html) {
      panel.innerHTML = html;
      const cardEl = stage.querySelector('.card');
      if (cardEl) {
        cardEl.insertBefore(panel, cardEl.querySelector('.completeness-widget'));
      }
    }
  }

  _collectReviewFacts(stage) {
    const fields = ['who', 'whom', 'what', 'when', 'where', 'howMuch', 'evidence', 'demand'];
    for (const field of fields) {
      const input = stage.querySelector(`#fact-${field}`);
      if (input && this.facts) {
        this.facts[field] = input.value;
      }
    }
  }

  // === 阶段：文档展示 ===

  _generateAllDocs() {
    if (!this.facts) return;

    // 生成标准文书
    this.documents = this.generator.generateAll(this.facts);

    // v3: 附加议价权分析报告
    if (this.bargainingResult) {
      const display = this.bargainingAnalyzer.formatForDisplay(this.bargainingResult);
      this.documents.bargainingReport = this._renderBargainingReportHTML(display);
    }

    // 保存到案例历史
    this.caseManager.save({
      facts: this.facts,
      documents: this.documents,
      status: 'completed',
      deepResult: this.deepResult,
      bargainingResult: this.bargainingResult
    }).catch(e => console.warn('[App] Failed to save case:', e));

    Storage.clearDraft();
    try { localStorage.removeItem('bv_deep_draft'); } catch {}
  }

  _renderBargainingReportHTML(display) {
    function esc(s) { return (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    return `
      <div class="bargaining-report">
        <h3>⚖️ 议价权分析报告</h3>
        <div class="bargain-score">
          <span class="bargain-grade" style="font-size:48px">${display.scoreCard.score}</span>
          <span class="bargain-label">${display.scoreCard.grade}</span>
        </div>
        <p>${esc(display.scoreCard.oneLiner)}</p>

        <h4>📊 证据强度</h4>
        <p>${esc(display.evidencePanel.grade)} (${display.evidencePanel.score})</p>
        ${display.evidencePanel.improvements.map(i => `<p>→ ${esc(i)}</p>`).join('')}

        <h4>🔑 法律杠杆点</h4>
        ${display.leveragePanel.map(l =>
          `<div class="leverage-item">
            <strong>${esc(l.point)}</strong>
            <p>${esc(l.description)}</p>
            ${l.script ? `<p class="script">💬 "${esc(l.script)}"</p>` : ''}
          </div>`
        ).join('')}

        <h4>📋 推荐策略</h4>
        <p>${esc(display.negotiationAdvice)}</p>
        ${display.strategy.steps.map(s => `<p>${esc(s)}</p>`).join('')}

        <h4>⚠️ 风险提醒</h4>
        ${display.risks.map(r => `<p>${esc(r)}</p>`).join('')}

        ${display.timeWarning ? `<h4>⏰ 时间警告</h4><p>${esc(display.timeWarning)}</p>` : ''}

        <p class="urgent-note"><strong>⏱ 行动窗口：</strong>${esc(display.strategy.urgency)}</p>
      </div>
    `;
  }

  _showDocument() {
    const stage = document.getElementById('stage-document');
    stage.classList.add('active');

    const docArea = stage.querySelector('.doc-area');
    const tabs = stage.querySelectorAll('.doc-tab');

    const showDoc = (type) => {
      this.currentDocType = type;
      if (docArea) {
        docArea.innerHTML = this.documents[type] || '<p>暂无内容</p>';
      }
      tabs.forEach(t => t.classList.toggle('active', t.dataset.doc === type));
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => showDoc(tab.dataset.doc));
    });

    // 如果有议价权报告，显示对应标签
    const bargainTab = stage.querySelector('.doc-tab-bargain');
    if (bargainTab) {
      bargainTab.classList.toggle('hidden', !this.documents.bargainingReport);
    }

    showDoc('arbitration');

    // 操作按钮
    stage.querySelector('#btn-copy')?.addEventListener('click', async () => {
      const text = this.generator.generatePlainText(this.facts, this.currentDocType);
      const ok = await Utils.copyToClipboard(text);
      Utils.toast(ok ? '已复制到剪贴板' : '复制失败，请手动选择', ok ? 'success' : 'error');
    });

    stage.querySelector('#btn-download')?.addEventListener('click', () => {
      const text = this.generator.generateAllPlainText(this.facts);
      const filename = `${this.facts?.who || '仲裁'}_${this.currentDocType}_${Utils.todayStr()}.txt`;
      Utils.downloadText(text, filename);
    });

    stage.querySelector('#btn-print')?.addEventListener('click', () => {
      window.print();
    });

    stage.querySelector('#btn-new')?.addEventListener('click', () => {
      this._resetAll();
      this.navigate('type-select');
    });

    stage.querySelector('#btn-cases')?.addEventListener('click', () => {
      this.navigate('cases');
    });
  }

  // === 阶段：案例历史 ===

  async _showCaseList() {
    const stage = document.getElementById('stage-cases');
    stage.classList.add('active');

    const listEl = stage.querySelector('.case-list');
    if (!listEl) return;

    listEl.innerHTML = '<div class="loading">加载中…</div>';

    try {
      const cases = await this.caseManager.list({ limit: 50 });
      if (cases.length === 0) {
        listEl.innerHTML = `
          <div class="empty-state">
            <p>📭 还没有案例</p>
            <p class="empty-hint">创建你的第一份法律文书吧</p>
          </div>`;
      } else {
        listEl.innerHTML = cases.map(c => `
          <div class="case-card" data-id="${c.id}">
            <div class="case-card-header">
              <span class="case-title">${Utils.escapeHtml(c.title)}</span>
              <span class="case-status status-${c.status}">${this._statusLabel(c.status)}</span>
            </div>
            <div class="case-card-meta">
              <span>${Utils.formatDate(c.updatedAt)}</span>
              <span>${c.documentCount} 份文档</span>
            </div>
            <div class="case-card-actions">
              <button class="btn-sm btn-view" data-id="${c.id}">查看文书</button>
              <button class="btn-sm btn-delete" data-id="${c.id}">删除</button>
            </div>
          </div>
        `).join('');

        // 绑定事件
        listEl.querySelectorAll('.btn-view').forEach(btn => {
          btn.addEventListener('click', async () => {
            const c = await this.caseManager.get(btn.dataset.id);
            if (c) {
              this.facts = c.facts;
              this.documents = c.documents;
              this.navigate('document');
            }
          });
        });

        listEl.querySelectorAll('.btn-delete').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (confirm('确定删除这个案例吗？')) {
              await this.caseManager.delete(btn.dataset.id);
              this._showCaseList();
            }
          });
        });
      }
    } catch (e) {
      listEl.innerHTML = '<div class="error">加载失败，请重试</div>';
    }

    stage.querySelector('#btn-back-type')?.addEventListener('click', () => {
      this.navigate('type-select');
    });
  }

  _statusLabel(status) {
    const labels = { draft: '草稿', completed: '已完成', submitted: '已提交', resolved: '已解决' };
    return labels[status] || status;
  }

  // === 全局事件 ===

  _bindGlobalEvents() {
    // 全局导航
    document.querySelectorAll('[data-navigate]').forEach(el => {
      el.addEventListener('click', () => {
        this.navigate(el.dataset.navigate);
      });
    });
  }

  // === AI 设置 ===

  _initSettings() {
    const modal = document.getElementById('settingsModal');
    const btnSettings = document.getElementById('btnSettings');
    const btnClose = document.getElementById('btnModalClose');
    const providerSel = document.getElementById('settingProvider');
    const modelInput = document.getElementById('settingModel');
    const baseUrlInput = document.getElementById('settingBaseUrl');
    const apiKeyInput = document.getElementById('settingApiKey');
    const apiKeyLink = document.getElementById('apiKeyLink');
    const btnToggle = document.getElementById('btnToggleKey');
    const btnTest = document.getElementById('btnTestLLM');
    const btnSave = document.getElementById('btnSaveLLM');

    btnSettings?.addEventListener('click', () => this._openSettings());
    btnClose?.addEventListener('click', () => modal.classList.add('hidden'));
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });

    providerSel?.addEventListener('change', () => {
      const p = LLMClient.PROVIDERS[providerSel.value];
      if (p) {
        baseUrlInput.value = p.baseUrl;
        modelInput.value = p.model;
        apiKeyLink.href = p.apiKeyUrl;
        document.getElementById('groupBaseUrl').classList.add('hidden');
      } else {
        baseUrlInput.value = '';
        modelInput.value = '';
        document.getElementById('groupBaseUrl').classList.remove('hidden');
      }
    });

    btnToggle?.addEventListener('click', () => {
      const isPass = apiKeyInput.type === 'password';
      apiKeyInput.type = isPass ? 'text' : 'password';
      btnToggle.textContent = isPass ? '🙈' : '👁';
    });

    btnTest?.addEventListener('click', () => this._onTestLLM());
    btnSave?.addEventListener('click', () => this._onSaveLLM());

    // 点击 mode badge 也打开设置
    document.getElementById('modeBadge')?.addEventListener('click', () => this._openSettings());
  }

  _openSettings() {
    const modal = document.getElementById('settingsModal');
    const providerSel = document.getElementById('settingProvider');
    const apiKeyInput = document.getElementById('settingApiKey');
    const baseUrlInput = document.getElementById('settingBaseUrl');
    const modelInput = document.getElementById('settingModel');
    const statusEl = document.getElementById('settingStatus');

    providerSel.value = this.llm.provider;
    apiKeyInput.value = this.llm.apiKey;
    baseUrlInput.value = this.llm.baseUrl;
    modelInput.value = this.llm.model;

    const p = LLMClient.PROVIDERS[this.llm.provider];
    document.getElementById('groupBaseUrl').classList.toggle('hidden', !!p);
    if (p) {
      document.getElementById('apiKeyLink').href = p.apiKeyUrl;
    }

    statusEl.classList.remove('visible', 'success', 'error', 'loading');
    modal.classList.remove('hidden');
  }

  _updateModeBadge() {
    const badge = document.getElementById('modeBadge');
    if (!badge) return;
    if (this.llm.isConfigured) {
      badge.textContent = '🤖 AI';
      badge.className = 'mode-badge mode-online';
      badge.title = `AI 增强模式 — ${this.llm.providerName}`;
    } else {
      badge.textContent = '📋 基础';
      badge.className = 'mode-badge mode-offline';
      badge.title = '基础模式：本地正则提取 — 点击配置 AI';
    }
  }

  async _onTestLLM() {
    const statusEl = document.getElementById('settingStatus');
    const apiKeyInput = document.getElementById('settingApiKey');
    const providerSel = document.getElementById('settingProvider');
    const baseUrlInput = document.getElementById('settingBaseUrl');
    const modelInput = document.getElementById('settingModel');

    // 临时应用当前表单值
    this.llm.saveConfig({
      provider: providerSel.value,
      apiKey: apiKeyInput.value.trim(),
      baseUrl: baseUrlInput.value.trim(),
      model: modelInput.value.trim()
    });

    statusEl.className = 'setting-status visible loading';
    statusEl.textContent = '⏳ 正在测试连接…';

    const result = await this.llm.testConnection();
    if (result.ok) {
      statusEl.className = 'setting-status visible success';
      statusEl.textContent = '✅ 连接成功！AI 增强已就绪';
    } else {
      statusEl.className = 'setting-status visible error';
      statusEl.textContent = `❌ 连接失败：${result.error}`;
    }
  }

  _onSaveLLM() {
    const providerSel = document.getElementById('settingProvider');
    const apiKeyInput = document.getElementById('settingApiKey');
    const baseUrlInput = document.getElementById('settingBaseUrl');
    const modelInput = document.getElementById('settingModel');

    this.llm.saveConfig({
      provider: providerSel.value,
      apiKey: apiKeyInput.value.trim(),
      baseUrl: baseUrlInput.value.trim(),
      model: modelInput.value.trim()
    });

    this._updateModeBadge();
    document.getElementById('settingsModal').classList.add('hidden');

    if (this.llm.isConfigured) {
      Utils.toast(`AI 增强已开启 — ${this.llm.providerName}`, 'success');
    } else {
      Utils.toast('已切回基础模式', 'info');
    }

    // 更新 extractor 的 llm 引用（可能已有新配置）
    this.extractor.llm = this.llm;
  }

  // === 紧急求助 ===

  _initEmergency() {
    const btnEmer = document.getElementById('btnEmergency');
    const modal = document.getElementById('emergencyModal');
    const btnClose = document.getElementById('btnEmerClose');
    const detail = document.getElementById('emergencyDetail');

    btnEmer?.addEventListener('click', () => {
      modal.classList.remove('hidden');
      detail.classList.add('hidden');
    });
    btnClose?.addEventListener('click', () => modal.classList.add('hidden'));
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });

    const showDetail = (html) => {
      detail.innerHTML = html;
      detail.classList.remove('hidden');
      // 绑定详情内的复制按钮
      detail.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const text = btn.dataset.text;
          const ok = await Utils.copyToClipboard(text);
          btn.textContent = ok ? '✅ 已复制' : '复制失败';
          setTimeout(() => { btn.textContent = '📋 复制这段文字'; }, 2000);
        });
      });
    };

    document.getElementById('btnEmerSafety')?.addEventListener('click', () => {
      showDetail(`
        <h4>⚠️ 如果你的人身安全受到威胁</h4>
        <ol>
          <li><strong>立刻打 110 报警</strong>——不要说"劳动纠纷"，说"有人威胁我的人身安全"</li>
          <li><strong>不要单独去谈判</strong>——至少带一个同伴，在公共场所见面</li>
          <li><strong>打开手机录音</strong>——每次和老板/负责人对话都要录音（这不违法）</li>
          <li><strong>截图所有威胁信息</strong>——微信、短信全部截图，发给信得过的朋友备份</li>
          <li><strong>告诉家人/朋友你的位置</strong>——去哪、见谁、大概多久回来</li>
          <li><strong>联系当地劳动监察大队</strong>——他们有权责令企业停止违法行为</li>
        </ol>
        <p style="margin-top:8px;font-size:12px;color:var(--text-muted);">
          💡 记住：你不是一个人在战斗。法律站在你这边。12348 热线24小时都有人接。
        </p>
      `);
    });

    document.getElementById('btnEmerEvidence')?.addEventListener('click', () => {
      showDetail(`
        <h4>📸 紧急证据保全——现在立刻做</h4>
        <ol>
          <li><strong>微信聊天记录</strong>：逐屏截图（包含日期），不要只截最后几句。然后转发给一个信得过的朋友。</li>
          <li><strong>工资转账记录</strong>：打开微信→我→服务→钱包→账单→搜索对方名字→截图所有相关交易。</li>
          <li><strong>工作群消息</strong>：截图所有包含"加班""排班""工资"关键词的消息。</li>
          <li><strong>工牌/工服/工作环境</strong>：拍照，包含日期水印（可用"今日水印相机"APP）。</li>
          <li><strong>录音</strong>：和老板/HR对话前打开手机录音机。告诉对方"我在录音"——不违法。</li>
          <li><strong>工友作证</strong>：找愿意帮你作证的工友，记下姓名+电话。最少要有一个。</li>
          <li><strong>打卡记录</strong>：截图钉钉/企业微信的考勤页面。如果被踢出系统，回忆并手写下来。</li>
        </ol>
        <p style="margin-top:8px;font-size:12px;color:var(--text-muted);">
          💡 上面7条，你现在能做几条就先做几条。证据不怕多，只怕没有。
        </p>
      `);
    });

    document.getElementById('btnEmerSMS')?.addEventListener('click', () => {
      const sms1 = '【法律提示】老板/负责人您好：根据《劳动合同法》第85条，用人单位拖欠劳动报酬的，劳动行政部门责令限期支付，逾期不支付的，需加付赔偿金。希望我们能协商解决，避免走到劳动仲裁这一步。我的诉求是：支付被拖欠的工资，共计____元。';
      const sms2 = '【法律提示】老板/负责人您好：根据《劳动合同法》第10条，建立劳动关系应当在一个月内订立书面劳动合同。超过一个月不满一年未订立的，应当向劳动者每月支付二倍工资。请您尽快与我补签合同或支付相应赔偿。';
      const sms3 = '【法律提示】老板/负责人您好：根据《劳动合同法》第47条，用人单位违法解除劳动合同的，应当按劳动者在本单位工作年限，每满一年支付一个月工资的经济补偿金。请您依法支付我的赔偿金。';

      showDetail(`
        <h4>📱 给老板/负责人发法律提示</h4>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">选择适合你的模板，复制后通过微信或短信发给对方。用法律条款说话，对方会更认真对待。</p>

        <p style="font-weight:600;font-size:13px;margin-top:12px;">模板一：拖欠工资</p>
        <div class="sms-template">${sms1}</div>
        <button class="copy-btn" data-text="${sms1.replace(/"/g, '&quot;')}">📋 复制这段文字</button>

        <p style="font-weight:600;font-size:13px;margin-top:14px;">模板二：没签合同</p>
        <div class="sms-template">${sms2}</div>
        <button class="copy-btn" data-text="${sms2.replace(/"/g, '&quot;')}">📋 复制这段文字</button>

        <p style="font-weight:600;font-size:13px;margin-top:14px;">模板三：违法辞退</p>
        <div class="sms-template">${sms3}</div>
        <button class="copy-btn" data-text="${sms3.replace(/"/g, '&quot;')}">📋 复制这段文字</button>
      `);
    });

    document.getElementById('btnEmerHotline')?.addEventListener('click', () => {
      showDetail(`
        <h4>🆘 求助电话一览</h4>
        <div class="hotline-row">
          <span class="hotline-name">👮 报警</span>
          <a href="tel:110" class="hotline-num">110</a>
        </div>
        <div class="hotline-row">
          <span class="hotline-name">⚖️ 法律援助</span>
          <a href="tel:12348" class="hotline-num">12348</a>
        </div>
        <div class="hotline-row">
          <span class="hotline-name">🏛 劳动监察举报</span>
          <a href="tel:12333" class="hotline-num">12333</a>
        </div>
        <div class="hotline-row">
          <span class="hotline-name">👩 妇女维权</span>
          <a href="tel:12338" class="hotline-num">12338</a>
        </div>
        <div class="hotline-row">
          <span class="hotline-name">🏥 急救</span>
          <a href="tel:120" class="hotline-num">120</a>
        </div>
        <div class="hotline-row">
          <span class="hotline-name">🧑‍🤝‍🧑 工会求助</span>
          <a href="tel:12351" class="hotline-num">12351</a>
        </div>
        <p style="margin-top:10px;font-size:12px;color:var(--text-muted);">点击号码直接拨打。如果不方便打电话，12348和12333也有微信公众号可以在线咨询。</p>
      `);
    });
  }

  // === 重置 ===

  _resetAll() {
    this.facts = null;
    this.documents = {};
    this.currentDocType = 'arbitration';
    this.interview = null;
    this.deepResult = null;
    this.bargainingResult = null;
    this.isThinking = false;
    Storage.clearDraft();
    try { localStorage.removeItem('bv_deep_draft'); } catch {}
  }
}

// 启动
document.addEventListener('DOMContentLoaded', () => {
  window.bridge = new VoiceBridge();
});
