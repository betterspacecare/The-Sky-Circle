-- Fix: Add DELETE policy for events table
-- The events table was missing a DELETE policy, preventing admins from deleting events

-- First, drop any existing delete policy (if any)
DROP POLICY IF EXISTS "Event creators can delete" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;

-- Create a policy that allows:
-- 1. Event creators to delete their own events
-- 2. Admin users to delete any event
CREATE POLICY "Event creators and admins can delete" ON events 
    FOR DELETE USING (
        auth.uid() = created_by 
        OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- Alternative: If you want only admins to delete events, use this instead:
-- CREATE POLICY "Admins can delete events" ON events 
--     FOR DELETE USING (
--         EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
--     );
