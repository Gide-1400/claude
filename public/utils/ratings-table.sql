-- جدول التقييمات (Ratings Table)
-- يتيح للناقلين وأصحاب الشحنات تقييم بعضهم البعض بعد إكمال عملية التوصيل

-- إنشاء الجدول
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- معلومات التقييم الأساسية
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    
    -- أطراف التقييم
    rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- المُقيّم
    rated_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- المُقيّم
    
    -- معلومات التقييم
    rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5), -- من 1 إلى 5 نجوم
    review TEXT, -- التعليق (اختياري)
    
    -- معايير التقييم التفصيلية
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5), -- التواصل
    reliability_rating INTEGER CHECK (reliability_rating >= 1 AND reliability_rating <= 5), -- الموثوقية
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5), -- الاحترافية
    
    -- معلومات إضافية
    delivery_status VARCHAR(50), -- حالة التسليم: delivered, late, damaged, etc.
    would_recommend BOOLEAN DEFAULT true, -- هل يوصي بالتعامل مع الطرف الآخر
    
    -- العلامات (Tags)
    tags TEXT[], -- مثل: ['punctual', 'friendly', 'professional', 'careful']
    
    -- صور اختيارية (للتوثيق)
    photos TEXT[], -- روابط الصور
    
    -- معلومات النظام
    is_verified BOOLEAN DEFAULT false, -- تقييم موثق (تم التحقق منه)
    is_public BOOLEAN DEFAULT true, -- التقييم عام أم خاص
    is_flagged BOOLEAN DEFAULT false, -- تم الإبلاغ عن التقييم
    flag_reason TEXT, -- سبب الإبلاغ
    
    -- التواريخ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- التحقق من عدم تقييم نفس المطابقة مرتين من نفس المستخدم
    UNIQUE(match_id, rater_id)
);

-- الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_ratings_match_id ON ratings(match_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_id ON ratings(rated_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON ratings(rating);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_is_public ON ratings(is_public);

-- فهرس مركب للحصول على تقييمات مستخدم معين
CREATE INDEX IF NOT EXISTS idx_ratings_rated_public ON ratings(rated_id, is_public, created_at DESC);

-- دالة لحساب متوسط التقييمات لمستخدم
CREATE OR REPLACE FUNCTION get_user_average_rating(user_id UUID)
RETURNS TABLE (
    average_rating DECIMAL(2,1),
    total_ratings INTEGER,
    rating_breakdown JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(rating)::numeric, 1)::DECIMAL(2,1) as average_rating,
        COUNT(*)::INTEGER as total_ratings,
        jsonb_build_object(
            '5_stars', COUNT(*) FILTER (WHERE rating >= 4.5),
            '4_stars', COUNT(*) FILTER (WHERE rating >= 3.5 AND rating < 4.5),
            '3_stars', COUNT(*) FILTER (WHERE rating >= 2.5 AND rating < 3.5),
            '2_stars', COUNT(*) FILTER (WHERE rating >= 1.5 AND rating < 2.5),
            '1_star', COUNT(*) FILTER (WHERE rating < 1.5)
        ) as rating_breakdown
    FROM ratings
    WHERE rated_id = user_id AND is_public = true;
END;
$$ LANGUAGE plpgsql;

-- دالة لحساب متوسط التقييمات التفصيلية
CREATE OR REPLACE FUNCTION get_user_detailed_ratings(user_id UUID)
RETURNS TABLE (
    avg_communication DECIMAL(2,1),
    avg_reliability DECIMAL(2,1),
    avg_professionalism DECIMAL(2,1),
    recommendation_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(communication_rating)::numeric, 1)::DECIMAL(2,1),
        ROUND(AVG(reliability_rating)::numeric, 1)::DECIMAL(2,1),
        ROUND(AVG(professionalism_rating)::numeric, 1)::DECIMAL(2,1),
        ROUND((COUNT(*) FILTER (WHERE would_recommend = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100), 2)
    FROM ratings
    WHERE rated_id = user_id AND is_public = true;
END;
$$ LANGUAGE plpgsql;

-- دالة للحصول على التقييمات الأخيرة لمستخدم
CREATE OR REPLACE FUNCTION get_user_recent_ratings(
    user_id UUID,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    rating DECIMAL(2,1),
    review TEXT,
    rater_name TEXT,
    rater_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.rating,
        r.review,
        u.full_name as rater_name,
        u.user_type as rater_type,
        r.created_at,
        r.tags
    FROM ratings r
    INNER JOIN users u ON r.rater_id = u.id
    WHERE r.rated_id = user_id 
        AND r.is_public = true
        AND r.is_flagged = false
    ORDER BY r.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- دالة للتحقق مما إذا كان يمكن للمستخدم تقييم مطابقة معينة
CREATE OR REPLACE FUNCTION can_rate_match(
    p_match_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    match_status VARCHAR(50);
    existing_rating_count INTEGER;
BEGIN
    -- التحقق من حالة المطابقة (يجب أن تكون مكتملة)
    SELECT status INTO match_status
    FROM matches
    WHERE id = p_match_id;
    
    IF match_status IS NULL OR match_status != 'completed' THEN
        RETURN false;
    END IF;
    
    -- التحقق من عدم وجود تقييم سابق
    SELECT COUNT(*) INTO existing_rating_count
    FROM ratings
    WHERE match_id = p_match_id AND rater_id = p_user_id;
    
    IF existing_rating_count > 0 THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- دالة لتحديث متوسط التقييم في جدول المستخدمين
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث متوسط التقييم في جدول المستخدمين
    UPDATE users
    SET average_rating = (
        SELECT ROUND(AVG(rating)::numeric, 1)
        FROM ratings
        WHERE rated_id = NEW.rated_id AND is_public = true
    ),
    total_ratings = (
        SELECT COUNT(*)
        FROM ratings
        WHERE rated_id = NEW.rated_id AND is_public = true
    )
    WHERE id = NEW.rated_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تشغيل التحديث التلقائي عند إضافة أو تحديث تقييم
CREATE TRIGGER trigger_update_user_rating
AFTER INSERT OR UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_rating();

-- Row Level Security (RLS)
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: يمكن للجميع قراءة التقييمات العامة
CREATE POLICY "Anyone can view public ratings"
    ON ratings FOR SELECT
    USING (is_public = true AND is_flagged = false);

-- سياسة القراءة: يمكن للمستخدم رؤية تقييماته الخاصة
CREATE POLICY "Users can view their own ratings"
    ON ratings FOR SELECT
    USING (auth.uid() = rater_id OR auth.uid() = rated_id);

-- سياسة الإضافة: يمكن للمستخدمين إضافة تقييمات فقط للمطابقات المكتملة
CREATE POLICY "Users can add ratings for completed matches"
    ON ratings FOR INSERT
    WITH CHECK (
        auth.uid() = rater_id 
        AND can_rate_match(match_id, auth.uid())
    );

-- سياسة التحديث: يمكن للمستخدم تحديث تقييماته فقط خلال 24 ساعة
CREATE POLICY "Users can update their ratings within 24 hours"
    ON ratings FOR UPDATE
    USING (
        auth.uid() = rater_id 
        AND created_at > NOW() - INTERVAL '24 hours'
    );

-- سياسة الحذف: لا يمكن حذف التقييمات (فقط الإداريون)
CREATE POLICY "Only admins can delete ratings"
    ON ratings FOR DELETE
    USING (false); -- سيتم تفعيلها لاحقاً مع نظام الإدارة

-- إضافة أعمدة التقييم لجدول المستخدمين إذا لم تكن موجودة
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- تعليقات على الجدول
COMMENT ON TABLE ratings IS 'جدول تقييمات المستخدمين بعد إكمال التوصيل';
COMMENT ON COLUMN ratings.rating IS 'التقييم الإجمالي من 1 إلى 5 نجوم';
COMMENT ON COLUMN ratings.communication_rating IS 'تقييم التواصل من 1 إلى 5';
COMMENT ON COLUMN ratings.reliability_rating IS 'تقييم الموثوقية من 1 إلى 5';
COMMENT ON COLUMN ratings.professionalism_rating IS 'تقييم الاحترافية من 1 إلى 5';
COMMENT ON COLUMN ratings.would_recommend IS 'هل يوصي بالتعامل مع هذا المستخدم';
COMMENT ON COLUMN ratings.is_verified IS 'تقييم موثق تم التحقق منه';
