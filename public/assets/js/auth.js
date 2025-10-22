document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const phone = document.getElementById('register-phone').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            const userType = document.querySelector('.type-option.active').dataset.type;
            const carrierType = document.getElementById('carrierType').value;
            const shipperType = document.getElementById('shipperType').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        phone,
                        user_type: userType,
                        carrier_type: userType === 'carrier' ? carrierType : null,
                        shipper_type: userType === 'shipper' ? shipperType : null,
                    }
                }
            });

            if (error) {
                alert(error.message);
            } else {
                alert('Registration successful! Please check your email to verify your account.');
                window.location.href = 'login.html';
            }
        });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                alert(error.message);
            } else {
                window.location.href = '../../index.html';
            }
        });
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = 'index.html';
        });
    }

    async function checkUserSession() {
        const { data: { session } } = await supabase.auth.getSession();
        const authButtons = document.querySelector('.auth-buttons');
        const logoutButtonContainer = document.querySelector('.logout-button-container');

        if (session) {
            if (authButtons) authButtons.style.display = 'none';
            if (logoutButtonContainer) {
                logoutButtonContainer.style.display = 'block';
            } else {
                const headerActions = document.querySelector('.header-actions');
                if (headerActions) {
                    const newLogoutContainer = document.createElement('div');
                    newLogoutContainer.classList.add('logout-button-container');
                    newLogoutContainer.innerHTML = `<button id="logout-button" class="btn btn-outline">Logout</button>`;
                    headerActions.appendChild(newLogoutContainer);
                    document.getElementById('logout-button').addEventListener('click', async () => {
                        await supabase.auth.signOut();
                        window.location.reload();
                    });
                }
            }
        } else {
            if (authButtons) authButtons.style.display = 'flex';
            if (logoutButtonContainer) logoutButtonContainer.style.display = 'none';
        }
    }

    checkUserSession();
});
