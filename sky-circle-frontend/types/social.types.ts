// types/social.types.ts
// Social features types for gears, follows, interests, and timeline

/**
 * Valid gear types for astronomy equipment
 * Validates: Requirement 1.5
 */
export type GearType = 'telescope' | 'camera' | 'mount' | 'eyepiece' | 'filter' | 'accessory';

/**
 * User gear/equipment record
 * Validates: Requirements 1.2, 1.3, 1.4
 */
export interface UserGear {
    id: string;
    user_id: string;
    name: string;
    gear_type: GearType;
    brand: string | null;
    model: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Follow relationship between users
 * Validates: Requirements 3.1, 3.2
 */
export interface Follow {
    id: string;
    follower_id: string;
    following_id: string;
    created_at: string;
}

/**
 * Interest category from lookup table
 * Validates: Requirement 5.2
 */
export interface Interest {
    id: string;
    name: string;
    display_name: string;
    category: string | null;
}

/**
 * User's selected interest
 * Validates: Requirements 5.1, 5.3
 */
export interface UserInterest {
    id: string;
    user_id: string;
    interest_id: string;
    interest?: Interest;
    created_at: string;
}

/**
 * Extended user data with social information
 * Validates: Requirements 3.4, 3.7
 */
export interface UserWithSocialData {
    id: string;
    display_name: string | null;
    profile_photo_url: string | null;
    experience_level: string | null;
    bio: string | null;
    follower_count: number;
    following_count: number;
    is_following?: boolean;
    gears?: UserGear[];
    interests?: Interest[];
}

/**
 * Timeline post with engagement metrics
 * Validates: Requirements 4.4, 4.5
 */
export interface TimelinePost {
    id: string;
    user_id: string;
    caption: string | null;
    image_url: string;
    created_at: string;
    users: {
        id: string;
        display_name: string | null;
        profile_photo_url: string | null;
    };
    likes_count: number;
    comments_count: number;
    is_liked: boolean;
    is_from_following: boolean;
    engagement_score: number;
}

/**
 * Feed algorithm configuration
 * Validates: Requirements 4.4, 4.5, 4.8
 */
export interface FeedConfig {
    followedPostsRatio: number;  // 0.7 = 70% from followed users
    trendingPostsRatio: number;  // 0.3 = 30% trending from non-followed
    pageSize: number;
    engagementWeights: {
        likes: number;
        comments: number;
        recency: number;
    };
}
