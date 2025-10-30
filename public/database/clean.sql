-- ============================================
-- FastShip Global - Clean Database Script
-- ============================================
-- هذا السكريبت يمسح الجداول القديمة
-- استخدمه فقط إذا كنت متأكد!
-- ============================================

-- حذف الـ Views أولاً
DROP VIEW IF EXISTS trips_with_carrier CASCADE;
DROP VIEW IF EXISTS shipments_with_shipper CASCADE;

-- حذف الجداول (بالترتيب العكسي بسبب الـ Foreign Keys)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.verifications CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.shipments CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;
DROP TABLE IF EXISTS public.shippers CASCADE;
DROP TABLE IF EXISTS public.carriers CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- حذف الـ Functions
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- رسالة نجاح
SELECT 'Database cleaned successfully! Now run schema.sql' as message;
