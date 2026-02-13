import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, Observation, Badge, Event, Mission, Post, SkyAlert, Referral, DashboardStats } from '../types/database.types'

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
    isLoading: false,

    fetchStats: async () => {
        set({ isLoading: true })
        
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        const [users, observations, events, missions, posts, newUsers, newObs] = await Promise.all([
            supabase.from('users').select('id', { count: 'exact' }),
            supabase.from('observations').select('id', { count: 'exact' }),
            supabase.from('events').select('id', { count: 'exact' }),
            supabase.from('missions').select('id', { count: 'exact' }).eq('is_active', true),
            supabase.from('posts').select('id', { count: 'exact' }).eq('is_reported', true).eq('is_deleted', false),
            supabase.from('users').select('id', { count: 'exact' }).gte('created_at', weekAgo.toISOString()),
            supabase.from('observations').select('id', { count: 'exact' }).gte('created_at', weekAgo.toISOString()),
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
}))
