# 📖 دليل الإعداد الشامل - FastShip Platform

## 🎯 خطوات الإعداد الكاملة

### الخطوة 1: إعداد Supabase

#### 1.1 إنشاء مشروع جديد
1. اذهب إلى [supabase.com](https://supabase.com)
2. سجل الدخول أو أنشئ حساب جديد
3. اضغط "New Project"
4. املأ المعلومات:
   - **Project Name**: FastShip-SA
   - **Database Password**: اختر كلمة مرور قوية (احفظها!)
   - **Region**: اختر أقرب منطقة (Middle East أو Europe)
5. انتظر حتى يتم إنشاء المشروع (2-3 دقائق)

#### 1.2 تشغيل سكريبتات قاعدة البيانات

1. في لوحة تحكم Supabase، اذهب إلى **SQL Editor**
2. اضغط "New Query"
3. انسخ محتوى الملف `/public/utils/supabase-tables.sql` بالكامل
4. الصق في محرر SQL
5. اضغط **RUN** أو Ctrl+Enter
6. انتظر حتى تظهر رسالة النجاح

⚠️ **مهم**: تأكد من عدم وجود أخطاء في console. إذا ظهرت أخطاء، تحقق من:
- عدم وجود جداول موجودة مسبقًا بنفس الأسماء
- صلاحيات المستخدم

#### 1.3 الحصول على مفاتيح API

1. في Supabase، اذهب إلى **Settings** > **API**
2. انسخ المعلومات التالية:
   ```
   Project URL: https://xxxxx.supabase.co
   anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. احفظها في مكان آمن

#### 1.4 تحديث ملف التكوين

افتح الملف: `/public/config/supabase-config.js`

استبدل القيم:
```javascript
const SUPABASE_URL = 'YOUR_PROJECT_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

بالقيم التي نسختها في الخطوة السابقة.

#### 1.5 إعدادات إضافية (اختياري)

##### تفعيل تأكيد البريد الإلكتروني:
1. اذهب إلى **Authentication** > **Settings**
2. في **Email Auth**:
   - ✅ Enable email confirmations
   - أضف Confirmation URL إذا كنت تستخدم نطاق خاص
3. احفظ التغييرات

##### إعداد SMTP مخصص (للبريد الإلكتروني):
1. في **Settings** > **Auth**
2. قم بتكوين SMTP settings إذا أردت استخدام خدمة بريد خاصة

---

### الخطوة 2: تشغيل المشروع محليًا

#### طريقة 1: VS Code Live Server (موصى بها)

1. افتح VS Code
2. ثبت إضافة "Live Server" من Marketplace
3. افتح مجلد المشروع
4. انقر بزر الماوس الأيمن على `public/index.html`
5. اختر "Open with Live Server"
6. سيفتح المتصفح تلقائيًا على `http://127.0.0.1:5500`

#### طريقة 2: Python HTTP Server

```bash
cd public
python -m http.server 8000

# أو على Python 2:
python -m SimpleHTTPServer 8000
```

افتح المتصفح: `http://localhost:8000`

#### طريقة 3: Node.js HTTP Server

```bash
npm install -g http-server
cd public
http-server -p 8080
```

افتح المتصفح: `http://localhost:8080`

---

### الخطوة 3: اختبار المشروع

#### 3.1 اختبار الصفحة الرئيسية
1. افتح `http://localhost:XXXX`
2. تحقق من:
   - ✅ ظهور الصفحة الرئيسية بشكل صحيح
   - ✅ عمل قائمة اللغات
   - ✅ ظهور الأقسام (الخدمات، كيف تعمل، إلخ)

#### 3.2 اختبار التسجيل
1. اضغط "إنشاء حساب"
2. املأ النموذج:
   - الاسم الكامل
   - البريد الإلكتروني
   - رقم الهاتف
   - كلمة المرور (6 أحرف على الأقل)
   - اختر نوع المستخدم (موصل شحنات/صاحب شحنة)
   - اختر النوع الفرعي
   - ✅ وافق على الشروط
3. اضغط "إنشاء حساب"
4. يجب أن ترى رسالة نجاح

⚠️ **ملاحظة**: إذا فعّلت تأكيد البريد، ستحتاج لتأكيد البريد أولاً.

#### 3.3 اختبار تسجيل الدخول
1. سجل الدخول باستخدام الحساب الذي أنشأته
2. يجب أن يتم توجيهك إلى:
   - لوحة تحكم الموصلين (إذا اخترت موصل شحنات)
   - لوحة تحكم الشاحنين (إذا اخترت صاحب شحنة)

#### 3.4 اختبار لوحة التحكم
- ✅ ظهور الإحصائيات
- ✅ عمل القوائم الجانبية
- ✅ إمكانية إضافة رحلة/شحنة
- ✅ ظهور الرسوم البيانية

---

### الخطوة 4: نشر المشروع (Production)

#### خيار 1: Cloudflare Pages (مجاني وموصى به)

1. **إنشاء حساب GitHub**
   - اذهب إلى [github.com](https://github.com)
   - أنشئ repository جديد
   - ارفع ملفات المشروع

2. **ربط مع Cloudflare Pages**
   - اذهب إلى [pages.cloudflare.com](https://pages.cloudflare.com)
   - اضغط "Create a project"
   - اختر "Connect to Git"
   - اختر repository من GitHub
   
3. **إعدادات البناء**:
   ```
   Framework preset: None
   Build command: (leave empty)
   Build output directory: /public
   ```

4. **متغيرات البيئة** (اختياري):
   - يمكنك إضافة SUPABASE_URL و SUPABASE_ANON_KEY كمتغيرات بيئة

5. **نشر**:
   - اضغط "Save and Deploy"
   - انتظر حتى يكتمل النشر (1-2 دقيقة)
   - ستحصل على رابط: `https://your-project.pages.dev`

#### خيار 2: Vercel

```bash
npm install -g vercel
cd fast-ship-sa
vercel
```

اتبع التعليمات على الشاشة.

#### خيار 3: Netlify

1. اذهب إلى [netlify.com](https://netlify.com)
2. اسحب مجلد `public` وأفلته
3. سيتم نشره تلقائيًا

---

### الخطوة 5: مسح البيانات الوهمية (قبل الإنتاج)

⚠️ **مهم جداً**: قبل إطلاق الموقع رسمياً:

1. في Supabase SQL Editor
2. افتح ملف `/public/utils/cleanup-dummy-data.sql`
3. انسخ والصق المحتوى
4. اضغط **RUN**
5. ت
