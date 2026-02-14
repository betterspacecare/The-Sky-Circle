/**
 * Gear Service
 * Service functions for managing user astronomy equipment (gears)
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { createClient } from '@/lib/supabase/client';
import { UserGear, GearType } from '@/types/social.types';

/**
 * Valid gear types for validation
 * Validates: Requirement 1.5
 */
export const VALID_GEAR_TYPES: GearType[] = [
  'telescope',
  'camera',
  'mount',
  'eyepiece',
  'filter',
  'accessory',
];

/**
 * Input data for creating or updating a gear
 */
export interface GearInput {
  name: string;
  gear_type: string;
  brand?: string | null;
  model?: string | null;
  notes?: string | null;
}

/**
 * Service response type for consistent error handling
 */
export interface GearServiceResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Validates that a gear type is one of the allowed values
 * Validates: Requirement 1.5
 */
export function isValidGearType(gearType: string): gearType is GearType {
  return VALID_GEAR_TYPES.includes(gearType as GearType);
}

/**
 * Fetches all gears for a specific user
 * Validates: Requirement 1.1 - Display list of all equipment items
 * 
 * @param userId - The ID of the user whose gears to fetch
 * @returns Promise with array of UserGear or error
 */
export async function fetchUserGears(
  userId: string
): Promise<GearServiceResponse<UserGear[]>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_gears')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as UserGear[], error: null };
}


/**
 * Creates a new gear for a user
 * Validates: Requirements 1.2, 1.5
 * - Creates gear record with name, type, brand, model, and optional notes
 * - Validates gear_type against allowed values
 * 
 * @param userId - The ID of the user creating the gear
 * @param gearData - The gear data to create
 * @returns Promise with created UserGear or error
 */
export async function createGear(
  userId: string,
  gearData: GearInput
): Promise<GearServiceResponse<UserGear>> {
  // Validate gear type
  if (!isValidGearType(gearData.gear_type)) {
    return {
      data: null,
      error: `Invalid gear type: ${gearData.gear_type}. Valid types are: ${VALID_GEAR_TYPES.join(', ')}`,
    };
  }

  // Validate required name field
  if (!gearData.name || gearData.name.trim() === '') {
    return {
      data: null,
      error: 'Gear name is required',
    };
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_gears')
    .insert({
      user_id: userId,
      name: gearData.name.trim(),
      gear_type: gearData.gear_type,
      brand: gearData.brand?.trim() || null,
      model: gearData.model?.trim() || null,
      notes: gearData.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as UserGear, error: null };
}

/**
 * Updates an existing gear with ownership check
 * Validates: Requirements 1.3, 1.5
 * - Updates gear record with modified information
 * - Validates gear_type if provided
 * - RLS policy ensures only owner can update
 * 
 * @param gearId - The ID of the gear to update
 * @param gearData - The gear data to update
 * @returns Promise with updated UserGear or error
 */
export async function updateGear(
  gearId: string,
  gearData: Partial<GearInput>
): Promise<GearServiceResponse<UserGear>> {
  // Validate gear type if provided
  if (gearData.gear_type !== undefined && !isValidGearType(gearData.gear_type)) {
    return {
      data: null,
      error: `Invalid gear type: ${gearData.gear_type}. Valid types are: ${VALID_GEAR_TYPES.join(', ')}`,
    };
  }

  // Validate name if provided
  if (gearData.name !== undefined && gearData.name.trim() === '') {
    return {
      data: null,
      error: 'Gear name cannot be empty',
    };
  }

  const supabase = createClient();

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};
  if (gearData.name !== undefined) updateData.name = gearData.name.trim();
  if (gearData.gear_type !== undefined) updateData.gear_type = gearData.gear_type;
  if (gearData.brand !== undefined) updateData.brand = gearData.brand?.trim() || null;
  if (gearData.model !== undefined) updateData.model = gearData.model?.trim() || null;
  if (gearData.notes !== undefined) updateData.notes = gearData.notes?.trim() || null;

  // RLS policy ensures only the owner can update their gear
  const { data, error } = await supabase
    .from('user_gears')
    .update(updateData)
    .eq('id', gearId)
    .select()
    .single();

  if (error) {
    // Handle case where gear doesn't exist or user doesn't own it
    if (error.code === 'PGRST116') {
      return { data: null, error: 'Gear not found or you do not have permission to update it' };
    }
    return { data: null, error: error.message };
  }

  return { data: data as UserGear, error: null };
}

/**
 * Deletes a gear with ownership check
 * Validates: Requirement 1.4
 * - Removes gear record from user's profile
 * - RLS policy ensures only owner can delete
 * 
 * @param gearId - The ID of the gear to delete
 * @returns Promise with success boolean or error
 */
export async function deleteGear(
  gearId: string
): Promise<GearServiceResponse<{ success: boolean }>> {
  const supabase = createClient();

  // RLS policy ensures only the owner can delete their gear
  const { error } = await supabase
    .from('user_gears')
    .delete()
    .eq('id', gearId);

  if (error) {
    return { data: null, error: error.message };
  }

  // The RLS policy will silently fail if user doesn't own the gear
  return { data: { success: true }, error: null };
}

/**
 * Fetches a single gear by ID
 * Useful for verifying gear exists and checking ownership
 * 
 * @param gearId - The ID of the gear to fetch
 * @returns Promise with UserGear or error
 */
export async function fetchGearById(
  gearId: string
): Promise<GearServiceResponse<UserGear>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_gears')
    .select('*')
    .eq('id', gearId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: null, error: 'Gear not found' };
    }
    return { data: null, error: error.message };
  }

  return { data: data as UserGear, error: null };
}
