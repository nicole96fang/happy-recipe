/* SW · 离线缓存 (网络优先 + 版本管理)
 * 策略: 先尝试网络 → 拿到新版本就更新缓存 → 失败时回退到缓存
 * 这样每次部署后用户刷新就能立刻看到新版本，无需手动清缓存
 */
const CACHE = 'happy-recipe-v3';   // 每次部署时改版本号
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './js/db.js',
  './js/utils.js',
  './js/seed.js',
  './js/views.js',
  './js/router.js',
  './js/print.js',
  './js/share.js',
  './js/backup.js',
  './js/app.js',
  // Google Fonts: 不缓存，直接走网络（CDN 比 SW 缓存可靠）
  'https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@300;400;700&family=LXGW+WenKai:wght@300;400;700&family=Long+Cang&family=Caveat:wght@500;700&family=Pacifico&display=swap'
];

self.addEventListener('install', e=>{
  // 立即激活，不等旧的标签页关闭
  self.skipWaiting();
  // 预缓存静态资源（失败也无所谓）
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(ASSETS).catch(()=>{})).catch(()=>{})
  );
});

self.addEventListener('activate', e=>{
  // 清掉所有旧版本缓存
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1) 跨域资源 (Google Fonts 等) → 直接走网络，不缓存
  if(url.origin !== self.location.origin){
    return; // 不调用 respondWith，浏览器默认走网络
  }

  // 2) 同源资源 → 网络优先策略
  // 这样用户刷新就能拿到最新代码，旧的 SW 缓存不会一直卡着
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(res => {
        // 成功：克隆一份存到缓存
        if(res && res.status === 200){
          const copy = res.clone();
          caches.open(CACHE).then(c => {
            try { c.put(req, copy); } catch(_){}
          }).catch(()=>{});
        }
        return res;
      })
      .catch(() => {
        // 网络失败（离线）→ 回退到缓存
        return caches.match(req).then(cached => {
          if(cached) return cached;
          // 都没有 → 返回根 index.html（让 SPA 路由接管）
          if(req.mode === 'navigate') return caches.match('./index.html');
          return new Response('', { status: 504, statusText: 'offline' });
        });
      })
  );
});
