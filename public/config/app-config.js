// Application Configuration for Fast Shipment Platform

const APP_CONFIG = {
    // Application Settings
    app: {
        name: 'الشحنة السريعة',
        version: '1.0.0',
        environment: 'production', // Set a default environment
        baseUrl: 'https://alsahnah.com' // Set a default base URL
    },

    // API Configuration
    api: {
        baseUrl: 'https://api.alsahnah.com', // Set a default API URL
        timeout: 30000,
        retryAttempts: 3
    },

    // Supabase Configuration (credentials are in supabase-config.js)
    supabase: {
        url: 'https://chmistqmcmmmjqeanudu.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobWlzdHFtY21tbWpxZWFudWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDg1MTEsImV4cCI6MjA3NjIyNDUxMX0.Ho-3nEs3_w5Xmna2z0HQF6dDjh8MkiBzD10N_6vuEKs'
    },

    // Feature Flags
    features: {
        enableChat: true,
        enableVerification: true,
        enablePayments: true,
        enableNotifications: true,
        enableMultiLanguage: true
    },

    // Payment Configuration
    payment: {
        provider: 'stripe',
        publicKey: null, // Set to null as it's not available
        currency: 'SAR',
        commissionRate: 0.05 // 5% commission
    },

    // Notification Configuration
    notifications: {
        email: {
            enabled: true,
            from: 'noreply@alsahnah.com'
        },
        push: {
            enabled: true,
            publicKey: null // Set to null
        },
        sms: {
            enabled: true,
            provider: 'twilio'
        }
    },

    // Analytics Configuration
    analytics: {
        googleAnalytics: null, // Set to null
        hotjar: null, // Set to null
        facebookPixel: null // Set to null
    },

    // Security Configuration
    security: {
        passwordMinLength: 6,
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60 * 1000 // 15 minutes
    },

    // Performance Configuration
    performance: {
        cacheTimeout: 5 * 60 * 1000, // 5 minutes
        lazyLoadOffset: 100, // pixels
        debounceDelay: 300 // milliseconds
    },

    // Localization Configuration
    localization: {
        defaultLanguage: 'ar',
        supportedLanguages: ['ar', 'en', 'ru', 'zh', 'ur', 'es'],
        fallbackLanguage: 'en'
    },

    // Upload Configuration
    upload: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedImageTypes: ['image/jpeg', 'image/png', 'image/jpg'],
        allowedDocumentTypes: ['application/pdf'],
        maxFilesPerUpload: 5
    },

    // Map Configuration
    map: {
        provider: 'mapbox',
        accessToken: null, // Set to null
        defaultCenter: [24.7136, 46.6753], // Riyadh
        defaultZoom: 12
    },

    // Matching Algorithm Configuration
    matching: {
        weights: {
            route: 0.4,
            date: 0.3,
            capacity: 0.2,
            price: 0.1
        },
        threshold: 70, // Minimum match score percentage
        maxSuggestions: 10
    }
};

// Export configuration for browser
window.APP_CONFIG = APP_CONFIG;