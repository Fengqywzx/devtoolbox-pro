// LLM API 抽象层 v2 — 简化版
// 默认 DeepSeek（便宜、中文好、OpenAI 兼容）
// 也支持 OpenAI、Anthropic、自定义 OpenAI 兼容接口
// 未配置时自动降级到正则引擎

class LLMClient {
  static PROVIDERS = {
    deepseek: {
      name: 'DeepSeek（推荐）',
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      apiKeyUrl: 'https://platform.deepseek.com/api_keys',
      type: 'openai-compatible'
    },
    openai: {
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      apiKeyUrl: 'https://platform.openai.com/api-keys',
      type: 'openai-compatible'
    },
    anthropic: {
      name: 'Anthropic Claude',
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-haiku-4-5-20251001',
      apiKeyUrl: 'https://console.anthropic.com/keys',
      type: 'anthropic'
    }
  };

  constructor(options = {}) {
    this.provider = options.provider || 'deepseek';
    this.apiKey = '';
    this.baseUrl = '';
    this.model = '';
    this.timeout = options.timeout || 15000;
    this._loadConfig();
  }

  _loadConfig() {
    try {
      const saved = localStorage.getItem('bv_llm_config');
      if (saved) {
        const c = JSON.parse(saved);
        if (c.provider) this.provider = c.provider;
        if (c.apiKey) this.apiKey = c.apiKey;
        if (c.baseUrl) this.baseUrl = c.baseUrl;
        if (c.model) this.model = c.model;
      }
    } catch { /* ignore */ }
    this._applyDefaults();
  }

  _applyDefaults() {
    const preset = LLMClient.PROVIDERS[this.provider] || LLMClient.PROVIDERS.deepseek;
    if (!this.baseUrl) this.baseUrl = preset.baseUrl;
    if (!this.model) this.model = preset.model;
  }

  get isConfigured() {
    return !!this.apiKey;
  }

  get providerName() {
    const preset = LLMClient.PROVIDERS[this.provider];
    return preset ? preset.name : '自定义';
  }

  saveConfig({ provider, apiKey, baseUrl, model }) {
    if (provider) this.provider = provider;
    if (apiKey !== undefined) this.apiKey = apiKey;
    if (baseUrl !== undefined) this.baseUrl = baseUrl;
    if (model !== undefined) this.model = model;
    this._applyDefaults();
    localStorage.setItem('bv_llm_config', JSON.stringify({
      provider: this.provider,
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
      model: this.model
    }));
  }

  async complete(prompt, options = {}) {
    if (!this.isConfigured) return null;

    const temperature = options.temperature ?? 0.1;
    const maxTokens = options.maxTokens ?? 800;

    try {
      const preset = LLMClient.PROVIDERS[this.provider];
      if (preset && preset.type === 'anthropic') {
        return await this._callAnthropic(prompt, temperature, maxTokens);
      }
      return await this._callOpenAICompatible(prompt, temperature, maxTokens);
    } catch (err) {
      console.warn('[LLM] Failed:', err.message);
      return null;
    }
  }

  // v3: 多轮对话接口（深度对话引擎使用）
  async chat(messages, options = {}) {
    if (!this.isConfigured) return null;

    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 600;
    const systemPrompt = options.systemPrompt || '你是劳动法律文书助手。';

    try {
      const preset = LLMClient.PROVIDERS[this.provider];
      if (preset && preset.type === 'anthropic') {
        return await this._callAnthropicChat(messages, systemPrompt, temperature, maxTokens);
      }
      return await this._callOpenAICompatibleChat(messages, systemPrompt, temperature, maxTokens);
    } catch (err) {
      console.warn('[LLM] Chat failed:', err.message);
      return null;
    }
  }

  async _callOpenAICompatibleChat(messages, systemPrompt, temperature, maxTokens) {
    const url = `${this.baseUrl}/chat/completions`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const allMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
      ];

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: allMessages,
          temperature,
          max_tokens: maxTokens
        }),
        signal: controller.signal
      });

      const data = await resp.json();
      if (data.error) throw new Error(data.error.message || 'API Error');
      return data.choices?.[0]?.message?.content || null;
    } finally {
      clearTimeout(timer);
    }
  }

  async _callAnthropicChat(messages, systemPrompt, temperature, maxTokens) {
    const url = `${this.baseUrl}/messages`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Claude API messages format: user/assistant alternating
      const formattedMsgs = [];
      for (const msg of messages) {
        formattedMsgs.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        });
      }

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: formattedMsgs
        }),
        signal: controller.signal
      });

      const data = await resp.json();
      if (data.error) throw new Error(data.error.message || 'API Error');
      return data.content?.[0]?.text || null;
    } finally {
      clearTimeout(timer);
    }
  }

  async testConnection() {
    if (!this.isConfigured) return { ok: false, error: '未配置 API Key' };
    try {
      const result = await this.complete('请回复一个JSON：{"status":"ok"}', { maxTokens: 50 });
      return result ? { ok: true } : { ok: false, error: '返回为空' };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  async _callOpenAICompatible(prompt, temperature, maxTokens) {
    const url = `${this.baseUrl}/chat/completions`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '你是劳动法律文书助手。从劳动者的口语描述中提取关键事实，只返回JSON，不附加解释。'
            },
            { role: 'user', content: prompt }
          ],
          temperature,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });

      const data = await resp.json();
      if (data.error) throw new Error(data.error.message || 'API Error');
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty response');

      try { return JSON.parse(content); }
      catch { return { raw: content }; }
    } finally {
      clearTimeout(timer);
    }
  }

  async _callAnthropic(prompt, temperature, maxTokens) {
    const url = `${this.baseUrl}/messages`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: maxTokens,
          temperature,
          system: '你是劳动法律文书助手。从劳动者的口语描述中提取关键事实，只返回JSON，不附加解释。',
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: controller.signal
      });

      const data = await resp.json();
      if (data.error) throw new Error(data.error.message || 'API Error');
      const text = data.content?.[0]?.text;
      if (!text) throw new Error('Empty response');

      const m = text.match(/\{[\s\S]*\}/);
      return m ? JSON.parse(m[0]) : { raw: text };
    } finally {
      clearTimeout(timer);
    }
  }
}
