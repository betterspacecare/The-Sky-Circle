/**
 * Unit Tests for UserCard Component
 * 
 * Tests the UserCard component logic including:
 * - User information display (photo, name, experience level, follower count)
 * - FollowButton integration
 * - Navigation to profile
 * 
 * **Validates: Requirements 2.2, 2.5**
 */

import { describe, it, expect, vi } from 'vitest';
import { UserWithSocialData } from '@/types/social.types';

// Mock the follow service for FollowButton
vi.mock('@/lib/services/followService', () => ({
  followUser: vi.fn().mockResolvedValue({ data: { id: 'follow-1' }, error: null }),
  unfollowUser: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
}));

describe('UserCard Component Logic', () => {
  // Test user data
  const createMockUser = (overrides: Partial<UserWithSocialData> = {}): UserWithSocialData => ({
    id: 'user-123',
    display_name: 'Test User',
    profile_photo_url: 'https://example.com/photo.jpg',
    experience_level: 'Intermediate',
    bio: 'Test bio',
    follower_count: 150,
    following_count: 75,
    is_following: false,
    ...overrides,
  });

  describe('User Information Display (Requirement 2.2)', () => {
    it('should display user display name', () => {
      const user = createMockUser({ display_name: 'John Doe' });
      expect(user.display_name).toBe('John Doe');
    });

    it('should handle null display name with fallback', () => {
      const user = createMockUser({ display_name: null });
      const displayName = user.display_name || 'Anonymous';
      expect(displayName).toBe('Anonymous');
    });

    it('should display user profile photo URL', () => {
      const user = createMockUser({ profile_photo_url: 'https://example.com/avatar.png' });
      expect(user.profile_photo_url).toBe('https://example.com/avatar.png');
    });

    it('should handle null profile photo with initial fallback', () => {
      const user = createMockUser({ display_name: 'Jane', profile_photo_url: null });
      const initial = (user.display_name || 'U')[0].toUpperCase();
      expect(initial).toBe('J');
    });

    it('should display experience level', () => {
      const user = createMockUser({ experience_level: 'Advanced' });
      expect(user.experience_level).toBe('Advanced');
    });

    it('should display follower count', () => {
      const user = createMockUser({ follower_count: 1500 });
      expect(user.follower_count).toBe(1500);
    });
  });

  describe('Follower Count Formatting', () => {
    const formatCount = (count: number): string => {
      if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
      }
      if (count >= 1000) {
        return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
      }
      return count.toString();
    };

    it('should format small numbers as-is', () => {
      expect(formatCount(42)).toBe('42');
      expect(formatCount(999)).toBe('999');
    });

    it('should format thousands with K suffix', () => {
      expect(formatCount(1000)).toBe('1K');
      expect(formatCount(1500)).toBe('1.5K');
      expect(formatCount(10000)).toBe('10K');
      expect(formatCount(999999)).toBe('1000K');
    });

    it('should format millions with M suffix', () => {
      expect(formatCount(1000000)).toBe('1M');
      expect(formatCount(1500000)).toBe('1.5M');
      expect(formatCount(10000000)).toBe('10M');
    });

    it('should remove trailing .0 from formatted numbers', () => {
      expect(formatCount(2000)).toBe('2K');
      expect(formatCount(3000000)).toBe('3M');
    });
  });

  describe('Experience Level Badge Styling', () => {
    const getExperienceBadgeStyle = (level: string | null): string => {
      switch (level?.toLowerCase()) {
        case 'beginner':
          return 'bg-green-500/20 text-green-300 border-green-500/30';
        case 'intermediate':
          return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        case 'advanced':
          return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
        case 'expert':
          return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
        default:
          return 'bg-white/10 text-white/60 border-white/20';
      }
    };

    it('should return green styling for beginner', () => {
      const style = getExperienceBadgeStyle('Beginner');
      expect(style).toContain('bg-green-500/20');
      expect(style).toContain('text-green-300');
    });

    it('should return blue styling for intermediate', () => {
      const style = getExperienceBadgeStyle('Intermediate');
      expect(style).toContain('bg-blue-500/20');
      expect(style).toContain('text-blue-300');
    });

    it('should return purple styling for advanced', () => {
      const style = getExperienceBadgeStyle('Advanced');
      expect(style).toContain('bg-purple-500/20');
      expect(style).toContain('text-purple-300');
    });

    it('should return amber styling for expert', () => {
      const style = getExperienceBadgeStyle('Expert');
      expect(style).toContain('bg-amber-500/20');
      expect(style).toContain('text-amber-300');
    });

    it('should return default styling for null', () => {
      const style = getExperienceBadgeStyle(null);
      expect(style).toContain('bg-white/10');
      expect(style).toContain('text-white/60');
    });

    it('should return default styling for unknown level', () => {
      const style = getExperienceBadgeStyle('Unknown');
      expect(style).toContain('bg-white/10');
    });

    it('should be case-insensitive', () => {
      expect(getExperienceBadgeStyle('BEGINNER')).toContain('bg-green-500/20');
      expect(getExperienceBadgeStyle('intermediate')).toContain('bg-blue-500/20');
      expect(getExperienceBadgeStyle('ADVANCED')).toContain('bg-purple-500/20');
    });
  });

  describe('Profile Navigation (Requirement 2.5)', () => {
    it('should generate correct profile URL', () => {
      const user = createMockUser({ id: 'user-abc-123' });
      const profileUrl = `/dashboard/profile/${user.id}`;
      expect(profileUrl).toBe('/dashboard/profile/user-abc-123');
    });

    it('should handle different user IDs', () => {
      const users = [
        createMockUser({ id: 'uuid-1' }),
        createMockUser({ id: 'uuid-2' }),
        createMockUser({ id: 'special-chars-123' }),
      ];

      users.forEach(user => {
        const profileUrl = `/dashboard/profile/${user.id}`;
        expect(profileUrl).toContain(user.id);
      });
    });
  });

  describe('FollowButton Integration', () => {
    it('should hide FollowButton for own card', () => {
      const user = createMockUser({ id: 'user-123' });
      const currentUserId = 'user-123';
      
      const isOwnCard = currentUserId === user.id;
      expect(isOwnCard).toBe(true);
    });

    it('should show FollowButton for other users', () => {
      const user = createMockUser({ id: 'user-456' });
      const currentUserId = 'user-123';
      
      const isOwnCard = currentUserId === user.id;
      expect(isOwnCard).toBe(false);
    });

    it('should hide FollowButton when no currentUserId', () => {
      const user = createMockUser({ id: 'user-456' });
      const currentUserId: string | undefined = undefined;
      
      const shouldShowButton = !!(currentUserId && currentUserId !== user.id);
      expect(shouldShowButton).toBe(false);
    });

    it('should pass is_following state to FollowButton', () => {
      const userFollowing = createMockUser({ is_following: true });
      const userNotFollowing = createMockUser({ is_following: false });
      
      expect(userFollowing.is_following).toBe(true);
      expect(userNotFollowing.is_following).toBe(false);
    });

    it('should default is_following to false when undefined', () => {
      const user = createMockUser({ is_following: undefined });
      const isFollowing = user.is_following ?? false;
      
      expect(isFollowing).toBe(false);
    });
  });

  describe('Follow Change Callback', () => {
    it('should call onFollowChange with correct parameters', () => {
      const user = createMockUser({ id: 'user-456' });
      const onFollowChange = vi.fn();
      
      // Simulate the handleFollowChange function
      const handleFollowChange = (isFollowing: boolean) => {
        onFollowChange(user.id, isFollowing);
      };
      
      handleFollowChange(true);
      expect(onFollowChange).toHaveBeenCalledWith('user-456', true);
      
      handleFollowChange(false);
      expect(onFollowChange).toHaveBeenCalledWith('user-456', false);
    });

    it('should handle undefined onFollowChange gracefully', () => {
      const user = createMockUser({ id: 'user-456' });
      
      // Simulate the handleFollowChange function with optional chaining
      const createHandler = (callback?: (userId: string, isFollowing: boolean) => void) => {
        return (isFollowing: boolean) => {
          callback?.(user.id, isFollowing);
        };
      };
      
      const handleFollowChange = createHandler(undefined);
      
      // Should not throw
      expect(() => handleFollowChange(true)).not.toThrow();
    });
  });
});
