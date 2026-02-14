/**
 * Property-Based Tests for Follow Service
 * 
 * Tests the follow system operations and validation logic using fast-check.
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import fc from 'fast-check';
import {
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowerCount,
  getFollowingCount,
} from '../followService';

// Mock the Supabase client
const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

/**
 * Arbitrary generators for property-based testing
 */

// Generator for UUIDs
const uuidArb = fc.uuid();

// Generator for two distinct UUIDs (for follow relationships)
const distinctUserPairArb = fc.tuple(uuidArb, uuidArb)
  .filter(([a, b]) => a !== b);

// Generator for follow/unfollow operation sequences
type FollowOperation = { type: 'follow' } | { type: 'unfollow' };
const followOperationArb: fc.Arbitrary<FollowOperation> = fc.constantFrom(
  { type: 'follow' } as FollowOperation,
  { type: 'unfollow' } as FollowOperation
);

// Generator for sequences of follow operations
const followOperationSequenceArb = fc.array(followOperationArb, { minLength: 1, maxLength: 20 });

/**
 * Helper to reset mocks between tests
 */
function resetMocks() {
  vi.clearAllMocks();
}

/**
 * Helper to setup mock chain for Supabase queries
 */
function setupMockChain(options: {
  selectData?: unknown;
  selectError?: { code: string; message: string } | null;
  insertData?: unknown;
  insertError?: { code: string; message: string } | null;
  deleteError?: { code: string; message: string } | null;
  count?: number;
}) {
  const mockSingle = vi.fn().mockResolvedValue({
    data: options.selectData ?? null,
    error: options.selectError ?? null,
  });

  const mockMaybeSingle = vi.fn().mockResolvedValue({
    data: options.selectData ?? null,
    error: options.selectError ?? null,
  });

  const mockSelect = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: mockSingle,
        maybeSingle: mockMaybeSingle,
      }),
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    }),
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  });

  const mockInsertSelect = vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({
      data: options.insertData ?? null,
      error: options.insertError ?? null,
    }),
  });

  const mockInsert = vi.fn().mockReturnValue({
    select: mockInsertSelect,
  });

  const mockDeleteEq = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({
      error: options.deleteError ?? null,
    }),
  });

  const mockDelete = vi.fn().mockReturnValue({
    eq: mockDeleteEq,
  });

  // For count queries
  const mockCountSelect = vi.fn().mockResolvedValue({
    count: options.count ?? 0,
    error: null,
  });

  mockSupabase.from.mockReturnValue({
    select: vi.fn((query?: string, opts?: { count?: string; head?: boolean }) => {
      if (opts?.count === 'exact' && opts?.head === true) {
        return {
          eq: vi.fn().mockResolvedValue({
            count: options.count ?? 0,
            error: null,
          }),
        };
      }
      return mockSelect();
    }),
    insert: mockInsert,
    delete: mockDelete,
  });

  return { mockSingle, mockMaybeSingle, mockSelect, mockInsert, mockDelete };
}

describe('Feature: social-features, Property 7: Self-Follow Prevention', () => {
  /**
   * Property 7: Self-Follow Prevention
   * 
   * For any user, attempting to create a follow relationship where 
   * follower_id equals following_id should fail or be rejected by the system.
   * 
   * **Validates: Requirements 3.3**
   */

  beforeEach(() => {
    resetMocks();
  });

  it('should reject self-follow attempts for any user ID', async () => {
    await fc.assert(
      fc.asyncProperty(uuidArb, async (userId) => {
        // No need to setup mocks - validation happens before DB call
        const result = await followUser(userId, userId);

        expect(result.data).toBeNull();
        expect(result.error).not.toBeNull();
        expect(result.error).toBe('Cannot follow yourself');
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('should return false for self-follow status check', async () => {
    await fc.assert(
      fc.asyncProperty(uuidArb, async (userId) => {
        // Self-follow status should always be false without DB call
        const result = await getFollowStatus(userId, userId);

        expect(result.error).toBeNull();
        expect(result.data).toBe(false);
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('self-follow prevention should be deterministic', async () => {
    await fc.assert(
      fc.asyncProperty(uuidArb, async (userId) => {
        // Multiple attempts should all fail consistently
        const result1 = await followUser(userId, userId);
        const result2 = await followUser(userId, userId);
        const result3 = await followUser(userId, userId);

        expect(result1.error).toBe(result2.error);
        expect(result2.error).toBe(result3.error);
        expect(result1.error).toBe('Cannot follow yourself');
      }),
      { numRuns: 100, verbose: true }
    );
  });
});

describe('Feature: social-features, Property 6: Follow State Consistency', () => {
  /**
   * Property 6: Follow State Consistency
   * 
   * For any two distinct users A and B, after A follows B, the follow relationship 
   * should exist. After A unfollows B, the follow relationship should not exist. 
   * The state should be consistent regardless of how many times follow/unfollow is called.
   * 
   * **Validates: Requirements 3.1, 3.2**
   */

  beforeEach(() => {
    resetMocks();
  });

  it('should create follow relationship for distinct users', async () => {
    await fc.assert(
      fc.asyncProperty(distinctUserPairArb, async ([followerId, followingId]) => {
        const mockFollow = {
          id: 'mock-follow-id',
          follower_id: followerId,
          following_id: followingId,
          created_at: new Date().toISOString(),
        };

        // Setup mock: no existing follow, then successful insert
        const mockSingle = vi.fn()
          .mockResolvedValueOnce({ data: null, error: null }) // First call: check existing
          .mockResolvedValueOnce({ data: mockFollow, error: null }); // Second call: insert result

        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockFollow, error: null }),
            }),
          }),
        });

        const result = await followUser(followerId, followingId);

        expect(result.error).toBeNull();
        expect(result.data).not.toBeNull();
        expect(result.data?.follower_id).toBe(followerId);
        expect(result.data?.following_id).toBe(followingId);
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('should remove follow relationship on unfollow', async () => {
    await fc.assert(
      fc.asyncProperty(distinctUserPairArb, async ([followerId, followingId]) => {
        // Setup mock for successful delete
        mockSupabase.from.mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        });

        const result = await unfollowUser(followerId, followingId);

        expect(result.error).toBeNull();
        expect(result.data).not.toBeNull();
        expect(result.data?.success).toBe(true);
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('follow operation should be idempotent - multiple follows return same result', async () => {
    await fc.assert(
      fc.asyncProperty(distinctUserPairArb, async ([followerId, followingId]) => {
        const mockFollow = {
          id: 'mock-follow-id',
          follower_id: followerId,
          following_id: followingId,
          created_at: new Date().toISOString(),
        };

        // Setup mock: existing follow found (idempotent case)
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockFollow, error: null }),
              }),
            }),
          }),
        });

        const result = await followUser(followerId, followingId);

        // Should return existing follow without error
        expect(result.error).toBeNull();
        expect(result.data).not.toBeNull();
        expect(result.data?.follower_id).toBe(followerId);
        expect(result.data?.following_id).toBe(followingId);
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('unfollow operation should be idempotent - multiple unfollows succeed', async () => {
    await fc.assert(
      fc.asyncProperty(distinctUserPairArb, async ([followerId, followingId]) => {
        // Setup mock for delete (succeeds even if relationship doesn't exist)
        mockSupabase.from.mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        });

        // Multiple unfollows should all succeed
        const result1 = await unfollowUser(followerId, followingId);
        const result2 = await unfollowUser(followerId, followingId);

        expect(result1.error).toBeNull();
        expect(result2.error).toBeNull();
        expect(result1.data?.success).toBe(true);
        expect(result2.data?.success).toBe(true);
      }),
      { numRuns: 100, verbose: true }
    );
  });
});


describe('Feature: social-features, Property 8: Follow Counts Accuracy', () => {
  /**
   * Property 8: Follow Counts Accuracy
   * 
   * For any user and any sequence of follow/unfollow operations involving that user,
   * the follower_count should equal the actual count of users following them,
   * and the following_count should equal the actual count of users they follow.
   * 
   * **Validates: Requirements 3.4, 3.5, 3.6**
   */

  beforeEach(() => {
    resetMocks();
  });

  it('follower count should be non-negative for any user', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        fc.nat({ max: 1000 }),
        async (userId, expectedCount) => {
          // Setup mock to return the expected count
          mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: expectedCount,
                error: null,
              }),
            }),
          });

          const result = await getFollowerCount(userId);

          expect(result.error).toBeNull();
          expect(result.data).not.toBeNull();
          expect(result.data).toBeGreaterThanOrEqual(0);
          expect(result.data).toBe(expectedCount);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('following count should be non-negative for any user', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        fc.nat({ max: 1000 }),
        async (userId, expectedCount) => {
          // Setup mock to return the expected count
          mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: expectedCount,
                error: null,
              }),
            }),
          });

          const result = await getFollowingCount(userId);

          expect(result.error).toBeNull();
          expect(result.data).not.toBeNull();
          expect(result.data).toBeGreaterThanOrEqual(0);
          expect(result.data).toBe(expectedCount);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('count queries should return 0 when no follows exist', async () => {
    await fc.assert(
      fc.asyncProperty(uuidArb, async (userId) => {
        // Setup mock to return 0 count
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: 0,
              error: null,
            }),
          }),
        });

        const followerResult = await getFollowerCount(userId);
        const followingResult = await getFollowingCount(userId);

        expect(followerResult.data).toBe(0);
        expect(followingResult.data).toBe(0);
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('count should handle null response gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(uuidArb, async (userId) => {
        // Setup mock to return null count (edge case)
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: null,
              error: null,
            }),
          }),
        });

        const result = await getFollowerCount(userId);

        // Should default to 0 when count is null
        expect(result.error).toBeNull();
        expect(result.data).toBe(0);
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('counts should be consistent across multiple queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        fc.nat({ max: 500 }),
        async (userId, count) => {
          // Setup mock to return consistent count
          mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: count,
                error: null,
              }),
            }),
          });

          // Multiple queries should return same result
          const result1 = await getFollowerCount(userId);
          const result2 = await getFollowerCount(userId);

          expect(result1.data).toBe(result2.data);
          expect(result1.data).toBe(count);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });
});

describe('Feature: social-features, Property 9: Is-Following Flag Accuracy', () => {
  /**
   * Property 9: Is-Following Flag Accuracy
   * 
   * For any pair of users (viewer, target), the is_following flag returned when 
   * viewing the target's profile should be true if and only if a follow relationship 
   * exists from viewer to target.
   * 
   * **Validates: Requirements 3.7**
   */

  beforeEach(() => {
    resetMocks();
  });

  it('should return true when follow relationship exists', async () => {
    await fc.assert(
      fc.asyncProperty(distinctUserPairArb, async ([viewerId, targetId]) => {
        const mockFollow = {
          id: 'mock-follow-id',
          follower_id: viewerId,
          following_id: targetId,
        };

        // Setup mock: follow relationship exists
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: mockFollow, error: null }),
              }),
            }),
          }),
        });

        const result = await getFollowStatus(viewerId, targetId);

        expect(result.error).toBeNull();
        expect(result.data).toBe(true);
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('should return false when follow relationship does not exist', async () => {
    await fc.assert(
      fc.asyncProperty(distinctUserPairArb, async ([viewerId, targetId]) => {
        // Setup mock: no follow relationship
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        });

        const result = await getFollowStatus(viewerId, targetId);

        expect(result.error).toBeNull();
        expect(result.data).toBe(false);
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('is_following should be false for self (viewer === target)', async () => {
    await fc.assert(
      fc.asyncProperty(uuidArb, async (userId) => {
        // Self-follow check should return false without DB call
        const result = await getFollowStatus(userId, userId);

        expect(result.error).toBeNull();
        expect(result.data).toBe(false);
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('is_following flag should be deterministic for same user pair', async () => {
    await fc.assert(
      fc.asyncProperty(
        distinctUserPairArb,
        fc.boolean(),
        async ([viewerId, targetId], followExists) => {
          const mockFollow = followExists
            ? { id: 'mock-id', follower_id: viewerId, following_id: targetId }
            : null;

          // Setup mock with consistent response
          mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: mockFollow, error: null }),
                }),
              }),
            }),
          });

          // Multiple queries should return same result
          const result1 = await getFollowStatus(viewerId, targetId);
          const result2 = await getFollowStatus(viewerId, targetId);

          expect(result1.data).toBe(result2.data);
          expect(result1.data).toBe(followExists);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('is_following should be asymmetric - A follows B does not imply B follows A', async () => {
    await fc.assert(
      fc.asyncProperty(distinctUserPairArb, async ([userA, userB]) => {
        // Setup: A follows B, but B does not follow A
        const mockFollowAtoB = { id: 'mock-id', follower_id: userA, following_id: userB };

        let callCount = 0;
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockImplementation(() => {
                  callCount++;
                  // First call: A->B (exists), Second call: B->A (doesn't exist)
                  if (callCount === 1) {
                    return Promise.resolve({ data: mockFollowAtoB, error: null });
                  }
                  return Promise.resolve({ data: null, error: null });
                }),
              }),
            }),
          }),
        });

        const resultAtoB = await getFollowStatus(userA, userB);
        const resultBtoA = await getFollowStatus(userB, userA);

        // A follows B
        expect(resultAtoB.data).toBe(true);
        // B does not follow A (asymmetric)
        expect(resultBtoA.data).toBe(false);
      }),
      { numRuns: 100, verbose: true }
    );
  });
});
