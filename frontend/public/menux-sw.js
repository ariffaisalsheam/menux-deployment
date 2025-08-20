/* Legacy Menu.X SW shim → delegate to branded FCM SW */
self.addEventListener('install', (event) => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });

// Use the unified, branded handler for push/click
try {
  importScripts('/firebase-messaging-sw.js');
} catch (e) {
  // no-op; if import fails, there will be no push handling
}
