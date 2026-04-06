/* 离线缓存。发布新版本后请修改 CACHE 名称以使用户拉取新资源 */
const CACHE = "time-on-your-side-app-v1";
const PRECACHE = [
  "./index.html",
  "./app.js",
  "./styles.css",
  "./manifest.json",
  "./icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.all(
          PRECACHE.map((url) =>
            cache.add(url).catch(() => {
              /* 单项失败不阻断安装 */
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const req = event.request;
  try {
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;
  } catch (_) {
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          const accept = req.headers.get("accept") || "";
          if (req.mode === "navigate" || accept.includes("text/html")) {
            return caches.match("./index.html");
          }
        });
    })
  );
});
