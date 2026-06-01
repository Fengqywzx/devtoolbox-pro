/**
 * VisualSystem v5 — 视觉动画引擎
 * Canvas粒子系统、12色情绪调色板、页面过渡动画、无障碍模式
 * 依赖：无
 */
class VisualSystem {
  constructor(options = {}) {
    this.container = options.containerId
      ? document.getElementById(options.containerId)
      : document.body;
    this.enableParticles = options.enableParticles !== false;
    this._particleCanvas = null;
    this._particleCtx = null;
    this._particleRAF = null;
    this._particles = [];
    this._currentMood = 'neutral';
  }

  /**
   * 情绪色板 — 12种基础情绪 → 颜色映射
   */
  static MOOD_COLORS = {
    calm:    { primary: '#4ade80', secondary: '#86efac', accent: '#22c55e', bg: 'linear-gradient(135deg, rgba(74,222,128,0.08), rgba(134,239,172,0.12))' },
    anxious: { primary: '#fbbf24', secondary: '#fcd34d', accent: '#f59e0b', bg: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(252,211,77,0.12))' },
    angry:   { primary: '#ef4444', secondary: '#f87171', accent: '#dc2626', bg: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(248,113,113,0.12))' },
    tired:   { primary: '#818cf8', secondary: '#a5b4fc', accent: '#6366f1', bg: 'linear-gradient(135deg, rgba(129,140,248,0.08), rgba(165,180,252,0.12))' },
    sad:     { primary: '#6366f1', secondary: '#818cf8', accent: '#4f46e5', bg: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(129,140,248,0.12))' },
    proud:   { primary: '#f59e0b', secondary: '#fbbf24', accent: '#d97706', bg: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(251,191,36,0.15))' },
    grateful:{ primary: '#34d399', secondary: '#6ee7b7', accent: '#10b981', bg: 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(110,231,183,0.12))' },
    hopeful: { primary: '#38bdf8', secondary: '#7dd3fc', accent: '#0ea5e9', bg: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(125,211,252,0.12))' },
    neutral: { primary: '#94a3b8', secondary: '#cbd5e1', accent: '#64748b', bg: 'linear-gradient(135deg, rgba(148,163,184,0.05), rgba(203,213,225,0.08))' },
    joyful:  { primary: '#f472b6', secondary: '#f9a8d4', accent: '#ec4899', bg: 'linear-gradient(135deg, rgba(244,114,182,0.08), rgba(249,168,212,0.12))' },
    fearful: { primary: '#8b5cf6', secondary: '#a78bfa', accent: '#7c3aed', bg: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(167,139,250,0.12))' },
    lonely:  { primary: '#64748b', secondary: '#94a3b8', accent: '#475569', bg: 'linear-gradient(135deg, rgba(100,116,139,0.08), rgba(148,163,184,0.1))' },
    determined: { primary: '#f97316', secondary: '#fb923c', accent: '#ea580c', bg: 'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(251,146,60,0.12))' }
  };

  /**
   * 设置当前情绪色彩
   * @param {string} emotion
   * @param {Object} options - { duration, intensity }
   */
  setMoodColor(emotion, options = {}) {
    const colors = VisualSystem.MOOD_COLORS[emotion] || VisualSystem.MOOD_COLORS.neutral;
    this._currentMood = emotion;
    const duration = options.duration || 800;

    // 设置CSS变量
    const root = document.documentElement;
    root.style.setProperty('--mood-primary', colors.primary);
    root.style.setProperty('--mood-secondary', colors.secondary);
    root.style.setProperty('--mood-accent', colors.accent);
    root.style.transition = `all ${duration}ms ease`;

    // 背景渐变过渡
    if (this.container) {
      this.container.style.transition = `background ${duration}ms ease`;
      this.container.style.background = colors.bg;
    }

    // 更新粒子颜色
    if (this._particles.length > 0) {
      this._particleColor = colors.primary;
    }
  }

  /**
   * 获取当前情绪色
   */
  getMoodColor(emotion) {
    return VisualSystem.MOOD_COLORS[emotion || this._currentMood] || VisualSystem.MOOD_COLORS.neutral;
  }

  // === 粒子系统 ===

  /**
   * 启动粒子效果
   * @param {Object} options - { type, count, color, speed, mood }
   */
  startParticles(options = {}) {
    if (!this.enableParticles) return;
    this.stopParticles();

    const type = options.type || 'sparkle';
    const count = options.count || 40;
    const colors = VisualSystem.MOOD_COLORS[options.mood || this._currentMood];
    const color = options.color || colors.primary;
    const speed = options.speed || 1;

    this._particleCanvas = document.createElement('canvas');
    this._particleCanvas.className = 'vs-particles';
    Object.assign(this._particleCanvas.style, {
      position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '9998'
    });
    this._particleCanvas.width = window.innerWidth;
    this._particleCanvas.height = window.innerHeight;
    document.body.appendChild(this._particleCanvas);

    this._particleCtx = this._particleCanvas.getContext('2d');
    this._particleColor = color;
    this._particleSpeed = speed;

    // 生成粒子
    this._particles = [];
    const generators = {
      sparkle: () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 4 + 1,
        vx: (Math.random() - 0.5) * 0.5 * speed,
        vy: (Math.random() - 0.5) * 0.5 * speed,
        alpha: Math.random() * 0.8 + 0.2,
        fadeDir: Math.random() > 0.5 ? 1 : -1,
        life: Math.random() * 100 + 50
      }),
      bubble: () => ({
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 10,
        size: Math.random() * 6 + 2,
        vx: (Math.random() - 0.5) * 0.3 * speed,
        vy: -(Math.random() * 1.5 + 0.5) * speed,
        alpha: 0.3,
        life: Math.random() * 200 + 100
      }),
      snow: () => ({
        x: Math.random() * window.innerWidth,
        y: -10,
        size: Math.random() * 4 + 1,
        vx: (Math.random() - 0.5) * 0.5 * speed,
        vy: (Math.random() * 1 + 0.5) * speed,
        alpha: 0.7,
        life: 999
      }),
      rain: () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 0.5,
        vx: -0.5 * speed,
        vy: (Math.random() * 8 + 4) * speed,
        alpha: 0.4,
        life: 60
      }),
      leaf: () => ({
        x: Math.random() * window.innerWidth,
        y: -20,
        size: Math.random() * 6 + 3,
        vx: (Math.random() - 0.5) * 1.5 * speed,
        vy: (Math.random() * 1 + 0.3) * speed,
        alpha: 0.6,
        life: 300
      }),
      confetti: () => {
        const hue = Math.random() * 360;
        return {
          x: Math.random() * window.innerWidth,
          y: -20,
          size: Math.random() * 8 + 3,
          vx: (Math.random() - 0.5) * 3 * speed,
          vy: (Math.random() * 2 + 1) * speed,
          alpha: 1,
          life: 200,
          hue,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 5
        };
      }
    };

    const gen = generators[type] || generators.sparkle;
    for (let i = 0; i < count; i++) {
      this._particles.push(gen());
    }

    this._animateParticles();
  }

  _animateParticles() {
    if (!this._particleCanvas || !this._particleCtx) return;

    const ctx = this._particleCtx;
    const w = this._particleCanvas.width;
    const h = this._particleCanvas.height;

    ctx.clearRect(0, 0, w, h);

    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      if (p.fadeDir) {
        p.alpha += p.fadeDir * 0.02;
        if (p.alpha >= 1) p.fadeDir = -1;
        if (p.alpha <= 0.1) p.fadeDir = 1;
      }

      if (p.rotation !== undefined) {
        p.rotation += p.rotSpeed;
      }

      if (p.life <= 0 || p.y > h + 50 || p.y < -50 || p.x < -50 || p.x > w + 50) {
        this._particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.hue !== undefined) {
        ctx.fillStyle = `hsl(${p.hue}, 70%, 60%)`;
      } else {
        ctx.fillStyle = this._particleColor;
      }

      if (p.rotation) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else if (p.hue !== undefined) {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    this._particleRAF = requestAnimationFrame(() => this._animateParticles());
  }

  stopParticles() {
    if (this._particleRAF) {
      cancelAnimationFrame(this._particleRAF);
      this._particleRAF = null;
    }
    if (this._particleCanvas) {
      this._particleCanvas.remove();
      this._particleCanvas = null;
      this._particleCtx = null;
    }
    this._particles = [];
  }

  // === 过渡动画 ===

  /**
   * 页面切换动画
   */
  transitionPage(from, to, options = {}) {
    const duration = options.duration || 400;
    const direction = options.direction || 'fade';

    return new Promise(resolve => {
      if (!from || !to) { resolve(); return; }

      const transitions = {
        fade: () => {
          from.style.transition = `opacity ${duration}ms ease`;
          from.style.opacity = '0';
          to.style.opacity = '0';
          to.classList.remove('hidden');
          setTimeout(() => {
            to.style.transition = `opacity ${duration}ms ease`;
            to.style.opacity = '1';
          }, 50);
        },
        left: () => {
          from.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
          from.style.transform = 'translateX(-100%)';
          from.style.opacity = '0';
          to.style.transform = 'translateX(100%)';
          to.classList.remove('hidden');
          setTimeout(() => {
            to.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
            to.style.transform = 'translateX(0)';
            to.style.opacity = '1';
          }, 50);
        },
        up: () => {
          from.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
          from.style.transform = 'translateY(-100%)';
          from.style.opacity = '0';
          to.style.transform = 'translateY(100%)';
          to.classList.remove('hidden');
          setTimeout(() => {
            to.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
            to.style.transform = 'translateY(0)';
            to.style.opacity = '1';
          }, 50);
        }
      };

      const fn = transitions[direction] || transitions.fade;
      fn();

      setTimeout(() => {
        from.classList.add('hidden');
        from.style.transform = '';
        from.style.opacity = '';
        to.style.transform = '';
        to.style.opacity = '';
        resolve();
      }, duration + 50);
    });
  }

  /**
   * 元素强调动画
   */
  emphasizeElement(el, type = 'pulse') {
    if (!el) return;
    const animations = {
      pulse: 'vs-pulse 0.6s ease',
      shake: 'vs-shake 0.5s ease',
      bounce: 'vs-bounce 0.5s ease',
      highlight: 'vs-highlight 0.8s ease',
      glow: 'vs-glow 0.6s ease'
    };
    el.style.animation = animations[type] || animations.pulse;
    setTimeout(() => { el.style.animation = ''; }, 800);
  }

  /**
   * 数字跳动动画
   */
  animateNumber(el, from, to, options = {}) {
    if (!el) return Promise.resolve();
    const duration = options.duration || 600;
    const prefix = options.prefix || '';
    const suffix = options.suffix || '';
    const start = performance.now();

    return new Promise(resolve => {
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = VisualSystem.easeInOut(progress);
        const current = Math.round(from + (to - from) * eased);
        el.textContent = `${prefix}${current}${suffix}`;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = `${prefix}${to}${suffix}`;
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  // === 无障碍 ===

  setHighContrast(enabled) {
    document.documentElement.classList.toggle('vs-high-contrast', enabled);
    localStorage.setItem('vs_highContrast', enabled);
  }

  setLargeText(enabled) {
    document.documentElement.classList.toggle('vs-large-text', enabled);
    localStorage.setItem('vs_largeText', enabled);
  }

  setReducedMotion(enabled) {
    document.documentElement.classList.toggle('vs-reduced-motion', enabled);
    localStorage.setItem('vs_reducedMotion', enabled);
  }

  // === Toast通知 ===

  showToast(message, type = 'info', duration = 3000) {
    const existing = document.querySelector('.vs-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `vs-toast vs-toast-${type}`;
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
      padding: '12px 24px', borderRadius: '12px', color: '#fff', fontSize: '14px',
      zIndex: '10000', opacity: '0', transition: 'opacity 0.3s ease, transform 0.3s ease',
      maxWidth: '90vw', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      pointerEvents: 'none'
    });

    const colors = {
      info: '#3b82f6', success: '#10b981', warning: '#f59e0b', error: '#ef4444'
    };
    toast.style.background = colors[type] || colors.info;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(-10px)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(0)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // === 工具方法 ===

  static easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  static detectUserPreferences() {
    return {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      contrast: window.matchMedia('(prefers-contrast: high)').matches
    };
  }

  /**
   * 注入全局CSS动画关键帧
   */
  static injectStyles() {
    if (document.getElementById('vs-styles')) return;
    const style = document.createElement('style');
    style.id = 'vs-styles';
    style.textContent = `
      /* 粒子容器 */
      .vs-particles { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9998; }

      /* Toast */
      .vs-toast { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

      /* 动画关键帧 */
      @keyframes vs-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes vs-shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      @keyframes vs-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      @keyframes vs-highlight {
        0% { box-shadow: 0 0 0 0 var(--mood-primary, #3b82f6); }
        50% { box-shadow: 0 0 20px 5px var(--mood-primary, #3b82f6); }
        100% { box-shadow: 0 0 0 0 var(--mood-primary, #3b82f6); }
      }
      @keyframes vs-glow {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(1.3); }
      }
      @keyframes vs-fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes vs-slideInRight {
        from { opacity: 0; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
      }

      /* 无障碍模式 */
      .vs-high-contrast {
        --text-primary: #000 !important;
        --text-secondary: #222 !important;
        --bg-primary: #fff !important;
        --bg-secondary: #f0f0f0 !important;
      }
      .vs-high-contrast .card { border: 2px solid #000 !important; }
      .vs-high-contrast .btn-primary { border: 2px solid #000 !important; }

      .vs-large-text { font-size: 120% !important; }
      .vs-large-text .card { font-size: 120% !important; }
      .vs-large-text button { font-size: 120% !important; padding: 14px 28px !important; }

      .vs-reduced-motion *,
      .vs-reduced-motion *::before,
      .vs-reduced-motion *::after {
        animation-duration: 0.001ms !important;
        transition-duration: 0.001ms !important;
      }

      /* 情绪色彩CSS变量 */
      :root {
        --mood-primary: #94a3b8;
        --mood-secondary: #cbd5e1;
        --mood-accent: #64748b;
      }
    `;
    document.head.appendChild(style);
  }
}

// 自动注入样式
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => VisualSystem.injectStyles());
}

if (typeof window !== 'undefined') {
  window.VisualSystem = VisualSystem;
  console.log('[VisualSystem] initialized');
}
if (typeof module !== 'undefined') {
  module.exports = VisualSystem;
}
