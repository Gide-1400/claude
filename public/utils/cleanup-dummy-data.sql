-- Fast Shipment Platform - Database Cleanup Script
-- سكريبت تنظيف قاعدة البيانات - منصة الشحنة السريعة
-- 
-- WARNING: This script will remove all dummy/test data from the database
-- تحذير: هذا السكريبت سيحذف جميع البيانات الوهمية من قاعدة البيانات

-- ============================================
-- Step 1: Backup important data (if any)
-- ============================================

-- Create backup tables for important data
CREATE TABLE IF NOT EXISTS users_backup AS 
SELECT * FROM public.users WHERE is_dummy = false OR is_dummy IS NULL;

CREATE TABLE IF NOT EXISTS trips_backup AS 
SELECT * FROM public.trips WHERE is_dummy = false;

CREATE TABLE IF NOT EXISTS shipments_backup AS 
SELECT * FROM public.shipments WHERE is_dummy = false;

-- ============================================
-- Step 2: Clean dummy data
-- ============================================

-- Delete dummy messages
DELETE FROM public.messages 
WHERE match_id IN (
    SELECT id FROM public.matches 
    WHERE trip_id IN (SELECT id FROM public.trips WHERE is_dummy = true)
    OR shipment_id IN (SELECT id FROM public.shipments WHERE is_dummy = true)
);

-- Delete dummy matches
DELETE FROM public.matches 
WHERE trip_id IN (SELECT id FROM public.trips WHERE is_dummy = true)
OR shipment_id IN (SELECT id FROM public.shipments WHERE is_dummy = true);

-- Delete dummy trips
DELETE FROM public.trips WHERE is_dummy = true;

-- Delete dummy shipments  
DELETE FROM public.shipments WHERE is_dummy = true;

-- Delete dummy users (be careful with this!)
DELETE FROM public.users 
WHERE is_dummy = true 
OR email LIKE '%test%' 
OR email LIKE '%demo%'
OR email LIKE '%example%';

-- Clean up orphaned records
DELETE FROM public.messages WHERE match_id NOT IN (SELECT id FROM public.matches);
DELETE FROM public.matches WHERE trip_id NOT IN (SELECT id FROM public.trips) OR shipment_id NOT IN (SELECT id FROM public.shipments);

-- ============================================
-- Step 3: Reset sequences if needed
-- ============================================

-- Get max IDs and reset sequences
SELECT setval(pg_get_serial_sequence('public.users', 'id'), COALESCE(MAX(id), 1)) FROM public.users;
SELECT setval(pg_get_serial_sequence('public.trips', 'id'), COALESCE(MAX(id), 1)) FROM public.trips;
SELECT setval(pg_get_serial_sequence('public.shipments', 'id'), COALESCE(MAX(id), 1)) FROM public.shipments;

-- ============================================
-- Step 4: Add necessary indexes for performance
-- ============================================

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_from_city ON public.trips(from_city);
CREATE INDEX IF NOT EXISTS idx_trips_to_city ON public.trips(to_city);
CREATE INDEX IF NOT EXISTS idx_trips_trip_date ON public.trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_trips_is_dummy ON public.trips(is_dummy);

CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON public.shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_from_city ON public.shipments(from_city);
CREATE INDEX IF NOT EXISTS idx_shipments_to_city ON public.shipments(to_city);
CREATE INDEX IF NOT EXISTS idx_shipments_needed_date ON public.shipments(needed_date);
CREATE INDEX IF NOT EXISTS idx_shipments_is_dummy ON public.shipments(is_dummy);

CREATE INDEX IF NOT EXISTS idx_matches_trip_id ON public.matches(trip_id);
CREATE INDEX IF NOT EXISTS idx_matches_shipment_id ON public.matches(shipment_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_match_score ON public.matches(match_score);

CREATE INDEX IF NOT EXISTS idx_messages_match_id ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(read);

-- ============================================
-- Step 5: Add RLS policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view all published trips" ON public.trips;
DROP POLICY IF EXISTS "Users can manage their own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can view all pending shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can manage their own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can view their matches" ON public.matches;
DROP POLICY IF EXISTS "Users can manage their matches" ON public.matches;
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid()::text = auth_user_id::text);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = auth_user_id::text)
    WITH CHECK (auth.uid()::text = auth_user_id::text);

-- Trips table policies
CREATE POLICY "Users can view all published trips" ON public.trips
    FOR SELECT
    TO authenticated
    USING (status = 'published' OR user_id::text = auth.uid()::text);

CREATE POLICY "Users can manage their own trips" ON public.trips
    FOR ALL
    TO authenticated
    USING (user_id::text = auth.uid()::text)
    WITH CHECK (user_id::text = auth.uid()::text);

-- Shipments table policies
CREATE POLICY "Users can view all pending shipments" ON public.shipments
    FOR SELECT
    TO authenticated
    USING (status = 'pending' OR user_id::text = auth.uid()::text);

CREATE POLICY "Users can manage their own shipments" ON public.shipments
    FOR ALL
    TO authenticated
    USING (user_id::text = auth.uid()::text)
    WITH CHECK (user_id::text = auth.uid()::text);

-- Matches table policies
CREATE POLICY "Users can view their matches" ON public.matches
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips 
            WHERE trips.id = matches.trip_id 
            AND trips.user_id::text = auth.uid()::text
        )
        OR EXISTS (
            SELECT 1 FROM public.shipments 
            WHERE shipments.id = matches.shipment_id 
            AND shipments.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can manage their matches" ON public.matches
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips 
            WHERE trips.id = matches.trip_id 
            AND trips.user_id::text = auth.uid()::text
        )
        OR EXISTS (
            SELECT 1 FROM public.shipments 
            WHERE shipments.id = matches.shipment_id 
            AND shipments.user_id::text = auth.uid()::text
        )
    );

-- Messages table policies
CREATE POLICY "Users can view their messages" ON public.messages
    FOR SELECT
    TO authenticated
    USING (
        sender_id::text = auth.uid()::text 
        OR receiver_id::text = auth.uid()::text
    );

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (sender_id::text = auth.uid()::text);

CREATE POLICY "Users can update their sent messages" ON public.messages
    FOR UPDATE
    TO authenticated
    USING (sender_id::text = auth.uid()::text);

-- ============================================
-- Step 6: Create functions for common operations
-- ============================================

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics(p_user_id UUID)
RETURNS TABLE(
    total_trips INTEGER,
    active_trips INTEGER,
    completed_trips INTEGER,
    total_shipments INTEGER,
    pending_shipments INTEGER,
    delivered_shipments INTEGER,
    total_matches INTEGER,
    accepted_matches INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM public.trips WHERE user_id = p_user_id AND is_dummy = false) AS total_trips,
        (SELECT COUNT(*)::INTEGER FROM public.trips WHERE user_id = p_user_id AND status = 'published' AND is_dummy = false) AS active_trips,
        (SELECT COUNT(*)::INTEGER FROM public.trips WHERE user_id = p_user_id AND status = 'completed' AND is_dummy = false) AS completed_trips,
        (SELECT COUNT(*)::INTEGER FROM public.shipments WHERE user_id = p_user_id AND is_dummy = false) AS total_shipments,
        (SELECT COUNT(*)::INTEGER FROM public.shipments WHERE user_id = p_user_id AND status = 'pending' AND is_dummy = false) AS pending_shipments,
        (SELECT COUNT(*)::INTEGER FROM public.shipments WHERE user_id = p_user_id AND status = 'delivered' AND is_dummy = false) AS delivered_shipments,
        (SELECT COUNT(*)::INTEGER FROM public.matches m 
         WHERE (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = m.trip_id AND t.user_id = p_user_id)
            OR EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = m.shipment_id AND s.user_id = p_user_id))
        ) AS total_matches,
        (SELECT COUNT(*)::INTEGER FROM public.matches m 
         WHERE m.status = 'accepted'
           AND (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = m.trip_id AND t.user_id = p_user_id)
            OR EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = m.shipment_id AND s.user_id = p_user_id))
        ) AS accepted_matches;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate match score
CREATE OR REPLACE FUNCTION calculate_match_score(
    p_trip_id UUID,
    p_shipment_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 0;
    v_trip RECORD;
    v_shipment RECORD;
    v_date_diff INTEGER;
BEGIN
    -- Get trip and shipment details
    SELECT * INTO v_trip FROM public.trips WHERE id = p_trip_id;
    SELECT * INTO v_shipment FROM public.shipments WHERE id = p_shipment_id;
    
    -- Route matching (40 points max)
    IF v_trip.from_city = v_shipment.from_city AND v_trip.to_city = v_shipment.to_city THEN
        v_score := v_score + 40;
    ELSIF v_trip.from_country = v_shipment.from_country AND v_trip.to_country = v_shipment.to_country THEN
        v_score := v_score + 20;
    END IF;
    
    -- Date matching (30 points max)
    v_date_diff := ABS(EXTRACT(EPOCH FROM (v_trip.trip_date - v_shipment.needed_date)) / 86400);
    IF v_date_diff = 0 THEN
        v_score := v_score + 30;
    ELSIF v_date_diff <= 1 THEN
        v_score := v_score + 25;
    ELSIF v_date_diff <= 3 THEN
        v_score := v_score + 20;
    ELSIF v_date_diff <= 7 THEN
        v_score := v_score + 10;
    END IF;
    
    -- Capacity matching (20 points max)
    IF v_shipment.weight <= v_trip.available_weight THEN
        v_score := v_score + 20;
    ELSIF v_shipment.weight <= v_trip.available_weight * 1.1 THEN
        v_score := v_score + 10;
    END IF;
    
    -- Price matching (10 points max)
    -- Add price comparison logic here if price fields exist
    v_score := v_score + 10;
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Step 7: Create triggers for automatic timestamps
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON public.shipments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Step 8: Verify cleanup
-- ============================================

-- Check remaining data
SELECT 'Users' as table_name, COUNT(*) as count FROM public.users WHERE is_dummy = false OR is_dummy IS NULL
UNION ALL
SELECT 'Trips', COUNT(*) FROM public.trips WHERE is_dummy = false
UNION ALL
SELECT 'Shipments', COUNT(*) FROM public.shipments WHERE is_dummy = false
UNION ALL
SELECT 'Matches', COUNT(*) FROM public.matches
UNION ALL
SELECT 'Messages', COUNT(*) FROM public.messages;

-- ============================================
-- Success message
-- ============================================
-- Database cleanup completed successfully!
-- قاعدة البيانات تم تنظيفها بنجاح!
