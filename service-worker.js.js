const CACHE_NAME = "lama-laundry-v1";

const urlsToCache = [
  "/",
  "/admin/login.html",
  "/assets/css/style.css",
  "/assets/js/login.js",
  "/assets/images/logo.png",
  "/assets/images/favicon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});