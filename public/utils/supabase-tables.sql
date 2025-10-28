-- ============================================
-- FastShip Platform - Complete Database Schema
-- ============================================
-- Run this SQL in Supabase SQL Editor to create all tables

-- ============================================
-- 1. Users Table (Extended)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('carrier', 'shipper')),
    carrier_type TEXT CHECK (carrier_type IN ('individual', 'car_owner', 'truck_owner', 'fleet_owner')),
    shipper_type TEXT CHECK (shipper_type IN ('individual', 'small_business', 'medium_business', 'large_business', 'enterprise')),
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verification_documents JSONB DEFAULT '[]'::jsonb,
    profile_image TEXT,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_dummy BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Trips Table (Carriers)
-- ============================================
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    from_city TEXT NOT NULL,
    from_lat DECIMAL(10, 8),
    from_lng DECIMAL(11, 8),
    to_city TEXT NOT NULL,
    to_lat DECIMAL(10, 8),
    to_lng DECIMAL(11, 8),
    trip_date DATE NOT NULL,
    available_weight INTEGER NOT NULL CHECK (available_weight > 0),
    carrier_type TEXT NOT NULL,
    vehicle_type TEXT,
    price_per_kg DECIMAL(10,2),
    notes TEXT,
    route_waypoints JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'in_progress', 'completed', 'cancelled')),
    is_dummy BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Shipments Table (Shippers)
-- ============================================
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    from_city TEXT NOT NULL,
    from_lat DECIMAL(10, 8),
    from_lng DECIMAL(11, 8),
    to_city TEXT NOT NULL,
    to_lat DECIMAL(10, 8),
    to_lng DECIMAL(11, 8),
    needed_date DATE NOT NULL,
    weight INTEGER NOT NULL CHECK (weight > 0),
    shipper_type TEXT NOT NULL,
    item_description TEXT,
    special_requirements TEXT,
    max_price_per_kg DECIMAL(10,2),
    is_fragile BOOLEAN DEFAULT false,
    requires_insurance BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'in_transit', 'delivered', 'cancelled')),
    is_dummy BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. Matches Table
-- ============================================
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE NOT NULL,
    match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
    status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'viewed', 'accepted', 'rejected', 'in_progress', 'completed')),
    carrier_notes TEXT,
    shipper_notes TEXT,
    agreed_price DECIMAL(10,2),
    pickup_date TIMESTAMPTZ,
    delivery_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trip_id, shipment_id)
);

-- ============================================
-- 5. Messages Table
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'location')),
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. Reviews & Ratings Table
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    reviewed_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_type TEXT CHECK (review_type IN ('carrier_review', 'shipper_review')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, reviewer_id, reviewed_id)
);

-- ============================================
-- 7. Notifications Table
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('match', 'message', 'review', 'system')),
    related_id UUID,
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. Pending Users Table (for email verification)
-- ============================================
CREATE TABLE IF NOT EXISTS pending_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    name TEXT NOT NULL,
    user_type TEXT NOT NULL,
    carrier_type TEXT,
    shipper_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. Support Tickets Table
-- ============================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT CHECK (category IN ('technical', 'billing', 'account', 'general')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. Payment Transactions Table
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
    payer_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
    receiver_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'SAR',
    payment_method TEXT,
    transaction_type TEXT CHECK (transaction_type IN ('payment', 'refund', 'commission')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    payment_gateway_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;

-- Trips indexes
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status_date ON trips(status, trip_date) WHERE is_dummy = false;
CREATE INDEX IF NOT EXISTS idx_trips_cities ON trips(from_city, to_city);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(trip_date);

-- Shipments indexes
CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status_date ON shipments(status, needed_date) WHERE is_dummy = false;
CREATE INDEX IF NOT EXISTS idx_shipments_cities ON shipments(from_city, to_city);
CREATE INDEX IF NOT EXISTS idx_shipments_date ON shipments(needed_date);

-- Matches indexes
CREATE INDEX IF NOT EXISTS idx_matches_trip_id ON matches(trip_id);
CREATE INDEX IF NOT EXISTS idx_matches_shipment_id ON matches(shipment_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_score ON matches(match_score DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_match_id ON reviews(match_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Anyone can view verified users basic info" ON users
    FOR SELECT USING (verification_status = 'verified');

-- Trips policies
CREATE POLICY "Anyone can view published trips" ON trips
    FOR SELECT USING (status = 'published' AND is_dummy = false);

CREATE POLICY "Users can manage their own trips" ON trips
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Shipments policies
CREATE POLICY "Anyone can view pending shipments" ON shipments
    FOR SELECT USING (status = 'pending' AND is_dummy = false);

CREATE POLICY "Users can manage their own shipments" ON shipments
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Matches policies
CREATE POLICY "Users can view their matches" ON matches
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM users WHERE id = (SELECT user_id FROM trips WHERE id = trip_id))
        OR auth.uid() = (SELECT auth_user_id FROM users WHERE id = (SELECT user_id FROM shipments WHERE id = shipment_id))
    );

CREATE POLICY "Users can manage their matches" ON matches
    FOR ALL USING (
        auth.uid() = (SELECT auth_user_id FROM users WHERE id = (SELECT user_id FROM trips WHERE id = trip_id))
        OR auth.uid() = (SELECT auth_user_id FROM users WHERE id = (SELECT user_id FROM shipments WHERE id = shipment_id))
    );

-- Messages policies
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM users WHERE id = sender_id)
        OR auth.uid() = (SELECT auth_user_id FROM users WHERE id = receiver_id)
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM users WHERE id = sender_id)
    );

CREATE POLICY "Users can update their sent messages" ON messages
    FOR UPDATE USING (
        auth.uid() = (SELECT auth_user_id FROM users WHERE id = sender_id)
    );

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their matches" ON reviews
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM users WHERE id = reviewer_id)
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Support tickets policies
CREATE POLICY "Users can view their own tickets" ON support_tickets
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can create support tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Transactions policies
CREATE POLICY "Users can view their transactions" ON transactions
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM users WHERE id = payer_id)
        OR auth.uid() = (SELECT auth_user_id FROM users WHERE id = receiver_id)
    );

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user rating after new review
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET 
        rating = (
            SELECT AVG(rating)::DECIMAL(3,2)
            FROM reviews
            WHERE reviewed_id = NEW.reviewed_id
        ),
        total_ratings = (
            SELECT COUNT(*)
            FROM reviews
            WHERE reviewed_id = NEW.reviewed_id
        )
    WHERE id = NEW.reviewed_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_after_review
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- ============================================
-- USEFUL FUNCTIONS
-- ============================================

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_trips', (SELECT COUNT(*) FROM trips WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid)),
        'active_trips', (SELECT COUNT(*) FROM trips WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid) AND status IN ('published', 'in_progress')),
        'completed_trips', (SELECT COUNT(*) FROM trips WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid) AND status = 'completed'),
        'total_shipments', (SELECT COUNT(*) FROM shipments WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid)),
        'pending_shipments', (SELECT COUNT(*) FROM shipments WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid) AND status = 'pending'),
        'delivered_shipments', (SELECT COUNT(*) FROM shipments WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid) AND status = 'delivered'),
        'total_matches', (SELECT COUNT(*) FROM matches WHERE 
            trip_id IN (SELECT id FROM trips WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid))
            OR shipment_id IN (SELECT id FROM shipments WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid))
        ),
        'accepted_matches', (SELECT COUNT(*) FROM matches WHERE 
            (trip_id IN (SELECT id FROM trips WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid))
            OR shipment_id IN (SELECT id FROM shipments WHERE user_id = (SELECT id FROM users WHERE auth_user_id = user_uuid)))
            AND status = 'accepted'
        ),
        'unread_messages', (SELECT COUNT(*) FROM messages WHERE 
            receiver_id = (SELECT id FROM users WHERE auth_user_id = user_uuid) 
            AND is_read = false
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INITIAL DATA / SEED (Optional)
-- ============================================

-- Insert some sample Saudi Arabian cities for autocomplete
CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    country TEXT DEFAULT 'Saudi Arabia',
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8)
);

INSERT INTO cities (name_ar, name_en, lat, lng) VALUES
('الرياض', 'Riyadh', 24.7136, 46.6753),
('جدة', 'Jeddah', 21.4858, 39.1925),
('مكة المكرمة', 'Makkah', 21.3891, 39.8579),
('المدينة المنورة', 'Madinah', 24.5247, 39.5692),
('الدمام', 'Dammam', 26.4367, 50.1039),
('الطائف', 'Taif', 21.2703, 40.4158),
('تبوك', 'Tabuk', 28.3838, 36.5550),
('القصيم', 'Qassim', 26.3260, 43.9750),
('أبها', 'Abha', 18.2164, 42.5053),
('الخبر', 'Khobar', 26.2172, 50.1971),
('الأحساء', 'Al-Ahsa', 25.3600, 49.5860),
('حائل', 'Hail', 27.5219, 41.6902),
('جازان', 'Jazan', 16.8892, 42.5511),
('نجران', 'Najran', 17.5644, 44.2290),
('ينبع', 'Yanbu', 24.0894, 38.0618)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Database schema created successfully!' as status;
