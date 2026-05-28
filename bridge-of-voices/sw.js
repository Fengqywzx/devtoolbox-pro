// 声音的桥 — Service Worker
// 离线缓存策略：Network First → Cache Fallback
// 确保核心功能在网络不可用时仍可访问

const CACHE_NAME = 'bridge-of-voices-v2';
const CRITICAL_ASSETS = [
  './',
  './index.html',
  './css/app.css',
  './css/interview.css',
  './css/print.css',
  './js/utils.js',
  './js/storage.js',
  './js/llm-client.js',
  './js/templates.js',
  './js/speech.js',
  './js/speech-tts.js',
  './js/validator.js',
  './js/extractor.js',
  './js/document-renderer.js',
  './js/document-gen.js',
  './js/case-manager.js',
  './js/interview-engine.js',
  './js/app.js',
  './data/interview-questions.json',
  './data/legal-knowledge.json',
  './data/city-venues.json',
  './assets/icon.svg'
];

// Install — 预缓存关键静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CRITICAL_ASSETS).catch(err => {
        console.warn('[SW] Pre-cache partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate — 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch — Network First 策略
self.addEventListener('fetch', (event) => {
  // 跳过非 GET 请求和非 HTTP(S) 请求
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // 对于 API 调用，只用网络（不缓存 LLM API 响应）
  if (url.hostname.includes('api.openai.com') ||
      url.hostname.includes('api.anthropic.com')) {
    return; // 不拦截，让浏览器直接请求
  }

  event.respondWith(
    (async () => {
      try {
        // 优先网络请求
        const networkResponse = await fetch(event.request, { cache: 'no-cache' });

        // 缓存成功的 GET 响应
        if (networkResponse && networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }

        return networkResponse;
      } catch (err) {
        // 网络不可用 → 从缓存提供
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // 对于 HTML 导航请求 → 返回缓存的 index.html（SPA fallback）
        if (event.request.mode === 'navigate') {
          const html = await caches.match('./index.html');
          if (html) return html;
        }

        // 完全无法响应
        return new Response('网络不可用，请检查连接后重试', {
          status: 503,
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
        });
      }
    })()
  );
});
