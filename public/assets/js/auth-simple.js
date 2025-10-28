// Simple Authentication - No complications
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
                // Login
                const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (error) {
                    alert('خطأ في تسجيل الدخول: ' + error.message);
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'تسجيل الدخول';
                    return;
                }
                
                if (!data.user) {
                    alert('فشل تسجيل الدخول');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'تسجيل الدخول';
                    return;
                }
                
                // Get user profile
                const { data: profile, error: profileError } = await window.supabaseClient
                    .from('users')
                    .select('*')
                    .eq('auth_user_id', data.user.id)
                    .single();
                
                if (profileError || !profile) {
                    // Create profile if doesn't exist
                    const { data: newProfile, error: createError } = await window.supabaseClient
                        .from('users')
                        .insert([{
                            auth_user_id: data.user.id,
                            email: email,
                            name: email.split('@')[0],
                            user_type: 'shipper',
                            shipper_type: 'individual'
                        }])
                        .select()
                        .single();
                    
                    if (createError) {
                        alert('خطأ في إنشاء الملف الشخصي');
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = 'تسجيل الدخول';
                        return;
                    }
                    
                    // Redirect
                    window.location.href = '../shipper/index.html';
                } else {
                    // Redirect based on user type
                    if (profile.user_type === 'carrier') {
                        window.location.href = '../carrier/index.html';
                    } else {
                        window.location.href = '../shipper/index.html';
                    }
                }
                
            } catch (err) {
                alert('خطأ: ' + err.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'تسجيل الدخول';
            }
        });
    }
});
