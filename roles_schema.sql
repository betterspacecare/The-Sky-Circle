-- ============================================
-- USER ROLES SYSTEM
-- Run this in Supabase SQL Editor
-- ============================================

-- Add role column to users table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' 
        CHECK (role IN ('admin', 'manager', 'user'));
    END IF;
END $$;

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- ROLE PERMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'user')),
    permission TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, permission)
);

-- Insert default permissions
INSERT INTO role_permissions (role, permission) VALUES
    -- Admin permissions (full access)
    ('admin', 'users.view'),
    ('admin', 'users.create'),
    ('admin', 'users.edit'),
    ('admin', 'users.delete'),
    ('admin', 'users.manage_roles'),
    ('admin', 'events.view'),
    ('admin', 'events.create'),
    ('admin', 'events.edit'),
    ('admin', 'events.delete'),
    ('admin', 'missions.view'),
    ('admin', 'missions.create'),
    ('admin', 'missions.edit'),
    ('admin', 'missions.delete'),
    ('admin', 'badges.view'),
    ('admin', 'badges.create'),
    ('admin', 'badges.edit'),
    ('admin', 'badges.delete'),
    ('admin', 'observations.view'),
    ('admin', 'observations.delete'),
    ('admin', 'posts.view'),
    ('admin', 'posts.moderate'),
    ('admin', 'posts.delete'),
    ('admin', 'alerts.view'),
    ('admin', 'alerts.create'),
    ('admin', 'alerts.edit'),
    ('admin', 'alerts.delete'),
    ('admin', 'referrals.view'),
    ('admin', 'dashboard.view'),
    ('admin', 'settings.manage'),
    
    -- Manager permissions (content management, no user role changes)
    ('manager', 'users.view'),
    ('manager', 'events.view'),
    ('manager', 'events.create'),
    ('manager', 'events.edit'),
    ('manager', 'missions.view'),
    ('manager', 'missions.create'),
    ('manager', 'missions.edit'),
    ('manager', 'badges.view'),
    ('manager', 'badges.create'),
    ('manager', 'badges.edit'),
    ('manager', 'observations.view'),
    ('manager', 'posts.view'),
    ('manager', 'posts.moderate'),
    ('manager', 'alerts.view'),
    ('manager', 'alerts.create'),
    ('manager', 'alerts.edit'),
    ('manager', 'referrals.view'),
    ('manager', 'dashboard.view'),
    
    -- User permissions (basic access - for frontend)
    ('user', 'events.view'),
    ('user', 'missions.view'),
    ('user', 'badges.view'),
    ('user', 'observations.view'),
    ('user', 'posts.view'),
    ('user', 'alerts.view'),
    ('user', 'dashboard.view')
ON CONFLICT (role, permission) DO NOTHING;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM users WHERE id = p_user_id;
    
    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM role_permissions 
        WHERE role = v_role AND permission = p_permission
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM users WHERE id = p_user_id;
    RETURN COALESCE(v_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set user role (admin only)
CREATE OR REPLACE FUNCTION set_user_role(p_user_id UUID, p_new_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_new_role NOT IN ('admin', 'manager', 'user') THEN
        RETURN FALSE;
    END IF;
    
    UPDATE users SET role = p_new_role WHERE id = p_user_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY UPDATES
-- ============================================

-- Enable RLS on role_permissions
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Anyone can read permissions
DROP POLICY IF EXISTS "Anyone can view permissions" ON role_permissions;
CREATE POLICY "Anyone can view permissions" ON role_permissions FOR SELECT USING (true);

-- ============================================
-- VIEW FOR USER WITH ROLE INFO
-- ============================================
CREATE OR REPLACE VIEW users_with_roles AS
SELECT 
    u.*,
    COALESCE(u.role, 'user') as effective_role,
    CASE 
        WHEN u.role = 'admin' THEN 'Administrator'
        WHEN u.role = 'manager' THEN 'Content Manager'
        ELSE 'Member'
    END as role_display_name
FROM users u;

-- ============================================
-- AUDIT LOG FOR ROLE CHANGES
-- ============================================
CREATE TABLE IF NOT EXISTS role_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES users(id),
    old_role TEXT,
    new_role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_audit_user_id ON role_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_created_at ON role_audit_log(created_at DESC);

-- Trigger to log role changes
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        INSERT INTO role_audit_log (user_id, old_role, new_role)
        VALUES (NEW.id, OLD.role, NEW.role);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_role_change ON users;
CREATE TRIGGER trigger_log_role_change
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_role_change();

-- Enable RLS on audit log
ALTER TABLE role_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit log" ON role_audit_log;
CREATE POLICY "Admins can view audit log" ON role_audit_log 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

SELECT 'Role system setup complete!' as status;
