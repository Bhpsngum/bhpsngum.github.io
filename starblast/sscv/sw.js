const CACHE_NAME = "SSCVOffline-v3";
const PRECACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./sscv.json",
  "./icon.jpg",
  "./favicon.jpg",

  "https://cdn.jsdelivr.net/gh/jquery/jquery/dist/jquery.min.js",
  "https://unpkg.com/json5@2/dist/index.min.js",
  "https://cdn.jsdelivr.net/gh/Bhpsngum/js2coffee@master/dist/js2coffee.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.20/theme/material-darker.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/javascript/javascript.min.js"
];

const tryPut = async (req, res) => {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(req, res);
  } catch (_) {}
};

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(PRECACHE.map(async (u) => {
      try {
        const res = await fetch(u, { cache: "no-cache" });
        if (res.ok || res.type === "opaque") await cache.put(u, res);
      } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    const fetchPromise = fetch(event.request)
      .then((res) => {
        if (res && (res.ok || res.type === "opaque")) tryPut(event.request, res.clone());
        return res;
      })
      .catch(() => null);

    return cached || (await fetchPromise) || new Response("Offline", { status: 503 });
  })());
});
