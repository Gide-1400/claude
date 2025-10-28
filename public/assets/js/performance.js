// Performance optimization for Vercel deployment
// This file helps improve loading speed and user experience

document.addEventListener('DOMContentLoaded', function() {
    // Initialize performance optimizations
    initPerformanceOptimizations();
});

function initPerformanceOptimizations() {
    // Preload critical resources
    preloadCriticalResources();
    
    // Optimize images loading
    optimizeImageLoading();
    
    // Initialize service worker for caching
    initServiceWorker();
    
    // Optimize font loading
    optimizeFonts();
}

function preloadCriticalResources() {
    const criticalResources = [
        '/assets/css/style.css',
        '/assets/css/responsive.css',
        '/config/supabase-config.js'
    ];
    
    criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        link.as = resource.endsWith('.css') ? 'style' : 'script';
        document.head.appendChild(link);
    });
}

function optimizeImageLoading() {
    // Lazy loading for images
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for older browsers
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    }
}

function initServiceWorker() {
    // Register service worker for caching
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
}

function optimizeFonts() {
    // Font display optimization
    if (document.fonts) {
        document.fonts.ready.then(() => {
            document.body.classList.add('fonts-loaded');
        });
    }
}

// Connection quality optimization
function initConnectionOptimization() {
    if ('connection' in navigator) {
        const connection = navigator.connection;
        
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            // Reduce quality for slow connections
            document.body.classList.add('slow-connection');
        }
        
        if (connection.saveData) {
            // Data saver mode
            document.body.classList.add('save-data');
        }
    }
}

// Initialize on load
initConnectionOptimization();