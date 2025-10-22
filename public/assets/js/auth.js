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
                    carrierSubtype.style.display = 'block';
                    shipperSubtype.style.display = 'none';
                    document.getElementById('carrierType').required = true;
                    document.getElementById('shipperType').required = false;
                } else {
                    carrierSubtype.style.display = 'none';
                    shipperSubtype.style.display = 'block';
                    document.getElementById('carrierType').required = false;
                    document.getElementById('shipperType').required = true;
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
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    const rememberMe = formData.get('rememberMe');
    
    // Basic validation
    if (!email || !password) {
        showAlert('error', 'يرجى ملء جميع الحقول المطلوبة', 'Please fill all required fields');
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('.btn-auth');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التسجيل...';
    submitBtn.disabled = true;
    
    try {
        // Simulate API call - replace with actual Supabase authentication
        const { user, error } = await window.supabase.auth.signIn({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Success - redirect to dashboard
        showAlert('success', 'تم تسجيل الدخول بنجاح', 'Login successful');
        
        // Store user session
        if (rememberMe) {
            localStorage.setItem('userSession', JSON.stringify(user));
        } else {
            sessionStorage.setItem('userSession', JSON.stringify(user));
        }
        
        // Redirect based on user type
        setTimeout(() => {
            window.location.href = '../carrier/index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Login error:', error);
        showAlert('error', 'خطأ في تسجيل الدخول: ' + error.message, 'Login error: ' + error.message);
    } finally {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Handle register form submission
async function handleRegister(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const fullName = formData.get('fullName');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const userType = document.querySelector('.type-option.active')?.getAttribute('data-type');
    const carrierType = formData.get('carrierType');
    const shipperType = formData.get('shipperType');
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
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري إنشاء الحساب...';
    submitBtn.disabled = true;
    
    try {
        // Create user in Supabase Auth
        const { user, error: authError } = await window.supabase.auth.signUp({
            email: email,
            password: password
        });
        
        if (authError) throw authError;
        
        // Create user profile in database
        const { data, error: dbError } = await window.supabase
            .from('users')
            .insert([
                {
                    id: user.id,
                    email: email,
                    name: fullName,
                    phone: phone,
                    user_type: userType,
                    carrier_type: userType === 'carrier' ? carrierType : null,
                    shipper_type: userType === 'shipper' ? shipperType : null,
                    verified: false
                }
            ]);
        
        if (dbError) throw dbError;
        
        // Success
        showAlert('success', 'تم إنشاء الحساب بنجاح! يرجى تفعيل حسابك عبر البريد الإلكتروني', 'Account created successfully! Please verify your email');
        
        // Redirect to verification page
        setTimeout(() => {
            window.location.href = 'verification.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('error', 'خطأ في إنشاء الحساب: ' + error.message, 'Registration error: ' + error.message);
    } finally {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
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
    
    alert.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer;">×</button>
        </div>
    `;
    
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
    
    return JSON.parse(userSession);
}

// Logout function
function logout() {
    localStorage.removeItem('userSession');
    sessionStorage.removeItem('userSession');
    
    // Sign out from Supabase
    window.supabase.auth.signOut();
    
    // Redirect to login
    window.location.href = 'pages/auth/login.html';
}

// Export functions for global use
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.showAlert = showAlert;
window.checkAuth = checkAuth;
window.logout = logout;