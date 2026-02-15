/**
 * Feed Algorithm Service
 * Service functions for generating personalized timeline feeds
 * 
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */

import { createClient } from '@/lib/supabase/client';
import { TimelinePost, FeedConfig } from '@/types/social.types';

/**
 * Service response type for consistent error handling
 */
export interface FeedServiceResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Feed query parameters
 */
export interface FeedQuery {
  userId: string;
  userInterests: string[];
  followingIds: string[];
  page: number;
  pageSize: number;
}

/**
 * Feed result with pagination info
 */
export interface FeedResult {
  posts: TimelinePost[];
  hasMore: boolean;
  nextPage: number;
}

/**
 * Default feed configuration
 * Validates: Requirements 4.4, 4.5, 4.8
 */
export const DEFAULT_FEED_CONFIG: FeedConfig = {
  followedPostsRatio: 0.7,  // 70% from followed users
  trendingPostsRatio: 0.3,  // 30% trending from non-followed
  pageSize: 20,
  engagementWeights: {
    likes: 1,
    comments: 2,
    recency: 0.5,
  },
};

/**
 * Calculates engagement score for a post
 * Validates: Requirements 4.4, 4.5
 * 
 * The score is calculated as:
 * score = (likes * likesWeight) + (comments * commentsWeight) + (recencyFactor * recencyWeight)
 * 
 * Recency factor decays over time - newer posts get higher scores
 * 
 * @param likesCount - Number of likes on the post
 * @param commentsCount - Number of comments on the post
 * @param createdAt - ISO timestamp of when the post was created
 * @param weights - Weight configuration for each factor
 * @returns Calculated engagement score
 */
export function calculateEngagementScore(
  likesCount: number,
  commentsCount: number,
  createdAt: string,
  weights: FeedConfig['engagementWeights']
): number {
  // Calculate recency factor (decays over time)
  // Posts from the last 24 hours get full recency score
  // Score decays by half every 24 hours
  const now = new Date();
  const postDate = new Date(createdAt);
  const hoursAgo = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
  
  // Exponential decay: recencyFactor = 100 * (0.5 ^ (hoursAgo / 24))
  // This gives 100 for brand new posts, 50 after 24 hours, 25 after 48 hours, etc.
  const recencyFactor = 100 * Math.pow(0.5, hoursAgo / 24);
  
  // Calculate weighted score
  const score = 
    (likesCount * weights.likes) +
    (commentsCount * weights.comments) +
    (recencyFactor * weights.recency);
  
  return Math.round(score * 100) / 100; // Round to 2 decimal places
}


/**
 * Fetches posts from users that the current user follows
 * Fetches BOTH observations and posts, merges them together
 * Validates: Requirements 4.1, 4.4
 * 
 * @param userId - The current user's ID
 * @param followingIds - Array of user IDs that the current user follows
 * @param page - Page number for pagination
 * @param pageSize - Number of posts per page
 * @returns Promise with array of TimelinePost or error
 */
export async function fetchFollowedUsersPosts(
  userId: string,
  followingIds: string[],
  page: number,
  pageSize: number
): Promise<FeedServiceResponse<TimelinePost[]>> {
  // If user doesn't follow anyone, return empty array
  if (followingIds.length === 0) {
    return { data: [], error: null };
  }

  const supabase = createClient();
  const offset = (page - 1) * pageSize;

  // Fetch observations from followed users
  const { data: observations, error: obsError } = await supabase
    .from('observations')
    .select(`
      id,
      user_id,
      notes,
      photo_url,
      created_at,
      category,
      users!observations_user_id_fkey (
        id,
        display_name,
        profile_photo_url
      )
    `)
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  // Fetch posts from followed users
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select(`
      id,
      user_id,
      caption,
      image_url,
      created_at,
      is_deleted,
      users!posts_user_id_fkey (
        id,
        display_name,
        profile_photo_url
      )
    `)
    .in('user_id', followingIds)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (obsError && postsError) {
    return { data: null, error: obsError.message };
  }

  // Process observations
  const observationPosts = await Promise.all(
    (observations || []).map(async (post) => {
      const [likesResult, commentsResult, isLikedResult] = await Promise.all([
        supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id),
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id),
        supabase
          .from('likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      const likesCount = likesResult.count ?? 0;
      const commentsCount = commentsResult.count ?? 0;
      const isLiked = isLikedResult.data !== null;

      const userData = post.users;
      const user = Array.isArray(userData) ? userData[0] : userData;

      return {
        id: post.id,
        user_id: post.user_id,
        caption: post.notes,
        image_url: post.photo_url || '',
        created_at: post.created_at,
        post_type: 'observation' as const,
        category: post.category,
        users: {
          id: user?.id || post.user_id,
          display_name: user?.display_name || null,
          profile_photo_url: user?.profile_photo_url || null,
        },
        likes_count: likesCount,
        comments_count: commentsCount,
        is_liked: isLiked,
        is_from_following: true,
        engagement_score: calculateEngagementScore(
          likesCount,
          commentsCount,
          post.created_at,
          DEFAULT_FEED_CONFIG.engagementWeights
        ),
      } as TimelinePost;
    })
  );

  // Process posts
  const regularPosts = await Promise.all(
    (posts || []).map(async (post) => {
      const [likesResult, commentsResult, isLikedResult] = await Promise.all([
        supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id),
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id),
        supabase
          .from('likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      const likesCount = likesResult.count ?? 0;
      const commentsCount = commentsResult.count ?? 0;
      const isLiked = isLikedResult.data !== null;

      const userData = post.users;
      const user = Array.isArray(userData) ? userData[0] : userData;

      return {
        id: post.id,
        user_id: post.user_id,
        caption: post.caption,
        image_url: post.image_url || '',
        created_at: post.created_at,
        post_type: 'post' as const,
        users: {
          id: user?.id || post.user_id,
          display_name: user?.display_name || null,
          profile_photo_url: user?.profile_photo_url || null,
        },
        likes_count: likesCount,
        comments_count: commentsCount,
        is_liked: isLiked,
        is_from_following: true,
        engagement_score: calculateEngagementScore(
          likesCount,
          commentsCount,
          post.created_at,
          DEFAULT_FEED_CONFIG.engagementWeights
        ),
      } as TimelinePost;
    })
  );

  // Merge and sort by created_at
  const allPosts = [...observationPosts, ...regularPosts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return { data: allPosts, error: null };
}


/**
 * Maps interest names to observation categories
 * Used to filter trending posts by user interests
 */
const INTEREST_TO_CATEGORY_MAP: Record<string, string[]> = {
  'deep_sky_objects': ['Nebula', 'Galaxy', 'Cluster'],
  'planets': ['Planet'],
  'moon': ['Moon'],
  'nebulae': ['Nebula'],
  'galaxies': ['Galaxy'],
  'star_clusters': ['Cluster'],
  // These interests don't map directly to categories
  'astrophotography': [],
  'sun': [],
  'meteor_showers': [],
  'comets': [],
  'satellites': [],
  'eclipses': [],
  'equipment_reviews': [],
  'observation_techniques': [],
};

/**
 * Fetches trending posts from non-followed users, filtered by interests
 * Fetches BOTH observations and posts
 * Validates: Requirements 4.2, 4.3, 4.6
 * 
 * @param userId - The current user's ID
 * @param excludeUserIds - Array of user IDs to exclude (followed users + self)
 * @param interests - Array of interest names to filter by
 * @param page - Page number for pagination
 * @param pageSize - Number of posts per page
 * @returns Promise with array of TimelinePost or error
 */
export async function fetchTrendingPosts(
  userId: string,
  excludeUserIds: string[],
  interests: string[],
  page: number,
  pageSize: number
): Promise<FeedServiceResponse<TimelinePost[]>> {
  const supabase = createClient();
  const offset = (page - 1) * pageSize;

  // Build category filter from interests
  const categories: string[] = [];
  for (const interest of interests) {
    const mappedCategories = INTEREST_TO_CATEGORY_MAP[interest];
    if (mappedCategories) {
      categories.push(...mappedCategories);
    }
  }
  const uniqueCategories = [...new Set(categories)];

  // Fetch observations
  let obsQuery = supabase
    .from('observations')
    .select(`
      id,
      user_id,
      notes,
      photo_url,
      created_at,
      category,
      users!observations_user_id_fkey (
        id,
        display_name,
        profile_photo_url
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (excludeUserIds.length > 0) {
    obsQuery = obsQuery.not('user_id', 'in', `(${excludeUserIds.join(',')})`);
  }

  if (uniqueCategories.length > 0) {
    obsQuery = obsQuery.in('category', uniqueCategories);
  }

  const { data: observations } = await obsQuery;

  // Fetch posts (no category filter for posts)
  let postsQuery = supabase
    .from('posts')
    .select(`
      id,
      user_id,
      caption,
      image_url,
      created_at,
      is_deleted,
      users!posts_user_id_fkey (
        id,
        display_name,
        profile_photo_url
      )
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (excludeUserIds.length > 0) {
    postsQuery = postsQuery.not('user_id', 'in', `(${excludeUserIds.join(',')})`);
  }

  const { data: posts } = await postsQuery;

  // Process observations
  const observationPosts = await Promise.all(
    (observations || []).map(async (post) => {
      const [likesResult, commentsResult, isLikedResult] = await Promise.all([
        supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id),
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id),
        supabase
          .from('likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      const likesCount = likesResult.count ?? 0;
      const commentsCount = commentsResult.count ?? 0;
      const isLiked = isLikedResult.data !== null;

      const userData = post.users;
      const user = Array.isArray(userData) ? userData[0] : userData;

      return {
        id: post.id,
        user_id: post.user_id,
        caption: post.notes,
        image_url: post.photo_url || '',
        created_at: post.created_at,
        post_type: 'observation' as const,
        category: post.category,
        users: {
          id: user?.id || post.user_id,
          display_name: user?.display_name || null,
          profile_photo_url: user?.profile_photo_url || null,
        },
        likes_count: likesCount,
        comments_count: commentsCount,
        is_liked: isLiked,
        is_from_following: false,
        engagement_score: calculateEngagementScore(
          likesCount,
          commentsCount,
          post.created_at,
          DEFAULT_FEED_CONFIG.engagementWeights
        ),
      } as TimelinePost;
    })
  );

  // Process posts
  const regularPosts = await Promise.all(
    (posts || []).map(async (post) => {
      const [likesResult, commentsResult, isLikedResult] = await Promise.all([
        supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id),
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id),
        supabase
          .from('likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      const likesCount = likesResult.count ?? 0;
      const commentsCount = commentsResult.count ?? 0;
      const isLiked = isLikedResult.data !== null;

      const userData = post.users;
      const user = Array.isArray(userData) ? userData[0] : userData;

      return {
        id: post.id,
        user_id: post.user_id,
        caption: post.caption,
        image_url: post.image_url || '',
        created_at: post.created_at,
        post_type: 'post' as const,
        users: {
          id: user?.id || post.user_id,
          display_name: user?.display_name || null,
          profile_photo_url: user?.profile_photo_url || null,
        },
        likes_count: likesCount,
        comments_count: commentsCount,
        is_liked: isLiked,
        is_from_following: false,
        engagement_score: calculateEngagementScore(
          likesCount,
          commentsCount,
          post.created_at,
          DEFAULT_FEED_CONFIG.engagementWeights
        ),
      } as TimelinePost;
    })
  );

  // Merge and sort by engagement score
  const allPosts = [...observationPosts, ...regularPosts];
  allPosts.sort((a, b) => b.engagement_score - a.engagement_score);

  return { data: allPosts, error: null };
}


/**
 * Fetches the combined timeline feed with posts from followed users and trending posts
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 * 
 * The feed combines:
 * - Posts from followed users (default 70% of feed)
 * - Trending posts from non-followed users filtered by interests (default 30% of feed)
 * 
 * Posts are ordered by engagement score (combination of likes, comments, and recency)
 * 
 * @param query - Feed query parameters (userId, interests, followingIds, pagination)
 * @param config - Feed configuration (ratios, page size, engagement weights)
 * @returns Promise with FeedResult containing posts and pagination info
 */
export async function fetchTimelineFeed(
  query: FeedQuery,
  config: FeedConfig = DEFAULT_FEED_CONFIG
): Promise<FeedServiceResponse<FeedResult>> {
  const { userId, userInterests, followingIds, page, pageSize } = query;
  
  // Calculate how many posts to fetch from each source based on ratio
  // Validates: Requirement 4.8 - Limit trending posts to max 30% of feed
  const followedPostsCount = Math.ceil(pageSize * config.followedPostsRatio);
  const trendingPostsCount = Math.floor(pageSize * config.trendingPostsRatio);

  // Fetch posts from both sources in parallel
  const [followedResult, trendingResult] = await Promise.all([
    fetchFollowedUsersPosts(userId, followingIds, page, followedPostsCount),
    fetchTrendingPosts(
      userId,
      [...followingIds, userId], // Exclude followed users and self from trending
      userInterests,
      page,
      trendingPostsCount
    ),
  ]);

  // Handle errors
  if (followedResult.error) {
    return { data: null, error: followedResult.error };
  }
  if (trendingResult.error) {
    return { data: null, error: trendingResult.error };
  }

  const followedPosts = followedResult.data || [];
  const trendingPosts = trendingResult.data || [];

  // Combine posts
  // Validates: Requirement 4.1 - Posts from followed users have higher priority
  // Validates: Requirement 4.2 - Include limited trending posts from non-followed users
  let combinedPosts: TimelinePost[] = [];

  // If user has no followed users, show only trending posts
  // Validates: Requirement 4.6 - When no followed users, show trending posts
  if (followingIds.length === 0) {
    combinedPosts = trendingPosts;
  } else {
    // Merge followed and trending posts
    combinedPosts = [...followedPosts, ...trendingPosts];
  }

  // Sort all posts by engagement score
  // Validates: Requirement 4.4 - Order by combination of recency and engagement
  combinedPosts.sort((a, b) => b.engagement_score - a.engagement_score);

  // Ensure we don't exceed the requested page size
  const paginatedPosts = combinedPosts.slice(0, pageSize);

  // Determine if there are more posts
  // We have more if either source returned the full requested amount
  const hasMore = 
    followedPosts.length >= followedPostsCount ||
    trendingPosts.length >= trendingPostsCount;

  return {
    data: {
      posts: paginatedPosts,
      hasMore,
      nextPage: page + 1,
    },
    error: null,
  };
}

/**
 * Helper function to get the list of user IDs that the current user follows
 * Useful for preparing the FeedQuery
 * 
 * @param userId - The current user's ID
 * @returns Promise with array of following user IDs
 */
export async function getFollowingIds(
  userId: string
): Promise<FeedServiceResponse<string[]>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (error) {
    return { data: null, error: error.message };
  }

  const followingIds = (data || []).map((f: { following_id: string }) => f.following_id);
  return { data: followingIds, error: null };
}

/**
 * Helper function to get the user's interest names
 * Useful for preparing the FeedQuery
 * 
 * @param userId - The current user's ID
 * @returns Promise with array of interest names
 */
export async function getUserInterestNames(
  userId: string
): Promise<FeedServiceResponse<string[]>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_interests')
    .select(`
      interests (
        name
      )
    `)
    .eq('user_id', userId);

  if (error) {
    return { data: null, error: error.message };
  }

  const interestNames = (data || [])
    .map((ui: { interests: { name: string } | { name: string }[] | null }) => {
      if (Array.isArray(ui.interests)) {
        return ui.interests[0]?.name;
      }
      return ui.interests?.name;
    })
    .filter((name): name is string => name !== undefined && name !== null);

  return { data: interestNames, error: null };
}
