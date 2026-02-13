import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Notification {
    id: string
    user_id: string
    type: 'sky_alert' | 'event_reminder' | 'badge_earned' | 'mission_complete' | 'comment' | 'like' | 'follow' | 'system'
    title: string
    message: string
    data?: Record<string, any>
    is_read: boolean
    created_at: string
}

export interface NotificationPreferences {
    push_enabled: boolean
    email_enabled: boolean
    sky_alerts: boolean
    event_reminders: boolean
    badge_notifications: boolean
    mission_notifications: boolean
    social_notifications: boolean
    marketing_emails: boolean
}

interface NotificationState {
    notifications: Notification[]
    unreadCount: number
    preferences: NotificationPreferences
    pushSubscription: PushSubscription | null
    isServiceWorkerReady: boolean
    
    // Actions
    setNotifications: (notifications: Notification[]) => void
    addNotification: (notification: Notification) => void
    markAsRead: (notificationId: string) => void
    markAllAsRead: () => void
    deleteNotification: (notificationId: string) => void
    clearAll: () => void
    setPreferences: (preferences: Partial<NotificationPreferences>) => void
    setPushSubscription: (subscription: PushSubscription | null) => void
    setServiceWorkerReady: (ready: boolean) => void
}

const defaultPreferences: NotificationPreferences = {
    push_enabled: false,
    email_enabled: true,
    sky_alerts: true,
    event_reminders: true,
    badge_notifications: true,
    mission_notifications: true,
    social_notifications: true,
    marketing_emails: false,
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            notifications: [],
            unreadCount: 0,
            preferences: defaultPreferences,
            pushSubscription: null,
            isServiceWorkerReady: false,

            setNotifications: (notifications) => set({
                notifications,
                unreadCount: notifications.filter(n => !n.is_read).length
            }),

            addNotification: (notification) => set((state) => ({
                notifications: [notification, ...state.notifications],
                unreadCount: state.unreadCount + (notification.is_read ? 0 : 1)
            })),

            markAsRead: (notificationId) => set((state) => {
                const notification = state.notifications.find(n => n.id === notificationId)
                if (!notification || notification.is_read) return state
                
                return {
                    notifications: state.notifications.map(n =>
                        n.id === notificationId ? { ...n, is_read: true } : n
                    ),
                    unreadCount: Math.max(0, state.unreadCount - 1)
                }
            }),

            markAllAsRead: () => set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, is_read: true })),
                unreadCount: 0
            })),

            deleteNotification: (notificationId) => set((state) => {
                const notification = state.notifications.find(n => n.id === notificationId)
                return {
                    notifications: state.notifications.filter(n => n.id !== notificationId),
                    unreadCount: notification && !notification.is_read 
                        ? Math.max(0, state.unreadCount - 1) 
                        : state.unreadCount
                }
            }),

            clearAll: () => set({ notifications: [], unreadCount: 0 }),

            setPreferences: (preferences) => set((state) => ({
                preferences: { ...state.preferences, ...preferences }
            })),

            setPushSubscription: (subscription) => set({ pushSubscription: subscription }),

            setServiceWorkerReady: (ready) => set({ isServiceWorkerReady: ready }),
        }),
        {
            name: 'notification-storage',
            partialize: (state) => ({ preferences: state.preferences }),
        }
    )
)
