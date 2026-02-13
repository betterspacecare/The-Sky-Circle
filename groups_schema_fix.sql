-- SkyGuild Groups Schema FIX
-- Run this to fix the RLS policy issues

-- First, disable RLS temporarily to allow operations
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_event_attendees DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Anyone can view approved public groups" ON groups;
DROP POLICY IF EXISTS "Members can view their groups" ON groups;
DROP POLICY IF EXISTS "Approved creators can create groups" ON groups;
DROP POLICY IF EXISTS "Group owners can update their groups" ON groups;
DROP POLICY IF EXISTS "Group owners can delete their groups" ON groups;
DROP POLICY IF EXISTS "groups_select_policy" ON groups;
DROP POLICY IF EXISTS "groups_insert_policy" ON groups;
DROP POLICY IF EXISTS "groups_update_policy" ON groups;
DROP POLICY IF EXISTS "groups_delete_policy" ON groups;

DROP POLICY IF EXISTS "Anyone can view group members of public groups" ON group_members;
DROP POLICY IF EXISTS "Members can view their group's members" ON group_members;
DROP POLICY IF EXISTS "Users can join public approved groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON group_members;
DROP POLICY IF EXISTS "group_members_select_policy" ON group_members;
DROP POLICY IF EXISTS "group_members_insert_policy" ON group_members;
DROP POLICY IF EXISTS "group_members_delete_policy" ON group_members;

DROP POLICY IF EXISTS "Anyone can view approved group events" ON group_events;
DROP POLICY IF EXISTS "Group members can view their group events" ON group_events;
DROP POLICY IF EXISTS "Group admins can create events" ON group_events;
DROP POLICY IF EXISTS "Event creators can update their events" ON group_events;
DROP POLICY IF EXISTS "Event creators can delete their events" ON group_events;
DROP POLICY IF EXISTS "group_events_select_policy" ON group_events;
DROP POLICY IF EXISTS "group_events_insert_policy" ON group_events;

DROP POLICY IF EXISTS "Anyone can view attendees of approved events" ON group_event_attendees;
DROP POLICY IF EXISTS "Users can RSVP to approved events" ON group_event_attendees;
DROP POLICY IF EXISTS "Users can cancel their RSVP" ON group_event_attendees;
DROP POLICY IF EXISTS "group_event_attendees_select_policy" ON group_event_attendees;
DROP POLICY IF EXISTS "group_event_attendees_insert_policy" ON group_event_attendees;
DROP POLICY IF EXISTS "group_event_attendees_delete_policy" ON group_event_attendees;

-- Re-enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_event_attendees ENABLE ROW LEVEL SECURITY;

-- SIMPLE RLS Policies for groups (no recursion)
CREATE POLICY "groups_select_policy" ON groups
    FOR SELECT USING (
        is_approved = true AND is_public = true
        OR created_by = auth.uid()
    );

CREATE POLICY "groups_insert_policy" ON groups
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "groups_update_policy" ON groups
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "groups_delete_policy" ON groups
    FOR DELETE USING (created_by = auth.uid());

-- SIMPLE RLS Policies for group_members
CREATE POLICY "group_members_select_policy" ON group_members
    FOR SELECT USING (true);  -- Anyone can see members

CREATE POLICY "group_members_insert_policy" ON group_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "group_members_delete_policy" ON group_members
    FOR DELETE USING (user_id = auth.uid());

-- SIMPLE RLS Policies for group_events
CREATE POLICY "group_events_select_policy" ON group_events
    FOR SELECT USING (is_approved = true OR created_by = auth.uid());

CREATE POLICY "group_events_insert_policy" ON group_events
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- SIMPLE RLS Policies for group_event_attendees
CREATE POLICY "group_event_attendees_select_policy" ON group_event_attendees
    FOR SELECT USING (true);

CREATE POLICY "group_event_attendees_insert_policy" ON group_event_attendees
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "group_event_attendees_delete_policy" ON group_event_attendees
    FOR DELETE USING (user_id = auth.uid());

-- Verify tables exist and show data
SELECT 'Groups:' as info, count(*) as count FROM groups;
SELECT 'Group Members:' as info, count(*) as count FROM group_members;
