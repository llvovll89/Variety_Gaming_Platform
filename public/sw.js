/*
 * GH ARCADE service worker: makes the site installable and lets games you have already opened
 * start again without a connection. Pages always try the network first, so a new deploy is
 * picked up on the next visit; hashed build files never change, so they are served from cache.
 */
const VERSION = 'v1';
// The shell has its own version: v2 drops shells poisoned by v1, which stored any navigated file
// (a .txt licence, an image) as the app, while the build and media caches stay for offline play.
const SHELL = 'gh-shell-v2';
const BUILD = `gh-build-${VERSION}`;
const MEDIA = `gh-media-${VERSION}`;
const LIMITS = { [BUILD]: 160, [MEDIA]: 220 };

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(cache => cache.add('/')).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = [SHELL, BUILD, MEDIA];
    for (const name of await caches.keys()) if (name.startsWith('gh-') && !keep.includes(name)) await caches.delete(name);
    await self.clients.claim();
  })());
});

async function trim(name) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (const request of keys.slice(0, Math.max(0, keys.length - LIMITS[name]))) await cache.delete(request);
}

async function store(name, request, response) {
  if (!response || !response.ok || response.type !== 'basic') return;
  const cache = await caches.open(name);
  await cache.put(request, response);
  if (LIMITS[name]) await trim(name);
}

/** Only these paths are the app; any other navigation (a licence file, an image in a new tab) is left to the network. */
function isAppPage(pathname) {
  return pathname === '/' || pathname === '/index.html' || pathname.startsWith('/play/');
}

function isHtml(response) {
  return (response.headers.get('content-type') ?? '').includes('text/html');
}

/** Every page (/ and /play/<id>) is the same app shell. */
async function page(request) {
  try {
    const response = await fetch(request);
    if (response.ok && isHtml(response)) await store(SHELL, '/', response.clone());
    return response;
  } catch {
    return (await caches.match('/', { cacheName: SHELL })) ?? Response.error();
  }
}

async function cacheFirst(name, request) {
  const hit = await caches.match(request, { cacheName: name });
  if (hit) return hit;
  const response = await fetch(request);
  await store(name, request, response.clone());
  return response;
}

/** Art and fonts keep their names between deploys, so show the cached copy and refresh it quietly. */
async function staleWhileRevalidate(event, name) {
  const hit = await caches.match(event.request, { cacheName: name });
  const refresh = fetch(event.request).then(async response => { await store(name, event.request, response.clone()); return response; });
  if (hit) { event.waitUntil(refresh.catch(() => {})); return hit; }
  return refresh;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    if (isAppPage(url.pathname)) event.respondWith(page(request));
    return;
  }
  if (url.pathname.startsWith('/assets/')) { event.respondWith(cacheFirst(BUILD, request)); return; }
  if (/^\/(art|fonts|icons)\//.test(url.pathname) || /\.(svg|webmanifest)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event, MEDIA));
  }
});
