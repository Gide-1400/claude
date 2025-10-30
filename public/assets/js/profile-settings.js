// Profile Settings JavaScript for Fast Ship Platform

document.addEventListener('DOMContentLoaded', function() {
    initProfileSettings();
});

function initProfileSettings() {
    // Check authentication
    const user = checkAuth();
    if (!user) {
        window.location.href = '../auth/login.html';
        return;
    }
    
    // Load user data
    loadUserProfile();
    
    // Initialize forms
    initPersonalInfoForm();
    initVehicleInfoForm();
    initPasswordForm();
    
    // Load statistics
    loadUserStatistics();
}

async function loadUserProfile() {
    try {
        const storedUser = localStorage.getItem('fastship_user') || sessionStorage.getItem('fastship_user');
        if (!storedUser) return;
        
        const user = JSON.parse(storedUser);
        
        if (!window.supabaseClient) {
            console.error('Supabase client not initialized');
            return;
        }
        
        // Fetch full user profile from database
        const { data: profile, error } = await window.supabaseClient
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (error) {
            console.error('Error loading profile:', error);
            return;
        }
        
        if (profile) {
            // Update header display
            document.getElementById('profileName').textContent = profile.name || 'مستخدم';
            document.getElementById('profileEmail').textContent = profile.email || '';
            
            // Update verification badge
            const badge = document.getElementById('verificationBadge');
            if (profile.is_verified) {
                badge.innerHTML = '<span class="verification-badge"><i class="fas fa-check-circle"></i> حساب موثق</span>';
            } else {
                badge.innerHTML = '<span class="verification-badge pending"><i class="fas fa-clock"></i> في انتظار التوثيق</span>';
            }
            
            // Fill personal info form
            document.getElementById('fullName').value = profile.name || '';
            document.getElementById('phone').value = profile.phone || '';
            document.getElementById('email').value = profile.email || '';
            
            if (profile.carrier_type) {
                document.getElementById('carrierType').value = profile.carrier_type;
            }
            
            if (profile.shipper_type) {
                const shipperTypeEl = document.getElementById('shipperType');
                if (shipperTypeEl) {
                    shipperTypeEl.value = profile.shipper_type;
                }
            }
            
            if (profile.address) {
                const addressEl = document.getElementById('address');
                if (addressEl) {
                    addressEl.value = profile.address;
                }
            }
            
            // Fill vehicle info if exists (for carriers)
            if (profile.vehicle_type) {
                const vehicleTypeEl = document.getElementById('vehicleType');
                if (vehicleTypeEl) {
                    vehicleTypeEl.value = profile.vehicle_type;
                }
            }
            if (profile.vehicle_plate) {
                document.getElementById('vehiclePlate').value = profile.vehicle_plate;
            }
            if (profile.vehicle_model) {
                document.getElementById('vehicleModel').value = profile.vehicle_model;
            }
            if (profile.max_capacity) {
                document.getElementById('maxCapacity').value = profile.max_capacity;
            }
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

function initPersonalInfoForm() {
    const form = document.getElementById('personalInfoForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
        submitBtn.disabled = true;
        
        try {
            const storedUser = localStorage.getItem('fastship_user') || sessionStorage.getItem('fastship_user');
            if (!storedUser) throw new Error('No user found');
            
            const user = JSON.parse(storedUser);
            
            const formData = new FormData(form);
            const updateData = {
                name: formData.get('fullName'),
                phone: formData.get('phone'),
                updated_at: new Date().toISOString()
            };
            
            // Add user type specific fields
            if (user.user_type === 'carrier') {
                updateData.carrier_type = formData.get('carrierType');
            } else if (user.user_type === 'shipper') {
                updateData.shipper_type = formData.get('shipperType');
                updateData.address = formData.get('address') || null;
            }
            
            const { error } = await window.supabaseClient
                .from('users')
                .update(updateData)
                .eq('id', user.id);
            
            if (error) throw error;
            
            // Update stored user info
            user.name = updateData.name;
            const storage = localStorage.getItem('fastship_user') ? localStorage : sessionStorage;
            storage.setItem('fastship_user', JSON.stringify(user));
            
            showAlert('success', 'تم حفظ المعلومات بنجاح', 'Information saved successfully');
            
            // Reload profile data
            setTimeout(() => loadUserProfile(), 1000);
            
        } catch (error) {
            console.error('Error updating profile:', error);
            showAlert('error', 'فشل حفظ المعلومات: ' + error.message, 'Failed to save: ' + error.message);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

function initVehicleInfoForm() {
    const form = document.getElementById('vehicleInfoForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
        submitBtn.disabled = true;
        
        try {
            const storedUser = localStorage.getItem('fastship_user') || sessionStorage.getItem('fastship_user');
            if (!storedUser) throw new Error('No user found');
            
            const user = JSON.parse(storedUser);
            
            const formData = new FormData(form);
            const updateData = {
                vehicle_type: formData.get('vehicleType'),
                vehicle_plate: formData.get('vehiclePlate'),
                vehicle_model: formData.get('vehicleModel'),
                max_capacity: formData.get('maxCapacity') ? parseInt(formData.get('maxCapacity')) : null,
                updated_at: new Date().toISOString()
            };
            
            const { error } = await window.supabaseClient
                .from('users')
                .update(updateData)
                .eq('id', user.id);
            
            if (error) throw error;
            
            showAlert('success', 'تم حفظ معلومات المركبة بنجاح', 'Vehicle information saved successfully');
            
        } catch (error) {
            console.error('Error updating vehicle info:', error);
            showAlert('error', 'فشل حفظ معلومات المركبة: ' + error.message, 'Failed to save: ' + error.message);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

function initPasswordForm() {
    const form = document.getElementById('passwordForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            showAlert('error', 'يرجى ملء جميع حقول كلمة المرور', 'Please fill all password fields');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showAlert('error', 'كلمات المرور الجديدة غير متطابقة', 'New passwords do not match');
            return;
        }
        
        if (newPassword.length < 6) {
            showAlert('error', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'Password must be at least 6 characters');
            return;
        }
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التغيير...';
        submitBtn.disabled = true;
        
        try {
            // Update password in Supabase Auth
            const { error } = await window.supabaseClient.auth.updateUser({
                password: newPassword
            });
            
            if (error) throw error;
            
            showAlert('success', 'تم تغيير كلمة المرور بنجاح', 'Password changed successfully');
            
            // Clear form
            form.reset();
            
        } catch (error) {
            console.error('Error changing password:', error);
            showAlert('error', 'فشل تغيير كلمة المرور: ' + error.message, 'Failed to change password: ' + error.message);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

async function loadUserStatistics() {
    try {
        const storedUser = localStorage.getItem('fastship_user') || sessionStorage.getItem('fastship_user');
        if (!storedUser) return;
        
        const user = JSON.parse(storedUser);
        
        if (user.user_type === 'carrier') {
            // Load carrier statistics
            
            // Total trips
            const { data: trips, error: tripsError } = await window.supabaseClient
                .from('trips')
                .select('id, status')
                .eq('user_id', user.id);
            
            if (!tripsError && trips) {
                document.getElementById('totalTrips').textContent = trips.length;
                const completed = trips.filter(t => t.status === 'completed').length;
                document.getElementById('completedTrips').textContent = completed;
            }
            
            // Total earnings
            const { data: completedMatches, error: earningsError } = await window.supabaseClient
                .from('matches')
                .select(`
                    shipments!inner (
                        price_offer,
                        weight
                    ),
                    trips!inner (
                        user_id,
                        price_per_kg
                    )
                `)
                .eq('trips.user_id', user.id)
                .eq('status', 'completed');
            
            if (!earningsError && completedMatches) {
                const totalEarnings = completedMatches.reduce((sum, match) => {
                    const price = match.shipments?.price_offer || (match.trips?.price_per_kg * match.shipments?.weight) || 0;
                    return sum + price;
                }, 0);
                document.getElementById('totalEarnings').textContent = totalEarnings.toFixed(2);
            }
            
            // Calculate rating (placeholder - would need actual rating system)
            document.getElementById('rating').textContent = '4.8';
            
        } else if (user.user_type === 'shipper') {
            // Load shipper statistics
            
            // Total shipments
            const { data: shipments, error: shipmentsError } = await window.supabaseClient
                .from('shipments')
                .select('id, status')
                .eq('user_id', user.id);
            
            if (!shipmentsError && shipments) {
                document.getElementById('totalTrips').textContent = shipments.length;
                const completed = shipments.filter(s => s.status === 'completed').length;
                document.getElementById('completedTrips').textContent = completed;
            }
            
            // Update labels for shipper
            document.querySelector('#totalTrips').nextElementSibling.textContent = 'إجمالي الشحنات';
            document.querySelector('#completedTrips').nextElementSibling.textContent = 'شحنات مكتملة';
            document.querySelector('#totalEarnings').nextElementSibling.textContent = 'المدفوع (ريال)';
        }
        
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Make functions available globally
window.loadUserProfile = loadUserProfile;
window.loadUserStatistics = loadUserStatistics;
