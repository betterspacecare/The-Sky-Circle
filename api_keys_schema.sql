-- API Keys System Migration
-- Creates tables for API key management for Zapier/Make/n8n integrations

-- ============================================
-- API_KEYS TABLE
-- Stores API keys for external integrations
-- ============================================
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    key_hash VARCHAR(255) NOT NULL UNIQUE, -- Hashed version of the key
    key_prefix VARCHAR(20) NOT NULL, -- First few characters for identification (e.g., "sk_live_abc...")
    permissions TEXT[] DEFAULT ARRAY['read'], -- Array of permissions: read, write, admin
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX idx_api_keys_created_by ON api_keys(created_by);

-- Trigger for updating updated_at timestamp
CREATE TRIGGER update_api_keys_updated_at 
    BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- API_KEY_LOGS TABLE
-- Stores API key usage logs
-- ============================================
CREATE TABLE api_key_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    ip_address INET,
    user_agent TEXT,
    request_body JSONB,
    response_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX idx_api_key_logs_api_key_id ON api_key_logs(api_key_id);
CREATE INDEX idx_api_key_logs_created_at ON api_key_logs(created_at DESC);
CREATE INDEX idx_api_key_logs_endpoint ON api_key_logs(endpoint);

-- ============================================
-- ROW LEVEL SECURITY
-- Enable RLS on API key tables (admin only access)
-- ============================================
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage API keys
CREATE POLICY "Admins can view all api_keys" 
    ON api_keys FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert api_keys" 
    ON api_keys FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update api_keys" 
    ON api_keys FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete api_keys" 
    ON api_keys FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- API key logs policies
CREATE POLICY "Admins can view api_key_logs" 
    ON api_key_logs FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "System can insert api_key_logs" 
    ON api_key_logs FOR INSERT 
    WITH CHECK (true); -- Allow system to insert logs

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to generate API key prefix
CREATE OR REPLACE FUNCTION generate_api_key_prefix(full_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN substring(full_key from 1 for 12) || '...';
END;
$$ LANGUAGE plpgsql;

-- Function to verify API key (to be called from application)
CREATE OR REPLACE FUNCTION verify_api_key(p_key_hash TEXT)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    permissions TEXT[],
    is_active BOOLEAN
) AS $$
BEGIN
    -- Update last_used_at
    UPDATE api_keys 
    SET last_used_at = NOW()
    WHERE key_hash = p_key_hash 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());

    -- Return key details
    RETURN QUERY
    SELECT 
        api_keys.id,
        api_keys.name,
        api_keys.permissions,
        api_keys.is_active
    FROM api_keys
    WHERE api_keys.key_hash = p_key_hash
    AND api_keys.is_active = true
    AND (api_keys.expires_at IS NULL OR api_keys.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log API key usage
CREATE OR REPLACE FUNCTION log_api_key_usage(
    p_api_key_id UUID,
    p_endpoint TEXT,
    p_method TEXT,
    p_status_code INTEGER,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_request_body JSONB DEFAULT NULL,
    p_response_time_ms INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO api_key_logs (
        api_key_id,
        endpoint,
        method,
        status_code,
        ip_address,
        user_agent,
        request_body,
        response_time_ms,
        error_message
    ) VALUES (
        p_api_key_id,
        p_endpoint,
        p_method,
        p_status_code,
        p_ip_address,
        p_user_agent,
        p_request_body,
        p_response_time_ms,
        p_error_message
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- View for API key usage statistics
CREATE OR REPLACE VIEW api_key_usage_stats AS
SELECT 
    ak.id,
    ak.name,
    ak.key_prefix,
    ak.is_active,
    COUNT(akl.id) as total_requests,
    COUNT(CASE WHEN akl.status_code >= 200 AND akl.status_code < 300 THEN 1 END) as successful_requests,
    COUNT(CASE WHEN akl.status_code >= 400 THEN 1 END) as failed_requests,
    AVG(akl.response_time_ms) as avg_response_time_ms,
    MAX(akl.created_at) as last_request_at
FROM api_keys ak
LEFT JOIN api_key_logs akl ON ak.id = akl.api_key_id
GROUP BY ak.id, ak.name, ak.key_prefix, ak.is_active;

-- Grant access to admins
GRANT SELECT ON api_key_usage_stats TO authenticated;

-- ============================================
-- SAMPLE DATA (for testing - remove in production)
-- ============================================

-- Insert a sample API key (key: sk_live_test_key_12345678901234567890)
-- In production, keys should be generated securely and hashed
-- INSERT INTO api_keys (
--     name,
--     description,
--     key_hash,
--     key_prefix,
--     permissions,
--     is_active
-- ) VALUES (
--     'Test API Key',
--     'Sample API key for testing',
--     encode(digest('sk_live_test_key_12345678901234567890', 'sha256'), 'hex'),
--     'sk_live_test...',
--     ARRAY['read', 'write'],
--     true
-- );

