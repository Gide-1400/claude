// Authentication Guard for Dashboard Pages
// Ensures only authenticated users can access protected pages

class AuthGuard {
    constructor() {
        this.init();
    }

    async init() {
        // Don't run on auth pages
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.includes('/auth/login') || 
                          currentPath.includes('/auth/register') ||
                          currentPath.includes('/auth/verification');
        
        if (isAuthPage) {
            return;
        }

        // Check if this is a protected dashboard page
        const isDashboardPage = currentPath.includes('/pages/carrier/') || 
                               currentPath.includes('/pages/shipper/') ||
                               currentPath.includes('/pages/messaging/');
        
        if (isDashboardPage) {
            await this.checkAuthentication();
        }
    }

    async checkAuthentication() {
        try {
            // Wait for Supabase to be ready
            if (!window.supabaseClient) {
                await this.waitForSupabase();
            }

            // Check session
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            
            if (error || !session?.user) {
                this.redirectToLogin();
                return;
            }

            // Verify user profile exists
            const { data: profile, error: profileError } = await window.supabaseClient
                .from('users')
                .select('user_type, name')
                .eq('auth_user_id', session.user.id)
                .single();

            if (profileError || !profile) {
                console.error('Profile not found:', profileError);
                this.redirectToLogin();
                return;
            }

            // Store user info for quick access
            sessionStorage.setItem('user_email', session.user.email);
            sessionStorage.setItem('user_id', session.user.id);
            sessionStorage.setItem('user_type', profile.user_type);
            sessionStorage.setItem('user_name', profile.name || session.user.email.split('@')[0]);

            // Check if user is on correct dashboard
            this.validateUserAccess(profile.user_type);

        } catch (error) {
            console.error('Authentication check failed:', error);
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
        
        // Show brief message before redirect
        this.showAlert('warning', 'يجب تسجيل الدخول للوصول إلى هذه الصفحة', 'Please login to access this page');
        
        setTimeout(() => {
            window.location.href = loginPath;
        }, 1500);
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