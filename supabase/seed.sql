-- Seed data: 10 drifting locations in Dallas-Fort Worth area
-- Run this in Supabase SQL Editor after signing in

DO $$
DECLARE
  seed_user_id UUID := 'aa5d2027-9a3b-4122-81fe-17cffcdffc76';
BEGIN

INSERT INTO locations (name, description, latitude, longitude, city, state, access_fee, permission_level, tags, submitter_id) VALUES
('Grapevine Mills Mall Lot', 'Massive empty lot on the south side of the mall. Best after 10pm when stores close. Smooth asphalt, good lighting.', 32.9585, -97.0423, 'Grapevine', 'TX', 0, 'none', ARRAY['night', 'large-lot', 'beginner'], seed_user_id),
('Alliance Airport Back Road', 'Service road behind Alliance Airport. Very little traffic after hours. Rough pavement but wide open.', 32.9732, -97.3185, 'Fort Worth', 'TX', 0, 'none', ARRAY['night', 'abandoned', 'intermediate'], seed_user_id),
('Plano Legacy Business Park', 'Corporate parking lots empty on weekends. Multiple connected lots. Security occasionally patrols.', 33.0742, -96.8127, 'Plano', 'TX', 0, 'low', ARRAY['weekend', 'large-lot', 'clean'], seed_user_id),
('Garland Industrial District', 'Multiple abandoned warehouses with large parking areas. Popular local spot, can get crowded.', 32.9126, -96.6389, 'Garland', 'TX', 0, 'none', ARRAY['night', 'industrial', 'community'], seed_user_id),
('Texas Motor Speedway Overflow Lot', 'Huge gravel lot used for event parking. Empty outside of race weekends. Check schedule before going.', 33.0384, -97.2821, 'Fort Worth', 'TX', 0, 'none', ARRAY['weekend', 'large-lot', 'gravel'], seed_user_id),
('Arlington Entertainment District Garage', 'Multi-level parking garage near AT&T Stadium. Roof level has great city views. $5 parking fee applies.', 32.7473, -97.0945, 'Arlington', 'TX', 5.00, 'low', ARRAY['night', 'parking-garage', 'clean'], seed_user_id),
('Dallas Design District Backlots', 'Collection of loading docks and lots behind design showrooms. Good on Sundays when businesses are closed.', 32.7918, -96.8227, 'Dallas', 'TX', 0, 'none', ARRAY['night', 'sunday', 'industrial'], seed_user_id),
('McKinney Corporate Center', 'Multiple connected corporate lots. Well paved with good lighting. Security is chill if you stay quiet.', 33.1976, -96.6398, 'McKinney', 'TX', 0, 'low', ARRAY['night', 'clean', 'beginner'], seed_user_id),
('Cedar Hill State Park Road', 'Winding access road with a couple wide turnarounds. Watch for wildlife. Daytime only — park closes at dusk.', 32.6081, -96.9561, 'Cedar Hill', 'TX', 0, 'none', ARRAY['day', 'scenic', 'beginner'], seed_user_id),
('Irving Railyard Overflow', 'Abandoned industrial lot near the rail yard. Go late. Occasional train noise but no one around.', 32.8137, -96.9549, 'Irving', 'TX', 0, 'none', ARRAY['night', 'abandoned', 'industrial'], seed_user_id);

END;
$$;
