# Webhook Triggers - Implementation Status

## ✅ Fully Implemented (7 Events)

### Webhook Payload Structure

All webhooks now include user details automatically:

```json
{
  "event": "event.name",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    // Event-specific data
  },
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "profile_photo_url": "https://..."
  }
}
```

The `user` object is automatically included for all events that have a `user_id` in the data.

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
  },
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "profile_photo_url": "https://..."
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
  },
  "user": {
    "id": "uuid",
    "email": "referrer@example.com",
    "display_name": "Referrer Name",
    "profile_photo_url": "https://..."
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
  },
  "user": {
    "id": "uuid",
    "email": "observer@example.com",
    "display_name": "Star Gazer",
    "profile_photo_url": "https://..."
  }
}
```

### 4. post.created
**Location:** `sky-circle-frontend/app/dashboard/community/page.tsx` & `timeline/page.tsx`
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
    "images": ["https://...", "https://..."],
    "created_at": "2024-01-01T12:00:00Z"
  },
  "user": {
    "id": "uuid",
    "email": "poster@example.com",
    "display_name": "Night Sky Fan",
    "profile_photo_url": "https://..."
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
  },
  "user": {
    "id": "uuid",
    "email": "liker@example.com",
    "display_name": "Astronomy Lover",
    "profile_photo_url": "https://..."
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
  },
  "user": {
    "id": "uuid",
    "email": "commenter@example.com",
    "display_name": "Helpful User",
    "profile_photo_url": "https://..."
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
  },
  "user": {
    "id": "uuid",
    "email": "follower@example.com",
    "display_name": "New Follower",
    "profile_photo_url": "https://..."
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

## Email Automation Examples

With user details included in every webhook, you can easily set up email automations:

### Example 1: Welcome Email (Zapier)
**Trigger:** `user.created`
**Action:** Send email via Gmail/SendGrid
```
To: {{user.email}}
Subject: Welcome to SkyGuild, {{user.display_name}}!
Body: 
Hi {{user.display_name}},

Welcome to SkyGuild! Your account has been created successfully.

Your referral code: {{data.referral_code}}

Start exploring the cosmos!
```

### Example 2: New Follower Notification
**Trigger:** `follow.created`
**Action:** Send email to the followed user
```
To: [Fetch from database using data.following_id]
Subject: {{user.display_name}} started following you!
Body:
{{user.display_name}} ({{user.email}}) is now following you on SkyGuild.

View their profile: https://skyguild.club/profile/{{user.id}}
```

### Example 3: Post Engagement Alert
**Trigger:** `like.created` or `comment.created`
**Action:** Send email to post author
```
To: [Fetch post author email]
Subject: {{user.display_name}} {{event == 'like.created' ? 'liked' : 'commented on'}} your post!
Body:
{{user.display_name}} engaged with your post.

{{#if event == 'comment.created'}}
Comment: {{data.content}}
{{/if}}

View post: https://skyguild.club/post/{{data.post_id}}
```

### Example 4: Observation Milestone
**Trigger:** `observation.created`
**Action:** Check count and send congratulations
```
To: {{user.email}}
Subject: Great observation, {{user.display_name}}!
Body:
You observed {{data.object_name}} and earned {{data.points_awarded}} points!

Keep exploring the night sky!
```

### Using Make.com for Advanced Workflows
1. Webhook receives event with user details
2. Check conditions (e.g., user's 10th post)
3. Send personalized email
4. Update CRM
5. Post to social media
6. Log to analytics

### Using n8n for Custom Logic
```javascript
// n8n workflow
if (webhook.event === 'post.created') {
  // Get post count for user
  const postCount = await getPostCount(webhook.user.id)
  
  if (postCount === 10) {
    // Send milestone email
    await sendEmail({
      to: webhook.user.email,
      subject: `Congrats ${webhook.user.display_name}! 10 posts milestone!`,
      body: `You've shared 10 amazing posts with the community!`
    })
  }
}
```
