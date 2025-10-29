-- ========================================
-- تحديث جدول الرسائل لدعم Realtime Chat
-- Fast Ship SA - Messages Table Update
-- ========================================

-- 1. إضافة أعمدة جديدة إذا لم تكن موجودة
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'text',
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. تحديث الأعمدة القديمة (إذا كانت موجودة)
DO $$ 
BEGIN
    -- نقل البيانات من message إلى content إذا كان موجوداً
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='messages' AND column_name='message') THEN
        UPDATE messages SET content = message WHERE content = '' OR content IS NULL;
    END IF;
    
    -- تحديث read إلى is_read
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='messages' AND column_name='read') THEN
        UPDATE messages SET is_read = read WHERE is_read IS NULL;
    END IF;
END $$;

-- 3. إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_messages_match_created 
ON messages(match_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages(receiver_id, is_read) 
WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_messages_realtime 
ON messages(receiver_id, created_at DESC);

-- 4. تفعيل Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 5. حذف السياسات القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their sent messages" ON messages;

-- 6. إنشاء سياسات الأمان الجديدة
CREATE POLICY "Users can view messages they sent or received"
ON messages FOR SELECT
USING (
    auth.uid()::text = sender_id::text OR 
    auth.uid()::text = receiver_id::text
);

CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (auth.uid()::text = sender_id::text);

CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
USING (auth.uid()::text = sender_id::text);

CREATE POLICY "Users can mark received messages as read"
ON messages FOR UPDATE
USING (auth.uid()::text = receiver_id::text)
WITH CHECK (auth.uid()::text = receiver_id::text);

-- 7. دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. إنشاء Trigger للتحديث التلقائي
DROP TRIGGER IF EXISTS set_messages_updated_at ON messages;
CREATE TRIGGER set_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_messages_updated_at();

-- 9. إضافة أعمدة للمستخدمين لتتبع الحالة
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 10. دالة للحصول على عدد الرسائل غير المقروءة
CREATE OR REPLACE FUNCTION get_unread_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO unread_count
    FROM messages
    WHERE receiver_id = user_uuid
    AND is_read = FALSE;
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. دالة للحصول على آخر رسالة لكل محادثة
CREATE OR REPLACE FUNCTION get_last_message(match_uuid UUID)
RETURNS TABLE (
    id UUID,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    sender_id UUID,
    is_read BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT m.id, m.content, m.created_at, m.sender_id, m.is_read
    FROM messages m
    WHERE m.match_id = match_uuid
    ORDER BY m.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. دالة لتحديد جميع الرسائل كمقروءة
CREATE OR REPLACE FUNCTION mark_conversation_read(
    match_uuid UUID,
    user_uuid UUID
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    WITH updated AS (
        UPDATE messages
        SET is_read = TRUE
        WHERE match_id = match_uuid
        AND receiver_id = user_uuid
        AND is_read = FALSE
        RETURNING 1
    )
    SELECT COUNT(*) INTO updated_count FROM updated;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. View لعرض المحادثات مع آخر رسالة
CREATE OR REPLACE VIEW conversations_with_last_message AS
SELECT 
    m.id AS match_id,
    m.status,
    m.created_at AS match_created_at,
    m.trip_id,
    m.shipment_id,
    t.from_city,
    t.to_city,
    t.user_id AS carrier_id,
    s.user_id AS shipper_id,
    (SELECT content FROM messages msg 
     WHERE msg.match_id = m.id 
     ORDER BY msg.created_at DESC 
     LIMIT 1) AS last_message_content,
    (SELECT created_at FROM messages msg 
     WHERE msg.match_id = m.id 
     ORDER BY msg.created_at DESC 
     LIMIT 1) AS last_message_time,
    (SELECT COUNT(*) FROM messages msg 
     WHERE msg.match_id = m.id 
     AND msg.is_read = FALSE) AS unread_count
FROM matches m
LEFT JOIN trips t ON m.trip_id = t.id
LEFT JOIN shipments s ON m.shipment_id = s.id
WHERE m.status = 'accepted';

-- 14. إعداد Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 15. تأكيد الإعدادات
DO $$
BEGIN
    RAISE NOTICE '✅ تم تحديث جدول الرسائل بنجاح';
    RAISE NOTICE '✅ تم إنشاء الفهارس والسياسات';
    RAISE NOTICE '✅ تم تفعيل Realtime على جدول messages';
    RAISE NOTICE '📊 استخدم الدالة get_unread_count(user_id) لمعرفة عدد الرسائل غير المقروءة';
    RAISE NOTICE '📊 استخدم View conversations_with_last_message لعرض المحادثات';
END $$;

-- 16. إنشاء بيانات تجريبية (اختياري - احذف هذا القسم في الإنتاج)
-- INSERT INTO messages (sender_id, receiver_id, match_id, content, is_read, created_at)
-- SELECT 
--     (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
--     (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
--     (SELECT id FROM matches WHERE status = 'accepted' ORDER BY RANDOM() LIMIT 1),
--     'مرحباً! هذه رسالة تجريبية',
--     FALSE,
--     NOW() - (random() * interval '7 days');
