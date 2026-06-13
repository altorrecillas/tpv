/* Service Worker del TPV — funcionamiento sin conexión (app shell cache).
   Suba la versión de CACHE al publicar cambios para forzar la actualización. */
const CACHE = "tpv-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Instalación: precachea el "app shell"
self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

// Activación: borra cachés de versiones antiguas
self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
          .then(()=>self.clients.claim())
  );
});

// Fetch: red primero para navegación (HTML), caché primero para el resto.
// Todo cae a la caché si no hay conexión.
self.addEventListener("fetch", e=>{
  const req = e.request;
  if(req.method !== "GET") return;
  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req).then(res=>{ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(req,cp)); return res; })
                .catch(()=>caches.match("./index.html"))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit=> hit || fetch(req).then(res=>{
      const cp=res.clone(); caches.open(CACHE).then(c=>c.put(req,cp)); return res;
    }).catch(()=>hit))
  );
});
