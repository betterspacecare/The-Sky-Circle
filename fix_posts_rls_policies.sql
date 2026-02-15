-- Fix RLS Policies for Posts Table
-- This migration ensures users can update and delete their own posts

-- Enable RLS on posts table (if not already enabled)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Anyone can view non-deleted posts" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Admins can moderate posts" ON posts;

-- Recreate policies with proper permissions

-- SELECT: Anyone can view non-deleted posts
CREATE POLICY "Anyone can view non-deleted posts" 
    ON posts FOR SELECT 
    USING (is_deleted = FALSE);

-- INSERT: Users can create their own posts
CREATE POLICY "Users can create posts" 
    ON posts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own posts
CREATE POLICY "Users can update own posts" 
    ON posts FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own posts (alternative to soft delete)
CREATE POLICY "Users can delete own posts" 
    ON posts FOR DELETE 
    USING (auth.uid() = user_id);

-- ADMIN: Admins can moderate any post
CREATE POLICY "Admins can moderate posts" 
    ON posts FOR UPDATE 
    USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'posts'
ORDER BY policyname;
