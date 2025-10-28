// Simple Authentication - No complications

function showAlert(type, messageAr, messageEn) {
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

// Add CSS animations
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

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const submitBtn = loginForm.querySelector('.btn-auth');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الدخول...';
            
            try {
                let data = null;
                let error = null;
                
                // Try Supabase first
                if (window.supabaseClient) {
                    try {
                        const result = await window.supabaseClient.auth.signInWithPassword({
                            email: email,
                            password: password
                        });
                        data = result.data;
                        error = result.error;
                    } catch (supabaseError) {
                        console.warn('Supabase login failed, trying backup auth:', supabaseError);
                        error = supabaseError;
                    }
                }
                
                // If Supabase failed, try backup auth
                if (error || !data?.user) {
                    console.log('Using backup authentication system');
                    const backupResult = window.backupAuth.login(email, password);
                    
                    if (backupResult.success) {
                        // Simulate Supabase response structure
                        data = { user: backupResult.user };
                        error = null;
                        console.log('Backup auth successful');
                    } else {
                        error = { message: backupResult.error };
                    }
                }
                
                if (error) {
                    let errorMessage = 'خطأ في تسجيل الدخول';
                    if (error.message.includes('Invalid') || error.message.includes('credentials')) {
                        errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                    } else if (error.message.includes('Email not confirmed')) {
                        errorMessage = 'يرجى تأكيد بريدك الإلكتروني أولاً';
                    } else if (error.message.includes('Too many requests')) {
                        errorMessage = 'محاولات كثيرة جداً. يرجى المحاولة لاحقاً';
                    }
                    
                    showAlert('error', errorMessage, error.message);
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span data-lang="ar">تسجيل الدخول</span>';
                    return;
                }
                
                if (!data.user) {
                    showAlert('error', 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى', 'Login failed. Please try again');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span data-lang="ar">تسجيل الدخول</span>';
                    return;
                }
                
                // Store user info in session with comprehensive data
                sessionStorage.setItem('user_email', email);
                sessionStorage.setItem('user_id', data.user.id);
                sessionStorage.setItem('user_name', email.split('@')[0]);
                sessionStorage.setItem('justLoggedIn', 'true'); // Mark as just logged in
                sessionStorage.setItem('user_authenticated', 'true'); // Persistent marker
                sessionStorage.setItem('auth_timestamp', Date.now().toString()); // Timestamp
                
                // Also store in localStorage as backup
                localStorage.setItem('fastship_user', JSON.stringify({
                    email: email,
                    id: data.user.id,
                    name: email.split('@')[0],
                    authenticated: true,
                    timestamp: Date.now()
                }));
                
                // Get user profile and store
                window.supabaseClient
                    .from('users')
                    .select('user_type, name, carrier_type, shipper_type')
                    .eq('auth_user_id', data.user.id)
                    .single()
                    .then(({ data: profile, error: profileError }) => {
                        let userType = 'shipper';
                        let userName = email.split('@')[0];
                        
                        if (profile && !profileError) {
                            userType = profile.user_type || 'shipper';
                            userName = profile.name || userName;
                            
                            // Store ALL profile data
                            sessionStorage.setItem('user_type', userType);
                            sessionStorage.setItem('user_name', userName);
                            sessionStorage.setItem('carrier_type', profile.carrier_type || '');
                            sessionStorage.setItem('shipper_type', profile.shipper_type || '');
                            sessionStorage.setItem('user_authenticated', 'true');
                            sessionStorage.setItem('auth_timestamp', Date.now().toString());
                            
                            console.log('User profile loaded:', { userType, userName });
                        } else {
                            // Create profile if doesn't exist
                            const newProfile = {
                                auth_user_id: data.user.id,
                                email: email,
                                name: userName,
                                user_type: 'shipper',
                                shipper_type: 'individual'
                            };
                            
                            window.supabaseClient
                                .from('users')
                                .insert([newProfile])
                                .then(() => {
                                    sessionStorage.setItem('user_type', 'shipper');
                                    sessionStorage.setItem('user_name', userName);
                                    sessionStorage.setItem('shipper_type', 'individual');
                                    sessionStorage.setItem('user_authenticated', 'true');
                                    sessionStorage.setItem('auth_timestamp', Date.now().toString());
                                    
                                    console.log('New user profile created');
                                });
                        }
                        
                        // Show success message
                        showAlert('success', 'تم تسجيل الدخول بنجاح! جاري التوجيه...', 'Login successful! Redirecting...');
                        
                        // Redirect directly to dashboard based on user type
                        setTimeout(() => {
                            const dashboardUrl = userType === 'carrier' 
                                ? '../../pages/carrier/index.html' 
                                : '../../pages/shipper/index.html';
                            
                            console.log('Redirecting to dashboard:', dashboardUrl);
                            window.location.href = dashboardUrl;
                        }, 1500);
                    })
                    .catch((err) => {
                        console.error('Profile error:', err);
                        
                        // Set default values even on error
                        sessionStorage.setItem('user_type', 'shipper');
                        sessionStorage.setItem('user_name', email.split('@')[0]);
                        sessionStorage.setItem('shipper_type', 'individual');
                        sessionStorage.setItem('user_authenticated', 'true');
                        sessionStorage.setItem('auth_timestamp', Date.now().toString());
                        
                        // Default redirect on error - go to shipper dashboard
                        showAlert('success', 'تم تسجيل الدخول بنجاح! جاري التوجيه...', 'Login successful! Redirecting...');
                        setTimeout(() => {
                            window.location.href = '../../pages/shipper/index.html';
                        }, 1500);
                    });
                
            } catch (err) {
                console.error('Login error:', err);
                showAlert('error', 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى', 'An unexpected error occurred. Please try again');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span data-lang="ar">تسجيل الدخول</span>';
            }
        });
    }
    
    // Initialize accessibility features after page load
    if (typeof window.AccessibilityUtils !== 'undefined') {
        window.AccessibilityUtils.enhance();
    }
});
