// Minimal service worker for CharterHub SPA
const CACHE_NAME = 'charterhub-cache-v1';

// Skip waiting on install
self.addEventListener('install', event => {
  console.log('Service worker installed');
  event.waitUntil(self.skipWaiting());
});

// Clear old caches on activate
self.addEventListener('activate', event => {
  console.log('Service worker activated');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith('charterhub-') && cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Only handle navigation requests to provide fallback for SPA routes
self.addEventListener('fetch', event => {
  // Only intercept same-origin navigation requests (for SPA routing)
  if (event.request.mode === 'navigate' && 
      event.request.url.startsWith(self.location.origin)) {
    
    // Use a network-first strategy just for navigation
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, return index.html
          return caches.match('/index.html')
            .then(response => {
              return response || fetch('/index.html');
            });
        })
    );
  }
  // Let the browser handle all other requests normally
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