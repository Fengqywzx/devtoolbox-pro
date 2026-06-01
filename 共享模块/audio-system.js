/**
 * AudioSystem v5 — 音频反馈引擎
 * 使用Web Audio API实时合成音效，无需外部音频文件
 * 支持TTS语音播报、环境音、按键音反馈
 * 依赖：无
 */
class AudioSystem {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.volume = options.volume || 0.5;
    this.voiceEnabled = options.voiceEnabled !== false;
    this.soundEnabled = options.soundEnabled !== false;
    this.ambientEnabled = options.ambientEnabled !== false;
    this._ctx = null;
    this._ambientNode = null;
    this._ambientGain = null;
    this._initAudioContext();
  }

  _initAudioContext() {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('[AudioSystem] Web Audio API not available');
      this.enabled = false;
    }
  }

  _ensureContext() {
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
    return this._ctx;
  }

  /**
   * 播放音效
   * @param {string} type - 音效类型
   */
  playSound(type) {
    if (!this.enabled || !this.soundEnabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const sounds = {
      click: () => this._tone(ctx, 800, 0.05, 'sine', 0.3),
      success: () => {
        this._tone(ctx, 523, 0.1, 'sine', 0.4);
        setTimeout(() => this._tone(ctx, 659, 0.1, 'sine', 0.4), 80);
        setTimeout(() => this._tone(ctx, 784, 0.15, 'sine', 0.4), 160);
      },
      error: () => this._tone(ctx, 200, 0.4, 'sawtooth', 0.3, 400),
      warning: () => {
        this._tone(ctx, 440, 0.15, 'square', 0.2);
        setTimeout(() => this._tone(ctx, 440, 0.15, 'square', 0.2), 200);
      },
      notification: () => {
        this._tone(ctx, 1000, 0.1, 'sine', 0.3);
        setTimeout(() => this._tone(ctx, 1200, 0.1, 'sine', 0.3), 120);
      },
      complete: () => {
        this._tone(ctx, 523, 0.15, 'sine', 0.4);
        setTimeout(() => this._tone(ctx, 659, 0.15, 'sine', 0.4), 100);
        setTimeout(() => this._tone(ctx, 784, 0.15, 'sine', 0.4), 200);
        setTimeout(() => this._tone(ctx, 1047, 0.3, 'sine', 0.5), 300);
      },
      coin: () => this._tone(ctx, 1200, 0.08, 'sine', 0.3, 600),
      levelup: () => {
        const notes = [523, 659, 784, 1047];
        notes.forEach((n, i) => {
          setTimeout(() => this._tone(ctx, n, 0.12, 'sine', 0.35), i * 100);
        });
      },
      heartbeat: () => {
        this._tone(ctx, 60, 0.15, 'sine', 0.4);
        setTimeout(() => this._tone(ctx, 60, 0.15, 'sine', 0.4), 200);
      },
      bell: () => this._tone(ctx, 880, 0.3, 'sine', 0.3, 440),
      alarm: () => {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            this._tone(ctx, 800, 0.15, 'square', 0.25);
          }, i * 300);
        }
      },
      pulse: () => this._tone(ctx, 200, 0.2, 'sine', 0.2, 100),
      chime: () => {
        this._tone(ctx, 988, 0.5, 'sine', 0.2);
        setTimeout(() => this._tone(ctx, 1319, 0.5, 'sine', 0.15), 100);
      },
      swoosh: () => this._tone(ctx, 600, 0.15, 'sine', 0.15, 1200),
      lock: () => this._tone(ctx, 300, 0.2, 'triangle', 0.3, 150),
      unlock: () => {
        this._tone(ctx, 300, 0.1, 'triangle', 0.3, 150);
        setTimeout(() => this._tone(ctx, 600, 0.15, 'triangle', 0.3), 80);
      },
      pageflip: () => this._tone(ctx, 400, 0.06, 'sine', 0.15, 200),
      typing: () => this._tone(ctx, 600, 0.03, 'sine', 0.1),
      send: () => {
        this._tone(ctx, 500, 0.08, 'sine', 0.2);
        setTimeout(() => this._tone(ctx, 900, 0.12, 'sine', 0.25), 60);
      }
    };

    const fn = sounds[type];
    if (fn) fn();
  }

  /**
   * 合成单音
   */
  _tone(ctx, freq, duration, type = 'sine', vol = 0.3, endFreq = null) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (endFreq) {
      osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration);
    }
    gain.gain.setValueAtTime(vol * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  /**
   * TTS语音播报
   * @param {string} text
   * @param {Object} options - { rate, pitch, emotion }
   */
  speak(text, options = {}) {
    if (!this.enabled || !this.voiceEnabled) return;
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || 'zh-CN';

    // 根据情绪调整语速和音调
    const emotion = options.emotion || 'neutral';
    const emotionSettings = {
      calm: { rate: 0.85, pitch: 1.0 },
      warm: { rate: 0.9, pitch: 1.1 },
      urgent: { rate: 1.2, pitch: 1.2 },
      gentle: { rate: 0.8, pitch: 0.9 },
      neutral: { rate: 1.0, pitch: 1.0 }
    };

    const settings = emotionSettings[emotion] || emotionSettings.neutral;
    utterance.rate = options.rate || settings.rate;
    utterance.pitch = options.pitch || settings.pitch;
    utterance.volume = this.volume;

    window.speechSynthesis.speak(utterance);
  }

  /**
   * 停止播报
   */
  stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * 播放环境音
   * @param {string} type
   */
  playAmbient(type) {
    if (!this.enabled || !this.ambientEnabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    this.stopAmbient();

    this._ambientGain = ctx.createGain();
    this._ambientGain.gain.setValueAtTime(this.volume * 0.15, ctx.currentTime);
    this._ambientGain.connect(ctx.destination);

    const ambientGenerators = {
      rain: () => this._noiseAmbient(ctx, 'pink', this._ambientGain),
      wind: () => this._noiseAmbient(ctx, 'brown', this._ambientGain),
      cafe: () => this._noiseAmbient(ctx, 'white', this._ambientGain, 0.08),
      night: () => this._noiseAmbient(ctx, 'brown', this._ambientGain, 0.05),
      forest: () => this._noiseAmbient(ctx, 'pink', this._ambientGain, 0.1),
      river: () => this._noiseAmbient(ctx, 'pink', this._ambientGain, 0.12),
      waves: () => this._noiseAmbient(ctx, 'brown', this._ambientGain, 0.12),
      silence: () => {}
    };

    const gen = ambientGenerators[type];
    if (gen) gen();
  }

  _noiseAmbient(ctx, color = 'white', gainNode, vol = 0.1) {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (color === 'white') {
        data[i] = white * vol;
      } else if (color === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11 * vol;
      } else if (color === 'brown') {
        data[i] = (b0 + white * 0.02);
        b0 = data[i];
        data[i] *= vol * 5;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gainNode);
    source.start();
    this._ambientNode = source;
  }

  /**
   * 停止环境音
   */
  stopAmbient() {
    if (this._ambientNode) {
      try { this._ambientNode.stop(); } catch (e) {}
      this._ambientNode = null;
    }
    if (this._ambientGain) {
      this._ambientGain.disconnect();
      this._ambientGain = null;
    }
  }

  // === 状态管理 ===
  setEnabled(v) { this.enabled = v; }
  setVolume(v) { this.volume = Math.max(0, Math.min(1, v)); }
  toggleVoice() { this.voiceEnabled = !this.voiceEnabled; }
  toggleSound() { this.soundEnabled = !this.soundEnabled; }
  toggleAmbient() {
    this.ambientEnabled = !this.ambientEnabled;
    if (!this.ambientEnabled) this.stopAmbient();
  }

  /**
   * 便捷：播放成功音效+播报文字
   */
  feedback(type, text) {
    this.playSound(type);
    if (text) this.speak(text);
  }
}

if (typeof window !== 'undefined') {
  window.AudioSystem = AudioSystem;
  console.log('[AudioSystem] initialized');
}
if (typeof module !== 'undefined') {
  module.exports = AudioSystem;
}
