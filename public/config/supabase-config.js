// ============================================
// Supabase Configuration for FastShip Platform
// ============================================

// !!! IMPORTANT: Replace these with your actual Supabase credentials !!!
const SUPABASE_URL = 'https://chmistqmcmmmjqeanudu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobWlzdHFtY21tbWpxZWFudWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDg1MTEsImV4cCI6MjA3NjIyNDUxMX0.Ho-3nEs3_w5Xmna2z0HQF6dDjh8MkiBzD10N_6vuEKs';

// Verify environment
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('⚠️ Supabase credentials are missing!');
    console.error('Please update config/supabase-config.js with your credentials');
    alert('خطأ في الإعداد: يرجى تحديث بيانات Supabase في ملف التكوين');
}

// Verify Supabase library is loaded
if (typeof window.supabase === 'undefined') {
    console.error('⚠️ Supabase library not loaded!');
    console.error('Make sure to include the Supabase CDN script before this file');
    alert('خطأ: مكتبة Supabase غير محملة. تحقق من السكريبتات في الصفحة');
}

// Initialize Supabase Client
try {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        },
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        }
    });

    // Verify connection
    window.supabaseClient.auth.getSession().then(({ data, error }) => {
        if (error) {
            console.error('Supabase connection error:', error);
        } else {
            console.log('✅ Supabase connected successfully');
            if (data.session) {
                console.log('👤 User session found:', data.session.user.email);
            }
        }
    });

} catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    alert('فشل الاتصال بقاعدة البيانات. يرجى التحقق من إعدادات Supabase');
}

// Export for use in other files
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

// Helper function to check if Supabase is ready
window.isSupabaseReady = function() {
    return window.supabaseClient && typeof window.supabaseClient.auth !== 'undefined';
};

// Configuration constants
window.APP_CONFIG = {
    APP_NAME: 'FastShip Saudi Arabia',
    APP_NAME_AR: 'الشحنة السريعة',
    VERSION: '1.0.0',
    SUPPORTED_LANGUAGES: ['ar', 'en'],
    DEFAULT_LANGUAGE: 'ar',
    OWNER: {
        NAME: 'قايد المصعبي',
        NAME_EN: 'Gaid Al-Masabi',
        PHONE: '+966551519723',
        EMAIL: 'gide1979@gmail.com'
    },
    FEATURES: {
        EMAIL_VERIFICATION: false, // Set to true if you enable email verification in Supabase
        REALTIME_CHAT: true,
        AUTO_MATCHING: true,
        WHATSAPP_INTEGRATION: true,
        NOTIFICATIONS: true
    },
    LIMITS: {
        MAX_TRIP_WEIGHT: 50000,  // kg
        MIN_TRIP_WEIGHT: 1,       // kg
        MAX_SHIPMENT_WEIGHT: 10000, // kg
        MIN_SHIPMENT_WEIGHT: 1,    // kg
        MAX_UPLOAD_SIZE: 5,        // MB
        MAX_MESSAGE_LENGTH: 1000   // characters
    }
};

console.log(`🚚 ${window.APP_CONFIG.APP_NAME} v${window.APP_CONFIG.VERSION} - Initialized`);
