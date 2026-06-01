// 语音合成模块 (TTS)
// 为低识字率用户提供语音引导播报
// 封装 Web Speech Synthesis API

class SpeechTTS {
  constructor() {
    this.synth = window.speechSynthesis;
    this.enabled = false;
    this.speaking = false;
    this.pendingQueue = [];
    this.voice = null;
    this.rate = 0.9;     // 稍慢，便于理解
    this.pitch = 1.0;
    this.volume = 1.0;

    this._initVoice();
  }

  _initVoice() {
    if (!this.synth) return;

    // 等待 voices 加载
    const voices = this.synth.getVoices();
    if (voices.length > 0) {
      this._selectBestVoice(voices);
    }
    this.synth.onvoiceschanged = () => {
      this._selectBestVoice(this.synth.getVoices());
    };
  }

  _selectBestVoice(voices) {
    // 优先选择中文女声
    const preferred = [
      'Microsoft Xiaoxiao',    // Win11 自然女声
      'Microsoft Yaoyao',
      'Tingting',
      'Google 普通话',
      'zh-CN'
    ];

    for (const name of preferred) {
      const v = voices.find(v => v.name.includes(name) && v.lang.startsWith('zh'));
      if (v) { this.voice = v; return; }
    }

    // 任意中文语音
    const anyChinese = voices.find(v => v.lang.startsWith('zh'));
    if (anyChinese) { this.voice = anyChinese; return; }

    // 回退
    this.voice = voices[0] || null;
  }

  // 播报文本
  speak(text, options = {}) {
    if (!this.synth) {
      console.warn('[TTS] Speech synthesis not supported');
      return;
    }

    const rate = options.rate ?? this.rate;
    const pitch = options.pitch ?? this.pitch;
    const volume = options.volume ?? this.volume;

    // 停止当前播报
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    utterance.lang = 'zh-CN';

    this.speaking = true;

    utterance.onend = () => {
      this.speaking = false;
      this._playNext();
    };

    utterance.onerror = (e) => {
      console.warn('[TTS] Error:', e.error);
      this.speaking = false;
      this._playNext();
    };

    this.synth.speak(utterance);
  }

  // 加入播报队列
  queue(text, options = {}) {
    if (this.speaking) {
      this.pendingQueue.push({ text, options });
    } else {
      this.speak(text, options);
    }
  }

  _playNext() {
    if (this.pendingQueue.length > 0) {
      const next = this.pendingQueue.shift();
      this.speak(next.text, next.options);
    }
  }

  // 停止播报
  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.speaking = false;
    }
  }

  // 清空队列
  clearQueue() {
    this.pendingQueue = [];
  }

  // 启用/禁用 TTS
  toggle(enabled) {
    this.enabled = enabled !== undefined ? enabled : !this.enabled;
    if (!this.enabled) {
      this.stop();
      this.clearQueue();
    }
    Storage.setPreference('tts_enabled', this.enabled);
    return this.enabled;
  }

  // 恢复用户偏好
  loadPreference() {
    this.enabled = Storage.getPreference('tts_enabled', false);
    return this.enabled;
  }

  // 播报简短确认
  confirm(text) {
    this.speak(text, { rate: 0.85 });
  }

  // 播报提示（更慢更清晰）
  prompt(text) {
    this.speak(text, { rate: 0.8, pitch: 1.05 });
  }
}
