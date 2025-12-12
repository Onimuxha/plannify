// public/sw.js - Complete Service Worker with Caching + Notifications

const CACHE_NAME = "wexly-v1";
const urlsToCache = [
  "/",
  "/manifest.json",
  "/icon-192x192.jpg",
  "/icon-512x512.jpg",
];

// ============================================
// INSTALLATION & CACHING
// ============================================

self.addEventListener("install", (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ============================================
// FETCH HANDLING (Network First, Cache Fallback)
// ============================================

self.addEventListener("fetch", (event) => {
  // Don't cache POST, PUT, DELETE requests
  if (event.request.method !== 'GET') {
    console.log('[SW] Skipping cache for non-GET request:', event.request.method);
    return;
  }

  // Don't cache chrome extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Don't cache API calls or dynamic routes (optional - adjust as needed)
  if (event.request.url.includes('/api/') || event.request.url.includes('/_next/data/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone the response before caching
        const clone = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone).catch((err) => {
            console.warn('[SW] Failed to cache:', event.request.url, err);
          });
        });
        
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Serving from cache:', event.request.url);
            return cachedResponse;
          }
          // Return offline message
          return new Response('Offline - Content not cached', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          });
        });
      })
  );
});

// ============================================
// BACKGROUND NOTIFICATIONS
// ============================================

// Store for scheduled notifications
const scheduledNotifications = new Map();

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { id, title, body, scheduledTime } = event.data;
    scheduleNotification(id, title, body, scheduledTime);
  } else if (event.data && event.data.type === 'CANCEL_NOTIFICATION') {
    cancelScheduledNotification(event.data.id);
  } else if (event.data && event.data.type === 'GET_SCHEDULED') {
    // Send back list of scheduled notifications
    event.ports[0].postMessage({
      scheduled: Array.from(scheduledNotifications.keys())
    });
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function scheduleNotification(id, title, body, scheduledTime) {
  // Cancel existing notification with same ID
  cancelScheduledNotification(id);

  const now = Date.now();
  const triggerTime = new Date(scheduledTime).getTime();
  const delay = triggerTime - now;

  console.log(`[SW] 📅 Scheduling notification "${title}"`);
  console.log(`[SW] ⏰ Scheduled for: ${new Date(scheduledTime).toLocaleString()}`);
  console.log(`[SW] ⏱️  Will trigger in: ${Math.round(delay / 1000)} seconds`);

  if (delay <= 0) {
    // Send immediately if time has passed
    console.log('[SW] ⚡ Time has passed, sending immediately');
    showNotification(title, body, id);
    return;
  }

  // Schedule for future (max timeout is ~24.8 days)
  if (delay > 2147483647) {
    console.warn('[SW] ⚠️  Delay too long, capping at max timeout');
    return;
  }

  const timeoutId = setTimeout(() => {
    console.log(`[SW] 🔔 Triggering scheduled notification: ${title}`);
    showNotification(title, body, id);
    scheduledNotifications.delete(id);
  }, delay);

  scheduledNotifications.set(id, {
    timeoutId,
    title,
    body,
    scheduledTime,
  });

  console.log(`[SW] ✅ Total scheduled: ${scheduledNotifications.size} notifications`);
}

function cancelScheduledNotification(id) {
  const notification = scheduledNotifications.get(id);
  if (notification) {
    clearTimeout(notification.timeoutId);
    scheduledNotifications.delete(id);
    console.log(`[SW] 🚫 Cancelled notification: ${id}`);
  }
}

function showNotification(title, body, tag) {
  console.log(`[SW] 🔔 Showing notification: ${title}`);
  
  const options = {
    body: body,
    icon: '/icon-192x192.jpg',
    badge: '/icon-192x192.jpg',
    vibrate: [200, 100, 200, 100, 200],
    tag: tag || 'activity-reminder',
    requireInteraction: true,
    silent: false,
    actions: [
      { action: 'open', title: '📱 Open App' },
      { action: 'close', title: '✖️ Dismiss' }
    ],
    data: {
      dateOfArrival: Date.now(),
      url: '/',
    }
  };

  self.registration.showNotification(title, options)
    .then(() => {
      console.log('[SW] ✅ Notification shown successfully');
    })
    .catch((error) => {
      console.error('[SW] ❌ Error showing notification:', error);
    });
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 👆 Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open or focus the app
  event.waitUntil(
    self.clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      // If app is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' || client.url.includes(self.registration.scope)) {
          console.log('[SW] 🎯 Focusing existing window');
          return client.focus();
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        console.log('[SW] 🪟 Opening new window');
        return self.clients.openWindow('/');
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] ❌ Notification closed:', event.notification.tag);
});

// Log when service worker is ready
console.log('[SW] 🚀 Service Worker loaded and ready for notifications!');