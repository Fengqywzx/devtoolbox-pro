/**
 * HumanizeCore v5 — 人性化核心引擎
 * 连接语言/视觉/音频系统，管理用户档案、签到/成就、情感循环
 * 依赖：LangSystem, VisualSystem, AudioSystem（松耦合，可独立初始化）
 */
class HumanizeCore {
  constructor(projectId, options = {}) {
    this.projectId = projectId;
    this.lang = options.lang || null;
    this.visual = options.visual || null;
    this.audio = options.audio || null;
    this._storageKey = `hc_${projectId}`;
    this._achievements = {};
    this._tips = [];
    this._tipIndex = 0;
    this._stats = this._loadStats();
  }

  /**
   * 连接三个子系统
   */
  connectSystems(lang, visual, audio) {
    if (lang) this.lang = lang;
    if (visual) this.visual = visual;
    if (audio) this.audio = audio;
  }

  /**
   * 初始化
   */
  async init() {
    // 应用用户偏好
    const prefs = this.getPreferences();
    if (prefs.highContrast && this.visual) this.visual.setHighContrast(true);
    if (prefs.largeText && this.visual) this.visual.setLargeText(true);
    if (prefs.reducedMotion && this.visual) this.visual.setReducedMotion(true);

    // 记录签到
    const streak = this.recordStreak();
    if (streak.reward && this.audio) {
      setTimeout(() => {
        this.audio.playSound('chime');
        if (this.visual) this.visual.showToast(streak.reward, 'success', 4000);
      }, 1500);
    }

    // 每日问候
    this._showDailyGreeting();

    console.log(`[HumanizeCore] initialized for ${this.projectId}, streak: ${this._stats.streak.current}`);
  }

  _showDailyGreeting() {
    if (this.lang && this.visual) {
      const greeting = this.lang.timeAwareGreeting();
      this.visual.showToast(greeting, 'info', 3000);
    }
  }

  // === 用户档案 ===

  getUserProfile() {
    return this._stats.profile || {};
  }

  updateUserProfile(data) {
    this._stats.profile = { ...this._stats.profile, ...data };
    this._saveStats();
  }

  getPreferences() {
    return this._stats.preferences || {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      dialect: 'mandarin',
      theme: 'auto',
      soundEnabled: true,
      voiceEnabled: false
    };
  }

  setPreference(key, value) {
    if (!this._stats.preferences) this._stats.preferences = {};
    this._stats.preferences[key] = value;
    this._saveStats();

    // 立即应用视觉偏好
    if (this.visual) {
      if (key === 'highContrast') this.visual.setHighContrast(value);
      if (key === 'largeText') this.visual.setLargeText(value);
      if (key === 'reducedMotion') this.visual.setReducedMotion(value);
    }
    if (this.audio) {
      if (key === 'soundEnabled') this.audio.setEnabled(value);
      if (key === 'voiceEnabled') this.audio.toggleVoice();
    }
  }

  // === 情感循环 ===

  /**
   * 触发完整情感响应（文字+颜色+音效）
   */
  triggerEmotionalResponse(emotion, context = {}) {
    // 1. 语言层：生成共情文字
    let text = '';
    if (this.lang) {
      text = this.lang.empatheticResponse({ emotion, scenario: context.scenario });
      if (context.showToast !== false && this.visual) {
        this.visual.showToast(text, 'info', 4000);
      }
    }

    // 2. 视觉层：切换情绪色彩
    if (this.visual) {
      this.visual.setMoodColor(emotion, { duration: 1000 });
      if (context.particles) {
        const particleType = {
          angry: 'sparkle', anxious: 'rain', tired: 'bubble', sad: 'rain',
          proud: 'confetti', grateful: 'sparkle', hopeful: 'leaf', joyful: 'confetti',
          fearful: 'snow', lonely: 'snow', determined: 'sparkle', calm: 'bubble'
        };
        this.visual.startParticles({
          type: particleType[emotion] || 'sparkle',
          mood: emotion,
          count: 30
        });
        setTimeout(() => this.visual.stopParticles(), 4000);
      }
    }

    // 3. 音频层：播放情绪音效
    if (this.audio) {
      const soundMap = {
        angry: 'warning', anxious: 'pulse', tired: 'heartbeat', sad: 'bell',
        proud: 'levelup', grateful: 'chime', hopeful: 'chime', joyful: 'success',
        fearful: 'alarm', lonely: 'bell', determined: 'send', calm: 'click'
      };
      this.audio.playSound(soundMap[emotion] || 'click');
    }

    return text;
  }

  /**
   * 从用户行为推断情感
   */
  inferEmotion(userAction, contextData = {}) {
    if (this.lang && contextData.text) {
      return this.lang.detectEmotion(contextData.text);
    }

    const actionMap = {
      'record_wage': contextData.wage > 0 ? 'hopeful' : 'neutral',
      'log_injury': 'sad',
      'start_work': 'determined',
      'finish_task': 'proud',
      'sos_triggered': 'fearful',
      'conflict_recorded': 'angry',
      'mood_low': 'sad',
      'mood_high': 'joyful',
      'long_work': 'tired',
      'overtime': 'tired',
      'rest_started': 'calm',
      'achievement_unlocked': 'proud',
      'streak_milestone': 'proud',
      'safety_alert': 'fearful',
      'weather_bad': 'anxious'
    };

    const emotion = actionMap[userAction] || 'neutral';
    return { primary: emotion, intensity: 0.5, signals: [userAction] };
  }

  // === 签到与连续使用 ===

  recordStreak() {
    const today = new Date().toDateString();
    const lastDate = this._stats.lastVisitDate;

    if (lastDate === today) {
      return { current: this._stats.streak.current, longest: this._stats.streak.longest, reward: null };
    }

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastDate === yesterday) {
      this._stats.streak.current++;
    } else {
      this._stats.streak.current = 1;
    }

    if (this._stats.streak.current > this._stats.streak.longest) {
      this._stats.streak.longest = this._stats.streak.current;
    }

    this._stats.lastVisitDate = today;
    this._stats.visits = (this._stats.visits || 0) + 1;

    // 检查里程碑
    let reward = null;
    const milestones = { 3: '连续3天！你越来越有毅力了 🌱', 7: '连续7天签到！坚持就是力量 💪', 14: '两周了！你已经养成了好习惯 🌟', 30: '整整一个月！你是真正的坚持者 🏆', 100: '百天里程碑！这份毅力无人能及 👑' };
    if (milestones[this._stats.streak.current]) {
      reward = milestones[this._stats.streak.current];
    }

    this._saveStats();
    return { current: this._stats.streak.current, longest: this._stats.streak.longest, reward };
  }

  getStreak() {
    return this._stats.streak.current;
  }

  getEncouragement() {
    const s = this._stats.streak.current;
    if (s >= 30) return '你已经坚持了一个月，这份毅力本身就是最了不起的事。';
    if (s >= 14) return '两周了！你每天都在往前走，虽然慢，但从不后退。';
    if (s >= 7) return '连续一周！每一个认真对待自己的日子，都在积累。';
    if (s >= 3) return '三天了！好的开始是成功的一半。';
    return '每一天都是新的开始。今天也要对自己好一点。';
  }

  // === 成就系统 ===

  defineAchievement(id, config) {
    this._achievements[id] = {
      id,
      title: config.title,
      description: config.description,
      icon: config.icon || '⭐',
      condition: config.condition,
      reward: config.reward || null
    };
  }

  checkAchievements(contextStats = {}) {
    if (!this._stats.achievements) this._stats.achievements = {};
    const unlocked = [];

    for (const [id, ach] of Object.entries(this._achievements)) {
      if (this._stats.achievements[id]) continue;
      try {
        if (ach.condition(this._stats, contextStats)) {
          this._stats.achievements[id] = {
            unlockedAt: new Date().toISOString(),
            title: ach.title,
            icon: ach.icon
          };
          unlocked.push({
            id, title: ach.title, icon: ach.icon, isNew: true,
            reward: ach.reward
          });

          // 庆祝反馈
          if (this.audio) this.audio.playSound('levelup');
          if (this.visual) {
            this.visual.startParticles({ type: 'confetti', count: 50 });
            setTimeout(() => this.visual.stopParticles(), 3000);
            this.visual.showToast(`🏆 成就解锁：${ach.title}`, 'success', 4000);
          }
          if (this.lang) {
            const msg = this.lang.encouragement(ach.title, Object.keys(this._stats.achievements).length);
            if (this.visual) setTimeout(() => this.visual.showToast(msg, 'success', 3000), 1500);
          }
        }
      } catch (e) {
        console.warn(`[HumanizeCore] Achievement check failed for ${id}:`, e);
      }
    }

    if (unlocked.length > 0) this._saveStats();
    return unlocked;
  }

  getAchievements() {
    const result = [];
    for (const [id, ach] of Object.entries(this._achievements)) {
      const unlocked = this._stats.achievements && this._stats.achievements[id];
      result.push({
        id, title: ach.title, icon: ach.icon,
        description: ach.description,
        unlocked: !!unlocked,
        unlockedAt: unlocked ? unlocked.unlockedAt : null
      });
    }
    return result;
  }

  // === 贴士系统 ===

  registerTips(tips) {
    this._tips = tips;
  }

  getTip(category) {
    if (this._tips.length === 0) return { text: '今天也是认真生活的一天。', category: 'general' };

    const pool = category
      ? this._tips.filter(t => t.category === category)
      : this._tips;
    if (pool.length === 0) return this._tips[this._tipIndex % this._tips.length];

    this._tipIndex = (this._tipIndex + 1) % pool.length;
    return pool[this._tipIndex];
  }

  // === 数据持久化 ===

  _loadStats() {
    try {
      const raw = localStorage.getItem(this._storageKey);
      const data = raw ? JSON.parse(raw) : {};
      return {
        profile: data.profile || {},
        preferences: data.preferences || {},
        streak: data.streak || { current: 0, longest: 0 },
        visits: data.visits || 0,
        lastVisitDate: data.lastVisitDate || null,
        achievements: data.achievements || {},
        tipIndex: data.tipIndex || 0,
        ...data
      };
    } catch (e) {
      return {
        profile: {}, preferences: {}, streak: { current: 0, longest: 0 },
        visits: 0, lastVisitDate: null, achievements: {}, tipIndex: 0
      };
    }
  }

  _saveStats() {
    try {
      localStorage.setItem(this._storageKey, JSON.stringify(this._stats));
    } catch (e) {
      console.warn('[HumanizeCore] Failed to save stats:', e);
    }
  }

  save() { this._saveStats(); }
  load() { this._stats = this._loadStats(); }

  // === 常用便捷方法 ===

  /**
   * 处理用户交互事件
   * @param {string} action - 动作名
   * @param {Object} data - 附加上下文
   */
  handleInteraction(action, data = {}) {
    const emotion = this.inferEmotion(action, data);
    if (emotion.primary !== 'neutral' && emotion.intensity > 0.3) {
      this.triggerEmotionalResponse(emotion.primary, data);
    }

    // 更新统计
    if (!this._stats.interactions) this._stats.interactions = {};
    this._stats.interactions[action] = (this._stats.interactions[action] || 0) + 1;
    this._stats.totalInteractions = (this._stats.totalInteractions || 0) + 1;

    // 定期检查成就
    if (this._stats.totalInteractions % 10 === 0) {
      this.checkAchievements();
    }

    this._saveStats();
  }

  /**
   * 获取统计摘要
   */
  getSummary() {
    return {
      projectId: this.projectId,
      streak: this._stats.streak,
      visits: this._stats.visits,
      achievements: Object.keys(this._stats.achievements || {}).length,
      totalAchievements: Object.keys(this._achievements).length,
      totalInteractions: this._stats.totalInteractions || 0
    };
  }

  // === 静态工厂 ===

  static forProject(projectId, options = {}) {
    const inst = new HumanizeCore(projectId, options);

    // 预定义通用成就
    const commonAchievements = [
      { id: 'first_visit', title: '初次见面', description: '第一次打开这个工具', icon: '👋', condition: (s) => s.visits >= 1, reward: '解锁所有基础功能' },
      { id: 'streak_3', title: '小有坚持', description: '连续使用3天', icon: '🌱', condition: (s) => s.streak.current >= 3 },
      { id: 'streak_7', title: '坚持一周', description: '连续使用7天', icon: '💪', condition: (s) => s.streak.current >= 7 },
      { id: 'streak_14', title: '半月坚守', description: '连续使用14天', icon: '🌟', condition: (s) => s.streak.current >= 14 },
      { id: 'streak_30', title: '月度标兵', description: '连续使用30天', icon: '🏆', condition: (s) => s.streak.current >= 30 },
      { id: 'ten_visits', title: '常客', description: '累计访问10次', icon: '🔟', condition: (s) => s.visits >= 10 },
      { id: 'fifty_visits', title: '忠实用户', description: '累计访问50次', icon: '💎', condition: (s) => s.visits >= 50 },
    ];

    for (const ach of commonAchievements) {
      inst.defineAchievement(ach.id, ach);
    }

    return inst;
  }
}

if (typeof window !== 'undefined') {
  window.HumanizeCore = HumanizeCore;
  console.log('[HumanizeCore] initialized');
}
if (typeof module !== 'undefined') {
  module.exports = HumanizeCore;
}
