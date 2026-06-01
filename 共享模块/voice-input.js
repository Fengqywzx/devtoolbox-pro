// 通用语音输入模块 — Web Speech API + 方言适配
// 所有项目共用

class VoiceInput {
  constructor(options = {}) {
    this.lang = options.lang || 'zh-CN';
    this.continuous = options.continuous || false;
    this.interimResults = options.interimResults || true;
    this.onResult = options.onResult || (() => {});
    this.onError = options.onError || (() => {});
    this.onStart = options.onStart || (() => {});
    this.onEnd = options.onEnd || (() => {});
    this.recognition = null;
    this.isListening = false;
    this._init();
  }

  _init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[Voice] Speech Recognition not supported');
      this.supported = false;
      return;
    }
    this.supported = true;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.lang;
    this.recognition.continuous = this.continuous;
    this.recognition.interimResults = this.interimResults;
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      this.onResult({ final, interim, raw: event });
    };

    this.recognition.onerror = (event) => {
      this.onError({ error: event.error, message: event.message });
    };

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStart();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEnd();
    };
  }

  // 切换方言
  setDialect(dialect) {
    const dialectMap = {
      'mandarin': 'zh-CN',
      'sichuan': 'zh-CN',      // Web Speech API 不支持四川话，使用普通话
      'henan': 'zh-CN',
      'cantonese': 'zh-HK',
      'english': 'en-US'
    };
    if (this.recognition) {
      this.recognition.lang = dialectMap[dialect] || 'zh-CN';
    }
  }

  start() {
    if (!this.supported) {
      this.onError({ error: 'not-supported', message: '浏览器不支持语音识别' });
      return;
    }
    try {
      this.recognition.start();
    } catch (e) {
      // 可能已经在运行中
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  toggle() {
    this.isListening ? this.stop() : this.start();
  }

  // 文本转语音（方言播报）
  static speak(text, options = {}) {
    const lang = options.lang || 'zh-CN';
    const rate = options.rate || 0.9;
    const pitch = options.pitch || 1.0;
    const volume = options.volume || 1.0;

    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    window.speechSynthesis.speak(utterance);
    return utterance;
  }

  // 停止所有语音
  static stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}
