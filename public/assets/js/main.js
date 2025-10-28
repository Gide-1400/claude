// Main JavaScript for Fast Shipment Platform

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();
});

function initApp() {
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize service buttons
    initServiceButtons();
    
    // Initialize smooth scrolling
    initSmoothScrolling();
    
    // Initialize language switcher
    initLanguageSwitcher();
    
    // Initialize Supabase client
    initSupabase();
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
function initSupabase() {
    // Supabase is already initialized in supabase-config.js
    // Just check if it exists
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase client is not initialized. Make sure supabase-config.js is loaded.');
    } else {
        console.log('Supabase client already initialized');
    }
}

// Utility function to get URL parameters
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Export functions for use in other modules
window.initApp = initApp;
window.showServiceDetails = showServiceDetails;

