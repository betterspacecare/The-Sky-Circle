/**
 * Interests Service
 * Service functions for managing user interests
 * 
 * Validates: Requirements 5.1, 5.2, 5.3
 */

import { createClient } from '@/lib/supabase/client';
import { Interest } from '@/types/social.types';

/**
 * Service response type for consistent error handling
 */
export interface InterestsServiceResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Fetches all available interests from the lookup table
 * Validates: Requirement 5.2
 * - Returns all predefined interest categories
 * 
 * @returns Promise with array of Interest or error
 */
export async function fetchAllInterests(): Promise<InterestsServiceResponse<Interest[]>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('interests')
    .select('*')
    .order('display_name', { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Interest[], error: null };
}

/**
 * Fetches a user's selected interests
 * Validates: Requirement 5.1
 * - Returns the interests selected by a specific user
 * 
 * @param userId - The ID of the user whose interests to fetch
 * @returns Promise with array of Interest or error
 */
export async function fetchUserInterests(
  userId: string
): Promise<InterestsServiceResponse<Interest[]>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_interests')
    .select(`
      id,
      user_id,
      interest_id,
      created_at,
      interests (
        id,
        name,
        display_name,
        category
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  // Extract the interest objects from the joined data
  // Supabase returns single relations as objects, not arrays
  const interests: Interest[] = (data || [])
    .map((ui: { interests: Interest | Interest[] | null }) => {
      // Handle both single object and array cases
      if (Array.isArray(ui.interests)) {
        return ui.interests[0] || null;
      }
      return ui.interests;
    })
    .filter((interest): interest is Interest => interest !== null);

  return { data: interests, error: null };
}

/**
 * Updates a user's selected interests
 * Validates: Requirements 5.1, 5.3
 * - Replaces user's interests with new selection
 * - Deletes existing interests and inserts new ones
 * 
 * @param userId - The ID of the user to update interests for
 * @param interestIds - Array of interest IDs to set as user's interests
 * @returns Promise with array of Interest or error
 */
export async function updateUserInterests(
  userId: string,
  interestIds: string[]
): Promise<InterestsServiceResponse<Interest[]>> {
  const supabase = createClient();

  // Delete existing user interests
  const { error: deleteError } = await supabase
    .from('user_interests')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    return { data: null, error: deleteError.message };
  }

  // If no interests to add, return empty array
  if (interestIds.length === 0) {
    return { data: [], error: null };
  }

  // Insert new user interests
  const insertData = interestIds.map((interestId) => ({
    user_id: userId,
    interest_id: interestId,
  }));

  const { error: insertError } = await supabase
    .from('user_interests')
    .insert(insertData);

  if (insertError) {
    return { data: null, error: insertError.message };
  }

  // Fetch and return the updated interests
  return fetchUserInterests(userId);
}
