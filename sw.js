/* 電波がなくても開けるようにするための裏方ファイル */
/* ファイルを直したら、下の数字を1つ増やすこと（古い画面が残らないように） */
var CACHE = 'keisanki-v2';
var FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(FILES); }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return k === CACHE ? null : caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;

  var isPage = e.request.mode === 'navigate' || e.request.destination === 'document';

  if(isPage){
    // 画面本体は「まず最新を取りに行き、取れなければ保存版」。直した内容がすぐ反映される
    e.respondWith(
      fetch(e.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put('./index.html', copy); });
        return res;
      }).catch(function(){
        return caches.match('./index.html');
      })
    );
    return;
  }

  // アイコンなどは「保存版があればそれを使い、裏で最新に入れ替える」
  e.respondWith(
    caches.match(e.request).then(function(hit){
      var net = fetch(e.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return res;
      }).catch(function(){ return hit; });
      return hit || net;
    })
  );
});
