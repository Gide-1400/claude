# نظام التقييمات - Rating System Documentation

## 📋 نظرة عامة

نظام التقييمات يتيح للناقلين وأصحاب الشحنات تقييم بعضهم البعض بعد إكمال عملية التوصيل بنجاح. هذا النظام يساعد في بناء الثقة والمصداقية في المنصة.

---

## 🗄️ البنية

### الملفات الرئيسية:

1. **`utils/ratings-table.sql`** - جدول قاعدة البيانات
2. **`assets/js/rating-system.js`** - منطق النظام
3. **`assets/css/rating-system.css`** - التصميم والألوان

---

## 📊 جدول قاعدة البيانات

### الأعمدة الرئيسية:

```sql
CREATE TABLE ratings (
    id UUID PRIMARY KEY,
    match_id UUID NOT NULL,        -- المطابقة المرتبطة
    trip_id UUID,                   -- الرحلة
    shipment_id UUID,               -- الشحنة
    rater_id UUID NOT NULL,         -- المُقيّم
    rated_id UUID NOT NULL,         -- المُقيَّم
    rating DECIMAL(2,1),            -- التقييم الإجمالي (1-5)
    
    -- التقييمات التفصيلية
    communication_rating INTEGER,   -- التواصل (1-5)
    reliability_rating INTEGER,     -- الموثوقية (1-5)
    professionalism_rating INTEGER, -- الاحترافية (1-5)
    
    -- التفاصيل
    review TEXT,                    -- التعليق
    delivery_status VARCHAR(50),    -- حالة التسليم
    would_recommend BOOLEAN,        -- يوصي به؟
    tags TEXT[],                    -- علامات
    photos TEXT[],                  -- صور (اختياري)
    
    -- النظام
    is_verified BOOLEAN,            -- موثق
    is_public BOOLEAN,              -- عام
    is_flagged BOOLEAN,             -- مُبلّغ عنه
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### الفهارس:

```sql
-- فهارس للأداء
CREATE INDEX idx_ratings_match_id ON ratings(match_id);
CREATE INDEX idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX idx_ratings_rated_id ON ratings(rated_id);
CREATE INDEX idx_ratings_rated_public ON ratings(rated_id, is_public, created_at DESC);
```

---

## 🔧 الدوال المتاحة

### 1. فتح نموذج التقييم

```javascript
openRatingModal(matchId, ratedUserId, ratedUserName);
```

**الوصف:** يفتح نموذج التقييم للمستخدم المحدد

**المعاملات:**
- `matchId` - معرف المطابقة
- `ratedUserId` - معرف المستخدم المراد تقييمه
- `ratedUserName` - اسم المستخدم

**مثال:**
```javascript
openRatingModal(
    'a1b2c3d4-5678-90ab-cdef-1234567890ab',
    'user-id-123',
    'أحمد محمد'
);
```

---

### 2. التحقق من إمكانية التقييم

```javascript
await canRateMatch(matchId);
```

**الوصف:** يتحقق من إمكانية تقييم المطابقة

**الشروط:**
- المطابقة يجب أن تكون مكتملة (status = 'completed')
- لم يتم التقييم مسبقاً من نفس المستخدم

**العائد:** `true` أو `false`

---

### 3. عرض تقييمات المستخدم

```javascript
displayUserRatings(userId, containerId);
```

**الوصف:** يعرض تقييمات المستخدم في العنصر المحدد

**المعاملات:**
- `userId` - معرف المستخدم
- `containerId` - معرف عنصر HTML

**مثال:**
```javascript
displayUserRatings('user-id-123', 'ratingsContainer');
```

---

## 🎨 نموذج التقييم

### الأقسام:

1. **التقييم الإجمالي** (إجباري)
   - من 1 إلى 5 نجوم
   - يظهر كبير وواضح

2. **التقييمات التفصيلية** (اختياري)
   - التواصل (Communication)
   - الموثوقية (Reliability)
   - الاحترافية (Professionalism)

3. **حالة التسليم** (إجباري)
   - تم التسليم بنجاح
   - تم التسليم مع تأخير
   - تم التسليم مع أضرار طفيفة
   - أضرار كبيرة
   - لم يتم التسليم

4. **التعليق** (اختياري)
   - حد أقصى 500 حرف
   - عداد أحرف تفاعلي

5. **العلامات** (اختياري)
   - دقيق في المواعيد
   - ودود
   - محترف
   - حريص
   - سريع الاستجابة
   - مرن

6. **التوصية** (افتراضي: نعم)
   - خيار checkbox

---

## 📈 عرض التقييمات

### الإحصائيات المعروضة:

```javascript
{
    average_rating: 4.5,           // المتوسط الإجمالي
    total_ratings: 127,            // عدد التقييمات
    rating_breakdown: {            // التوزيع
        5_stars: 85,
        4_stars: 30,
        3_stars: 8,
        2_stars: 3,
        1_star: 1
    }
}
```

### بطاقة التقييم:

```html
<div class="rating-card">
    <div class="rating-card-header">
        <div class="rater-info">
            <i class="fas fa-user-circle"></i>
            <span>أحمد محمد</span>
            <span class="rater-type">(ناقل)</span>
        </div>
        <div class="rating-stars-small">
            ★★★★★ (5.0)
        </div>
    </div>
    <p class="rating-review">تجربة ممتازة، دقيق في المواعيد وحريص على البضاعة</p>
    <div class="rating-tags">
        <span>دقيق في المواعيد</span>
        <span>محترف</span>
    </div>
    <div class="rating-date">منذ 3 أيام</div>
</div>
```

---

## 🔐 الأمان والصلاحيات

### Row Level Security (RLS):

#### 1. القراءة:
```sql
-- يمكن للجميع قراءة التقييمات العامة
CREATE POLICY "Anyone can view public ratings"
    ON ratings FOR SELECT
    USING (is_public = true AND is_flagged = false);

-- المستخدم يرى تقييماته الخاصة
CREATE POLICY "Users can view their own ratings"
    ON ratings FOR SELECT
    USING (auth.uid() = rater_id OR auth.uid() = rated_id);
```

#### 2. الإضافة:
```sql
-- فقط للمطابقات المكتملة
CREATE POLICY "Users can add ratings for completed matches"
    ON ratings FOR INSERT
    WITH CHECK (
        auth.uid() = rater_id 
        AND can_rate_match(match_id, auth.uid())
    );
```

#### 3. التحديث:
```sql
-- خلال 24 ساعة فقط
CREATE POLICY "Users can update their ratings within 24 hours"
    ON ratings FOR UPDATE
    USING (
        auth.uid() = rater_id 
        AND created_at > NOW() - INTERVAL '24 hours'
    );
```

---

## 📱 التكامل مع لوحة التحكم

### إضافة زر التقييم في بطاقة المطابقة:

```javascript
// في ملف dashboard.js
function generateMatchCard(match) {
    // ... كود البطاقة

    // إضافة زر التقييم إذا كانت المطابقة مكتملة
    if (match.status === 'completed') {
        const rateButton = `
            <button class="btn-rate" 
                    onclick="openRatingModal('${match.id}', '${match.other_user_id}', '${match.other_user_name}')">
                <i class="fas fa-star"></i>
                قيّم الطرف الآخر
            </button>
        `;
        // إضافة الزر للبطاقة
    }
}
```

### إضافة التقييمات في صفحة الملف الشخصي:

```html
<!-- في profile.html -->
<section class="user-ratings-section">
    <h2>التقييمات</h2>
    <div id="userRatingsContainer"></div>
</section>

<script>
    // جلب معرف المستخدم
    const userId = getCurrentUserId();
    
    // عرض التقييمات
    displayUserRatings(userId, 'userRatingsContainer');
</script>
```

---

## 🎯 أفضل الممارسات

### 1. التحقق من الحالة:
```javascript
// تأكد من حالة المطابقة قبل السماح بالتقييم
if (match.status !== 'completed') {
    showAlert('لا يمكن التقييم إلا بعد إكمال التوصيل', 'warning');
    return;
}
```

### 2. منع التقييم المتكرر:
```javascript
// تحقق من عدم وجود تقييم سابق
const hasRated = await checkIfAlreadyRated(matchId, userId);
if (hasRated) {
    showAlert('لقد قمت بتقييم هذه المطابقة مسبقاً', 'info');
    return;
}
```

### 3. التحديث التلقائي:
```javascript
// بعد إرسال التقييم بنجاح
await updateUserAverageRating(ratedUserId);
await refreshDashboard();
```

### 4. معالجة الأخطاء:
```javascript
try {
    await submitRating(ratingData);
    showAlert('تم إرسال التقييم بنجاح', 'success');
} catch (error) {
    console.error('Rating error:', error);
    showAlert('حدث خطأ أثناء إرسال التقييم', 'error');
}
```

---

## 🚀 التثبيت والتشغيل

### 1. تثبيت قاعدة البيانات:

```bash
# في Supabase SQL Editor
# نفّذ محتوى ملف ratings-table.sql
```

أو عبر الـ CLI:
```bash
supabase db push --file utils/ratings-table.sql
```

### 2. إضافة الملفات في HTML:

```html
<!-- في ملف HTML -->
<head>
    <!-- CSS -->
    <link rel="stylesheet" href="assets/css/rating-system.css">
</head>

<body>
    <!-- المحتوى -->

    <!-- JavaScript -->
    <script src="assets/js/rating-system.js"></script>
</body>
```

### 3. تفعيل النظام:

```javascript
// بعد تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log('Rating system initialized');
    
    // جلب وعرض التقييمات إذا كانت صفحة الملف الشخصي
    if (window.location.pathname.includes('profile.html')) {
        const userId = getCurrentUserId();
        displayUserRatings(userId, 'ratingsContainer');
    }
});
```

---

## 📊 دوال SQL المساعدة

### 1. حساب متوسط التقييمات:

```sql
SELECT * FROM get_user_average_rating('user-id-here');

-- النتيجة:
-- average_rating: 4.5
-- total_ratings: 127
-- rating_breakdown: {...}
```

### 2. التقييمات التفصيلية:

```sql
SELECT * FROM get_user_detailed_ratings('user-id-here');

-- النتيجة:
-- avg_communication: 4.7
-- avg_reliability: 4.3
-- avg_professionalism: 4.6
-- recommendation_rate: 95.5%
```

### 3. أحدث التقييمات:

```sql
SELECT * FROM get_user_recent_ratings('user-id-here', 10);

-- يعرض آخر 10 تقييمات
```

---

## 🎨 التخصيص

### تغيير الألوان:

```css
/* في rating-system.css */
:root {
    --rating-primary: #D84315;
    --rating-secondary: #E64A19;
    --rating-star: #FFD700;
    --rating-shadow: rgba(216, 67, 21, 0.3);
}
```

### تغيير عدد النجوم:

```javascript
// في rating-system.js
function generateStarHTML(count, type) {
    // غير count من 5 إلى العدد المطلوب
    for (let i = 1; i <= count; i++) {
        // ...
    }
}
```

---

## 📝 الملاحظات المهمة

1. **التقييم لمرة واحدة فقط** لكل مطابقة
2. **التحديث متاح خلال 24 ساعة** فقط من إنشاء التقييم
3. **لا يمكن الحذف** - فقط الإداريون يمكنهم ذلك
4. **التحديث التلقائي** لمتوسط التقييم في جدول المستخدمين
5. **التقييمات المُبلّغ عنها** لا تظهر في العرض العام

---

## 🔄 التحديثات المستقبلية

- [ ] نظام الإبلاغ عن التقييمات المسيئة
- [ ] تحليلات متقدمة للتقييمات
- [ ] تصنيف أفضل المستخدمين
- [ ] شارات التميز (Badges)
- [ ] إشعارات التقييمات الجديدة
- [ ] الرد على التقييمات

---

## 📞 الدعم

للمزيد من المساعدة أو الإبلاغ عن مشاكل:
- راجع ملف `FIXES_REPORT.md`
- اطلع على `DEPLOYMENT_GUIDE.md`
- تحقق من `supabase-tables.sql`

---

**تم إنشاء النظام في:** 29 أكتوبر 2025  
**الإصدار:** 1.0.0  
**الحالة:** جاهز للإنتاج ✅
