export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
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
                Insert: {
                    id?: string
                    email: string
                    display_name?: string | null
                    bio?: string | null
                    profile_photo_url?: string | null
                    telescope_type?: string | null
                    experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
                    level?: number
                    total_points?: number
                    referral_code: string
                    referred_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    display_name?: string | null
                    bio?: string | null
                    profile_photo_url?: string | null
                    telescope_type?: string | null
                    experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
                    level?: number
                    total_points?: number
                    referral_code?: string
                    referred_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            observations: {
                Row: {
                    id: string
                    user_id: string
                    object_name: string
                    category: 'Moon' | 'Planet' | 'Nebula' | 'Galaxy' | 'Cluster' | 'Constellation'
                    observation_date: string
                    location: string | null
                    notes: string | null
                    photo_url: string | null
                    points_awarded: number
                    is_seasonal_rare: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    object_name: string
                    category: 'Moon' | 'Planet' | 'Nebula' | 'Galaxy' | 'Cluster' | 'Constellation'
                    observation_date: string
                    location?: string | null
                    notes?: string | null
                    photo_url?: string | null
                    points_awarded: number
                    is_seasonal_rare?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    object_name?: string
                    category?: 'Moon' | 'Planet' | 'Nebula' | 'Galaxy' | 'Cluster' | 'Constellation'
                    observation_date?: string
                    location?: string | null
                    notes?: string | null
                    photo_url?: string | null
                    points_awarded?: number
                    is_seasonal_rare?: boolean
                    created_at?: string
                }
            }
            badges: {
                Row: {
                    id: string
                    name: string
                    description: string
                    icon_url: string | null
                    requirement_type: 'observation_count' | 'specific_object' | 'mission_complete' | 'referral_count' | 'special'
                    requirement_value: Json | null
                    created_at: string
                }
            }
            user_badges: {
                Row: {
                    id: string
                    user_id: string
                    badge_id: string
                    earned_at: string
                }
            }
            events: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    location: string
                    latitude: number | null
                    longitude: number | null
                    event_date: string
                    capacity: number | null
                    is_paid: boolean
                    price: number | null
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
            }
            missions: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    start_date: string
                    end_date: string
                    reward_badge_id: string | null
                    bonus_points: number
                    is_active: boolean
                    created_at: string
                }
            }
            posts: {
                Row: {
                    id: string
                    user_id: string
                    image_url: string
                    caption: string | null
                    is_reported: boolean
                    is_deleted: boolean
                    created_at: string
                }
            }
            sky_alerts: {
                Row: {
                    id: string
                    title: string
                    message: string
                    alert_type: 'text' | 'object_visibility' | 'meteor_shower' | 'special_event'
                    created_by: string | null
                    created_at: string
                }
            }
        }
    }
}
