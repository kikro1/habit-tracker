import { supabase } from '../lib/supabase'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

/** Registers (or reuses) a Web Push subscription for this browser and saves
 * it against the current user, so the server can send real push
 * notifications even when the app isn't open. No-ops if unsupported. */
export async function ensurePushSubscription(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return { error: null }

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapidKey) return { error: new Error('Push is not configured for this deployment.') }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { error: new Error('Notifications permission was not granted.') }
  }

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
  }

  const json = subscription.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    { onConflict: 'endpoint' }
  )

  return { error }
}
