-- Comments System Migration
-- This handles both new installations and updates to existing tables

-- Step 1: Create comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add parent_comment_id column if it doesn't exist (for replies)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'parent_comment_id'
    ) THEN
        ALTER TABLE comments ADD COLUMN parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 3: Add content constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'comments' AND constraint_name = 'content_not_empty'
    ) THEN
        ALTER TABLE comments ADD CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0);
    END IF;
END $$;

-- Step 4: Create comment_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Add unique constraint for comment_likes if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'comment_likes_comment_id_user_id_key'
    ) THEN
        ALTER TABLE comment_likes ADD CONSTRAINT comment_likes_comment_id_user_id_key UNIQUE(comment_id, user_id);
    END IF;
END $$;

-- Step 6: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- Step 7: Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Step 8: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

DROP POLICY IF EXISTS "Comment likes are viewable by everyone" ON comment_likes;
DROP POLICY IF EXISTS "Users can insert their own comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can delete their own comment likes" ON comment_likes;

-- Step 9: Create RLS Policies for comments table

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

-- Step 10: Create RLS Policies for comment_likes table

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

-- Step 11: Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create trigger for updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 13: Create or replace function to update post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Only count top-level comments (not replies)
        IF NEW.parent_comment_id IS NULL THEN
            UPDATE posts 
            SET comments_count = COALESCE(comments_count, 0) + 1
            WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Only count top-level comments (not replies)
        IF OLD.parent_comment_id IS NULL THEN
            UPDATE posts 
            SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
            WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 14: Create trigger for post comments count (drop first if exists)
DROP TRIGGER IF EXISTS update_post_comments_count_trigger ON comments;
CREATE TRIGGER update_post_comments_count_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_post_comments_count();

-- Step 15: Add comments_count column to posts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'comments_count'
    ) THEN
        ALTER TABLE posts ADD COLUMN comments_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Step 16: Update existing posts with correct comment counts
UPDATE posts p
SET comments_count = (
    SELECT COUNT(*)
    FROM comments c
    WHERE c.post_id = p.id AND c.parent_comment_id IS NULL
)
WHERE EXISTS (
    SELECT 1 FROM comments c WHERE c.post_id = p.id
);

-- Step 17: Ensure comments_count is never null
UPDATE posts SET comments_count = 0 WHERE comments_count IS NULL;

-- Migration complete!
-- You can now use the comments system with replies, likes, and proper counting
