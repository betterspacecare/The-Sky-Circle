-- Fix Likes Table to Reference Observations
-- The likes table was referencing posts, but should reference observations

-- Step 1: Drop the existing likes table (this will remove all existing likes)
-- WARNING: This will delete all existing likes data
DROP TABLE IF EXISTS likes CASCADE;

-- Step 2: Recreate likes table with correct reference to observations
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES observations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

-- Step 4: Enable Row Level Security
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
DROP POLICY IF EXISTS "Users can like posts" ON likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON likes;

-- Step 6: Create RLS Policies

-- Anyone can view likes
CREATE POLICY "Anyone can view likes"
    ON likes FOR SELECT
    USING (true);

-- Users can like posts (observations)
CREATE POLICY "Users can like posts"
    ON likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can unlike posts (observations)
CREATE POLICY "Users can unlike posts"
    ON likes FOR DELETE
    USING (auth.uid() = user_id);

-- Step 7: Add likes_count column to observations table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'observations' AND column_name = 'likes_count'
    ) THEN
        ALTER TABLE observations ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Step 8: Create function to update observation likes count
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

-- Step 9: Create trigger for observation likes count
DROP TRIGGER IF EXISTS update_observation_likes_count_trigger ON likes;
CREATE TRIGGER update_observation_likes_count_trigger
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_observation_likes_count();

-- Step 10: Initialize likes_count for all existing observations
UPDATE observations SET likes_count = 0 WHERE likes_count IS NULL;

-- Migration complete!
-- The likes table now correctly references the observations table.
-- Likes will work on all observations displayed in the timeline.

