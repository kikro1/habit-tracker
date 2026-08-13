import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'

self.skipWaiting()
cleanupOutdatedCaches()

// App shell + build assets, injected by vite-plugin-pwa at build time.
precacheAndRoute(self.__WB_MANIFEST)

// Best-effort offline reads: serve the last-known habits/logs response
// when the network is unavailable.
registerRoute(
  ({ url }) => url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/rest/v1/'),
  new NetworkFirst({ cacheName: 'supabase-data', networkTimeoutSeconds: 4 })
)

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts' })
)

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// --- Push notifications ---------------------------------------------------

self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Field Log', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Field Log', {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: payload.tag,
      data: { url: payload.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      return self.clients.openWindow(targetUrl)
    })
  )
})
