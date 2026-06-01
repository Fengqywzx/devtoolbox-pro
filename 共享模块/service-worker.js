// 通用 Service Worker — 离线缓存 + 后台同步
// 所有12项目共用此模板，替换 CACHE_NAME 即可

const CACHE_NAME = 'labor-apps-v1';
const STATIC_ASSETS = [
  './index.html',
  './css/app.css',
  './js/app.js',
  './manifest.json'
];

// 安装：预缓存静态资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // 部分资源失败不阻断安装
        console.warn('[SW] Some assets failed to cache');
      });
    })
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// 拦截请求：缓存优先 + 网络回退
self.addEventListener('fetch', event => {
  // 跳过非GET请求和API调用
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/') || event.request.url.includes('wttr.in')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// 后台同步
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  // 从IndexedDB取出待同步数据→发送到服务器
  // 各项目覆盖此函数
  console.log('[SW] Background sync triggered');
}

// 推送通知
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || '新消息',
    icon: './assets/icon-192.png',
    badge: './assets/icon-72.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || './index.html' }
  };
  event.waitUntil(
    self.registration.showNotification(data.title || '提醒', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || './index.html')
  );
});
