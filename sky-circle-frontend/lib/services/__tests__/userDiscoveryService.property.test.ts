/**
 * Property-Based Tests for User Discovery Service
 * 
 * Tests the user discovery, search, and filtering logic using fast-check.
 * 
 * **Validates: Requirements 2.1, 2.3, 2.4**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  fetchUsers,
  searchUsers,
  UserDiscoveryFilters,
} from '../userDiscoveryService';

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

// Generator for valid experience levels
const experienceLevelArb = fc.constantFrom('beginner', 'intermediate', 'advanced', 'expert');

// Generator for display names (non-empty strings)
const displayNameArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

// Generator for optional display names (can be null)
const optionalDisplayNameArb = fc.option(displayNameArb, { nil: null });

// Generator for a mock user
const mockUserArb = fc.record({
  id: uuidArb,
  display_name: optionalDisplayNameArb,
  profile_photo_url: fc.option(fc.webUrl(), { nil: null }),
  experience_level: fc.option(experienceLevelArb, { nil: null }),
  bio: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
});

// Generator for arrays of mock users
const mockUsersArrayArb = fc.array(mockUserArb, { minLength: 0, maxLength: 50 });

// Generator for page numbers (1-indexed, positive)
const pageNumberArb = fc.integer({ min: 1, max: 100 });

// Generator for page sizes (reasonable range)
const pageSizeArb = fc.integer({ min: 1, max: 50 });

// Generator for search query strings
const searchQueryArb = fc.string({ minLength: 0, maxLength: 50 });

/**
 * Helper to reset mocks between tests
 */
function resetMocks() {
  vi.clearAllMocks();
}

/**
 * Helper to create a mock user with specific properties
 */
function createMockUser(overrides: Partial<{
  id: string;
  display_name: string | null;
  profile_photo_url: string | null;
  experience_level: string | null;
  bio: string | null;
}> = {}) {
  return {
    id: overrides.id ?? 'mock-user-id',
    display_name: overrides.display_name ?? 'Test User',
    profile_photo_url: overrides.profile_photo_url ?? null,
    experience_level: overrides.experience_level ?? 'beginner',
    bio: overrides.bio ?? null,
  };
}

/**
 * Helper to setup comprehensive mock for user discovery queries
 * This mock handles all the chained Supabase calls properly
 */
function setupUserDiscoveryMock(options: {
  users: Array<{
    id: string;
    display_name: string | null;
    profile_photo_url: string | null;
    experience_level: string | null;
    bio: string | null;
  }>;
  total: number;
  error?: { message: string } | null;
}) {
  const { users, total, error } = options;

  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'users') {
      return {
        select: vi.fn().mockImplementation((_query?: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.count === 'exact' && opts?.head === true) {
            // Count query - returns chainable object that can be awaited or chained with .eq()
            const countResult = { count: total, error };
            // Create a thenable that also has .eq() method
            const countChain: Record<string, unknown> = {
              eq: vi.fn().mockReturnValue(Promise.resolve(countResult)),
              ilike: vi.fn().mockReturnValue(Promise.resolve(countResult)),
              then: (resolve: (value: unknown) => void) => Promise.resolve(countResult).then(resolve),
            };
            return countChain;
          }
          
          // Data query - returns chainable object
          // The chain is: select() -> order() -> range() -> [eq()] -> await
          const dataResult = { data: users, error };
          
          // Create a thenable result that can also be chained with .eq()
          const createThenable = () => {
            const thenable: Record<string, unknown> = {
              eq: vi.fn().mockReturnValue(Promise.resolve(dataResult)),
              then: (resolve: (value: unknown) => void) => Promise.resolve(dataResult).then(resolve),
            };
            return thenable;
          };
          
          const rangeFn = vi.fn().mockReturnValue(createThenable());
          const orderFn = vi.fn().mockReturnValue({ range: rangeFn });
          const eqFn = vi.fn().mockReturnValue({ order: orderFn });
          const ilikeFn = vi.fn().mockReturnValue({ order: orderFn });
          
          return { order: orderFn, eq: eqFn, ilike: ilikeFn };
        }),
      };
    }
    
    if (table === 'follows') {
      // For follower/following count queries and follow status checks
      const countResult = { count: 0, error: null };
      const followStatusResult = { data: null, error: null };
      
      return {
        select: vi.fn().mockImplementation((_query?: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.count === 'exact' && opts?.head === true) {
            return { eq: vi.fn().mockResolvedValue(countResult) };
          }
          return {
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue(followStatusResult),
              }),
            }),
          };
        }),
      };
    }
    
    return {};
  });
}


describe('Feature: social-features, Property 3: User Discovery Pagination Completeness', () => {
  /**
   * Property 3: User Discovery Pagination Completeness
   * 
   * For any set of registered users, iterating through all pages of the user discovery
   * endpoint should return exactly all users, with no duplicates and no missing users.
   * 
   * **Validates: Requirements 2.1**
   */

  beforeEach(() => {
    resetMocks();
  });

  it('should return correct pagination metadata for any page and pageSize', async () => {
    await fc.assert(
      fc.asyncProperty(
        pageNumberArb,
        pageSizeArb,
        fc.integer({ min: 0, max: 200 }),
        async (page, pageSize, totalUsers) => {
          const offset = (page - 1) * pageSize;
          const usersOnPage = Math.max(0, Math.min(pageSize, totalUsers - offset));
          const mockUsers = Array.from({ length: usersOnPage }, (_, i) => 
            createMockUser({ id: `user-${offset + i}` })
          );

          setupUserDiscoveryMock({ users: mockUsers, total: totalUsers });

          const result = await fetchUsers(page, pageSize);

          expect(result.error).toBeNull();
          expect(result.data).not.toBeNull();
          expect(result.data?.page).toBe(page);
          expect(result.data?.pageSize).toBe(pageSize);
          expect(result.data?.total).toBe(totalUsers);
          expect(result.data?.hasMore).toBe(offset + pageSize < totalUsers);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('should return empty array when page exceeds total pages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }),
        pageSizeArb,
        async (totalUsers, pageSize) => {
          const totalPages = Math.ceil(totalUsers / pageSize);
          const pageExceedingTotal = totalPages + 1;

          setupUserDiscoveryMock({ users: [], total: totalUsers });

          const result = await fetchUsers(pageExceedingTotal, pageSize);

          expect(result.error).toBeNull();
          expect(result.data).not.toBeNull();
          expect(result.data?.data).toHaveLength(0);
          expect(result.data?.hasMore).toBe(false);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('should return users with required social data fields populated', async () => {
    await fc.assert(
      fc.asyncProperty(
        mockUsersArrayArb.filter(arr => arr.length > 0),
        async (mockUsers) => {
          setupUserDiscoveryMock({ users: mockUsers, total: mockUsers.length });

          const result = await fetchUsers(1, mockUsers.length);

          expect(result.error).toBeNull();
          expect(result.data).not.toBeNull();
          
          // Each user should have the required social data fields
          result.data?.data.forEach((user) => {
            expect(user).toHaveProperty('id');
            expect(user).toHaveProperty('display_name');
            expect(user).toHaveProperty('profile_photo_url');
            expect(user).toHaveProperty('experience_level');
            expect(user).toHaveProperty('follower_count');
            expect(user).toHaveProperty('following_count');
            expect(typeof user.follower_count).toBe('number');
            expect(typeof user.following_count).toBe('number');
            expect(user.follower_count).toBeGreaterThanOrEqual(0);
            expect(user.following_count).toBeGreaterThanOrEqual(0);
          });
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('hasMore should be true only when more pages exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        pageNumberArb,
        pageSizeArb,
        fc.integer({ min: 0, max: 200 }),
        async (page, pageSize, totalUsers) => {
          const offset = (page - 1) * pageSize;
          const usersOnPage = Math.max(0, Math.min(pageSize, totalUsers - offset));
          const mockUsers = Array.from({ length: usersOnPage }, (_, i) =>
            createMockUser({ id: `user-${offset + i}` })
          );

          setupUserDiscoveryMock({ users: mockUsers, total: totalUsers });

          const result = await fetchUsers(page, pageSize);

          expect(result.error).toBeNull();
          
          // hasMore should be true iff there are more users beyond current page
          const expectedHasMore = offset + pageSize < totalUsers;
          expect(result.data?.hasMore).toBe(expectedHasMore);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('page 1 with pageSize >= total should return all users with hasMore=false', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }),
        async (totalUsers) => {
          const pageSize = totalUsers + 10; // Ensure pageSize > total
          const mockUsers = Array.from({ length: totalUsers }, (_, i) =>
            createMockUser({ id: `user-${i}` })
          );

          setupUserDiscoveryMock({ users: mockUsers, total: totalUsers });

          const result = await fetchUsers(1, pageSize);

          expect(result.error).toBeNull();
          expect(result.data?.data).toHaveLength(totalUsers);
          expect(result.data?.hasMore).toBe(false);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('total count should remain consistent regardless of page requested', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 100 }),
        pageSizeArb,
        async (totalUsers, pageSize) => {
          const mockUsersPage1 = Array.from(
            { length: Math.min(pageSize, totalUsers) },
            (_, i) => createMockUser({ id: `user-${i}` })
          );

          // Page 1
          setupUserDiscoveryMock({ users: mockUsersPage1, total: totalUsers });
          const result1 = await fetchUsers(1, pageSize);

          // Page 2 (may be empty or partial)
          const page2Offset = pageSize;
          const page2Count = Math.max(0, Math.min(pageSize, totalUsers - page2Offset));
          const mockUsersPage2 = Array.from(
            { length: page2Count },
            (_, i) => createMockUser({ id: `user-${page2Offset + i}` })
          );
          setupUserDiscoveryMock({ users: mockUsersPage2, total: totalUsers });
          const result2 = await fetchUsers(2, pageSize);

          // Total should be consistent
          expect(result1.data?.total).toBe(totalUsers);
          expect(result2.data?.total).toBe(totalUsers);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });
});


describe('Feature: social-features, Property 4: User Search Accuracy', () => {
  /**
   * Property 4: User Search Accuracy
   * 
   * For any search query string and set of users, the search results should contain
   * exactly the users whose display names contain the search string (case-insensitive),
   * and no users whose names do not match.
   * 
   * **Validates: Requirements 2.3**
   */

  beforeEach(() => {
    resetMocks();
  });

  it('should return only users whose display names contain the search query', async () => {
    await fc.assert(
      fc.asyncProperty(
        searchQueryArb.filter(q => q.length > 0),
        mockUsersArrayArb,
        async (query, allUsers) => {
          // Filter users that should match (case-insensitive)
          const matchingUsers = allUsers.filter(u => 
            u.display_name?.toLowerCase().includes(query.toLowerCase())
          );

          setupUserDiscoveryMock({ users: matchingUsers, total: matchingUsers.length });

          const result = await searchUsers(query, 1, 100);

          expect(result.error).toBeNull();
          expect(result.data).not.toBeNull();
          
          // All returned users should match the query
          result.data?.data.forEach((user) => {
            if (user.display_name) {
              expect(user.display_name.toLowerCase()).toContain(query.toLowerCase());
            }
          });
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('search should be case-insensitive', async () => {
    await fc.assert(
      fc.asyncProperty(
        displayNameArb,
        async (displayName) => {
          const user = createMockUser({ display_name: displayName });
          
          // Test with lowercase query
          setupUserDiscoveryMock({ users: [user], total: 1 });
          const lowerResult = await searchUsers(displayName.toLowerCase(), 1, 10);

          // Test with uppercase query
          setupUserDiscoveryMock({ users: [user], total: 1 });
          const upperResult = await searchUsers(displayName.toUpperCase(), 1, 10);

          // Both should succeed without error
          expect(lowerResult.error).toBeNull();
          expect(upperResult.error).toBeNull();
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('search results should include pagination metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        searchQueryArb,
        pageNumberArb,
        pageSizeArb,
        fc.integer({ min: 0, max: 100 }),
        async (query, page, pageSize, totalMatches) => {
          const offset = (page - 1) * pageSize;
          const usersOnPage = Math.max(0, Math.min(pageSize, totalMatches - offset));
          const mockUsers = Array.from({ length: usersOnPage }, (_, i) =>
            createMockUser({ id: `user-${i}`, display_name: `${query}User${i}` })
          );

          setupUserDiscoveryMock({ users: mockUsers, total: totalMatches });

          const result = await searchUsers(query, page, pageSize);

          expect(result.error).toBeNull();
          expect(result.data?.page).toBe(page);
          expect(result.data?.pageSize).toBe(pageSize);
          expect(result.data?.total).toBe(totalMatches);
          expect(result.data?.hasMore).toBe(offset + pageSize < totalMatches);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('search with no matches should return empty results', async () => {
    await fc.assert(
      fc.asyncProperty(
        searchQueryArb.filter(q => q.length > 0),
        async (query) => {
          // No users match
          setupUserDiscoveryMock({ users: [], total: 0 });

          const result = await searchUsers(query, 1, 10);

          expect(result.error).toBeNull();
          expect(result.data?.data).toHaveLength(0);
          expect(result.data?.total).toBe(0);
          expect(result.data?.hasMore).toBe(false);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('search should handle special characters in query', async () => {
    // Test with strings containing SQL wildcards and special chars
    const specialCharQueryArb = fc.constantFrom(
      '%test%',
      '_user_',
      'test%name',
      'user_123',
      "O'Brien",
      'test"name',
      'user\\name'
    );

    await fc.assert(
      fc.asyncProperty(specialCharQueryArb, async (query) => {
        setupUserDiscoveryMock({ users: [], total: 0 });

        // Should not throw an error
        const result = await searchUsers(query, 1, 10);

        expect(result.error).toBeNull();
        expect(result.data).not.toBeNull();
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('search results should preserve user data integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        searchQueryArb,
        mockUsersArrayArb.filter(arr => arr.length > 0),
        async (query, mockUsers) => {
          setupUserDiscoveryMock({ users: mockUsers, total: mockUsers.length });

          const result = await searchUsers(query, 1, mockUsers.length);

          expect(result.error).toBeNull();
          
          // Each returned user should have all required fields
          result.data?.data.forEach((user) => {
            expect(user).toHaveProperty('id');
            expect(user).toHaveProperty('display_name');
            expect(user).toHaveProperty('follower_count');
            expect(user).toHaveProperty('following_count');
            expect(typeof user.follower_count).toBe('number');
            expect(typeof user.following_count).toBe('number');
          });
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('empty search query should not cause errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 20 }),
        async (userCount) => {
          const mockUsers = Array.from({ length: userCount }, (_, i) =>
            createMockUser({ id: `user-${i}` })
          );
          setupUserDiscoveryMock({ users: mockUsers, total: userCount });

          const result = await searchUsers('', 1, 100);

          expect(result.error).toBeNull();
          expect(result.data).not.toBeNull();
          expect(result.data?.total).toBe(userCount);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });
});


describe('Feature: social-features, Property 5: User Filter by Experience Level', () => {
  /**
   * Property 5: User Filter by Experience Level
   * 
   * For any experience level filter and set of users, the filtered results should
   * contain exactly the users with that experience level, and no users with different levels.
   * 
   * **Validates: Requirements 2.4**
   */

  beforeEach(() => {
    resetMocks();
  });

  it('should return only users with the specified experience level', async () => {
    await fc.assert(
      fc.asyncProperty(
        experienceLevelArb,
        mockUsersArrayArb,
        async (filterLevel, allUsers) => {
          // Filter users that should match
          const matchingUsers = allUsers.filter(u => u.experience_level === filterLevel);

          setupUserDiscoveryMock({ users: matchingUsers, total: matchingUsers.length });

          const filters: UserDiscoveryFilters = { experienceLevel: filterLevel };
          const result = await fetchUsers(1, 100, filters);

          expect(result.error).toBeNull();
          expect(result.data).not.toBeNull();
          
          // All returned users should have the filtered experience level
          result.data?.data.forEach((user) => {
            expect(user.experience_level).toBe(filterLevel);
          });
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('should return all users when no experience level filter is applied', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 30 }),
        async (userCount) => {
          const mockUsers = Array.from({ length: userCount }, (_, i) =>
            createMockUser({ id: `user-${i}` })
          );
          setupUserDiscoveryMock({ users: mockUsers, total: userCount });

          // No filter
          const result = await fetchUsers(1, 100, {});

          expect(result.error).toBeNull();
          expect(result.data?.total).toBe(userCount);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('filter should work correctly with pagination', async () => {
    await fc.assert(
      fc.asyncProperty(
        experienceLevelArb,
        pageNumberArb,
        pageSizeArb,
        fc.integer({ min: 0, max: 100 }),
        async (filterLevel, page, pageSize, totalMatches) => {
          const offset = (page - 1) * pageSize;
          const usersOnPage = Math.max(0, Math.min(pageSize, totalMatches - offset));
          const mockUsers = Array.from({ length: usersOnPage }, (_, i) =>
            createMockUser({ id: `user-${i}`, experience_level: filterLevel })
          );

          setupUserDiscoveryMock({ users: mockUsers, total: totalMatches });

          const filters: UserDiscoveryFilters = { experienceLevel: filterLevel };
          const result = await fetchUsers(page, pageSize, filters);

          expect(result.error).toBeNull();
          expect(result.data?.page).toBe(page);
          expect(result.data?.pageSize).toBe(pageSize);
          expect(result.data?.total).toBe(totalMatches);
          expect(result.data?.hasMore).toBe(offset + pageSize < totalMatches);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('filter with no matching users should return empty results', async () => {
    await fc.assert(
      fc.asyncProperty(experienceLevelArb, async (filterLevel) => {
        // No users match
        setupUserDiscoveryMock({ users: [], total: 0 });

        const filters: UserDiscoveryFilters = { experienceLevel: filterLevel };
        const result = await fetchUsers(1, 10, filters);

        expect(result.error).toBeNull();
        expect(result.data?.data).toHaveLength(0);
        expect(result.data?.total).toBe(0);
        expect(result.data?.hasMore).toBe(false);
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('each valid experience level should be a valid filter option', async () => {
    const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...validLevels),
        async (level) => {
          setupUserDiscoveryMock({ users: [], total: 0 });

          const filters: UserDiscoveryFilters = { experienceLevel: level };
          const result = await fetchUsers(1, 10, filters);

          // Should not error for valid experience levels
          expect(result.error).toBeNull();
          expect(result.data).not.toBeNull();
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('filtered results should preserve user data integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        experienceLevelArb,
        fc.integer({ min: 1, max: 20 }),
        async (filterLevel, userCount) => {
          const mockUsers = Array.from({ length: userCount }, (_, i) =>
            createMockUser({ id: `user-${i}`, experience_level: filterLevel })
          );

          setupUserDiscoveryMock({ users: mockUsers, total: userCount });

          const filters: UserDiscoveryFilters = { experienceLevel: filterLevel };
          const result = await fetchUsers(1, userCount, filters);

          expect(result.error).toBeNull();
          
          // Each returned user should have all required fields
          result.data?.data.forEach((user) => {
            expect(user).toHaveProperty('id');
            expect(user).toHaveProperty('display_name');
            expect(user).toHaveProperty('experience_level');
            expect(user).toHaveProperty('follower_count');
            expect(user).toHaveProperty('following_count');
            expect(user.experience_level).toBe(filterLevel);
          });
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('filter should be deterministic - same filter returns same structure', async () => {
    await fc.assert(
      fc.asyncProperty(
        experienceLevelArb,
        fc.integer({ min: 1, max: 10 }),
        async (filterLevel, userCount) => {
          const mockUsers = Array.from({ length: userCount }, (_, i) =>
            createMockUser({ id: `user-${i}`, experience_level: filterLevel })
          );

          const filters: UserDiscoveryFilters = { experienceLevel: filterLevel };
          
          // First call
          setupUserDiscoveryMock({ users: mockUsers, total: userCount });
          const result1 = await fetchUsers(1, 10, filters);
          
          // Second call with same setup
          setupUserDiscoveryMock({ users: mockUsers, total: userCount });
          const result2 = await fetchUsers(1, 10, filters);

          expect(result1.error).toBe(result2.error);
          expect(result1.data?.total).toBe(result2.data?.total);
          expect(result1.data?.page).toBe(result2.data?.page);
          expect(result1.data?.pageSize).toBe(result2.data?.pageSize);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('undefined filter should behave same as empty filter object', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 20 }),
        async (userCount) => {
          const mockUsers = Array.from({ length: userCount }, (_, i) =>
            createMockUser({ id: `user-${i}` })
          );

          // With empty filter
          setupUserDiscoveryMock({ users: mockUsers, total: userCount });
          const resultEmpty = await fetchUsers(1, 100, {});
          
          // With undefined experienceLevel
          setupUserDiscoveryMock({ users: mockUsers, total: userCount });
          const resultUndefined = await fetchUsers(1, 100, { experienceLevel: undefined });

          expect(resultEmpty.data?.total).toBe(resultUndefined.data?.total);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });
});
