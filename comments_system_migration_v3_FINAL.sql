-- Comments System Migration V3 - FINAL
-- Fixed to reference observations table instead of posts table
-- This matches your system where observations are displayed as posts in the timeline

-- Step 1: Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS comment_likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;

-- Step 2: Create comments table with all columns
-- IMPORTANT: References observations table, not posts table
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

-- Step 3: Create comment_likes table
CREATE TABLE comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT comment_likes_comment_id_user_id_key UNIQUE(comment_id, user_id)
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);

-- Step 5: Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS Policies for comments table

-- Anyone can view comments
CREATE POLICY "Comments are viewable by everyone"
    ON comments FOR SELECT
    USING (true);

-- Users can insert their own comments
CREATE POLICY "Users can insert their own comments"
    ON comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
    ON comments FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
    ON comments FOR DELETE
    USING (auth.uid() = user_id);

-- Step 7: Create RLS Policies for comment_likes table

-- Anyone can view comment likes
CREATE POLICY "Comment likes are viewable by everyone"
    ON comment_likes FOR SELECT
    USING (true);

-- Users can insert their own likes
CREATE POLICY "Users can insert their own comment likes"
    ON comment_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete their own comment likes"
    ON comment_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Step 8: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger for updated_at
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Add comments_count column to observations table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'observations' AND column_name = 'comments_count'
    ) THEN
        ALTER TABLE observations ADD COLUMN comments_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Step 11: Create function to update observation comments count
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

-- Step 12: Create trigger for observation comments count
CREATE TRIGGER update_observation_comments_count_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_observation_comments_count();

-- Step 13: Initialize comments_count for all existing observations
UPDATE observations SET comments_count = 0 WHERE comments_count IS NULL;

-- Step 14: Update existing observations with correct comment counts (if any comments exist)
UPDATE observations o
SET comments_count = (
    SELECT COUNT(*)
    FROM comments c
    WHERE c.post_id = o.id AND c.parent_comment_id IS NULL
)
WHERE EXISTS (
    SELECT 1 FROM comments c WHERE c.post_id = o.id
);

-- Migration complete!
-- The comments system now correctly references the observations table.
-- Comments will work on all observations displayed in the timeline.

