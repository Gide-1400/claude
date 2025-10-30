-- ============================================
-- FastShip Global - Database Schema
-- ============================================
-- منصة عالمية لربط موصلي الشحنات مع أصحاب الشحنات
-- 
-- المالك: قايد المصعبي
-- الإيميل: gide1979@gmail.com
-- الجوال: +966551519723
-- 
-- آخر تحديث: 30 أكتوبر 2025
-- ============================================

-- تفعيل UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. جدول المستخدمين الأساسي
-- ============================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('carrier', 'shipper')),
    language VARCHAR(10) DEFAULT 'ar' CHECK (language IN ('ar', 'en')),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'verified', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Index للبحث السريع
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_user_type ON public.users(user_type);

-- ============================================
-- 2. جدول الناقلين (Carriers)
-- ============================================
CREATE TABLE public.carriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    carrier_type VARCHAR(20) NOT NULL CHECK (carrier_type IN ('individual', 'car_owner', 'truck_owner', 'fleet_owner')),
    
    -- معلومات المركبة (للسيارات والشاحنات)
    vehicle_type VARCHAR(50), -- سيارة صغيرة، بيك اب، دينة، تريلا، الخ
    vehicle_plate VARCHAR(50),
    vehicle_registration TEXT, -- رابط لصورة الاستمارة
    vehicle_insurance TEXT, -- رابط لصورة التأمين
    
    -- معلومات السعة
    max_weight_kg DECIMAL(10, 2), -- الوزن الأقصى بالكيلوجرام
    max_volume_m3 DECIMAL(10, 2), -- الحجم الأقصى بالمتر المكعب
    
    -- معلومات الشركة (للأساطيل)
    company_name VARCHAR(255),
    company_registration TEXT, -- رابط للسجل التجاري
    company_license TEXT, -- رابط لرخصة النقل
    
    -- معلومات إضافية
    description TEXT,
    specializations TEXT[], -- أنواع الشحنات المتخصصة (مبردة، خطرة، الخ)
    
    -- الإحصائيات
    total_trips INTEGER DEFAULT 0,
    completed_trips INTEGER DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_carriers_user_id ON public.carriers(user_id);
CREATE INDEX idx_carriers_type ON public.carriers(carrier_type);

-- ============================================
-- 3. جدول الشاحنين (Shippers)
-- ============================================
CREATE TABLE public.shippers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    shipper_type VARCHAR(20) NOT NULL CHECK (shipper_type IN ('individual', 'small_business', 'medium_business', 'large_business')),
    
    -- معلومات العمل
    business_name VARCHAR(255),
    business_registration TEXT, -- رابط للسجل التجاري
    business_license TEXT,
    
    -- حدود الشحن اليومية
    daily_shipment_limit INTEGER DEFAULT 1,
    
    -- معلومات إضافية
    description TEXT,
    business_type VARCHAR(100), -- نوع النشاط التجاري
    
    -- الإحصائيات
    total_shipments INTEGER DEFAULT 0,
    completed_shipments INTEGER DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shippers_user_id ON public.shippers(user_id);
CREATE INDEX idx_shippers_type ON public.shippers(shipper_type);

-- ============================================
-- 4. جدول الرحلات (Trips)
-- ============================================
CREATE TABLE public.trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID REFERENCES public.carriers(id) ON DELETE CASCADE,
    
    -- معلومات المسار
    origin_country VARCHAR(100) NOT NULL,
    origin_city VARCHAR(100) NOT NULL,
    origin_address TEXT,
    origin_lat DECIMAL(10, 8),
    origin_lng DECIMAL(11, 8),
    
    destination_country VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    destination_address TEXT,
    destination_lat DECIMAL(10, 8),
    destination_lng DECIMAL(11, 8),
    
    -- نقاط المرور (JSON array)
    waypoints JSONB, -- [{country, city, lat, lng, order}, ...]
    
    -- معلومات الرحلة
    departure_date DATE NOT NULL,
    departure_time TIME,
    arrival_date DATE,
    arrival_time TIME,
    
    -- السعة المتاحة
    available_weight_kg DECIMAL(10, 2) NOT NULL,
    available_volume_m3 DECIMAL(10, 2),
    
    -- التكلفة
    price_per_kg DECIMAL(10, 2),
    total_price DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    is_price_negotiable BOOLEAN DEFAULT TRUE,
    
    -- الحالة
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'matched', 'in_progress', 'completed', 'cancelled')),
    
    -- معلومات إضافية
    description TEXT,
    special_requirements TEXT,
    accepted_cargo_types TEXT[], -- أنواع البضائع المقبولة
    
    -- ملاحظات
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trips_carrier_id ON public.trips(carrier_id);
CREATE INDEX idx_trips_origin_city ON public.trips(origin_city);
CREATE INDEX idx_trips_destination_city ON public.trips(destination_city);
CREATE INDEX idx_trips_departure_date ON public.trips(departure_date);
CREATE INDEX idx_trips_status ON public.trips(status);

-- ============================================
-- 5. جدول الشحنات (Shipments)
-- ============================================
CREATE TABLE public.shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipper_id UUID REFERENCES public.shippers(id) ON DELETE CASCADE,
    
    -- معلومات الاستلام
    pickup_country VARCHAR(100) NOT NULL,
    pickup_city VARCHAR(100) NOT NULL,
    pickup_address TEXT NOT NULL,
    pickup_lat DECIMAL(10, 8),
    pickup_lng DECIMAL(11, 8),
    pickup_date DATE,
    pickup_time TIME,
    
    -- معلومات التوصيل
    delivery_country VARCHAR(100) NOT NULL,
    delivery_city VARCHAR(100) NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_lat DECIMAL(10, 8),
    delivery_lng DECIMAL(11, 8),
    delivery_date DATE,
    delivery_time TIME,
    
    -- معلومات الشحنة
    cargo_type VARCHAR(100) NOT NULL, -- نوع البضاعة
    weight_kg DECIMAL(10, 2) NOT NULL,
    volume_m3 DECIMAL(10, 2),
    quantity INTEGER DEFAULT 1,
    
    -- التكلفة
    max_budget DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- الحالة
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'in_transit', 'delivered', 'cancelled')),
    
    -- معلومات إضافية
    description TEXT NOT NULL,
    special_instructions TEXT,
    is_fragile BOOLEAN DEFAULT FALSE,
    requires_cooling BOOLEAN DEFAULT FALSE,
    is_hazardous BOOLEAN DEFAULT FALSE,
    
    -- صور الشحنة
    images TEXT[], -- مصفوفة روابط الصور
    
    -- ملاحظات
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shipments_shipper_id ON public.shipments(shipper_id);
CREATE INDEX idx_shipments_pickup_city ON public.shipments(pickup_city);
CREATE INDEX idx_shipments_delivery_city ON public.shipments(delivery_city);
CREATE INDEX idx_shipments_status ON public.shipments(status);

-- ============================================
-- 6. جدول المطابقات (Matches)
-- ============================================
CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
    
    -- نسبة التطابق
    match_score DECIMAL(5, 2), -- من 0 إلى 100
    
    -- تفاصيل التطابق
    route_compatibility DECIMAL(5, 2), -- نسبة توافق المسار
    timing_compatibility DECIMAL(5, 2), -- نسبة توافق التوقيت
    capacity_compatibility DECIMAL(5, 2), -- نسبة توافق السعة
    
    -- الحالة
    status VARCHAR(20) DEFAULT 'suggested' CHECK (status IN ('suggested', 'carrier_accepted', 'shipper_accepted', 'both_accepted', 'in_progress', 'completed', 'cancelled')),
    
    -- معلومات الاتفاق
    agreed_price DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- التواريخ
    carrier_response_date TIMESTAMP WITH TIME ZONE,
    shipper_response_date TIMESTAMP WITH TIME ZONE,
    agreement_date TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    
    -- ملاحظات
    carrier_notes TEXT,
    shipper_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(trip_id, shipment_id)
);

CREATE INDEX idx_matches_trip_id ON public.matches(trip_id);
CREATE INDEX idx_matches_shipment_id ON public.matches(shipment_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_matches_score ON public.matches(match_score DESC);

-- ============================================
-- 7. جدول المحادثات (Messages)
-- ============================================
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- المحتوى
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location')),
    content TEXT NOT NULL,
    
    -- المرفقات
    attachment_url TEXT,
    attachment_type VARCHAR(50),
    
    -- الحالة
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_match_id ON public.messages(match_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- ============================================
-- 8. جدول التوثيق (Verifications)
-- ============================================
CREATE TABLE public.verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- نوع التوثيق
    verification_type VARCHAR(50) NOT NULL CHECK (verification_type IN ('identity', 'vehicle_registration', 'insurance', 'business_license', 'driver_license')),
    
    -- معلومات المستند
    document_type VARCHAR(100), -- هوية وطنية، جواز سفر، الخ
    document_number VARCHAR(100),
    document_url TEXT, -- رابط صورة المستند
    
    -- الحالة
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    
    -- ملاحظات المراجع
    reviewer_notes TEXT,
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- صلاحية المستند
    expiry_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_verifications_user_id ON public.verifications(user_id);
CREATE INDEX idx_verifications_status ON public.verifications(status);

-- ============================================
-- 9. جدول التقييمات (Reviews)
-- ============================================
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reviewed_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- التقييم
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    
    -- التفاصيل
    review_title VARCHAR(255),
    review_text TEXT,
    
    -- تقييمات فرعية
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    
    -- الحالة
    is_visible BOOLEAN DEFAULT TRUE,
    
    -- رد على التقييم
    response_text TEXT,
    response_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(match_id, reviewer_id)
);

CREATE INDEX idx_reviews_reviewed_id ON public.reviews(reviewed_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);

-- ============================================
-- 10. جدول الإشعارات (Notifications)
-- ============================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- المحتوى
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- new_match, message, review, etc.
    
    -- الرابط
    link_url TEXT,
    link_entity_type VARCHAR(50), -- trip, shipment, match, message
    link_entity_id UUID,
    
    -- الحالة
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- سياسات Users: كل مستخدم يرى معلوماته فقط
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- سياسات Carriers: المستخدمون يمكنهم رؤية معلومات الناقلين العامة
CREATE POLICY "Anyone can view carriers" ON public.carriers
    FOR SELECT USING (TRUE);

CREATE POLICY "Carriers can update own profile" ON public.carriers
    FOR UPDATE USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

-- سياسات Shippers: مشابهة للـ Carriers
CREATE POLICY "Anyone can view shippers" ON public.shippers
    FOR SELECT USING (TRUE);

CREATE POLICY "Shippers can update own profile" ON public.shippers
    FOR UPDATE USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

-- سياسات Trips: الجميع يمكنهم رؤية الرحلات النشطة
CREATE POLICY "Anyone can view active trips" ON public.trips
    FOR SELECT USING (status = 'active' OR 
        auth.uid() = (SELECT u.auth_user_id FROM public.users u 
                      JOIN public.carriers c ON u.id = c.user_id 
                      WHERE c.id = carrier_id));

CREATE POLICY "Carriers can manage own trips" ON public.trips
    FOR ALL USING (
        auth.uid() = (SELECT u.auth_user_id FROM public.users u 
                      JOIN public.carriers c ON u.id = c.user_id 
                      WHERE c.id = carrier_id)
    );

-- سياسات Shipments: مشابهة للـ Trips
CREATE POLICY "Anyone can view pending shipments" ON public.shipments
    FOR SELECT USING (status = 'pending' OR 
        auth.uid() = (SELECT u.auth_user_id FROM public.users u 
                      JOIN public.shippers s ON u.id = s.user_id 
                      WHERE s.id = shipper_id));

CREATE POLICY "Shippers can manage own shipments" ON public.shipments
    FOR ALL USING (
        auth.uid() = (SELECT u.auth_user_id FROM public.users u 
                      JOIN public.shippers s ON u.id = s.user_id 
                      WHERE s.id = shipper_id)
    );

-- سياسات Messages: فقط الطرفين في المحادثة
CREATE POLICY "Users can view own messages" ON public.messages
    FOR SELECT USING (
        auth.uid() IN (
            SELECT auth_user_id FROM public.users WHERE id IN (sender_id, receiver_id)
        )
    );

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = sender_id)
    );

-- سياسات Notifications: كل مستخدم يرى إشعاراته فقط
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

-- ============================================
-- Functions & Triggers
-- ============================================

-- Function لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق Trigger على الجداول
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carriers_updated_at BEFORE UPDATE ON public.carriers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shippers_updated_at BEFORE UPDATE ON public.shippers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON public.shipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Views للاستعلامات المعقدة
-- ============================================

-- View لعرض الرحلات مع معلومات الناقل
CREATE OR REPLACE VIEW trips_with_carrier AS
SELECT 
    t.*,
    u.full_name as carrier_name,
    u.avatar_url as carrier_avatar,
    c.carrier_type,
    c.rating as carrier_rating,
    c.total_reviews as carrier_reviews
FROM public.trips t
JOIN public.carriers c ON t.carrier_id = c.id
JOIN public.users u ON c.user_id = u.id;

-- View لعرض الشحنات مع معلومات الشاحن
CREATE OR REPLACE VIEW shipments_with_shipper AS
SELECT 
    s.*,
    u.full_name as shipper_name,
    u.avatar_url as shipper_avatar,
    sh.shipper_type,
    sh.rating as shipper_rating,
    sh.total_reviews as shipper_reviews
FROM public.shipments s
JOIN public.shippers sh ON s.shipper_id = sh.id
JOIN public.users u ON sh.user_id = u.id;

-- ============================================
-- بيانات تجريبية (اختياري - للاختبار فقط)
-- ============================================

-- يمكن إضافة بيانات تجريبية هنا للاختبار
-- لكن في الإنتاج يجب حذفها

-- ============================================
-- النهاية
-- ============================================

-- تنبيه: هذا الـ Schema كامل وجاهز للاستخدام
-- يجب تنفيذه في Supabase SQL Editor
-- بعد التنفيذ، تأكد من:
-- 1. جميع الجداول تم إنشاؤها
-- 2. RLS مفعّل على كل الجداول
-- 3. الـ Policies تعمل بشكل صحيح
