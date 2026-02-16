import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { UserRole } from '../types/database.types'

export type { UserRole }

interface UserProfile {
    id: string
    email: string
    display_name: string | null
    profile_photo_url?: string | null
    role: UserRole
}

interface AuthState {
    user: SupabaseUser | null
    profile: UserProfile | null
    isLoading: boolean
    role: UserRole | null
    signIn: (email: string, password: string) => Promise<{ error: string | null }>
    signOut: () => Promise<void>
    checkAuth: () => Promise<void>
    hasPermission: (permission: string) => boolean
}

// Permission definitions by role
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    admin: [
        'users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage_roles',
        'events.view', 'events.create', 'events.edit', 'events.delete',
        'missions.view', 'missions.create', 'missions.edit', 'missions.delete',
        'badges.view', 'badges.create', 'badges.edit', 'badges.delete',
        'observations.view', 'observations.delete',
        'posts.view', 'posts.moderate', 'posts.delete',
        'alerts.view', 'alerts.create', 'alerts.edit', 'alerts.delete',
        'referrals.view',
        'dashboard.view',
        'settings.manage'
    ],
    manager: [
        'users.view',
        'events.view', 'events.create', 'events.edit',
        'missions.view', 'missions.create', 'missions.edit',
        'badges.view', 'badges.create', 'badges.edit',
        'observations.view',
        'posts.view', 'posts.moderate',
        'alerts.view', 'alerts.create', 'alerts.edit',
        'referrals.view',
        'dashboard.view'
    ],
    user: [
        'dashboard.view'
    ]
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    profile: null,
    isLoading: true,
    role: null,

    signIn: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            return { error: error.message }
        }

        // Fetch user profile with role
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('id, email, display_name, role')
            .eq('id', data.user.id)
            .single()

        if (profileError || !profile) {
            await supabase.auth.signOut()
            return { error: 'User profile not found' }
        }

        const userRole = (profile.role as UserRole) || 'user'

        // Check if user has admin panel access (admin or manager)
        if (userRole !== 'admin' && userRole !== 'manager') {
            await supabase.auth.signOut()
            return { error: 'Access denied. Admin or Manager privileges required.' }
        }

        set({ 
            user: data.user, 
            profile: { ...profile, role: userRole },
            role: userRole 
        })
        return { error: null }
    },

    signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null, role: null })
    },

    checkAuth: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
            // Fetch user profile with role
            const { data: profile } = await supabase
                .from('users')
                .select('id, email, display_name, role')
                .eq('id', session.user.id)
                .single()

            if (profile) {
                const userRole = (profile.role as UserRole) || 'user'
                
                // Only allow admin/manager access
                if (userRole === 'admin' || userRole === 'manager') {
                    set({ 
                        user: session.user, 
                        profile: { ...profile, role: userRole },
                        role: userRole,
                        isLoading: false 
                    })
                    return
                }
            }
        }
        
        set({ user: null, profile: null, role: null, isLoading: false })
    },

    hasPermission: (permission: string) => {
        const { role } = get()
        if (!role) return false
        return ROLE_PERMISSIONS[role]?.includes(permission) || false
    }
}))
