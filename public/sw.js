// 앱 셸(페이지·JS·CSS·아이콘)을 오프라인에서도 쓸 수 있게 하는 서비스 워커.
// 전략: 항상 네트워크를 먼저 시도하고(온라인이면 늘 최신 내용), 실패했을 때만(오프라인) 캐시로 대체한다.
// 요청이 성공할 때마다 캐시를 갱신해 두므로, 쓰면 쓸수록 오프라인 커버리지가 넓어진다.
// 로그인 API(/api/*)와 동일 출처가 아닌 요청(Firebase/Firestore 등)은 절대 캐시하지 않는다 —
// 로그인·실시간 공유 데이터는 항상 네트워크가 있어야 의미가 있다.
const CACHE = "report-helper-shell-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  );
});
