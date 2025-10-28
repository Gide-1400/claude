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
    APP_NAME: 'FastShip Global',
    APP_NAME_AR: 'الشحنة السريعة العالمية',
    APP_SLOGAN: 'Connecting Carriers & Shippers Worldwide',
    APP_SLOGAN_AR: 'ربط الموصلين وأصحاب الشحنات حول العالم',
    VERSION: '1.0.0',
    SUPPORTED_LANGUAGES: ['ar', 'en'],
    DEFAULT_LANGUAGE: 'ar',
    OWNER: {
        NAME: 'قايد المصعبي',
        NAME_EN: 'Gaid Al-Masabi',
        PHONE: '+966551519723',
        EMAIL: 'gide1979@gmail.com',
        COPYRIGHT: '© 2024 FastShip Global Platform. All rights reserved.',
        COPYRIGHT_AR: '© 2024 منصة الشحنة السريعة العالمية. جميع الحقوق محفوظة.'
    },
    FEATURES: {
        EMAIL_VERIFICATION: false,
        REALTIME_CHAT: true,
        AUTO_MATCHING: true,
        WHATSAPP_INTEGRATION: true,
        NOTIFICATIONS: true,
        GLOBAL_CITIES: true,
        MULTI_LANGUAGE: true,
        CARRIER_TYPES: ['individual', 'car_owner', 'truck_owner', 'fleet_owner'],
        SHIPPER_TYPES: ['individual', 'small_business', 'medium_business', 'large_business', 'enterprise']
    },
    LIMITS: {
        // Individual travelers (plane, bus, train, taxi)
        INDIVIDUAL_MAX_WEIGHT: 20,      // kg
        INDIVIDUAL_MIN_WEIGHT: 1,       // kg
        
        // Car owners (private cars, pickup trucks)
        CAR_MAX_WEIGHT: 1500,           // kg
        CAR_MIN_WEIGHT: 50,             // kg
        
        // Truck owners (small trucks, big trucks)
        TRUCK_MAX_WEIGHT: 50000,        // kg (50 tons)
        TRUCK_MIN_WEIGHT: 1000,         // kg (1 ton)
        
        // Fleet owners (companies, shipping fleets)
        FLEET_MAX_WEIGHT: 1000000,      // kg (1000 tons)
        FLEET_MIN_WEIGHT: 10000,        // kg (10 tons)
        
        // General limits
        MAX_UPLOAD_SIZE: 10,            // MB
        MAX_MESSAGE_LENGTH: 2000,       // characters
        MAX_CITIES_PER_ROUTE: 10,       // waypoints
        MAX_ROUTE_DISTANCE: 20000       // km (half way around earth)
    },
    REGIONS: {
        MIDDLE_EAST: ['Saudi Arabia', 'UAE', 'Kuwait', 'Qatar', 'Bahrain', 'Oman', 'Jordan', 'Lebanon', 'Iraq', 'Iran'],
        EUROPE: ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Austria'],
        ASIA: ['China', 'Japan', 'India', 'Singapore', 'Thailand', 'Malaysia', 'Indonesia', 'Philippines', 'South Korea'],
        AMERICAS: ['United States', 'Canada', 'Mexico', 'Brazil', 'Argentina'],
        AFRICA: ['Egypt', 'Nigeria', 'South Africa', 'Morocco', 'Kenya', 'Ethiopia'],
        OCEANIA: ['Australia', 'New Zealand']
    },
    TRANSPORT_TYPES: {
        INDIVIDUAL: {
            ar: ['طائرة', 'حافلة', 'قطار', 'تاكسي'],
            en: ['Plane', 'Bus', 'Train', 'Taxi']
        },
        CAR: {
            ar: ['سيارة صغيرة', 'بيك أب', 'فان'],
            en: ['Small Car', 'Pickup Truck', 'Van']
        },
        TRUCK: {
            ar: ['دينة', 'شاحنة صغيرة', 'تريلا', 'مقطورة'],
            en: ['Small Truck', 'Medium Truck', 'Semi-Truck', 'Trailer']
        },
        FLEET: {
            ar: ['أسطول شاحنات', 'قطارات', 'طائرات شحن', 'سفن'],
            en: ['Truck Fleet', 'Trains', 'Cargo Planes', 'Ships']
        }
    }
};

console.log(`🚚 ${window.APP_CONFIG.APP_NAME} v${window.APP_CONFIG.VERSION} - Initialized`);

// Don't initialize AuthManager on login/register pages
const isAuthPage = window.location.pathname.includes('/auth/');
if (!isAuthPage && typeof AuthManager !== 'undefined') {
    // Initialize auth manager globally (but not on auth pages)
    window.authManager = new AuthManager();
}
