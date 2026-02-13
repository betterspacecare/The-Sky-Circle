// Service Worker for Push Notifications
const CACHE_NAME = 'sky-circle-v1'

// Install event
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...')
    self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker activated')
    event.waitUntil(clients.claim())
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
    console.log('Push notification received:', event)

    let data = {
        title: 'Sky Circle',
        body: 'You have a new notification',
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: 'default',
        data: {}
    }

    if (event.data) {
        try {
            const payload = event.data.json()
            data = { ...data, ...payload }
        } catch (e) {
            data.body = event.data.text()
        }
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        tag: data.tag,
        data: data.data,
        vibrate: [100, 50, 100],
        actions: data.actions || [
            { action: 'open', title: 'Open' },
            { action: 'dismiss', title: 'Dismiss' }
        ],
        requireInteraction: data.requireInteraction || false
    }

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event)
    event.notification.close()

    const action = event.action
    const data = event.notification.data || {}

    let url = '/dashboard/alerts'

    // Handle different notification types
    if (data.type === 'event') {
        url = `/dashboard/events/${data.eventId}`
    } else if (data.type === 'mission') {
        url = '/dashboard/missions'
    } else if (data.type === 'badge') {
        url = '/dashboard/profile'
    } else if (data.type === 'community') {
        url = '/dashboard/community'
    } else if (data.url) {
        url = data.url
    }

    if (action === 'dismiss') {
        return
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Focus existing window if available
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(url)
                        return client.focus()
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(url)
                }
            })
    )
})

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-notifications') {
        event.waitUntil(syncNotifications())
    }
})

async function syncNotifications() {
    // Sync any pending notifications when back online
    console.log('Syncing notifications...')
}
