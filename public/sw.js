// Service Worker for Fast Ship SA
// Provides offline functionality and caching

const CACHE_NAME = 'fast-ship-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/css/style.css',
  '/assets/css/responsive.css',
  '/assets/css/auth.css',
  '/assets/css/dashboard.css',
  '/assets/css/forms.css',
  '/assets/js/main.js',
  '/assets/js/auth.js',
  '/assets/js/auth-manager.js',
  '/assets/js/auth-guard.js',
  '/assets/js/language-switcher.js',
  '/assets/js/city-search-geonames.js',
  '/config/supabase-config.js',
  '/pages/auth/login.html',
  '/pages/auth/register.html',
  '/404.html'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip Supabase API calls (always fetch fresh)
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(response => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});