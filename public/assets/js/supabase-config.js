// Supabase Configuration for Fast Shipment Platform
// تكوين Supabase لمنصة الشحنة السريعة

// These are your PUBLIC, client-side safe credentials
const SUPABASE_URL = 'https://chmistqmcmmmjqeanudu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobWlzdHFtY21tbWpxZWFudWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDg1MTEsImV4cCI6MjA3NjIyNDUxMX0.Ho-3nEs3_w5Xmna2z0HQF6dDjh8MkiBzD10N_6vuEKs';

// Configuration options
const SUPABASE_OPTIONS = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'fast-shipment-auth',
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: { 
      'x-app-version': '2.0.0',
      'x-app-name': 'FastShipment'
    }
  }
};

// Initialize Supabase client
let supabaseClient;

try {
  if (typeof window !== 'undefined' && window.supabase) {
    const { createClient } = window.supabase;
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_OPTIONS);
    
    // Make it globally available
    window.supabaseClient = supabaseClient;
    
    // Setup auth state listener
    supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      
      if (event === 'SIGNED_IN') {
        // Store user data in session
        if (session?.user) {
          sessionStorage.setItem('currentUser', JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            role: session.user.user_metadata?.role || 'user',
            user_type: session.user.user_metadata?.user_type,
            name: session.user.user_metadata?.name
          }));
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear all stored data
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('fast-shipment-auth');
        
        // Redirect to login if not on public pages
        const publicPages = ['/', '/index.html', '/pages/auth/login.html', '/pages/auth/register.html', '/pages/general/'];
        const currentPath = window.location.pathname;
        const isPublicPage = publicPages.some(page => currentPath.includes(page));
        
        if (!isPublicPage) {
          window.location.href = '/pages/auth/login.html';
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
    });
    
    // Check session on load
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('Active session found');
        sessionStorage.setItem('currentUser', JSON.stringify({
          id: session.user.id,
          email: session.user.email,
          role: session.user.user_metadata?.role || 'user',
          user_type: session.user.user_metadata?.user_type,
          name: session.user.user_metadata?.name
        }));
      }
    });
    
    console.log('Supabase client initialized successfully');
  } else {
    console.error('Supabase library not loaded');
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { supabaseClient, SUPABASE_URL, SUPABASE_ANON_KEY };
}
