'use strict';

// Minimal service worker to handle background notifications for FCM or generic Web Push
self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    // Support both WebPush notification payloads and data-only FCM payloads
    const notification = data.notification || data.notificationOptions || {};
    const payload = data.data || data; // common FCM wrapping

    // Title/body: prefer explicit notification fields, then top-level, then data payload
    const title = notification.title || data.title || payload.title || 'Menu.X Notification';
    const body = notification.body || data.body || payload.body || '';

    // Prefer explicit notification fields, then payload fallbacks, then defaults
    const icon =
      notification.icon ||
      payload.icon || payload.iconUrl || payload.icon_url || payload.iconURL ||
      payload.logo || payload.logoUrl || payload.logo_url ||
      payload.picture || payload.photoUrl || payload.thumbnail ||
      '/logo/menux-logo-192x192.png';
    const image =
      notification.image ||
      payload.image || payload.imageUrl || payload.image_url ||
      payload.imagePath || payload.image_path ||
      undefined;
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
  const url = data.url || data.click_action || data.link || '/dashboard/notifications';

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
