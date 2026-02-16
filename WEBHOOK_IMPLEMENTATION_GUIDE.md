# Webhook Implementation Guide

## ✅ What's Implemented

### Webhook Triggers Now Active:
1. ✅ `post.created` - When a user creates a new post
2. ✅ `like.created` - When a user likes a post
3. ✅ `comment.created` - When a user comments on a post

### How It Works:
1. User performs an action (create post, like, comment)
2. Action completes successfully in database
3. Webhook trigger function is called
4. System finds all active webhooks listening to that event
5. Webhooks are fired to external URLs (Zapier, Make, etc.)
6. Results are logged in `webhook_logs` table

## Testing the Implementation

### 1. Set Up Webhook
1. Go to admin panel: `https://admin.skyguild.club`
2. Navigate to Webhooks page
3. Create webhook with URL: `https://webhook.site/YOUR-UNIQUE-ID`
4. Select events: `post.created`, `like.created`, `comment.created`
5. Save webhook

### 2. Test Post Creation
1. Go to `https://www.skyguild.club/dashboard/community`
2. Create a new post with image and caption
3. Go back to webhook.site
4. You should see the webhook payload:
```json
{
  "event": "post.created",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "post_id": "uuid",
    "user_id": "uuid",
    "caption": "Your caption",
    "image_url": "https://...",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

### 3. Test Like Creation
1. Like any post in the community feed
2. Check webhook.site for:
```json
{
  "event": "like.created",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "like_id": "uuid",
    "post_id": "uuid",
    "user_id": "uuid",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

### 4. Test Comment Creation
1. Comment on any post
2. Check webhook.site for:
```json
{
  "event": "comment.created",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "comment_id": "uuid",
    "post_id": "uuid",
    "user_id": "uuid",
    "content": "Your comment",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

## How to Add More Webhook Triggers

### Example: Add `observation.created` Webhook

#### 1. Find where observations are created
```bash
# Search for observation insert
grep -r "from('observations').insert" sky-circle-frontend/
```

#### 2. Update the code
```typescript
// Before
await supabase.from('observations').insert({
  user_id: user.id,
  title: title,
  description: description
})

// After
const { data: newObservation } = await supabase.from('observations').insert({
  user_id: user.id,
  title: title,
  description: description
}).select().single()

// Trigger webhook
if (newObservation) {
  try {
    const { triggerWebhookAction } = await import('@/app/actions/webhooks')
    await triggerWebhookAction('observation.created', {
      observation_id: newObservation.id,
      user_id: newObservation.user_id,
      title: newObservation.title,
      description: newObservation.description,
      created_at: newObservation.created_at
    })
  } catch (error) {
    console.error('Webhook trigger failed:', error)
  }
}
```

### Example: Add `user.created` Webhook

#### Update signup page:
```typescript
// In sky-circle-frontend/app/signup/page.tsx
// After successful signup

const { data: newUser } = await supabase.auth.signUp({
  email,
  password
})

if (newUser.user) {
  try {
    const { triggerWebhookAction } = await import('@/app/actions/webhooks')
    await triggerWebhookAction('user.created', {
      user_id: newUser.user.id,
      email: newUser.user.email,
      created_at: newUser.user.created_at
    })
  } catch (error) {
    console.error('Webhook trigger failed:', error)
  }
}
```

### Example: Add `follow.created` Webhook

```typescript
// In follow button component
const { data: newFollow } = await supabase.from('follows').insert({
  follower_id: currentUserId,
  following_id: targetUserId
}).select().single()

if (newFollow) {
  try {
    const { triggerWebhookAction } = await import('@/app/actions/webhooks')
    await triggerWebhookAction('follow.created', {
      follow_id: newFollow.id,
      follower_id: newFollow.follower_id,
      following_id: newFollow.following_id,
      created_at: newFollow.created_at
    })
  } catch (error) {
    console.error('Webhook trigger failed:', error)
  }
}
```

## Available Webhook Events

### User Events
- `user.created` - New user signs up
- `user.updated` - User updates profile
- `user.deleted` - User deletes account

### Content Events
- `observation.created` - New observation posted
- `observation.updated` - Observation edited
- `observation.deleted` - Observation deleted
- `post.created` - ✅ Implemented
- `post.reported` - Post reported by user
- `post.deleted` - Post deleted

### Event Events
- `event.created` - New event created
- `event.updated` - Event details updated
- `event.rsvp` - User RSVPs to event

### Gamification Events
- `mission.completed` - User completes mission
- `badge.earned` - User earns badge

### Social Events
- `follow.created` - User follows another user
- `follow.deleted` - User unfollows
- `comment.created` - ✅ Implemented
- `like.created` - ✅ Implemented

### Referral Events
- `referral.completed` - Referral successfully completed

## Webhook Payload Structure

All webhooks follow this structure:
```typescript
{
  event: string,        // Event type (e.g., "post.created")
  timestamp: string,    // ISO 8601 timestamp
  data: {              // Event-specific data
    // Varies by event type
  }
}
```

## Error Handling

Webhooks are designed to fail gracefully:
- If webhook fails, the main action still succeeds
- Errors are logged to console
- Webhook logs track all attempts
- Failed webhooks are retried (up to 5 times)
- After 5 failures, webhook status changes to "failed"

## Monitoring Webhooks

### In Admin Panel:
1. Go to Webhooks page
2. Click "View Logs" on any webhook
3. See all webhook calls with:
   - Event type
   - Response status
   - Response body
   - Error messages
   - Timestamps

### Check Webhook Status:
- **Active** - Working normally
- **Failed** - Too many failures (5+)
- **Inactive** - Manually disabled

## Deployment

### After adding new webhook triggers:

```bash
# Build frontend
cd sky-circle-frontend
npm run build

# Deploy
vercel --prod
# or
netlify deploy --prod
```

## Troubleshooting

### Webhook not firing?
1. Check webhook is active in admin panel
2. Check webhook has the correct event selected
3. Check webhook URL is valid
4. Check webhook logs for errors
5. Check browser console for errors

### Webhook firing but not receiving data?
1. Check webhook URL is correct
2. Test URL with curl or Postman
3. Check webhook.site or similar service
4. Check webhook logs for response status

### Multiple webhooks firing?
This is normal if you have multiple webhooks listening to the same event.

## Best Practices

1. **Always use `.select().single()`** after insert to get the created record
2. **Wrap webhook calls in try-catch** to prevent main action from failing
3. **Include relevant data** in webhook payload (IDs, timestamps, etc.)
4. **Don't include sensitive data** (passwords, tokens, etc.)
5. **Test webhooks** with webhook.site before using production services
6. **Monitor webhook logs** regularly for failures
7. **Set up retry logic** for critical webhooks

## Next Steps

To implement all 19 webhook events:
1. Find where each action occurs in the codebase
2. Add webhook trigger after successful database operation
3. Include relevant data in payload
4. Test with webhook.site
5. Deploy to production

## Summary

✅ Webhook trigger system implemented
✅ 3 events now firing webhooks (post, like, comment)
✅ Error handling in place
✅ Logging working
✅ Ready to add more events

The webhook system is production-ready and can be extended to all 19 event types following the patterns shown above! 🚀
