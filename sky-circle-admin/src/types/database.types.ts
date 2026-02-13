export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type UserRole = 'admin' | 'manager' | 'user'

export interface User {
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
    role: UserRole | null
    is_event_creator: boolean
    created_at: string
    updated_at: string
}

export interface Observation {
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
    user?: User
}

export interface Badge {
    id: string
    name: string
    description: string
    icon_url: string | null
    requirement_type: 'observation_count' | 'specific_object' | 'mission_complete' | 'referral_count' | 'special'
    requirement_value: Json | null
    created_at: string
}

export interface UserBadge {
    id: string
    user_id: string
    badge_id: string
    earned_at: string
    user?: User
    badge?: Badge
}

export interface Event {
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
    attendee_count?: number
}

export interface EventAttendee {
    id: string
    event_id: string
    user_id: string
    rsvp_at: string
    user?: User
}

export interface Mission {
    id: string
    title: string
    description: string | null
    start_date: string
    end_date: string
    reward_badge_id: string | null
    bonus_points: number
    is_active: boolean
    created_at: string
    reward_badge?: Badge
    requirements?: MissionRequirement[]
}

export interface MissionRequirement {
    id: string
    mission_id: string
    object_name: string
    category: string
}

export interface Post {
    id: string
    user_id: string
    image_url: string
    caption: string | null
    is_reported: boolean
    is_deleted: boolean
    created_at: string
    user?: User
    likes_count?: number
    comments_count?: number
}

export interface Comment {
    id: string
    post_id: string
    user_id: string
    content: string
    created_at: string
    user?: User
}

export interface SkyAlert {
    id: string
    title: string
    message: string
    alert_type: 'text' | 'object_visibility' | 'meteor_shower' | 'special_event'
    created_by: string | null
    created_at: string
}

export interface Referral {
    id: string
    referrer_id: string
    referred_user_id: string
    reward_points: number
    created_at: string
    referrer?: User
    referred_user?: User
}

export interface DashboardStats {
    totalUsers: number
    totalObservations: number
    totalEvents: number
    activeMissions: number
    reportedPosts: number
    newUsersThisWeek: number
    observationsThisWeek: number
}
