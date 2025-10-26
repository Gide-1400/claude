// Authentication JavaScript for Fast Shipment Platform

document.addEventListener('DOMContentLoaded', function() {
    initAuth();
});

function initAuth() {
    // Initialize form functionality
    initForms();
    
    // Initialize user type selection
    initUserTypeSelection();
    
    // Initialize password toggling
    initPasswordToggle();
}

// Ensure supabase client exists
function ensureSupabase() {
    if (!window.supabase) {
        console.error('Supabase client is not initialized. Make sure createClient(...) is called and assigned to window.supabase');
        showAlert('error', 'خطأ في التهيئة: عميل Supabase غير موجود', 'Initialization error: Supabase client not found');
        throw new Error('Supabase client not initialized');
    }
}

// Form initialization
function initForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// User type selection
function initUserTypeSelection() {
    const typeOptions = document.querySelectorAll('.type-option');
    const carrierSubtype = document.getElementById('carrierSubtype');
    const shipperSubtype = document.getElementById('shipperSubtype');
    
    if (typeOptions.length > 0) {
        typeOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remove active class from all options
                typeOptions.forEach(opt => opt.classList.remove('active'));
                
                // Add active class to clicked option
                this.classList.add('active');
                
                const userType = this.getAttribute('data-type');
                
                // Show/hide appropriate subtype sections
                if (userType === 'carrier') {
                    if (carrierSubtype) carrierSubtype.style.display = 'block';
                    if (shipperSubtype) shipperSubtype.style.display = 'none';
                    const c = document.getElementById('carrierType');
                    const s = document.getElementById('shipperType');
                    if (c) c.required = true;
                    if (s) s.required = false;
                } else {
                    if (carrierSubtype) carrierSubtype.style.display = 'none';
                    if (shipperSubtype) shipperSubtype.style.display = 'block';
                    const c = document.getElementById('carrierType');
                    const s = document.getElementById('shipperType');
                    if (c) c.required = false;
                    if (s) s.required = true;
                }
            });
        });
    }
}

// Password toggle functionality
function initPasswordToggle() {
    const togglePassword = document.getElementById('togglePassword');
    
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const icon = this.querySelector('i');
            
            if (!passwordInput) return;
            
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
        });
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    try {
        ensureSupabase();
    } catch (err) {
        return;
    }
    
    const form = e.target;
    const formData = new FormData(form);
    const email = (formData.get('email') || '').toString().trim();
    const password = (formData.get('password') || '').toString();
    const rememberMe = formData.get('rememberMe');
    
    // Basic validation
    if (!email || !password) {
        showAlert('error', 'يرجى ملء جميع الحقول المطلوبة', 'Please fill all required fields');
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('.btn-auth');
    const originalText = submitBtn ? submitBtn.innerHTML : null;
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التسجيل...';
        submitBtn.disabled = true;
    }
    
    try {
        // Use supabase-js v2+ method for password sign-in
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // data contains { user, session }
        const user = data?.user ?? null;
        const session = data?.session ?? null;
        
        if (!user) {
            throw new Error('No user returned from authentication');
        }
        
        // Success - redirect to dashboard
        showAlert('success', 'تم تسجيل الدخول بنجاح', 'Login successful');
        
        // Store user session - prefer session object if available
        const storeData = session ?? user;
        if (rememberMe) {
            localStorage.setItem('userSession', JSON.stringify(storeData));
        } else {
            sessionStorage.setItem('userSession', JSON.stringify(storeData));
        }
        
        // Redirect based on user type (modify as needed)
        setTimeout(() => {
            // Example: redirect to carrier dashboard; customize per your app logic
            window.location.href = '../carrier/index.html';
        }, 1200);
        
    } catch (error) {
        console.error('Login error:', error);
        const msg = error?.message || String(error);
        showAlert('error', 'خطأ في تسجيل الدخول: ' + msg, 'Login error: ' + msg);
    } finally {
        // Reset button state
        if (submitBtn && originalText !== null) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Handle register form submission
async function handleRegister(e) {
    e.preventDefault();
    
    try {
        ensureSupabase();
    } catch (err) {
        return;
    }
    
    const form = e.target;
    const formData = new FormData(form);
    
    const fullName = (formData.get('fullName') || '').toString().trim();
    const email = (formData.get('email') || '').toString().trim();
    const phone = (formData.get('phone') || '').toString().trim();
    const password = (formData.get('password') || '').toString();
    const confirmPassword = (formData.get('confirmPassword') || '').toString();
    const userType = document.querySelector('.type-option.active')?.getAttribute('data-type');
    const carrierType = (formData.get('carrierType') || '').toString();
    const shipperType = (formData.get('shipperType') || '').toString();
    const agreeTerms = formData.get('agreeTerms');
    
    // Validation
    if (!fullName || !email || !phone || !password || !confirmPassword || !userType || !agreeTerms) {
        showAlert('error', 'يرجى ملء جميع الحقول المطلوبة', 'Please fill all required fields');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('error', 'كلمات المرور غير متطابقة', 'Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        showAlert('error', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'Password must be at least 6 characters');
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('.btn-auth');
    const originalText = submitBtn ? submitBtn.innerHTML : null;
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري إنشاء الحساب...';
        submitBtn.disabled = true;
    }
    
    try {
        // Create user in Supabase Auth (v2 signUp)
        const { data: signUpData, error: authError } = await window.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                // You can add email_redirect_to or data here if needed
            }
        });
        
        if (authError) throw authError;
        
        const createdUser = signUpData?.user ?? null;
        const createdSession = signUpData?.session ?? null;
        
        if (!createdUser) {
            // In some setups signUp returns only confirmation info; handle accordingly
            showAlert('success', 'تم إرسال رسالة تفعيل الحساب إلى بريدك الإلكتروني', 'Verification email sent');
        }
        
        // Create user profile in database if user id is available
        if (createdUser?.id) {
            const userData = {
                id: createdUser.id,
                email: email,
                name: fullName,
                phone: phone,
                user_type: userType,
                carrier_type: userType === 'carrier' ? carrierType : null,
                shipper_type: userType === 'shipper' ? shipperType : null
            };

            const { data, error: dbError } = await window.supabase
                .from('users')
                .insert([userData]);
            
            if (dbError) throw dbError;
        }
        
        // Success
        showAlert('success', 'تم إنشاء الحساب بنجاح! يرجى تفعيل حسابك عبر البريد الإلكتروني', 'Account created successfully! Please verify your email');
        
        // Redirect to verification page
        setTimeout(() => {
            window.location.href = 'verification.html';
        }, 1600);
        
    } catch (error) {
        console.error('Registration error:', error);
        let msgAr = error?.message || String(error);
        let msgEn = error?.message || String(error);
        
        // Handle specific Supabase auth errors
        if (msgAr.includes('User already registered')) {
            msgAr = 'هذا البريد الإلكتروني مسجل بالفعل. يرجى <a href="login.html" style="color: white; text-decoration: underline;">تسجيل الدخول</a> أو استخدام بريد إلكتروني مختلف';
            msgEn = 'This email is already registered. Please <a href="login.html" style="color: white; text-decoration: underline;">sign in</a> or use a different email';
        } else if (msgAr.includes('AuthApiError')) {
            // Generic auth error message
            msgAr = 'حدث خطأ في التسجيل. يرجى التحقق من البيانات والمحاولة مرة أخرى';
            msgEn = 'An error occurred during registration. Please check your data and try again';
        }
        
        showAlert('error', 'خطأ في إنشاء الحساب: ' + msgAr, 'Registration error: ' + msgEn);
    } finally {
        // Reset button state
        if (submitBtn && originalText !== null) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Show alert message
function showAlert(type, messageAr, messageEn) {
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
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    if (type === 'success') {
        alert.style.background = 'var(--success)';
    } else if (type === 'error') {
        alert.style.background = 'var(--secondary)';
    } else {
        alert.style.background = 'var(--primary)';
    }
    
    // Create alert content with HTML support
    const alertContent = document.createElement('div');
    alertContent.style.display = 'flex';
    alertContent.style.alignItems = 'center';
    alertContent.style.justifyContent = 'space-between';
    
    const messageSpan = document.createElement('span');
    messageSpan.innerHTML = message; // Use innerHTML to allow HTML tags
    
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.innerHTML = '×';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = 'white';
    closeButton.style.fontSize = '1.2rem';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = function() {
        alert.remove();
    };
    
    alertContent.appendChild(messageSpan);
    alertContent.appendChild(closeButton);
    alert.appendChild(alertContent);
    
    document.body.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}

// Check if user is authenticated
function checkAuth() {
    const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
    
    if (!userSession) {
        // Redirect to login if not authenticated
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('register.html')) {
            window.location.href = 'pages/auth/login.html';
        }
        return null;
    }
    
    try {
        return JSON.parse(userSession);
    } catch (err) {
        return null;
    }
}

// Logout function
async function logout() {
    // Clear local/session storage
    localStorage.removeItem('userSession');
    sessionStorage.removeItem('userSession');
    
    try {
        ensureSupabase();
    } catch (err) {
        // still redirect
        window.location.href = 'pages/auth/login.html';
        return;
    }
    
    // Sign out from Supabase (v2)
    try {
        const { error } = await window.supabase.auth.signOut();
        if (error) {
            console.error('Sign out error:', error);
        }
    } catch (err) {
        console.error('Sign out failed:', err);
    } finally {
        // Redirect to login
        window.location.href = 'pages/auth/login.html';
    }
}

// Export functions for global use
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.showAlert = showAlert;
window.checkAuth = checkAuth;
window.logout = logout;
