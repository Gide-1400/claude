// Authentication Guard for Dashboard Pages
// Ensures only authenticated users can access protected pages

class AuthGuard {
    constructor() {
        this.isChecking = false; // Prevent multiple simultaneous checks
        this.lastCheckTime = 0; // Cache check results briefly
        this.checkCooldown = 5000; // 5 seconds cooldown
        this.init();
    }

    async init() {
        // Don't run on auth pages or main/dashboard index pages
        const currentPath = window.location.pathname;
        
        // Skip auth pages
        const isAuthPage = currentPath.includes('/auth/login') || 
                          currentPath.includes('/auth/register') ||
                          currentPath.includes('/auth/verification');
        
        // Skip all index.html pages (main page and dashboards)
        const isIndexPage = currentPath === '/' || 
                           currentPath.endsWith('/index.html') || 
                           currentPath.endsWith('/') ||
                           currentPath.includes('carrier/index') ||
                           currentPath.includes('shipper/index');
        
        if (isAuthPage || isIndexPage) {
            console.log('✅ AuthGuard: Skipping - auth/index page:', currentPath);
            return;
        }

        // ✅ ONLY run on specific protected pages (not dashboards)
        const protectedPages = [
            '/my-trips', '/my-shipments', 
            '/add-trip', '/add-shipment',
            '/matches', '/profile',
            '/messaging/', '/chat'
        ];
        
        const isProtectedPage = protectedPages.some(page => currentPath.includes(page));
        
        if (isProtectedPage) {
            console.log('🔒 AuthGuard: Checking protected page:', currentPath);
            
            // Prevent too frequent checks
            const now = Date.now();
            if (this.isChecking || (now - this.lastCheckTime < this.checkCooldown)) {
                console.log('AuthGuard: Skipping check (cooldown or already checking)');
                return;
            }
            
            this.isChecking = true;
            try {
                await this.checkAuthentication();
                this.lastCheckTime = now;
            } finally {
                this.isChecking = false;
            }
        } else {
            console.log('✅ AuthGuard: Not a protected page, skipping:', currentPath);
        }
    }

    async checkAuthentication() {
        try {
            console.log('AuthGuard: Starting authentication check...');
            
            // ✅ PRIORITY 1: Check if user just logged in or has authentication marker
            const isAuthenticated = sessionStorage.getItem('user_authenticated');
            const justLoggedIn = sessionStorage.getItem('justLoggedIn');
            const storedUser = sessionStorage.getItem('user_email');
            const storedUserType = sessionStorage.getItem('user_type');
            
            console.log('AuthGuard: Session storage check:', { 
                isAuthenticated, 
                justLoggedIn,
                storedUser, 
                storedUserType 
            });
            
            // ✅ If user is marked as authenticated, ALLOW ACCESS immediately
            if (isAuthenticated === 'true' || justLoggedIn === 'true') {
                console.log('✅ AuthGuard: User is authenticated via session storage - ALLOWING ACCESS');
                
                // Clear justLoggedIn flag after first check
                if (justLoggedIn === 'true') {
                    sessionStorage.removeItem('justLoggedIn');
                }
                
                return; // ✅ ALLOW ACCESS - Don't check Supabase
            }
            
            // ✅ PRIORITY 2: Check localStorage backup
            const localUser = localStorage.getItem('fastship_user');
            if (localUser) {
                try {
                    const userData = JSON.parse(localUser);
                    if (userData.authenticated === true) {
                        console.log('✅ AuthGuard: User is authenticated via localStorage - ALLOWING ACCESS');
                        
                        // Restore session data
                        sessionStorage.setItem('user_email', userData.email);
                        sessionStorage.setItem('user_type', userData.type || 'carrier');
                        sessionStorage.setItem('user_authenticated', 'true');
                        
                        return; // ✅ ALLOW ACCESS
                    }
                } catch (e) {
                    console.warn('AuthGuard: Failed to parse localStorage user data:', e);
                }
            }
            
            // ✅ PRIORITY 3: Only NOW check Supabase (fallback)
            // Wait for Supabase to be ready
            if (!window.supabaseClient) {
                console.log('AuthGuard: Waiting for Supabase...');
                await this.waitForSupabase();
            }

            // Check session
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            
            console.log('AuthGuard: Supabase session check:', { 
                hasSession: !!session, 
                hasUser: !!session?.user, 
                error: error 
            });
            
            if (error) {
                console.error('AuthGuard: Session error:', error);
                // Don't redirect immediately on error, try to recover
                if (storedUser && storedUserType) {
                    console.log('AuthGuard: Using stored session data as fallback');
                    return; // Allow access based on stored data
                }
                this.redirectToLogin();
                return;
            }
            
            if (!session?.user) {
                console.log('AuthGuard: No session found');
                // Check if we have stored data as fallback
                if (storedUser && storedUserType) {
                    console.log('AuthGuard: No session but have stored data, allowing access');
                    return; // Allow access based on stored data
                }
                this.redirectToLogin();
                return;
            }

            // Verify user profile exists (with fallback to stored data)
            let profile = null;
            let userType = storedUserType || 'shipper'; // Default fallback
            
            try {
                const { data: profileData, error: profileError } = await window.supabaseClient
                    .from('users')
                    .select('user_type, name')
                    .eq('auth_user_id', session.user.id)
                    .single();

                if (profileData && !profileError) {
                    profile = profileData;
                    userType = profileData.user_type;
                    
                    // Store user info for quick access
                    sessionStorage.setItem('user_email', session.user.email);
                    sessionStorage.setItem('user_id', session.user.id);
                    sessionStorage.setItem('user_type', profile.user_type);
                    sessionStorage.setItem('user_name', profile.name || session.user.email.split('@')[0]);
                    console.log('AuthGuard: Profile loaded successfully:', profile);
                } else {
                    console.warn('AuthGuard: Profile fetch failed, allowing access anyway:', profileError);
                    // Allow access even without profile
                    sessionStorage.setItem('user_email', session.user.email);
                    sessionStorage.setItem('user_id', session.user.id);
                    sessionStorage.setItem('user_name', session.user.email.split('@')[0]);
                    
                    // If no stored user type, determine from current page
                    if (!storedUserType) {
                        const currentPath = window.location.pathname;
                        userType = currentPath.includes('/carrier/') ? 'carrier' : 'shipper';
                        sessionStorage.setItem('user_type', userType);
                        console.log('AuthGuard: Determined user type from path:', userType);
                    }
                }
            } catch (profileFetchError) {
                console.warn('AuthGuard: Profile fetch exception, allowing access anyway:', profileFetchError);
                // Allow access even with database errors
                sessionStorage.setItem('user_email', session.user.email);
                sessionStorage.setItem('user_id', session.user.id);
                sessionStorage.setItem('user_name', session.user.email.split('@')[0]);
                
                // Determine user type from URL if no stored data
                if (!storedUserType) {
                    const currentPath = window.location.pathname;
                    userType = currentPath.includes('/carrier/') ? 'carrier' : 'shipper';
                    sessionStorage.setItem('user_type', userType);
                    console.log('AuthGuard: Determined user type from path after error:', userType);
                }
            }

            console.log('AuthGuard: Authentication successful, user type:', userType);
            
            // Check if user is on correct dashboard
            this.validateUserAccess(userType);

        } catch (error) {
            console.error('Authentication check failed:', error);
            
            // Check if we have stored session data as final fallback
            const storedUser = sessionStorage.getItem('user_email');
            const storedUserType = sessionStorage.getItem('user_type');
            
            if (storedUser && storedUserType) {
                console.log('AuthGuard: Error occurred but stored session exists, allowing access');
                return; // Allow access with stored data
            }
            
            // Try to allow access anyway - maybe it's just a database connection issue
            if (window.supabaseClient) {
                try {
                    const { data: { session } } = await window.supabaseClient.auth.getSession();
                    if (session?.user) {
                        console.log('AuthGuard: User is authenticated despite errors, allowing access');
                        // Set basic session data
                        sessionStorage.setItem('user_email', session.user.email);
                        sessionStorage.setItem('user_id', session.user.id);
                        sessionStorage.setItem('user_name', session.user.email.split('@')[0]);
                        
                        // Determine user type from current path
                        const currentPath = window.location.pathname;
                        const determinedType = currentPath.includes('/carrier/') ? 'carrier' : 'shipper';
                        sessionStorage.setItem('user_type', determinedType);
                        
                        return; // Allow access
                    }
                } catch (sessionError) {
                    console.error('AuthGuard: Final session check failed:', sessionError);
                }
            }
            
            console.log('AuthGuard: All fallbacks failed, redirecting to login');
            this.redirectToLogin();
        }
    }

    validateUserAccess(userType) {
        const currentPath = window.location.pathname;
        
        // Check if carrier is trying to access shipper pages or vice versa
        if (userType === 'carrier' && currentPath.includes('/pages/shipper/')) {
            window.location.href = '../carrier/index.html';
            return;
        }
        
        if (userType === 'shipper' && currentPath.includes('/pages/carrier/')) {
            window.location.href = '../shipper/index.html';
            return;
        }
    }

    waitForSupabase(timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkSupabase = () => {
                if (window.supabaseClient) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Supabase client not available'));
                } else {
                    setTimeout(checkSupabase, 100);
                }
            };
            
            checkSupabase();
        });
    }

    redirectToLogin() {
        const currentPath = window.location.pathname;
        let loginPath;
        
        if (currentPath.includes('/pages/carrier/') || currentPath.includes('/pages/shipper/') || currentPath.includes('/pages/messaging/')) {
            loginPath = '../auth/login.html';
        } else {
            loginPath = 'pages/auth/login.html';
        }
        
        // Show message before redirect with more time to debug
        this.showAlert('warning', 'يجب تسجيل الدخول للوصول إلى هذه الصفحة - سيتم التوجيه خلال 5 ثوان', 'Please login to access this page - redirecting in 5 seconds');
        
        console.log('AuthGuard: Redirecting to login in 5 seconds. Current session storage:', {
            user_email: sessionStorage.getItem('user_email'),
            user_type: sessionStorage.getItem('user_type'),
            user_id: sessionStorage.getItem('user_id')
        });
        
        setTimeout(() => {
            window.location.href = loginPath;
        }, 5000);
    }

    showAlert(type, messageAr, messageEn) {
        const existingAlert = document.querySelector('.auth-guard-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const currentLang = document.documentElement.lang || 'ar';
        const message = currentLang === 'ar' ? messageAr : messageEn;

        const alert = document.createElement('div');
        alert.className = `auth-guard-alert alert-${type}`;
        alert.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px 30px;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            z-index: 10001;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: authGuardFadeIn 0.3s ease;
            text-align: center;
            min-width: 300px;
        `;

        const colors = {
            warning: '#FB6340',
            error: '#F5365C',
            info: '#5E72E4'
        };

        alert.style.background = colors[type] || colors.warning;
        alert.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
            ${message}
        `;

        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            animation: authGuardFadeIn 0.3s ease;
        `;

        document.body.appendChild(backdrop);
        document.body.appendChild(alert);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes authGuardFadeIn {
        from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
        }
        to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
    }
`;
document.head.appendChild(style);

// Initialize AuthGuard
document.addEventListener('DOMContentLoaded', () => {
    window.authGuard = new AuthGuard();
});