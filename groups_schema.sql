-- SkyGuild Groups & User Events Schema
-- Run this in Supabase SQL Editor

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT true,
    is_approved BOOLEAN DEFAULT false,
    member_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Group events (events created by group members)
CREATE TABLE IF NOT EXISTS group_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    event_date TIMESTAMPTZ NOT NULL,
    capacity INTEGER,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group event attendees
CREATE TABLE IF NOT EXISTS group_event_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES group_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rsvp_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Guild Leader Applications table
CREATE TABLE IF NOT EXISTS guild_leader_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_event_creator BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS guild_leader_application_status VARCHAR(20) DEFAULT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_is_approved ON groups(is_approved);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_events_group_id ON group_events(group_id);
CREATE INDEX IF NOT EXISTS idx_group_events_event_date ON group_events(event_date);
CREATE INDEX IF NOT EXISTS idx_group_event_attendees_event_id ON group_event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_guild_leader_applications_user_id ON guild_leader_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_guild_leader_applications_status ON guild_leader_applications(status);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_leader_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view approved public groups" ON groups;
DROP POLICY IF EXISTS "Members can view their groups" ON groups;
DROP POLICY IF EXISTS "Approved creators can create groups" ON groups;
DROP POLICY IF EXISTS "Group owners can update their groups" ON groups;
DROP POLICY IF EXISTS "Group owners can delete their groups" ON groups;

DROP POLICY IF EXISTS "Anyone can view group members of public groups" ON group_members;
DROP POLICY IF EXISTS "Members can view their group's members" ON group_members;
DROP POLICY IF EXISTS "Users can join public approved groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON group_members;

DROP POLICY IF EXISTS "Anyone can view approved group events" ON group_events;
DROP POLICY IF EXISTS "Group members can view their group events" ON group_events;
DROP POLICY IF EXISTS "Group admins can create events" ON group_events;
DROP POLICY IF EXISTS "Event creators can update their events" ON group_events;
DROP POLICY IF EXISTS "Event creators can delete their events" ON group_events;

DROP POLICY IF EXISTS "Anyone can view attendees of approved events" ON group_event_attendees;
DROP POLICY IF EXISTS "Users can RSVP to approved events" ON group_event_attendees;
DROP POLICY IF EXISTS "Users can cancel their RSVP" ON group_event_attendees;

DROP POLICY IF EXISTS "Users can view their own applications" ON guild_leader_applications;
DROP POLICY IF EXISTS "Users can create applications" ON guild_leader_applications;

-- RLS Policies for groups
CREATE POLICY "Anyone can view approved public groups" ON groups
    FOR SELECT USING (is_approved = true AND is_public = true);

CREATE POLICY "Members can view their groups" ON groups
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid())
    );

CREATE POLICY "Approved creators can create groups" ON groups
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_event_creator = true)
    );

CREATE POLICY "Group owners can update their groups" ON groups
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'owner')
    );

CREATE POLICY "Group owners can delete their groups" ON groups
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'owner')
    );

-- RLS Policies for group_members
CREATE POLICY "Anyone can view group members of public groups" ON group_members
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM groups WHERE id = group_members.group_id AND is_approved = true AND is_public = true)
    );

CREATE POLICY "Members can view their group's members" ON group_members
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid())
    );

CREATE POLICY "Users can join public approved groups" ON group_members
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (SELECT 1 FROM groups WHERE id = group_id AND is_approved = true AND is_public = true)
    );

CREATE POLICY "Users can leave groups" ON group_members
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Group admins can manage members" ON group_members
    FOR ALL USING (
        EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role IN ('owner', 'admin'))
    );

-- RLS Policies for group_events
CREATE POLICY "Anyone can view approved group events" ON group_events
    FOR SELECT USING (
        is_approved = true AND
        EXISTS (SELECT 1 FROM groups WHERE id = group_events.group_id AND is_approved = true)
    );

CREATE POLICY "Group members can view their group events" ON group_events
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM group_members WHERE group_id = group_events.group_id AND user_id = auth.uid())
    );

CREATE POLICY "Group admins can create events" ON group_events
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM group_members WHERE group_id = group_events.group_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator'))
    );

CREATE POLICY "Event creators can update their events" ON group_events
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Event creators can delete their events" ON group_events
    FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for group_event_attendees
CREATE POLICY "Anyone can view attendees of approved events" ON group_event_attendees
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM group_events WHERE id = group_event_attendees.event_id AND is_approved = true)
    );

CREATE POLICY "Users can RSVP to approved events" ON group_event_attendees
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (SELECT 1 FROM group_events WHERE id = event_id AND is_approved = true)
    );

CREATE POLICY "Users can cancel their RSVP" ON group_event_attendees
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for guild_leader_applications
CREATE POLICY "Users can view their own applications" ON guild_leader_applications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create applications" ON guild_leader_applications
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Function to update member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for member count
DROP TRIGGER IF EXISTS trigger_update_group_member_count ON group_members;
CREATE TRIGGER trigger_update_group_member_count
AFTER INSERT OR DELETE ON group_members
FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Function to auto-add creator as owner
CREATE OR REPLACE FUNCTION add_group_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO group_members (group_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add creator as owner
DROP TRIGGER IF EXISTS trigger_add_group_creator ON groups;
CREATE TRIGGER trigger_add_group_creator
AFTER INSERT ON groups
FOR EACH ROW EXECUTE FUNCTION add_group_creator_as_owner();
