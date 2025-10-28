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

        // Only check for dashboard pages
        const isDashboardPage = currentPath.includes('/pages/carrier/') || 
                               currentPath.includes('/pages/shipper/') ||
                               currentPath.includes('/pages/messaging/');
        
        if (isDashboardPage) {
            await this.checkAuth();
        }
    }

    async checkAuth() {
        try {
            console.log('SimpleAuthGuard: Checking authentication...');
            
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
                console.log('SimpleAuthGuard: User just logged in, allowing access');
                return;
            }
            
            // Check stored session data
            const storedEmail = sessionStorage.getItem('user_email');
            if (storedEmail) {
                console.log('SimpleAuthGuard: Found stored session data, allowing access');
                return;
            }
            
            // Only redirect if we're absolutely sure user is not authenticated
            console.log('SimpleAuthGuard: No authentication found, redirecting...');
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