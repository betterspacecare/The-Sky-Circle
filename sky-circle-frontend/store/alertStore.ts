import { create } from 'zustand'

interface Alert {
    id: string
    title: string
    message: string
    alert_type: 'text' | 'object_visibility' | 'meteor_shower' | 'special_event'
    created_at: string
    isRead: boolean
}

interface AlertStore {
    alerts: Alert[]
    unreadCount: number
    addAlert: (alert: Alert) => void
    markAsRead: (alertId: string) => void
    setAlerts: (alerts: Alert[]) => void
}

export const useAlertStore = create<AlertStore>((set) => ({
    alerts: [],
    unreadCount: 0,
    addAlert: (alert) =>
        set((state) => ({
            alerts: [alert, ...state.alerts],
            unreadCount: state.unreadCount + 1,
        })),
    markAsRead: (alertId) =>
        set((state) => ({
            alerts: state.alerts.map((a) =>
                a.id === alertId ? { ...a, isRead: true } : a
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
        })),
    setAlerts: (alerts) =>
        set({
            alerts,
            unreadCount: alerts.filter((a) => !a.isRead).length,
        }),
}))
