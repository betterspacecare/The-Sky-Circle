'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNotificationStore, Notification, NotificationPreferences } from '@/store/notificationStore'
import { useAlertStore } from '@/store/alertStore'
import { 
    requestNotificationPermission, 
    getNotificationPermission,
    isPushSupported,
    subscribeToPush,
    unsubscribeFromPush,
    registerServiceWorker
} from '@/lib/notifications'
import { 
    Bell, Info, Star, Calendar, Loader2, Eye, Settings, Check, 
    CheckCheck, Trash2, Trophy, MessageCircle, Heart, Users,
    Mail, Smartphone, ChevronRight, X, AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

type TabType = 'all' | 'alerts' | 'activity' | 'settings'

export default function AlertsPage() {
    const supabase = createClient()
    const [activeTab, setActiveTab] = useState<TabType>('all')
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    
    const { 
        notifications, 
        setNotifications, 
        markAsRead, 
        markAllAsRead,
        deleteNotification,
        preferences,
        setPreferences,
        setPushSubscription
    } = useNotificationStore()
    
    const { alerts, setAlerts, markAsRead: markAlertAsRead } = useAlertStore()
    
    const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default')
    const [savingPrefs, setSavingPrefs] = useState(false)

    useEffect(() => {
        const init = async () => {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
                await fetchNotifications(user.id)
                await fetchPreferences(user.id)
            }
            await fetchAlerts()
            
            // Check push permission
            setPushPermission(getNotificationPermission())
            setLoading(false)
        }
        init()
    }, [])

    const fetchNotifications = async (uid: string) => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false })
            .limit(50)

        if (!error && data) {
            setNotifications(data)
        }
    }

    const fetchAlerts = async () => {
        const { data, error } = await supabase
            .from('sky_alerts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20)

        if (!error && data) {
            const { data: { user } } = await supabase.auth.getUser()
            let readAlertIds: string[] = []
            
            if (user) {
                const { data: reads } = await supabase
                    .from('user_alert_reads')
                    .select('alert_id')
                    .eq('user_id', user.id)
                readAlertIds = reads?.map(r => r.alert_id) || []
            }

            setAlerts(data.map(alert => ({
                ...alert,
                isRead: readAlertIds.includes(alert.id)
            })))
        }
    }

    const fetchPreferences = async (uid: string) => {
        const { data } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', uid)
            .single()

        if (data) {
            setPreferences(data)
        }
    }

    const handleMarkAsRead = async (notificationId: string) => {
        markAsRead(notificationId)
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
    }

    const handleMarkAllAsRead = async () => {
        markAllAsRead()
        if (userId) {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false)
        }
    }

    const handleDeleteNotification = async (notificationId: string) => {
        deleteNotification(notificationId)
        await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)
    }

    const handleMarkAlertAsRead = async (alertId: string) => {
        markAlertAsRead(alertId)
        if (userId) {
            await supabase
                .from('user_alert_reads')
                .upsert({ user_id: userId, alert_id: alertId })
        }
    }

    const handleEnablePush = async () => {
        if (!isPushSupported()) {
            alert('Push notifications are not supported in your browser')
            return
        }

        const permission = await requestNotificationPermission()
        setPushPermission(permission)

        if (permission === 'granted') {
            const registration = await registerServiceWorker()
            if (registration) {
                const subscription = await subscribeToPush(registration)
                if (subscription) {
                    setPushSubscription(subscription)
                    await savePreference('push_enabled', true)
                }
            }
        }
    }

    const handleDisablePush = async () => {
        await unsubscribeFromPush()
        setPushSubscription(null)
        await savePreference('push_enabled', false)
    }

    const savePreference = async (key: keyof NotificationPreferences, value: boolean) => {
        setSavingPrefs(true)
        setPreferences({ [key]: value })

        if (userId) {
            await supabase
                .from('notification_preferences')
                .upsert({
                    user_id: userId,
                    [key]: value,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' })
        }
        setSavingPrefs(false)
    }

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'sky_alert': return <Star className="w-5 h-5 text-warning-100" />
            case 'event_reminder': return <Calendar className="w-5 h-5 text-primary-200" />
            case 'badge_earned': return <Trophy className="w-5 h-5 text-warning-100" />
            case 'mission_complete': return <Trophy className="w-5 h-5 text-success-100" />
            case 'comment': return <MessageCircle className="w-5 h-5 text-primary-200" />
            case 'like': return <Heart className="w-5 h-5 text-danger-100" />
            case 'follow': return <Users className="w-5 h-5 text-secondary-200" />
            default: return <Info className="w-5 h-5 text-surface-400" />
        }
    }

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'object_visibility': return <Eye className="w-5 h-5 text-primary-200" />
            case 'meteor_shower': return <Star className="w-5 h-5 text-warning-100" />
            case 'special_event': return <Calendar className="w-5 h-5 text-danger-100" />
            default: return <Info className="w-5 h-5 text-surface-400" />
        }
    }

    const unreadNotifications = notifications.filter(n => !n.is_read)
    const unreadAlerts = alerts.filter(a => !a.isRead)

    const tabs = [
        { id: 'all' as TabType, label: 'All', count: unreadNotifications.length + unreadAlerts.length },
        { id: 'alerts' as TabType, label: 'Sky Alerts', count: unreadAlerts.length },
        { id: 'activity' as TabType, label: 'Activity', count: unreadNotifications.length },
        { id: 'settings' as TabType, label: 'Settings', count: 0 },
    ]

    return (
        <div className="py-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.5rem] bg-gradient-to-br from-primary-200/20 to-danger-100/20 flex items-center justify-center">
                        <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-primary-200" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-black">Notifications</h1>
                        <p className="text-sm sm:text-base text-surface-400">Stay updated with sky events and activity</p>
                    </div>
                </div>
                
                {activeTab !== 'settings' && unreadNotifications.length > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl glass-effect hover:bg-white/10 transition-all text-xs sm:text-sm font-bold text-surface-300 hover:text-surface-50"
                    >
                        <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Mark all read
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap",
                            activeTab === tab.id
                                ? "bg-gradient-to-r from-primary-200/30 to-danger-100/20 text-surface-50"
                                : "glass-effect text-surface-400 hover:text-surface-50 hover:bg-white/10"
                        )}
                    >
                        {tab.id === 'settings' ? <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : null}
                        {tab.label}
                        {tab.count > 0 && (
                            <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-danger-100 text-white text-[10px] sm:text-xs">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-200" />
                </div>
            ) : activeTab === 'settings' ? (
                <SettingsTab 
                    preferences={preferences}
                    pushPermission={pushPermission}
                    onEnablePush={handleEnablePush}
                    onDisablePush={handleDisablePush}
                    onSavePreference={savePreference}
                    saving={savingPrefs}
                />
            ) : (
                <div className="space-y-4">
                    {/* Sky Alerts */}
                    {(activeTab === 'all' || activeTab === 'alerts') && alerts.length > 0 && (
                        <>
                            {activeTab === 'all' && (
                                <h3 className="text-xs font-black uppercase tracking-widest text-surface-500 mb-4">Sky Alerts</h3>
                            )}
                            {alerts.map(alert => (
                                <div
                                    key={alert.id}
                                    onClick={() => handleMarkAlertAsRead(alert.id)}
                                    className={cn(
                                        "group glass-effect rounded-2xl p-6 cursor-pointer transition-all hover:scale-[1.01]",
                                        !alert.isRead && "ring-1 ring-primary-200/30"
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                            !alert.isRead ? "bg-primary-200/20" : "glass-inner"
                                        )}>
                                            {getAlertIcon(alert.alert_type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-surface-50">{alert.title}</h4>
                                                {!alert.isRead && (
                                                    <span className="w-2 h-2 rounded-full bg-primary-200" />
                                                )}
                                            </div>
                                            <p className="text-surface-400 text-sm line-clamp-2">{alert.message}</p>
                                            <span className="text-xs text-surface-500 mt-2 block">
                                                {new Date(alert.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Activity Notifications */}
                    {(activeTab === 'all' || activeTab === 'activity') && notifications.length > 0 && (
                        <>
                            {activeTab === 'all' && alerts.length > 0 && (
                                <h3 className="text-xs font-black uppercase tracking-widest text-surface-500 mt-8 mb-4">Activity</h3>
                            )}
                            {notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "group glass-effect rounded-2xl p-6 transition-all hover:scale-[1.01]",
                                        !notification.is_read && "ring-1 ring-primary-200/30"
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                            !notification.is_read ? "bg-primary-200/20" : "glass-inner"
                                        )}>
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-surface-50">{notification.title}</h4>
                                                {!notification.is_read && (
                                                    <span className="w-2 h-2 rounded-full bg-primary-200" />
                                                )}
                                            </div>
                                            <p className="text-surface-400 text-sm">{notification.message}</p>
                                            <span className="text-xs text-surface-500 mt-2 block">
                                                {new Date(notification.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!notification.is_read && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id) }}
                                                    className="p-2 rounded-lg hover:bg-white/10 text-surface-400 hover:text-surface-50"
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteNotification(notification.id) }}
                                                className="p-2 rounded-lg hover:bg-danger-100/20 text-surface-400 hover:text-danger-100"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Empty State */}
                    {((activeTab === 'all' && notifications.length === 0 && alerts.length === 0) ||
                      (activeTab === 'alerts' && alerts.length === 0) ||
                      (activeTab === 'activity' && notifications.length === 0)) && (
                        <div className="text-center py-20 glass-effect rounded-3xl">
                            <Bell className="w-16 h-16 text-surface-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">All caught up!</h3>
                            <p className="text-surface-400">No notifications to show</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Settings Tab Component
function SettingsTab({ 
    preferences, 
    pushPermission, 
    onEnablePush, 
    onDisablePush,
    onSavePreference,
    saving 
}: {
    preferences: NotificationPreferences
    pushPermission: NotificationPermission | 'unsupported'
    onEnablePush: () => void
    onDisablePush: () => void
    onSavePreference: (key: keyof NotificationPreferences, value: boolean) => void
    saving: boolean
}) {
    const pushSupported = isPushSupported()

    return (
        <div className="space-y-6">
            {/* Push Notifications */}
            <div className="glass-effect rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary-200/20 flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-primary-200" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Push Notifications</h3>
                        <p className="text-surface-400 text-sm">Get instant alerts on your device</p>
                    </div>
                </div>

                {!pushSupported ? (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-warning-100/10 text-warning-100">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">Push notifications are not supported in your browser</p>
                    </div>
                ) : pushPermission === 'denied' ? (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-danger-100/10 text-danger-100">
                        <X className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">Push notifications are blocked. Please enable them in your browser settings.</p>
                    </div>
                ) : preferences.push_enabled ? (
                    <button
                        onClick={onDisablePush}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-success-100/10 hover:bg-success-100/20 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <Check className="w-5 h-5 text-success-100" />
                            <span className="font-medium text-success-100">Push notifications enabled</span>
                        </div>
                        <span className="text-sm text-surface-400">Click to disable</span>
                    </button>
                ) : (
                    <button
                        onClick={onEnablePush}
                        className="w-full flex items-center justify-between p-4 rounded-xl glass-inner hover:bg-white/10 transition-all"
                    >
                        <span className="font-medium">Enable push notifications</span>
                        <ChevronRight className="w-5 h-5 text-surface-400" />
                    </button>
                )}
            </div>

            {/* Email Notifications */}
            <div className="glass-effect rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-secondary-200/20 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-secondary-200" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Email Notifications</h3>
                        <p className="text-surface-400 text-sm">Receive updates via email</p>
                    </div>
                </div>

                <ToggleOption
                    label="Email notifications"
                    description="Receive important updates via email"
                    enabled={preferences.email_enabled}
                    onChange={(v) => onSavePreference('email_enabled', v)}
                    disabled={saving}
                />
            </div>

            {/* Notification Types */}
            <div className="glass-effect rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-6">Notification Types</h3>
                
                <div className="space-y-4">
                    <ToggleOption
                        label="Sky Alerts"
                        description="Meteor showers, eclipses, and celestial events"
                        enabled={preferences.sky_alerts}
                        onChange={(v) => onSavePreference('sky_alerts', v)}
                        disabled={saving}
                    />
                    <ToggleOption
                        label="Event Reminders"
                        description="Reminders for events you've RSVP'd to"
                        enabled={preferences.event_reminders}
                        onChange={(v) => onSavePreference('event_reminders', v)}
                        disabled={saving}
                    />
                    <ToggleOption
                        label="Badge Notifications"
                        description="When you earn new badges"
                        enabled={preferences.badge_notifications}
                        onChange={(v) => onSavePreference('badge_notifications', v)}
                        disabled={saving}
                    />
                    <ToggleOption
                        label="Mission Updates"
                        description="Mission progress and completions"
                        enabled={preferences.mission_notifications}
                        onChange={(v) => onSavePreference('mission_notifications', v)}
                        disabled={saving}
                    />
                    <ToggleOption
                        label="Social Activity"
                        description="Likes, comments, and follows"
                        enabled={preferences.social_notifications}
                        onChange={(v) => onSavePreference('social_notifications', v)}
                        disabled={saving}
                    />
                </div>
            </div>

            {/* Marketing */}
            <div className="glass-effect rounded-2xl p-6">
                <ToggleOption
                    label="Marketing Emails"
                    description="News, tips, and special offers from SkyGuild"
                    enabled={preferences.marketing_emails}
                    onChange={(v) => onSavePreference('marketing_emails', v)}
                    disabled={saving}
                />
            </div>
        </div>
    )
}

// Toggle Option Component
function ToggleOption({ 
    label, 
    description, 
    enabled, 
    onChange,
    disabled 
}: {
    label: string
    description: string
    enabled: boolean
    onChange: (value: boolean) => void
    disabled?: boolean
}) {
    return (
        <div className="flex items-center justify-between py-2">
            <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-surface-400">{description}</p>
            </div>
            <button
                onClick={() => onChange(!enabled)}
                disabled={disabled}
                className={cn(
                    "relative w-12 h-7 rounded-full transition-all",
                    enabled ? "bg-primary-200" : "bg-surface-600",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <span className={cn(
                    "absolute top-1 w-5 h-5 rounded-full bg-white transition-all",
                    enabled ? "left-6" : "left-1"
                )} />
            </button>
        </div>
    )
}
