# Webhook Triggers - Implementation Status

## ✅ Fully Implemented (7 Events)

### 1. user.created
**Location:** `sky-circle-frontend/app/signup/page.tsx`
**Triggers when:** New user signs up
**Payload:**
```json
{
  "event": "user.created",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "referral_code": "ABC123",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

### 2. referral.completed
**Location:** `sky-circle-frontend/app/signup/page.tsx`
**Triggers when:** New user signs up with referral code
**Payload:**
```json
{
  "event": "referral.completed",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "referral_id": "uuid",
    "referrer_id": "uuid",
    "referred_user_id": "uuid",
    "reward_points": 50,
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

### 3. observation.created
**Location:** `sky-circle-frontend/app/dashboard/observations/new/page.tsx`
**Triggers when:** User creates new observation
**Payload:**
```json
{
  "event": "observation.created",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "observation_id": "uuid",
    "user_id": "uuid",
    "object_name": "Andromeda Galaxy",
    "category": "Deep Sky",
    "location": "Backyard",
    "points_awarded": 50,
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

### 4. post.created
**Location:** `sky-circle-frontend/app/dashboard/community/page.tsx`
**Triggers when:** User creates new post
**Payload:**
```json
{
  "event": "post.created",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "post_id": "uuid",
    "user_id": "uuid",
    "caption": "Amazing night sky!",
    "image_url": "https://...",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

### 5. like.created
**Location:** `sky-circle-frontend/app/dashboard/community/page.tsx`
**Triggers when:** User likes a post
**Payload:**
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

### 6. comment.created
**Location:** `sky-circle-frontend/app/dashboard/community/page.tsx`
**Triggers when:** User comments on a post
**Payload:**
```json
{
  "event": "comment.created",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "comment_id": "uuid",
    "post_id": "uuid",
    "user_id": "uuid",
    "content": "Great shot!",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

### 7. follow.created
**Location:** `sky-circle-frontend/lib/services/followService.ts`
**Triggers when:** User follows another user
**Payload:**
```json
{
  "event": "follow.created",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "follow_id": "uuid",
    "follower_id": "uuid",
    "following_id": "uuid",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

## 📋 To Be Implemented (12 Events)

### User Events
- ❌ `user.updated` - User updates profile
- ❌ `user.deleted` - User deletes account

### Content Events
- ❌ `observation.updated` - Observation edited
- ❌ `observation.deleted` - Observation deleted
- ❌ `post.reported` - Post reported
- ❌ `post.deleted` - Post deleted

### Event Events
- ❌ `event.created` - New event created
- ❌ `event.updated` - Event updated
- ❌ `event.rsvp` - User RSVPs to event

### Gamification Events
- ❌ `mission.completed` - Mission completed
- ❌ `badge.earned` - Badge earned

### Social Events
- ❌ `follow.deleted` - User unfollows

## Implementation Pattern

All webhook triggers follow this pattern:

```typescript
// 1. Perform database operation with .select().single()
const { data: newRecord, error } = await supabase
  .from('table_name')
  .insert({ ...data })
  .select()
  .single()

if (error) throw error

// 2. Trigger webhook if successful
if (newRecord) {
  try {
    const { triggerWebhookAction } = await import('@/app/actions/webhooks')
    await triggerWebhookAction('event.name', {
      // Include relevant data
      id: newRecord.id,
      user_id: newRecord.user_id,
      created_at: newRecord.created_at,
      // ... other fields
    })
  } catch (error) {
    console.error('Webhook trigger failed:', error)
    // Don't fail the main operation
  }
}
```

## Testing

### 1. Set Up Webhook
1. Go to admin panel
2. Create webhook with webhook.site URL
3. Select events to listen to
4. Save

### 2. Trigger Events
- **user.created**: Sign up new user
- **referral.completed**: Sign up with referral code
- **observation.created**: Create new observation
- **post.created**: Create new post
- **like.created**: Like a post
- **comment.created**: Comment on a post
- **follow.created**: Follow a user

### 3. Verify
1. Check webhook.site for payloads
2. Check admin panel webhook logs
3. Verify response status is 200

## Files Modified

1. `sky-circle-frontend/lib/webhooks/trigger.ts` - Core trigger system
2. `sky-circle-frontend/app/actions/webhooks.ts` - Server action
3. `sky-circle-frontend/app/signup/page.tsx` - user.created, referral.completed
4. `sky-circle-frontend/app/dashboard/observations/new/page.tsx` - observation.created
5. `sky-circle-frontend/app/dashboard/community/page.tsx` - post.created, like.created, comment.created
6. `sky-circle-frontend/lib/services/followService.ts` - follow.created

## Deployment

After implementing webhooks:

```bash
cd sky-circle-frontend
npm run build
vercel --prod
```

## Summary

✅ **7 out of 19 events implemented** (37%)
- All major user actions covered
- Social features fully integrated
- Gamification events pending
- Event management pending

The most important events are now live! The remaining events can be added following the same pattern as needed.
