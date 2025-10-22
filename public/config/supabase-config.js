// Supabase Configuration for Fast Shipment Platform

const SUPABASE_CONFIG = {
    url: 'https://chmistqmcmmmjqeanudu.supabase.co',
    anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobWlzdHFtY21tbWpxZWFudWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDg1MTEsImV4cCI6MjA3NjIyNDUxMX0.Ho-3nEs3_w5Xmna2z0HQF6dDjh8MkiBzD10N_6vuEKs',
    options: {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
};

// Initialize Supabase client
function initSupabaseClient() {
    if (typeof window !== 'undefined' && window.supabase) {
        return window.supabase;
    }
    
    // Create a new Supabase client
    const { createClient } = window.supabase;
    const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anon_key, SUPABASE_CONFIG.options);
    
    if (typeof window !== 'undefined') {
        window.supabase = supabase;
    }
    
    return supabase;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG, initSupabaseClient };
} else {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
    window.initSupabaseClient = initSupabaseClient;
}