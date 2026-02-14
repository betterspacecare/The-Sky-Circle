-- ============================================
-- FOLLOW NOTIFICATION TRIGGER
-- Run this in Supabase SQL Editor to enable
-- notifications when someone follows a user
-- ============================================

-- Trigger: Notify when someone follows you
CREATE OR REPLACE FUNCTION notify_follow()
RETURNS TRIGGER AS $$
DECLARE
    v_follower_name TEXT;
    v_follower_avatar TEXT;
BEGIN
    -- Get follower info
    SELECT display_name, avatar_url INTO v_follower_name, v_follower_avatar 
    FROM users WHERE id = NEW.follower_id;
    
    -- Create notification for the user being followed
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
        NEW.following_id,
        'follow',
        '👤 New Follower',
        COALESCE(v_follower_name, 'Someone') || ' started following you',
        jsonb_build_object(
            'follower_id', NEW.follower_id,
            'follower_name', v_follower_name,
            'follower_avatar', v_follower_avatar
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_follow ON follows;

-- Create the trigger
CREATE TRIGGER trigger_notify_follow
    AFTER INSERT ON follows
    FOR EACH ROW
    EXECUTE FUNCTION notify_follow();

SELECT 'Follow notification trigger created successfully!' as status;
