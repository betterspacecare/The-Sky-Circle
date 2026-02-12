import { create } from 'zustand'
import { User } from '@supabase/supabase-js'

interface UserProfile {
    id: string
    email: string
    display_name: string | null
    bio: string | null
    profile_photo_url: string | null
    telescope_type: string | null
    experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
    level: number
    total_points: number
    referral_code: string
    referred_by: string | null
    created_at: string
    updated_at: string
}

interface UserStore {
    user: User | null
    profile: UserProfile | null
    loading: boolean
    setUser: (user: User | null) => void
    setProfile: (profile: UserProfile | null) => void
    setLoading: (loading: boolean) => void
    updatePoints: (points: number) => void
    updateLevel: (level: number) => void
}

export const useUserStore = create<UserStore>((set) => ({
    user: null,
    profile: null,
    loading: true,
    setUser: (user) => set({ user }),
    setProfile: (profile) => set({ profile }),
    setLoading: (loading) => set({ loading }),
    updatePoints: (points) =>
        set((state) => ({
            profile: state.profile ? { ...state.profile, total_points: points } : null,
        })),
    updateLevel: (level) =>
        set((state) => ({
            profile: state.profile ? { ...state.profile, level } : null,
        })),
}))
