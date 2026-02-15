# Fix Comments System Error

## Problem
Error: `column "parent_comment_id" does not exist`

This means the database migration hasn't been run yet.

## Solution

### Step 1: Run Database Migration

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run Migration Script**
   - Open the file `comments_system_migration_v2.sql` from your project root
   - Copy ALL the contents
   - Paste into the Supabase SQL Editor
   - Click "Run" (or press Ctrl+Enter / Cmd+Enter)

4. **Verify Success**
   - You should see "Success. No rows returned"
   - Go to "Table Editor" in left sidebar
   - Verify these tables exist:
     - `comments` (with columns: id, post_id, user_id, parent_comment_id, content, created_at, updated_at)
     - `comment_likes` (with columns: id, comment_id, user_id, created_at)
   - Check `posts` table has `comments_count` column

### Step 2: Deploy Frontend Changes

Once the database migration is complete:

```bash
# Make sure you're in the repository root
cd /Volumes/BetterSpace/SkyGuild/The-Sky-Circle

# Add all changes
git add .

# Commit with proper email
git commit -m "feat: add Instagram-style comments system with replies and likes"

# Push to GitHub
git push origin main

# Deploy to Vercel
vercel --prod
```

### Step 3: Test on Live Site

1. Go to https://www.skyguild.club/dashboard/timeline
2. Click the comment icon on any post
3. Try posting a comment
4. Try replying to a comment
5. Try liking a comment
6. Try deleting your own comment

## What This Migration Does

✅ Creates `comments` table with support for replies (parent_comment_id)
✅ Creates `comment_likes` table for liking comments
✅ Sets up Row Level Security (RLS) policies
✅ Creates indexes for performance
✅ Adds triggers to auto-update comment counts
✅ Adds `comments_count` column to posts table

## Why V2?

The V2 migration script is simpler and more robust:
- Drops existing tables first (clean slate)
- Creates everything from scratch
- No complex conditional logic
- Guaranteed to work

## If You Get Errors

### "relation comments already exists"
- The old migration partially ran
- V2 script handles this by dropping tables first
- Safe to run V2

### "permission denied"
- Make sure you're logged into the correct Supabase project
- Check you have admin access

### "relation posts does not exist"
- Your posts table might have a different name
- Check your database schema
- Update the migration script if needed

## Files Changed

- `comments_system_migration_v2.sql` - New clean migration script
- `sky-circle-frontend/components/social/CommentsSection.tsx` - Comments UI component
- `sky-circle-frontend/components/social/FeedContainer.tsx` - Integrated comments into feed
- `sky-circle-frontend/app/dashboard/timeline/page.tsx` - Timeline page with comments

## Next Steps After Migration

1. ✅ Run migration in Supabase
2. ✅ Deploy frontend to Vercel
3. ✅ Test all comment features
4. ✅ Monitor for any errors
5. ✅ Enjoy your Instagram-style comments system!

## Support

If you still get errors after running the migration:
1. Check Supabase Dashboard → Logs
2. Check browser console for errors
3. Share the exact error message
4. Verify all tables were created correctly
