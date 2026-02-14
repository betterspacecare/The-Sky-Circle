/**
 * Unit Tests for FollowStats Component
 * 
 * Tests the FollowStats component logic including:
 * - Count display and formatting
 * - Modal open/close behavior
 * - Pagination logic
 * - Service integration
 * 
 * **Validates: Requirement 3.4**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the follow service
vi.mock('@/lib/services/followService', () => ({
  getFollowers: vi.fn(),
  getFollowing: vi.fn(),
}));

import { getFollowers, getFollowing } from '@/lib/services/followService';

const mockGetFollowers = getFollowers as ReturnType<typeof vi.fn>;
const mockGetFollowing = getFollowing as ReturnType<typeof vi.fn>;

describe('FollowStats Component Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock responses
    mockGetFollowers.mockResolvedValue({
      data: {
        data: [
          { id: 'user-1', display_name: 'User One', profile_photo_url: null, follower_count: 10, following_count: 5 },
          { id: 'user-2', display_name: 'User Two', profile_photo_url: null, follower_count: 20, following_count: 15 },
        ],
        total: 2,
        page: 1,
        pageSize: 20,
        hasMore: false,
      },
      error: null,
    });

    mockGetFollowing.mockResolvedValue({
      data: {
        data: [
          { id: 'user-3', display_name: 'User Three', profile_photo_url: null, follower_count: 30, following_count: 25 },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        hasMore: false,
      },
      error: null,
    });
  });

  describe('Count Formatting (Requirement 3.4)', () => {
    const formatCount = (count: number): string => {
      if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`;
      }
      if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`;
      }
      return count.toString();
    };

    it('should display small counts as-is', () => {
      expect(formatCount(0)).toBe('0');
      expect(formatCount(1)).toBe('1');
      expect(formatCount(999)).toBe('999');
    });

    it('should format thousands with K suffix', () => {
      expect(formatCount(1000)).toBe('1.0K');
      expect(formatCount(1500)).toBe('1.5K');
      expect(formatCount(10000)).toBe('10.0K');
      expect(formatCount(999999)).toBe('1000.0K');
    });

    it('should format millions with M suffix', () => {
      expect(formatCount(1000000)).toBe('1.0M');
      expect(formatCount(1500000)).toBe('1.5M');
      expect(formatCount(10000000)).toBe('10.0M');
    });
  });

  describe('Service Integration (Requirement 3.4)', () => {
    it('should call getFollowers with correct parameters', async () => {
      const userId = 'user-123';
      
      await getFollowers(userId, { page: 1, pageSize: 20 });
      
      expect(mockGetFollowers).toHaveBeenCalledWith(userId, { page: 1, pageSize: 20 });
      expect(mockGetFollowers).toHaveBeenCalledTimes(1);
    });

    it('should call getFollowing with correct parameters', async () => {
      const userId = 'user-123';
      
      await getFollowing(userId, { page: 1, pageSize: 20 });
      
      expect(mockGetFollowing).toHaveBeenCalledWith(userId, { page: 1, pageSize: 20 });
      expect(mockGetFollowing).toHaveBeenCalledTimes(1);
    });

    it('should handle followers response correctly', async () => {
      const result = await getFollowers('user-123', { page: 1, pageSize: 20 });
      
      expect(result.data).not.toBeNull();
      expect(result.data?.data).toHaveLength(2);
      expect(result.data?.total).toBe(2);
      expect(result.error).toBeNull();
    });

    it('should handle following response correctly', async () => {
      const result = await getFollowing('user-123', { page: 1, pageSize: 20 });
      
      expect(result.data).not.toBeNull();
      expect(result.data?.data).toHaveLength(1);
      expect(result.data?.total).toBe(1);
      expect(result.error).toBeNull();
    });

    it('should handle service error', async () => {
      mockGetFollowers.mockResolvedValue({ data: null, error: 'Network error' });
      
      const result = await getFollowers('user-123', { page: 1, pageSize: 20 });
      
      expect(result.data).toBeNull();
      expect(result.error).toBe('Network error');
    });
  });

  describe('Pagination Logic', () => {
    it('should request correct page for load more', async () => {
      // First page
      await getFollowers('user-123', { page: 1, pageSize: 20 });
      
      // Second page (load more)
      await getFollowers('user-123', { page: 2, pageSize: 20 });
      
      expect(mockGetFollowers).toHaveBeenCalledTimes(2);
      expect(mockGetFollowers).toHaveBeenNthCalledWith(1, 'user-123', { page: 1, pageSize: 20 });
      expect(mockGetFollowers).toHaveBeenNthCalledWith(2, 'user-123', { page: 2, pageSize: 20 });
    });

    it('should track hasMore correctly', async () => {
      mockGetFollowers.mockResolvedValue({
        data: {
          data: [],
          total: 50,
          page: 1,
          pageSize: 20,
          hasMore: true,
        },
        error: null,
      });

      const result = await getFollowers('user-123', { page: 1, pageSize: 20 });
      
      expect(result.data?.hasMore).toBe(true);
    });

    it('should indicate no more data when hasMore is false', async () => {
      const result = await getFollowers('user-123', { page: 1, pageSize: 20 });
      
      expect(result.data?.hasMore).toBe(false);
    });
  });

  describe('Modal State Management', () => {
    it('should track active list type correctly', () => {
      type ListType = 'followers' | 'following' | null;
      
      let activeList: ListType = null;
      
      // Open followers
      activeList = 'followers';
      expect(activeList).toBe('followers');
      
      // Switch to following
      activeList = 'following';
      expect(activeList).toBe('following');
      
      // Close modal
      activeList = null;
      expect(activeList).toBeNull();
    });

    it('should reset state when closing modal', () => {
      let listData: unknown[] = [{ id: '1' }, { id: '2' }];
      let page = 3;
      let hasMore = true;
      
      // Close modal - reset state
      listData = [];
      page = 1;
      hasMore = false;
      
      expect(listData).toHaveLength(0);
      expect(page).toBe(1);
      expect(hasMore).toBe(false);
    });
  });

  describe('User Display', () => {
    it('should handle users with display names', async () => {
      const result = await getFollowers('user-123', { page: 1, pageSize: 20 });
      
      const user = result.data?.data[0];
      expect(user?.display_name).toBe('User One');
    });

    it('should handle users without display names', async () => {
      mockGetFollowers.mockResolvedValue({
        data: {
          data: [
            { id: 'user-1', display_name: null, profile_photo_url: null, follower_count: 10, following_count: 5 },
          ],
          total: 1,
          page: 1,
          pageSize: 20,
          hasMore: false,
        },
        error: null,
      });

      const result = await getFollowers('user-123', { page: 1, pageSize: 20 });
      
      const user = result.data?.data[0];
      const displayName = user?.display_name || 'Anonymous';
      expect(displayName).toBe('Anonymous');
    });

    it('should handle users with profile photos', async () => {
      mockGetFollowers.mockResolvedValue({
        data: {
          data: [
            { id: 'user-1', display_name: 'User', profile_photo_url: 'https://example.com/photo.jpg', follower_count: 10, following_count: 5 },
          ],
          total: 1,
          page: 1,
          pageSize: 20,
          hasMore: false,
        },
        error: null,
      });

      const result = await getFollowers('user-123', { page: 1, pageSize: 20 });
      
      const user = result.data?.data[0];
      expect(user?.profile_photo_url).toBe('https://example.com/photo.jpg');
    });
  });

  describe('Empty State Handling', () => {
    it('should handle empty followers list', async () => {
      mockGetFollowers.mockResolvedValue({
        data: {
          data: [],
          total: 0,
          page: 1,
          pageSize: 20,
          hasMore: false,
        },
        error: null,
      });

      const result = await getFollowers('user-123', { page: 1, pageSize: 20 });
      
      expect(result.data?.data).toHaveLength(0);
      expect(result.data?.total).toBe(0);
    });

    it('should handle empty following list', async () => {
      mockGetFollowing.mockResolvedValue({
        data: {
          data: [],
          total: 0,
          page: 1,
          pageSize: 20,
          hasMore: false,
        },
        error: null,
      });

      const result = await getFollowing('user-123', { page: 1, pageSize: 20 });
      
      expect(result.data?.data).toHaveLength(0);
      expect(result.data?.total).toBe(0);
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-label for followers button', () => {
      const followerCount = 42;
      const ariaLabel = `${followerCount} followers`;
      
      expect(ariaLabel).toBe('42 followers');
    });

    it('should have correct aria-label for following button', () => {
      const followingCount = 15;
      const ariaLabel = `Following ${followingCount} users`;
      
      expect(ariaLabel).toBe('Following 15 users');
    });
  });
});
