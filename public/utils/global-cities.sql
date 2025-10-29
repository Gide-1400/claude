-- Fast Ship Platform - Global Cities Database
-- This script creates and populates the cities table with major cities worldwide

-- Create cities table if not exists
CREATE TABLE IF NOT EXISTS cities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    country_code TEXT NOT NULL,
    country_ar TEXT NOT NULL,
    country_en TEXT NOT NULL,
    region TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    population INTEGER,
    is_capital BOOLEAN DEFAULT FALSE,
    is_major_city BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cities_name_ar ON cities(name_ar);
CREATE INDEX IF NOT EXISTS idx_cities_name_en ON cities(name_en);
CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(country_code);
CREATE INDEX IF NOT EXISTS idx_cities_search ON cities USING gin(to_tsvector('arabic', name_ar));

-- Insert Saudi Arabia cities
INSERT INTO cities (name_ar, name_en, country_code, country_ar, country_en, is_capital, population) VALUES
('الرياض', 'Riyadh', 'SA', 'المملكة العربية السعودية', 'Saudi Arabia', TRUE, 7000000),
('جدة', 'Jeddah', 'SA', 'المملكة العربية السعودية', 'Saudi Arabia', FALSE, 4000000),
('مكة المكرمة', 'Mecca', 'SA', 'المملكة العربية السعودية', 'Saudi Arabia', FALSE, 2000000),
('المدينة المنورة', 'Medina', 'SA', 'المملكة العربية السعودية', 'Saudi Arabia', FALSE, 1500000),
('الدمام', 'Dammam', 'SA', 'المملكة العربية السعودية', 'Saudi Arabia', FALSE, 1200000),
('الخبر', 'Khobar', 'SA', 'المملكة العربية السعودية', 'Saudi Arabia', FALSE, 500000),
('الطائف', 'Taif', 'SA', 'المملكة العربية السعودية', 'Saudi Arabia', FALSE, 600000),
('أبها', 'Abha', 'SA', 'المملكة العربية السعودية', 'Saudi Arabia', FALSE, 350000),
('تبوك', 'Tabuk', 'SA', 'المملكة العربية السعودية', 'Saudi Arabia', FALSE, 550000),
('بريدة', 'Buraidah', 'SA', 'المملكة العربية السعودية', 'Saudi Arabia', FALSE, 600000);

-- Insert UAE cities
INSERT INTO cities (name_ar, name_en, country_code, country_ar, country_en, is_capital, population) VALUES
('أبوظبي', 'Abu Dhabi', 'AE', 'الإمارات العربية المتحدة', 'United Arab Emirates', TRUE, 1500000),
('دبي', 'Dubai', 'AE', 'الإمارات العربية المتحدة', 'United Arab Emirates', FALSE, 3400000),
('الشارقة', 'Sharjah', 'AE', 'الإمارات العربية المتحدة', 'United Arab Emirates', FALSE, 1600000),
('العين', 'Al Ain', 'AE', 'الإمارات العربية المتحدة', 'United Arab Emirates', FALSE, 750000),
('عجمان', 'Ajman', 'AE', 'الإمارات العربية المتحدة', 'United Arab Emirates', FALSE, 500000),
('رأس الخيمة', 'Ras Al Khaimah', 'AE', 'الإمارات العربية المتحدة', 'United Arab Emirates', FALSE, 400000);

-- Insert Kuwait cities
INSERT INTO cities (name_ar, name_en, country_code, country_ar, country_en, is_capital, population) VALUES
('مدينة الكويت', 'Kuwait City', 'KW', 'الكويت', 'Kuwait', TRUE, 3000000),
('الجهراء', 'Al Jahra', 'KW', 'الكويت', 'Kuwait', FALSE, 400000),
('الفروانية', 'Al Farwaniyah', 'KW', 'الكويت', 'Kuwait', FALSE, 800000);

-- Insert Qatar cities
INSERT INTO cities (name_ar, name_en, country_code, country_ar, country_en, is_capital, population) VALUES
('الدوحة', 'Doha', 'QA', 'قطر', 'Qatar', TRUE, 2300000),
('الوكرة', 'Al Wakrah', 'QA', 'قطر', 'Qatar', FALSE, 300000),
('الخور', 'Al Khor', 'QA', 'قطر', 'Qatar', FALSE, 200000);

-- Insert Bahrain cities
INSERT INTO cities (name_ar, name_en, country_code, country_ar, country_en, is_capital, population) VALUES
('المنامة', 'Manama', 'BH', 'البحرين', 'Bahrain', TRUE, 600000),
('المحرق', 'Muharraq', 'BH', 'البحرين', 'Bahrain', FALSE, 200000);

-- Insert Oman cities
INSERT INTO cities (name_ar, name_en, country_code, country_ar, country_en, is_capital, population) VALUES
('مسقط', 'Muscat', 'OM', 'عمان', 'Oman', TRUE, 1500000),
('صلالة', 'Salalah', 'OM', 'عمان', 'Oman', FALSE, 200000),
('صحار', 'Sohar', 'OM', 'عمان', 'Oman', FALSE, 140000);

-- Insert Egypt cities
INSERT INTO cities (name_ar, name_en, country_code, country_ar, country_en, is_capital, population) VALUES
('القاهرة', 'Cairo', 'EG', 'مصر', 'Egypt', TRUE, 20000000),
('الإسكندرية', 'Alexandria', 'EG', 'مصر', 'Egypt', FALSE, 5000000),
('الجيزة', 'Giza', 'EG', 'مصر', 'Egypt', FALSE, 8000000),
('شرم الشيخ', 'Sharm El Sheikh', 'EG', 'مصر', 'Egypt', FALSE, 73000);

-- Insert Jordan cities
INSERT INTO cities (name_ar, name_en, country_code, country_ar, country_en, is_capital, population) VALUES
('عمان', 'Amman', 'JO', 'الأردن', 'Jordan', TRUE, 4000000),
('إربد', 'Irbid', 'JO', 'الأردن', 'Jordan', FALSE, 500000),
('العقبة', 'Aqaba', 'JO', 'الأردن', 'Jordan', FALSE, 150000);

-- Insert Lebanon cities
INSERT INTO cities (name_ar, name_en, country_code, country_ar, country_en, is_capital, population) VALUES
('بيروت', 'Beirut', 'LB', 'لبنان', 'Lebanon', TRUE, 2400000),
('طرابلس', 'Tripoli', 'LB', 'لبنان', 'Lebanon', FALSE, 230000);

-- Insert Iraq cities
INSERT INTO cities (name_ar, name_en, country_code, country_ar, country_en, is_capital, population) VALUES
('بغداد', 'Baghdad', 'IQ', 'العراق', 'Iraq', TRUE, 8000000),
('البصرة', 'Basra', 'IQ', 'العراق', 'Iraq', FALSE, 2500000),
('أربيل', 'Erbil', 'IQ', 'العراق', 'Iraq', FALSE, 1500000);

-- Insert Major European Cities
INSERT INTO cities (name_ar, name_en, country_code, country_ar, country_en, is_capital, population) VALUES
('لندن', 'London', 'GB', 'المملكة المتحدة', 'United Kingdom', TRUE, 9000000),
('باريس', 'Paris', 'FR', 'فرنسا', 'France', TRUE, 2200000),
('برلين', 'Berlin', 'DE', 'ألمانيا', 'Germany', TRUE, 3700000),
('روما', 'Rome', 'IT', 'إيطاليا', 'Italy', TRUE, 2800000),
('مدريد', 'Madrid', 'ES', 'إسبانيا', 'Spain', TRUE, 3200000),
('أمستردام', 'Amsterdam', 'NL', 'هولندا', 'Netherlands', TRUE, 850000),
('برشلونة', 'Barcelona', 'ES', 'إسبانيا', 'Spain', FALSE, 1600000),
('ميلانو', 'Milan', 'IT', 'إيطاليا', 'Italy', FALSE, 1400000);

-- Insert Major Asian Cities
INSERT INTO cities (name_ar, name_en, country_code, country_ar, country_en, is_capital, population) VALUES
('طوكيو', 'Tokyo', 'JP', 'اليابان', 'Japan', TRUE, 14000000),
('بكين', 'Beijing', 'CN', 'الصين', 'China', TRUE, 21000000),
('شانغهاي', 'Shanghai', 'CN', 'الصين', 'China', FALSE, 27000000),
('سيول', 'Seoul', 'KR', 'كوريا الجنوبية', 'South Korea', TRUE, 10000000),
('بانكوك', 'Bangkok', 'TH', 'تايلاند', 'Thailand', TRUE, 10000000),
('سنغافورة', 'Singapore', 'SG', 'سنغافورة', 'Singapore', TRUE, 5700000),
('كوالالمبور', 'Kuala Lumpur', 'MY', 'ماليزيا', 'Malaysia', TRUE, 1800000),
('دلهي', 'Delhi', 'IN', 'الهند', 'India', TRUE, 30000000),
('مومباي', 'Mumbai', 'IN', 'الهند', 'India', FALSE, 20000000);

-- Insert Major American Cities
INSERT INTO cities (name_ar, name_en, country_code, country_ar, country_en, is_capital, population) VALUES
('نيويورك', 'New York', 'US', 'الولايات المتحدة', 'United States', FALSE, 8400000),
('لوس أنجلوس', 'Los Angeles', 'US', 'الولايات المتحدة', 'United States', FALSE, 4000000),
('شيكاغو', 'Chicago', 'US', 'الولايات المتحدة', 'United States', FALSE, 2700000),
('هيوستن', 'Houston', 'US', 'الولايات المتحدة', 'United States', FALSE, 2300000),
('واشنطن', 'Washington DC', 'US', 'الولايات المتحدة', 'United States', TRUE, 700000),
('تورونتو', 'Toronto', 'CA', 'كندا', 'Canada', FALSE, 2900000),
('مونتريال', 'Montreal', 'CA', 'كندا', 'Canada', FALSE, 1800000);

-- Insert Major African Cities
INSERT INTO cities (name_ar, name_en, country_code, country_ar, country_en, is_capital, population) VALUES
('كيب تاون', 'Cape Town', 'ZA', 'جنوب أفريقيا', 'South Africa', FALSE, 4600000),
('جوهانسبرغ', 'Johannesburg', 'ZA', 'جنوب أفريقيا', 'South Africa', FALSE, 5700000),
('لاغوس', 'Lagos', 'NG', 'نيجيريا', 'Nigeria', FALSE, 14000000),
('نيروبي', 'Nairobi', 'KE', 'كينيا', 'Kenya', TRUE, 4500000);

-- Insert Major Australian Cities
INSERT INTO cities (name_ar, name_en, country_code, country_ar, country_en, is_capital, population) VALUES
('سيدني', 'Sydney', 'AU', 'أستراليا', 'Australia', FALSE, 5300000),
('ملبورن', 'Melbourne', 'AU', 'أستراليا', 'Australia', FALSE, 5000000),
('كانبرا', 'Canberra', 'AU', 'أستراليا', 'Australia', TRUE, 400000);

-- Create function to search cities
CREATE OR REPLACE FUNCTION search_cities(search_term TEXT)
RETURNS TABLE (
    id UUID,
    name_ar TEXT,
    name_en TEXT,
    country_ar TEXT,
    country_en TEXT,
    country_code TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name_ar,
        c.name_en,
        c.country_ar,
        c.country_en,
        c.country_code
    FROM cities c
    WHERE 
        c.name_ar ILIKE '%' || search_term || '%'
        OR c.name_en ILIKE '%' || search_term || '%'
        OR c.country_ar ILIKE '%' || search_term || '%'
        OR c.country_en ILIKE '%' || search_term || '%'
    ORDER BY 
        c.is_capital DESC,
        c.population DESC NULLS LAST,
        c.name_ar
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT ON cities TO authenticated;
-- GRANT EXECUTE ON FUNCTION search_cities TO authenticated;

COMMENT ON TABLE cities IS 'Global cities database for Fast Ship platform';
COMMENT ON FUNCTION search_cities IS 'Search cities by name in Arabic or English';
