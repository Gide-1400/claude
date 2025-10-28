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
                
                // Just redirect - the dashboard will handle everything
                alert('تم تسجيل الدخول بنجاح');
                
                // Wait a moment for alert
                setTimeout(() => {
                    // Try to get profile to determine redirect
                    window.supabaseClient
                        .from('users')
                        .select('user_type')
                        .eq('auth_user_id', data.user.id)
                        .single()
                        .then(({ data: profile }) => {
                            if (profile && profile.user_type === 'carrier') {
                                window.location.href = '../carrier/index.html';
                            } else {
                                window.location.href = '../shipper/index.html';
                            }
                        })
                        .catch(() => {
                            // If any error, just go to shipper dashboard
                            window.location.href = '../shipper/index.html';
                        });
                }, 500);
                
            } catch (err) {
                alert('خطأ: ' + err.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'تسجيل الدخول';
            }
        });
    }
});
