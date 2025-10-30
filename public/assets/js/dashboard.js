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
        // Get stored user info
        const storedUser = localStorage.getItem('fastship_user') || sessionStorage.getItem('fastship_user');
        if (!storedUser) {
            console.error('No user found in storage');
            return;
        }
        
        const user = JSON.parse(storedUser);
        console.log('Loading dashboard for user:', user);
        
        // Ensure Supabase is initialized
        if (!window.supabaseClient) {
            console.error('Supabase client not initialized');
            return;
        }
        
        // Get user type to load appropriate data
        const userType = user.user_type || 'shipper';
        
        // Update user info display
        updateUserDisplay(user);
        
        if (userType === 'carrier') {
            // Load carrier-specific data
            await loadCarrierData(user.id);
        } else {
            // Load shipper-specific data
            await loadShipperData(user.id);
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Update user display in dashboard
function updateUserDisplay(user) {
    // Update welcome message
    const welcomeElement = document.querySelector('.welcome-message h2, .dashboard-header h2');
    if (welcomeElement && user.name) {
        const currentLang = document.documentElement.lang || 'ar';
        const greeting = currentLang === 'ar' ? 'مرحباً' : 'Welcome';
        welcomeElement.textContent = `${greeting}, ${user.name}`;
    }
    
    // Update user name in profile section
    const profileName = document.querySelector('.user-profile .user-name, .profile-info h3');
    if (profileName && user.name) {
        profileName.textContent = user.name;
    }
    
    // Update email
    const profileEmail = document.querySelector('.user-profile .user-email, .profile-info p');
    if (profileEmail && user.email) {
        profileEmail.textContent = user.email;
    }
}

// Load carrier-specific data
async function loadCarrierData(userId) {
    try {
        // Load trips count
        const { data: trips, error: tripsError } = await window.supabaseClient
            .from('trips')
            .select('id, status, from_city, to_city, trip_date, available_weight, price_per_kg')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (!tripsError && trips) {
            console.log('Loaded trips:', trips);
            updateTripsCount(trips.length);
            updateActiveTripsDisplay(trips.filter(t => t.status === 'available').slice(0, 5));
        }
        
        // Load matches for carrier trips
        const { data: matches, error: matchesError } = await window.supabaseClient
            .from('matches')
            .select(`
                id,
                status,
                created_at,
                shipment_id,
                trip_id,
                shipments!inner (
                    id,
                    from_city,
                    to_city,
                    weight,
                    needed_date,
                    price_offer,
                    item_description,
                    user_id,
                    users!inner (
                        name,
                        email,
                        phone
                    )
                ),
                trips!inner (
                    user_id
                )
            `)
            .eq('trips.user_id', userId)
            .in('status', ['pending', 'accepted'])
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (!matchesError && matches) {
            console.log('Loaded matches:', matches);
            updateMatchesCount(matches.length);
            updateMatchesDisplay(matches.slice(0, 5));
        }
        
        // Calculate earnings
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
            .eq('trips.user_id', userId)
            .eq('status', 'completed');
        
        if (!earningsError && completedMatches) {
            const totalEarnings = completedMatches.reduce((sum, match) => {
                const price = match.shipments?.price_offer || (match.trips?.price_per_kg * match.shipments?.weight) || 0;
                return sum + price;
            }, 0);
            updateEarningsDisplay(totalEarnings);
        }
        
    } catch (error) {
        console.error('Error loading carrier data:', error);
    }
}

// Load shipper-specific data
async function loadShipperData(userId) {
    try {
        // Load shipments count
        const { data: shipments, error: shipmentsError } = await window.supabaseClient
            .from('shipments')
            .select('id, status, from_city, to_city, needed_date, weight, price_offer, item_description')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (!shipmentsError && shipments) {
            console.log('Loaded shipments:', shipments);
            updateShipmentsCount(shipments.length);
            updateActiveShipmentsDisplay(shipments.filter(s => s.status === 'pending').slice(0, 5));
        }
        
        // Load matches for shipper shipments
        const { data: matches, error: matchesError } = await window.supabaseClient
            .from('matches')
            .select(`
                id,
                status,
                created_at,
                shipment_id,
                trip_id,
                trips!inner (
                    id,
                    from_city,
                    to_city,
                    trip_date,
                    available_weight,
                    price_per_kg,
                    user_id,
                    users!inner (
                        name,
                        email,
                        phone
                    )
                ),
                shipments!inner (
                    user_id
                )
            `)
            .eq('shipments.user_id', userId)
            .in('status', ['pending', 'accepted'])
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (!matchesError && matches) {
            console.log('Loaded matches:', matches);
            updateMatchesCount(matches.length);
            updateShipperMatchesDisplay(matches.slice(0, 5));
        }
        
        // Calculate total spent
        const { data: completedMatches, error: spentError } = await window.supabaseClient
            .from('matches')
            .select(`
                shipments!inner (
                    user_id,
                    price_offer
                )
            `)
            .eq('shipments.user_id', userId)
            .eq('status', 'completed');
        
        if (!spentError && completedMatches) {
            const totalSpent = completedMatches.reduce((sum, match) => {
                return sum + (match.shipments?.price_offer || 0);
            }, 0);
            updateSpentDisplay(totalSpent);
        }
        
    } catch (error) {
        console.error('Error loading shipper data:', error);
    }
}

// Update stats display
function updateStatsDisplay(stats) {
    // This would update the stats cards with real data
    console.log('Updating stats with:', stats);
}

// Update trips count
function updateTripsCount(count) {
    const tripsCountElement = document.querySelector('.stat-card[data-stat="trips"] .stat-number, .trips-count');
    if (tripsCountElement) {
        tripsCountElement.textContent = count;
    }
}

// Update shipments count
function updateShipmentsCount(count) {
    const shipmentsCountElement = document.querySelector('.stat-card[data-stat="shipments"] .stat-number, .shipments-count');
    if (shipmentsCountElement) {
        shipmentsCountElement.textContent = count;
    }
}

// Update matches count
function updateMatchesCount(count) {
    const matchesCountElement = document.querySelector('.stat-card[data-stat="matches"] .stat-number, .matches-count');
    if (matchesCountElement) {
        matchesCountElement.textContent = count;
    }
}

// Update earnings display for carriers
function updateEarningsDisplay(amount) {
    const earningsElement = document.querySelector('.stat-card[data-stat="earnings"] .stat-number, .earnings-amount');
    if (earningsElement) {
        earningsElement.textContent = `${amount.toFixed(2)} ريال`;
    }
}

// Update spent display for shippers
function updateSpentDisplay(amount) {
    const spentElement = document.querySelector('.stat-card[data-stat="spent"] .stat-number, .spent-amount');
    if (spentElement) {
        spentElement.textContent = `${amount.toFixed(2)} ريال`;
    }
}

// Update active trips display
function updateActiveTripsDisplay(trips) {
    const tripsContainer = document.querySelector('.trips-list, .active-trips');
    if (!tripsContainer) return;
    
    const currentLang = document.documentElement.lang || 'ar';
    
    if (trips.length === 0) {
        tripsContainer.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px; color: var(--gray);">
                <i class="fas fa-truck" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                <p>${currentLang === 'ar' ? 'لا توجد رحلات نشطة حالياً' : 'No active trips at the moment'}</p>
            </div>
        `;
        return;
    }
    
    tripsContainer.innerHTML = trips.map(trip => `
        <div class="trip-card" data-trip-id="${trip.id}">
            <div class="trip-header">
                <h4>${trip.from_city} → ${trip.to_city}</h4>
                <span class="status-badge status-${trip.status}">${getStatusText(trip.status, currentLang)}</span>
            </div>
            <div class="trip-details">
                <div class="detail-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(trip.trip_date)}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-weight"></i>
                    <span>${trip.available_weight} ${currentLang === 'ar' ? 'كجم' : 'kg'}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-money-bill"></i>
                    <span>${trip.price_per_kg} ${currentLang === 'ar' ? 'ريال/كجم' : 'SAR/kg'}</span>
                </div>
            </div>
            <div class="trip-actions">
                <button class="btn btn-primary btn-sm" onclick="viewTripDetails('${trip.id}')">
                    ${currentLang === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                </button>
            </div>
        </div>
    `).join('');
}

// Update active shipments display
function updateActiveShipmentsDisplay(shipments) {
    const shipmentsContainer = document.querySelector('.shipments-list, .active-shipments');
    if (!shipmentsContainer) return;
    
    const currentLang = document.documentElement.lang || 'ar';
    
    if (shipments.length === 0) {
        shipmentsContainer.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px; color: var(--gray);">
                <i class="fas fa-box" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                <p>${currentLang === 'ar' ? 'لا توجد شحنات نشطة حالياً' : 'No active shipments at the moment'}</p>
            </div>
        `;
        return;
    }
    
    shipmentsContainer.innerHTML = shipments.map(shipment => `
        <div class="shipment-card" data-shipment-id="${shipment.id}">
            <div class="shipment-header">
                <h4>${shipment.from_city} → ${shipment.to_city}</h4>
                <span class="status-badge status-${shipment.status}">${getStatusText(shipment.status, currentLang)}</span>
            </div>
            <div class="shipment-details">
                <div class="detail-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(shipment.needed_date)}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-weight"></i>
                    <span>${shipment.weight} ${currentLang === 'ar' ? 'كجم' : 'kg'}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-money-bill"></i>
                    <span>${shipment.price_offer} ${currentLang === 'ar' ? 'ريال' : 'SAR'}</span>
                </div>
            </div>
            <p class="shipment-description">${shipment.item_description || ''}</p>
            <div class="shipment-actions">
                <button class="btn btn-primary btn-sm" onclick="viewShipmentDetails('${shipment.id}')">
                    ${currentLang === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                </button>
            </div>
        </div>
    `).join('');
}

// Update matches display
function updateMatchesDisplay(matches) {
    const matchesContainer = document.querySelector('.matches-list, .recent-matches');
    if (!matchesContainer) return;
    
    const currentLang = document.documentElement.lang || 'ar';
    
    if (matches.length === 0) {
        matchesContainer.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px; color: var(--gray);">
                <i class="fas fa-handshake" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                <p>${currentLang === 'ar' ? 'لا توجد مطابقات حالياً' : 'No matches at the moment'}</p>
            </div>
        `;
        return;
    }
    
    matchesContainer.innerHTML = matches.map(match => {
        const shipment = match.shipments;
        const shipper = shipment?.users;
        
        return `
            <div class="match-card" data-match-id="${match.id}">
                <div class="match-header">
                    <h4>${shipment.from_city} → ${shipment.to_city}</h4>
                    <span class="status-badge status-${match.status}">${getStatusText(match.status, currentLang)}</span>
                </div>
                <div class="match-details">
                    <div class="detail-item">
                        <i class="fas fa-user"></i>
                        <span>${shipper?.name || currentLang === 'ar' ? 'غير محدد' : 'Unknown'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-weight"></i>
                        <span>${shipment.weight} ${currentLang === 'ar' ? 'كجم' : 'kg'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-money-bill"></i>
                        <span>${shipment.price_offer} ${currentLang === 'ar' ? 'ريال' : 'SAR'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(shipment.needed_date)}</span>
                    </div>
                </div>
                <p class="match-description">${shipment.item_description || ''}</p>
                ${match.status === 'pending' ? `
                    <div class="match-actions">
                        <button class="btn btn-primary btn-sm" onclick="acceptMatch('${match.id}')">
                            ${currentLang === 'ar' ? 'قبول' : 'Accept'}
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="rejectMatch('${match.id}')">
                            ${currentLang === 'ar' ? 'رفض' : 'Reject'}
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="chatWithShipper('${shipper?.id}')">
                            <i class="fas fa-comment"></i> ${currentLang === 'ar' ? 'محادثة' : 'Chat'}
                        </button>
                    </div>
                ` : `
                    <div class="match-actions">
                        <button class="btn btn-outline btn-sm" onclick="chatWithShipper('${shipper?.id}')">
                            <i class="fas fa-comment"></i> ${currentLang === 'ar' ? 'محادثة' : 'Chat'}
                        </button>
                    </div>
                `}
            </div>
        `;
    }).join('');
}

// Update shipper matches display
function updateShipperMatchesDisplay(matches) {
    const matchesContainer = document.querySelector('.matches-list, .recent-matches');
    if (!matchesContainer) return;
    
    const currentLang = document.documentElement.lang || 'ar';
    
    if (matches.length === 0) {
        matchesContainer.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px; color: var(--gray);">
                <i class="fas fa-handshake" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                <p>${currentLang === 'ar' ? 'لا توجد مطابقات حالياً' : 'No matches at the moment'}</p>
            </div>
        `;
        return;
    }
    
    matchesContainer.innerHTML = matches.map(match => {
        const trip = match.trips;
        const carrier = trip?.users;
        
        return `
            <div class="match-card" data-match-id="${match.id}">
                <div class="match-header">
                    <h4>${trip.from_city} → ${trip.to_city}</h4>
                    <span class="status-badge status-${match.status}">${getStatusText(match.status, currentLang)}</span>
                </div>
                <div class="match-details">
                    <div class="detail-item">
                        <i class="fas fa-user"></i>
                        <span>${carrier?.name || currentLang === 'ar' ? 'غير محدد' : 'Unknown'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-weight"></i>
                        <span>${trip.available_weight} ${currentLang === 'ar' ? 'كجم' : 'kg'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-money-bill"></i>
                        <span>${trip.price_per_kg} ${currentLang === 'ar' ? 'ريال/كجم' : 'SAR/kg'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(trip.trip_date)}</span>
                    </div>
                </div>
                <div class="match-actions">
                    <button class="btn btn-outline btn-sm" onclick="chatWithCarrier('${carrier?.id}')">
                        <i class="fas fa-comment"></i> ${currentLang === 'ar' ? 'محادثة' : 'Chat'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Helper functions
function getStatusText(status, lang) {
    const statusTexts = {
        ar: {
            'available': 'متاحة',
            'pending': 'قيد الانتظار',
            'accepted': 'مقبولة',
            'in_progress': 'قيد التنفيذ',
            'completed': 'مكتملة',
            'cancelled': 'ملغاة'
        },
        en: {
            'available': 'Available',
            'pending': 'Pending',
            'accepted': 'Accepted',
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        }
    };
    
    return statusTexts[lang][status] || status;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const currentLang = document.documentElement.lang || 'ar';
    
    if (currentLang === 'ar') {
        return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Action functions
function viewTripDetails(tripId) {
    window.location.href = `trip-details.html?id=${tripId}`;
}

function viewShipmentDetails(shipmentId) {
    window.location.href = `shipment-details.html?id=${shipmentId}`;
}

async function acceptMatch(matchId) {
    const currentLang = document.documentElement.lang || 'ar';
    
    if (!confirm(currentLang === 'ar' ? 'هل تريد قبول هذه المطابقة؟' : 'Do you want to accept this match?')) {
        return;
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('matches')
            .update({ status: 'accepted', accepted_at: new Date().toISOString() })
            .eq('id', matchId);
        
        if (error) throw error;
        
        showAlert('success', 
            currentLang === 'ar' ? 'تم قبول المطابقة بنجاح' : 'Match accepted successfully',
            currentLang === 'ar' ? 'تم قبول المطابقة بنجاح' : 'Match accepted successfully'
        );
        
        // Reload dashboard data
        setTimeout(() => loadDashboardData(), 1000);
    } catch (error) {
        console.error('Error accepting match:', error);
        showAlert('error',
            currentLang === 'ar' ? 'فشل قبول المطابقة' : 'Failed to accept match',
            currentLang === 'ar' ? 'فشل قبول المطابقة' : 'Failed to accept match'
        );
    }
}

async function rejectMatch(matchId) {
    const currentLang = document.documentElement.lang || 'ar';
    
    if (!confirm(currentLang === 'ar' ? 'هل تريد رفض هذه المطابقة؟' : 'Do you want to reject this match?')) {
        return;
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('matches')
            .update({ status: 'rejected', rejected_at: new Date().toISOString() })
            .eq('id', matchId);
        
        if (error) throw error;
        
        showAlert('success',
            currentLang === 'ar' ? 'تم رفض المطابقة' : 'Match rejected',
            currentLang === 'ar' ? 'تم رفض المطابقة' : 'Match rejected'
        );
        
        // Reload dashboard data
        setTimeout(() => loadDashboardData(), 1000);
    } catch (error) {
        console.error('Error rejecting match:', error);
        showAlert('error',
            currentLang === 'ar' ? 'فشل رفض المطابقة' : 'Failed to reject match',
            currentLang === 'ar' ? 'فشل رفض المطابقة' : 'Failed to reject match'
        );
    }
}

function chatWithShipper(shipperId) {
    window.location.href = `../messaging/chat.html?user=${shipperId}`;
}

function chatWithCarrier(carrierId) {
    window.location.href = `../messaging/chat.html?user=${carrierId}`;
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
