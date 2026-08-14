/* BEACON 관찰코딩 · Service Worker · 오프라인 앱셸 캐시 · v1.0 (2026-08-14)
   앱 셸(HTML/JS/매니페스트/아이콘)만 캐시. 관찰 데이터는 IndexedDB(캐시와 무관). */
var CACHE='beacon-observer-v1';
var SHELL=['./','./index.html','./app.js','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png'];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET'){ return; }
  var url=new URL(req.url);
  // 시각 엔드포인트 등 외부 API는 캐시 우회(항상 네트워크)
  if(url.origin!==self.location.origin){ return; }
  // 앱 셸: 캐시 우선, 없으면 네트워크(후 캐시)
  e.respondWith(
    caches.match(req).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(res){
        var copy=res.clone();
        caches.open(CACHE).then(function(c){ try{ c.put(req,copy); }catch(_){} });
        return res;
      }).catch(function(){ return caches.match('./index.html'); });
    })
  );
});
