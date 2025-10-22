// Helper utilities for Fast Shipment Platform

class HelperUtils {
    // Format date
    static formatDate(date, format = 'short') {
        const dateObj = new Date(date);
        
        if (format === 'short') {
            return dateObj.toLocaleDateString('ar-SA');
        } else if (format === 'long') {
            return dateObj.toLocaleDateString('ar-SA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else if (format === 'relative') {
            return this.getRelativeTime(dateObj);
        }
        
        return dateObj.toISOString().split('T')[0];
    }

    // Get relative time
    static getRelativeTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'اليوم';
        if (diffDays === 1) return 'أمس';
        if (diffDays < 7) return `قبل ${diffDays} أيام`;
        if (diffDays < 30) return `قبل ${Math.floor(diffDays / 7)} أسابيع`;
        if (diffDays < 365) return `قبل ${Math.floor(diffDays / 30)} أشهر`;
        return `قبل ${Math.floor(diffDays / 365)} سنوات`;
    }

    // Format currency
    static formatCurrency(amount, currency = 'SAR') {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    // Format weight
    static formatWeight(weight, unit = 'kg') {
        if (unit === 'tons' && weight >= 1000) {
            return `${(weight / 1000).toFixed(1)} طن`;
        }
        return `${weight} ${unit === 'tons' ? 'كجم' : 'كجم'}`;
    }

    // Calculate match score
    static calculateMatchScore(trip, shipment) {
        let score = 0;

        // Route match (40%)
        if (trip.fromCity === shipment.fromCity && trip.toCity === shipment.toCity) {
            score += 40;
        } else if (trip.fromCountry === shipment.fromCountry && trip.toCountry === shipment.toCountry) {
            score += 20;
        }

        // Date match (30%)
        const tripDate = new Date(trip.tripDate);
        const shipmentDate = new Date(shipment.neededDate);
        const dateDiff = Math.abs(tripDate - shipmentDate) / (1000 * 60 * 60 * 24);

        if (dateDiff === 0) score += 30;
        else if (dateDiff <= 3) score += 20;
        else if (dateDiff <= 7) score += 10;

        // Weight match (20%)
        const weightRatio = Math.min(shipment.weight / trip.availableWeight, 1);
        score += weightRatio * 20;

        // Price match (10%)
        if (trip.price && shipment.maxPrice && trip.price <= shipment.maxPrice) {
            score += 10;
        }

        return Math.min(Math.round(score), 100);
    }

    // Generate unique ID
    static generateId(prefix = '') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `${prefix}${timestamp}${random}`.toUpperCase();
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Deep clone object
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // Get distance between two points (Haversine formula)
    static getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c;
    }

    static deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    // Format phone number
    static formatPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.startsWith('966')) {
            return `+${cleaned}`;
        } else if (cleaned.startsWith('0')) {
            return `+966${cleaned.substr(1)}`;
        } else if (cleaned.length === 9) {
            return `+966${cleaned}`;
        }
        
        return `+${cleaned}`;
    }

    // Validate and parse JSON
    static safeJsonParse(str) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return null;
        }
    }

    // Capitalize first letter
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Generate random color
    static generateColor() {
        return '#' + Math.floor(Math.random()*16777215).toString(16);
    }

    // Check if element is in viewport
    static isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Scroll to element smoothly
    static scrollToElement(element, offset = 0) {
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    // Copy to clipboard
    static copyToClipboard(text) {
        return new Promise((resolve, reject) => {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(resolve).catch(reject);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    resolve();
                } catch (err) {
                    reject(err);
                }
                document.body.removeChild(textArea);
            }
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HelperUtils;
} else {
    window.HelperUtils = HelperUtils;
}