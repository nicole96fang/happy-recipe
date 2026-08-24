/* SW · 离线缓存 */
const CACHE = 'happy-recipe-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './js/db.js',
  './js/utils.js',
  './js/seed.js',
  './js/views.js',
  './js/router.js',
  './js/print.js',
  './js/share.js',
  './js/backup.js',
  './js/app.js'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  if(e.request.method !== 'GET') return;
  if(url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached) return cached;
      return fetch(e.request).then(res=>{
        const copy = res.clone();
        caches.open(CACHE).then(c=>{ try{ c.put(e.request, copy); }catch(_){} });
        return res;
      }).catch(()=>cached);
    })
  );
});
