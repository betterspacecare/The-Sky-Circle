-- SkyGuild - Sample Guilds Seed Data
-- Run this in Supabase SQL Editor AFTER running groups_schema.sql

-- Insert sample guilds directly (using first user as creator)
INSERT INTO groups (name, description, is_public, is_approved, created_by, member_count)
SELECT 
    'Mumbai Stargazers',
    'A community of astronomy enthusiasts in Mumbai. We organize regular stargazing sessions at Sanjay Gandhi National Park and other dark sky locations around the city.',
    true,
    true,
    (SELECT id FROM users LIMIT 1),
    1
WHERE EXISTS (SELECT 1 FROM users LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM groups WHERE name = 'Mumbai Stargazers');

INSERT INTO groups (name, description, is_public, is_approved, created_by, member_count)
SELECT 
    'Delhi Night Sky Club',
    'Explore the cosmos with fellow stargazers in Delhi NCR. Monthly meetups, telescope sharing, and astrophotography workshops.',
    true,
    true,
    (SELECT id FROM users LIMIT 1),
    1
WHERE EXISTS (SELECT 1 FROM users LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM groups WHERE name = 'Delhi Night Sky Club');

INSERT INTO groups (name, description, is_public, is_approved, created_by, member_count)
SELECT 
    'Bangalore Astronomy Society',
    'Join us for deep sky observations, planetary viewing sessions, and astronomy education programs in Bangalore.',
    true,
    false,
    (SELECT id FROM users LIMIT 1),
    1
WHERE EXISTS (SELECT 1 FROM users LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM groups WHERE name = 'Bangalore Astronomy Society');

INSERT INTO groups (name, description, is_public, is_approved, created_by, member_count)
SELECT 
    'Chennai Celestial Observers',
    'A private group for serious amateur astronomers in Chennai. Equipment sharing and advanced observation techniques.',
    false,
    false,
    (SELECT id FROM users LIMIT 1),
    1
WHERE EXISTS (SELECT 1 FROM users LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM groups WHERE name = 'Chennai Celestial Observers');

-- Verify the data was inserted
SELECT id, name, is_public, is_approved, member_count FROM groups;
