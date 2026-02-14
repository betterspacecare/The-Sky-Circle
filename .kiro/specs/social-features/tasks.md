# Implementation Plan: Social Features Enhancement

## Overview

This implementation plan breaks down the social features enhancement into discrete coding tasks. The implementation follows a bottom-up approach: database schema first, then types, then services, then components, and finally page integration.

## Tasks

- [x] 1. Set up database schema and types
  - [x] 1.1 Create database migration for social tables
    - Create user_gears table with columns: id, user_id, name, gear_type, brand, model, notes, created_at, updated_at
    - Create follows table with columns: id, follower_id, following_id, created_at with unique constraint and self-follow check
    - Create interests lookup table with seed data for all 14 interest categories
    - Create user_interests junction table
    - Add indexes on user_id, follower_id, following_id columns
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 1.2 Update TypeScript types
    - Create types/social.types.ts with GearType, UserGear, Follow, Interest, UserInterest interfaces
    - Create UserWithSocialData interface extending user with follower/following counts
    - Create TimelinePost interface with engagement score and is_from_following flag
    - Create FeedConfig interface for algorithm configuration
    - _Requirements: 1.2, 3.4, 4.4, 4.5_

  - [x] 1.3 Set up Row Level Security policies
    - Add RLS policy for user_gears: users can CRUD their own gears, read others' gears
    - Add RLS policy for follows: users can create/delete their own follows, read all follows
    - Add RLS policy for user_interests: users can CRUD their own interests, read others' interests
    - _Requirements: 1.6, 6.4_

- [x] 2. Implement Gears Management feature
  - [x] 2.1 Create gear service functions
    - Implement fetchUserGears(userId) to get all gears for a user
    - Implement createGear(userId, gearData) with validation for gear_type
    - Implement updateGear(gearId, gearData) with ownership check
    - Implement deleteGear(gearId) with ownership check
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Write property tests for gear CRUD
    - **Property 1: Gear CRUD Round-Trip**
    - **Property 2: Gear Type Validation**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5**

  - [x] 2.3 Create GearForm component
    - Build form with fields: name (required), gear_type (select), brand, model, notes
    - Implement validation for required fields and gear_type enum
    - Handle submit for both create and edit modes
    - _Requirements: 1.2, 1.3, 1.5_

  - [x] 2.4 Create GearsList component
    - Display list of gears with type icons and details
    - Show add button for own profile, hide for others
    - Implement edit/delete actions for own gears
    - _Requirements: 1.1, 1.6_

  - [x] 2.5 Integrate gears into profile page
    - Add GearsList component to profile page
    - Fetch gears on profile load
    - Handle gear CRUD callbacks to update state
    - _Requirements: 1.1, 1.6_

- [x] 3. Checkpoint - Verify gears feature
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Follow System
  - [x] 4.1 Create follow service functions
    - Implement followUser(followerId, followingId) with self-follow prevention
    - Implement unfollowUser(followerId, followingId)
    - Implement getFollowStatus(followerId, followingId) returning boolean
    - Implement getFollowerCount(userId) and getFollowingCount(userId)
    - Implement getFollowers(userId) and getFollowing(userId) with pagination
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 4.2 Write property tests for follow system
    - **Property 6: Follow State Consistency**
    - **Property 7: Self-Follow Prevention**
    - **Property 8: Follow Counts Accuracy**
    - **Property 9: Is-Following Flag Accuracy**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

  - [x] 4.3 Create FollowButton component
    - Display Follow/Following state with appropriate styling
    - Handle optimistic updates on click
    - Prevent self-follow (hide button on own profile)
    - Support size variants (sm, md, lg)
    - _Requirements: 3.1, 3.2, 3.3, 3.7_

  - [x] 4.4 Create FollowStats component
    - Display follower count and following count
    - Make counts clickable to show follower/following lists
    - _Requirements: 3.4_

  - [x] 4.5 Integrate follow system into profile page
    - Add FollowButton to profile header for other users
    - Add FollowStats component showing counts
    - Set up realtime subscription for count updates
    - _Requirements: 3.4, 3.7_

- [x] 5. Implement User Discovery feature
  - [x] 5.1 Create user discovery service functions
    - Implement fetchUsers(page, pageSize, filters) with pagination
    - Implement searchUsers(query, page, pageSize) for name search
    - Include follower_count and is_following in response
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 5.2 Write property tests for user discovery
    - **Property 3: User Discovery Pagination Completeness**
    - **Property 4: User Search Accuracy**
    - **Property 5: User Filter by Experience Level**
    - **Validates: Requirements 2.1, 2.3, 2.4**

  - [x] 5.3 Create UserCard component
    - Display user photo, name, experience level, follower count
    - Include FollowButton
    - Make card clickable to navigate to profile
    - _Requirements: 2.2, 2.5_

  - [x] 5.4 Create SearchFilter component
    - Text input for name search with debounce
    - Dropdown for experience level filter
    - Clear filters button
    - _Requirements: 2.3, 2.4_

  - [x] 5.5 Create Discover Users page
    - Create app/dashboard/discover/page.tsx
    - Implement UserGrid with UserCard components
    - Add SearchFilter component
    - Implement infinite scroll pagination
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 5.6 Add discover link to navigation
    - Add "Discover" link to DashboardNav component
    - _Requirements: 2.1_

- [x] 6. Checkpoint - Verify follow and discovery features
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Interests System
  - [x] 7.1 Create interests service functions
    - Implement fetchAllInterests() to get lookup table
    - Implement fetchUserInterests(userId) to get user's selected interests
    - Implement updateUserInterests(userId, interestIds) to save selections
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 7.2 Write property tests for interests
    - **Property 14: Interest Persistence Round-Trip**
    - **Validates: Requirements 5.1, 5.3, 5.6**

  - [x] 7.3 Create InterestsSelector component
    - Display all available interests as selectable chips/tags
    - Allow multi-select with visual feedback
    - Show selected state for user's current interests
    - Support edit mode toggle
    - _Requirements: 5.1, 5.2_

  - [x] 7.4 Create InterestsTags component
    - Display user's interests as read-only tags
    - Use category-based color coding
    - _Requirements: 5.6_

  - [x] 7.5 Integrate interests into profile page
    - Add InterestsTags to profile display
    - Add InterestsSelector to profile edit form
    - Save interests on profile save
    - _Requirements: 5.1, 5.3, 5.6_

- [x] 8. Implement Timeline Feed
  - [x] 8.1 Create feed algorithm service
    - Implement calculateEngagementScore(likes, comments, createdAt, weights)
    - Implement fetchFollowedUsersPosts(userId, followingIds, page, pageSize)
    - Implement fetchTrendingPosts(excludeUserIds, interests, page, pageSize)
    - Implement fetchTimelineFeed(query, config) combining both with ratio logic
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [x] 8.2 Write property tests for feed algorithm
    - **Property 10: Feed Algorithm Correctness**
    - **Property 11: Interest-Based Filtering**
    - **Property 12: No-Interests Fallback**
    - **Property 13: Engagement Score Calculation**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.8, 5.4, 5.5**

  - [x] 8.3 Create FeedContainer component
    - Fetch timeline using feed algorithm service
    - Display posts using existing PostCard component
    - Implement infinite scroll with loading states
    - Show "Following" badge on posts from followed users
    - _Requirements: 4.1, 4.2, 4.7_

  - [x] 8.4 Create Timeline page
    - Create app/dashboard/timeline/page.tsx
    - Use FeedContainer component
    - Add empty state for users with no content
    - _Requirements: 4.1, 4.6, 4.7_

  - [x] 8.5 Add timeline link to navigation
    - Add "Timeline" link to DashboardNav component
    - Consider making it the default community view
    - _Requirements: 4.1_

- [x] 9. Checkpoint - Verify timeline feature
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Integration and Polish
  - [x] 10.1 Add cascade delete verification
    - Verify user deletion cascades to gears, follows, interests
    - _Requirements: 6.5_

  - [x] 10.2 Write property test for cascade delete
    - **Property 15: Cascade Delete Correctness**
    - **Validates: Requirements 6.5**

  - [x] 10.3 Add realtime subscriptions
    - Subscribe to follows table for live follower count updates
    - Subscribe to posts for live timeline updates
    - _Requirements: 3.5, 3.6_

  - [x] 10.4 Implement error handling
    - Add toast notifications for follow/unfollow actions
    - Add error states for failed API calls
    - Implement optimistic updates with rollback
    - _Requirements: 3.1, 3.2_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property-based tests are required for comprehensive validation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript with Next.js 14 and Supabase
