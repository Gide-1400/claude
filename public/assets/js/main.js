// Main JavaScript for Fast Shipment Platform

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize the application
    await initApp();
});

async function initApp() {
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize service buttons
    initServiceButtons();
    
    // Initialize smooth scrolling
    initSmoothScrolling();
    
    // Initialize language switcher
    initLanguageSwitcher();
    
    // Initialize Supabase client FIRST and WAIT for it
    await initSupabase();
    
    // Initialize global city search AFTER Supabase is ready
    initGlobalFeatures();
}

// Mobile Menu Functionality
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeMenu = document.querySelector('.close-menu');
    
    if (mobileMenuBtn && mobileMenu && closeMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        closeMenu.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        // Close menu when clicking on links
        const mobileMenuLinks = mobileMenu.querySelectorAll('a');
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
}

// Service Buttons Functionality
function initServiceButtons() {
    const carrierBtn = document.getElementById('carrierBtn');
    const shipperBtn = document.getElementById('shipperBtn');
    const serviceBtns = document.querySelectorAll('.service-btn');
    const verificationBtn = document.getElementById('verificationBtn');
    
    // Carrier button click
    if (carrierBtn) {
        carrierBtn.addEventListener('click', function() {
            window.location.href = 'pages/auth/register.html?type=carrier';
        });
    }
    
    // Shipper button click
    if (shipperBtn) {
        shipperBtn.addEventListener('click', function() {
            window.location.href = 'pages/auth/register.html?type=shipper';
        });
    }
    
    // Service detail buttons
    serviceBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const serviceType = this.getAttribute('data-service');
            showServiceDetails(serviceType);
        });
    });
    
    // Verification button
    if (verificationBtn) {
        verificationBtn.addEventListener('click', function() {
            window.location.href = 'pages/auth/verification.html';
        });
    }
}

// Show service details modal
function showServiceDetails(serviceType) {
    const serviceTitles = {
        'individual': { ar: 'المسافرون المستقلون', en: 'Individual Travelers' },
        'car': { ar: 'أصحاب السيارات', en: 'Car Owners' },
        'truck': { ar: 'أصحاب الشاحنات', en: 'Truck Owners' },
        'fleet': { ar: 'أساطيل الشحن', en: 'Shipping Fleets' }
    };
    
    const serviceDescriptions = {
        'individual': {
            ar: 'هذه الخدمة مخصصة للمسافرين الأفراد الذين يستخدمون وسائل النقل العام مثل الطائرات والقطارات والحافلات. يمكنهم الاستفادة من المساحة الفارغة في أمتعتهم لنقل شحنات صغيرة تصل إلى 20 كجم.',
            en: 'This service is for individual travelers using public transportation like planes, trains, and buses. They can utilize empty space in their luggage to transport small shipments up to 20kg.'
        },
        'car': {
            ar: 'لأصحاب السيارات الخاصة الذين يقومون برحلات بين المدن. يمكنهم الاستفادة من المساحة الفارغة في سياراتهم لنقل شحنات تصل إلى 1500 كجم مع التحكم الكامل في مسار الرحلة.',
            en: 'For private car owners traveling between cities. They can utilize empty space in their cars to transport shipments up to 1500kg with full control over the route.'
        },
        'truck': {
            ar: 'لأصحاب الشاحنات الذين ينقلون البضائع بين المدن. يمكنهم الاستفادة من المساحة الفارغة في شاحناتهم لنقل شحنات إضافية تصل إلى 50 طن مع توفير في تكاليف الوقود.',
            en: 'For truck owners transporting goods between cities. They can utilize empty space in their trucks to transport additional shipments up to 50 tons while saving on fuel costs.'
        },
        'fleet': {
            ar: 'للشركات وأساطيل النقل الكبيرة التي تمتلك أساطيل من الشاحنات أو السفن أو الطائرات. يمكنهم تحسين استخدام سعاتهم وزيادة الإيرادات من خلال نقل شحنات إضافية.',
            en: 'For companies and large transport fleets with trucks, ships, or planes. They can optimize their capacity usage and increase revenue by transporting additional shipments.'
        }
    };
    
    const currentLang = document.documentElement.lang || 'ar';
    const title = serviceTitles[serviceType][currentLang];
    const description = serviceDescriptions[serviceType][currentLang];
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'service-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; width: 100%; position: relative;">
            <button class="close-modal" style="position: absolute; top: 15px; left: 15px; background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
            <h3 style="margin-bottom: 15px; color: var(--dark);">${title}</h3>
            <p style="color: var(--gray); margin-bottom: 25px;">${description}</p>
            <button class="btn btn-primary" onclick="window.location.href='pages/auth/register.html?type=carrier&service=${serviceType}'">
                ${currentLang === 'ar' ? 'إنشاء حساب' : 'Create Account'}
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Close modal functionality
    const closeModal = modal.querySelector('.close-modal');
    closeModal.addEventListener('click', function() {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
            document.body.style.overflow = '';
        }
    });
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                const mobileMenu = document.querySelector('.mobile-menu');
                if(mobileMenu && mobileMenu.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        });
    });
}

// Initialize Supabase client
async function initSupabase() {
    try {
        // Wait for supabase config to be ready
        if (window.supabaseConfigReady) {
            console.log('⏳ Waiting for Supabase config...');
            await window.supabaseConfigReady;
            console.log('✅ Supabase config ready!');
        }
        
        // Give it a moment to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Supabase is already initialized in supabase-config.js
        // Just check if it exists
        if (typeof window.supabaseClient === 'undefined') {
            console.warn('⚠️ Supabase client not found after config load. Will retry...');
            
            // Retry after a short delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (typeof window.supabaseClient === 'undefined') {
                console.error('❌ Supabase client is still not initialized after retry.');
                return false;
            }
        }
        
        console.log('✅ Supabase client ready and available');
        return true;
    } catch (error) {
        console.error('❌ Error initializing Supabase:', error);
        return false;
    }
}

// Utility function to get URL parameters
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Initialize global features like city search and carrier type handlers
function initGlobalFeatures() {
    // Handle carrier type buttons
    initCarrierTypeButtons();
    
    // Handle city selection events
    initCitySelectionHandlers();
    
    // Initialize global statistics
    updateGlobalStatistics();
}

function initCarrierTypeButtons() {
    const carrierBtn = document.getElementById('carrierBtn');
    const shipperBtn = document.getElementById('shipperBtn');
    
    if (carrierBtn) {
        carrierBtn.addEventListener('click', () => {
            showCarrierTypeSelection();
        });
    }
    
    if (shipperBtn) {
        shipperBtn.addEventListener('click', () => {
            window.location.href = 'pages/shipper/add-shipment.html';
        });
    }
}

function showCarrierTypeSelection() {
    const modal = document.createElement('div');
    modal.className = 'carrier-type-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeCarrierTypeModal()"></div>
        <div class="modal-content">
            <button class="close-btn" onclick="closeCarrierTypeModal()">
                <i class="fas fa-times"></i>
            </button>
            <h3 data-lang="ar">اختر نوع وسيلة النقل</h3>
            <h3 data-lang="en" style="display: none;">Choose Your Transport Type</h3>
            
            <div class="transport-types">
                <div class="transport-option" onclick="selectTransportType('individual')">
                    <i class="fas fa-user"></i>
                    <span data-lang="ar">مسافر فردي</span>
                    <span data-lang="en" style="display: none;">Individual Traveler</span>
                    <small data-lang="ar">طائرة، قطار، حافلة (حتى 20 كيلو)</small>
                    <small data-lang="en" style="display: none;">Plane, Train, Bus (up to 20kg)</small>
                </div>
                
                <div class="transport-option" onclick="selectTransportType('car')">
                    <i class="fas fa-car"></i>
                    <span data-lang="ar">صاحب سيارة</span>
                    <span data-lang="en" style="display: none;">Car Owner</span>
                    <small data-lang="ar">سيارة، بيك أب (حتى 1.5 طن)</small>
                    <small data-lang="en" style="display: none;">Car, Pickup (up to 1.5 tons)</small>
                </div>
                
                <div class="transport-option" onclick="selectTransportType('truck')">
                    <i class="fas fa-truck"></i>
                    <span data-lang="ar">صاحب شاحنة</span>
                    <span data-lang="en" style="display: none;">Truck Owner</span>
                    <small data-lang="ar">دينة، شاحنة (حتى 50 طن)</small>
                    <small data-lang="en" style="display: none;">Small/Large Truck (up to 50 tons)</small>
                </div>
                
                <div class="transport-option" onclick="selectTransportType('fleet')">
                    <i class="fas fa-building"></i>
                    <span data-lang="ar">شركة أسطول</span>
                    <span data-lang="en" style="display: none;">Fleet Company</span>
                    <small data-lang="ar">أساطيل، سفن (حتى 1000 طن)</small>
                    <small data-lang="en" style="display: none;">Fleets, Ships (up to 1000 tons)</small>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 100);
}

function closeCarrierTypeModal() {
    const modal = document.querySelector('.carrier-type-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

function selectTransportType(type) {
    closeCarrierTypeModal();
    
    // Store transport type in session
    sessionStorage.setItem('selectedTransportType', type);
    
    // Redirect to add trip page
    window.location.href = `pages/carrier/add-trip.html?type=${type}`;
}

function initCitySelectionHandlers() {
    // Listen for city selection events
    document.addEventListener('citySelected', (event) => {
        const cityData = event.detail;
        console.log('City selected:', cityData);
        
        // Store in session for use in forms
        sessionStorage.setItem('selectedCity', JSON.stringify(cityData));
        
        // Update UI to show selection
        showCitySelectionConfirmation(cityData);
    });
}

function showCitySelectionConfirmation(cityData) {
    const currentLang = window.currentLanguage || 'ar';
    const cityName = currentLang === 'ar' ? cityData.name : cityData.name_en;
    const countryName = currentLang === 'ar' ? cityData.country_ar : cityData.country;
    
    // Create confirmation toast
    const toast = document.createElement('div');
    toast.className = 'city-selection-toast';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${currentLang === 'ar' ? 'تم اختيار' : 'Selected'}: ${cityName}, ${countryName}</span>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('active'), 100);
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateGlobalStatistics() {
    // Simulated global statistics
    const stats = {
        totalUsers: 15420,
        activeRoutes: 2847,
        countriesServed: 85,
        successfulDeliveries: 8964
    };
    
    // Update stats if elements exist
    const elements = {
        totalUsers: document.getElementById('totalUsers'),
        activeRoutes: document.getElementById('activeRoutes'),
        countriesServed: document.getElementById('countriesServed'),
        successfulDeliveries: document.getElementById('successfulDeliveries')
    };
    
    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            animateNumber(elements[key], stats[key]);
        }
    });
}

function animateNumber(element, target) {
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 20);
}

// Export functions for use in other modules
window.initApp = initApp;
window.showServiceDetails = showServiceDetails;
window.closeCarrierTypeModal = closeCarrierTypeModal;
window.selectTransportType = selectTransportType;

