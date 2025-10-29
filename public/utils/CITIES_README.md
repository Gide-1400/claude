# إضافة قاعدة بيانات المدن العالمية - Global Cities Database

## نظرة عامة
هذا الملف يحتوي على أكثر من 80 مدينة عالمية رئيسية من جميع أنحاء العالم مع أسمائها باللغتين العربية والإنجليزية.

## كيفية التثبيت

### الطريقة 1: عبر Supabase Dashboard
1. افتح مشروعك في Supabase Dashboard
2. اذهب إلى **SQL Editor**
3. انسخ محتوى ملف `global-cities.sql`
4. الصق المحتوى في SQL Editor
5. اضغط على **Run** لتنفيذ الأمر

### الطريقة 2: عبر Supabase CLI
```bash
supabase db push utils/global-cities.sql
```

## الجدول المُنشأ

### جدول `cities`
يحتوي على الحقول التالية:
- `id` (UUID) - المعرف الفريد
- `name_ar` (TEXT) - اسم المدينة بالعربية
- `name_en` (TEXT) - اسم المدينة بالإنجليزية
- `country_code` (TEXT) - رمز الدولة (ISO)
- `country_ar` (TEXT) - اسم الدولة بالعربية
- `country_en` (TEXT) - اسم الدولة بالإنجليزية
- `region` (TEXT) - المنطقة (اختياري)
- `latitude` (DECIMAL) - خط العرض
- `longitude` (DECIMAL) - خط الطول
- `population` (INTEGER) - عدد السكان
- `is_capital` (BOOLEAN) - هل هي عاصمة؟
- `is_major_city` (BOOLEAN) - هل هي مدينة رئيسية؟
- `created_at` - تاريخ الإنشاء
- `updated_at` - تاريخ آخر تحديث

## الدول المشمولة

### دول الخليج العربي
- 🇸🇦 السعودية (10 مدن)
- 🇦🇪 الإمارات (6 مدن)
- 🇰🇼 الكويت (3 مدن)
- 🇶🇦 قطر (3 مدن)
- 🇧🇭 البحرين (2 مدينة)
- 🇴🇲 عمان (3 مدن)

### دول عربية أخرى
- 🇪🇬 مصر (4 مدن)
- 🇯🇴 الأردن (3 مدن)
- 🇱🇧 لبنان (2 مدينة)
- 🇮🇶 العراق (3 مدن)

### أوروبا
- 🇬🇧 المملكة المتحدة
- 🇫🇷 فرنسا
- 🇩🇪 ألمانيا
- 🇮🇹 إيطاليا
- 🇪🇸 إسبانيا
- 🇳🇱 هولندا

### آسيا
- 🇯🇵 اليابان
- 🇨🇳 الصين
- 🇰🇷 كوريا الجنوبية
- 🇹🇭 تايلاند
- 🇸🇬 سنغافورة
- 🇲🇾 ماليزيا
- 🇮🇳 الهند

### أمريكا
- 🇺🇸 الولايات المتحدة (5 مدن)
- 🇨🇦 كندا (2 مدينة)

### أفريقيا
- 🇿🇦 جنوب أفريقيا
- 🇳🇬 نيجيريا
- 🇰🇪 كينيا

### أوقيانوسيا
- 🇦🇺 أستراليا (3 مدن)

## الوظائف المتاحة

### دالة `search_cities(search_term TEXT)`
تبحث عن المدن باللغة العربية أو الإنجليزية.

**مثال على الاستخدام:**
```sql
SELECT * FROM search_cities('الرياض');
SELECT * FROM search_cities('Dubai');
SELECT * FROM search_cities('لندن');
```

**الاستخدام في JavaScript:**
```javascript
const { data, error } = await supabaseClient
    .rpc('search_cities', { search_term: 'الرياض' });
```

## استخدام الجدول في التطبيق

### 1. البحث عن مدينة
```javascript
const { data: cities, error } = await supabaseClient
    .from('cities')
    .select('*')
    .ilike('name_ar', '%الرياض%')
    .limit(10);
```

### 2. الحصول على جميع مدن دولة
```javascript
const { data: cities, error } = await supabaseClient
    .from('cities')
    .select('*')
    .eq('country_code', 'SA')
    .order('population', { ascending: false });
```

### 3. الحصول على العواصم فقط
```javascript
const { data: capitals, error } = await supabaseClient
    .from('cities')
    .select('*')
    .eq('is_capital', true)
    .order('name_ar');
```

### 4. البحث الذكي (باستخدام الدالة)
```javascript
const { data: results, error } = await supabaseClient
    .rpc('search_cities', { 
        search_term: searchInput.value 
    });
```

## إضافة مدن جديدة

لإضافة مدن جديدة، استخدم:

```sql
INSERT INTO cities (name_ar, name_en, country_code, country_ar, country_en, is_capital, population)
VALUES ('المدينة', 'City Name', 'CODE', 'الدولة', 'Country', false, 1000000);
```

## التحديث والصيانة

### تحديث معلومات مدينة
```sql
UPDATE cities 
SET population = 5000000, updated_at = CURRENT_TIMESTAMP
WHERE name_en = 'Dubai';
```

### حذف مدينة
```sql
DELETE FROM cities WHERE name_en = 'City Name';
```

## الفهارس (Indexes)

تم إنشاء فهارس لتحسين أداء البحث:
- `idx_cities_name_ar` - البحث بالاسم العربي
- `idx_cities_name_en` - البحث بالاسم الإنجليزي
- `idx_cities_country` - البحث حسب الدولة
- `idx_cities_search` - بحث نصي كامل بالعربية

## الأمان (Security)

تذكر إضافة Row Level Security (RLS) policies إذا لزم الأمر:

```sql
-- السماح بالقراءة للجميع
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
ON cities FOR SELECT
TO public
USING (true);

-- السماح بالإضافة/التعديل للمصادقين فقط
CREATE POLICY "Allow authenticated insert"
ON cities FOR INSERT
TO authenticated
WITH CHECK (true);
```

## ملاحظات مهمة

1. **تحديث منتظم**: يُنصح بتحديث بيانات المدن دورياً
2. **التوسع**: يمكن إضافة المزيد من المدن حسب الحاجة
3. **الدقة**: تأكد من دقة الإحداثيات إذا كنت تستخدمها
4. **الأداء**: الجدول محسّن للبحث السريع حتى مع آلاف المدن

## الدعم

لأي استفسارات أو مشاكل، يرجى التواصل مع فريق التطوير.

---

**آخر تحديث:** 29 أكتوبر 2025
**الإصدار:** 1.0.0
