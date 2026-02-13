# Notification System Setup Guide

This guide walks you through setting up the complete notification system for Sky Circle.

## Step 1: Run Database Schema

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `notifications_schema.sql`
4. Paste and click **Run**

This creates:
- `notifications` table
- `push_subscriptions` table  
- `notification_preferences` table
- Automatic triggers for badges, comments, likes, sky alerts, and missions
- Real-time subscriptions

## Step 2: Enable Realtime (if not already)

1. Go to **Database** → **Replication**
2. Under "Supabase Realtime", ensure `notifications` table is enabled
3. If not, click the toggle to enable it

## Step 3: Set Up Email Notifications (Optional)

### Option A: Using Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. In Supabase Dashboard, go to **Edge Functions** → **Secrets**
4. Add secret: `RESEND_API_KEY` = your API key

### Option B: Using Supabase Auth Emails

Supabase can send emails through its built-in auth system. Configure in:
**Authentication** → **Email Templates**

## Step 4: Deploy Edge Function (for email notifications)

If you want email notifications, deploy the edge function:

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref gmsylfwpftqdlzoboqqr

# Deploy the function
supabase functions deploy send-notification --no-verify-jwt
```

## Step 5: Set Up Database Webhook

To trigger email notifications automatically:

1. Go to **Database** → **Webhooks**
2. Click **Create a new webhook**
3. Configure:
   - Name: `send-notification-email`
   - Table: `notifications`
   - Events: `INSERT`
   - Type: `Supabase Edge Function`
   - Function: `send-notification`
4. Click **Create webhook**

## Step 6: Set Up Push Notifications (Optional)

### Generate VAPID Keys

```bash
# Using web-push npm package
npx web-push generate-vapid-keys
```

### Add to Environment

Add to `sky-circle-frontend/.env.local`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
```

Add to Supabase Edge Function secrets:
```
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_PUBLIC_KEY=your_public_key_here
```

## Step 7: Test the System

### Test Sky Alert Notification

Run in SQL Editor:
```sql
INSERT INTO sky_alerts (title, message, alert_type) 
VALUES ('Meteor Shower Tonight!', 'The Perseid meteor shower peaks tonight. Best viewing after midnight.', 'meteor_shower');
```

### Check Notifications Created

```sql
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
```

### Test Badge Notification

```sql
-- First, get a user ID and badge ID
SELECT id FROM users LIMIT 1;
SELECT id FROM badges LIMIT 1;

-- Then award the badge (replace with actual IDs)
INSERT INTO user_badges (user_id, badge_id)
VALUES ('user-id-here', 'badge-id-here');
```

## Step 8: Set Up Event Reminders (Optional)

To send automatic event reminders, enable the pg_cron extension:

1. Go to **Database** → **Extensions**
2. Enable `pg_cron`
3. Run in SQL Editor:

```sql
SELECT cron.schedule(
    'send-event-reminders',
    '0 * * * *',  -- Run every hour
    $$SELECT send_event_reminders()$$
);
```

## Notification Types

| Type | Trigger | Description |
|------|---------|-------------|
| `sky_alert` | New sky_alerts row | Celestial events, meteor showers |
| `badge_earned` | New user_badges row | When user earns a badge |
| `mission_complete` | user_mission_progress.is_completed = true | Mission completion |
| `comment` | New comments row | Someone comments on your post |
| `like` | New likes row | Someone likes your post |
| `event_reminder` | Cron job (hourly) | Events happening in 24 hours |
| `system` | Manual | System announcements |

## Troubleshooting

### Notifications not appearing
1. Check if triggers exist: `SELECT * FROM pg_trigger WHERE tgname LIKE 'trigger_notify%';`
2. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'notifications';`
3. Verify realtime is enabled for notifications table

### Emails not sending
1. Check Edge Function logs in Supabase Dashboard
2. Verify RESEND_API_KEY is set correctly
3. Check webhook is configured and enabled

### Push notifications not working
1. Verify VAPID keys are correct
2. Check browser console for service worker errors
3. Ensure HTTPS is being used (required for push)

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Action   │────▶│  Database Trigger │────▶│  notifications  │
│  (badge, like)  │     │                  │     │     table       │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                        ┌─────────────────────────────────┼─────────────────────────────────┐
                        │                                 │                                 │
                        ▼                                 ▼                                 ▼
               ┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
               │   Realtime      │             │  Database       │             │   Frontend      │
               │   Subscription  │             │  Webhook        │             │   Polling       │
               └────────┬────────┘             └────────┬────────┘             └────────┬────────┘
                        │                               │                               │
                        ▼                               ▼                               ▼
               ┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
               │   In-App        │             │  Edge Function  │             │   Notification  │
               │   Notification  │             │  (send email)   │             │   Center        │
               └─────────────────┘             └─────────────────┘             └─────────────────┘
```
