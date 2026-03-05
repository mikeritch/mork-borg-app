const CACHE_VERSION = "2026-03-05-v2";
const APP_SHELL_CACHE = `cr-app-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `cr-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `cr-images-${CACHE_VERSION}`;
const IMAGE_CACHE_MAX_ENTRIES = 40;

const APP_SHELL_URLS = [
  "/",
  "/index.html",
  "/styles.css?v=20260305-cache-iter-2",
  "/app.js?v=20260305-cache-iter-2",
  "/dice.js?v=20260226-local-dice-modules-fix1",
  "/assets/vendor/lucide-0.468.0.min.js",
  "/assets/vendor/three-0.161.0.module.js",
  "/assets/vendor/cannon-es-0.20.0.module.js",
  "/assets/fonts/Cinzel-500-700-latin.woff2",
  "/assets/fonts/CormorantGaramond-400-700-latin.woff2",
  "/assets/fonts/UnifrakturCook-700-latin.woff2",
  "/assets/logos/CRLogo.webp",
  "/assets/logos/CRLogo-desktop.webp",
  "/assets/logos/CRLogo-mobile.webp",
  "/assets/logos/CRLogoLight-desktop.webp",
  "/assets/logos/CRLogoLight-mobile.webp",
  "/assets/logos/CompWith_MORKBORG_horiz.svg",
  "/offline.html",
  "/manifest.webmanifest",
  "/assets/pwa/icon-192.png",
  "/assets/pwa/icon-512.png",
  "/assets/pwa/icon-512-maskable.png",
  "/assets/pwa/apple-touch-icon.png",
];
const APP_SHELL_URL_SET = new Set(APP_SHELL_URLS);

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppShell());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const expected = new Set([APP_SHELL_CACHE, RUNTIME_CACHE, IMAGE_CACHE]);
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (!expected.has(key)) {
            return caches.delete(key);
          }
          return Promise.resolve(false);
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  const appShellKey = appShellCacheKeyFor(url);
  if (appShellKey) {
    event.respondWith(cacheFirstAppShell(request, appShellKey));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  const destination = request.destination;
  if (destination === "script" || destination === "style" || destination === "font" || destination === "worker") {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  if (destination === "image") {
    event.respondWith(cacheFirstWithLimit(request, IMAGE_CACHE, IMAGE_CACHE_MAX_ENTRIES));
    return;
  }

  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});

function appShellCacheKeyFor(url) {
  const pathWithSearch = `${url.pathname}${url.search}`;
  if (APP_SHELL_URL_SET.has(pathWithSearch)) {
    return pathWithSearch;
  }
  if (APP_SHELL_URL_SET.has(url.pathname)) {
    return url.pathname;
  }
  return null;
}

async function cacheFirstAppShell(request, cacheKey) {
  const cache = await caches.open(APP_SHELL_CACHE);
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      await cache.put(cacheKey, response.clone());
    }
    return response;
  } catch (_error) {
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain; charset=UTF-8" },
    });
  }
}

async function handleNavigationRequest(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (_error) {
    const offlineFallback = await caches.match("/offline.html");
    if (offlineFallback) {
      return offlineFallback;
    }
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain; charset=UTF-8" },
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then(async (response) => {
      if (isCacheableResponse(response)) {
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    networkFetch.catch(() => null);
    return cached;
  }

  const networkResponse = await networkFetch;
  if (networkResponse) {
    return networkResponse;
  }

  return new Response("Offline", {
    status: 503,
    statusText: "Service Unavailable",
    headers: { "Content-Type": "text/plain; charset=UTF-8" },
  });
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (_error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain; charset=UTF-8" },
    });
  }
}

async function cacheFirstWithLimit(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      await cache.put(request, response.clone());
      await trimCache(cache, maxEntries);
    }
    return response;
  } catch (_error) {
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain; charset=UTF-8" },
    });
  }
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length <= maxEntries) {
    return;
  }

  const overflow = keys.length - maxEntries;
  await Promise.all(
    keys.slice(0, overflow).map((key) => cache.delete(key))
  );
}

function isCacheableResponse(response) {
  return Boolean(response && response.ok && (response.type === "basic" || response.type === "default"));
}

async function precacheAppShell() {
  const cache = await caches.open(APP_SHELL_CACHE);
  const failures = [];

  for (const url of APP_SHELL_URLS) {
    try {
      const response = await fetch(new Request(url, { cache: "no-cache" }));
      if (!isCacheableResponse(response)) {
        failures.push(`${url} (${response.status} ${response.statusText})`);
        continue;
      }
      await cache.put(url, response.clone());
    } catch (error) {
      failures.push(`${url} (${error instanceof Error ? error.message : String(error)})`);
    }
  }

  if (failures.length > 0) {
    console.warn("[sw] Precache completed with failures:", failures);
  }
}
