// Minimal service worker for CharterHub SPA
const CACHE_NAME = 'charterhub-cache-v1';

// Skip waiting on install
self.addEventListener('install', event => {
  console.log('Service worker installed');
  self.skipWaiting();
});

// Clear old caches on activate
self.addEventListener('activate', event => {
  console.log('Service worker activated');
  
  // Clear any old caches
  caches.keys().then(cacheNames => {
    return Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  });
  
  // Unregister this service worker to prevent navigation issues
  self.registration.unregister()
    .then(() => {
      console.log('Service worker unregistered to prevent navigation interference');
    });
});

// Don't intercept any fetch events
// Let the browser and Vercel handle all routing

// Unregister this service worker and any previous versions
// This is to prevent any interference with navigation
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'UNREGISTER') {
    self.registration.unregister()
      .then(() => {
        console.log('Service worker unregistered');
      });
  }
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