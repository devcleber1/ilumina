const CACHE_NAME = 'ilumina-cache-v5'

const OFFLINE_URL = '/offline.html'
const API_PATH = '/api/'
const ASSETS = [
  '/',
  OFFLINE_URL,
  '/manifest.json',
  '/apple-touch-icon.png',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(keys.map(key => (key !== CACHE_NAME ? caches.delete(key) : Promise.resolve())))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return
  }

  const requestUrl = new URL(event.request.url)
  const isSameOrigin = requestUrl.origin === self.location.origin

  if (event.request.mode === 'navigate' && isSameOrigin) {
    event.respondWith(
      fetch(event.request)
        .then(response => response)
        .catch(() => caches.match(OFFLINE_URL))
    )
    return
  }

  if (!isSameOrigin) {
    return
  }

  if (requestUrl.pathname.startsWith(API_PATH)) {
    event.respondWith(fetch(event.request))
    return
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse
      }
      return fetch(event.request)
        .then(networkResponse => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse
          }
          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone))
          return networkResponse
        })
        .catch(() => caches.match(event.request))
    })
  )
})
