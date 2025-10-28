-- ============================================
-- FastShip Platform - Cleanup Dummy Data
-- ============================================
-- This script removes all dummy/test data from the database
-- Run this before launching to production

-- Delete dummy messages
DELETE FROM messages WHERE match_id IN (
    SELECT id FROM matches WHERE trip_id IN (
        SELECT id FROM trips WHERE is_dummy = true
    ) OR shipment_id IN (
        SELECT id FROM shipments WHERE is_dummy = true
    )
);

-- Delete matches with dummy data
DELETE FROM matches WHERE 
    trip_id IN (SELECT id FROM trips WHERE is_dummy = true)
    OR shipment_id IN (SELECT id FROM shipments WHERE is_dummy = true);

-- Delete dummy trips
DELETE FROM trips WHERE is_dummy = true;

-- Delete dummy shipments
DELETE FROM shipments WHERE is_dummy = true;

-- Delete dummy/test users (optional - be careful!)
-- Uncomment the following line only if you want to delete test users
-- DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%dummy%';

-- Reset sequences if needed
-- ALTER SEQUENCE trips_id_seq RESTART WITH 1;
-- ALTER SEQUENCE shipments_id_seq RESTART WITH 1;

-- Verify cleanup
SELECT 'Remaining trips' as table_name, COUNT(*) as count FROM trips
UNION ALL
SELECT 'Remaining shipments', COUNT(*) FROM shipments
UNION ALL
SELECT 'Remaining matches', COUNT(*) FROM matches
UNION ALL
SELECT 'Remaining messages', COUNT(*) FROM messages
UNION ALL
SELECT 'Remaining users', COUNT(*) FROM users;

-- ============================================
-- Additional Indexes for Performance
-- ============================================

-- Index on trips for faster matching
CREATE INDEX IF NOT EXISTS idx_trips_status_date ON trips(status, trip_date) WHERE is_dummy = false;
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id) WHERE is_dummy = false;
CREATE INDEX IF NOT EXISTS idx_trips_cities ON trips(from_city, to_city);

-- Index on shipments for faster matching
CREATE INDEX IF NOT EXISTS idx_shipments_status_date ON shipments(status, needed_date) WHERE is_dummy = false;
CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON shipments(user_id) WHERE is_dummy = false;
CREATE INDEX IF NOT EXISTS idx_shipments_cities ON shipments(from_city, to_city);

-- Index on matches
CREATE INDEX IF NOT EXISTS idx_matches_trip_id ON matches(trip_id);
CREATE INDEX IF NOT EXISTS idx_matches_shipment_id ON matches(shipment_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- Index on messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = false;

-- Index on users
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Trips policies
DROP POLICY IF EXISTS "Anyone can view published trips" ON trips;
CREATE POLICY "Anyone can view published trips" ON trips
    FOR SELECT USING (status = 'published' AND is_dummy = false);

DROP POLICY IF EXISTS "Users can manage their own trips" ON trips;
CREATE POLICY "Users can manage their own trips" ON trips
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Shipments policies
DROP POLICY IF EXISTS "Anyone can view pending shipments" ON shipments;
CREATE POLICY "Anyone can view pending shipments" ON shipments
    FOR SELECT USING (status = 'pending' AND is_dummy = false);

DROP POLICY IF EXISTS "Users can manage their own shipments" ON shipments;
CREATE POLICY "Users can manage their own shipments" ON shipments
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Matches policies
DROP POLICY IF EXISTS "Users can view their matches" ON matches;
CREATE POLICY "Users can view their matches" ON matches
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM users WHERE id = (SELECT user_id FROM trips WHERE id = trip_id))
        OR auth.uid() = (SELECT auth_user_id FROM users WHERE id = (SELECT user_id FROM shipments WHERE id = shipment_id))
    );

DROP POLICY IF EXISTS "Users can manage their matches" ON matches;
CREATE POLICY "Users can manage their matches" ON matches
    FOR ALL USING (
        auth.uid() = (SELECT auth_user_id FROM users WHERE id = (SELECT user_id FROM trips WHERE id = trip_id))
        OR auth.uid() = (SELECT auth_user_id FROM users WHERE id = (SELECT user_id FROM shipments WHERE id = shipment_id))
    );

-- Messages policies
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM users WHERE id = sender_id)
        OR auth.uid() = (SELECT auth_user_id FROM users WHERE id = receiver_id)
    );

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM users WHERE id = sender_id)
    );

DROP POLICY IF EXISTS "Users can delete their messages" ON messages;
CREATE POLICY "Users can delete their messages" ON messages
    FOR DELETE USING (
        auth.uid() = (SELECT auth_user_id FROM users WHERE id = sender_id)
    );

-- ============================================
-- Useful Functions
-- ============================================

-- Function to calculate distance between two points (simplified)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 FLOAT, lon1 FLOAT,
    lat2 FLOAT, lon2 FLOAT
) RETURNS FLOAT AS $$
DECLARE
    earth_radius FLOAT := 6371; -- km
    dlat FLOAT;
    dlon FLOAT;
    a FLOAT;
    c FLOAT;
BEGIN
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    
    a := sin(dlat/2) * sin(dlat/2) + 
         cos(radians(lat1)) * cos(radians(lat2)) * 
         sin(dlon/2) * sin(dlon/2);
    
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
    total_trips BIGINT,
    active_trips BIGINT,
    completed_trips BIGINT,
    total_shipments BIGINT,
    pending_shipments BIGINT,
    completed_shipments BIGINT,
    total_matches BIGINT,
    accepted_matches BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM trips WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid)),
        (SELECT COUNT(*) FROM trips WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid) AND status = 'published'),
        (SELECT COUNT(*) FROM trips WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid) AND status = 'completed'),
        (SELECT COUNT(*) FROM shipments WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid)),
        (SELECT COUNT(*) FROM shipments WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid) AND status = 'pending'),
        (SELECT COUNT(*) FROM shipments WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid) AND status = 'completed'),
        (SELECT COUNT(*) FROM matches WHERE 
            trip_id IN (SELECT id FROM trips WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid))
            OR shipment_id IN (SELECT id FROM shipments WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid))
        ),
        (SELECT COUNT(*) FROM matches WHERE 
            (trip_id IN (SELECT id FROM trips WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid))
            OR shipment_id IN (SELECT id FROM shipments WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid)))
            AND status = 'accepted'
        );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers for Auto-Timestamping
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for tables with updated_at column
DO $$
BEGIN
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='trips' AND column_name='updated_at') THEN
        ALTER TABLE trips ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='shipments' AND column_name='updated_at') THEN
        ALTER TABLE shipments ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Create triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipments_updated_at ON shipments;
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verification & Statistics
-- ============================================

SELECT '=== Database Cleanup & Setup Complete ===' as status;
SELECT 'Total Users: ' || COUNT(*) FROM users;
SELECT 'Total Trips: ' || COUNT(*) FROM trips;
SELECT 'Total Shipments: ' || COUNT(*) FROM shipments;
SELECT 'Total Matches: ' || COUNT(*) FROM matches;
SELECT 'Total Messages: ' || COUNT(*) FROM messages;
