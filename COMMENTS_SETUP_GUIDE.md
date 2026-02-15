# Comments System Setup Guide

## Overview
This guide will help you set up the complete comments system with replies, likes, and proper interactions.

## Database Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click on "SQL Editor" in the left sidebar

2. **Run the Migration**
   - Click "New Query"
   - Copy the entire contents of `comments_system_migration.sql`
   - Paste into the SQL editor
   - Click "Run" or press Ctrl+Enter

3. **Verify Tables Created**
   - Go to "Table Editor"
   - You should see:
     - `comments` table with columns: id, post_id, user_id, parent_comment_id, content, created_at, updated_at
     - `comment_likes` table with columns: id, comment_id, user_id, created_at
   - Check that `posts` table now has `comments_count` column

### Option 2: Using Supabase CLI

```bash
# Make sure you're in the project root
cd /path/to/The-Sky-Circle

# Run the migration
supabase db push

# Or apply the SQL file directly
psql $DATABASE_URL -f comments_system_migration.sql
```

## What This Migration Does

### 1. Creates/Updates Tables

**comments table:**
- Stores all comments and replies
- `parent_comment_id` is NULL for top-level comments
- `parent_comment_id` references another comment for replies

**comment_likes table:**
- Stores likes on comments
- Prevents duplicate likes (unique constraint)

### 2. Sets Up Indexes
- Fast lookups by post_id, user_id, parent_comment_id
- Optimized for timeline queries

### 3. Enables Row Level Security (RLS)
- Anyone can view comments
- Users can only create/edit/delete their own comments
- Users can only like/unlike comments themselves

### 4. Creates Triggers
- Auto-updates `updated_at` timestamp on comment edits
- Auto-updates `comments_count` on posts when comments are added/deleted

### 5. Adds comments_count to Posts
- Tracks total number of top-level comments
- Excludes replies from count (replies are nested)

## Features Included

### ✅ Comments
- Post comments on any post
- View all comments on a post
- Edit your own comments
- Delete your own comments
- Real-time comment updates

### ✅ Replies
- Reply to any comment
- Nested conversation threads
- View/hide replies
- Reply count display

### ✅ Likes
- Like/unlike comments
- Like count display
- Visual feedback (red heart when liked)
- Optimistic UI updates

### ✅ Interactions
- Click comment button to open comments section
- Type and post comments instantly
- Reply to specific comments
- Like comments with one click
- Delete your own comments

## Testing the System

### 1. Test Basic Comments

1. Go to Timeline page
2. Click the comment icon on any post
3. Type a comment and click "Post"
4. Comment should appear immediately
5. Comments count should increment

### 2. Test Replies

1. Click "Reply" on any comment
2. Type a reply and press Enter or click send
3. Reply should be added
4. "View X replies" button should appear
5. Click to expand/collapse replies

### 3. Test Likes

1. Click the heart icon on any comment
2. Heart should turn red and fill
3. Like count should increment
4. Click again to unlike
5. Heart should turn gray and empty

### 4. Test Deletion

1. Find your own comment
2. Click the trash icon
3. Confirm deletion
4. Comment should disappear
5. Comments count should decrement

## Troubleshooting

### Issue: "column parent_comment_id does not exist"

**Solution:** The migration script handles this. Run `comments_system_migration.sql` which adds the column if it doesn't exist.

### Issue: "relation comments already exists"

**Solution:** This is fine! The migration uses `CREATE TABLE IF NOT EXISTS` and will just add missing columns.

### Issue: Comments not showing up

**Check:**
1. RLS policies are enabled (migration does this)
2. User is authenticated
3. Browser console for errors
4. Supabase logs in dashboard

### Issue: Can't like comments

**Check:**
1. `comment_likes` table exists
2. RLS policies are set up
3. User is authenticated
4. No duplicate like constraint violation

### Issue: Comments count not updating

**Check:**
1. Trigger `update_post_comments_count_trigger` exists
2. `comments_count` column exists on posts table
3. Run the count update query manually:
   ```sql
   UPDATE posts p
   SET comments_count = (
       SELECT COUNT(*)
       FROM comments c
       WHERE c.post_id = p.id AND c.parent_comment_id IS NULL
   );
   ```

## Database Schema

### comments table
```sql
id                  UUID PRIMARY KEY
post_id             UUID (references posts)
user_id             UUID (references users)
parent_comment_id   UUID (references comments, nullable)
content             TEXT
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### comment_likes table
```sql
id          UUID PRIMARY KEY
comment_id  UUID (references comments)
user_id     UUID (references users)
created_at  TIMESTAMP

UNIQUE(comment_id, user_id)
```

## API Endpoints Used

The CommentsSection component uses these Supabase operations:

### Fetch Comments
```typescript
supabase
  .from('comments')
  .select('*, users(*)')
  .eq('post_id', postId)
  .is('parent_comment_id', null)
```

### Post Comment
```typescript
supabase
  .from('comments')
  .insert({ post_id, user_id, content })
```

### Like Comment
```typescript
supabase
  .from('comment_likes')
  .insert({ comment_id, user_id })
```

### Unlike Comment
```typescript
supabase
  .from('comment_likes')
  .delete()
  .eq('comment_id', commentId)
  .eq('user_id', userId)
```

### Delete Comment
```typescript
supabase
  .from('comments')
  .delete()
  .eq('id', commentId)
  .eq('user_id', userId)
```

## Security

### Row Level Security (RLS)

**Comments:**
- ✅ Anyone can view (SELECT)
- ✅ Users can only insert their own (INSERT with user_id check)
- ✅ Users can only update their own (UPDATE with user_id check)
- ✅ Users can only delete their own (DELETE with user_id check)

**Comment Likes:**
- ✅ Anyone can view (SELECT)
- ✅ Users can only insert their own (INSERT with user_id check)
- ✅ Users can only delete their own (DELETE with user_id check)

### Constraints

- Comments must have content (not empty)
- Users can only like a comment once (unique constraint)
- Deleting a comment deletes all replies (CASCADE)
- Deleting a post deletes all comments (CASCADE)

## Performance Optimizations

1. **Indexes** on frequently queried columns
2. **Optimistic UI updates** for instant feedback
3. **Lazy loading** of replies (only load when expanded)
4. **Efficient queries** with proper JOINs
5. **Cached counts** (comments_count on posts)

## Next Steps

After setting up:

1. ✅ Test all features thoroughly
2. ✅ Monitor Supabase logs for errors
3. ✅ Check performance with many comments
4. ✅ Consider adding comment notifications
5. ✅ Add comment moderation features (if needed)

## Support

If you encounter issues:

1. Check Supabase Dashboard → Logs
2. Check browser console for errors
3. Verify RLS policies are active
4. Test queries in SQL Editor
5. Check that all tables and columns exist

## Summary

✅ Comments system with replies
✅ Like/unlike comments
✅ Delete own comments
✅ Real-time updates
✅ Optimistic UI
✅ Proper security (RLS)
✅ Performance optimized
✅ Instagram-style interactions

The system is now ready to use!
