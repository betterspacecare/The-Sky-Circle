-- ============================================
-- NOTIFICATIONS SYSTEM - Complete Setup
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('sky_alert', 'event_reminder', 'badge_earned', 'mission_complete', 'comment', 'like', 'follow', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    push_enabled BOOLEAN DEFAULT FALSE,
    email_enabled BOOLEAN DEFAULT TRUE,
    sky_alerts BOOLEAN DEFAULT TRUE,
    event_reminders BOOLEAN DEFAULT TRUE,
    badge_notifications BOOLEAN DEFAULT TRUE,
    mission_notifications BOOLEAN DEFAULT TRUE,
    social_notifications BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

DROP POLICY IF EXISTS "Users can view own push subscription" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own push subscription" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update own push subscription" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own push subscription" ON push_subscriptions;

DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON notification_preferences;

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Push subscriptions policies
CREATE POLICY "Users can view own push subscription" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own push subscription" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own push subscription" ON push_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own push subscription" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Notification preferences policies
CREATE POLICY "Users can view own preferences" ON notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON notification_preferences FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

-- Function to create a notification for a single user
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (p_user_id, p_type, p_title, p_message, p_data)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify all users (for sky alerts)
CREATE OR REPLACE FUNCTION notify_all_users(
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT id, p_type, p_title, p_message, p_data
    FROM users;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. NOTIFICATION TRIGGERS
-- ============================================

-- Trigger: Auto-create notification when badge is earned
CREATE OR REPLACE FUNCTION notify_badge_earned()
RETURNS TRIGGER AS $$
DECLARE
    v_badge_name TEXT;
    v_badge_icon TEXT;
BEGIN
    SELECT name, icon_url INTO v_badge_name, v_badge_icon 
    FROM badges WHERE id = NEW.badge_id;
    
    PERFORM create_notification(
        NEW.user_id,
        'badge_earned',
        '� New Badge Earned!',
        'Congratulations! You earned the "' || COALESCE(v_badge_name, 'Unknown') || '" badge!',
        jsonb_build_object(
            'badge_id', NEW.badge_id, 
            'badge_name', v_badge_name,
            'badge_icon', v_badge_icon
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_badge_earned ON user_badges;
CREATE TRIGGER trigger_notify_badge_earned
    AFTER INSERT ON user_badges
    FOR EACH ROW
    EXECUTE FUNCTION notify_badge_earned();

-- Trigger: Auto-create notification when sky alert is created
CREATE OR REPLACE FUNCTION notify_sky_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notifications for all users
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
        u.id,
        'sky_alert',
        '🌟 ' || NEW.title,
        NEW.message,
        jsonb_build_object('alert_id', NEW.id, 'alert_type', NEW.alert_type)
    FROM users u;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_sky_alert ON sky_alerts;
CREATE TRIGGER trigger_notify_sky_alert
    AFTER INSERT ON sky_alerts
    FOR EACH ROW
    EXECUTE FUNCTION notify_sky_alert();

-- Trigger: Notify when someone comments on your post
CREATE OR REPLACE FUNCTION notify_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_post_owner_id UUID;
    v_commenter_name TEXT;
BEGIN
    -- Get post owner
    SELECT user_id INTO v_post_owner_id FROM posts WHERE id = NEW.post_id;
    
    -- Don't notify if commenting on own post
    IF v_post_owner_id = NEW.user_id THEN
        RETURN NEW;
    END IF;
    
    -- Get commenter name
    SELECT display_name INTO v_commenter_name FROM users WHERE id = NEW.user_id;
    
    PERFORM create_notification(
        v_post_owner_id,
        'comment',
        '💬 New Comment',
        COALESCE(v_commenter_name, 'Someone') || ' commented on your post',
        jsonb_build_object(
            'post_id', NEW.post_id, 
            'comment_id', NEW.id, 
            'commenter_id', NEW.user_id,
            'commenter_name', v_commenter_name
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_comment ON comments;
CREATE TRIGGER trigger_notify_comment
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_comment();

-- Trigger: Notify when someone likes your post
CREATE OR REPLACE FUNCTION notify_like()
RETURNS TRIGGER AS $$
DECLARE
    v_post_owner_id UUID;
    v_liker_name TEXT;
BEGIN
    -- Get post owner
    SELECT user_id INTO v_post_owner_id FROM posts WHERE id = NEW.post_id;
    
    -- Don't notify if liking own post
    IF v_post_owner_id = NEW.user_id THEN
        RETURN NEW;
    END IF;
    
    -- Get liker name
    SELECT display_name INTO v_liker_name FROM users WHERE id = NEW.user_id;
    
    PERFORM create_notification(
        v_post_owner_id,
        'like',
        '❤️ New Like',
        COALESCE(v_liker_name, 'Someone') || ' liked your post',
        jsonb_build_object(
            'post_id', NEW.post_id, 
            'liker_id', NEW.user_id,
            'liker_name', v_liker_name
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_like ON likes;
CREATE TRIGGER trigger_notify_like
    AFTER INSERT ON likes
    FOR EACH ROW
    EXECUTE FUNCTION notify_like();

-- Trigger: Notify when mission is completed
CREATE OR REPLACE FUNCTION notify_mission_complete()
RETURNS TRIGGER AS $$
DECLARE
    v_mission_title TEXT;
    v_bonus_points INTEGER;
BEGIN
    -- Only trigger when is_completed changes to true
    IF NEW.is_completed = TRUE AND (OLD.is_completed IS NULL OR OLD.is_completed = FALSE) THEN
        SELECT title, bonus_points INTO v_mission_title, v_bonus_points 
        FROM missions WHERE id = NEW.mission_id;
        
        PERFORM create_notification(
            NEW.user_id,
            'mission_complete',
            '🎯 Mission Complete!',
            'You completed the "' || COALESCE(v_mission_title, 'Unknown') || '" mission! +' || COALESCE(v_bonus_points, 0) || ' bonus points!',
            jsonb_build_object(
                'mission_id', NEW.mission_id, 
                'mission_title', v_mission_title,
                'bonus_points', v_bonus_points
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_mission_complete ON user_mission_progress;
CREATE TRIGGER trigger_notify_mission_complete
    AFTER UPDATE ON user_mission_progress
    FOR EACH ROW
    EXECUTE FUNCTION notify_mission_complete();

-- Trigger: Notify when event is coming up (for RSVP'd users)
-- This would typically be run by a cron job, but we can create the function
CREATE OR REPLACE FUNCTION send_event_reminders()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Send reminders for events happening in the next 24 hours
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
        ea.user_id,
        'event_reminder',
        '📅 Event Tomorrow!',
        'Don''t forget: "' || e.title || '" is happening tomorrow at ' || TO_CHAR(e.event_date, 'HH12:MI AM'),
        jsonb_build_object(
            'event_id', e.id, 
            'event_title', e.title,
            'event_date', e.event_date,
            'event_location', e.location
        )
    FROM events e
    JOIN event_attendees ea ON e.id = ea.event_id
    WHERE e.event_date BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'
    AND NOT EXISTS (
        SELECT 1 FROM notifications n 
        WHERE n.user_id = ea.user_id 
        AND n.type = 'event_reminder' 
        AND (n.data->>'event_id')::uuid = e.id
    );
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_notification_preferences ON users;
CREATE TRIGGER trigger_create_notification_preferences
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- ============================================
-- 6. REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- 7. CRON JOB FOR EVENT REMINDERS (Optional)
-- ============================================
-- To enable automatic event reminders, run this in Supabase:
-- 
-- SELECT cron.schedule(
--     'send-event-reminders',
--     '0 * * * *',  -- Run every hour
--     $$SELECT send_event_reminders()$$
-- );

-- ============================================
-- 8. TEST THE SETUP
-- ============================================

-- You can test by creating a sky alert:
-- INSERT INTO sky_alerts (title, message, alert_type) 
-- VALUES ('Test Alert', 'This is a test notification', 'text');

-- Check if notifications were created:
-- SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

SELECT 'Notification system setup complete!' as status;
