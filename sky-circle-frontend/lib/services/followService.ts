/**
 * Follow Service
 * Service functions for managing user follow relationships
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { createClient } from '@/lib/supabase/client';
import { Follow, UserWithSocialData } from '@/types/social.types';

/**
 * Service response type for consistent error handling
 */
export interface FollowServiceResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Pagination options for list queries
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

/**
 * Paginated response type
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Default pagination values
 */
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Creates a follow relationship between two users
 * Validates: Requirements 3.1, 3.3, 3.5
 * - Creates follow relationship when user clicks follow button
 * - Prevents self-following
 * - Handles duplicate follow attempts gracefully (idempotent)
 * 
 * @param followerId - The ID of the user who wants to follow
 * @param followingId - The ID of the user to be followed
 * @returns Promise with created Follow or error
 */
export async function followUser(
  followerId: string,
  followingId: string
): Promise<FollowServiceResponse<Follow>> {
  // Validate: Prevent self-following (Requirement 3.3)
  if (followerId === followingId) {
    return {
      data: null,
      error: 'Cannot follow yourself',
    };
  }

  const supabase = createClient();

  // Verify both users exist in the users table before creating follow relationship
  const { data: followerExists, error: followerCheckError } = await supabase
    .from('users')
    .select('id')
    .eq('id', followerId)
    .maybeSingle();

  if (followerCheckError) {
    return { data: null, error: `Error checking follower: ${followerCheckError.message}` };
  }

  if (!followerExists) {
    return { data: null, error: 'Your user profile is not set up. Please complete your profile first.' };
  }

  const { data: followingExists, error: followingCheckError } = await supabase
    .from('users')
    .select('id')
    .eq('id', followingId)
    .maybeSingle();

  if (followingCheckError) {
    return { data: null, error: `Error checking user to follow: ${followingCheckError.message}` };
  }

  if (!followingExists) {
    return { data: null, error: 'The user you are trying to follow does not exist.' };
  }

  // Check if follow relationship already exists (idempotent behavior)
  const { data: existingFollow } = await supabase
    .from('follows')
    .select('*')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  if (existingFollow) {
    // Return existing follow relationship (idempotent)
    return { data: existingFollow as Follow, error: null };
  }

  // Create new follow relationship
  const { data, error } = await supabase
    .from('follows')
    .insert({
      follower_id: followerId,
      following_id: followingId,
    })
    .select()
    .single();

  if (error) {
    // Handle unique constraint violation (duplicate follow)
    if (error.code === '23505') {
      // Fetch and return existing follow
      const { data: existing } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();
      return { data: existing as Follow, error: null };
    }
    // Handle self-follow check constraint violation
    if (error.code === '23514') {
      return { data: null, error: 'Cannot follow yourself' };
    }
    // Handle foreign key constraint violation
    if (error.code === '23503') {
      return { data: null, error: 'User profile not found. Please complete your profile setup.' };
    }
    return { data: null, error: error.message };
  }

  // Trigger webhook for follow.created
  if (data) {
    try {
      const { triggerWebhookAction } = await import('@/app/actions/webhooks')
      await triggerWebhookAction('follow.created', {
        follow_id: data.id,
        follower_id: data.follower_id,
        following_id: data.following_id,
        created_at: data.created_at
      })
    } catch (error) {
      console.error('Webhook trigger failed:', error)
    }
  }

  return { data: data as Follow, error: null };
}


/**
 * Removes a follow relationship between two users
 * Validates: Requirements 3.2, 3.6
 * - Removes follow relationship when user clicks unfollow button
 * - Handles non-existent follow gracefully (idempotent)
 * 
 * @param followerId - The ID of the user who wants to unfollow
 * @param followingId - The ID of the user to be unfollowed
 * @returns Promise with success boolean or error
 */
export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<FollowServiceResponse<{ success: boolean }>> {
  const supabase = createClient();

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) {
    return { data: null, error: error.message };
  }

  // Idempotent: success even if relationship didn't exist
  return { data: { success: true }, error: null };
}

/**
 * Checks if a follow relationship exists between two users
 * Validates: Requirement 3.7
 * - Returns whether the current user is following the target user
 * 
 * @param followerId - The ID of the potential follower
 * @param followingId - The ID of the user potentially being followed
 * @returns Promise with boolean indicating follow status
 */
export async function getFollowStatus(
  followerId: string,
  followingId: string
): Promise<FollowServiceResponse<boolean>> {
  // Same user cannot follow themselves
  if (followerId === followingId) {
    return { data: false, error: null };
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data !== null, error: null };
}

/**
 * Gets the count of followers for a user
 * Validates: Requirements 3.4, 3.5, 3.6
 * - Returns the number of users following the specified user
 * 
 * @param userId - The ID of the user to get follower count for
 * @returns Promise with follower count or error
 */
export async function getFollowerCount(
  userId: string
): Promise<FollowServiceResponse<number>> {
  const supabase = createClient();

  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: count ?? 0, error: null };
}

/**
 * Gets the count of users that a user is following
 * Validates: Requirements 3.4, 3.5, 3.6
 * - Returns the number of users the specified user is following
 * 
 * @param userId - The ID of the user to get following count for
 * @returns Promise with following count or error
 */
export async function getFollowingCount(
  userId: string
): Promise<FollowServiceResponse<number>> {
  const supabase = createClient();

  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: count ?? 0, error: null };
}


/**
 * Gets the list of followers for a user with pagination
 * Validates: Requirements 3.4
 * - Returns paginated list of users who follow the specified user
 * 
 * @param userId - The ID of the user to get followers for
 * @param options - Pagination options (page, pageSize)
 * @returns Promise with paginated list of followers
 */
export async function getFollowers(
  userId: string,
  options: PaginationOptions = {}
): Promise<FollowServiceResponse<PaginatedResponse<UserWithSocialData>>> {
  const page = options.page ?? DEFAULT_PAGE;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  const supabase = createClient();

  // Get total count
  const { count: total, error: countError } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  if (countError) {
    return { data: null, error: countError.message };
  }

  // Get paginated followers with user data
  const { data, error } = await supabase
    .from('follows')
    .select(`
      follower_id,
      users!follows_follower_id_fkey (
        id,
        display_name,
        profile_photo_url,
        experience_level,
        bio
      )
    `)
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    return { data: null, error: error.message };
  }

  // Transform data to UserWithSocialData format
  const followers: UserWithSocialData[] = await Promise.all(
    (data || []).map(async (follow: { follower_id: string; users: unknown }) => {
      const user = follow.users as {
        id: string;
        display_name: string | null;
        profile_photo_url: string | null;
        experience_level: string | null;
        bio: string | null;
      };

      // Get follower and following counts for each user
      const [followerCountResult, followingCountResult] = await Promise.all([
        getFollowerCount(user.id),
        getFollowingCount(user.id),
      ]);

      return {
        id: user.id,
        display_name: user.display_name,
        profile_photo_url: user.profile_photo_url,
        experience_level: user.experience_level,
        bio: user.bio,
        follower_count: followerCountResult.data ?? 0,
        following_count: followingCountResult.data ?? 0,
      };
    })
  );

  return {
    data: {
      data: followers,
      total: total ?? 0,
      page,
      pageSize,
      hasMore: offset + pageSize < (total ?? 0),
    },
    error: null,
  };
}

/**
 * Gets the list of users that a user is following with pagination
 * Validates: Requirements 3.4
 * - Returns paginated list of users the specified user follows
 * 
 * @param userId - The ID of the user to get following list for
 * @param options - Pagination options (page, pageSize)
 * @returns Promise with paginated list of following users
 */
export async function getFollowing(
  userId: string,
  options: PaginationOptions = {}
): Promise<FollowServiceResponse<PaginatedResponse<UserWithSocialData>>> {
  const page = options.page ?? DEFAULT_PAGE;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  const supabase = createClient();

  // Get total count
  const { count: total, error: countError } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  if (countError) {
    return { data: null, error: countError.message };
  }

  // Get paginated following with user data
  const { data, error } = await supabase
    .from('follows')
    .select(`
      following_id,
      users!follows_following_id_fkey (
        id,
        display_name,
        profile_photo_url,
        experience_level,
        bio
      )
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    return { data: null, error: error.message };
  }

  // Transform data to UserWithSocialData format
  const following: UserWithSocialData[] = await Promise.all(
    (data || []).map(async (follow: { following_id: string; users: unknown }) => {
      const user = follow.users as {
        id: string;
        display_name: string | null;
        profile_photo_url: string | null;
        experience_level: string | null;
        bio: string | null;
      };

      // Get follower and following counts for each user
      const [followerCountResult, followingCountResult] = await Promise.all([
        getFollowerCount(user.id),
        getFollowingCount(user.id),
      ]);

      return {
        id: user.id,
        display_name: user.display_name,
        profile_photo_url: user.profile_photo_url,
        experience_level: user.experience_level,
        bio: user.bio,
        follower_count: followerCountResult.data ?? 0,
        following_count: followingCountResult.data ?? 0,
      };
    })
  );

  return {
    data: {
      data: following,
      total: total ?? 0,
      page,
      pageSize,
      hasMore: offset + pageSize < (total ?? 0),
    },
    error: null,
  };
}

/**
 * Gets both follower and following counts for a user in a single call
 * Validates: Requirements 3.4
 * - Efficient way to get both counts for profile display
 * 
 * @param userId - The ID of the user to get counts for
 * @returns Promise with both counts or error
 */
export async function getFollowCounts(
  userId: string
): Promise<FollowServiceResponse<{ followerCount: number; followingCount: number }>> {
  const [followerResult, followingResult] = await Promise.all([
    getFollowerCount(userId),
    getFollowingCount(userId),
  ]);

  if (followerResult.error) {
    return { data: null, error: followerResult.error };
  }

  if (followingResult.error) {
    return { data: null, error: followingResult.error };
  }

  return {
    data: {
      followerCount: followerResult.data ?? 0,
      followingCount: followingResult.data ?? 0,
    },
    error: null,
  };
}
