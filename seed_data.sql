-- The Sky Circle - Seed Data
-- Sample badges, missions, and initial data

-- ============================================
-- SEED BADGES
-- ============================================

INSERT INTO badges (name, description, icon_url, requirement_type, requirement_value) VALUES
('First Light', 'Log your first observation', '/badges/first-light.svg', 'observation_count', '{"count": 1}'),
('Jupiter Witness', 'Observe Jupiter', '/badges/jupiter.svg', 'specific_object', '{"object": "Jupiter"}'),
('Saturn Ring Seer', 'Observe Saturn and its rings', '/badges/saturn.svg', 'specific_object', '{"object": "Saturn"}'),
('Orion Explorer', 'Observe the Orion Nebula', '/badges/orion.svg', 'specific_object', '{"object": "Orion Nebula"}'),
('Galaxy Hunter', 'Observe 5 different galaxies', '/badges/galaxy-hunter.svg', 'observation_count', '{"count": 5, "category": "Galaxy"}'),
('Meteor Master', 'Log a meteor shower observation', '/badges/meteor.svg', 'specific_object', '{"object": "Meteor Shower"}'),
('Founding Member', 'Join during launch month', '/badges/founding.svg', 'special', '{"description": "Early adopter"}'),
('Planet Tracker', 'Observe all 5 visible planets', '/badges/planet-tracker.svg', 'observation_count', '{"count": 5, "category": "Planet"}'),
('Deep Sky Enthusiast', 'Log 25 deep sky objects', '/badges/deep-sky.svg', 'observation_count', '{"count": 25, "categories": ["Nebula", "Galaxy", "Cluster"]}'),
('Lunar Observer', 'Observe the Moon 10 times', '/badges/moon.svg', 'observation_count', '{"count": 10, "category": "Moon"}'),
('Constellation Master', 'Identify 12 constellations', '/badges/constellation.svg', 'observation_count', '{"count": 12, "category": "Constellation"}'),
('Social Star', 'Refer 5 friends to The Sky Circle', '/badges/referral.svg', 'referral_count', '{"count": 5}'),
('Community Contributor', 'Post 10 astrophotography images', '/badges/contributor.svg', 'observation_count', '{"count": 10}'),
('Winter Nebula Champion', 'Complete Winter Nebula Season mission', '/badges/winter-nebula.svg', 'mission_complete', '{"mission": "Winter Nebula Season"}')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- SEED MISSIONS
-- ============================================

-- Mission 1: Winter Nebula Season
INSERT INTO missions (title, description, start_date, end_date, bonus_points, is_active)
VALUES (
    'Winter Nebula Season',
    'Explore the beautiful nebulae visible during winter months. Log all three targets to earn the Winter Nebula Champion badge and 100 bonus points!',
    '2026-12-01',
    '2027-02-28',
    100,
    TRUE
);

-- Get the mission ID (you'll need to replace this with actual ID after insert)
-- For demo purposes, assuming mission ID is known
-- In practice, use a transaction or stored procedure

-- Mission requirements for Winter Nebula Season
-- Note: Replace 'MISSION_ID_HERE' with actual UUID after mission creation
INSERT INTO mission_requirements (mission_id, object_name, category)
SELECT id, 'Orion Nebula', 'Nebula' FROM missions WHERE title = 'Winter Nebula Season'
UNION ALL
SELECT id, 'Pleiades', 'Cluster' FROM missions WHERE title = 'Winter Nebula Season'
UNION ALL
SELECT id, 'Beehive Cluster', 'Cluster' FROM missions WHERE title = 'Winter Nebula Season';

-- Mission 2: Summer Planetary Parade
INSERT INTO missions (title, description, start_date, end_date, bonus_points, is_active)
VALUES (
    'Summer Planetary Parade',
    'Catch all the visible planets during summer! Observe Jupiter, Saturn, Mars, Venus, and Mercury to complete this challenge.',
    '2027-06-01',
    '2027-08-31',
    150,
    TRUE
);

INSERT INTO mission_requirements (mission_id, object_name, category)
SELECT id, 'Jupiter', 'Planet' FROM missions WHERE title = 'Summer Planetary Parade'
UNION ALL
SELECT id, 'Saturn', 'Planet' FROM missions WHERE title = 'Summer Planetary Parade'
UNION ALL
SELECT id, 'Mars', 'Planet' FROM missions WHERE title = 'Summer Planetary Parade'
UNION ALL
SELECT id, 'Venus', 'Planet' FROM missions WHERE title = 'Summer Planetary Parade'
UNION ALL
SELECT id, 'Mercury', 'Planet' FROM missions WHERE title = 'Summer Planetary Parade';

-- Mission 3: Messier Marathon
INSERT INTO missions (title, description, start_date, end_date, bonus_points, is_active)
VALUES (
    'Messier Marathon',
    'Log 10 Messier objects to join the elite observers club. These deep sky treasures are waiting for you!',
    '2026-03-01',
    '2026-12-31',
    200,
    TRUE
);

INSERT INTO mission_requirements (mission_id, object_name, category)
SELECT id, 'M31 Andromeda Galaxy', 'Galaxy' FROM missions WHERE title = 'Messier Marathon'
UNION ALL
SELECT id, 'M42 Orion Nebula', 'Nebula' FROM missions WHERE title = 'Messier Marathon'
UNION ALL
SELECT id, 'M45 Pleiades', 'Cluster' FROM missions WHERE title = 'Messier Marathon'
UNION ALL
SELECT id, 'M13 Hercules Cluster', 'Cluster' FROM missions WHERE title = 'Messier Marathon'
UNION ALL
SELECT id, 'M51 Whirlpool Galaxy', 'Galaxy' FROM missions WHERE title = 'Messier Marathon'
UNION ALL
SELECT id, 'M57 Ring Nebula', 'Nebula' FROM missions WHERE title = 'Messier Marathon'
UNION ALL
SELECT id, 'M27 Dumbbell Nebula', 'Nebula' FROM missions WHERE title = 'Messier Marathon'
UNION ALL
SELECT id, 'M81 Bode Galaxy', 'Galaxy' FROM missions WHERE title = 'Messier Marathon'
UNION ALL
SELECT id, 'M104 Sombrero Galaxy', 'Galaxy' FROM missions WHERE title = 'Messier Marathon'
UNION ALL
SELECT id, 'M1 Crab Nebula', 'Nebula' FROM missions WHERE title = 'Messier Marathon';

-- ============================================
-- SEED EVENTS
-- ============================================

INSERT INTO events (title, description, location, latitude, longitude, event_date, capacity, is_paid, price)
VALUES
(
    'New Moon Observation Night',
    'Join us for a special new moon observation session at Marine Drive! Perfect conditions for deep sky viewing. Bring your telescope or use ours.',
    'Marine Drive, Raipur, CG',
    21.2497,
    81.6050,
    '2026-03-15 20:00:00+00',
    50,
    FALSE,
    NULL
),
(
    'Perseid Meteor Shower Watch Party',
    'Experience the spectacular Perseid meteor shower with fellow Raipur stargazers at Naya Raipur. Peak viewing expected!',
    'Naya Raipur, CG',
    21.1610,
    81.7865,
    '2026-08-12 22:00:00+00',
    100,
    TRUE,
    100.00
),
(
    'Solar Eclipse Viewing Event',
    'Witness a partial solar eclipse with proper equipment at Gandhi Udyan. Safety glasses provided by Raipur Astronomy Club.',
    'Gandhi Udyan, Raipur, CG',
    21.2384,
    81.6371,
    '2026-04-08 14:00:00+00',
    200,
    FALSE,
    NULL
),
(
    'Astrophotography Workshop',
    'Learn astrophotography at the ancient Sirpur site. Capture the stars against historic monuments. Bring your camera!',
    'Sirpur, Chhattisgarh',
    21.3411,
    82.1755,
    '2026-05-20 19:00:00+00',
    30,
    TRUE,
500.00
);

-- ============================================
-- SEED SKY ALERTS
-- ============================================

INSERT INTO sky_alerts (title, message, alert_type)
VALUES
(
    'Jupiter at Opposition Tonight!',
    'Jupiter will be at its brightest and closest to Earth tonight. Perfect time for observation!',
    'object_visibility'
),
(
    'Geminid Meteor Shower Peak',
    'The Geminid meteor shower peaks tonight with up to 120 meteors per hour. Find a dark sky location!',
    'meteor_shower'
),
(
    'International Space Station Flyover',
    'The ISS will be visible tonight at 8:45 PM for 6 minutes. Look northwest!',
'special_event'
);

-- ============================================
-- SAMPLE CELESTIAL OBJECTS (for autocomplete)
-- ============================================

-- Create a reference table for common celestial objects
CREATE TABLE IF NOT EXISTS celestial_objects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    messier_number TEXT,
    ngc_number TEXT,
    description TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'moderate', 'challenging', 'expert'))
);

INSERT INTO celestial_objects (name, category, messier_number, description, difficulty) VALUES
-- Moon
('Moon', 'Moon', NULL, 'Earth''s natural satellite', 'easy'),

-- Planets
('Mercury', 'Planet', NULL, 'Innermost planet, visible near sunset/sunrise', 'moderate'),
('Venus', 'Planet', NULL, 'Brightest planet, morning/evening star', 'easy'),
('Mars', 'Planet', NULL, 'The Red Planet', 'easy'),
('Jupiter', 'Planet', NULL, 'Largest planet with visible moons', 'easy'),
('Saturn', 'Planet', NULL, 'Ringed planet', 'easy'),
('Uranus', 'Planet', NULL, 'Ice giant, requires telescope', 'challenging'),
('Neptune', 'Planet', NULL, 'Outermost planet, requires telescope', 'challenging'),

-- Nebulae
('Orion Nebula', 'Nebula', 'M42', 'Brightest nebula in the sky', 'easy'),
('Ring Nebula', 'Nebula', 'M57', 'Planetary nebula in Lyra', 'moderate'),
('Dumbbell Nebula', 'Nebula', 'M27', 'Planetary nebula in Vulpecula', 'moderate'),
('Crab Nebula', 'Nebula', 'M1', 'Supernova remnant in Taurus', 'challenging'),
('Lagoon Nebula', 'Nebula', 'M8', 'Emission nebula in Sagittarius', 'moderate'),
('Eagle Nebula', 'Nebula', 'M16', 'Star-forming region with Pillars of Creation', 'challenging'),

-- Galaxies
('Andromeda Galaxy', 'Galaxy', 'M31', 'Nearest major galaxy', 'easy'),
('Whirlpool Galaxy', 'Galaxy', 'M51', 'Face-on spiral galaxy', 'moderate'),
('Sombrero Galaxy', 'Galaxy', 'M104', 'Edge-on spiral galaxy', 'challenging'),
('Triangulum Galaxy', 'Galaxy', 'M33', 'Third largest in Local Group', 'moderate'),
('Bode''s Galaxy', 'Galaxy', 'M81', 'Bright spiral galaxy in Ursa Major', 'moderate'),

-- Clusters
('Pleiades', 'Cluster', 'M45', 'Seven Sisters open cluster', 'easy'),
('Beehive Cluster', 'Cluster', 'M44', 'Open cluster in Cancer', 'easy'),
('Hercules Cluster', 'Cluster', 'M13', 'Brightest globular cluster', 'moderate'),
('Wild Duck Cluster', 'Cluster', 'M11', 'Rich open cluster in Scutum', 'moderate'),
('Double Cluster', 'Cluster', NULL, 'NGC 869 and NGC 884 in Perseus', 'easy'),

-- Constellations
('Orion', 'Constellation', NULL, 'The Hunter', 'easy'),
('Ursa Major', 'Constellation', NULL, 'The Great Bear (Big Dipper)', 'easy'),
('Cassiopeia', 'Constellation', NULL, 'The Queen', 'easy'),
('Scorpius', 'Constellation', NULL, 'The Scorpion', 'easy'),
('Cygnus', 'Constellation', NULL, 'The Swan', 'easy'),
('Leo', 'Constellation', NULL, 'The Lion', 'easy'),
('Taurus', 'Constellation', NULL, 'The Bull', 'easy'),
('Gemini', 'Constellation', NULL, 'The Twins', 'easy'),
('Sagittarius', 'Constellation', NULL, 'The Archer', 'easy'),
('Andromeda', 'Constellation', NULL, 'The Princess', 'easy'),
('Perseus', 'Constellation', NULL, 'The Hero', 'easy'),
('Lyra', 'Constellation', NULL, 'The Lyre', 'easy')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- ADMIN USER SETUP
-- ============================================

-- Note: Admin users should be created via Supabase Auth
-- Then add admin role via custom claims or separate admin table

CREATE TABLE IF NOT EXISTS admin_users (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'moderator')),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant admin policies
DROP POLICY IF EXISTS "Admins can manage all data" ON badges;
CREATE POLICY "Admins can manage all data" ON badges FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can create missions" ON missions;
CREATE POLICY "Admins can create missions" ON missions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can update missions" ON missions;
CREATE POLICY "Admins can update missions" ON missions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can create events" ON events;
CREATE POLICY "Admins can create events" ON events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can create alerts" ON sky_alerts;
CREATE POLICY "Admins can create alerts" ON sky_alerts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can moderate posts" ON posts;
CREATE POLICY "Admins can moderate posts" ON posts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- ============================================
-- HELPFUL QUERIES FOR DEVELOPMENT
-- ============================================

-- Get user's current level and progress
-- SELECT 
--     u.display_name,
--     u.level,
--     u.total_points,
--     CASE 
--         WHEN u.total_points < 101 THEN 'Naked Eye Explorer'
--         WHEN u.total_points < 301 THEN 'Planet Tracker'
--         WHEN u.total_points < 801 THEN 'Deep Sky Hunter'
--         WHEN u.total_points < 1501 THEN 'Nebula Navigator'
--         ELSE 'Cosmic Voyager'
--     END AS level_name
-- FROM users u
-- WHERE u.id = 'USER_ID_HERE';

-- Get leaderboard
-- SELECT * FROM leaderboard LIMIT 10;

-- Get user's mission progress
-- SELECT 
--     m.title,
--     m.description,
--     ump.completed_requirements,
--     ump.is_completed,
--     COUNT(mr.id) AS total_requirements
-- FROM missions m
-- LEFT JOIN user_mission_progress ump ON m.id = ump.mission_id AND ump.user_id = 'USER_ID_HERE'
-- LEFT JOIN mission_requirements mr ON m.id = mr.mission_id
-- WHERE m.is_active = TRUE
-- GROUP BY m.id, m.title, m.description, ump.completed_requirements, ump.is_completed;
