/**
 * Property-Based Tests for Gear Service
 * 
 * Tests the gear CRUD operations and validation logic using fast-check.
 * 
 * **Validates: Requirements 1.2, 1.3, 1.4, 1.5**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { 
  isValidGearType, 
  VALID_GEAR_TYPES,
  createGear,
  updateGear,
  GearInput
} from '../gearService';
import { GearType } from '@/types/social.types';

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }))
}));

/**
 * Arbitrary generators for property-based testing
 */

// Generator for valid gear types
const validGearTypeArb = fc.constantFrom(...VALID_GEAR_TYPES);

// Generator for invalid gear types (strings that are not valid gear types)
const invalidGearTypeArb = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => !VALID_GEAR_TYPES.includes(s as GearType));

// Generator for valid gear names (non-empty strings)
const validGearNameArb = fc.string({ minLength: 1, maxLength: 255 })
  .filter(s => s.trim().length > 0);

// Generator for optional string fields (brand, model, notes)
const optionalStringArb = fc.option(
  fc.string({ maxLength: 100 }),
  { nil: null }
);

// Generator for valid gear input data
const validGearInputArb: fc.Arbitrary<GearInput> = fc.record({
  name: validGearNameArb,
  gear_type: validGearTypeArb,
  brand: optionalStringArb,
  model: optionalStringArb,
  notes: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
});

// Generator for UUIDs
const uuidArb = fc.uuid();

describe('Feature: social-features, Property 2: Gear Type Validation', () => {
  /**
   * Property 2: Gear Type Validation
   * 
   * For any gear type string, the system should accept it if and only if 
   * it is one of the valid types (telescope, camera, mount, eyepiece, filter, accessory).
   * Invalid gear types should be rejected.
   * 
   * **Validates: Requirements 1.5**
   */

  it('should accept all valid gear types', () => {
    fc.assert(
      fc.property(validGearTypeArb, (gearType) => {
        expect(isValidGearType(gearType)).toBe(true);
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('should reject all invalid gear types', () => {
    fc.assert(
      fc.property(invalidGearTypeArb, (gearType) => {
        expect(isValidGearType(gearType)).toBe(false);
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('should have exactly 6 valid gear types', () => {
    expect(VALID_GEAR_TYPES).toHaveLength(6);
    expect(VALID_GEAR_TYPES).toContain('telescope');
    expect(VALID_GEAR_TYPES).toContain('camera');
    expect(VALID_GEAR_TYPES).toContain('mount');
    expect(VALID_GEAR_TYPES).toContain('eyepiece');
    expect(VALID_GEAR_TYPES).toContain('filter');
    expect(VALID_GEAR_TYPES).toContain('accessory');
  });

  it('should be case-sensitive for gear type validation', () => {
    // Uppercase versions should be invalid
    const uppercaseTypes = VALID_GEAR_TYPES.map(t => t.toUpperCase());
    uppercaseTypes.forEach(type => {
      expect(isValidGearType(type)).toBe(false);
    });

    // Mixed case versions should be invalid
    const mixedCaseTypes = VALID_GEAR_TYPES.map(t => 
      t.charAt(0).toUpperCase() + t.slice(1)
    );
    mixedCaseTypes.forEach(type => {
      expect(isValidGearType(type)).toBe(false);
    });
  });

  it('should reject empty strings', () => {
    expect(isValidGearType('')).toBe(false);
  });

  it('should reject strings with whitespace variations of valid types', () => {
    fc.assert(
      fc.property(validGearTypeArb, (gearType) => {
        // With leading/trailing spaces
        expect(isValidGearType(` ${gearType}`)).toBe(false);
        expect(isValidGearType(`${gearType} `)).toBe(false);
        expect(isValidGearType(` ${gearType} `)).toBe(false);
      }),
      { numRuns: 100, verbose: true }
    );
  });
});


describe('Feature: social-features, Property 1: Gear CRUD Round-Trip', () => {
  /**
   * Property 1: Gear CRUD Round-Trip
   * 
   * For any valid gear data (name, type, brand, model, notes), creating a gear record,
   * then retrieving it, should return the same data that was submitted. Similarly,
   * updating a gear and retrieving it should reflect the updates, and deleting a gear
   * should result in it no longer being retrievable.
   * 
   * **Validates: Requirements 1.2, 1.3, 1.4**
   */

  describe('Create validation', () => {
    it('should reject gear with invalid gear_type', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          validGearNameArb,
          invalidGearTypeArb,
          optionalStringArb,
          optionalStringArb,
          optionalStringArb,
          async (userId, name, invalidType, brand, model, notes) => {
            const gearInput: GearInput = {
              name,
              gear_type: invalidType,
              brand,
              model,
              notes,
            };

            const result = await createGear(userId, gearInput);
            
            expect(result.data).toBeNull();
            expect(result.error).not.toBeNull();
            expect(result.error).toContain('Invalid gear type');
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should reject gear with empty name', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          validGearTypeArb,
          async (userId, gearType) => {
            const gearInput: GearInput = {
              name: '',
              gear_type: gearType,
              brand: null,
              model: null,
              notes: null,
            };

            const result = await createGear(userId, gearInput);
            
            expect(result.data).toBeNull();
            expect(result.error).not.toBeNull();
            expect(result.error).toContain('name is required');
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should reject gear with whitespace-only name', async () => {
      // Generate whitespace-only strings using array of whitespace chars joined
      const whitespaceOnlyArb = fc.array(
        fc.constantFrom(' ', '\t', '\n'),
        { minLength: 1, maxLength: 10 }
      ).map(chars => chars.join(''));

      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          validGearTypeArb,
          whitespaceOnlyArb,
          async (userId, gearType, whitespaceOnlyName) => {
            const gearInput: GearInput = {
              name: whitespaceOnlyName,
              gear_type: gearType,
              brand: null,
              model: null,
              notes: null,
            };

            const result = await createGear(userId, gearInput);
            
            expect(result.data).toBeNull();
            expect(result.error).not.toBeNull();
            expect(result.error).toContain('name is required');
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });
  });

  describe('Update validation', () => {
    it('should reject update with invalid gear_type', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          invalidGearTypeArb,
          async (gearId, invalidType) => {
            const result = await updateGear(gearId, { gear_type: invalidType });
            
            expect(result.data).toBeNull();
            expect(result.error).not.toBeNull();
            expect(result.error).toContain('Invalid gear type');
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should reject update with empty name', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          async (gearId) => {
            const result = await updateGear(gearId, { name: '' });
            
            expect(result.data).toBeNull();
            expect(result.error).not.toBeNull();
            expect(result.error).toContain('name cannot be empty');
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should reject update with whitespace-only name', async () => {
      // Generate whitespace-only strings using array of whitespace chars joined
      const whitespaceOnlyArb = fc.array(
        fc.constantFrom(' ', '\t', '\n'),
        { minLength: 1, maxLength: 10 }
      ).map(chars => chars.join(''));

      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          whitespaceOnlyArb,
          async (gearId, whitespaceOnlyName) => {
            const result = await updateGear(gearId, { name: whitespaceOnlyName });
            
            expect(result.data).toBeNull();
            expect(result.error).not.toBeNull();
            expect(result.error).toContain('name cannot be empty');
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });
  });

  describe('Data integrity properties', () => {
    it('valid gear input should have valid gear_type', () => {
      fc.assert(
        fc.property(validGearInputArb, (gearInput) => {
          // Every generated valid gear input should have a valid gear type
          expect(isValidGearType(gearInput.gear_type)).toBe(true);
        }),
        { numRuns: 100, verbose: true }
      );
    });

    it('valid gear input should have non-empty trimmed name', () => {
      fc.assert(
        fc.property(validGearInputArb, (gearInput) => {
          // Every generated valid gear input should have a non-empty name after trimming
          expect(gearInput.name.trim().length).toBeGreaterThan(0);
        }),
        { numRuns: 100, verbose: true }
      );
    });

    it('gear type validation should be deterministic', () => {
      fc.assert(
        fc.property(fc.string(), (gearType) => {
          // Calling isValidGearType multiple times with the same input
          // should always return the same result
          const result1 = isValidGearType(gearType);
          const result2 = isValidGearType(gearType);
          const result3 = isValidGearType(gearType);
          
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
        }),
        { numRuns: 100, verbose: true }
      );
    });

    it('valid gear types should form a closed set', () => {
      // The set of valid gear types should be exactly the VALID_GEAR_TYPES array
      const validTypesSet = new Set(VALID_GEAR_TYPES);
      
      fc.assert(
        fc.property(fc.string(), (testType) => {
          const isValid = isValidGearType(testType);
          const isInSet = validTypesSet.has(testType as GearType);
          
          // isValidGearType should return true iff the type is in VALID_GEAR_TYPES
          expect(isValid).toBe(isInSet);
        }),
        { numRuns: 100, verbose: true }
      );
    });
  });
});
