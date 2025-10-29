-- ============================================
-- FastShip Platform - Database Cleanup Script
-- ============================================
-- Run this AFTER creating the fixed schema

-- Clean up any existing dummy data
DELETE FROM messages WHERE created_at < NOW() - INTERVAL '1 hour' AND match_id IS NULL;
DELETE FROM matches WHERE created_at < NOW() - INTERVAL '1 hour';
DELETE FROM trips WHERE is_dummy = true;
DELETE FROM shipments WHERE is_dummy = true;
DELETE FROM users WHERE is_dummy = true;

-- Reset sequences if needed
-- ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;

-- Update any invalid user verification status
UPDATE users 
SET verification_status = 'verified' 
WHERE verification_status IS NULL OR verification_status = '';

-- Ensure all users have proper user_type
UPDATE users 
SET user_type = 'shipper' 
WHERE user_type IS NULL OR user_type = '';

-- Clean up orphaned records
DELETE FROM trips WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM shipments WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM matches WHERE trip_id NOT IN (SELECT id FROM trips) OR shipment_id NOT IN (SELECT id FROM shipments);
DELETE FROM messages WHERE sender_id NOT IN (SELECT id FROM users) OR receiver_id NOT IN (SELECT id FROM users);
DELETE FROM notifications WHERE user_id NOT IN (SELECT id FROM users);

-- Refresh statistics
ANALYZE users;
ANALYZE trips;
ANALYZE shipments;
ANALYZE matches;
ANALYZE messages;
ANALYZE notifications;

SELECT 'Database cleanup completed successfully!' as status;