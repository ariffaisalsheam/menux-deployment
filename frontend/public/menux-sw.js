/* Menu.X Service Worker for Web Push */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    // Fallback for non-JSON payloads
    data = { title: 'Menu.X Notification', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Menu.X Notification';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: data.icon || '/vite.svg',
    badge: data.badge || '/vite.svg',
    data: {
      url: (data.data && (data.data.url || data.data.click_action)) || data.click_action || '/dashboard/notifications',
      ...data.data,
    },
    vibrate: [100, 50, 100],
    requireInteraction: !!data.requireInteraction,
    tag: data.tag || undefined,
    renotify: !!data.renotify,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/dashboard/notifications';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          // If already open, focus it
          if (client.url.includes(url) || url === '/') {
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
