// Dashboard JavaScript for Fast Shipment Platform

document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
});

function initDashboard() {
    // Check authentication
    if (!checkAuth()) {
        return;
    }
    
    // Initialize dashboard functionality
    initDashboardCharts();
    initMatchActions();
    initTripActions();
    loadDashboardData();
}

// Initialize dashboard charts
function initDashboardCharts() {
    // This would initialize charts using Chart.js or similar library
    // For now, we'll just log that charts would be initialized here
    console.log('Dashboard charts initialized');
}

// Initialize match action buttons
function initMatchActions() {
    const acceptButtons = document.querySelectorAll('.match-actions .btn-primary');
    const rejectButtons = document.querySelectorAll('.match-actions .btn-outline');
    
    acceptButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const matchCard = this.closest('.match-card');
            const matchTitle = matchCard.querySelector('h4').textContent;
            handleMatchAction('accept', matchCard, matchTitle);
        });
    });
    
    rejectButtons.forEach(btn => {
        if (btn.textContent.includes('رفض') || btn.textContent.includes('Reject')) {
            btn.addEventListener('click', function() {
                const matchCard = this.closest('.match-card');
                const matchTitle = matchCard.querySelector('h4').textContent;
                handleMatchAction('reject', matchCard, matchTitle);
            });
        }
    });
}

// Initialize trip action buttons
function initTripActions() {
    const manageButtons = document.querySelectorAll('.trip-actions .btn-primary');
    const editButtons = document.querySelectorAll('.trip-actions .btn-outline');
    
    manageButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tripCard = this.closest('.trip-card');
            const tripRoute = tripCard.querySelector('h4').textContent;
            
            if (this.textContent.includes('إدارة') || this.textContent.includes('Manage')) {
                window.location.href = 'trip-details.html?trip=' + encodeURIComponent(tripRoute);
            } else if (this.textContent.includes('ترويج') || this.textContent.includes('Promote')) {
                promoteTrip(tripCard, tripRoute);
            }
        });
    });
    
    editButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tripCard = this.closest('.trip-card');
            const tripRoute = tripCard.querySelector('h4').textContent;
            window.location.href = 'edit-trip.html?trip=' + encodeURIComponent(tripRoute);
        });
    });
}

// Handle match actions (accept/reject)
function handleMatchAction(action, matchCard, matchTitle) {
    const currentLang = document.documentElement.lang || 'ar';
    
    if (action === 'accept') {
        // Show confirmation modal
        showMatchModal('accept', matchTitle, currentLang);
    } else if (action === 'reject') {
        // Show rejection modal
        showMatchModal('reject', matchTitle, currentLang);
    }
}

// Show match action modal
function showMatchModal(action, matchTitle, lang) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        padding: 20px;
    `;
    
    const title = lang === 'ar' 
        ? (action === 'accept' ? 'قبول المطابقة' : 'رفض المطابقة')
        : (action === 'accept' ? 'Accept Match' : 'Reject Match');
    
    const message = lang === 'ar'
        ? (action === 'accept' 
            ? `هل أنت متأكد من قبول مطابقة "${matchTitle}"؟`
            : `هل أنت متأكد من رفض مطابقة "${matchTitle}"؟`)
        : (action === 'accept'
            ? `Are you sure you want to accept the match "${matchTitle}"?`
            : `Are you sure you want to reject the match "${matchTitle}"?`);
    
    const confirmText = lang === 'ar' ? 'تأكيد' : 'Confirm';
    const cancelText = lang === 'ar' ? 'إلغاء' : 'Cancel';
    
    modal.innerHTML = `
        <div class="modal-content" style="background: white; padding: 30px; border-radius: 15px; max-width: 400px; width: 100%;">
            <h3 style="margin-bottom: 15px; color: var(--dark);">${title}</h3>
            <p style="color: var(--gray); margin-bottom: 25px;">${message}</p>
            <div class="modal-actions" style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn btn-outline" id="cancelBtn">${cancelText}</button>
                <button class="btn ${action === 'accept' ? 'btn-primary' : 'btn-secondary'}" id="confirmBtn">${confirmText}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Add event listeners
    const cancelBtn = modal.querySelector('#cancelBtn');
    const confirmBtn = modal.querySelector('#confirmBtn');
    
    cancelBtn.addEventListener('click', function() {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
    });
    
    confirmBtn.addEventListener('click', function() {
        // Simulate API call
        simulateAPICall(action, matchTitle, lang).then(success => {
            if (success) {
                document.body.removeChild(modal);
                document.body.style.overflow = '';
                
                // Show success message
                const message = lang === 'ar'
                    ? (action === 'accept' 
                        ? 'تم قبول المطابقة بنجاح'
                        : 'تم رفض المطابقة بنجاح')
                    : (action === 'accept'
                        ? 'Match accepted successfully'
                        : 'Match rejected successfully');
                
                showAlert('success', message, message);
                
                // Reload matches after a delay
                setTimeout(() => {
                    loadDashboardData();
                }, 2000);
            }
        });
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
            document.body.style.overflow = '';
        }
    });
}

// Promote a trip
function promoteTrip(tripCard, tripRoute) {
    const currentLang = document.documentElement.lang || 'ar';
    const title = currentLang === 'ar' ? 'ترويج الرحلة' : 'Promote Trip';
    const message = currentLang === 'ar' 
        ? `هل تريد ترويج الرحلة "${tripRoute}" لزيادة فرص المطابقة؟`
        : `Do you want to promote the trip "${tripRoute}" to increase matching chances?`;
    
    showAlert('info', message, message);
    
    // Simulate promotion
    setTimeout(() => {
        const successMessage = currentLang === 'ar'
            ? 'تم ترويج الرحلة بنجاح!'
            : 'Trip promoted successfully!';
        showAlert('success', successMessage, successMessage);
    }, 1000);
}

// Simulate API call
async function simulateAPICall(action, matchTitle, lang) {
    // Show loading state
    showAlert('info', 
        lang === 'ar' ? 'جاري المعالجة...' : 'Processing...',
        lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'
    );
    
    // Simulate API delay
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(true); // Simulate success
        }, 1500);
    });
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // This would load real data from Supabase
        const user = checkAuth();
        if (!user) return;
        
        // Load user stats
        const { data: stats, error: statsError } = await window.supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        if (!statsError && stats) {
            updateStatsDisplay(stats);
        }
        
        // Load recent matches
        const { data: matches, error: matchesError } = await window.supabase
            .from('matches')
            .select(`
                *,
                shipments (
                    from_city,
                    to_city,
                    weight,
                    needed_date,
                    item_description
                )
            `)
            .eq('trip_id.user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (!matchesError && matches) {
            updateMatchesDisplay(matches);
        }
        
        // Load active trips
        const { data: trips, error: tripsError } = await window.supabase
            .from('trips')
            .select('*')
            .eq('user_id', user.id)
            .in('status', ['available', 'in_progress'])
            .order('trip_date', { ascending: true })
            .limit(5);
        
        if (!tripsError && trips) {
            updateTripsDisplay(trips);
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Update stats display
function updateStatsDisplay(stats) {
    // This would update the stats cards with real data
    console.log('Updating stats with:', stats);
}

// Update matches display
function updateMatchesDisplay(matches) {
    // This would update the matches section with real data
    console.log('Updating matches with:', matches);
}

// Update trips display
function updateTripsDisplay(trips) {
    // This would update the trips section with real data
    console.log('Updating trips with:', trips);
}

// Logout function
function logout() {
    if (confirm(document.documentElement.lang === 'ar' ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to logout?')) {
        // Clear local storage
        localStorage.removeItem('userSession');
        sessionStorage.removeItem('userSession');
        
        // Sign out from Supabase
        window.supabase.auth.signOut();
        
        // Redirect to login
        window.location.href = '../auth/login.html';
    }
}

// Make functions available globally
window.logout = logout;