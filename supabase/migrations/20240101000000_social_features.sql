-- Social Features Migration
-- Creates tables for user gears, follows, interests, and user_interests
-- Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6

-- ============================================
-- USER_GEARS TABLE
-- Stores astronomy equipment owned by users
-- Requirement 6.1: Store gear items with foreign key reference to users
-- ============================================
CREATE TABLE user_gears (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    gear_type VARCHAR(50) NOT NULL CHECK (gear_type IN ('telescope', 'camera', 'mount', 'eyepiece', 'filter', 'accessory')),
    brand VARCHAR(100),
    model VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by user_id (Requirement 6.6)
CREATE INDEX idx_user_gears_user_id ON user_gears(user_id);

-- Trigger for updating updated_at timestamp
CREATE TRIGGER update_user_gears_updated_at 
    BEFORE UPDATE ON user_gears
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FOLLOWS TABLE
-- Stores follow relationships between users
-- Requirement 6.2: Store follow relationships with follower_id and following_id
-- ============================================
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Unique constraint to prevent duplicate follow relationships
    UNIQUE(follower_id, following_id),
    -- Check constraint to prevent self-following (Requirement 3.3)
    CHECK (follower_id != following_id)
);

-- Indexes for faster lookups (Requirement 6.6)
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);


-- ============================================
-- INTERESTS TABLE (Lookup)
-- Stores predefined interest categories
-- Requirement 6.3: Store user interests with foreign key reference to users
-- ============================================
CREATE TABLE interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed data for all 14 interest categories (Requirement 5.2)
INSERT INTO interests (name, display_name, category) VALUES
    ('astrophotography', 'Astrophotography', 'technique'),
    ('deep_sky_objects', 'Deep Sky Objects', 'target'),
    ('planets', 'Planets', 'target'),
    ('moon', 'Moon', 'target'),
    ('sun', 'Sun', 'target'),
    ('meteor_showers', 'Meteor Showers', 'event'),
    ('comets', 'Comets', 'target'),
    ('satellites', 'Satellites', 'target'),
    ('eclipses', 'Eclipses', 'event'),
    ('star_clusters', 'Star Clusters', 'target'),
    ('nebulae', 'Nebulae', 'target'),
    ('galaxies', 'Galaxies', 'target'),
    ('equipment_reviews', 'Equipment Reviews', 'content'),
    ('observation_techniques', 'Observation Techniques', 'technique');

-- ============================================
-- USER_INTERESTS TABLE (Junction)
-- Links users to their selected interests
-- Requirement 6.3: Store user interests with foreign key reference to users
-- ============================================
CREATE TABLE user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Unique constraint to prevent duplicate interest selections
    UNIQUE(user_id, interest_id)
);

-- Index for faster lookups by user_id (Requirement 6.6)
CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- Enable RLS on all new tables (Requirement 6.4)
-- ============================================
ALTER TABLE user_gears ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR USER_GEARS
-- Users can CRUD their own gears, read others' gears
-- ============================================
CREATE POLICY "Users can view all gears" 
    ON user_gears FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert own gears" 
    ON user_gears FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gears" 
    ON user_gears FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gears" 
    ON user_gears FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES FOR FOLLOWS
-- Users can create/delete their own follows, read all follows
-- ============================================
CREATE POLICY "Users can view all follows" 
    ON follows FOR SELECT 
    USING (true);

CREATE POLICY "Users can create own follows" 
    ON follows FOR INSERT 
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows" 
    ON follows FOR DELETE 
    USING (auth.uid() = follower_id);

-- ============================================
-- RLS POLICIES FOR INTERESTS
-- Everyone can read interests (lookup table)
-- ============================================
CREATE POLICY "Anyone can view interests" 
    ON interests FOR SELECT 
    USING (true);

-- ============================================
-- RLS POLICIES FOR USER_INTERESTS
-- Users can CRUD their own interests, read others' interests
-- ============================================
CREATE POLICY "Users can view all user interests" 
    ON user_interests FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert own interests" 
    ON user_interests FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interests" 
    ON user_interests FOR DELETE 
    USING (auth.uid() = user_id);
