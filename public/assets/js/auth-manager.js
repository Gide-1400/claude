// Authentication Manager for Fast Shipment Platform
// نظام إدارة المصادقة لمنصة الشحنة السريعة

class AuthManager {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Check for existing session
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            await this.loadUserProfile();
        }
        
        // Setup auth state listener
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user;
                await this.loadUserProfile();
                this.handlePostLogin();
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.handleLogout();
            }
        });
        
        // Initialize forms
        this.initForms();
        this.initPasswordToggle();
        this.initUserTypeSelection();
        this.checkAuthState();
    }

    // Load user profile from public.users
    async loadUserProfile() {
        if (!this.currentUser) return;
        
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('auth_user_id', this.currentUser.id)
                .single();
            
            if (data) {
                // Store user profile in session
                const userProfile = {
                    ...data,
                    email: this.currentUser.email,
                    auth_id: this.currentUser.id
                };
                
                sessionStorage.setItem('userProfile', JSON.stringify(userProfile));
                this.updateUIWithUser(userProfile);
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    // Check authentication state
    checkAuthState() {
        const currentPath = window.location.pathname;
        const protectedPaths = ['/pages/carrier/', '/pages/shipper/', '/pages/messaging/'];
        const authPaths = ['/pages/auth/'];
        
        const isProtectedPage = protectedPaths.some(path => currentPath.includes(path));
        const isAuthPage = authPaths.some(path => currentPath.includes(path));
        
        if (isProtectedPage && !this.currentUser) {
            // Redirect to login if trying to access protected page without auth
            window.location.href = '/pages/auth/login.html';
        } else if (isAuthPage && this.currentUser) {
            // Redirect to dashboard if already logged in
            this.redirectToDashboard();
        }
    }

    // Initialize forms
    initForms() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    // Handle login
    async handleLogin(e) {
        e.preventDefault();
        
        const form = e.target;
        const email = form.email.value;
        const password = form.password.value;
        const rememberMe = form.rememberMe?.checked || false;
        
        try {
            // Show loading state
            this.showLoading(true);
            
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password,
                options: {
                    // Keep session for 7 days if remember me is checked
                    expiresIn: rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24
                }
            });
            
            if (error) throw error;
            
            // Session is automatically handled by Supabase
            // User will be redirected in onAuthStateChange
            
            this.showAlert('success', 'تم تسجيل الدخول بنجاح', 'Login successful');
            
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert('error', 
                'خطأ في تسجيل الدخول: ' + (error.message || 'حاول مرة أخرى'),
                'Login error: ' + (error.message || 'Please try again')
            );
        } finally {
            this.showLoading(false);
        }
    }

    // Handle registration
    async handleRegister(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Get user type
        const activeTypeOption = document.querySelector('.type-option.active');
        const userType = activeTypeOption ? activeTypeOption.getAttribute('data-type') : null;
        
        if (!userType) {
            this.showAlert('error', 'الرجاء اختيار نوع الحساب', 'Please select account type');
            return;
        }
        
        // Prepare registration data
        const registrationData = {
            email: formData.get('email'),
            password: formData.get('password'),
            options: {
                data: {
                    name: formData.get('name'),
                    phone: formData.get('phone'),
                    user_type: userType,
                    carrier_type: userType === 'carrier' ? formData.get('carrierType') : null,
                    shipper_type: userType === 'shipper' ? formData.get('shipperType') : null,
                    company_name: formData.get('companyName'),
                    commercial_register: formData.get('commercialRegister')
                }
            }
        };
        
        try {
            this.showLoading(true);
            
            // Sign up with Supabase Auth
            const { data: authData, error: authError } = await this.supabase.auth.signUp(registrationData);
            
            if (authError) throw authError;
            
            // Create user profile in public.users
            if (authData.user) {
                const { error: profileError } = await this.supabase
                    .from('users')
                    .insert({
                        auth_user_id: authData.user.id,
                        email: registrationData.email,
                        name: registrationData.options.data.name,
                        phone: registrationData.options.data.phone,
                        user_type: userType,
                        carrier_type: registrationData.options.data.carrier_type,
                        shipper_type: registrationData.options.data.shipper_type,
                        metadata: {
                            company_name: registrationData.options.data.company_name,
                            commercial_register: registrationData.options.data.commercial_register
                        },
                        is_active: true
                    });
                
                if (profileError) {
                    console.error('Profile creation error:', profileError);
                }
            }
            
            this.showAlert('success', 
                'تم إنشاء الحساب بنجاح! تحقق من بريدك الإلكتروني للتفعيل',
                'Account created successfully! Check your email for verification'
            );
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = '/pages/auth/login.html';
            }, 3000);
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showAlert('error',
                'خطأ في إنشاء الحساب: ' + (error.message || 'حاول مرة أخرى'),
                'Registration error: ' + (error.message || 'Please try again')
            );
        } finally {
            this.showLoading(false);
        }
    }

    // Handle post-login actions
    handlePostLogin() {
        // Check if we're on login page
        if (window.location.pathname.includes('/pages/auth/login.html')) {
            this.redirectToDashboard();
        }
    }

    // Redirect to appropriate dashboard
    async redirectToDashboard() {
        const userProfile = JSON.parse(sessionStorage.getItem('userProfile'));
        
        if (userProfile) {
            if (userProfile.user_type === 'carrier') {
                window.location.href = '/pages/carrier/index.html';
            } else if (userProfile.user_type === 'shipper') {
                window.location.href = '/pages/shipper/index.html';
            } else {
                window.location.href = '/index.html';
            }
        } else {
            // Load profile first
            await this.loadUserProfile();
            // Try again
            const profile = JSON.parse(sessionStorage.getItem('userProfile'));
            if (profile) {
                if (profile.user_type === 'carrier') {
                    window.location.href = '/pages/carrier/index.html';
                } else if (profile.user_type === 'shipper') {
                    window.location.href = '/pages/shipper/index.html';
                } else {
                    window.location.href = '/index.html';
                }
            } else {
                window.location.href = '/index.html';
            }
        }
    }

    // Handle logout
    async handleLogout() {
        try {
            await this.supabase.auth.signOut();
            
            // Clear all stored data
            sessionStorage.clear();
            localStorage.removeItem('fast-shipment-auth');
            
            // Redirect to home
            window.location.href = '/index.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Update UI with user data
    updateUIWithUser(userProfile) {
        // Update user name in header
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(element => {
            element.textContent = userProfile.name || userProfile.email;
        });
        
        // Update user role
        const userRoleElements = document.querySelectorAll('.user-role');
        userRoleElements.forEach(element => {
            const roleText = {
                'carrier': { ar: 'موصل شحنات', en: 'Shipment Carrier' },
                'shipper': { ar: 'صاحب شحنة', en: 'Shipper' }
            };
            
            const currentLang = document.documentElement.lang || 'ar';
            element.textContent = roleText[userProfile.user_type]?.[currentLang] || '';
        });
        
        // Show/hide auth buttons
        const authButtons = document.querySelector('.auth-buttons');
        const userMenu = document.querySelector('.user-menu');
        
        if (authButtons) {
            authButtons.style.display = 'none';
        }
        
        if (userMenu) {
            userMenu.style.display = 'flex';
        }
    }

    // Initialize password toggle
    initPasswordToggle() {
        const toggleButtons = document.querySelectorAll('.toggle-password');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const passwordInput = document.getElementById(targetId);
                const icon = this.querySelector('i');
                
                if (passwordInput) {
                    if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        if (icon) {
                            icon.classList.remove('fa-eye');
                            icon.classList.add('fa-eye-slash');
                        }
                    } else {
                        passwordInput.type = 'password';
                        if (icon) {
                            icon.classList.remove('fa-eye-slash');
                            icon.classList.add('fa-eye');
                        }
                    }
                }
            });
        });
    }

    // Initialize user type selection
    initUserTypeSelection() {
        const typeOptions = document.querySelectorAll('.type-option');
        const carrierSubtype = document.getElementById('carrierSubtype');
        const shipperSubtype = document.getElementById('shipperSubtype');
        
        typeOptions.forEach(option => {
            option.addEventListener('click', function() {
                typeOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                
                const userType = this.getAttribute('data-type');
                
                if (userType === 'carrier') {
                    if (carrierSubtype) {
                        carrierSubtype.style.display = 'block';
                        carrierSubtype.querySelector('select').required = true;
                    }
                    if (shipperSubtype) {
                        shipperSubtype.style.display = 'none';
                        shipperSubtype.querySelector('select').required = false;
                    }
                } else if (userType === 'shipper') {
                    if (carrierSubtype) {
                        carrierSubtype.style.display = 'none';
                        carrierSubtype.querySelector('select').required = false;
                    }
                    if (shipperSubtype) {
                        shipperSubtype.style.display = 'block';
                        shipperSubtype.querySelector('select').required = true;
                    }
                }
            });
        });
    }

    // Show alert message
    showAlert(type, messageAr, messageEn) {
        const alertContainer = document.getElementById('alertContainer') || this.createAlertContainer();
        const currentLang = document.documentElement.lang || 'ar';
        const message = currentLang === 'ar' ? messageAr : messageEn;
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} show`;
        alert.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        alertContainer.appendChild(alert);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 300);
        }, 5000);
    }

    // Create alert container if not exists
    createAlertContainer() {
        const container = document.createElement('div');
        container.id = 'alertContainer';
        container.className = 'alert-container';
        document.body.appendChild(container);
        return container;
    }

    // Show/hide loading state
    showLoading(show) {
        let loader = document.getElementById('globalLoader');
        
        if (show) {
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'globalLoader';
                loader.className = 'global-loader';
                loader.innerHTML = `
                    <div class="loader-content">
                        <div class="spinner"></div>
                        <span data-lang="ar">جاري التحميل...</span>
                        <span data-lang="en" style="display: none;">Loading...</span>
                    </div>
                `;
                document.body.appendChild(loader);
            }
            loader.classList.add('show');
        } else {
            if (loader) {
                loader.classList.remove('show');
                setTimeout(() => loader.remove(), 300);
            }
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get user profile
    getUserProfile() {
        const profile = sessionStorage.getItem('userProfile');
        return profile ? JSON.parse(profile) : null;
    }
}

// Initialize auth manager on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
