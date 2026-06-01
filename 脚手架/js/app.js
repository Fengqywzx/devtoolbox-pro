// 脚手架 · 主应用

class ScaffoldApp {
  constructor() {
    this.workDays = this._load('sc_workdays');
    this.quizScore = parseInt(localStorage.getItem('sc_quiz') || '0');
    this.currentQ = 0;
    this.correctCount = 0;

    this.quizQuestions = [
      { q: '在几米以上的高处作业必须系安全带？', opts: ['1米', '2米', '3米', '5米'], correct: 1, explain: '2米以上高处作业必须系挂安全带（GB/T 3608）。这是保命的基本要求。' },
      { q: '安全帽的使用年限一般是多久？', opts: ['1年', '2-3年', '5年', '永久使用'], correct: 1, explain: '安全帽一般使用2-3年，到期或受过重击必须更换。' },
      { q: '遇到几级以上的大风应该停止高处作业？', opts: ['4级', '5级', '6级', '8级'], correct: 2, explain: '6级以上大风（风速≥10.8m/s）应停止露天高处作业和起重吊装。' },
      { q: '安全带应该怎么挂？', opts: ['低挂高用', '高挂低用', '随便挂', '挂脚下'], correct: 1, explain: '安全带必须"高挂低用"——挂点高于腰部，坠落距离短，冲击力小。' },
      { q: '以下哪个不是工伤认定的条件？', opts: ['工作时间受伤', '工作场所受伤', '因工作原因受伤', '上下班路上购物时受伤'], correct: 3, explain: '上下班途中只有"合理路线"上发生非本人主要责任的交通事故才算工伤。去购物不算。' },
    ];

    this.init();
  }

  _load(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
  _save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

  init() {
    this._bindEvents();
    this._assessSafety();
    this._renderWageLog();
    this._updateTrainingBadge();
  }

  _bindEvents() {
    document.getElementById('btnAddWorkDay')?.addEventListener('click', () => {
      document.getElementById('workModal').classList.remove('hidden');
    });
    document.getElementById('btnWorkCancel')?.addEventListener('click', () => {
      document.getElementById('workModal').classList.add('hidden');
    });
    document.getElementById('btnWorkSave')?.addEventListener('click', () => this._saveWorkDay());

    document.getElementById('btnStartQuiz')?.addEventListener('click', () => this._startQuiz());

    document.querySelectorAll('.modal-overlay').forEach(o => {
      o.addEventListener('click', (e) => { if (e.target === o) o.classList.add('hidden'); });
    });

    // 手动刷新安全评分（模拟定位）
    document.getElementById('scoreCircle')?.addEventListener('click', () => this._assessSafety());
  }

  // === 安全评分 ===
  _assessSafety() {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth();

    // 模拟天气数据（真实场景用天气API）
    const temp = 28; // 模拟温度
    const wind = 12; // 模拟风速 km/h
    const rain = false;

    let score = 100;
    const factors = [];

    // 高温
    if (temp >= 37) { score -= 25; factors.push({ name: '高温', status: 'risk', detail: `${temp}°C 危险` }); }
    else if (temp >= 35) { score -= 15; factors.push({ name: '高温', status: 'risk', detail: `${temp}°C 注意防暑` }); }
    else { factors.push({ name: '温度', status: 'safe', detail: `${temp}°C 正常` }); }

    // 大风
    if (wind >= 40) { score -= 30; factors.push({ name: '大风', status: 'risk', detail: `${wind}km/h 禁止高空作业` }); }
    else if (wind >= 25) { score -= 15; factors.push({ name: '大风', status: 'risk', detail: `${wind}km/h 谨慎作业` }); }
    else { factors.push({ name: '风速', status: 'safe', detail: `${wind}km/h 正常` }); }

    // 降雨
    if (rain) { score -= 20; factors.push({ name: '降雨', status: 'risk', detail: '地面湿滑 防滑防触电' }); }
    else { factors.push({ name: '降水', status: 'safe', detail: '无降水' }); }

    // 凌晨/夜间
    if (hour < 6 || hour > 20) { score -= 10; factors.push({ name: '时段', status: 'risk', detail: '夜间施工风险增加' }); }
    else { factors.push({ name: '时段', status: 'safe', detail: '白天施工' }); }

    score = Math.max(0, Math.min(100, score));

    // 渲染
    const circle = document.getElementById('scoreCircle');
    circle.textContent = score;
    circle.className = 'score-circle ' + (score >= 70 ? 'good' : score >= 40 ? 'caution' : 'danger');

    document.getElementById('scoreDetail').textContent =
      score >= 70 ? '✅ 今日条件适合施工，注意常规安全防护' :
      score >= 40 ? '⚠️ 有风险因素，加强防护措施' :
      '🚨 高风险！建议减少或停止高危作业';

    document.getElementById('weatherFactors').innerHTML = factors.map(f => `
      <div class="factor-item">
        <span>${f.name}</span>
        <span class="factor-status ${f.status}">${f.detail}</span>
      </div>
    `).join('');
  }

  // === 工资账本 ===
  _saveWorkDay() {
    const hours = parseFloat(document.getElementById('scaffoldHours').value) || 0;
    const wage = parseFloat(document.getElementById('scaffoldWage').value) || 0;
    const task = document.getElementById('scaffoldTask').value.trim();

    if (!hours || !wage) { this._toast('请填写工时和工资', 'error'); return; }

    this.workDays.unshift({
      id: Date.now().toString(36),
      date: new Date().toISOString(),
      hours, wage, task
    });
    this._save('sc_workdays', this.workDays);
    document.getElementById('workModal').classList.add('hidden');
    this._renderWageLog();
    this._toast('✅ 已记录', 'success');
  }

  _renderWageLog() {
    const now = new Date();
    const monthDays = this.workDays.filter(d => {
      const date = new Date(d.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const totalH = monthDays.reduce((s, d) => s + d.hours, 0);
    const totalW = monthDays.reduce((s, d) => s + d.wage, 0);

    document.getElementById('scaffoldMonthHours').textContent = totalH + 'h';
    document.getElementById('scaffoldMonthWage').textContent = '¥' + totalW;
    document.getElementById('wageStatus').textContent = totalW > 0 ? '已记录' : '未结算';
    document.getElementById('wageStatus').style.background = totalW > 0 ? 'var(--success-bg)' : 'var(--warning-bg)';
    document.getElementById('wageStatus').style.color = totalW > 0 ? 'var(--success)' : '#92400e';

    const container = document.getElementById('wageLog');
    if (monthDays.length === 0) {
      container.innerHTML = '<div style="font-size:15px;color:var(--text-secondary);text-align:center;padding:8px;">本月还没有记录。每次出工都记下来——这是追讨工资的重要证据。</div>';
      return;
    }
    container.innerHTML = monthDays.slice(0, 15).map(d => {
      const date = new Date(d.date);
      return `<div class="wage-entry">
        <span>${date.getMonth()+1}/${date.getDate()} ${d.task || '出工'}</span>
        <span>${d.hours}h</span>
        <strong>¥${d.wage}</strong>
      </div>`;
    }).join('');
  }

  // === 安全答题 ===
  _startQuiz() {
    this.currentQ = 0;
    this.correctCount = 0;
    document.getElementById('quizModal').classList.remove('hidden');
    this._showQuizQuestion();
  }

  _showQuizQuestion() {
    const q = this.quizQuestions[this.currentQ];
    document.getElementById('quizProgress').textContent = `第${this.currentQ+1}题/${this.quizQuestions.length}题`;
    document.getElementById('quizQuestion').textContent = q.q;

    const container = document.getElementById('quizOptions');
    container.innerHTML = q.opts.map((opt, i) => `
      <button class="quiz-option" data-idx="${i}">${opt}</button>
    `).join('');

    container.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const correct = idx === q.correct;
        if (correct) this.correctCount++;

        // 标记对错
        container.querySelectorAll('.quiz-option').forEach((b, i) => {
          b.style.pointerEvents = 'none';
          if (i === q.correct) b.classList.add('correct');
          if (i === idx && !correct) b.classList.add('wrong');
        });

        // 显示解释
        setTimeout(() => {
          this.currentQ++;
          if (this.currentQ < this.quizQuestions.length) {
            this._showQuizQuestion();
          } else {
            this._finishQuiz();
          }
        }, 1500);
      });
    });
  }

  _finishQuiz() {
    document.getElementById('quizModal').classList.add('hidden');
    const pct = Math.round((this.correctCount / this.quizQuestions.length) * 100);
    localStorage.setItem('sc_quiz', this.correctCount.toString());

    const result = document.getElementById('quizResult');
    result.hidden = false;
    result.className = 'quiz-result ' + (pct >= 60 ? 'pass' : 'fail');
    result.innerHTML = `
      <div style="font-size:40px;">${pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📚'}</div>
      <div style="font-size:20px;font-weight:700;">答对 ${this.correctCount}/${this.quizQuestions.length} 题</div>
      <div style="font-size:16px;color:var(--text-secondary);">${pct >= 80 ? '安全达人！' : pct >= 60 ? '还需加强学习' : '安全知识很重要，建议重新学习'}</div>
    `;

    this._updateTrainingBadge();
  }

  _updateTrainingBadge() {
    const badge = document.getElementById('trainingBadge');
    if (this.quizScore >= 4) { badge.textContent = '🏆 安全达人'; badge.style.background = 'var(--success-bg)'; badge.style.color = 'var(--success)'; }
    else if (this.quizScore >= 2) { badge.textContent = '📚 学习中'; }
    else { badge.textContent = '新手'; }
  }

  _toast(msg, type = 'success') {
    const ex = document.querySelector('.toast');
    if (ex) ex.remove();
    const t = document.createElement('div');
    t.className = `toast ${type}`; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }
}

document.addEventListener('DOMContentLoaded', () => new ScaffoldApp());
