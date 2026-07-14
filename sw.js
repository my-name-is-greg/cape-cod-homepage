// Cape Cod Homepage offline mode — cache-first for the site itself,
// so the address/phone numbers load with zero bars at the beach.
// Weather/tide API calls pass straight through to the network
// (the page already shows "SATELLITE LINK LOST" when they fail).
var CACHE = 'cape-cod-v2';
var ASSETS = ['./', 'index.html', 'game.html', 'manifest.json', 'icon.svg'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Serve from cache immediately, refresh the cache in the background.
  e.respondWith(
    caches.match(e.request).then(function(cached){
      var fresh = fetch(e.request).then(function(res){
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      }).catch(function(){ return cached; });
      return cached || fresh;
    })
  );
});
