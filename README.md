# 🚚 FastShip Saudi Arabia - منصة الشحنة السريعة

منصة ذكية تربط بين موصلي الشحنات وأصحاب الشحنات في المملكة العربية السعودية والعالم.

## 📋 نظرة عامة

FastShip هي منصة مبتكرة تستخدم خوارزميات ذكية لمطابقة الرحلات مع الشحنات، مما يوفر الوقت والمال لجميع الأطراف. تدعم المنصة أنواعًا متعددة من الموصلين (من المسافرين الأفراد إلى أساطيل الشحن الكبيرة) والشاحنين (من الأفراد إلى الشركات الكبرى).

## ✨ المميزات الرئيسية

### 🎯 للموصلين (Carriers)
- ✅ إضافة رحلات بمسارات محددة ومساحة متاحة
- ✅ مطابقة ذكية مع الشحنات المناسبة
- ✅ لوحة تحكم احترافية مع إحصائيات مفصلة
- ✅ نظام دردشة فوري مع أصحاب الشحنات
- ✅ تكامل مع WhatsApp للتواصل السريع
- ✅ نظام تقييمات وتعليقات

### 📦 لأصحاب الشحنات (Shippers)
- ✅ إضافة شحنات بتفاصيل دقيقة
- ✅ عرض الموصلين المتاحين تلقائيًا
- ✅ مطابقة ذكية بناءً على المسار والتاريخ
- ✅ نظام رسائل مباشر
- ✅ تتبع حالة الشحنات
- ✅ تقييم الموصلين

### 🔒 الأمان والموثوقية
- ✅ توثيق الهويات والمستندات
- ✅ نظام تقييمات شفاف
- ✅ حماية البيانات الشخصية
- ✅ سياسات Row Level Security (RLS)

### 🌐 تعدد اللغات
- ✅ دعم اللغة العربية
- ✅ دعم اللغة الإنجليزية
- ✅ تبديل سهل بين اللغات

## 🛠️ التقنيات المستخدمة

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Font Awesome Icons
- Chart.js للرسوم البيانية
- Responsive Design

### Backend & Database
- **Supabase** (PostgreSQL + Real-time + Auth)
- Row Level Security (RLS)
- Realtime Subscriptions
- Cloud Functions

### خوارزميات ذكية
- خوارزمية مطابقة متقدمة (Smart Matching)
- حساب نقاط التوافق بناءً على:
  - المسار (40%)
  - التاريخ (30%)
  - السعة (20%)
  - نوع الموصل/الشاحن (10%)

## 📦 متطلبات التشغيل

- متصفح ويب حديث (Chrome, Firefox, Safari, Edge)
- حساب Supabase (مجاني)
- Node.js (اختياري للتطوير)

## 🚀 دليل الإعداد السريع

### 1️⃣ إعداد Supabase

1. **إنشاء مشروع جديد**
   - زر موقع [Supabase.com](https://supabase.com)
   - أنشئ حساب جديد أو سجل الدخول
   - اضغط "New Project"
   - اختر اسم المشروع وكلمة المرور

2. **تشغيل السكريبتات**
   ```sql
   -- في Supabase SQL Editor، شغل الملفات بالترتيب:
   
   -- أولاً: إنشاء الجداول
   -- انسخ محتوى ملف: /public/utils/supabase-tables.sql
   -- والصقه في SQL Editor واضغط RUN
   
   -- ثانياً: تنظيف البيانات الوهمية (اختياري)
   -- انسخ محتوى ملف: /public/utils/cleanup-dummy-data.sql
   -- والصقه في SQL Editor واضغط RUN
   ```

3. **الحصول على مفاتيح API**
   - اذهب إلى Settings > API
   - انسخ:
     - Project URL
     - anon/public API key

4. **تحديث ملف التكوين**
   ```javascript
   // public/config/supabase-config.js
   const SUPABASE_URL = 'YOUR_PROJECT_URL';
   const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
   ```

### 2️⃣ تشغيل المشروع

#### طريقة 1: استخدام Live Server (الأسهل)
```bash
# إذا كان لديك VS Code مع Live Server extension
# افتح المشروع في VS Code
# انقر بزر الماوس الأيمن على index.html
# اختر "Open with Live Server"
```

#### طريقة 2: استخدام Python Server
```bash
cd public
python -m http.server 8000
# ثم افتح المتصفح على: http://localhost:8000
```

#### طريقة 3: استخدام Node.js
```bash
npm install -g http-server
cd public
http-server
```

### 3️⃣ إعداد Cloudflare Pages (للنشر)

1. أنشئ حساب على [Cloudflare Pages](https://pages.cloudflare.com)
2. اربط مستودع GitHub الخاص بك
3. إعدادات البناء:
   - Framework: None
   - Build command: (اتركه فارغًا)
   - Build output directory: `/public`
4. اضغط "Save and Deploy"

## 📁 هيكل المشروع

```
fast-ship-sa/
├── public/
│   ├── index.html              # الصفحة الرئيسية
│   ├── assets/
│   │   ├── css/               # ملفات التنسيق
│   │   │   ├── style.css
│   │   │   ├── modern-dashboard.css
│   │   │   └── responsive.css
│   │   ├── js/                # ملفات JavaScript
│   │   │   ├── auth-manager.js      # إدارة المصادقة
│   │   │   ├── auth.js              # تسجيل الدخول والتسجيل
│   │   │   ├── matching-engine.js   # خوارزمية المطابقة
│   │   │   ├── chat-system.js       # نظام الدردشة
│   │   │   └── main.js
│   │   └── images/            # الصور
│   ├── pages/
│   │   ├── auth/              # صفحات المصادقة
│   │   │   ├── login.html
│   │   │   ├── register.html
│   │   │   └── verification.html
│   │   ├── carrier/           # صفحات الموصلين
│   │   │   ├── index.html     # لوحة التحكم
│   │   │   ├── add-trip.html
│   │   │   ├── my-trips.html
│   │   │   └── matches.html
│   │   ├── shipper/           # صفحات الشاحنين
│   │   │   ├── index.html     # لوحة التحكم
│   │   │   ├── add-shipment.html
│   │   │   ├── my-shipments.html
│   │   │   └── matches.html
│   │   ├── messaging/         # صفحات الرسائل
│   │   │   ├── index.html
│   │   │   └── chat.html
│   │   └── general/           # صفحات عامة
│   │       ├── about.html
│   │       ├── contact.html
│   │       ├── terms.html
│   │       ├── privacy.html
│   │       └── support.html
│   ├── config/
│   │   └── supabase-config.js  # إعدادات Supabase
│   ├── locales/                # ملفات الترجمة
│   │   ├── ar.json
│   │   └── en.json
│   └── utils/                  # أدوات مساعدة
│       ├── supabase-tables.sql
│       └── cleanup-dummy-data.sql
└── README.md
```

## 🔐 الأمان

### Row Level Security (RLS)
جميع الجداول محمية بسياسات RLS:
- المستخدمون يمكنهم رؤية وتعديل بياناتهم فقط
- الرحلات المنشورة مرئية للجميع
- الشحنات المعلقة مرئية للجميع
- الرسائل محمية بين المرسل والمستقبل

### المصادقة
- استخدام Supabase Auth
- تشفير كلمات المرور
- جلسات آمنة
- تحقق من البريد الإلكتروني (اختياري)

## 🎨 التخصيص

### تغيير الألوان
```css
/* في assets/css/style.css */
:root {
    --primary: #5E72E4;      /* اللون الأساسي */
    --secondary: #F5365C;    /* اللون الثانوي */
    --success: #2DCE89;      /* لون النجاح */
    --warning: #FB6340;      /* لون التحذير */
}
```

### إضافة لغات جديدة
1. أنشئ ملف جديد في `/locales/` (مثل `fr.json`)
2. انسخ بنية `ar.json` أو `en.json`
3. ترجم النصوص
4. أضف الخيار في قائمة اللغات

## 📊 خوارزمية المطابقة

تستخدم المنصة خوارزمية ذكية لحساب نقاط التوافق:

```javascript
Match Score = 
    Route Score (40%) +
    Date Score (30%) +
    Capacity Score (20%) +
    Type Score (10%)
```

### معايير المطابقة:
- **المسار**: تطابق المدن (من/إلى)
- **التاريخ**: قرب موعد الرحلة من موعد الشحنة
- **السعة**: ملاءمة وزن الشحنة للمساحة المتاحة
- **النوع**: توافق نوع الموصل مع نوع الشاحن

## 💬 نظام الدردشة

### المميزات:
- ✅ دردشة فورية (Real-time)
- ✅ إشعارات صوتية
- ✅ علامة قراءة الرسائل
- ✅ تكامل مع WhatsApp
- ✅ بحث في الرسائل

### استخدام WhatsApp:
```javascript
// يتم توليد رابط WhatsApp تلقائيًا
https://wa.me/966551519723?text=مرحبا
```

## 📱 الاستجابة (Responsive)

المنصة مُحسّنة لجميع الأجهزة:
- 📱 الهواتف المحمولة (320px+)
- 📱 الأجهزة اللوحية (768px+)
- 💻 أجهزة الكمبيوتر (1024px+)
- 🖥️ الشاشات الكبيرة (1920px+)

## 🐛 استكشاف الأخطاء

### مشكلة: لا تظهر البيانات
```javascript
// تحقق من الاتصال بـ Supabase
console.log(window.supabaseClient);

// تحقق من المصادقة
console.log(window.authManager.getUserProfile());
```

### مشكلة: خطأ في RLS
```sql
-- تأكد من تشغيل سياسات RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### مشكلة: الدردشة لا تعمل
```javascript
// تحقق من Realtime
supabase.channel('test').subscribe((status) => {
    console.log('Realtime status:', status);
});
