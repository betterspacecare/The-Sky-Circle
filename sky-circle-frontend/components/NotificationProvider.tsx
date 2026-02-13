'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNotificationStore, Notification } from '@/store/notificationStore'
import { useAlertStore } from '@/store/alertStore'
import { 
    registerServiceWorker, 
    subscribeToPush, 
    isPushSupported,
    showLocalNotification 
} from '@/lib/notifications'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface NotificationProviderProps {
    children: React.ReactNode
    userId?: string
}

export default function NotificationProvider({ children, userId }: NotificationProviderProps) {
    const supabase = createClient()
    const { 
        setNotifications, 
        addNotification, 
        preferences,
        setPushSubscription,
        setServiceWorkerReady 
    } = useNotificationStore()
    const { setAlerts, addAlert } = useAlertStore()

    // Initialize service worker and push subscription
    useEffect(() => {
        if (!isPushSupported()) return

        const initPush = async () => {
            const registration = await registerServiceWorker()
            if (registration) {
                setServiceWorkerReady(true)
                
                if (preferences.push_enabled) {
                    const subscription = await subscribeToPush(registration)
                    if (subscription) {
                        setPushSubscription(subscription)
                        // Save subscription to database
                        await savePushSubscription(subscription)
                    }
                }
            }
        }

        initPush()
    }, [preferences.push_enabled])

    // Save push subscription to database
    const savePushSubscription = async (subscription: PushSubscription) => {
        if (!userId) return

        try {
            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: userId,
                    endpoint: subscription.endpoint,
                    p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
                    auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                })

            if (error) console.error('Error saving push subscription:', error)
        } catch (err) {
            console.error('Error saving push subscription:', err)
        }
    }

    // Fetch initial notifications
    useEffect(() => {
        if (!userId) return

        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50)

            if (!error && data) {
                setNotifications(data)
            }
        }

        fetchNotifications()
    }, [userId])

    // Fetch sky alerts
    useEffect(() => {
        const fetchAlerts = async () => {
            const { data, error } = await supabase
                .from('sky_alerts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20)

            if (!error && data) {
                // Get read status for current user
                let readAlertIds: string[] = []
                if (userId) {
                    const { data: reads } = await supabase
                        .from('user_alert_reads')
                        .select('alert_id')
                        .eq('user_id', userId)
                    
                    readAlertIds = reads?.map(r => r.alert_id) || []
                }

                const alertsWithReadStatus = data.map(alert => ({
                    ...alert,
                    isRead: readAlertIds.includes(alert.id)
                }))

                setAlerts(alertsWithReadStatus)
            }
        }

        fetchAlerts()
    }, [userId])

    // Subscribe to real-time notifications
    useEffect(() => {
        if (!userId) return

        // Subscribe to new notifications
        const notificationChannel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload: RealtimePostgresChangesPayload<Notification>) => {
                    const newNotification = payload.new as Notification
                    addNotification(newNotification)

                    // Show push notification if enabled
                    if (preferences.push_enabled) {
                        showLocalNotification({
                            title: newNotification.title,
                            body: newNotification.message,
                            tag: newNotification.type,
                            data: newNotification.data
                        })
                    }
                }
            )
            .subscribe()

        // Subscribe to new sky alerts
        const alertChannel = supabase
            .channel('sky_alerts')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'sky_alerts'
                },
                (payload: RealtimePostgresChangesPayload<any>) => {
                    const newAlert = payload.new
                    addAlert({
                        ...newAlert,
                        isRead: false
                    })

                    // Show push notification for sky alerts if enabled
                    if (preferences.push_enabled && preferences.sky_alerts) {
                        showLocalNotification({
                            title: `🌟 ${newAlert.title}`,
                            body: newAlert.message,
                            tag: 'sky-alert',
                            data: { type: 'sky_alert', alertId: newAlert.id }
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(notificationChannel)
            supabase.removeChannel(alertChannel)
        }
    }, [userId, preferences.push_enabled, preferences.sky_alerts])

    return <>{children}</>
}
