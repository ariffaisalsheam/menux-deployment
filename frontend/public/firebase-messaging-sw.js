'use strict';

// Minimal service worker to handle background notifications for FCM or generic Web Push
self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    // Try to read standard fields first; fallback to FCM-wrapped payloads
    const notification = data.notification || data.notificationOptions || {};
    const title = notification.title || data.title || 'Notification';
    const body = notification.body || data.body || '';

    // Preserve original payload for click handling
    const payload = data.data || data;

    // Prefer explicit notification fields, then payload fallbacks, then defaults
    const icon = notification.icon || payload.icon || '/logo/menux-logo-192x192.png';
    const image = notification.image || payload.image || undefined;
    const badge = notification.badge || payload.badge || '/logo/menux-logo-192x192.png';

    // Respect provided tag if any; otherwise leave undefined to avoid replacement/dedup
    const computedTag = (notification.tag || payload.tag) || undefined;

    const options = { body, icon, badge, data: payload };
    if (image) options.image = image;
    if (computedTag) {
      options.tag = computedTag;
      options.renotify = true; // ensure a new toast appears when replacing same tag
    }

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (e) {
    // Best-effort fallback
    event.waitUntil(
      self.registration.showNotification('Notification', { body: '' })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification?.data || {};
  const url = data.url || data.click_action || '/';

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      let client = allClients.find(c => 'focus' in c);
      if (client) {
        client.focus();
        if (url && 'navigate' in client) {
          try { await client.navigate(url); } catch (_) {}
        }
      } else {
        await clients.openWindow(url || '/');
      }
    })()
  );
});
