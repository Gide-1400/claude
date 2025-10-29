# 💬 نظام الدردشة الفورية - Fast Ship SA
## Real-time Chat System Documentation

---

## 📋 نظرة عامة

نظام دردشة فوري متكامل يستخدم **Supabase Realtime** لتوفير تجربة مراسلة سلسة بين الناقلين وأصحاب الشحنات.

### ✨ المميزات الرئيسية

- ✅ **رسائل فورية** - تحديثات لحظية باستخدام Supabase Realtime
- ✅ **مؤشرات الاتصال** - معرفة من متصل الآن
- ✅ **إشعارات القراءة** - علامة الصح المزدوجة عند القراءة
- ✅ **إشعارات المتصفح** - تنبيهات للرسائل الجديدة
- ✅ **بحث في المحادثات** - إيجاد محادثات محددة بسرعة
- ✅ **تكامل WhatsApp** - انتقال سريع للمحادثة عبر واتساب
- ✅ **اتصال هاتفي مباشر** - زر للاتصال الفوري
- ✅ **تصميم متجاوب** - يعمل على جميع الأجهزة

---

## 🚀 التثبيت والإعداد

### الخطوة 1: تحديث قاعدة البيانات

قم بتنفيذ السكربت SQL في Supabase:

```bash
# في Supabase Dashboard:
# 1. اذهب إلى SQL Editor
# 2. انسخ محتوى ملف update-messages-table.sql
# 3. نفذ السكربت
```

أو عبر CLI:

```bash
supabase db push --file ./utils/update-messages-table.sql
```

### الخطوة 2: تفعيل Realtime في Supabase

1. اذهب إلى **Database** → **Replication**
2. قم بتفعيل Realtime للجدول `messages`
3. حدد الأعمدة: `id`, `sender_id`, `receiver_id`, `match_id`, `content`, `is_read`, `created_at`

### الخطوة 3: تضمين الملفات

```html
<!-- في صفحة الدردشة -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="../../config/supabase-config.js"></script>
<script src="../../assets/js/realtime-chat.js"></script>
```

---

## 📊 هيكل قاعدة البيانات

### جدول `messages`

| العمود | النوع | الوصف |
|--------|-------|-------|
| `id` | UUID | المعرف الفريد للرسالة |
| `sender_id` | UUID | معرف المرسل |
| `receiver_id` | UUID | معرف المستقبل |
| `match_id` | UUID | معرف المطابقة (المحادثة) |
| `content` | TEXT | محتوى الرسالة |
| `is_read` | BOOLEAN | حالة القراءة |
| `message_type` | VARCHAR(50) | نوع الرسالة (text, image, file) |
| `attachment_url` | TEXT | رابط المرفق |
| `created_at` | TIMESTAMP | وقت الإرسال |
| `updated_at` | TIMESTAMP | وقت التحديث |

### الفهارس (Indexes)

```sql
-- للأداء السريع
idx_messages_match_created (match_id, created_at DESC)
idx_messages_unread (receiver_id, is_read)
idx_messages_realtime (receiver_id, created_at DESC)
```

### سياسات الأمان (RLS Policies)

- المستخدمون يمكنهم عرض الرسائل التي أرسلوها أو استلموها فقط
- المستخدمون يمكنهم إرسال رسائل باسمهم فقط
- المستخدمون يمكنهم تحديث رسائلهم المرسلة
- المستقبلون يمكنهم تحديث حالة القراءة

---

## 🔧 الاستخدام البرمجي

### تهيئة النظام

```javascript
// يتم تلقائياً عند تحميل الصفحة
const chatSystem = new RealtimeChatSystem();
await chatSystem.init();
```

### فتح محادثة

```javascript
// من أي مكان في الكود
chatSystem.openConversation(matchId);
```

### إرسال رسالة

```javascript
// إرسال رسالة نصية
await chatSystem.sendMessage('مرحباً! كيف حالك؟');

// يتم تلقائياً عند الضغط على زر الإرسال
```

### الاستماع للرسائل الجديدة

```javascript
// يعمل تلقائياً عبر Supabase Realtime
// لا حاجة لكتابة كود إضافي
```

---

## 📱 واجهة المستخدم

### هيكل الصفحة

```
┌─────────────────────────────────────┐
│  قائمة المحادثات  │  منطقة الدردشة │
│                    │                 │
│  • محادثة 1       │  [رأس المحادثة]│
│  • محادثة 2       │                 │
│  • محادثة 3       │  [الرسائل]     │
│                    │                 │
│                    │  [حقل الإدخال] │
└─────────────────────────────────────┘
```

### عناصر قائمة المحادثات

- **صورة المستخدم** مع مؤشر الاتصال (أخضر = متصل)
- **اسم المستخدم** ووقت آخر رسالة
- **معاينة الرسالة** الأخيرة (40 حرف)
- **المسار** (من مدينة → إلى مدينة)
- **عدد الرسائل غير المقروءة** (بدج أحمر)

### عناصر منطقة الدردشة

- **رأس المحادثة**
  - صورة واسم المستخدم
  - حالة الاتصال (متصل/غير متصل)
  - أزرار الإجراءات (اتصال، واتساب، تفاصيل)

- **الرسائل**
  - فقاعات رسائل (أزرق للمرسلة، رمادي للمستلمة)
  - وقت الإرسال
  - مؤشر القراءة (✓ مرسلة، ✓✓ مقروءة)

- **حقل الإدخال**
  - صندوق نص قابل للتمدد
  - زر إرسال دائري برتقالي

---

## 🎨 التخصيص

### الألوان

```css
/* الألوان الأساسية */
--primary: #FF6B35
--primary-light: #FF8C42
--success: #4CAF50
--gray: #666
--bg: #f8f9fa

/* الرسائل المرسلة */
background: linear-gradient(135deg, #FF6B35, #FF8C42)

/* الرسائل المستلمة */
background: white
```

### التأثيرات

```css
/* ظهور الرسالة */
@keyframes messageAppear {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* تحويم على المحادثة */
.conversation-item:hover {
    background: #f9f9f9;
}
```

---

## 🔔 الإشعارات

### إشعارات المتصفح

```javascript
// طلب الإذن تلقائياً
if (Notification.permission === 'default') {
    await Notification.requestPermission();
}

// يتم إرسال إشعار لكل رسالة جديدة
new Notification('رسالة جديدة', {
    body: 'محتوى الرسالة...',
    icon: '/assets/images/logo.png'
});
```

### صوت الإشعار

```javascript
// يتم تشغيل صوت عند استلام رسالة جديدة
playNotificationSound();
```

---

## 📲 التكامل مع الخدمات الخارجية

### WhatsApp

```javascript
// فتح محادثة واتساب
openWhatsApp('966500000000');
// يفتح: https://wa.me/966500000000
```

### الاتصال الهاتفي

```javascript
// بدء اتصال هاتفي
callUser('966500000000');
// يفتح: tel:966500000000
```

---

## 🔍 الدوال المساعدة المتاحة

### في قاعدة البيانات

```sql
-- الحصول على عدد الرسائل غير المقروءة
SELECT get_unread_count('user-uuid-here');

-- الحصول على آخر رسالة في محادثة
SELECT * FROM get_last_message('match-uuid-here');

-- تحديد جميع رسائل محادثة كمقروءة
SELECT mark_conversation_read('match-uuid', 'user-uuid');

-- عرض جميع المحادثات مع آخر رسالة
SELECT * FROM conversations_with_last_message;
```

### في JavaScript

```javascript
// تنسيق الوقت (قبل 5 د، قبل 2 س، ...)
formatMessageTime(timestamp);

// اختصار النص
truncateText(text, maxLength);

// التمرير إلى أسفل الدردشة
scrollToBottom();

// تحديث مؤشرات الاتصال
updateOnlineIndicators();

// عرض تنبيه
showAlert('رسالة', 'success' | 'error' | 'info');
```

---

## 📊 مراقبة الأداء

### المقاييس المهمة

- **زمن استجابة الرسالة**: يجب أن يكون < 500ms
- **استهلاك البيانات**: ~5KB لكل رسالة
- **عدد الاتصالات Realtime**: واحد لكل مستخدم

### التحسينات

```javascript
// تحميل 20 رسالة فقط في البداية
.limit(20)

// استخدام الفهارس للاستعلامات السريعة
CREATE INDEX idx_messages_match_created ...

// Pagination للمحادثات الطويلة
.range(0, 19)
```

---

## 🐛 استكشاف الأخطاء

### المشاكل الشائعة

#### 1. الرسائل لا تظهر فورياً

**الحل:**
- تأكد من تفعيل Realtime في Supabase Dashboard
- تحقق من وجود `ALTER PUBLICATION supabase_realtime ADD TABLE messages`
- افحص Console للأخطاء

#### 2. خطأ "window.supabaseClient is undefined"

**الحل:**
```javascript
// تأكد من تحميل supabase-config.js قبل realtime-chat.js
<script src="../../config/supabase-config.js"></script>
<script src="../../assets/js/realtime-chat.js"></script>
```

#### 3. المستخدم يظهر دائماً غير متصل

**الحل:**
```sql
-- تأكد من وجود الأعمدة
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;
```

#### 4. الإشعارات لا تعمل

**الحل:**
```javascript
// طلب الإذن في بداية الجلسة
await Notification.requestPermission();
```

---

## 🔐 الأمان

### حماية البيانات

- ✅ Row Level Security (RLS) مفعل على جدول messages
- ✅ المستخدمون يرون رسائلهم فقط
- ✅ لا يمكن إرسال رسائل بأسماء مستخدمين آخرين
- ✅ التحقق من الصلاحيات في كل عملية

### أفضل الممارسات

```javascript
// التحقق من المستخدم المسجل دائماً
if (!this.currentUser) {
    window.location.href = '/pages/auth/login.html';
    return;
}

// تنظيف الإدخال
content = content.trim();

// التحقق من الطول
if (content.length > 5000) {
    throw new Error('الرسالة طويلة جداً');
}
```

---

## 📈 التطويرات المستقبلية

### مميزات قادمة

- [ ] **إرسال الصور** - مشاركة صور الشحنات
- [ ] **المرفقات** - PDF والمستندات
- [ ] **الرسائل الصوتية** - تسجيل صوتي
- [ ] **مكالمات الفيديو** - WebRTC
- [ ] **الترجمة التلقائية** - عربي ⟷ إنجليزي
- [ ] **البحث في الرسائل** - البحث داخل المحادثات
- [ ] **الأرشفة** - أرشفة المحادثات القديمة
- [ ] **الحذف التلقائي** - حذف الرسائل بعد 90 يوماً

---

## 🧪 الاختبار

### اختبارات يدوية

```javascript
// 1. اختبار الإرسال
chatSystem.sendMessage('test message');

// 2. اختبار الاستقبال
// افتح الصفحة في متصفحين مختلفين

// 3. اختبار القراءة
// افتح المحادثة - يجب أن تتحدث is_read إلى true

// 4. اختبار الإشعارات
// أغلق التبويب وأرسل رسالة
```

### اختبارات أوتوماتيكية

```javascript
// مثال: اختبار تنسيق الوقت
console.assert(
    chatSystem.formatMessageTime(new Date()) === 'الآن',
    'فشل اختبار تنسيق الوقت'
);
```

---

## 📞 الدعم الفني

### الأسئلة الشائعة

**س: كيف أضيف لغات إضافية؟**  
ج: أضف ملفات ترجمة في `locales/` واستخدم `document.documentElement.lang`

**س: هل يمكن حذف الرسائل؟**  
ج: حالياً لا، لكن يمكن إضافة ميزة الحذف في المستقبل

**س: كم عدد الرسائل المسموح؟**  
ج: لا يوجد حد، لكن يُنصح بالأرشفة بعد 1000 رسالة

---

## 📝 الملاحظات

- النظام متوافق مع جميع المتصفحات الحديثة
- يتطلب Supabase Pro للإنتاج (Realtime)
- استهلاك البيانات: ~10-50KB/دقيقة أثناء الدردشة النشطة
- التأخير: < 500ms في معظم الأحيان

---

## 🎉 الخلاصة

نظام دردشة فوري متكامل وجاهز للإنتاج مع:
- ✅ تحديثات لحظية
- ✅ تصميم احترافي
- ✅ أمان عالي
- ✅ أداء ممتاز
- ✅ قابلية التوسع

**تم بناؤه بـ ❤️ للمنصة Fast Ship SA**

---

## 📄 الترخيص

جميع الحقوق محفوظة © 2025 Fast Ship SA
