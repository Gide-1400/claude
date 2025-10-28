// Enhanced Authentication Manager for Fast Shipment Platform
// Handles authentication state, session management, and user routing

class AuthManager {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentUser = null;
        this.sessionCheckInterval = null;
        this.init();
    }

    async init() {
        if (!this.supabase) {
            console.error('Supabase client not initialized');
            return;
        }

        // Check initial session
        await this.checkSession();
        
        // Set up auth state listener
        this.setupAuthListener();
        
        // Periodic session check (every 30 seconds)
        this.sessionCheckInterval = setInterval(() => {
            this.checkSession();
        }, 30000);
    }

    setupAuthListener() {
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);
            
            if (event === 'SIGNED_IN' && session) {
                await this.handleSignIn(session);
            } else if (event === 'SIGNED_OUT') {
                this.handleSignOut();
            } else if (event === 'TOKEN_REFRESHED') {
                console.log('Token refreshed successfully');
            }
        });
    }

    async checkSession() {
        try {
            // Don't redirect if we're on login/register pages
            const currentPath = window.location.pathname;
            const isAuthPage = currentPath.includes('/auth/login') || 
                              currentPath.includes('/auth/register') ||
                              currentPath.includes('/auth/verification');
            
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('Session check error:', error);
                return null;
            }

            if (session?.user) {
                // Update current user
                await this.loadUserProfile(session.user.id);
                return this.currentUser;
            } else {
                // No active session - check if we're on a protected page
                // BUT don't redirect if we're on auth pages
                if (isAuthPage) {
                    return null;
                }
                
                const protectedPaths = ['/pages/carrier/', '/pages/shipper/', '/pages/messaging/'];
                const isProtected = protectedPaths.some(path => currentPath.includes(path));
                
                if (isProtected) {
                    this.redirectToLogin();
                }
                
                return null;
            }
        } catch (error) {
            console.error('Error checking session:', error);
            return null;
        }
    }

    async handleSignIn(session) {
        if (!session?.user) return;
        
        await this.loadUserProfile(session.user.id);
        
        // Store safe user info
        this.storeSafeUserInfo();
    }

    handleSignOut() {
        this.currentUser = null;
        this.clearStoredUserInfo();
        
        // Redirect to home or login
        const currentPath = window.location.pathname;
        if (!currentPath.includes('index.html') && !currentPath.includes('/auth/')) {
            this.redirectToLogin();
        }
    }

    async loadUserProfile(authUserId) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('auth_user_id', authUserId)
                .single();

            if (error) {
                // Try by id as fallback
                const { data: data2, error: err2 } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUserId)
                    .single();
                
                if (err2) {
                    console.error('Error loading user profile:', err2);
                    return;
                }
                
                if (data2) {
                    this.currentUser = {
                        id: data2.id,
                        auth_user_id: data2.auth_user_id,
                        email: data2.email,
                        name: data2.name,
                        phone: data2.phone,
                        user_type: data2.user_type,
                        carrier_type: data2.carrier_type,
                        shipper_type: data2.shipper_type,
                        verification_status: data2.verification_status,
                        created_at: data2.created_at
                    };
                }
                return;
            }

            if (data) {
                this.currentUser = {
                    id: data.id,
                    auth_user_id: data.auth_user_id,
                    email: data.email,
                    name: data.name,
                    phone: data.phone,
                    user_type: data.user_type,
                    carrier_type: data.carrier_type,
                    shipper_type: data.shipper_type,
                    verification_status: data.verification_status,
                    created_at: data.created_at
                };
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    storeSafeUserInfo() {
        if (!this.currentUser) return;
        
        const safeInfo = {
            id: this.currentUser.id,
            email: this.currentUser.email,
            name: this.currentUser.name,
            user_type: this.currentUser.user_type,
            carrier_type: this.currentUser.carrier_type,
            shipper_type: this.currentUser.shipper_type
        };
        
        try {
            sessionStorage.setItem('fastship_user', JSON.stringify(safeInfo));
        } catch (error) {
            console.error('Error storing user info:', error);
        }
    }

    clearStoredUserInfo() {
        sessionStorage.removeItem('fastship_user');
        localStorage.removeItem('fastship_user');
    }

    getUserProfile() {
        return this.currentUser;
    }

    getStoredUserInfo() {
        try {
            const stored = sessionStorage.getItem('fastship_user');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            return null;
        }
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    requireAuth() {
        if (!this.isAuthenticated()) {
            this.redirectToLogin();
            return false;
        }
        return true;
    }

    requireUserType(requiredType) {
        if (!this.requireAuth()) return false;
        
        if (this.currentUser.user_type !== requiredType) {
            this.showAlert('error', 
                'لا يمكنك الوصول إلى هذه الصفحة',
                'You cannot access this page'
            );
            this.redirectToDashboard();
            return false;
        }
        
        return true;
    }

    redirectToLogin() {
        const currentPath = window.location.pathname;
        const relativePath = this.getRelativePath(currentPath, '/pages/auth/login.html');
        window.location.href = relativePath;
    }

    redirectToDashboard() {
        if (!this.currentUser) {
            this.redirectToLogin();
            return;
        }

        const currentPath = window.location.pathname;
        let dashboardPath;
        
        if (this.currentUser.user_type === 'carrier') {
            dashboardPath = '/pages/carrier/index.html';
        } else if (this.currentUser.user_type === 'shipper') {
            dashboardPath = '/pages/shipper/index.html';
        } else {
            dashboardPath = '/index.html';
        }
        
        const relativePath = this.getRelativePath(currentPath, dashboardPath);
        window.location.href = relativePath;
    }

    getRelativePath(currentPath, targetPath) {
        // Calculate relative path based on current location
        const currentDepth = (currentPath.match(/\//g) || []).length;
        const targetDepth = (targetPath.match(/\//g) || []).length;
        
        let relativePath = '';
        
        if (currentPath.includes('/pages/carrier/') || currentPath.includes('/pages/shipper/') || currentPath.includes('/pages/messaging/')) {
            // In a nested page
            if (targetPath.startsWith('/pages/')) {
                relativePath = '../' + targetPath.split('/pages/')[1];
            } else {
                relativePath = '../../' + targetPath.substring(1);
            }
        } else if (currentPath.includes('/pages/auth/')) {
            // In auth page
            if (targetPath.startsWith('/pages/')) {
                relativePath = '../' + targetPath.split('/pages/')[1];
            } else {
                relativePath = '../../' + targetPath.substring(1);
            }
        } else if (currentPath.includes('/pages/general/')) {
            // In general page
            if (targetPath.startsWith('/pages/')) {
                relativePath = '../' + targetPath.split('/pages/')[1];
            } else {
                relativePath = '../../' + targetPath.substring(1);
            }
        } else {
            // At root level
            relativePath = targetPath.substring(1);
        }
        
        return relativePath;
    }

    async handleLogout() {
        try {
            const { error } = await this.supabase.auth.signOut();
            
            if (error) throw error;
            
            this.showAlert('success', 
                'تم تسجيل الخروج بنجاح',
                'Logged out successfully'
            );
            
            // Clear interval
            if (this.sessionCheckInterval) {
                clearInterval(this.sessionCheckInterval);
            }
            
            setTimeout(() => {
                window.location.href = this.getRelativePath(window.location.pathname, '/index.html');
            }, 1000);
            
        } catch (error) {
            console.error('Logout error:', error);
            this.showAlert('error',
                'حدث خطأ أثناء تسجيل الخروج',
                'Error during logout'
            );
        }
    }

    showAlert(type, messageAr, messageEn) {
        // Remove existing alerts
        const existingAlert = document.querySelector('.alert-message');
        if (existingAlert) {
            existingAlert.remove();
        }

        const currentLang = document.documentElement.lang || 'ar';
        const message = currentLang === 'ar' ? messageAr : messageEn;

        const alert = document.createElement('div');
        alert.className = `alert-message alert-${type}`;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            left: 20px;
            max-width: 500px;
            margin: 0 auto;
            padding: 15px 20px;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
            animation: slideDown 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;

        const colors = {
            success: '#2DCE89',
            error: '#F5365C',
            warning: '#FB6340',
            info: '#5E72E4'
        };

        alert.style.background = colors[type] || colors.info;

        const messageSpan = document.createElement('span');
        messageSpan.innerHTML = message;

        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeButton.onclick = () => alert.remove();

        alert.appendChild(messageSpan);
        alert.appendChild(closeButton);

        document.body.appendChild(alert);

        setTimeout(() => {
            if (alert.parentElement) {
                alert.style.animation = 'slideUp 0.3s ease';
                setTimeout(() => alert.remove(), 300);
            }
        }, 5000);
    }

    destroy() {
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
        }
    }
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideUp {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize auth manager globally (but NOT on auth pages)
const currentPath = window.location.pathname;
const isAuthPage = currentPath.includes('/auth/login') || 
                   currentPath.includes('/auth/register') ||
                   currentPath.includes('/auth/verification');

if (!isAuthPage) {
    window.authManager = new AuthManager();
    console.log('✅ AuthManager initialized');
} else {
    console.log('⏭️ AuthManager skipped on auth page');
    // Create a dummy authManager for auth pages to prevent errors
    window.authManager = {
        getUserProfile: () => null,
        handleLogout: async () => {
            try {
                await window.supabaseClient.auth.signOut();
                window.location.href = '../../index.html';
            } catch (e) {
                console.error(e);
            }
        }
    };
}

// Expose for backward compatibility
window.checkAuth = () => window.authManager?.checkSession ? window.authManager.checkSession() : null;
window.logout = () => window.authManager?.handleLogout ? window.authManager.handleLogout() : null;
