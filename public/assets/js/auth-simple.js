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
                
                // Store user info in session
                sessionStorage.setItem('user_email', email);
                sessionStorage.setItem('user_id', data.user.id);
                
                // Get user profile and store
                window.supabaseClient
                    .from('users')
                    .select('user_type, name')
                    .eq('auth_user_id', data.user.id)
                    .single()
                    .then(({ data: profile }) => {
                        if (profile) {
                            sessionStorage.setItem('user_type', profile.user_type);
                            sessionStorage.setItem('user_name', profile.name || email.split('@')[0]);
                        }
                        
                        // Show success message
                        alert('تم تسجيل الدخول بنجاح! ✅');
                        
                        // Redirect to home page
                        setTimeout(() => {
                            window.location.href = '../../index.html';
                        }, 500);
                    })
                    .catch(() => {
                        // Still redirect to home
                        alert('تم تسجيل الدخول بنجاح!');
                        setTimeout(() => {
                            window.location.href = '../../index.html';
                        }, 500);
                    });
                
            } catch (err) {
                alert('خطأ: ' + err.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'تسجيل الدخول';
            }
        });
    }
});
