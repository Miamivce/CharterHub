// Simple service worker for CharterHub SPA
const CACHE_NAME = 'charterhub-cache-v1';

// On install, skip waiting to activate immediately
self.addEventListener('install', event => {
  console.log('Service worker installed');
  event.waitUntil(self.skipWaiting());
});

// On activate, clear any problematic caches
self.addEventListener('activate', event => {
  console.log('Service worker activated');
  
  // Clear any old caches that might be causing issues
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith('charterhub-') && cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first strategy for all requests
// This ensures users always get the latest content unless offline
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Special handling for HTML navigation requests
  const isHTMLRequest = event.request.mode === 'navigate' || 
                        (event.request.method === 'GET' && 
                         event.request.headers.get('accept').includes('text/html'));
  
  if (isHTMLRequest) {
    // For HTML requests, always try network first, then fall back to index.html in cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the successful response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, return index.html from cache or network
          return caches.match('/index.html') || fetch('/index.html');
        })
    );
    return;
  }
  
  // For assets, try network first, then cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache the asset if it's a successful response
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try to get it from the cache
        return caches.match(event.request);
      })
  );
});

// Handle message events (like skip waiting)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push event - handle notifications
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        data: data.url,
      })
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    );
  }
}); 