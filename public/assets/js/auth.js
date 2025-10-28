// Authentication JavaScript for Fast Shipment Platform (modified)
// - Works with Supabase Auth v2
// - Stores only safe user info in browser storage
// - Handles pending_users when signUp does not immediately return a user
// - Routes user by user_type from public.users

document.addEventListener('DOMContentLoaded', function() {
    initAuth();
});

function initAuth() {
    initForms();
    initUserTypeSelection();
    initPasswordToggle();
}

function ensureSupabase() {
    if (!window.supabaseClient) {
        console.error('Supabase client is not initialized. Make sure createClient(...) is called and assigned to window.supabaseClient');
        showAlert('error', 'خطأ في التهيئة: عميل Supabase غير موجود', 'Initialization error: Supabase client not found');
        throw new Error('Supabase client not initialized');
    }
}

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

function initUserTypeSelection() {
    const typeOptions = document.querySelectorAll('.type-option');
    const carrierSubtype = document.getElementById('carrierSubtype');
    const shipperSubtype = document.getElementById('shipperSubtype');

    if (typeOptions.length > 0) {
        typeOptions.forEach(option => {
            option.addEventListener('click', function() {
                typeOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');

                const userType = this.getAttribute('data-type');

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

// Safe storage: only minimal user info
function storeSafeUser(userObj, rememberMe) {
    if (!userObj) return;
    const safe = {
        id: userObj.id,
        email: userObj.email,
        user_type: userObj.user_type || null,
        name: userObj.name || null
    };
    try {
        const serialized = JSON.stringify(safe);
        if (rememberMe) {
            localStorage.setItem('fastship_user', serialized);
        } else {
            sessionStorage.setItem('fastship_user', serialized);
        }
    } catch (err) {
        console.warn('Failed to store user info locally:', err);
    }
}

async function fetchUserProfile(authUserId) {
    ensureSupabase();
    if (!authUserId) return null;
    const { data, error } = await window.supabaseClient
        .from('users')
        .select('id, auth_user_id, email, name, user_type, carrier_type, shipper_type')
        .eq('auth_user_id', authUserId)
        .single();
    if (error) {
        // if not found, try by id (in case your public.users.id equals auth id)
        const { data: data2, error: err2 } = await window.supabaseClient
            .from('users')
            .select('id, auth_user_id, email, name, user_type, carrier_type, shipper_type')
            .eq('id', authUserId)
            .single();
        if (err2) return null;
        return data2;
    }
    return data;
}

function getStoredUser() {
    const raw = localStorage.getItem('fastship_user') || sessionStorage.getItem('fastship_user');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (err) {
        return null;
    }
}

// Login handler - Updated with AuthManager integration
async function handleLogin(e) {
    e.preventDefault();
    try { ensureSupabase(); } catch (err) { return; }

    const form = e.target;
    const formData = new FormData(form);
    const email = (formData.get('email') || '').toString().trim();
    const password = (formData.get('password') || '').toString();
    const rememberMe = !!formData.get('rememberMe');

    if (!email || !password) {
        showAlert('error', 'يرجى ملء جميع الحقول المطلوبة', 'Please fill all required fields');
        return;
    }

    const submitBtn = form.querySelector('.btn-auth');
    const originalText = submitBtn ? submitBtn.innerHTML : null;
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الدخول...';
        submitBtn.disabled = true;
    }

    try {
        // Supabase Auth v2 signInWithPassword
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        const user = data?.user ?? null;
        const session = data?.session ?? null;

        if (!user) {
            showAlert('error', 'تعذر تسجيل الدخول. يرجى التحقق من البريد/كلمة المرور أو تفعيل الحساب', 'Login failed. Check credentials or verify your email');
            return;
        }

        // Fetch profile to find user_type
        let profile = await fetchUserProfile(user.id);

        // If profile doesn't exist, create it with basic info
        if (!profile) {
            console.log('Profile not found, creating one...');
            
            // Create basic user profile
            const newUserData = {
                auth_user_id: user.id,
                email: user.email,
                name: user.email.split('@')[0], // Use email prefix as name
                phone: null,
                user_type: 'shipper', // Default to shipper, user can change later
                carrier_type: null,
                shipper_type: 'individual'
            };

            try {
                const { data: createdProfile, error: createError } = await window.supabaseClient
                    .from('users')
                    .insert([newUserData])
                    .select()
                    .single();

                if (createError) {
                    console.error('Error creating profile:', createError);
                    showAlert('error', 'لم يتم العثور على الملف الشخصي. يرجى التسجيل مرة أخرى', 'Profile not found. Please register again');
                    return;
                }

                profile = createdProfile;
                console.log('Profile created successfully');
            } catch (err) {
                console.error('Failed to create profile:', err);
                showAlert('error', 'حدث خطأ. يرجى المحاولة مرة أخرى', 'Error occurred. Please try again');
                return;
            }
        }

        showAlert('success', 'تم تسجيل الدخول بنجاح', 'Login successful');

        // AuthManager will handle the session - just redirect
        setTimeout(() => {
            const userType = profile?.user_type || 'shipper';
            if (userType === 'carrier') {
                window.location.href = '../carrier/index.html';
            } else if (userType === 'shipper') {
                window.location.href = '../shipper/index.html';
            } else {
                window.location.href = '../../index.html';
            }
        }, 800);

    } catch (error) {
        console.error('Login error:', error);
        const msg = error?.message || String(error);
        showAlert('error', 'خطأ في تسجيل الدخول: ' + msg, 'Login error: ' + msg);
    } finally {
        if (submitBtn && originalText !== null) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Register handler
async function handleRegister(e) {
    e.preventDefault();
    try { ensureSupabase(); } catch (err) { return; }

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

    const submitBtn = form.querySelector('.btn-auth');
    const originalText = submitBtn ? submitBtn.innerHTML : null;
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري إنشاء الحساب...';
        submitBtn.disabled = true;
    }

    try {
        // signUp - Supabase will send confirmation email if enabled in project settings
        const { data: signUpData, error: authError } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                // redirect to a verification page on your site after email confirmation
                // emailRedirectTo: 'https://yourdomain.com/pages/auth/verification.html'
            }
        });

        if (authError) throw authError;

        const createdUser = signUpData?.user ?? null;

        // If createdUser exists (immediate creation), create profile row in public.users
        if (createdUser?.id) {
            const userData = {
                auth_user_id: createdUser.id,
                email: email,
                name: fullName,
                phone: phone,
                user_type: userType,
                carrier_type: userType === 'carrier' ? carrierType : null,
                shipper_type: userType === 'shipper' ? shipperType : null
            };

            const { data: dbData, error: dbError } = await window.supabaseClient
                .from('users')
                .insert([userData]);

            if (dbError) {
                console.warn('Failed to insert profile:', dbError);
                // Attempt to rollback auth user? Typically admin action required; inform user
                showAlert('error', 'حدث خطأ أثناء إنشاء الملف الشخصي. يرجى التواصل مع الدعم', 'Failed to create profile. Contact support');
            } else {
                // success - store safe info (no tokens)
                storeSafeUser({
                    id: createdUser.id,
                    email: email,
                    user_type: userType,
                    name: fullName
                }, false);
            }
        } else {
            // createdUser not returned: store as pending to create profile after confirmation
            // Insert into pending_users so an admin/background worker can link later
            const pending = {
                email: email,
                phone: phone,
                name: fullName,
                user_type: userType,
                carrier_type: userType === 'carrier' ? carrierType : null,
                shipper_type: userType === 'shipper' ? shipperType : null
            };
            const { data: pData, error: pErr } = await window.supabaseClient
                .from('pending_users')
                .upsert(pending, { onConflict: ['email'] });

            if (pErr) {
                console.warn('Failed to save pending user:', pErr);
            }
        }

        // Inform user to check email if project sends confirmation
        showAlert('success', 'تم إنشاء الحساب! يرجى التحقق من بريدك لتأكيد الحساب', 'Account created! Please check your email to confirm the account');

        setTimeout(() => {
            window.location.href = 'verification.html';
        }, 1400);

    } catch (error) {
        console.error('Registration error:', error);
        let msg = error?.message || String(error);

        if (msg.includes('User already registered') || msg.includes('already registered')) {
            msg = 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استخدام بريد إلكتروني مختلف';
        } else if (msg.includes('invalid')) {
            msg = 'بيانات غير صحيحة. يرجى التحقق والمحاولة مرة أخرى';
        } else {
            msg = 'حدث خطأ أثناء إنشاء الحساب. إذا استمر، يرجى التواصل مع الدعم';
        }

        showAlert('error', 'خطأ في إنشاء الحساب: ' + msg, 'Registration error: ' + msg);
    } finally {
        if (submitBtn && originalText !== null) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

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

    const alertContent = document.createElement('div');
    alertContent.style.display = 'flex';
    alertContent.style.alignItems = 'center';
    alertContent.style.justifyContent = 'space-between';

    const messageSpan = document.createElement('span');
    messageSpan.innerHTML = message;

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

    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}

function checkAuth() {
    const userSession = getStoredUser();

    if (!userSession) {
        if (!window.location.pathname.includes('login.html') &&
            !window.location.pathname.includes('register.html') &&
            !window.location.pathname.includes('verification.html')) {
            window.location.href = 'pages/auth/login.html';
        }
        return null;
    }

    return userSession;
}

async function logout() {
    // Clear local/session storage
    localStorage.removeItem('fastship_user');
    sessionStorage.removeItem('fastship_user');

    try { ensureSupabase(); } catch (err) {
        window.location.href = 'pages/auth/login.html';
        return;
    }

    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) {
            console.error('Sign out error:', error);
        }
    } catch (err) {
        console.error('Sign out failed:', err);
    } finally {
        window.location.href = 'pages/auth/login.html';
    }
}

// Expose functions globally if needed
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.showAlert = showAlert;
window.checkAuth = checkAuth;
window.logout = logout;
