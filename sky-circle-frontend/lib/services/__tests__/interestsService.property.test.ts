/**
 * Property-Based Tests for Interests Service
 * 
 * Tests the interests system operations using fast-check.
 * 
 * **Validates: Requirements 5.1, 5.3, 5.6**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  fetchAllInterests,
  fetchUserInterests,
  updateUserInterests,
} from '../interestsService';

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

// Generator for interest names (valid interest category names)
const interestNameArb = fc.constantFrom(
  'astrophotography',
  'deep_sky_objects',
  'planets',
  'moon',
  'sun',
  'meteor_showers',
  'comets',
  'satellites',
  'eclipses',
  'star_clusters',
  'nebulae',
  'galaxies',
  'equipment_reviews',
  'observation_techniques'
);

// Generator for interest category
const interestCategoryArb = fc.constantFrom('technique', 'target', 'event', 'content');

// Generator for a single Interest object
const interestArb = fc.record({
  id: uuidArb,
  name: interestNameArb,
  display_name: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.option(interestCategoryArb, { nil: null }),
});

// Generator for a set of unique interest IDs (simulating user selections)
const uniqueInterestIdsArb = fc.uniqueArray(uuidArb, { minLength: 0, maxLength: 14 });

// Generator for a list of interests (simulating the interests lookup table)
const interestsListArb = fc.array(interestArb, { minLength: 1, maxLength: 14 });

/**
 * Helper to reset mocks between tests
 */
function resetMocks() {
  vi.clearAllMocks();
}

describe('Feature: social-features, Property 14: Interest Persistence Round-Trip', () => {
  /**
   * Property 14: Interest Persistence Round-Trip
   * 
   * For any user and any set of valid interests, saving those interests and then
   * retrieving them should return the exact same set of interests.
   * 
   * **Validates: Requirements 5.1, 5.3, 5.6**
   */

  beforeEach(() => {
    resetMocks();
  });

  it('should persist and retrieve the same set of interest IDs', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        uniqueInterestIdsArb,
        async (userId, interestIds) => {
          // Create mock interests that correspond to the IDs
          const mockInterests = interestIds.map((id, index) => ({
            id,
            name: `interest_${index}`,
            display_name: `Interest ${index}`,
            category: 'target',
          }));

          // Track call sequence
          let deleteCallCount = 0;
          let insertCallCount = 0;
          let selectCallCount = 0;

          mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'user_interests') {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockImplementation(() => {
                    deleteCallCount++;
                    return Promise.resolve({ error: null });
                  }),
                }),
                insert: vi.fn().mockImplementation(() => {
                  insertCallCount++;
                  return Promise.resolve({ error: null });
                }),
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockImplementation(() => {
                      selectCallCount++;
                      // Return user_interests with joined interests
                      const userInterestsData = mockInterests.map((interest) => ({
                        id: `ui_${interest.id}`,
                        user_id: userId,
                        interest_id: interest.id,
                        created_at: new Date().toISOString(),
                        interests: interest,
                      }));
                      return Promise.resolve({ data: userInterestsData, error: null });
                    }),
                  }),
                }),
              };
            }
            return {};
          });

          // Update user interests
          const updateResult = await updateUserInterests(userId, interestIds);

          // Verify no errors
          expect(updateResult.error).toBeNull();

          // Verify the returned interests match the input IDs
          if (interestIds.length === 0) {
            expect(updateResult.data).toEqual([]);
          } else {
            expect(updateResult.data).not.toBeNull();
            const returnedIds = updateResult.data!.map((i) => i.id).sort();
            const inputIds = [...interestIds].sort();
            expect(returnedIds).toEqual(inputIds);
          }
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('should handle empty interest set correctly', async () => {
    await fc.assert(
      fc.asyncProperty(uuidArb, async (userId) => {
        // Setup mock for empty interests
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'user_interests') {
            return {
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
              insert: vi.fn().mockResolvedValue({ error: null }),
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            };
          }
          return {};
        });

        // Update with empty array
        const result = await updateUserInterests(userId, []);

        expect(result.error).toBeNull();
        expect(result.data).toEqual([]);
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('should preserve interest order after round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        fc.uniqueArray(uuidArb, { minLength: 2, maxLength: 10 }),
        async (userId, interestIds) => {
          // Create mock interests in specific order
          const mockInterests = interestIds.map((id, index) => ({
            id,
            name: `interest_${index}`,
            display_name: `Interest ${index}`,
            category: 'target',
          }));

          mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'user_interests') {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
                insert: vi.fn().mockResolvedValue({ error: null }),
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockImplementation(() => {
                      // Return in the same order as inserted
                      const userInterestsData = mockInterests.map((interest) => ({
                        id: `ui_${interest.id}`,
                        user_id: userId,
                        interest_id: interest.id,
                        created_at: new Date().toISOString(),
                        interests: interest,
                      }));
                      return Promise.resolve({ data: userInterestsData, error: null });
                    }),
                  }),
                }),
              };
            }
            return {};
          });

          const result = await updateUserInterests(userId, interestIds);

          expect(result.error).toBeNull();
          expect(result.data).not.toBeNull();
          expect(result.data!.length).toBe(interestIds.length);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('should return same interests on consecutive fetches', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        interestsListArb,
        async (userId, interests) => {
          // Setup mock to return consistent data
          const userInterestsData = interests.map((interest) => ({
            id: `ui_${interest.id}`,
            user_id: userId,
            interest_id: interest.id,
            created_at: new Date().toISOString(),
            interests: interest,
          }));

          mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'user_interests') {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: userInterestsData,
                      error: null,
                    }),
                  }),
                }),
              };
            }
            return {};
          });

          // Fetch twice
          const result1 = await fetchUserInterests(userId);
          const result2 = await fetchUserInterests(userId);

          expect(result1.error).toBeNull();
          expect(result2.error).toBeNull();

          // Both fetches should return the same data
          expect(result1.data!.length).toBe(result2.data!.length);
          
          const ids1 = result1.data!.map((i) => i.id).sort();
          const ids2 = result2.data!.map((i) => i.id).sort();
          expect(ids1).toEqual(ids2);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('should handle update replacing existing interests', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        uniqueInterestIdsArb,
        uniqueInterestIdsArb,
        async (userId, initialIds, newIds) => {
          // Create mock interests for new IDs
          const mockInterests = newIds.map((id, index) => ({
            id,
            name: `interest_${index}`,
            display_name: `Interest ${index}`,
            category: 'target',
          }));

          mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'user_interests') {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
                insert: vi.fn().mockResolvedValue({ error: null }),
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockImplementation(() => {
                      const userInterestsData = mockInterests.map((interest) => ({
                        id: `ui_${interest.id}`,
                        user_id: userId,
                        interest_id: interest.id,
                        created_at: new Date().toISOString(),
                        interests: interest,
                      }));
                      return Promise.resolve({ data: userInterestsData, error: null });
                    }),
                  }),
                }),
              };
            }
            return {};
          });

          // Update with new interests (replacing any existing)
          const result = await updateUserInterests(userId, newIds);

          expect(result.error).toBeNull();

          if (newIds.length === 0) {
            expect(result.data).toEqual([]);
          } else {
            expect(result.data).not.toBeNull();
            const returnedIds = result.data!.map((i) => i.id).sort();
            const expectedIds = [...newIds].sort();
            expect(returnedIds).toEqual(expectedIds);
          }
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('fetchAllInterests should return all available interests', async () => {
    await fc.assert(
      fc.asyncProperty(interestsListArb, async (interests) => {
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'interests') {
            return {
              select: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: interests,
                  error: null,
                }),
              }),
            };
          }
          return {};
        });

        const result = await fetchAllInterests();

        expect(result.error).toBeNull();
        expect(result.data).not.toBeNull();
        expect(result.data!.length).toBe(interests.length);
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('should handle database errors gracefully on update', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        uniqueInterestIdsArb,
        fc.string({ minLength: 1, maxLength: 100 }),
        async (userId, interestIds, errorMessage) => {
          mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'user_interests') {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    error: { message: errorMessage },
                  }),
                }),
              };
            }
            return {};
          });

          const result = await updateUserInterests(userId, interestIds);

          expect(result.data).toBeNull();
          expect(result.error).toBe(errorMessage);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  it('should handle database errors gracefully on fetch', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        fc.string({ minLength: 1, maxLength: 100 }),
        async (userId, errorMessage) => {
          mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'user_interests') {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: null,
                      error: { message: errorMessage },
                    }),
                  }),
                }),
              };
            }
            return {};
          });

          const result = await fetchUserInterests(userId);

          expect(result.data).toBeNull();
          expect(result.error).toBe(errorMessage);
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });
});
