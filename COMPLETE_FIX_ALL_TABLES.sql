-- COMPLETE FIX - Comments AND Likes for Observations
-- This migration fixes both the comments and likes tables to reference observations
-- Run this ONCE in Supabase SQL Editor

-- ============================================
-- PART 1: FIX LIKES TABLE
-- ============================================

-- Drop existing likes table
DROP TABLE IF EXISTS likes CASCADE;

-- Recreate likes table with correct reference to observations
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES observations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create indexes for likes
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

-- Enable RLS for likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for likes
CREATE POLICY "Anyone can view likes"
    ON likes FOR SELECT
    USING (true);

CREATE POLICY "Users can like posts"
    ON likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
    ON likes FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- PART 2: FIX COMMENTS TABLE
-- ============================================

-- Drop existing comments tables
DROP TABLE IF EXISTS comment_likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;

-- Create comments table with correct reference to observations
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES observations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0)
);

-- Create comment_likes table
CREATE TABLE comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT comment_likes_comment_id_user_id_key UNIQUE(comment_id, user_id)
);

-- Create indexes for comments
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Create indexes for comment_likes
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);

-- Enable RLS for comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for comments
CREATE POLICY "Comments are viewable by everyone"
    ON comments FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own comments"
    ON comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
    ON comments FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
    ON comments FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS Policies for comment_likes
CREATE POLICY "Comment likes are viewable by everyone"
    ON comment_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own comment likes"
    ON comment_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment likes"
    ON comment_likes FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- PART 3: ADD COLUMNS TO OBSERVATIONS TABLE
-- ============================================

-- Add likes_count column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'observations' AND column_name = 'likes_count'
    ) THEN
        ALTER TABLE observations ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add comments_count column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'observations' AND column_name = 'comments_count'
    ) THEN
        ALTER TABLE observations ADD COLUMN comments_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Initialize counts
UPDATE observations SET likes_count = 0 WHERE likes_count IS NULL;
UPDATE observations SET comments_count = 0 WHERE comments_count IS NULL;

-- ============================================
-- PART 4: CREATE TRIGGERS AND FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comments updated_at
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update observation likes count
CREATE OR REPLACE FUNCTION update_observation_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE observations 
        SET likes_count = COALESCE(likes_count, 0) + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE observations 
        SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for observation likes count
DROP TRIGGER IF EXISTS update_observation_likes_count_trigger ON likes;
CREATE TRIGGER update_observation_likes_count_trigger
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_observation_likes_count();

-- Function to update observation comments count
CREATE OR REPLACE FUNCTION update_observation_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Only count top-level comments (not replies)
        IF NEW.parent_comment_id IS NULL THEN
            UPDATE observations 
            SET comments_count = COALESCE(comments_count, 0) + 1
            WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Only count top-level comments (not replies)
        IF OLD.parent_comment_id IS NULL THEN
            UPDATE observations 
            SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
            WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for observation comments count
DROP TRIGGER IF EXISTS update_observation_comments_count_trigger ON comments;
CREATE TRIGGER update_observation_comments_count_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_observation_comments_count();

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- Both likes and comments now correctly reference observations
-- All triggers are set up for auto-updating counts
-- Your timeline will now work perfectly with likes and comments!

