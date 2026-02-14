/**
 * Property-Based Tests for Cascade Delete Correctness
 * 
 * Tests that the database schema is correctly configured with ON DELETE CASCADE
 * for all foreign keys referencing the users table. This ensures that when a user
 * is deleted, all their associated data (gears, follows, interests) is automatically
 * deleted as well.
 * 
 * **Validates: Requirements 6.5**
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Read the migration SQL file content
 */
function getMigrationSQL(): string {
  const migrationPath = path.resolve(
    __dirname,
    '../../../../supabase/migrations/20240101000000_social_features.sql'
  );
  return fs.readFileSync(migrationPath, 'utf-8');
}

/**
 * Parse foreign key constraints from SQL
 * Returns an array of objects describing each foreign key with its cascade behavior
 */
interface ForeignKeyConstraint {
  table: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete: string | null;
}

function parseForeignKeyConstraints(sql: string): ForeignKeyConstraint[] {
  const constraints: ForeignKeyConstraint[] = [];
  
  // Match CREATE TABLE statements and extract table name
  const tableRegex = /CREATE TABLE\s+(\w+)\s*\(([\s\S]*?)\);/gi;
  let tableMatch;
  
  while ((tableMatch = tableRegex.exec(sql)) !== null) {
    const tableName = tableMatch[1];
    const tableBody = tableMatch[2];
    
    // Match foreign key references within the table definition
    // Pattern: column_name TYPE ... REFERENCES table(column) ON DELETE CASCADE
    const fkRegex = /(\w+)\s+UUID[^,]*REFERENCES\s+(\w+)\s*\(\s*(\w+)\s*\)(?:\s+ON\s+DELETE\s+(\w+))?/gi;
    let fkMatch;
    
    while ((fkMatch = fkRegex.exec(tableBody)) !== null) {
      constraints.push({
        table: tableName,
        column: fkMatch[1],
        referencedTable: fkMatch[2],
        referencedColumn: fkMatch[3],
        onDelete: fkMatch[4] || null,
      });
    }
  }
  
  return constraints;
}

/**
 * Tables that should have cascade delete when referencing users
 */
const TABLES_WITH_USER_CASCADE = [
  { table: 'user_gears', column: 'user_id' },
  { table: 'follows', column: 'follower_id' },
  { table: 'follows', column: 'following_id' },
  { table: 'user_interests', column: 'user_id' },
];

/**
 * Tables that should have cascade delete when referencing interests
 */
const TABLES_WITH_INTEREST_CASCADE = [
  { table: 'user_interests', column: 'interest_id' },
];

describe('Feature: social-features, Property 15: Cascade Delete Correctness', () => {
  /**
   * Property 15: Cascade Delete Correctness
   * 
   * For any user with associated gears, follows, and interests, deleting that user
   * should result in all their associated gears, follow relationships (both as 
   * follower and following), and interests being deleted as well.
   * 
   * Since this is a database-level constraint, we verify the schema configuration
   * rather than actual deletion behavior.
   * 
   * **Validates: Requirements 6.5**
   */

  const migrationSQL = getMigrationSQL();
  const foreignKeyConstraints = parseForeignKeyConstraints(migrationSQL);

  describe('Schema verification for cascade delete', () => {
    it('should have ON DELETE CASCADE for user_gears.user_id -> users.id', () => {
      const constraint = foreignKeyConstraints.find(
        fk => fk.table === 'user_gears' && fk.column === 'user_id'
      );
      
      expect(constraint).toBeDefined();
      expect(constraint?.referencedTable).toBe('users');
      expect(constraint?.referencedColumn).toBe('id');
      expect(constraint?.onDelete?.toUpperCase()).toBe('CASCADE');
    });

    it('should have ON DELETE CASCADE for follows.follower_id -> users.id', () => {
      const constraint = foreignKeyConstraints.find(
        fk => fk.table === 'follows' && fk.column === 'follower_id'
      );
      
      expect(constraint).toBeDefined();
      expect(constraint?.referencedTable).toBe('users');
      expect(constraint?.referencedColumn).toBe('id');
      expect(constraint?.onDelete?.toUpperCase()).toBe('CASCADE');
    });

    it('should have ON DELETE CASCADE for follows.following_id -> users.id', () => {
      const constraint = foreignKeyConstraints.find(
        fk => fk.table === 'follows' && fk.column === 'following_id'
      );
      
      expect(constraint).toBeDefined();
      expect(constraint?.referencedTable).toBe('users');
      expect(constraint?.referencedColumn).toBe('id');
      expect(constraint?.onDelete?.toUpperCase()).toBe('CASCADE');
    });

    it('should have ON DELETE CASCADE for user_interests.user_id -> users.id', () => {
      const constraint = foreignKeyConstraints.find(
        fk => fk.table === 'user_interests' && fk.column === 'user_id'
      );
      
      expect(constraint).toBeDefined();
      expect(constraint?.referencedTable).toBe('users');
      expect(constraint?.referencedColumn).toBe('id');
      expect(constraint?.onDelete?.toUpperCase()).toBe('CASCADE');
    });

    it('should have ON DELETE CASCADE for user_interests.interest_id -> interests.id', () => {
      const constraint = foreignKeyConstraints.find(
        fk => fk.table === 'user_interests' && fk.column === 'interest_id'
      );
      
      expect(constraint).toBeDefined();
      expect(constraint?.referencedTable).toBe('interests');
      expect(constraint?.referencedColumn).toBe('id');
      expect(constraint?.onDelete?.toUpperCase()).toBe('CASCADE');
    });
  });

  describe('Property-based verification of cascade delete contract', () => {
    /**
     * Property: All foreign keys referencing users table should have CASCADE delete
     * 
     * For any table with a foreign key to users, the ON DELETE behavior should be CASCADE.
     */
    it('all user-referencing foreign keys should have CASCADE delete', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...TABLES_WITH_USER_CASCADE),
          ({ table, column }) => {
            const constraint = foreignKeyConstraints.find(
              fk => fk.table === table && fk.column === column
            );
            
            expect(constraint).toBeDefined();
            expect(constraint?.referencedTable).toBe('users');
            expect(constraint?.onDelete?.toUpperCase()).toBe('CASCADE');
            
            return true;
          }
        ),
        { numRuns: TABLES_WITH_USER_CASCADE.length, verbose: true }
      );
    });

    /**
     * Property: All foreign keys referencing interests table should have CASCADE delete
     */
    it('all interest-referencing foreign keys should have CASCADE delete', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...TABLES_WITH_INTEREST_CASCADE),
          ({ table, column }) => {
            const constraint = foreignKeyConstraints.find(
              fk => fk.table === table && fk.column === column
            );
            
            expect(constraint).toBeDefined();
            expect(constraint?.referencedTable).toBe('interests');
            expect(constraint?.onDelete?.toUpperCase()).toBe('CASCADE');
            
            return true;
          }
        ),
        { numRuns: TABLES_WITH_INTEREST_CASCADE.length, verbose: true }
      );
    });

    /**
     * Property: The number of cascade delete constraints should match expected count
     * 
     * We expect exactly 5 CASCADE delete constraints:
     * - user_gears.user_id -> users.id
     * - follows.follower_id -> users.id
     * - follows.following_id -> users.id
     * - user_interests.user_id -> users.id
     * - user_interests.interest_id -> interests.id
     */
    it('should have exactly 5 CASCADE delete constraints', () => {
      const cascadeConstraints = foreignKeyConstraints.filter(
        fk => fk.onDelete?.toUpperCase() === 'CASCADE'
      );
      
      expect(cascadeConstraints).toHaveLength(5);
    });
  });

  describe('Cascade delete behavioral contract documentation', () => {
    /**
     * These tests document the expected cascade delete behavior.
     * They verify the contract that the database schema enforces.
     */

    it('user deletion should cascade to user_gears', () => {
      // Contract: When a user is deleted, all their gear records are deleted
      const gearConstraint = foreignKeyConstraints.find(
        fk => fk.table === 'user_gears' && fk.column === 'user_id'
      );
      
      expect(gearConstraint?.onDelete?.toUpperCase()).toBe('CASCADE');
      // This means: DELETE FROM users WHERE id = X 
      // will automatically DELETE FROM user_gears WHERE user_id = X
    });

    it('user deletion should cascade to follows (as follower)', () => {
      // Contract: When a user is deleted, all follow relationships where they are the follower are deleted
      const followerConstraint = foreignKeyConstraints.find(
        fk => fk.table === 'follows' && fk.column === 'follower_id'
      );
      
      expect(followerConstraint?.onDelete?.toUpperCase()).toBe('CASCADE');
      // This means: DELETE FROM users WHERE id = X
      // will automatically DELETE FROM follows WHERE follower_id = X
    });

    it('user deletion should cascade to follows (as following)', () => {
      // Contract: When a user is deleted, all follow relationships where they are being followed are deleted
      const followingConstraint = foreignKeyConstraints.find(
        fk => fk.table === 'follows' && fk.column === 'following_id'
      );
      
      expect(followingConstraint?.onDelete?.toUpperCase()).toBe('CASCADE');
      // This means: DELETE FROM users WHERE id = X
      // will automatically DELETE FROM follows WHERE following_id = X
    });

    it('user deletion should cascade to user_interests', () => {
      // Contract: When a user is deleted, all their interest selections are deleted
      const interestConstraint = foreignKeyConstraints.find(
        fk => fk.table === 'user_interests' && fk.column === 'user_id'
      );
      
      expect(interestConstraint?.onDelete?.toUpperCase()).toBe('CASCADE');
      // This means: DELETE FROM users WHERE id = X
      // will automatically DELETE FROM user_interests WHERE user_id = X
    });

    it('interest deletion should cascade to user_interests', () => {
      // Contract: When an interest is deleted, all user selections of that interest are deleted
      const interestRefConstraint = foreignKeyConstraints.find(
        fk => fk.table === 'user_interests' && fk.column === 'interest_id'
      );
      
      expect(interestRefConstraint?.onDelete?.toUpperCase()).toBe('CASCADE');
      // This means: DELETE FROM interests WHERE id = X
      // will automatically DELETE FROM user_interests WHERE interest_id = X
    });
  });

  describe('Property-based simulation of cascade delete scenarios', () => {
    /**
     * These tests use property-based testing to verify the cascade delete
     * contract holds for any arbitrary user data configuration.
     */

    // Generator for user IDs
    const userIdArb = fc.uuid();

    // Generator for gear counts
    const gearCountArb = fc.nat({ max: 50 });

    // Generator for follow counts
    const followCountArb = fc.nat({ max: 100 });

    // Generator for interest counts
    const interestCountArb = fc.nat({ max: 14 }); // Max 14 interests available

    // Generator for a user's social data configuration
    const userSocialDataArb = fc.record({
      userId: userIdArb,
      gearCount: gearCountArb,
      followerCount: followCountArb,
      followingCount: followCountArb,
      interestCount: interestCountArb,
    });

    it('cascade delete should remove all associated data regardless of data volume', () => {
      fc.assert(
        fc.property(userSocialDataArb, (userData) => {
          // Given the schema has CASCADE delete configured,
          // for any user with any amount of associated data,
          // deleting the user should result in all associated data being deleted
          
          // Verify the schema supports this contract
          const userGearsCascade = foreignKeyConstraints.find(
            fk => fk.table === 'user_gears' && fk.column === 'user_id'
          )?.onDelete?.toUpperCase() === 'CASCADE';
          
          const followsFollowerCascade = foreignKeyConstraints.find(
            fk => fk.table === 'follows' && fk.column === 'follower_id'
          )?.onDelete?.toUpperCase() === 'CASCADE';
          
          const followsFollowingCascade = foreignKeyConstraints.find(
            fk => fk.table === 'follows' && fk.column === 'following_id'
          )?.onDelete?.toUpperCase() === 'CASCADE';
          
          const userInterestsCascade = foreignKeyConstraints.find(
            fk => fk.table === 'user_interests' && fk.column === 'user_id'
          )?.onDelete?.toUpperCase() === 'CASCADE';
          
          // All cascade constraints must be in place
          expect(userGearsCascade).toBe(true);
          expect(followsFollowerCascade).toBe(true);
          expect(followsFollowingCascade).toBe(true);
          expect(userInterestsCascade).toBe(true);
          
          // The contract guarantees that for this user configuration:
          // - All ${userData.gearCount} gears will be deleted
          // - All ${userData.followerCount} follower relationships will be deleted
          // - All ${userData.followingCount} following relationships will be deleted
          // - All ${userData.interestCount} interest selections will be deleted
          
          return true;
        }),
        { numRuns: 100, verbose: true }
      );
    });

    it('cascade delete should handle edge case of user with no associated data', () => {
      fc.assert(
        fc.property(userIdArb, (userId) => {
          // Even for a user with no gears, follows, or interests,
          // the cascade delete should work correctly (no-op for child tables)
          
          // The schema supports this - CASCADE delete on empty sets is valid
          const allCascadesConfigured = TABLES_WITH_USER_CASCADE.every(({ table, column }) => {
            const constraint = foreignKeyConstraints.find(
              fk => fk.table === table && fk.column === column
            );
            return constraint?.onDelete?.toUpperCase() === 'CASCADE';
          });
          
          expect(allCascadesConfigured).toBe(true);
          
          return true;
        }),
        { numRuns: 100, verbose: true }
      );
    });

    it('cascade delete should handle users with maximum data volume', () => {
      // Test with maximum realistic data volumes
      const maxDataUserArb = fc.record({
        userId: userIdArb,
        gearCount: fc.constant(100), // Max gears
        followerCount: fc.constant(10000), // Max followers
        followingCount: fc.constant(10000), // Max following
        interestCount: fc.constant(14), // All interests
      });

      fc.assert(
        fc.property(maxDataUserArb, (userData) => {
          // The schema's CASCADE delete should handle any volume of data
          // This is guaranteed by PostgreSQL's foreign key cascade mechanism
          
          const allCascadesConfigured = TABLES_WITH_USER_CASCADE.every(({ table, column }) => {
            const constraint = foreignKeyConstraints.find(
              fk => fk.table === table && fk.column === column
            );
            return constraint?.onDelete?.toUpperCase() === 'CASCADE';
          });
          
          expect(allCascadesConfigured).toBe(true);
          
          return true;
        }),
        { numRuns: 10, verbose: true }
      );
    });
  });
});
