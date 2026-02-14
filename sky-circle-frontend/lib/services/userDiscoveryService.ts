/**
 * User Discovery Service
 * Service functions for discovering and searching users
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */

import { createClient } from '@/lib/supabase/client';
import { UserWithSocialData } from '@/types/social.types';

/**
 * Service response type for consistent error handling
 */
export interface UserDiscoveryServiceResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Filters for user discovery
 */
export interface UserDiscoveryFilters {
  experienceLevel?: string;
}

/**
 * Paginated response type
 */
export interface PaginatedUsersResponse {
  data: UserWithSocialData[];
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
 * Fetches a paginated list of users with optional filtering
 * Validates: Requirements 2.1, 2.2, 2.4
 * - Displays paginated list of all registered users
 * - Shows display name, profile photo, experience level, and follower count
 * - Allows filtering by experience level
 * 
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of users per page
 * @param filters - Optional filters (experienceLevel)
 * @param currentUserId - Optional current user ID to determine is_following status
 * @returns Promise with paginated list of users
 */
export async function fetchUsers(
  page: number = DEFAULT_PAGE,
  pageSize: number = DEFAULT_PAGE_SIZE,
  filters: UserDiscoveryFilters = {},
  currentUserId?: string
): Promise<UserDiscoveryServiceResponse<PaginatedUsersResponse>> {
  const supabase = createClient();
  const offset = (page - 1) * pageSize;

  // Build base query for count
  let countQuery = supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  // Apply experience level filter if provided
  if (filters.experienceLevel) {
    countQuery = countQuery.eq('experience_level', filters.experienceLevel);
  }

  const { count: total, error: countError } = await countQuery;

  if (countError) {
    return { data: null, error: countError.message };
  }

  // Build query for users
  let usersQuery = supabase
    .from('users')
    .select(`
      id,
      display_name,
      profile_photo_url,
      experience_level,
      bio
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  // Apply experience level filter if provided
  if (filters.experienceLevel) {
    usersQuery = usersQuery.eq('experience_level', filters.experienceLevel);
  }

  const { data: users, error: usersError } = await usersQuery;

  if (usersError) {
    return { data: null, error: usersError.message };
  }

  // Get follower counts and is_following status for each user
  const usersWithSocialData: UserWithSocialData[] = await Promise.all(
    (users || []).map(async (user) => {
      // Get follower count
      const { count: followerCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      // Get following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      // Check if current user is following this user
      let isFollowing: boolean | undefined = undefined;
      if (currentUserId && currentUserId !== user.id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUserId)
          .eq('following_id', user.id)
          .maybeSingle();
        isFollowing = followData !== null;
      }

      return {
        id: user.id,
        display_name: user.display_name,
        profile_photo_url: user.profile_photo_url,
        experience_level: user.experience_level,
        bio: user.bio,
        follower_count: followerCount ?? 0,
        following_count: followingCount ?? 0,
        is_following: isFollowing,
      };
    })
  );

  return {
    data: {
      data: usersWithSocialData,
      total: total ?? 0,
      page,
      pageSize,
      hasMore: offset + pageSize < (total ?? 0),
    },
    error: null,
  };
}

/**
 * Searches for users by display name (case-insensitive)
 * Validates: Requirements 2.2, 2.3
 * - Allows users to search for other users by display name
 * - Shows display name, profile photo, experience level, and follower count
 * 
 * @param query - Search query string
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of users per page
 * @param currentUserId - Optional current user ID to determine is_following status
 * @returns Promise with paginated list of matching users
 */
export async function searchUsers(
  query: string,
  page: number = DEFAULT_PAGE,
  pageSize: number = DEFAULT_PAGE_SIZE,
  currentUserId?: string
): Promise<UserDiscoveryServiceResponse<PaginatedUsersResponse>> {
  const supabase = createClient();
  const offset = (page - 1) * pageSize;

  // Sanitize query for ilike pattern
  const sanitizedQuery = query.replace(/[%_]/g, '\\$&');
  const searchPattern = `%${sanitizedQuery}%`;

  // Get total count of matching users
  const { count: total, error: countError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .ilike('display_name', searchPattern);

  if (countError) {
    return { data: null, error: countError.message };
  }

  // Get paginated matching users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select(`
      id,
      display_name,
      profile_photo_url,
      experience_level,
      bio
    `)
    .ilike('display_name', searchPattern)
    .order('display_name', { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (usersError) {
    return { data: null, error: usersError.message };
  }

  // Get follower counts and is_following status for each user
  const usersWithSocialData: UserWithSocialData[] = await Promise.all(
    (users || []).map(async (user) => {
      // Get follower count
      const { count: followerCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      // Get following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      // Check if current user is following this user
      let isFollowing: boolean | undefined = undefined;
      if (currentUserId && currentUserId !== user.id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUserId)
          .eq('following_id', user.id)
          .maybeSingle();
        isFollowing = followData !== null;
      }

      return {
        id: user.id,
        display_name: user.display_name,
        profile_photo_url: user.profile_photo_url,
        experience_level: user.experience_level,
        bio: user.bio,
        follower_count: followerCount ?? 0,
        following_count: followingCount ?? 0,
        is_following: isFollowing,
      };
    })
  );

  return {
    data: {
      data: usersWithSocialData,
      total: total ?? 0,
      page,
      pageSize,
      hasMore: offset + pageSize < (total ?? 0),
    },
    error: null,
  };
}

/**
 * Fetches a single user by ID with social data
 * Validates: Requirements 2.2
 * - Gets user details including follower count and is_following status
 * 
 * @param userId - The ID of the user to fetch
 * @param currentUserId - Optional current user ID to determine is_following status
 * @returns Promise with user data or error
 */
export async function fetchUserById(
  userId: string,
  currentUserId?: string
): Promise<UserDiscoveryServiceResponse<UserWithSocialData>> {
  const supabase = createClient();

  // Get user data
  const { data: user, error: userError } = await supabase
    .from('users')
    .select(`
      id,
      display_name,
      profile_photo_url,
      experience_level,
      bio
    `)
    .eq('id', userId)
    .single();

  if (userError) {
    if (userError.code === 'PGRST116') {
      return { data: null, error: 'User not found' };
    }
    return { data: null, error: userError.message };
  }

  // Get follower count
  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  // Get following count
  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  // Check if current user is following this user
  let isFollowing: boolean | undefined = undefined;
  if (currentUserId && currentUserId !== userId) {
    const { data: followData } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', userId)
      .maybeSingle();
    isFollowing = followData !== null;
  }

  return {
    data: {
      id: user.id,
      display_name: user.display_name,
      profile_photo_url: user.profile_photo_url,
      experience_level: user.experience_level,
      bio: user.bio,
      follower_count: followerCount ?? 0,
      following_count: followingCount ?? 0,
      is_following: isFollowing,
    },
    error: null,
  };
}
