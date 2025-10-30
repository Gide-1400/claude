# 🌍 FastShip Global - الشحنة السريعة العالمية

<div align="center">

![FastShip Logo](https://img.shields.io/badge/FastShip-Global-orange?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-MVP_Ready-success?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)

**منصة عالمية تربط موصلي الشحنات مع أصحاب الشحنات**

[العربية](#arabic) • [English](#english) • [التوثيق](PROJECT_BRIEF.md) • [الحالة](CURRENT_STATUS.md)

</div>

---

## <a name="arabic"></a> 🇸🇦 النسخة العربية

### 📖 نظرة عامة

**FastShip Global** هي منصة إلكترونية تشاركية تربط بين:
- **الناقلين (Carriers):** أشخاص لديهم مساحة فارغة متحركة (طائرة، سيارة، شاحنة، أسطول)
- **الشاحنين (Shippers):** أشخاص يريدون نقل شحنات (أفراد، متاجر، شركات)

**نحن لا نمتلك أي وسائل نقل** - نحن فقط نربط بين الطرفين (مثل Uber لكن للشحنات)

---

### ✨ المميزات

#### للناقلين
- 💰 كسب دخل إضافي من المساحة الفارغة
- 🎯 اختيار الشحنات المناسبة لرحلاتك
- 📱 إدارة سهلة للرحلات والشحنات
- ⭐ نظام تقييمات يزيد من مصداقيتك

#### للشاحنين
- 🚚 إيجاد ناقلين بأسعار منافسة
- 🔍 بحث وفلترة ذكية
- 📍 تتبع الشحنات لحظة بلحظة
- 💬 تواصل مباشر مع الناقلين

---

### 👥 أنواع المستخدمين

#### الناقلين (4 أنواع)
1. **مستقل** - يسافر بالطائرة/حافلة (10-20 كجم)
2. **صاحب سيارة** - سيارة/بيك اب (50-1500 كجم)
3. **صاحب شاحنة** - دينة/تريلا (1-50 طن)
4. **صاحب أسطول** - شركة نقل (50-1000+ طن)

#### الشاحنين (4 أنواع)
1. **فرد** - شحنة واحدة يومياً
2. **متجر صغير** - 5-10 شحنات
3. **متجر كبير** - 10-100 شحنة
4. **شركة** - 100-500+ شحنة

---

### 🛠️ التقنيات المستخدمة

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **UI Framework:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Real-time)
- **Hosting:** Vercel (Free)
- **Maps:** OpenStreetMap + Leaflet.js
- **Icons:** Font Awesome

---

### 📂 هيكل المشروع

```
fast-ship-sa/public/
├── index.html              # الصفحة الرئيسية
├── config/
│   └── supabase-config.js  # إعدادات Supabase
├── assets/
│   ├── css/                # ملفات التنسيق
│   ├── js/                 # ملفات JavaScript
│   └── images/             # الصور
├── pages/
│   ├── auth/               # صفحات المصادقة
│   │   ├── login.html
│   │   └── register.html
│   ├── carrier/            # صفحات الناقل
│   │   ├── index.html      # لوحة التحكم
│   │   └── add-trip.html   # إضافة رحلة
│   ├── shipper/            # صفحات الشاحن
│   │   ├── index.html      # لوحة التحكم
│   │   └── add-shipment.html
│   └── general/            # صفحات عامة
│       ├── about.html
│       ├── contact.html
│       ├── faq.html
│       ├── support.html
│       ├── terms.html
│       ├── privacy.html
│       └── investors.html
└── utils/
    └── supabase-tables.sql # قاعدة البيانات
```

---

### 🚀 كيفية التشغيل محلياً

#### المتطلبات
- Python 3.x (أو أي HTTP server)
- متصفح حديث (Chrome, Edge, Firefox)
- حساب Supabase (مجاني)

#### الخطوات

1. **استنساخ المشروع**
```bash
git clone https://github.com/your-username/fast-ship-sa.git
cd fast-ship-sa/public
```

2. **إعداد Supabase**
- افتح `config/supabase-config.js`
- ضع `SUPABASE_URL` و `SUPABASE_ANON_KEY` الخاصين بك

3. **تشغيل السيرفر المحلي**
```bash
python -m http.server 8000
```

4. **فتح المتصفح**
```
http://localhost:8000
```

---

### 📊 قاعدة البيانات

#### الجداول (10 جداول)
1. **users** - معلومات المستخدمين الأساسية
2. **carriers** - بيانات الناقلين
3. **shippers** - بيانات الشاحنين
4. **trips** - رحلات الناقلين
5. **shipments** - شحنات الشاحنين
6. **matches** - المطابقات بين الرحلات والشحنات
7. **messages** - المحادثات
8. **verifications** - التوثيق والتحقق
9. **reviews** - التقييمات
10. **notifications** - الإشعارات

#### إنشاء الجداول
```sql
-- افتح Supabase SQL Editor
-- الصق محتوى utils/supabase-tables.sql
-- Run
```

---

### 📱 الاستخدام

#### للناقل
1. سجل حساب جديد → اختر "ناقل"
2. اختر نوعك (مستقل، سيارة، شاحنة، أسطول)
3. اذهب إلى لوحة التحكم
4. أضف رحلة جديدة
5. انتظر المطابقات

#### للشاحن
1. سجل حساب جديد → اختر "شاحن"
2. اختر نوعك (فرد، متجر صغير، متجر كبير، شركة)
3. اذهب إلى لوحة التحكم
4. أضف شحنة جديدة
5. انتظر المطابقات

---

### 🔐 الأمان

- ✅ Row Level Security (RLS) مفعّل
- ✅ Supabase Authentication
- ✅ تشفير البيانات (SSL/TLS)
- ✅ التحقق من الهوية
- ✅ سياسة خصوصية واضحة

---

### 📈 خارطة الطريق

#### ✅ المرحلة الأولى (مكتملة)
- [x] الصفحة الرئيسية
- [x] نظام التسجيل والدخول
- [x] لوحات التحكم
- [x] إضافة رحلة/شحنة
- [x] الصفحات العامة

#### 🔄 المرحلة الثانية (قيد العمل)
- [ ] عرض الرحلات والشحنات
- [ ] البحث والفلترة
- [ ] خوارزمية المطابقة
- [ ] نظام المحادثات

#### 📅 المرحلة الثالثة (مستقبلاً)
- [ ] الخرائط التفاعلية
- [ ] نظام الدفع
- [ ] نظام التقييمات
- [ ] تطبيق موبايل

---

### 🤝 المساهمة

نرحب بمساهماتكم! يُرجى:
1. عمل Fork للمشروع
2. إنشاء Branch جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push للـ Branch (`git push origin feature/AmazingFeature`)
5. فتح Pull Request

---

### 📞 التواصل

**المالك:** قايد المصعبي  
**الجوال:** [+966551519723](tel:+966551519723)  
**واتساب:** [اضغط هنا](https://wa.me/966551519723)  
**الإيميل:** [gide1979@gmail.com](mailto:gide1979@gmail.com)

**للدعم الفني:** استخدم صفحة [الدعم](pages/general/support.html)  
**للاستثمار:** راجع صفحة [المستثمرين](pages/general/investors.html)

---

### 📄 الرخصة والملكية الفكرية

© 2024 قايد المصعبي - FastShip Global Platform  
جميع الحقوق محفوظة.

**ملاحظة:** هذا المشروع خاص. الاستخدام التجاري يتطلب إذن خطي من المالك.

---

### 📚 المستندات

- [دليل المشروع الكامل](PROJECT_BRIEF.md)
- [الحالة الحالية](CURRENT_STATUS.md)
- [حالة المشروع](PROJECT_STATUS.md)
- [الشروط والأحكام](pages/general/terms.html)
- [سياسة الخصوصية](pages/general/privacy.html)

---

## <a name="english"></a> 🇬🇧 English Version

### 📖 Overview

**FastShip Global** is a peer-to-peer platform connecting:
- **Carriers:** People with empty moving space (plane, car, truck, fleet)
- **Shippers:** People who need to ship items (individuals, shops, companies)

**We don't own any vehicles** - we just connect both sides (like Uber but for shipments)

---

### ✨ Features

#### For Carriers
- 💰 Earn extra income from empty space
- 🎯 Choose shipments that fit your routes
- 📱 Easy trip and shipment management
- ⭐ Rating system for credibility

#### For Shippers
- 🚚 Find carriers at competitive prices
- 🔍 Smart search and filtering
- 📍 Real-time shipment tracking
- 💬 Direct communication with carriers

---

### 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **UI:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Real-time)
- **Hosting:** Vercel (Free)
- **Maps:** OpenStreetMap + Leaflet.js
- **Icons:** Font Awesome

---

### 🚀 Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/your-username/fast-ship-sa.git
cd fast-ship-sa/public
```

2. **Configure Supabase**
- Open `config/supabase-config.js`
- Add your `SUPABASE_URL` and `SUPABASE_ANON_KEY`

3. **Run local server**
```bash
python -m http.server 8000
```

4. **Open browser**
```
http://localhost:8000
```

---

### 📞 Contact

**Owner:** Gaid Al-Masabi  
**Phone:** [+966551519723](tel:+966551519723)  
**WhatsApp:** [Click here](https://wa.me/966551519723)  
**Email:** [gide1979@gmail.com](mailto:gide1979@gmail.com)

---

### 📄 License

© 2024 Gaid Al-Masabi - FastShip Global Platform  
All rights reserved.

---

<div align="center">

**Made with ❤️ in Saudi Arabia 🇸🇦**

[⬆ Back to top](#-fastship-global---الشحنة-السريعة-العالمية)

</div>
