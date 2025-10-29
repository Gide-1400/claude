// Simple Authentication Guard - Allows Access by Default
// Only blocks if there's clear evidence user is not authenticated

class SimpleAuthGuard {
    constructor() {
        this.init();
    }

    async init() {
        // Skip auth pages
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.includes('/auth/');
        const isMainPage = currentPath === '/' || currentPath.includes('/index.html');
        
        if (isAuthPage || isMainPage) {
            return;
        }

        // Check if we're on a dashboard index page (main dashboard page)
        const isDashboardIndex = currentPath.includes('/pages/carrier/index.html') || 
                                currentPath.includes('/pages/shipper/index.html');
        
        // SKIP auth check completely if we're already on the dashboard index
        // This prevents redirect loops when user navigates within dashboard
        if (isDashboardIndex) {
            console.log('✅ SimpleAuthGuard: On dashboard index, SKIPPING auth check to prevent loops');
            return;
        }

        // Only check for OTHER dashboard pages (not index)
        const isDashboardPage = currentPath.includes('/pages/carrier/') || 
                               currentPath.includes('/pages/shipper/') ||
                               currentPath.includes('/pages/messaging/');
        
        if (isDashboardPage) {
            // Wait a moment for all auth systems to initialize
            setTimeout(async () => {
                await this.checkAuth();
            }, 300);
        }
    }

    async checkAuth() {
        try {
            console.log('=== SimpleAuthGuard: Starting authentication check ===');
            console.log('Current path:', window.location.pathname);
            
            // Check if this is an authenticated navigation from dropdown
            const authNav = sessionStorage.getItem('authenticated_navigation');
            const navTimestamp = sessionStorage.getItem('nav_timestamp');
            
            if (authNav === 'true' && navTimestamp) {
                const timeSinceNav = Date.now() - parseInt(navTimestamp);
                console.log('Navigation time since click:', timeSinceNav, 'ms');
                
                if (timeSinceNav < 5000) { // 5 seconds window  
                    console.log('✅ SimpleAuthGuard: Authenticated navigation detected, allowing access');
                    // Clear the navigation markers
                    sessionStorage.removeItem('authenticated_navigation');
                    sessionStorage.removeItem('nav_timestamp');
                    return; // Allow access
                }
            }
            
            // Check for persistent authentication marker
            const userAuthenticated = sessionStorage.getItem('user_authenticated');
            const authTimestamp = sessionStorage.getItem('auth_timestamp');
            
            console.log('Checking persistent auth:', { userAuthenticated, authTimestamp });
            
            if (userAuthenticated === 'true' && authTimestamp) {
                const timeSinceAuth = Date.now() - parseInt(authTimestamp);
                console.log('Time since authentication:', timeSinceAuth, 'ms (', Math.round(timeSinceAuth / 1000 / 60), 'minutes)');
                
                if (timeSinceAuth < 24 * 60 * 60 * 1000) { // 24 hours validity
                    console.log('✅ SimpleAuthGuard: Persistent authentication marker found, allowing access');
                    return; // Allow access
                }
            }
            
            // Check if user has valid session data (more lenient check)
            const storedData = {
                email: sessionStorage.getItem('user_email'),
                id: sessionStorage.getItem('user_id'),
                type: sessionStorage.getItem('user_type'),
                name: sessionStorage.getItem('user_name')
            };
            
            console.log('Session data check:', storedData);
            
            if (storedData.email && storedData.id && storedData.type) {
                console.log('✅ SimpleAuthGuard: Valid session data found, allowing access');
                return; // Allow access based on session data
            }
            
            // Check localStorage backup
            try {
                const localUser = localStorage.getItem('fastship_user');
                if (localUser) {
                    const userData = JSON.parse(localUser);
                    const timeSinceAuth = Date.now() - userData.timestamp;
                    
                    if (userData.authenticated && timeSinceAuth < 7 * 24 * 60 * 60 * 1000) { // 7 days
                        console.log('✅ SimpleAuthGuard: Valid localStorage backup found, allowing access');
                        
                        // Restore session data
                        sessionStorage.setItem('user_email', userData.email);
                        sessionStorage.setItem('user_id', userData.id);
                        sessionStorage.setItem('user_name', userData.name);
                        sessionStorage.setItem('user_authenticated', 'true');
                        sessionStorage.setItem('auth_timestamp', Date.now().toString());
                        
                        return; // Allow access
                    }
                }
            } catch (e) {
                console.warn('LocalStorage check failed:', e);
            }
            
            // Check backup auth first (faster)
            if (window.backupAuth && window.backupAuth.isLoggedIn()) {
                console.log('SimpleAuthGuard: User authenticated via backup auth');
                return; // Allow access
            }
            
            // Wait for Supabase
            if (!window.supabaseClient) {
                await this.waitForSupabase();
            }

            // Get session from Supabase if available
            if (window.supabaseClient) {
                try {
                    const { data: { session }, error } = await window.supabaseClient.auth.getSession();
                    
                    if (error) {
                        console.warn('SimpleAuthGuard: Session error, checking alternatives:', error);
                    }
                    
                    if (session?.user) {
                        console.log('SimpleAuthGuard: User authenticated via Supabase:', session.user.email);
                        
                        // Store basic info
                        sessionStorage.setItem('user_email', session.user.email);
                        sessionStorage.setItem('user_id', session.user.id);
                        sessionStorage.setItem('user_name', session.user.email.split('@')[0]);
                        
                        // Set user type based on current path
                        const currentPath = window.location.pathname;
                        const userType = currentPath.includes('/carrier/') ? 'carrier' : 'shipper';
                        sessionStorage.setItem('user_type', userType);
                        
                        return; // All good, allow access
                    }
                } catch (supabaseError) {
                    console.warn('SimpleAuthGuard: Supabase check failed:', supabaseError);
                }
            }
            
            // No session - check if user just logged in
            const justLoggedIn = sessionStorage.getItem('justLoggedIn');
            if (justLoggedIn) {
                console.log('✅ SimpleAuthGuard: User just logged in, allowing access');
                sessionStorage.removeItem('justLoggedIn'); // Clean up
                return;
            }
            
            // Check stored session data - even email alone is enough
            const storedEmail = sessionStorage.getItem('user_email');
            if (storedEmail) {
                console.log('✅ SimpleAuthGuard: Found stored email, allowing access');
                
                // Ensure user_type is set
                if (!sessionStorage.getItem('user_type')) {
                    const currentPath = window.location.pathname;
                    const userType = currentPath.includes('/carrier/') ? 'carrier' : 'shipper';
                    sessionStorage.setItem('user_type', userType);
                    console.log('→ Set user_type based on path:', userType);
                }
                
                return;
            }
            
            // Only redirect if we're absolutely sure user is not authenticated
            console.log('❌ SimpleAuthGuard: No authentication found, redirecting...');
            this.redirectToLogin();
            
        } catch (error) {
            console.error('SimpleAuthGuard: Check failed, but allowing access:', error);
            // Allow access on any error
        }
    }

    async waitForSupabase(timeout = 3000) {
        const start = Date.now();
        while (!window.supabaseClient && (Date.now() - start) < timeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return !!window.supabaseClient;
    }

    redirectToLogin() {
        // Store current page to return to after login
        sessionStorage.setItem('returnUrl', window.location.pathname);
        
        // Show friendly message
        this.showMessage('يرجى تسجيل الدخول للوصول لهذه الصفحة');
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = '/pages/auth/login.html';
        }, 1500);
    }

    showMessage(text) {
        // Create simple toast message
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        toast.textContent = text;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SimpleAuthGuard();
});

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SimpleAuthGuard();
    });
} else {
    new SimpleAuthGuard();
}