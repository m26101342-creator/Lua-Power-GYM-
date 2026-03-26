const CACHE_NAME = 'luapower-gym-v1';
const URLS_TO_CACHE = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  'https://i.postimg.cc/K86FS7PH/1000196294_fotor_enhance_20260107104529.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Strategy: Stale-While-Revalidate for most requests, Cache First for specific assets
  
  // Para requisições do esm.sh ou CDNs externos, tentamos usar o cache primeiro, mas atualizamos em background
  if (event.request.url.includes('esm.sh') || event.request.url.includes('cdn.') || event.request.url.includes('fonts.')) {
     event.respondWith(
       caches.match(event.request).then((cachedResponse) => {
         const fetchPromise = fetch(event.request).then((networkResponse) => {
           caches.open(CACHE_NAME).then((cache) => {
             cache.put(event.request, networkResponse.clone());
           });
           return networkResponse;
         });
         return cachedResponse || fetchPromise;
       })
     );
     return;
  }

  // Para navegação e outros arquivos locais
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              // Se for um recurso externo que não estava no cache inicial (ex: imagem de perfil), tentamos cachear
              if (response && response.status === 200 && response.type === 'cors') {
                 const responseToCache = response.clone();
                 caches.open(CACHE_NAME).then((cache) => {
                   cache.put(event.request, responseToCache);
                 });
                 return response;
              }
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});