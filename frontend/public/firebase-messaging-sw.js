'use strict';

// Minimal service worker to handle background notifications for FCM or generic Web Push
self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    // Support both WebPush notification payloads and data-only FCM payloads
    const notification = data.notification || data.notificationOptions || {};
    const payload = data.data || data; // common FCM wrapping

    // Helper: build proxied media URL from a raw storage path or relative path
    const buildProxyUrl = (p) => {
      try {
        if (!p || typeof p !== 'string') return '';
        const trimmed = p.trim();
        // Absolute URLs are returned as-is
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        // If it's already a media/stream URL (with or without leading /api)
        if (/(^\/?api\/)?\/?media\/stream/i.test(trimmed)) {
          return trimmed.startsWith('/') ? trimmed : '/' + trimmed;
        }
        // Treat as a storage path and proxy via backend
        return `/api/media/stream?path=${encodeURIComponent(trimmed)}`;
      } catch (_) {
        return '';
      }
    };

    // Title/body: prefer explicit notification fields, then top-level, then data payload
    const title = notification.title || data.title || payload.title || 'Menu.X Notification';
    const body = notification.body || data.body || payload.body || '';

    // Prefer explicit notification fields, then payload fallbacks, then defaults
    let icon =
      notification.icon ||
      payload.icon || payload.iconUrl || payload.icon_url || payload.iconURL ||
      payload.logo || payload.logoUrl || payload.logo_url ||
      payload.picture || payload.photoUrl || payload.thumbnail ||
      '/logo/menux-logo-192x192.png';
    let image =
      notification.image ||
      payload.image || payload.imageUrl || payload.image_url ||
      undefined;
    const badge = notification.badge || payload.badge || '/logo/menux-logo-192x192.png';

    // If only raw storage paths are provided, proxy them for browser consumption
    const iconPath = payload.iconPath || payload.icon_path;
    const imagePath = payload.imagePath || payload.image_path;
    if ((!icon || icon === '') && iconPath) {
      const proxied = buildProxyUrl(iconPath);
      if (proxied) icon = proxied;
    }
    if ((!image || image === '') && imagePath) {
      const proxied = buildProxyUrl(imagePath);
      if (proxied) image = proxied;
    }

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
