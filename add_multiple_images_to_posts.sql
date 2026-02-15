-- Add Multiple Images Support to Posts Table
-- This migration adds support for multiple images per post

-- Add images array column (JSONB array of image URLs)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Migrate existing image_url data to images array
-- Only for posts that have an image_url
UPDATE posts 
SET images = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL 
  AND image_url != '' 
  AND (images IS NULL OR images = '[]'::jsonb);

-- Make image_url nullable since we now use images array
ALTER TABLE posts 
ALTER COLUMN image_url DROP NOT NULL;

-- Add comment explaining the fields
COMMENT ON COLUMN posts.image_url IS 'Deprecated: Use images array instead. Kept for backward compatibility.';
COMMENT ON COLUMN posts.images IS 'Array of image URLs for the post. Supports multiple images per post.';

-- Create index for better query performance on images
CREATE INDEX IF NOT EXISTS idx_posts_images ON posts USING GIN (images);

-- Verify migration
SELECT 
    id, 
    user_id, 
    image_url, 
    images,
    created_at
FROM posts
ORDER BY created_at DESC
LIMIT 5;
