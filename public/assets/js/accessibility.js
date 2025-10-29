/**
 * Accessibility Enhancement Script
 * Updates button labels and descriptions based on current language
 */

// Function to update accessibility attributes based on language
function updateAccessibilityLabels() {
    const currentLang = document.documentElement.lang || 'ar';
    
    // Update all buttons with data attributes
    const buttons = document.querySelectorAll('button[data-title-ar], button[data-aria-ar]');
    
    buttons.forEach(button => {
        // Update title attribute
        if (button.hasAttribute('data-title-ar') && button.hasAttribute('data-title-en')) {
            const title = currentLang === 'ar' ? 
                button.getAttribute('data-title-ar') : 
                button.getAttribute('data-title-en');
            button.setAttribute('title', title);
        }
        
        // Update aria-label attribute
        if (button.hasAttribute('data-aria-ar') && button.hasAttribute('data-aria-en')) {
            const ariaLabel = currentLang === 'ar' ? 
                button.getAttribute('data-aria-ar') : 
                button.getAttribute('data-aria-en');
            button.setAttribute('aria-label', ariaLabel);
        }
    });
}

// Function to ensure all interactive elements have proper labels
function validateAccessibility() {
    // Check buttons without text content
    const buttonsWithoutText = document.querySelectorAll('button:not([aria-label]):not([title])');
    
    buttonsWithoutText.forEach(button => {
        // Skip buttons that have visible text content
        if (button.textContent.trim()) return;
        
        // Check if button has icon and suggest label
        const icon = button.querySelector('i[class*="fa-"]');
        if (icon) {
            console.warn('Button with icon needs accessibility label:', button);
            
            // Try to infer purpose from class names or onclick
            let suggestedLabel = '';
            
            if (icon.classList.contains('fa-bars')) {
                suggestedLabel = 'فتح القائمة';
            } else if (icon.classList.contains('fa-times')) {
                suggestedLabel = 'إغلاق';
            } else if (icon.classList.contains('fa-plus')) {
                suggestedLabel = 'إضافة';
            } else if (icon.classList.contains('fa-eye')) {
                suggestedLabel = 'إظهار';
            } else if (icon.classList.contains('fa-eye-slash')) {
                suggestedLabel = 'إخفاء';
            }
            
            if (suggestedLabel) {
                console.log(`Suggested label for button: ${suggestedLabel}`);
            }
        }
    });
}

// Function to add keyboard navigation support
function enhanceKeyboardNavigation() {
    // Add keyboard support for custom interactive elements
    const interactiveElements = document.querySelectorAll('[onclick]:not(button):not(a)');
    
    interactiveElements.forEach(element => {
        // Make element focusable
        if (!element.hasAttribute('tabindex')) {
            element.setAttribute('tabindex', '0');
        }
        
        // Add keyboard event listener
        element.addEventListener('keydown', function(e) {
            // Activate on Enter or Space
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
        
        // Add role if not present
        if (!element.hasAttribute('role')) {
            element.setAttribute('role', 'button');
        }
    });
}

// Function to improve form accessibility
function enhanceFormAccessibility() {
    // Ensure all form inputs have proper labels
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        const id = input.id;
        if (id) {
            // Check for associated label
            let label = document.querySelector(`label[for="${id}"]`);
            
            if (!label && !input.hasAttribute('aria-label') && !input.hasAttribute('aria-labelledby')) {
                // Try to find label by proximity
                const parentFormGroup = input.closest('.form-group, .input-group, .field');
                if (parentFormGroup) {
                    label = parentFormGroup.querySelector('label');
                    if (label && !label.hasAttribute('for')) {
                        label.setAttribute('for', id);
                    }
                }
            }
        }
        
        // Add required indicator for screen readers
        if (input.hasAttribute('required') && !input.hasAttribute('aria-required')) {
            input.setAttribute('aria-required', 'true');
        }
    });
}

// Initialize accessibility enhancements
function initAccessibility() {
    // Update labels on page load
    updateAccessibilityLabels();
    
    // Enhance keyboard navigation
    enhanceKeyboardNavigation();
    
    // Improve form accessibility
    enhanceFormAccessibility();
    
    // Validate accessibility in development mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        validateAccessibility();
    }
    
    // Listen for language changes
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
                updateAccessibilityLabels();
            }
        });
    });
    
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['lang']
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccessibility);
} else {
    initAccessibility();
}

// Debug logging
console.log('Accessibility script loaded successfully at:', new Date());

// Export functions for manual use
window.AccessibilityUtils = {
    updateLabels: updateAccessibilityLabels,
    validate: validateAccessibility,
    enhance: initAccessibility
};