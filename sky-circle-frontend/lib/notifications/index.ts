'use client'

// Web Push Notification Service
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

export interface NotificationPayload {
    title: string
    body: string
    icon?: string
    badge?: string
    tag?: string
    data?: Record<string, any>
    actions?: { action: string; title: string }[]
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
    return typeof window !== 'undefined' && 
           'serviceWorker' in navigator && 
           'PushManager' in window &&
           'Notification' in window
}

// Get current notification permission status
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
    if (!isPushSupported()) return 'unsupported'
    return Notification.permission
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!isPushSupported()) {
        throw new Error('Push notifications are not supported')
    }
    return await Notification.requestPermission()
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!isPushSupported()) return null
    
    try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered:', registration.scope)
        return registration
    } catch (error) {
        console.error('Service Worker registration failed:', error)
        return null
    }
}

// Subscribe to push notifications
export async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
    try {
        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription()
        
        if (subscription) {
            return subscription
        }

        // Subscribe with VAPID key
        if (!VAPID_PUBLIC_KEY) {
            console.warn('VAPID public key not configured')
            return null
        }

        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey.buffer as ArrayBuffer
        })

        return subscription
    } catch (error) {
        console.error('Push subscription failed:', error)
        return null
    }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
    try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        
        if (subscription) {
            await subscription.unsubscribe()
            return true
        }
        return false
    } catch (error) {
        console.error('Unsubscribe failed:', error)
        return false
    }
}

// Show local notification (for in-app notifications)
export function showLocalNotification(payload: NotificationPayload): void {
    if (!isPushSupported() || Notification.permission !== 'granted') return

    new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192.png',
        badge: payload.badge || '/icons/badge-72.png',
        tag: payload.tag,
        data: payload.data
    })
}

// Helper: Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}
