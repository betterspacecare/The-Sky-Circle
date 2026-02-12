// Points awarded per observation category
export const POINTS_MAP = {
    Moon: 5,
    Planet: 10,
    Nebula: 20,
    Galaxy: 25,
    Cluster: 15,
    Constellation: 8,
    SeasonalRare: 50,
} as const

// Level system configuration
export const LEVELS = [
    { level: 1, name: 'Naked Eye Explorer', minPoints: 0, maxPoints: 100, color: '#94a3b8' },
    { level: 2, name: 'Planet Tracker', minPoints: 101, maxPoints: 300, color: '#60a5fa' },
    { level: 3, name: 'Deep Sky Hunter', minPoints: 301, maxPoints: 800, color: '#a78bfa' },
    { level: 4, name: 'Nebula Navigator', minPoints: 801, maxPoints: 1500, color: '#f472b6' },
    { level: 5, name: 'Cosmic Voyager', minPoints: 1501, maxPoints: Infinity, color: '#fbbf24' },
] as const

// Observation categories
export const OBSERVATION_CATEGORIES = [
    'Moon',
    'Planet',
    'Nebula',
    'Galaxy',
    'Cluster',
    'Constellation',
] as const

// Experience levels
export const EXPERIENCE_LEVELS = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' },
] as const

// Referral reward points
export const REFERRAL_REWARD_POINTS = 50

// Storage bucket names
export const STORAGE_BUCKETS = {
    PROFILE_PHOTOS: 'profile_photos',
    OBSERVATION_PHOTOS: 'observation_photos',
    POST_IMAGES: 'post_images',
    BADGE_ICONS: 'badge_icons',
} as const
