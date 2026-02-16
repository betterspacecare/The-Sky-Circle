-- Webhooks System Migration
-- Creates tables for webhook management and automation
-- Allows admins to configure webhooks for platform events

-- ============================================
-- WEBHOOKS TABLE
-- Stores webhook configurations
-- ============================================
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL, -- Array of event types to listen for
    secret VARCHAR(255), -- Optional secret for webhook signature verification
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'failed')),
    retry_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    last_success_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_webhooks_is_active ON webhooks(is_active);
CREATE INDEX idx_webhooks_status ON webhooks(status);

-- Trigger for updating updated_at timestamp
CREATE TRIGGER update_webhooks_updated_at 
    BEFORE UPDATE ON webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- WEBHOOK_LOGS TABLE
-- Stores webhook execution history
-- ============================================
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- Enable RLS on webhook tables (admin only access)
-- ============================================
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage webhooks
CREATE POLICY "Admins can view all webhooks" 
    ON webhooks FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert webhooks" 
    ON webhooks FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update webhooks" 
    ON webhooks FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete webhooks" 
    ON webhooks FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Webhook logs policies
CREATE POLICY "Admins can view webhook logs" 
    ON webhook_logs FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "System can insert webhook logs" 
    ON webhook_logs FOR INSERT 
    WITH CHECK (true); -- Allow system to insert logs

-- ============================================
-- WEBHOOK EVENT TYPES (for reference)
-- ============================================
-- User Events:
--   - user.created
--   - user.updated
--   - user.deleted
--
-- Observation Events:
--   - observation.created
--   - observation.updated
--   - observation.deleted
--
-- Post Events:
--   - post.created
--   - post.reported
--   - post.deleted
--
-- Event Events:
--   - event.created
--   - event.updated
--   - event.rsvp
--
-- Gamification Events:
--   - mission.completed
--   - badge.earned
--
-- Social Events:
--   - follow.created
--   - follow.deleted
--   - comment.created
--   - like.created
--
-- Referral Events:
--   - referral.completed

-- ============================================
-- HELPER FUNCTION: Trigger Webhooks
-- Function to be called by database triggers
-- ============================================
CREATE OR REPLACE FUNCTION trigger_webhooks(
    p_event_type TEXT,
    p_payload JSONB
) RETURNS void AS $$
DECLARE
    v_webhook RECORD;
    v_response TEXT;
BEGIN
    -- Find all active webhooks that listen to this event
    FOR v_webhook IN 
        SELECT * FROM webhooks 
        WHERE is_active = true 
        AND status != 'failed'
        AND p_event_type = ANY(events)
    LOOP
        BEGIN
            -- Log the webhook trigger
            INSERT INTO webhook_logs (
                webhook_id,
                event_type,
                payload,
                retry_count
            ) VALUES (
                v_webhook.id,
                p_event_type,
                p_payload,
                0
            );

            -- Update webhook last_triggered_at
            UPDATE webhooks 
            SET last_triggered_at = NOW()
            WHERE id = v_webhook.id;

            -- Note: Actual HTTP request would be made by a background worker
            -- This function just logs the event for processing
            
        EXCEPTION WHEN OTHERS THEN
            -- Log error but don't fail the transaction
            UPDATE webhooks 
            SET 
                last_error = SQLERRM,
                retry_count = retry_count + 1,
                status = CASE WHEN retry_count >= 5 THEN 'failed' ELSE status END
            WHERE id = v_webhook.id;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- EXAMPLE TRIGGERS (can be enabled as needed)
-- ============================================

-- Trigger on user creation
CREATE OR REPLACE FUNCTION webhook_user_created() RETURNS TRIGGER AS $$
BEGIN
    PERFORM trigger_webhooks(
        'user.created',
        jsonb_build_object(
            'id', NEW.id,
            'email', NEW.email,
            'display_name', NEW.display_name,
            'created_at', NEW.created_at
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on observation creation
CREATE OR REPLACE FUNCTION webhook_observation_created() RETURNS TRIGGER AS $$
BEGIN
    PERFORM trigger_webhooks(
        'observation.created',
        jsonb_build_object(
            'id', NEW.id,
            'user_id', NEW.user_id,
            'object_name', NEW.object_name,
            'category', NEW.category,
            'points_awarded', NEW.points_awarded,
            'created_at', NEW.created_at
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on post creation
CREATE OR REPLACE FUNCTION webhook_post_created() RETURNS TRIGGER AS $$
BEGIN
    PERFORM trigger_webhooks(
        'post.created',
        jsonb_build_object(
            'id', NEW.id,
            'user_id', NEW.user_id,
            'image_url', NEW.image_url,
            'caption', NEW.caption,
            'created_at', NEW.created_at
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on follow creation
CREATE OR REPLACE FUNCTION webhook_follow_created() RETURNS TRIGGER AS $$
BEGIN
    PERFORM trigger_webhooks(
        'follow.created',
        jsonb_build_object(
            'id', NEW.id,
            'follower_id', NEW.follower_id,
            'following_id', NEW.following_id,
            'created_at', NEW.created_at
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Uncomment these to enable webhook triggers
-- CREATE TRIGGER trigger_webhook_user_created
--     AFTER INSERT ON users
--     FOR EACH ROW EXECUTE FUNCTION webhook_user_created();

-- CREATE TRIGGER trigger_webhook_observation_created
--     AFTER INSERT ON observations
--     FOR EACH ROW EXECUTE FUNCTION webhook_observation_created();

-- CREATE TRIGGER trigger_webhook_post_created
--     AFTER INSERT ON posts
--     FOR EACH ROW EXECUTE FUNCTION webhook_post_created();

-- CREATE TRIGGER trigger_webhook_follow_created
--     AFTER INSERT ON follows
--     FOR EACH ROW EXECUTE FUNCTION webhook_follow_created();

