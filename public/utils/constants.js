// Constants for Fast Shipment Platform

const APP_CONSTANTS = {
    // Application Info
    APP_NAME: 'الشحنة السريعة',
    APP_VERSION: '1.0.0',
    APP_DESCRIPTION: 'منصة ربط بين الشاحنين وأصحاب الشحنات حول العالم',

    // User Types
    USER_TYPES: {
        CARRIER: 'carrier',
        SHIPPER: 'shipper'
    },

    // Carrier Types
    CARRIER_TYPES: {
        INDIVIDUAL: 'individual',
        CAR_OWNER: 'car_owner',
        TRUCK_OWNER: 'truck_owner',
        FLEET_OWNER: 'fleet_owner'
    },

    // Shipper Types
    SHIPPER_TYPES: {
        INDIVIDUAL: 'individual',
        SMALL_BUSINESS: 'small_business',
        LARGE_BUSINESS: 'large_business'
    },

    // Trip Status
    TRIP_STATUS: {
        AVAILABLE: 'available',
        BOOKED: 'booked',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled'
    },

    // Shipment Status
    SHIPMENT_STATUS: {
        PENDING: 'pending',
        MATCHED: 'matched',
        IN_PROGRESS: 'in_progress',
        DELIVERED: 'delivered',
        CANCELLED: 'cancelled'
    },

    // Match Status
    MATCH_STATUS: {
        SUGGESTED: 'suggested',
        ACCEPTED: 'accepted',
        REJECTED: 'rejected',
        CANCELLED: 'cancelled'
    },

    // Weight Limits (in kg)
    WEIGHT_LIMITS: {
        INDIVIDUAL: 20,
        CAR_OWNER: 1500,
        TRUCK_OWNER: 50000,
        FLEET_OWNER: 1000000
    },

    // Price Ranges (in SAR)
    PRICE_RANGES: {
        MIN_PER_KG: 1,
        MAX_PER_KG: 50,
        DEFAULT_PER_KG: 5
    },

    // Date Ranges
    DATE_RANGES: {
        MIN_DAYS_AHEAD: 1,
        MAX_DAYS_AHEAD: 365,
        FLEXIBLE_RANGE: 3
    },

    // Verification Levels
    VERIFICATION_LEVELS: {
        BASIC: 'basic',
        ADVANCED: 'advanced',
        PREMIUM: 'premium'
    },

    // File Upload Limits
    UPLOAD_LIMITS: {
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
        ALLOWED_DOC_TYPES: ['application/pdf', 'image/jpeg', 'image/png']
    },

    // API Endpoints
    API_ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            LOGOUT: '/auth/logout',
            VERIFY: '/auth/verify'
        },
        USERS: {
            PROFILE: '/users/profile',
            UPDATE: '/users/update',
            VERIFICATION: '/users/verification'
        },
        TRIPS: {
            LIST: '/trips',
            CREATE: '/trips',
            UPDATE: '/trips/:id',
            DELETE: '/trips/:id'
        },
        SHIPMENTS: {
            LIST: '/shipments',
            CREATE: '/shipments',
            UPDATE: '/shipments/:id',
            DELETE: '/shipments/:id'
        },
        MATCHES: {
            LIST: '/matches',
            CREATE: '/matches',
            UPDATE: '/matches/:id'
        },
        MESSAGES: {
            LIST: '/messages',
            SEND: '/messages'
        }
    },

    // Error Messages
    ERROR_MESSAGES: {
        NETWORK_ERROR: 'حدث خطأ في الشبكة. يرجى المحاولة مرة أخرى.',
        UNAUTHORIZED: 'غير مصرح بالوصول. يرجى تسجيل الدخول.',
        NOT_FOUND: 'لم يتم العثور على المورد المطلوب.',
        VALIDATION_ERROR: 'بيانات غير صالحة. يرجى التحقق من المدخلات.',
        SERVER_ERROR: 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.'
    },

    // Success Messages
    SUCCESS_MESSAGES: {
        REGISTER_SUCCESS: 'تم إنشاء الحساب بنجاح!',
        LOGIN_SUCCESS: 'تم تسجيل الدخول بنجاح!',
        TRIP_CREATED: 'تم إضافة الرحلة بنجاح!',
        SHIPMENT_CREATED: 'تم إضافة الشحنة بنجاح!',
        MATCH_ACCEPTED: 'تم قبول المطابقة بنجاح!'
    },

    // Countries (GCC)
    COUNTRIES: {
        SA: { name: 'المملكة العربية السعودية', code: 'SA', currency: 'SAR' },
        AE: { name: 'الإمارات العربية المتحدة', code: 'AE', currency: 'AED' },
        KW: { name: 'الكويت', code: 'KW', currency: 'KWD' },
        QA: { name: 'قطر', code: 'QA', currency: 'QAR' },
        BH: { name: 'البحرين', code: 'BH', currency: 'BHD' },
        OM: { name: 'عمان', code: 'OM', currency: 'OMR' }
    },

    // Cities by Country
    CITIES: {
        SA: ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة', 'الخبر', 'الطائف', 'تبوك'],
        AE: ['دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'العين', 'رأس الخيمة'],
        KW: ['الكويت', 'الجهراء', 'حولي', 'الفروانية', 'مبارك الكبير'],
        QA: ['الدوحة', 'الريان', 'أم صلال', 'الخور', 'الوكرة'],
        BH: ['المنامة', 'المحرق', 'الرفاع', 'مدينة حمد', 'الحد'],
        OM: ['مسقط', 'صلالة', 'صحار', 'نزوى', 'صور']
    },

    // Languages
    LANGUAGES: {
        AR: { code: 'ar', name: 'العربية', dir: 'rtl' },
        EN: { code: 'en', name: 'English', dir: 'ltr' },
        RU: { code: 'ru', name: 'Русский', dir: 'ltr' },
        ZH: { code: 'zh', name: '中文', dir: 'ltr' },
        UR: { code: 'ur', name: 'اردو', dir: 'rtl' },
        ES: { code: 'es', name: 'Español', dir: 'ltr' }
    },

    // Storage Keys
    STORAGE_KEYS: {
        USER_SESSION: 'userSession',
        PREFERRED_LANGUAGE: 'preferredLanguage',
        THEME_PREFERENCE: 'themePreference',
        CART_ITEMS: 'cartItems'
    },

    // Theme
    THEME: {
        LIGHT: 'light',
        DARK: 'dark'
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONSTANTS;
} else {
    window.APP_CONSTANTS = APP_CONSTANTS;
}