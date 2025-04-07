const CACHE_NAME = 'charterhub-admin-v1';
const RUNTIME_CACHE = 'charterhub-runtime';
const CACHE_VERSION = '1.0.0';

const CURRENT_CACHES = {
  static: `${CACHE_NAME}-static-v${CACHE_VERSION}`,
  runtime: `${CACHE_NAME}-runtime-v${CACHE_VERSION}`,
};

// Resources to cache
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/icons/*',
];

// Cache duration in milliseconds
const CACHE_DURATION = {
  static: 7 * 24 * 60 * 60 * 1000, // 7 days
  runtime: 60 * 60 * 1000, // 1 hour
};

// Install event - precache static resources
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CURRENT_CACHES.static)
        .then(cache => cache.addAll(PRECACHE_URLS))
        .catch(error => {
          console.error('Pre-cache failed:', error);
          // Continue installation even if pre-cache fails
          return self.skipWaiting();
        }),
      self.skipWaiting(),
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Delete old cache versions
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!Object.values(CURRENT_CACHES).includes(cacheName)) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Clear old runtime cache entries
      caches.open(CURRENT_CACHES.runtime).then(cache => {
        return cache.keys().then(requests => {
          return Promise.all(
            requests.map(request => {
              return cache.match(request).then(response => {
                if (response && response.headers.get('date')) {
                  const date = new Date(response.headers.get('date'));
                  if (Date.now() - date.getTime() > CACHE_DURATION.runtime) {
                    return cache.delete(request);
                  }
                }
              });
            })
          );
        });
      }),
      // Claim clients
      self.clients.claim(),
    ])
  );
});

// Helper function to determine if a request should be cached
const shouldCache = (request) => {
  // Don't cache:
  // 1. Non-GET requests
  if (request.method !== 'GET') return false;
  
  // 2. API requests
  if (request.url.includes('/wp-json/')) return false;
  
  // 3. Authentication-related requests
  if (request.url.includes('/login') || request.url.includes('/auth')) return false;
  
  // 4. Admin routes
  if (request.url.includes('/admin')) return false;

  // 5. Query parameters (except for assets)
  if (!request.url.includes('/assets/') && request.url.includes('?')) return false;

  return true;
};

// Helper function to determine cache strategy based on request
const getCacheStrategy = (request) => {
  // Use cache-first for assets
  if (request.url.includes('/assets/')) {
    return 'cache-first';
  }
  
  // Use network-first for HTML documents
  if (request.headers.get('Accept').includes('text/html')) {
    return 'network-first';
  }
  
  // Use stale-while-revalidate for everything else
  return 'stale-while-revalidate';
};

// Fetch event - handle requests
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const strategy = getCacheStrategy(event.request);

  switch (strategy) {
    case 'cache-first':
      event.respondWith(
        caches.match(event.request)
          .then(response => response || fetch(event.request))
          .catch(() => fetch(event.request))
      );
      break;

    case 'network-first':
      event.respondWith(
        fetch(event.request)
          .then(response => {
            if (shouldCache(event.request)) {
              const clonedResponse = response.clone();
              caches.open(CURRENT_CACHES.runtime)
                .then(cache => cache.put(event.request, clonedResponse));
            }
            return response;
          })
          .catch(() => caches.match(event.request))
      );
      break;

    case 'stale-while-revalidate':
      event.respondWith(
        caches.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request).then(response => {
            if (shouldCache(event.request)) {
              const clonedResponse = response.clone();
              caches.open(CURRENT_CACHES.runtime)
                .then(cache => cache.put(event.request, clonedResponse));
            }
            return response;
          });

          return cachedResponse || fetchPromise;
        })
      );
      break;
  }
});

// Message event - handle cache updates
self.addEventListener('message', event => {
  if (event.data.type === 'SKIP_WAITING') {
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