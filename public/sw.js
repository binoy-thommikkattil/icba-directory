self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', () => {
    console.log('PWA Service Worker activated');
});

// A dummy fetch listener is required by Chrome to trigger the install banner
self.addEventListener('fetch', (event) => {
    // Let the browser handle the request normally
});