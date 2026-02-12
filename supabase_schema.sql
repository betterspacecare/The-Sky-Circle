-- The Sky Circle - Supabase Database Schema
-- PostgreSQL Schema with Row Level Security

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    bio TEXT,
    profile_photo_url TEXT,
    telescope_type TEXT,
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    level INTEGER DEFAULT 1,
    total_points INTEGER DEFAULT 0,
    referral_code TEXT UNIQUE NOT NULL,
    referred_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_referred_by ON users(referred_by);

-- ============================================
-- OBSERVATIONS TABLE
-- ============================================
CREATE TABLE observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    object_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Moon', 'Planet', 'Nebula', 'Galaxy', 'Cluster', 'Constellation')),
    observation_date DATE NOT NULL,
    location TEXT,
    notes TEXT,
    photo_url TEXT,
    points_awarded INTEGER NOT NULL,
    is_seasonal_rare BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_observations_user_id ON observations(user_id);
CREATE INDEX idx_observations_category ON observations(category);
CREATE INDEX idx_observations_date ON observations(observation_date DESC);

-- ============================================
-- BADGES TABLE
-- ============================================
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT,
    requirement_type TEXT CHECK (requirement_type IN ('observation_count', 'specific_object', 'mission_complete', 'referral_count', 'special')),
    requirement_value JSONB, -- Flexible storage for different requirements
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER_BADGES TABLE (Junction)
-- ============================================
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    capacity INTEGER,
    is_paid BOOLEAN DEFAULT FALSE,
    price DECIMAL(10, 2),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_date ON events(event_date DESC);

-- ============================================
-- EVENT_ATTENDEES TABLE (Junction)
-- ============================================
CREATE TABLE event_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rsvp_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user_id ON event_attendees(user_id);

-- ============================================
-- MISSIONS TABLE
-- ============================================
CREATE TABLE missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reward_badge_id UUID REFERENCES badges(id),
    bonus_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_missions_active ON missions(is_active, end_date);

-- ============================================
-- MISSION_REQUIREMENTS TABLE
-- ============================================
CREATE TABLE mission_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    object_name TEXT NOT NULL,
    category TEXT NOT NULL
);

CREATE INDEX idx_mission_requirements_mission_id ON mission_requirements(mission_id);

-- ============================================
-- USER_MISSION_PROGRESS TABLE
-- ============================================
CREATE TABLE user_mission_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    completed_requirements JSONB DEFAULT '[]', -- Array of completed object names
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, mission_id)
);

CREATE INDEX idx_user_mission_progress_user_id ON user_mission_progress(user_id);

-- ============================================
-- REFERRALS TABLE
-- ============================================
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_points INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referred_user_id)
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);

-- ============================================
-- POSTS TABLE
-- ============================================
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    is_reported BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_reported ON posts(is_reported) WHERE is_reported = TRUE;

-- ============================================
-- COMMENTS TABLE
-- ============================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- ============================================
-- LIKES TABLE
-- ============================================
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

-- ============================================
-- SKY_ALERTS TABLE
-- ============================================
CREATE TABLE sky_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    alert_type TEXT CHECK (alert_type IN ('text', 'object_visibility', 'meteor_shower', 'special_event')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sky_alerts_created_at ON sky_alerts(created_at DESC);

-- ============================================
-- USER_ALERT_READS TABLE
-- ============================================
CREATE TABLE user_alert_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_id UUID NOT NULL REFERENCES sky_alerts(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, alert_id)
);

CREATE INDEX idx_user_alert_reads_user_id ON user_alert_reads(user_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sky_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alert_reads ENABLE ROW LEVEL SECURITY;

-- USERS: Users can read all profiles, update only their own
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- OBSERVATIONS: Users can CRUD their own observations, read others
CREATE POLICY "Users can view all observations" ON observations FOR SELECT USING (true);
CREATE POLICY "Users can insert own observations" ON observations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own observations" ON observations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own observations" ON observations FOR DELETE USING (auth.uid() = user_id);

-- BADGES: Everyone can read badges
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);

-- USER_BADGES: Users can view all earned badges, system inserts
CREATE POLICY "Users can view all earned badges" ON user_badges FOR SELECT USING (true);
CREATE POLICY "System can insert badges" ON user_badges FOR INSERT WITH CHECK (true);

-- EVENTS: Everyone can read, admins can create/update
CREATE POLICY "Anyone can view events" ON events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events" ON events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Event creators can update" ON events FOR UPDATE USING (auth.uid() = created_by);

-- EVENT_ATTENDEES: Users can RSVP, view attendees
CREATE POLICY "Anyone can view attendees" ON event_attendees FOR SELECT USING (true);
CREATE POLICY "Users can RSVP" ON event_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel RSVP" ON event_attendees FOR DELETE USING (auth.uid() = user_id);

-- MISSIONS: Everyone can read
CREATE POLICY "Anyone can view missions" ON missions FOR SELECT USING (true);

-- MISSION_REQUIREMENTS: Everyone can read
CREATE POLICY "Anyone can view mission requirements" ON mission_requirements FOR SELECT USING (true);

-- USER_MISSION_PROGRESS: Users can view own progress
CREATE POLICY "Users can view own mission progress" ON user_mission_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert mission progress" ON user_mission_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update mission progress records" ON user_mission_progress FOR UPDATE USING (true);

-- REFERRALS: Users can view own referrals
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);
CREATE POLICY "System can insert referrals" ON referrals FOR INSERT WITH CHECK (true);

-- POSTS: Everyone can read non-deleted posts, users can CRUD own
CREATE POLICY "Anyone can view non-deleted posts" ON posts FOR SELECT USING (is_deleted = FALSE);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- COMMENTS: Everyone can read, users can CRUD own
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- LIKES: Everyone can read, users can like/unlike
CREATE POLICY "Anyone can view likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON likes FOR DELETE USING (auth.uid() = user_id);

-- SKY_ALERTS: Everyone can read
CREATE POLICY "Anyone can view alerts" ON sky_alerts FOR SELECT USING (true);

-- USER_ALERT_READS: Users can mark own alerts as read
CREATE POLICY "Users can view own alert reads" ON user_alert_reads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mark alerts as read" ON user_alert_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for events table
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- View: User statistics
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.display_name,
    u.level,
    u.total_points,
    COUNT(DISTINCT o.id) AS total_observations,
    COUNT(DISTINCT ub.badge_id) AS total_badges,
    COUNT(DISTINCT r.referred_user_id) AS total_referrals
FROM users u
LEFT JOIN observations o ON u.id = o.user_id
LEFT JOIN user_badges ub ON u.id = ub.user_id
LEFT JOIN referrals r ON u.id = r.referrer_id
GROUP BY u.id, u.display_name, u.level, u.total_points;

-- View: Leaderboard
CREATE VIEW leaderboard AS
SELECT 
    u.id,
    u.display_name,
    u.profile_photo_url,
    u.level,
    u.total_points,
    COUNT(DISTINCT o.id) AS observation_count,
    ROW_NUMBER() OVER (ORDER BY u.total_points DESC) AS rank
FROM users u
LEFT JOIN observations o ON u.id = o.user_id
GROUP BY u.id, u.display_name, u.profile_photo_url, u.level, u.total_points
ORDER BY u.total_points DESC;

-- View: Most observed objects
CREATE VIEW popular_objects AS
SELECT 
    object_name,
    category,
    COUNT(*) AS observation_count
FROM observations
GROUP BY object_name, category
ORDER BY observation_count DESC;

-- ============================================
-- STORAGE BUCKETS (Run via Supabase Dashboard or API)
-- ============================================

-- Create storage buckets:
-- 1. profile-photos (public)
-- 2. observation-photos (public)
-- 3. post-images (public)
-- 4. badge-icons (public)

-- Note: Storage bucket creation is done via Supabase Dashboard or API
-- RLS policies for storage should be configured to allow:
-- - Users can upload to their own folders
-- - Public read access for all images
