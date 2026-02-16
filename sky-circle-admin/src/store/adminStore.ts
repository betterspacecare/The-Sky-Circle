import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, Observation, Badge, Event, Mission, Post, SkyAlert, Referral, DashboardStats, UserGear, Follow, Interest, UserInterest, Webhook, WebhookLog, WebhookEvent, ApiKey, ApiKeyLog, ApiKeyUsageStats } from '../types/database.types'

interface AdminState {
    // Data
    users: User[]
    observations: Observation[]
    badges: Badge[]
    events: Event[]
    missions: Mission[]
    posts: Post[]
    alerts: SkyAlert[]
    referrals: Referral[]
    stats: DashboardStats | null
    
    // Social Features Data
    gears: UserGear[]
    follows: Follow[]
    interests: Interest[]
    userInterests: UserInterest[]
    
    // Webhook Data
    webhooks: Webhook[]
    webhookLogs: WebhookLog[]
    
    // API Keys Data
    apiKeys: ApiKey[]
    apiKeyLogs: ApiKeyLog[]
    apiKeyStats: ApiKeyUsageStats[]

    // Loading states
    isLoading: boolean

    // Actions
    fetchStats: () => Promise<void>
    fetchUsers: () => Promise<void>
    fetchObservations: () => Promise<void>
    fetchBadges: () => Promise<void>
    fetchEvents: () => Promise<void>
    fetchMissions: () => Promise<void>
    fetchPosts: () => Promise<void>
    fetchAlerts: () => Promise<void>
    fetchReferrals: () => Promise<void>
    
    // Social Features Actions
    fetchGears: () => Promise<void>
    fetchFollows: () => Promise<void>
    fetchInterests: () => Promise<void>
    fetchUserInterests: () => Promise<void>
    
    // Webhook Actions
    fetchWebhooks: () => Promise<void>
    fetchWebhookLogs: (webhookId?: string) => Promise<void>
    
    // API Keys Actions
    fetchApiKeys: () => Promise<void>
    fetchApiKeyLogs: (apiKeyId?: string) => Promise<void>
    fetchApiKeyStats: () => Promise<void>

    // CRUD operations
    updateUser: (id: string, data: Partial<User>) => Promise<{ error: string | null }>
    deleteUser: (id: string) => Promise<{ error: string | null }>
    
    createBadge: (data: Omit<Badge, 'id' | 'created_at'>) => Promise<{ error: string | null }>
    updateBadge: (id: string, data: Partial<Badge>) => Promise<{ error: string | null }>
    deleteBadge: (id: string) => Promise<{ error: string | null }>

    createEvent: (data: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error: string | null }>
    updateEvent: (id: string, data: Partial<Event>) => Promise<{ error: string | null }>
    deleteEvent: (id: string) => Promise<{ error: string | null }>

    createMission: (data: Omit<Mission, 'id' | 'created_at'>, requirements: { object_name: string; category: string }[]) => Promise<{ error: string | null }>
    updateMission: (id: string, data: Partial<Mission>) => Promise<{ error: string | null }>
    deleteMission: (id: string) => Promise<{ error: string | null }>

    createAlert: (data: Omit<SkyAlert, 'id' | 'created_at'>) => Promise<{ error: string | null }>
    deleteAlert: (id: string) => Promise<{ error: string | null }>

    moderatePost: (id: string, action: 'approve' | 'delete') => Promise<{ error: string | null }>
    
    // Social Features CRUD
    deleteGear: (id: string) => Promise<{ error: string | null }>
    deleteFollow: (id: string) => Promise<{ error: string | null }>
    createInterest: (data: Omit<Interest, 'id' | 'created_at'>) => Promise<{ error: string | null }>
    updateInterest: (id: string, data: Partial<Interest>) => Promise<{ error: string | null }>
    deleteInterest: (id: string) => Promise<{ error: string | null }>
    deleteUserInterest: (id: string) => Promise<{ error: string | null }>
    
    // Webhook CRUD
    createWebhook: (data: Omit<Webhook, 'id' | 'created_at' | 'updated_at' | 'last_triggered_at' | 'last_success_at' | 'last_error' | 'retry_count' | 'status'>) => Promise<{ error: string | null }>
    updateWebhook: (id: string, data: Partial<Webhook>) => Promise<{ error: string | null }>
    deleteWebhook: (id: string) => Promise<{ error: string | null }>
    testWebhook: (id: string) => Promise<{ error: string | null; success?: boolean }>
    clearWebhookLogs: (webhookId: string) => Promise<{ error: string | null }>
    
    // API Keys CRUD
    createApiKey: (data: { name: string; description?: string; permissions?: string[]; expires_at?: string }) => Promise<{ error: string | null; apiKey?: string }>
    updateApiKey: (id: string, data: Partial<ApiKey>) => Promise<{ error: string | null }>
    deleteApiKey: (id: string) => Promise<{ error: string | null }>
    regenerateApiKey: (id: string) => Promise<{ error: string | null; apiKey?: string }>
}

export const useAdminStore = create<AdminState>((set, get) => ({
    users: [],
    observations: [],
    badges: [],
    events: [],
    missions: [],
    posts: [],
    alerts: [],
    referrals: [],
    stats: null,
    gears: [],
    follows: [],
    interests: [],
    userInterests: [],
    webhooks: [],
    webhookLogs: [],
    apiKeys: [],
    apiKeyLogs: [],
    apiKeyStats: [],
    isLoading: false,

    fetchStats: async () => {
        set({ isLoading: true })
        
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        const [users, observations, events, missions, posts, newUsers, newObs, follows, gears, interests] = await Promise.all([
            supabase.from('users').select('id', { count: 'exact' }),
            supabase.from('observations').select('id', { count: 'exact' }),
            supabase.from('events').select('id', { count: 'exact' }),
            supabase.from('missions').select('id', { count: 'exact' }).eq('is_active', true),
            supabase.from('posts').select('id', { count: 'exact' }).eq('is_reported', true).eq('is_deleted', false),
            supabase.from('users').select('id', { count: 'exact' }).gte('created_at', weekAgo.toISOString()),
            supabase.from('observations').select('id', { count: 'exact' }).gte('created_at', weekAgo.toISOString()),
            supabase.from('follows').select('id', { count: 'exact' }),
            supabase.from('user_gears').select('id', { count: 'exact' }),
            supabase.from('interests').select('id', { count: 'exact' }),
        ])

        set({
            stats: {
                totalUsers: users.count || 0,
                totalObservations: observations.count || 0,
                totalEvents: events.count || 0,
                activeMissions: missions.count || 0,
                reportedPosts: posts.count || 0,
                newUsersThisWeek: newUsers.count || 0,
                observationsThisWeek: newObs.count || 0,
                totalFollows: follows.count || 0,
                totalGears: gears.count || 0,
                totalInterests: interests.count || 0,
            },
            isLoading: false,
        })
    },

    fetchUsers: async () => {
        set({ isLoading: true })
        const { data } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })
        set({ users: data || [], isLoading: false })
    },

    fetchObservations: async () => {
        set({ isLoading: true })
        const { data } = await supabase
            .from('observations')
            .select('*, user:users(id, display_name, email)')
            .order('created_at', { ascending: false })
        set({ observations: data || [], isLoading: false })
    },

    fetchBadges: async () => {
        set({ isLoading: true })
        const { data } = await supabase
            .from('badges')
            .select('*')
            .order('created_at', { ascending: false })
        set({ badges: data || [], isLoading: false })
    },

    fetchEvents: async () => {
        set({ isLoading: true })
        const { data } = await supabase
            .from('events')
            .select('*')
            .order('event_date', { ascending: false })
        set({ events: data || [], isLoading: false })
    },

    fetchMissions: async () => {
        set({ isLoading: true })
        const { data } = await supabase
            .from('missions')
            .select('*, reward_badge:badges(*), requirements:mission_requirements(*)')
            .order('created_at', { ascending: false })
        set({ missions: data || [], isLoading: false })
    },

    fetchPosts: async () => {
        set({ isLoading: true })
        const { data } = await supabase
            .from('posts')
            .select('*, user:users(id, display_name, email)')
            .eq('is_deleted', false)
            .order('is_reported', { ascending: false })
            .order('created_at', { ascending: false })
        set({ posts: data || [], isLoading: false })
    },

    fetchAlerts: async () => {
        set({ isLoading: true })
        const { data } = await supabase
            .from('sky_alerts')
            .select('*')
            .order('created_at', { ascending: false })
        set({ alerts: data || [], isLoading: false })
    },

    fetchReferrals: async () => {
        set({ isLoading: true })
        const { data } = await supabase
            .from('referrals')
            .select('*, referrer:users!referrer_id(id, display_name, email), referred_user:users!referred_user_id(id, display_name, email)')
            .order('created_at', { ascending: false })
        set({ referrals: data || [], isLoading: false })
    },

    updateUser: async (id, data) => {
        const { error } = await supabase.from('users').update(data).eq('id', id)
        if (!error) await get().fetchUsers()
        return { error: error?.message || null }
    },

    deleteUser: async (id) => {
        const { error } = await supabase.from('users').delete().eq('id', id)
        if (!error) await get().fetchUsers()
        return { error: error?.message || null }
    },

    createBadge: async (data) => {
        const { error } = await supabase.from('badges').insert(data)
        if (!error) await get().fetchBadges()
        return { error: error?.message || null }
    },

    updateBadge: async (id, data) => {
        const { error } = await supabase.from('badges').update(data).eq('id', id)
        if (!error) await get().fetchBadges()
        return { error: error?.message || null }
    },

    deleteBadge: async (id) => {
        const { error } = await supabase.from('badges').delete().eq('id', id)
        if (!error) await get().fetchBadges()
        return { error: error?.message || null }
    },

    createEvent: async (data) => {
        const { error } = await supabase.from('events').insert(data)
        if (!error) await get().fetchEvents()
        return { error: error?.message || null }
    },

    updateEvent: async (id, data) => {
        const { error } = await supabase.from('events').update(data).eq('id', id)
        if (!error) await get().fetchEvents()
        return { error: error?.message || null }
    },

    deleteEvent: async (id) => {
        const { error } = await supabase.from('events').delete().eq('id', id)
        if (!error) await get().fetchEvents()
        return { error: error?.message || null }
    },

    createMission: async (data, requirements) => {
        const { data: mission, error } = await supabase.from('missions').insert(data).select().single()
        if (error) return { error: error.message }

        if (requirements.length > 0) {
            const reqs = requirements.map(r => ({ ...r, mission_id: mission.id }))
            const { error: reqError } = await supabase.from('mission_requirements').insert(reqs)
            if (reqError) return { error: reqError.message }
        }

        await get().fetchMissions()
        return { error: null }
    },

    updateMission: async (id, data) => {
        const { error } = await supabase.from('missions').update(data).eq('id', id)
        if (!error) await get().fetchMissions()
        return { error: error?.message || null }
    },

    deleteMission: async (id) => {
        const { error } = await supabase.from('missions').delete().eq('id', id)
        if (!error) await get().fetchMissions()
        return { error: error?.message || null }
    },

    createAlert: async (data) => {
        const { error } = await supabase.from('sky_alerts').insert(data)
        if (!error) await get().fetchAlerts()
        return { error: error?.message || null }
    },

    deleteAlert: async (id) => {
        const { error } = await supabase.from('sky_alerts').delete().eq('id', id)
        if (!error) await get().fetchAlerts()
        return { error: error?.message || null }
    },

    moderatePost: async (id, action) => {
        if (action === 'delete') {
            const { error } = await supabase.from('posts').update({ is_deleted: true }).eq('id', id)
            if (!error) await get().fetchPosts()
            return { error: error?.message || null }
        } else {
            const { error } = await supabase.from('posts').update({ is_reported: false }).eq('id', id)
            if (!error) await get().fetchPosts()
            return { error: error?.message || null }
        }
    },

    // Social Features Fetch Actions
    fetchGears: async () => {
        set({ isLoading: true })
        const { data } = await supabase
            .from('user_gears')
            .select('*, user:users(id, display_name, email, profile_photo_url)')
            .order('created_at', { ascending: false })
        set({ gears: data || [], isLoading: false })
    },

    fetchFollows: async () => {
        set({ isLoading: true })
        const { data } = await supabase
            .from('follows')
            .select(`
                *,
                follower:users!follows_follower_id_fkey(id, display_name, email, profile_photo_url),
                following:users!follows_following_id_fkey(id, display_name, email, profile_photo_url)
            `)
            .order('created_at', { ascending: false })
        set({ follows: data || [], isLoading: false })
    },

    fetchInterests: async () => {
        set({ isLoading: true })
        const { data } = await supabase
            .from('interests')
            .select('*')
            .order('display_name', { ascending: true })
        set({ interests: data || [], isLoading: false })
    },

    fetchUserInterests: async () => {
        set({ isLoading: true })
        const { data } = await supabase
            .from('user_interests')
            .select('*, user:users(id, display_name, email), interest:interests(*)')
            .order('created_at', { ascending: false })
        set({ userInterests: data || [], isLoading: false })
    },

    // Social Features CRUD Actions
    deleteGear: async (id) => {
        const { error } = await supabase.from('user_gears').delete().eq('id', id)
        if (!error) await get().fetchGears()
        return { error: error?.message || null }
    },

    deleteFollow: async (id) => {
        const { error } = await supabase.from('follows').delete().eq('id', id)
        if (!error) await get().fetchFollows()
        return { error: error?.message || null }
    },

    createInterest: async (data) => {
        const { error } = await supabase.from('interests').insert(data)
        if (!error) await get().fetchInterests()
        return { error: error?.message || null }
    },

    updateInterest: async (id, data) => {
        const { error } = await supabase.from('interests').update(data).eq('id', id)
        if (!error) await get().fetchInterests()
        return { error: error?.message || null }
    },

    deleteInterest: async (id) => {
        const { error } = await supabase.from('interests').delete().eq('id', id)
        if (!error) await get().fetchInterests()
        return { error: error?.message || null }
    },

    deleteUserInterest: async (id) => {
        const { error } = await supabase.from('user_interests').delete().eq('id', id)
        if (!error) await get().fetchUserInterests()
        return { error: error?.message || null }
    },

    // Webhook Fetch Actions
    fetchWebhooks: async () => {
        set({ isLoading: true })
        const { data } = await supabase
            .from('webhooks')
            .select('*')
            .order('created_at', { ascending: false })
        set({ webhooks: data || [], isLoading: false })
    },

    fetchWebhookLogs: async (webhookId) => {
        set({ isLoading: true })
        let query = supabase
            .from('webhook_logs')
            .select('*, webhook:webhooks(*)')
            .order('created_at', { ascending: false })
            .limit(100)
        
        if (webhookId) {
            query = query.eq('webhook_id', webhookId)
        }
        
        const { data } = await query
        set({ webhookLogs: data || [], isLoading: false })
    },

    // Webhook CRUD Actions
    createWebhook: async (data) => {
        const { error } = await supabase.from('webhooks').insert(data)
        if (!error) await get().fetchWebhooks()
        return { error: error?.message || null }
    },

    updateWebhook: async (id, data) => {
        const { error } = await supabase.from('webhooks').update(data).eq('id', id)
        if (!error) await get().fetchWebhooks()
        return { error: error?.message || null }
    },

    deleteWebhook: async (id) => {
        const { error } = await supabase.from('webhooks').delete().eq('id', id)
        if (!error) await get().fetchWebhooks()
        return { error: error?.message || null }
    },

    testWebhook: async (id) => {
        try {
            // Get webhook details
            const { data: webhook, error: fetchError } = await supabase
                .from('webhooks')
                .select('*')
                .eq('id', id)
                .single()

            if (fetchError || !webhook) {
                return { error: 'Webhook not found', success: false }
            }

            // Use server-side proxy to avoid CORS issues
            // Auto-detect frontend URL based on environment
            let frontendUrl = import.meta.env.VITE_FRONTEND_URL
            
            if (!frontendUrl) {
                // Auto-detect based on current URL
                const currentUrl = window.location.origin
                
                if (currentUrl.includes('localhost')) {
                    // Development: admin on 5173, frontend on 3000
                    frontendUrl = 'http://localhost:3000'
                } else if (currentUrl.includes('admin')) {
                    // Production: admin.domain.com -> www.domain.com (handle www redirect)
                    frontendUrl = currentUrl.replace('admin.', 'www.')
                } else {
                    // Fallback: assume same domain
                    frontendUrl = currentUrl
                }
            }
            
            const proxyResponse = await fetch(`${frontendUrl}/api/webhooks/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: webhook.url,
                    secret: webhook.secret,
                    webhookId: webhook.id,
                    webhookName: webhook.name
                })
            })

            const result = await proxyResponse.json()

            // Create test payload for logging
            const testPayload = {
                event: 'webhook.test',
                timestamp: new Date().toISOString(),
                data: {
                    message: 'This is a test webhook from SkyGuild Admin',
                    webhook_id: webhook.id,
                    webhook_name: webhook.name
                }
            }

            // Log the test
            await supabase.from('webhook_logs').insert({
                webhook_id: id,
                event_type: 'webhook.test' as WebhookEvent,
                payload: testPayload,
                response_status: result.status || null,
                response_body: result.responseBody || null,
                error_message: result.error || null,
                retry_count: 0
            })

            // Update webhook status
            if (result.success) {
                await supabase.from('webhooks').update({
                    last_success_at: new Date().toISOString(),
                    last_triggered_at: new Date().toISOString(),
                    status: 'active'
                }).eq('id', id)
            } else {
                await supabase.from('webhooks').update({
                    last_triggered_at: new Date().toISOString(),
                    last_error: result.error || 'Unknown error',
                    retry_count: webhook.retry_count + 1
                }).eq('id', id)
            }

            await get().fetchWebhooks()
            await get().fetchWebhookLogs(id)

            return { 
                error: result.error || null,
                success: result.success 
            }
        } catch (error) {
            return { 
                error: error instanceof Error ? error.message : 'Failed to test webhook',
                success: false 
            }
        }
    },

    clearWebhookLogs: async (webhookId) => {
        const { error } = await supabase
            .from('webhook_logs')
            .delete()
            .eq('webhook_id', webhookId)
        
        if (!error) await get().fetchWebhookLogs(webhookId)
        return { error: error?.message || null }
    },

    // API Keys Fetch Actions
    fetchApiKeys: async () => {
        set({ isLoading: true })
        const { data } = await supabase
            .from('api_keys')
            .select('*')
            .order('created_at', { ascending: false })
        set({ apiKeys: data || [], isLoading: false })
    },

    fetchApiKeyLogs: async (apiKeyId) => {
        set({ isLoading: true })
        let query = supabase
            .from('api_key_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100)
        
        if (apiKeyId) {
            query = query.eq('api_key_id', apiKeyId)
        }
        
        const { data } = await query
        set({ apiKeyLogs: data || [], isLoading: false })
    },

    fetchApiKeyStats: async () => {
        set({ isLoading: true })
        const { data } = await supabase
            .from('api_key_usage_stats')
            .select('*')
        set({ apiKeyStats: data || [], isLoading: false })
    },

    // API Keys CRUD Actions
    createApiKey: async (data) => {
        try {
            // Generate a secure API key
            const apiKey = 'skyguild_live_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')

            // Hash the key for storage
            const encoder = new TextEncoder()
            const keyData = encoder.encode(apiKey)
            const hashBuffer = await crypto.subtle.digest('SHA-256', keyData)
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

            // Generate prefix for display
            const keyPrefix = apiKey.substring(0, 12) + '...'

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()

            const { error } = await supabase.from('api_keys').insert({
                name: data.name,
                description: data.description || null,
                key_hash: keyHash,
                key_prefix: keyPrefix,
                permissions: data.permissions || ['read'],
                expires_at: data.expires_at || null,
                created_by: user?.id || null
            })

            if (!error) await get().fetchApiKeys()
            
            // Return the plain key only once (it won't be stored)
            return { error: error?.message || null, apiKey: error ? undefined : apiKey }
        } catch (error) {
            return { 
                error: error instanceof Error ? error.message : 'Failed to create API key',
                apiKey: undefined 
            }
        }
    },

    updateApiKey: async (id, data) => {
        const { error } = await supabase.from('api_keys').update(data).eq('id', id)
        if (!error) await get().fetchApiKeys()
        return { error: error?.message || null }
    },

    deleteApiKey: async (id) => {
        const { error } = await supabase.from('api_keys').delete().eq('id', id)
        if (!error) await get().fetchApiKeys()
        return { error: error?.message || null }
    },

    regenerateApiKey: async (id) => {
        try {
            // Generate a new secure API key
            const apiKey = 'skyguild_live_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')

            // Hash the key for storage
            const encoder = new TextEncoder()
            const keyData = encoder.encode(apiKey)
            const hashBuffer = await crypto.subtle.digest('SHA-256', keyData)
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

            // Generate prefix for display
            const keyPrefix = apiKey.substring(0, 12) + '...'

            const { error } = await supabase.from('api_keys').update({
                key_hash: keyHash,
                key_prefix: keyPrefix,
                updated_at: new Date().toISOString()
            }).eq('id', id)

            if (!error) await get().fetchApiKeys()
            
            return { error: error?.message || null, apiKey: error ? undefined : apiKey }
        } catch (error) {
            return { 
                error: error instanceof Error ? error.message : 'Failed to regenerate API key',
                apiKey: undefined 
            }
        }
    },
}))
