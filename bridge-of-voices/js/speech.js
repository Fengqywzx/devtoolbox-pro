// 语音识别模块
// 封装 Web Speech API，支持中文识别
// 后续可替换为微信小程序语音插件

class SpeechRecognizer {
  constructor() {
    this.recognition = null;
    this.isSupported = false;
    this.isListening = false;
    this.transcript = '';
    this.interimTranscript = '';

    this._init();
  }

  _init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('当前浏览器不支持语音识别，请使用 Chrome 或 Edge');
      this.isSupported = false;
      return;
    }

    this.isSupported = true;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'zh-CN';
    this.recognition.interimResults = true;
    this.recognition.continuous = true;
    this.recognition.maxAlternatives = 1;
  }

  start(onResult, onEnd, onError) {
    if (!this.isSupported) {
      onError('浏览器不支持语音识别，请使用 Chrome/Edge 或改为文字输入');
      return;
    }

    this.transcript = '';
    this.isListening = true;

    this.recognition.onresult = (event) => {
      this.interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this.transcript += text;
        } else {
          this.interimTranscript += text;
        }
      }
      onResult(this.transcript + this.interimTranscript, this.transcript);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (onEnd) onEnd(this.transcript);
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      if (event.error === 'no-speech') {
        // 静音不算错误，静默结束
        if (onEnd) onEnd(this.transcript);
      } else {
        if (onError) onError(`语音识别错误：${event.error}`);
      }
    };

    try {
      this.recognition.start();
    } catch (e) {
      this.isListening = false;
      if (onError) onError('启动语音识别失败，请重试');
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
    return this.transcript;
  }

  // 后续扩展：方言支持
  setDialect(dialect) {
    const langMap = {
      'sichuan': 'zh-CN',
      'henan': 'zh-CN',
      'cantonese': 'zh-HK',
      'minnan': 'zh-TW'
    };
    if (this.recognition) {
      this.recognition.lang = langMap[dialect] || 'zh-CN';
    }
  }
}
